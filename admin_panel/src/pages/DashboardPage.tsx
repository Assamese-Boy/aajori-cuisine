import React from 'react';
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
} from 'lucide-react';

interface DashboardPageProps {
  metrics: any;
  orders: any[];
  onViewOrder: (orderId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  orders,
  onViewOrder,
}) => {
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
        <p className="text-sm text-slate-500">
          Real-time telemetry and commercial health for Kamrup Metropolitan District
        </p>
      </div>

      {/* Operational Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-5 rounded-xl border bg-white shadow-sm flex items-start justify-between`}
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{card.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Attention Alerts */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900">
              Operations Alert: Peak Dinner Rush Approaching (Kamrup Central)
            </h4>
            <p className="text-xs text-amber-700">
              2 online riders currently handling active orders. High order probability in GS Road & Ulubari corridor.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-amber-200/70 text-amber-900 rounded-full">
          Healthy Shift
        </span>
      </div>

      {/* Live Order Velocity Stream */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-base">Live Order Stream</h3>
          </div>
          <span className="text-xs text-slate-500">Auto-synced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Order ID</th>
                <th className="py-3 px-6">Restaurant</th>
                <th className="py-3 px-6">Customer & Area</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Payment</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {orders.slice(0, 5).map((order) => {
                const statusColors: Record<string, string> = {
                  CREATED: 'bg-slate-100 text-slate-700',
                  PAYMENT_PENDING: 'bg-yellow-100 text-yellow-800',
                  PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-800',
                  RESTAURANT_ACCEPTED: 'bg-indigo-100 text-indigo-800',
                  PREPARING: 'bg-orange-100 text-orange-800',
                  READY_FOR_PICKUP: 'bg-amber-100 text-amber-800',
                  RIDER_ASSIGNED: 'bg-cyan-100 text-cyan-800',
                  PICKED_UP: 'bg-purple-100 text-purple-800',
                  OUT_FOR_DELIVERY: 'bg-teal-100 text-teal-800',
                  DELIVERED: 'bg-emerald-100 text-emerald-800',
                  CANCELLED: 'bg-red-100 text-red-800',
                };

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-800">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700">
                      {order.restaurantId === 'd0000000-0000-0000-0000-000000000001'
                        ? 'Khorikaa Ethnic Kitchen'
                        : order.restaurantId === 'd0000000-0000-0000-0000-000000000002'
                        ? 'Paradise Heritage Diner'
                        : 'Brahmaputra Spice Bistro'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 text-xs">
                      {order.deliveryAddress?.city || 'Guwahati'} • {order.deliveryDistanceKm} km
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">
                      ₹{order.pricing?.totalCustomerPrice}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          statusColors[order.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-600">
                      <span className="font-semibold text-emerald-600">{order.paymentMethod}</span> (
                      {order.paymentStatus})
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => onViewOrder(order.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
