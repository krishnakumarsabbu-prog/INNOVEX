import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Lightbulb, Eye, FlaskConical, CheckCircle, Users, Hammer,
  Beaker, Rocket, TrendingUp, Activity as ActivityIcon, ArrowRight,
} from 'lucide-react';
import { insightsApi, dashboardApi } from '../api/endpoints';
import { MetricCard, EmptyState, Loading, ErrorState } from '../components/ui';
import type { InsightsOverview } from '../types';

const FUNNEL_COLORS = [
  '#3b82f6', '#0ea5e9', '#8b5cf6', '#6366f1', '#06b6d4',
  '#f97316', '#f59e0b', '#10b981', '#22c55e',
];

export function HomePage() {
  const { data: insights, isLoading, isError } = useQuery<InsightsOverview>({
    queryKey: ['insights-overview'],
    queryFn: insightsApi.getOverview,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  if (isLoading) return <Loading />;
  if (isError || !insights) return <ErrorState message="Failed to load dashboard data" />;

  const m = insights.metrics;
  const hasData = Object.values(m).some((v) => v > 0) || (dashboard?.metrics.users ?? 0) > 1;

  const orgName = dashboard?.organization?.name || 'INNOVEX';

  const metricCards = [
    { label: 'Ideas Submitted', value: m.ideas_submitted, icon: <Lightbulb className="w-4 h-4" />, color: 'text-blue-600' },
    { label: 'Under Review', value: m.under_review, icon: <Eye className="w-4 h-4" />, color: 'text-amber-600' },
    { label: 'In Validation', value: m.in_validation, icon: <FlaskConical className="w-4 h-4" />, color: 'text-purple-600' },
    { label: 'Approved', value: m.approved, icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600' },
    { label: 'Team Formation', value: m.team_forming, icon: <Users className="w-4 h-4" />, color: 'text-cyan-600' },
    { label: 'Building', value: m.building, icon: <Hammer className="w-4 h-4" />, color: 'text-indigo-600' },
    { label: 'POCs', value: m.pocs_completed, icon: <Beaker className="w-4 h-4" />, color: 'text-orange-600' },
    { label: 'Production Candidates', value: m.production_candidates, icon: <Rocket className="w-4 h-4" />, color: 'text-teal-600' },
    { label: 'Adopted', value: m.adopted, icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-600' },
  ];

  const maxFunnelCount = Math.max(...insights.innovation_funnel.map((s) => s.count), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-enterprise-charcoal">Innovation Command Center</h1>
        <p className="text-sm text-enterprise-charcoal/60 mt-1">
          Real-time view of your innovation pipeline from ideas to adoption
        </p>
      </div>

      {/* 9 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {metricCards.map((mc) => (
          <MetricCard key={mc.label} label={mc.label} value={mc.value} icon={mc.icon} color={mc.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {dashboard && (
          <>
            <MetricCard label="Users" value={dashboard.metrics.users} icon={<Users className="w-4 h-4" />} />
            <MetricCard label="Teams" value={dashboard.metrics.teams} icon={<Users className="w-4 h-4" />} />
            <MetricCard label="Projects" value={dashboard.metrics.projects} icon={<Hammer className="w-4 h-4" />} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Innovation Funnel */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Innovation Funnel</h2>
          {hasData && insights.innovation_funnel.some((s) => s.count > 0) ? (
            <div className="space-y-2">
              {insights.innovation_funnel.map((stage, i) => {
                const widthPercent = maxFunnelCount > 0 ? (stage.count / maxFunnelCount) * 100 : 0;
                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="text-sm text-enterprise-charcoal/70 w-28 flex-shrink-0">{stage.label}</span>
                    <div className="flex-1 bg-enterprise-gray-warm rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all duration-500"
                        style={{
                          width: `${Math.max(widthPercent, stage.count > 0 ? 12 : 0)}%`,
                          backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                        }}
                      >
                        {stage.count > 0 && stage.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<ActivityIcon className="w-8 h-8" />}
              title="No pipeline data yet"
              message="Submit ideas to start building your innovation pipeline."
              action={
                <Link to="/ideas" className="btn-primary">
                  Submit an Idea <ArrowRight className="w-4 h-4" />
                </Link>
              }
            />
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Recent Activity</h2>
          {insights.recent_activity.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {insights.recent_activity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-enterprise-gray-warm transition-colors">
                  <div className="w-2 h-2 rounded-full bg-enterprise-red mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-enterprise-charcoal">{activity.description}</p>
                    <p className="text-xs text-enterprise-charcoal/40 mt-0.5">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ActivityIcon className="w-8 h-8" />}
              title="No recent activity"
              message="Activity from ideas, reviews, and projects will appear here."
            />
          )}
        </div>
      </div>

      {/* Adoption Summary */}
      {hasData && (
        <div className="card p-5 mt-4">
          <h2 className="section-title mb-4">Adoption Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-enterprise-charcoal/60 uppercase tracking-wide">Adoption Rate</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{insights.adoption_metrics.adoption_rate}%</p>
            </div>
            <div>
              <p className="text-xs text-enterprise-charcoal/60 uppercase tracking-wide">Adopted</p>
              <p className="text-2xl font-bold text-enterprise-charcoal mt-1">{insights.adoption_metrics.adopted}</p>
            </div>
            <div>
              <p className="text-xs text-enterprise-charcoal/60 uppercase tracking-wide">Production Candidates</p>
              <p className="text-2xl font-bold text-enterprise-charcoal mt-1">{insights.adoption_metrics.production_candidates}</p>
            </div>
            <div>
              <p className="text-xs text-enterprise-charcoal/60 uppercase tracking-wide">Demos</p>
              <p className="text-2xl font-bold text-enterprise-charcoal mt-1">{insights.adoption_metrics.demos}</p>
            </div>
            <div>
              <p className="text-xs text-enterprise-charcoal/60 uppercase tracking-wide">POCs Completed</p>
              <p className="text-2xl font-bold text-enterprise-charcoal mt-1">{insights.adoption_metrics.pocs_completed}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/insights" className="btn-secondary">
          View Full Leadership Insights <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
