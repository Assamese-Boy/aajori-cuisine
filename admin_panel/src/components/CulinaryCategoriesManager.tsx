'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  Sparkles,
  Eye,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';

export interface CulinaryCategory {
  name: string;
  icon: string;
  color?: string;
}

const COMMON_EMOJIS = [
  '🍲', '🍖', '🍛', '🐟', '🦆', '🥓', '🍚', '🥬', '🥟', '🍵',
  '☕', '🍰', '🍢', '🍜', '🥘', '🍱', '🥗', '🍕', '🍔', '🌮',
];

const COLOR_GRADIENTS = [
  { label: 'Amber Flame', value: 'from-amber-500 to-brand-500' },
  { label: 'Orange Red', value: 'from-orange-500 to-red-600' },
  { label: 'Golden Thali', value: 'from-yellow-500 to-amber-600' },
  { label: 'Teal Fresh', value: 'from-teal-500 to-cyan-600' },
  { label: 'Charcoal Duck', value: 'from-stone-600 to-stone-900' },
  { label: 'Crimson Meat', value: 'from-rose-600 to-amber-700' },
  { label: 'Paddy Rice', value: 'from-amber-400 to-yellow-600' },
  { label: 'Emerald Pure Veg', value: 'from-emerald-500 to-green-600' },
  { label: 'Warm Spice', value: 'from-orange-400 to-amber-500' },
  { label: 'Assam Tea Herb', value: 'from-teal-600 to-emerald-700' },
];

export const CulinaryCategoriesManager: React.FC = () => {
  const toast = useToast();
  const [categories, setCategories] = useState<CulinaryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategoryName, setActiveCategoryName] = useState('All');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/settings');
      if (res.success && res.data?.culinaryCategories) {
        setCategories(res.data.culinaryCategories);
      }
    } catch {
      toast.error('Load Error', 'Failed to retrieve categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    const newCat: CulinaryCategory = {
      name: 'New Cuisine',
      icon: '🍲',
      color: 'from-amber-500 to-brand-500',
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleUpdate = (index: number, patch: Partial<CulinaryCategory>) => {
    setCategories((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const handleDelete = (index: number) => {
    if (categories.length <= 1) {
      toast.warning('Minimum Required', 'At least 1 category is required');
      return;
    }
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    setCategories((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const res = await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ culinaryCategories: categories }),
      });
      if (res.success) {
        toast.success('Categories Saved', 'Category bar updated across customer mobile storefront');
      } else {
        toast.error('Save Failed', res.error?.message || 'Could not update categories');
      }
    } catch {
      toast.error('Network Error', 'Failed to save categories to server');
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-600" />
            Culinary Categories & Filter Bar
          </h2>
          <p className="text-xs text-slate-500">
            Configure circular category discovery chips rendered on the customer web mobile home screen
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4 text-brand-600" />
            <span>Add Category</span>
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

      {/* Live Customer Web Bar Preview */}
      <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              Live Category Story Bar Preview (Customer Storefront)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Horizontal scrollable on mobile</span>
        </div>

        <div className="bg-stone-950/80 p-4 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 py-1">
            {categories.map((cat) => {
              const isSelected = activeCategoryName === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategoryName(cat.name)}
                  className="flex flex-col items-center shrink-0 space-y-1.5 group transition-all"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                      isSelected
                        ? 'bg-gradient-to-tr from-brand-600 to-amber-500 text-white ring-2 ring-brand-500 ring-offset-2 ring-offset-stone-950 scale-105 shadow-md shadow-brand-500/30'
                        : 'bg-stone-900 border border-stone-800 text-stone-200 hover:border-brand-500/50'
                    }`}
                  >
                    <span>{cat.icon || '🍲'}</span>
                  </div>
                  <span
                    className={`text-[11px] tracking-tight font-black transition-colors whitespace-nowrap ${
                      isSelected ? 'text-amber-400 font-extrabold' : 'text-stone-300 font-medium'
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Categories Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Category #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(index, 'UP')}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100"
                  title="Move Left/Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'DOWN')}
                  disabled={index === categories.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100"
                  title="Move Right/Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 ml-1"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Icon & Name Row */}
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Emoji</label>
                <input
                  type="text"
                  value={cat.icon}
                  onChange={(e) => handleUpdate(index, { icon: e.target.value })}
                  className="w-12 h-10 text-xl text-center bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                  title="Emoji"
                />
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Category Name</label>
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => handleUpdate(index, { name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                  placeholder="e.g. Khorikaa, Masor Tenga"
                />
              </div>
            </div>

            {/* Quick Emoji Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Emoji Picker</span>
              <div className="flex flex-wrap gap-1">
                {COMMON_EMOJIS.slice(0, 10).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleUpdate(index, { icon: emoji })}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                      cat.icon === emoji ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Gradient Selection */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Color Glow</span>
              <select
                value={cat.color || COLOR_GRADIENTS[0].value}
                onChange={(e) => handleUpdate(index, { color: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
              >
                {COLOR_GRADIENTS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Save Bar */}
      <div className="sticky bottom-4 z-20 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800">
        <div>
          <span className="text-xs font-bold">Category arrangement</span>
          <p className="text-[11px] text-slate-400">{categories.length} categories active on storefront filter bar</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-lg shadow-brand-600/30 transition-all hover:scale-102"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Publishing...' : 'Publish Categories'}</span>
        </button>
      </div>
    </div>
  );
};
