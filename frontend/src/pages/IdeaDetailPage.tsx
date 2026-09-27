import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MessageSquare, CheckCircle, AlertCircle, Send, Pause, RotateCcw,
  Star, StarOff, FileText, Activity as ActivityIcon, Plus, Upload, ClipboardList,
} from 'lucide-react';
import { ideaApi, userApi, validationApi, uploadApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { Loading, ErrorState, StatusBadge, Modal, EmptyState } from '../components/ui';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';

function LifecycleStepper({
  status,
  principalEngineerName,
}: {
  status: string;
  principalEngineerName?: string;
}) {
  const steps = [
    {
      num: 1,
      name: '1. Inception',
      desc: 'Idea Submission',
      isCurrent: status === 'draft',
      isCompleted: status !== 'draft',
    },
    {
      num: 2,
      name: '2. Review & Assign',
      desc: 'Technical Review',
      isCurrent: status === 'submitted' || status === 'under_review',
      isCompleted: ['validation', 'approved', 'open_for_team', 'building', 'poc', 'demo', 'adopted'].includes(status),
    },
    {
      num: 3,
      name: '3. Validation',
      desc: principalEngineerName ? `Lead: ${principalEngineerName.split(' ')[0]}` : 'Feasibility Sprint',
      isCurrent: status === 'validation',
      isCompleted: ['approved', 'open_for_team', 'building', 'poc', 'demo', 'adopted'].includes(status),
    },
    {
      num: 4,
      name: '4. Innovation',
      desc: 'Marketplace & Roles',
      isCurrent: status === 'approved' || status === 'open_for_team',
      isCompleted: ['building', 'poc', 'demo', 'adopted'].includes(status),
    },
    {
      num: 5,
      name: '5. Project',
      desc: 'Active Execution',
      isCurrent: ['building', 'poc', 'demo', 'adopted'].includes(status),
      isCompleted: false,
    },
  ];

  return (
    <div className="card p-3 sm:p-4 mb-4 bg-white shadow-enterprise-xs border border-enterprise-gray-border animate-fade-in">
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-enterprise-gray-border flex-wrap gap-2">
        <span className="text-2xs font-bold uppercase tracking-wider text-enterprise-charcoal-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-enterprise-red-600"></span>
          End-to-End Innovation Lifecycle
        </span>
        <span className="text-xs text-enterprise-charcoal-600 font-medium">
          Active Phase: <strong className="text-enterprise-red-700 capitalize">{status.replace(/_/g, ' ')}</strong>
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {steps.map((s) => (
          <div
            key={s.name}
            className={`p-2 rounded-enterprise border text-left transition-all ${
              s.isCurrent
                ? 'bg-enterprise-red-50 border-enterprise-red-500 ring-2 ring-enterprise-red-500/20 shadow-sm'
                : s.isCompleted
                ? 'bg-enterprise-gray-warm/50 border-enterprise-gray-border'
                : 'bg-white border-dashed border-enterprise-gray-border opacity-65'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-3xs font-bold ${
                  s.isCurrent
                    ? 'bg-enterprise-red-600 text-white'
                    : s.isCompleted
                    ? 'bg-enterprise-charcoal-800 text-white'
                    : 'bg-enterprise-charcoal-200 text-enterprise-charcoal-600'
                }`}
                style={{ width: 18, height: 18 }}
              >
                {s.isCompleted ? '✓' : s.num}
              </span>
              <span
                className={`text-xs font-semibold truncate ${
                  s.isCurrent ? 'text-enterprise-red-700' : 'text-enterprise-charcoal-800'
                }`}
              >
                {s.name}
              </span>
            </div>
            <p className="text-3xs text-enterprise-charcoal-500 truncate pl-6">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [showReview, setShowReview] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [actionError, setActionError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(currentUser?.id || '');

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

  const activeUserId = currentUser?.id || currentUserId;

  const submitMutation = useMutation({
    mutationFn: () => ideaApi.submit(id!, activeUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea-activity', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed to submit'),
  });

  const parkMutation = useMutation({
    mutationFn: () => ideaApi.park(id!, activeUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea-activity', id] });
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed to park idea'),
  });

  const reopenMutation = useMutation({
    mutationFn: () => ideaApi.reopen(id!, activeUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea-activity', id] });
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed to reopen idea'),
  });

  const followMutation = useMutation({
    mutationFn: () => ideaApi.follow(id!, activeUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['idea-activity', id] }),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => ideaApi.unfollow(id!, activeUserId),
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
      <Link to="/ideas" className="flex items-center gap-1 text-sm text-enterprise-charcoal-500 hover:text-enterprise-red-700 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Ideas
      </Link>

      {/* Lifecycle Progress Stepper */}
      <LifecycleStepper
        status={idea.status}
        principalEngineerName={validation?.principal_engineer_id ? userMap.get(validation.principal_engineer_id)?.name : undefined}
      />

      {/* Stage-by-Stage Continuous Flow Action Banners */}
      {idea.status === 'draft' && (
        <div className="bg-enterprise-blue-50 border border-enterprise-blue-200 rounded-enterprise p-4 mb-4 flex items-center justify-between gap-4 flex-wrap animate-fade-in shadow-enterprise-xs">
          <div>
            <h3 className="text-sm font-semibold text-enterprise-blue-900 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-enterprise-blue-600" />
              Stage 1: Idea is in Draft
            </h3>
            <p className="text-xs text-enterprise-blue-700 mt-0.5">
              Ready for technical review? Submit this idea to enter the Innovation Review Queue.
            </p>
          </div>
          <button
            onClick={() => submitMutation.mutate()}
            className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            disabled={submitMutation.isPending}
          >
            <Send className="w-4 h-4" /> Submit for Review
          </button>
        </div>
      )}

      {(idea.status === 'submitted' || idea.status === 'under_review') && (
        <div className="bg-enterprise-gold-50 border border-enterprise-gold-300 rounded-enterprise p-4 mb-4 flex items-center justify-between gap-4 flex-wrap animate-fade-in shadow-enterprise-xs">
          <div>
            <h3 className="text-sm font-semibold text-enterprise-charcoal-900 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-enterprise-gold-600" />
              Stage 2: Awaiting Engineering Review &amp; Principal Engineer Assignment
            </h3>
            <p className="text-xs text-enterprise-charcoal-700 mt-0.5">
              Reviewers evaluate technical feasibility across 7 dimensions and assign a Principal Engineer for a Validation Sprint.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowReview(true)}
              className="btn-primary text-sm flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-4 h-4" /> Review &amp; Assign Principal Engineer
            </button>
            <Link to={`/review?idea=${idea.id}`} className="btn-secondary text-sm">
              Review Center Console &rarr;
            </Link>
          </div>
        </div>
      )}

      {idea.status === 'validation' && (
        <div className="bg-enterprise-blue-50 border border-enterprise-blue-300 rounded-enterprise p-4 mb-4 flex items-center justify-between gap-4 flex-wrap animate-fade-in shadow-enterprise-xs">
          <div>
            <h3 className="text-sm font-semibold text-enterprise-blue-900 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-enterprise-blue-600" />
              Stage 3: Active Validation Sprint (Feasibility &amp; POC)
            </h3>
            <p className="text-xs text-enterprise-blue-700 mt-0.5">
              Lead Principal Engineer: <strong>{validation?.principal_engineer_id ? userMap.get(validation.principal_engineer_id)?.name : 'Assigned Lead'}</strong>.
              Conducting architecture spikes, risk assessment, and POC benchmarking.
            </p>
          </div>
          <Link to={`/ideas/${idea.id}/validation`} className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap shadow-sm">
            Open Validation Sprint &rarr;
          </Link>
        </div>
      )}

      {idea.status === 'approved' && (
        <div className="bg-enterprise-success-50 border border-enterprise-success-200 rounded-enterprise p-4 mb-4 flex items-center justify-between gap-4 flex-wrap animate-fade-in shadow-enterprise-xs">
          <div>
            <h3 className="text-sm font-semibold text-enterprise-success-900 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-enterprise-success-600" />
              Stage 4: Validation Approved &amp; Active in Innovation Marketplace
            </h3>
            <p className="text-xs text-enterprise-success-700 mt-0.5">
              This initiative passed engineering validation! It is now live in the marketplace for cross-functional team assembly.
            </p>
          </div>
          <Link to="/innovation" className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap shadow-sm">
            View in Innovation Marketplace &rarr;
          </Link>
        </div>
      )}

      {actionError && (
        <div className="mb-4 p-3 bg-enterprise-error-50 border border-enterprise-error-200 rounded-enterprise text-sm text-enterprise-error-700 flex items-center justify-between">
          {actionError}
          <button onClick={() => setActionError('')} className="text-enterprise-error-400 hover:text-enterprise-error-600">&times;</button>
        </div>
      )}

      <div className="card p-6 mb-4 animate-fade-in">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-enterprise-charcoal-900">{idea.title}</h1>
            <p className="text-sm text-enterprise-charcoal-500 mt-1">
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
              <span className="text-sm font-semibold text-enterprise-charcoal-600">Business Area:</span>
              <span className="badge bg-enterprise-blue-100 text-enterprise-blue-700">{idea.business_area}</span>
            </div>
          )}
          {idea.technologies && idea.technologies.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-enterprise-charcoal-600 mb-1">Technologies</h3>
              <div className="flex flex-wrap gap-1">
                {idea.technologies.map((t) => (
                  <span key={t} className="badge bg-enterprise-blue-50 text-enterprise-blue-700">{t}</span>
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
                  <span className="text-sm font-semibold text-enterprise-charcoal-600">Complexity:</span>
                  <p className="text-sm text-enterprise-charcoal-800">{idea.estimated_complexity}</p>
                </div>
              )}
              {idea.estimated_duration && (
                <div>
                  <span className="text-sm font-semibold text-enterprise-charcoal-600">Duration:</span>
                  <p className="text-sm text-enterprise-charcoal-800">{idea.estimated_duration}</p>
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
              className="btn-primary text-sm flex items-center gap-1.5"
              disabled={!currentUserId || submitMutation.isPending}
            >
              <Send className="w-4 h-4" /> Submit for Review
            </button>
          )}
          {(idea.status === 'submitted' || idea.status === 'under_review') && (
            <button
              onClick={() => setShowReview(true)}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Review &amp; Assign Principal Engineer
            </button>
          )}
          {idea.status === 'validation' && (
            <Link
              to={`/ideas/${id}/validation`}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> Open Validation Sprint &rarr;
            </Link>
          )}
          {idea.status === 'approved' && (
            <Link
              to="/innovation"
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              View in Innovation Marketplace &rarr;
            </Link>
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
            <ActivityIcon className="w-5 h-5 text-enterprise-charcoal-400" /> Activity
          </h2>
          {activities && activities.length > 0 ? (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2 rounded-enterprise hover:bg-enterprise-gray-warm transition-colors">
                  <div className="w-2 h-2 rounded-full bg-enterprise-red-600 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-enterprise-charcoal-700">{a.description}</p>
                    <p className="text-xs text-enterprise-charcoal-400 mt-0.5">
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
              <FileText className="w-5 h-5 text-enterprise-charcoal-400" /> Evidence
            </h2>
            <button className="btn-secondary text-sm" onClick={() => setShowEvidence(true)}>
              <Plus className="w-4 h-4" /> Add Evidence
            </button>
          </div>
          {evidence && evidence.length > 0 ? (
            <div className="space-y-2">
              {evidence.map((e) => (
                <div key={e.id} className="border border-enterprise-gray-border rounded-enterprise p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-enterprise-charcoal-800">{e.title}</span>
                    <span className="badge bg-enterprise-charcoal-100 text-enterprise-charcoal-500 text-xs">{e.evidence_type}</span>
                  </div>
                  {e.description && <p className="text-sm text-enterprise-charcoal-600">{e.description}</p>}
                  {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-xs text-enterprise-red-600 hover:underline mt-1 inline-block">{e.url}</a>}
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
            <MessageSquare className="w-5 h-5 text-enterprise-charcoal-400" /> Reviews
          </h2>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => {
                const reviewer = userMap.get(review.reviewer_id);
                return (
                  <div key={review.id} className="border border-enterprise-gray-border rounded-enterprise p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-enterprise-charcoal-800">{reviewer?.name || 'Unknown'}</span>
                      <StatusBadge status={review.decision} />
                    </div>
                    {review.comments && <p className="text-sm text-enterprise-charcoal-600">{review.comments}</p>}
                    <p className="text-xs text-enterprise-charcoal-400 mt-1">{new Date(review.created_at).toLocaleString()}</p>
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
            <CheckCircle className="w-5 h-5 text-enterprise-charcoal-400" /> Validation Sprint
          </h2>
          {validation ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-enterprise-charcoal-600">Status</span>
                <StatusBadge status={validation.status} />
              </div>
              {validation.principal_engineer_id && (
                <div>
                  <span className="text-sm text-enterprise-charcoal-600">Principal Engineer</span>
                  <p className="text-sm font-medium text-enterprise-charcoal-800">{userMap.get(validation.principal_engineer_id)?.name || 'Unassigned'}</p>
                </div>
              )}
              {validation.manager_id && (
                <div>
                  <span className="text-sm text-enterprise-charcoal-600">Manager</span>
                  <p className="text-sm font-medium text-enterprise-charcoal-800">{userMap.get(validation.manager_id)?.name || 'Unassigned'}</p>
                </div>
              )}
              {validation.decision && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-enterprise-charcoal-600">Decision</span>
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
      <h3 className="text-sm font-semibold text-enterprise-charcoal-600 mb-1">{label}</h3>
      <p className="text-sm text-enterprise-charcoal-800 whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function ReviewModal({ ideaId, users, onClose }: { ideaId: string; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const principalEngineers = users.filter((u) => u.role === 'principal_engineer' || u.role === 'admin');
  const peList = principalEngineers.length > 0 ? principalEngineers : users;
  const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin');
  const mgrList = managers.length > 0 ? managers : users;

  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      reviewer_id: currentUser?.id || users[0]?.id || '',
      decision: 'send_to_validation',
      comments: '',
      reason: '',
      principal_engineer_id: peList[0]?.id || '',
      manager_id: mgrList[0]?.id || '',
    },
  });

  const selectedDecision = watch('decision');

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload: any = {
        idea_id: ideaId,
        reviewer_id: data.reviewer_id,
        decision: data.decision,
        comments: data.comments,
        reason: data.reason || '',
      };
      if (data.decision === 'send_to_validation') {
        payload.principal_engineer_id = data.principal_engineer_id || null;
        payload.manager_id = data.manager_id || null;
      }
      return ideaApi.createReview(ideaId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea-reviews', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['idea-validation', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      onClose();
    },
    onError: (err: any) => {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review');
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Technical Review & Validation Assignment">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        {submitError && (
          <div className="p-2.5 bg-enterprise-error-50 border border-enterprise-error-200 rounded-enterprise text-xs text-enterprise-error-700">
            {submitError}
          </div>
        )}
        <div>
          <label className="label">Reviewer</label>
          <select {...register('reviewer_id', { required: 'Reviewer is required' })} className="input">
            <option value="">Select reviewer...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.replace(/_/g, ' ')})
              </option>
            ))}
          </select>
          {errors.reviewer_id && <p className="text-xs text-enterprise-error-600 mt-1">{errors.reviewer_id.message as string}</p>}
        </div>

        <div>
          <label className="label">Review Decision</label>
          <select {...register('decision')} className="input font-medium">
            <option value="send_to_validation">🚀 Send to Validation Sprint (Assign PE)</option>
            <option value="approve">✅ Direct Approve (Proceed to Innovation)</option>
            <option value="request_information">💬 Request More Information</option>
            <option value="park">⏸️ Park Idea</option>
            <option value="reject">❌ Reject Idea</option>
          </select>
        </div>

        {selectedDecision === 'send_to_validation' && (
          <div className="bg-enterprise-blue-50 border border-enterprise-blue-200 rounded-enterprise p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-enterprise-blue-900">
              <span>🛠️</span> Technical Leadership Assignment
            </div>
            <p className="text-2xs text-enterprise-charcoal-600 leading-relaxed">
              Assign the Principal Engineer to lead architecture feasibility spikes, risk evaluation, and proof-of-concept validation.
            </p>
            <div>
              <label className="label text-xs">Principal Engineer</label>
              <select {...register('principal_engineer_id')} className="input text-sm py-1.5 bg-white">
                <option value="">Select Principal Engineer...</option>
                {peList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.title || u.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Engineering Manager</label>
              <select {...register('manager_id')} className="input text-sm py-1.5 bg-white">
                <option value="">Select Manager...</option>
                {mgrList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.title || u.role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(selectedDecision === 'park' || selectedDecision === 'reject') && (
          <div>
            <label className="label">Reason <span className="text-enterprise-error-600">*</span></label>
            <textarea
              {...register('reason', { required: 'A reason is required' })}
              className="input min-h-[60px]"
              placeholder="Explain why this decision is being made..."
            />
            {errors.reason && <p className="text-xs text-enterprise-error-600 mt-1">{errors.reason.message as string}</p>}
          </div>
        )}

        <div>
          <label className="label">Review Comments</label>
          <textarea {...register('comments')} className="input min-h-[70px]" placeholder="Architectural considerations, dependencies, or feedback..." />
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-enterprise-gray-border">
          <button type="button" className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary text-sm flex items-center gap-1.5" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Confirm Decision & Launch Sprint'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EvidenceModal({ ideaId, users, onClose }: { ideaId: string; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { title: '', description: '', evidence_type: 'document', url: '', created_by: currentUser?.id || '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => ideaApi.addEvidence(ideaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea-evidence', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['idea-activity', ideaId] });
      onClose();
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadApi.uploadFile(file);
      setValue('url', res.url);
      if (!watch('title')) {
        setValue('title', file.name.replace(/\.[^/.]+$/, ''));
      }
      if (file.type.includes('image')) {
        setValue('evidence_type', 'diagram');
      } else {
        setValue('evidence_type', 'document');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Add Evidence">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Title <span className="text-enterprise-error-500">*</span></label>
          <input {...register('title', { required: 'Title is required' })} className="input" placeholder="Evidence title" />
          {errors.title && <p className="text-xs text-enterprise-error-600 mt-1">{errors.title.message as string}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} className="input min-h-[60px]" placeholder="Describe this evidence" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select {...register('evidence_type')} className="input">
              <option value="document">Document</option>
              <option value="link">Link</option>
              <option value="diagram">Diagram / Architecture</option>
              <option value="prototype">Prototype</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Added By <span className="text-enterprise-error-500">*</span></label>
            <select {...register('created_by', { required: 'Required' })} className="input">
              <option value="">Select user...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {errors.created_by && <p className="text-xs text-enterprise-error-600 mt-1">{errors.created_by.message as string}</p>}
          </div>
        </div>

        {/* Upload file or enter URL */}
        <div className="border border-dashed border-enterprise-gray-border rounded-enterprise p-3 bg-enterprise-gray-warm">
          <label className="block text-xs font-semibold text-enterprise-charcoal-700 mb-1.5">
            Attach Document / Diagram (PDF, PNG, JPG, DOCX, ZIP)
          </label>
          <div className="flex items-center gap-2">
            <label className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : 'Choose File to Upload'}</span>
              <input
                type="file"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileUpload}
              />
            </label>
            {watch('url') && (
              <span className="text-xs text-enterprise-success-700 font-medium truncate flex-1">
                ✓ Attached: {watch('url')}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="label">Or Enter Direct URL</label>
          <input {...register('url')} className="input" placeholder="https://... or uploaded path" />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending || isUploading}>
            {mutation.isPending ? 'Adding...' : 'Add Evidence'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
