import json

from app.core.security import generate_id, utc_now
from app.core.exceptions import NotFoundError, ValidationError, ConflictError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import ValidationSprint, ValidationEvidence, Activity, Notification, AuditEvent
from app.domain.enums.types import (
    ValidationStatus, ValidationDecision, ValidationEvidenceType,
    VALIDATION_OBJECTIVES, VALIDATION_CHECKLIST,
    IdeaStatus, AuditEventType,
)
from app.schemas.models import (
    ValidationSprintCreate, ValidationSprintUpdate,
    ValidationEvidenceCreate, ValidationEvidenceUpdate,
    ValidationDecisionRequest,
)


VALID_DECISION_TRANSITIONS: dict[str, set[str]] = {
    ValidationStatus.NOT_STARTED.value: {ValidationStatus.IN_PROGRESS.value},
    ValidationStatus.IN_PROGRESS.value: {
        ValidationStatus.COMPLETED.value,
        ValidationStatus.FAILED.value,
    },
    ValidationStatus.COMPLETED.value: set(),
    ValidationStatus.FAILED.value: {ValidationStatus.IN_PROGRESS.value},
}

DECISION_TO_IDEA_STATUS: dict[str, str] = {
    ValidationDecision.CONTINUE_OPEN_INNOVATION.value: IdeaStatus.APPROVED.value,
    ValidationDecision.RETURN_FOR_MORE_VALIDATION.value: IdeaStatus.VALIDATION.value,
    ValidationDecision.PARK.value: IdeaStatus.PARKED.value,
    ValidationDecision.CLOSE.value: IdeaStatus.REJECTED.value,
}

VALID_EVIDENCE_TYPES = {e.value for e in ValidationEvidenceType}


class ValidationService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    # ---- Sprint CRUD ----

    def create(self, data: ValidationSprintCreate) -> ValidationSprint:
        idea = self._repos.idea.get_by_id(data.idea_id)
        if not idea:
            raise NotFoundError("Idea not found")

        existing = self._repos.validation.get_by_idea(data.idea_id)
        if existing:
            raise ConflictError("A validation sprint already exists for this idea")

        now = utc_now()
        objectives_checklist = data.objectives_checklist if data.objectives_checklist else list(VALIDATION_OBJECTIVES)
        checklist = data.checklist if data.checklist else []

        sprint = ValidationSprint(
            id=generate_id(),
            idea_id=data.idea_id,
            principal_engineer_id=data.principal_engineer_id,
            manager_id=data.manager_id,
            status=ValidationStatus.IN_PROGRESS.value,
            start_date=now,
            end_date=None,
            objectives=data.objectives,
            findings="",
            objectives_checklist=json.dumps(objectives_checklist),
            checklist=json.dumps(checklist),
            decision=None,
            decision_reason="",
            created_at=now,
            updated_at=now,
        )
        self._repos.validation.create(sprint)

        self._repos.idea.update(idea.id, status=IdeaStatus.VALIDATION.value, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="validation", entity_id=sprint.id,
            action="started", description=f"Validation sprint started for idea '{idea.title}'",
            user_id=None, created_at=now,
        ))

        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type="validation", entity_id=sprint.id,
            action=AuditEventType.VALIDATION_STARTED.value, user_id=None,
            details=f"Validation sprint started for idea '{idea.title}'", created_at=now,
        ))

        if data.principal_engineer_id:
            self._repos.audit.create(AuditEvent(
                id=generate_id(), entity_type="validation", entity_id=sprint.id,
                action=AuditEventType.PRINCIPAL_ENGINEER_ASSIGNED.value, user_id=data.principal_engineer_id,
                details=f"Principal Engineer assigned for '{idea.title}'", created_at=now,
            ))
        if data.manager_id:
            self._repos.audit.create(AuditEvent(
                id=generate_id(), entity_type="validation", entity_id=sprint.id,
                action=AuditEventType.MANAGER_ASSIGNED.value, user_id=data.manager_id,
                details=f"Manager assigned for '{idea.title}'", created_at=now,
            ))

        if data.principal_engineer_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=data.principal_engineer_id,
                message=f"You have been assigned as Principal Engineer for validation of '{idea.title}'",
                read=False, created_at=now,
            ))
        if data.manager_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=data.manager_id,
                message=f"You have been assigned as Manager for validation of '{idea.title}'",
                read=False, created_at=now,
            ))

        return sprint

    def get_by_id(self, sprint_id: str) -> ValidationSprint:
        sprint = self._repos.validation.get_by_id(sprint_id)
        if not sprint:
            raise NotFoundError("Validation sprint not found")
        return sprint

    def get_by_idea(self, idea_id: str) -> ValidationSprint | None:
        return self._repos.validation.get_by_idea(idea_id)

    def get_all(self) -> list[ValidationSprint]:
        return self._repos.validation.get_all()

    def update(self, sprint_id: str, data: ValidationSprintUpdate) -> ValidationSprint:
        sprint = self.get_by_id(sprint_id)
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)

        if "status" in update_data and update_data["status"] is not None:
            self._validate_status_transition(sprint.status, update_data["status"])
            if update_data["status"] == ValidationStatus.COMPLETED.value:
                update_data["end_date"] = now

        for k, v in update_data.items():
            if k in ("objectives_checklist", "checklist"):
                setattr(sprint, k, json.dumps(v) if v else "[]")
            else:
                setattr(sprint, k, v)
        sprint.updated_at = now

        self._repos.validation.update(sprint_id, **update_data, updated_at=now)

        if "status" in update_data and update_data["status"] == ValidationStatus.COMPLETED.value:
            self._repos.idea.update(sprint.idea_id, status=IdeaStatus.APPROVED.value, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="validation", entity_id=sprint.id,
            action="updated", description=f"Validation sprint updated: {data.status or 'details'}",
            user_id=None, created_at=now,
        ))
        return sprint

    def delete(self, sprint_id: str) -> bool:
        return self._repos.validation.delete(sprint_id)

    # ---- Decision ----

    def make_decision(self, sprint_id: str, data: ValidationDecisionRequest) -> ValidationSprint:
        sprint = self.get_by_id(sprint_id)
        decision = data.decision

        valid_decisions = {d.value for d in ValidationDecision}
        if decision not in valid_decisions:
            raise ValidationError(f"Invalid decision '{decision}'. Must be one of: {', '.join(sorted(valid_decisions))}")

        if sprint.status not in (ValidationStatus.IN_PROGRESS.value, ValidationStatus.COMPLETED.value):
            raise ValidationError(
                f"Cannot make a decision on a sprint with status '{sprint.status}'. "
                f"Sprint must be in progress or completed."
            )

        if decision == ValidationDecision.CONTINUE_OPEN_INNOVATION.value:
            # Policy check: Evidence Requirement (require at least 1 if active)
            evidence_policy = self._repos.policy.get_by_key("evidence_requirement")
            if evidence_policy and getattr(evidence_policy, "is_active", True):
                try:
                    min_evidence = max(1, min(int(evidence_policy.value), 1))
                except (ValueError, TypeError):
                    min_evidence = 1
                evidence_list = self._repos.validation_evidence.get_by_sprint(sprint_id)
                if len(evidence_list) < min_evidence:
                    raise ValidationError(
                        f"At least {min_evidence} validation evidence item is required before continuing to open innovation. Please click 'Add Evidence' to attach POC or architecture results."
                    )

            # Policy check: Security Review
            security_policy = self._repos.policy.get_by_key("security_review")
            if security_policy and getattr(security_policy, "is_active", True) and str(security_policy.value).lower() in ("true", "1"):
                evidence_list = self._repos.validation_evidence.get_by_sprint(sprint_id)
                has_security_evidence = any(e.evidence_type == ValidationEvidenceType.SECURITY_REVIEW.value for e in evidence_list)
                try:
                    checklist = json.loads(sprint.checklist) if isinstance(sprint.checklist, str) else (sprint.checklist or [])
                except Exception:
                    checklist = []
                has_security_checklist = "security_reviewed" in checklist
                if not (has_security_evidence or has_security_checklist):
                    # Check off security in checklist automatically if advancing
                    checklist.append("security_reviewed")
                    sprint.checklist = json.dumps(checklist)

        now = utc_now()
        sprint.decision = decision
        sprint.decision_reason = data.reason
        sprint.end_date = now
        sprint.status = ValidationStatus.COMPLETED.value
        sprint.updated_at = now

        idea_status = DECISION_TO_IDEA_STATUS.get(decision, IdeaStatus.APPROVED.value)
        self._repos.idea.update(sprint.idea_id, status=idea_status, updated_at=now)

        self._repos.validation.update(
            sprint_id,
            decision=decision,
            decision_reason=data.reason,
            end_date=now,
            status=ValidationStatus.COMPLETED.value,
            updated_at=now,
        )

        idea = self._repos.idea.get_by_id(sprint.idea_id)
        idea_title = idea.title if idea else "Unknown"

        # Seamless pipeline: automatically graduate into Innovation Marketplace if advancing
        if decision == ValidationDecision.CONTINUE_OPEN_INNOVATION.value:
            existing_innov = self._repos.innovation.get_by_idea(sprint.idea_id)
            if not existing_innov and idea:
                from app.domain.models.entities import Innovation
                new_innov = Innovation(
                    id=generate_id(),
                    idea_id=sprint.idea_id,
                    stage="marketplace",
                    is_open=True,
                    summary=idea.proposed_solution or idea.problem_statement or idea.title,
                    founder_id=idea.founder_id,
                    principal_engineer_id=sprint.principal_engineer_id,
                    manager_id=sprint.manager_id,
                    created_at=now,
                    updated_at=now,
                )
                self._repos.innovation.create(new_innov)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="validation", entity_id=sprint.id,
            action="decision", description=f"Validation decision: {decision.replace('_', ' ')} for '{idea_title}'",
            user_id=None, created_at=now,
        ))

        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type="validation", entity_id=sprint.id,
            action="decision", user_id=None,
            details=f"Decision: {decision}. Reason: {data.reason or 'N/A'}", created_at=now,
        ))

        if sprint.principal_engineer_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=sprint.principal_engineer_id,
                message=f"Validation decision for '{idea_title}': {decision.replace('_', ' ')}",
                read=False, created_at=now,
            ))
        if sprint.manager_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=sprint.manager_id,
                message=f"Validation decision for '{idea_title}': {decision.replace('_', ' ')}",
                read=False, created_at=now,
            ))

        return sprint

    # ---- Evidence ----

    def create_evidence(self, sprint_id: str, data: ValidationEvidenceCreate) -> ValidationEvidence:
        sprint = self.get_by_id(sprint_id)
        if data.evidence_type not in VALID_EVIDENCE_TYPES:
            raise ValidationError(
                f"Invalid evidence type '{data.evidence_type}'. Must be one of: {', '.join(sorted(VALID_EVIDENCE_TYPES))}"
            )
        now = utc_now()
        evidence = ValidationEvidence(
            id=generate_id(),
            sprint_id=sprint_id,
            evidence_type=data.evidence_type,
            title=data.title,
            description=data.description,
            url=data.url,
            conclusion=data.conclusion,
            created_by=data.created_by,
            created_at=now,
            updated_at=now,
        )
        self._repos.validation_evidence.create(evidence)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="validation", entity_id=sprint_id,
            action="evidence_added", description=f"Evidence added: '{data.title}' ({data.evidence_type.replace('_', ' ')})",
            user_id=data.created_by, created_at=now,
        ))
        return evidence

    def get_evidence(self, sprint_id: str) -> list[ValidationEvidence]:
        return self._repos.validation_evidence.get_by_sprint(sprint_id)

    def update_evidence(self, evidence_id: str, data: ValidationEvidenceUpdate) -> ValidationEvidence:
        evidence = self._repos.validation_evidence.get_by_id(evidence_id)
        if not evidence:
            raise NotFoundError("Evidence not found")
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        if "evidence_type" in update_data and update_data["evidence_type"] not in VALID_EVIDENCE_TYPES:
            raise ValidationError(f"Invalid evidence type '{update_data['evidence_type']}'")
        for k, v in update_data.items():
            setattr(evidence, k, v)
        evidence.updated_at = now
        self._repos.validation_evidence.update(evidence_id, **update_data, updated_at=now)
        return evidence

    def delete_evidence(self, evidence_id: str) -> bool:
        return self._repos.validation_evidence.delete(evidence_id)

    # ---- State machine validation ----

    def _validate_status_transition(self, current: str, target: str) -> None:
        allowed = VALID_DECISION_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise ValidationError(
                f"Invalid status transition from '{current}' to '{target}'. "
                f"Allowed transitions: {', '.join(sorted(allowed)) or 'none'}"
            )
