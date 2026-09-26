from fastapi import APIRouter, Depends
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.innovation_service import InnovationService
from app.schemas.models import (
    InnovationCreate, InnovationUpdate, InnovationResponse,
    PositionCreate, PositionUpdate, PositionResponse,
    ApplicationCreate, ApplicationResponse,
    JoinRequestCreate, JoinRequestResponse,
    TeamMembershipResponse, FollowResponse,
    MarketplaceInnovationResponse, MarketplaceInnovationDetailResponse,
)

router = APIRouter(prefix="/innovations", tags=["innovations"])


def get_innovation_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> InnovationService:
    return InnovationService(repos)


@router.post("", response_model=InnovationResponse)
async def create_innovation(data: InnovationCreate, service: InnovationService = Depends(get_innovation_service)):
    innovation = service.create(data)
    return InnovationResponse(**_innovation_dict(innovation))


@router.get("", response_model=list[MarketplaceInnovationResponse])
async def get_innovations(
    open_only: bool = False,
    service: InnovationService = Depends(get_innovation_service),
):
    innovations = service.get_marketplace_all()
    if open_only:
        innovations = [i for i in innovations if i.is_open]
    return innovations


@router.get("/{innovation_id}", response_model=MarketplaceInnovationDetailResponse)
async def get_innovation(innovation_id: str, service: InnovationService = Depends(get_innovation_service)):
    return service.get_marketplace_by_id(innovation_id)


@router.patch("/{innovation_id}", response_model=MarketplaceInnovationDetailResponse)
async def patch_innovation(innovation_id: str, data: InnovationUpdate, service: InnovationService = Depends(get_innovation_service)):
    service.patch_update(innovation_id, data)
    return service.get_marketplace_by_id(innovation_id)


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


@router.post("/{innovation_id}/join-requests", response_model=JoinRequestResponse)
async def create_join_request(innovation_id: str, data: JoinRequestCreate, service: InnovationService = Depends(get_innovation_service)):
    data.innovation_id = innovation_id
    req = service.request_to_join(data)
    return JoinRequestResponse(**_join_req_dict(req))


@router.get("/{innovation_id}/join-requests", response_model=list[JoinRequestResponse])
async def get_join_requests(innovation_id: str, service: InnovationService = Depends(get_innovation_service)):
    reqs = service._repos.join_request.get_by_innovation(innovation_id)
    return [JoinRequestResponse(**_join_req_dict(r)) for r in reqs]


@router.put("/join-requests/{request_id}/approve", response_model=JoinRequestResponse)
async def approve_join_request(request_id: str, service: InnovationService = Depends(get_innovation_service)):
    req = service.approve_join_request(request_id)
    return JoinRequestResponse(**_join_req_dict(req))


@router.put("/join-requests/{request_id}/decline", response_model=JoinRequestResponse)
async def decline_join_request(request_id: str, service: InnovationService = Depends(get_innovation_service)):
    req = service.decline_join_request(request_id)
    return JoinRequestResponse(**_join_req_dict(req))


@router.get("/{innovation_id}/team", response_model=list[TeamMembershipResponse])
async def get_team_members(innovation_id: str, service: InnovationService = Depends(get_innovation_service)):
    members = service.get_team_members(innovation_id)
    return [TeamMembershipResponse(
        id=m.id, innovation_id=m.innovation_id, user_id=m.user_id, role=m.role, joined_at=m.joined_at
    ) for m in members]


@router.post("/{innovation_id}/follow", response_model=FollowResponse)
async def follow_innovation(innovation_id: str, user_id: str, service: InnovationService = Depends(get_innovation_service)):
    result = service.follow(innovation_id, user_id)
    return FollowResponse(**result)


@router.delete("/{innovation_id}/follow")
async def unfollow_innovation(innovation_id: str, user_id: str, service: InnovationService = Depends(get_innovation_service)):
    service.unfollow(innovation_id, user_id)
    return {"unfollowed": True}


@router.get("/{innovation_id}/followers", response_model=list[FollowResponse])
async def get_followers(innovation_id: str, service: InnovationService = Depends(get_innovation_service)):
    return service.get_followers(innovation_id)


@router.get("/{innovation_id}/followers/count")
async def get_follower_count(innovation_id: str, service: InnovationService = Depends(get_innovation_service)):
    return {"count": service.get_follower_count(innovation_id)}


def _innovation_dict(innovation) -> dict:
    return {
        "id": innovation.id, "idea_id": innovation.idea_id,
        "stage": innovation.stage, "is_open": innovation.is_open,
        "summary": innovation.summary,
        "founder_id": innovation.founder_id,
        "principal_engineer_id": innovation.principal_engineer_id,
        "manager_id": innovation.manager_id,
        "created_at": innovation.created_at, "updated_at": innovation.updated_at,
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
        "id": app.id, "position_id": app.innovation_id,
        "user_id": app.user_id, "status": app.status,
        "created_at": app.created_at, "updated_at": app.updated_at,
    }


def _join_req_dict(req) -> dict:
    return {
        "id": req.id, "innovation_id": req.innovation_id,
        "user_id": req.user_id, "role": req.role,
        "status": req.status, "message": req.message,
        "created_at": req.created_at, "updated_at": req.updated_at,
    }
