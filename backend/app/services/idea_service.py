from app.core.security import generate_id, utc_now
from app.core.exceptions import NotFoundError, ValidationError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import (
    Idea, Activity, Notification, IdeaTechnology, AuditEvent,
    IdeaEvidence, IdeaFollow, Review,
)
from app.domain.enums.types import IdeaStatus, ReviewDecision, AuditEventType
from app.schemas.models import IdeaCreate, IdeaUpdate, ReviewCreate


class IdeaService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    # ---- CRUD ----

    def create(self, data: IdeaCreate, created_by: str | None = None) -> Idea:
        if not self._repos.user.get_by_id(data.founder_id):
            raise NotFoundError("Founder not found")
        now = utc_now()
        idea = Idea(
            id=generate_id(),
            title=data.title,
            problem_statement=data.problem_statement,
            proposed_solution=data.proposed_solution,
            business_impact=data.business_impact,
            engineering_impact=data.engineering_impact,
            expected_benefits=data.expected_benefits,
            business_area=data.business_area,
            technologies=data.technologies,
            dependencies=data.dependencies,
            risks=data.risks,
            estimated_complexity=data.estimated_complexity,
            estimated_duration=data.estimated_duration,
            founder_id=data.founder_id,
            status=IdeaStatus.DRAFT.value,
            created_at=now,
            updated_at=now,
            created_by=created_by or data.founder_id,
            updated_by=created_by or data.founder_id,
            organization_id=data.organization_id,
        )
        self._repos.idea.create(idea)

        for tech in data.technologies:
            self._repos.idea_technology.create(IdeaTechnology(
                id=generate_id(), idea_id=idea.id, technology=tech, created_at=now,
            ))

        self._log_activity(idea.id, "created", f"Idea '{idea.title}' created", data.founder_id, now)
        self._log_audit(idea.id, AuditEventType.IDEA_CREATED.value, data.founder_id, f"Idea '{idea.title}' created", now)
        return idea

    def get_by_id(self, idea_id: str) -> Idea:
        idea = self._repos.idea.get_by_id(idea_id)
        if not idea:
            raise NotFoundError("Idea not found")
        return idea

    def get_all(self, filters: dict | None = None) -> list[Idea]:
        if not filters:
            return self._repos.idea.get_all()

        ideas = self._repos.idea.get_all()

        search = filters.get("search")
        if search:
            ideas = [i for i in ideas if search.lower() in i.title.lower()
                     or search.lower() in (i.problem_statement or "").lower()
                     or search.lower() in (i.proposed_solution or "").lower()
                     or search.lower() in (i.business_area or "").lower()]

        status = filters.get("status")
        if status:
            ideas = [i for i in ideas if i.status == status]

        technology = filters.get("technology")
        if technology:
            ideas = [i for i in ideas if technology in i.technologies]

        business_area = filters.get("business_area")
        if business_area:
            ideas = [i for i in ideas if i.business_area == business_area]

        founder_id = filters.get("founder_id")
        if founder_id:
            ideas = [i for i in ideas if i.founder_id == founder_id]

        return ideas

    def get_by_founder(self, founder_id: str) -> list[Idea]:
        return self._repos.idea.get_by_founder(founder_id)

    def get_technologies(self, idea_id: str) -> list[str]:
        self.get_by_id(idea_id)
        techs = self._repos.idea_technology.get_by_idea(idea_id)
        return [t.technology for t in techs]

    def update(self, idea_id: str, data: IdeaUpdate, updated_by: str | None = None) -> Idea:
        idea = self.get_by_id(idea_id)
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)

        technologies = update_data.pop("technologies", None)

        for k, v in update_data.items():
            setattr(idea, k, v)
        idea.updated_at = now
        idea.updated_by = updated_by

        kwargs = {**update_data, "updated_at": now, "updated_by": updated_by}
        if technologies is not None:
            idea.technologies = technologies
            kwargs["technologies"] = technologies
        self._repos.idea.update(idea_id, **kwargs)

        if technologies is not None:
            self._repos.idea_technology.delete_by_idea(idea_id)
            for tech in technologies:
                self._repos.idea_technology.create(IdeaTechnology(
                    id=generate_id(), idea_id=idea_id, technology=tech, created_at=now,
                ))

        self._log_activity(idea.id, "updated", f"Idea '{idea.title}' updated", updated_by, now)
        return idea

    def delete(self, idea_id: str) -> bool:
        return self._repos.idea.delete(idea_id)

    # ---- Lifecycle transitions ----

    def submit(self, idea_id: str, user_id: str) -> Idea:
        idea = self.get_by_id(idea_id)
        if idea.status not in (IdeaStatus.DRAFT.value,):
            raise ValidationError(f"Cannot submit idea in '{idea.status}' status")
        now = utc_now()
        self._repos.idea.update(idea_id, status=IdeaStatus.SUBMITTED.value, updated_at=now, updated_by=user_id)
        idea.status = IdeaStatus.SUBMITTED.value

        self._log_activity(idea.id, "submitted", f"Idea '{idea.title}' submitted", user_id, now)
        self._log_audit(idea.id, AuditEventType.IDEA_SUBMITTED.value, user_id, f"Idea '{idea.title}' submitted", now)

        admins = self._repos.user.get_by_role("admin")
        for admin in admins:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=admin.id,
                message=f"New idea submitted: '{idea.title}'",
                read=False, created_at=now,
            ))
        return idea

    def park(self, idea_id: str, user_id: str) -> Idea:
        idea = self.get_by_id(idea_id)
        if idea.status == IdeaStatus.PARKED.value:
            raise ValidationError("Idea is already parked")
        now = utc_now()
        self._repos.idea.update(idea_id, status=IdeaStatus.PARKED.value, updated_at=now, updated_by=user_id)
        idea.status = IdeaStatus.PARKED.value

        self._log_activity(idea.id, "parked", f"Idea '{idea.title}' parked", user_id, now)
        self._log_audit(idea.id, AuditEventType.IDEA_SUBMITTED.value, user_id, f"Idea '{idea.title}' parked", now)
        return idea

    def reopen(self, idea_id: str, user_id: str) -> Idea:
        idea = self.get_by_id(idea_id)
        if idea.status not in (IdeaStatus.PARKED.value, IdeaStatus.REJECTED.value):
            raise ValidationError(f"Cannot reopen idea in '{idea.status}' status")
        now = utc_now()
        self._repos.idea.update(idea_id, status=IdeaStatus.SUBMITTED.value, updated_at=now, updated_by=user_id)
        idea.status = IdeaStatus.SUBMITTED.value

        self._log_activity(idea.id, "reopened", f"Idea '{idea.title}' reopened", user_id, now)
        self._log_audit(idea.id, AuditEventType.IDEA_SUBMITTED.value, user_id, f"Idea '{idea.title}' reopened", now)
        return idea

    # ---- Activity ----

    def get_activity(self, idea_id: str) -> list[Activity]:
        self.get_by_id(idea_id)
        return self._repos.activity.get_by_entity("idea", idea_id)

    # ---- Evidence ----

    def get_evidence(self, idea_id: str) -> list[IdeaEvidence]:
        self.get_by_id(idea_id)
        return self._repos.idea_evidence.get_by_idea(idea_id)

    def create_evidence(self, idea_id: str, data) -> IdeaEvidence:
        self.get_by_id(idea_id)
        if not self._repos.user.get_by_id(data.created_by):
            raise NotFoundError("Creator not found")
        now = utc_now()
        evidence = IdeaEvidence(
            id=generate_id(),
            idea_id=idea_id,
            title=data.title,
            description=data.description,
            evidence_type=data.evidence_type,
            url=data.url,
            created_by=data.created_by,
            created_at=now,
            updated_at=now,
        )
        self._repos.idea_evidence.create(evidence)
        self._log_activity(idea_id, "evidence_added", f"Evidence '{evidence.title}' added to idea", data.created_by, now)
        self._log_audit(idea_id, AuditEventType.EVIDENCE_ADDED.value, data.created_by, f"Evidence '{evidence.title}' added to idea", now)
        return evidence

    # ---- Follow ----

    def follow(self, idea_id: str, user_id: str) -> IdeaFollow:
        self.get_by_id(idea_id)
        if not self._repos.user.get_by_id(user_id):
            raise NotFoundError("User not found")
        existing = self._repos.idea_follow.get_by_idea_and_user(idea_id, user_id)
        if existing:
            return existing
        now = utc_now()
        follow = IdeaFollow(
            id=generate_id(), idea_id=idea_id, user_id=user_id, created_at=now,
        )
        self._repos.idea_follow.create(follow)
        self._log_activity(idea_id, "followed", "User followed idea", user_id, now)
        return follow

    def unfollow(self, idea_id: str, user_id: str) -> bool:
        self.get_by_id(idea_id)
        result = self._repos.idea_follow.unfollow(idea_id, user_id)
        if result:
            now = utc_now()
            self._log_activity(idea_id, "unfollowed", "User unfollowed idea", user_id, now)
        return result

    def get_followers(self, idea_id: str) -> list[IdeaFollow]:
        self.get_by_id(idea_id)
        return self._repos.idea_follow.get_by_idea(idea_id)

    def is_following(self, idea_id: str, user_id: str) -> bool:
        return self._repos.idea_follow.get_by_idea_and_user(idea_id, user_id) is not None

    # ---- Reviews ----

    def create_review(self, data: ReviewCreate) -> dict:
        idea = self.get_by_id(data.idea_id)
        reviewer = self._repos.user.get_by_id(data.reviewer_id)
        if not reviewer:
            raise NotFoundError("Reviewer not found")

        now = utc_now()
        review = Review(
            id=generate_id(),
            idea_id=data.idea_id,
            reviewer_id=data.reviewer_id,
            decision=data.decision,
            comments=data.comments,
            created_at=now,
            updated_at=now,
        )
        self._repos.review.create(review)

        decision = data.decision
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

        self._log_activity(idea.id, "reviewed", f"Review added with decision: {decision}", data.reviewer_id, now)

        self._repos.notification.create(Notification(
            id=generate_id(), user_id=idea.founder_id or "",
            message=f"Your idea '{idea.title}' has been reviewed: {decision}",
            read=False, created_at=now,
        ))

        return {
            "id": review.id, "idea_id": review.idea_id,
            "reviewer_id": review.reviewer_id, "decision": review.decision,
            "comments": review.comments, "created_at": review.created_at,
            "updated_at": review.updated_at,
        }

    def get_reviews(self, idea_id: str) -> list[dict]:
        self.get_by_id(idea_id)
        reviews = self._repos.review.get_by_idea(idea_id)
        return [
            {"id": r.id, "idea_id": r.idea_id, "reviewer_id": r.reviewer_id,
             "decision": r.decision, "comments": r.comments,
             "created_at": r.created_at, "updated_at": r.updated_at}
            for r in reviews
        ]

    # ---- Helpers ----

    def _log_activity(self, idea_id: str, action: str, description: str, user_id: str | None, now: str):
        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="idea", entity_id=idea_id,
            action=action, description=description,
            user_id=user_id, created_at=now,
        ))

    def _log_audit(self, idea_id: str, action: str, user_id: str | None, details: str, now: str):
        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type="idea", entity_id=idea_id,
            action=action, user_id=user_id,
            details=details, created_at=now,
        ))
