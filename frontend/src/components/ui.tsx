import type { ReactNode } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

// ==================== StatusBadge ====================

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  draft: 'bg-enterprise-charcoal-100 text-enterprise-charcoal-600',
  submitted: 'bg-enterprise-blue-100 text-enterprise-blue-700',
  under_review: 'bg-enterprise-warning-100 text-enterprise-warning-700',
  in_validation: 'bg-purple-100 text-purple-800',
  validation: 'bg-purple-100 text-purple-800',
  approved: 'bg-enterprise-success-100 text-enterprise-success-700',
  rejected: 'bg-enterprise-error-100 text-enterprise-error-700',
  parked: 'bg-enterprise-warning-100 text-enterprise-warning-700',
  team_forming: 'bg-enterprise-blue-100 text-enterprise-blue-700',
  building: 'bg-indigo-100 text-indigo-800',
  poc: 'bg-enterprise-warning-100 text-enterprise-warning-700',
  adopted: 'bg-enterprise-success-100 text-enterprise-success-700',
  archived: 'bg-enterprise-charcoal-100 text-enterprise-charcoal-500',
  not_started: 'bg-enterprise-charcoal-100 text-enterprise-charcoal-500',
  in_progress: 'bg-enterprise-blue-100 text-enterprise-blue-700',
  completed: 'bg-enterprise-success-100 text-enterprise-success-700',
  failed: 'bg-enterprise-error-100 text-enterprise-error-700',
  planning: 'bg-enterprise-charcoal-100 text-enterprise-charcoal-600',
  active: 'bg-enterprise-success-100 text-enterprise-success-700',
  on_hold: 'bg-enterprise-warning-100 text-enterprise-warning-700',
  cancelled: 'bg-enterprise-error-100 text-enterprise-error-700',
  pending: 'bg-enterprise-charcoal-100 text-enterprise-charcoal-500',
  done: 'bg-enterprise-success-100 text-enterprise-success-700',
  blocked: 'bg-enterprise-error-100 text-enterprise-error-700',
  open: 'bg-enterprise-success-100 text-enterprise-success-700',
  filled: 'bg-enterprise-blue-100 text-enterprise-blue-700',
  closed: 'bg-enterprise-charcoal-100 text-enterprise-charcoal-500',
  accepted: 'bg-enterprise-success-100 text-enterprise-success-700',
  idea: 'bg-enterprise-blue-100 text-enterprise-blue-700',
  project: 'bg-indigo-100 text-indigo-800',
  adoption: 'bg-enterprise-success-100 text-enterprise-success-700',
  approve: 'bg-enterprise-success-100 text-enterprise-success-700',
  reject: 'bg-enterprise-error-100 text-enterprise-error-700',
  park: 'bg-enterprise-warning-100 text-enterprise-warning-700',
  send_to_validation: 'bg-purple-100 text-purple-800',
  request_information: 'bg-enterprise-warning-100 text-enterprise-warning-700',
  continue_open_innovation: 'bg-enterprise-success-100 text-enterprise-success-700',
  return_for_more_validation: 'bg-enterprise-warning-100 text-enterprise-warning-700',
  close: 'bg-enterprise-error-100 text-enterprise-error-700',
  merge: 'bg-enterprise-blue-100 text-enterprise-blue-700',
  ready: 'bg-enterprise-blue-100 text-enterprise-blue-700',
  review: 'bg-enterprise-warning-100 text-enterprise-warning-700',
  back: 'bg-enterprise-charcoal-100 text-enterprise-charcoal-500',
  paused: 'bg-enterprise-warning-100 text-enterprise-warning-700',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusStyles[status] || 'bg-enterprise-charcoal-100 text-enterprise-charcoal-500';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`badge ${colorClass}`}>
      {label}
    </span>
  );
}

// ==================== PageHeader ====================

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-enterprise-charcoal-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-enterprise-charcoal-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ==================== MetricCard ====================

interface MetricCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
}

export function MetricCard({ label, value, icon, color = 'text-enterprise-red-600' }: MetricCardProps) {
  return (
    <div className="card p-4 hover:shadow-enterprise-md transition-shadow duration-150">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-enterprise-charcoal-500 uppercase tracking-wide">{label}</span>
        {icon && <span className={color}>{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-enterprise-charcoal-900">{value}</div>
    </div>
  );
}

// ==================== EmptyState ====================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state card p-10 animate-fade-in">
      {icon ? (
        <div className="mb-4 w-14 h-14 rounded-full bg-enterprise-gray-warm flex items-center justify-center text-enterprise-charcoal-300">
          {icon}
        </div>
      ) : (
        <div className="mb-4 w-14 h-14 rounded-full bg-enterprise-gray-warm flex items-center justify-center">
          <Inbox className="w-7 h-7 text-enterprise-charcoal-300" />
        </div>
      )}
      <h3 className="text-base font-semibold text-enterprise-charcoal-800 mb-1.5">{title}</h3>
      <p className="text-sm text-enterprise-charcoal-500 max-w-md leading-relaxed">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ==================== Loading ====================

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-2 h-2 bg-enterprise-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-enterprise-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-enterprise-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-sm text-enterprise-charcoal-400">{message}</p>
    </div>
  );
}

// ==================== ErrorState ====================

interface ErrorProps {
  message: string;
}

export function ErrorState({ message }: ErrorProps) {
  return (
    <div className="card p-6 text-center animate-fade-in">
      <div className="w-10 h-10 rounded-full bg-enterprise-error-100 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-5 h-5 text-enterprise-error-600" />
      </div>
      <p className="text-sm text-enterprise-error-700">{message}</p>
    </div>
  );
}

// ==================== Modal ====================

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-panel max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-enterprise-gray-border">
          <h2 id="modal-title" className="text-base font-semibold text-enterprise-charcoal-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-enterprise-charcoal-400 hover:text-enterprise-charcoal-700 p-1 rounded-enterprise hover:bg-enterprise-gray-warm transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ==================== ConfirmationDialog ====================

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

export function ConfirmationDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'default',
}: ConfirmationDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal-panel max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              variant === 'danger' ? 'bg-enterprise-error-100' : 'bg-enterprise-warning-100'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-enterprise-error-600' : 'text-enterprise-warning-600'}`} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-enterprise-charcoal-900 mb-1">{title}</h2>
              <p className="text-sm text-enterprise-charcoal-500">{message}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary text-sm" onClick={onCancel}>{cancelLabel}</button>
            <button className={variant === 'danger' ? 'btn-danger text-sm' : 'btn-primary text-sm'} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Drawer ====================

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, children, width = 'max-w-md' }: DrawerProps) {
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className={`drawer-panel ${width}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-enterprise-gray-border">
          <h2 className="text-base font-semibold text-enterprise-charcoal-900">{title}</h2>
          <button onClick={onClose} className="text-enterprise-charcoal-400 hover:text-enterprise-charcoal-700 p-1 rounded-enterprise hover:bg-enterprise-gray-warm transition-colors" aria-label="Close drawer">
            <X className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 56px)' }}>{children}</div>
      </div>
    </>
  );
}

// ==================== Toast ====================

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let currentToasts: ToastItem[] = [];

export function showToast(message: string, type: ToastType = 'info') {
  const id = `${Date.now()}-${Math.random()}`;
  currentToasts = [...currentToasts, { id, message, type }];
  toastListeners.forEach((l) => l(currentToasts));
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    toastListeners.forEach((l) => l(currentToasts));
  }, 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="w-4.5 h-4.5 text-enterprise-success-400" style={{ width: 18, height: 18 }} />,
    error: <AlertCircle className="w-4.5 h-4.5 text-enterprise-error-400" style={{ width: 18, height: 18 }} />,
    info: <Info className="w-4.5 h-4.5 text-enterprise-blue-500" style={{ width: 18, height: 18 }} />,
    warning: <AlertTriangle className="w-4.5 h-4.5 text-enterprise-warning-500" style={{ width: 18, height: 18 }} />,
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {icons[t.type]}
          <span className="text-sm">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ==================== UserAvatar ====================

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function UserAvatar({ name, size = 'md' }: UserAvatarProps) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div className={`${sizes[size]} rounded-full bg-enterprise-red-100 flex items-center justify-center text-enterprise-red-700 font-medium flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ==================== AvatarGroup ====================

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ names, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = names.slice(0, max);
  const remaining = names.length - max;
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((name, i) => (
        <div key={i} className="ring-2 ring-white rounded-full" style={{ zIndex: max - i }}>
          <UserAvatar name={name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div className="ring-2 ring-white rounded-full bg-enterprise-gray-warm flex items-center justify-center text-enterprise-charcoal-500 font-medium text-xs w-7 h-7" style={{ zIndex: 0 }}>
          +{remaining}
        </div>
      )}
    </div>
  );
}

// ==================== ProgressIndicator ====================

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
}

export function ProgressIndicator({ value, max = 100, label, showValue = true }: ProgressIndicatorProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5 text-sm">
          <span className="text-enterprise-charcoal-500">{label}</span>
          {showValue && <span className="font-semibold text-enterprise-charcoal-700">{percent}%</span>}
        </div>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// ==================== Tabs ====================

interface TabsProps {
  tabs: { key: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="card mb-4 overflow-hidden">
      <div className="tab-bar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`tab-item ${isActive ? 'tab-active' : 'tab-inactive'}`}
              aria-selected={isActive}
              role="tab"
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== Pagination ====================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-enterprise-charcoal-500">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-secondary px-2.5 py-1.5 text-sm disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-secondary px-2.5 py-1.5 text-sm disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ==================== Timeline ====================

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  icon?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-enterprise-red-100 flex items-center justify-center flex-shrink-0">
              {item.icon || <div className="w-2 h-2 bg-enterprise-red-600 rounded-full" />}
            </div>
            {i < items.length - 1 && <div className="w-0.5 flex-1 bg-enterprise-gray-border min-h-[24px]" />}
          </div>
          <div className="pb-4 pt-1">
            <p className="text-sm font-medium text-enterprise-charcoal-800">{item.title}</p>
            {item.description && <p className="text-xs text-enterprise-charcoal-500 mt-0.5">{item.description}</p>}
            {item.date && <p className="text-xs text-enterprise-charcoal-400 mt-1">{item.date}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== ActivityFeed ====================

interface ActivityItem {
  id: string;
  description: string;
  action?: string;
  created_at: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  maxHeight?: string;
}

export function ActivityFeed({ items, maxHeight = 'max-h-80' }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Inbox className="w-7 h-7 text-enterprise-charcoal-300 mb-2" />
        <p className="text-sm text-enterprise-charcoal-400">No recent activity.</p>
      </div>
    );
  }
  return (
    <div className={`space-y-1 ${maxHeight} overflow-y-auto`}>
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 p-2 rounded-enterprise hover:bg-enterprise-gray-warm transition-colors">
          <div className="w-2 h-2 rounded-full bg-enterprise-red-600 mt-1.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-enterprise-charcoal-700">{item.description}</p>
            <p className="text-xs text-enterprise-charcoal-400 mt-0.5">
              {item.action && <span className="capitalize">{item.action.replace(/_/g, ' ')}</span>}
              {item.action && ' · '}
              {new Date(item.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== SearchBar ====================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-enterprise-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}

// ==================== FilterBar ====================

interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {children}
    </div>
  );
}

// ==================== DataTable ====================

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  hidden?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({ columns, data, rowKey, onRowClick, emptyMessage = 'No data available' }: DataTableProps<T>) {
  const visibleColumns = columns.filter((c) => !c.hidden);
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="enterprise-table">
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="text-center py-8 text-enterprise-charcoal-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {visibleColumns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
