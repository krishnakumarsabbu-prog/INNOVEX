from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.idea_service import IdeaService
from app.schemas.models import IdeaCreate, IdeaUpdate, IdeaResponse, ReviewCreate

router = APIRouter(prefix="/ideas", tags=["ideas"])


def get_idea_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> IdeaService:
    return IdeaService(repos)


@router.post("", response_model=IdeaResponse)
async def create_idea(data: IdeaCreate, service: IdeaService = Depends(get_idea_service)):
    idea = service.create(data)
    return IdeaResponse(**_idea_dict(idea))


@router.get("", response_model=list[IdeaResponse])
async def get_ideas(
    search: str | None = Query(None),
    submitted_by: str | None = Query(None),
    service: IdeaService = Depends(get_idea_service),
):
    if search:
        ideas = service.search(search)
    elif submitted_by:
        ideas = service.get_by_submitter(submitted_by)
    else:
        ideas = service.get_all()
    return [IdeaResponse(**_idea_dict(i)) for i in ideas]


@router.get("/{idea_id}", response_model=IdeaResponse)
async def get_idea(idea_id: str, service: IdeaService = Depends(get_idea_service)):
    idea = service.get_by_id(idea_id)
    return IdeaResponse(**_idea_dict(idea))


@router.put("/{idea_id}", response_model=IdeaResponse)
async def update_idea(idea_id: str, data: IdeaUpdate, service: IdeaService = Depends(get_idea_service)):
    idea = service.update(idea_id, data)
    return IdeaResponse(**_idea_dict(idea))


@router.delete("/{idea_id}")
async def delete_idea(idea_id: str, service: IdeaService = Depends(get_idea_service)):
    service.delete(idea_id)
    return {"deleted": True}


@router.post("/{idea_id}/reviews")
async def create_review(idea_id: str, data: ReviewCreate, service: IdeaService = Depends(get_idea_service)):
    data.idea_id = idea_id
    return service.create_review(data)


@router.get("/{idea_id}/reviews")
async def get_reviews(idea_id: str, service: IdeaService = Depends(get_idea_service)):
    return service.get_reviews(idea_id)


def _idea_dict(idea) -> dict:
    return {
        "id": idea.id, "title": idea.title, "description": idea.description,
        "category": idea.category, "problem_statement": idea.problem_statement,
        "proposed_solution": idea.proposed_solution, "status": idea.status,
        "submitted_by": idea.submitted_by, "created_at": idea.created_at, "updated_at": idea.updated_at,
    }
