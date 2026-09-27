import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lightbulb, Building2, User, Mail, ArrowRight } from 'lucide-react';
import { setupApi } from '../api/endpoints';

const schema = z.object({
  name: z.string().min(1, 'Organization name is required').max(200),
  admin_name: z.string().min(1, 'Administrator name is required').max(200),
  admin_email: z.string().email('Valid email is required'),
});

type FormData = z.infer<typeof schema>;

export function SetupPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ['setup-status'],
    queryFn: setupApi.getStatus,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError('');
    try {
      await setupApi.createOrganization(data);
      await queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Setup failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!status?.setup_required) {
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-enterprise-gray-warm flex flex-col animate-fade-in">
      <div className="bg-enterprise-red-600 h-2" />
      <div className="bg-enterprise-gold-400 h-1" />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-enterprise-red-600 rounded-enterprise mb-4">
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-enterprise-charcoal-900">Welcome to INNOVEX</h1>
            <p className="text-enterprise-charcoal-500 mt-2">
              Enterprise Innovation & Engineering Exchange
            </p>
            <p className="text-sm text-enterprise-charcoal-400 mt-1">From Ideas to Impact</p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-enterprise-charcoal-900 mb-1">
              Create your organization workspace
            </h2>
            <p className="text-sm text-enterprise-charcoal-500 mb-4">
              Set up your organization and administrator account to get started.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-enterprise-error-50 border border-enterprise-error-200 rounded-enterprise text-sm text-enterprise-error-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Organization Name
                </label>
                <input
                  {...register('name')}
                  className="input"
                  placeholder="Enter organization name"
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
                  placeholder="Enter administrator name"
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
          </div>
        </div>
      </div>
    </div>
  );
}
