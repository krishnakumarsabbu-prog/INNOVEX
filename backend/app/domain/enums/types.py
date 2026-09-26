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


class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"
