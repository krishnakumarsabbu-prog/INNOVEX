from app.core.exceptions import NotFoundError, ConflictError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import User
from app.schemas.models import UserCreate, UserUpdate


class PeopleService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def get_all(self, filters: dict | None = None) -> list[User]:
        if not filters:
            return self._repos.user.get_all()

        users = self._repos.user.get_all()

        role = filters.get("role")
        if role:
            users = [u for u in users if u.role == role]

        skill = filters.get("skill")
        if skill:
            skill_lower = skill.lower().strip()
            users = [u for u in users if any(skill_lower in s.lower().strip() for s in u.skills)]

        technology = filters.get("technology")
        if technology:
            tech_lower = technology.lower().strip()
            idea_techs = self._repos.idea_technology
            ideas = self._repos.idea.get_all()
            matched_founder_ids: set[str] = set()
            for idea in ideas:
                if any(tech_lower in t.lower().strip() for t in idea.technologies):
                    if idea.founder_id:
                        matched_founder_ids.add(idea.founder_id)
            users = [u for u in users if u.id in matched_founder_ids]

        organization_id = filters.get("organization_id")
        if organization_id:
            ideas = self._repos.idea.get_all()
            org_user_ids: set[str] = set()
            for idea in ideas:
                if idea.organization_id == organization_id and idea.founder_id:
                    org_user_ids.add(idea.founder_id)
            users = [u for u in users if u.id in org_user_ids]

        business_area = filters.get("business_area")
        if business_area:
            ideas = self._repos.idea.get_all()
            area_user_ids: set[str] = set()
            for idea in ideas:
                if idea.business_area == business_area and idea.founder_id:
                    area_user_ids.add(idea.founder_id)
            users = [u for u in users if u.id in area_user_ids]

        search = filters.get("search")
        if search:
            users = self._repos.user.search(search)

        return users

    def get_by_id(self, user_id: str) -> User:
        user = self._repos.user.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def create(self, data: UserCreate) -> User:
        if self._repos.user.get_by_email(data.email):
            raise ConflictError(f"User with email {data.email} already exists")
        from app.core.security import generate_id, utc_now
        from app.domain.models.entities import Activity, AuditEvent
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
        )
        self._repos.user.create(user)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="user", entity_id=user.id,
            action="created", description=f"User '{user.name}' created",
            user_id=None, created_at=now,
        ))
        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type="user", entity_id=user.id,
            action="USER_CREATED", user_id=None,
            details=f"User '{user.name}' created", created_at=now,
        ))
        return user

    def update(self, user_id: str, data: UserUpdate) -> User:
        user = self.get_by_id(user_id)
        from app.core.security import utc_now
        from app.domain.models.entities import Activity, AuditEvent
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(user, k, v)
        user.updated_at = now
        self._repos.user.update(user_id, **update_data, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="user", entity_id=user_id,
            action="updated", description=f"User '{user.name}' updated",
            user_id=None, created_at=now,
        ))
        return user
