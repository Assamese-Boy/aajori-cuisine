import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  RotateCcw,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { SkeletonOrderCard } from '../components/SkeletonLoaders';

export const OrdersHistoryPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { addItem, openCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const res = await apiRequest<Order[]>('/orders');
        if (res.success && res.data) {
          setOrders(res.data);
        }
      } catch (e) {
        console.error('Error fetching orders', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated]);

  const handleReorder = (order: Order) => {
    const restaurant = {
      id: order.restaurantId,
      name: order.restaurantName || 'Authentic Kitchen',
    };

    for (const item of order.items) {
      addItem(
        restaurant,
        {
          id: item.menuItemId,
          restaurantId: order.restaurantId,
          categoryId: 'c1',
          name: item.name,
          price: item.unitPrice,
          isVeg: false,
        },
        item.quantity
      );
    }

    toast.success('Items Added', 'Order items added to your cart.');
    openCart();
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center space-y-3 pt-24">
        <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto text-2xl">
          🔒
        </div>
        <h2 className="text-base font-bold text-slate-800">Sign in to view orders</h2>
        <p className="text-xs text-slate-500">
          Track active kitchen orders and past receipts.
        </p>
        <button
          onClick={() => openAuthModal('signin')}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 text-white font-bold text-xs"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28 animate-page-enter">
      {/* 1. Mobile Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b border-stone-200 safe-top">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-700 btn-press"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Order History
        </h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <SkeletonOrderCard key={n} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto text-xl">
              🍲
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No orders yet</h3>
            <p className="text-[11px] text-slate-400">
              Explore authentic charcoal grills and thalis.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
            >
              Order Food
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

            return (
              <div
                key={order.id}
                className="p-4 bg-white rounded-2xl border border-stone-200 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-xs">
                      {order.restaurantName || 'Authentic Kitchen'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isDelivered
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCancelled
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 truncate leading-snug">
                  {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="font-black text-xs text-slate-900">
                    ₹{order.pricing.total}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorder(order)}
                      className="px-2.5 py-1 bg-stone-100 text-slate-700 rounded-lg text-[10px] font-bold btn-press flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reorder</span>
                    </button>

                    <Link
                      to={`/orders/${order.id}`}
                      className="px-3 py-1 bg-brand-600 text-white rounded-lg text-[10px] font-bold btn-press flex items-center gap-1 shadow-2xs"
                    >
                      <span>Track</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
