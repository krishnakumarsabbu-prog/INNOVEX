from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    PRINCIPAL_ENGINEER = "principal_engineer"
    MANAGER = "manager"
    PANEL_MEMBER = "panel_member"
    ENGINEER = "engineer"
    CONTRIBUTOR = "contributor"


class IdeaStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    VALIDATION = "validation"
    APPROVED = "approved"
    PARKED = "parked"
    REJECTED = "rejected"


class InnovationStage(str, Enum):
    VALIDATION = "validation"
    OPEN_FOR_TEAM = "open_for_team"
    TEAM_FORMING = "team_forming"
    BUILDING = "building"
    POC = "poc"
    DEMO = "demo"
    PRODUCTION_CANDIDATE = "production_candidate"
    ADOPTED = "adopted"
    PARKED = "parked"
    CLOSED = "closed"


class ReviewDecision(str, Enum):
    REQUEST_INFORMATION = "request_information"
    SEND_TO_VALIDATION = "send_to_validation"
    APPROVE = "approve"
    PARK = "park"
    REJECT = "reject"
    MERGE = "merge"


class ReviewDimensionType(str, Enum):
    BUSINESS_VALUE = "business_value"
    TECHNICAL_FEASIBILITY = "technical_feasibility"
    INNOVATION = "innovation"
    REUSABILITY = "reusability"
    COMPLEXITY = "complexity"
    SECURITY_CONSIDERATIONS = "security_considerations"
    DEPENDENCIES = "dependencies"


class RoleStatus(str, Enum):
    OPEN = "open"
    FILLED = "filled"
    CLOSED = "closed"


class JoinRequestStatus(str, Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class ProjectStatus(str, Enum):
    NOT_STARTED = "not_started"
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    PAUSED = "paused"


class WorkItemStatus(str, Enum):
    BACKLOG = "backlog"
    READY = "ready"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    BLOCKED = "blocked"


class ValidationStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class ValidationDecision(str, Enum):
    CONTINUE_OPEN_INNOVATION = "continue_open_innovation"
    RETURN_FOR_MORE_VALIDATION = "return_for_more_validation"
    PARK = "park"
    CLOSE = "close"


class ValidationEvidenceType(str, Enum):
    ARCHITECTURE = "architecture"
    TECHNICAL_ANALYSIS = "technical_analysis"
    POC = "poc"
    SECURITY_REVIEW = "security_review"
    RISK_ASSESSMENT = "risk_assessment"
    DEPENDENCY_ANALYSIS = "dependency_analysis"


VALIDATION_OBJECTIVES = [
    "technical_feasibility",
    "architecture",
    "security",
    "data_availability",
    "integration_feasibility",
    "estimated_effort",
    "business_value",
    "poc_scope",
]

VALIDATION_CHECKLIST = [
    "architecture_defined",
    "poc_created",
    "security_reviewed",
    "dependencies_identified",
    "data_source_confirmed",
    "engineering_effort_estimated",
    "success_criteria_defined",
]


class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"


class AuditEventType(str, Enum):
    IDEA_CREATED = "IDEA_CREATED"
    IDEA_SUBMITTED = "IDEA_SUBMITTED"
    REVIEW_STARTED = "REVIEW_STARTED"
    REVIEW_COMPLETED = "REVIEW_COMPLETED"
    PRINCIPAL_ENGINEER_ASSIGNED = "PRINCIPAL_ENGINEER_ASSIGNED"
    MANAGER_ASSIGNED = "MANAGER_ASSIGNED"
    VALIDATION_STARTED = "VALIDATION_STARTED"
    IDEA_APPROVED = "IDEA_APPROVED"
    INNOVATION_OPENED = "INNOVATION_OPENED"
    ROLE_CREATED = "ROLE_CREATED"
    JOIN_REQUESTED = "JOIN_REQUESTED"
    JOIN_REQUEST_APPROVED = "JOIN_REQUEST_APPROVED"
    ROLE_FILLED = "ROLE_FILLED"
    PROJECT_CREATED = "PROJECT_CREATED"
    MILESTONE_COMPLETED = "MILESTONE_COMPLETED"
    EVIDENCE_ADDED = "EVIDENCE_ADDED"
    DEMO_SCHEDULED = "DEMO_SCHEDULED"
    INNOVATION_ADOPTED = "INNOVATION_ADOPTED"
