from app.core.security import generate_id, utc_now
from app.core.exceptions import NotFoundError, ValidationError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import Idea, Activity, Notification
from app.domain.enums.types import IdeaStatus, ReviewDecision
from app.schemas.models import IdeaCreate, IdeaUpdate, ReviewCreate, ReviewUpdate


class IdeaService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def create(self, data: IdeaCreate) -> Idea:
        if not self._repos.user.get_by_id(data.submitted_by):
            raise NotFoundError("Submitter not found")
        now = utc_now()
        idea = Idea(
            id=generate_id(),
            title=data.title,
            description=data.description,
            category=data.category,
            problem_statement=data.problem_statement,
            proposed_solution=data.proposed_solution,
            status=IdeaStatus.SUBMITTED.value,
            submitted_by=data.submitted_by,
            created_at=now,
            updated_at=now,
        )
        self._repos.idea.create(idea)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="idea", entity_id=idea.id,
            action="submitted", description=f"Idea '{idea.title}' submitted",
            user_id=data.submitted_by, created_at=now,
        ))

        admins = self._repos.user.get_by_role("admin")
        for admin in admins:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=admin.id,
                message=f"New idea submitted: '{idea.title}'",
                read=False, created_at=now,
            ))
        return idea

    def get_by_id(self, idea_id: str) -> Idea:
        idea = self._repos.idea.get_by_id(idea_id)
        if not idea:
            raise NotFoundError("Idea not found")
        return idea

    def get_all(self) -> list[Idea]:
        return self._repos.idea.get_all()

    def get_by_submitter(self, user_id: str) -> list[Idea]:
        return self._repos.idea.get_by_submitter(user_id)

    def update(self, idea_id: str, data: IdeaUpdate, updated_by: str | None = None) -> Idea:
        idea = self.get_by_id(idea_id)
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(idea, k, v)
        idea.updated_at = now
        idea.updated_by = updated_by
        self._repos.idea.update(idea_id, **update_data, updated_at=now, updated_by=updated_by)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="idea", entity_id=idea.id,
            action="updated", description=f"Idea '{idea.title}' updated",
            user_id=updated_by, created_at=now,
        ))
        return idea

    def delete(self, idea_id: str) -> bool:
        return self._repos.idea.delete(idea_id)

    def create_review(self, data: ReviewCreate) -> dict:
        idea = self.get_by_id(data.idea_id)
        reviewer = self._repos.user.get_by_id(data.reviewer_id)
        if not reviewer:
            raise NotFoundError("Reviewer not found")

        now = utc_now()
        review_id = generate_id()
        from app.domain.models.entities import Review
        review = Review(
            id=review_id,
            idea_id=data.idea_id,
            reviewer_id=data.reviewer_id,
            decision=data.decision,
            comments=data.comments,
            created_at=now,
            updated_at=now,
        )
        self._repos.review.create(review)

        if data.decision == ReviewDecision.APPROVE.value:
            idea = self._repos.idea.update(idea.id, status=IdeaStatus.UNDER_REVIEW.value, updated_at=now)
        elif data.decision == ReviewDecision.REJECT.value:
            self._repos.idea.update(idea.id, status=IdeaStatus.REJECTED.value, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="review", entity_id=review_id,
            action="created", description=f"Review added for idea '{idea.title}' with decision: {data.decision}",
            user_id=data.reviewer_id, created_at=now,
        ))

        self._repos.notification.create(Notification(
            id=generate_id(), user_id=idea.submitted_by,
            message=f"Your idea '{idea.title}' has been reviewed: {data.decision}",
            read=False, created_at=now,
        ))

        return {
            "id": review.id,
            "idea_id": review.idea_id,
            "reviewer_id": review.reviewer_id,
            "decision": review.decision,
            "comments": review.comments,
            "created_at": review.created_at,
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

    def search(self, query: str) -> list[Idea]:
        return self._repos.idea.search(query)
