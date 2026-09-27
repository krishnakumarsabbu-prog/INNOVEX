import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts';
import {
  Lightbulb, Eye, FlaskConical, CheckCircle, Users, Hammer,
  Beaker, Rocket, TrendingUp, BarChart3, Activity as ActivityIcon,
  ChevronRight,
} from 'lucide-react';
import { insightsApi } from '../api/endpoints';
import { PageHeader, Loading, ErrorState, EmptyState } from '../components/ui';
import type { InsightsOverview } from '../types';

const FUNNEL_COLORS = [
  '#3b82f6', '#0ea5e9', '#8b5cf6', '#6366f1', '#06b6d4',
  '#f97316', '#f59e0b', '#10b981', '#22c55e',
];

const PIE_COLORS = [
  '#B31925', '#3b82f6', '#10b981', '#f97316', '#8b5cf6',
  '#06b6d4', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6',
  '#eab308', '#84cc16',
];

const METRIC_CONFIG = [
  { key: 'ideas_submitted', label: 'Ideas Submitted', icon: <Lightbulb className="w-5 h-5" />, color: 'text-enterprise-blue-600', bg: 'bg-enterprise-blue-50' },
  { key: 'under_review', label: 'Under Review', icon: <Eye className="w-5 h-5" />, color: 'text-enterprise-warning-600', bg: 'bg-enterprise-warning-50' },
  { key: 'in_validation', label: 'In Validation', icon: <FlaskConical className="w-5 h-5" />, color: 'text-enterprise-blue-600', bg: 'bg-enterprise-blue-50' },
  { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-5 h-5" />, color: 'text-enterprise-success-600', bg: 'bg-enterprise-success-50' },
  { key: 'team_forming', label: 'Team Formation', icon: <Users className="w-5 h-5" />, color: 'text-enterprise-blue-600', bg: 'bg-enterprise-blue-50' },
  { key: 'building', label: 'Building', icon: <Hammer className="w-5 h-5" />, color: 'text-enterprise-blue-600', bg: 'bg-enterprise-blue-50' },
  { key: 'pocs_completed', label: 'POCs', icon: <Beaker className="w-5 h-5" />, color: 'text-enterprise-warning-600', bg: 'bg-enterprise-warning-50' },
  { key: 'production_candidates', label: 'Production Candidates', icon: <Rocket className="w-5 h-5" />, color: 'text-enterprise-success-600', bg: 'bg-enterprise-success-50' },
  { key: 'adopted', label: 'Adopted', icon: <TrendingUp className="w-5 h-5" />, color: 'text-enterprise-success-600', bg: 'bg-enterprise-success-50' },
] as const;

function ChartCard({ title, children, isEmpty, emptyMessage }: { title: string; children: React.ReactNode; isEmpty: boolean; emptyMessage: string }) {
  return (
    <div className="card p-5">
      <h2 className="section-title mb-4">{title}</h2>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="w-8 h-8 text-enterprise-charcoal-300 mb-2" />
          <p className="text-sm text-enterprise-charcoal-400">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function InsightsPage() {
  const { data: insights, isLoading, isError } = useQuery<InsightsOverview>({
    queryKey: ['insights-overview'],
    queryFn: insightsApi.getOverview,
  });

  if (isLoading) return <Loading />;
  if (isError || !insights) return <ErrorState message="Failed to load insights" />;

  const m = insights.metrics;
  const hasData = Object.values(m).some((v) => v > 0) ||
    insights.team_formation_metrics.total_teams > 0 ||
    insights.adoption_metrics.adopted > 0;

  const funnelData = insights.innovation_funnel.map((s, i) => ({
    name: s.label,
    count: s.count,
    fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
  }));

  const techData = insights.ideas_by_technology;
  const areaData = insights.ideas_by_business_area;
  const teamData = [
    { name: 'Open Positions', value: insights.team_formation_metrics.open_positions },
    { name: 'Filled Positions', value: insights.team_formation_metrics.filled_positions },
    { name: 'Total Teams', value: insights.team_formation_metrics.total_teams },
    { name: 'Team Members', value: insights.team_formation_metrics.team_members },
    { name: 'Pending Join Requests', value: insights.team_formation_metrics.join_requests_pending },
  ];

  const adoptionData = [
    { name: 'POCs Completed', value: insights.adoption_metrics.pocs_completed },
    { name: 'Demos', value: insights.adoption_metrics.demos },
    { name: 'Production Candidates', value: insights.adoption_metrics.production_candidates },
    { name: 'Adopted', value: insights.adoption_metrics.adopted },
  ];

  const maxFunnelCount = Math.max(...funnelData.map((d) => d.count), 1);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Leadership Insights" subtitle="Innovation Command Center - metrics from ideas to adoption" />

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="w-8 h-8" />}
          title="No insights available yet"
          message="Once ideas are submitted and innovations begin progressing through the pipeline, all metrics and charts will be calculated from live data and appear here."
        />
      ) : (
        <div className="space-y-6">
          {/* 9 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {METRIC_CONFIG.map((cfg) => (
              <div key={cfg.key} className="card p-4 hover:shadow-enterprise-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-enterprise-charcoal-500 uppercase tracking-wide">{cfg.label}</span>
                  <span className={`p-1.5 rounded-enterprise ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                  </span>
                </div>
                <div className="text-3xl font-bold text-enterprise-charcoal-800">{m[cfg.key]}</div>
              </div>
            ))}
          </div>

          {/* Innovation Funnel */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Innovation Funnel</h2>
            {insights.innovation_funnel.every((s) => s.count === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="w-8 h-8 text-enterprise-charcoal-300 mb-2" />
                <p className="text-sm text-enterprise-charcoal-400">No pipeline data yet. Ideas will flow through the funnel as they progress.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {insights.innovation_funnel.map((stage, i) => {
                  const widthPercent = maxFunnelCount > 0 ? (stage.count / maxFunnelCount) * 100 : 0;
                  const isLast = i === insights.innovation_funnel.length - 1;
                  return (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <span className="text-sm text-enterprise-charcoal-600 w-32 flex-shrink-0">{stage.label}</span>
                      <div className="flex-1 relative">
                        <div className="flex items-center">
                          <div
                            className="h-9 rounded-enterprise flex items-center px-3 transition-all duration-500"
                            style={{
                              width: `${Math.max(widthPercent, stage.count > 0 ? 8 : 0)}%`,
                              backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                            }}
                          >
                            {stage.count > 0 && (
                              <span className="text-xs text-white font-semibold">{stage.count}</span>
                            )}
                          </div>
                          {stage.count === 0 && (
                            <span className="text-xs text-enterprise-charcoal-400 ml-2">0</span>
                          )}
                        </div>
                      </div>
                      {!isLast && <ChevronRight className="w-4 h-4 text-enterprise-charcoal-300 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ideas by Technology */}
            <ChartCard title="Ideas by Technology" isEmpty={techData.length === 0} emptyMessage="No technology tags found on submitted ideas.">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={techData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip cursor={{ fillOpacity: 0.05 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {techData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Ideas by Business Area */}
            <ChartCard title="Ideas by Business Area" isEmpty={areaData.length === 0} emptyMessage="No business areas specified on submitted ideas.">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={areaData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: { name: string; value: number }) => `${entry.name}: ${entry.value}`}
                    labelLine={false}
                  >
                    {areaData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Innovation Funnel Chart */}
            <ChartCard title="Innovation Funnel Distribution" isEmpty={funnelData.every((d) => d.count === 0)} emptyMessage="No innovations in the pipeline yet.">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {funnelData.map((d, i) => (
                      <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Team Formation */}
            <ChartCard title="Team Formation" isEmpty={teamData.every((d) => d.value === 0)} emptyMessage="No team formation activity yet.">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Adoption Trend */}
          <ChartCard title="Adoption Trend" isEmpty={adoptionData.every((d) => d.value === 0)} emptyMessage="No adoption-stage innovations yet.">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={adoptionData} margin={{ left: 0, right: 20, top: 10 }}>
                <defs>
                  <linearGradient id="adoptionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#adoptionGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Adoption Summary + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5">
              <h2 className="section-title mb-4">Adoption Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-enterprise-charcoal-600">Adoption Rate</span>
                  <span className="text-lg font-bold text-enterprise-success-600">{insights.adoption_metrics.adoption_rate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-enterprise-charcoal-600">Adopted</span>
                  <span className="text-lg font-bold text-enterprise-charcoal-800">{insights.adoption_metrics.adopted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-enterprise-charcoal-600">Production Candidates</span>
                  <span className="text-lg font-bold text-enterprise-charcoal-800">{insights.adoption_metrics.production_candidates}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-enterprise-charcoal-600">Demos</span>
                  <span className="text-lg font-bold text-enterprise-charcoal-800">{insights.adoption_metrics.demos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-enterprise-charcoal-600">POCs Completed</span>
                  <span className="text-lg font-bold text-enterprise-charcoal-800">{insights.adoption_metrics.pocs_completed}</span>
                </div>
              </div>
            </div>

            <div className="card p-5 lg:col-span-2">
              <h2 className="section-title mb-4">Recent Activity</h2>
              {insights.recent_activity.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {insights.recent_activity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-enterprise hover:bg-enterprise-gray-warm transition-colors">
                      <div className="w-2 h-2 rounded-full bg-enterprise-red-600 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-enterprise-charcoal-800">{activity.description}</p>
                        <p className="text-xs text-enterprise-charcoal-400 mt-0.5">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ActivityIcon className="w-8 h-8 text-enterprise-charcoal-300 mb-2" />
                  <p className="text-sm text-enterprise-charcoal-400">No recent activity.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
