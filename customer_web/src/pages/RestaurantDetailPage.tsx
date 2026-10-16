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
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Restaurant, MenuItem, MenuCategory, MenuItemVariant, MenuItemAddon } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { SkeletonMenuGrid } from '../components/SkeletonLoaders';

interface RestaurantDetailPageProps {
  isPureVeg?: boolean;
}

// Default regional add-ons for Assamese dishes if not explicitly configured in DB
const DEFAULT_ASSAM_ADDONS: MenuItemAddon[] = [
  { id: 'add_bamboo', name: 'Extra Fermented Bamboo Shoot Dip', price: 25 },
  { id: 'add_joha', name: 'Side of Steamed Fragrant Joha Rice', price: 50 },
  { id: 'add_nemu', name: 'Fresh Kaji Nemu & Bhut Jolokia Dip', price: 20 },
];

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

  // Customization bottom sheet state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<{ id: string; name: string; price: number } | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [customQty, setCustomQty] = useState(1);

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
      <div className="p-8 text-center space-y-3 pt-20">
        <h2 className="text-base font-bold text-slate-800">Restaurant Not Found</h2>
        <p className="text-xs text-slate-500">The requested kitchen is currently unavailable or inactive.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold btn-press"
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

  const handleOpenCustomization = (dish: MenuItem) => {
    setCustomizingItem(dish);
    setSelectedPortion({ id: 'std', name: 'Regular Portion', price: dish.price });
    setSelectedAddons([]);
    setCustomInstructions('');
    setCustomQty(1);
  };

  const handleToggleAddon = (addon: MenuItemAddon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) return prev.filter((a) => a.id !== addon.id);
      return [...prev, addon];
    });
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem || !restaurant) return;
    addItem(restaurant, customizingItem, customQty, {
      variant: selectedPortion,
      addons: selectedAddons,
      instructions: customInstructions.trim() || undefined,
    });
    setCustomizingItem(null);
  };

  const calculateCustomPrice = () => {
    if (!customizingItem) return 0;
    const base = selectedPortion ? selectedPortion.price : customizingItem.price;
    const addons = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    return (base + addons) * customQty;
  };

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
            {restaurant.avgPrepTimeMinutes} mins prep • {restaurant.city}
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
            {restaurant.isAcceptingOrders && !restaurant.isBusy ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                Active Kitchen
              </span>
            ) : restaurant.isBusy ? (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                Kitchen Busy
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                Closed Now
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h1 className="text-xl font-black font-serif-culinary leading-tight">
              {restaurant.name}
            </h1>
            <p className="text-xs text-amber-200 truncate font-semibold mt-0.5">
              {restaurant.tagline || restaurant.cuisineTypes.join(' • ')}
            </p>
          </div>
        </div>

        {/* Info pills */}
        <div className="p-3 bg-white rounded-2xl border border-stone-200/90 flex items-center justify-between text-xs text-slate-700 shadow-2xs font-bold">
          <div className="flex items-center gap-1.5 font-black text-slate-900">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{restaurant.rating || '4.8'}</span>
            <span className="text-[10px] text-slate-400 font-medium">(180+ reviews)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{restaurant.avgPrepTimeMinutes} mins</span>
          </div>
          <div>
            <span>Min ₹{restaurant.minOrderAmount}</span>
          </div>
          <div className="text-emerald-700 font-extrabold">
            <span>₹{restaurant.packagingFee} Pack</span>
          </div>
        </div>

        {/* In-restaurant menu search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within this menu..."
            className="w-full pl-9 pr-4 py-2 bg-stone-100 border border-stone-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
          />
        </div>
      </div>

      {/* 3. Sticky Horizontal Category Chips */}
      <div className="sticky top-14 z-20 bg-stone-100/95 backdrop-blur-md px-4 py-2.5 border-y border-stone-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
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
          className={`px-2.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap border flex items-center gap-1.5 shrink-0 ${
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
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-xs text-slate-400 font-medium">
            No dishes matching this filter in {restaurant.name}.
          </div>
        ) : (
          filteredItems.map((dish) => {
            const qty = getItemQuantity(dish.id);
            const isAvailable = dish.isAvailable !== false && restaurant.isAcceptingOrders;

            return (
              <div
                key={dish.id}
                className="p-3.5 bg-white rounded-3xl border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3.5"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {/* Veg / Non-Veg square badge */}
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
                      <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {dish.spiceLevel}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-black text-slate-900">₹{dish.price}</p>

                  {dish.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {dish.description}
                    </p>
                  )}

                  {/* Customizable pill */}
                  <button
                    onClick={() => handleOpenCustomization(dish)}
                    className="text-[10px] font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 mt-1 underline"
                  >
                    <span>Customizable with portions & dips</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {/* Right Action: Dish Photo + Overlapping ADD / Stepper */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <div className="w-22 h-22 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200/80 shadow-2xs">
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
                    {!isAvailable ? (
                      <span className="px-3 py-1 bg-stone-200 text-stone-500 rounded-xl text-[10px] font-black uppercase">
                        Unavailable
                      </span>
                    ) : qty > 0 ? (
                      <div className="flex items-center bg-white border border-brand-500 rounded-xl px-1.5 py-0.5 shadow-md">
                        <button
                          onClick={() => updateQuantity(dish.id, qty - 1)}
                          className="w-5 h-5 flex items-center justify-center text-brand-700 font-bold hover:bg-stone-50 rounded-lg transition-colors btn-press"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-black text-brand-900">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(dish.id, qty + 1)}
                          className="w-5 h-5 flex items-center justify-center text-brand-700 font-bold hover:bg-stone-50 rounded-lg transition-colors btn-press"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenCustomization(dish)}
                        className="px-4 py-1.5 bg-white border border-brand-600 hover:bg-brand-50 text-brand-700 rounded-xl text-xs font-black btn-press shadow-md cursor-pointer tracking-wide"
                      >
                        ADD +
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Dish Customization Pull-Up Bottom Sheet (Zomato/Swiggy UX Standard) */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300">
          <div
            onClick={() => setCustomizingItem(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl relative z-10 max-h-[85vh] flex flex-col safe-bottom animate-slide-up">
            {/* Sheet Handle */}
            <div className="pt-3 pb-1 flex justify-center bg-white shrink-0">
              <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
            </div>

            {/* Dish Summary Header */}
            <div className="p-4 border-b border-stone-100 flex items-start justify-between shrink-0">
              <div className="space-y-1 pr-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center p-0.5 shrink-0 ${
                      customizingItem.isVeg ? 'border-emerald-600' : 'border-rose-600'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        customizingItem.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm leading-tight">
                    {customizingItem.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">
                  {customizingItem.description || 'Authentic Assamese preparation'}
                </p>
              </div>

              <button
                onClick={() => setCustomizingItem(null)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Customization Options */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Option 1: Portion Size */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Select Portion Size
                </h4>
                <div className="space-y-1.5">
                  {[
                    { id: 'std', name: 'Regular Portion', price: customizingItem.price },
                    { id: 'large', name: 'Large / Feast Portion', price: customizingItem.price + 70 },
                  ].map((portion) => (
                    <label
                      key={portion.id}
                      onClick={() => setSelectedPortion(portion)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedPortion?.id === portion.id
                          ? 'bg-brand-50 border-brand-500 text-brand-900 font-bold'
                          : 'border-stone-200 bg-stone-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedPortion?.id === portion.id
                              ? 'border-brand-600'
                              : 'border-stone-400'
                          }`}
                        >
                          {selectedPortion?.id === portion.id && (
                            <div className="w-2 h-2 rounded-full bg-brand-600" />
                          )}
                        </div>
                        <span className="text-xs">{portion.name}</span>
                      </div>
                      <span className="text-xs font-black">₹{portion.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Option 2: Regional Add-ons */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Traditional Add-ons & Dips
                </h4>
                <div className="space-y-1.5">
                  {DEFAULT_ASSAM_ADDONS.map((addon) => {
                    const isChecked = Boolean(selectedAddons.find((a) => a.id === addon.id));
                    return (
                      <label
                        key={addon.id}
                        onClick={() => handleToggleAddon(addon)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                            : 'border-stone-200 bg-stone-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              isChecked
                                ? 'bg-amber-600 border-amber-600 text-white'
                                : 'border-stone-400 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-xs">{addon.name}</span>
                        </div>
                        <span className="text-xs font-black">+₹{addon.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Option 3: Special instructions */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Special Kitchen Note
                </h4>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Mild spice, less oil, extra lemon wedge"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="p-4 border-t border-stone-100 bg-white flex items-center justify-between gap-3 shrink-0">
              {/* Stepper */}
              <div className="flex items-center bg-stone-100 border border-stone-200 rounded-2xl px-2 py-1">
                <button
                  onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center text-slate-700 font-bold btn-press"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-black text-slate-900">
                  {customQty}
                </span>
                <button
                  onClick={() => setCustomQty((q) => q + 1)}
                  className="w-7 h-7 flex items-center justify-center text-slate-700 font-bold btn-press"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Button with calculated price */}
              <button
                onClick={handleConfirmCustomization}
                className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-amber-600 text-white font-extrabold text-xs rounded-2xl shadow-md btn-press flex items-center justify-center gap-2"
              >
                <span>Add Item to Cart</span>
                <span>•</span>
                <span>₹{calculateCustomPrice()}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
