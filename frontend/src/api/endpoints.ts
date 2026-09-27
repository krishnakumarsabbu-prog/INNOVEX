import { api } from './client';
import type {
  SetupStatus, SetupRequest, SetupResponse, User, Skill, Idea, IdeaEvidence, IdeaFollow, Review,
  ReviewDimension, ReviewQueueItem, ReviewDecisionPayload,
  ValidationSprint, ValidationEvidence, Innovation, Position, Application, Team, Project,
  Milestone, Evidence, Activity, AuditEvent, Notification, Dashboard, WorkItem,
  MarketplaceInnovation, MarketplaceInnovationDetail,
  JoinRequest, SkillMatch, InsightsOverview,
  AIRecommendation, AIContextCapability, AICapabilities, AIEntityType,
  TechnologyTaxonomyItem, BusinessArea, ReviewPanel, Workflow, Policy, RoleDefinition,
} from '../types';

export const setupApi = {
  getStatus: () => api.get<SetupStatus>('/setup/status').then(r => r.data),
  createOrganization: (data: SetupRequest) => api.post<SetupResponse>('/setup/organization', data).then(r => r.data),
};

export const peopleApi = {
  getAll: (params?: { role?: string; skill?: string; technology?: string; organization_id?: string; business_area?: string; search?: string }) =>
    api.get<User[]>('/people', { params }).then(r => r.data),
  getById: (id: string) => api.get<User>(`/people/${id}`).then(r => r.data),
  create: (data: Partial<User>) => api.post<User>('/people', data).then(r => r.data),
  update: (id: string, data: Partial<User>) => api.patch<User>(`/people/${id}`, data).then(r => r.data),
};

export const userApi = {
  getAll: (params?: { search?: string; role?: string }) => api.get<User[]>('/users', { params }).then(r => r.data),
  getById: (id: string) => api.get<User>(`/users/${id}`).then(r => r.data),
  create: (data: Partial<User>) => api.post<User>('/users', data).then(r => r.data),
  update: (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(r => r.data),
};

export const ideaApi = {
  getAll: (params?: { search?: string; status?: string; technology?: string; business_area?: string; founder_id?: string }) =>
    api.get<Idea[]>('/ideas', { params }).then(r => r.data),
  getById: (id: string) => api.get<Idea>(`/ideas/${id}`).then(r => r.data),
  create: (data: Partial<Idea>) => api.post<Idea>('/ideas', data).then(r => r.data),
  update: (id: string, data: Partial<Idea>) => api.patch<Idea>(`/ideas/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/ideas/${id}`).then(r => r.data),
  submit: (id: string, userId: string) => api.post<Idea>(`/ideas/${id}/submit`, { user_id: userId }).then(r => r.data),
  park: (id: string, userId: string) => api.post<Idea>(`/ideas/${id}/park`, { user_id: userId }).then(r => r.data),
  reopen: (id: string, userId: string) => api.post<Idea>(`/ideas/${id}/reopen`, { user_id: userId }).then(r => r.data),
  getActivity: (id: string) => api.get<Activity[]>(`/ideas/${id}/activity`).then(r => r.data),
  getEvidence: (id: string) => api.get<IdeaEvidence[]>(`/ideas/${id}/evidence`).then(r => r.data),
  addEvidence: (id: string, data: Partial<IdeaEvidence>) => api.post<IdeaEvidence>(`/ideas/${id}/evidence`, data).then(r => r.data),
  follow: (id: string, userId: string) => api.post<IdeaFollow>(`/ideas/${id}/follow`, { user_id: userId }).then(r => r.data),
  unfollow: (id: string, userId: string) => api.delete(`/ideas/${id}/follow`, { data: { user_id: userId } }).then(r => r.data),
  createReview: (ideaId: string, data: Partial<Review>) => api.post(`/ideas/${ideaId}/reviews`, data).then(r => r.data),
  getReviews: (ideaId: string) => api.get<Review[]>(`/ideas/${ideaId}/reviews`).then(r => r.data),
};

export const reviewApi = {
  getQueue: () => api.get<ReviewQueueItem[]>('/reviews/queue').then(r => r.data),
  createReview: (ideaId: string, data: Partial<Review> & { dimensions?: { dimension: string; rating: string; comment: string }[] }) =>
    api.post<Review>(`/reviews/ideas/${ideaId}`, data).then(r => r.data),
  getReviews: (ideaId: string) => api.get<Review[]>(`/reviews/ideas/${ideaId}`).then(r => r.data),
  makeDecision: (ideaId: string, reviewId: string, data: ReviewDecisionPayload) =>
    api.post<Review>(`/reviews/ideas/${ideaId}/reviews/${reviewId}/decision`, data).then(r => r.data),
};

export const validationApi = {
  getByIdea: (ideaId: string) => api.get<ValidationSprint | null>(`/ideas/${ideaId}/validation`).then(r => r.data),
  create: (ideaId: string, data: Partial<ValidationSprint>) => api.post<ValidationSprint>(`/ideas/${ideaId}/validation`, data).then(r => r.data),
  update: (ideaId: string, data: Partial<ValidationSprint>) => api.patch<ValidationSprint>(`/ideas/${ideaId}/validation`, data).then(r => r.data),
  getEvidence: (ideaId: string) => api.get<ValidationEvidence[]>(`/ideas/${ideaId}/validation/evidence`).then(r => r.data),
  createEvidence: (ideaId: string, data: Partial<ValidationEvidence>) => api.post<ValidationEvidence>(`/ideas/${ideaId}/validation/evidence`, data).then(r => r.data),
  updateEvidence: (ideaId: string, evidenceId: string, data: Partial<ValidationEvidence>) => api.put<ValidationEvidence>(`/ideas/${ideaId}/validation/evidence/${evidenceId}`, data).then(r => r.data),
  deleteEvidence: (ideaId: string, evidenceId: string) => api.delete(`/ideas/${ideaId}/validation/evidence/${evidenceId}`).then(r => r.data),
  makeDecision: (ideaId: string, data: { decision: string; reason: string }) => api.post<ValidationSprint>(`/ideas/${ideaId}/validation/decision`, data).then(r => r.data),
};

export const innovationApi = {
  getAll: (openOnly?: boolean) => api.get<MarketplaceInnovation[]>('/innovations', { params: { open_only: openOnly } }).then(r => r.data),
  getById: (id: string) => api.get<MarketplaceInnovationDetail>(`/innovations/${id}`).then(r => r.data),
  create: (data: Partial<Innovation>) => api.post<MarketplaceInnovationDetail>('/innovations', data).then(r => r.data),
  createFromIdea: (ideaId: string, data: Partial<Innovation>) => api.post<MarketplaceInnovationDetail>(`/ideas/${ideaId}/innovation`, data).then(r => r.data),
  update: (id: string, data: Partial<Innovation>) => api.put<Innovation>(`/innovations/${id}`, data).then(r => r.data),
  patch: (id: string, data: Partial<Innovation>) => api.patch<MarketplaceInnovationDetail>(`/innovations/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/innovations/${id}`).then(r => r.data),
  getPositions: (innovationId: string) => api.get<Position[]>(`/innovations/${innovationId}/positions`).then(r => r.data),
  createPosition: (innovationId: string, data: Partial<Position>) => api.post<Position>(`/innovations/${innovationId}/positions`, data).then(r => r.data),
  updatePosition: (positionId: string, data: Partial<Position>) => api.put<Position>(`/innovations/positions/${positionId}`, data).then(r => r.data),
  deletePosition: (positionId: string) => api.delete(`/innovations/positions/${positionId}`).then(r => r.data),
  applyForPosition: (positionId: string, data: { user_id: string }) => api.post<Application>(`/innovations/positions/${positionId}/apply`, data).then(r => r.data),
  getApplications: (positionId: string) => api.get<Application[]>(`/innovations/positions/${positionId}/applications`).then(r => r.data),
  getOpenPositions: () => api.get<Position[]>('/innovations/positions/open').then(r => r.data),
  joinInnovation: (innovationId: string, data: { user_id: string; role: string; message: string }) =>
    api.post(`/innovations/${innovationId}/join-requests`, data).then(r => r.data),
  getRoles: (innovationId: string) => api.get<Position[]>(`/innovations/${innovationId}/roles`).then(r => r.data),
  createRole: (innovationId: string, data: Partial<Position>) => api.post<Position>(`/innovations/${innovationId}/roles`, data).then(r => r.data),
  patchRole: (innovationId: string, roleId: string, data: Partial<Position>) => api.patch<Position>(`/innovations/${innovationId}/roles/${roleId}`, data).then(r => r.data),
  getSkillMatch: (innovationId: string, roleId: string, userId: string) =>
    api.get<SkillMatch>(`/innovations/${innovationId}/roles/${roleId}/skill-match`, { params: { user_id: userId } }).then(r => r.data),
  requestJoinRole: (innovationId: string, roleId: string, data: { user_id: string; role: string; message: string }) =>
    api.post<JoinRequest>(`/innovations/${innovationId}/roles/${roleId}/join-request`, data).then(r => r.data),
  getJoinRequests: (innovationId: string) => api.get<JoinRequest[]>(`/innovations/${innovationId}/join-requests`).then(r => r.data),
  approveJoinRequest: (requestId: string) => api.post<JoinRequest>(`/innovations/join-requests/${requestId}/approve`).then(r => r.data),
  declineJoinRequest: (requestId: string) => api.post<JoinRequest>(`/innovations/join-requests/${requestId}/decline`).then(r => r.data),
  getTeam: (innovationId: string) => api.get(`/innovations/${innovationId}/team`).then(r => r.data),
  follow: (innovationId: string, userId: string) => api.post(`/innovations/${innovationId}/follow?user_id=${userId}`).then(r => r.data),
  unfollow: (innovationId: string, userId: string) => api.delete(`/innovations/${innovationId}/follow?user_id=${userId}`).then(r => r.data),
  getFollowers: (innovationId: string) => api.get(`/innovations/${innovationId}/followers`).then(r => r.data),
  getFollowerCount: (innovationId: string) => api.get<{ count: number }>(`/innovations/${innovationId}/followers/count`).then(r => r.data),
};

export const teamApi = {
  getAll: () => api.get<Team[]>('/teams').then(r => r.data),
  getById: (id: string) => api.get<Team>(`/teams/${id}`).then(r => r.data),
  create: (data: Partial<Team>) => api.post<Team>('/teams', data).then(r => r.data),
  update: (id: string, data: Partial<Team>) => api.put<Team>(`/teams/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/teams/${id}`).then(r => r.data),
  addMember: (teamId: string, userId: string) => api.post<Team>(`/teams/${teamId}/members/${userId}`).then(r => r.data),
  removeMember: (teamId: string, userId: string) => api.delete<Team>(`/teams/${teamId}/members/${userId}`).then(r => r.data),
};

export const projectApi = {
  getAll: () => api.get<Project[]>('/projects').then(r => r.data),
  getById: (id: string) => api.get<Project>(`/projects/${id}`).then(r => r.data),
  create: (data: Partial<Project>) => api.post<Project>('/projects', data).then(r => r.data),
  createForInnovation: (innovationId: string, data: Partial<Project>) => api.post<Project>(`/innovations/${innovationId}/project`, data).then(r => r.data),
  update: (id: string, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data).then(r => r.data),
  patch: (id: string, data: Partial<Project>) => api.patch<Project>(`/projects/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`).then(r => r.data),
  getMilestones: (projectId: string) => api.get<Milestone[]>(`/projects/${projectId}/milestones`).then(r => r.data),
  createMilestone: (projectId: string, data: Partial<Milestone>) => api.post<Milestone>(`/projects/${projectId}/milestones`, data).then(r => r.data),
  updateMilestone: (milestoneId: string, data: Partial<Milestone>) => api.put<Milestone>(`/milestones/${milestoneId}`, data).then(r => r.data),
  patchMilestone: (projectId: string, milestoneId: string, data: Partial<Milestone>) => api.patch<Milestone>(`/projects/${projectId}/milestones/${milestoneId}`, data).then(r => r.data),
  deleteMilestone: (milestoneId: string) => api.delete(`/milestones/${milestoneId}`).then(r => r.data),
  getWorkItems: (projectId: string) => api.get<WorkItem[]>(`/projects/${projectId}/work-items`).then(r => r.data),
  createWorkItem: (projectId: string, data: Partial<WorkItem>) => api.post<WorkItem>(`/projects/${projectId}/work-items`, data).then(r => r.data),
  patchWorkItem: (projectId: string, workItemId: string, data: Partial<WorkItem>) => api.patch<WorkItem>(`/projects/${projectId}/work-items/${workItemId}`, data).then(r => r.data),
  deleteWorkItem: (workItemId: string) => api.delete(`/work-items/${workItemId}`).then(r => r.data),
  getEvidence: (projectId: string) => api.get<Evidence[]>(`/projects/${projectId}/evidence`).then(r => r.data),
  createEvidence: (projectId: string, data: Partial<Evidence>) => api.post<Evidence>(`/projects/${projectId}/evidence`, data).then(r => r.data),
  deleteEvidence: (evidenceId: string) => api.delete(`/evidence/${evidenceId}`).then(r => r.data),
  getActivities: (projectId: string) => api.get<Activity[]>(`/projects/${projectId}/activities`).then(r => r.data),
};

export const notificationApi = {
  getAll: () => api.get<Notification[]>('/notifications').then(r => r.data),
  getByUser: (userId: string) => api.get<Notification[]>(`/notifications/user/${userId}`).then(r => r.data),
  getUnreadCount: (userId: string) => api.get<{ count: number }>(`/notifications/user/${userId}/unread-count`).then(r => r.data),
  markAsRead: (notifId: string) => api.post(`/notifications/${notifId}/read`).then(r => r.data),
  markAllRead: (userId: string) => api.post(`/notifications/read-all`, { user_id: userId }).then(r => r.data),
  delete: (notifId: string) => api.delete(`/notifications/${notifId}`).then(r => r.data),
};

export const activityApi = {
  getAll: (params?: { entity?: string; entity_id?: string; actor?: string; date_from?: string; date_to?: string }) =>
    api.get<Activity[]>('/activity', { params }).then(r => r.data),
  getByEntity: (entityType: string, entityId: string) => api.get<Activity[]>(`/activities/${entityType}/${entityId}`).then(r => r.data),
};

export const auditApi = {
  getAll: (params?: { entity?: string; entity_id?: string; actor?: string; date_from?: string; date_to?: string }) =>
    api.get<AuditEvent[]>('/audit', { params }).then(r => r.data),
  getByEntity: (entityType: string, entityId: string) => api.get<AuditEvent[]>(`/audit-events/${entityType}/${entityId}`).then(r => r.data),
};

export const dashboardApi = {
  get: () => api.get<Dashboard>('/dashboard').then(r => r.data),
};

export const insightsApi = {
  getOverview: () => api.get<InsightsOverview>('/insights/overview').then(r => r.data),
};

export const copilotApi = {
  getCapabilities: () => api.get<AICapabilities>('/ai/capabilities').then(r => r.data),
  getContextCapabilities: (entityType: AIEntityType, entityId: string) =>
    api.get<AIContextCapability[]>(`/ai/context/${entityType}/${entityId}`).then(r => r.data),
  analyze: (capability: string, entityType: AIEntityType, entityId: string) =>
    api.post<AIRecommendation[]>('/ai/analyze', {
      capability,
      entity_type: entityType,
      entity_id: entityId,
    }).then(r => r.data),
};

export const adminApi = {
  getOrganization: () => api.get<{ id: string; name: string; created_at: string; updated_at: string }>('/administration/organization').then(r => r.data),
  updateOrganization: (orgId: string, name: string) => api.put('/administration/organization/' + orgId, { name }).then(r => r.data),
  getRoles: () => api.get<RoleDefinition[]>('/administration/roles').then(r => r.data),
  getTechnologies: () => api.get<TechnologyTaxonomyItem[]>('/administration/technologies').then(r => r.data),
  createTechnology: (data: { name: string; category: string; description: string }) => api.post<TechnologyTaxonomyItem>('/administration/technologies', data).then(r => r.data),
  updateTechnology: (id: string, data: Partial<TechnologyTaxonomyItem>) => api.put<TechnologyTaxonomyItem>(`/administration/technologies/${id}`, data).then(r => r.data),
  deleteTechnology: (id: string) => api.delete(`/administration/technologies/${id}`).then(r => r.data),
  getBusinessAreas: () => api.get<BusinessArea[]>('/administration/business-areas').then(r => r.data),
  createBusinessArea: (data: { name: string; description: string }) => api.post<BusinessArea>('/administration/business-areas', data).then(r => r.data),
  updateBusinessArea: (id: string, data: Partial<BusinessArea>) => api.put<BusinessArea>(`/administration/business-areas/${id}`, data).then(r => r.data),
  deleteBusinessArea: (id: string) => api.delete(`/administration/business-areas/${id}`).then(r => r.data),
  getReviewPanels: () => api.get<ReviewPanel[]>('/administration/review-panels').then(r => r.data),
  createReviewPanel: (data: { name: string; description: string; member_ids: string[] }) => api.post<ReviewPanel>('/administration/review-panels', data).then(r => r.data),
  updateReviewPanel: (id: string, data: Partial<ReviewPanel>) => api.put<ReviewPanel>(`/administration/review-panels/${id}`, data).then(r => r.data),
  deleteReviewPanel: (id: string) => api.delete(`/administration/review-panels/${id}`).then(r => r.data),
  getWorkflows: () => api.get<Workflow[]>('/administration/workflows').then(r => r.data),
  createWorkflow: (data: { name: string; description: string; stages: string[] }) => api.post<Workflow>('/administration/workflows', data).then(r => r.data),
  updateWorkflow: (id: string, data: Partial<Workflow>) => api.put<Workflow>(`/administration/workflows/${id}`, data).then(r => r.data),
  deleteWorkflow: (id: string) => api.delete(`/administration/workflows/${id}`).then(r => r.data),
  getPolicies: () => api.get<Policy[]>('/administration/policies').then(r => r.data),
  updatePolicy: (id: string, data: { value?: string; is_active?: boolean }) => api.put<Policy>(`/administration/policies/${id}`, data).then(r => r.data),
};

export const skillApi = {
  getAll: (category?: string) => api.get<Skill[]>('/skills', { params: { category } }).then(r => r.data),
  getById: (id: string) => api.get<Skill>(`/skills/${id}`).then(r => r.data),
  create: (data: { name: string; category?: string }) => api.post<Skill>('/skills', data).then(r => r.data),
  update: (id: string, data: { name: string; category?: string }) => api.put<Skill>(`/skills/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/skills/${id}`).then(r => r.data),
};

export const uploadApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string; filename: string; size: number; content_type: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};
