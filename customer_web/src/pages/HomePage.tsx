import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Clock,
  MapPin,
  Sparkles,
  Flame,
  ChevronRight,
  Plus,
  Minus,
  Tag,
  Copy,
  ChevronLeft,
  Bike,
  Heart,
  TrendingUp,
  Percent,
  CheckCircle2,
  RotateCcw,
  ShoppingBag,
  Gift,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Restaurant, MenuItem } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLocationContext } from '../context/LocationContext';
import { useSettings } from '../context/SettingsContext';
import {
  SkeletonRestaurantGrid,
  SkeletonMenuGrid,
} from '../components/SkeletonLoaders';

interface HomePageProps {
  onOpenAiAssistant: () => void;
  searchQuery: string;
  isPureVeg?: boolean;
  onTogglePureVeg?: () => void;
}

// Full set of authentic Assamese culinary categories as specified in Master Architecture
const STORY_CATEGORIES = [
  { name: 'All', icon: '🍲', color: 'from-amber-500 to-brand-500' },
  { name: 'Khorikaa', icon: '🍖', color: 'from-orange-500 to-red-600' },
  { name: 'Thalis', icon: '🍛', color: 'from-yellow-500 to-amber-600' },
  { name: 'Masor Tenga', icon: '🐟', color: 'from-teal-500 to-cyan-600' },
  { name: 'Duck Curry', icon: '🦆', color: 'from-stone-600 to-stone-900' },
  { name: 'Smoked Meat', icon: '🥓', color: 'from-rose-600 to-amber-700' },
  { name: 'Rice and Staples', icon: '🍚', color: 'from-amber-400 to-yellow-600' },
  { name: 'Vegetarian', icon: '🥬', color: 'from-emerald-500 to-green-600' },
  { name: 'Snacks', icon: '🥟', color: 'from-orange-400 to-amber-500' },
  { name: 'Beverages', icon: '🍵', color: 'from-teal-600 to-emerald-700' },
];

const MOBILE_PROMO_SLIDES = [
  {
    title: 'Authentic Assam Khorikaa',
    subtitle: 'Smoked pork with bamboo shoot & Joha rice',
    tag: '⚡ 25 Mins Express',
    code: 'AAJORI50',
    discount: '₹50 OFF',
    condition: 'On orders above ₹250',
    bg: 'from-brand-900 via-stone-900 to-amber-950',
    accent: 'text-amber-400',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    restaurantId: 'd0000000-0000-0000-0000-000000000001',
  },
  {
    title: 'Paradise Heritage Thalis',
    subtitle: 'Parampara non-veg thali with Kaji Nemu',
    tag: '👑 Pioneer Since 1984',
    code: 'BIHU20',
    discount: '20% OFF',
    condition: 'Up to ₹100 on thalis',
    bg: 'from-stone-950 via-amber-950 to-stone-900',
    accent: 'text-amber-300',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
    restaurantId: 'd0000000-0000-0000-0000-000000000002',
  },
  {
    title: 'Riverfront Duck & Fish',
    subtitle: 'Duck curry with roasted black sesame',
    tag: '🔥 Charcoal Roasted',
    code: 'FIRSTMEAL',
    discount: '₹75 OFF',
    condition: 'On first district order',
    bg: 'from-slate-950 via-teal-950 to-stone-900',
    accent: 'text-emerald-400',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    restaurantId: 'd0000000-0000-0000-0000-000000000003',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  onOpenAiAssistant,
  searchQuery,
  isPureVeg = false,
  onTogglePureVeg,
}) => {
  const { addItem, getItemQuantity, updateQuantity, applyCoupon, openCart } = useCart();
  const toast = useToast();
  const { currentLocation } = useLocationContext();
  const { settings } = useSettings();

  const categories =
    settings.culinaryCategories && settings.culinaryCategories.length > 0
      ? settings.culinaryCategories
      : STORY_CATEGORIES;
  const promoSlides =
    settings.heroBanners && settings.heroBanners.length > 0
      ? settings.heroBanners
      : MOBILE_PROMO_SLIDES;

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [featuredDishes, setFeaturedDishes] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(isPureVeg ? 'Vegetarian' : 'All');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);

  // Calculate dynamic driving distance in km from user's current GPS/selected locality
  const getRestaurantDistance = (r: Restaurant): number | null => {
    if (r.location && currentLocation) {
      const dLat = (r.location.latitude - currentLocation.latitude) * 111;
      const dLng =
        (r.location.longitude - currentLocation.longitude) *
        111 *
        Math.cos((currentLocation.latitude * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      return Math.max(0.5, Math.round(dist * 10) / 10);
    }
    return r.distanceKm || null;
  };

  // Sync selectedCategory if isPureVeg changes
  useEffect(() => {
    if (isPureVeg && selectedCategory !== 'Vegetarian') {
      setSelectedCategory('Vegetarian');
    }
  }, [isPureVeg]);

  // Auto rotate banner every 5 seconds
  useEffect(() => {
    if (promoSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promoSlides.length]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const queryParams = currentLocation
          ? `?lat=${currentLocation.latitude}&lng=${currentLocation.longitude}`
          : '';
        const [res, couponRes] = await Promise.all([
          apiRequest<Restaurant[]>(`/restaurants${queryParams}`),
          apiRequest<any[]>('/coupons'),
        ]);

        if (res.success && res.data) {
          setRestaurants(res.data);

          if (res.data.length > 0) {
            const menuPromises = res.data.map((r) =>
              apiRequest<{ categories: any[]; items: MenuItem[] }>(`/restaurants/${r.id}/menu`)
            );
            const results = await Promise.all(menuPromises);
            const combined: MenuItem[] = [];
            results.forEach((r) => {
              if (r.success && r.data?.items) {
                combined.push(...r.data.items);
              }
            });
            setFeaturedDishes(combined);
          }
        }

        if (couponRes.success && couponRes.data) {
          setActiveCoupons(couponRes.data);
        }
      } catch (e) {
        console.error('Error fetching home data', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  const handleApplyPromo = (code: string) => {
    applyCoupon(code);
    toast.success('Coupon Applied', `Code ${code} activated for checkout discount!`);
  };

  // Filter restaurants based on category, search, veg
  const filteredRestaurants = restaurants.filter((r) => {
    if (isPureVeg || selectedCategory === 'Vegetarian') {
      // Show kitchens offering vegetarian food
      return true;
    }
    if (selectedCategory !== 'All') {
      const matchCat = r.cuisineTypes.some((c) =>
        c.toLowerCase().includes(selectedCategory.toLowerCase())
      );
      if (!matchCat) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchCuisine = r.cuisineTypes.some((c) => c.toLowerCase().includes(q));
      const matchAddress = r.addressLine.toLowerCase().includes(q);
      return matchName || matchCuisine || matchAddress;
    }
    return true;
  });

  // Section 1: Restaurants accepting orders right now
  const openRestaurants = filteredRestaurants.filter((r) => r.isAcceptingOrders && !r.isBusy);

  // Section 2: Popular dishes
  const popularDishes = featuredDishes
    .filter((d) => {
      if (isPureVeg || selectedCategory === 'Vegetarian') return d.isVeg === true;
      if (selectedCategory === 'Khorikaa') return d.name.toLowerCase().includes('pork') || d.name.toLowerCase().includes('grill');
      if (selectedCategory === 'Thalis') return d.name.toLowerCase().includes('thali');
      if (selectedCategory === 'Masor Tenga') return d.name.toLowerCase().includes('tenga') || d.name.toLowerCase().includes('fish');
      if (selectedCategory === 'Duck Curry') return d.name.toLowerCase().includes('duck');
      if (selectedCategory === 'Smoked Meat') return d.name.toLowerCase().includes('smoked') || d.name.toLowerCase().includes('khorikaa');
      if (selectedCategory === 'Rice and Staples') return d.name.toLowerCase().includes('rice') || d.name.toLowerCase().includes('luchi');
      if (selectedCategory === 'Beverages') return d.name.toLowerCase().includes('tea') || d.name.toLowerCase().includes('juice');
      return true;
    })
    .slice(0, 6);

  return (
    <div className="space-y-4 pb-28 pt-2 animate-page-enter">
      {/* Pure Veg Banner if active */}
      {isPureVeg && (
        <div className="mx-4 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-bold">Pure Veg Mode Active</span>
            <span className="text-[10px] text-emerald-700 font-medium">• Filtering vegetarian items</span>
          </div>
          {onTogglePureVeg && (
            <button
              onClick={onTogglePureVeg}
              className="text-[11px] font-extrabold text-emerald-800 hover:text-emerald-900 underline btn-press"
            >
              Turn Off
            </button>
          )}
        </div>
      )}

      {/* 1. Horizontal Circular Category Stories (Native Food Delivery Pattern) */}
      <section className="px-4 stagger-1">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className="flex flex-col items-center shrink-0 space-y-1.5 btn-press group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-2xs transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-tr from-brand-600 to-amber-500 text-white ring-2 ring-brand-500 ring-offset-2 scale-105 shadow-md shadow-brand-500/20'
                      : 'bg-white border border-stone-200 text-slate-800 group-hover:border-brand-300'
                  }`}
                >
                  <span>{cat.icon}</span>
                </div>
                <span
                  className={`text-[11px] tracking-tight font-black transition-colors whitespace-nowrap ${
                    isSelected ? 'text-brand-700 font-extrabold' : 'text-slate-700 font-medium'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Compact Promotional Hero Banner */}
      {promoSlides.length > 0 && (
        <section className="px-4 stagger-2">
          {(() => {
            const activeIdx = Math.min(currentSlide, promoSlides.length - 1);
            const activeSlide = promoSlides[activeIdx] || promoSlides[0];
            return (
              <div className="relative rounded-3xl overflow-hidden shadow-sm border border-stone-800">
                <div
                  className={`p-4 min-h-[160px] flex flex-col justify-between bg-gradient-to-br ${
                    activeSlide.bg || 'from-brand-900 via-stone-900 to-amber-950'
                  } text-white relative transition-all duration-500`}
                >
                  {/* Background image overlay */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-35 overflow-hidden pointer-events-none">
                    <img
                      src={activeSlide.image}
                      alt=""
                      className="w-full h-full object-cover filter blur-[0.5px] transition-opacity duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1544025162-d76694265947?w=600';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-900 to-transparent"></div>
                  </div>

                  <div className="relative z-10 space-y-1 max-w-[75%]">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-amber-300">
                      {activeSlide.tag}
                    </span>
                    <h3 className="text-base font-black font-serif-culinary leading-tight">
                      {activeSlide.title}
                    </h3>
                    <p className="text-xs text-stone-200 leading-snug line-clamp-1 font-medium">
                      {activeSlide.subtitle}
                    </p>
                    <p className="text-[10px] text-amber-300/90 font-bold">
                      {activeSlide.condition}
                    </p>
                  </div>

                  {/* Bottom promo action */}
                  <div className="relative z-10 flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApplyPromo(activeSlide.code)}
                        className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm btn-press"
                      >
                        <Tag className="w-3.5 h-3.5 text-brand-600" />
                        <span>Use {activeSlide.code}</span>
                      </button>
                      {activeSlide.restaurantId && (
                        <Link
                          to={`/restaurant/${activeSlide.restaurantId}`}
                          className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold btn-press"
                        >
                          Order
                        </Link>
                      )}
                    </div>

                    {/* Dots */}
                    <div className="flex gap-1.5">
                      {promoSlides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentSlide(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            activeIdx === i ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/40'
                          }`}
                        ></button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* 3. Aajori AI Assistant Entry Pill */}
      <section className="px-4 stagger-3">
        <button
          onClick={onOpenAiAssistant}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/15 to-amber-500/10 border border-brand-200/90 flex items-center justify-between gap-3 text-left btn-press shadow-2xs hover:border-brand-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-amber-200" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">
                Not sure what to order? Ask Aajori AI
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                &ldquo;Best Assamese meal under ₹200&rdquo; • &ldquo;Recommend dinner for 2&rdquo;
              </p>
            </div>
          </div>
          <span className="text-sm font-black text-brand-600 shrink-0">&rarr;</span>
        </button>
      </section>

      {/* 4. DISCOVERY SECTION 1: Kitchens Accepting Orders Now */}
      <section className="px-4 space-y-3 stagger-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Restaurants Accepting Orders Now
            </h2>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {openRestaurants.length} Live
          </span>
        </div>

        {isLoading ? (
          <SkeletonRestaurantGrid count={2} />
        ) : filteredRestaurants.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
            <p className="text-sm font-bold text-slate-800">
              No restaurants matching &ldquo;{selectedCategory}&rdquo; in this area
            </p>
            <p className="text-xs text-slate-500">
              Try exploring all cuisines or clearing the category filter.
            </p>
            <button
              onClick={() => setSelectedCategory('All')}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold btn-press"
            >
              Reset Category Filter
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurant/${restaurant.id}`}
                className="block bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md card-smooth btn-press transition-all"
              >
                {/* Full-bleed card image */}
                <div className="relative h-48 bg-stone-100 overflow-hidden">
                  <img
                    src={
                      restaurant.coverUrl ||
                      (restaurant as any).bannerUrl ||
                      (restaurant as any).cover_url ||
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="700" height="400" viewBox="0 0 700 400"><rect fill="%23f1f5f9" width="700" height="400"/><text fill="%2394a3b8" font-family="sans-serif" font-size="24" font-weight="bold" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Restaurant Storefront</text></svg>'
                    }
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="700" height="400" viewBox="0 0 700 400"><rect fill="%23f1f5f9" width="700" height="400"/><text fill="%2394a3b8" font-family="sans-serif" font-size="24" font-weight="bold" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Restaurant Storefront</text></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>

                  {/* Delivery time & distance pill overlay */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-slate-950/90 text-white text-[11px] font-black flex items-center gap-1.5 backdrop-blur-md shadow-md border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {(() => {
                      const dist = getRestaurantDistance(restaurant);
                      return (
                        <>
                          <span>
                            {restaurant.avgPrepTimeMinutes + (dist ? Math.round(dist * 3) : 0)} MINS
                          </span>
                          {dist && (
                            <>
                              <span className="text-stone-500">•</span>
                              <span>{dist} KM</span>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Rating badge */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-1 shadow-md">
                    <span>{restaurant.rating || '4.8'}</span>
                    <Star className="w-3.5 h-3.5 fill-white" />
                  </div>

                  {/* Kitchen status tag */}
                  <div className="absolute top-3 left-3">
                    {restaurant.isAcceptingOrders && !restaurant.isBusy ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black tracking-wider uppercase shadow-2xs">
                        Accepting Orders
                      </span>
                    ) : restaurant.isBusy ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-2xs">
                        Busy Kitchen
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-stone-300 text-[10px] font-black tracking-wider uppercase">
                        Closed Now
                      </span>
                    )}
                  </div>
                </div>

                {/* Restaurant card text */}
                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-900 text-base leading-tight truncate">
                      {restaurant.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 truncate leading-tight font-medium">
                    {restaurant.cuisineTypes.join(' • ')}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-stone-100 font-medium">
                    <span className="truncate max-w-[200px]">
                      📍 {restaurant.addressLine}
                    </span>
                    <span className="font-extrabold text-slate-800 shrink-0">
                      Min ₹{restaurant.minOrderAmount} • ₹{restaurant.packagingFee || 15} Pack
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 5. DISCOVERY SECTION 2: Popular Dishes Near You */}
      {popularDishes.length > 0 && (
        <section className="px-4 space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4.5 h-4.5 text-amber-500" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Popular Dishes Near You
              </h2>
            </div>
            {isPureVeg && (
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                100% Veg
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {popularDishes.map((dish) => {
              const qty = getItemQuantity(dish.id);
              const rest = restaurants.find((r) => r.id === dish.restaurantId) || {
                id: dish.restaurantId,
                name: 'Khorikaa Ethnic Kitchen',
              };

              return (
                <div
                  key={dish.id}
                  className="p-3 bg-white rounded-2xl border border-stone-200/90 flex items-center justify-between gap-3 shadow-2xs card-smooth overflow-hidden"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
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
                      <h4 className="text-sm font-black text-slate-900 truncate">
                        {dish.name}
                      </h4>
                    </div>

                    <p className="text-xs font-black text-slate-900">
                      ₹{dish.price}
                    </p>

                    <p className="text-[11px] text-brand-700 font-extrabold truncate">
                      {rest.name}
                    </p>
                  </div>

                  {/* Dish Thumbnail and Add/Stepper button */}
                  <div className="relative shrink-0 w-24 flex flex-col items-center pb-2">
                    <div className="w-24 h-24 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200/80 shadow-2xs relative">
                      <img
                        src={
                          dish.imageUrl ||
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%23f8fafc" width="200" height="200"/><text fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Dish</text></svg>'
                        }
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%23f8fafc" width="200" height="200"/><text fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Dish</text></svg>';
                        }}
                      />
                    </div>
                    <div className="-mt-3.5 z-10">
                      {qty > 0 ? (
                        <div className="flex items-center bg-white border border-brand-500 rounded-xl px-1.5 py-0.5 shadow-md">
                          <button
                            onClick={() => updateQuantity(dish.id, qty - 1)}
                            className="w-5 h-5 flex items-center justify-center text-brand-700 font-black hover:bg-stone-50 rounded-lg transition-all btn-press"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-black text-brand-900">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(dish.id, qty + 1)}
                            className="w-5 h-5 flex items-center justify-center text-brand-700 font-black hover:bg-stone-50 rounded-lg transition-all btn-press"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem(rest, dish, 1)}
                          className="px-4 py-1.5 bg-white border border-brand-600 hover:bg-brand-50 text-brand-700 rounded-xl text-xs font-black transition-all btn-press shadow-md"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. DISCOVERY SECTION 3: Offers & Recommended Meals */}
      <section className="px-4 space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Gift className="w-4.5 h-4.5 text-brand-600" />
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Offers & Recommended Meals
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-black text-brand-700 bg-white px-2 py-0.5 rounded-md border border-brand-200 uppercase">
              Flat ₹50 OFF
            </span>
            <h4 className="text-xs font-black text-slate-900">Coupon AAJORI50</h4>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              Min subtotal ₹250. Valid on traditional Assamese curries & thalis.
            </p>
            <button
              onClick={() => handleApplyPromo('AAJORI50')}
              className="text-[11px] font-extrabold text-brand-700 underline mt-1 block"
            >
              Apply to Cart &rarr;
            </button>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 uppercase">
              20% Discount
            </span>
            <h4 className="text-xs font-black text-slate-900">Coupon BIHU20</h4>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              Up to ₹100 OFF on orders above ₹300 across partner kitchens.
            </p>
            <button
              onClick={() => handleApplyPromo('BIHU20')}
              className="text-[11px] font-extrabold text-emerald-700 underline mt-1 block"
            >
              Apply to Cart &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 7. DISCOVERY SECTION 4: Trending Dishes */}
      <section className="px-4 space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-purple-600" />
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Trending Dishes Right Now
          </h2>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-slate-900">Smoked Pork with Khorisa (Bamboo Shoot)</h4>
            <p className="text-[11px] text-slate-500 font-medium">Over 140+ plates ordered this week in your area</p>
          </div>
          <Link
            to="/restaurant/d0000000-0000-0000-0000-000000000001"
            className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-extrabold shrink-0 border border-brand-200 btn-press"
          >
            View
          </Link>
        </div>
      </section>
    </div>
  );
};
