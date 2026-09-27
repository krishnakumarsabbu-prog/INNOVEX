import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, HelpCircle, User, Lightbulb, ChevronDown, Menu, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/endpoints';
import { IntelligencePanel } from '../components/IntelligencePanel';

import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/ideas', label: 'Ideas' },
  { to: '/review', label: 'Review Center' },
  { to: '/innovation', label: 'Innovation' },
  { to: '/workspace', label: 'My Workspace' },
  { to: '/teams', label: 'Teams' },
  { to: '/projects', label: 'Projects' },
  { to: '/insights', label: 'Insights' },
  { to: '/administration', label: 'Administration' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, users, loginAs, logout } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  const orgName = dashboard?.organization?.name || 'INNOVEX';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/ideas?search=${encodeURIComponent(searchValue)}`);
      setSearchValue('');
    }
  };

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;
    const labelMap: Record<string, string> = {
      ideas: 'Ideas',
      new: 'New',
      mine: 'My Ideas',
      innovation: 'Innovation',
      workspace: 'My Workspace',
      teams: 'Teams',
      projects: 'Projects',
      review: 'Review',
      insights: 'Insights',
      administration: 'Administration',
      validation: 'Validation',
    };
    const crumbs = segments.map((seg, i) => ({
      label: labelMap[seg] || seg,
      path: '/' + segments.slice(0, i + 1).join('/'),
      isLast: i === segments.length - 1,
    }));
    return crumbs;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-enterprise-gray-warm flex flex-col">
      {/* ===== Enterprise Header ===== */}
      <header className="bg-enterprise-red-600 sticky top-0 z-50 shadow-enterprise-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-enterprise flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-enterprise-red-600" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-white font-bold text-base tracking-wide">INNOVEX</span>
                <span className="text-white/70 text-2xs tracking-wide hidden sm:block">
                  Enterprise Innovation & Engineering Exchange
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    isActive ? 'nav-link-active' : 'nav-link'
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search ideas..."
                    aria-label="Search ideas"
                    className="pl-8 pr-3 py-1.5 bg-white/10 text-white placeholder-white/50 rounded-enterprise text-sm w-40 focus:outline-none focus:bg-white/20 focus:w-56 transition-all duration-200"
                  />
                </div>
              </form>
              <button
                className="text-white/80 hover:text-white p-1.5 rounded-enterprise hover:bg-white/10 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                {dashboard?.metrics && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-enterprise-gold-400 rounded-full" />
                )}
              </button>
              <button
                className="text-white/80 hover:text-white p-1.5 rounded-enterprise hover:bg-white/10 transition-colors"
                aria-label="Help"
              >
                <HelpCircle className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              </button>
              {/* User Account / Switcher */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="text-white/90 hover:text-white px-2 py-1 rounded-enterprise hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-medium"
                  aria-label="User account"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-2xs">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="hidden sm:inline-block max-w-[100px] truncate">
                    {currentUser?.name || 'Sign In'}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-enterprise shadow-enterprise-lg border border-enterprise-gray-border py-2 z-50 animate-fade-in text-enterprise-charcoal-900">
                    <div className="px-3 py-2 border-b border-enterprise-gray-border">
                      <p className="text-xs font-semibold text-enterprise-charcoal-900">{currentUser?.name || 'Guest'}</p>
                      <p className="text-2xs text-enterprise-charcoal-500">{currentUser?.email || 'No email'}</p>
                      {currentUser?.role && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-3xs font-semibold uppercase bg-enterprise-blue-50 text-enterprise-blue-700">
                          {currentUser.role}
                        </span>
                      )}
                    </div>

                    {users && users.length > 1 && (
                      <div className="px-3 py-2 border-b border-enterprise-gray-border">
                        <p className="text-3xs font-semibold uppercase tracking-wider text-enterprise-charcoal-400 mb-1.5">
                          Switch Active User
                        </p>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {users.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => {
                                loginAs(u);
                                setUserMenuOpen(false);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between ${
                                currentUser?.id === u.id
                                  ? 'bg-enterprise-red-50 text-enterprise-red-700 font-semibold'
                                  : 'hover:bg-enterprise-gray-warm text-enterprise-charcoal-700'
                              }`}
                            >
                              <span className="truncate">{u.name}</span>
                              <span className="text-3xs text-enterprise-charcoal-400 capitalize">{u.role}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-1">
                      <NavLink
                        to="/setup"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-1.5 text-xs text-enterprise-charcoal-700 hover:bg-enterprise-gray-warm block"
                      >
                        Workspace Setup &amp; Organization
                      </NavLink>
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate('/setup');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-enterprise-error-600 hover:bg-enterprise-error-50 block"
                      >
                        Switch Account / Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                className="lg:hidden text-white/80 hover:text-white p-1.5 rounded-enterprise hover:bg-white/10 transition-colors ml-1"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Gold separator */}
        <div className="gold-separator" />

        {/* Mobile Navigation */}
        {mobileNavOpen && (
          <nav className="lg:hidden bg-enterprise-red-700 border-t border-white/10 animate-fade-in" aria-label="Mobile navigation">
            <div className="max-w-[1440px] mx-auto px-4 py-2 flex flex-col gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 text-sm font-medium rounded-enterprise transition-colors ${
                      isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* ===== Enterprise Quick Persona Switcher Bar ===== */}
      <div className="bg-enterprise-charcoal-900 text-white/90 text-xs px-4 sm:px-6 py-1.5 flex items-center justify-between flex-wrap gap-2 border-b border-enterprise-charcoal-800 shadow-inner">
        <div className="flex items-center gap-2">
          <span className="text-white/60 font-medium hidden sm:inline">Active Persona:</span>
          <span className="font-semibold text-white bg-enterprise-charcoal-800 px-2 py-0.5 rounded border border-enterprise-charcoal-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-enterprise-emerald-400"></span>
            {currentUser?.name || 'Guest'}
            <span className="text-enterprise-gold-400 capitalize text-3xs font-bold px-1.5 py-0.2 rounded bg-white/10">
              {currentUser?.role?.replace('_', ' ') || 'None'}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-white/50 text-3xs uppercase tracking-wider mr-1 hidden md:inline">Quick Role Switch:</span>
          {users?.slice(0, 6).map((u) => {
            const isActive = currentUser?.id === u.id;
            const badgeIcon =
              u.role === 'principal_engineer' ? '🛠️ PE: ' :
              u.role === 'admin' ? '🛡️ Admin: ' :
              u.role === 'manager' ? '👔 Mgr: ' :
              u.role === 'panel_member' ? '📋 Panel: ' : '💡 Eng: ';
            return (
              <button
                key={u.id}
                onClick={() => loginAs(u)}
                className={`px-2 py-0.5 rounded text-3xs font-medium transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-enterprise-red-600 text-white font-bold ring-1 ring-white/50 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
                title={`Switch to ${u.name} (${u.title || u.role})`}
              >
                <span>{badgeIcon}</span>
                <span className="truncate max-w-[80px]">{u.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Breadcrumb Bar ===== */}
      {breadcrumbs && (
        <div className="bg-white border-b border-enterprise-gray-border">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5">
            <nav className="flex items-center" aria-label="Breadcrumb">
              <NavLink to="/" className="breadcrumb-link">Home</NavLink>
              {breadcrumbs.map((crumb) => (
                <div key={crumb.path} className="flex items-center">
                  <span className="breadcrumb-separator">/</span>
                  {crumb.isLast ? (
                    <span className="breadcrumb-current">{crumb.label}</span>
                  ) : (
                    <NavLink to={crumb.path} className="breadcrumb-link">{crumb.label}</NavLink>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ===== Main Content ===== */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 animate-fade-in">
            <Outlet />
          </div>
          <IntelligencePanel />
        </div>
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-white border-t border-enterprise-gray-border mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between text-xs text-enterprise-charcoal-400">
            <span className="font-medium text-enterprise-charcoal-500">INNOVEX</span>
            <span className="hidden sm:block">Enterprise Innovation & Engineering Exchange</span>
            <span className="text-enterprise-charcoal-400">From Ideas to Impact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
