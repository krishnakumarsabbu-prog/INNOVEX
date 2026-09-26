import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Flag, FileText, CheckCircle, Circle, Clock } from 'lucide-react';
import { projectApi, userApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { Loading, ErrorState, StatusBadge, Modal, EmptyState } from '../components/ui';
import type { User } from '../types';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showMilestone, setShowMilestone] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getById(id!),
    enabled: !!id,
  });

  const { data: milestones } = useQuery({
    queryKey: ['project-milestones', id],
    queryFn: () => projectApi.getMilestones(id!),
    enabled: !!id,
  });

  const { data: evidence } = useQuery({
    queryKey: ['project-evidence', id],
    queryFn: () => projectApi.getEvidence(id!),
    enabled: !!id,
  });

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => userApi.getAll() });
  const userMap = new Map<string, User>();
  users?.forEach((u) => userMap.set(u.id, u));

  if (isLoading) return <Loading />;
  if (isError || !project) return <ErrorState message="Failed to load project" />;

  return (
    <div>
      <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-sm text-enterprise-charcoal/60 hover:text-enterprise-charcoal mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-enterprise-charcoal">{project.name}</h1>
            <p className="text-sm text-enterprise-charcoal/60 mt-1">{project.description}</p>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Milestones</h2>
            <button className="btn-secondary text-sm" onClick={() => setShowMilestone(true)}>
              <Plus className="w-4 h-4" /> Add Milestone
            </button>
          </div>
          {milestones && milestones.length > 0 ? (
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-start gap-3 border border-enterprise-gray-border rounded-md p-3">
                  {m.status === 'done' ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" /> :
                   m.status === 'in_progress' ? <Clock className="w-5 h-5 text-blue-600 mt-0.5" /> :
                   <Circle className="w-5 h-5 text-gray-400 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.title}</p>
                    {m.description && <p className="text-xs text-enterprise-charcoal/60 mt-1">{m.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={m.status} />
                      {m.due_date && <span className="text-xs text-enterprise-charcoal/50">Due: {new Date(m.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Flag className="w-6 h-6" />} title="No milestones" message="Add milestones to track project progress." />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Evidence</h2>
            <button className="btn-secondary text-sm" onClick={() => setShowEvidence(true)}>
              <Plus className="w-4 h-4" /> Add Evidence
            </button>
          </div>
          {evidence && evidence.length > 0 ? (
            <div className="space-y-3">
              {evidence.map((e) => (
                <div key={e.id} className="flex items-start gap-3 border border-enterprise-gray-border rounded-md p-3">
                  <FileText className="w-5 h-5 text-enterprise-red mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.description && <p className="text-xs text-enterprise-charcoal/60 mt-1">{e.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge bg-gray-100 text-gray-700">{e.evidence_type}</span>
                      {e.url && <a href={e.url} target="_blank" rel="noreferrer" className="text-xs text-enterprise-red hover:underline">View</a>}
                      <span className="text-xs text-enterprise-charcoal/50">by {userMap.get(e.created_by)?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<FileText className="w-6 h-6" />} title="No evidence" message="Upload evidence, POCs, and demo materials." />
          )}
        </div>
      </div>

      {showMilestone && (
        <CreateMilestoneModal projectId={project.id} onClose={() => setShowMilestone(false)} />
      )}
      {showEvidence && users && (
        <CreateEvidenceModal projectId={project.id} users={users} onClose={() => setShowEvidence(false)} />
      )}
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
