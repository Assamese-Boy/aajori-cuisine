import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiRequest, setAuthToken } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('admin@aajori.in');
  const [password, setPassword] = useState('Aajori@Admin2026');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await apiRequest('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        if (res.data.user) {
          localStorage.setItem('aajori_admin_user', JSON.stringify(res.data.user));
        }
        onLoginSuccess(res.data.user);
      } else {
        setError(res.error?.message || 'Invalid credentials or unauthorized role.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 mx-auto flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-brand-600/40">
            AJ
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Aajori Cuisine</h1>
          <p className="text-xs text-amber-400 font-medium uppercase tracking-wider">
            Operational Control Center • Kamrup Metro, Assam
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Staff Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your authorized administrative or merchant credentials
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Email or Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@aajori.in or +919864000001"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Security Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-500 hover:to-amber-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Control Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Authorized Access (Click to autofill):
            </span>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin@aajori.in', 'Aajori@Admin2026')}
                className="text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="text-slate-200 font-semibold block">Super Administrator</span>
                  <span className="text-slate-400 text-[11px] font-mono">admin@aajori.in</span>
                </div>
                <span className="text-[10px] bg-brand-950 text-brand-400 border border-brand-800 px-2 py-0.5 rounded font-mono">
                  SUPER_ADMIN
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('ops@aajori.in', 'Aajori@Admin2026')}
                className="text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="text-slate-200 font-semibold block">District Operations</span>
                  <span className="text-slate-400 text-[11px] font-mono">ops@aajori.in</span>
                </div>
                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-mono">
                  ADMIN
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('khorikaa.owner@gmail.com', 'Aajori@Admin2026')}
                className="text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="text-slate-200 font-semibold block">Khorikaa Kitchen Partner</span>
                  <span className="text-slate-400 text-[11px] font-mono">khorikaa.owner@gmail.com</span>
                </div>
                <span className="text-[10px] bg-purple-950 text-purple-400 border border-purple-800 px-2 py-0.5 rounded font-mono">
                  MERCHANT
                </span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Protected by Row-Level Security & Role-Based Access Control • Aajori Cuisine v1.0
        </p>
      </div>
    </div>
  );
};
