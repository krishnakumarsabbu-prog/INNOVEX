from app.database.repository_factory import RepositoryFactory
from app.domain.enums.types import IdeaStatus, InnovationStage, ProjectStatus, RoleStatus
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
            "draft": self._repos.idea.count_by_status(IdeaStatus.DRAFT.value),
            "submitted": self._repos.idea.count_by_status(IdeaStatus.SUBMITTED.value),
            "under_review": self._repos.idea.count_by_status(IdeaStatus.UNDER_REVIEW.value),
            "validation": self._repos.idea.count_by_status(IdeaStatus.VALIDATION.value),
            "approved": self._repos.idea.count_by_status(IdeaStatus.APPROVED.value),
            "parked": self._repos.idea.count_by_status(IdeaStatus.PARKED.value),
            "rejected": self._repos.idea.count_by_status(IdeaStatus.REJECTED.value),
            "users": self._repos.user.count(),
            "teams": self._repos.team.count(),
            "projects": self._repos.project.count(),
            "open_positions": self._repos.innovation_role.count_open(),
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
            "validation": self._repos.innovation.count_by_stage(InnovationStage.VALIDATION.value),
            "open_for_team": self._repos.innovation.count_by_stage(InnovationStage.OPEN_FOR_TEAM.value),
            "team_forming": self._repos.innovation.count_by_stage(InnovationStage.TEAM_FORMING.value),
            "building": self._repos.innovation.count_by_stage(InnovationStage.BUILDING.value),
            "poc": self._repos.innovation.count_by_stage(InnovationStage.POC.value),
            "demo": self._repos.innovation.count_by_stage(InnovationStage.DEMO.value),
            "production_candidate": self._repos.innovation.count_by_stage(InnovationStage.PRODUCTION_CANDIDATE.value),
            "adopted": self._repos.innovation.count_by_stage(InnovationStage.ADOPTED.value),
            "parked": self._repos.innovation.count_by_stage(InnovationStage.PARKED.value),
            "closed": self._repos.innovation.count_by_stage(InnovationStage.CLOSED.value),
            "not_started_projects": self._repos.project.count_by_status(ProjectStatus.NOT_STARTED.value),
            "planning_projects": self._repos.project.count_by_status(ProjectStatus.PLANNING.value),
            "in_progress_projects": self._repos.project.count_by_status(ProjectStatus.IN_PROGRESS.value),
            "completed_projects": self._repos.project.count_by_status(ProjectStatus.COMPLETED.value),
        }

        return DashboardResponse(
            organization=org_resp,
            metrics=metrics,
            recent_activities=activity_resps,
            pipeline=pipeline,
        )
