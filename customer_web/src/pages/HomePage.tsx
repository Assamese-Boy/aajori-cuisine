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
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Restaurant, MenuItem } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
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

// Circular culinary story categories (like native food delivery apps)
const STORY_CATEGORIES = [
  { name: 'All', icon: '🍲', color: 'from-amber-500 to-brand-500' },
  { name: 'Khorikaa', icon: '🍖', color: 'from-orange-500 to-red-600' },
  { name: 'Thalis', icon: '🍛', color: 'from-yellow-500 to-amber-600' },
  { name: 'Masor Tenga', icon: '🐟', color: 'from-teal-500 to-cyan-600' },
  { name: 'Duck Curry', icon: '🦆', color: 'from-stone-600 to-stone-900' },
  { name: 'Smoked Pork', icon: '🥓', color: 'from-rose-600 to-amber-700' },
  { name: 'Pure Veg', icon: '🥬', color: 'from-emerald-500 to-green-600' },
];

const MOBILE_PROMO_SLIDES = [
  {
    title: 'Authentic Assam Khorikaa',
    subtitle: 'Smoked pork with bamboo shoot & Joha rice',
    tag: '⚡ 25 Mins Express',
    code: 'AAJORI50',
    discount: '₹50 OFF',
    bg: 'from-brand-900 via-stone-900 to-amber-950',
    accent: 'text-amber-400',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
  },
  {
    title: 'Paradise Heritage Thalis',
    subtitle: 'Parampara non-veg thali with Kaji Nemu',
    tag: '👑 Pioneer Since 1984',
    code: 'FIRSTMEAL',
    discount: '20% OFF',
    bg: 'from-stone-950 via-amber-950 to-stone-900',
    accent: 'text-amber-300',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
  },
  {
    title: 'Riverfront Duck & Fish',
    subtitle: 'Duck curry with roasted black sesame',
    tag: '🔥 Charcoal Roasted',
    code: 'AAJORI50',
    discount: 'Flat ₹50 OFF',
    bg: 'from-slate-950 via-teal-950 to-stone-900',
    accent: 'text-emerald-400',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
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

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [featuredDishes, setFeaturedDishes] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(isPureVeg ? 'Pure Veg' : 'All');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Sync selectedCategory if isPureVeg changes
  useEffect(() => {
    if (isPureVeg && selectedCategory !== 'Pure Veg') {
      setSelectedCategory('Pure Veg');
    }
  }, [isPureVeg]);

  // Auto rotate banner every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % MOBILE_PROMO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await apiRequest<Restaurant[]>('/restaurants');
        if (res.success && res.data) {
          setRestaurants(res.data);

          if (res.data.length > 0) {
            const menuPromises = res.data.slice(0, 2).map((r) =>
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
      } catch (e) {
        console.error('Error fetching restaurants', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApplyPromo = (code: string) => {
    applyCoupon(code);
    toast.success('Coupon Applied', `Code ${code} activated for checkout discount!`);
  };

  const filteredRestaurants = restaurants.filter((r) => {
    if (isPureVeg) {
      // Show restaurants that have veg options
      return true;
    }
    if (selectedCategory !== 'All' && selectedCategory !== 'Pure Veg') {
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

  const displayDishes = featuredDishes.filter((d) => {
    if (isPureVeg) return d.isVeg === true;
    if (selectedCategory === 'Pure Veg') return d.isVeg === true;
    return true;
  }).slice(0, 6);

  return (
    <div className="space-y-4 pb-28 pt-2 animate-page-enter">
      {/* Pure Veg Banner if active */}
      {isPureVeg && (
        <div className="mx-4 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-fade-in">
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

      {/* 1. Horizontal Circular Category Stories (Native App Pattern) */}
      <section className="px-4 stagger-1">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {STORY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className="flex flex-col items-center shrink-0 space-y-1 btn-press group"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-xs transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-tr from-brand-600 to-amber-500 text-white ring-2 ring-brand-500 ring-offset-2 scale-105'
                      : 'bg-white border border-stone-200 text-slate-800 group-hover:border-brand-300'
                  }`}
                >
                  <span>{cat.icon}</span>
                </div>
                <span
                  className={`text-[10px] tracking-tight font-bold transition-colors ${
                    isSelected ? 'text-brand-700' : 'text-slate-600'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Mobile Swipeable Promo Banners (Like Swiggy / Zomato native banners) */}
      <section className="px-4 stagger-2">
        <div className="relative rounded-3xl overflow-hidden shadow-lg border border-stone-800">
          <div
            className={`p-4 min-h-[160px] flex flex-col justify-between bg-gradient-to-br ${MOBILE_PROMO_SLIDES[currentSlide].bg} text-white relative transition-all duration-500`}
          >
            {/* Background image overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 overflow-hidden pointer-events-none">
              <img
                src={MOBILE_PROMO_SLIDES[currentSlide].image}
                alt=""
                className="w-full h-full object-cover filter blur-[0.5px] transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900 to-transparent"></div>
            </div>

            <div className="relative z-10 space-y-1 max-w-[70%]">
              <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-extrabold uppercase tracking-widest text-amber-300">
                {MOBILE_PROMO_SLIDES[currentSlide].tag}
              </span>
              <h3 className="text-base font-black font-serif-culinary leading-tight">
                {MOBILE_PROMO_SLIDES[currentSlide].title}
              </h3>
              <p className="text-[11px] text-stone-300 leading-snug line-clamp-1">
                {MOBILE_PROMO_SLIDES[currentSlide].subtitle}
              </p>
            </div>

            {/* Bottom promo action */}
            <div className="relative z-10 flex items-center justify-between pt-2">
              <button
                onClick={() => handleApplyPromo(MOBILE_PROMO_SLIDES[currentSlide].code)}
                className="px-3 py-1 bg-white text-slate-900 rounded-xl text-[10px] font-extrabold flex items-center gap-1 shadow-xs btn-press"
              >
                <Tag className="w-3 h-3 text-brand-600" />
                <span>Use {MOBILE_PROMO_SLIDES[currentSlide].code}</span>
              </button>

              {/* Dots */}
              <div className="flex gap-1">
                {MOBILE_PROMO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentSlide === i ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/40'
                    }`}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI Meal Assistant Banner Pill */}
      <section className="px-4 stagger-3">
        <button
          onClick={onOpenAiAssistant}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/15 to-amber-500/10 border border-brand-200/80 flex items-center justify-between gap-3 text-left btn-press shadow-2xs hover:border-brand-400 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                Not sure what to eat? Ask Aajori AI
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight">
                Resolves budget, headcounts & cravings into real kitchen items
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-brand-600 shrink-0">&rarr;</span>
        </button>
      </section>

      {/* 4. Native Restaurant Listing */}
      <section className="px-4 space-y-3 stagger-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Institutions Near You
          </h2>
          <span className="text-[11px] font-bold text-brand-600">
            {filteredRestaurants.length} Places Live
          </span>
        </div>

        {isLoading ? (
          <SkeletonRestaurantGrid count={3} />
        ) : filteredRestaurants.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 space-y-1">
            <p className="text-xs font-bold text-slate-800">No restaurants match your filter</p>
            <p className="text-[10px] text-slate-400">Try selecting &quot;All&quot; category</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurant/${restaurant.id}`}
                className="block bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs card-smooth btn-press hover:border-brand-300"
              >
                {/* Full-bleed mobile card image */}
                <div className="relative h-44 bg-stone-100 overflow-hidden">
                  <img
                    src={
                      restaurant.coverUrl ||
                      'https://images.unsplash.com/photo-1544025162-d76694265947?w=700'
                    }
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  {/* Delivery time pill overlay (Native Swiggy/Zomato pattern) */}
                  <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-xl bg-slate-950/90 text-white text-[10px] font-extrabold flex items-center gap-1.5 backdrop-blur-md shadow-xs">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{restaurant.avgPrepTimeMinutes} MINS</span>
                    <span className="text-stone-500">•</span>
                    <span>2.1 KM</span>
                  </div>

                  {/* Rating badge */}
                  <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black flex items-center gap-0.5 shadow-xs">
                    <span>{restaurant.rating || '4.8'}</span>
                    <Star className="w-3 h-3 fill-white" />
                  </div>

                  {/* Kitchen status tag */}
                  <div className="absolute top-2.5 left-2.5">
                    {restaurant.isAcceptingOrders ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-extrabold tracking-wider uppercase">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-stone-300 text-[9px] font-extrabold tracking-wider uppercase">
                        Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Restaurant card text */}
                <div className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                      {restaurant.name}
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-500 truncate leading-tight">
                    {restaurant.cuisineTypes.join(', ')}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-stone-100">
                    <span className="truncate max-w-[180px]">
                      {restaurant.addressLine}
                    </span>
                    <span className="font-bold text-slate-700 shrink-0">
                      Min ₹{restaurant.minOrderAmount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 5. Trending Dishes in Kamrup Metro */}
      {displayDishes.length > 0 && (
        <section className="px-4 space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Trending in Guwahati
              </h2>
            </div>
            {isPureVeg && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Veg
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {displayDishes.map((dish) => {
              const qty = getItemQuantity(dish.id);
              const rest = restaurants.find((r) => r.id === dish.restaurantId) || {
                id: dish.restaurantId,
                name: 'Khorikaa Ethnic Kitchen',
              };

              return (
                <div
                  key={dish.id}
                  className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs card-smooth"
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          dish.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      ></span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {dish.name}
                      </h4>
                    </div>

                    <p className="text-xs font-black text-slate-900">
                      ₹{dish.price}
                    </p>

                    <p className="text-[10px] text-brand-700 font-semibold truncate">
                      {rest.name}
                    </p>
                  </div>

                  {/* Add / Stepper Button */}
                  <div className="shrink-0">
                    {qty > 0 ? (
                      <div className="flex items-center bg-stone-100 border border-stone-300 rounded-xl p-0.5">
                        <button
                          onClick={() => updateQuantity(dish.id, qty - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-700 font-bold hover:bg-white rounded-lg transition-all btn-press"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-900">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(dish.id, qty + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-700 font-bold hover:bg-white rounded-lg transition-all btn-press"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addItem(rest, dish, 1)}
                        className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all btn-press shadow-2xs"
                      >
                        + ADD
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
