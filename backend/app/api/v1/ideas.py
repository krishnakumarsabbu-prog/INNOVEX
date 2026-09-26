from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.idea_service import IdeaService
from app.services.review_service import ReviewService
from app.schemas.models import (
    IdeaCreate, IdeaUpdate, IdeaResponse, ReviewCreate,
    ReviewResponse, ReviewDecisionRequest,
    IdeaEvidenceCreate, IdeaEvidenceResponse, IdeaFollowResponse, ActivityResponse,
    InnovationCreate, MarketplaceInnovationDetailResponse,
)

router = APIRouter(prefix="/ideas", tags=["ideas"])


class UserIdBody(BaseModel):
    user_id: str


def get_idea_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> IdeaService:
    return IdeaService(repos)


def get_review_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> ReviewService:
    return ReviewService(repos)


def get_innovation_service(repos: RepositoryFactory = Depends(get_repository_factory)):
    from app.services.innovation_service import InnovationService
    return InnovationService(repos)


def _idea_dict(idea) -> dict:
    return {
        "id": idea.id, "title": idea.title,
        "problem_statement": idea.problem_statement,
        "proposed_solution": idea.proposed_solution,
        "business_impact": idea.business_impact,
        "engineering_impact": idea.engineering_impact,
        "expected_benefits": idea.expected_benefits,
        "business_area": idea.business_area,
        "technologies": idea.technologies,
        "dependencies": idea.dependencies,
        "risks": idea.risks,
        "estimated_complexity": idea.estimated_complexity,
        "estimated_duration": idea.estimated_duration,
        "founder_id": idea.founder_id,
        "status": idea.status,
        "created_at": idea.created_at,
        "updated_at": idea.updated_at,
        "created_by": idea.created_by,
        "updated_by": idea.updated_by,
        "organization_id": idea.organization_id,
    }


@router.post("", response_model=IdeaResponse)
async def create_idea(data: IdeaCreate, service: IdeaService = Depends(get_idea_service)):
    idea = service.create(data)
    return IdeaResponse(**_idea_dict(idea))


@router.get("", response_model=list[IdeaResponse])
async def get_ideas(
    search: str | None = Query(None),
    status: str | None = Query(None),
    technology: str | None = Query(None),
    business_area: str | None = Query(None),
    founder_id: str | None = Query(None),
    service: IdeaService = Depends(get_idea_service),
):
    filters = {}
    if search:
        filters["search"] = search
    if status:
        filters["status"] = status
    if technology:
        filters["technology"] = technology
    if business_area:
        filters["business_area"] = business_area
    if founder_id:
        filters["founder_id"] = founder_id
    ideas = service.get_all(filters if filters else None)
    return [IdeaResponse(**_idea_dict(i)) for i in ideas]


@router.get("/{idea_id}", response_model=IdeaResponse)
async def get_idea(idea_id: str, service: IdeaService = Depends(get_idea_service)):
    idea = service.get_by_id(idea_id)
    return IdeaResponse(**_idea_dict(idea))


@router.patch("/{idea_id}", response_model=IdeaResponse)
async def update_idea(idea_id: str, data: IdeaUpdate, service: IdeaService = Depends(get_idea_service)):
    idea = service.update(idea_id, data)
    return IdeaResponse(**_idea_dict(idea))


@router.post("/{idea_id}/submit", response_model=IdeaResponse)
async def submit_idea(idea_id: str, body: UserIdBody, service: IdeaService = Depends(get_idea_service)):
    idea = service.submit(idea_id, body.user_id)
    return IdeaResponse(**_idea_dict(idea))


@router.post("/{idea_id}/park", response_model=IdeaResponse)
async def park_idea(idea_id: str, body: UserIdBody, service: IdeaService = Depends(get_idea_service)):
    idea = service.park(idea_id, body.user_id)
    return IdeaResponse(**_idea_dict(idea))


@router.post("/{idea_id}/reopen", response_model=IdeaResponse)
async def reopen_idea(idea_id: str, body: UserIdBody, service: IdeaService = Depends(get_idea_service)):
    idea = service.reopen(idea_id, body.user_id)
    return IdeaResponse(**_idea_dict(idea))


@router.get("/{idea_id}/activity", response_model=list[ActivityResponse])
async def get_idea_activity(idea_id: str, service: IdeaService = Depends(get_idea_service)):
    activities = service.get_activity(idea_id)
    return [ActivityResponse(
        id=a.id, entity_type=a.entity_type, entity_id=a.entity_id,
        action=a.action, description=a.description, user_id=a.user_id,
        created_at=a.created_at,
    ) for a in activities]


@router.get("/{idea_id}/evidence", response_model=list[IdeaEvidenceResponse])
async def get_idea_evidence(idea_id: str, service: IdeaService = Depends(get_idea_service)):
    evidence = service.get_evidence(idea_id)
    return [IdeaEvidenceResponse(
        id=e.id, idea_id=e.idea_id, title=e.title, description=e.description,
        evidence_type=e.evidence_type, url=e.url, created_by=e.created_by,
        created_at=e.created_at, updated_at=e.updated_at,
    ) for e in evidence]


@router.post("/{idea_id}/evidence", response_model=IdeaEvidenceResponse)
async def add_idea_evidence(idea_id: str, data: IdeaEvidenceCreate, service: IdeaService = Depends(get_idea_service)):
    evidence = service.create_evidence(idea_id, data)
    return IdeaEvidenceResponse(
        id=evidence.id, idea_id=evidence.idea_id, title=evidence.title,
        description=evidence.description, evidence_type=evidence.evidence_type,
        url=evidence.url, created_by=evidence.created_by,
        created_at=evidence.created_at, updated_at=evidence.updated_at,
    )


@router.post("/{idea_id}/follow", response_model=IdeaFollowResponse)
async def follow_idea(idea_id: str, body: UserIdBody, service: IdeaService = Depends(get_idea_service)):
    follow = service.follow(idea_id, body.user_id)
    return IdeaFollowResponse(
        id=follow.id, idea_id=follow.idea_id, user_id=follow.user_id,
        created_at=follow.created_at,
    )


@router.delete("/{idea_id}/follow")
async def unfollow_idea(idea_id: str, body: UserIdBody, service: IdeaService = Depends(get_idea_service)):
    service.unfollow(idea_id, body.user_id)
    return {"unfollowed": True}


@router.post("/{idea_id}/reviews", response_model=ReviewResponse)
async def create_review(idea_id: str, data: ReviewCreate, service: ReviewService = Depends(get_review_service)):
    data.idea_id = idea_id
    result = service.create_review(idea_id, data)
    return ReviewResponse(**result)


@router.get("/{idea_id}/reviews", response_model=list[ReviewResponse])
async def get_reviews(idea_id: str, service: ReviewService = Depends(get_review_service)):
    results = service.get_reviews_by_idea(idea_id)
    return [ReviewResponse(**r) for r in results]


@router.post("/{idea_id}/innovation", response_model=MarketplaceInnovationDetailResponse)
async def create_innovation_from_idea(
    idea_id: str,
    data: InnovationCreate,
    service=Depends(get_innovation_service),
):
    innovation = service.create_from_idea(idea_id, data)
    return service.get_marketplace_by_id(innovation.id)
