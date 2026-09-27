import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Building2, User, Mail, ArrowRight, LogIn, CheckCircle2, Shield } from 'lucide-react';
import { setupApi, userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import type { User as UserType } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Organization name is required').max(200),
  admin_name: z.string().min(1, 'Administrator name is required').max(200),
  admin_email: z.string().email('Valid email is required'),
});

type FormData = z.infer<typeof schema>;

interface SetupPageProps {
  onSetupComplete?: () => void;
}

export function SetupPage({ onSetupComplete }: SetupPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { loginAs } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isConflict, setIsConflict] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'login'>('create');
  const [selectedUserId, setSelectedUserId] = useState('');

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['setup-status'],
    queryFn: setupApi.getStatus,
  });

  const { data: users, refetch: refetchUsers } = useQuery<UserType[]>({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  // If organization is already configured, switch to login tab by default
  useEffect(() => {
    if (status && !status.setup_required) {
      setActiveTab('login');
      setIsConflict(true);
    }
  }, [status]);

  useEffect(() => {
    if (users && users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError('');
    setIsConflict(false);
    try {
      const res = await setupApi.createOrganization(data);
      if (res?.admin?.id) {
        loginAs(res.admin.id);
      }
      await queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      onSetupComplete?.();
      navigate('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Setup failed';
      setError(msg);
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('conflict')) {
        setIsConflict(true);
        refetchStatus();
        refetchUsers();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedUserId) {
      loginAs(selectedUserId);
    }
    onSetupComplete?.();
    navigate('/');
  };

  const orgName = status?.organization?.name;

  return (
    <div className="min-h-screen bg-enterprise-gray-warm flex flex-col animate-fade-in">
      <div className="bg-enterprise-red-600 h-2" />
      <div className="bg-enterprise-gold-400 h-1" />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-enterprise-red-600 rounded-enterprise mb-4 shadow-sm">
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-enterprise-charcoal-900">Welcome to INNOVEX</h1>
            <p className="text-enterprise-charcoal-500 mt-2">
              Enterprise Innovation & Engineering Exchange
            </p>
            <p className="text-sm text-enterprise-charcoal-400 mt-1">From Ideas to Impact</p>
          </div>

          <div className="card p-6 shadow-enterprise-md">
            {/* Tab selector */}
            <div className="flex border-b border-enterprise-gray-border mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('create'); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-medium border-b-2 text-center transition-colors ${
                  activeTab === 'create'
                    ? 'border-enterprise-red-600 text-enterprise-red-600'
                    : 'border-transparent text-enterprise-charcoal-500 hover:text-enterprise-charcoal-800'
                }`}
              >
                Create Workspace
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-medium border-b-2 text-center transition-colors ${
                  activeTab === 'login'
                    ? 'border-enterprise-red-600 text-enterprise-red-600'
                    : 'border-transparent text-enterprise-charcoal-500 hover:text-enterprise-charcoal-800'
                }`}
              >
                Log In
              </button>
            </div>

            {/* Conflict banner */}
            {isConflict && activeTab === 'create' && (
              <div className="mb-5 p-4 bg-enterprise-blue-50 border border-enterprise-blue-200 rounded-enterprise">
                <div className="flex items-center gap-2 text-enterprise-blue-900 font-semibold mb-1">
                  <CheckCircle2 className="w-5 h-5 text-enterprise-blue-600 flex-shrink-0" />
                  Organization Already Exists
                </div>
                <p className="text-xs text-enterprise-blue-800 mb-3">
                  This workspace has already been set up{orgName ? ` for "${orgName}"` : ''}. You can log in directly to continue.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="btn-primary w-full justify-center text-sm py-2"
                >
                  <LogIn className="w-4 h-4 mr-1.5" /> Switch to Login
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && !isConflict && (
              <div className="mb-4 p-3 bg-enterprise-error-50 border border-enterprise-error-200 rounded-enterprise text-sm text-enterprise-error-700">
                {error}
              </div>
            )}

            {/* TAB 1: Create Organization */}
            {activeTab === 'create' && (
              <div>
                <h2 className="text-lg font-semibold text-enterprise-charcoal-900 mb-1">
                  Create your organization workspace
                </h2>
                <p className="text-sm text-enterprise-charcoal-500 mb-4">
                  Set up your organization and administrator account to get started.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" /> Organization Name
                    </label>
                    <input
                      {...register('name')}
                      className="input"
                      placeholder="e.g. Acme Innovations"
                    />
                    {errors.name && <p className="text-xs text-enterprise-error-600 mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="label flex items-center gap-1.5">
                      <User className="w-4 h-4" /> Administrator Name
                    </label>
                    <input
                      {...register('admin_name')}
                      className="input"
                      placeholder="e.g. Jane Doe"
                    />
                    {errors.admin_name && <p className="text-xs text-enterprise-error-600 mt-1">{errors.admin_name.message}</p>}
                  </div>

                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Mail className="w-4 h-4" /> Administrator Email
                    </label>
                    <input
                      {...register('admin_email')}
                      type="email"
                      className="input"
                      placeholder="admin@company.com"
                    />
                    {errors.admin_email && <p className="text-xs text-enterprise-error-600 mt-1">{errors.admin_email.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full justify-center"
                  >
                    {submitting ? 'Creating...' : 'Create Workspace'}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-enterprise-blue-600 hover:text-enterprise-blue-800 font-medium"
                  >
                    Already have an account? Log in here &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Log In to Existing Organization */}
            {activeTab === 'login' && (
              <div>
                <h2 className="text-lg font-semibold text-enterprise-charcoal-900 mb-1">
                  Log in to your workspace
                </h2>
                <p className="text-sm text-enterprise-charcoal-500 mb-4">
                  {orgName
                    ? `Connected to organization: ${orgName}`
                    : 'Select your user profile to enter the platform.'}
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <User className="w-4 h-4" /> Select User Account
                    </label>
                    {users && users.length > 0 ? (
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="input"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role.toUpperCase()}) - {u.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-enterprise-gray-warm rounded-enterprise text-sm text-enterprise-charcoal-600">
                        {status?.organization
                          ? 'Organization is registered. Click below to enter.'
                          : 'No user accounts found. Please create your workspace first.'}
                      </div>
                    )}
                  </div>

                  {selectedUserId && users && (
                    <div className="p-3 bg-enterprise-gray-warm/60 border border-enterprise-gray-border rounded-enterprise text-xs space-y-1">
                      {(() => {
                        const u = users.find((x) => x.id === selectedUserId);
                        if (!u) return null;
                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-enterprise-charcoal-500">Role:</span>
                              <span className="font-semibold text-enterprise-charcoal-800 capitalize flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-enterprise-blue-600" /> {u.role}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-enterprise-charcoal-500">Email:</span>
                              <span className="text-enterprise-charcoal-700">{u.email}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary w-full justify-center py-2.5"
                  >
                    <LogIn className="w-4 h-4 mr-2" /> Enter INNOVEX Workspace
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="text-xs text-enterprise-blue-600 hover:text-enterprise-blue-800 font-medium"
                  >
                    Need to set up a new workspace? Create organization &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
