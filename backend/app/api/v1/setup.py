from fastapi import APIRouter, Depends
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.setup_service import SetupService
from app.schemas.models import OrganizationCreate, SetupStatusResponse

router = APIRouter(prefix="/setup", tags=["setup"])


def get_setup_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> SetupService:
    return SetupService(repos)


@router.get("/status", response_model=SetupStatusResponse)
async def get_setup_status(service: SetupService = Depends(get_setup_service)):
    return service.get_setup_status()


@router.post("/organization")
async def create_organization(
    data: OrganizationCreate,
    service: SetupService = Depends(get_setup_service),
):
    return service.create_organization(data)
