import json

from fastapi import APIRouter, Depends
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.validation_service import ValidationService
from app.schemas.models import (
    ValidationSprintCreate, ValidationSprintUpdate, ValidationSprintResponse,
    ValidationEvidenceCreate, ValidationEvidenceUpdate, ValidationEvidenceResponse,
    ValidationDecisionRequest,
)

router = APIRouter(prefix="/ideas", tags=["validation"])


def get_validation_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> ValidationService:
    return ValidationService(repos)


def _sprint_dict(sprint) -> dict:
    def _parse_list(val):
        if isinstance(val, str):
            try:
                return json.loads(val)
            except (json.JSONDecodeError, TypeError):
                return []
        return val or []

    return {
        "id": sprint.id, "idea_id": sprint.idea_id,
        "principal_engineer_id": sprint.principal_engineer_id,
        "manager_id": sprint.manager_id, "status": sprint.status,
        "start_date": sprint.start_date, "end_date": sprint.end_date,
        "objectives": sprint.objectives, "findings": sprint.findings,
        "objectives_checklist": _parse_list(getattr(sprint, "objectives_checklist", "[]")),
        "checklist": _parse_list(getattr(sprint, "checklist", "[]")),
        "decision": getattr(sprint, "decision", None),
        "decision_reason": getattr(sprint, "decision_reason", ""),
        "created_at": sprint.created_at, "updated_at": sprint.updated_at,
    }


def _evidence_dict(e) -> dict:
    return {
        "id": e.id, "sprint_id": e.sprint_id, "evidence_type": e.evidence_type,
        "title": e.title, "description": e.description, "url": e.url,
        "conclusion": e.conclusion, "created_by": e.created_by,
        "created_at": e.created_at, "updated_at": e.updated_at,
    }


@router.post("/{idea_id}/validation", response_model=ValidationSprintResponse)
async def create_validation(idea_id: str, data: ValidationSprintCreate, service: ValidationService = Depends(get_validation_service)):
    data.idea_id = idea_id
    sprint = service.create(data)
    return ValidationSprintResponse(**_sprint_dict(sprint))


@router.get("/{idea_id}/validation", response_model=ValidationSprintResponse | None)
async def get_validation_by_idea(idea_id: str, service: ValidationService = Depends(get_validation_service)):
    sprint = service.get_by_idea(idea_id)
    if sprint:
        return ValidationSprintResponse(**_sprint_dict(sprint))
    return None


@router.patch("/{idea_id}/validation", response_model=ValidationSprintResponse)
async def update_validation_by_idea(idea_id: str, data: ValidationSprintUpdate, service: ValidationService = Depends(get_validation_service)):
    sprint = service.get_by_idea(idea_id)
    if not sprint:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Validation sprint not found for this idea")
    updated = service.update(sprint.id, data)
    return ValidationSprintResponse(**_sprint_dict(updated))


# ---- Evidence endpoints (sprint-scoped via idea) ----

@router.get("/{idea_id}/validation/evidence", response_model=list[ValidationEvidenceResponse])
async def get_validation_evidence(idea_id: str, service: ValidationService = Depends(get_validation_service)):
    sprint = service.get_by_idea(idea_id)
    if not sprint:
        return []
    evidence = service.get_evidence(sprint.id)
    return [ValidationEvidenceResponse(**_evidence_dict(e)) for e in evidence]


@router.post("/{idea_id}/validation/evidence", response_model=ValidationEvidenceResponse)
async def create_validation_evidence(idea_id: str, data: ValidationEvidenceCreate, service: ValidationService = Depends(get_validation_service)):
    sprint = service.get_by_idea(idea_id)
    if not sprint:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Validation sprint not found for this idea")
    evidence = service.create_evidence(sprint.id, data)
    return ValidationEvidenceResponse(**_evidence_dict(evidence))


@router.put("/{idea_id}/validation/evidence/{evidence_id}", response_model=ValidationEvidenceResponse)
async def update_validation_evidence(idea_id: str, evidence_id: str, data: ValidationEvidenceUpdate, service: ValidationService = Depends(get_validation_service)):
    sprint = service.get_by_idea(idea_id)
    if not sprint:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Validation sprint not found for this idea")
    evidence = service.update_evidence(evidence_id, data)
    return ValidationEvidenceResponse(**_evidence_dict(evidence))


@router.delete("/{idea_id}/validation/evidence/{evidence_id}")
async def delete_validation_evidence(idea_id: str, evidence_id: str, service: ValidationService = Depends(get_validation_service)):
    sprint = service.get_by_idea(idea_id)
    if not sprint:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Validation sprint not found for this idea")
    service.delete_evidence(evidence_id)
    return {"deleted": True}


# ---- Decision endpoint ----

@router.post("/{idea_id}/validation/decision", response_model=ValidationSprintResponse)
async def make_validation_decision(idea_id: str, data: ValidationDecisionRequest, service: ValidationService = Depends(get_validation_service)):
    sprint = service.get_by_idea(idea_id)
    if not sprint:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Validation sprint not found for this idea")
    updated = service.make_decision(sprint.id, data)
    return ValidationSprintResponse(**_sprint_dict(updated))
