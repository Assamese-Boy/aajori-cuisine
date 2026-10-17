'use client';

import React, { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from '../utils/router-compat';
import {
  ShoppingBag,
  Users,
  Store,
  Bike,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  Receipt,
  Percent,
} from 'lucide-react';
import { SkeletonMetrics, SkeletonTable } from '../components/SkeletonLoaders';

interface DashboardPageProps {
  metrics?: any;
  orders?: any[];
  onViewOrder?: (orderId: string) => void;
  isLoading?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  const navigate = useNavigate();
  const outlet = useOutletContext<{
    metrics?: any;
    orders?: any[];
    isLoading?: boolean;
  } | null>();

  const metrics = props.metrics ?? outlet?.metrics;
  const orders = props.orders ?? outlet?.orders ?? [];
  const isLoading = props.isLoading ?? outlet?.isLoading ?? false;

  const [selectedLocality, setSelectedLocality] = useState<string>('ALL');

  const availableLocalities = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o: any) => {
      const loc = o.deliveryAddress?.city || o.deliveryAddress?.landmark || o.deliveryAddress?.addressLine1;
      if (loc && typeof loc === 'string' && loc.trim().length > 0) {
        set.add(loc.trim().split(',')[0]);
      }
    });
    return ['ALL', ...Array.from(set).slice(0, 4)];
  }, [orders]);

  const handleManageOrder = (orderId: string) => {
    if (props.onViewOrder) {
      props.onViewOrder(orderId);
    } else {
      navigate(`/orders/${orderId}`);
    }
  };

  if (!metrics && isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
          <p className="text-sm text-slate-500">
            Real-time telemetry and commercial health across all operational zones
          </p>
        </div>
        <SkeletonMetrics />
        <div className="pt-4">
          <SkeletonTable rows={4} />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Orders',
      value: metrics?.activeOrders ?? 0,
      sub: `${metrics?.pendingOrders ?? 0} pending, ${metrics?.ordersPreparing ?? 0} cooking, ${metrics?.ordersOutForDelivery ?? 0} in transit`,
      icon: ShoppingBag,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
    },
    {
      title: 'Net Platform Sales',
      value: `₹${(metrics?.netSales ?? metrics?.revenueToday ?? 0).toLocaleString('en-IN')}`,
      sub: `Gross ₹${(metrics?.grossOrderValue ?? 0).toLocaleString('en-IN')} (Net = Gross - Disc + Fees - Refunds)`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Active Fleet / Online Riders',
      value: `${metrics?.onlineDeliveryPartners ?? 0} / ${metrics?.totalDeliveryPartners ?? 0}`,
      sub: 'PostGIS GPS fleet active',
      icon: Bike,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Kitchen Partners Live',
      value: `${metrics?.activeRestaurants ?? 0} / ${metrics?.totalRestaurants ?? 0}`,
      sub: `${metrics?.unavailableRestaurants ?? 0} busy or temporarily closed`,
      icon: Store,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200',
    },
  ];

  const alerts = metrics?.alerts || [];

  const filteredOrders = orders.filter((o) => {
    if (selectedLocality === 'ALL') return true;
    const addr = o.deliveryAddress?.city || o.deliveryAddress?.landmark || o.deliveryAddress?.addressLine1 || '';
    return addr.toLowerCase().includes(selectedLocality.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Locality Quick Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
          <p className="text-sm text-slate-500">
            Authoritative fleet telemetry, verified accounting & live food order lifecycle
          </p>
        </div>

        <div className="flex items-center gap-2">
          {availableLocalities.length > 1 && (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
              <span className="text-slate-400 pl-2">Filter:</span>
              {availableLocalities.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocality(loc)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    selectedLocality === loc ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs shrink-0 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live System</span>
          </div>
        </div>
      </div>

      {/* Operational Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs flex items-start justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">{card.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{card.sub}</p>
              </div>
              <div className={`p-3 rounded-2xl border ${card.bg}`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Authoritative Financial Reconciliation Strip */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              Authoritative Financial Reconciliation
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Accounting Formula: Net = Gross - Disc + Delivery&Pack - Refunds
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Gross Order Value</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">
              ₹{(metrics?.grossOrderValue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Customer Discounts</span>
            <span className="text-sm font-black text-rose-600 mt-0.5 block">
              -₹{(metrics?.totalDiscounts ?? 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Delivery & Packaging</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">
              +₹{(metrics?.deliveryAndPackagingCharges ?? 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Processed Refunds</span>
            <span className="text-sm font-black text-amber-600 mt-0.5 block">
              ₹{(metrics?.totalRefunds ?? 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-emerald-700 block text-[10px] font-bold uppercase">Net Platform Revenue</span>
            <span className="text-sm font-black text-emerald-900 mt-0.5 block">
              ₹{(metrics?.netSales ?? 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
            <span className="text-purple-700 block text-[10px] font-bold uppercase">Restaurant Payable</span>
            <span className="text-sm font-black text-purple-900 mt-0.5 block">
              ₹{(metrics?.restaurantPayable ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Attention Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Active Operational Alerts ({alerts.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 shadow-2xs ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : alert.severity === 'WARNING'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-600 animate-ping' : 'bg-amber-600'
                      }`}
                    />
                    <h4 className="font-extrabold text-xs truncate">{alert.title}</h4>
                  </div>
                  <p className="text-[11px] leading-tight font-medium opacity-90">{alert.message}</p>
                </div>

                {alert.orderId && (
                  <button
                    onClick={() => handleManageOrder(alert.orderId)}
                    className="px-2.5 py-1 bg-white rounded-lg text-[10px] font-black shrink-0 border shadow-2xs hover:bg-slate-50"
                  >
                    View Order
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Order Stream */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-base">Live Order Stream</h3>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            {filteredOrders.length} Orders
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No orders created in this locality yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-6">Order ID</th>
                  <th className="py-3 px-6">Restaurant</th>
                  <th className="py-3 px-6">Customer & Locality</th>
                  <th className="py-3 px-6">Items</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-xs text-brand-700">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-800 text-xs">
                      {order.restaurantName || 'Assam Kitchen'}
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-600">
                      <span className="font-bold text-slate-800 block">
                        {order.deliveryAddress?.label || 'Home'}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[180px] block">
                        {order.deliveryAddress?.landmark || order.deliveryAddress?.city}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-600">
                      {order.items?.length || 0} items
                    </td>
                    <td className="py-3.5 px-6 font-black text-xs text-slate-900">
                      ₹{order.pricing?.totalCustomerPrice || order.pricing?.total}
                    </td>
                    <td className="py-3.5 px-6 text-xs">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.status === 'CANCELLED' || order.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => handleManageOrder(order.id)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
