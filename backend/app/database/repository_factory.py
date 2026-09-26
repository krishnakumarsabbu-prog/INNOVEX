from app.database.memory_store import DatabaseConnection
from app.repositories.memory.activity_repo import ActivityRepository
from app.repositories.memory.application_repo import PositionApplicationRepository
from app.repositories.memory.evidence_repo import EvidenceRepository
from app.repositories.memory.idea_repo import IdeaRepository
from app.repositories.memory.innovation_repo import InnovationRepository
from app.repositories.memory.milestone_repo import MilestoneRepository
from app.repositories.memory.notification_repo import NotificationRepository
from app.repositories.memory.organization_repo import OrganizationRepository
from app.repositories.memory.position_repo import PositionRepository
from app.repositories.memory.project_repo import ProjectRepository
from app.repositories.memory.review_repo import ReviewRepository
from app.repositories.memory.team_repo import TeamRepository
from app.repositories.memory.user_repo import UserRepository
from app.repositories.memory.validation_repo import ValidationSprintRepository


class RepositoryFactory:
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()
        self._organization = OrganizationRepository(self._db)
        self._user = UserRepository(self._db)
        self._idea = IdeaRepository(self._db)
        self._review = ReviewRepository(self._db)
        self._validation = ValidationSprintRepository(self._db)
        self._innovation = InnovationRepository(self._db)
        self._position = PositionRepository(self._db)
        self._application = PositionApplicationRepository(self._db)
        self._team = TeamRepository(self._db)
        self._project = ProjectRepository(self._db)
        self._milestone = MilestoneRepository(self._db)
        self._evidence = EvidenceRepository(self._db)
        self._activity = ActivityRepository(self._db)
        self._notification = NotificationRepository(self._db)

    @property
    def organization(self) -> OrganizationRepository:
        return self._organization

    @property
    def user(self) -> UserRepository:
        return self._user

    @property
    def idea(self) -> IdeaRepository:
        return self._idea

    @property
    def review(self) -> ReviewRepository:
        return self._review

    @property
    def validation(self) -> ValidationSprintRepository:
        return self._validation

    @property
    def innovation(self) -> InnovationRepository:
        return self._innovation

    @property
    def position(self) -> PositionRepository:
        return self._position

    @property
    def application(self) -> PositionApplicationRepository:
        return self._application

    @property
    def team(self) -> TeamRepository:
        return self._team

    @property
    def project(self) -> ProjectRepository:
        return self._project

    @property
    def milestone(self) -> MilestoneRepository:
        return self._milestone

    @property
    def evidence(self) -> EvidenceRepository:
        return self._evidence

    @property
    def activity(self) -> ActivityRepository:
        return self._activity

    @property
    def notification(self) -> NotificationRepository:
        return self._notification


_factory_instance: RepositoryFactory | None = None


def get_repository_factory() -> RepositoryFactory:
    global _factory_instance
    if _factory_instance is None:
        _factory_instance = RepositoryFactory()
    return _factory_instance
