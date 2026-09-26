import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, ArrowRight, Users, Briefcase } from 'lucide-react';
import { innovationApi, ideaApi, userApi } from '../api/endpoints';
import { useForm } from 'react-hook-form';
import { PageHeader, EmptyState, Loading, ErrorState, StatusBadge, Modal } from '../components/ui';
import type { Innovation, Idea, User } from '../types';

export function InnovationsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: innovations, isLoading, isError } = useQuery({
    queryKey: ['innovations'],
    queryFn: () => innovationApi.getAll(),
  });

  const { data: ideas } = useQuery({ queryKey: ['ideas'], queryFn: () => ideaApi.getAll() });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => userApi.getAll() });

  const ideaMap = new Map<string, Idea>();
  ideas?.forEach((i) => ideaMap.set(i.id, i));

  return (
    <div>
      <PageHeader
        title="Innovation"
        subtitle="Approved ideas moving through the innovation lifecycle"
        action={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Create Innovation
          </button>
        }
      />

      {isLoading && <Loading />}
      {isError && <ErrorState message="Failed to load innovations" />}

      {innovations && innovations.length === 0 && (
        <EmptyState
          icon={<Sparkles className="w-8 h-8" />}
          title="No innovations yet"
          message="Approved ideas can be promoted to innovations to begin the engineering lifecycle."
        />
      )}

      {innovations && innovations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {innovations.map((inv) => {
            const idea = ideaMap.get(inv.idea_id);
            return <InnovationCard key={inv.id} innovation={inv} ideaTitle={idea?.title || 'Unknown'} />;
          })}
        </div>
      )}

      {showCreate && ideas && (
        <CreateInnovationModal ideas={ideas} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function InnovationCard({ innovation, ideaTitle }: { innovation: Innovation; ideaTitle: string }) {
  const navigate = useNavigate();
  return (
    <div className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/innovations/${innovation.id}`)}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-enterprise-charcoal line-clamp-1">{ideaTitle}</h3>
        <StatusBadge status={innovation.stage} />
      </div>
      <p className="text-sm text-enterprise-charcoal/60 line-clamp-2 mb-3">{innovation.summary}</p>
      <div className="flex items-center gap-2">
        {innovation.is_open && <span className="badge bg-green-100 text-green-800">Open for Contributors</span>}
      </div>
      <div className="mt-3 flex items-center text-xs text-enterprise-red font-medium">
        View details <ArrowRight className="w-3 h-3 ml-1" />
      </div>
    </div>
  );
}

function CreateInnovationModal({ ideas, onClose }: { ideas: Idea[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { idea_id: '', summary: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => innovationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Create Innovation">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="label">Source Idea</label>
          <select {...register('idea_id', { required: 'Required' })} className="input">
            <option value="">Select an idea...</option>
            {ideas.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>
          {errors.idea_id && <p className="text-xs text-red-600 mt-1">{errors.idea_id.message as string}</p>}
        </div>
        <div>
          <label className="label">Summary</label>
          <textarea {...register('summary')} className="input min-h-[80px]" placeholder="Innovation summary" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
