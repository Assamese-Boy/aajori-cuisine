import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  Clock,
  User,
  Store,
  Bike,
  CheckCircle2,
  AlertCircle,
  Filter,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SkeletonTable, EmptyState } from '../components/SkeletonLoaders';

interface OrdersPageProps {
  orders?: any[];
  selectedOrderId?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const OrdersPage: React.FC<OrdersPageProps> = (props) => {
  const toast = useToast();
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const outlet = useOutletContext<{
    orders?: any[];
    onRefresh?: () => void;
    isLoading?: boolean;
  } | null>();

  const orders = props.orders ?? outlet?.orders ?? [];
  const onRefresh = props.onRefresh ?? outlet?.onRefresh ?? (() => {});
  const isLoading = props.isLoading ?? outlet?.isLoading ?? false;

  const [activeOrderId, setActiveOrderId] = useState<string>(
    props.selectedOrderId || orderId || orders[0]?.id || ''
  );

  useEffect(() => {
    if (orderId) {
      setActiveOrderId(orderId);
    } else if (!activeOrderId && orders.length > 0) {
      setActiveOrderId(orders[0].id);
    }
  }, [orderId, orders]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') {
      return [
        'RESTAURANT_ACCEPTED',
        'PREPARING',
        'READY_FOR_PICKUP',
        'RIDER_ASSIGNED',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
      ].includes(o.status);
    }
    if (filterStatus === 'COMPLETED') return o.status === 'DELIVERED';
    if (filterStatus === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(o.status);
    return o.status === filterStatus;
  });

  const selectedOrder = orders.find((o) => o.id === activeOrderId) || orders[0];

  const handleTransition = async (toStatus: string, reason?: string) => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      const res = await apiRequest(`/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          toStatus,
          reason: reason || `Admin manual transition to ${toStatus}`,
        }),
      });
      if (res.success) {
        toast.success('Order Updated', `Moved to ${toStatus.replace(/_/g, ' ')}`);
        onRefresh();
      } else {
        toast.error('Update Failed', res.error?.message || 'Could not transition order');
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Transition operation failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const lifecycleStages = [
    { key: 'CREATED', label: 'Created' },
    { key: 'PAYMENT_CONFIRMED', label: 'Payment' },
    { key: 'RESTAURANT_ACCEPTED', label: 'Accepted' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY_FOR_PICKUP', label: 'Ready' },
    { key: 'RIDER_ASSIGNED', label: 'Rider' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'OUT_FOR_DELIVERY', label: 'In Transit' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const getStageIndex = (status: string) => {
    return lifecycleStages.findIndex((s) => s.key === status);
  };

  const currentStageIndex = selectedOrder ? getStageIndex(selectedOrder.status) : -1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Order Control Center</h2>
          <p className="text-sm text-slate-500">
            Real-time multi-stage lifecycle supervision, pricing verification & dispatch override
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
          {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterStatus === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Orders Pipeline List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Orders Queue ({filteredOrders.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No orders found matching "{filterStatus}" status.
              </div>
            ) : (
              filteredOrders.map((order) => {
              const isSelected = order.id === activeOrderId;
              return (
                <div
                  key={order.id}
                  onClick={() => {
                    setActiveOrderId(order.id);
                    navigate(`/orders/${order.id}`, { replace: true });
                  }}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-50/70 border-l-4 border-brand-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      ₹{order.pricing?.totalCustomerPrice}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">
                      {order.restaurantId === 'd0000000-0000-0000-0000-000000000001'
                        ? 'Khorikaa Ethnic Kitchen'
                        : order.restaurantId === 'd0000000-0000-0000-0000-000000000002'
                        ? 'Paradise Heritage Diner'
                        : 'Brahmaputra Spice Bistro'}
                    </span>
                    <span className="font-semibold text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-full">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                    <span>• {order.deliveryDistanceKm} km</span>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right: Detailed Order Inspector */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[750px] overflow-y-auto">
          {selectedOrder ? (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold font-mono text-slate-900">
                      {selectedOrder.orderNumber}
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold">
                      {selectedOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ordered at {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2">
                  {selectedOrder.status === 'PAYMENT_CONFIRMED' && (
                    <button
                      onClick={() => handleTransition('RESTAURANT_ACCEPTED')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Accept Order
                    </button>
                  )}
                  {selectedOrder.status === 'RESTAURANT_ACCEPTED' && (
                    <button
                      onClick={() => handleTransition('PREPARING')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Start Cooking
                    </button>
                  )}
                  {selectedOrder.status === 'PREPARING' && (
                    <button
                      onClick={() => handleTransition('READY_FOR_PICKUP')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Mark Ready
                    </button>
                  )}
                  {selectedOrder.status === 'READY_FOR_PICKUP' && (
                    <button
                      onClick={() => handleTransition('RIDER_ASSIGNED')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Assign Rider
                    </button>
                  )}
                  {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleTransition('DELIVERED')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Confirm Delivered
                    </button>
                  )}
                  {selectedOrder.status !== 'DELIVERED' &&
                    selectedOrder.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleTransition('CANCELLED', 'Admin emergency override')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold"
                      >
                        Cancel Order
                      </button>
                    )}
                </div>
              </div>

              {/* Visual Order Lifecycle Progression */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Order Transition Lifecycle
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 text-center">
                  {lifecycleStages.map((stage, idx) => {
                    const isDone = currentStageIndex >= idx;
                    const isCurrent = currentStageIndex === idx;

                    return (
                      <div key={stage.key} className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                            isCurrent
                              ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                              : isDone
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] font-medium leading-tight ${
                            isCurrent
                              ? 'text-brand-700 font-bold'
                              : isDone
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items Snapshot */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Historical Items Snapshot
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedOrder.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-100 font-bold text-slate-700 flex items-center justify-center">
                          {item.quantity}x
                        </span>
                        <span className="font-semibold text-slate-800">{item.name}</span>
                      </div>
                      <div className="font-mono font-bold text-slate-800">₹{item.subtotal}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown Engine Snapshot */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Authoritative Pricing Breakdown
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Food Subtotal</span>
                    <span className="font-mono">₹{selectedOrder.pricing?.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Packaging Fee</span>
                    <span className="font-mono">₹{selectedOrder.pricing?.packagingFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Delivery Fee ({selectedOrder.pricing?.deliveryDistanceKm} km)
                    </span>
                    <span className="font-mono">₹{selectedOrder.pricing?.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Platform Fee</span>
                    <span className="font-mono">₹{selectedOrder.pricing?.platformFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST Taxes (5%)</span>
                    <span className="font-mono">₹{selectedOrder.pricing?.taxAmount}</span>
                  </div>
                  {selectedOrder.pricing?.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount ({selectedOrder.pricing?.couponCode})</span>
                      <span className="font-mono">-₹{selectedOrder.pricing?.discountAmount}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Customer Price</span>
                    <span className="font-mono text-brand-600">
                      ₹{selectedOrder.pricing?.totalCustomerPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Instructions */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  Delivery Destination
                </p>
                <p>{selectedOrder.deliveryAddress?.addressLine1}</p>
                {selectedOrder.customerInstructions && (
                  <p className="italic text-amber-800">
                    Note: "{selectedOrder.customerInstructions}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select an order to inspect lifecycle
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
