'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from '../utils/router-compat';
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
import { mergeRiders } from '../services/local-persistence';

interface OrdersPageProps {
  orders?: any[];
  selectedOrderId?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const EMPTY_ORDERS: any[] = [];

export const OrdersPage: React.FC<OrdersPageProps> = (props) => {
  const toast = useToast();
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const outlet = useOutletContext<{
    orders?: any[];
    onRefresh?: () => void;
    isLoading?: boolean;
  } | null>();

  const orders = props.orders ?? outlet?.orders ?? EMPTY_ORDERS;
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
  const [fleetRiders, setFleetRiders] = useState<any[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');

  const fetchFleetRiders = async () => {
    try {
      const res = await apiRequest('/admin/delivery-partners');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setFleetRiders(mergeRiders(res.data));
      } else {
        const mapRes = await apiRequest('/admin/live-map');
        if (mapRes.success && mapRes.data?.riders) {
          setFleetRiders(mergeRiders(mapRes.data.riders));
        } else {
          setFleetRiders(mergeRiders([]));
        }
      }
    } catch {
      setFleetRiders(mergeRiders([]));
    }
  };

  useEffect(() => {
    fetchFleetRiders();
  }, []);

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
      const orderIdOrNumber = selectedOrder.id || selectedOrder.orderNumber;
      const res = await apiRequest(`/orders/${encodeURIComponent(orderIdOrNumber)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          toStatus,
          status: toStatus,
          reason: reason || `Admin manual transition to ${toStatus}`,
        }),
      });
      if (res.success) {
        toast.success('Order Updated', `Moved to ${toStatus.replace(/_/g, ' ')}`);
        selectedOrder.status = toStatus;
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

  const ALL_LIFECYCLE_OPTIONS = [
    { value: 'CREATED', label: '1. Order Created' },
    { value: 'PAYMENT_PENDING', label: '2. Payment Pending' },
    { value: 'PAYMENT_CONFIRMED', label: '3. Payment Confirmed' },
    { value: 'RESTAURANT_ACCEPTED', label: '4. Restaurant Accepted' },
    { value: 'PREPARING', label: '5. In Kitchen (Preparing)' },
    { value: 'READY_FOR_PICKUP', label: '6. Food Ready for Pickup' },
    { value: 'RIDER_ASSIGNED', label: '7. Rider Assigned' },
    { value: 'PICKED_UP', label: '8. Picked Up by Rider' },
    { value: 'OUT_FOR_DELIVERY', label: '9. Out for Delivery' },
    { value: 'DELIVERED', label: '10. Delivered' },
    { value: 'CANCELLED', label: 'Cancelled / Rejected' },
  ];

  const getNextStageAction = (status: string) => {
    switch (status) {
      case 'CREATED':
      case 'PAYMENT_PENDING':
        return { toStatus: 'RESTAURANT_ACCEPTED', label: 'Accept Order', bg: 'bg-indigo-600 hover:bg-indigo-700' };
      case 'PAYMENT_CONFIRMED':
        return { toStatus: 'RESTAURANT_ACCEPTED', label: 'Accept Order', bg: 'bg-indigo-600 hover:bg-indigo-700' };
      case 'RESTAURANT_ACCEPTED':
        return { toStatus: 'PREPARING', label: 'Start Cooking', bg: 'bg-orange-600 hover:bg-orange-700' };
      case 'PREPARING':
        return { toStatus: 'READY_FOR_PICKUP', label: 'Mark Food Ready', bg: 'bg-amber-600 hover:bg-amber-700' };
      case 'READY_FOR_PICKUP':
        return { toStatus: 'RIDER_ASSIGNED', label: 'Assign Rider', bg: 'bg-cyan-600 hover:bg-cyan-700' };
      case 'RIDER_ASSIGNED':
        return { toStatus: 'PICKED_UP', label: 'Confirm Picked Up', bg: 'bg-purple-600 hover:bg-purple-700' };
      case 'PICKED_UP':
        return { toStatus: 'OUT_FOR_DELIVERY', label: 'Dispatch Order', bg: 'bg-sky-600 hover:bg-sky-700' };
      case 'OUT_FOR_DELIVERY':
        return { toStatus: 'DELIVERED', label: 'Confirm Delivered', bg: 'bg-emerald-600 hover:bg-emerald-700' };
      default:
        return null;
    }
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
                      {order.restaurantName || order.restaurant?.name || 'Restaurant Partner'}
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

                {/* Status Action Buttons & Manual Overrides */}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {/* Manual Status Dropdown Changer */}
                  <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 transition-colors border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Status:</span>
                    <select
                      value={selectedOrder.status}
                      disabled={isUpdating}
                      onChange={(e) => handleTransition(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                      title="Directly change order status to any stage"
                    >
                      {ALL_LIFECYCLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Smart Next Stage Advance Button */}
                  {(() => {
                    const nextAct = getNextStageAction(selectedOrder.status);
                    if (!nextAct) return null;
                    return (
                      <button
                        onClick={() => handleTransition(nextAct.toStatus)}
                        disabled={isUpdating}
                        className={`px-3 py-1.5 ${nextAct.bg} text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:scale-102 flex items-center gap-1.5`}
                        title={`Advance order to ${nextAct.toStatus.replace(/_/g, ' ')}`}
                      >
                        <span>{nextAct.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })()}

                  {/* Direct Mark as Delivered Button */}
                  {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleTransition('DELIVERED', 'Admin one-click delivery confirmation')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all hover:scale-102"
                      title="Directly mark order as successfully delivered"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </button>
                  )}

                  {/* Direct Cancel Button */}
                  {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                    <button
                      onClick={() => {
                        const reason = window.prompt('Reason for order cancellation (optional):', 'Customer or kitchen cancellation');
                        if (reason !== null) {
                          handleTransition('CANCELLED', reason || 'Admin cancelled');
                        }
                      }}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Order Lifecycle Progression */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Order Transition Lifecycle
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    (Click any stage circle to jump status directly)
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 text-center">
                  {lifecycleStages.map((stage, idx) => {
                    const isDone = currentStageIndex >= idx;
                    const isCurrent = currentStageIndex === idx;

                    return (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => handleTransition(stage.key)}
                        disabled={isUpdating}
                        title={`Click to set order status directly to ${stage.label}`}
                        className="flex flex-col items-center p-1 rounded-lg hover:bg-slate-50 transition-all cursor-pointer group focus:outline-none"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                            isCurrent
                              ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm scale-110'
                              : isDone
                              ? 'bg-emerald-500 text-white group-hover:scale-105'
                              : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] font-medium leading-tight ${
                            isCurrent
                              ? 'text-brand-700 font-bold'
                              : isDone
                              ? 'text-slate-800 font-semibold'
                              : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </button>
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

              {/* WhatsApp & Tracking Token Info */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-emerald-900">
                      {selectedOrder.isWhatsAppOrder ? 'WhatsApp Assisted Order' : 'Web Application Order'}
                    </span>
                    <span className="bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                      Meta Cloud API Webhook Verified
                    </span>
                  </div>
                  <p className="text-emerald-700 text-[11px]">
                    Customer Phone: <span className="font-mono font-medium">{selectedOrder.customerPhone || 'Not provided'}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                      const customerBase = isLocal ? `${window.location.protocol}//${window.location.hostname}:5174` : 'https://cuisine.aajori.in';
                      const trackUrl = `${customerBase}/orders/track/${selectedOrder.trackingToken || selectedOrder.id}`;
                      navigator.clipboard.writeText(trackUrl);
                      toast.success('Tracking Link Copied', 'Secure public URL copied to clipboard');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                  >
                    Copy Customer Tracking Link
                  </button>
                </div>
              </div>

              {/* Delivery Dispatch & Rider Assignment */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                {(() => {
                  const assignedId = selectedOrder.deliveryPartnerId || selectedOrder.assignedRiderId;
                  const assignedPartner = fleetRiders.find((r) => r.id === assignedId);
                  const assignedName = assignedPartner?.fullName || assignedPartner?.user?.fullName;

                  return (
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <Bike className="w-4 h-4 text-brand-600" />
                        Delivery Fleet Dispatch
                      </h4>
                      {assignedId ? (
                        <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 rounded-lg font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                          Rider Assigned: {assignedName || assignedId.slice(0, 8)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-semibold text-[10px]">
                          Unassigned Delivery
                        </span>
                      )}
                    </div>
                  );
                })()}

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    id="riderSelect"
                    value={selectedRiderId}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="" disabled>Select Delivery Partner to Assign...</option>
                    {fleetRiders.map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        {rider.fullName || rider.user?.fullName || 'Delivery Partner'} ({rider.vehicleType || 'Bike'} - {rider.vehicleNumber || 'Standard'}) - {(rider.shiftStatus || (rider.isOnline ? 'ONLINE' : 'OFFLINE')).replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      const selectEl = document.getElementById('riderSelect') as HTMLSelectElement;
                      const riderId = selectedRiderId || selectEl?.value;
                      if (!riderId) {
                        toast.warning('Select Rider', 'Please select a delivery partner from the fleet dropdown');
                        return;
                      }
                      setIsUpdating(true);
                      try {
                        const res = await apiRequest(`/admin/orders/${selectedOrder.id}/assign-rider`, {
                          method: 'POST',
                          body: JSON.stringify({
                            riderId,
                            reason: 'Manual dispatcher allocation from admin panel',
                          }),
                        });
                        if (res.success) {
                          toast.success('Rider Dispatched', 'Delivery partner allocated to order successfully');
                          selectedOrder.deliveryPartnerId = riderId;
                          (selectedOrder as any).assignedRiderId = riderId;
                          selectedOrder.status = 'RIDER_ASSIGNED';
                          onRefresh();
                        } else {
                          toast.error('Dispatch Failed', res.error?.message || 'Could not assign rider');
                        }
                      } catch (e: any) {
                        toast.error('Error', e.message || 'Dispatch operation failed');
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? 'Dispatching...' : 'Dispatch Partner'}
                  </button>
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
