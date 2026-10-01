import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
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
            Real-time telemetry and commercial health for Kamrup Metropolitan District
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
      sub: `${metrics?.pendingOrders ?? 0} pending payment/accept`,
      icon: ShoppingBag,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
    },
    {
      title: "Today's Gross Revenue",
      value: `₹${(metrics?.revenueToday ?? 0).toLocaleString('en-IN')}`,
      sub: `₹${(metrics?.revenueThisWeek ?? 0).toLocaleString('en-IN')} this week`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Online Delivery Partners',
      value: `${metrics?.onlineDeliveryPartners ?? 0} / ${metrics?.totalDeliveryPartners ?? 0}`,
      sub: 'Active in Kamrup Metro zone',
      icon: Bike,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Active Restaurants',
      value: `${metrics?.activeRestaurants ?? 0} / ${metrics?.totalRestaurants ?? 0}`,
      sub: 'Accepting kitchen orders',
      icon: Store,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
          <p className="text-sm text-slate-500">
            Real-time telemetry and commercial health for Kamrup Metropolitan District
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Operations Active</span>
        </div>
      </div>

      {/* Operational Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-start justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{card.sub}</p>
              </div>
              <div className={`p-3 rounded-xl border ${card.bg}`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Attention Alerts */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100/80 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              Operations Notice: Hyperlocal Dispatch Readiness (Kamrup Central)
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Online riders active. High order demand in GS Road, Ulubari & Uzan Bazar corridors.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-amber-200/60 text-amber-900 rounded-full border border-amber-300/40">
          Healthy Dispatch
        </span>
      </div>

      {/* Live Order Velocity Stream */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-base">Live Order Stream</h3>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
            Auto-synced
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No orders created in district today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-6">Order ID</th>
                  <th className="py-3 px-6">Restaurant</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 text-xs">
                      {order.id.slice(0, 14)}...
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-800">
                      {order.restaurant?.name || 'Restaurant'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 text-xs">
                      {order.customer?.fullName || 'Customer'}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      ₹{order.pricing?.totalCustomerPrice || 0}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleManageOrder(order.id)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center justify-end gap-1 ml-auto"
                      >
                        <span>Manage</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
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
