import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Shield, Users as UsersIcon } from 'lucide-react';
import { userApi, dashboardApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { PageHeader, EmptyState, Loading, ErrorState, Modal } from '../components/ui';

const ROLES = ['admin', 'principal_engineer', 'manager', 'panel_member', 'engineer', 'contributor'];

export function AdministrationPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: dashboard, isLoading: dashLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });
  const { data: users, isLoading: usersLoading, isError } = useQuery({ queryKey: ['users'], queryFn: () => userApi.getAll() });

  if (dashLoading || usersLoading) return <Loading />;
  if (isError) return <ErrorState message="Failed to load administration data" />;

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Manage organization users and system configuration"
        action={<button className="btn-primary" onClick={() => setShowCreate(true)}><UserPlus className="w-4 h-4" /> Add User</button>}
      />

      {dashboard?.organization && (
        <div className="card p-5 mb-4">
          <h2 className="section-title mb-3">Organization</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-enterprise-red rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-enterprise-charcoal">{dashboard.organization.name}</p>
              <p className="text-xs text-enterprise-charcoal/50">Created {new Date(dashboard.organization.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="section-title mb-4">Users ({users?.length || 0})</h2>
        {users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-enterprise-gray-border text-left">
                  <th className="pb-2 pr-4 font-medium text-enterprise-charcoal/70">Name</th>
                  <th className="pb-2 pr-4 font-medium text-enterprise-charcoal/70">Email</th>
                  <th className="pb-2 pr-4 font-medium text-enterprise-charcoal/70">Role</th>
                  <th className="pb-2 pr-4 font-medium text-enterprise-charcoal/70">Department</th>
                  <th className="pb-2 font-medium text-enterprise-charcoal/70">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-enterprise-gray-border hover:bg-enterprise-gray-warm transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-enterprise-charcoal/50">{user.title}</p>
                    </td>
                    <td className="py-3 pr-4 text-enterprise-charcoal/70">{user.email}</td>
                    <td className="py-3 pr-4">
                      <span className="badge bg-blue-50 text-blue-700 capitalize">{user.role.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 pr-4 text-enterprise-charcoal/70">{user.department || '-'}</td>
                    <td className="py-3">
                      <DeleteUserButton userId={user.id} userName={user.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<UsersIcon className="w-6 h-6" />} title="No users" message="Add users to manage your organization." />
        )}
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => userApi.delete(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <button
      className="text-red-600 hover:text-red-800 p-1"
      onClick={(e) => {
        e.stopPropagation();
        if (confirm(`Delete user ${userName}?`)) mutation.mutate();
      }}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', role: 'engineer', title: '', department: '', skills: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, skills: data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [] };
      return userApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Add User">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input {...register('name', { required: 'Required' })} className="input" placeholder="Full name" />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message as string}</p>}
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" {...register('email', { required: 'Required' })} className="input" placeholder="user@company.com" />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message as string}</p>}
        </div>
        <div>
          <label className="label">Role</label>
          <select {...register('role')} className="input">
            {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Title</label>
          <input {...register('title')} className="input" placeholder="Job title" />
        </div>
        <div>
          <label className="label">Department</label>
          <input {...register('department')} className="input" placeholder="Department" />
        </div>
        <div>
          <label className="label">Skills (comma-separated)</label>
          <input {...register('skills')} className="input" placeholder="Python, React, AWS" />
        </div>
        {mutation.isError && <p className="text-xs text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding...' : 'Add User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
