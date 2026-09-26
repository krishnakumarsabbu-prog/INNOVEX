from fastapi import APIRouter, Depends
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.dashboard_service import DashboardService
from app.schemas.models import DashboardResponse

router = APIRouter(tags=["dashboard"])


def get_dashboard_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> DashboardService:
    return DashboardService(repos)


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(service: DashboardService = Depends(get_dashboard_service)):
    return service.get_dashboard()
