from fastapi import APIRouter, Depends
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.project_service import TeamService, ProjectService
from app.schemas.models import (
    TeamCreate, TeamUpdate, TeamResponse,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    MilestoneCreate, MilestoneUpdate, MilestoneResponse,
    EvidenceCreate, EvidenceResponse,
)

router = APIRouter(tags=["engineering"])


def get_team_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> TeamService:
    return TeamService(repos)


def get_project_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> ProjectService:
    return ProjectService(repos)


@router.post("/teams", response_model=TeamResponse)
async def create_team(data: TeamCreate, service: TeamService = Depends(get_team_service)):
    team = service.create(data)
    return TeamResponse(**_team_dict(team))


@router.get("/teams", response_model=list[TeamResponse])
async def get_teams(service: TeamService = Depends(get_team_service)):
    return [TeamResponse(**_team_dict(t)) for t in service.get_all()]


@router.get("/teams/{team_id}", response_model=TeamResponse)
async def get_team(team_id: str, service: TeamService = Depends(get_team_service)):
    team = service.get_by_id(team_id)
    return TeamResponse(**_team_dict(team))


@router.put("/teams/{team_id}", response_model=TeamResponse)
async def update_team(team_id: str, data: TeamUpdate, service: TeamService = Depends(get_team_service)):
    team = service.update(team_id, data)
    return TeamResponse(**_team_dict(team))


@router.delete("/teams/{team_id}")
async def delete_team(team_id: str, service: TeamService = Depends(get_team_service)):
    service.delete(team_id)
    return {"deleted": True}


@router.post("/teams/{team_id}/members/{user_id}", response_model=TeamResponse)
async def add_member(team_id: str, user_id: str, service: TeamService = Depends(get_team_service)):
    team = service.add_member(team_id, user_id)
    return TeamResponse(**_team_dict(team))


@router.delete("/teams/{team_id}/members/{user_id}", response_model=TeamResponse)
async def remove_member(team_id: str, user_id: str, service: TeamService = Depends(get_team_service)):
    team = service.remove_member(team_id, user_id)
    return TeamResponse(**_team_dict(team))


@router.post("/projects", response_model=ProjectResponse)
async def create_project(data: ProjectCreate, service: ProjectService = Depends(get_project_service)):
    project = service.create(data)
    return ProjectResponse(**_project_dict(project))


@router.get("/projects", response_model=list[ProjectResponse])
async def get_projects(service: ProjectService = Depends(get_project_service)):
    return [ProjectResponse(**_project_dict(p)) for p in service.get_all()]


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, service: ProjectService = Depends(get_project_service)):
    project = service.get_by_id(project_id)
    return ProjectResponse(**_project_dict(project))


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, data: ProjectUpdate, service: ProjectService = Depends(get_project_service)):
    project = service.update(project_id, data)
    return ProjectResponse(**_project_dict(project))


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, service: ProjectService = Depends(get_project_service)):
    service.delete(project_id)
    return {"deleted": True}


@router.post("/projects/{project_id}/milestones", response_model=MilestoneResponse)
async def create_milestone(project_id: str, data: MilestoneCreate, service: ProjectService = Depends(get_project_service)):
    data.project_id = project_id
    milestone = service.create_milestone(data)
    return MilestoneResponse(**_milestone_dict(milestone))


@router.get("/projects/{project_id}/milestones", response_model=list[MilestoneResponse])
async def get_milestones(project_id: str, service: ProjectService = Depends(get_project_service)):
    milestones = service.get_milestones(project_id)
    return [MilestoneResponse(**_milestone_dict(m)) for m in milestones]


@router.put("/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(milestone_id: str, data: MilestoneUpdate, service: ProjectService = Depends(get_project_service)):
    milestone = service.update_milestone(milestone_id, data)
    return MilestoneResponse(**_milestone_dict(milestone))


@router.delete("/milestones/{milestone_id}")
async def delete_milestone(milestone_id: str, service: ProjectService = Depends(get_project_service)):
    service.delete_milestone(milestone_id)
    return {"deleted": True}


@router.post("/projects/{project_id}/evidence", response_model=EvidenceResponse)
async def create_evidence(project_id: str, data: EvidenceCreate, service: ProjectService = Depends(get_project_service)):
    data.project_id = project_id
    evidence = service.create_evidence(data)
    return EvidenceResponse(**_evidence_dict(evidence))


@router.get("/projects/{project_id}/evidence", response_model=list[EvidenceResponse])
async def get_evidence(project_id: str, service: ProjectService = Depends(get_project_service)):
    evidence = service.get_evidence(project_id)
    return [EvidenceResponse(**_evidence_dict(e)) for e in evidence]


@router.delete("/evidence/{evidence_id}")
async def delete_evidence(evidence_id: str, service: ProjectService = Depends(get_project_service)):
    service.delete_evidence(evidence_id)
    return {"deleted": True}


def _team_dict(team) -> dict:
    return {
        "id": team.id, "name": team.name, "innovation_id": team.innovation_id,
        "project_id": team.project_id, "lead_id": team.lead_id,
        "member_ids": team.member_ids, "created_at": team.created_at, "updated_at": team.updated_at,
    }


def _project_dict(project) -> dict:
    return {
        "id": project.id, "name": project.name, "innovation_id": project.innovation_id,
        "team_id": project.team_id, "description": project.description,
        "status": project.status, "created_at": project.created_at, "updated_at": project.updated_at,
    }


def _milestone_dict(milestone) -> dict:
    return {
        "id": milestone.id, "project_id": milestone.project_id,
        "title": milestone.title, "description": milestone.description,
        "status": milestone.status, "due_date": milestone.due_date,
        "completed_at": milestone.completed_at,
        "created_at": milestone.created_at, "updated_at": milestone.updated_at,
    }


def _evidence_dict(evidence) -> dict:
    return {
        "id": evidence.id, "project_id": evidence.project_id,
        "title": evidence.title, "description": evidence.description,
        "evidence_type": evidence.evidence_type, "url": evidence.url,
        "created_by": evidence.created_by, "created_at": evidence.created_at, "updated_at": evidence.updated_at,
    }
