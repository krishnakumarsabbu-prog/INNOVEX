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

export interface Review {
  id: string;
  idea_id: string;
  reviewer_id: string;
  decision: string;
  comments: string;
  created_at: string;
  updated_at: string;
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

export interface Position {
  id: string;
  innovation_id: string;
  title: string;
  role: string;
  technology: string;
  capacity: number;
  filled: number;
  status: string;
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

export interface Activity {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  user_id: string | null;
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

export interface ApiError {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}
