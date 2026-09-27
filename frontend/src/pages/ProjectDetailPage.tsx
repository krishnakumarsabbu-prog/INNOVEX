import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Flag, FileText, CheckCircle, Circle, Clock,
  LayoutGrid, AlertTriangle, Shield, GitBranch, Users, Target,
  Activity as ActivityIcon, Layers, Edit3, Trash2, GripVertical,
} from 'lucide-react';
import { projectApi, teamApi, innovationApi, userApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { Loading, ErrorState, StatusBadge, Modal, EmptyState } from '../components/ui';
import type { User, Team, WorkItem, Milestone, Evidence, Activity, Project } from '../types';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'problem', label: 'Problem', icon: Target },
  { key: 'architecture', label: 'Architecture', icon: Layers },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'backlog', label: 'Backlog', icon: GitBranch },
  { key: 'repository', label: 'Repository', icon: GitBranch },
  { key: 'milestones', label: 'Milestones', icon: Flag },
  { key: 'risks', label: 'Risks', icon: AlertTriangle },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'evidence', label: 'Evidence', icon: FileText },
  { key: 'demo', label: 'Demo', icon: CheckCircle },
  { key: 'activity', label: 'Activity', icon: ActivityIcon },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const KANBAN_COLUMNS = [
  { key: 'backlog', label: 'Backlog', color: 'border-t-gray-400' },
  { key: 'ready', label: 'Ready', color: 'border-t-blue-400' },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-amber-400' },
  { key: 'review', label: 'Review', color: 'border-t-purple-400' },
  { key: 'done', label: 'Done', color: 'border-t-green-400' },
] as const;

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showEditProject, setShowEditProject] = useState(false);

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getById(id!),
    enabled: !!id,
  });

  const { data: team } = useQuery({
    queryKey: ['team', project?.team_id],
    queryFn: () => teamApi.getById(project!.team_id!),
    enabled: !!project?.team_id,
  });

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => userApi.getAll() });
  const userMap = new Map<string, User>();
  users?.forEach((u) => userMap.set(u.id, u));

  if (isLoading) return <Loading />;
  if (isError || !project) return <ErrorState message="Failed to load project" />;

  return (
    <div>
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1 text-sm text-enterprise-charcoal/60 hover:text-enterprise-charcoal mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      {/* Project Header */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={project.status} />
              {project.innovation_id && (
                <span className="badge bg-enterprise-gray-warm text-enterprise-charcoal/60">
                  Linked Innovation
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-enterprise-charcoal">{project.name}</h1>
            <p className="text-sm text-enterprise-charcoal/60 mt-1 max-w-3xl">{project.description || 'No description provided.'}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={() => setShowEditProject(true)}>
              <Edit3 className="w-4 h-4" /> Edit
            </button>
          </div>
        </div>

        {/* Traceability Chain */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-enterprise-gray-border text-xs">
          <TraceabilityLink label="Idea" />
          <TraceabilityArrow />
          <TraceabilityLink label="Innovation" active={!!project.innovation_id} />
          <TraceabilityArrow />
          <TraceabilityLink label="Team" active={!!project.team_id} />
          <TraceabilityArrow />
          <TraceabilityLink label="Project" active />
          <TraceabilityArrow />
          <TraceabilityLink label="Milestones" />
          <TraceabilityArrow />
          <TraceabilityLink label="Work Items" />
          <TraceabilityArrow />
          <TraceabilityLink label="Evidence" />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="card mb-4 overflow-hidden">
        <div className="flex items-center gap-0 overflow-x-auto border-b border-enterprise-gray-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-enterprise-red text-enterprise-red bg-enterprise-red/5'
                    : 'border-transparent text-enterprise-charcoal/60 hover:text-enterprise-charcoal hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'overview' && <OverviewTab project={project} team={team || null} userMap={userMap} />}
        {activeTab === 'problem' && <ProblemTab project={project} />}
        {activeTab === 'architecture' && <ArchitectureTab project={project} />}
        {activeTab === 'team' && <TeamTab project={project} team={team || null} userMap={userMap} />}
        {activeTab === 'backlog' && <BacklogTab projectId={project.id} users={users || []} />}
        {activeTab === 'repository' && <RepositoryTab project={project} />}
        {activeTab === 'milestones' && <MilestonesTab projectId={project.id} />}
        {activeTab === 'risks' && <RisksTab project={project} />}
        {activeTab === 'security' && <SecurityTab project={project} />}
        {activeTab === 'evidence' && <EvidenceTab projectId={project.id} users={users || []} />}
        {activeTab === 'demo' && <DemoTab projectId={project.id} />}
        {activeTab === 'activity' && <ActivityTab projectId={project.id} />}
      </div>

      {showEditProject && (
        <EditProjectModal project={project} onClose={() => setShowEditProject(false)} />
      )}
    </div>
  );
}

// ===================== Traceability =====================

function TraceabilityLink({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-md font-medium ${
        active ? 'bg-enterprise-red/10 text-enterprise-red' : 'bg-gray-100 text-enterprise-charcoal/40'
      }`}
    >
      {label}
    </span>
  );
}

function TraceabilityArrow() {
  return <span className="text-enterprise-charcoal/30">→</span>;
}

// ===================== Overview Tab =====================

function OverviewTab({ project, team, userMap }: { project: Project; team: Team | null; userMap: Map<string, User> }) {
  const { data: milestones } = useQuery({
    queryKey: ['project-milestones', project.id],
    queryFn: () => projectApi.getMilestones(project.id),
  });
  const { data: workItems } = useQuery({
    queryKey: ['project-work-items', project.id],
    queryFn: () => projectApi.getWorkItems(project.id),
  });
  const { data: evidence } = useQuery({
    queryKey: ['project-evidence', project.id],
    queryFn: () => projectApi.getEvidence(project.id),
  });

  const doneMilestones = milestones?.filter((m) => m.status === 'done').length || 0;
  const totalMilestones = milestones?.length || 0;
  const doneItems = workItems?.filter((w) => w.status === 'done').length || 0;
  const totalItems = workItems?.length || 0;
  const progress = totalMilestones > 0 ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Milestones" value={`${doneMilestones}/${totalMilestones}`} icon={<Flag className="w-5 h-5" />} />
        <StatCard label="Work Items" value={`${doneItems}/${totalItems}`} icon={<GitBranch className="w-5 h-5" />} />
        <StatCard label="Evidence" value={evidence?.length || 0} icon={<FileText className="w-5 h-5" />} />
        <StatCard label="Team" value={team?.member_ids.length || 0} icon={<Users className="w-5 h-5" />} />
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-3 text-lg">Project Progress</h3>
        <div className="mb-2 flex items-center justify-between text-sm text-enterprise-charcoal/60">
          <span>Milestone completion</span>
          <span className="font-semibold text-enterprise-charcoal">{progress}%</span>
        </div>
        <div className="h-3 bg-enterprise-gray-warm rounded-full overflow-hidden">
          <div
            className="h-full bg-enterprise-red rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-3 text-lg">Project Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <DetailField label="Status" value={project.status.replace(/_/g, ' ')} />
          <DetailField label="Created" value={formatDate(project.created_at)} />
          <DetailField label="Last Updated" value={formatDate(project.updated_at)} />
          <DetailField label="Team" value={team?.name || 'Unassigned'} />
        </div>
      </div>
    </div>
  );
}

// ===================== Problem Tab =====================

function ProblemTab({ project }: { project: Project }) {
  return (
    <div className="card p-6">
      <h3 className="section-title mb-3 text-lg">Problem Statement</h3>
      <p className="text-sm text-enterprise-charcoal/70 leading-relaxed mb-6">
        {project.description || 'No problem statement has been defined for this project yet.'}
      </p>
      <div className="border-t border-enterprise-gray-border pt-4">
        <h4 className="text-sm font-semibold text-enterprise-charcoal mb-2">Success Criteria</h4>
        <p className="text-sm text-enterprise-charcoal/60">
          Success criteria will be defined as milestones and work items are created.
          Use the Milestones tab to track key deliverables and the Backlog tab to manage work items.
        </p>
      </div>
    </div>
  );
}

// ===================== Architecture Tab =====================

function ArchitectureTab({ project }: { project: Project }) {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="section-title mb-3 text-lg">Architecture Overview</h3>
        <p className="text-sm text-enterprise-charcoal/70 leading-relaxed">
          {project.description || 'No architecture documentation has been added yet.'}
        </p>
      </div>
      <div className="card p-6">
        <h3 className="section-title mb-3 text-lg">Technology Stack</h3>
        <div className="flex flex-wrap gap-2">
          <span className="badge bg-enterprise-gray-warm text-enterprise-charcoal/70">React 19</span>
          <span className="badge bg-enterprise-gray-warm text-enterprise-charcoal/70">TypeScript</span>
          <span className="badge bg-enterprise-gray-warm text-enterprise-charcoal/70">FastAPI</span>
          <span className="badge bg-enterprise-gray-warm text-enterprise-charcoal/70">Python 3.12+</span>
        </div>
      </div>
      <div className="card p-6">
        <h3 className="section-title mb-3 text-lg">Dependencies</h3>
        <p className="text-sm text-enterprise-charcoal/60">
          No external dependencies have been documented for this project.
        </p>
      </div>
    </div>
  );
}

// ===================== Team Tab =====================

function TeamTab({ project, team, userMap }: { project: Project; team: Team | null; userMap: Map<string, User> }) {
  if (!team) {
    return (
      <div className="card p-6">
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No team assigned"
          message="This project has not been linked to a team yet. Assign a team from the innovation pipeline."
        />
      </div>
    );
  }

  const lead = team.lead_id ? userMap.get(team.lead_id) : null;

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title text-lg">{team.name}</h3>
          <StatusBadge status="active" />
        </div>
        {lead && (
          <div className="flex items-center gap-3 mb-4 border border-enterprise-gray-border rounded-md p-3">
            <div className="w-10 h-10 rounded-full bg-enterprise-red/10 flex items-center justify-center text-enterprise-red font-medium">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-enterprise-charcoal">{lead.name}</p>
              <p className="text-xs text-enterprise-charcoal/50">Team Lead · {lead.title || lead.department}</p>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {team.member_ids.map((memberId) => {
            const member = userMap.get(memberId);
            return (
              <div key={memberId} className="flex items-center gap-3 border border-enterprise-gray-border rounded-md p-3">
                <div className="w-9 h-9 rounded-full bg-enterprise-red/10 flex items-center justify-center text-enterprise-red font-medium text-sm">
                  {member?.name.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-enterprise-charcoal">{member?.name || 'Unknown'}</p>
                  <p className="text-xs text-enterprise-charcoal/50">{member?.title || ''} {member?.department ? `· ${member.department}` : ''}</p>
                </div>
              </div>
            );
          })}
          {team.member_ids.length === 0 && (
            <p className="text-sm text-enterprise-charcoal/50 text-center py-4">No team members assigned.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== Backlog Tab (Kanban) =====================

function BacklogTab({ projectId, users }: { projectId: string; users: User[] }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const { data: workItems, isLoading } = useQuery({
    queryKey: ['project-work-items', projectId],
    queryFn: () => projectApi.getWorkItems(projectId),
  });
  const { data: milestones } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: () => projectApi.getMilestones(projectId),
  });

  const userMap = new Map<string, User>();
  users.forEach((u) => userMap.set(u.id, u));

  const patchMutation = useMutation({
    mutationFn: ({ workItemId, data }: { workItemId: string; data: Partial<WorkItem> }) =>
      projectApi.patchWorkItem(projectId, workItemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-work-items', projectId] });
    },
  });

  const handleDrop = (status: string) => {
    if (draggedItem) {
      patchMutation.mutate({ workItemId: draggedItem, data: { status } });
      setDraggedItem(null);
      setDropTarget(null);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title text-lg">Kanban Board</h3>
        <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Add Work Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 min-h-[400px]">
        {KANBAN_COLUMNS.map((col) => {
          const items = workItems?.filter((w) => w.status === col.key) || [];
          return (
            <div
              key={col.key}
              className={`card border-t-4 ${col.color} ${dropTarget === col.key ? 'ring-2 ring-enterprise-red/30' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDropTarget(col.key); }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={() => handleDrop(col.key)}
            >
              <div className="px-3 py-2.5 border-b border-enterprise-gray-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-enterprise-charcoal">{col.label}</span>
                  <span className="badge bg-enterprise-gray-warm text-enterprise-charcoal/60">{items.length}</span>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[100px]">
                {items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedItem(item.id)}
                    onDragEnd={() => { setDraggedItem(null); setDropTarget(null); }}
                    className="border border-enterprise-gray-border rounded-md p-3 bg-white cursor-move hover:shadow-sm transition-shadow group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-enterprise-charcoal/20 mt-0.5 group-hover:text-enterprise-charcoal/40 transition-colors" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-enterprise-charcoal">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-enterprise-charcoal/60 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {item.assignee_id && userMap.get(item.assignee_id) && (
                            <div className="w-5 h-5 rounded-full bg-enterprise-red/10 flex items-center justify-center text-enterprise-red text-[10px] font-medium">
                              {userMap.get(item.assignee_id)!.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {item.milestone_id && milestones?.find((m) => m.id === item.milestone_id) && (
                            <span className="badge bg-blue-50 text-blue-700 text-[10px]">
                              {milestones.find((m) => m.id === item.milestone_id)!.title.substring(0, 20)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-enterprise-charcoal/30 text-center py-6">Drop items here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateWorkItemModal projectId={projectId} milestones={milestones || []} users={users} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function CreateWorkItemModal({ projectId, milestones, users, onClose }: { projectId: string; milestones: Milestone[]; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { title: '', description: '', milestone_id: '', assignee_id: '', status: 'backlog' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => projectApi.createWorkItem(projectId, {
      ...data,
      milestone_id: data.milestone_id || null,
      assignee_id: data.assignee_id || null,
      order_index: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-work-items', projectId] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Add Work Item">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input {...register('title', { required: 'Required' })} className="input" placeholder="Work item title" />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message as string}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} className="input min-h-[60px]" placeholder="Work item description" />
        </div>
        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input">
            <option value="backlog">Backlog</option>
            <option value="ready">Ready</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div>
          <label className="label">Milestone (Optional)</label>
          <select {...register('milestone_id')} className="input">
            <option value="">None</option>
            {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Assignee (Optional)</label>
          <select {...register('assignee_id')} className="input">
            <option value="">None</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Work Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ===================== Repository Tab =====================

function RepositoryTab({ project }: { project: Project }) {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="section-title mb-3 text-lg flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-enterprise-red" /> Repository
        </h3>
        <p className="text-sm text-enterprise-charcoal/60 mb-4">
          Connect this project to a source code repository to track branches, commits, and pull requests.
        </p>
        <div className="border border-dashed border-enterprise-gray-border rounded-md p-6 text-center">
          <GitBranch className="w-8 h-8 text-enterprise-charcoal/20 mx-auto mb-2" />
          <p className="text-sm text-enterprise-charcoal/50">No repository connected</p>
          <p className="text-xs text-enterprise-charcoal/40 mt-1">Link a Git repository to track code changes alongside project milestones.</p>
        </div>
      </div>
      <div className="card p-5">
        <h4 className="text-sm font-semibold text-enterprise-charcoal mb-3">Branch Strategy</h4>
        <div className="space-y-2 text-sm text-enterprise-charcoal/60">
          <p><span className="font-medium text-enterprise-charcoal">main</span> — Production-ready code</p>
          <p><span className="font-medium text-enterprise-charcoal">develop</span> — Integration branch</p>
          <p><span className="font-medium text-enterprise-charcoal">feature/*</span> — Feature branches per work item</p>
        </div>
      </div>
    </div>
  );
}

// ===================== Milestones Tab =====================

function MilestonesTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: () => projectApi.getMilestones(projectId),
  });

  const patchMutation = useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: Partial<Milestone> }) =>
      projectApi.patchMilestone(projectId, milestoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] });
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title text-lg">Milestones</h3>
        <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Add Milestone
        </button>
      </div>

      {milestones && milestones.length > 0 ? (
        <div className="space-y-3">
          {milestones.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-start gap-3">
                {m.status === 'done' ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" /> :
                 m.status === 'in_progress' ? <Clock className="w-5 h-5 text-blue-600 mt-0.5" /> :
                 m.status === 'blocked' ? <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" /> :
                 <Circle className="w-5 h-5 text-gray-400 mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-enterprise-charcoal">{m.title}</p>
                  {m.description && <p className="text-xs text-enterprise-charcoal/60 mt-1">{m.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={m.status} />
                    {m.due_date && <span className="text-xs text-enterprise-charcoal/50">Due: {new Date(m.due_date).toLocaleDateString()}</span>}
                    {m.completed_at && <span className="text-xs text-green-600">Completed: {formatDate(m.completed_at)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {m.status !== 'done' && (
                    <button
                      className="text-xs text-enterprise-red hover:underline"
                      onClick={() => patchMutation.mutate({ milestoneId: m.id, data: { status: 'done' } })}
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6">
          <EmptyState icon={<Flag className="w-8 h-8" />} title="No milestones" message="Add milestones to track project progress and key deliverables." />
        </div>
      )}

      {showCreate && <CreateMilestoneModal projectId={projectId} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateMilestoneModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { title: '', description: '', due_date: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => projectApi.createMilestone(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Add Milestone">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input {...register('title', { required: 'Required' })} className="input" placeholder="Milestone title" />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message as string}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} className="input min-h-[60px]" placeholder="Milestone description" />
        </div>
        <div>
          <label className="label">Due Date (Optional)</label>
          <input type="date" {...register('due_date')} className="input" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding...' : 'Add Milestone'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ===================== Risks Tab =====================

function RisksTab({ project }: { project: Project }) {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="section-title mb-3 text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-enterprise-red" /> Risk Register
        </h3>
        <p className="text-sm text-enterprise-charcoal/60 mb-4">
          Track and manage project risks. Risks can be linked to milestones and work items.
        </p>
        <div className="border border-dashed border-enterprise-gray-border rounded-md p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-enterprise-charcoal/20 mx-auto mb-2" />
          <p className="text-sm text-enterprise-charcoal/50">No risks identified</p>
          <p className="text-xs text-enterprise-charcoal/40 mt-1">Add risks as they are identified during the project lifecycle.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskCard level="High" count={0} color="text-red-600" />
        <RiskCard level="Medium" count={0} color="text-amber-600" />
        <RiskCard level="Low" count={0} color="text-green-600" />
      </div>
    </div>
  );
}

function RiskCard({ level, count, color }: { level: string; count: number; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold ${color}`}>{level} Risk</span>
        <span className={`text-2xl font-bold ${color}`}>{count}</span>
      </div>
      <p className="text-xs text-enterprise-charcoal/50">No {level.toLowerCase()} risks identified</p>
    </div>
  );
}

// ===================== Security Tab =====================

function SecurityTab({ project }: { project: Project }) {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="section-title mb-3 text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-enterprise-red" /> Security Posture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SecurityCheckItem label="Security Review" status="pending" />
          <SecurityCheckItem label="Threat Model" status="pending" />
          <SecurityCheckItem label="Dependency Scan" status="pending" />
          <SecurityCheckItem label="Code Review" status="pending" />
        </div>
      </div>
      <div className="card p-5">
        <h4 className="text-sm font-semibold text-enterprise-charcoal mb-2">Security Notes</h4>
        <p className="text-sm text-enterprise-charcoal/60">
          No security notes have been recorded. Security reviews should be completed before production deployment.
        </p>
      </div>
    </div>
  );
}

function SecurityCheckItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between border border-enterprise-gray-border rounded-md p-3">
      <span className="text-sm text-enterprise-charcoal">{label}</span>
      <span className={`badge ${status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
        {status === 'completed' ? 'Completed' : 'Pending'}
      </span>
    </div>
  );
}

// ===================== Evidence Tab =====================

function EvidenceTab({ projectId, users }: { projectId: string; users: User[]; }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: evidence, isLoading } = useQuery({
    queryKey: ['project-evidence', projectId],
    queryFn: () => projectApi.getEvidence(projectId),
  });

  const userMap = new Map<string, User>();
  users.forEach((u) => userMap.set(u.id, u));

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title text-lg">Evidence</h3>
        <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Add Evidence
        </button>
      </div>

      {evidence && evidence.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {evidence.map((e) => (
            <div key={e.id} className="card p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-enterprise-red mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-enterprise-charcoal">{e.title}</p>
                  {e.description && <p className="text-xs text-enterprise-charcoal/60 mt-1">{e.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge bg-gray-100 text-gray-700">{e.evidence_type}</span>
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noreferrer" className="text-xs text-enterprise-red hover:underline">
                        View
                      </a>
                    )}
                    <span className="text-xs text-enterprise-charcoal/50">
                      by {userMap.get(e.created_by)?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6">
          <EmptyState icon={<FileText className="w-8 h-8" />} title="No evidence" message="Upload evidence, POCs, and demo materials to support project milestones." />
        </div>
      )}

      {showCreate && users.length > 0 && (
        <CreateEvidenceModal projectId={projectId} users={users} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function CreateEvidenceModal({ projectId, users, onClose }: { projectId: string; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { title: '', description: '', evidence_type: 'document', url: '', created_by: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => projectApi.createEvidence(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-evidence', projectId] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Add Evidence">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input {...register('title', { required: 'Required' })} className="input" placeholder="Evidence title" />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message as string}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} className="input min-h-[60px]" placeholder="Evidence description" />
        </div>
        <div>
          <label className="label">Type</label>
          <select {...register('evidence_type')} className="input">
            <option value="document">Document</option>
            <option value="poc">POC</option>
            <option value="demo">Demo</option>
            <option value="report">Report</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">URL (Optional)</label>
          <input {...register('url')} className="input" placeholder="Link to evidence" />
        </div>
        <div>
          <label className="label">Added By</label>
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

// ===================== Demo Tab =====================

function DemoTab({ projectId }: { projectId: string }) {
  const { data: evidence } = useQuery({
    queryKey: ['project-evidence', projectId],
    queryFn: () => projectApi.getEvidence(projectId),
  });
  const { data: milestones } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: () => projectApi.getMilestones(projectId),
  });

  const demoEvidence = evidence?.filter((e) => e.evidence_type === 'demo' || e.evidence_type === 'poc') || [];
  const doneMilestones = milestones?.filter((m) => m.status === 'done') || [];

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="section-title mb-3 text-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-enterprise-red" /> Demo Readiness
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DemoCheckItem label="Milestones Completed" value={`${doneMilestones.length}/${milestones?.length || 0}`} />
          <DemoCheckItem label="Demo Evidence" value={demoEvidence.length} />
          <DemoCheckItem label="Overall Status" value="In Progress" />
        </div>
      </div>

      <div className="card p-5">
        <h4 className="text-sm font-semibold text-enterprise-charcoal mb-3">Demo Materials</h4>
        {demoEvidence.length > 0 ? (
          <div className="space-y-2">
            {demoEvidence.map((e) => (
              <div key={e.id} className="flex items-center gap-3 border border-enterprise-gray-border rounded-md p-3">
                <FileText className="w-5 h-5 text-enterprise-red" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-enterprise-charcoal">{e.title}</p>
                  {e.description && <p className="text-xs text-enterprise-charcoal/60 mt-1">{e.description}</p>}
                </div>
                {e.url && (
                  <a href={e.url} target="_blank" rel="noreferrer" className="text-xs text-enterprise-red hover:underline">
                    Open
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-enterprise-charcoal/50">No demo materials have been uploaded yet.</p>
        )}
      </div>
    </div>
  );
}

function DemoCheckItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-enterprise-gray-border rounded-md p-3 text-center">
      <p className="text-2xl font-bold text-enterprise-charcoal">{value}</p>
      <p className="text-xs text-enterprise-charcoal/50 mt-1">{label}</p>
    </div>
  );
}

// ===================== Activity Tab =====================

function ActivityTab({ projectId }: { projectId: string }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['project-activities', projectId],
    queryFn: () => projectApi.getActivities(projectId),
  });

  if (isLoading) return <Loading />;

  return (
    <div className="card p-5">
      <h3 className="section-title mb-4 text-lg flex items-center gap-2">
        <ActivityIcon className="w-5 h-5 text-enterprise-red" /> Activity Feed
      </h3>
      {activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3 border-l-2 border-enterprise-red/30 pl-3">
              <div className="flex-1">
                <p className="text-sm text-enterprise-charcoal">{a.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-enterprise-charcoal/40">{a.action.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-enterprise-charcoal/40">·</span>
                  <span className="text-xs text-enterprise-charcoal/40">{formatDate(a.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<ActivityIcon className="w-8 h-8" />} title="No activity yet" message="Project activity will appear here as milestones and work items are created and updated." />
      )}
    </div>
  );
}

// ===================== Edit Project Modal =====================

function EditProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: project.name,
      description: project.description,
      status: project.status,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => projectApi.patch(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Edit Project">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Project Name</label>
          <input {...register('name', { required: 'Required' })} className="input" />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message as string}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} className="input min-h-[80px]" />
        </div>
        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input">
            <option value="not_started">Not Started</option>
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ===================== Shared Helpers =====================

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-enterprise-charcoal/50">{label}</span>
        <span className="text-enterprise-red">{icon}</span>
      </div>
      <p className="text-xl font-bold text-enterprise-charcoal">{value}</p>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-enterprise-charcoal/50 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-enterprise-charcoal mt-0.5 capitalize">{value}</p>
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
