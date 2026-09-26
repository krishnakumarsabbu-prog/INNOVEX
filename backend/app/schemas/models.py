from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    admin_name: str = Field(..., min_length=1, max_length=200)
    admin_email: EmailStr


class OrganizationResponse(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: str


class SetupStatusResponse(BaseModel):
    setup_required: bool
    organization: Optional[OrganizationResponse] = None


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    role: str = "engineer"
    title: str = ""
    department: str = ""
    skills: list[str] = []


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    skills: Optional[list[str]] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    title: str
    department: str
    skills: list[str]
    created_at: str
    updated_at: str


class SkillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = ""


class SkillResponse(BaseModel):
    id: str
    name: str
    category: str
    created_at: str
    updated_at: str


class IdeaCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    problem_statement: str = ""
    proposed_solution: str = ""
    business_impact: str = ""
    engineering_impact: str = ""
    expected_benefits: str = ""
    business_area: str = ""
    technologies: list[str] = []
    dependencies: str = ""
    risks: str = ""
    estimated_complexity: str = ""
    estimated_duration: str = ""
    founder_id: str
    organization_id: str | None = None


class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    problem_statement: Optional[str] = None
    proposed_solution: Optional[str] = None
    business_impact: Optional[str] = None
    engineering_impact: Optional[str] = None
    expected_benefits: Optional[str] = None
    business_area: Optional[str] = None
    technologies: Optional[list[str]] = None
    dependencies: Optional[str] = None
    risks: Optional[str] = None
    estimated_complexity: Optional[str] = None
    estimated_duration: Optional[str] = None
    status: Optional[str] = None


class IdeaResponse(BaseModel):
    id: str
    title: str
    problem_statement: str = ""
    proposed_solution: str = ""
    business_impact: str = ""
    engineering_impact: str = ""
    expected_benefits: str = ""
    business_area: str = ""
    technologies: list[str] = []
    dependencies: str = ""
    risks: str = ""
    estimated_complexity: str = ""
    estimated_duration: str = ""
    founder_id: Optional[str] = None
    status: str = "draft"
    created_at: str = ""
    updated_at: str = ""
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    organization_id: Optional[str] = None


class IdeaEvidenceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    evidence_type: str = "document"
    url: str = ""
    created_by: str


class IdeaEvidenceResponse(BaseModel):
    id: str
    idea_id: str
    title: str
    description: str
    evidence_type: str
    url: str
    created_by: str
    created_at: str
    updated_at: str


class IdeaFollowResponse(BaseModel):
    id: str
    idea_id: str
    user_id: str
    created_at: str


class ActivityResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    description: str
    user_id: Optional[str]
    created_at: str


class IdeaTechnologyResponse(BaseModel):
    id: str
    idea_id: str
    technology: str
    created_at: str


class ReviewDimensionInput(BaseModel):
    dimension: str
    rating: str = ""
    comment: str = ""


class ReviewDimensionResponse(BaseModel):
    id: str
    review_id: str
    dimension: str
    rating: str
    comment: str
    created_at: str


class ReviewCreate(BaseModel):
    idea_id: str
    reviewer_id: str
    decision: str = "request_information"
    comments: str = ""
    reason: str = ""
    evidence: str = ""
    dimensions: list[ReviewDimensionInput] = []


class ReviewUpdate(BaseModel):
    decision: Optional[str] = None
    comments: Optional[str] = None
    reason: Optional[str] = None
    evidence: Optional[str] = None


class ReviewDecisionRequest(BaseModel):
    decision: str
    reviewer_id: str
    reason: str = ""
    evidence: str = ""
    comments: str = ""
    dimensions: list[ReviewDimensionInput] = []
    principal_engineer_id: Optional[str] = None
    manager_id: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    idea_id: str
    reviewer_id: str
    decision: str
    comments: str
    reason: str = ""
    evidence: str = ""
    dimensions: list[ReviewDimensionResponse] = []
    created_at: str
    updated_at: str


class ReviewQueueItemResponse(BaseModel):
    idea_id: str
    title: str
    founder_id: Optional[str] = None
    founder_name: str = ""
    business_area: str = ""
    technologies: list[str] = []
    status: str
    submitted_at: str = ""
    assigned_reviewer_id: Optional[str] = None
    assigned_reviewer_name: str = ""
    review_count: int = 0


class ReviewAssignmentCreate(BaseModel):
    idea_id: str
    reviewer_id: str


class ReviewAssignmentResponse(BaseModel):
    id: str
    idea_id: str
    reviewer_id: str
    status: str
    created_at: str
    updated_at: str


class ValidationSprintCreate(BaseModel):
    idea_id: str
    principal_engineer_id: Optional[str] = None
    manager_id: Optional[str] = None
    objectives: str = ""
    objectives_checklist: list[str] = []
    checklist: list[str] = []


class ValidationSprintUpdate(BaseModel):
    principal_engineer_id: Optional[str] = None
    manager_id: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    objectives: Optional[str] = None
    findings: Optional[str] = None
    objectives_checklist: Optional[list[str]] = None
    checklist: Optional[list[str]] = None
    decision: Optional[str] = None
    decision_reason: Optional[str] = None


class ValidationSprintResponse(BaseModel):
    id: str
    idea_id: str
    principal_engineer_id: Optional[str]
    manager_id: Optional[str]
    status: str
    start_date: Optional[str]
    end_date: Optional[str]
    objectives: str
    findings: str
    objectives_checklist: list[str] = []
    checklist: list[str] = []
    decision: Optional[str] = None
    decision_reason: str = ""
    created_at: str
    updated_at: str


class ValidationEvidenceCreate(BaseModel):
    evidence_type: str
    title: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    url: str = ""
    conclusion: str = ""
    created_by: Optional[str] = None


class ValidationEvidenceUpdate(BaseModel):
    evidence_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    conclusion: Optional[str] = None


class ValidationEvidenceResponse(BaseModel):
    id: str
    sprint_id: str
    evidence_type: str
    title: str
    description: str
    url: str
    conclusion: str
    created_by: Optional[str]
    created_at: str
    updated_at: str


class ValidationDecisionRequest(BaseModel):
    decision: str
    reason: str = ""


class InnovationCreate(BaseModel):
    idea_id: str
    summary: str = ""
    founder_id: Optional[str] = None
    principal_engineer_id: Optional[str] = None
    manager_id: Optional[str] = None


class InnovationUpdate(BaseModel):
    stage: Optional[str] = None
    is_open: Optional[bool] = None
    summary: Optional[str] = None
    principal_engineer_id: Optional[str] = None
    manager_id: Optional[str] = None


class InnovationResponse(BaseModel):
    id: str
    idea_id: str
    stage: str
    is_open: bool
    summary: str
    founder_id: Optional[str] = None
    principal_engineer_id: Optional[str] = None
    manager_id: Optional[str] = None
    created_at: str
    updated_at: str


class PositionCreate(BaseModel):
    innovation_id: str
    title: str
    role: str
    technology: str = ""
    capacity: int = 1


class PositionUpdate(BaseModel):
    title: Optional[str] = None
    role: Optional[str] = None
    technology: Optional[str] = None
    capacity: Optional[int] = None


class PositionResponse(BaseModel):
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


class ApplicationCreate(BaseModel):
    position_id: str
    user_id: str


class ApplicationResponse(BaseModel):
    id: str
    position_id: str
    user_id: str
    status: str
    created_at: str
    updated_at: str


class JoinRequestCreate(BaseModel):
    innovation_id: str
    user_id: str
    role: str = ""
    message: str = ""


class JoinRequestResponse(BaseModel):
    id: str
    innovation_id: str
    user_id: str
    role: str
    status: str
    message: str
    created_at: str
    updated_at: str


class TeamMembershipResponse(BaseModel):
    id: str
    innovation_id: str
    user_id: str
    role: str
    joined_at: str


class TeamCreate(BaseModel):
    name: str
    innovation_id: Optional[str] = None
    project_id: Optional[str] = None
    lead_id: Optional[str] = None
    member_ids: list[str] = []


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    lead_id: Optional[str] = None
    member_ids: Optional[list[str]] = None


class TeamResponse(BaseModel):
    id: str
    name: str
    innovation_id: Optional[str]
    project_id: Optional[str]
    lead_id: Optional[str]
    member_ids: list[str]
    created_at: str
    updated_at: str


class ProjectCreate(BaseModel):
    name: str
    innovation_id: Optional[str] = None
    team_id: Optional[str] = None
    description: str = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    team_id: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    innovation_id: Optional[str]
    team_id: Optional[str]
    description: str
    status: str
    created_at: str
    updated_at: str


class MilestoneCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    due_date: Optional[str] = None


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    completed_at: Optional[str] = None


class MilestoneResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    status: str
    due_date: Optional[str]
    completed_at: Optional[str]
    created_at: str
    updated_at: str


class WorkItemCreate(BaseModel):
    project_id: str
    milestone_id: Optional[str] = None
    title: str
    description: str = ""
    assignee_id: Optional[str] = None
    order_index: int = 0


class WorkItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[str] = None
    milestone_id: Optional[str] = None
    order_index: Optional[int] = None


class WorkItemResponse(BaseModel):
    id: str
    project_id: str
    milestone_id: Optional[str]
    title: str
    description: str
    status: str
    assignee_id: Optional[str]
    order_index: int
    created_at: str
    updated_at: str


class EvidenceCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    evidence_type: str = "document"
    url: str = ""
    created_by: str


class EvidenceResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    evidence_type: str
    url: str
    created_by: str
    created_at: str
    updated_at: str


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    message: str
    read: bool
    created_at: str


class FollowResponse(BaseModel):
    id: str
    innovation_id: str
    user_id: str
    created_at: str


class AuditEventResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    user_id: Optional[str]
    details: str
    created_at: str


class DashboardResponse(BaseModel):
    organization: Optional[OrganizationResponse]
    metrics: dict
    recent_activities: list[ActivityResponse]
    pipeline: dict
