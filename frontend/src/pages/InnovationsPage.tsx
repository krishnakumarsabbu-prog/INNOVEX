import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, Filter, Users, Briefcase, ArrowRight, X, Cpu, Building2, Layers, UserCircle, Clock } from 'lucide-react';
import { innovationApi } from '../api/endpoints';
import { PageHeader, EmptyState, Loading, ErrorState, StatusBadge } from '../components/ui';
import type { MarketplaceInnovation } from '../types';

const STAGE_OPTIONS = [
  { value: '', label: 'All Stages' },
  { value: 'validation', label: 'Validation' },
  { value: 'open_for_team', label: 'Open for Team' },
  { value: 'team_forming', label: 'Team Forming' },
  { value: 'building', label: 'Building' },
  { value: 'poc', label: 'POC' },
  { value: 'demo', label: 'Demo' },
  { value: 'production_candidate', label: 'Production Candidate' },
  { value: 'adopted', label: 'Adopted' },
  { value: 'parked', label: 'Parked' },
  { value: 'closed', label: 'Closed' },
];

const TEAM_SIZE_OPTIONS = [
  { value: 0, label: 'Any Team Size' },
  { value: 1, label: '1+ members' },
  { value: 3, label: '3+ members' },
  { value: 5, label: '5+ members' },
  { value: 10, label: '10+ members' },
];

export function InnovationsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [technology, setTechnology] = useState('');
  const [businessArea, setBusinessArea] = useState('');
  const [stage, setStage] = useState('');
  const [openRolesOnly, setOpenRolesOnly] = useState(false);
  const [teamSize, setTeamSize] = useState(0);
  const [founder, setFounder] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: innovations, isLoading, isError } = useQuery({
    queryKey: ['innovations'],
    queryFn: () => innovationApi.getAll(),
  });

  const technologyOptions = useMemo(() => {
    const set = new Set<string>();
    innovations?.forEach((inv) => inv.technologies.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [innovations]);

  const businessAreaOptions = useMemo(() => {
    const set = new Set<string>();
    innovations?.forEach((inv) => { if (inv.business_area) set.add(inv.business_area); });
    return Array.from(set).sort();
  }, [innovations]);

  const founderOptions = useMemo(() => {
    const map = new Map<string, string>();
    innovations?.forEach((inv) => {
      if (inv.founder_id && inv.founder_name) map.set(inv.founder_id, inv.founder_name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [innovations]);

  const filtered = useMemo(() => {
    if (!innovations) return [];
    return innovations.filter((inv) => {
      if (search) {
        const q = search.toLowerCase();
        const match = inv.title.toLowerCase().includes(q) ||
          inv.summary.toLowerCase().includes(q) ||
          inv.problem_statement.toLowerCase().includes(q) ||
          inv.business_area.toLowerCase().includes(q) ||
          inv.technologies.some((t) => t.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (technology && !inv.technologies.includes(technology)) return false;
      if (businessArea && inv.business_area !== businessArea) return false;
      if (stage && inv.stage !== stage) return false;
      if (openRolesOnly && !inv.open_roles.some((r) => r.status === 'open')) return false;
      if (teamSize > 0 && inv.team_size < teamSize) return false;
      if (founder && inv.founder_id !== founder) return false;
      return true;
    });
  }, [innovations, search, technology, businessArea, stage, openRolesOnly, teamSize, founder]);

  const activeFilterCount = [technology, businessArea, stage, founder].filter(Boolean).length +
    (openRolesOnly ? 1 : 0) + (teamSize > 0 ? 1 : 0);

  const clearFilters = () => {
    setSearch('');
    setTechnology('');
    setBusinessArea('');
    setStage('');
    setOpenRolesOnly(false);
    setTeamSize(0);
    setFounder('');
  };

  return (
    <div>
      <PageHeader
        title="Open Innovation Marketplace"
        subtitle="Discover approved innovations and join collaborative engineering teams"
      />

      <div className="card p-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-enterprise-charcoal/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search innovations by title, problem, technology, or business area..."
                className="input pl-9"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-enterprise-charcoal/40 hover:text-enterprise-charcoal">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              className={`btn-secondary ${showFilters ? 'bg-enterprise-red/5 border-enterprise-red/30' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" /> Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-enterprise-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-enterprise-gray-border">
              <div>
                <label className="label text-xs">Technology</label>
                <select value={technology} onChange={(e) => setTechnology(e.target.value)} className="input text-sm">
                  <option value="">All Technologies</option>
                  {technologyOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Business Area</label>
                <select value={businessArea} onChange={(e) => setBusinessArea(e.target.value)} className="input text-sm">
                  <option value="">All Business Areas</option>
                  {businessAreaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Stage</label>
                <select value={stage} onChange={(e) => setStage(e.target.value)} className="input text-sm">
                  {STAGE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Founder</label>
                <select value={founder} onChange={(e) => setFounder(e.target.value)} className="input text-sm">
                  <option value="">All Founders</option>
                  {founderOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Team Size</label>
                <select value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className="input text-sm">
                  {TEAM_SIZE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm text-enterprise-charcoal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openRolesOnly}
                    onChange={(e) => setOpenRolesOnly(e.target.checked)}
                    className="rounded border-enterprise-gray-border text-enterprise-red focus:ring-enterprise-red/20"
                  />
                  Open Roles Only
                </label>
              </div>
              {activeFilterCount > 0 && (
                <div className="flex items-end">
                  <button onClick={clearFilters} className="text-sm text-enterprise-red hover:underline flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 text-sm text-enterprise-charcoal/60">
        {filtered.length} innovation{filtered.length !== 1 ? 's' : ''} found
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorState message="Failed to load innovations" />}

      {innovations && innovations.length === 0 && (
        <EmptyState
          icon={<Sparkles className="w-8 h-8" />}
          title="No innovations yet"
          message="Approved ideas are promoted to innovations to begin the engineering lifecycle."
        />
      )}

      {innovations && innovations.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={<Filter className="w-8 h-8" />}
          title="No matching innovations"
          message="Try adjusting your filters to see more results."
          action={<button className="btn-secondary" onClick={clearFilters}>Clear filters</button>}
        />
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((inv) => (
            <InnovationCard key={inv.id} innovation={inv} onClick={() => navigate(`/innovation/${inv.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function InnovationCard({ innovation, onClick }: { innovation: MarketplaceInnovation; onClick: () => void }) {
  const openRoles = innovation.open_roles.filter((r) => r.status === 'open');
  return (
    <div className="card p-5 cursor-pointer hover:shadow-md transition-all duration-150 hover:border-enterprise-red/20 group" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-enterprise-charcoal line-clamp-2 group-hover:text-enterprise-red transition-colors">
          {innovation.title}
        </h3>
        <StatusBadge status={innovation.stage} />
      </div>

      <p className="text-sm text-enterprise-charcoal/60 line-clamp-2 mb-3">
        {innovation.problem_statement || innovation.summary}
      </p>

      {innovation.business_area && (
        <div className="flex items-center gap-1.5 text-xs text-enterprise-charcoal/50 mb-2">
          <Building2 className="w-3.5 h-3.5" />
          {innovation.business_area}
        </div>
      )}

      {innovation.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {innovation.technologies.slice(0, 4).map((tech) => (
            <span key={tech} className="badge bg-enterprise-gray-warm text-enterprise-charcoal/70 text-xs">
              {tech}
            </span>
          ))}
          {innovation.technologies.length > 4 && (
            <span className="text-xs text-enterprise-charcoal/40 self-center">
              +{innovation.technologies.length - 4} more
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs text-enterprise-charcoal/60 mb-3">
        <div className="flex items-center gap-1.5">
          <UserCircle className="w-3.5 h-3.5" />
          <span className="truncate">{innovation.founder_name || 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {innovation.team_size} member{innovation.team_size !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5" />
          {openRoles.length} open role{openRoles.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {innovation.followers} follower{innovation.followers !== 1 ? 's' : ''}
        </div>
      </div>

      {innovation.team_progress > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-enterprise-charcoal/50 mb-1">
            <span>Team Progress</span>
            <span>{innovation.team_progress}%</span>
          </div>
          <div className="h-1.5 bg-enterprise-gray-warm rounded-full overflow-hidden">
            <div
              className="h-full bg-enterprise-red rounded-full transition-all duration-300"
              style={{ width: `${innovation.team_progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-enterprise-gray-border">
        <div className="flex items-center gap-1 text-xs text-enterprise-charcoal/40">
          <Clock className="w-3 h-3" />
          {innovation.last_activity ? formatDate(innovation.last_activity) : 'No activity yet'}
        </div>
        <div className="flex items-center text-xs text-enterprise-red font-medium group-hover:gap-2 transition-all">
          View details <ArrowRight className="w-3 h-3 ml-1" />
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}
