import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Users, Briefcase, Lock, Unlock, Sparkles, Building2, Cpu,
  UserCircle, Clock, Target, AlertCircle, CheckCircle2, FileText, Wrench,
  TrendingUp, Shield, Zap, UserPlus, Star, MessageSquare,
} from 'lucide-react';
import { innovationApi, userApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { Loading, ErrorState, StatusBadge, Modal, EmptyState } from '../components/ui';
import type { User, Position, MarketplaceInnovationDetail } from '../types';

export function InnovationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPosition, setShowPosition] = useState(false);
  const [showApply, setShowApply] = useState<Position | null>(null);
  const [showJoin, setShowJoin] = useState(false);

  const { data: innovation, isLoading, isError } = useQuery({
    queryKey: ['innovation', id],
    queryFn: () => innovationApi.getById(id!),
    enabled: !!id,
  });

  const { data: positions } = useQuery({
    queryKey: ['innovation-positions', id],
    queryFn: () => innovationApi.getPositions(id!),
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

  const queryClient = useQueryClient();

  if (isLoading) return <Loading />;
  if (isError || !innovation) return <ErrorState message="Failed to load innovation" />;

  const openPositions = positions?.filter((p) => p.status === 'open') || [];

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
              className="btn-primary text-sm"
              onClick={() => setShowJoin(true)}
              disabled={!innovation.is_open}
            >
              <UserPlus className="w-4 h-4" /> Join Innovation
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-enterprise-gray-border">
          <StatBlock icon={<Users className="w-4 h-4" />} label="Team Size" value={innovation.team_size} />
          <StatBlock icon={<Briefcase className="w-4 h-4" />} label="Open Roles" value={openPositions.length} />
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

          {/* Open Engineering Opportunities */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2 text-lg">
                <Briefcase className="w-5 h-5 text-enterprise-red" /> Open Engineering Opportunities
              </h2>
              <button className="btn-secondary text-sm" onClick={() => setShowPosition(true)}>
                <Plus className="w-4 h-4" /> Add Role
              </button>
            </div>
            {positions && positions.length > 0 ? (
              <div className="space-y-3">
                {positions.map((pos) => {
                  const assignee = userMap.get(pos.innovation_id);
                  return (
                    <div key={pos.id} className="border border-enterprise-gray-border rounded-md p-4 hover:border-enterprise-red/20 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm text-enterprise-charcoal">{pos.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-enterprise-charcoal/60">
                            <span>{pos.role}</span>
                            {pos.technology && (
                              <>
                                <span className="text-enterprise-charcoal/30">·</span>
                                <span className="flex items-center gap-1">
                                  <Cpu className="w-3 h-3" /> {pos.technology}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={pos.status} />
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-enterprise-charcoal/50">
                          Filled: {pos.filled}/{pos.capacity}
                        </span>
                        {pos.status === 'open' && (
                          <button
                            className="text-enterprise-red font-medium hover:underline flex items-center gap-1"
                            onClick={() => setShowApply(pos)}
                          >
                            <UserPlus className="w-3 h-3" /> Join as Contributor
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Briefcase className="w-6 h-6" />}
                title="No contributor roles"
                message="Open engineering opportunities for contributors will appear here."
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
              {innovation.team_size} team member{innovation.team_size !== 1 ? 's' : ''} · {openPositions.length} open role{openPositions.length !== 1 ? 's' : ''}
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

      {showPosition && (
        <CreatePositionModal innovationId={innovation.id} onClose={() => setShowPosition(false)} />
      )}
      {showApply && users && (
        <ApplyModal position={showApply} users={users} onClose={() => setShowApply(null)} />
      )}
      {showJoin && users && (
        <JoinInnovationModal innovationId={innovation.id} users={users} onClose={() => setShowJoin(false)} />
      )}
    </div>
  );
}

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

function CreatePositionModal({ innovationId, onClose }: { innovationId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { title: '', role: '', technology: '', capacity: 1 },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => innovationApi.createPosition(innovationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovation-positions', innovationId] });
      queryClient.invalidateQueries({ queryKey: ['innovation', innovationId] });
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Add Contributor Role">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Role Title</label>
          <input {...register('title', { required: 'Required' })} className="input" placeholder="e.g. Senior Backend Engineer" />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message as string}</p>}
        </div>
        <div>
          <label className="label">Contributor Role</label>
          <input {...register('role', { required: 'Required' })} className="input" placeholder="e.g. Engineer, Designer, Architect" />
          {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message as string}</p>}
        </div>
        <div>
          <label className="label">Technology</label>
          <input {...register('technology')} className="input" placeholder="e.g. Python, React, Kubernetes" />
        </div>
        <div>
          <label className="label">Capacity</label>
          <input type="number" {...register('capacity', { valueAsNumber: true, min: 1 })} className="input" defaultValue={1} />
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

function ApplyModal({ position, users, onClose }: { position: Position; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { user_id: '' } });

  const mutation = useMutation({
    mutationFn: (data: { user_id: string }) => innovationApi.applyForPosition(position.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovation-positions', position.innovation_id] });
      queryClient.invalidateQueries({ queryKey: ['innovation', position.innovation_id] });
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title={`Join as: ${position.title}`}>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Select Contributor</label>
          <select {...register('user_id', { required: 'Required' })} className="input">
            <option value="">Select a contributor...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} - {u.department || 'No department'}</option>)}
          </select>
          {errors.user_id && <p className="text-xs text-red-600 mt-1">{errors.user_id.message as string}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Joining...' : 'Join Innovation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function JoinInnovationModal({ innovationId, users, onClose }: { innovationId: string; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { user_id: '', role: '', message: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: { user_id: string; role: string; message: string }) =>
      innovationApi.joinInnovation(innovationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovation', innovationId] });
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Join Innovation Team">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Select Contributor</label>
          <select {...register('user_id', { required: 'Required' })} className="input">
            <option value="">Select a contributor...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} - {u.department || 'No department'}</option>)}
          </select>
          {errors.user_id && <p className="text-xs text-red-600 mt-1">{errors.user_id.message as string}</p>}
        </div>
        <div>
          <label className="label">Contributor Role</label>
          <input {...register('role')} className="input" placeholder="e.g. Engineer, Designer, Architect" />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea {...register('message')} className="input min-h-[80px]" placeholder="Describe your interest and relevant skills..." />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
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
