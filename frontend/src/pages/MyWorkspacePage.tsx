import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, Lightbulb, Hammer, Users, ArrowRight, UserCheck } from 'lucide-react';
import { ideaApi, projectApi, teamApi, innovationApi } from '../api/endpoints';
import { PageHeader, EmptyState, Loading, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export function MyWorkspacePage() {
  const { currentUser } = useAuth();
  const { data: ideas, isLoading: ideasLoading } = useQuery({ queryKey: ['ideas'], queryFn: () => ideaApi.getAll() });
  const { data: projects, isLoading: projectsLoading } = useQuery({ queryKey: ['projects'], queryFn: () => projectApi.getAll() });
  const { data: teams, isLoading: teamsLoading } = useQuery({ queryKey: ['teams'], queryFn: () => teamApi.getAll() });

  if (ideasLoading || projectsLoading || teamsLoading) return <Loading message="Loading your workspace..." />;

  const myIdeas = currentUser ? (ideas?.filter((i) => i.founder_id === currentUser.id) || []) : (ideas || []);
  const myTeams = currentUser ? (teams?.filter((t) => t.lead_id === currentUser.id || t.member_ids?.includes(currentUser.id)) || []) : (teams || []);
  const myTeamIds = new Set(myTeams.map((t) => t.id));
  const myProjects = currentUser ? (projects?.filter((p) => p.team_id && myTeamIds.has(p.team_id)) || []) : (projects || []);

  const hasAny = myIdeas.length > 0 || myProjects.length > 0 || myTeams.length > 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="My Workspace"
          subtitle={
            currentUser
              ? `Personalized innovation dashboard for ${currentUser.name} (${currentUser.title || currentUser.role})`
              : 'Your active ideas, projects, and team assignments'
          }
        />
        {currentUser && (
          <div className="flex items-center gap-2 bg-enterprise-gray-warm px-3 py-1.5 rounded-enterprise border border-enterprise-gray-border self-start">
            <UserCheck className="w-4 h-4 text-enterprise-red-600" />
            <span className="text-xs font-medium text-enterprise-charcoal-700">
              Active Persona: <strong className="text-enterprise-charcoal-900">{currentUser.name}</strong>
            </span>
          </div>
        )}
      </div>

      {!hasAny ? (
        <div className="card p-8">
          <EmptyState
            icon={<Briefcase className="w-8 h-8" />}
            title="Your workspace is empty"
            message={
              currentUser
                ? `No active ideas, projects, or team memberships found for ${currentUser.name}. Submit an idea or join an open innovation team to get started.`
                : 'Ideas you submit, projects you work on, and teams you join will appear here.'
            }
            action={
              <Link to="/ideas/new" className="btn-primary">
                Submit Your First Idea
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* My Ideas Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-enterprise-blue-600" /> My Ideas ({myIdeas.length})
              </h2>
              <Link to="/ideas/mine" className="text-xs text-enterprise-red-600 hover:underline">
                View all my ideas
              </Link>
            </div>
            {myIdeas.length > 0 ? (
              <div className="space-y-2">
                {myIdeas.map((idea) => (
                  <Link
                    key={idea.id}
                    to={`/ideas/${idea.id}`}
                    className="flex items-center justify-between border border-enterprise-gray-border rounded-enterprise p-3.5 hover:bg-enterprise-gray-warm transition-all group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-enterprise-charcoal-900 group-hover:text-enterprise-red-600 transition-colors">
                        {idea.title}
                      </p>
                      <p className="text-xs text-enterprise-charcoal-400 mt-0.5">
                        {idea.business_area || 'General Innovation'} · {idea.technologies?.join(', ') || 'No tech tagged'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={idea.status} />
                      <ArrowRight className="w-4 h-4 text-enterprise-charcoal-300 group-hover:text-enterprise-charcoal-600" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-enterprise-charcoal-400">You haven't submitted any ideas yet.</p>
            )}
          </div>

          {/* My Projects Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2">
                <Hammer className="w-4 h-4 text-enterprise-red-600" /> My Engineering Projects ({myProjects.length})
              </h2>
              <Link to="/projects" className="text-xs text-enterprise-red-600 hover:underline">
                View all projects
              </Link>
            </div>
            {myProjects.length > 0 ? (
              <div className="space-y-2">
                {myProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between border border-enterprise-gray-border rounded-enterprise p-3.5 hover:bg-enterprise-gray-warm transition-all group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-enterprise-charcoal-900 group-hover:text-enterprise-red-600 transition-colors">
                        {project.name}
                      </p>
                      <p className="text-xs text-enterprise-charcoal-400 mt-0.5 line-clamp-1">
                        {project.description || 'No description provided'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={project.status} />
                      <ArrowRight className="w-4 h-4 text-enterprise-charcoal-300 group-hover:text-enterprise-charcoal-600" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-enterprise-charcoal-400">You have no projects assigned yet.</p>
            )}
          </div>

          {/* My Teams Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2">
                <Users className="w-4 h-4 text-enterprise-success-600" /> My Teams ({myTeams.length})
              </h2>
              <Link to="/teams" className="text-xs text-enterprise-red-600 hover:underline">
                Explore all teams
              </Link>
            </div>
            {myTeams.length > 0 ? (
              <div className="space-y-2">
                {myTeams.map((team) => (
                  <div key={team.id} className="border border-enterprise-gray-border rounded-enterprise p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-enterprise-charcoal-900">{team.name}</p>
                      <p className="text-xs text-enterprise-charcoal-400 mt-0.5">
                        {team.member_ids?.length || 0} members {team.lead_id === currentUser?.id ? '· Team Lead' : '· Member'}
                      </p>
                    </div>
                    {team.lead_id === currentUser?.id && (
                      <span className="badge bg-enterprise-gold-50 text-enterprise-gold-700 text-xs">Team Lead</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-enterprise-charcoal-400">No team memberships found for your user profile.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
