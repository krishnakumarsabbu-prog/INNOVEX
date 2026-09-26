from app.core.security import generate_id, utc_now
from app.core.exceptions import NotFoundError, ConflictError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import User, Activity, AuditEvent
from app.schemas.models import UserCreate, UserUpdate


class UserService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def create(self, data: UserCreate, created_by: str | None = None) -> User:
        if self._repos.user.get_by_email(data.email):
            raise ConflictError(f"User with email {data.email} already exists")
        now = utc_now()
        user = User(
            id=generate_id(),
            name=data.name,
            email=data.email,
            role=data.role,
            title=data.title,
            department=data.department,
            skills=data.skills,
            created_at=now,
            updated_at=now,
            created_by=created_by,
            updated_by=created_by,
        )
        self._repos.user.create(user)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="user", entity_id=user.id,
            action="created", description=f"User '{user.name}' created",
            user_id=created_by, created_at=now,
        ))

        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type="user", entity_id=user.id,
            action="created", user_id=created_by,
            details=f"User '{user.name}' created", created_at=now,
        ))
        return user

    def get_by_id(self, user_id: str) -> User:
        user = self._repos.user.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def get_all(self) -> list[User]:
        return self._repos.user.get_all()

    def get_by_role(self, role: str) -> list[User]:
        return self._repos.user.get_by_role(role)

    def update(self, user_id: str, data: UserUpdate, updated_by: str | None = None) -> User:
        user = self.get_by_id(user_id)
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(user, k, v)
        user.updated_at = now
        user.updated_by = updated_by
        self._repos.user.update(user_id, **update_data, updated_at=now, updated_by=updated_by)
        return user

    def delete(self, user_id: str) -> bool:
        return self._repos.user.delete(user_id)

    def search(self, query: str) -> list[User]:
        return self._repos.user.search(query)
