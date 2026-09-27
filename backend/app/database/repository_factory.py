from app.database.memory_store import DatabaseConnection
from app.repositories.memory.activity_repo import InMemoryActivityRepository
from app.repositories.memory.audit_repo import InMemoryAuditRepository
from app.repositories.memory.evidence_repo import InMemoryEvidenceRepository
from app.repositories.memory.follow_repo import InMemoryFollowRepository
from app.repositories.memory.idea_repo import InMemoryIdeaRepository
from app.repositories.memory.idea_technology_repo import InMemoryIdeaTechnologyRepository
from app.repositories.memory.idea_evidence_repo import InMemoryIdeaEvidenceRepository
from app.repositories.memory.idea_follow_repo import InMemoryIdeaFollowRepository
from app.repositories.memory.innovation_repo import InMemoryInnovationRepository
from app.repositories.memory.innovation_role_repo import InMemoryInnovationRoleRepository
from app.repositories.memory.join_request_repo import InMemoryJoinRequestRepository
from app.repositories.memory.milestone_repo import InMemoryMilestoneRepository
from app.repositories.memory.notification_repo import InMemoryNotificationRepository
from app.repositories.memory.organization_repo import InMemoryOrganizationRepository
from app.repositories.memory.project_repo import InMemoryProjectRepository
from app.repositories.memory.review_assignment_repo import InMemoryReviewAssignmentRepository
from app.repositories.memory.review_dimension_repo import InMemoryReviewDimensionRepository
from app.repositories.memory.review_repo import InMemoryReviewRepository
from app.repositories.memory.skill_repo import InMemorySkillRepository
from app.repositories.memory.team_membership_repo import InMemoryTeamMembershipRepository
from app.repositories.memory.team_repo import InMemoryTeamRepository
from app.repositories.memory.user_repo import InMemoryUserRepository
from app.repositories.memory.validation_repo import InMemoryValidationSprintRepository
from app.repositories.memory.validation_evidence_repo import InMemoryValidationEvidenceRepository
from app.repositories.memory.work_item_repo import InMemoryWorkItemRepository
from app.repositories.memory.technology_taxonomy_repo import InMemoryTechnologyTaxonomyRepository
from app.repositories.memory.business_area_repo import InMemoryBusinessAreaRepository
from app.repositories.memory.review_panel_repo import InMemoryReviewPanelRepository
from app.repositories.memory.workflow_repo import InMemoryWorkflowRepository
from app.repositories.memory.policy_repo import InMemoryPolicyRepository

from app.repositories.interfaces import (
    OrganizationRepositoryInterface,
    UserRepositoryInterface,
    SkillRepositoryInterface,
    IdeaRepositoryInterface,
    InnovationRepositoryInterface,
    TeamRepositoryInterface,
    ProjectRepositoryInterface,
    EvidenceRepositoryInterface,
    WorkItemRepositoryInterface,
    ActivityRepositoryInterface,
    NotificationRepositoryInterface,
    AuditRepositoryInterface,
    TechnologyTaxonomyRepositoryInterface,
)
from app.repositories.interfaces.base import BaseRepository


class RepositoryFactory:
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()
        self._organization = InMemoryOrganizationRepository(self._db)
        self._user = InMemoryUserRepository(self._db)
        self._skill = InMemorySkillRepository(self._db)
        self._idea = InMemoryIdeaRepository(self._db)
        self._idea_technology = InMemoryIdeaTechnologyRepository(self._db)
        self._idea_evidence = InMemoryIdeaEvidenceRepository(self._db)
        self._idea_follow = InMemoryIdeaFollowRepository(self._db)
        self._review = InMemoryReviewRepository(self._db)
        self._review_assignment = InMemoryReviewAssignmentRepository(self._db)
        self._review_dimension = InMemoryReviewDimensionRepository(self._db)
        self._validation = InMemoryValidationSprintRepository(self._db)
        self._validation_evidence = InMemoryValidationEvidenceRepository(self._db)
        self._innovation = InMemoryInnovationRepository(self._db)
        self._innovation_role = InMemoryInnovationRoleRepository(self._db)
        self._team_membership = InMemoryTeamMembershipRepository(self._db)
        self._join_request = InMemoryJoinRequestRepository(self._db)
        self._team = InMemoryTeamRepository(self._db)
        self._project = InMemoryProjectRepository(self._db)
        self._milestone = InMemoryMilestoneRepository(self._db)
        self._work_item = InMemoryWorkItemRepository(self._db)
        self._evidence = InMemoryEvidenceRepository(self._db)
        self._activity = InMemoryActivityRepository(self._db)
        self._notification = InMemoryNotificationRepository(self._db)
        self._follow = InMemoryFollowRepository(self._db)
        self._audit = InMemoryAuditRepository(self._db)
        self._technology_taxonomy = InMemoryTechnologyTaxonomyRepository(self._db)
        self._business_area = InMemoryBusinessAreaRepository(self._db)
        self._review_panel = InMemoryReviewPanelRepository(self._db)
        self._workflow = InMemoryWorkflowRepository(self._db)
        self._policy = InMemoryPolicyRepository(self._db)

    @property
    def organization(self) -> OrganizationRepositoryInterface:
        return self._organization

    @property
    def user(self) -> UserRepositoryInterface:
        return self._user

    @property
    def skill(self) -> SkillRepositoryInterface:
        return self._skill

    @property
    def idea(self) -> IdeaRepositoryInterface:
        return self._idea

    @property
    def idea_technology(self) -> BaseRepository:
        return self._idea_technology

    @property
    def idea_evidence(self) -> BaseRepository:
        return self._idea_evidence

    @property
    def idea_follow(self) -> BaseRepository:
        return self._idea_follow

    @property
    def review(self) -> BaseRepository:
        return self._review

    @property
    def review_assignment(self) -> BaseRepository:
        return self._review_assignment

    @property
    def review_dimension(self) -> BaseRepository:
        return self._review_dimension

    @property
    def validation(self) -> BaseRepository:
        return self._validation

    @property
    def validation_evidence(self) -> BaseRepository:
        return self._validation_evidence

    @property
    def innovation(self) -> InnovationRepositoryInterface:
        return self._innovation

    @property
    def innovation_role(self) -> BaseRepository:
        return self._innovation_role

    @property
    def position(self) -> BaseRepository:
        return self._innovation_role

    @property
    def team_membership(self) -> BaseRepository:
        return self._team_membership

    @property
    def join_request(self) -> BaseRepository:
        return self._join_request

    @property
    def application(self) -> BaseRepository:
        return self._join_request

    @property
    def team(self) -> TeamRepositoryInterface:
        return self._team

    @property
    def project(self) -> ProjectRepositoryInterface:
        return self._project

    @property
    def milestone(self) -> BaseRepository:
        return self._milestone

    @property
    def work_item(self) -> WorkItemRepositoryInterface:
        return self._work_item

    @property
    def evidence(self) -> EvidenceRepositoryInterface:
        return self._evidence

    @property
    def activity(self) -> ActivityRepositoryInterface:
        return self._activity

    @property
    def notification(self) -> NotificationRepositoryInterface:
        return self._notification

    @property
    def follow(self) -> BaseRepository:
        return self._follow

    @property
    def audit(self) -> AuditRepositoryInterface:
        return self._audit

    @property
    def technology_taxonomy(self) -> TechnologyTaxonomyRepositoryInterface:
        return self._technology_taxonomy

    @property
    def business_area(self) -> BaseRepository:
        return self._business_area

    @property
    def review_panel(self) -> BaseRepository:
        return self._review_panel

    @property
    def workflow(self) -> BaseRepository:
        return self._workflow

    @property
    def policy(self) -> BaseRepository:
        return self._policy


_factory_instance: RepositoryFactory | None = None


def get_repository_factory() -> RepositoryFactory:
    global _factory_instance
    if _factory_instance is None:
        _factory_instance = RepositoryFactory()
    return _factory_instance
