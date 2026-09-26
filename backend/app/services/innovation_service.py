from app.core.security import generate_id, utc_now
from app.core.exceptions import NotFoundError, ValidationError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import Innovation, Activity, Notification, Position, PositionApplication, Team
from app.domain.enums.types import InnovationStage, PositionStatus, IdeaStatus
from app.schemas.models import InnovationCreate, InnovationUpdate, PositionCreate, PositionUpdate, ApplicationCreate


class InnovationService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def create(self, data: InnovationCreate) -> Innovation:
        idea = self._repos.idea.get_by_id(data.idea_id)
        if not idea:
            raise NotFoundError("Idea not found")
        existing = self._repos.innovation.get_by_idea(data.idea_id)
        if existing:
            raise ValidationError("Innovation already exists for this idea")
        now = utc_now()
        innovation = Innovation(
            id=generate_id(),
            idea_id=data.idea_id,
            stage=InnovationStage.IDEA.value,
            is_open=False,
            summary=data.summary or idea.description[:200],
            created_at=now,
            updated_at=now,
        )
        self._repos.innovation.create(innovation)

        self._repos.idea.update(idea.id, status=IdeaStatus.APPROVED.value, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="innovation", entity_id=innovation.id,
            action="created", description=f"Innovation created from idea '{idea.title}'",
            user_id=None, created_at=now,
        ))
        return innovation

    def get_by_id(self, innovation_id: str) -> Innovation:
        innovation = self._repos.innovation.get_by_id(innovation_id)
        if not innovation:
            raise NotFoundError("Innovation not found")
        return innovation

    def get_all(self) -> list[Innovation]:
        return self._repos.innovation.get_all()

    def get_open(self) -> list[Innovation]:
        return self._repos.innovation.get_open()

    def update(self, innovation_id: str, data: InnovationUpdate) -> Innovation:
        innovation = self.get_by_id(innovation_id)
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(innovation, k, v)
        innovation.updated_at = now
        self._repos.innovation.update(innovation_id, **update_data, updated_at=now)

        if data.is_open:
            self._repos.idea.update(innovation.idea_id, status=IdeaStatus.TEAM_FORMING.value, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="innovation", entity_id=innovation.id,
            action="updated", description=f"Innovation stage updated to {data.stage or 'open'}",
            user_id=None, created_at=now,
        ))
        return innovation

    def delete(self, innovation_id: str) -> bool:
        return self._repos.innovation.delete(innovation_id)

    def create_position(self, data: PositionCreate) -> Position:
        innovation = self.get_by_id(data.innovation_id)
        now = utc_now()
        position = Position(
            id=generate_id(),
            innovation_id=data.innovation_id,
            title=data.title,
            role=data.role,
            technology=data.technology,
            capacity=data.capacity,
            filled=0,
            status=PositionStatus.OPEN.value,
            created_at=now,
            updated_at=now,
        )
        self._repos.position.create(position)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="position", entity_id=position.id,
            action="created", description=f"Position '{data.title}' opened for innovation",
            user_id=None, created_at=now,
        ))
        return position

    def get_positions(self, innovation_id: str) -> list[Position]:
        return self._repos.position.get_by_innovation(innovation_id)

    def get_open_positions(self) -> list[Position]:
        return self._repos.position.get_open()

    def update_position(self, position_id: str, data: PositionUpdate) -> Position:
        position = self._repos.position.get_by_id(position_id)
        if not position:
            raise NotFoundError("Position not found")
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        self._repos.position.update(position_id, **update_data, updated_at=now)
        return self._repos.position.get_by_id(position_id)

    def delete_position(self, position_id: str) -> bool:
        return self._repos.position.delete(position_id)

    def apply_for_position(self, data: ApplicationCreate) -> PositionApplication:
        position = self._repos.position.get_by_id(data.position_id)
        if not position:
            raise NotFoundError("Position not found")
        if position.status != PositionStatus.OPEN.value:
            raise ValidationError("Position is not open")
        user = self._repos.user.get_by_id(data.user_id)
        if not user:
            raise NotFoundError("User not found")
        existing = self._repos.application.get_by_position_and_user(data.position_id, data.user_id)
        if existing:
            raise ValidationError("Already applied for this position")

        now = utc_now()
        app = PositionApplication(
            id=generate_id(),
            position_id=data.position_id,
            user_id=data.user_id,
            status="accepted",
            created_at=now,
            updated_at=now,
        )
        self._repos.application.create(app)

        position.filled += 1
        if position.filled >= position.capacity:
            position.status = PositionStatus.FILLED.value
        self._repos.position.update(position.id, filled=position.filled, status=position.status, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="position", entity_id=position.id,
            action="application", description=f"User applied for position '{position.title}'",
            user_id=data.user_id, created_at=now,
        ))

        self._repos.notification.create(Notification(
            id=generate_id(), user_id=data.user_id,
            message=f"You have been accepted into position '{position.title}'",
            read=False, created_at=now,
        ))

        return app

    def get_applications_by_position(self, position_id: str) -> list[PositionApplication]:
        return self._repos.application.get_by_position(position_id)

    def get_applications_by_user(self, user_id: str) -> list[PositionApplication]:
        return self._repos.application.get_by_user(user_id)
