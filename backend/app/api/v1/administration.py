from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_repository_factory, require_role
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import User
from app.services.administration_service import AdministrationService
from app.schemas.models import (
    TechnologyTaxonomyCreate, TechnologyTaxonomyUpdate, TechnologyTaxonomyResponse,
    BusinessAreaCreate, BusinessAreaUpdate, BusinessAreaResponse,
    ReviewPanelCreate, ReviewPanelUpdate, ReviewPanelResponse,
    WorkflowCreate, WorkflowUpdate, WorkflowResponse,
    PolicyUpdate, PolicyResponse,
)

router = APIRouter(prefix="/administration", tags=["administration"])


def get_admin_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> AdministrationService:
    return AdministrationService(repos)


# ---- Organization ----

@router.get("/organization")
async def get_organization(service: AdministrationService = Depends(get_admin_service)):
    org = service.get_organization()
    if not org:
        return {"id": "", "name": "", "created_at": "", "updated_at": ""}
    return {"id": org.id, "name": org.name, "created_at": org.created_at, "updated_at": org.updated_at}


@router.put("/organization/{org_id}")
async def update_organization(
    org_id: str,
    body: dict,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    return service.update_organization(org_id, body.get("name", ""))


# ---- Roles ----

@router.get("/roles")
async def get_roles(service: AdministrationService = Depends(get_admin_service)):
    return service.get_roles()


# ---- Technology Taxonomy ----

@router.get("/technologies", response_model=list[TechnologyTaxonomyResponse])
async def get_technologies(service: AdministrationService = Depends(get_admin_service)):
    items = service.get_technologies()
    return [TechnologyTaxonomyResponse(**_tech_dict(t)) for t in items]


@router.post("/technologies", response_model=TechnologyTaxonomyResponse)
async def create_technology(
    data: TechnologyTaxonomyCreate,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    item = service.create_technology(data.name, data.category, data.description)
    return TechnologyTaxonomyResponse(**_tech_dict(item))


@router.put("/technologies/{tech_id}", response_model=TechnologyTaxonomyResponse)
async def update_technology(
    tech_id: str,
    data: TechnologyTaxonomyUpdate,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    kwargs = data.model_dump(exclude_unset=True)
    item = service.update_technology(tech_id, **kwargs)
    return TechnologyTaxonomyResponse(**_tech_dict(item))


@router.delete("/technologies/{tech_id}")
async def delete_technology(
    tech_id: str,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    service.delete_technology(tech_id)
    return {"deleted": True}


# ---- Business Areas ----

@router.get("/business-areas", response_model=list[BusinessAreaResponse])
async def get_business_areas(service: AdministrationService = Depends(get_admin_service)):
    areas = service.get_business_areas()
    return [BusinessAreaResponse(**_area_dict(a)) for a in areas]


@router.post("/business-areas", response_model=BusinessAreaResponse)
async def create_business_area(
    data: BusinessAreaCreate,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    area = service.create_business_area(data.name, data.description)
    return BusinessAreaResponse(**_area_dict(area))


@router.put("/business-areas/{area_id}", response_model=BusinessAreaResponse)
async def update_business_area(
    area_id: str,
    data: BusinessAreaUpdate,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    kwargs = data.model_dump(exclude_unset=True)
    area = service.update_business_area(area_id, **kwargs)
    return BusinessAreaResponse(**_area_dict(area))


@router.delete("/business-areas/{area_id}")
async def delete_business_area(
    area_id: str,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    service.delete_business_area(area_id)
    return {"deleted": True}


# ---- Review Panels ----

@router.get("/review-panels", response_model=list[ReviewPanelResponse])
async def get_review_panels(service: AdministrationService = Depends(get_admin_service)):
    panels = service.get_review_panels()
    return [ReviewPanelResponse(**_panel_dict(p)) for p in panels]


@router.post("/review-panels", response_model=ReviewPanelResponse)
async def create_review_panel(
    data: ReviewPanelCreate,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    panel = service.create_review_panel(data.name, data.description, data.member_ids)
    return ReviewPanelResponse(**_panel_dict(panel))


@router.put("/review-panels/{panel_id}", response_model=ReviewPanelResponse)
async def update_review_panel(
    panel_id: str,
    data: ReviewPanelUpdate,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    kwargs = data.model_dump(exclude_unset=True)
    panel = service.update_review_panel(panel_id, **kwargs)
    return ReviewPanelResponse(**_panel_dict(panel))


@router.delete("/review-panels/{panel_id}")
async def delete_review_panel(
    panel_id: str,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    service.delete_review_panel(panel_id)
    return {"deleted": True}


# ---- Workflows ----

@router.get("/workflows", response_model=list[WorkflowResponse])
async def get_workflows(service: AdministrationService = Depends(get_admin_service)):
    workflows = service.get_workflows()
    return [WorkflowResponse(**_workflow_dict(w)) for w in workflows]


@router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(
    data: WorkflowCreate,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    workflow = service.create_workflow(data.name, data.description, data.stages)
    return WorkflowResponse(**_workflow_dict(workflow))


@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    data: WorkflowUpdate,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    kwargs = data.model_dump(exclude_unset=True)
    workflow = service.update_workflow(workflow_id, **kwargs)
    return WorkflowResponse(**_workflow_dict(workflow))


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    service.delete_workflow(workflow_id)
    return {"deleted": True}


# ---- Policies ----

@router.get("/policies", response_model=list[PolicyResponse])
async def get_policies(service: AdministrationService = Depends(get_admin_service)):
    policies = service.get_policies()
    return [PolicyResponse(**_policy_dict(p)) for p in policies]


@router.put("/policies/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: str,
    data: PolicyUpdate,
    service: AdministrationService = Depends(get_admin_service),
    current_user: User = Depends(require_role("admin")),
):
    policy = service.update_policy(policy_id, data.value, data.is_active)
    return PolicyResponse(**_policy_dict(policy))


# ---- Dict helpers ----

def _tech_dict(t) -> dict:
    return {"id": t.id, "name": t.name, "category": t.category, "description": t.description, "created_at": t.created_at, "updated_at": t.updated_at}


def _area_dict(a) -> dict:
    return {"id": a.id, "name": a.name, "description": a.description, "created_at": a.created_at, "updated_at": a.updated_at}


def _panel_dict(p) -> dict:
    return {"id": p.id, "name": p.name, "description": p.description, "member_ids": p.member_ids, "created_at": p.created_at, "updated_at": p.updated_at}


def _workflow_dict(w) -> dict:
    return {"id": w.id, "name": w.name, "description": w.description, "stages": w.stages, "is_active": w.is_active, "created_at": w.created_at, "updated_at": w.updated_at}


def _policy_dict(p) -> dict:
    return {"id": p.id, "key": p.key, "name": p.name, "description": p.description, "value": p.value, "policy_type": p.policy_type, "is_active": p.is_active, "created_at": p.created_at, "updated_at": p.updated_at}
