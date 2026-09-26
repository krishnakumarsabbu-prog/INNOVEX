import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, FileText, AlertTriangle, Link2, Shield, Layers,
  Lightbulb, RefreshCw, CheckCircle, XCircle, Pause, Send,
  GitMerge, MessageSquare, ChevronRight, UserCircle, Cpu, TrendingUp,
} from 'lucide-react';
import { reviewApi, ideaApi, userApi } from '../api/endpoints';
import { Loading, ErrorState, StatusBadge, EmptyState } from '../components/ui';
import type { ReviewQueueItem, Review, User, Idea, IdeaEvidence, ReviewDecisionPayload } from '../types';

const REVIEW_DIMENSIONS = [
  { key: 'business_value', label: 'Business Value', icon: Lightbulb },
  { key: 'technical_feasibility', label: 'Technical Feasibility', icon: Cpu },
  { key: 'innovation', label: 'Innovation', icon: Lightbulb },
  { key: 'reusability', label: 'Reusability', icon: RefreshCw },
  { key: 'complexity', label: 'Complexity', icon: Layers },
  { key: 'security_considerations', label: 'Security Considerations', icon: Shield },
  { key: 'dependencies', label: 'Dependencies', icon: Link2 },
];

const DECISIONS = [
  { value: 'request_information', label: 'Request Information', icon: MessageSquare, color: 'text-amber-600' },
  { value: 'send_to_validation', label: 'Send to Validation', icon: Send, color: 'text-purple-600' },
  { value: 'approve', label: 'Approve', icon: CheckCircle, color: 'text-green-600' },
  { value: 'park', label: 'Park', icon: Pause, color: 'text-orange-600' },
  { value: 'reject', label: 'Reject', icon: XCircle, color: 'text-red-600' },
  { value: 'merge', label: 'Merge', icon: GitMerge, color: 'text-blue-600' },
];

const DECISIONS_REQUIRING_REASON = ['park', 'reject'];

export function ReviewPage() {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  const { data: queue, isLoading: queueLoading, isError: queueError } = useQuery({
    queryKey: ['review-queue'],
    queryFn: reviewApi.getQueue,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  const userMap = useMemo(() => {
    const m = new Map<string, User>();
    users?.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  if (queueLoading) return <Loading message="Loading review queue..." />;
  if (queueError) return <ErrorState message="Failed to load review queue" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-enterprise-charcoal">Innovation Review Center</h1>
        <p className="text-sm text-enterprise-charcoal/60 mt-1">
          Expert engineering review console for evaluating submitted ideas across seven dimensions
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* LEFT: Review Queue */}
        <div className="xl:col-span-5">
          <ReviewQueue
            queue={queue || []}
            userMap={userMap}
            selectedId={selectedIdeaId}
            onSelect={setSelectedIdeaId}
          />
        </div>

        {/* RIGHT: Review Workspace */}
        <div className="xl:col-span-7">
          {selectedIdeaId ? (
            <ReviewWorkspace ideaId={selectedIdeaId} userMap={userMap} />
          ) : (
            <div className="card p-8">
              <EmptyState
                icon={<ClipboardList className="w-8 h-8" />}
                title="No idea selected"
                message="Select an idea from the review queue to begin your engineering review."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Review Queue ----

function ReviewQueue({
  queue, userMap, selectedId, onSelect,
}: {
  queue: ReviewQueueItem[];
  userMap: Map<string, User>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-enterprise-gray-border bg-enterprise-gray-warm/50">
        <h2 className="text-sm font-semibold text-enterprise-charcoal flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Review Queue
          <span className="badge bg-enterprise-red/10 text-enterprise-red ml-1">{queue.length}</span>
        </h2>
      </div>

      {queue.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={<CheckCircle className="w-6 h-6" />}
            title="Queue is clear"
            message="No ideas are currently awaiting review. Submitted ideas will appear here."
          />
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-enterprise-gray-border z-10">
              <tr className="text-left text-xs text-enterprise-charcoal/50 uppercase tracking-wide">
                <th className="px-3 py-2 font-medium">Idea</th>
                <th className="px-3 py-2 font-medium">Founder</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">Business Area</th>
                <th className="px-3 py-2 font-medium hidden lg:table-cell">Technology</th>
                <th className="px-3 py-2 font-medium">Submitted</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">Reviewer</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr
                  key={item.idea_id}
                  onClick={() => onSelect(item.idea_id)}
                  className={`border-b border-enterprise-gray-border/50 cursor-pointer transition-colors ${
                    selectedId === item.idea_id
                      ? 'bg-enterprise-red/5 border-l-4 border-l-enterprise-red'
                      : 'hover:bg-enterprise-gray-warm/50'
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-enterprise-charcoal/30 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-enterprise-charcoal truncate max-w-[180px]">{item.title}</p>
                        {item.review_count > 0 && (
                          <span className="text-xs text-enterprise-charcoal/40">{item.review_count} review{item.review_count > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-enterprise-charcoal/70 whitespace-nowrap">{item.founder_name || '—'}</td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    {item.business_area ? (
                      <span className="badge bg-blue-50 text-blue-700 text-xs">{item.business_area}</span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {item.technologies.slice(0, 2).map((t) => (
                        <span key={t} className="badge bg-gray-100 text-gray-600 text-xs">{t}</span>
                      ))}
                      {item.technologies.length > 2 && (
                        <span className="text-xs text-enterprise-charcoal/40">+{item.technologies.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-enterprise-charcoal/50 whitespace-nowrap">
                    {new Date(item.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-enterprise-charcoal/70 whitespace-nowrap">
                    {item.assigned_reviewer_name || (
                      <span className="text-xs text-enterprise-charcoal/30">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Review Workspace ----

function ReviewWorkspace({ ideaId, userMap }: { ideaId: string; userMap: Map<string, User> }) {
  const queryClient = useQueryClient();
  const [showDecision, setShowDecision] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  const { data: idea, isLoading: ideaLoading } = useQuery({
    queryKey: ['idea', ideaId],
    queryFn: () => ideaApi.getById(ideaId),
    enabled: !!ideaId,
  });

  const { data: reviews } = useQuery({
    queryKey: ['idea-reviews', ideaId],
    queryFn: () => reviewApi.getReviews(ideaId),
    enabled: !!ideaId,
  });

  const { data: evidence } = useQuery({
    queryKey: ['idea-evidence', ideaId],
    queryFn: () => ideaApi.getEvidence(ideaId),
    enabled: !!ideaId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    queryClient.invalidateQueries({ queryKey: ['idea-reviews', ideaId] });
    queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
    queryClient.invalidateQueries({ queryKey: ['ideas'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createReviewMutation = useMutation({
    mutationFn: (data: ReviewDecisionPayload) => reviewApi.makeDecision(ideaId, 'new', data),
    onSuccess: () => {
      invalidateAll();
      setShowDecision(false);
      setDecisionError('');
    },
    onError: (e) => setDecisionError(e instanceof Error ? e.message : 'Failed to submit decision'),
  });

  if (ideaLoading) return <Loading message="Loading idea details..." />;
  if (!idea) return <ErrorState message="Failed to load idea" />;

  const founder = userMap.get(idea.founder_id || '');

  return (
    <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
      {/* Idea header */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-enterprise-charcoal">{idea.title}</h2>
            <p className="text-xs text-enterprise-charcoal/50 mt-0.5">
              by {founder?.name || 'Unknown'} {idea.business_area ? `· ${idea.business_area}` : ''}
            </p>
          </div>
          <StatusBadge status={idea.status} />
        </div>
        {idea.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {idea.technologies.map((t) => (
              <span key={t} className="badge bg-blue-50 text-blue-700 text-xs">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Problem */}
      <WorkspaceSection icon={<AlertTriangle className="w-4 h-4" />} title="Problem">
        <p className="text-sm text-enterprise-charcoal whitespace-pre-wrap">{idea.problem_statement || 'No problem statement provided.'}</p>
      </WorkspaceSection>

      {/* Solution */}
      <WorkspaceSection icon={<Lightbulb className="w-4 h-4" />} title="Solution">
        <p className="text-sm text-enterprise-charcoal whitespace-pre-wrap">{idea.proposed_solution || 'No solution provided.'}</p>
      </WorkspaceSection>

      {/* Impact */}
      <WorkspaceSection icon={<TrendingUp className="w-4 h-4" />} title="Impact">
        <div className="space-y-2">
          {idea.business_impact && <p className="text-sm text-enterprise-charcoal"><span className="font-medium text-enterprise-charcoal/60">Business: </span>{idea.business_impact}</p>}
          {idea.engineering_impact && <p className="text-sm text-enterprise-charcoal"><span className="font-medium text-enterprise-charcoal/60">Engineering: </span>{idea.engineering_impact}</p>}
          {idea.expected_benefits && <p className="text-sm text-enterprise-charcoal"><span className="font-medium text-enterprise-charcoal/60">Benefits: </span>{idea.expected_benefits}</p>}
          {!idea.business_impact && !idea.engineering_impact && !idea.expected_benefits && <p className="text-sm text-enterprise-charcoal/40">No impact information provided.</p>}
        </div>
      </WorkspaceSection>

      {/* Technology */}
      <WorkspaceSection icon={<Cpu className="w-4 h-4" />} title="Technology">
        <div className="space-y-2">
          {idea.technologies.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {idea.technologies.map((t) => (
                <span key={t} className="badge bg-blue-50 text-blue-700 text-xs">{t}</span>
              ))}
            </div>
          ) : <p className="text-sm text-enterprise-charcoal/40">No technologies specified.</p>}
          {idea.estimated_complexity && (
            <p className="text-sm text-enterprise-charcoal"><span className="font-medium text-enterprise-charcoal/60">Complexity: </span>{idea.estimated_complexity}</p>
          )}
          {idea.estimated_duration && (
            <p className="text-sm text-enterprise-charcoal"><span className="font-medium text-enterprise-charcoal/60">Duration: </span>{idea.estimated_duration}</p>
          )}
        </div>
      </WorkspaceSection>

      {/* Risks */}
      <WorkspaceSection icon={<AlertTriangle className="w-4 h-4" />} title="Risks">
        <p className="text-sm text-enterprise-charcoal whitespace-pre-wrap">{idea.risks || 'No risks identified.'}</p>
      </WorkspaceSection>

      {/* Dependencies */}
      <WorkspaceSection icon={<Link2 className="w-4 h-4" />} title="Dependencies">
        <p className="text-sm text-enterprise-charcoal whitespace-pre-wrap">{idea.dependencies || 'No dependencies identified.'}</p>
      </WorkspaceSection>

      {/* Evidence */}
      <WorkspaceSection icon={<FileText className="w-4 h-4" />} title="Evidence">
        {evidence && evidence.length > 0 ? (
          <div className="space-y-2">
            {evidence.map((e) => (
              <div key={e.id} className="border border-enterprise-gray-border rounded-md p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{e.title}</span>
                  <span className="badge bg-gray-100 text-gray-600 text-xs">{e.evidence_type}</span>
                </div>
                {e.description && <p className="text-xs text-enterprise-charcoal/70">{e.description}</p>}
                {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-xs text-enterprise-red hover:underline mt-1 inline-block">{e.url}</a>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-enterprise-charcoal/40">No evidence provided.</p>
        )}
      </WorkspaceSection>

      {/* Review History */}
      <WorkspaceSection icon={<MessageSquare className="w-4 h-4" />} title="Review History">
        {reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => {
              const reviewer = userMap.get(review.reviewer_id);
              return (
                <div key={review.id} className="border border-enterprise-gray-border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-enterprise-charcoal/40" />
                      <span className="text-sm font-medium">{reviewer?.name || 'Unknown'}</span>
                    </div>
                    <StatusBadge status={review.decision} />
                  </div>
                  {review.comments && <p className="text-sm text-enterprise-charcoal/80 mb-1">{review.comments}</p>}
                  {review.reason && (
                    <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mt-1">Reason: {review.reason}</p>
                  )}
                  {review.evidence && (
                    <p className="text-xs text-enterprise-charcoal/60 mt-1">Evidence: {review.evidence}</p>
                  )}
                  {review.dimensions && review.dimensions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {review.dimensions.map((dim) => (
                        <div key={dim.id} className="flex items-start gap-2 text-xs">
                          <span className="font-medium text-enterprise-charcoal/60 min-w-[140px]">
                            {dim.dimension.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:
                          </span>
                          {dim.rating && <span className="badge bg-gray-100 text-gray-600 text-xs">{dim.rating}</span>}
                          {dim.comment && <span className="text-enterprise-charcoal/70">{dim.comment}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-enterprise-charcoal/40 mt-1">{new Date(review.created_at).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-enterprise-charcoal/40">No reviews yet. Be the first to review this idea.</p>
        )}
      </WorkspaceSection>

      {/* Decision */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-enterprise-charcoal mb-3 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Decision
        </h3>
        {decisionError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">{decisionError}</div>
        )}
        {showDecision ? (
          <DecisionForm
            users={Array.from(userMap.values())}
            onSubmit={(payload) => createReviewMutation.mutate(payload)}
            onCancel={() => { setShowDecision(false); setDecisionError(''); }}
            isPending={createReviewMutation.isPending}
          />
        ) : (
          <button onClick={() => setShowDecision(true)} className="btn-primary text-sm w-full">
            <ClipboardList className="w-4 h-4" /> Start New Review
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Workspace Section helper ----

function WorkspaceSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-enterprise-charcoal mb-2 flex items-center gap-2">
        <span className="text-enterprise-charcoal/50">{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

// ---- Decision Form ----

function DecisionForm({
  users, onSubmit, onCancel, isPending,
}: {
  users: User[];
  onSubmit: (payload: ReviewDecisionPayload) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [decision, setDecision] = useState('request_information');
  const [reviewerId, setReviewerId] = useState('');
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [evidence, setEvidence] = useState('');
  const [dimensions, setDimensions] = useState<Record<string, { rating: string; comment: string }>>(
    Object.fromEntries(REVIEW_DIMENSIONS.map((d) => [d.key, { rating: '', comment: '' }]))
  );
  const [peId, setPeId] = useState('');
  const [mgrId, setMgrId] = useState('');
  const [formError, setFormError] = useState('');

  const requiresReason = DECISIONS_REQUIRING_REASON.includes(decision);
  const isValidation = decision === 'send_to_validation';

  const handleSubmit = () => {
    if (!reviewerId) { setFormError('Please select a reviewer.'); return; }
    if (requiresReason && !reason.trim()) { setFormError(`A reason is required for '${decision}' decisions.`); return; }

    const payload: ReviewDecisionPayload = {
      decision,
      reviewer_id: reviewerId,
      reason: reason.trim(),
      evidence: evidence.trim(),
      comments: comments.trim(),
      dimensions: REVIEW_DIMENSIONS.map((d) => ({
        dimension: d.key,
        rating: dimensions[d.key].rating,
        comment: dimensions[d.key].comment,
      })).filter((d) => d.rating || d.comment),
      principal_engineer_id: isValidation && peId ? peId : null,
      manager_id: isValidation && mgrId ? mgrId : null,
    };
    setFormError('');
    onSubmit(payload);
  };

  const principalEngineers = users.filter((u) => u.role === 'principal_engineer' || u.role === 'admin');
  const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  return (
    <div className="space-y-4">
      {/* Reviewer */}
      <div>
        <label className="label">Reviewer</label>
        <select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className="input">
          <option value="">Select reviewer...</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </select>
      </div>

      {/* Decision buttons */}
      <div>
        <label className="label">Decision</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DECISIONS.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setDecision(d.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-all ${
                  decision === d.value
                    ? 'border-enterprise-red bg-enterprise-red/5 text-enterprise-red'
                    : 'border-enterprise-gray-border bg-white text-enterprise-charcoal/70 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${decision === d.value ? 'text-enterprise-red' : d.color}`} />
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reason (required for park/reject) */}
      {requiresReason && (
        <div>
          <label className="label">Reason <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input min-h-[60px]"
            placeholder={`Explain why this idea is being ${decision === 'park' ? 'parked' : 'rejected'}...`}
          />
        </div>
      )}

      {/* Comments */}
      <div>
        <label className="label">Comments</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="input min-h-[80px]"
          placeholder="Overall review comments..."
        />
      </div>

      {/* Evidence reference */}
      <div>
        <label className="label">Evidence Reference</label>
        <input
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          className="input"
          placeholder="Link or reference to supporting evidence..."
        />
      </div>

      {/* Review Dimensions */}
      <div>
        <label className="label">Review Dimensions</label>
        <p className="text-xs text-enterprise-charcoal/40 mb-2">Rate each dimension independently. No aggregate score.</p>
        <div className="space-y-2">
          {REVIEW_DIMENSIONS.map((dim) => {
            const Icon = dim.icon;
            const d = dimensions[dim.key];
            return (
              <div key={dim.key} className="border border-enterprise-gray-border rounded-md p-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-enterprise-charcoal/40 flex-shrink-0" />
                  <span className="text-xs font-medium text-enterprise-charcoal flex-1">{dim.label}</span>
                  <select
                    value={d.rating}
                    onChange={(e) => setDimensions({ ...dimensions, [dim.key]: { ...d, rating: e.target.value } })}
                    className="input py-1 text-xs w-28"
                  >
                    <option value="">N/A</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <input
                  value={d.comment}
                  onChange={(e) => setDimensions({ ...dimensions, [dim.key]: { ...d, comment: e.target.value } })}
                  className="input py-1 text-xs"
                  placeholder={`${dim.label} comment...`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation assignment */}
      {isValidation && (
        <div className="border border-purple-200 bg-purple-50/50 rounded-md p-3 space-y-3">
          <p className="text-xs font-medium text-purple-800">Validation Team Assignment</p>
          <p className="text-xs text-enterprise-charcoal/50">Search and assign real users. AI recommendations are suggestions only — you confirm.</p>
          <div>
            <label className="label text-xs">Founder (auto-detected)</label>
            <p className="text-xs text-enterprise-charcoal/60">The idea's founder is automatically notified.</p>
          </div>
          <div>
            <label className="label text-xs">Principal Engineer</label>
            <select value={peId} onChange={(e) => setPeId(e.target.value)} className="input py-1.5 text-sm">
              <option value="">Select Principal Engineer...</option>
              {principalEngineers.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.title || u.role}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Manager</label>
            <select value={mgrId} onChange={(e) => setMgrId(e.target.value)} className="input py-1.5 text-sm">
              <option value="">Select Manager...</option>
              {managers.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.title || u.role}</option>)}
            </select>
          </div>
        </div>
      )}

      {formError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">{formError}</div>
      )}

      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary text-sm" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-primary text-sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Submitting...' : 'Submit Decision'}
        </button>
      </div>
    </div>
  );
}
