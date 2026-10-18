'use client';

import React, { useState, useEffect } from 'react';
import {
  Image,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Tag,
  Sparkles,
  Store,
  ExternalLink,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MediaUploadInput } from './MediaUploadInput';

export interface HeroBanner {
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

const GRADIENT_PRESETS = [
  { label: 'Smoked Amber', bg: 'from-brand-900 via-stone-900 to-amber-950', accent: 'text-amber-400' },
  { label: 'Heritage Gold', bg: 'from-stone-950 via-amber-950 to-stone-900', accent: 'text-amber-300' },
  { label: 'River Mist', bg: 'from-amber-950 via-stone-900 to-stone-950', accent: 'text-amber-400' },
  { label: 'Kaziranga Emerald', bg: 'from-emerald-950 via-teal-900 to-stone-950', accent: 'text-emerald-400' },
  { label: 'Crimson Spice', bg: 'from-rose-950 via-red-900 to-stone-950', accent: 'text-rose-300' },
  { label: 'Royal Plum', bg: 'from-purple-950 via-stone-900 to-stone-950', accent: 'text-purple-300' },
];

const PHOTO_PRESETS = [
  { label: 'Smoked Khorikaa', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600' },
  { label: 'Heritage Thali', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600' },
  { label: 'Duck Curry & Joha Rice', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600' },
  { label: 'Assamese Fish Feast', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
];

export const HeroBannersManager: React.FC = () => {
  const toast = useToast();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const fetchSettingsAndRestaurants = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, restRes] = await Promise.all([
        apiRequest('/settings'),
        apiRequest('/restaurants'),
      ]);

      if (settingsRes.success && settingsRes.data?.heroBanners) {
        setBanners(settingsRes.data.heroBanners);
      }
      if (restRes.success && Array.isArray(restRes.data)) {
        setRestaurants(restRes.data);
      }
    } catch {
      toast.error('Load Error', 'Failed to fetch current banners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndRestaurants();
  }, []);

  const handleAddBanner = () => {
    const newBanner: HeroBanner = {
      id: `banner-${Date.now()}`,
      title: 'New Artisan Special',
      subtitle: 'Freshly prepared heritage cuisine delivered hot to your doorstep',
      tag: '⚡ 25 Mins Express',
      code: 'AAJORI50',
      discount: '₹50 OFF',
      condition: 'On orders above ₹200',
      bg: 'from-brand-900 via-stone-900 to-amber-950',
      accent: 'text-amber-400',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    };
    const updated = [...banners, newBanner];
    setBanners(updated);
    setPreviewIndex(updated.length - 1);
  };

  const handleUpdate = (index: number, patch: Partial<HeroBanner>) => {
    const copy = [...banners];
    copy[index] = { ...copy[index], ...patch };
    setBanners(copy);
  };

  const handleDelete = (index: number) => {
    if (banners.length <= 1) {
      toast.warning('Minimum Required', 'You must keep at least 1 hero banner active on the storefront');
      return;
    }
    const filtered = banners.filter((_, i) => i !== index);
    setBanners(filtered);
    setPreviewIndex(Math.max(0, index - 1));
  };

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;
    const copy = [...banners];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setBanners(copy);
    setPreviewIndex(targetIdx);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const res = await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ heroBanners: banners }),
      });
      if (res.success) {
        toast.success('Banners Updated', 'Hero promo carousel updated live across customer mobile storefront');
      } else {
        toast.error('Save Failed', res.error?.message || 'Could not save banners');
      }
    } catch {
      toast.error('Network Error', 'Failed to persist banners to server');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-6">
        <div className="h-8 bg-slate-200 rounded-xl w-64"></div>
        <div className="h-44 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  const activePreview = banners[Math.min(previewIndex, banners.length - 1)] || banners[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Image className="w-6 h-6 text-brand-600" />
            Hero Carousel Banners Manager
          </h2>
          <p className="text-xs text-slate-500">
            Edit rotating promotional cards, discount coupons, tags & images displayed on the customer web storefront
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddBanner}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4 text-brand-600" />
            <span>Add Banner</span>
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/25 transition-all"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save to Storefront'}</span>
          </button>
        </div>
      </div>

      {/* Live Storefront Preview Section */}
      {activePreview && (
        <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Live Customer Mobile Storefront Preview
              </span>
            </div>
            <div className="flex items-center gap-1">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewIndex(i)}
                  className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${
                    previewIndex === i ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Actual Card replicating customer_web/src/pages/HomePage.tsx */}
          <div className="max-w-md mx-auto">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-800">
              <div
                className={`p-4 min-h-[170px] flex flex-col justify-between bg-gradient-to-br ${
                  activePreview.bg || 'from-brand-900 via-stone-900 to-amber-950'
                } text-white relative transition-all duration-300`}
              >
                {/* Background image overlay */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-40 overflow-hidden pointer-events-none">
                  <img
                    src={activePreview.image}
                    alt=""
                    className="w-full h-full object-cover filter blur-[0.5px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-stone-950 to-transparent"></div>
                </div>

                <div className="relative z-10 space-y-1 max-w-[75%]">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {activePreview.tag || '⚡ Featured'}
                  </span>
                  <h3 className="text-base font-black font-serif-culinary leading-tight">
                    {activePreview.title || 'Banner Title'}
                  </h3>
                  <p className="text-xs text-stone-200 leading-snug line-clamp-2 font-medium">
                    {activePreview.subtitle || 'Banner subtitle text'}
                  </p>
                  <p className="text-[10px] text-amber-300/90 font-bold">
                    {activePreview.condition || 'Valid on select orders'}
                  </p>
                </div>

                {/* Bottom promo action */}
                <div className="relative z-10 flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm">
                      <Tag className="w-3.5 h-3.5 text-brand-600" />
                      <span>Use {activePreview.code || 'PROMO'}</span>
                    </span>
                    <span className="text-xs font-black text-amber-400">
                      {activePreview.discount || 'Special Offer'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner Cards List */}
      <div className="space-y-4">
        {banners.map((banner, index) => (
          <div
            key={banner.id || index}
            className={`bg-white rounded-2xl border p-5 transition-all shadow-xs space-y-4 ${
              previewIndex === index ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200'
            }`}
          >
            {/* Banner Header & Position Controls */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-black text-xs">
                  #{index + 1}
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{banner.title || 'Untitled Banner'}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {banner.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'UP')}
                  disabled={index === 0}
                  className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'DOWN')}
                  disabled={index === banners.length - 1}
                  className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                  title="Delete Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Headline Title *
                </label>
                <input
                  type="text"
                  value={banner.title}
                  onChange={(e) => handleUpdate(index, { title: e.target.value })}
                  placeholder="e.g. Authentic Assam Khorikaa"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Subtitle Description *
                </label>
                <input
                  type="text"
                  value={banner.subtitle}
                  onChange={(e) => handleUpdate(index, { subtitle: e.target.value })}
                  placeholder="e.g. Smoked pork with bamboo shoot & Joha rice"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Badges & Voucher Code */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Tag Badge Pill
                </label>
                <input
                  type="text"
                  value={banner.tag}
                  onChange={(e) => handleUpdate(index, { tag: e.target.value })}
                  placeholder="⚡ 25 Mins Express"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={banner.code}
                  onChange={(e) => handleUpdate(index, { code: e.target.value.toUpperCase() })}
                  placeholder="AAJORI50"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Discount Display
                </label>
                <input
                  type="text"
                  value={banner.discount}
                  onChange={(e) => handleUpdate(index, { discount: e.target.value })}
                  placeholder="₹50 OFF"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-brand-700 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Eligibility Text
                </label>
                <input
                  type="text"
                  value={banner.condition}
                  onChange={(e) => handleUpdate(index, { condition: e.target.value })}
                  placeholder="On orders above ₹250"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Gradient Theme Preset Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Card Gradient Color Theme</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.bg}
                    type="button"
                    onClick={() => handleUpdate(index, { bg: preset.bg, accent: preset.accent })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                      banner.bg === preset.bg
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${preset.bg}`}></span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Preset & URL / Upload */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Quick Food Photograph Presets
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PHOTO_PRESETS.map((photo) => (
                  <button
                    key={photo.url}
                    type="button"
                    onClick={() => handleUpdate(index, { image: photo.url })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      banner.image === photo.url
                        ? 'border-brand-600 bg-brand-50 text-brand-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <img src={photo.url} alt="" className="w-4 h-4 rounded object-cover" />
                    <span>{photo.label}</span>
                  </button>
                ))}
              </div>

              <MediaUploadInput
                label="Custom Banner Photograph URL or Upload"
                value={banner.image}
                onChange={(url) => handleUpdate(index, { image: url })}
                placeholder="https://images.unsplash.com/..."
                helperText="Upload or paste image URL. Dimensions recommendation: 800x500px."
              />
            </div>

            {/* Restaurant Link (Optional) */}
            {restaurants.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-brand-600" />
                  <span>Linked Restaurant Partner (Optional)</span>
                </label>
                <select
                  value={banner.restaurantId || ''}
                  onChange={(e) => handleUpdate(index, { restaurantId: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
                >
                  <option value="">None (Generic promotion)</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.addressLine || r.city || ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Save Bar */}
      <div className="sticky bottom-4 z-20 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800">
        <div>
          <span className="text-xs font-bold">Unsaved changes?</span>
          <p className="text-[11px] text-slate-400">Click save to push these {banners.length} banners to the live customer app</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-lg shadow-brand-600/30 transition-all hover:scale-102"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Publishing...' : 'Publish to Storefront'}</span>
        </button>
      </div>
    </div>
  );
};
