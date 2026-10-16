import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Tag,
  ShieldCheck,
  ShoppingBag,
  Store,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../services/api';

export const CartPage: React.FC = () => {
  const {
    items,
    restaurantId,
    restaurantName,
    totalItems,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { isAuthenticated, openAuthModal, selectedAddress } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [restaurantData, setRestaurantData] = useState<any>(null);

  useEffect(() => {
    const fetchCouponsAndRest = async () => {
      try {
        const [coupRes, restRes] = await Promise.all([
          apiRequest<any[]>('/coupons'),
          restaurantId ? apiRequest<any>(`/restaurants/${restaurantId}`) : Promise.resolve({ success: false, data: null }),
        ]);

        if (coupRes.success && coupRes.data) {
          setAvailableCoupons(coupRes.data);
        }
        if (restRes.success && restRes.data) {
          setRestaurantData(restRes.data);
        }
      } catch (err) {
        console.error('Failed to load cart metadata', err);
      }
    };

    fetchCouponsAndRest();
  }, [restaurantId]);

  const minOrderAmount = restaurantData?.minOrderAmount || 100;
  const packagingFee = restaurantData?.packagingFee || 15;
  const deliveryFee = 25;
  const platformFee = 5;
  const gst = Math.round(subtotal * 0.05);

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon === 'AAJORI50' && subtotal >= 250) {
    discountAmount = 50;
  } else if (appliedCoupon === 'BIHU20' && subtotal >= 300) {
    discountAmount = Math.min(100, Math.round(subtotal * 0.2));
  } else if (appliedCoupon === 'FIRSTMEAL' && subtotal >= 200) {
    discountAmount = 75;
  }

  const finalPayable = Math.max(0, subtotal + packagingFee + deliveryFee + platformFee + gst - discountAmount);
  const isMinOrderMet = subtotal >= minOrderAmount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim().toUpperCase());
      toast.success('Coupon Applied', `Code ${couponInput.trim().toUpperCase()} applied`);
      setCouponInput('');
    }
  };

  const handleProceed = () => {
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center space-y-4 pt-24 animate-page-enter">
        <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto text-3xl shadow-2xs">
          🛒
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-800">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 mt-1">
            Explore authentic Assamese dishes, thalis and grills to begin ordering!
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-2xl bg-brand-600 text-white font-extrabold text-xs btn-press shadow-md"
        >
          Explore Menus
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 animate-page-enter">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-stone-200 safe-top">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-2xl bg-stone-100 flex items-center justify-center text-slate-700 btn-press shrink-0 border border-stone-200/60"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>

        <div className="text-center min-w-0 px-2 flex-1">
          <h2 className="font-extrabold text-sm text-slate-900 truncate leading-tight">
            Review Order
          </h2>
          <p className="text-xs text-brand-700 font-bold truncate mt-0.5">
            {restaurantName || 'Aajori Cuisine Kitchen'}
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 btn-press px-2 py-1"
        >
          Clear
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Minimum order warning if not reached */}
        {!isMinOrderMet && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-900 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Add <strong>₹{minOrderAmount - subtotal}</strong> more to meet the minimum order of ₹{minOrderAmount}.
            </span>
          </div>
        )}

        {/* Restaurant Header Strip */}
        <div className="p-3.5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base">
              🍛
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-xs truncate leading-tight">
                {restaurantName}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Kamrup Metropolitan Service Area</p>
            </div>
          </div>

          {restaurantId && (
            <Link
              to={`/restaurant/${restaurantId}`}
              className="text-xs font-black text-brand-700 hover:underline shrink-0"
            >
              + Add More
            </Link>
          )}
        </div>

        {/* Cart items list */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Items in Cart ({totalItems})
          </h3>

          <div className="divide-y divide-stone-100">
            {items.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center p-0.5 shrink-0 ${
                        item.menuItem.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.menuItem.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </div>
                    <span className="font-black text-xs text-slate-900 truncate">
                      {item.menuItem.name}
                    </span>
                  </div>

                  {item.selectedVariant && (
                    <p className="text-[10px] text-brand-700 font-bold">
                      Portion: {item.selectedVariant.name}
                    </p>
                  )}

                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <p className="text-[10px] text-slate-500 font-medium">
                      Add-ons: {item.selectedAddons.map((a) => a.name).join(', ')}
                    </p>
                  )}

                  <p className="text-xs font-black text-slate-800">₹{item.subtotal}</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center bg-stone-100 border border-stone-200 rounded-xl px-1.5 py-0.5">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-5 h-5 flex items-center justify-center text-slate-700 font-bold btn-press"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-black text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-5 h-5 flex items-center justify-center text-slate-700 font-bold btn-press"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coupons & Promo section */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Coupons & Promotions
            </h3>
          </div>

          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Enter coupon code (e.g. AAJORI50)"
              className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black btn-press"
            >
              Apply
            </button>
          </form>

          {appliedCoupon ? (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-bold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Coupon {appliedCoupon} applied (₹{discountAmount} Saved)</span>
              </div>
              <button
                onClick={removeCoupon}
                className="text-[11px] text-rose-600 font-extrabold hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {['AAJORI50', 'BIHU20', 'FIRSTMEAL'].map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    applyCoupon(code);
                    toast.success('Coupon Applied', `Code ${code} activated!`);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-[11px] font-black btn-press"
                >
                  Use {code}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Bill Summary */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200/90 shadow-2xs space-y-2 text-xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Bill Summary
          </h3>

          <div className="space-y-1.5 text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="font-bold text-slate-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee (Kamrup Metro)</span>
              <span className="font-bold text-slate-900">₹{deliveryFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Restaurant Packaging</span>
              <span className="font-bold text-slate-900">₹{packagingFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span className="font-bold text-slate-900">₹{platformFee}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span className="font-bold text-slate-900">₹{gst}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-extrabold">
                <span>Coupon Discount</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-black text-slate-900">
              <span>Total Payable</span>
              <span className="text-brand-700">₹{finalPayable}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Checkout Action */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-stone-200 p-3.5 safe-bottom shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold leading-tight">
              Payable Amount
            </span>
            <span className="text-lg font-black text-slate-900 leading-tight">
              ₹{finalPayable}
            </span>
          </div>

          <button
            onClick={handleProceed}
            disabled={!isMinOrderMet}
            className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-amber-600 text-white font-black text-xs rounded-2xl shadow-md btn-press disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>PROCEED TO CHECKOUT &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
