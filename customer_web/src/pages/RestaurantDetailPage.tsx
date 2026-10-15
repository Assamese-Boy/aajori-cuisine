import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  MapPin,
  Search,
  ArrowLeft,
  Plus,
  Minus,
  Flame,
  ShieldAlert,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Restaurant, MenuItem, MenuCategory } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { SkeletonMenuGrid } from '../components/SkeletonLoaders';

interface RestaurantDetailPageProps {
  isPureVeg?: boolean;
}

export const RestaurantDetailPage: React.FC<RestaurantDetailPageProps> = ({ isPureVeg = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, updateQuantity, getItemQuantity, totalItems, subtotal, openCart } = useCart();
  const toast = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(isPureVeg);
  const [isLoading, setIsLoading] = useState(true);

  // Sync vegOnly when isPureVeg changes
  useEffect(() => {
    if (isPureVeg) {
      setVegOnly(true);
    }
  }, [isPureVeg]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [restRes, menuRes] = await Promise.all([
          apiRequest<Restaurant>(`/restaurants/${id}`),
          apiRequest<{ categories: MenuCategory[]; items: MenuItem[] }>(`/restaurants/${id}/menu`),
        ]);

        if (restRes.success && restRes.data) {
          setRestaurant(restRes.data);
        }
        if (menuRes.success && menuRes.data) {
          setCategories(menuRes.data.categories || []);
          setMenuItems(menuRes.data.items || []);
        }
      } catch (e: any) {
        toast.error('Error', e.message || 'Could not load restaurant menu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 pb-28">
        <div className="h-44 rounded-2xl shimmer-dark"></div>
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 rounded-xl shimmer-gradient shrink-0"></div>
          ))}
        </div>
        <SkeletonMenuGrid count={5} />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-800">Restaurant Not Found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'ALL' && item.categoryId !== selectedCategory) return false;
    if (vegOnly && !item.isVeg) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  return (
    <div className="pb-28 animate-page-enter">
      {/* 1. Mobile App Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b border-stone-200/80 safe-top">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-700 btn-press shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center min-w-0 px-2 flex-1">
          <h2 className="font-extrabold text-xs text-slate-900 truncate leading-tight">
            {restaurant.name}
          </h2>
          <p className="text-[10px] text-slate-500 truncate leading-tight">
            {restaurant.avgPrepTimeMinutes} mins • {restaurant.city}
          </p>
        </div>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: restaurant.name, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast.info('Link Copied', 'Restaurant link copied to clipboard');
            }
          }}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-700 btn-press shrink-0"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Restaurant Summary Header Card */}
      <div className="p-4 space-y-3">
        <div className="relative h-44 rounded-2xl overflow-hidden shadow-sm">
          <img
            src={
              restaurant.coverUrl ||
              'https://images.unsplash.com/photo-1544025162-d76694265947?w=700'
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          <div className="absolute top-2.5 left-2.5">
            {restaurant.isAcceptingOrders ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-extrabold uppercase">
                Active Kitchen
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-extrabold uppercase">
                Closed
              </span>
            )}
          </div>

          <div className="absolute bottom-2.5 left-3 right-3 text-white">
            <h1 className="text-lg font-black font-serif-culinary leading-tight">
              {restaurant.name}
            </h1>
            <p className="text-[11px] text-amber-200 truncate font-medium">
              {restaurant.tagline}
            </p>
          </div>
        </div>

        {/* Info pills */}
        <div className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center justify-between text-[11px] text-slate-600 shadow-2xs">
          <div className="flex items-center gap-1 font-bold text-slate-900">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{restaurant.rating || '4.8'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{restaurant.avgPrepTimeMinutes} mins</span>
          </div>
          <div>
            <span>Min ₹{restaurant.minOrderAmount}</span>
          </div>
          <div className="text-emerald-700 font-bold">
            <span>₹{restaurant.packagingFee} Pack</span>
          </div>
        </div>
      </div>

      {/* 3. Sticky Horizontal Category Chips */}
      <div className="sticky top-12 z-20 bg-stone-100/95 backdrop-blur-md px-4 py-2 border-y border-stone-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-stone-200'
          }`}
        >
          All ({menuItems.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-stone-200'
            }`}
          >
            {cat.name}
          </button>
        ))}

        <button
          onClick={() => setVegOnly(!vegOnly)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border flex items-center gap-1 shrink-0 ${
            vegOnly
              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
              : 'bg-white border-stone-200 text-slate-600'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              vegOnly ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          ></span>
          <span>Veg</span>
        </button>
      </div>

      {/* 4. Native Dish Rows */}
      <div className="p-4 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-xs text-slate-400">
            No dishes in this category.
          </div>
        ) : (
          filteredItems.map((dish) => {
            const qty = getItemQuantity(dish.id);

            return (
              <div
                key={dish.id}
                className="p-3.5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        dish.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    ></span>
                    <h3 className="font-bold text-slate-900 text-xs leading-snug truncate">
                      {dish.name}
                    </h3>

                    {dish.spiceLevel && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {dish.spiceLevel}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-black text-slate-900">₹{dish.price}</p>

                  {dish.description && (
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                  )}
                </div>

                {/* Right Action: ADD / Stepper */}
                <div className="shrink-0">
                  {qty > 0 ? (
                    <div className="flex items-center bg-stone-100 border border-stone-300 rounded-xl p-0.5">
                      <button
                        onClick={() => updateQuantity(dish.id, qty - 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-700 font-bold hover:bg-white rounded-lg transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-slate-900">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(dish.id, qty + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-700 font-bold hover:bg-white rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addItem(restaurant, dish, 1)}
                      disabled={!restaurant.isAcceptingOrders}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold btn-press shadow-2xs cursor-pointer"
                    >
                      + ADD
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
