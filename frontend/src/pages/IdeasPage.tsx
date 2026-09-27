import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lightbulb, Plus, Search, ArrowRight, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { ideaApi, userApi } from '../api/endpoints';
import { PageHeader, EmptyState, Loading, ErrorState, StatusBadge, SearchBar, FilterBar } from '../components/ui';
import type { Idea, User } from '../types';

const STATUS_OPTIONS = ['draft', 'submitted', 'under_review', 'validation', 'approved', 'parked', 'rejected'];
const COMPLEXITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest First' },
  { value: 'created_at:asc', label: 'Oldest First' },
  { value: 'title:asc', label: 'Title A-Z' },
  { value: 'title:desc', label: 'Title Z-A' },
  { value: 'status:asc', label: 'Status A-Z' },
];

const PAGE_SIZE = 9;

export function IdeasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const techFilter = searchParams.get('technology') || '';
  const areaFilter = searchParams.get('business_area') || '';
  const founderFilter = searchParams.get('founder_id') || '';
  const sortBy = searchParams.get('sort') || 'created_at:desc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  const { data: ideas, isLoading, isError } = useQuery({
    queryKey: ['ideas', search, statusFilter, techFilter, areaFilter, founderFilter],
    queryFn: () => ideaApi.getAll({
      search: search || undefined,
      status: statusFilter || undefined,
      technology: techFilter || undefined,
      business_area: areaFilter || undefined,
      founder_id: founderFilter || undefined,
    }),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  const userMap = useMemo(() => {
    const m = new Map<string, User>();
    users?.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const allTechnologies = useMemo(() => {
    const set = new Set<string>();
    ideas?.forEach((i) => i.technologies?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [ideas]);

  const allBusinessAreas = useMemo(() => {
    const set = new Set<string>();
    ideas?.forEach((i) => { if (i.business_area) set.add(i.business_area); });
    return Array.from(set).sort();
  }, [ideas]);

  const sortedIdeas = useMemo(() => {
    if (!ideas) return [];
    const [field, dir] = sortBy.split(':');
    const sorted = [...ideas];
    sorted.sort((a, b) => {
      let av: string | number = a[field as keyof Idea] as string || '';
      let bv: string | number = b[field as keyof Idea] as string || '';
      if (field === 'title') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [ideas, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedIdeas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedIdeas = sortedIdeas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasFilters = search || statusFilter || techFilter || areaFilter || founderFilter;

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput('');
  };

  return (
    <div>
      <PageHeader
        title="Ideas"
        subtitle="Submit and track engineering and business innovation ideas"
        action={
          <Link to="/ideas/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Submit an Idea
          </Link>
        }
      />

      <div className="card p-4 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <div className="flex-1">
            <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search ideas by title, problem, solution, or business area..." />
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <FilterBar>
          <div className="flex items-center gap-1 text-sm text-enterprise-charcoal-500">
            <Filter className="w-4 h-4" /> Filters:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => updateParam('status', e.target.value)}
            className="input max-w-[150px] py-1.5 text-sm"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <select
            value={techFilter}
            onChange={(e) => updateParam('technology', e.target.value)}
            className="input max-w-[150px] py-1.5 text-sm"
          >
            <option value="">All Technologies</option>
            {allTechnologies.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={areaFilter}
            onChange={(e) => updateParam('business_area', e.target.value)}
            className="input max-w-[150px] py-1.5 text-sm"
          >
            <option value="">All Business Areas</option>
            {allBusinessAreas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={founderFilter}
            onChange={(e) => updateParam('founder_id', e.target.value)}
            className="input max-w-[180px] py-1.5 text-sm"
          >
            <option value="">All Founders</option>
            {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="input max-w-[160px] py-1.5 text-sm"
          >
            {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary py-1.5 text-sm">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </FilterBar>
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorState message="Failed to load ideas" />}

      {ideas && ideas.length === 0 && !hasFilters && (
        <EmptyState
          icon={<Lightbulb className="w-7 h-7" />}
          title="No Ideas Yet"
          message="Turn an engineering problem into an innovation opportunity."
          action={
            <Link to="/ideas/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Submit an Idea
            </Link>
          }
        />
      )}

      {ideas && ideas.length === 0 && hasFilters && (
        <EmptyState
          icon={<Search className="w-7 h-7" />}
          title="No ideas match your filters"
          message="Try adjusting or clearing your filters to see more ideas."
          action={<button onClick={clearFilters} className="btn-secondary">Clear Filters</button>}
        />
      )}

      {pagedIdeas.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedIdeas.map((idea) => {
              const founder = userMap.get(idea.founder_id || '');
              return (
                <div
                  key={idea.id}
                  className="card-hover p-4 cursor-pointer animate-fade-in-up"
                  onClick={() => navigate(`/ideas/${idea.id}`)}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="font-semibold text-enterprise-charcoal-900 line-clamp-1 text-sm">{idea.title}</h3>
                    <StatusBadge status={idea.status} />
                  </div>
                  <p className="text-sm text-enterprise-charcoal-500 line-clamp-2 mb-3">
                    {idea.problem_statement || idea.proposed_solution || 'No description provided'}
                  </p>
                  {idea.technologies && idea.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {idea.technologies.slice(0, 3).map((t) => (
                        <span key={t} className="badge bg-enterprise-blue-50 text-enterprise-blue-700 text-xs">{t}</span>
                      ))}
                      {idea.technologies.length > 3 && (
                        <span className="badge bg-enterprise-charcoal-100 text-enterprise-charcoal-500 text-xs">+{idea.technologies.length - 3}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-enterprise-charcoal-400">
                    <span>{idea.business_area || 'No area'}</span>
                    <span>by {founder?.name || 'Unknown'}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-enterprise-gray-border flex items-center text-xs text-enterprise-red-600 font-medium">
                    View details <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-enterprise-charcoal-400">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, sortedIdeas.length)} of {sortedIdeas.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateParam('page', String(currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="btn-secondary py-1.5 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-sm text-enterprise-charcoal-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => updateParam('page', String(currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  className="btn-secondary py-1.5 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
