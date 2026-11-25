import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FilePlus2, 
  Layers, 
  ShieldAlert, 
  Sliders, 
  LineChart, 
  LogOut, 
  Bot, 
  FileText,
  UserCheck
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Risk Assessment', path: '/assess', icon: FilePlus2 },
    { label: 'Portfolio Batch', path: '/batch', icon: Layers },
    { label: 'Model Governance & XAI', path: '/model-performance', icon: LineChart },
  ];

  if (user && (user.role === 'ADMIN' || user.role === 'RISK_MANAGER')) {
    navItems.push({ label: 'Audit Trail & Compliance', path: '/audit', icon: ShieldAlert });
  }

  if (user && user.role === 'ADMIN') {
    navItems.push({ label: 'Policy Parameter Covenants', path: '/policy-settings', icon: Sliders });
  }

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#0F172A]/80 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[2px] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                CredXAI
              </span>
              <span className="block text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                Agentic Underwriting
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Operational Workspace
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/20 text-indigo-300 border border-indigo-500/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Badge & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-semibold text-indigo-300 shrink-0">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Authorized Officer'}</p>
                <div className="flex items-center space-x-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    user?.role === 'ADMIN' ? 'bg-rose-400' : user?.role === 'RISK_MANAGER' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{user?.role || 'ANALYST'}</p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#0A0D14]">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
