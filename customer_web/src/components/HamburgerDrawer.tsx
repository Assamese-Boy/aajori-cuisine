import React, { useState, useEffect } from 'react';
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
  Phone,
  Globe,
  LogOut,
  ChevronRight,
  ExternalLink,
  Leaf,
  Bell,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { apiRequest } from '../services/api';

interface HamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAi: () => void;
  isPureVeg: boolean;
  onTogglePureVeg: () => void;
  onRequestLocation?: () => void;
}

export const HamburgerDrawer: React.FC<HamburgerDrawerProps> = ({
  isOpen,
  onClose,
  onOpenAi,
  isPureVeg,
  onTogglePureVeg,
  onRequestLocation,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();

  const [activeLanguage, setActiveLanguage] = useState<'EN' | 'AS' | 'HI'>('EN');
  const [showCoupons, setShowCoupons] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    apiRequest<any[]>('/coupons')
      .then((res) => {
        if (res.success && res.data) {
          setActiveCoupons(res.data.filter((c: any) => c.isActive !== false));
        }
      })
      .catch((err) => console.error('Failed to load coupons in drawer', err));
  }, [isOpen]);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast.success('Coupon Copied!', `Code ${code} copied to clipboard.`);
  };

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        toast.success('Notifications Enabled', 'You will receive real-time order updates.');
      } else {
        toast.info('Notification Permission', 'Permission was not granted.');
      }
    } else {
      toast.info('Notifications', 'Push notifications are not supported in this browser.');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex transition-opacity duration-350 ease-out ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* 1. Backdrop Overlay with Smooth Fade */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out"
      />

      {/* 2. Side Drawer Sliding from Left with Buttery Smooth Ease */}
      <div
        className={`relative w-4/5 max-w-[340px] bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden transition-transform duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Card with Larger Typography */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-brand-950 p-5 text-white safe-top relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-200 transition-colors btn-press"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Profile Card */}
          {isAuthenticated && user ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white text-xl font-black shadow-md border-2 border-white/20">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-white truncate leading-snug">
                    {user.fullName}
                  </h3>
                  <p className="text-xs text-stone-300 truncate font-medium">
                    {user.phone || user.email}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
                    <span>★</span> Aajori Gourmet Club
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <UserIcon className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Welcome to Aajori</h3>
                  <p className="text-xs text-stone-300 mt-0.5">Sign in to track orders & save addresses</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  openAuthModal('signin');
                }}
                className="w-full py-3 bg-gradient-to-r from-brand-500 to-amber-500 text-white rounded-2xl text-xs font-extrabold shadow-md hover:brightness-105 transition-all btn-press"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>

        {/* Veg-Only Dietary Mode Switch */}
        <div className="px-4 py-3.5 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg border-2 border-emerald-600 flex items-center justify-center p-1 bg-white shadow-2xs">
              <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-none">Pure Veg Mode</p>
              <p className="text-xs text-slate-500 mt-0.5">Show only 100% vegetarian dishes</p>
            </div>
          </div>
          <button
            onClick={() => {
              onTogglePureVeg();
              toast.info(
                !isPureVeg ? 'Pure Veg Mode ON' : 'Pure Veg Mode OFF',
                !isPureVeg ? 'Showing only vegetarian delicacies' : 'Showing all items'
              );
            }}
            className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center p-0.5 ${
              isPureVeg ? 'bg-emerald-600' : 'bg-stone-300'
            }`}
          >
            <div
              className={`w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                isPureVeg ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Scrollable Navigation List with Larger Typography */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 divide-y divide-stone-100 text-sm text-slate-700">
          {/* Main App Navigation */}
          <div className="py-2 px-3 space-y-1">
            <button
              onClick={() => handleNav('/')}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-bold"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-brand-600 flex items-center justify-center">
                  <Home className="w-4.5 h-4.5" />
                </div>
                <span>Explore Kitchens</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              onClick={() => handleNav('/orders')}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-bold"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-4.5 h-4.5" />
                </div>
                <span>Orders & Receipts</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              onClick={() => handleNav('/profile')}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-bold"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <span>Saved Delivery Addresses</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              onClick={() => setShowCoupons(!showCoupons)}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-bold"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Tag className="w-4.5 h-4.5" />
                </div>
                <span>District Offers & Coupons</span>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">
                {activeCoupons.length} Active
              </span>
            </button>

            {/* Coupons Accordion */}
            {showCoupons && (
              <div className="pl-11 pr-2 py-1 space-y-2 animate-fade-in">
                {activeCoupons.length === 0 ? (
                  <p className="text-xs text-stone-500 py-1 italic">
                    No active discount vouchers right now. Check back soon!
                  </p>
                ) : (
                  activeCoupons.map((coupon) => {
                    const isPercent =
                      coupon.discountType === 'PERCENTAGE' || coupon.discountType === 'percent';
                    const discountText = isPercent
                      ? `${coupon.discountValue}% OFF`
                      : `Flat ₹${coupon.discountValue} OFF`;
                    const conditionText =
                      coupon.minOrderAmount > 0
                        ? `Above ₹${coupon.minOrderAmount}`
                        : 'No min order';

                    return (
                      <div
                        key={coupon.id || coupon.code}
                        onClick={() => handleCopyCoupon(coupon.code)}
                        className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-between cursor-pointer hover:bg-brand-100 transition-colors"
                      >
                        <div>
                          <span className="text-xs font-black text-brand-700 tracking-wider">
                            {coupon.code}
                          </span>
                          <p className="text-xs text-stone-600">
                            {discountText} • {conditionText}
                          </p>
                        </div>
                        <span className="text-xs font-black text-brand-600">COPY</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Device Location & Notifications */}
          <div className="py-2 px-3 space-y-1">
            <p className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-stone-400">
              Device Settings
            </p>

            <button
              onClick={() => {
                onClose();
                onRequestLocation?.();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-bold"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Navigation className="w-4.5 h-4.5" />
                </div>
                <span>Update GPS Location</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              onClick={handleEnableNotifications}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-bold"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <span>Order Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>

          {/* AI & WhatsApp Assistant */}
          <div className="py-2 px-3 space-y-1">
            <p className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-stone-400">
              Smart Ordering
            </p>

            <button
              onClick={() => {
                onClose();
                onOpenAi();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-brand-50 to-amber-50 border border-brand-200/80 hover:border-brand-300 transition-colors btn-press text-slate-800 font-bold"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-slate-900 leading-tight block text-sm font-bold">
                    Aajori AI Concierge
                  </span>
                  <p className="text-xs text-stone-500 font-normal">
                    Assamese meal recommendations
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-brand-600" />
            </button>

            <a
              href={`https://wa.me/${(settings.whatsappOrderingPhone || '916002308541').replace(/[^0-9]/g, '')}?text=menu`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-100 transition-colors btn-press text-slate-800 font-bold"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="block text-sm">WhatsApp Ordering</span>
                  <p className="text-xs text-stone-400 font-normal">+91 60023 08541</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-stone-400" />
            </a>
          </div>

          {/* Preferences & District Support */}
          <div className="py-2 px-3 space-y-1">
            <p className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-stone-400">
              Preferences & Support
            </p>

            {/* Language Switcher */}
            <div className="px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-600">
                <Globe className="w-4 h-4" />
                <span className="font-semibold text-xs">Language:</span>
              </div>
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                {(['EN', 'AS', 'HI'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLanguage(lang)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
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
              href={`tel:${settings.supportPhone || '+916002308541'}`}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-100 transition-colors text-slate-800 font-bold"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="block text-sm">24x7 Delivery Support</span>
                  <p className="text-xs text-stone-400 font-normal">{settings.supportPhone || '+91 60023 08541'}</p>
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
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-rose-600 hover:bg-rose-50 transition-colors font-bold btn-press text-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <LogOut className="w-4.5 h-4.5" />
                </div>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Footer */}
        <div className="p-3.5 bg-stone-100 border-t border-stone-200 text-center safe-bottom">
          <p className="text-xs font-bold text-slate-700">{settings.brandName} Mobile App</p>
          <p className="text-xs text-slate-500">{settings.topBannerDistrict}</p>
        </div>
      </div>
    </div>
  );
};
