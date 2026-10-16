import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Bike,
  Phone,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Package,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Order, OrderStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { SkeletonOrderTracking } from '../components/SkeletonLoaders';

const LIFECYCLE_STEPS: Array<{ key: OrderStatus; label: string; desc: string }> = [
  { key: 'CREATED', label: 'Order Confirmed', desc: 'Received & awaiting kitchen' },
  { key: 'RESTAURANT_ACCEPTED', label: 'Kitchen Accepted', desc: 'Order entered queue' },
  { key: 'PREPARING', label: 'Preparing Delicacies', desc: 'Charcoal & ethnic spices' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Packaged & hot' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider en route via PostGIS' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your authentic meal!' },
];

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchOrder = async (showLoading = false) => {
    if (!id && !token) return;
    if (showLoading) setIsLoading(true);
    try {
      // First try token endpoint if token present, or fallback to standard authenticated endpoint
      const trackingTarget = token || id;
      let res = await apiRequest<{ order: Order; history: any[] }>(`/orders/${trackingTarget}`);
      if (!res.success && trackingTarget) {
        // Try public token endpoint
        res = await apiRequest<any>(`/orders/track/${trackingTarget}`);
      }

      if (res.success && res.data) {
        const orderData = (res.data as any).order || res.data;
        setOrder(orderData);
        setLastRefreshed(new Date());

        if (orderData.restaurantId && !restaurant) {
          const restRes = await apiRequest<any>(`/restaurants/${orderData.restaurantId}`);
          if (restRes.success && restRes.data) {
            setRestaurant(restRes.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to poll order status', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder(true);
  }, [id]);

  // Real-time polling every 3 seconds to sync with Admin Panel!
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrder(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order) return;
    const confirm = window.confirm('Cancel this order?');
    if (!confirm) return;

    setIsCancelling(true);
    try {
      const res = await apiRequest(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          toStatus: 'CANCELLED',
          reason: 'Customer cancelled from mobile app',
        }),
      });

      if (res.success) {
        toast.info('Order Cancelled', 'Order cancelled successfully');
        fetchOrder(false);
      } else {
        toast.error('Cancellation Failed', res.error?.message);
      }
    } catch (e: any) {
      toast.error('Error', e.message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading && !order) {
    return <SkeletonOrderTracking />;
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-3 pt-20">
        <h2 className="text-base font-bold text-slate-800">Order Not Found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Explore
        </button>
      </div>
    );
  }

  const getStageIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'CREATED':
      case 'PAYMENT_PENDING':
      case 'PAYMENT_CONFIRMED':
        return 0;
      case 'RESTAURANT_ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY_FOR_PICKUP':
        return 3;
      case 'RIDER_ASSIGNED':
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return 4;
      case 'DELIVERED':
        return 5;
      default:
        return 0;
    }
  };

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
  const currentStageIndex = getStageIndex(order.status);

  return (
    <div className="pb-28 animate-page-enter">
      {/* 1. Mobile Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b border-stone-200 safe-top">
        <button
          onClick={() => navigate('/orders')}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-700 btn-press"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-[10px] text-brand-600 font-extrabold uppercase tracking-wider block">
            Live Tracker
          </span>
          <span className="text-xs font-black text-slate-900">
            #{order.orderNumber}
          </span>
        </div>

        <button
          onClick={() => fetchOrder(false)}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-700 btn-press"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4">


        {/* 3. Status & ETA Card */}
        <div className="p-5 bg-gradient-to-br from-stone-900 to-brand-950 text-white rounded-3xl shadow-lg space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-amber-400 text-[10px] font-black uppercase tracking-wider block">
                Estimated Delivery
              </span>
              <h2 className="text-2xl font-black font-serif-culinary">
                {order.status === 'DELIVERED'
                  ? 'Delivered'
                  : isCancelled
                  ? 'Order Cancelled'
                  : 'Arriving in ~25 mins'}
              </h2>
              <p className="text-xs text-stone-300 mt-0.5">
                From: {restaurant?.name || 'Assam Kitchen Institution'}
              </p>
            </div>

            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
              🛵
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-300">
            <span>Status: <strong className="text-amber-300">{order.status.replace(/_/g, ' ')}</strong></span>
            <span>Total: <strong>₹{order.pricing.total}</strong></span>
          </div>
        </div>

        {/* 4. Assigned Rider Card (if assigned) */}
        {order.deliveryPartner && (
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg">
                🛵
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">{order.deliveryPartner.name}</h4>
                <p className="text-[10px] text-slate-500">
                  {order.deliveryPartner.vehicleNumber} • ⭐ {order.deliveryPartner.rating}
                </p>
              </div>
            </div>

            <a
              href={`tel:${order.deliveryPartner.phone}`}
              className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-brand-200 btn-press"
            >
              <Phone className="w-3 h-3 text-brand-600" />
              <span>Call Rider</span>
            </a>
          </div>
        )}

        {/* 5. Vertical Native Stepper */}
        {!isCancelled ? (
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Order Timeline
            </h3>

            <div className="space-y-4 relative pl-2">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isDone = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={step.key} className="flex items-start gap-3 relative">
                    {/* Vertical connecting line */}
                    {idx < LIFECYCLE_STEPS.length - 1 && (
                      <div
                        className={`absolute left-3.5 top-6 bottom-0 w-0.5 -ml-px ${
                          isDone ? 'bg-brand-600' : 'bg-stone-200'
                        }`}
                      ></div>
                    )}

                    {/* Step Icon */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                        isDone
                          ? 'bg-brand-600 text-white'
                          : isCurrent
                          ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                          : 'bg-stone-100 text-slate-400 border border-stone-200'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div className="min-w-0 pt-0.5">
                      <p
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-brand-700' : isDone ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="font-bold">Order Cancelled</p>
          </div>
        )}

        {/* 6. Items & Bill summary card */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Package className="w-3.5 h-3.5 text-brand-600" />
            <span>Items Ordered</span>
          </div>

          <div className="divide-y divide-stone-100">
            {order.items.map((it) => (
              <div key={it.id} className="py-1.5 flex justify-between">
                <span>
                  <strong>{it.quantity}x</strong> {it.name}
                </span>
                <span className="font-bold text-slate-900">₹{it.subtotal}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-100 space-y-1 text-[11px] text-slate-500">
            <div className="flex justify-between">
              <span>Delivery ({order.deliveryDistanceKm} km)</span>
              <span>₹{order.pricing.deliveryFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Packaging</span>
              <span>₹{order.pricing.packagingFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (5% GST)</span>
              <span>₹{order.pricing.tax}</span>
            </div>
            <div className="pt-1 border-t border-stone-100 flex justify-between font-black text-slate-900 text-xs">
              <span>Total Paid</span>
              <span className="text-brand-700">₹{order.pricing.total}</span>
            </div>
          </div>
        </div>

        {/* Cancel button if early phase */}
        {['CREATED', 'PAYMENT_CONFIRMED', 'PAYMENT_PENDING'].includes(order.status) && (
          <button
            onClick={handleCancelOrder}
            disabled={isCancelling}
            className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 btn-press"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>
    </div>
  );
};
