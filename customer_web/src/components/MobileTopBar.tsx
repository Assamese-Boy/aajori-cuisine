import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Bell,
  User as UserIcon,
  Package,
  LogOut,
  Edit3,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationContext, UserLocation } from '../context/LocationContext';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationDrawer } from './NotificationDrawer';

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
  const { user, isAuthenticated, logout, openAuthModal, addresses } = useAuth();
  const {
    currentLocation,
    recentLocations,
    nearbyLocalities,
    isDetecting,
    detectGpsLocation,
    setLocation,
    updateManualLocation,
    searchLocalities,
  } = useLocationContext();
  const { settings } = useSettings();
  const { unreadCount } = useNotifications();

  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserLocation[]>([]);
  const [isSearchingAddresses, setIsSearchingAddresses] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [manualNameInput, setManualNameInput] = useState('');
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [justDetectedGps, setJustDetectedGps] = useState<boolean>(false);

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
    setJustDetectedGps(false);
    setIsEditingLocation(false);
    setAddressSearchQuery('');
    setSearchResults([]);
  };

  const handleDetectGps = async () => {
    const loc = await detectGpsLocation();
    if (loc) {
      setJustDetectedGps(true);
      setIsEditingLocation(false);
    }
  };

  const formatHeaderLocation = (raw?: string): string => {
    if (!raw) return 'Set Location';
    let clean = raw.replace(/mainland\s*india,?\s*/gi, '').trim();
    if (!clean) clean = raw;
    const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
    let main = parts[0] || clean;
    if (/^india$/i.test(main) && parts.length > 1) {
      main = parts[1];
    }
    if (main.length > 16) {
      return main.slice(0, 14).trim() + '…';
    }
    return main;
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
        <div className="px-3.5 py-2 flex items-center justify-between gap-2">
          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={onOpenDrawer}
            className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-slate-800 flex items-center justify-center shrink-0 border border-stone-200/70 btn-press transition-all relative"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4.5 h-4.5 text-slate-800" />
            {isPureVeg && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </button>

          {/* Location button with live GPS / address display */}
          <button
            onClick={() => setIsLocationSheetOpen(true)}
            className="flex items-center gap-2 text-left min-w-0 flex-1 btn-press group"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all ${
                currentLocation?.isGps
                  ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-300'
                  : 'bg-brand-50 text-brand-600'
              }`}
            >
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[11px] font-black text-slate-900 leading-none whitespace-nowrap">
                <span className="whitespace-nowrap">Deliver to</span>
                <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-brand-600 transition-colors shrink-0" />
                {currentLocation?.isGps && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8.5px] font-bold shrink-0 tracking-tight leading-none">
                    ● Live
                  </span>
                )}
                {isPureVeg && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8.5px] font-bold shrink-0 flex items-center gap-0.5 leading-none">
                    <Leaf className="w-2.5 h-2.5" /> Veg
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-900 truncate leading-snug font-extrabold mt-0.5">
                {currentLocation
                  ? formatHeaderLocation(currentLocation.name)
                  : isDetecting
                  ? 'Detecting GPS...'
                  : 'Tap to Detect'}
              </p>
            </div>
          </button>

          {/* User profile / Avatar & Notifications */}
          <div className="shrink-0 flex items-center gap-1.5">
            {/* Real-time Order Notification Bell */}
            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-slate-700 flex items-center justify-center shadow-xs btn-press relative cursor-pointer"
              title="Notifications & Live Alerts"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {onOpenAi && (
              <button
                onClick={onOpenAi}
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-500 text-white flex items-center justify-center shadow-xs btn-press cursor-pointer"
                title="Ask Aajori AI"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
              </button>
            )}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs btn-press cursor-pointer border border-slate-700/60"
                  aria-label="User Account Menu"
                >
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </button>

                {/* Logged in User Menu Modal / Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div
                      onClick={() => setIsUserMenuOpen(false)}
                      className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 p-2.5 z-50 animate-fade-in space-y-1">
                      <div className="px-3 py-2 border-b border-stone-100 mb-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {user.fullName || 'Valued Customer'}
                          </p>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                          {user.phone || user.email}
                        </p>
                      </div>

                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-stone-50 transition-colors"
                      >
                        <Package className="w-4 h-4 text-brand-600" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-stone-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-brand-600" />
                        <span>Profile & Saved Addresses</span>
                      </Link>

                      <div className="my-1 border-t border-stone-100"></div>

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="px-2.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black btn-press shadow-xs whitespace-nowrap cursor-pointer"
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
              onClick={() => {
                setIsLocationSheetOpen(false);
                setJustDetectedGps(false);
                setIsEditingLocation(false);
              }}
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-500 hover:text-slate-700 btn-press cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Top Priority: Active / Detected / Editing Location Card */}
          <div className="shrink-0">
            {justDetectedGps ? (
              /* State 1: GPS Just Detected - Confirmation & Instant Update Option */
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2.5 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Location Fetched via GPS
                  </span>
                  <span className="text-[9px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Live Coordinate
                  </span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                  <p className="font-extrabold text-xs text-slate-900">{currentLocation?.name}</p>
                  <p className="text-[11px] text-slate-600">{currentLocation?.addressLine}</p>
                  <p className="text-[10px] text-amber-800 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/60 font-medium mt-1">
                    ℹ️ <strong>Note:</strong> On Wi-Fi or desktop, browser GPS often resolves to your ISP gateway in Guwahati. If this differs from your actual town, tap &quot;Update Location&quot; below to set your exact area.
                  </p>
                </div>
                <div className="flex gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setJustDetectedGps(false);
                      setIsLocationSheetOpen(false);
                    }}
                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer"
                  >
                    Confirm & Deliver Here
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJustDetectedGps(false);
                      setManualNameInput(currentLocation?.name || '');
                      setManualAddressInput(currentLocation?.addressLine || '');
                      setIsEditingLocation(true);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Update Location</span>
                  </button>
                </div>
              </div>
            ) : isEditingLocation ? (
              /* State 2: Manual Update Location Form */
              <div className="p-3.5 rounded-2xl bg-brand-50/80 border border-brand-200 space-y-2.5 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-brand-950 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-brand-600" />
                    Update Delivery Location
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingLocation(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Locality / Area / City Name *
                  </label>
                  <input
                    type="text"
                    value={manualNameInput}
                    onChange={(e) => setManualNameInput(e.target.value)}
                    placeholder="e.g. Dibrugarh, Jorhat, Tezpur, Aathgaon..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Specific Street / Landmark / House No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualAddressInput}
                    onChange={(e) => setManualAddressInput(e.target.value)}
                    placeholder="e.g. Near Market Square, Main Road, Apartment 3"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualNameInput.trim()) return;
                      updateManualLocation(manualNameInput.trim(), manualAddressInput.trim(), manualNameInput.trim());
                      setIsEditingLocation(false);
                      setIsLocationSheetOpen(false);
                    }}
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer"
                  >
                    Save & Update Location
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingLocation(false)}
                    className="px-3.5 py-2 bg-stone-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : currentLocation ? (
              /* State 3: Active Delivery Address Card with Prominent Update Option */
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-stone-50 to-emerald-50/40 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span>Active Delivery Address</span>
                    {currentLocation.isGps && (
                      <span className="text-emerald-700 bg-emerald-100 text-[8.5px] font-bold px-1.5 py-0.2 rounded-full">
                        GPS
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setManualNameInput(currentLocation.name);
                      setManualAddressInput(currentLocation.addressLine);
                      setIsEditingLocation(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Update Location</span>
                  </button>
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
                  Use GPS detection below or type your location manually.
                </p>
              </div>
            )}
          </div>

          {/* Real Device GPS Location Detect Button */}
          <button
            onClick={handleDetectGps}
            disabled={isDetecting}
            className="w-full p-3.5 bg-brand-50 hover:bg-brand-100 border border-brand-300 rounded-2xl text-brand-700 font-extrabold text-sm flex items-center justify-center gap-2 btn-press transition-colors shadow-2xs shrink-0 disabled:opacity-60 cursor-pointer"
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
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Popular City / District Chips */}
          <div className="shrink-0 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Select City / Town
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Guwahati',
                'Dibrugarh',
                'Jorhat',
                'Silchar',
                'Tezpur',
                'Tinsukia',
                'Nagaon',
                'Sivasagar',
              ].map((town) => (
                <button
                  key={town}
                  type="button"
                  onClick={() => {
                    updateManualLocation(town, `${town}, Assam`, town);
                    setIsLocationSheetOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all btn-press cursor-pointer ${
                    currentLocation?.name.toLowerCase().includes(town.toLowerCase())
                      ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                      : 'bg-stone-50 hover:bg-brand-50 text-slate-700 border-stone-200 hover:border-brand-300'
                  }`}
                >
                  {town}
                </button>
              ))}
            </div>
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
                  No locations found matching &quot;{addressSearchQuery}&quot;
                </div>
              ) : (
                searchResults.map((loc, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full p-3 rounded-2xl text-left text-xs font-bold border border-stone-200 bg-stone-50 hover:bg-brand-50 hover:border-brand-300 text-slate-700 transition-all flex items-start gap-2.5 btn-press cursor-pointer"
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
            /* Scrollable List of Saved & Recent Addresses */
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* User Saved Addresses (from Profile) */}
              {isAuthenticated && addresses && addresses.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    My Saved Delivery Addresses
                  </span>
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => {
                        updateManualLocation(
                          addr.landmark || addr.addressLine1,
                          `${addr.addressLine1}, ${addr.city || ''}`,
                          addr.city
                        );
                        setIsLocationSheetOpen(false);
                      }}
                      className="w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between border border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700 transition-all btn-press cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                            <span>{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold bg-brand-100 text-brand-800 px-1.5 py-0.2 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {addr.addressLine1}, {addr.city}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
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
                      className="w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between border border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700 transition-all btn-press cursor-pointer"
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
                      className="w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between border border-stone-200 bg-stone-50 hover:bg-brand-50 hover:border-brand-200 text-slate-700 transition-all btn-press cursor-pointer"
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
            </div>
          )}
        </div>
      </div>

      {/* Real-time Order Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
      />
    </>
  );
};
