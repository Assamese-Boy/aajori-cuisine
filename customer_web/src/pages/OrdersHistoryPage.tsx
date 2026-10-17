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

    for (const item of (order.items || [])) {
      addItem(
        restaurant,
        {
          id: item.menuItemId || item.id || `dish_${Math.random()}`,
          restaurantId: order.restaurantId,
          categoryId: 'c1',
          name: item.name || 'Dish',
          price: item.unitPrice || 180,
          isVeg: false,
        },
        item.quantity || 1
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
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-stone-200/80 safe-top">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-2xl bg-stone-100 flex items-center justify-center text-slate-700 btn-press border border-stone-200/60"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <h1 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Order History
        </h1>
        <div className="w-9"></div>
      </div>

      <div className="p-4 space-y-3.5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <SkeletonOrderCard key={n} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
            <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto text-2xl">
              🍲
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">No orders yet</h3>
            <p className="text-xs text-slate-500">
              Explore authentic charcoal grills and thalis.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs btn-press shadow-xs"
            >
              Order Food Now
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

            return (
              <div
                key={order.id}
                className="p-4 bg-white rounded-2xl border border-stone-200/90 space-y-3 shadow-xs card-smooth"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {order.restaurantName || 'Authentic Kitchen'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                      isDelivered
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCancelled
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}
                  >
                    {(order.status || 'CREATED').replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 truncate leading-relaxed font-medium">
                  {(order.items || []).map((i) => `${i.quantity || 1}x ${i.name || 'Dish'}`).join(', ')}
                </p>

                <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">
                    ₹{order.pricing?.total ?? (order as any).totalCustomerPrice ?? (order as any).total ?? (order as any).totalAmount ?? 0}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorder(order)}
                      className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl text-xs font-bold btn-press flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>

                    <Link
                      to={`/orders/${order.id}`}
                      className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black btn-press flex items-center gap-1 shadow-xs tracking-wide"
                    >
                      <span>Track</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
