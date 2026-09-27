from dataclasses import dataclass, field
from typing import Any


@dataclass
class Organization:
    id: str
    name: str
    created_at: str
    updated_at: str
    created_by: str | None = None
    updated_by: str | None = None


@dataclass
class User:
    id: str
    name: str
    email: str
    role: str
    title: str = ""
    department: str = ""
    skills: list[str] = field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""
    created_by: str | None = None
    updated_by: str | None = None


@dataclass
class Skill:
    id: str
    name: str
    category: str = ""
    created_at: str = ""
    updated_at: str = ""


@dataclass
class Idea:
    id: str
    title: str
    problem_statement: str = ""
    proposed_solution: str = ""
    business_impact: str = ""
    engineering_impact: str = ""
    expected_benefits: str = ""
    business_area: str = ""
    technologies: list[str] = field(default_factory=list)
    dependencies: str = ""
    risks: str = ""
    estimated_complexity: str = ""
    estimated_duration: str = ""
    founder_id: str | None = None
    status: str = "draft"
    created_at: str = ""
    updated_at: str = ""
    created_by: str | None = None
    updated_by: str | None = None
    organization_id: str | None = None


@dataclass
class IdeaEvidence:
    id: str
    idea_id: str
    title: str
    description: str = ""
    evidence_type: str = "document"
    url: str = ""
    created_by: str = ""
    created_at: str = ""
    updated_at: str = ""


@dataclass
class IdeaFollow:
    id: str
    idea_id: str
    user_id: str
    created_at: str = ""


@dataclass
class IdeaTechnology:
    id: str
    idea_id: str
    technology: str
    created_at: str = ""


@dataclass
class Review:
    id: str
    idea_id: str
    reviewer_id: str
    decision: str
    comments: str
    reason: str = ""
    evidence: str = ""
    created_at: str = ""
    updated_at: str = ""


@dataclass
class ReviewDimension:
    id: str
    review_id: str
    dimension: str
    rating: str = ""
    comment: str = ""
    created_at: str = ""


@dataclass
class ReviewAssignment:
    id: str
    idea_id: str
    reviewer_id: str
    status: str = "pending"
    created_at: str = ""
    updated_at: str = ""


@dataclass
class ValidationSprint:
    id: str
    idea_id: str
    principal_engineer_id: str | None
    manager_id: str | None
    status: str
    start_date: str | None
    end_date: str | None
    objectives: str
    findings: str
    objectives_checklist: str = "[]"
    checklist: str = "[]"
    decision: str | None = None
    decision_reason: str = ""
    created_at: str = ""
    updated_at: str = ""


@dataclass
class ValidationEvidence:
    id: str
    sprint_id: str
    evidence_type: str
    title: str
    description: str = ""
    url: str = ""
    conclusion: str = ""
    created_by: str | None = None
    created_at: str = ""
    updated_at: str = ""


@dataclass
class Innovation:
    id: str
    idea_id: str
    stage: str
    is_open: bool
    summary: str
    founder_id: str | None = None
    principal_engineer_id: str | None = None
    manager_id: str | None = None
    created_at: str = ""
    updated_at: str = ""


@dataclass
class InnovationRole:
    id: str
    innovation_id: str
    title: str
    role: str
    technology: str = ""
    description: str = ""
    required_skills: list[str] = field(default_factory=list)
    preferred_skills: list[str] = field(default_factory=list)
    capacity: int = 1
    filled: int = 0
    status: str = "open"
    commitment: str = ""
    created_at: str = ""
    updated_at: str = ""


@dataclass
class TeamMembership:
    id: str
    innovation_id: str
    user_id: str
    role: str = ""
    joined_at: str = ""


@dataclass
class JoinRequest:
    id: str
    innovation_id: str
    user_id: str
    role: str = ""
    role_id: str = ""
    status: str = "requested"
    message: str = ""
    created_at: str = ""
    updated_at: str = ""


@dataclass
class Team:
    id: str
    name: str
    innovation_id: str | None
    project_id: str | None
    lead_id: str | None
    member_ids: list[str] = field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""


@dataclass
class Project:
    id: str
    name: str
    innovation_id: str | None
    team_id: str | None
    description: str
    status: str
    created_at: str
    updated_at: str


@dataclass
class Milestone:
    id: str
    project_id: str
    title: str
    description: str
    status: str
    due_date: str | None
    completed_at: str | None
    created_at: str
    updated_at: str


@dataclass
class WorkItem:
    id: str
    project_id: str
    milestone_id: str | None
    title: str
    description: str = ""
    status: str = "backlog"
    assignee_id: str | None = None
    order_index: int = 0
    created_at: str = ""
    updated_at: str = ""


@dataclass
class Evidence:
    id: str
    project_id: str
    title: str
    description: str
    evidence_type: str
    url: str
    created_by: str
    created_at: str
    updated_at: str


@dataclass
class Activity:
    id: str
    entity_type: str
    entity_id: str
    action: str
    description: str
    user_id: str | None
    created_at: str


@dataclass
class Notification:
    id: str
    user_id: str
    message: str
    read: bool
    created_at: str


@dataclass
class Follow:
    id: str
    innovation_id: str
    user_id: str
    created_at: str = ""


@dataclass
class AuditEvent:
    id: str
    entity_type: str
    entity_id: str
    action: str
    user_id: str | None
    details: str = ""
    created_at: str = ""


# ---- Backward-compat aliases (existing API uses Position/PositionApplication) ----

InnovationRole.__doc__ = "Also exposed as Position via the API"


@dataclass
class Position(InnovationRole):
    """Backward-compat alias for InnovationRole used by existing API endpoints."""
    pass


@dataclass
class PositionApplication:
    """Backward-compat alias for JoinRequest used by existing API endpoints."""
    id: str
    position_id: str
    user_id: str
    status: str
    created_at: str
    updated_at: str
