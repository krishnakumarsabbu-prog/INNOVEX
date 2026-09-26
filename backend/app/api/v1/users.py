from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.user_service import UserService
from app.schemas.models import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> UserService:
    return UserService(repos)


@router.post("", response_model=UserResponse)
async def create_user(
    data: UserCreate,
    service: UserService = Depends(get_user_service),
):
    user = service.create(data)
    return UserResponse(**_user_dict(user))


@router.get("", response_model=list[UserResponse])
async def get_users(
    search: str | None = Query(None),
    role: str | None = Query(None),
    service: UserService = Depends(get_user_service),
):
    if search:
        users = service.search(search)
    elif role:
        users = service.get_by_role(role)
    else:
        users = service.get_all()
    return [UserResponse(**_user_dict(u)) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, service: UserService = Depends(get_user_service)):
    user = service.get_by_id(user_id)
    return UserResponse(**_user_dict(user))


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    service: UserService = Depends(get_user_service),
):
    user = service.update(user_id, data)
    return UserResponse(**_user_dict(user))


@router.delete("/{user_id}")
async def delete_user(user_id: str, service: UserService = Depends(get_user_service)):
    service.delete(user_id)
    return {"deleted": True}


def _user_dict(user) -> dict:
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "role": user.role, "title": user.title, "department": user.department,
        "skills": user.skills, "created_at": user.created_at, "updated_at": user.updated_at,
    }
