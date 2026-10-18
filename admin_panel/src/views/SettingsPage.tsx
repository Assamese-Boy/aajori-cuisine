'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Tag,
  Phone,
  Mail,
  MapPin,
  Clock,
  Layers,
  Image,
  ExternalLink,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MediaUploadInput } from '../components/MediaUploadInput';
import { HeroBannersManager } from '../components/HeroBannersManager';
import { CulinaryCategoriesManager } from '../components/CulinaryCategoriesManager';
import { TrendingDishesManager } from '../components/TrendingDishesManager';

interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  code: string;
  discount: string;
  condition: string;
  bg?: string;
  accent?: string;
  image: string;
  restaurantId?: string;
}

interface CulinaryCategory {
  name: string;
  icon: string;
  color?: string;
}

interface AppSettings {
  brandName: string;
  tagline: string;
  topBannerDistrict: string;
  topBannerTag: string;
  topAnnouncement: string;
  promoCodeAnnouncement: string;
  supportPhone: string;
  supportEmail: string;
  whatsappOrderingPhone?: string;
  deliveryTimeEstimate: string;
  currencySymbol: string;
  heroBanners: HeroBanner[];
  culinaryCategories: CulinaryCategory[];
}

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'BRANDING' | 'BANNERS' | 'CATEGORIES' | 'TRENDING'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = (params.get('tab') || '').toUpperCase();
      if (tab === 'BANNERS') return 'BANNERS';
      if (tab === 'CATEGORIES') return 'CATEGORIES';
      if (tab === 'TRENDING') return 'TRENDING';
    }
    return 'BRANDING';
  });

  const [settings, setSettings] = useState<AppSettings>({
    brandName: 'Aajori Cuisine',
    tagline: 'Artisan Food & Gourmet Flavors',
    topBannerDistrict: 'Worldwide Kitchens',
    topBannerTag: '⚡ 25 Mins Express',
    topAnnouncement: '⚡ Fresh Artisan Kitchens & Express Delivery Worldwide',
    promoCodeAnnouncement: 'Use code AAJORI50 for ₹50 off',
    supportPhone: '+91 6002308541',
    supportEmail: 'support@aajori.in',
    whatsappOrderingPhone: '916002308541',
    deliveryTimeEstimate: '25-35 mins',
    currencySymbol: '₹',
    heroBanners: [],
    culinaryCategories: [],
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/settings');
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch {
      toast.error('Load Failed', 'Could not fetch platform settings from backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (res.success) {
        toast.success('App Settings Saved', 'Headers, banners, and texts updated across all customer mobile apps');
      } else {
        toast.error('Save Failed', res.error?.message || 'Could not save settings');
      }
    } catch {
      toast.error('Network Error', 'Failed to update backend settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Banner helpers
  const handleAddBanner = () => {
    const newBanner: HeroBanner = {
      id: `banner-${Date.now()}`,
      title: 'New Featured Cuisine Promo',
      subtitle: 'Exclusive authentic flavors curated for you',
      tag: '🔥 Limited Time Offer',
      code: 'AAJORI10',
      discount: '10% OFF',
      condition: 'Valid on orders above ₹200',
      bg: 'from-brand-900 via-stone-900 to-amber-950',
      accent: 'text-amber-400',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    };
    setSettings((prev) => ({
      ...prev,
      heroBanners: [...prev.heroBanners, newBanner],
    }));
  };

  const handleUpdateBanner = (index: number, updated: Partial<HeroBanner>) => {
    setSettings((prev) => {
      const copy = [...prev.heroBanners];
      copy[index] = { ...copy[index], ...updated };
      return { ...prev, heroBanners: copy };
    });
  };

  const handleDeleteBanner = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      heroBanners: prev.heroBanners.filter((_, i) => i !== index),
    }));
  };

  // Category helpers
  const handleAddCategory = () => {
    const newCat: CulinaryCategory = {
      name: 'New Category',
      icon: '🍲',
      color: 'from-amber-500 to-brand-500',
    };
    setSettings((prev) => ({
      ...prev,
      culinaryCategories: [...prev.culinaryCategories, newCat],
    }));
  };

  const handleUpdateCategory = (index: number, updated: Partial<CulinaryCategory>) => {
    setSettings((prev) => {
      const copy = [...prev.culinaryCategories];
      copy[index] = { ...copy[index], ...updated };
      return { ...prev, culinaryCategories: copy };
    });
  };

  const handleDeleteCategory = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      culinaryCategories: prev.culinaryCategories.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-64"></div>
        <div className="h-64 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-brand-600" />
            App Customizer & Branding
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full dynamic control over mobile headers, district announcements, promo banners & categories
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSettings}
            disabled={isLoading || isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-md shadow-brand-600/20 transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Publishing Changes...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('BRANDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'BRANDING'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>Headers & District Bar</span>
        </button>

        <button
          onClick={() => setActiveTab('BANNERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'BANNERS'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Image className="w-4 h-4 text-brand-600" />
          <span>Hero Promo Banners ({settings.heroBanners?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'CATEGORIES'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-brand-600" />
          <span>Culinary Categories ({settings.culinaryCategories?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('TRENDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'TRENDING'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span>Trending Dishes</span>
        </button>
      </div>

      {/* TAB 1: Headers & District Bar */}
      {activeTab === 'BRANDING' && (
        <div className="space-y-6">
          {/* Live Mobile Top Bar Preview Card */}
          <div className="bg-stone-900 rounded-3xl p-5 text-white shadow-xl space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              Live Preview: Customer Mobile Header Bar
            </span>

            {/* Simulated Black District Bar */}
            <div className="bg-gradient-to-r from-stone-950 via-brand-950 to-stone-950 px-4 py-2 rounded-xl flex items-center justify-between text-xs font-bold border border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-stone-100">{settings.topBannerDistrict}</span>
              </div>
              <span className="text-amber-400 text-xs font-black">{settings.topBannerTag}</span>
            </div>

            {/* Announcement Subtext */}
            <div className="text-[11px] text-stone-400 flex items-center justify-between px-1">
              <span>{settings.topAnnouncement}</span>
              <span className="text-amber-400 font-bold">{settings.promoCodeAnnouncement}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-extrabold text-base text-slate-900">Header & Announcement Texts</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">District / Region Name</label>
                <input
                  type="text"
                  value={settings.topBannerDistrict}
                  onChange={(e) => setSettings({ ...settings, topBannerDistrict: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                  placeholder="e.g. Worldwide Kitchens or Metro Central"
                />
                <p className="text-[10px] text-slate-400">
                  Displayed in mobile top bar and live delivery telemetry
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Top Express Badge Tag</label>
                <input
                  type="text"
                  value={settings.topBannerTag}
                  onChange={(e) => setSettings({ ...settings, topBannerTag: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                  placeholder="e.g. ⚡ 25 Mins Express"
                />
                <p className="text-[10px] text-slate-400">
                  Prominent speed & promise badge in top bar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Desktop Top Announcement Bar</label>
                <input
                  type="text"
                  value={settings.topAnnouncement}
                  onChange={(e) => setSettings({ ...settings, topAnnouncement: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                  placeholder="⚡ Fresh Artisan Kitchens & Express Delivery Worldwide"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Promo Code Announcement Banner</label>
                <input
                  type="text"
                  value={settings.promoCodeAnnouncement}
                  onChange={(e) => setSettings({ ...settings, promoCodeAnnouncement: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                  placeholder="Use code AAJORI50 for ₹50 off"
                />
              </div>
            </div>
          </div>

          {/* Brand Info & Support */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-extrabold text-base text-slate-900">Brand Identity & Support Contact</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Platform Name</label>
                <input
                  type="text"
                  value={settings.brandName}
                  onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Estimated Delivery Window</label>
                <input
                  type="text"
                  value={settings.deliveryTimeEstimate}
                  onChange={(e) => setSettings({ ...settings, deliveryTimeEstimate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Official Support Phone</label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  placeholder="+91 60023 08541"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">WhatsApp Ordering Number</label>
                <input
                  type="text"
                  value={settings.whatsappOrderingPhone || ''}
                  onChange={(e) => setSettings({ ...settings, whatsappOrderingPhone: e.target.value })}
                  placeholder="916002308541"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Official Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  placeholder="support@aajori.in"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Hero Promo Banners */}
      {activeTab === 'BANNERS' && <HeroBannersManager />}

      {/* TAB 3: Culinary Categories */}
      {activeTab === 'CATEGORIES' && <CulinaryCategoriesManager />}

      {/* TAB 4: Trending Dishes */}
      {activeTab === 'TRENDING' && <TrendingDishesManager />}
    </div>
  );
};
