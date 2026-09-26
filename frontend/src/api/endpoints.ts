import { api } from './client';
import type {
  SetupStatus, SetupRequest, SetupResponse, User, Idea, IdeaEvidence, IdeaFollow, Review,
  ReviewDimension, ReviewQueueItem, ReviewDecisionPayload,
  ValidationSprint, ValidationEvidence, Innovation, Position, Application, Team, Project,
  Milestone, Evidence, Activity, Notification, Dashboard,
} from '../types';

export const setupApi = {
  getStatus: () => api.get<SetupStatus>('/setup/status').then(r => r.data),
  createOrganization: (data: SetupRequest) => api.post<SetupResponse>('/setup/organization', data).then(r => r.data),
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
  getAll: (openOnly?: boolean) => api.get<Innovation[]>('/innovations', { params: { open_only: openOnly } }).then(r => r.data),
  getById: (id: string) => api.get<Innovation>(`/innovations/${id}`).then(r => r.data),
  create: (data: Partial<Innovation>) => api.post<Innovation>('/innovations', data).then(r => r.data),
  update: (id: string, data: Partial<Innovation>) => api.put<Innovation>(`/innovations/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/innovations/${id}`).then(r => r.data),
  getPositions: (innovationId: string) => api.get<Position[]>(`/innovations/${innovationId}/positions`).then(r => r.data),
  createPosition: (innovationId: string, data: Partial<Position>) => api.post<Position>(`/innovations/${innovationId}/positions`, data).then(r => r.data),
  updatePosition: (positionId: string, data: Partial<Position>) => api.put<Position>(`/innovations/positions/${positionId}`, data).then(r => r.data),
  deletePosition: (positionId: string) => api.delete(`/innovations/positions/${positionId}`).then(r => r.data),
  applyForPosition: (positionId: string, data: { user_id: string }) => api.post<Application>(`/innovations/positions/${positionId}/apply`, data).then(r => r.data),
  getApplications: (positionId: string) => api.get<Application[]>(`/innovations/positions/${positionId}/applications`).then(r => r.data),
  getOpenPositions: () => api.get<Position[]>('/innovations/positions/open').then(r => r.data),
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
  update: (id: string, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`).then(r => r.data),
  getMilestones: (projectId: string) => api.get<Milestone[]>(`/projects/${projectId}/milestones`).then(r => r.data),
  createMilestone: (projectId: string, data: Partial<Milestone>) => api.post<Milestone>(`/projects/${projectId}/milestones`, data).then(r => r.data),
  updateMilestone: (milestoneId: string, data: Partial<Milestone>) => api.put<Milestone>(`/milestones/${milestoneId}`, data).then(r => r.data),
  deleteMilestone: (milestoneId: string) => api.delete(`/milestones/${milestoneId}`).then(r => r.data),
  getEvidence: (projectId: string) => api.get<Evidence[]>(`/projects/${projectId}/evidence`).then(r => r.data),
  createEvidence: (projectId: string, data: Partial<Evidence>) => api.post<Evidence>(`/projects/${projectId}/evidence`, data).then(r => r.data),
  deleteEvidence: (evidenceId: string) => api.delete(`/evidence/${evidenceId}`).then(r => r.data),
};

export const notificationApi = {
  getAll: () => api.get<Notification[]>('/notifications').then(r => r.data),
  getByUser: (userId: string) => api.get<Notification[]>(`/notifications/user/${userId}`).then(r => r.data),
  getUnreadCount: (userId: string) => api.get<{ count: number }>(`/notifications/user/${userId}/unread-count`).then(r => r.data),
  markAsRead: (notifId: string) => api.put(`/notifications/${notifId}/read`).then(r => r.data),
  markAllRead: (userId: string) => api.put(`/notifications/user/${userId}/read-all`).then(r => r.data),
  delete: (notifId: string) => api.delete(`/notifications/${notifId}`).then(r => r.data),
};

export const activityApi = {
  getAll: () => api.get<Activity[]>('/activities').then(r => r.data),
  getByEntity: (entityType: string, entityId: string) => api.get<Activity[]>(`/activities/${entityType}/${entityId}`).then(r => r.data),
};

export const dashboardApi = {
  get: () => api.get<Dashboard>('/dashboard').then(r => r.data),
};
