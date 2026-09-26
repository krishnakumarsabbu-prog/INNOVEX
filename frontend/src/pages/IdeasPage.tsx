import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lightbulb, Plus, Search, ArrowRight } from 'lucide-react';
import { ideaApi, userApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { PageHeader, EmptyState, Loading, ErrorState, StatusBadge, Modal } from '../components/ui';
import type { Idea, User } from '../types';

export function IdeasPage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || undefined;
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  const { data: ideas, isLoading, isError } = useQuery({
    queryKey: ['ideas', search],
    queryFn: () => ideaApi.getAll({ search }),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  const userMap = new Map<string, User>();
  users?.forEach((u) => userMap.set(u.id, u));

  return (
    <div>
      <PageHeader
        title="Ideas"
        subtitle="Submit and track engineering and business innovation ideas"
        action={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Idea
          </button>
        }
      />

      {isLoading && <Loading />}
      {isError && <ErrorState message="Failed to load ideas" />}

      {ideas && ideas.length === 0 && (
        <EmptyState
          icon={<Lightbulb className="w-8 h-8" />}
          title="No ideas yet"
          message="Submit your first idea to kick off the innovation pipeline."
          action={
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Submit an Idea
            </button>
          }
        />
      )}

      {ideas && ideas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => {
            const submitter = userMap.get(idea.submitted_by);
            return <IdeaCard key={idea.id} idea={idea} submitterName={submitter?.name || 'Unknown'} />;
          })}
        </div>
      )}

      {showCreate && users && (
        <CreateIdeaModal
          users={users}
          onClose={() => setShowCreate(false)}
          onError={setError}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, submitterName }: { idea: Idea; submitterName: string }) {
  const navigate = useNavigate();
  return (
    <div
      className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/ideas/${idea.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-enterprise-charcoal line-clamp-1">{idea.title}</h3>
        <StatusBadge status={idea.status} />
      </div>
      <p className="text-sm text-enterprise-charcoal/60 line-clamp-2 mb-3">{idea.description}</p>
      <div className="flex items-center justify-between text-xs text-enterprise-charcoal/50">
        <span>{idea.category}</span>
        <span>by {submitterName}</span>
      </div>
      <div className="mt-3 flex items-center text-xs text-enterprise-red font-medium">
        View details <ArrowRight className="w-3 h-3 ml-1" />
      </div>
    </div>
  );
}

function CreateIdeaModal({ users, onClose, onError }: { users: User[]; onClose: () => void; onError: (e: string) => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { title: '', description: '', category: '', problem_statement: '', proposed_solution: '', submitted_by: '' },
  });

  const mutation = useMutation({
    mutationFn: ideaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (e) => onError(e instanceof Error ? e.message : 'Failed to create idea'),
  });

  const onSubmit = (data: any) => mutation.mutate(data);

  return (
    <Modal open={true} onClose={onClose} title="Submit New Idea">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input {...register('title', { required: 'Title is required' })} className="input" placeholder="Enter idea title" />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message as string}</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea {...register('description', { required: 'Description is required' })} className="input min-h-[80px]" placeholder="Describe the idea" />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message as string}</p>}
        </div>
        <div>
          <label className="label">Category</label>
          <input {...register('category', { required: 'Category is required' })} className="input" placeholder="e.g. Engineering, Operations, AI" />
          {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message as string}</p>}
        </div>
        <div>
          <label className="label">Problem Statement</label>
          <textarea {...register('problem_statement')} className="input min-h-[60px]" placeholder="What problem does this solve?" />
        </div>
        <div>
          <label className="label">Proposed Solution</label>
          <textarea {...register('proposed_solution')} className="input min-h-[60px]" placeholder="How do you propose to solve it?" />
        </div>
        <div>
          <label className="label">Submitter</label>
          <select {...register('submitted_by', { required: 'Submitter is required' })} className="input">
            <option value="">Select a user...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} - {u.email}</option>
            ))}
          </select>
          {errors.submitted_by && <p className="text-xs text-red-600 mt-1">{errors.submitted_by.message as string}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Submit Idea'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
