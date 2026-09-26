from fastapi import APIRouter, Depends
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.review_service import ReviewService
from app.schemas.models import (
    ReviewCreate, ReviewResponse, ReviewDecisionRequest,
    ReviewQueueItemResponse, ReviewDimensionResponse,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


def get_review_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> ReviewService:
    return ReviewService(repos)


@router.get("/queue", response_model=list[ReviewQueueItemResponse])
async def get_review_queue(service: ReviewService = Depends(get_review_service)):
    return [ReviewQueueItemResponse(**item) for item in service.get_queue()]


@router.post("/ideas/{idea_id}", response_model=ReviewResponse)
async def create_review(
    idea_id: str,
    data: ReviewCreate,
    service: ReviewService = Depends(get_review_service),
):
    data.idea_id = idea_id
    result = service.create_review(idea_id, data)
    return ReviewResponse(**result)


@router.get("/ideas/{idea_id}", response_model=list[ReviewResponse])
async def get_reviews_for_idea(
    idea_id: str,
    service: ReviewService = Depends(get_review_service),
):
    results = service.get_reviews_by_idea(idea_id)
    return [ReviewResponse(**r) for r in results]


@router.post("/ideas/{idea_id}/reviews/{review_id}/decision", response_model=ReviewResponse)
async def make_review_decision(
    idea_id: str,
    review_id: str,
    data: ReviewDecisionRequest,
    service: ReviewService = Depends(get_review_service),
):
    result = service.make_decision(idea_id, review_id, data)
    return ReviewResponse(**result)
