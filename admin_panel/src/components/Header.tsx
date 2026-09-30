import React from 'react';
import { ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';
import { apiRequest, setAuthToken } from '../services/api';

interface HeaderProps {
  currentRole: string;
  onRoleChanged: (role: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChanged,
  onRefresh,
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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-sm font-semibold text-slate-800">
            District: Kamrup Metropolitan (Guwahati, Assam)
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
          PostGIS Ready
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Role Switcher for instant simulation */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
          <UserCheck className="w-4 h-4 text-slate-600" />
          <span className="text-slate-600 font-medium">Session Role:</span>
          <select
            value={currentRole}
            onChange={(e) => handleRoleSelect(e.target.value)}
            className="bg-transparent font-semibold text-brand-700 focus:outline-none cursor-pointer"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN (Full District Control)</option>
            <option value="ADMIN">ADMIN (Ops Manager)</option>
            <option value="RESTAURANT_OWNER">RESTAURANT_OWNER (Khorikaa Kitchen)</option>
            <option value="DELIVERY_PARTNER">DELIVERY_PARTNER (Bipul Bora)</option>
            <option value="CUSTOMER">CUSTOMER (Ankur Barman)</option>
          </select>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
          title="Refresh Operational Metrics"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
            MS
          </div>
          <div className="text-left text-xs leading-tight">
            <p className="font-semibold text-slate-800">Manabendra Sarma</p>
            <p className="text-slate-500">Super Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};
