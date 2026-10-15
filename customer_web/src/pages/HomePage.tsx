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
        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-2">
          {STORY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className="flex flex-col items-center shrink-0 space-y-1.5 btn-press group"
              >
                <div
                  className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl shadow-sm transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-tr from-brand-600 to-amber-500 text-white ring-2 ring-brand-500 ring-offset-2 scale-105 shadow-md shadow-brand-500/20'
                      : 'bg-white border border-stone-200 text-slate-800 group-hover:border-brand-300'
                  }`}
                >
                  <span>{cat.icon}</span>
                </div>
                <span
                  className={`text-xs tracking-tight font-black transition-colors ${
                    isSelected ? 'text-brand-700' : 'text-slate-700'
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
        <div className="relative rounded-3xl overflow-hidden shadow-md border border-stone-800">
          <div
            className={`p-5 min-h-[175px] flex flex-col justify-between bg-gradient-to-br ${MOBILE_PROMO_SLIDES[currentSlide].bg} text-white relative transition-all duration-500`}
          >
            {/* Background image overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-35 overflow-hidden pointer-events-none">
              <img
                src={MOBILE_PROMO_SLIDES[currentSlide].image}
                alt=""
                className="w-full h-full object-cover filter blur-[0.5px] transition-opacity duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900 to-transparent"></div>
            </div>

            <div className="relative z-10 space-y-1.5 max-w-[72%]">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider text-amber-300">
                {MOBILE_PROMO_SLIDES[currentSlide].tag}
              </span>
              <h3 className="text-lg font-black font-serif-culinary leading-tight">
                {MOBILE_PROMO_SLIDES[currentSlide].title}
              </h3>
              <p className="text-xs text-stone-200 leading-snug line-clamp-1 font-medium">
                {MOBILE_PROMO_SLIDES[currentSlide].subtitle}
              </p>
            </div>

            {/* Bottom promo action */}
            <div className="relative z-10 flex items-center justify-between pt-3">
              <button
                onClick={() => handleApplyPromo(MOBILE_PROMO_SLIDES[currentSlide].code)}
                className="px-3.5 py-2 bg-white text-slate-900 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm btn-press"
              >
                <Tag className="w-3.5 h-3.5 text-brand-600" />
                <span>Use {MOBILE_PROMO_SLIDES[currentSlide].code}</span>
              </button>

              {/* Dots */}
              <div className="flex gap-1.5">
                {MOBILE_PROMO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === i ? 'w-6 bg-amber-400' : 'w-2 bg-white/40'
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
          className="w-full p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-brand-500/15 to-amber-500/10 border border-brand-200/90 flex items-center justify-between gap-3.5 text-left btn-press shadow-2xs hover:border-brand-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 leading-tight">
                Not sure what to order? Ask Aajori AI
              </h4>
              <p className="text-xs text-slate-500 leading-tight mt-0.5">
                Resolves budget, headcounts & cravings into real kitchen items
              </p>
            </div>
          </div>
          <span className="text-sm font-black text-brand-600 shrink-0">&rarr;</span>
        </button>
      </section>

      {/* 4. Native Restaurant Listing with Enhanced Card Designs */}
      <section className="px-4 space-y-3.5 stagger-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Institutions Near You
          </h2>
          <span className="text-xs font-extrabold text-brand-600">
            {filteredRestaurants.length} Kitchens Live
          </span>
        </div>

        {isLoading ? (
          <SkeletonRestaurantGrid count={3} />
        ) : filteredRestaurants.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 space-y-2">
            <p className="text-sm font-bold text-slate-800">No restaurants match your filter</p>
            <p className="text-xs text-slate-400">Try selecting &quot;All&quot; category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurant/${restaurant.id}`}
                className="block bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-md card-smooth btn-press transition-all"
              >
                {/* Full-bleed mobile card image */}
                <div className="relative h-52 bg-stone-100 overflow-hidden">
                  <img
                    src={
                      restaurant.coverUrl ||
                      'https://images.unsplash.com/photo-1544025162-d76694265947?w=700'
                    }
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1544025162-d76694265947?w=700';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>

                  {/* Delivery time & distance pill overlay */}
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-slate-950/90 text-white text-xs font-black flex items-center gap-1.5 backdrop-blur-md shadow-md border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{restaurant.avgPrepTimeMinutes} MINS</span>
                    <span className="text-stone-500">•</span>
                    <span>2.1 KM</span>
                  </div>

                  {/* Rating badge */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-1 shadow-md">
                    <span>{restaurant.rating || '4.8'}</span>
                    <Star className="w-3.5 h-3.5 fill-white" />
                  </div>

                  {/* Kitchen status tag */}
                  <div className="absolute top-3 left-3">
                    {restaurant.isAcceptingOrders ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-black tracking-wider uppercase shadow-xs">
                        Accepting Orders
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-stone-300 text-xs font-black tracking-wider uppercase">
                        Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Restaurant card text */}
                <div className="p-4 space-y-1.5">
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
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Trending in Guwahati
              </h2>
            </div>
            {isPureVeg && (
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                100% Veg
              </span>
            )}
          </div>

          <div className="space-y-3">
            {displayDishes.map((dish) => {
              const qty = getItemQuantity(dish.id);
              const rest = restaurants.find((r) => r.id === dish.restaurantId) || {
                id: dish.restaurantId,
                name: 'Khorikaa Ethnic Kitchen',
              };

              return (
                <div
                  key={dish.id}
                  className="p-3.5 bg-white rounded-3xl border border-stone-200/90 flex items-center justify-between gap-3 shadow-sm card-smooth"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md border-2 flex items-center justify-center p-0.5 shrink-0 ${
                          dish.isVeg ? 'border-emerald-600' : 'border-rose-600'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            dish.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 truncate">
                        {dish.name}
                      </h4>
                    </div>

                    <p className="text-sm font-black text-slate-900">
                      ₹{dish.price}
                    </p>

                    <p className="text-xs text-brand-700 font-extrabold truncate">
                      {rest.name}
                    </p>
                  </div>

                  {/* Dish Thumbnail and Add/Stepper button */}
                  <div className="relative shrink-0 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200/80 shadow-2xs">
                      <img
                        src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
                        }}
                      />
                    </div>
                    <div className="-mt-3.5 z-10">
                      {qty > 0 ? (
                        <div className="flex items-center bg-white border border-brand-500 rounded-xl px-1 py-0.5 shadow-md">
                          <button
                            onClick={() => updateQuantity(dish.id, qty - 1)}
                            className="w-6 h-6 flex items-center justify-center text-brand-700 font-black hover:bg-stone-50 rounded-lg transition-all btn-press"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-black text-brand-900">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(dish.id, qty + 1)}
                            className="w-6 h-6 flex items-center justify-center text-brand-700 font-black hover:bg-stone-50 rounded-lg transition-all btn-press"
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
    </div>
  );
};
