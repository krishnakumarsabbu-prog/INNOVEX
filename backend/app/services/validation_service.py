from app.core.security import generate_id, utc_now
from app.core.exceptions import NotFoundError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import ValidationSprint, Activity, Notification, AuditEvent
from app.domain.enums.types import ValidationStatus, IdeaStatus
from app.schemas.models import ValidationSprintCreate, ValidationSprintUpdate


class ValidationService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def create(self, data: ValidationSprintCreate) -> ValidationSprint:
        idea = self._repos.idea.get_by_id(data.idea_id)
        if not idea:
            raise NotFoundError("Idea not found")
        now = utc_now()
        sprint = ValidationSprint(
            id=generate_id(),
            idea_id=data.idea_id,
            principal_engineer_id=data.principal_engineer_id,
            manager_id=data.manager_id,
            status=ValidationStatus.IN_PROGRESS.value,
            start_date=now,
            end_date=None,
            objectives=data.objectives,
            findings="",
            created_at=now,
            updated_at=now,
        )
        self._repos.validation.create(sprint)

        self._repos.idea.update(idea.id, status=IdeaStatus.VALIDATION.value, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="validation", entity_id=sprint.id,
            action="started", description=f"Validation sprint started for idea '{idea.title}'",
            user_id=None, created_at=now,
        ))

        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type="validation", entity_id=sprint.id,
            action="started", user_id=None,
            details=f"Validation sprint started for idea '{idea.title}'", created_at=now,
        ))

        if data.principal_engineer_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=data.principal_engineer_id,
                message=f"You have been assigned as Principal Engineer for validation of '{idea.title}'",
                read=False, created_at=now,
            ))
        if data.manager_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=data.manager_id,
                message=f"You have been assigned as Manager for validation of '{idea.title}'",
                read=False, created_at=now,
            ))

        return sprint

    def get_by_id(self, sprint_id: str) -> ValidationSprint:
        sprint = self._repos.validation.get_by_id(sprint_id)
        if not sprint:
            raise NotFoundError("Validation sprint not found")
        return sprint

    def get_all(self) -> list[ValidationSprint]:
        return self._repos.validation.get_all()

    def get_by_idea(self, idea_id: str) -> ValidationSprint | None:
        return self._repos.validation.get_by_idea(idea_id)

    def update(self, sprint_id: str, data: ValidationSprintUpdate) -> ValidationSprint:
        sprint = self.get_by_id(sprint_id)
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(sprint, k, v)
        sprint.updated_at = now

        if data.status == ValidationStatus.COMPLETED.value:
            sprint.end_date = now
            self._repos.idea.update(sprint.idea_id, status=IdeaStatus.APPROVED.value, updated_at=now)

        self._repos.validation.update(sprint_id, **update_data, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="validation", entity_id=sprint.id,
            action="updated", description=f"Validation sprint updated: {data.status or 'details'}",
            user_id=None, created_at=now,
        ))
        return sprint

    def delete(self, sprint_id: str) -> bool:
        return self._repos.validation.delete(sprint_id)
