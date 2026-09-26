import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Lightbulb, Plus, ArrowRight } from 'lucide-react';
import { ideaApi, userApi } from '../api/endpoints';
import { PageHeader, EmptyState, Loading, ErrorState, StatusBadge } from '../components/ui';
import type { User } from '../types';

export function MyIdeasPage() {
  const [searchParams] = useSearchParams();
  const founderId = searchParams.get('founder_id') || '';

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  const { data: ideas, isLoading, isError } = useQuery({
    queryKey: ['ideas', 'mine', founderId],
    queryFn: () => ideaApi.getAll({ founder_id: founderId || undefined }),
    enabled: !!founderId,
  });

  const userMap = new Map<string, User>();
  users?.forEach((u) => userMap.set(u.id, u));

  return (
    <div>
      <PageHeader
        title="My Ideas"
        subtitle="Ideas you have submitted and are working on"
        action={
          <Link to="/ideas/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Submit an Idea
          </Link>
        }
      />

      {!founderId && (
        <div className="card p-6">
          <p className="text-sm text-enterprise-charcoal/70 mb-3">Select your name to see your ideas:</p>
          <div className="flex flex-wrap gap-2">
            {users?.map((u) => (
              <Link
                key={u.id}
                to={`/ideas/mine?founder_id=${u.id}`}
                className="btn-secondary text-sm"
              >
                {u.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {founderId && isLoading && <Loading />}
      {founderId && isError && <ErrorState message="Failed to load your ideas" />}

      {founderId && ideas && ideas.length === 0 && (
        <EmptyState
          icon={<Lightbulb className="w-8 h-8" />}
          title="You have not submitted any ideas yet."
          message="Submit your first idea to kick off the innovation pipeline."
          action={
            <Link to="/ideas/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Submit an Idea
            </Link>
          }
        />
      )}

      {founderId && ideas && ideas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-enterprise-charcoal/60">
              {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
            </p>
            <Link to="/ideas" className="text-sm text-enterprise-red hover:underline">
              View all ideas
            </Link>
          </div>
          {ideas.map((idea) => (
            <Link
              key={idea.id}
              to={`/ideas/${idea.id}`}
              className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow block"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-enterprise-charcoal line-clamp-1">{idea.title}</h3>
                <p className="text-sm text-enterprise-charcoal/60 line-clamp-1 mt-1">
                  {idea.problem_statement || 'No problem statement'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {idea.business_area && (
                    <span className="badge bg-blue-50 text-blue-700 text-xs">{idea.business_area}</span>
                  )}
                  {idea.technologies && idea.technologies.length > 0 && (
                    <span className="text-xs text-enterprise-charcoal/50">
                      {idea.technologies.length} tech{idea.technologies.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <StatusBadge status={idea.status} />
                <ArrowRight className="w-4 h-4 text-enterprise-charcoal/30" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
