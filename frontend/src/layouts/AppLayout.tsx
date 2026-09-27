import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, HelpCircle, User, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/endpoints';
import { IntelligencePanel } from '../components/IntelligencePanel';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/ideas', label: 'Ideas' },
  { to: '/ideas/mine', label: 'My Ideas' },
  { to: '/innovation', label: 'Innovation' },
  { to: '/review', label: 'Review' },
  { to: '/workspace', label: 'My Workspace' },
  { to: '/teams', label: 'Teams' },
  { to: '/projects', label: 'Projects' },
  { to: '/insights', label: 'Insights' },
  { to: '/administration', label: 'Administration' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

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

  return (
    <div className="min-h-screen bg-enterprise-gray-warm flex flex-col">
      <header className="bg-enterprise-red shadow-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-enterprise-red" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-white font-bold text-lg tracking-wide">INNOVEX</span>
                  <span className="text-white/70 text-[10px] tracking-wide hidden sm:block">
                    Enterprise Innovation & Engineering Exchange
                  </span>
                </div>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
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

            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search..."
                    className="pl-8 pr-3 py-1.5 bg-white/10 text-white placeholder-white/50 rounded-md text-sm w-40 focus:outline-none focus:bg-white/20 focus:w-56 transition-all"
                  />
                </div>
              </form>
              <button className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors relative">
                <Bell className="w-5 h-5" />
              </button>
              <button className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="h-1 bg-enterprise-gold w-full" />
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6">
        <div className="mb-4">
          <span className="text-xs text-enterprise-charcoal/50">{orgName}</span>
        </div>
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
          <IntelligencePanel />
        </div>
      </main>

      <footer className="bg-white border-t border-enterprise-gray-border py-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 text-center text-xs text-enterprise-charcoal/50">
          INNOVEX - Enterprise Innovation & Engineering Exchange - From Ideas to Impact
        </div>
      </footer>
    </div>
  );
}
