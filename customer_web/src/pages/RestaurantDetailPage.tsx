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
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-stone-200/80 safe-top">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-2xl bg-stone-100 flex items-center justify-center text-slate-700 btn-press shrink-0 border border-stone-200/60"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>

        <div className="text-center min-w-0 px-2 flex-1">
          <h2 className="font-extrabold text-sm text-slate-900 truncate leading-tight">
            {restaurant.name}
          </h2>
          <p className="text-xs text-slate-500 truncate leading-tight font-medium mt-0.5">
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
          className="w-9 h-9 rounded-2xl bg-stone-100 flex items-center justify-center text-slate-700 btn-press shrink-0 border border-stone-200/60"
        >
          <Share2 className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* 2. Restaurant Summary Header Card */}
      <div className="p-4 space-y-3">
        <div className="relative h-48 rounded-3xl overflow-hidden shadow-sm">
          <img
            src={
              restaurant.coverUrl ||
              'https://images.unsplash.com/photo-1544025162-d76694265947?w=700'
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1544025162-d76694265947?w=700';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>

          <div className="absolute top-3 left-3">
            {restaurant.isAcceptingOrders ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                Active Kitchen
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                Closed
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h1 className="text-xl font-black font-serif-culinary leading-tight">
              {restaurant.name}
            </h1>
            <p className="text-xs text-amber-200 truncate font-semibold mt-0.5">
              {restaurant.tagline}
            </p>
          </div>
        </div>

        {/* Info pills */}
        <div className="p-3.5 bg-white rounded-2xl border border-stone-200/90 flex items-center justify-between text-xs text-slate-700 shadow-2xs font-bold">
          <div className="flex items-center gap-1.5 font-black text-slate-900">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{restaurant.rating || '4.8'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{restaurant.avgPrepTimeMinutes} mins</span>
          </div>
          <div>
            <span>Min ₹{restaurant.minOrderAmount}</span>
          </div>
          <div className="text-emerald-700 font-extrabold">
            <span>₹{restaurant.packagingFee} Packaging</span>
          </div>
        </div>
      </div>

      {/* 3. Sticky Horizontal Category Chips */}
      <div className="sticky top-14 z-20 bg-stone-100/95 backdrop-blur-md px-4 py-2.5 border-y border-stone-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
          className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap border flex items-center gap-1.5 shrink-0 ${
            vegOnly
              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
              : 'bg-white border-stone-200 text-slate-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              vegOnly ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          ></span>
          <span>Veg Only</span>
        </button>
      </div>

      {/* 4. Native Dish Rows */}
      <div className="p-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-sm text-slate-400 font-medium">
            No dishes in this category.
          </div>
        ) : (
          filteredItems.map((dish) => {
            const qty = getItemQuantity(dish.id);

            return (
              <div
                key={dish.id}
                className="p-4 bg-white rounded-3xl border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3.5"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {/* Official Veg / Non-Veg square badge */}
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center p-0.5 shrink-0 ${
                        dish.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          dish.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug truncate">
                      {dish.name}
                    </h3>

                    {dish.spiceLevel && (
                      <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {dish.spiceLevel}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-black text-slate-900">₹{dish.price}</p>

                  {dish.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {dish.description}
                    </p>
                  )}
                </div>

                {/* Right Action: Dish Photo + Overlapping ADD / Stepper */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200/80 shadow-2xs">
                    <img
                      src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300';
                      }}
                    />
                  </div>
                  <div className="-mt-3.5 z-10">
                    {qty > 0 ? (
                      <div className="flex items-center bg-white border border-brand-500 rounded-xl px-1.5 py-0.5 shadow-md">
                        <button
                          onClick={() => updateQuantity(dish.id, qty - 1)}
                          className="w-6 h-6 flex items-center justify-center text-brand-700 font-bold hover:bg-stone-50 rounded-lg transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-brand-900">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(dish.id, qty + 1)}
                          className="w-6 h-6 flex items-center justify-center text-brand-700 font-bold hover:bg-stone-50 rounded-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addItem(restaurant, dish, 1)}
                        disabled={!restaurant.isAcceptingOrders}
                        className="px-5 py-1.5 bg-white border border-brand-600 hover:bg-brand-50 disabled:bg-slate-200 disabled:border-slate-300 disabled:text-slate-400 text-brand-700 rounded-xl text-xs font-black btn-press shadow-md cursor-pointer tracking-wide"
                      >
                        ADD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
