import { useQuery } from '@tanstack/react-query';
import { Briefcase, ClipboardList, FileText, Users } from 'lucide-react';
import { ideaApi, projectApi, teamApi, innovationApi } from '../api/endpoints';
import { PageHeader, EmptyState, Loading, ErrorState, StatusBadge } from '../components/ui';

export function MyWorkspacePage() {
  const { data: ideas, isLoading: ideasLoading } = useQuery({ queryKey: ['ideas'], queryFn: () => ideaApi.getAll() });
  const { data: projects, isLoading: projectsLoading } = useQuery({ queryKey: ['projects'], queryFn: () => projectApi.getAll() });
  const { data: teams, isLoading: teamsLoading } = useQuery({ queryKey: ['teams'], queryFn: () => teamApi.getAll() });
  const { data: innovations } = useQuery({ queryKey: ['innovations'], queryFn: () => innovationApi.getAll() });

  if (ideasLoading || projectsLoading || teamsLoading) return <Loading />;

  const hasAny = (ideas?.length || 0) > 0 || (projects?.length || 0) > 0 || (teams?.length || 0) > 0;

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Workspace" subtitle="Your ideas, projects, and team assignments" />

      {!hasAny && (
        <EmptyState
          icon={<Briefcase className="w-8 h-8" />}
          title="Your workspace is empty"
          message="Ideas you submit, projects you work on, and teams you join will appear here."
        />
      )}

      {hasAny && (
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="section-title mb-4">My Ideas</h2>
            {ideas && ideas.length > 0 ? (
              <div className="space-y-2">
                {ideas.map((idea) => (
                  <div key={idea.id} className="flex items-center justify-between border border-enterprise-gray-border rounded-enterprise p-3">
                    <div>
                      <p className="text-sm font-medium">{idea.title}</p>
                      <p className="text-xs text-enterprise-charcoal-400">{idea.business_area || 'No area'}</p>
                    </div>
                    <StatusBadge status={idea.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-enterprise-charcoal-400">No ideas submitted yet.</p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="section-title mb-4">My Projects</h2>
            {projects && projects.length > 0 ? (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between border border-enterprise-gray-border rounded-enterprise p-3">
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-enterprise-charcoal-400">{project.description || 'No description'}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-enterprise-charcoal-400">No projects assigned yet.</p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="section-title mb-4">My Teams</h2>
            {teams && teams.length > 0 ? (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div key={team.id} className="border border-enterprise-gray-border rounded-enterprise p-3">
                    <p className="text-sm font-medium">{team.name}</p>
                    <p className="text-xs text-enterprise-charcoal-400">{team.member_ids.length} members</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-enterprise-charcoal-400">No team memberships yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
