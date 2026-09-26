import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-amber-100 text-amber-800',
  in_validation: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  team_forming: 'bg-cyan-100 text-cyan-800',
  building: 'bg-indigo-100 text-indigo-800',
  poc: 'bg-orange-100 text-orange-800',
  adopted: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-gray-100 text-gray-800',
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  planning: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-red-100 text-red-800',
  pending: 'bg-gray-100 text-gray-800',
  done: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
  open: 'bg-green-100 text-green-800',
  filled: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
  accepted: 'bg-green-100 text-green-800',
  idea: 'bg-blue-100 text-blue-800',
  validation: 'bg-purple-100 text-purple-800',
  project: 'bg-indigo-100 text-indigo-800',
  adoption: 'bg-emerald-100 text-emerald-800',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={`badge ${colorClass}`}>{label}</span>;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state card p-8">
      {icon && <div className="mb-3 text-enterprise-charcoal/30">{icon}</div>}
      <h3 className="text-lg font-semibold text-enterprise-charcoal mb-1">{title}</h3>
      <p className="text-sm text-enterprise-charcoal/60 max-w-md">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
}

export function MetricCard({ label, value, icon, color = 'text-enterprise-charcoal' }: MetricCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-enterprise-charcoal/60">{label}</span>
        {icon && <span className={color}>{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold text-enterprise-charcoal">{value}</div>
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-enterprise-gray-border">
          <h2 className="text-lg font-semibold text-enterprise-charcoal">{title}</h2>
          <button onClick={onClose} className="text-enterprise-charcoal/50 hover:text-enterprise-charcoal text-xl">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-enterprise-charcoal">{title}</h1>
        {subtitle && <p className="text-sm text-enterprise-charcoal/60 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-enterprise-charcoal/50 text-sm">{message}</div>
    </div>
  );
}

interface ErrorProps {
  message: string;
}

export function ErrorState({ message }: ErrorProps) {
  return (
    <div className="card p-6 text-center">
      <p className="text-red-600 text-sm">{message}</p>
    </div>
  );
}
