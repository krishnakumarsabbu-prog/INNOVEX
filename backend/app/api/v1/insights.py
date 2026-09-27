from fastapi import APIRouter, Depends
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.insights_service import InsightsService
from app.schemas.models import InsightsOverviewResponse

router = APIRouter(prefix="/insights", tags=["insights"])


def get_insights_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> InsightsService:
    return InsightsService(repos)


@router.get("/overview", response_model=InsightsOverviewResponse)
async def get_insights_overview(service: InsightsService = Depends(get_insights_service)):
    return service.get_overview()
