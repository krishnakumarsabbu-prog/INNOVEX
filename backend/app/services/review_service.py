from app.core.security import generate_id, utc_now
from app.core.exceptions import NotFoundError, ValidationError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import (
    Review, ReviewDimension, Activity, Notification, AuditEvent,
    ValidationSprint,
)
from app.domain.enums.types import (
    IdeaStatus, ReviewDecision, ValidationStatus, AuditEventType,
)
from app.schemas.models import (
    ReviewCreate, ReviewDecisionRequest,
)


REVIEW_DIMENSIONS = [
    "business_value",
    "technical_feasibility",
    "innovation",
    "reusability",
    "complexity",
    "security_considerations",
    "dependencies",
]

DECISIONS_REQUIRING_REASON = {ReviewDecision.PARK.value, ReviewDecision.REJECT.value}


class ReviewService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    # ---- Queue ----

    def get_queue(self) -> list[dict]:
        ideas = self._repos.idea.get_all()
        queue_items = []
        for idea in ideas:
            if idea.status in (IdeaStatus.SUBMITTED.value, IdeaStatus.UNDER_REVIEW.value):
                founder = self._repos.user.get_by_id(idea.founder_id) if idea.founder_id else None
                assignments = self._repos.review_assignment.get_by_idea(idea.id)
                reviewer = None
                if assignments:
                    reviewer = self._repos.user.get_by_id(assignments[0].reviewer_id)
                reviews = self._repos.review.get_by_idea(idea.id)
                queue_items.append({
                    "idea_id": idea.id,
                    "title": idea.title,
                    "founder_id": idea.founder_id,
                    "founder_name": founder.name if founder else "",
                    "business_area": idea.business_area,
                    "technologies": idea.technologies,
                    "status": idea.status,
                    "submitted_at": idea.created_at,
                    "assigned_reviewer_id": assignments[0].reviewer_id if assignments else None,
                    "assigned_reviewer_name": reviewer.name if reviewer else "",
                    "review_count": len(reviews),
                })
        queue_items.sort(key=lambda x: x["submitted_at"], reverse=True)
        return queue_items

    # ---- Create review ----

    def create_review(self, idea_id: str, data: ReviewCreate) -> dict:
        idea = self._repos.idea.get_by_id(idea_id)
        if not idea:
            raise NotFoundError("Idea not found")
        reviewer = self._repos.user.get_by_id(data.reviewer_id)
        if not reviewer:
            raise NotFoundError("Reviewer not found")

        if data.decision in DECISIONS_REQUIRING_REASON and not data.reason:
            raise ValidationError(f"A reason is required for '{data.decision}' decisions")

        now = utc_now()
        review = Review(
            id=generate_id(),
            idea_id=idea_id,
            reviewer_id=data.reviewer_id,
            decision=data.decision,
            comments=data.comments,
            reason=data.reason,
            evidence=data.evidence,
            created_at=now,
            updated_at=now,
        )
        self._repos.review.create(review)

        for dim_data in data.dimensions:
            self._repos.review_dimension.create(ReviewDimension(
                id=generate_id(),
                review_id=review.id,
                dimension=dim_data.dimension,
                rating=dim_data.rating,
                comment=dim_data.comment,
                created_at=now,
            ))

        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type="review", entity_id=review.id,
            action=AuditEventType.REVIEW_STARTED.value, user_id=data.reviewer_id,
            details=f"Review started for idea '{idea.title}'", created_at=now,
        ))

        self._apply_decision(idea, data.decision, data.reviewer_id, data.reason, now)
        self._log_side_effects(idea, review, data.decision, data.reviewer_id, data.reason, now)

        return self._review_to_dict(review)

    # ---- Decision on existing review ----

    def make_decision(self, idea_id: str, review_id: str, data: ReviewDecisionRequest) -> dict:
        idea = self._repos.idea.get_by_id(idea_id)
        if not idea:
            raise NotFoundError("Idea not found")
        review = self._repos.review.get_by_id(review_id)
        if not review or review.idea_id != idea_id:
            raise NotFoundError("Review not found for this idea")
        reviewer = self._repos.user.get_by_id(data.reviewer_id)
        if not reviewer:
            raise NotFoundError("Reviewer not found")

        if data.decision in DECISIONS_REQUIRING_REASON and not data.reason:
            raise ValidationError(f"A reason is required for '{data.decision}' decisions")

        now = utc_now()
        self._repos.review.update(review_id,
            decision=data.decision, comments=data.comments,
            reason=data.reason, evidence=data.evidence, updated_at=now)
        review.decision = data.decision
        review.comments = data.comments
        review.reason = data.reason
        review.evidence = data.evidence
        review.updated_at = now

        if data.dimensions:
            self._repos.review_dimension.delete_by_review(review_id)
            for dim_data in data.dimensions:
                self._repos.review_dimension.create(ReviewDimension(
                    id=generate_id(),
                    review_id=review_id,
                    dimension=dim_data.dimension,
                    rating=dim_data.rating,
                    comment=dim_data.comment,
                    created_at=now,
                ))

        self._apply_decision(idea, data.decision, data.reviewer_id, data.reason, now)

        if data.decision == ReviewDecision.SEND_TO_VALIDATION.value:
            self._assign_validation(idea, data, now)

        self._log_side_effects(idea, review, data.decision, data.reviewer_id, data.reason, now)

        return self._review_to_dict(review, include_dimensions=bool(data.dimensions))

    # ---- Get reviews for an idea ----

    def get_reviews_by_idea(self, idea_id: str) -> list[dict]:
        idea = self._repos.idea.get_by_id(idea_id)
        if not idea:
            raise NotFoundError("Idea not found")
        reviews = self._repos.review.get_by_idea(idea_id)
        return [self._review_to_dict(r, include_dimensions=True) for r in reviews]

    # ---- Decision application ----

    def _apply_decision(self, idea, decision: str, reviewer_id: str, reason: str, now: str):
        if decision == ReviewDecision.SEND_TO_VALIDATION.value:
            self._repos.idea.update(idea.id, status=IdeaStatus.VALIDATION.value, updated_at=now)
        elif decision == ReviewDecision.APPROVE.value:
            self._repos.idea.update(idea.id, status=IdeaStatus.APPROVED.value, updated_at=now)
        elif decision == ReviewDecision.PARK.value:
            self._repos.idea.update(idea.id, status=IdeaStatus.PARKED.value, updated_at=now)
        elif decision == ReviewDecision.REJECT.value:
            self._repos.idea.update(idea.id, status=IdeaStatus.REJECTED.value, updated_at=now)
        elif decision == ReviewDecision.REQUEST_INFORMATION.value:
            self._repos.idea.update(idea.id, status=IdeaStatus.UNDER_REVIEW.value, updated_at=now)
        elif decision == ReviewDecision.MERGE.value:
            self._repos.idea.update(idea.id, status=IdeaStatus.APPROVED.value, updated_at=now)

    # ---- Validation assignment ----

    def _assign_validation(self, idea, data: ReviewDecisionRequest, now: str):
        existing = self._repos.validation.get_by_idea(idea.id)
        if existing:
            return

        pe_id = data.principal_engineer_id
        mgr_id = data.manager_id

        if pe_id and not self._repos.user.get_by_id(pe_id):
            raise NotFoundError("Principal Engineer not found")
        if mgr_id and not self._repos.user.get_by_id(mgr_id):
            raise NotFoundError("Manager not found")

        sprint = ValidationSprint(
            id=generate_id(),
            idea_id=idea.id,
            principal_engineer_id=pe_id,
            manager_id=mgr_id,
            status=ValidationStatus.IN_PROGRESS.value,
            start_date=now,
            end_date=None,
            objectives="",
            findings="",
            objectives_checklist="[]",
            checklist="[]",
            decision=None,
            decision_reason="",
            created_at=now,
            updated_at=now,
        )
        self._repos.validation.create(sprint)

        founder_id = idea.founder_id
        if founder_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=founder_id,
                message=f"Your idea '{idea.title}' has been sent to validation. A validation sprint has been created.",
                read=False, created_at=now,
            ))

        if pe_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=pe_id,
                message=f"You have been assigned as Principal Engineer for validation of '{idea.title}'",
                read=False, created_at=now,
            ))
        if mgr_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=mgr_id,
                message=f"You have been assigned as Manager for validation of '{idea.title}'",
                read=False, created_at=now,
            ))

    # ---- Side effects ----

    def _log_side_effects(self, idea, review, decision: str, reviewer_id: str, reason: str, now: str):
        desc = f"Review decision: {decision}"
        if reason:
            desc += f" - Reason: {reason}"

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="idea", entity_id=idea.id,
            action="reviewed", description=desc,
            user_id=reviewer_id, created_at=now,
        ))

        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type="review", entity_id=review.id,
            action=AuditEventType.REVIEW_COMPLETED.value, user_id=reviewer_id,
            details=desc, created_at=now,
        ))

        if decision == ReviewDecision.APPROVE.value:
            self._repos.audit.create(AuditEvent(
                id=generate_id(), entity_type="idea", entity_id=idea.id,
                action=AuditEventType.IDEA_APPROVED.value, user_id=reviewer_id,
                details=f"Idea '{idea.title}' approved", created_at=now,
            ))

        notify_users = set()
        if idea.founder_id:
            notify_users.add(idea.founder_id)
        admins = self._repos.user.get_by_role("admin")
        for admin in admins:
            notify_users.add(admin.id)

        for uid in notify_users:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=uid,
                message=f"Idea '{idea.title}' review decision: {decision.replace('_', ' ')}",
                read=False, created_at=now,
            ))

    # ---- Helpers ----

    def _review_to_dict(self, review: Review, include_dimensions: bool = False) -> dict:
        d = {
            "id": review.id, "idea_id": review.idea_id,
            "reviewer_id": review.reviewer_id, "decision": review.decision,
            "comments": review.comments, "reason": review.reason,
            "evidence": review.evidence,
            "created_at": review.created_at, "updated_at": review.updated_at,
        }
        if include_dimensions:
            dims = self._repos.review_dimension.get_by_review(review.id)
            d["dimensions"] = [
                {"id": dm.id, "review_id": dm.review_id, "dimension": dm.dimension,
                 "rating": dm.rating, "comment": dm.comment, "created_at": dm.created_at}
                for dm in dims
            ]
        else:
            d["dimensions"] = []
        return d
