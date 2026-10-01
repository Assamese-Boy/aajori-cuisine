import React from 'react';
import { RefreshCw, UserCheck, LogOut } from 'lucide-react';
import { apiRequest, setAuthToken } from '../services/api';

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
  onRoleChanged,
  onRefresh,
  onLogout,
  isLoading,
}) => {
  const handleRoleSelect = async (role: string) => {
    const res = await apiRequest('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (res.success && res.data?.token) {
      setAuthToken(res.data.token);
      onRoleChanged(role);
      onRefresh();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-sm font-semibold text-slate-800">
            District: Kamrup Metropolitan (Guwahati, Assam)
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
          PostGIS Connected
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Role Switcher for admin staff simulation */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
          <UserCheck className="w-4 h-4 text-slate-600" />
          <span className="text-slate-600 font-medium">Session Role:</span>
          <select
            value={currentRole}
            onChange={(e) => handleRoleSelect(e.target.value)}
            className="bg-transparent font-semibold text-brand-700 focus:outline-none cursor-pointer"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN (District Control)</option>
            <option value="ADMIN">ADMIN (Ops Manager)</option>
            <option value="RESTAURANT_OWNER">RESTAURANT_OWNER (Khorikaa)</option>
          </select>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-70"
          title="Refresh Operational Metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
          <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* User Profile Info & Sign Out */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            {getInitials(user?.fullName)}
          </div>
          <div className="text-left text-xs leading-tight hidden sm:block">
            <p className="font-semibold text-slate-800">{user?.fullName || 'Super Administrator'}</p>
            <p className="text-slate-500 font-mono text-[10px]">{user?.role || 'SUPER_ADMIN'}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
