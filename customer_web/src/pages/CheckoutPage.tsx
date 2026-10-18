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
  UtensilsCrossed,
  Receipt,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLocationContext } from '../context/LocationContext';
import { useSettings } from '../context/SettingsContext';
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
  const { settings } = useSettings();
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
        const custLat = Number(
          selectedAddress.latitude ??
            (selectedAddress as any).location?.latitude ??
            currentLocation?.latitude
        );
        const custLng = Number(
          selectedAddress.longitude ??
            (selectedAddress as any).location?.longitude ??
            currentLocation?.longitude
        );

        const payload = {
          restaurantId,
          customerLocation:
            !isNaN(custLat) && !isNaN(custLng) && custLat !== 0 && custLng !== 0
              ? { latitude: custLat, longitude: custLng }
              : undefined,
          items: validItems.map((i) => ({
            menuItemId: i.menuItem?.id || (i as any).menuItemId || (i as any).id,
            quantity: i.quantity || 1,
            price: i.menuItem?.price || (i as any).price || (i as any).unitPrice || 0,
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
      (sum, it) =>
        sum +
        (it.subtotal ||
          (Number(it.menuItem?.price || (it as any).price || 0) * (it.quantity || 1))),
      0
    );
    const defaultPackaging = 0;
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
        distanceKm: 2.0,
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
    const distanceKm = Number(pricing.distanceKm ?? 2.0);

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

  // Instruction quick chips helper
  const handleAddInstructionChip = (chip: string) => {
    setCustomerInstructions((prev) => {
      if (!prev.trim()) return chip;
      if (prev.includes(chip)) return prev;
      return `${prev}, ${chip}`;
    });
  };

  if (validItems.length === 0) {
    return (
      <div className="p-8 text-center space-y-4 pt-24 animate-page-enter">
        <div className="w-20 h-20 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto text-4xl shadow-inner">
          🍲
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-slate-800">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Choose authentic ethnic delicacies from our traditional kitchens to continue with checkout.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/20 btn-press transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Browse Menus</span>
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
      const custLat = Number(
        selectedAddress.latitude ??
          (selectedAddress as any).location?.latitude ??
          currentLocation?.latitude
      );
      const custLng = Number(
        selectedAddress.longitude ??
          (selectedAddress as any).location?.longitude ??
          currentLocation?.longitude
      );

      const resolvedDeliveryAddress = {
        id: selectedAddress.id,
        label: selectedAddress.label || 'Delivery Address',
        addressLine1: selectedAddress.addressLine1 || '',
        addressLine2: (selectedAddress as any).addressLine2 || '',
        landmark: selectedAddress.landmark || '',
        city: selectedAddress.city || '',
        district: (selectedAddress as any).district || '',
        postalCode: selectedAddress.postalCode || '',
        latitude: !isNaN(custLat) ? custLat : undefined,
        longitude: !isNaN(custLng) ? custLng : undefined,
      };

      const orderPayload = {
        customerId: user?.id,
        customerName: user?.fullName || (user as any)?.name || 'Valued Customer',
        customerPhone: user?.phone || '',
        restaurantId: restaurantId || '',
        restaurantName: restaurantName || 'Aajori Cuisine Kitchen',
        deliveryAddressId: selectedAddress.id,
        deliveryAddress: resolvedDeliveryAddress,
        deliveryDistanceKm: pricingDetails.distanceKm,
        items: validItems.map((i) => ({
          menuItemId: i.menuItem?.id || (i as any).menuItemId || (i as any).id,
          name: i.menuItem?.name || (i as any).name || 'Dish',
          price: i.menuItem?.price || (i as any).price || (i as any).unitPrice || 0,
          quantity: i.quantity || 1,
          variantId: i.selectedVariant?.id,
          addonIds: (i.selectedAddons || []).map((a) => a.id),
        })),
        subtotal: pricingDetails.subtotal,
        deliveryFee: pricingDetails.deliveryFee,
        packagingFee: pricingDetails.packagingFee,
        tax: pricingDetails.tax,
        discount: pricingDetails.discount,
        total: pricingDetails.total,
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
          confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
        } catch (_) {}

        const confirmedOrderNumber = res.data.orderNumber || res.data.id || 'Confirmed';
        toast.success('Order Placed! 🚀', `Order #${confirmedOrderNumber} confirmed.`);
        clearCart();

        if (isWhatsApp) {
          const itemsText = validItems
            .map(
              (i) =>
                `• ${i.quantity}x ${i.menuItem?.name || (i as any).name || 'Dish'} (₹${
                  i.subtotal ||
                  Number(i.menuItem?.price || (i as any).price || 0) * (i.quantity || 1)
                })`
            )
            .join('\n');

          const waText = encodeURIComponent(
            `*🔔 New Aajori Order Placed*\n\n` +
              `*Order:* #${confirmedOrderNumber}\n` +
              `*Kitchen:* ${restaurantName || 'Aajori Cuisine'}\n\n` +
              `*Items:*\n${itemsText}\n\n` +
              `*Total Amount:* ₹${pricingDetails.total}\n` +
              `*Delivery Address:* ${selectedAddress.addressLine1}${
                selectedAddress.city ? `, ${selectedAddress.city}` : ''
              }\n` +
              `*Payment:* ${isWhatsApp ? 'Cash on Delivery (COD)' : paymentMethod}\n\n` +
              `*Live Track Link:* ${window.location.origin}/orders/${res.data.id}${
                res.data.trackingToken ? `?token=${res.data.trackingToken}` : ''
              }`
          );
          const waPhone = (settings.whatsappOrderingPhone || '916002308541').replace(/[^0-9]/g, '');
          window.open(
            `https://api.whatsapp.com/send?phone=${waPhone}&text=${waText}`,
            '_blank'
          );
        }

        navigate(
          `/orders/${res.data.id}${res.data.trackingToken ? `?token=${res.data.trackingToken}` : ''}`
        );
      } else {
        toast.error(
          'Order Failed',
          res.error?.message || 'Server rejected order request. Please retry.'
        );
      }
    } catch (err: any) {
      toast.error('Error', err?.message || 'Could not dispatch order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-36 bg-stone-50/60 min-h-screen animate-page-enter">
      {/* 1. Mobile Checkout Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-stone-200 shadow-2xs safe-top">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-slate-700 btn-press cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center min-w-0 px-2 flex-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
              Review & Pay
            </span>
          </div>
          <p className="text-xs text-slate-800 font-extrabold truncate max-w-[220px] mx-auto mt-0.5">
            {restaurantName || 'Aajori Cuisine Kitchen'}
          </p>
        </div>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-3.5 max-w-md mx-auto">
        {/* 2. Delivery Address Card */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 leading-tight">Delivery Location</h3>
                <span className="text-[10px] text-slate-400 font-medium">Delivered to your doorstep</span>
              </div>
            </div>
            <button
              onClick={() => setIsAddressSheetOpen(true)}
              className="text-[11px] font-extrabold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
            >
              {selectedAddress ? 'Change' : '+ Select'}
            </button>
          </div>

          {selectedAddress ? (
            <div className="text-xs text-slate-600 bg-stone-50/80 p-3 rounded-xl border border-stone-200/70">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-extrabold text-slate-900 text-xs">
                  {selectedAddress.label || 'Delivery Address'}
                </span>
                {selectedAddress.isDefault && (
                  <span className="text-[9px] font-bold text-brand-600 bg-brand-100/60 px-1.5 py-0.2 rounded-md">
                    Default
                  </span>
                )}
              </div>
              <p className="leading-snug text-slate-700 font-medium">
                {selectedAddress.addressLine1}
                {selectedAddress.landmark ? `, Near ${selectedAddress.landmark}` : ''}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {[selectedAddress.city, (selectedAddress as any).district, selectedAddress.postalCode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setIsAddressSheetOpen(true)}
              className="w-full py-3.5 border border-dashed border-brand-300 rounded-xl text-xs font-extrabold text-brand-700 bg-brand-50/50 hover:bg-brand-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-brand-600" />
              <span>Tap to Choose Delivery Address</span>
            </button>
          )}
        </div>

        {/* 3. Items Ordered Card with Food Images & Veg/Non-Veg Indicators */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900">Items Ordered</h3>
            </div>
            <span className="text-[11px] font-extrabold text-slate-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {validItems.length} {validItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {validItems.map((i) => {
              const name = i.menuItem?.name || (i as any).name || 'Delicacy';
              const unitPrice = Number(
                i.menuItem?.price || (i as any).price || (i as any).unitPrice || 0
              );
              const qty = i.quantity || 1;
              const lineTotal = i.subtotal || unitPrice * qty;
              const isVeg = Boolean(i.menuItem?.isVeg ?? (i as any).isVeg);
              const imageUrl = i.menuItem?.imageUrl || (i as any).imageUrl || (i as any).image;

              return (
                <div
                  key={i.id || (i as any).menuItemId}
                  className="py-3 flex items-center gap-3 first:pt-1 last:pb-1"
                >
                  {/* Dish Thumbnail Image with Safe Fallback */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 flex-shrink-0 relative shadow-2xs">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide broken image and fallback to ethnic icon
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 text-amber-700 text-lg">
                        🍲
                      </div>
                    )}
                  </div>

                  {/* Dish Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {/* Veg / Non-Veg Indicator Dot */}
                      <span
                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center flex-shrink-0 ${
                          isVeg ? 'border-emerald-600' : 'border-rose-600'
                        }`}
                        title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                        {name}
                      </h4>
                    </div>

                    {/* Variant or Addons if selected */}
                    {i.selectedVariant && (
                      <span className="text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded font-semibold inline-block mt-0.5">
                        {i.selectedVariant.name}
                      </span>
                    )}

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span className="font-semibold text-slate-600">₹{unitPrice}</span>
                      <span>×</span>
                      <span className="font-black text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded-md">
                        {qty}
                      </span>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-slate-900 block">₹{lineTotal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Delivery Instructions */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900">Delivery Instructions (Optional)</h3>
            <span className="text-[10px] text-slate-400">For rider</span>
          </div>

          {/* Quick-tap instruction chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              'Leave at door',
              "Don't ring bell",
              'Avoid calling',
              'Directions to gate',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleAddInstructionChip(chip)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-stone-200 bg-stone-50 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 text-slate-600 transition-colors cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={customerInstructions}
            onChange={(e) => setCustomerInstructions(e.target.value)}
            placeholder="e.g. Ring bell twice, leave with security at gate"
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
          />
        </div>

        {/* 5. Payment Method Selector */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900">Choose Payment Method</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              100% Secure
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* UPI Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod('UPI')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                paymentMethod === 'UPI'
                  ? 'border-brand-600 bg-brand-50/60 text-brand-800 font-bold ring-1 ring-brand-600 shadow-2xs'
                  : 'border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-brand-100/70 text-brand-600 flex items-center justify-center mx-auto mb-1.5">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-[11px] block font-black leading-tight">UPI / QR</span>
              <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Fastest</span>
            </button>

            {/* Card Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                paymentMethod === 'CARD'
                  ? 'border-brand-600 bg-brand-50/60 text-brand-800 font-bold ring-1 ring-brand-600 shadow-2xs'
                  : 'border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1.5">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[11px] block font-black leading-tight">Cards</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Visa/Master</span>
            </button>

            {/* COD Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                paymentMethod === 'CASH_ON_DELIVERY'
                  ? 'border-brand-600 bg-brand-50/60 text-brand-800 font-bold ring-1 ring-brand-600 shadow-2xs'
                  : 'border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
                <Banknote className="w-4 h-4" />
              </div>
              <span className="text-[11px] block font-black leading-tight">Cash (COD)</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Pay on delivery</span>
            </button>
          </div>
        </div>

        {/* 6. Clean Bill Details (Zero Technical Jargon) */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-2.5 text-xs">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-black text-slate-900">Bill Summary</h3>
          </div>

          {isCalculating ? (
            <div className="space-y-2.5 py-2">
              <div className="h-3 rounded shimmer-gradient"></div>
              <div className="h-3 rounded shimmer-gradient"></div>
              <div className="h-3 rounded shimmer-gradient"></div>
            </div>
          ) : (
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between items-center">
                <span>Item Subtotal</span>
                <span className="font-bold text-slate-900">₹{pricingDetails.subtotal}</span>
              </div>

              {/* Clean delivery fee with distance in km */}
              <div className="flex justify-between items-center">
                <span>
                  Delivery Fee{' '}
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({pricingDetails.distanceKm > 0 ? `${pricingDetails.distanceKm} km` : 'Standard'})
                  </span>
                </span>
                <span className="font-bold text-slate-900">₹{pricingDetails.deliveryFee}</span>
              </div>

              {/* Restaurant packaging fee (only if set) */}
              {pricingDetails.packagingFee > 0 && (
                <div className="flex justify-between items-center">
                  <span>Restaurant Packaging</span>
                  <span className="font-bold text-slate-900">₹{pricingDetails.packagingFee}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Govt Taxes (5% GST)</span>
                <span className="font-bold text-slate-900">₹{pricingDetails.tax}</span>
              </div>

              {pricingDetails.discount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-bold bg-emerald-50/70 px-2 py-1 rounded-lg">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Coupon Discount</span>
                  </span>
                  <span>-₹{pricingDetails.discount}</span>
                </div>
              )}

              <div className="pt-2.5 border-t border-stone-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Amount to Pay</span>
                <span className="text-brand-700 text-base">₹{pricingDetails.total}</span>
              </div>
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Authentic Ethnic Cuisine • Hygienically Prepared</span>
          </div>
        </div>
      </div>

      {/* 7. Fixed Bottom Pay Action Bar (Completely Unobstructed) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-stone-200 p-3.5 safe-bottom shadow-xl">
        <div className="flex items-center justify-between gap-3">
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
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => handlePlaceOrder(false)}
              disabled={isSubmitting || !selectedAddress || isCalculating}
              className="py-3 px-5 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-black rounded-2xl shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-1.5 text-xs btn-press disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Placing Order...</span>
              ) : (
                <>
                  <span>PAY NOW</span>
                  <span className="text-white/80">&rarr;</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 8. Address Selection Bottom Sheet */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ease-out ${
          isAddressSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          onClick={() => setIsAddressSheetOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />

        <div
          className={`w-full max-w-md bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl safe-bottom relative z-10 transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isAddressSheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto"></div>

          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Select Delivery Location</h3>
            <button
              onClick={() => setIsAddressSheetOpen(false)}
              className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-slate-500 hover:text-slate-700 btn-press cursor-pointer text-xs"
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
                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                  selectedAddress?.id === a.id
                    ? 'border-brand-500 bg-brand-50/60 text-brand-900 font-bold ring-1 ring-brand-400'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                }`}
              >
                <div>
                  <p className="font-black text-slate-900">{a.label || 'Saved Address'}</p>
                  <p className="text-slate-600 mt-0.5 font-medium leading-snug">{a.addressLine1}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {[a.city, (a as any).district, a.postalCode].filter(Boolean).join(', ')}
                  </p>
                </div>
                {selectedAddress?.id === a.id && (
                  <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* New address toggle */}
          {!showNewAddrInput ? (
            <button
              onClick={() => setShowNewAddrInput(true)}
              className="w-full py-3 border-2 border-dashed border-brand-400 rounded-2xl text-xs font-black text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors btn-press cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Delivery Location</span>
            </button>
          ) : (
            <form onSubmit={handleAddNewAddress} className="space-y-2.5 pt-2 border-t border-stone-100">
              <input
                type="text"
                required
                value={newAddr.addressLine1}
                onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
                placeholder="Flat / House No, Road, Locality"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newAddr.landmark}
                  onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                  placeholder="Landmark (Optional)"
                  className="px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <input
                  type="text"
                  value={newAddr.postalCode}
                  onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                  placeholder="PIN Code"
                  className="px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
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
