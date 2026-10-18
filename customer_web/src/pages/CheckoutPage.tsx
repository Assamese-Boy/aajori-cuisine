import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  MapPin,
  CreditCard,
  QrCode,
  Banknote,
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLocationContext } from '../context/LocationContext';
import { apiRequest } from '../services/api';
import { PaymentMethod } from '../types';

export const CheckoutPage: React.FC = () => {
  const { items, restaurantId, restaurantName, appliedCoupon, clearCart } = useCart();
  const {
    isAuthenticated,
    user,
    addresses = [],
    selectedAddress,
    setSelectedAddress,
    addAddress,
    openAuthModal,
  } = useAuth();
  const { currentLocation } = useLocationContext();
  const toast = useToast();
  const navigate = useNavigate();

  // Pricing calculation state
  const [pricing, setPricing] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Checkout inputs
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [customerInstructions, setCustomerInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address bottom sheet state
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);
  const [showNewAddrInput, setShowNewAddrInput] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: '',
    addressLine1: '',
    landmark: '',
    city: currentLocation?.city || '',
    postalCode: currentLocation?.postalCode || '',
    latitude: currentLocation?.latitude || 0,
    longitude: currentLocation?.longitude || 0,
  });

  // Filter valid cart items
  const validItems = useMemo(() => {
    return (items || []).filter((i) => i && (i.menuItem || (i as any).name));
  }, [items]);

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('signin');
    }
  }, [isAuthenticated, openAuthModal]);

  // Auto-select current GPS/detected location as delivery address if none selected
  useEffect(() => {
    if (!selectedAddress && currentLocation) {
      setSelectedAddress({
        id: 'gps-current',
        customerId: user?.id || 'guest',
        label: currentLocation.isGps ? 'Current GPS Location' : 'Selected Address',
        addressLine1: currentLocation.name || 'Current Location',
        addressLine2: currentLocation.addressLine || '',
        landmark: currentLocation.isGps ? 'GPS Detected' : '',
        city: currentLocation.city || '',
        district: currentLocation.locality || '',
        postalCode: currentLocation.postalCode || '',
        location: {
          latitude: currentLocation.latitude || 0,
          longitude: currentLocation.longitude || 0,
        },
        deliveryInstructions: '',
        isDefault: true,
      });
    }
  }, [selectedAddress, currentLocation, setSelectedAddress, user?.id]);

  // Recalculate pricing with authoritative backend pricing engine
  useEffect(() => {
    if (!restaurantId || validItems.length === 0 || !selectedAddress) return;

    let isMounted = true;
    const calculatePricing = async () => {
      setIsCalculating(true);
      try {
        const payload = {
          restaurantId,
          customerLocation: selectedAddress.location || {
            latitude: currentLocation?.latitude || 26.18,
            longitude: currentLocation?.longitude || 91.75,
          },
          items: validItems.map((i) => ({
            menuItemId: i.menuItem?.id || (i as any).menuItemId || (i as any).id,
            quantity: i.quantity || 1,
            price: i.menuItem?.price || (i as any).price,
          })),
          couponCode: appliedCoupon || undefined,
        };

        const res = await apiRequest<any>('/pricing/calculate', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (isMounted && res.success && res.data) {
          setPricing(res.data);
        }
      } catch (err) {
        console.warn('[Checkout] Pricing calculation fallback in use:', err);
      } finally {
        if (isMounted) setIsCalculating(false);
      }
    };

    calculatePricing();
    return () => {
      isMounted = false;
    };
  }, [restaurantId, validItems, selectedAddress, appliedCoupon, currentLocation]);

  // Authoritative, normalized pricing numbers with safe fallbacks
  const pricingDetails = useMemo(() => {
    const subtotalFromItems = validItems.reduce(
      (sum, it) => sum + (it.subtotal || ((it.menuItem?.price || 180) * (it.quantity || 1))),
      0
    );
    const defaultPackaging = 20;
    const defaultDelivery = 25;
    const defaultTax = Math.round(subtotalFromItems * 0.05);
    const defaultDiscount = appliedCoupon ? 50 : 0;
    const defaultTotal = Math.max(
      0,
      subtotalFromItems + defaultPackaging + defaultDelivery + defaultTax - defaultDiscount
    );

    if (!pricing) {
      return {
        subtotal: subtotalFromItems,
        deliveryFee: defaultDelivery,
        packagingFee: defaultPackaging,
        tax: defaultTax,
        discount: defaultDiscount,
        total: defaultTotal,
        distanceKm: 2.5,
      };
    }

    const p = pricing.pricing || pricing;
    const subtotal = Number(p.subtotal ?? subtotalFromItems);
    const deliveryFee = Number(p.deliveryFee ?? p.delivery_fee ?? defaultDelivery);
    const packagingFee = Number(p.packagingFee ?? p.packaging_fee ?? defaultPackaging);
    const tax = Number(p.tax ?? p.taxAmount ?? Math.round(subtotal * 0.05));
    const discount = Number(p.discount ?? p.discountAmount ?? (appliedCoupon ? 50 : 0));
    const total = Number(
      p.total ??
        p.totalCustomerPrice ??
        Math.max(0, subtotal + deliveryFee + packagingFee + tax - discount)
    );
    const distanceKm = Number(pricing.distanceKm ?? 2.5);

    return {
      subtotal,
      deliveryFee,
      packagingFee,
      tax,
      discount,
      total,
      distanceKm,
    };
  }, [pricing, validItems, appliedCoupon]);

  if (validItems.length === 0) {
    return (
      <div className="p-8 text-center space-y-4 pt-20 animate-page-enter">
        <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
          🍲
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-800">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Choose authentic ethnic delicacies from our kitchens to continue with checkout.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 btn-press transition-all cursor-pointer"
        >
          Browse Menus
        </button>
      </div>
    );
  }

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.addressLine1.trim()) {
      toast.error('Validation', 'Please provide an address line');
      return;
    }
    const created = await addAddress(newAddr);
    if (created) {
      setShowNewAddrInput(false);
      setIsAddressSheetOpen(false);
      setSelectedAddress(created);
      toast.success('Address Added', 'Delivery location updated.');
    }
  };

  const handlePlaceOrder = async (isWhatsApp = false) => {
    if (!selectedAddress) {
      toast.error('Address Required', 'Please select or add a delivery address');
      setIsAddressSheetOpen(true);
      return;
    }

    setIsSubmitting(true);
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const orderPayload = {
        restaurantId: restaurantId || 'd0000000-0000-0000-0000-000000000001',
        restaurantName: restaurantName || 'Aajori Kitchen',
        deliveryAddressId: selectedAddress.id,
        items: validItems.map((i) => ({
          menuItemId: i.menuItem?.id || (i as any).menuItemId || (i as any).id,
          name: i.menuItem?.name || (i as any).name || 'Dish',
          price: i.menuItem?.price || (i as any).price || 180,
          quantity: i.quantity || 1,
          variantId: i.selectedVariant?.id,
          addonIds: (i.selectedAddons || []).map((a) => a.id),
        })),
        paymentMethod: isWhatsApp ? 'CASH_ON_DELIVERY' : paymentMethod,
        customerInstructions: customerInstructions.trim() || undefined,
        couponCode: appliedCoupon || undefined,
        idempotencyKey,
      };

      const res = await apiRequest<any>('/orders', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(orderPayload),
      });

      if (res.success && res.data) {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch (_) {}

        const confirmedOrderNumber = res.data.orderNumber || res.data.id || 'Confirmed';
        toast.success('Order Placed! 🚀', `Order #${confirmedOrderNumber} confirmed.`);
        clearCart();

        if (isWhatsApp) {
          const itemsText = validItems
            .map(
              (i) =>
                `• ${i.quantity}x ${i.menuItem?.name || (i as any).name || 'Dish'} (₹${
                  i.subtotal || (i.menuItem?.price || 180) * (i.quantity || 1)
                })`
            )
            .join('\n');

          const waText = encodeURIComponent(
            `*🔔 New Aajori Order Placed*\n\n` +
              `*Order:* #${confirmedOrderNumber}\n` +
              `*Kitchen:* ${restaurantName || 'Aajori Cuisine'}\n\n` +
              `*Items:*\n${itemsText}\n\n` +
              `*Delivery Address:* ${selectedAddress.addressLine1}${selectedAddress.city ? `, ${selectedAddress.city}` : ''}\n` +
              `*Payment:* ${isWhatsApp ? 'Cash on Delivery (COD)' : paymentMethod}\n\n` +
              `*Live Track Link:* ${window.location.origin}/orders/${res.data.id}${
                res.data.trackingToken ? `?token=${res.data.trackingToken}` : ''
              }`
          );
          window.open(`https://api.whatsapp.com/send?phone=919864000000&text=${waText}`, '_blank');
        }

        navigate(
          `/orders/${res.data.id}${res.data.trackingToken ? `?token=${res.data.trackingToken}` : ''}`
        );
      } else {
        toast.error('Order Failed', res.error?.message || 'Server rejected order request. Please retry.');
      }
    } catch (err: any) {
      toast.error('Error', err?.message || 'Could not dispatch order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-32 animate-page-enter">
      {/* 1. Mobile Checkout Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-stone-200 safe-top">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-700 btn-press cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center min-w-0 px-2 flex-1">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Checkout & Payment
          </h2>
          <p className="text-[11px] text-brand-700 font-bold truncate max-w-[200px] mx-auto">
            {restaurantName || 'Aajori Cuisine Kitchen'}
          </p>
        </div>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-4">
        {/* 2. Delivery Address Card */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-extrabold text-slate-900">Delivery Address</h3>
            </div>
            <button
              onClick={() => setIsAddressSheetOpen(true)}
              className="text-[11px] font-bold text-brand-600 hover:underline cursor-pointer"
            >
              {selectedAddress ? 'Change' : 'Select'}
            </button>
          </div>

          {selectedAddress ? (
            <div className="text-xs text-slate-600 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
              <span className="font-bold text-slate-900 block">
                {selectedAddress.label || 'Delivery Address'}
              </span>
              <p className="leading-snug mt-0.5">
                {selectedAddress.addressLine1}
                {selectedAddress.landmark ? `, Near ${selectedAddress.landmark}` : ''}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {[selectedAddress.city, selectedAddress.district, selectedAddress.postalCode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setIsAddressSheetOpen(true)}
              className="w-full py-3 border border-dashed border-brand-300 rounded-xl text-xs font-bold text-brand-700 bg-brand-50/50 hover:bg-brand-50 transition-colors cursor-pointer"
            >
              + Tap to Choose Delivery Address
            </button>
          )}
        </div>

        {/* 3. Items Ordered Card */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900">Items Ordered</h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {validItems.length} {validItems.length === 1 ? 'dish' : 'dishes'}
            </span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {validItems.map((i) => {
              const name = i.menuItem?.name || (i as any).name || 'Delicacy';
              const lineTotal = i.subtotal || ((i.menuItem?.price || 180) * (i.quantity || 1));
              return (
                <div key={i.id || (i as any).menuItemId} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    <strong className="text-brand-700">{i.quantity || 1}x</strong> {name}
                  </span>
                  <span className="font-black text-slate-900">₹{lineTotal}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Instructions note */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1.5">
          <h3 className="text-xs font-extrabold text-slate-900">Delivery Instructions (Optional)</h3>
          <input
            type="text"
            value={customerInstructions}
            onChange={(e) => setCustomerInstructions(e.target.value)}
            placeholder="e.g. Ring bell twice, leave at gate"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* 5. Payment Method Selector */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
          <h3 className="text-xs font-extrabold text-slate-900">Payment Option</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('UPI')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                paymentMethod === 'UPI'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-600'
                  : 'border-stone-200 text-slate-700 hover:bg-stone-50'
              }`}
            >
              <QrCode className="w-4 h-4 mx-auto mb-1 text-brand-600" />
              <span className="text-[10px] block font-bold leading-tight">UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                paymentMethod === 'CARD'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-600'
                  : 'border-stone-200 text-slate-700 hover:bg-stone-50'
              }`}
            >
              <CreditCard className="w-4 h-4 mx-auto mb-1 text-brand-600" />
              <span className="text-[10px] block font-bold leading-tight">Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                paymentMethod === 'CASH_ON_DELIVERY'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-600'
                  : 'border-stone-200 text-slate-700 hover:bg-stone-50'
              }`}
            >
              <Banknote className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
              <span className="text-[10px] block font-bold leading-tight">Cash on Del</span>
            </button>
          </div>
        </div>

        {/* 6. Authoritative Pricing Summary */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2 text-xs">
          <h3 className="text-xs font-extrabold text-slate-900">Bill Details</h3>

          {isCalculating ? (
            <div className="space-y-2 py-2">
              <div className="h-3 rounded shimmer-gradient"></div>
              <div className="h-3 rounded shimmer-gradient"></div>
              <div className="h-3 rounded shimmer-gradient"></div>
            </div>
          ) : (
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Item Subtotal</span>
                <span className="font-bold text-slate-900">₹{pricingDetails.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery ({pricingDetails.distanceKm} km PostGIS)</span>
                <span className="font-bold text-slate-900">₹{pricingDetails.deliveryFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Restaurant Packaging</span>
                <span className="font-bold text-slate-900">₹{pricingDetails.packagingFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Govt Taxes (5% GST)</span>
                <span className="font-bold text-slate-900">₹{pricingDetails.tax}</span>
              </div>
              {pricingDetails.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{pricingDetails.discount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-black text-slate-900">
                <span>To Pay</span>
                <span className="text-brand-700">₹{pricingDetails.total}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7. Fixed Bottom Pay Action Bar with WhatsApp and Web Checkout */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-stone-200 p-3.5 safe-bottom shadow-xl">
        <div className="flex items-center justify-between gap-2.5">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold leading-tight">
              Total to Pay
            </span>
            <span className="text-lg font-black text-slate-900 leading-tight">
              ₹{pricingDetails.total}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePlaceOrder(true)}
              disabled={isSubmitting || !selectedAddress || isCalculating}
              className="py-3 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 text-xs btn-press disabled:opacity-50 cursor-pointer"
              title="Order via WhatsApp"
            >
              <span>💬 WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => handlePlaceOrder(false)}
              disabled={isSubmitting || !selectedAddress || isCalculating}
              className="py-3 px-4.5 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-1 text-xs btn-press disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <span>Confirming...</span> : <span>PAY NOW &rarr;</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Address Selection Bottom Sheet with Smooth Spring Slide */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-350 ease-out ${
          isAddressSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          onClick={() => setIsAddressSheetOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />

        <div
          className={`w-full max-w-md bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl safe-bottom relative z-10 transition-transform duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isAddressSheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto"></div>

          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">Select Delivery Location</h3>
            <button
              onClick={() => setIsAddressSheetOpen(false)}
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-500 hover:text-slate-700 btn-press cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* List addresses */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {(addresses || []).map((a) => (
              <div
                key={a.id}
                onClick={() => {
                  setSelectedAddress(a);
                  setIsAddressSheetOpen(false);
                }}
                className={`p-3.5 rounded-2xl border text-sm cursor-pointer transition-all ${
                  selectedAddress?.id === a.id
                    ? 'border-brand-500 bg-brand-50 text-brand-900 font-bold'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                }`}
              >
                <p className="font-extrabold text-slate-900">{a.label}</p>
                <p className="text-xs text-slate-600 mt-0.5">{a.addressLine1}</p>
              </div>
            ))}
          </div>

          {/* New address toggle */}
          {!showNewAddrInput ? (
            <button
              onClick={() => setShowNewAddrInput(true)}
              className="w-full py-3 border-2 border-dashed border-brand-400 rounded-2xl text-xs font-black text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors btn-press cursor-pointer"
            >
              + Add New Delivery Location
            </button>
          ) : (
            <form onSubmit={handleAddNewAddress} className="space-y-2.5 pt-2 border-t border-stone-100">
              <input
                type="text"
                required
                value={newAddr.addressLine1}
                onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
                placeholder="Flat/House No, Road"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newAddr.landmark}
                  onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                  placeholder="Landmark (Near GMCH)"
                  className="px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <input
                  type="text"
                  value={newAddr.postalCode}
                  onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                  placeholder="Pin (781001)"
                  className="px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black tracking-wide btn-press shadow-xs cursor-pointer"
              >
                Save & Select Address
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
