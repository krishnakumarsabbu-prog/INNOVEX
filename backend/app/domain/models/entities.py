from dataclasses import dataclass, field
from datetime import datetime


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
class Idea:
    id: str
    title: str
    description: str
    category: str
    problem_statement: str
    proposed_solution: str
    status: str
    submitted_by: str
    created_at: str
    updated_at: str
    updated_by: str | None = None


@dataclass
class Review:
    id: str
    idea_id: str
    reviewer_id: str
    decision: str
    comments: str
    created_at: str
    updated_at: str


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
    created_at: str
    updated_at: str


@dataclass
class Innovation:
    id: str
    idea_id: str
    stage: str
    is_open: bool
    summary: str
    created_at: str
    updated_at: str


@dataclass
class Position:
    id: str
    innovation_id: str
    title: str
    role: str
    technology: str
    capacity: int
    filled: int
    status: str
    created_at: str
    updated_at: str


@dataclass
class PositionApplication:
    id: str
    position_id: str
    user_id: str
    status: str
    created_at: str
    updated_at: str


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
