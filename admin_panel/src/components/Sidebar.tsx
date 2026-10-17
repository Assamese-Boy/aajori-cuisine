'use client';

import { NavLink } from '../utils/router-compat';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Bike,
  MapPin,
  Bot,
  FileText,
  Users,
  Image,
  ChefHat,
  Tag,
  Compass,
  BarChart3,
  Sliders,
} from 'lucide-react';

interface SidebarProps {
  appSettings?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ appSettings }) => {
  const districtName = appSettings?.topBannerDistrict || 'Worldwide Operations';
  const brandName = appSettings?.brandName || 'Aajori Cuisine';

  const navItems = [
    { path: '/dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'Order Control Center', icon: ShoppingBag },
    { path: '/restaurant-portal', label: 'Kitchen Portal (KDS)', icon: ChefHat },
    { path: '/live-map', label: 'Live GIS Operations Map', icon: MapPin },
    { path: '/restaurants', label: 'Restaurant Partners', icon: Store },
    { path: '/delivery-zones', label: 'Zones & Charges', icon: Compass },
    { path: '/promotions', label: 'Coupons & Promos', icon: Tag },
    { path: '/settings', label: 'App Customizer & Branding', icon: Sliders },
    { path: '/reports', label: 'Reports & Reconciliation', icon: BarChart3 },
    { path: '/delivery-partners', label: 'Delivery Fleet', icon: Bike },
    { path: '/users', label: 'Users & Customers', icon: Users },
    { path: '/ai-whatsapp', label: 'AI & WhatsApp Hub', icon: Bot },
    { path: '/media', label: 'Media & Asset Library', icon: Image },
    { path: '/audit-logs', label: 'Enterprise Audit Trail', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-600/30">
          AJ
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">{brandName}</h1>
          <p className="text-xs text-amber-400 font-medium">Operations Center</p>
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Operations Live
        </span>
        <span className="text-slate-300 font-mono font-medium truncate max-w-[120px]">{districtName}</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span>Platform Status</span>
          <span className="text-emerald-400 font-medium">Operational</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Operational Scope</span>
          <span className="text-slate-300 font-mono">Worldwide</span>
        </div>
      </div>
    </aside>
  );
};
