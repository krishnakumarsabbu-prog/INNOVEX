from fastapi import APIRouter, Depends
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.innovation_service import InnovationService
from app.schemas.models import InnovationCreate, InnovationUpdate, InnovationResponse, PositionCreate, PositionUpdate, PositionResponse, ApplicationCreate, ApplicationResponse

router = APIRouter(prefix="/innovations", tags=["innovations"])


def get_innovation_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> InnovationService:
    return InnovationService(repos)


@router.post("", response_model=InnovationResponse)
async def create_innovation(data: InnovationCreate, service: InnovationService = Depends(get_innovation_service)):
    innovation = service.create(data)
    return InnovationResponse(**_innovation_dict(innovation))


@router.get("", response_model=list[InnovationResponse])
async def get_innovations(
    open_only: bool = False,
    service: InnovationService = Depends(get_innovation_service),
):
    if open_only:
        innovations = service.get_open()
    else:
        innovations = service.get_all()
    return [InnovationResponse(**_innovation_dict(i)) for i in innovations]


@router.get("/{innovation_id}", response_model=InnovationResponse)
async def get_innovation(innovation_id: str, service: InnovationService = Depends(get_innovation_service)):
    innovation = service.get_by_id(innovation_id)
    return InnovationResponse(**_innovation_dict(innovation))


@router.put("/{innovation_id}", response_model=InnovationResponse)
async def update_innovation(innovation_id: str, data: InnovationUpdate, service: InnovationService = Depends(get_innovation_service)):
    innovation = service.update(innovation_id, data)
    return InnovationResponse(**_innovation_dict(innovation))


@router.delete("/{innovation_id}")
async def delete_innovation(innovation_id: str, service: InnovationService = Depends(get_innovation_service)):
    service.delete(innovation_id)
    return {"deleted": True}


@router.post("/{innovation_id}/positions", response_model=PositionResponse)
async def create_position(innovation_id: str, data: PositionCreate, service: InnovationService = Depends(get_innovation_service)):
    data.innovation_id = innovation_id
    position = service.create_position(data)
    return PositionResponse(**_position_dict(position))


@router.get("/{innovation_id}/positions", response_model=list[PositionResponse])
async def get_positions(innovation_id: str, service: InnovationService = Depends(get_innovation_service)):
    positions = service.get_positions(innovation_id)
    return [PositionResponse(**_position_dict(p)) for p in positions]


@router.put("/positions/{position_id}", response_model=PositionResponse)
async def update_position(position_id: str, data: PositionUpdate, service: InnovationService = Depends(get_innovation_service)):
    position = service.update_position(position_id, data)
    return PositionResponse(**_position_dict(position))


@router.delete("/positions/{position_id}")
async def delete_position(position_id: str, service: InnovationService = Depends(get_innovation_service)):
    service.delete_position(position_id)
    return {"deleted": True}


@router.post("/positions/{position_id}/apply", response_model=ApplicationResponse)
async def apply_for_position(position_id: str, data: ApplicationCreate, service: InnovationService = Depends(get_innovation_service)):
    data.position_id = position_id
    app = service.apply_for_position(data)
    return ApplicationResponse(**_app_dict(app))


@router.get("/positions/{position_id}/applications", response_model=list[ApplicationResponse])
async def get_applications(position_id: str, service: InnovationService = Depends(get_innovation_service)):
    apps = service.get_applications_by_position(position_id)
    return [ApplicationResponse(**_app_dict(a)) for a in apps]


@router.get("/positions/open", response_model=list[PositionResponse])
async def get_open_positions(service: InnovationService = Depends(get_innovation_service)):
    positions = service.get_open_positions()
    return [PositionResponse(**_position_dict(p)) for p in positions]


def _innovation_dict(innovation) -> dict:
    return {
        "id": innovation.id, "idea_id": innovation.idea_id,
        "stage": innovation.stage, "is_open": innovation.is_open,
        "summary": innovation.summary, "created_at": innovation.created_at, "updated_at": innovation.updated_at,
    }


def _position_dict(position) -> dict:
    return {
        "id": position.id, "innovation_id": position.innovation_id,
        "title": position.title, "role": position.role,
        "technology": position.technology, "capacity": position.capacity,
        "filled": position.filled, "status": position.status,
        "created_at": position.created_at, "updated_at": position.updated_at,
    }


def _app_dict(app) -> dict:
    return {
        "id": app.id, "position_id": app.position_id,
        "user_id": app.user_id, "status": app.status,
        "created_at": app.created_at, "updated_at": app.updated_at,
    }
