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

  if (!isCartOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-end justify-center animate-fade-in">
      <div className="w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up safe-bottom">
        {/* Pull Handle */}
        <div className="pt-3 pb-1 flex justify-center bg-white shrink-0">
          <div className="w-12 h-1 bg-stone-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">
              🛍️
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Your Order Cart</h3>
              {restaurantName && (
                <p className="text-[11px] text-brand-700 font-semibold truncate max-w-[220px]">
                  {restaurantName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart items list or Empty state */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {items.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto text-2xl">
                🍲
              </div>
              <h4 className="text-sm font-bold text-slate-800">Your Cart is Empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore indigenous Assamese charcoal grills, Parampara thalis, and heritage curries.
              </p>
              <button
                onClick={closeCart}
                className="mt-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
              >
                Browse Menus
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>{totalItems} item{totalItems > 1 ? 's' : ''} in cart</span>
                <button
                  onClick={clearCart}
                  className="text-rose-600 font-bold hover:underline text-[11px]"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2.5">
                {items.map((cartItem) => (
                  <div
                    key={cartItem.id}
                    className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cartItem.menuItem.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        ></span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {cartItem.menuItem.name}
                        </h4>
                      </div>
                      <p className="text-xs font-black text-slate-900">
                        ₹{cartItem.unitPrice}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-300 rounded-xl p-0.5">
                      <button
                        onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-slate-900">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-brand-600" />
                    <span>Offers & Coupons</span>
                  </div>
                  {appliedCoupon && (
                    <button
                      onClick={removeCoupon}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-amber-300 text-xs">
                    <span className="font-bold text-emerald-700">✓ Code &quot;{appliedCoupon}&quot; Applied</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Active</span>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. AAJORI50"
                      className="flex-1 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs uppercase font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors btn-press"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {!appliedCoupon && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => applyCoupon('AAJORI50')}
                      className="text-[10px] bg-white border border-amber-200 px-2.5 py-0.5 rounded-lg text-amber-800 font-bold hover:bg-amber-100"
                    >
                      ⚡ AAJORI50 (₹50 off)
                    </button>
                  </div>
                )}
              </div>

              {/* Subtotal bill details */}
              <div className="p-3 bg-stone-50 rounded-2xl space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Total</span>
                  <span className="font-bold text-slate-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>PostGIS Distance Fee & GST</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fixed Bottom Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 border-t border-stone-100 bg-white space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold leading-tight">
                  Total Subtotal
                </span>
                <span className="text-lg font-black text-slate-900 leading-tight">
                  ₹{subtotal}
                </span>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="px-6 py-3 bg-gradient-to-r from-brand-600 to-amber-600 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2 text-xs btn-press cursor-pointer"
              >
                <span>{isAuthenticated ? 'Proceed to Pay' : 'Sign In to Pay'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
