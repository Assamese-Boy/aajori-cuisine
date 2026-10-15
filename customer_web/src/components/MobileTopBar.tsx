import React, { useState } from 'react';
import {
  Menu,
  MapPin,
  Search,
  ChevronDown,
  Shield,
  ExternalLink,
  User as UserIcon,
  Sparkles,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileTopBarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenAi?: () => void;
  onOpenDrawer?: () => void;
  isPureVeg?: boolean;
}

const GUWAHATI_AREAS = [
  { name: 'Ulubari / GS Road', lat: 26.1661, lng: 91.7594 },
  { name: 'Silpukhuri Heritage', lat: 26.1852, lng: 91.765 },
  { name: 'Uzan Bazar Riverfront', lat: 26.1915, lng: 91.7512 },
  { name: 'Zoo Road / Ambikagiri', lat: 26.172, lng: 91.778 },
  { name: 'Beltola / Dispur Capital', lat: 26.134, lng: 91.792 },
  { name: 'Pan Bazar Cultural Hub', lat: 26.184, lng: 91.743 },
];

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  searchQuery = '',
  onSearchChange,
  onOpenAi,
  onOpenDrawer,
  isPureVeg = false,
}) => {
  const { user, isAuthenticated, selectedAddress, openAuthModal } = useAuth();
  const [selectedArea, setSelectedArea] = useState(GUWAHATI_AREAS[0].name);
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 safe-top transition-all">
        {/* District micro bar with direct Admin Portal link */}
        <div className="bg-gradient-to-r from-stone-900 via-brand-950 to-amber-950 px-4 py-1 text-white flex items-center justify-between text-[10px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-stone-300">Kamrup Metro • 25m Express</span>
          </div>

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-amber-300 hover:text-white transition-colors uppercase tracking-wider font-bold"
          >
            <Shield className="w-2.5 h-2.5 text-amber-400" />
            <span>Admin Center</span>
            <ExternalLink className="w-2 h-2" />
          </a>
        </div>

        {/* Location & Profile Row with Hamburger Menu */}
        <div className="px-3.5 py-2 flex items-center justify-between gap-2.5">
          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={onOpenDrawer}
            className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-slate-800 flex items-center justify-center shrink-0 border border-stone-200/70 btn-press transition-all relative"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
            {isPureVeg && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </button>

          {/* Location button */}
          <button
            onClick={() => setIsLocationSheetOpen(true)}
            className="flex items-center gap-2 text-left min-w-0 flex-1 btn-press"
          >
            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-brand-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[11px] font-black text-slate-900 leading-tight">
                <span>Deliver to</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
                {isPureVeg && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold flex items-center gap-0.5">
                    <Leaf className="w-2.5 h-2.5" /> Veg Only
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate leading-tight font-medium">
                {selectedAddress
                  ? `${selectedAddress.landmark || selectedAddress.addressLine1}, ${selectedAddress.city}`
                  : selectedArea}
              </p>
            </div>
          </button>

          {/* User profile / Avatar */}
          <div className="shrink-0 flex items-center gap-1.5">
            {onOpenAi && (
              <button
                onClick={onOpenAi}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-amber-500 text-white flex items-center justify-center shadow-xs btn-press"
                title="Ask Aajori AI"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
            {isAuthenticated && user ? (
              <button
                onClick={() => openAuthModal('signin')}
                className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-xs btn-press"
              >
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('signin')}
                className="px-2.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold btn-press shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Native In-App Search Bar */}
        {onSearchChange && (
          <div className="px-4 pb-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search 'Khorikaa smoked pork', 'thali', 'masor tenga'..."
                className="w-full pl-9 pr-3.5 py-2 bg-stone-100 border border-stone-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}
      </header>

      {/* Location Picker Bottom Sheet */}
      {isLocationSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-5 space-y-4 animate-slide-up shadow-2xl safe-bottom">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto"></div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Guwahati Location</h3>
                <p className="text-xs text-slate-500">PostGIS Tier 1 operational delivery centers</p>
              </div>
              <button
                onClick={() => setIsLocationSheetOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {GUWAHATI_AREAS.map((area) => (
                <button
                  key={area.name}
                  onClick={() => {
                    setSelectedArea(area.name);
                    setIsLocationSheetOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center justify-between border transition-all ${
                    selectedArea === area.name
                      ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold'
                      : 'border-stone-200 bg-stone-50 text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-brand-600" />
                    <span>{area.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">Express Active</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
