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
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MediaUploadInput } from '../components/MediaUploadInput';

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
  deliveryTimeEstimate: string;
  currencySymbol: string;
  heroBanners: HeroBanner[];
  culinaryCategories: CulinaryCategory[];
}

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'BRANDING' | 'BANNERS' | 'CATEGORIES'>('BRANDING');

  const [settings, setSettings] = useState<AppSettings>({
    brandName: 'Aajori Cuisine',
    tagline: 'Heritage Flavors of Assam',
    topBannerDistrict: 'Kamrup Metropolitan',
    topBannerTag: '⚡ 25 Mins Express',
    topAnnouncement: '⚡ Hyperlocal Kitchens Live across Kamrup Metropolitan, Guwahati',
    promoCodeAnnouncement: 'Use code AAJORI50 for ₹50 off',
    supportPhone: '+91 98640 00001',
    supportEmail: 'support@aajori.in',
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
                  placeholder="e.g. Kamrup Metropolitan"
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
                  placeholder="⚡ Hyperlocal Kitchens Live across Kamrup Metropolitan, Guwahati"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Official Support Phone / WhatsApp</label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Official Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Hero Promo Banners */}
      {activeTab === 'BANNERS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Customer Home Carousel Banners</h3>
              <p className="text-xs text-slate-500">
                These slides auto-rotate at the top of the mobile home page
              </p>
            </div>
            <button
              onClick={handleAddBanner}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Promo Banner</span>
            </button>
          </div>

          <div className="space-y-4">
            {settings.heroBanners?.map((banner, index) => (
              <div
                key={banner.id || index}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-black text-xs">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-sm text-slate-800">{banner.title || 'Untitled Banner'}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteBanner(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Banner Title</label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) => handleUpdateBanner(index, { title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Subtitle</label>
                    <input
                      type="text"
                      value={banner.subtitle}
                      onChange={(e) => handleUpdateBanner(index, { subtitle: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Tag Badge</label>
                    <input
                      type="text"
                      value={banner.tag}
                      onChange={(e) => handleUpdateBanner(index, { tag: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Coupon Code</label>
                    <input
                      type="text"
                      value={banner.code}
                      onChange={(e) => handleUpdateBanner(index, { code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Discount Pill</label>
                    <input
                      type="text"
                      value={banner.discount}
                      onChange={(e) => handleUpdateBanner(index, { discount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Condition Text</label>
                    <input
                      type="text"
                      value={banner.condition}
                      onChange={(e) => handleUpdateBanner(index, { condition: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <MediaUploadInput
                  label="Banner Background Photograph"
                  value={banner.image}
                  onChange={(url) => handleUpdateBanner(index, { image: url })}
                  placeholder="https://images.unsplash.com/..."
                  helperText="High-resolution food photo displayed on the right of the mobile card"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Culinary Categories */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Curated Culinary Categories</h3>
              <p className="text-xs text-slate-500">
                Tappable category chips rendered on the customer mobile discovery feed
              </p>
            </div>
            <button
              onClick={handleAddCategory}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {settings.culinaryCategories?.map((cat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="text"
                    value={cat.icon}
                    onChange={(e) => handleUpdateCategory(index, { icon: e.target.value })}
                    className="w-10 h-10 text-xl text-center bg-slate-100 rounded-xl border border-slate-200 shrink-0"
                    title="Emoji Icon"
                  />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => handleUpdateCategory(index, { name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      placeholder="Category Name"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCategory(index)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
