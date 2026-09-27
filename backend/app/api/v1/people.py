from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.people_service import PeopleService
from app.schemas.models import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/people", tags=["people"])


def get_people_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> PeopleService:
    return PeopleService(repos)


def _user_dict(user) -> dict:
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "role": user.role, "title": user.title, "department": user.department,
        "skills": user.skills, "created_at": user.created_at, "updated_at": user.updated_at,
    }


@router.get("", response_model=list[UserResponse])
async def get_people(
    role: str | None = Query(None),
    skill: str | None = Query(None),
    technology: str | None = Query(None),
    organization_id: str | None = Query(None),
    business_area: str | None = Query(None),
    search: str | None = Query(None),
    service: PeopleService = Depends(get_people_service),
):
    filters: dict = {}
    if role:
        filters["role"] = role
    if skill:
        filters["skill"] = skill
    if technology:
        filters["technology"] = technology
    if organization_id:
        filters["organization_id"] = organization_id
    if business_area:
        filters["business_area"] = business_area
    if search:
        filters["search"] = search
    users = service.get_all(filters if filters else None)
    return [UserResponse(**_user_dict(u)) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_person(user_id: str, service: PeopleService = Depends(get_people_service)):
    user = service.get_by_id(user_id)
    return UserResponse(**_user_dict(user))


@router.post("", response_model=UserResponse)
async def create_person(
    data: UserCreate,
    service: PeopleService = Depends(get_people_service),
):
    user = service.create(data)
    return UserResponse(**_user_dict(user))


@router.patch("/{user_id}", response_model=UserResponse)
async def update_person(
    user_id: str,
    data: UserUpdate,
    service: PeopleService = Depends(get_people_service),
):
    user = service.update(user_id, data)
    return UserResponse(**_user_dict(user))
