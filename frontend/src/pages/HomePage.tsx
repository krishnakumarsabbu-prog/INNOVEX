import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Lightbulb, Eye, FlaskConical, CheckCircle, Users, Hammer,
  Beaker, TrendingUp, Activity as ActivityIcon, ArrowRight,
} from 'lucide-react';
import { dashboardApi } from '../api/endpoints';
import { MetricCard, EmptyState, Loading, ErrorState } from '../components/ui';

export function HomePage() {
  const { data: dashboard, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  if (isLoading) return <Loading />;
  if (isError || !dashboard) return <ErrorState message="Failed to load dashboard data" />;

  const m = dashboard.metrics;
  const hasData = m.ideas > 0 || m.users > 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-enterprise-charcoal">Innovation Command Center</h1>
        <p className="text-sm text-enterprise-charcoal/60 mt-1">
          Real-time view of your innovation pipeline from ideas to adoption
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Ideas" value={m.ideas} icon={<Lightbulb className="w-4 h-4" />} />
        <MetricCard label="Under Review" value={m.under_review} icon={<Eye className="w-4 h-4" />} />
        <MetricCard label="In Validation" value={m.in_validation} icon={<FlaskConical className="w-4 h-4" />} />
        <MetricCard label="Approved" value={m.approved} icon={<CheckCircle className="w-4 h-4" />} />
        <MetricCard label="Team Forming" value={m.team_forming} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Building" value={m.building} icon={<Hammer className="w-4 h-4" />} />
        <MetricCard label="POCs" value={m.pocs} icon={<Beaker className="w-4 h-4" />} />
        <MetricCard label="Adopted" value={m.adopted} icon={<TrendingUp className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Users" value={m.users} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Teams" value={m.teams} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Projects" value={m.projects} icon={<Hammer className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="section-title mb-4">Innovation Pipeline</h2>
          {hasData ? (
            <div className="space-y-3">
              {[
                { label: 'Idea Stage', value: dashboard.pipeline.idea, color: 'bg-blue-500' },
                { label: 'Validation', value: dashboard.pipeline.validation, color: 'bg-purple-500' },
                { label: 'Project', value: dashboard.pipeline.project, color: 'bg-indigo-500' },
                { label: 'POC', value: dashboard.pipeline.poc, color: 'bg-orange-500' },
                { label: 'Adoption', value: dashboard.pipeline.adoption, color: 'bg-emerald-500' },
                { label: 'Completed', value: dashboard.pipeline.completed, color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-enterprise-charcoal/70 w-24">{item.label}</span>
                  <div className="flex-1 bg-enterprise-gray-warm rounded-full h-6 overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all`}
                      style={{ width: `${Math.max(item.value * 10, item.value > 0 ? 15 : 0)}%` }}
                    >
                      {item.value > 0 && item.value}
                    </div>
                  </div>
                </div>
              ))}
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

        <div className="card p-5">
          <h2 className="section-title mb-4">Recent Activity</h2>
          {dashboard.recent_activities.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {dashboard.recent_activities.map((activity) => (
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
    </div>
  );
}
