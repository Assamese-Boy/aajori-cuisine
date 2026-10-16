import React, { useState } from 'react';
import {
  Menu,
  MapPin,
  Search,
  ChevronDown,
  User as UserIcon,
  Sparkles,
  Leaf,
  Navigation,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileTopBarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenAi?: () => void;
  onOpenDrawer?: () => void;
  onRequestGpsLocation?: () => void;
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
  onRequestGpsLocation,
  isPureVeg = false,
}) => {
  const { user, isAuthenticated, selectedAddress, openAuthModal } = useAuth();
  const [selectedArea, setSelectedArea] = useState(GUWAHATI_AREAS[0].name);
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const displayLocation = selectedAddress
    ? `${selectedAddress.landmark || selectedAddress.addressLine1}, ${selectedAddress.city}`
    : selectedArea;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 safe-top transition-all">
        {/* District banner without any admin links */}
        <div className="bg-gradient-to-r from-stone-900 via-brand-950 to-stone-900 px-4 py-1.5 text-white flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-stone-200 font-bold tracking-tight">Kamrup Metropolitan</span>
          </div>
          <span className="text-amber-400 text-xs font-black tracking-wide">
            ⚡ 25 Mins Express
          </span>
        </div>

        {/* Location & Profile Row with Hamburger Menu */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={onOpenDrawer}
            className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200/80 text-slate-800 flex items-center justify-center shrink-0 border border-stone-200/70 btn-press transition-all relative"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-slate-800" />
            {isPureVeg && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </button>

          {/* Location button with larger readable text */}
          <button
            onClick={() => setIsLocationSheetOpen(true)}
            className="flex items-center gap-2.5 text-left min-w-0 flex-1 btn-press"
          >
            <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin className="w-5 h-5 text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 leading-tight">
                <span>Deliver to</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                {isPureVeg && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                    <Leaf className="w-3 h-3" /> Veg Only
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 truncate leading-tight font-semibold mt-0.5">
                {displayLocation}
              </p>
            </div>
          </button>

          {/* User profile / Avatar */}
          <div className="shrink-0 flex items-center gap-2">
            {onOpenAi && (
              <button
                onClick={onOpenAi}
                className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-500 text-white flex items-center justify-center shadow-xs btn-press"
                title="Ask Aajori AI"
              >
                <Sparkles className="w-4.5 h-4.5 text-amber-200" />
              </button>
            )}
            {isAuthenticated && user ? (
              <button
                onClick={() => openAuthModal('signin')}
                className="w-9 h-9 rounded-2xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs btn-press"
              >
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('signin')}
                className="px-3 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black btn-press shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Native In-App Search Bar with Autocomplete Suggestions */}
        {onSearchChange && (
          <div className="px-4 pb-3 relative">
            <div className="relative">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search dishes, cuisines and restaurants..."
                className="w-full pl-10 pr-9 py-2.5 bg-stone-100 border border-stone-200/80 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-3 text-xs font-bold text-slate-400 hover:text-slate-700 w-5 h-5 flex items-center justify-center rounded-full bg-stone-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Autocomplete Suggestions Dropdown */}
            {isSearchFocused && (
              <div className="absolute left-4 right-4 top-12 z-50 bg-white rounded-2xl shadow-xl border border-stone-200 p-3 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-stone-100 pb-1.5">
                  <span>Popular Assam Searches</span>
                  <button
                    onClick={() => setIsSearchFocused(false)}
                    className="text-stone-400 hover:text-stone-700 text-[11px]"
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Khorikaa smoked pork',
                    'Parampara thali',
                    'Duck curry with til',
                    'Masor tenga',
                    'Fragrant Joha rice',
                    'Luchi & aloo dum',
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => {
                        onSearchChange(phrase);
                        setIsSearchFocused(false);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-brand-50 hover:text-brand-700 text-xs text-slate-700 font-semibold transition-all btn-press"
                    >
                      🔍 {phrase}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Location Picker Bottom Sheet with Smooth Animation */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-350 ease-out ${
          isLocationSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          onClick={() => setIsLocationSheetOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />

        <div
          className={`w-full max-w-md bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl relative z-10 transition-transform duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isLocationSheetOpen ? 'translate-y-0' : 'translate-y-full'
          } safe-bottom`}
        >
          {/* Sheet Handle */}
          <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto"></div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Choose Delivery Location</h3>
              <p className="text-xs text-slate-500">Kamrup Metropolitan delivery radius</p>
            </div>
            <button
              onClick={() => setIsLocationSheetOpen(false)}
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          {/* Quick GPS Location Detect Button */}
          {onRequestGpsLocation && (
            <button
              onClick={() => {
                setIsLocationSheetOpen(false);
                onRequestGpsLocation();
              }}
              className="w-full p-3.5 bg-brand-50 border border-brand-300 rounded-2xl text-brand-700 font-extrabold text-sm flex items-center justify-center gap-2 btn-press"
            >
              <Navigation className="w-4.5 h-4.5 text-brand-600" />
              <span>Use Current GPS Location</span>
            </button>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {GUWAHATI_AREAS.map((area) => (
              <button
                key={area.name}
                onClick={() => {
                  setSelectedArea(area.name);
                  setIsLocationSheetOpen(false);
                }}
                className={`w-full p-3.5 rounded-2xl text-left text-sm font-bold flex items-center justify-between border transition-all ${
                  selectedArea === area.name
                    ? 'bg-brand-50 border-brand-500 text-brand-800'
                    : 'border-stone-200 bg-stone-50 text-slate-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4.5 h-4.5 text-brand-600" />
                  <span>{area.name}</span>
                </div>
                {selectedArea === area.name && (
                  <Check className="w-4.5 h-4.5 text-brand-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
