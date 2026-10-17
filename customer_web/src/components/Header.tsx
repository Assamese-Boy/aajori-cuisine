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
  const { currentLocation, nearbyLocalities, setLocation } = useLocationContext();
  const { settings } = useSettings();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

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
              onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-stone-200/60"
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
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in">
                <div className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
                  Live Detected & Nearby Areas
                </div>
                {currentLocation && (
                  <div className="p-2 mb-1 bg-stone-50 rounded-lg text-xs font-bold text-slate-800">
                    📍 {currentLocation.name}
                    <div className="text-[10px] text-slate-400 font-normal truncate">{currentLocation.addressLine}</div>
                  </div>
                )}
                {nearbyLocalities.map((a) => (
                  <button
                    key={a.name}
                    onClick={() => {
                      setLocation(a);
                      setIsAreaDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      currentLocation?.name === a.name
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{a.name}</span>
                    <span className="text-[10px] text-emerald-600 font-bold shrink-0">OSM</span>
                  </button>
                ))}
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
