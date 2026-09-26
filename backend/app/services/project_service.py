from app.core.security import generate_id, utc_now
from app.core.exceptions import NotFoundError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import Team, Project, Milestone, Evidence, Activity, WorkItem, AuditEvent
from app.domain.enums.types import ProjectStatus, MilestoneStatus, WorkItemStatus
from app.schemas.models import (
    TeamCreate, TeamUpdate, ProjectCreate, ProjectUpdate,
    MilestoneCreate, MilestoneUpdate, EvidenceCreate,
    WorkItemCreate, WorkItemUpdate,
)


class TeamService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def create(self, data: TeamCreate) -> Team:
        now = utc_now()
        team = Team(
            id=generate_id(),
            name=data.name,
            innovation_id=data.innovation_id,
            project_id=data.project_id,
            lead_id=data.lead_id,
            member_ids=data.member_ids,
            created_at=now,
            updated_at=now,
        )
        self._repos.team.create(team)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="team", entity_id=team.id,
            action="created", description=f"Team '{team.name}' created",
            user_id=None, created_at=now,
        ))
        return team

    def get_by_id(self, team_id: str) -> Team:
        team = self._repos.team.get_by_id(team_id)
        if not team:
            raise NotFoundError("Team not found")
        return team

    def get_all(self) -> list[Team]:
        return self._repos.team.get_all()

    def get_by_innovation(self, innovation_id: str) -> list[Team]:
        return self._repos.team.get_by_innovation(innovation_id)

    def update(self, team_id: str, data: TeamUpdate) -> Team:
        team = self.get_by_id(team_id)
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(team, k, v)
        team.updated_at = now
        self._repos.team.update(team_id, **update_data, updated_at=now)
        return self._repos.team.get_by_id(team_id)

    def delete(self, team_id: str) -> bool:
        return self._repos.team.delete(team_id)

    def add_member(self, team_id: str, user_id: str) -> Team:
        team = self.get_by_id(team_id)
        if user_id not in team.member_ids:
            team.member_ids.append(user_id)
            self._repos.team.update(team_id, member_ids=team.member_ids, updated_at=utc_now())
        return self._repos.team.get_by_id(team_id)

    def remove_member(self, team_id: str, user_id: str) -> Team:
        team = self.get_by_id(team_id)
        if user_id in team.member_ids:
            team.member_ids.remove(user_id)
            self._repos.team.update(team_id, member_ids=team.member_ids, updated_at=utc_now())
        return self._repos.team.get_by_id(team_id)


class ProjectService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def create(self, data: ProjectCreate) -> Project:
        now = utc_now()
        project = Project(
            id=generate_id(),
            name=data.name,
            innovation_id=data.innovation_id,
            team_id=data.team_id,
            description=data.description,
            status=ProjectStatus.NOT_STARTED.value,
            created_at=now,
            updated_at=now,
        )
        self._repos.project.create(project)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="project", entity_id=project.id,
            action="created", description=f"Project '{project.name}' created",
            user_id=None, created_at=now,
        ))

        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type="project", entity_id=project.id,
            action="created", user_id=None,
            details=f"Project '{project.name}' created", created_at=now,
        ))
        return project

    def get_by_id(self, project_id: str) -> Project:
        project = self._repos.project.get_by_id(project_id)
        if not project:
            raise NotFoundError("Project not found")
        return project

    def get_all(self) -> list[Project]:
        return self._repos.project.get_all()

    def get_by_innovation(self, innovation_id: str) -> list[Project]:
        return self._repos.project.get_by_innovation(innovation_id)

    def get_by_team(self, team_id: str) -> list[Project]:
        return self._repos.project.get_by_team(team_id)

    def update(self, project_id: str, data: ProjectUpdate) -> Project:
        project = self.get_by_id(project_id)
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(project, k, v)
        project.updated_at = now
        self._repos.project.update(project_id, **update_data, updated_at=now)

        if data.status:
            self._repos.activity.create(Activity(
                id=generate_id(), entity_type="project", entity_id=project.id,
                action="status_changed", description=f"Project '{project.name}' status changed to {data.status}",
                user_id=None, created_at=now,
            ))
        return self._repos.project.get_by_id(project_id)

    def delete(self, project_id: str) -> bool:
        return self._repos.project.delete(project_id)

    def create_milestone(self, data: MilestoneCreate) -> Milestone:
        self.get_by_id(data.project_id)
        now = utc_now()
        milestone = Milestone(
            id=generate_id(),
            project_id=data.project_id,
            title=data.title,
            description=data.description,
            status=MilestoneStatus.PENDING.value,
            due_date=data.due_date,
            completed_at=None,
            created_at=now,
            updated_at=now,
        )
        self._repos.milestone.create(milestone)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="milestone", entity_id=milestone.id,
            action="created", description=f"Milestone '{milestone.title}' created",
            user_id=None, created_at=now,
        ))
        return milestone

    def get_milestones(self, project_id: str) -> list[Milestone]:
        return self._repos.milestone.get_by_project(project_id)

    def update_milestone(self, milestone_id: str, data: MilestoneUpdate) -> Milestone:
        milestone = self._repos.milestone.get_by_id(milestone_id)
        if not milestone:
            raise NotFoundError("Milestone not found")
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(milestone, k, v)
        milestone.updated_at = now
        if data.status == MilestoneStatus.DONE.value:
            milestone.completed_at = now
        self._repos.milestone.update(milestone_id, **update_data, updated_at=now)
        return self._repos.milestone.get_by_id(milestone_id)

    def delete_milestone(self, milestone_id: str) -> bool:
        return self._repos.milestone.delete(milestone_id)

    def create_work_item(self, data: WorkItemCreate) -> WorkItem:
        self.get_by_id(data.project_id)
        now = utc_now()
        work_item = WorkItem(
            id=generate_id(),
            project_id=data.project_id,
            milestone_id=data.milestone_id,
            title=data.title,
            description=data.description,
            status=WorkItemStatus.BACKLOG.value,
            assignee_id=data.assignee_id,
            order_index=data.order_index,
            created_at=now,
            updated_at=now,
        )
        self._repos.work_item.create(work_item)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="work_item", entity_id=work_item.id,
            action="created", description=f"Work item '{work_item.title}' created",
            user_id=None, created_at=now,
        ))
        return work_item

    def get_work_items(self, project_id: str) -> list[WorkItem]:
        return self._repos.work_item.get_by_project(project_id)

    def update_work_item(self, work_item_id: str, data: WorkItemUpdate) -> WorkItem:
        item = self._repos.work_item.get_by_id(work_item_id)
        if not item:
            raise NotFoundError("Work item not found")
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        self._repos.work_item.update(work_item_id, **update_data, updated_at=now)
        return self._repos.work_item.get_by_id(work_item_id)

    def delete_work_item(self, work_item_id: str) -> bool:
        return self._repos.work_item.delete(work_item_id)

    def create_evidence(self, data: EvidenceCreate) -> Evidence:
        self.get_by_id(data.project_id)
        now = utc_now()
        evidence = Evidence(
            id=generate_id(),
            project_id=data.project_id,
            title=data.title,
            description=data.description,
            evidence_type=data.evidence_type,
            url=data.url,
            created_by=data.created_by,
            created_at=now,
            updated_at=now,
        )
        self._repos.evidence.create(evidence)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="evidence", entity_id=evidence.id,
            action="uploaded", description=f"Evidence '{evidence.title}' added",
            user_id=data.created_by, created_at=now,
        ))
        return evidence

    def get_evidence(self, project_id: str) -> list[Evidence]:
        return self._repos.evidence.get_by_project(project_id)

    def delete_evidence(self, evidence_id: str) -> bool:
        return self._repos.evidence.delete(evidence_id)
