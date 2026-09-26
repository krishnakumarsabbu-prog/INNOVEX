from app.core.security import generate_id, utc_now
from app.core.exceptions import ConflictError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import Organization, User, Activity, AuditEvent
from app.schemas.models import OrganizationCreate, OrganizationResponse, SetupStatusResponse


class SetupService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def get_setup_status(self) -> SetupStatusResponse:
        org = self._repos.organization.get_first()
        if org:
            return SetupStatusResponse(
                setup_required=False,
                organization=OrganizationResponse(id=org.id, name=org.name, created_at=org.created_at, updated_at=org.updated_at),
            )
        return SetupStatusResponse(setup_required=True)

    def create_organization(self, data: OrganizationCreate) -> dict:
        if self._repos.organization.count() > 0:
            raise ConflictError("Organization already exists")

        now = utc_now()
        org_id = generate_id()
        admin_id = generate_id()

        org = Organization(
            id=org_id,
            name=data.name,
            created_at=now,
            updated_at=now,
            created_by=admin_id,
            updated_by=admin_id,
        )
        self._repos.organization.create(org)

        admin = User(
            id=admin_id,
            name=data.admin_name,
            email=data.admin_email,
            role="admin",
            title="Administrator",
            department="Administration",
            skills=[],
            created_at=now,
            updated_at=now,
            created_by=admin_id,
            updated_by=admin_id,
        )
        self._repos.user.create(admin)

        self._repos.activity.create(Activity(
            id=generate_id(),
            entity_type="organization",
            entity_id=org_id,
            action="created",
            description=f"Organization '{data.name}' created with administrator {data.admin_name}",
            user_id=admin_id,
            created_at=now,
        ))

        self._repos.audit.create(AuditEvent(
            id=generate_id(),
            entity_type="organization",
            entity_id=org_id,
            action="created",
            user_id=admin_id,
            details=f"Organization '{data.name}' created with administrator {data.admin_name}",
            created_at=now,
        ))

        return {
            "organization": OrganizationResponse(id=org.id, name=org.name, created_at=org.created_at, updated_at=org.updated_at).model_dump(),
            "admin": {
                "id": admin.id,
                "name": admin.name,
                "email": admin.email,
                "role": admin.role,
            },
        }
