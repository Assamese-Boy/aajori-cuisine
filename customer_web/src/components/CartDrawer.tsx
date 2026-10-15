import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  ShieldCheck,
  Utensils,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CartDrawer: React.FC = () => {
  const {
    items,
    restaurantName,
    totalItems,
    subtotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim());
      setCouponInput('');
    }
  };

  const handleProceedToCheckout = () => {
    closeCart();
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden flex items-end justify-center transition-opacity duration-350 ease-out ${
        isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Smooth Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out"
      />

      {/* Smooth Pull-Up Panel with Spring Ease */}
      <div
        className={`w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] z-10 transition-transform duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isCartOpen ? 'translate-y-0' : 'translate-y-full'
        } safe-bottom`}
      >
        {/* Pull Handle */}
        <div className="pt-3 pb-1 flex justify-center bg-white shrink-0">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base shadow-2xs">
              🛍️
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight">Your Cart</h3>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">
                {restaurantName || 'Aajori Cuisine'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1"
              >
                Clear
              </button>
            )}
            <button
              onClick={closeCart}
              className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors btn-press"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cart items list with larger readable fonts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-stone-100">
          {items.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 text-3xl flex items-center justify-center mx-auto text-stone-400">
                🛒
              </div>
              <div>
                <p className="font-black text-slate-800 text-base">Your cart is empty</p>
                <p className="text-xs text-slate-500 mt-1">
                  Explore Assam&apos;s authentic dishes and add something delicious!
                </p>
              </div>
              <button
                onClick={closeCart}
                className="px-5 py-2.5 bg-brand-600 text-white rounded-2xl text-xs font-black shadow-md btn-press"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.menuItem.id} className="pt-3.5 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 shrink-0 ${
                        item.menuItem.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.menuItem.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 truncate">
                      {item.menuItem.name}
                    </h4>
                  </div>
                  <p className="text-xs font-black text-slate-800 pl-5.5">
                    ₹{item.menuItem.price * item.quantity}
                  </p>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center bg-stone-100 border border-stone-200 rounded-2xl p-0.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-700 font-bold hover:bg-white rounded-xl transition-all btn-press"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-xs font-black text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-700 font-bold hover:bg-white rounded-xl transition-all btn-press"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Coupons & Checkout Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50/80 space-y-3.5 shrink-0">
            {/* Coupon Code Section */}
            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-black text-emerald-800">
                      Code &apos;{appliedCoupon}&apos; Applied
                    </span>
                    <p className="text-[11px] text-emerald-600">Discount applied at final bill</p>
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon (AAJORI50)"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs uppercase font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!couponInput.trim()}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black btn-press disabled:opacity-40"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Bill summary snippet */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Items Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Estimated Delivery & Tax</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t border-stone-200">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-between px-5 text-sm btn-press cursor-pointer"
            >
              <div className="text-left leading-tight">
                <span className="text-xs text-amber-200 block font-bold">
                  {totalItems} items in cart
                </span>
                <span className="text-base font-black">₹{subtotal}</span>
              </div>

              <div className="flex items-center gap-1.5 font-black">
                <span>Proceed to Checkout</span>
                <span>&rarr;</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
