import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, ArrowRight } from 'lucide-react';
import { projectApi, teamApi, innovationApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { PageHeader, EmptyState, Loading, ErrorState, StatusBadge, Modal } from '../components/ui';
import type { Team, Innovation } from '../types';

export function ProjectsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: projects, isLoading, isError } = useQuery({ queryKey: ['projects'], queryFn: () => projectApi.getAll() });
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: () => teamApi.getAll() });
  const { data: innovations } = useQuery({ queryKey: ['innovations'], queryFn: () => innovationApi.getAll() });

  const teamMap = new Map<string, Team>();
  teams?.forEach((t) => teamMap.set(t.id, t));
  const innovationMap = new Map<string, Innovation>();
  innovations?.forEach((i) => innovationMap.set(i.id, i));

  const navigate = useNavigate();

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState message="Failed to load projects" />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projects"
        subtitle="Engineering projects tracking milestones and evidence"
        action={<button className="btn-primary" onClick={() => setShowCreate(true)}><FolderPlus className="w-4 h-4" /> New Project</button>}
      />

      {projects && projects.length === 0 && (
        <EmptyState icon={<FolderPlus className="w-8 h-8" />} title="No projects yet" message="Create a project to start tracking milestones, evidence, and POCs." />
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="card card-hover p-4 cursor-pointer transition-shadow" onClick={() => navigate(`/projects/${project.id}`)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-enterprise-charcoal-800 line-clamp-1">{project.name}</h3>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-sm text-enterprise-charcoal-500 line-clamp-2 mb-3">{project.description || 'No description'}</p>
              <div className="text-xs text-enterprise-charcoal-400">
                {project.team_id && <p>Team: {teamMap.get(project.team_id)?.name || 'Unknown'}</p>}
                {project.innovation_id && <p>Innovation: {innovationMap.get(project.innovation_id)?.summary?.substring(0, 40) || 'Unknown'}</p>}
              </div>
              <div className="mt-3 flex items-center text-xs text-enterprise-red-600 font-medium">
                View Details <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && teams && innovations && (
        <CreateProjectModal teams={teams} innovations={innovations} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function CreateProjectModal({ teams, innovations, onClose }: { teams: Team[]; innovations: Innovation[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '', description: '', team_id: '', innovation_id: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => projectApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Create Project">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Project Name</label>
          <input {...register('name', { required: 'Required' })} className="input" placeholder="Enter project name" />
          {errors.name && <p className="text-xs text-enterprise-error-600 mt-1">{errors.name.message as string}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} className="input min-h-[80px]" placeholder="Project description" />
        </div>
        <div>
          <label className="label">Team (Optional)</label>
          <select {...register('team_id')} className="input">
            <option value="">None</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Innovation (Optional)</label>
          <select {...register('innovation_id')} className="input">
            <option value="">None</option>
            {innovations.map((i) => <option key={i.id} value={i.id}>{i.summary}</option>)}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
