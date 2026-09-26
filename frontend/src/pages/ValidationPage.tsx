import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle, AlertCircle, Plus, FileText, Shield, Cpu,
  Layers, Link2, TrendingUp, ClipboardList, Trash2, Send,
  RotateCcw, Pause, XCircle, Lightbulb, Database, GitMerge,
} from 'lucide-react';
import { ideaApi, userApi, validationApi } from '../api/endpoints';
import {
  Loading, ErrorState, StatusBadge, Modal, EmptyState, PageHeader,
} from '../components/ui';
import type { User, ValidationSprint, ValidationEvidence } from '../types';

const VALIDATION_OBJECTIVES = [
  { key: 'technical_feasibility', label: 'Technical Feasibility', icon: Cpu },
  { key: 'architecture', label: 'Architecture', icon: Layers },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'data_availability', label: 'Data Availability', icon: Database },
  { key: 'integration_feasibility', label: 'Integration Feasibility', icon: Link2 },
  { key: 'estimated_effort', label: 'Estimated Effort', icon: ClipboardList },
  { key: 'business_value', label: 'Business Value', icon: TrendingUp },
  { key: 'poc_scope', label: 'POC Scope', icon: Lightbulb },
];

const VALIDATION_CHECKLIST = [
  { key: 'architecture_defined', label: 'Architecture Defined' },
  { key: 'poc_created', label: 'POC Created' },
  { key: 'security_reviewed', label: 'Security Reviewed' },
  { key: 'dependencies_identified', label: 'Dependencies Identified' },
  { key: 'data_source_confirmed', label: 'Data Source Confirmed' },
  { key: 'engineering_effort_estimated', label: 'Engineering Effort Estimated' },
  { key: 'success_criteria_defined', label: 'Success Criteria Defined' },
];

const EVIDENCE_TYPES = [
  { value: 'architecture', label: 'Architecture', icon: Layers },
  { value: 'technical_analysis', label: 'Technical Analysis', icon: Cpu },
  { value: 'poc', label: 'POC', icon: Lightbulb },
  { value: 'security_review', label: 'Security Review', icon: Shield },
  { value: 'risk_assessment', label: 'Risk Assessment', icon: AlertCircle },
  { value: 'dependency_analysis', label: 'Dependency Analysis', icon: Link2 },
];

const DECISIONS = [
  { value: 'continue_open_innovation', label: 'Continue to Open Innovation', icon: Send, color: 'text-green-600' },
  { value: 'return_for_more_validation', label: 'Return for More Validation', icon: RotateCcw, color: 'text-amber-600' },
  { value: 'park', label: 'Park', icon: Pause, color: 'text-orange-600' },
  { value: 'close', label: 'Close', icon: XCircle, color: 'text-red-600' },
];

export function ValidationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEvidence, setShowEvidence] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data: idea, isLoading: ideaLoading, isError: ideaError } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => ideaApi.getById(id!),
    enabled: !!id,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  const { data: validation, isLoading: valLoading } = useQuery({
    queryKey: ['idea-validation', id],
    queryFn: () => validationApi.getByIdea(id!),
    enabled: !!id,
  });

  const { data: evidence } = useQuery({
    queryKey: ['validation-evidence', id],
    queryFn: () => validationApi.getEvidence(id!),
    enabled: !!id && !!validation,
  });

  const userMap = useMemo(() => {
    const m = new Map<string, User>();
    users?.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['idea-validation', id] });
    queryClient.invalidateQueries({ queryKey: ['validation-evidence', id] });
    queryClient.invalidateQueries({ queryKey: ['idea', id] });
    queryClient.invalidateQueries({ queryKey: ['ideas'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ValidationSprint>) => validationApi.update(id!, data),
    onSuccess: () => {
      invalidateAll();
      setActionError('');
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed to update'),
  });

  const decisionMutation = useMutation({
    mutationFn: (data: { decision: string; reason: string }) => validationApi.makeDecision(id!, data),
    onSuccess: () => {
      invalidateAll();
      setShowDecision(false);
      setActionError('');
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed to make decision'),
  });

  const deleteEvidenceMutation = useMutation({
    mutationFn: (evidenceId: string) => validationApi.deleteEvidence(id!, evidenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-evidence', id] });
    },
  });

  if (ideaLoading || valLoading) return <Loading message="Loading validation sprint..." />;
  if (ideaError || !idea) return <ErrorState message="Failed to load idea" />;

  if (!validation) {
    return (
      <div>
        <Link to={`/ideas/${id}`} className="flex items-center gap-1 text-sm text-enterprise-charcoal/60 hover:text-enterprise-charcoal mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Idea
        </Link>
        <div className="card p-8">
          <EmptyState
            icon={<ClipboardList className="w-8 h-8" />}
            title="No validation sprint"
            message="A validation sprint is created when a reviewer sends the idea to validation from the Review Center."
          />
        </div>
      </div>
    );
  }

  const toggleChecklistItem = (key: string) => {
    const current = validation.checklist || [];
    const updated = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    updateMutation.mutate({ checklist: updated });
  };

  const toggleObjective = (key: string) => {
    const current = validation.objectives_checklist || [];
    const updated = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    updateMutation.mutate({ objectives_checklist: updated });
  };

  const canDecide = validation.status === 'in_progress' || validation.status === 'completed';
  const hasDecision = !!validation.decision;

  return (
    <div>
      <Link to={`/ideas/${id}`} className="flex items-center gap-1 text-sm text-enterprise-charcoal/60 hover:text-enterprise-charcoal mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Idea
      </Link>

      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center justify-between">
          {actionError}
          <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

      <PageHeader
        title="Validation Sprint"
        subtitle={idea.title}
        action={<StatusBadge status={validation.status} />}
      />

      {/* Team & Status */}
      <div className="card p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs font-semibold text-enterprise-charcoal/50 uppercase tracking-wide">Principal Engineer</span>
            <p className="text-sm font-medium mt-1">
              {validation.principal_engineer_id ? userMap.get(validation.principal_engineer_id)?.name || 'Unknown' : 'Unassigned'}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold text-enterprise-charcoal/50 uppercase tracking-wide">Manager</span>
            <p className="text-sm font-medium mt-1">
              {validation.manager_id ? userMap.get(validation.manager_id)?.name || 'Unknown' : 'Unassigned'}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold text-enterprise-charcoal/50 uppercase tracking-wide">Started</span>
            <p className="text-sm font-medium mt-1">
              {validation.start_date ? new Date(validation.start_date).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
        {validation.decision && (
          <div className="mt-4 pt-4 border-t border-enterprise-gray-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-enterprise-charcoal/50 uppercase tracking-wide">Decision:</span>
              <StatusBadge status={validation.decision} />
            </div>
            {validation.decision_reason && (
              <p className="text-sm text-enterprise-charcoal/70 mt-2">{validation.decision_reason}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Objectives */}
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-enterprise-charcoal/50" /> Validation Objectives
          </h2>
          <p className="text-xs text-enterprise-charcoal/40 mb-3">Click to mark which objectives are being tracked.</p>
          <div className="space-y-2">
            {VALIDATION_OBJECTIVES.map((obj) => {
              const Icon = obj.icon;
              const active = (validation.objectives_checklist || []).includes(obj.key);
              return (
                <button
                  key={obj.key}
                  onClick={() => toggleObjective(obj.key)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm border transition-all ${
                    active
                      ? 'border-enterprise-red/30 bg-enterprise-red/5 text-enterprise-charcoal'
                      : 'border-enterprise-gray-border bg-white text-enterprise-charcoal/60 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{obj.label}</span>
                  {active && <CheckCircle className="w-4 h-4 text-enterprise-red" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <label className="label">Objectives Summary</label>
            <textarea
              value={validation.objectives || ''}
              onChange={(e) => {
                const val = e.target.value;
                updateMutation.mutate({ objectives: val });
              }}
              className="input min-h-[80px]"
              placeholder="Describe the validation objectives..."
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-enterprise-charcoal/50" /> Validation Checklist
          </h2>
          <p className="text-xs text-enterprise-charcoal/40 mb-3">Track completion of each checklist item.</p>
          <div className="space-y-2">
            {VALIDATION_CHECKLIST.map((item) => {
              const checked = (validation.checklist || []).includes(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => toggleChecklistItem(item.key)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm border transition-all ${
                    checked
                      ? 'border-green-200 bg-green-50 text-enterprise-charcoal'
                      : 'border-enterprise-gray-border bg-white text-enterprise-charcoal/60 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    checked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <label className="label">Findings</label>
            <textarea
              value={validation.findings || ''}
              onChange={(e) => updateMutation.mutate({ findings: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Document validation findings..."
            />
          </div>
        </div>
      </div>

      {/* Evidence */}
      <div className="card p-5 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title flex items-center gap-2">
            <FileText className="w-5 h-5 text-enterprise-charcoal/50" /> Evidence
          </h2>
          <button className="btn-secondary text-sm" onClick={() => setShowEvidence(true)}>
            <Plus className="w-4 h-4" /> Add Evidence
          </button>
        </div>
        <p className="text-xs text-enterprise-charcoal/40 mb-3">Every conclusion must reference evidence where applicable.</p>
        {evidence && evidence.length > 0 ? (
          <div className="space-y-3">
            {evidence.map((e) => {
              const typeInfo = EVIDENCE_TYPES.find((t) => t.value === e.evidence_type);
              const Icon = typeInfo?.icon || FileText;
              return (
                <div key={e.id} className="border border-enterprise-gray-border rounded-md p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-enterprise-charcoal/40" />
                      <span className="text-sm font-medium">{e.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge bg-gray-100 text-gray-600 text-xs">{typeInfo?.label || e.evidence_type}</span>
                      <button
                        onClick={() => deleteEvidenceMutation.mutate(e.id)}
                        className="text-enterprise-charcoal/30 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {e.description && <p className="text-sm text-enterprise-charcoal/70">{e.description}</p>}
                  {e.conclusion && (
                    <div className="mt-2 p-2 bg-enterprise-gray-warm/50 rounded text-sm">
                      <span className="text-xs font-semibold text-enterprise-charcoal/50">Conclusion: </span>
                      <span className="text-enterprise-charcoal">{e.conclusion}</span>
                    </div>
                  )}
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-xs text-enterprise-red hover:underline mt-1 inline-block">
                      {e.url}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={<FileText className="w-6 h-6" />} title="No evidence yet" message="Add architecture docs, POC results, security reviews, or risk assessments to support your conclusions." />
        )}
      </div>

      {/* Decision */}
      {canDecide && !hasDecision && (
        <div className="card p-5 mt-4">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-enterprise-charcoal/50" /> Decision
          </h2>
          {showDecision ? (
            <DecisionForm
              onSubmit={(payload) => decisionMutation.mutate(payload)}
              onCancel={() => setShowDecision(false)}
              isPending={decisionMutation.isPending}
              sprintStatus={validation.status}
            />
          ) : (
            <button onClick={() => setShowDecision(true)} className="btn-primary text-sm w-full">
              <ClipboardList className="w-4 h-4" /> Make Validation Decision
            </button>
          )}
        </div>
      )}

      {showEvidence && (
        <EvidenceModal
          ideaId={id!}
          users={users || []}
          onClose={() => setShowEvidence(false)}
        />
      )}
    </div>
  );
}

// ---- Decision Form ----

function DecisionForm({
  onSubmit, onCancel, isPending, sprintStatus,
}: {
  onSubmit: (payload: { decision: string; reason: string }) => void;
  onCancel: () => void;
  isPending: boolean;
  sprintStatus: string;
}) {
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    if (!decision) { setFormError('Please select a decision.'); return; }
    if (decision === 'continue_open_innovation' && sprintStatus !== 'completed') {
      setFormError('Sprint must be marked as completed before continuing to open innovation.');
      return;
    }
    setFormError('');
    onSubmit({ decision, reason: reason.trim() });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Decision</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DECISIONS.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setDecision(d.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium border transition-all ${
                  decision === d.value
                    ? 'border-enterprise-red bg-enterprise-red/5 text-enterprise-red'
                    : 'border-enterprise-gray-border bg-white text-enterprise-charcoal/70 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${decision === d.value ? 'text-enterprise-red' : d.color}`} />
                {d.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="label">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input min-h-[60px]"
          placeholder="Explain the rationale for this decision..."
        />
      </div>
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

// ---- Evidence Modal ----

function EvidenceModal({
  ideaId, users, onClose,
}: {
  ideaId: string;
  users: User[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [evidenceType, setEvidenceType] = useState('architecture');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [formError, setFormError] = useState('');

  const mutation = useMutation({
    mutationFn: () => validationApi.createEvidence(ideaId, {
      evidence_type: evidenceType,
      title,
      description,
      url,
      conclusion,
      created_by: createdBy || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-evidence', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['idea-validation', ideaId] });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) { setFormError('Title is required.'); return; }
    setFormError('');
    mutation.mutate();
  };

  return (
    <Modal open={true} onClose={onClose} title="Add Validation Evidence">
      <div className="space-y-4">
        <div>
          <label className="label">Evidence Type <span className="text-red-500">*</span></label>
          <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} className="input">
            {EVIDENCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Title <span className="text-red-500">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Evidence title" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[60px]" placeholder="Describe this evidence" />
        </div>
        <div>
          <label className="label">Conclusion</label>
          <textarea value={conclusion} onChange={(e) => setConclusion(e.target.value)} className="input min-h-[60px]" placeholder="What conclusion does this evidence support?" />
        </div>
        <div>
          <label className="label">URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="input" placeholder="https://..." />
        </div>
        <div>
          <label className="label">Added By</label>
          <select value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} className="input">
            <option value="">Select user...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        {formError && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">{formError}</div>
        )}
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding...' : 'Add Evidence'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
