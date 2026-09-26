import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MessageSquare, CheckCircle, AlertCircle, Send, Pause, RotateCcw,
  Star, StarOff, FileText, Activity as ActivityIcon, Plus,
} from 'lucide-react';
import { ideaApi, userApi, validationApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { Loading, ErrorState, StatusBadge, Modal, EmptyState } from '../components/ui';
import type { User } from '../types';

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showReview, setShowReview] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [actionError, setActionError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  const { data: idea, isLoading, isError } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => ideaApi.getById(id!),
    enabled: !!id,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  const { data: reviews } = useQuery({
    queryKey: ['idea-reviews', id],
    queryFn: () => ideaApi.getReviews(id!),
    enabled: !!id,
  });

  const { data: validation } = useQuery({
    queryKey: ['idea-validation', id],
    queryFn: () => validationApi.getByIdea(id!),
    enabled: !!id,
  });

  const { data: activities } = useQuery({
    queryKey: ['idea-activity', id],
    queryFn: () => ideaApi.getActivity(id!),
    enabled: !!id,
  });

  const { data: evidence } = useQuery({
    queryKey: ['idea-evidence', id],
    queryFn: () => ideaApi.getEvidence(id!),
    enabled: !!id,
  });

  const userMap = new Map<string, User>();
  users?.forEach((u) => userMap.set(u.id, u));

  const submitMutation = useMutation({
    mutationFn: () => ideaApi.submit(id!, currentUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea-activity', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed to submit'),
  });

  const parkMutation = useMutation({
    mutationFn: () => ideaApi.park(id!, currentUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea-activity', id] });
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed to park idea'),
  });

  const reopenMutation = useMutation({
    mutationFn: () => ideaApi.reopen(id!, currentUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea-activity', id] });
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed to reopen idea'),
  });

  const followMutation = useMutation({
    mutationFn: () => ideaApi.follow(id!, currentUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['idea-activity', id] }),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => ideaApi.unfollow(id!, currentUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['idea-activity', id] }),
  });

  if (isLoading) return <Loading />;
  if (isError || !idea) return <ErrorState message="Failed to load idea" />;

  const founder = userMap.get(idea.founder_id || '');
  const canSubmit = idea.status === 'draft';
  const canPark = idea.status !== 'parked' && idea.status !== 'rejected' && idea.status !== 'draft';
  const canReopen = idea.status === 'parked' || idea.status === 'rejected';

  return (
    <div>
      <Link to="/ideas" className="flex items-center gap-1 text-sm text-enterprise-charcoal/60 hover:text-enterprise-charcoal mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Ideas
      </Link>

      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center justify-between">
          {actionError}
          <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-enterprise-charcoal">{idea.title}</h1>
            <p className="text-sm text-enterprise-charcoal/50 mt-1">
              Submitted by {founder?.name || 'Unknown'} on {new Date(idea.created_at).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={idea.status} />
        </div>

        <div className="space-y-4">
          {idea.problem_statement && (
            <DetailSection label="Problem Statement" content={idea.problem_statement} />
          )}
          {idea.proposed_solution && (
            <DetailSection label="Proposed Solution" content={idea.proposed_solution} />
          )}
          {idea.business_impact && (
            <DetailSection label="Business Impact" content={idea.business_impact} />
          )}
          {idea.engineering_impact && (
            <DetailSection label="Engineering Impact" content={idea.engineering_impact} />
          )}
          {idea.expected_benefits && (
            <DetailSection label="Expected Benefits" content={idea.expected_benefits} />
          )}
          {idea.business_area && (
            <div className="flex items-center gap-3 pt-2 border-t border-enterprise-gray-border">
              <span className="text-sm font-semibold text-enterprise-charcoal/70">Business Area:</span>
              <span className="badge bg-blue-100 text-blue-800">{idea.business_area}</span>
            </div>
          )}
          {idea.technologies && idea.technologies.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-enterprise-charcoal/70 mb-1">Technologies</h3>
              <div className="flex flex-wrap gap-1">
                {idea.technologies.map((t) => (
                  <span key={t} className="badge bg-blue-50 text-blue-700">{t}</span>
                ))}
              </div>
            </div>
          )}
          {idea.dependencies && (
            <DetailSection label="Dependencies" content={idea.dependencies} />
          )}
          {idea.risks && (
            <DetailSection label="Risks" content={idea.risks} />
          )}
          {(idea.estimated_complexity || idea.estimated_duration) && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-enterprise-gray-border">
              {idea.estimated_complexity && (
                <div>
                  <span className="text-sm font-semibold text-enterprise-charcoal/70">Complexity:</span>
                  <p className="text-sm text-enterprise-charcoal">{idea.estimated_complexity}</p>
                </div>
              )}
              {idea.estimated_duration && (
                <div>
                  <span className="text-sm font-semibold text-enterprise-charcoal/70">Duration:</span>
                  <p className="text-sm text-enterprise-charcoal">{idea.estimated_duration}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-enterprise-gray-border">
          <select
            value={currentUserId}
            onChange={(e) => setCurrentUserId(e.target.value)}
            className="input max-w-[200px] py-1.5 text-sm"
          >
            <option value="">Acting as...</option>
            {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {canSubmit && (
            <button
              onClick={() => submitMutation.mutate()}
              className="btn-primary text-sm"
              disabled={!currentUserId || submitMutation.isPending}
            >
              <Send className="w-4 h-4" /> Submit for Review
            </button>
          )}
          {canPark && (
            <button
              onClick={() => parkMutation.mutate()}
              className="btn-secondary text-sm"
              disabled={!currentUserId || parkMutation.isPending}
            >
              <Pause className="w-4 h-4" /> Park
            </button>
          )}
          {canReopen && (
            <button
              onClick={() => reopenMutation.mutate()}
              className="btn-secondary text-sm"
              disabled={!currentUserId || reopenMutation.isPending}
            >
              <RotateCcw className="w-4 h-4" /> Reopen
            </button>
          )}
          {currentUserId && (
            <button
              onClick={() => followMutation.mutate()}
              className="btn-secondary text-sm"
              disabled={followMutation.isPending}
            >
              <Star className="w-4 h-4" /> Follow
            </button>
          )}
          <button
            onClick={() => setShowReview(true)}
            className="btn-secondary text-sm ml-auto"
          >
            <MessageSquare className="w-4 h-4" /> Add Review
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity */}
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-enterprise-charcoal/50" /> Activity
          </h2>
          {activities && activities.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-enterprise-gray-warm transition-colors">
                  <div className="w-2 h-2 rounded-full bg-enterprise-red mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-enterprise-charcoal">{a.description}</p>
                    <p className="text-xs text-enterprise-charcoal/40 mt-0.5">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<ActivityIcon className="w-6 h-6" />} title="No activity yet" message="Activity will appear here as the idea progresses." />
          )}
        </div>

        {/* Evidence */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <FileText className="w-5 h-5 text-enterprise-charcoal/50" /> Evidence
            </h2>
            <button className="btn-secondary text-sm" onClick={() => setShowEvidence(true)}>
              <Plus className="w-4 h-4" /> Add Evidence
            </button>
          </div>
          {evidence && evidence.length > 0 ? (
            <div className="space-y-2">
              {evidence.map((e) => (
                <div key={e.id} className="border border-enterprise-gray-border rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{e.title}</span>
                    <span className="badge bg-gray-100 text-gray-600 text-xs">{e.evidence_type}</span>
                  </div>
                  {e.description && <p className="text-sm text-enterprise-charcoal/70">{e.description}</p>}
                  {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-xs text-enterprise-red hover:underline mt-1 inline-block">{e.url}</a>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<FileText className="w-6 h-6" />} title="No evidence yet" message="Add supporting evidence to strengthen your idea." />
          )}
        </div>

        {/* Reviews */}
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-enterprise-charcoal/50" /> Reviews
          </h2>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => {
                const reviewer = userMap.get(review.reviewer_id);
                return (
                  <div key={review.id} className="border border-enterprise-gray-border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{reviewer?.name || 'Unknown'}</span>
                      <StatusBadge status={review.decision} />
                    </div>
                    {review.comments && <p className="text-sm text-enterprise-charcoal/70">{review.comments}</p>}
                    <p className="text-xs text-enterprise-charcoal/40 mt-1">{new Date(review.created_at).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<MessageSquare className="w-6 h-6" />} title="No reviews yet" message="Reviews from the innovation panel will appear here." />
          )}
        </div>

        {/* Validation Sprint */}
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-enterprise-charcoal/50" /> Validation Sprint
          </h2>
          {validation ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-enterprise-charcoal/70">Status</span>
                <StatusBadge status={validation.status} />
              </div>
              {validation.principal_engineer_id && (
                <div>
                  <span className="text-sm text-enterprise-charcoal/70">Principal Engineer</span>
                  <p className="text-sm font-medium">{userMap.get(validation.principal_engineer_id)?.name || 'Unassigned'}</p>
                </div>
              )}
              {validation.manager_id && (
                <div>
                  <span className="text-sm text-enterprise-charcoal/70">Manager</span>
                  <p className="text-sm font-medium">{userMap.get(validation.manager_id)?.name || 'Unassigned'}</p>
                </div>
              )}
              {validation.decision && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-enterprise-charcoal/70">Decision</span>
                  <StatusBadge status={validation.decision} />
                </div>
              )}
              <Link to={`/ideas/${id}/validation`} className="btn-secondary text-sm w-full text-center block mt-2">
                Open Validation Sprint
              </Link>
            </div>
          ) : (
            <EmptyState icon={<AlertCircle className="w-6 h-6" />} title="No validation sprint" message="A validation sprint can be started once the idea is sent to validation." />
          )}
        </div>
      </div>

      {showReview && users && (
        <ReviewModal ideaId={idea.id} users={users} onClose={() => setShowReview(false)} />
      )}
      {showEvidence && (
        <EvidenceModal ideaId={idea.id} users={users || []} onClose={() => setShowEvidence(false)} />
      )}
    </div>
  );
}

function DetailSection({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-enterprise-charcoal/70 mb-1">{label}</h3>
      <p className="text-sm text-enterprise-charcoal whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function ReviewModal({ ideaId, users, onClose }: { ideaId: string; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { reviewer_id: '', decision: 'approve', comments: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => ideaApi.createReview(ideaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea-reviews', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Add Review">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Reviewer</label>
          <select {...register('reviewer_id', { required: 'Required' })} className="input">
            <option value="">Select reviewer...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {errors.reviewer_id && <p className="text-xs text-red-600 mt-1">{errors.reviewer_id.message as string}</p>}
        </div>
        <div>
          <label className="label">Decision</label>
          <select {...register('decision')} className="input">
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="park">Park</option>
            <option value="send_to_validation">Send to Validation</option>
            <option value="request_information">Request More Info</option>
          </select>
        </div>
        <div>
          <label className="label">Comments</label>
          <textarea {...register('comments')} className="input min-h-[80px]" placeholder="Review comments" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EvidenceModal({ ideaId, users, onClose }: { ideaId: string; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { title: '', description: '', evidence_type: 'document', url: '', created_by: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => ideaApi.addEvidence(ideaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea-evidence', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['idea-activity', ideaId] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Add Evidence">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Title <span className="text-red-500">*</span></label>
          <input {...register('title', { required: 'Title is required' })} className="input" placeholder="Evidence title" />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message as string}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} className="input min-h-[60px]" placeholder="Describe this evidence" />
        </div>
        <div>
          <label className="label">Type</label>
          <select {...register('evidence_type')} className="input">
            <option value="document">Document</option>
            <option value="link">Link</option>
            <option value="diagram">Diagram</option>
            <option value="prototype">Prototype</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">URL</label>
          <input {...register('url')} className="input" placeholder="https://..." />
        </div>
        <div>
          <label className="label">Added By <span className="text-red-500">*</span></label>
          <select {...register('created_by', { required: 'Required' })} className="input">
            <option value="">Select user...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {errors.created_by && <p className="text-xs text-red-600 mt-1">{errors.created_by.message as string}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding...' : 'Add Evidence'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
