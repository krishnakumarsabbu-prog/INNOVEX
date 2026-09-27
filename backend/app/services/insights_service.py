import json
from collections import Counter
from datetime import datetime, timedelta

from app.database.repository_factory import RepositoryFactory
from app.domain.enums.types import IdeaStatus, InnovationStage
from app.schemas.models import (
    InsightsOverviewResponse,
    FunnelStageResponse,
    ChartDatumResponse,
    TeamFormationMetricsResponse,
    AdoptionMetricsResponse,
    ActivityResponse,
)


class InsightsService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def get_overview(self) -> InsightsOverviewResponse:
        metrics = self._compute_metrics()
        funnel = self._compute_funnel()
        ideas_by_area = self._compute_ideas_by_business_area()
        ideas_by_tech = self._compute_ideas_by_technology()
        team_metrics = self._compute_team_formation_metrics()
        adoption = self._compute_adoption_metrics()
        recent = self._compute_recent_activity()

        return InsightsOverviewResponse(
            metrics=metrics,
            innovation_funnel=funnel,
            ideas_by_business_area=ideas_by_area,
            ideas_by_technology=ideas_by_tech,
            team_formation_metrics=team_metrics,
            adoption_metrics=adoption,
            recent_activity=recent,
        )

    def _compute_metrics(self) -> dict:
        idea = self._repos.idea
        inn = self._repos.innovation

        ideas_submitted = idea.count()
        under_review = idea.count_by_status(IdeaStatus.UNDER_REVIEW.value)
        in_validation = idea.count_by_status(IdeaStatus.VALIDATION.value)
        approved = idea.count_by_status(IdeaStatus.APPROVED.value)

        team_forming = inn.count_by_stage(InnovationStage.TEAM_FORMING.value)
        building = inn.count_by_stage(InnovationStage.BUILDING.value)
        poc_stage = inn.count_by_stage(InnovationStage.POC.value)
        production_candidates = inn.count_by_stage(InnovationStage.PRODUCTION_CANDIDATE.value)
        adopted = inn.count_by_stage(InnovationStage.ADOPTED.value)

        return {
            "ideas_submitted": ideas_submitted,
            "under_review": under_review,
            "in_validation": in_validation,
            "approved": approved,
            "team_forming": team_forming,
            "building": building,
            "pocs_completed": poc_stage,
            "production_candidates": production_candidates,
            "adopted": adopted,
        }

    def _compute_funnel(self) -> list[FunnelStageResponse]:
        idea = self._repos.idea
        inn = self._repos.innovation

        stages = [
            ("ideas", "Ideas", idea.count()),
            ("review", "Review", idea.count_by_status(IdeaStatus.UNDER_REVIEW.value)),
            ("validation", "Validation", idea.count_by_status(IdeaStatus.VALIDATION.value)),
            ("approval", "Approval", idea.count_by_status(IdeaStatus.APPROVED.value)),
            ("team_formation", "Team Formation", inn.count_by_stage(InnovationStage.TEAM_FORMING.value)),
            ("build", "Build", inn.count_by_stage(InnovationStage.BUILDING.value)),
            ("poc", "POC", inn.count_by_stage(InnovationStage.POC.value)),
            ("demo", "Demo", inn.count_by_stage(InnovationStage.DEMO.value)),
            ("adoption", "Adoption", inn.count_by_stage(InnovationStage.ADOPTED.value)),
        ]
        return [FunnelStageResponse(stage=key, label=label, count=count) for key, label, count in stages]

    def _compute_ideas_by_business_area(self) -> list[ChartDatumResponse]:
        rows = self._repos.idea.get_all()
        counter: Counter = Counter()
        for idea in rows:
            area = idea.business_area.strip() if idea.business_area else ""
            if area:
                counter[area] += 1
            else:
                counter["Unspecified"] += 1
        return [ChartDatumResponse(name=k, value=v) for k, v in counter.most_common()]

    def _compute_ideas_by_technology(self) -> list[ChartDatumResponse]:
        rows = self._repos.idea.get_all()
        counter: Counter = Counter()
        for idea in rows:
            for tech in idea.technologies:
                t = tech.strip()
                if t:
                    counter[t] += 1
        return [ChartDatumResponse(name=k, value=v) for k, v in counter.most_common()]

    def _compute_team_formation_metrics(self) -> TeamFormationMetricsResponse:
        roles = self._repos.innovation_role.get_all()
        open_positions = sum(1 for r in roles if r.status == "open")
        filled_positions = sum(r.filled for r in roles)

        teams = self._repos.team.get_all()
        total_teams = len(teams)

        memberships = self._repos.team_membership.get_all()
        team_members = len(memberships)

        join_requests = self._repos.join_request.get_all()
        join_requests_pending = sum(1 for jr in join_requests if jr.status == "requested")

        innovations_with_teams = 0
        innovations = self._repos.innovation.get_all()
        for inn in innovations:
            ms = self._repos.team_membership.get_by_innovation(inn.id)
            if ms:
                innovations_with_teams += 1

        return TeamFormationMetricsResponse(
            open_positions=open_positions,
            filled_positions=filled_positions,
            total_teams=total_teams,
            team_members=team_members,
            join_requests_pending=join_requests_pending,
            innovations_with_teams=innovations_with_teams,
        )

    def _compute_adoption_metrics(self) -> AdoptionMetricsResponse:
        inn = self._repos.innovation
        adopted = inn.count_by_stage(InnovationStage.ADOPTED.value)
        production_candidates = inn.count_by_stage(InnovationStage.PRODUCTION_CANDIDATE.value)
        demos = inn.count_by_stage(InnovationStage.DEMO.value)
        pocs_completed = inn.count_by_stage(InnovationStage.POC.value)

        total_innovations = sum(
            inn.count_by_stage(s.value)
            for s in InnovationStage
        )
        adoption_rate = (adopted / total_innovations * 100.0) if total_innovations > 0 else 0.0

        return AdoptionMetricsResponse(
            adopted=adopted,
            production_candidates=production_candidates,
            demos=demos,
            pocs_completed=pocs_completed,
            adoption_rate=round(adoption_rate, 1),
        )

    def _compute_recent_activity(self) -> list[ActivityResponse]:
        activities = self._repos.activity.get_all()[:20]
        return [
            ActivityResponse(
                id=a.id, entity_type=a.entity_type, entity_id=a.entity_id,
                action=a.action, description=a.description, user_id=a.user_id, created_at=a.created_at,
            )
            for a in activities
        ]
