import React, { useState } from 'react';
import {
  Menu,
  MapPin,
  Search,
  ChevronDown,
  Sparkles,
  Leaf,
  Navigation,
  Check,
  Loader2,
  X,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationContext, UserLocation } from '../context/LocationContext';
import { useSettings } from '../context/SettingsContext';

interface MobileTopBarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenAi?: () => void;
  onOpenDrawer?: () => void;
  onRequestGpsLocation?: () => void;
  isPureVeg?: boolean;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  searchQuery = '',
  onSearchChange,
  onOpenAi,
  onOpenDrawer,
  isPureVeg = false,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const {
    currentLocation,
    recentLocations,
    nearbyLocalities,
    isDetecting,
    detectGpsLocation,
    setLocation,
    searchLocalities,
  } = useLocationContext();
  const { settings } = useSettings();

  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserLocation[]>([]);
  const [isSearchingAddresses, setIsSearchingAddresses] = useState(false);

  const handleSearchAddresses = async (q: string) => {
    setAddressSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearchingAddresses(true);
    try {
      const results = await searchLocalities(q);
      setSearchResults(results);
    } finally {
      setIsSearchingAddresses(false);
    }
  };

  const handleSelectLocation = (loc: UserLocation) => {
    setLocation(loc);
    setIsLocationSheetOpen(false);
    setAddressSearchQuery('');
    setSearchResults([]);
  };

  const handleDetectGps = async () => {
    const loc = await detectGpsLocation();
    if (loc) {
      setIsLocationSheetOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 safe-top transition-all">
        {/* District banner without any admin links */}
        <div className="bg-gradient-to-r from-stone-900 via-brand-950 to-stone-900 px-4 py-1.5 text-white flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-stone-200 font-bold tracking-tight">{settings.topBannerDistrict}</span>
          </div>
          <span className="text-amber-400 text-xs font-black tracking-wide">
            {settings.topBannerTag}
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

          {/* Location button with live GPS / address display */}
          <button
            onClick={() => setIsLocationSheetOpen(true)}
            className="flex items-center gap-2.5 text-left min-w-0 flex-1 btn-press group"
          >
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-all ${
                currentLocation?.isGps
                  ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-300'
                  : 'bg-brand-50 text-brand-600'
              }`}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 leading-tight">
                <span>Deliver to</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-600 transition-colors" />
                {currentLocation?.isGps && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black flex items-center gap-0.5">
                    ● Live GPS
                  </span>
                )}
                {isPureVeg && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                    <Leaf className="w-3 h-3" /> Veg Only
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-800 truncate leading-tight font-extrabold mt-0.5">
                {currentLocation
                  ? currentLocation.name
                  : isDetecting
                  ? 'Detecting Real GPS...'
                  : 'Tap to Detect Location'}
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

      {/* Location Picker Bottom Sheet with Real GPS & Address Search */}
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
          } safe-bottom max-h-[85vh] flex flex-col`}
        >
          {/* Sheet Handle */}
          <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto shrink-0"></div>

          <div className="flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-lg font-black text-slate-900">Choose Delivery Location</h3>
              <p className="text-xs text-slate-500">{settings.topBannerDistrict} Delivery Zone</p>
            </div>
            <button
              onClick={() => setIsLocationSheetOpen(false)}
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-500 hover:text-slate-700 btn-press"
            >
              ✕
            </button>
          </div>

          {/* Real Device GPS Location Detect Button */}
          <button
            onClick={handleDetectGps}
            disabled={isDetecting}
            className="w-full p-3.5 bg-brand-50 hover:bg-brand-100 border border-brand-300 rounded-2xl text-brand-700 font-extrabold text-sm flex items-center justify-center gap-2 btn-press transition-colors shadow-2xs shrink-0 disabled:opacity-60"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-4.5 h-4.5 text-brand-600 animate-spin" />
                <span>Locating Your Exact Street GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4.5 h-4.5 text-brand-600" />
                <span>Use Current GPS Location</span>
              </>
            )}
          </button>

          {/* Search Location Input */}
          <div className="relative shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={addressSearchQuery}
              onChange={(e) => handleSearchAddresses(e.target.value)}
              placeholder="Search locality, road, or landmark..."
              className="w-full pl-9.5 pr-8 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {addressSearchQuery && (
              <button
                onClick={() => handleSearchAddresses('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results if user is searching */}
          {addressSearchQuery.trim() ? (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Matching Locations
              </span>
              {isSearchingAddresses ? (
                <div className="p-4 text-center text-xs text-slate-400">Searching locations...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No locations found matching "{addressSearchQuery}"
                </div>
              ) : (
                searchResults.map((loc, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full p-3 rounded-2xl text-left text-xs font-bold border border-stone-200 bg-stone-50 hover:bg-brand-50 hover:border-brand-300 text-slate-700 transition-all flex items-start gap-2.5 btn-press"
                  >
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 truncate">{loc.name}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                        {loc.addressLine}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* Dynamic Localities & Addresses View */
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Active Current Location Card */}
              {currentLocation ? (
                <div className="p-3 rounded-2xl bg-gradient-to-br from-stone-50 to-emerald-50/40 border border-stone-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Active Delivery Address
                    </span>
                    {currentLocation.isGps && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Verified Live GPS
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-slate-900 truncate">
                        {currentLocation.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {currentLocation.addressLine}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-1">
                  <p className="font-bold text-xs text-slate-700">No Location Selected Yet</p>
                  <p className="text-[11px] text-slate-400">
                    Tap &quot;Use Current GPS Location&quot; above to auto-detect your real street address.
                  </p>
                </div>
              )}

              {/* Recent Saved Locations */}
              {recentLocations && recentLocations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recent Addresses
                  </span>
                  {recentLocations.slice(0, 4).map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between border border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700 transition-all btn-press"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{loc.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{loc.addressLine}</div>
                        </div>
                      </div>
                      {currentLocation?.name === loc.name && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Real Nearby Localities fetched dynamically from OpenStreetMap/Photon */}
              {nearbyLocalities && nearbyLocalities.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
                    <span>Nearby Places (Live Geocoded)</span>
                    <span className="text-[9px] font-bold text-emerald-600">OpenStreetMap</span>
                  </span>
                  {nearbyLocalities.map((place, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocation(place)}
                      className="w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between border border-stone-200 bg-stone-50 hover:bg-brand-50 hover:border-brand-200 text-slate-700 transition-all btn-press"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{place.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{place.addressLine}</div>
                        </div>
                      </div>
                      {currentLocation?.name === place.name && (
                        <Check className="w-4 h-4 text-brand-600 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Search Suggestions (Tapping launches live OSM search) */}
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Popular Search Areas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Christian Basti',
                    'GS Road',
                    'Paltan Bazaar',
                    'Zoo Road',
                    'Six Mile',
                    'Dispur',
                    'Pan Bazaar',
                    'Uzan Bazar',
                    'Beltola',
                    'Jalukbari',
                  ].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleSearchAddresses(loc)}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 border border-stone-200 text-[11px] font-bold text-slate-700 transition-all btn-press"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
