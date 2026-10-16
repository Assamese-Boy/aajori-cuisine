'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Sparkles,
  Clock,
  Star,
  Plus,
  Minus,
  Check,
  Share2,
  ChevronLeft,
  ShoppingBag,
  Info,
} from 'lucide-react';

export interface MobileDishPreviewProps {
  item: {
    name?: string;
    description?: string;
    price?: number;
    isVeg?: boolean;
    categoryName?: string;
    imageUrl?: string;
    prepTimeMinutes?: number;
    restaurantName?: string;
  };
  restaurantName?: string;
}

export const MobileDishPreview: React.FC<MobileDishPreviewProps> = ({
  item,
  restaurantName = 'Aajori Kitchens',
}) => {
  const [viewMode, setViewMode] = useState<'CARD' | 'DETAIL' | 'CART'>('CARD');
  const [quantity, setQuantity] = useState(0);

  const displayName = item.name?.trim() || 'Assamese Dish Name';
  const displayDesc =
    item.description?.trim() ||
    'Authentic heritage Assamese specialty cooked with indigenous herbs, bamboo shoot & spices.';
  const displayPrice = item.price && item.price > 0 ? item.price : 180;
  const originalPrice = Math.round(displayPrice * 1.2);
  const displayImage =
    item.imageUrl?.trim() ||
    (item.isVeg
      ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'
      : 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600');
  const isVeg = Boolean(item.isVeg);

  return (
    <div className="flex flex-col items-center">
      {/* View Mode Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setViewMode('CARD')}
          className={`px-3 py-1 rounded-lg transition-all ${
            viewMode === 'CARD'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Menu List View
        </button>
        <button
          type="button"
          onClick={() => setViewMode('DETAIL')}
          className={`px-3 py-1 rounded-lg transition-all ${
            viewMode === 'DETAIL'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Customer Detail Sheet
        </button>
        <button
          type="button"
          onClick={() => setViewMode('CART')}
          className={`px-3 py-1 rounded-lg transition-all ${
            viewMode === 'CART'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Cart View
        </button>
      </div>

      {/* Realistic Mobile Device Mockup Frame */}
      <div className="w-[320px] h-[580px] bg-stone-900 rounded-[44px] p-3 shadow-2xl border-4 border-stone-800 relative flex flex-col overflow-hidden select-none">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-between px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-stone-800"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500/80"></div>
        </div>

        {/* Screen Bezel inner */}
        <div className="w-full h-full bg-stone-50 rounded-[34px] flex flex-col overflow-hidden text-slate-900 relative">
          {/* Status Bar */}
          <div className="pt-2 px-6 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-800 bg-white/95 shrink-0 z-20">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">5G</span>
              <div className="w-4 h-2 rounded-xs border border-slate-800 flex items-center p-0.5">
                <div className="w-full h-full bg-slate-800 rounded-2xs"></div>
              </div>
            </div>
          </div>

          {/* Customer Top Bar Preview */}
          <div className="px-4 py-2 bg-white border-b border-stone-200/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-slate-600">
                <ChevronLeft className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-xs text-slate-900 truncate max-w-[170px]">
                  {restaurantName}
                </div>
                <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                  <span>⚡ 25 Mins Express</span>
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-bold">
              <ShoppingBag className="w-3.5 h-3.5 text-brand-600" />
            </div>
          </div>

          {/* Screen Content depending on viewMode */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {viewMode === 'CARD' && (
              <>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                  {item.categoryName || 'Signature Menu'}
                </div>

                {/* EXACT CUSTOMER DISH CARD */}
                <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs space-y-2 relative">
                  <div className="flex gap-3">
                    {/* Left Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Dietary Icon */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                            isVeg
                              ? 'border-emerald-600 text-emerald-600'
                              : 'border-rose-600 text-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-black text-[9px]">
                          ⭐ Bestseller
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                        {displayName}
                      </h4>

                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-xs text-slate-900">₹{displayPrice}</span>
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{originalPrice}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                        {displayDesc}
                      </p>
                    </div>

                    {/* Right Image + ADD Button Overlay */}
                    <div className="relative shrink-0 w-20 h-20">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                        <img
                          src={displayImage}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
                          }}
                        />
                      </div>

                      {/* ADD Button */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
                        {quantity === 0 ? (
                          <button
                            type="button"
                            onClick={() => setQuantity(1)}
                            className="px-3.5 py-1 bg-white text-brand-600 font-black text-[10px] rounded-lg shadow-md border border-brand-200 hover:bg-brand-50 transition-all uppercase tracking-wide"
                          >
                            ADD +
                          </button>
                        ) : (
                          <div className="flex items-center bg-brand-600 text-white rounded-lg shadow-md px-1 py-0.5 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                              className="px-1.5 py-0.5 hover:opacity-80"
                            >
                              -
                            </button>
                            <span className="px-1 font-black">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity((q) => q + 1)}
                              className="px-1.5 py-0.5 hover:opacity-80"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Micro helper notice */}
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[10px] text-amber-900 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    This is the real layout customers see when browsing <strong>{restaurantName}</strong> on Android and iPhone devices.
                  </span>
                </div>
              </>
            )}

            {viewMode === 'DETAIL' && (
              <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs">
                {/* Hero Dish Image */}
                <div className="h-32 w-full relative bg-stone-100 overflow-hidden">
                  <img
                    src={displayImage}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-lg text-white text-[9px] font-bold">
                    ⏱️ {item.prepTimeMinutes || 20} mins prep
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                        isVeg
                          ? 'border-emerald-600 text-emerald-600'
                          : 'border-rose-600 text-rose-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      In Stock & Available
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-slate-900 leading-tight">
                    {displayName}
                  </h3>

                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-base text-slate-900">₹{displayPrice}</span>
                    <span className="text-xs text-slate-400 line-through">₹{originalPrice}</span>
                  </div>

                  <p className="text-[10px] text-slate-600 leading-relaxed">{displayDesc}</p>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      className="w-full py-2 bg-brand-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>Add Item • ₹{displayPrice}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'CART' && (
              <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-xs space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Customer Order Review
                </span>
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">{displayName}</div>
                      <div className="text-[9px] text-slate-400">Qty: 1 × ₹{displayPrice}</div>
                    </div>
                  </div>
                  <div className="font-black text-xs text-slate-900">₹{displayPrice}</div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500 font-semibold">Total Payable</span>
                  <span className="font-extrabold text-brand-700">₹{displayPrice + 25}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Home Indicator */}
          <div className="py-2 flex justify-center shrink-0 bg-white">
            <div className="w-24 h-1 bg-stone-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
