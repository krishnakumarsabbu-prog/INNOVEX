import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ideaApi, userApi, validationApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { Loading, ErrorState, StatusBadge, Modal, EmptyState } from '../components/ui';
import type { User } from '../types';

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showReview, setShowReview] = useState(false);

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

  const userMap = new Map<string, User>();
  users?.forEach((u) => userMap.set(u.id, u));

  if (isLoading) return <Loading />;
  if (isError || !idea) return <ErrorState message="Failed to load idea" />;

  const submitter = userMap.get(idea.submitted_by);

  return (
    <div>
      <button onClick={() => navigate('/ideas')} className="flex items-center gap-1 text-sm text-enterprise-charcoal/60 hover:text-enterprise-charcoal mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Ideas
      </button>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-enterprise-charcoal">{idea.title}</h1>
            <p className="text-sm text-enterprise-charcoal/50 mt-1">
              Submitted by {submitter?.name || 'Unknown'} on {new Date(idea.created_at).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={idea.status} />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-enterprise-charcoal/70 mb-1">Description</h3>
            <p className="text-sm text-enterprise-charcoal">{idea.description}</p>
          </div>
          {idea.problem_statement && (
            <div>
              <h3 className="text-sm font-semibold text-enterprise-charcoal/70 mb-1">Problem Statement</h3>
              <p className="text-sm text-enterprise-charcoal">{idea.problem_statement}</p>
            </div>
          )}
          {idea.proposed_solution && (
            <div>
              <h3 className="text-sm font-semibold text-enterprise-charcoal/70 mb-1">Proposed Solution</h3>
              <p className="text-sm text-enterprise-charcoal">{idea.proposed_solution}</p>
            </div>
          )}
          <div className="flex items-center gap-3 pt-2 border-t border-enterprise-gray-border">
            <span className="badge bg-blue-100 text-blue-800">{idea.category}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Reviews</h2>
            <button className="btn-secondary text-sm" onClick={() => setShowReview(true)}>
              <MessageSquare className="w-4 h-4" /> Add Review
            </button>
          </div>
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

        <div className="card p-5">
          <h2 className="section-title mb-4">Validation Sprint</h2>
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
              {validation.objectives && (
                <div>
                  <span className="text-sm text-enterprise-charcoal/70">Objectives</span>
                  <p className="text-sm">{validation.objectives}</p>
                </div>
              )}
              {validation.findings && (
                <div>
                  <span className="text-sm text-enterprise-charcoal/70">Findings</span>
                  <p className="text-sm">{validation.findings}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState icon={<AlertCircle className="w-6 h-6" />} title="No validation sprint" message="A validation sprint can be started once the idea is approved." />
          )}
        </div>
      </div>

      {showReview && users && (
        <ReviewModal ideaId={idea.id} users={users} onClose={() => setShowReview(false)} />
      )}
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
            <option value="request_info">Request More Info</option>
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
