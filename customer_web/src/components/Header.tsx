import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  ShoppingBag,
  User,
  Sparkles,
  ExternalLink,
  ChevronDown,
  LogOut,
  Package,
  Home,
  Shield,
  Bell,
  Edit3,
  Navigation,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocationContext } from '../context/LocationContext';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationDrawer } from './NotificationDrawer';

interface HeaderProps {
  onOpenAiAssistant?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAiAssistant,
  searchQuery = '',
  onSearchChange,
}) => {
  const { user, isAuthenticated, logout, openAuthModal, selectedAddress } = useAuth();
  const { totalItems, subtotal, openCart } = useCart();
  const {
    currentLocation,
    nearbyLocalities,
    setLocation,
    updateManualLocation,
    detectGpsLocation,
    isDetecting,
  } = useLocationContext();
  const { settings } = useSettings();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [manualNameInput, setManualNameInput] = useState('');
  const [manualAddressInput, setManualAddressInput] = useState('');

  const formatHeaderLocation = (raw?: string): string => {
    if (!raw) return 'Select Location';
    let clean = raw.replace(/mainland\s*india,?\s*/gi, '').trim();
    if (!clean) clean = raw;
    const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
    let main = parts[0] || clean;
    if (/^india$/i.test(main) && parts.length > 1) main = parts[1];
    return main;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top micro announcement bar */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-amber-900 text-amber-100 text-[11px] py-1 px-4 text-center font-medium flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2 mx-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{settings.topAnnouncement}</span>
          <span className="text-amber-400 font-bold">•</span>
          <span>{settings.promoCodeAnnouncement}</span>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <span className="text-2xl">🍲</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight font-serif-culinary">
                  Aajori
                </span>
                <span className="text-xl font-light text-brand-600 font-serif-culinary">
                  Cuisine
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                Heritage Flavors of Assam
              </p>
            </div>
          </Link>

          {/* Hyperlocal Area Selector */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setIsAreaDropdownOpen(!isAreaDropdownOpen);
                setIsEditingLocation(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-stone-200/60 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-normal leading-none">Deliver To</span>
                <span className="truncate max-w-[130px] block font-bold text-slate-800">
                  {selectedAddress ? selectedAddress.landmark || selectedAddress.addressLine1 : formatHeaderLocation(currentLocation?.name)}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            {isAreaDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 p-3 z-50 animate-fade-in space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    Delivery Address
                  </span>
                  <button
                    onClick={() => setIsAreaDropdownOpen(false)}
                    className="text-stone-400 hover:text-stone-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Edit Mode or Active Card */}
                {isEditingLocation ? (
                  <div className="p-2.5 rounded-xl bg-brand-50/80 border border-brand-200 space-y-2">
                    <p className="text-xs font-extrabold text-brand-950 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-brand-600" />
                      Update Delivery Location
                    </p>
                    <input
                      type="text"
                      value={manualNameInput}
                      onChange={(e) => setManualNameInput(e.target.value)}
                      placeholder="Town / Locality (e.g. Jorhat, Dibrugarh, Tezpur)"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={manualAddressInput}
                      onChange={(e) => setManualAddressInput(e.target.value)}
                      placeholder="Street / Landmark (optional)"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!manualNameInput.trim()) return;
                          updateManualLocation(manualNameInput.trim(), manualAddressInput.trim(), manualNameInput.trim());
                          setIsEditingLocation(false);
                          setIsAreaDropdownOpen(false);
                        }}
                        className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Save & Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingLocation(false)}
                        className="px-2.5 py-1.5 bg-stone-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  currentLocation && (
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Active Address</span>
                        <button
                          type="button"
                          onClick={() => {
                            setManualNameInput(currentLocation.name);
                            setManualAddressInput(currentLocation.addressLine);
                            setIsEditingLocation(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold shadow-2xs cursor-pointer"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Update</span>
                        </button>
                      </div>
                      <div className="text-xs font-black text-slate-900 truncate">📍 {currentLocation.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal truncate">{currentLocation.addressLine}</div>
                    </div>
                  )
                )}

                {/* Detect GPS Option */}
                <button
                  type="button"
                  disabled={isDetecting}
                  onClick={async () => {
                    await detectGpsLocation();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-brand-200 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isDetecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Detecting GPS...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-brand-600" />
                      <span>Use Current Device GPS</span>
                    </>
                  )}
                </button>

                {/* Quick Popular Cities */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Cities</span>
                  <div className="flex flex-wrap gap-1">
                    {['Guwahati', 'Dibrugarh', 'Jorhat', 'Silchar', 'Tezpur', 'Tinsukia', 'Sivasagar'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          updateManualLocation(c, `${c}, Assam`, c);
                          setIsAreaDropdownOpen(false);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-[11px] font-semibold border border-stone-200 cursor-pointer"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {nearbyLocalities && nearbyLocalities.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-stone-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nearby Places</span>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {nearbyLocalities.map((a) => (
                        <button
                          key={a.name}
                          onClick={() => {
                            setLocation(a);
                            setIsAreaDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            currentLocation?.name === a.name
                              ? 'bg-brand-50 text-brand-700 font-bold'
                              : 'text-slate-600 hover:bg-stone-50'
                          }`}
                        >
                          <span className="truncate">{a.name}</span>
                          <span className="text-[9px] text-emerald-600 font-bold shrink-0">OSM</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Search bar */}
        {onSearchChange && (
          <div className="flex-1 max-w-md hidden lg:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search smoked pork, parampara thalis, masor tenga..."
                className="w-full pl-10 pr-4 py-2 bg-stone-100 hover:bg-stone-100/80 focus:bg-white border border-stone-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* AI Assistant button */}
          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-brand-500/10 hover:from-amber-500/20 hover:to-brand-500/20 text-brand-700 border border-brand-200 text-xs font-bold transition-all shadow-xs group"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 group-hover:rotate-12 transition-transform" />
              <span>Ask Aajori AI</span>
            </button>
          )}

          {/* Real-time Order Notification Bell */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 transition-colors relative cursor-pointer"
            title="Live Notifications"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Cart Floating Pill */}
          <button
            onClick={openCart}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center animate-bounce">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {totalItems > 0 ? `₹${subtotal}` : 'Cart'}
            </span>
          </button>

          {/* User Profile / Auth buttons */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">Customer</p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-800">{user.fullName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{user.phone}</p>
                  </div>
                  <Link
                    to="/orders"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Package className="w-4 h-4 text-brand-600" />
                    <span>My Orders</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-brand-600" />
                    <span>Saved Addresses & Profile</span>
                  </Link>
                  <div className="my-1 border-t border-slate-100"></div>
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-stone-100 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Order Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </header>
  );
};
