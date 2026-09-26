import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Users, Briefcase, Lock, Unlock } from 'lucide-react';
import { innovationApi, ideaApi, userApi, teamApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { Loading, ErrorState, StatusBadge, Modal, EmptyState } from '../components/ui';
import type { User, Position } from '../types';

export function InnovationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPosition, setShowPosition] = useState(false);
  const [showApply, setShowApply] = useState<Position | null>(null);

  const { data: innovation, isLoading, isError } = useQuery({
    queryKey: ['innovation', id],
    queryFn: () => innovationApi.getById(id!),
    enabled: !!id,
  });

  const { data: idea } = useQuery({
    queryKey: ['idea-by-innovation', innovation?.idea_id],
    queryFn: () => ideaApi.getById(innovation!.idea_id),
    enabled: !!innovation?.idea_id,
  });

  const { data: positions } = useQuery({
    queryKey: ['innovation-positions', id],
    queryFn: () => innovationApi.getPositions(id!),
    enabled: !!id,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', 'innovation', id],
    queryFn: () => teamApi.getAll(),
    enabled: !!id,
  });

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => userApi.getAll() });
  const userMap = new Map<string, User>();
  users?.forEach((u) => userMap.set(u.id, u));

  if (isLoading) return <Loading />;
  if (isError || !innovation) return <ErrorState message="Failed to load innovation" />;

  const relatedTeams = teams?.filter((t) => t.innovation_id === id) || [];

  return (
    <div>
      <button onClick={() => navigate('/innovations')} className="flex items-center gap-1 text-sm text-enterprise-charcoal/60 hover:text-enterprise-charcoal mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Innovations
      </button>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-enterprise-charcoal">{idea?.title || 'Innovation'}</h1>
            <p className="text-sm text-enterprise-charcoal/50 mt-1">{innovation.summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={innovation.stage} />
            {innovation.is_open ? (
              <span className="badge bg-green-100 text-green-800">Open</span>
            ) : (
              <span className="badge bg-gray-100 text-gray-800">Closed</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Open Positions</h2>
            <button className="btn-secondary text-sm" onClick={() => setShowPosition(true)}>
              <Plus className="w-4 h-4" /> Add Position
            </button>
          </div>
          {positions && positions.length > 0 ? (
            <div className="space-y-3">
              {positions.map((pos) => (
                <div key={pos.id} className="border border-enterprise-gray-border rounded-md p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{pos.title}</p>
                      <p className="text-xs text-enterprise-charcoal/60">{pos.role} - {pos.technology}</p>
                    </div>
                    <StatusBadge status={pos.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-enterprise-charcoal/50">Filled: {pos.filled}/{pos.capacity}</span>
                    {pos.status === 'open' && (
                      <button className="text-enterprise-red font-medium hover:underline" onClick={() => setShowApply(pos)}>
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Briefcase className="w-6 h-6" />} title="No positions" message="Open positions for contributors will appear here." />
          )}
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Teams</h2>
          {relatedTeams.length > 0 ? (
            <div className="space-y-3">
              {relatedTeams.map((team) => (
                <div key={team.id} className="border border-enterprise-gray-border rounded-md p-3">
                  <p className="font-medium text-sm">{team.name}</p>
                  <p className="text-xs text-enterprise-charcoal/60 mt-1">{team.member_ids.length} members</p>
                  {team.lead_id && <p className="text-xs text-enterprise-charcoal/50">Lead: {userMap.get(team.lead_id)?.name || 'Unknown'}</p>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Users className="w-6 h-6" />} title="No teams yet" message="Teams formed for this innovation will appear here." />
          )}
        </div>
      </div>

      {showPosition && (
        <CreatePositionModal innovationId={innovation.id} onClose={() => setShowPosition(false)} />
      )}
      {showApply && users && (
        <ApplyModal position={showApply} users={users} onClose={() => setShowApply(null)} />
      )}
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
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Add Position">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input {...register('title', { required: 'Required' })} className="input" placeholder="e.g. Senior Backend Engineer" />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message as string}</p>}
        </div>
        <div>
          <label className="label">Role</label>
          <input {...register('role', { required: 'Required' })} className="input" placeholder="e.g. Engineer, Designer" />
          {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message as string}</p>}
        </div>
        <div>
          <label className="label">Technology</label>
          <input {...register('technology', { required: 'Required' })} className="input" placeholder="e.g. Python, React" />
          {errors.technology && <p className="text-xs text-red-600 mt-1">{errors.technology.message as string}</p>}
        </div>
        <div>
          <label className="label">Capacity</label>
          <input type="number" {...register('capacity', { valueAsNumber: true, min: 1 })} className="input" defaultValue={1} />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Position'}
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title={`Apply for: ${position.title}`}>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Select User</label>
          <select {...register('user_id', { required: 'Required' })} className="input">
            <option value="">Select a user...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} - {u.department}</option>)}
          </select>
          {errors.user_id && <p className="text-xs text-red-600 mt-1">{errors.user_id.message as string}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
