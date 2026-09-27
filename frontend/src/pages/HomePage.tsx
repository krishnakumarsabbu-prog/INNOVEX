import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Lightbulb, Eye, FlaskConical, CheckCircle, Users, Hammer,
  Beaker, Rocket, TrendingUp, Activity as ActivityIcon, ArrowRight,
  Plus, Inbox,
} from 'lucide-react';
import { insightsApi, dashboardApi } from '../api/endpoints';
import { MetricCard, EmptyState, Loading, ErrorState, PageHeader, ActivityFeed } from '../components/ui';
import type { InsightsOverview } from '../types';

const FUNNEL_COLORS = [
  '#2563EB', '#0EA5E9', '#8B5CF6', '#6366F1', '#06B6D4',
  '#F97316', '#F59E0B', '#22C55E', '#15803D',
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

  const metricCards = [
    { label: 'Ideas Submitted', value: m.ideas_submitted, icon: <Lightbulb className="w-4 h-4" />, color: 'text-enterprise-blue-600' },
    { label: 'Under Review', value: m.under_review, icon: <Eye className="w-4 h-4" />, color: 'text-enterprise-warning-600' },
    { label: 'In Validation', value: m.in_validation, icon: <FlaskConical className="w-4 h-4" />, color: 'text-purple-600' },
    { label: 'Approved', value: m.approved, icon: <CheckCircle className="w-4 h-4" />, color: 'text-enterprise-success-600' },
    { label: 'Team Formation', value: m.team_forming, icon: <Users className="w-4 h-4" />, color: 'text-enterprise-blue-600' },
    { label: 'Building', value: m.building, icon: <Hammer className="w-4 h-4" />, color: 'text-indigo-600' },
    { label: 'POCs', value: m.pocs_completed, icon: <Beaker className="w-4 h-4" />, color: 'text-enterprise-warning-600' },
    { label: 'Production Candidates', value: m.production_candidates, icon: <Rocket className="w-4 h-4" />, color: 'text-teal-600' },
    { label: 'Adopted', value: m.adopted, icon: <TrendingUp className="w-4 h-4" />, color: 'text-enterprise-success-700' },
  ];

  const maxFunnelCount = Math.max(...insights.innovation_funnel.map((s) => s.count), 1);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Innovation Command Center"
        subtitle="Real-time view of your innovation pipeline from ideas to adoption"
        action={
          <Link to="/ideas/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Submit an Idea
          </Link>
        }
      />

      {/* 9 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {metricCards.map((mc) => (
          <MetricCard key={mc.label} label={mc.label} value={mc.value} icon={mc.icon} color={mc.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {dashboard && (
          <>
            <MetricCard label="Users" value={dashboard.metrics.users} icon={<Users className="w-4 h-4" />} color="text-enterprise-red-600" />
            <MetricCard label="Teams" value={dashboard.metrics.teams} icon={<Users className="w-4 h-4" />} color="text-enterprise-red-600" />
            <MetricCard label="Projects" value={dashboard.metrics.projects} icon={<Hammer className="w-4 h-4" />} color="text-enterprise-red-600" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Innovation Funnel */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Innovation Funnel</h2>
          {hasData && insights.innovation_funnel.some((s) => s.count > 0) ? (
            <div className="space-y-2">
              {insights.innovation_funnel.map((stage, i) => {
                const widthPercent = maxFunnelCount > 0 ? (stage.count / maxFunnelCount) * 100 : 0;
                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="text-sm text-enterprise-charcoal-600 w-28 flex-shrink-0">{stage.label}</span>
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
              icon={<ActivityIcon className="w-7 h-7" />}
              title="No pipeline data yet"
              message="Submit ideas to start building your innovation pipeline."
              action={
                <Link to="/ideas/new" className="btn-primary">
                  <Plus className="w-4 h-4" /> Submit an Idea
                </Link>
              }
            />
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Recent Activity</h2>
          {insights.recent_activity.length > 0 ? (
            <ActivityFeed items={insights.recent_activity} />
          ) : (
            <EmptyState
              icon={<ActivityIcon className="w-7 h-7" />}
              title="No recent activity"
              message="Activity from ideas, reviews, and projects will appear here."
            />
          )}
        </div>
      </div>

      {/* Adoption Summary */}
      {hasData && (
        <div className="card p-5 mb-6">
          <h2 className="section-title mb-4">Adoption Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-enterprise-charcoal-500 uppercase tracking-wide">Adoption Rate</p>
              <p className="text-2xl font-bold text-enterprise-success-700 mt-1">{insights.adoption_metrics.adoption_rate}%</p>
            </div>
            <div>
              <p className="text-xs text-enterprise-charcoal-500 uppercase tracking-wide">Adopted</p>
              <p className="text-2xl font-bold text-enterprise-charcoal-900 mt-1">{insights.adoption_metrics.adopted}</p>
            </div>
            <div>
              <p className="text-xs text-enterprise-charcoal-500 uppercase tracking-wide">Production Candidates</p>
              <p className="text-2xl font-bold text-enterprise-charcoal-900 mt-1">{insights.adoption_metrics.production_candidates}</p>
            </div>
            <div>
              <p className="text-xs text-enterprise-charcoal-500 uppercase tracking-wide">Demos</p>
              <p className="text-2xl font-bold text-enterprise-charcoal-900 mt-1">{insights.adoption_metrics.demos}</p>
            </div>
            <div>
              <p className="text-xs text-enterprise-charcoal-500 uppercase tracking-wide">POCs Completed</p>
              <p className="text-2xl font-bold text-enterprise-charcoal-900 mt-1">{insights.adoption_metrics.pocs_completed}</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link to="/insights" className="btn-secondary">
          View Full Leadership Insights <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
