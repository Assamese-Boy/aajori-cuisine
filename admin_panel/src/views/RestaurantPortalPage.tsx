'use client';

import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Bell,
  Volume2,
  UtensilsCrossed,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  subtotal: number;
  variantName?: string;
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  status: string;
  createdAt: string;
  estimatedPreparationTimeMinutes?: number;
  items: OrderItem[];
  pricing: {
    subtotal: number;
    totalCustomerPrice: number;
  };
  deliveryAddress: {
    addressLine1: string;
  };
  customerInstructions?: string;
}

export const RestaurantPortalPage: React.FC = () => {
  const toast = useToast();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [restaurantsList, setRestaurantsList] = useState<{ id: string; name: string }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'KITCHEN' | 'STOCK'>('KITCHEN');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reject Modal
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Kitchen at maximum capacity');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await apiRequest('/restaurants');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setRestaurantsList(res.data.map((r: any) => ({ id: r.id, name: r.name })));
          if (!selectedRestaurantId) {
            setSelectedRestaurantId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load restaurants for portal', err);
      }
    };
    fetchRestaurants();
  }, []);

  const loadPortalData = async () => {
    if (!selectedRestaurantId) return;
    setIsLoading(true);
    try {
      const [ordersRes, metricsRes, menuRes] = await Promise.all([
        apiRequest(`/restaurant-portal/orders?restaurantId=${selectedRestaurantId}`),
        apiRequest(`/restaurant-portal/metrics?restaurantId=${selectedRestaurantId}`),
        apiRequest(`/restaurants/${selectedRestaurantId}/menu`),
      ]);

      if (ordersRes.success && Array.isArray(ordersRes.data)) {
        setOrders(ordersRes.data);
      }
      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (menuRes.success && menuRes.data?.items) {
        setMenuItems(menuRes.data.items);
      }
    } catch {
      toast.error('Network Error', 'Failed to refresh restaurant portal');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRestaurantId) {
      loadPortalData();
    }
  }, [selectedRestaurantId]);

  const handleAcceptOrder = async (orderId: string, prepMinutes: number = 25) => {
    setIsProcessing(true);
    try {
      const res = await apiRequest(`/restaurant-portal/orders/${orderId}/accept`, {
        method: 'PATCH',
        body: JSON.stringify({ prepMinutes }),
      });
      if (res.success) {
        toast.success('Order Accepted', `Kitchen confirmation logged with ${prepMinutes}m estimate`);
        loadPortalData();
      } else {
        toast.error('Failed', res.error?.message || 'Could not accept order');
      }
    } catch {
      toast.error('Error', 'Server communication error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectOrderId) return;
    setIsProcessing(true);
    try {
      const res = await apiRequest(`/restaurant-portal/orders/${rejectOrderId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.success) {
        toast.warning('Order Rejected', `Order cancelled: ${rejectReason}`);
        setRejectOrderId(null);
        loadPortalData();
      } else {
        toast.error('Failed', res.error?.message || 'Could not reject order');
      }
    } catch {
      toast.error('Error', 'Server communication error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const res = await apiRequest(`/restaurant-portal/orders/${orderId}/ready`, {
        method: 'PATCH',
      });
      if (res.success) {
        toast.success('Ready for Pickup', 'Rider notification triggered');
        loadPortalData();
      } else {
        toast.error('Failed', res.error?.message || 'Could not mark order ready');
      }
    } catch {
      toast.error('Error', 'Server communication error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStock = async (itemId: string, currentStock: boolean) => {
    try {
      const res = await apiRequest(`/restaurant-portal/menu/${itemId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !currentStock }),
      });
      if (res.success) {
        setMenuItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, isAvailable: !currentStock } : item))
        );
        toast.success('Stock Updated', `Item is now ${!currentStock ? 'In Stock' : 'Marked Out of Stock'}`);
      } else {
        toast.error('Stock Update Failed', res.error?.message);
      }
    } catch {
      toast.error('Error', 'Could not update stock status');
    }
  };

  const handleToggleBusy = async () => {
    try {
      const res = await apiRequest(`/admin/restaurants/${selectedRestaurantId}/busy`, {
        method: 'POST',
      });
      if (res.success) {
        toast.success('Status Updated', res.message || 'Restaurant mode toggled');
        loadPortalData();
      }
    } catch {
      toast.error('Error', 'Failed to toggle mode');
    }
  };

  const pendingOrders = orders.filter((o) => ['CREATED', 'PAYMENT_CONFIRMED'].includes(o.status));
  const preparingOrders = orders.filter((o) => ['RESTAURANT_ACCEPTED', 'PREPARING'].includes(o.status));
  const readyOrders = orders.filter((o) => ['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP'].includes(o.status));

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-brand-600" />
              Kitchen Operations Portal (KDS)
            </h2>
            <span className="px-2.5 py-0.5 bg-brand-100 text-brand-800 rounded-full text-xs font-bold">
              Live Cooking Station
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time kitchen order acceptance, cooking timer supervision & instant 86 menu stock controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {restaurantsList.length === 0 ? (
              <option value="">Loading kitchens...</option>
            ) : (
              restaurantsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))
            )}
          </select>

          <button
            onClick={loadPortalData}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics & Operational Mode Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Incoming Pending</span>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-0.5">{pendingOrders.length}</div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5 animate-bounce" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Cooking In Kitchen</span>
            <div className="text-2xl font-bold font-mono text-indigo-600 mt-0.5">{preparingOrders.length}</div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5 text-indigo-600" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Ready For Pickup</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-0.5">{readyOrders.length}</div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Kitchen Busy Mode</span>
            <div className="text-xs font-bold text-slate-800 mt-1">
              {metrics?.isBusy ? (
                <span className="text-rose-600 font-bold">HIGH RUSH (Paused)</span>
              ) : (
                <span className="text-emerald-600 font-bold">Normal Flow</span>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleBusy}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              metrics?.isBusy
                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {metrics?.isBusy ? 'Disable Rush' : 'Enable Rush'}
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('KITCHEN')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'KITCHEN'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Live Kitchen Queue ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'STOCK'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Quick 86 Stock Management ({menuItems.length} Dishes)
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'KITCHEN' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: New Incoming Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200 text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                New Orders ({pendingOrders.length})
              </span>
              <span className="text-[10px] text-slate-400">Needs Kitchen Confirmation</span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">
                No pending incoming orders at this moment.
              </div>
            ) : (
              pendingOrders.map((order) => {
                const elapsedMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                const isOverdue = elapsedMins >= 5;

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl p-4 border shadow-xs space-y-3 ${
                      isOverdue ? 'border-rose-400 ring-2 ring-rose-200' : 'border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          isOverdue ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {elapsedMins}m ago {isOverdue ? '⚠️ URGENT' : ''}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs space-y-1">
                      {order.items?.map((item) => (
                        <div key={item.id} className="pt-1 flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-mono text-slate-500">₹{item.subtotal}</span>
                        </div>
                      ))}
                    </div>

                    {order.customerInstructions && (
                      <div className="p-2 bg-amber-50 rounded-lg text-[11px] text-amber-900 italic">
                        Note: "{order.customerInstructions}"
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleAcceptOrder(order.id, 25)}
                        disabled={isProcessing}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                      >
                        Accept (25m)
                      </button>
                      <button
                        onClick={() => setRejectOrderId(order.id)}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Column 2: In Kitchen Cooking */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200 text-xs font-bold text-indigo-900">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-indigo-600" />
                Cooking in Kitchen ({preparingOrders.length})
              </span>
              <span className="text-[10px] text-slate-400">Preparing Dishes</span>
            </div>

            {preparingOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">
                Kitchen stations idle.
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                      Cooking (Est: {order.estimatedPreparationTimeMinutes || 25}m)
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs space-y-1">
                    {order.items?.map((item) => (
                      <div key={item.id} className="pt-1 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono text-slate-500">₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleMarkReady(order.id)}
                    disabled={isProcessing}
                    className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Mark Ready for Pickup
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Column 3: Ready & Dispatched */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200 text-xs font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ready & Handover ({readyOrders.length})
              </span>
              <span className="text-[10px] text-slate-400">Rider Pickup Ready</span>
            </div>

            {readyOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">
                No orders waiting for pickup.
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{order.items?.length || 0} items packed</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Quick 86 Stock Management */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Real-time Dish Availability (86 Controls)</h3>
            <p className="text-xs text-slate-500">
              Instantly toggle dishes in or out of stock. Changes immediately disable the Add button on customer devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{item.name}</div>
                  <div className="text-[11px] text-slate-500">
                    ₹{item.price} • {item.isVeg ? '🌱 Veg' : '🍗 Non-Veg'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-[11px] ${
                      item.isAvailable ? 'text-emerald-600' : 'text-rose-600 font-bold'
                    }`}
                  >
                    {item.isAvailable ? 'In Stock' : 'Sold Out (86)'}
                  </span>
                  <button
                    onClick={() => handleToggleStock(item.id, item.isAvailable)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {item.isAvailable ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-rose-500" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Specify Kitchen Rejection Reason
            </h3>
            <p className="text-xs text-slate-500">
              A cancellation reason is required and will be logged in the audit trail.
            </p>

            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
            >
              <option value="Kitchen at maximum capacity">Kitchen at maximum capacity</option>
              <option value="Key Assamese ingredients out of stock">Key ingredients out of stock</option>
              <option value="Closing for afternoon prep break">Closing for prep break</option>
              <option value="Operational equipment maintenance">Operational equipment maintenance</option>
            </select>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectOrderId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
