import React from 'react';
import { RefreshCw, Shield, LogOut, ShoppingBag, ExternalLink } from 'lucide-react';

interface HeaderProps {
  user: any;
  currentRole: string;
  onRoleChanged: (role: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentRole,
  onRefresh,
  onLogout,
  isLoading,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Determine customer storefront URL based on current host
  const getStorefrontUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5174';
    }
    return 'https://aajori-cuisine.vercel.app';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-sm font-bold text-slate-800">
            District: Kamrup Metropolitan (Guwahati, Assam)
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
          GIS Live Telemetry
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Customer Web Storefront Link */}
        <a
          href={getStorefrontUrl()}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors border border-slate-200"
          title="Open Customer Web Storefront"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-brand-600" />
          <span>Customer Storefront</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        {/* Real User Role Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold">
          <Shield className="w-3.5 h-3.5 text-brand-600" />
          <span>{user?.role || currentRole || 'SUPER_ADMIN'}</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-70"
          title="Refresh Operational Metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
          <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* User Profile Info & Sign Out */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-black text-xs shadow-2xs">
            {getInitials(user?.fullName)}
          </div>
          <div className="text-left text-xs leading-tight hidden sm:block">
            <p className="font-bold text-slate-800">{user?.fullName || 'Super Administrator'}</p>
            <p className="text-slate-500 font-mono text-[10px]">{user?.email || 'admin@aajori.in'}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
