import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Lock, Mail, User, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('Demo@123');
  const [name, setName] = useState('');
  const [role, setRole] = useState('ANALYST');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('Demo@123');
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative gradient glow blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[2px] mb-4 shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? 'Register Institutional Account' : 'CredXAI Governance Portal'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Role-Based Access Control (RBAC) &bull; Audit-Compliant Authentication
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        {!isRegister && (
          <div className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            <p className="text-[11px] font-mono font-semibold uppercase text-slate-400 tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span>Quick-Fill Examiner Demo Accounts:</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@demo.com', 'ADMIN')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                  email === 'admin@demo.com' 
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="block font-bold">Admin</span>
                <span className="text-[10px] text-slate-400">Full Policy Access</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager@demo.com', 'RISK_MANAGER')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                  email === 'manager@demo.com' 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="block font-bold">Manager</span>
                <span className="text-[10px] text-slate-400">Audit & Portfolio</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('analyst@demo.com', 'ANALYST')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                  email === 'analyst@demo.com' 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="block font-bold">Analyst</span>
                <span className="text-[10px] text-slate-400">Underwriting Run</span>
              </button>
            </div>
          </div>
        )}

        {/* Card Form */}
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Dr. Alex Mercer"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Assigned Governance Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ANALYST">Credit Analyst (Run Assessments)</option>
                  <option value="RISK_MANAGER">Risk Manager (Audit & Batch)</option>
                  <option value="ADMIN">Chief Risk Officer / Admin (Policy & Models)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating Security Token...' : isRegister ? 'Create Account' : 'Authenticate Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in here' : 'Need to register a new examiner account?'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
