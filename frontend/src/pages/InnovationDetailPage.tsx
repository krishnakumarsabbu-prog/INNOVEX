import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Users, Briefcase, Lock, Unlock, Sparkles, Building2, Cpu,
  UserCircle, Clock, Target, AlertCircle, CheckCircle2, FileText, Wrench,
  TrendingUp, Shield, Zap, UserPlus, Star, MessageSquare, Check, X,
} from 'lucide-react';
import { innovationApi, userApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { Loading, ErrorState, StatusBadge, Modal, EmptyState } from '../components/ui';
import type { User, Position, MarketplaceInnovationDetail, SkillMatch, JoinRequest } from '../types';

export function InnovationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showJoinRole, setShowJoinRole] = useState<Position | null>(null);
  const [showJoinRequests, setShowJoinRequests] = useState(false);

  const { data: innovation, isLoading, isError } = useQuery({
    queryKey: ['innovation', id],
    queryFn: () => innovationApi.getById(id!),
    enabled: !!id,
  });

  const { data: roles } = useQuery({
    queryKey: ['innovation-roles', id],
    queryFn: () => innovationApi.getRoles(id!),
    enabled: !!id,
  });

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => userApi.getAll() });
  const userMap = new Map<string, User>();
  users?.forEach((u) => userMap.set(u.id, u));

  const toggleOpen = useMutation({
    mutationFn: (open: boolean) => innovationApi.patch(id!, { is_open: open }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovation', id] });
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
    },
  });

  const followMutation = useMutation({
    mutationFn: () => innovationApi.follow(id!, 'current-user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovation', id] });
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
    },
  });

  if (isLoading) return <Loading />;
  if (isError || !innovation) return <ErrorState message="Failed to load innovation" />;

  const openRoles = roles?.filter((r) => r.status === 'open') || [];

  return (
    <div>
      <button onClick={() => navigate('/innovation')} className="flex items-center gap-1 text-sm text-enterprise-charcoal/60 hover:text-enterprise-charcoal mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      {/* Hero Section */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={innovation.stage} />
              {innovation.is_open ? (
                <span className="badge bg-green-100 text-green-800">Open for Contributors</span>
              ) : (
                <span className="badge bg-gray-100 text-gray-800">Closed</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-enterprise-charcoal mb-2">{innovation.title}</h1>
            <p className="text-sm text-enterprise-charcoal/60 mb-4 max-w-3xl">
              {innovation.problem_statement || innovation.summary}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-enterprise-charcoal/70">
              <div className="flex items-center gap-1.5">
                <UserCircle className="w-4 h-4 text-enterprise-charcoal/40" />
                <span><span className="text-enterprise-charcoal/50">Founder:</span> {innovation.founder_name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-enterprise-charcoal/40" />
                <span><span className="text-enterprise-charcoal/50">Principal Engineer:</span> {innovation.principal_engineer_name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-enterprise-charcoal/40" />
                <span><span className="text-enterprise-charcoal/50">Manager:</span> {innovation.manager_name || 'Unassigned'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              className={`btn-secondary text-sm ${innovation.is_open ? 'text-green-700' : ''}`}
              onClick={() => toggleOpen.mutate(!innovation.is_open)}
            >
              {innovation.is_open ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {innovation.is_open ? 'Open for Contributors' : 'Closed'}
            </button>
            <button
              className="btn-secondary text-sm"
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
            >
              <Star className="w-4 h-4" /> Follow
            </button>
            <button
              className="btn-secondary text-sm"
              onClick={() => setShowJoinRequests(true)}
            >
              <MessageSquare className="w-4 h-4" /> Join Requests
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-enterprise-gray-border">
          <StatBlock icon={<Users className="w-4 h-4" />} label="Team Size" value={innovation.team_size} />
          <StatBlock icon={<Briefcase className="w-4 h-4" />} label="Open Roles" value={openRoles.length} />
          <StatBlock icon={<Sparkles className="w-4 h-4" />} label="Followers" value={innovation.followers} />
          <StatBlock icon={<TrendingUp className="w-4 h-4" />} label="Team Progress" value={`${innovation.team_progress}%`} />
          <StatBlock icon={<Clock className="w-4 h-4" />} label="Last Activity" value={innovation.last_activity ? formatDate(innovation.last_activity) : '—'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Business Impact */}
          {innovation.business_impact && (
            <div className="card p-5">
              <h2 className="section-title mb-3 flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-enterprise-red" /> Business Impact
              </h2>
              <p className="text-sm text-enterprise-charcoal/70 leading-relaxed">{innovation.business_impact}</p>
            </div>
          )}

          {/* Problem & Solution */}
          <div className="card p-5">
            <h2 className="section-title mb-3 flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-enterprise-red" /> Problem & Solution
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-enterprise-charcoal/50 uppercase tracking-wide mb-1">Problem Statement</p>
                <p className="text-sm text-enterprise-charcoal/70 leading-relaxed">{innovation.problem_statement || innovation.summary}</p>
              </div>
              {innovation.proposed_solution && (
                <div>
                  <p className="text-xs font-medium text-enterprise-charcoal/50 uppercase tracking-wide mb-1">Proposed Solution</p>
                  <p className="text-sm text-enterprise-charcoal/70 leading-relaxed">{innovation.proposed_solution}</p>
                </div>
              )}
            </div>
          </div>

          {/* Engineering Details */}
          {(innovation.engineering_impact || innovation.expected_benefits || innovation.dependencies || innovation.risks) && (
            <div className="card p-5">
              <h2 className="section-title mb-3 flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-enterprise-red" /> Engineering Details
              </h2>
              <div className="space-y-3">
                {innovation.engineering_impact && (
                  <DetailRow label="Engineering Impact" value={innovation.engineering_impact} />
                )}
                {innovation.expected_benefits && (
                  <DetailRow label="Expected Benefits" value={innovation.expected_benefits} />
                )}
                {innovation.dependencies && (
                  <DetailRow label="Dependencies" value={innovation.dependencies} />
                )}
                {innovation.risks && (
                  <DetailRow label="Risks" value={innovation.risks} icon={<AlertCircle className="w-3.5 h-3.5 text-amber-600" />} />
                )}
                {innovation.estimated_complexity && (
                  <DetailRow label="Estimated Complexity" value={innovation.estimated_complexity} />
                )}
                {innovation.estimated_duration && (
                  <DetailRow label="Estimated Duration" value={innovation.estimated_duration} />
                )}
              </div>
            </div>
          )}

          {/* Team Formation - Roles with Capacity */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2 text-lg">
                <Briefcase className="w-5 h-5 text-enterprise-red" /> Team Formation
              </h2>
              <button className="btn-secondary text-sm" onClick={() => setShowCreateRole(true)}>
                <Plus className="w-4 h-4" /> Add Role
              </button>
            </div>
            {roles && roles.length > 0 ? (
              <div className="space-y-3">
                {roles.map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    onJoin={() => setShowJoinRole(role)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Briefcase className="w-6 h-6" />}
                title="No roles defined yet"
                message="Add roles to start forming your innovation team."
              />
            )}
          </div>

          {/* Innovation Team */}
          <div className="card p-5">
            <h2 className="section-title mb-4 flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-enterprise-red" /> Innovation Team
            </h2>
            {innovation.team_members.length > 0 ? (
              <div className="space-y-2">
                {innovation.team_members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 border border-enterprise-gray-border rounded-md p-3">
                    <div className="w-9 h-9 rounded-full bg-enterprise-red/10 flex items-center justify-center text-enterprise-red font-medium text-sm">
                      {member.name.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-enterprise-charcoal">{member.name || 'Unknown'}</p>
                      <p className="text-xs text-enterprise-charcoal/50">
                        {member.role && <span>{member.role}</span>}
                        {member.role && member.title && <span className="text-enterprise-charcoal/30"> · </span>}
                        {member.title && <span>{member.title}</span>}
                        {member.department && <span className="text-enterprise-charcoal/30"> · </span>}
                        {member.department && <span>{member.department}</span>}
                      </p>
                    </div>
                    <div className="text-xs text-enterprise-charcoal/40">
                      Joined {formatDate(member.joined_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="No team members yet"
                message="Contributors who join this innovation will appear here."
              />
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4">
          {/* Technologies */}
          {innovation.technologies.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-enterprise-charcoal mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-enterprise-red" /> Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {innovation.technologies.map((tech) => (
                  <span key={tech} className="badge bg-enterprise-gray-warm text-enterprise-charcoal/70">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Business Area */}
          {innovation.business_area && (
            <div className="card p-5">
              <h3 className="font-semibold text-enterprise-charcoal mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-enterprise-red" /> Business Area
              </h3>
              <p className="text-sm text-enterprise-charcoal/70">{innovation.business_area}</p>
            </div>
          )}

          {/* Team Progress */}
          <div className="card p-5">
            <h3 className="font-semibold text-enterprise-charcoal mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-enterprise-red" /> Team Progress
            </h3>
            <div className="mb-2 flex items-center justify-between text-sm text-enterprise-charcoal/60">
              <span>Roles filled</span>
              <span>{innovation.team_progress}%</span>
            </div>
            <div className="h-2 bg-enterprise-gray-warm rounded-full overflow-hidden">
              <div
                className="h-full bg-enterprise-red rounded-full transition-all duration-300"
                style={{ width: `${innovation.team_progress}%` }}
              />
            </div>
            <div className="mt-3 text-xs text-enterprise-charcoal/50">
              {innovation.team_size} team member{innovation.team_size !== 1 ? 's' : ''} · {openRoles.length} open role{openRoles.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Metadata */}
          <div className="card p-5">
            <h3 className="font-semibold text-enterprise-charcoal mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-enterprise-red" /> Details
            </h3>
            <div className="space-y-2 text-sm">
              <MetaRow label="Created" value={formatDate(innovation.created_at)} />
              <MetaRow label="Last Updated" value={formatDate(innovation.updated_at)} />
              <MetaRow label="Followers" value={String(innovation.followers)} />
              <MetaRow label="Stage" value={innovation.stage.replace(/_/g, ' ')} />
            </div>
          </div>
        </div>
      </div>

      {showCreateRole && (
        <CreateRoleModal innovationId={innovation.id} onClose={() => setShowCreateRole(false)} />
      )}
      {showJoinRole && users && (
        <JoinRoleModal
          innovationId={innovation.id}
          role={showJoinRole}
          users={users}
          onClose={() => setShowJoinRole(null)}
        />
      )}
      {showJoinRequests && (
        <JoinRequestsModal innovationId={innovation.id} users={users || []} onClose={() => setShowJoinRequests(false)} />
      )}
    </div>
  );
}

// ---- Role Card with Capacity Indicator ----

function RoleCard({ role, onJoin }: { role: Position; onJoin: () => void }) {
  const isFilled = role.status === 'filled' || role.filled >= role.capacity;
  const openSlots = role.capacity - role.filled;
  const capacityPct = role.capacity > 0 ? (role.filled / role.capacity) * 100 : 0;

  return (
    <div className={`border rounded-md p-4 transition-colors ${isFilled ? 'border-enterprise-gray-border bg-gray-50' : 'border-enterprise-gray-border hover:border-enterprise-red/20'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="font-medium text-sm text-enterprise-charcoal">{role.title}</p>
          {role.description && (
            <p className="text-xs text-enterprise-charcoal/60 mt-1">{role.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-enterprise-charcoal/60">
            <span>{role.role}</span>
            {role.technology && (
              <>
                <span className="text-enterprise-charcoal/30">·</span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> {role.technology}
                </span>
              </>
            )}
            {role.commitment && (
              <>
                <span className="text-enterprise-charcoal/30">·</span>
                <span>{role.commitment}</span>
              </>
            )}
          </div>
        </div>
        {isFilled ? (
          <span className="badge bg-blue-100 text-blue-800 font-semibold whitespace-nowrap">
            <Check className="w-3 h-3 inline mr-1" /> POSITION FILLED
          </span>
        ) : (
          <StatusBadge status={role.status} />
        )}
      </div>

      {/* Capacity Indicator */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-enterprise-charcoal/60">
            <span className="font-semibold text-enterprise-charcoal">{role.filled}</span>
            {' / '}
            <span className="font-semibold text-enterprise-charcoal">{role.capacity}</span>
            {isFilled ? (
              <span className="ml-2 text-blue-700 font-medium">FILLED</span>
            ) : (
              <span className="ml-2 text-green-700 font-medium">{openSlots} OPEN</span>
            )}
          </span>
        </div>
        <div className="h-2 bg-enterprise-gray-warm rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isFilled ? 'bg-blue-500' : 'bg-enterprise-red'}`}
            style={{ width: `${capacityPct}%` }}
          />
        </div>
      </div>

      {/* Skills */}
      {(role.required_skills.length > 0 || role.preferred_skills.length > 0) && (
        <div className="mt-3 space-y-1.5">
          {role.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-xs font-medium text-enterprise-charcoal/50">Required:</span>
              {role.required_skills.map((s) => (
                <span key={s} className="badge bg-red-50 text-red-700 text-xs">{s}</span>
              ))}
            </div>
          )}
          {role.preferred_skills.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-xs font-medium text-enterprise-charcoal/50">Preferred:</span>
              {role.preferred_skills.map((s) => (
                <span key={s} className="badge bg-amber-50 text-amber-700 text-xs">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Join Button */}
      <div className="mt-3 flex justify-end">
        {isFilled ? (
          <span className="text-xs text-enterprise-charcoal/40 font-medium flex items-center gap-1">
            <Check className="w-3 h-3" /> Position Filled
          </span>
        ) : (
          <button
            className="text-enterprise-red font-medium hover:underline flex items-center gap-1 text-sm"
            onClick={onJoin}
          >
            <UserPlus className="w-3.5 h-3.5" /> Request to Join
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Create Role Modal ----

function CreateRoleModal({ innovationId, onClose }: { innovationId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { title: '', role: '', technology: '', description: '', required_skills: '', preferred_skills: '', capacity: 1, commitment: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        required_skills: data.required_skills ? data.required_skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        preferred_skills: data.preferred_skills ? data.preferred_skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        capacity: Number(data.capacity),
      };
      return innovationApi.createRole(innovationId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovation-roles', innovationId] });
      queryClient.invalidateQueries({ queryKey: ['innovation', innovationId] });
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Add Team Role">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Role Title</label>
          <input {...register('title', { required: 'Required' })} className="input" placeholder="e.g. AI Engineer" />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message as string}</p>}
        </div>
        <div>
          <label className="label">Role Category</label>
          <input {...register('role', { required: 'Required' })} className="input" placeholder="e.g. Engineer, Architect, DevOps" />
          {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message as string}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} className="input min-h-[60px]" placeholder="Describe the role responsibilities..." />
        </div>
        <div>
          <label className="label">Required Skills (comma-separated)</label>
          <input {...register('required_skills')} className="input" placeholder="e.g. Python, TensorFlow, NLP" />
        </div>
        <div>
          <label className="label">Preferred Skills (comma-separated)</label>
          <input {...register('preferred_skills')} className="input" placeholder="e.g. Docker, Kubernetes" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Capacity</label>
            <input type="number" {...register('capacity', { valueAsNumber: true, min: 1 })} className="input" defaultValue={1} />
          </div>
          <div>
            <label className="label">Commitment</label>
            <input {...register('commitment')} className="input" placeholder="e.g. Full-time, 20h/week" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---- Join Role Modal with Skill Matching ----

function JoinRoleModal({ innovationId, role, users, onClose }: { innovationId: string; role: Position; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showMatch, setShowMatch] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { user_id: '', message: '' },
  });

  const { data: skillMatch, isLoading: matchLoading } = useQuery({
    queryKey: ['skill-match', innovationId, role.id, selectedUserId],
    queryFn: () => innovationApi.getSkillMatch(innovationId, role.id, selectedUserId),
    enabled: !!selectedUserId && showMatch,
  });

  const mutation = useMutation({
    mutationFn: (data: { user_id: string; message: string }) =>
      innovationApi.requestJoinRole(innovationId, role.id, { user_id: data.user_id, role: role.title, message: data.message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovation-roles', innovationId] });
      queryClient.invalidateQueries({ queryKey: ['innovation', innovationId] });
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title={`Join as: ${role.title}`}>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Select Contributor</label>
          <select
            {...register('user_id', { required: 'Required' })}
            className="input"
            onChange={(e) => { setSelectedUserId(e.target.value); setShowMatch(true); }}
          >
            <option value="">Select a contributor...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} - {u.department || 'No department'}</option>
            ))}
          </select>
          {errors.user_id && <p className="text-xs text-red-600 mt-1">{errors.user_id.message as string}</p>}
        </div>

        {/* Skill Match Display */}
        {showMatch && selectedUserId && (
          <div className="border border-enterprise-gray-border rounded-md p-3 bg-gray-50">
            {matchLoading ? (
              <p className="text-xs text-enterprise-charcoal/50">Calculating skill match...</p>
            ) : skillMatch ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-enterprise-charcoal/60">Skill Match</span>
                  <span className={`text-sm font-bold ${skillMatch.match_percentage >= 75 ? 'text-green-600' : skillMatch.match_percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {skillMatch.match_percentage}%
                  </span>
                </div>
                <div className="h-2 bg-enterprise-gray-warm rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${skillMatch.match_percentage >= 75 ? 'bg-green-500' : skillMatch.match_percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${skillMatch.match_percentage}%` }}
                  />
                </div>
                {skillMatch.matched_skills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Matched Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {skillMatch.matched_skills.map((s) => (
                        <span key={s} className="badge bg-green-50 text-green-700 text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {skillMatch.missing_skills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-700 mb-1">Missing Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {skillMatch.missing_skills.map((s) => (
                        <span key={s} className="badge bg-red-50 text-red-700 text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {skillMatch.required_skills.length === 0 && (
                  <p className="text-xs text-enterprise-charcoal/50">No specific skills required for this role.</p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Role Info */}
        {role.description && (
          <div className="text-xs text-enterprise-charcoal/60 bg-enterprise-gray-warm/50 rounded-md p-2">
            {role.description}
          </div>
        )}

        <div>
          <label className="label">Message (Optional)</label>
          <textarea {...register('message')} className="input min-h-[60px]" placeholder="Describe your interest and relevant experience..." />
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Request to Join'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---- Join Requests Management Modal ----

function JoinRequestsModal({ innovationId, users, onClose }: { innovationId: string; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: requests, isLoading } = useQuery({
    queryKey: ['join-requests', innovationId],
    queryFn: () => innovationApi.getJoinRequests(innovationId),
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => innovationApi.approveJoinRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', innovationId] });
      queryClient.invalidateQueries({ queryKey: ['innovation-roles', innovationId] });
      queryClient.invalidateQueries({ queryKey: ['innovation', innovationId] });
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (requestId: string) => innovationApi.declineJoinRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', innovationId] });
    },
  });

  const userMap = new Map<string, User>();
  users.forEach((u) => userMap.set(u.id, u));

  const pendingRequests = requests?.filter((r) => r.status === 'requested') || [];
  const processedRequests = requests?.filter((r) => r.status !== 'requested') || [];

  return (
    <Modal open={true} onClose={onClose} title="Join Requests">
      {isLoading ? (
        <Loading message="Loading requests..." />
      ) : (
        <div className="space-y-4">
          {pendingRequests.length === 0 && processedRequests.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-6 h-6" />} title="No join requests" message="Join requests from contributors will appear here." />
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-enterprise-charcoal/50 uppercase tracking-wide">Pending ({pendingRequests.length})</p>
                  {pendingRequests.map((req) => {
                    const user = userMap.get(req.user_id);
                    return (
                      <div key={req.id} className="border border-enterprise-gray-border rounded-md p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-enterprise-charcoal">{user?.name || 'Unknown'}</p>
                            <p className="text-xs text-enterprise-charcoal/50">
                              {user?.department || 'No department'}
                              {req.role && <span> · Role: {req.role}</span>}
                            </p>
                            {req.message && (
                              <p className="text-xs text-enterprise-charcoal/60 mt-1 italic">"{req.message}"</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              className="btn-primary text-xs px-2 py-1"
                              onClick={() => approveMutation.mutate(req.id)}
                              disabled={approveMutation.isPending}
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              className="btn-secondary text-xs px-2 py-1"
                              onClick={() => declineMutation.mutate(req.id)}
                              disabled={declineMutation.isPending}
                            >
                              <X className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {processedRequests.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-enterprise-charcoal/50 uppercase tracking-wide">Processed ({processedRequests.length})</p>
                  {processedRequests.slice(0, 10).map((req) => {
                    const user = userMap.get(req.user_id);
                    return (
                      <div key={req.id} className="border border-enterprise-gray-border rounded-md p-3 opacity-60">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-enterprise-charcoal">{user?.name || 'Unknown'}</p>
                            <p className="text-xs text-enterprise-charcoal/50">
                              {req.role && <span>{req.role}</span>}
                            </p>
                          </div>
                          <StatusBadge status={req.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

// ---- Helper Components ----

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-enterprise-charcoal/40 mb-1">{icon}</div>
      <div className="text-lg font-bold text-enterprise-charcoal">{value}</div>
      <div className="text-xs text-enterprise-charcoal/50">{label}</div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-enterprise-charcoal/50 uppercase tracking-wide mb-1 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm text-enterprise-charcoal/70 leading-relaxed">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-enterprise-charcoal/50">{label}</span>
      <span className="text-enterprise-charcoal font-medium capitalize">{value}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}
