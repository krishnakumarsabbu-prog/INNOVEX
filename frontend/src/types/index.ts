export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SetupStatus {
  setup_required: boolean;
  organization: Organization | null;
}

export interface SetupRequest {
  name: string;
  admin_name: string;
  admin_email: string;
}

export interface SetupResponse {
  organization: Organization;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string;
  department: string;
  skills: string[];
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  title: string;
  problem_statement: string;
  proposed_solution: string;
  business_impact: string;
  engineering_impact: string;
  expected_benefits: string;
  business_area: string;
  technologies: string[];
  dependencies: string;
  risks: string;
  estimated_complexity: string;
  estimated_duration: string;
  founder_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  organization_id: string | null;
}

export interface IdeaEvidence {
  id: string;
  idea_id: string;
  title: string;
  description: string;
  evidence_type: string;
  url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IdeaFollow {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
}

export interface ReviewDimension {
  id: string;
  review_id: string;
  dimension: string;
  rating: string;
  comment: string;
  created_at: string;
}

export interface Review {
  id: string;
  idea_id: string;
  reviewer_id: string;
  decision: string;
  comments: string;
  reason: string;
  evidence: string;
  dimensions: ReviewDimension[];
  created_at: string;
  updated_at: string;
}

export interface ReviewQueueItem {
  idea_id: string;
  title: string;
  founder_id: string | null;
  founder_name: string;
  business_area: string;
  technologies: string[];
  status: string;
  submitted_at: string;
  assigned_reviewer_id: string | null;
  assigned_reviewer_name: string;
  review_count: number;
}

export interface ReviewDecisionPayload {
  decision: string;
  reviewer_id: string;
  reason: string;
  evidence: string;
  comments: string;
  dimensions: { dimension: string; rating: string; comment: string }[];
  principal_engineer_id?: string | null;
  manager_id?: string | null;
}

export interface ValidationSprint {
  id: string;
  idea_id: string;
  principal_engineer_id: string | null;
  manager_id: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  objectives: string;
  findings: string;
  objectives_checklist: string[];
  checklist: string[];
  decision: string | null;
  decision_reason: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationEvidence {
  id: string;
  sprint_id: string;
  evidence_type: string;
  title: string;
  description: string;
  url: string;
  conclusion: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Innovation {
  id: string;
  idea_id: string;
  stage: string;
  is_open: boolean;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceRole {
  id: string;
  innovation_id: string;
  title: string;
  role: string;
  technology: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  capacity: number;
  filled: number;
  status: string;
  commitment: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceTeamMember {
  id: string;
  user_id: string;
  role: string;
  name: string;
  title: string;
  department: string;
  joined_at: string;
}

export interface MarketplaceInnovation {
  id: string;
  idea_id: string;
  stage: string;
  is_open: boolean;
  summary: string;
  founder_id: string | null;
  founder_name: string;
  principal_engineer_id: string | null;
  principal_engineer_name: string;
  manager_id: string | null;
  manager_name: string;
  title: string;
  problem_statement: string;
  business_impact: string;
  business_area: string;
  technologies: string[];
  team_size: number;
  team_progress: number;
  open_roles: MarketplaceRole[];
  followers: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceInnovationDetail extends MarketplaceInnovation {
  proposed_solution: string;
  engineering_impact: string;
  expected_benefits: string;
  dependencies: string;
  risks: string;
  estimated_complexity: string;
  estimated_duration: string;
  team_members: MarketplaceTeamMember[];
}

export interface Position {
  id: string;
  innovation_id: string;
  title: string;
  role: string;
  technology: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  capacity: number;
  filled: number;
  status: string;
  commitment: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  position_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface JoinRequest {
  id: string;
  innovation_id: string;
  user_id: string;
  role: string;
  role_id: string;
  status: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface SkillMatch {
  required_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  match_percentage: number;
}

export interface Team {
  id: string;
  name: string;
  innovation_id: string | null;
  project_id: string | null;
  lead_id: string | null;
  member_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  innovation_id: string | null;
  team_id: string | null;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  project_id: string;
  title: string;
  description: string;
  evidence_type: string;
  url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkItem {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string;
  status: string;
  assignee_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  user_id: string | null;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string | null;
  details: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Dashboard {
  organization: Organization | null;
  metrics: Record<string, number>;
  recent_activities: Activity[];
  pipeline: Record<string, number>;
}

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
}

export interface ChartDatum {
  name: string;
  value: number;
}

export interface TeamFormationMetrics {
  open_positions: number;
  filled_positions: number;
  total_teams: number;
  team_members: number;
  join_requests_pending: number;
  innovations_with_teams: number;
}

export interface AdoptionMetrics {
  adopted: number;
  production_candidates: number;
  demos: number;
  pocs_completed: number;
  adoption_rate: number;
}

export interface InsightsOverview {
  metrics: {
    ideas_submitted: number;
    under_review: number;
    in_validation: number;
    approved: number;
    team_forming: number;
    building: number;
    pocs_completed: number;
    production_candidates: number;
    adopted: number;
  };
  innovation_funnel: FunnelStage[];
  ideas_by_business_area: ChartDatum[];
  ideas_by_technology: ChartDatum[];
  team_formation_metrics: TeamFormationMetrics;
  adoption_metrics: AdoptionMetrics;
  recent_activity: Activity[];
}

export interface AIRecommendation {
  capability: string;
  recommendation: string;
  reason: string;
  evidence: string;
  confidence: number;
  created_at: string;
  items: Record<string, unknown>[];
}

export interface AIContextCapability {
  capability: string;
  label: string;
}

export interface AICapabilities {
  idea: string[];
  review: string[];
  validation: string[];
  team: string[];
  engineering: string[];
}

export type AIEntityType = 'idea' | 'review' | 'validation' | 'innovation' | 'project';

export interface ApiError {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}

// ---- Administration & Governance ----

export interface TechnologyTaxonomyItem {
  id: string;
  name: string;
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessArea {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewPanel {
  id: string;
  name: string;
  description: string;
  member_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  stages: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Policy {
  id: string;
  key: string;
  name: string;
  description: string;
  value: string;
  policy_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleDefinition {
  key: string;
  label: string;
}
