import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLocationContext } from '../context/LocationContext';
import { apiRequest } from '../services/api';
import { PaymentMethod } from '../types';

export const CheckoutPage: React.FC = () => {
  const { items, restaurantId, restaurantName, appliedCoupon, clearCart } = useCart();
  const { isAuthenticated, user, addresses, selectedAddress, setSelectedAddress, addAddress, openAuthModal } =
    useAuth();
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
    label: 'Home',
    addressLine1: '',
    landmark: '',
    city: currentLocation?.city || '',
    postalCode: currentLocation?.postalCode || '',
    latitude: currentLocation?.latitude || 0,
    longitude: currentLocation?.longitude || 0,
  });

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
        addressLine1: currentLocation.name,
        addressLine2: currentLocation.addressLine,
        landmark: currentLocation.isGps ? 'GPS Detected' : '',
        city: currentLocation.city || '',
        district: currentLocation.locality || '',
        postalCode: currentLocation.postalCode || '',
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        deliveryInstructions: '',
        isDefault: true,
      });
    }
  }, [selectedAddress, currentLocation, setSelectedAddress, user?.id]);

  // Recalculate pricing with authoritative backend pricing engine
  useEffect(() => {
    if (!restaurantId || items.length === 0 || !selectedAddress) return;

    const calculatePricing = async () => {
      setIsCalculating(true);
      try {
        const payload = {
          restaurantId,
          customerLocation: selectedAddress.location,
          items: items.map((i) => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
          })),
          couponCode: appliedCoupon || undefined,
        };

        const res = await apiRequest<any>('/pricing/calculate', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res.success && res.data) {
          setPricing(res.data);
        }
      } catch (err) {
        console.error('Pricing calculation error', err);
      } finally {
        setIsCalculating(false);
      }
    };

    calculatePricing();
  }, [restaurantId, items, selectedAddress, appliedCoupon]);

  if (items.length === 0) {
    return (
      <div className="p-8 text-center space-y-3 pt-20">
        <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto text-2xl">
          🍲
        </div>
        <h2 className="text-base font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Add delicious Assamese dishes to order.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 text-white font-bold text-xs"
        >
          Browse Menus
        </button>
      </div>
    );
  }

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.addressLine1.trim()) {
      toast.error('Validation', 'Please provide an address');
      return;
    }
    const created = await addAddress(newAddr);
    if (created) {
      setShowNewAddrInput(false);
      setIsAddressSheetOpen(false);
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
        restaurantId,
        deliveryAddressId: selectedAddress.id,
        items: items.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
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

        toast.success('Order Placed!', `Order #${res.data.orderNumber} confirmed.`);
        clearCart();

        if (isWhatsApp) {
          // Format WhatsApp message
          const itemsText = items.map((i) => `• ${i.quantity}x ${i.menuItem.name} (₹${i.subtotal})`).join('\n');
          const waText = encodeURIComponent(
            `*🔔 New Aajori Order Placed*\n\n` +
            `*Order:* #${res.data.orderNumber}\n` +
            `*Kitchen:* ${restaurantName}\n\n` +
            `*Items:*\n${itemsText}\n\n` +
            `*Total Payable:* ₹${res.data.pricing?.totalCustomerPrice || pricing?.pricing?.total}\n` +
            `*Delivery Address:* ${selectedAddress.addressLine1}, ${selectedAddress.city}\n` +
            `*Payment:* ${isWhatsApp ? 'Cash on Delivery (COD)' : paymentMethod}\n\n` +
            `*Live Track Link:* ${window.location.origin}/orders/${res.data.id}?token=${res.data.trackingToken || res.data.id}`
          );
          window.open(`https://api.whatsapp.com/send?phone=919864000000&text=${waText}`, '_blank');
        }

        navigate(`/orders/${res.data.id}${res.data.trackingToken ? `?token=${res.data.trackingToken}` : ''}`);
      } else {
        toast.error('Order Failed', res.error?.message || 'Server rejected order request');
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Could not dispatch order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-32 animate-page-enter">
      {/* 1. Mobile Checkout Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b border-stone-200 safe-top">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-700 btn-press"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Checkout
          </h2>
          <p className="text-[10px] text-brand-700 font-bold truncate max-w-[200px]">
            {restaurantName}
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
              className="text-[11px] font-bold text-brand-600 hover:underline"
            >
              {selectedAddress ? 'Change' : 'Select'}
            </button>
          </div>

          {selectedAddress ? (
            <div className="text-xs text-slate-600 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
              <span className="font-bold text-slate-900 block">{selectedAddress.label}</span>
              <p className="leading-snug">
                {selectedAddress.addressLine1}
                {selectedAddress.landmark ? `, Near ${selectedAddress.landmark}` : ''}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {selectedAddress.city}, Kamrup Metro - {selectedAddress.postalCode}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setIsAddressSheetOpen(true)}
              className="w-full py-3 border border-dashed border-brand-300 rounded-xl text-xs font-bold text-brand-700 bg-brand-50/50"
            >
              + Tap to Choose Delivery Address
            </button>
          )}
        </div>

        {/* 3. Items Ordered Card */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <h3 className="text-xs font-extrabold text-slate-900">Items Ordered</h3>
          <div className="divide-y divide-stone-100 text-xs">
            {items.map((i) => (
              <div key={i.id} className="py-2 flex items-center justify-between">
                <span className="font-medium text-slate-800">
                  <strong className="text-brand-700">{i.quantity}x</strong> {i.menuItem.name}
                </span>
                <span className="font-black text-slate-900">₹{i.subtotal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Instructions note */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1.5">
          <h3 className="text-xs font-extrabold text-slate-900">Delivery Note</h3>
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
              className={`p-2.5 rounded-xl border text-center transition-all ${
                paymentMethod === 'UPI'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-600'
                  : 'border-stone-200 text-slate-700'
              }`}
            >
              <QrCode className="w-4 h-4 mx-auto mb-1 text-brand-600" />
              <span className="text-[10px] block font-bold leading-tight">UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                paymentMethod === 'CARD'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-600'
                  : 'border-stone-200 text-slate-700'
              }`}
            >
              <CreditCard className="w-4 h-4 mx-auto mb-1 text-brand-600" />
              <span className="text-[10px] block font-bold leading-tight">Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                paymentMethod === 'CASH_ON_DELIVERY'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-600'
                  : 'border-stone-200 text-slate-700'
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
          ) : pricing ? (
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Item Subtotal</span>
                <span className="font-bold text-slate-900">₹{pricing.pricing.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery ({pricing.distanceKm} km PostGIS)</span>
                <span className="font-bold text-slate-900">₹{pricing.pricing.deliveryFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Restaurant Packaging</span>
                <span className="font-bold text-slate-900">₹{pricing.pricing.packagingFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Govt Taxes (5% GST)</span>
                <span className="font-bold text-slate-900">₹{pricing.pricing.tax}</span>
              </div>
              {pricing.pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{pricing.pricing.discount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-black text-slate-900">
                <span>To Pay</span>
                <span className="text-brand-700">₹{pricing.pricing.total}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-[11px]">Select address to view calculation</p>
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
              ₹{pricing?.pricing?.total || '---'}
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
              className="py-3 px-4.5 bg-gradient-to-r from-brand-600 to-amber-600 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-1 text-xs btn-press disabled:opacity-50 cursor-pointer"
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
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-500 hover:text-slate-700 btn-press"
            >
              ✕
            </button>
          </div>

          {/* List addresses */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {addresses.map((a) => (
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
              className="w-full py-3 border-2 border-dashed border-brand-400 rounded-2xl text-xs font-black text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors btn-press"
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
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newAddr.landmark}
                  onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                  placeholder="Landmark (Near GMCH)"
                  className="px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
                />
                <input
                  type="text"
                  value={newAddr.postalCode}
                  onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                  placeholder="Pin (781001)"
                  className="px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black tracking-wide btn-press shadow-xs"
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
