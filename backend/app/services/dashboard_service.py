from app.database.repository_factory import RepositoryFactory
from app.domain.enums.types import IdeaStatus, InnovationStage, ProjectStatus, PositionStatus
from app.schemas.models import DashboardResponse, OrganizationResponse, ActivityResponse


class DashboardService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def get_dashboard(self) -> DashboardResponse:
        org = self._repos.organization.get_first()
        org_resp = None
        if org:
            org_resp = OrganizationResponse(id=org.id, name=org.name, created_at=org.created_at, updated_at=org.updated_at)

        metrics = {
            "ideas": self._repos.idea.count(),
            "under_review": self._repos.idea.count_by_status(IdeaStatus.UNDER_REVIEW.value),
            "in_validation": self._repos.idea.count_by_status(IdeaStatus.IN_VALIDATION.value),
            "approved": self._repos.idea.count_by_status(IdeaStatus.APPROVED.value),
            "team_forming": self._repos.idea.count_by_status(IdeaStatus.TEAM_FORMING.value),
            "building": self._repos.idea.count_by_status(IdeaStatus.BUILDING.value),
            "pocs": self._repos.idea.count_by_status(IdeaStatus.POC.value),
            "adopted": self._repos.idea.count_by_status(IdeaStatus.ADOPTED.value),
            "users": self._repos.user.count(),
            "teams": self._repos.team.count(),
            "projects": self._repos.project.count(),
            "open_positions": self._repos.position.count_open(),
            "evidence": self._repos.evidence.count(),
        }

        activities = self._repos.activity.get_all()[:20]
        activity_resps = [
            ActivityResponse(
                id=a.id, entity_type=a.entity_type, entity_id=a.entity_id,
                action=a.action, description=a.description, user_id=a.user_id, created_at=a.created_at,
            )
            for a in activities
        ]

        pipeline = {
            "idea": self._repos.innovation.count_by_stage(InnovationStage.IDEA.value),
            "validation": self._repos.innovation.count_by_stage(InnovationStage.VALIDATION.value),
            "project": self._repos.innovation.count_by_stage(InnovationStage.PROJECT.value),
            "poc": self._repos.innovation.count_by_stage(InnovationStage.POC.value),
            "adoption": self._repos.innovation.count_by_stage(InnovationStage.ADOPTION.value),
            "completed": self._repos.innovation.count_by_stage(InnovationStage.COMPLETED.value),
            "active_projects": self._repos.project.count_by_status(ProjectStatus.ACTIVE.value),
            "completed_projects": self._repos.project.count_by_status(ProjectStatus.COMPLETED.value),
        }

        return DashboardResponse(
            organization=org_resp,
            metrics=metrics,
            recent_activities=activity_resps,
            pipeline=pipeline,
        )
