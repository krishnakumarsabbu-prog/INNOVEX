import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, peopleApi, notificationApi, auditApi } from '../api/endpoints';
import type { TechnologyTaxonomyItem, BusinessArea, ReviewPanel, Workflow, Policy, RoleDefinition, User, AuditEvent, Notification } from '../types';
import { PageHeader, Loading, ErrorState, Modal, StatusBadge, EmptyState } from '../components/ui';
import {
  Building2, Users, Shield, Cpu, Layers, ClipboardList, GitBranch, Settings,
  Bell, FileSearch, Plus, Trash2, Save, X, ChevronRight, Server,
} from 'lucide-react';

type SectionKey =
  | 'organizations' | 'people' | 'roles' | 'skills'
  | 'technologies' | 'business_areas' | 'review_panels'
  | 'workflows' | 'policies' | 'notifications' | 'audit';

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  { key: 'organizations', label: 'Organizations', icon: <Building2 className="w-4 h-4" /> },
  { key: 'people', label: 'People', icon: <Users className="w-4 h-4" /> },
  { key: 'roles', label: 'Roles', icon: <Shield className="w-4 h-4" /> },
  { key: 'skills', label: 'Skills', icon: <Cpu className="w-4 h-4" /> },
  { key: 'technologies', label: 'Technology Taxonomy', icon: <Layers className="w-4 h-4" /> },
  { key: 'business_areas', label: 'Business Areas', icon: <Building2 className="w-4 h-4" /> },
  { key: 'review_panels', label: 'Review Panels', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'workflows', label: 'Workflow', icon: <GitBranch className="w-4 h-4" /> },
  { key: 'policies', label: 'Policies', icon: <Settings className="w-4 h-4" /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { key: 'audit', label: 'Audit', icon: <FileSearch className="w-4 h-4" /> },
];

export function AdministrationPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('organizations');

  return (
    <div className="animate-fade-in">
      <PageHeader title="Administration & Governance" subtitle="Manage organizations, people, roles, taxonomy, policies, and audit trails" />
      <div className="flex gap-6">
        <nav className="w-56 flex-shrink-0">
          <div className="card p-2 space-y-0.5 sticky top-20">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-enterprise text-sm font-medium transition-colors text-left ${
                  activeSection === s.key
                    ? 'bg-enterprise-red-600 text-white'
                    : 'text-enterprise-charcoal-600 hover:bg-enterprise-gray-warm hover:text-enterprise-charcoal-800'
                }`}
              >
                {s.icon}
                <span className="flex-1">{s.label}</span>
                {activeSection === s.key && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </nav>
        <div className="flex-1 min-w-0">
          {activeSection === 'organizations' && <OrganizationsSection />}
          {activeSection === 'people' && <PeopleSection />}
          {activeSection === 'roles' && <RolesSection />}
          {activeSection === 'skills' && <SkillsSection />}
          {activeSection === 'technologies' && <TechnologiesSection />}
          {activeSection === 'business_areas' && <BusinessAreasSection />}
          {activeSection === 'review_panels' && <ReviewPanelsSection />}
          {activeSection === 'workflows' && <WorkflowsSection />}
          {activeSection === 'policies' && <PoliciesSection />}
          {activeSection === 'notifications' && <NotificationsSection />}
          {activeSection === 'audit' && <AuditSection />}
        </div>
      </div>
    </div>
  );
}

// ============ ORGANIZATIONS ============

function OrganizationsSection() {
  const qc = useQueryClient();
  const { data: org, isLoading } = useQuery({ queryKey: ['admin-org'], queryFn: adminApi.getOrganization });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  if (isLoading) return <Loading />;
  if (!org || !org.id) return <EmptyState icon={<Building2 className="w-8 h-8" />} title="No organization" message="Create an organization via setup." />;

  const updateMut = useMutation({
    mutationFn: (newName: string) => adminApi.updateOrganization(org.id, newName),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-org'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setEditing(false); },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-enterprise-charcoal-800">Organization Details</h2>
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-enterprise-charcoal-500">Name</p>
            {editing ? (
              <div className="flex items-center gap-2 mt-1">
                <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" />
                <button onClick={() => updateMut.mutate(name)} disabled={!name.trim()} className="btn-primary"><Save className="w-4 h-4" /></button>
                <button onClick={() => setEditing(false)} className="btn-ghost"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <p className="text-lg font-semibold text-enterprise-charcoal-800 mt-1">{org.name}</p>
            )}
            <p className="text-xs text-enterprise-charcoal-400 mt-2">Created: {new Date(org.created_at).toLocaleDateString()}</p>
          </div>
          {!editing && (
            <button onClick={() => { setName(org.name); setEditing(true); }} className="btn-ghost text-sm">Edit</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ PEOPLE ============

function PeopleSection() {
  const { data: users, isLoading, error } = useQuery({ queryKey: ['admin-people'], queryFn: () => peopleApi.getAll() });
  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} />;
  if (!users || users.length === 0) return <EmptyState icon={<Users className="w-8 h-8" />} title="No people" message="No users have been added yet." />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-enterprise-charcoal-800">People ({users.length})</h2>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-enterprise-gray-warm border-b border-enterprise-gray-border">
            <tr>
              <th className="text-left px-4 py-2 font-semibold text-enterprise-charcoal-600">Name</th>
              <th className="text-left px-4 py-2 font-semibold text-enterprise-charcoal-600">Email</th>
              <th className="text-left px-4 py-2 font-semibold text-enterprise-charcoal-600">Role</th>
              <th className="text-left px-4 py-2 font-semibold text-enterprise-charcoal-600">Title</th>
              <th className="text-left px-4 py-2 font-semibold text-enterprise-charcoal-600">Department</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: User) => (
              <tr key={u.id} className="border-b border-enterprise-gray-border last:border-0 hover:bg-enterprise-gray-warm/50">
                <td className="px-4 py-2.5 font-medium text-enterprise-charcoal-800">{u.name}</td>
                <td className="px-4 py-2.5 text-enterprise-charcoal-500">{u.email}</td>
                <td className="px-4 py-2.5"><StatusBadge status={u.role} /></td>
                <td className="px-4 py-2.5 text-enterprise-charcoal-500">{u.title || '—'}</td>
                <td className="px-4 py-2.5 text-enterprise-charcoal-500">{u.department || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ ROLES ============

function RolesSection() {
  const { data: roles, isLoading } = useQuery({ queryKey: ['admin-roles'], queryFn: adminApi.getRoles });
  if (isLoading) return <Loading />;
  if (!roles) return <ErrorState message="Failed to load roles" />;

  const roleDescriptions: Record<string, string> = {
    admin: 'Full platform access including governance, policies, and user management.',
    principal_engineer: 'Provides technical leadership, reviews ideas, and leads validation sprints.',
    manager: 'Manages engineering teams and oversees innovation projects.',
    panel_member: 'Participates in review panels and evaluates submitted ideas.',
    engineer: 'Contributes to ideas, projects, and innovation teams.',
    contributor: 'Submits and follows ideas across the organization.',
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-enterprise-charcoal-800">Platform Roles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roles.map((r: RoleDefinition) => (
          <div key={r.key} className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-enterprise-red-600" />
              <span className="font-semibold text-enterprise-charcoal-800">{r.label}</span>
            </div>
            <p className="text-sm text-enterprise-charcoal-500">{roleDescriptions[r.key] || 'System role.'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SKILLS ============

function SkillsSection() {
  const { data: users, isLoading } = useQuery({ queryKey: ['admin-people'], queryFn: () => peopleApi.getAll() });
  if (isLoading) return <Loading />;
  if (!users) return <ErrorState message="Failed to load skills data" />;

  const skillMap = new Map<string, number>();
  users.forEach((u: User) => u.skills.forEach((s) => skillMap.set(s, (skillMap.get(s) || 0) + 1)));
  const skills = Array.from(skillMap.entries()).sort((a, b) => b[1] - a[1]);

  if (skills.length === 0) return <EmptyState icon={<Cpu className="w-8 h-8" />} title="No skills" message="Skills appear here once users have them." />;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-enterprise-charcoal-800">Skills Registry ({skills.length})</h2>
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {skills.map(([skill, count]) => (
            <div key={skill} className="flex items-center gap-2 bg-enterprise-gray-warm rounded-enterprise px-3 py-1.5">
              <span className="text-sm font-medium text-enterprise-charcoal-800">{skill}</span>
              <span className="text-xs text-enterprise-charcoal-500 bg-white rounded-full px-2 py-0.5">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ TECHNOLOGY TAXONOMY ============

function TechnologiesSection() {
  const qc = useQueryClient();
  const { data: techs, isLoading, error } = useQuery({ queryKey: ['admin-techs'], queryFn: adminApi.getTechnologies });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', description: '' });

  const createMut = useMutation({
    mutationFn: () => adminApi.createTechnology(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-techs'] }); setShowAdd(false); setForm({ name: '', category: '', description: '' }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteTechnology(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-techs'] }),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} />;

  const grouped = new Map<string, TechnologyTaxonomyItem[]>();
  (techs || []).forEach((t) => {
    const cat = t.category || 'Uncategorized';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(t);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-enterprise-charcoal-800">Technology Taxonomy ({techs?.length || 0})</h2>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add</button>
      </div>
      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category} className="card p-4">
          <h3 className="text-sm font-semibold text-enterprise-charcoal-600 mb-2">{category}</h3>
          <div className="flex flex-wrap gap-2">
            {items.map((t) => (
              <div key={t.id} className="flex items-center gap-2 bg-enterprise-gray-warm rounded-enterprise px-3 py-1.5 group">
                <span className="text-sm font-medium text-enterprise-charcoal-800">{t.name}</span>
                {t.description && <span className="text-xs text-enterprise-charcoal-400">{t.description}</span>}
                <button onClick={() => deleteMut.mutate(t.id)} className="opacity-0 group-hover:opacity-100 text-enterprise-error-500 hover:text-enterprise-error-700 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Technology">
        <div className="space-y-3">
          <input placeholder="Name (e.g. Kubernetes)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" />
          <input placeholder="Category (e.g. Cloud)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-base" />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-base" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={() => createMut.mutate()} disabled={!form.name.trim()} className="btn-primary text-sm">Add</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============ BUSINESS AREAS ============

function BusinessAreasSection() {
  const qc = useQueryClient();
  const { data: areas, isLoading, error } = useQuery({ queryKey: ['admin-areas'], queryFn: adminApi.getBusinessAreas });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const createMut = useMutation({
    mutationFn: () => adminApi.createBusinessArea(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-areas'] }); setShowAdd(false); setForm({ name: '', description: '' }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteBusinessArea(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-areas'] }),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-enterprise-charcoal-800">Business Areas ({areas?.length || 0})</h2>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add</button>
      </div>
      {(areas || []).length === 0 ? (
        <EmptyState icon={<Building2 className="w-8 h-8" />} title="No business areas" message="Add business areas to categorize ideas." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(areas || []).map((a: BusinessArea) => (
            <div key={a.id} className="card p-4 group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-enterprise-charcoal-800">{a.name}</p>
                  {a.description && <p className="text-sm text-enterprise-charcoal-500 mt-1">{a.description}</p>}
                </div>
                <button onClick={() => deleteMut.mutate(a.id)} className="opacity-0 group-hover:opacity-100 text-enterprise-error-500 hover:text-enterprise-error-700 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Business Area">
        <div className="space-y-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-base" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={() => createMut.mutate()} disabled={!form.name.trim()} className="btn-primary text-sm">Add</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============ REVIEW PANELS ============

function ReviewPanelsSection() {
  const qc = useQueryClient();
  const { data: panels, isLoading, error } = useQuery({ queryKey: ['admin-panels'], queryFn: adminApi.getReviewPanels });
  const { data: users } = useQuery({ queryKey: ['admin-people'], queryFn: () => peopleApi.getAll() });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', member_ids: [] as string[] });

  const createMut = useMutation({
    mutationFn: () => adminApi.createReviewPanel(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-panels'] }); setShowAdd(false); setForm({ name: '', description: '', member_ids: [] }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteReviewPanel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-panels'] }),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} />;

  const userName = (id: string) => users?.find((u) => u.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-enterprise-charcoal-800">Review Panels ({panels?.length || 0})</h2>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add</button>
      </div>
      {(panels || []).length === 0 ? (
        <EmptyState icon={<ClipboardList className="w-8 h-8" />} title="No review panels" message="Create review panels to manage idea evaluations." />
      ) : (
        <div className="space-y-2">
          {(panels || []).map((p: ReviewPanel) => (
            <div key={p.id} className="card p-4 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-enterprise-charcoal-800">{p.name}</p>
                  {p.description && <p className="text-sm text-enterprise-charcoal-500 mt-1">{p.description}</p>}
                  {p.member_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.member_ids.map((id) => (
                        <span key={id} className="text-xs bg-enterprise-gray-warm rounded-full px-2.5 py-0.5 text-enterprise-charcoal-600">{userName(id)}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteMut.mutate(p.id)} className="opacity-0 group-hover:opacity-100 text-enterprise-error-500 hover:text-enterprise-error-700 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Review Panel">
        <div className="space-y-3">
          <input placeholder="Panel name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-base" />
          <div>
            <p className="text-sm font-medium text-enterprise-charcoal-600 mb-1.5">Members</p>
            <div className="max-h-40 overflow-y-auto space-y-1.5 border border-enterprise-gray-border rounded-enterprise p-2">
              {(users || []).map((u) => (
                <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.member_ids.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) setForm({ ...form, member_ids: [...form.member_ids, u.id] });
                      else setForm({ ...form, member_ids: form.member_ids.filter((id) => id !== u.id) });
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-enterprise-charcoal-800">{u.name} — {u.role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={() => createMut.mutate()} disabled={!form.name.trim()} className="btn-primary text-sm">Create</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============ WORKFLOWS ============

function WorkflowsSection() {
  const qc = useQueryClient();
  const { data: workflows, isLoading, error } = useQuery({ queryKey: ['admin-workflows'], queryFn: adminApi.getWorkflows });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', stages: '' });

  const createMut = useMutation({
    mutationFn: () => adminApi.createWorkflow({ name: form.name, description: form.description, stages: form.stages.split(',').map((s) => s.trim()).filter(Boolean) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-workflows'] }); setShowAdd(false); setForm({ name: '', description: '', stages: '' }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteWorkflow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-workflows'] }),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-enterprise-charcoal-800">Workflows ({workflows?.length || 0})</h2>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add</button>
      </div>
      {(workflows || []).length === 0 ? (
        <EmptyState icon={<GitBranch className="w-8 h-8" />} title="No workflows" message="Define workflows to control the innovation pipeline." />
      ) : (
        <div className="space-y-2">
          {(workflows || []).map((w: Workflow) => (
            <div key={w.id} className="card p-4 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-enterprise-charcoal-800">{w.name}</p>
                    {w.is_active && <StatusBadge status="active" />}
                  </div>
                  {w.description && <p className="text-sm text-enterprise-charcoal-500 mt-1">{w.description}</p>}
                  {w.stages.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      {w.stages.map((s, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="text-xs bg-enterprise-gray-warm rounded px-2 py-0.5 text-enterprise-charcoal-600">{s}</span>
                          {i < w.stages.length - 1 && <ChevronRight className="w-3 h-3 text-enterprise-charcoal-400" />}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteMut.mutate(w.id)} className="opacity-0 group-hover:opacity-100 text-enterprise-error-500 hover:text-enterprise-error-700 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Workflow">
        <div className="space-y-3">
          <input placeholder="Workflow name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-base" />
          <input placeholder="Stages (comma-separated: draft,submitted,review,approved)" value={form.stages} onChange={(e) => setForm({ ...form, stages: e.target.value })} className="input-base" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={() => createMut.mutate()} disabled={!form.name.trim()} className="btn-primary text-sm">Create</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============ POLICIES ============

function PoliciesSection() {
  const qc = useQueryClient();
  const { data: policies, isLoading, error } = useQuery({ queryKey: ['admin-policies'], queryFn: adminApi.getPolicies });
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const updateMut = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => adminApi.updatePolicy(id, { value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-policies'] }),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-enterprise-charcoal-800">Governance Policies</h2>
      <p className="text-sm text-enterprise-charcoal-500">Policies are enforced by the backend. Update values below to change enforcement behavior.</p>
      <div className="space-y-2">
        {(policies || []).map((p: Policy) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-enterprise-red-600" />
                  <p className="font-semibold text-enterprise-charcoal-800">{p.name}</p>
                  {p.is_active ? <StatusBadge status="active" /> : <StatusBadge status="archived" />}
                </div>
                <p className="text-sm text-enterprise-charcoal-500 mt-1">{p.description}</p>
                <p className="text-xs text-enterprise-charcoal-400 mt-1">Type: {p.policy_type}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={editValues[p.id] ?? p.value}
                  onChange={(e) => setEditValues({ ...editValues, [p.id]: e.target.value })}
                  className="input-base w-40"
                  placeholder={p.value}
                />
                <button
                  onClick={() => updateMut.mutate({ id: p.id, value: editValues[p.id] ?? p.value })}
                  disabled={editValues[p.id] === p.value || !editValues[p.id]}
                  className="btn-primary text-sm"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ NOTIFICATIONS ============

function NotificationsSection() {
  const { data: notifs, isLoading, error } = useQuery({ queryKey: ['admin-notifs'], queryFn: notificationApi.getAll });
  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-enterprise-charcoal-800">All Notifications ({notifs?.length || 0})</h2>
      {(notifs || []).length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" message="System notifications will appear here." />
      ) : (
        <div className="card overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            {(notifs || []).slice(0, 100).map((n: Notification) => (
              <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-enterprise-gray-border last:border-0 ${!n.read ? 'bg-enterprise-blue-50/30' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-enterprise-charcoal-300' : 'bg-enterprise-red-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-enterprise-charcoal-800">{n.message}</p>
                  <p className="text-xs text-enterprise-charcoal-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.read && <span className="text-xs text-enterprise-red-600 font-medium">Unread</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ AUDIT ============

function AuditSection() {
  const { data: events, isLoading, error } = useQuery({ queryKey: ['admin-audit'], queryFn: () => auditApi.getAll() });
  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-enterprise-charcoal">Audit Trail ({events?.length || 0} events)</h2>
      {(events || []).length === 0 ? (
        <EmptyState icon={<FileSearch className="w-8 h-8" />} title="No audit events" message="Audit events will appear here as actions occur." />
      ) : (
        <div className="card overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-enterprise-gray-warm border-b border-enterprise-gray-border sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-enterprise-charcoal-600">Action</th>
                  <th className="text-left px-4 py-2 font-semibold text-enterprise-charcoal-600">Entity</th>
                  <th className="text-left px-4 py-2 font-semibold text-enterprise-charcoal-600">Details</th>
                  <th className="text-left px-4 py-2 font-semibold text-enterprise-charcoal-600">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {(events || []).slice(0, 200).map((e: AuditEvent) => (
                  <tr key={e.id} className="border-b border-enterprise-gray-border last:border-0 hover:bg-enterprise-gray-warm/50">
                    <td className="px-4 py-2.5"><StatusBadge status={e.action.toLowerCase()} /></td>
                    <td className="px-4 py-2.5 text-enterprise-charcoal-500">{e.entity_type}:{e.entity_id.slice(0, 8)}</td>
                    <td className="px-4 py-2.5 text-enterprise-charcoal-500 max-w-md truncate">{e.details}</td>
                    <td className="px-4 py-2.5 text-enterprise-charcoal-400 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
