from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_repository_factory, require_role
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import Skill, User
from app.core.security import generate_id, utc_now
from app.schemas.models import SkillCreate, SkillResponse

router = APIRouter(prefix="/skills", tags=["skills"])


def get_repos(repos: RepositoryFactory = Depends(get_repository_factory)) -> RepositoryFactory:
    return repos


@router.post("", response_model=SkillResponse)
async def create_skill(
    data: SkillCreate,
    repos: RepositoryFactory = Depends(get_repos),
    current_user: User = Depends(require_role("admin")),
):
    now = utc_now()
    skill = Skill(
        id=generate_id(),
        name=data.name,
        category=data.category,
        created_at=now,
        updated_at=now,
    )
    repos.skill.create(skill)
    return SkillResponse(id=skill.id, name=skill.name, category=skill.category, created_at=skill.created_at, updated_at=skill.updated_at)


@router.get("", response_model=list[SkillResponse])
async def get_skills(
    category: str | None = Query(None),
    repos: RepositoryFactory = Depends(get_repos),
):
    if category:
        skills = repos.skill.get_by_category(category)
    else:
        skills = repos.skill.get_all()
    return [SkillResponse(id=s.id, name=s.name, category=s.category, created_at=s.created_at, updated_at=s.updated_at) for s in skills]


@router.get("/{skill_id}", response_model=SkillResponse)
async def get_skill(skill_id: str, repos: RepositoryFactory = Depends(get_repos)):
    from app.core.exceptions import NotFoundError
    skill = repos.skill.get_by_id(skill_id)
    if not skill:
        raise NotFoundError("Skill not found")
    return SkillResponse(id=skill.id, name=skill.name, category=skill.category, created_at=skill.created_at, updated_at=skill.updated_at)


@router.put("/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: str,
    data: SkillCreate,
    repos: RepositoryFactory = Depends(get_repos),
    current_user: User = Depends(require_role("admin")),
):
    from app.core.exceptions import NotFoundError
    skill = repos.skill.get_by_id(skill_id)
    if not skill:
        raise NotFoundError("Skill not found")
    now = utc_now()
    repos.skill.update(skill_id, name=data.name, category=data.category, updated_at=now)
    updated = repos.skill.get_by_id(skill_id)
    return SkillResponse(id=updated.id, name=updated.name, category=updated.category, created_at=updated.created_at, updated_at=updated.updated_at)


@router.delete("/{skill_id}")
async def delete_skill(
    skill_id: str,
    repos: RepositoryFactory = Depends(get_repos),
    current_user: User = Depends(require_role("admin")),
):
    repos.skill.delete(skill_id)
    return {"deleted": True}
