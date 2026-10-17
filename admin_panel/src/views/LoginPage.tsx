'use client';

import React, { useState } from 'react';
import { useNavigate } from '../utils/router-compat';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiRequest, setAuthToken } from '../services/api';

interface LoginPageProps {
  onLoginSuccess?: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          email: identifier.trim(),
          password,
        }),
      });

      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        if (res.data.user) {
          localStorage.setItem('aajori_admin_user', JSON.stringify(res.data.user));
        }
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user);
        }
        navigate('/dashboard');
      } else {
        setError(res.error?.message || 'Invalid credentials or unauthorized role.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 mx-auto flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-brand-600/40">
            AJ
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Aajori Cuisine</h1>
          <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
            Operational Control Center • Worldwide Enterprise Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-lg font-black text-white">Staff Sign In</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Enter your authorized enterprise staff credentials to access operations
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Email or Authorized Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@aajori.in or +919864..."
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all font-medium"
                />
                <Mail className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all font-medium"
                />
                <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 text-xs font-bold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-500 hover:to-amber-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Control Center</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Enterprise Security Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>TLS 1.3 Encrypted</span>
            </span>
            <span className="font-mono text-[11px]">RBAC Protected</span>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Protected by Row-Level Security & Role-Based Access Control • Aajori Cuisine v1.0
        </p>
      </div>
    </div>
  );
};
