import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { dashboardApi, ideaApi, projectApi } from '../api/endpoints';
import { PageHeader, Loading, ErrorState, EmptyState } from '../components/ui';

const STAGE_COLORS: Record<string, string> = {
  idea: '#3b82f6',
  validation: '#8b5cf6',
  project: '#6366f1',
  poc: '#f97316',
  adoption: '#10b981',
  completed: '#22c55e',
};

export function InsightsPage() {
  const { data: dashboard, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  const { data: ideas } = useQuery({ queryKey: ['ideas'], queryFn: () => ideaApi.getAll() });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => projectApi.getAll() });

  if (isLoading) return <Loading />;
  if (isError || !dashboard) return <ErrorState message="Failed to load insights" />;

  const m = dashboard.metrics;
  const hasData = m.ideas > 0 || m.projects > 0;

  const ideaStatusData = [
    { name: 'Submitted', value: m.ideas || 0 },
    { name: 'Under Review', value: m.under_review || 0 },
    { name: 'In Validation', value: m.in_validation || 0 },
    { name: 'Approved', value: m.approved || 0 },
    { name: 'Team Forming', value: m.team_forming || 0 },
    { name: 'Building', value: m.building || 0 },
    { name: 'POCs', value: m.pocs || 0 },
    { name: 'Adopted', value: m.adopted || 0 },
  ].filter((d) => d.value > 0);

  const pipelineData = [
    { name: 'Idea', value: dashboard.pipeline.idea },
    { name: 'Validation', value: dashboard.pipeline.validation },
    { name: 'Project', value: dashboard.pipeline.project },
    { name: 'POC', value: dashboard.pipeline.poc },
    { name: 'Adoption', value: dashboard.pipeline.adoption },
    { name: 'Completed', value: dashboard.pipeline.completed },
  ].filter((d) => d.value > 0);

  const projectStatusData = [
    { name: 'Planning', value: dashboard.pipeline.active_projects > 0 ? 0 : 0 },
    { name: 'Active', value: dashboard.pipeline.active_projects },
    { name: 'Completed', value: dashboard.pipeline.completed_projects },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader title="Insights" subtitle="Leadership dashboards and innovation metrics" />

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="w-8 h-8" />}
          title="No insights available yet"
          message="Once ideas and projects are created, charts and metrics will appear here."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4">
              <p className="text-sm text-enterprise-charcoal/60">Total Ideas</p>
              <p className="text-2xl font-bold text-enterprise-charcoal mt-1">{m.ideas}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-enterprise-charcoal/60">Total Projects</p>
              <p className="text-2xl font-bold text-enterprise-charcoal mt-1">{m.projects}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-enterprise-charcoal/60">Total Teams</p>
              <p className="text-2xl font-bold text-enterprise-charcoal mt-1">{m.teams}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-enterprise-charcoal/60">Open Positions</p>
              <p className="text-2xl font-bold text-enterprise-charcoal mt-1">{m.open_positions}</p>
            </div>
          </div>

          {ideaStatusData.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title mb-4">Ideas by Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ideaStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#B31925" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {pipelineData.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title mb-4">Innovation Pipeline</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pipelineData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: any) => `${entry.name}: ${entry.value}`}
                  >
                    {pipelineData.map((entry) => (
                      <Cell key={entry.name} fill={STAGE_COLORS[entry.name.toLowerCase()] || '#999'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {projectStatusData.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title mb-4">Projects by Status</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={projectStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
