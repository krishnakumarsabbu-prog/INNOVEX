from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    PRINCIPAL_ENGINEER = "principal_engineer"
    MANAGER = "manager"
    PANEL_MEMBER = "panel_member"
    ENGINEER = "engineer"
    CONTRIBUTOR = "contributor"


class IdeaStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    IN_VALIDATION = "in_validation"
    APPROVED = "approved"
    REJECTED = "rejected"
    TEAM_FORMING = "team_forming"
    BUILDING = "building"
    POC = "poc"
    ADOPTED = "adopted"
    ARCHIVED = "archived"


class ReviewDecision(str, Enum):
    PENDING = "pending"
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_INFO = "request_info"


class ValidationStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"


class PositionStatus(str, Enum):
    OPEN = "open"
    FILLED = "filled"
    CLOSED = "closed"


class InnovationStage(str, Enum):
    IDEA = "idea"
    VALIDATION = "validation"
    PROJECT = "project"
    POC = "poc"
    ADOPTION = "adoption"
    COMPLETED = "completed"
