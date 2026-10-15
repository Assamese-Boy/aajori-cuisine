import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  User as UserIcon,
  Home,
  ShoppingBag,
  MapPin,
  Tag,
  Sparkles,
  MessageSquare,
  Shield,
  Phone,
  Globe,
  LogOut,
  ChevronRight,
  ExternalLink,
  Leaf,
  Check,
  Percent,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface HamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAi: () => void;
  isPureVeg: boolean;
  onTogglePureVeg: () => void;
}

export const HamburgerDrawer: React.FC<HamburgerDrawerProps> = ({
  isOpen,
  onClose,
  onOpenAi,
  isPureVeg,
  onTogglePureVeg,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const toast = useToast();

  const [activeLanguage, setActiveLanguage] = useState<'EN' | 'AS' | 'HI'>('EN');
  const [showCoupons, setShowCoupons] = useState(false);

  if (!isOpen) return null;

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast.success('Coupon Copied!', `Code ${code} copied to clipboard.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 1. Backdrop Overlay with Smooth Fade */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out animate-fade-in"
      />

      {/* 2. Side Drawer Sliding from Left */}
      <div className="relative w-4/5 max-w-[340px] bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-left overflow-hidden">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-brand-950 p-5 text-white safe-top relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-200 transition-colors btn-press"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>

          {/* User Profile Card */}
          {isAuthenticated && user ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white text-lg font-black shadow-md border-2 border-white/20">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate leading-snug">
                    {user.fullName}
                  </h3>
                  <p className="text-[11px] text-stone-300 truncate font-medium">
                    {user.phone || user.email}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                    <span>★</span> Kamrup Metro Patron
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <UserIcon className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Welcome to Aajori!</h3>
                  <p className="text-[11px] text-stone-300">Sign in to track orders & save addresses</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  openAuthModal('signin');
                }}
                className="w-full py-2 bg-gradient-to-r from-brand-500 to-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 transition-all btn-press"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>

        {/* Veg-Only Dietary Mode Switch */}
        <div className="px-4 py-3 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md border-2 border-emerald-600 flex items-center justify-center p-1 bg-white">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 leading-none">Pure Veg Mode</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Filter 100% vegetarian dishes</p>
            </div>
          </div>
          <button
            onClick={() => {
              onTogglePureVeg();
              toast.info(
                !isPureVeg ? 'Pure Veg Mode ON' : 'Pure Veg Mode OFF',
                !isPureVeg ? 'Showing only vegetarian delicacies' : 'Showing all ethnic items'
              );
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              isPureVeg ? 'bg-emerald-600' : 'bg-stone-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                isPureVeg ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 divide-y divide-stone-100 text-xs text-slate-700">
          {/* Main App Navigation */}
          <div className="py-2 px-3 space-y-1">
            <button
              onClick={() => handleNav('/')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-semibold"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center">
                  <Home className="w-4 h-4" />
                </div>
                <span>Explore Kitchens</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              onClick={() => handleNav('/orders')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-semibold"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span>Orders & Receipts</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              onClick={() => handleNav('/profile')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-semibold"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>Saved Delivery Addresses</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              onClick={() => setShowCoupons(!showCoupons)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-semibold"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <span>District Offers & Coupons</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                2 Active
              </span>
            </button>

            {/* Coupons Accordion */}
            {showCoupons && (
              <div className="pl-10 pr-2 py-1 space-y-2 animate-fade-in">
                <div
                  onClick={() => handleCopyCoupon('AAJORI50')}
                  className="p-2 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-between cursor-pointer hover:bg-brand-100 transition-colors"
                >
                  <div>
                    <span className="text-[11px] font-black text-brand-700 tracking-wider">
                      AAJORI50
                    </span>
                    <p className="text-[10px] text-stone-600">Flat ₹50 OFF above ₹200</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand-600">TAP TO COPY</span>
                </div>
                <div
                  onClick={() => handleCopyCoupon('FIRSTMEAL')}
                  className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <div>
                    <span className="text-[11px] font-black text-amber-800 tracking-wider">
                      FIRSTMEAL
                    </span>
                    <p className="text-[10px] text-stone-600">20% OFF on your first order</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700">TAP TO COPY</span>
                </div>
              </div>
            )}
          </div>

          {/* AI & Commerce Hub */}
          <div className="py-2 px-3 space-y-1">
            <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Smart Ordering
            </p>

            <button
              onClick={() => {
                onClose();
                onOpenAi();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-brand-50 to-amber-50 border border-brand-200/60 hover:border-brand-300 transition-colors btn-press text-slate-800 font-bold"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-900 leading-tight">Aajori AI Concierge</span>
                  <p className="text-[10px] text-stone-500 font-normal">
                    Assamese meal recommendations
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-brand-600" />
            </button>

            <a
              href="https://wa.me/919864000000?text=menu"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-semibold"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span>WhatsApp Ordering</span>
                  <p className="text-[10px] text-stone-400 font-normal">Order via Meta API bot</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </a>

            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-semibold"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-purple-900 font-bold">Admin Control Center</span>
                  <p className="text-[10px] text-stone-400 font-normal">Port 5173 live inspector</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-purple-500" />
            </a>
          </div>

          {/* Preferences & District Support */}
          <div className="py-2 px-3 space-y-1">
            <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Preferences & Support
            </p>

            {/* Language Switcher */}
            <div className="px-2.5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-600">
                <Globe className="w-4 h-4" />
                <span className="font-medium text-xs">Language:</span>
              </div>
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                {(['EN', 'AS', 'HI'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLanguage(lang)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                      activeLanguage === lang
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {lang === 'EN' ? 'English' : lang === 'AS' ? 'অসমীয়া' : 'हिंदी'}
                  </button>
                ))}
              </div>
            </div>

            <a
              href="tel:+919864012345"
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 transition-colors text-slate-800 font-semibold"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span>24x7 Customer Support</span>
                  <p className="text-[10px] text-stone-400 font-normal">+91 98640 12345</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </a>
          </div>

          {/* Logout if logged in */}
          {isAuthenticated && (
            <div className="py-2 px-3">
              <button
                onClick={() => {
                  logout();
                  toast.info('Signed Out', 'You have been logged out.');
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors font-bold btn-press"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 text-center safe-bottom">
          <p className="text-[11px] font-bold text-slate-700">Aajori Cuisine Mobile Web</p>
          <p className="text-[10px] text-slate-500">Kamrup Metropolitan District, Assam • v2.4.0</p>
        </div>
      </div>
    </div>
  );
};
