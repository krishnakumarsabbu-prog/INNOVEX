import json

from app.core.security import generate_id, utc_now
from app.core.exceptions import NotFoundError, ConflictError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import (
    TechnologyTaxonomyItem, BusinessArea, ReviewPanel, Workflow, Policy,
    Activity, AuditEvent,
)


class AdministrationService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    # ---- Technology Taxonomy ----

    def get_technologies(self) -> list[TechnologyTaxonomyItem]:
        return self._repos.technology_taxonomy.get_all()

    def create_technology(self, name: str, category: str = "", description: str = "") -> TechnologyTaxonomyItem:
        if self._repos.technology_taxonomy.get_by_name(name):
            raise ConflictError(f"Technology '{name}' already exists")
        now = utc_now()
        item = TechnologyTaxonomyItem(
            id=generate_id(), name=name, category=category,
            description=description, created_at=now, updated_at=now,
        )
        self._repos.technology_taxonomy.create(item)
        self._log_activity("technology_taxonomy", item.id, "created", f"Technology '{name}' added to taxonomy")
        return item

    def update_technology(self, tech_id: str, **kwargs) -> TechnologyTaxonomyItem:
        item = self._repos.technology_taxonomy.get_by_id(tech_id)
        if not item:
            raise NotFoundError("Technology not found")
        now = utc_now()
        kwargs["updated_at"] = now
        self._repos.technology_taxonomy.update(tech_id, **kwargs)
        self._log_activity("technology_taxonomy", tech_id, "updated", f"Technology '{item.name}' updated")
        return self._repos.technology_taxonomy.get_by_id(tech_id)

    def delete_technology(self, tech_id: str) -> bool:
        item = self._repos.technology_taxonomy.get_by_id(tech_id)
        if not item:
            raise NotFoundError("Technology not found")
        self._repos.technology_taxonomy.delete(tech_id)
        self._log_activity("technology_taxonomy", tech_id, "deleted", f"Technology '{item.name}' removed")
        return True

    # ---- Business Areas ----

    def get_business_areas(self) -> list[BusinessArea]:
        return self._repos.business_area.get_all()

    def create_business_area(self, name: str, description: str = "") -> BusinessArea:
        now = utc_now()
        area = BusinessArea(
            id=generate_id(), name=name, description=description,
            created_at=now, updated_at=now,
        )
        self._repos.business_area.create(area)
        self._log_activity("business_area", area.id, "created", f"Business area '{name}' created")
        return area

    def update_business_area(self, area_id: str, **kwargs) -> BusinessArea:
        area = self._repos.business_area.get_by_id(area_id)
        if not area:
            raise NotFoundError("Business area not found")
        now = utc_now()
        kwargs["updated_at"] = now
        self._repos.business_area.update(area_id, **kwargs)
        self._log_activity("business_area", area_id, "updated", f"Business area '{area.name}' updated")
        return self._repos.business_area.get_by_id(area_id)

    def delete_business_area(self, area_id: str) -> bool:
        area = self._repos.business_area.get_by_id(area_id)
        if not area:
            raise NotFoundError("Business area not found")
        self._repos.business_area.delete(area_id)
        self._log_activity("business_area", area_id, "deleted", f"Business area '{area.name}' removed")
        return True

    # ---- Review Panels ----

    def get_review_panels(self) -> list[ReviewPanel]:
        return self._repos.review_panel.get_all()

    def create_review_panel(self, name: str, description: str = "", member_ids: list[str] | None = None) -> ReviewPanel:
        now = utc_now()
        panel = ReviewPanel(
            id=generate_id(), name=name, description=description,
            member_ids=member_ids or [], created_at=now, updated_at=now,
        )
        self._repos.review_panel.create(panel)
        self._log_activity("review_panel", panel.id, "created", f"Review panel '{name}' created")
        return panel

    def update_review_panel(self, panel_id: str, **kwargs) -> ReviewPanel:
        panel = self._repos.review_panel.get_by_id(panel_id)
        if not panel:
            raise NotFoundError("Review panel not found")
        now = utc_now()
        kwargs["updated_at"] = now
        self._repos.review_panel.update(panel_id, **kwargs)
        self._log_activity("review_panel", panel_id, "updated", f"Review panel '{panel.name}' updated")
        return self._repos.review_panel.get_by_id(panel_id)

    def delete_review_panel(self, panel_id: str) -> bool:
        panel = self._repos.review_panel.get_by_id(panel_id)
        if not panel:
            raise NotFoundError("Review panel not found")
        self._repos.review_panel.delete(panel_id)
        self._log_activity("review_panel", panel_id, "deleted", f"Review panel '{panel.name}' removed")
        return True

    # ---- Workflows ----

    def get_workflows(self) -> list[Workflow]:
        return self._repos.workflow.get_all()

    def create_workflow(self, name: str, description: str = "", stages: list[str] | None = None) -> Workflow:
        now = utc_now()
        workflow = Workflow(
            id=generate_id(), name=name, description=description,
            stages=stages or [], is_active=True, created_at=now, updated_at=now,
        )
        self._repos.workflow.create(workflow)
        self._log_activity("workflow", workflow.id, "created", f"Workflow '{name}' created")
        return workflow

    def update_workflow(self, workflow_id: str, **kwargs) -> Workflow:
        workflow = self._repos.workflow.get_by_id(workflow_id)
        if not workflow:
            raise NotFoundError("Workflow not found")
        now = utc_now()
        kwargs["updated_at"] = now
        self._repos.workflow.update(workflow_id, **kwargs)
        self._log_activity("workflow", workflow_id, "updated", f"Workflow '{workflow.name}' updated")
        return self._repos.workflow.get_by_id(workflow_id)

    def delete_workflow(self, workflow_id: str) -> bool:
        workflow = self._repos.workflow.get_by_id(workflow_id)
        if not workflow:
            raise NotFoundError("Workflow not found")
        self._repos.workflow.delete(workflow_id)
        self._log_activity("workflow", workflow_id, "deleted", f"Workflow '{workflow.name}' removed")
        return True

    # ---- Policies ----

    def get_policies(self) -> list[Policy]:
        return self._repos.policy.get_all()

    def update_policy(self, policy_id: str, value: str | None = None, is_active: bool | None = None) -> Policy:
        policy = self._repos.policy.get_by_id(policy_id)
        if not policy:
            raise NotFoundError("Policy not found")
        now = utc_now()
        kwargs = {"updated_at": now}
        if value is not None:
            kwargs["value"] = value
        if is_active is not None:
            kwargs["is_active"] = is_active
        self._repos.policy.update(policy_id, **kwargs)
        self._log_activity("policy", policy_id, "updated", f"Policy '{policy.name}' updated")
        return self._repos.policy.get_by_id(policy_id)

    # ---- Organization ----

    def get_organization(self):
        return self._repos.organization.get_first()

    def update_organization(self, org_id: str, name: str) -> dict:
        now = utc_now()
        self._repos.organization.update(org_id, name=name, updated_at=now)
        org = self._repos.organization.get_by_id(org_id)
        self._log_activity("organization", org_id, "updated", f"Organization renamed to '{name}'")
        return {"id": org.id, "name": org.name, "created_at": org.created_at, "updated_at": org.updated_at}

    # ---- Roles ----

    def get_roles(self) -> list[dict]:
        from app.domain.enums.types import UserRole
        return [{"key": r.value, "label": r.value.replace("_", " ").title()} for r in UserRole]

    # ---- Helpers ----

    def _log_activity(self, entity_type: str, entity_id: str, action: str, description: str) -> None:
        now = utc_now()
        self._repos.activity.create(Activity(
            id=generate_id(), entity_type=entity_type, entity_id=entity_id,
            action=action, description=description, user_id=None, created_at=now,
        ))
        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type=entity_type, entity_id=entity_id,
            action=action.upper(), user_id=None, details=description, created_at=now,
        ))
