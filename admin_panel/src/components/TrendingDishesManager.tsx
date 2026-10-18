'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  Store,
  Eye,
  CheckCircle2,
  XCircle,
  Flame,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MediaUploadInput } from './MediaUploadInput';

export interface TrendingDish {
  id: string;
  name: string;
  tagline: string;
  price?: number;
  imageUrl?: string;
  restaurantId: string;
  restaurantName?: string;
  isVeg?: boolean;
  orderCountText?: string;
  isActive?: boolean;
}

const PHOTO_PRESETS = [
  { label: 'Smoked Pork Khorikaa', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600' },
  { label: 'Fish Thali & Joha Rice', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600' },
  { label: 'Duck Curry with Sesame', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600' },
  { label: 'Masor Tenga Fish Curry', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600' },
  { label: 'Traditional Pitha & Laru', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600' },
];

export const TrendingDishesManager: React.FC = () => {
  const toast = useToast();
  const [dishes, setDishes] = useState<TrendingDish[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, restRes] = await Promise.all([
        apiRequest('/settings'),
        apiRequest('/restaurants'),
      ]);

      if (settingsRes.success && Array.isArray(settingsRes.data?.trendingDishes)) {
        setDishes(settingsRes.data.trendingDishes);
      }
      if (restRes.success && Array.isArray(restRes.data)) {
        setRestaurants(restRes.data);
      }
    } catch {
      toast.error('Load Error', 'Failed to retrieve trending dishes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddDish = () => {
    const defaultRest = restaurants[0];
    const firstMenuItem = defaultRest?.menu?.[0];
    const newDish: TrendingDish = {
      id: `trend-${Date.now()}`,
      name: firstMenuItem?.name || 'Featured Artisan Dish',
      tagline: firstMenuItem?.description || 'Popular choice ordered this week in your area',
      price: firstMenuItem?.price || 250,
      imageUrl: firstMenuItem?.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
      restaurantId: defaultRest?.id || '',
      restaurantName: defaultRest?.name || 'Heritage Kitchen',
      isVeg: firstMenuItem?.isVeg ?? false,
      orderCountText: '🔥 Popular Choice',
      isActive: true,
    };
    setDishes((prev) => [...prev, newDish]);
  };

  const handlePickFromMenu = (index: number, menuItemId: string) => {
    const dish = dishes[index];
    const currentRest = restaurants.find((r) => r.id === dish.restaurantId);
    if (!currentRest || !Array.isArray(currentRest.menu)) return;
    const foundItem = currentRest.menu.find((m: any) => m.id === menuItemId);
    if (!foundItem) return;

    handleUpdate(index, {
      name: foundItem.name,
      price: foundItem.price,
      isVeg: Boolean(foundItem.isVeg),
      imageUrl: foundItem.imageUrl || dish.imageUrl,
      tagline: foundItem.description || dish.tagline || `Authentic specialty from ${currentRest.name}`,
    });
    toast.success('Live Menu Synced', `Imported "${foundItem.name}" from ${currentRest.name}`);
  };

  const handleAutoDetectFromOrders = async () => {
    try {
      const ordersRes = await apiRequest('/orders');
      if (!ordersRes.success || !Array.isArray(ordersRes.data) || ordersRes.data.length === 0) {
        toast.info('No Real Orders Yet', 'Place customer orders first to calculate live sales volumes.');
        return;
      }

      // Aggregate item counts across all real customer orders
      const counts: Record<string, { name: string; count: number; price: number; restaurantId: string; restaurantName: string }> = {};
      for (const order of ordersRes.data) {
        for (const item of order.items || []) {
          const key = item.name;
          if (!counts[key]) {
            counts[key] = {
              name: item.name,
              count: 0,
              price: item.price || 0,
              restaurantId: order.restaurantId,
              restaurantName: order.restaurantName,
            };
          }
          counts[key].count += item.quantity || 1;
        }
      }

      const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
      if (sorted.length === 0) {
        toast.info('No Order Data', 'No ordered menu items found in current orders.');
        return;
      }

      const generated: TrendingDish[] = sorted.slice(0, 6).map((item, idx) => {
        const existing = dishes.find((d) => d.name.toLowerCase() === item.name.toLowerCase());
        const matchedRest = restaurants.find((r) => r.id === item.restaurantId);
        const menuItem = matchedRest?.menu?.find((m: any) => m.name.toLowerCase() === item.name.toLowerCase());

        return {
          id: existing?.id || `trend-auto-${Date.now()}-${idx}`,
          name: item.name,
          tagline: `Ordered ${item.count} times live by customers`,
          price: item.price || menuItem?.price || 250,
          imageUrl: menuItem?.imageUrl || existing?.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
          restaurantId: item.restaurantId || restaurants[0]?.id || '',
          restaurantName: item.restaurantName || restaurants[0]?.name || '',
          isVeg: menuItem?.isVeg ?? existing?.isVeg ?? false,
          orderCountText: `🔥 ${item.count}+ orders placed`,
          isActive: true,
        };
      });

      setDishes(generated);
      toast.success('Live Order Sync Complete', `Ranked ${generated.length} dishes from real customer orders.`);
    } catch {
      toast.error('Sync Error', 'Could not compute order analytics.');
    }
  };

  const handleUpdate = (index: number, patch: Partial<TrendingDish>) => {
    setDishes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      // If restaurant changed, also sync restaurant name
      if (patch.restaurantId) {
        const found = restaurants.find((r) => r.id === patch.restaurantId);
        if (found) copy[index].restaurantName = found.name;
      }
      return copy;
    });
  };

  const handleDelete = (index: number) => {
    if (dishes.length <= 1) {
      toast.warning('Minimum Required', 'At least 1 trending dish is recommended for storefront discovery');
      return;
    }
    setDishes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= dishes.length) return;
    setDishes((prev) => {
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
        body: JSON.stringify({ trendingDishes: dishes }),
      });
      if (res.success) {
        toast.success('Trending Dishes Saved', 'Updated live on customer web homepage');
      } else {
        toast.error('Save Failed', res.error?.message || 'Could not update trending dishes');
      }
    } catch {
      toast.error('Network Error', 'Failed to persist trending dishes to server');
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

  const activeDishes = dishes.filter((d) => d.isActive !== false);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            Trending Dishes Management
          </h2>
          <p className="text-xs text-slate-500">
            Control the curated "Trending Dishes Right Now" showcase on the customer storefront discovery feed
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAutoDetectFromOrders}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors"
            title="Compute top selling items from customer orders"
          >
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span>Auto-Rank from Orders</span>
          </button>
          <button
            onClick={handleAddDish}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4 text-purple-600" />
            <span>Add Trending Dish</span>
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/25 transition-all"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Publish to Storefront'}</span>
          </button>
        </div>
      </div>

      {/* Live Customer Storefront Preview */}
      <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              Live Preview: Customer Home Discovery Section
            </span>
          </div>
          <span className="text-[11px] text-slate-400">{activeDishes.length} active on storefront</span>
        </div>

        {/* Replicated customer web cards */}
        <div className="max-w-md mx-auto space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-100">
              Trending Dishes Right Now
            </span>
          </div>

          {activeDishes.length === 0 ? (
            <div className="p-4 bg-slate-800/80 rounded-2xl text-center text-xs text-slate-400">
              No active trending dishes. Enable at least one dish below.
            </div>
          ) : (
            activeDishes.map((dish) => (
              <div
                key={dish.id}
                className="p-3 bg-white text-slate-900 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {dish.imageUrl && (
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-13 h-13 rounded-xl object-cover shrink-0 border border-stone-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${dish.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        title={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      />
                      <h4 className="text-xs font-black text-slate-900 truncate">{dish.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {dish.tagline || dish.orderCountText || 'Popular choice in your area'}
                    </p>
                    {dish.price && (
                      <span className="text-xs font-black text-brand-700">₹{dish.price}</span>
                    )}
                  </div>
                </div>

                <span className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-xl text-xs font-extrabold shrink-0 border border-brand-200">
                  Order
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dishes Management List */}
      <div className="space-y-4">
        {dishes.map((dish, index) => {
          const isDishActive = dish.isActive !== false;
          return (
            <div
              key={dish.id || index}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-xs space-y-4 ${isDishActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                }`}
            >
              {/* Header & Controls */}
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xs">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{dish.name || 'Untitled Dish'}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Restaurant: {dish.restaurantName || 'Assigned'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Active Toggle */}
                  <button
                    type="button"
                    onClick={() => handleUpdate(index, { isActive: !isDishActive })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isDishActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                  >
                    {isDishActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{isDishActive ? 'Active' : 'Hidden'}</span>
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
                    disabled={index === dishes.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                    title="Delete Dish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Tagline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    value={dish.name}
                    onChange={(e) => handleUpdate(index, { name: e.target.value })}
                    placeholder="e.g. Smoked Pork with Khorisa"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Social Proof Highlight Subtitle *
                  </label>
                  <input
                    type="text"
                    value={dish.tagline}
                    onChange={(e) => handleUpdate(index, { tagline: e.target.value })}
                    placeholder="e.g. Over 140+ plates ordered this week in your area"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Price, Veg Toggle & Badge Text */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={dish.price || ''}
                    onChange={(e) => handleUpdate(index, { price: Number(e.target.value) || 0 })}
                    placeholder="280"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Dietary Classification
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleUpdate(index, { isVeg: true })}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${dish.isVeg === true
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdate(index, { isVeg: false })}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${dish.isVeg === false
                          ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Trending Badge Label
                  </label>
                  <input
                    type="text"
                    value={dish.orderCountText || ''}
                    onChange={(e) => handleUpdate(index, { orderCountText: e.target.value })}
                    placeholder="🔥 140+ orders this week"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-purple-700 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Linked Restaurant */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-purple-600" />
                  <span>Associated Restaurant Partner * (For direct order routing)</span>
                </label>
                <select
                  value={dish.restaurantId}
                  onChange={(e) => handleUpdate(index, { restaurantId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.addressLine || r.city || ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real Menu Item Quick-Select from Database */}
              {(() => {
                const currentRest = restaurants.find((r) => r.id === dish.restaurantId);
                const menuItems = currentRest?.menu || [];
                if (menuItems.length === 0) return null;
                return (
                  <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Sync from {currentRest.name}'s Kitchen Menu ({menuItems.length} items)</span>
                      </label>
                      <span className="text-[10px] text-purple-700 font-medium">Auto-fills dish name, price & image</span>
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handlePickFromMenu(index, e.target.value);
                      }}
                      defaultValue=""
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="" disabled>-- Select a live dish from this restaurant's menu --</option>
                      {menuItems.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.isVeg ? '🥬 [Veg]' : '🍖 [Non-Veg]'} {m.name} — ₹{m.price}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {/* Photo Presets & Custom Upload */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Quick Food Photograph Presets
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PHOTO_PRESETS.map((photo) => (
                    <button
                      key={photo.url}
                      type="button"
                      onClick={() => handleUpdate(index, { imageUrl: photo.url })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${dish.imageUrl === photo.url
                          ? 'border-purple-600 bg-purple-50 text-purple-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <img src={photo.url} alt="" className="w-4 h-4 rounded object-cover" />
                      <span>{photo.label}</span>
                    </button>
                  ))}
                </div>

                <MediaUploadInput
                  label="Custom Dish Photograph URL or Upload"
                  value={dish.imageUrl || ''}
                  onChange={(url) => handleUpdate(index, { imageUrl: url })}
                  placeholder="https://images.unsplash.com/..."
                  helperText="Square or 4:3 high-resolution food photo"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Save Bar */}
      <div className="sticky bottom-4 z-20 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800">
        <div>
          <span className="text-xs font-bold">Unsaved changes?</span>
          <p className="text-[11px] text-slate-400">Save to immediately push {dishes.length} trending dishes to the customer app</p>
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
