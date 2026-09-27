import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, UserPlus, UserMinus } from 'lucide-react';
import { teamApi, userApi, innovationApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { PageHeader, EmptyState, Loading, ErrorState, Modal } from '../components/ui';
import type { User, Innovation } from '../types';

export function TeamsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [manageTeam, setManageTeam] = useState<string | null>(null);

  const { data: teams, isLoading, isError } = useQuery({ queryKey: ['teams'], queryFn: () => teamApi.getAll() });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => userApi.getAll() });
  const { data: innovations } = useQuery({ queryKey: ['innovations'], queryFn: () => innovationApi.getAll() });

  const userMap = new Map<string, User>();
  users?.forEach((u) => userMap.set(u.id, u));
  const innovationMap = new Map<string, Innovation>();
  innovations?.forEach((i) => innovationMap.set(i.id, i));

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState message="Failed to load teams" />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teams"
        subtitle="Engineering teams formed for innovation projects"
        action={<button className="btn-primary" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Team</button>}
      />

      {teams && teams.length === 0 && (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No teams yet" message="Create a team to start building engineering capacity for your innovations." />
      )}

      {teams && teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="card p-4">
              <h3 className="font-semibold text-enterprise-charcoal-800 mb-2">{team.name}</h3>
              {team.innovation_id && (
                <p className="text-xs text-enterprise-charcoal-400 mb-2">
                  Innovation: {innovationMap.get(team.innovation_id)?.summary || 'Unknown'}
                </p>
              )}
              <p className="text-sm text-enterprise-charcoal-600 mb-3">{team.member_ids.length} members</p>
              {team.lead_id && <p className="text-xs text-enterprise-charcoal-400 mb-2">Lead: {userMap.get(team.lead_id)?.name || 'Unknown'}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                {team.member_ids.slice(0, 5).map((mid) => (
                  <span key={mid} className="badge bg-enterprise-blue-50 text-enterprise-blue-700 text-xs">
                    {userMap.get(mid)?.name?.split(' ')[0] || 'Unknown'}
                  </span>
                ))}
                {team.member_ids.length > 5 && <span className="text-xs text-enterprise-charcoal-400">+{team.member_ids.length - 5} more</span>}
              </div>
              <button className="btn-secondary text-sm w-full" onClick={() => setManageTeam(team.id)}>
                <UserPlus className="w-4 h-4" /> Manage Members
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && users && innovations && (
        <CreateTeamModal users={users} innovations={innovations} onClose={() => setShowCreate(false)} />
      )}
      {manageTeam && teams && users && (
        <ManageMembersModal teamId={manageTeam} teamName={teams.find(t => t.id === manageTeam)?.name || ''} memberIds={teams.find(t => t.id === manageTeam)?.member_ids || []} users={users} onClose={() => setManageTeam(null)} />
      )}
    </div>
  );
}

function CreateTeamModal({ users, innovations, onClose }: { users: User[]; innovations: Innovation[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '', innovation_id: '', lead_id: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => teamApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Create Team">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Team Name</label>
          <input {...register('name', { required: 'Required' })} className="input" placeholder="Enter team name" />
          {errors.name && <p className="text-xs text-enterprise-error-600 mt-1">{errors.name.message as string}</p>}
        </div>
        <div>
          <label className="label">Innovation (Optional)</label>
          <select {...register('innovation_id')} className="input">
            <option value="">None</option>
            {innovations.map((i) => <option key={i.id} value={i.id}>{i.summary}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Team Lead (Optional)</label>
          <select {...register('lead_id')} className="input">
            <option value="">None</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ManageMembersModal({ teamId, teamName, memberIds, users, onClose }: { teamId: string; teamName: string; memberIds: string[]; users: User[]; onClose: () => void }) {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => teamApi.addMember(teamId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });

  const removeMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => teamApi.removeMember(teamId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });

  return (
    <Modal open={true} onClose={onClose} title={`Manage Members: ${teamName}`}>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {users.map((user) => {
          const isMember = memberIds.includes(user.id);
          return (
            <div key={user.id} className="flex items-center justify-between border border-enterprise-gray-border rounded-enterprise p-2">
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-enterprise-charcoal-400">{user.department}</p>
              </div>
              {isMember ? (
                <button className="btn-secondary text-xs" onClick={() => removeMutation.mutate({ teamId, userId: user.id })}>
                  <UserMinus className="w-3 h-3" /> Remove
                </button>
              ) : (
                <button className="btn-primary text-xs" onClick={() => addMutation.mutate({ teamId, userId: user.id })}>
                  <UserPlus className="w-3 h-3" /> Add
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
