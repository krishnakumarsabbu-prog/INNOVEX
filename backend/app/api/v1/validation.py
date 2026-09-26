from fastapi import APIRouter, Depends
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.validation_service import ValidationService
from app.schemas.models import ValidationSprintCreate, ValidationSprintUpdate, ValidationSprintResponse

router = APIRouter(prefix="/validation", tags=["validation"])


def get_validation_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> ValidationService:
    return ValidationService(repos)


@router.post("", response_model=ValidationSprintResponse)
async def create_validation(data: ValidationSprintCreate, service: ValidationService = Depends(get_validation_service)):
    sprint = service.create(data)
    return ValidationSprintResponse(**_sprint_dict(sprint))


@router.get("", response_model=list[ValidationSprintResponse])
async def get_validations(service: ValidationService = Depends(get_validation_service)):
    return [ValidationSprintResponse(**_sprint_dict(s)) for s in service.get_all()]


@router.get("/{sprint_id}", response_model=ValidationSprintResponse)
async def get_validation(sprint_id: str, service: ValidationService = Depends(get_validation_service)):
    sprint = service.get_by_id(sprint_id)
    return ValidationSprintResponse(**_sprint_dict(sprint))


@router.get("/idea/{idea_id}", response_model=ValidationSprintResponse | None)
async def get_validation_by_idea(idea_id: str, service: ValidationService = Depends(get_validation_service)):
    sprint = service.get_by_idea(idea_id)
    if sprint:
        return ValidationSprintResponse(**_sprint_dict(sprint))
    return None


@router.put("/{sprint_id}", response_model=ValidationSprintResponse)
async def update_validation(sprint_id: str, data: ValidationSprintUpdate, service: ValidationService = Depends(get_validation_service)):
    sprint = service.update(sprint_id, data)
    return ValidationSprintResponse(**_sprint_dict(sprint))


@router.delete("/{sprint_id}")
async def delete_validation(sprint_id: str, service: ValidationService = Depends(get_validation_service)):
    service.delete(sprint_id)
    return {"deleted": True}


def _sprint_dict(sprint) -> dict:
    return {
        "id": sprint.id, "idea_id": sprint.idea_id,
        "principal_engineer_id": sprint.principal_engineer_id,
        "manager_id": sprint.manager_id, "status": sprint.status,
        "start_date": sprint.start_date, "end_date": sprint.end_date,
        "objectives": sprint.objectives, "findings": sprint.findings,
        "created_at": sprint.created_at, "updated_at": sprint.updated_at,
    }
