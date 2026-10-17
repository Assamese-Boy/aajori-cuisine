'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  DollarSign,
  TrendingUp,
  Percent,
  Store,
  MapPin,
  Flame,
  ArrowUpRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ReportsData {
  grossOrderValue: number;
  totalDiscounts: number;
  totalDeliveryAndPackaging: number;
  totalTax: number;
  totalRefunds: number;
  platformCommission: number;
  restaurantNetPayout: number;
  netSales: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  salesByRestaurant: Array<{
    restaurantId: string;
    restaurantName: string;
    orderCount: number;
    grossSales: number;
    discounts: number;
    restaurantNetPayout: number;
    commissionEarned: number;
  }>;
  bestSellingDishes: Array<{
    name: string;
    restaurantName: string;
    quantity: number;
    revenue: number;
  }>;
  localityMetrics: Array<{
    locality: string;
    orders: number;
    avgDistanceKm: number;
  }>;
}

export const ReportsPage: React.FC = () => {
  const toast = useToast();
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [restaurantsList, setRestaurantsList] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('ALL');
  const [selectedLocality, setSelectedLocality] = useState<string>('ALL');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await apiRequest('/restaurants');
        if (res.success && Array.isArray(res.data)) {
          setRestaurantsList(res.data.map((r: any) => ({ id: r.id, name: r.name })));
        }
      } catch (err) {
        console.error('Failed to load restaurants for reports filter', err);
      }
    };
    fetchRestaurants();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let query = '';
      const params = new URLSearchParams();
      if (selectedRestaurant !== 'ALL') params.append('restaurantId', selectedRestaurant);
      if (selectedLocality !== 'ALL') params.append('locality', selectedLocality);
      if (params.toString()) query = `?${params.toString()}`;

      const res = await apiRequest(`/admin/reports${query}`);
      if (res.success && res.data) {
        setReports(res.data);
      } else {
        setReports({
          grossOrderValue: 0,
          totalDiscounts: 0,
          totalDeliveryAndPackaging: 0,
          totalTax: 0,
          totalRefunds: 0,
          platformCommission: 0,
          restaurantNetPayout: 0,
          netSales: 0,
          totalOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          salesByRestaurant: [],
          bestSellingDishes: [],
          localityMetrics: [],
        });
      }
    } catch {
      toast.error('Network Error', 'Could not retrieve financial reports');
      setReports({
        grossOrderValue: 0,
        totalDiscounts: 0,
        totalDeliveryAndPackaging: 0,
        totalTax: 0,
        totalRefunds: 0,
        platformCommission: 0,
        restaurantNetPayout: 0,
        netSales: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        salesByRestaurant: [],
        bestSellingDishes: [],
        localityMetrics: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedRestaurant, selectedLocality]);

  const handleExportCSV = () => {
    if (!reports) return;

    let csv = 'Metric,Value\n';
    csv += `Gross Order Value (GOV),₹${reports.grossOrderValue}\n`;
    csv += `Total Customer Discounts,₹${reports.totalDiscounts}\n`;
    csv += `Delivery and Packaging Charges,₹${reports.totalDeliveryAndPackaging}\n`;
    csv += `GST Tax Collected,₹${reports.totalTax}\n`;
    csv += `Total Refunds,₹${reports.totalRefunds}\n`;
    csv += `Platform Commission (Aajori Revenue),₹${reports.platformCommission}\n`;
    csv += `Restaurant Net Settlement Payable,₹${reports.restaurantNetPayout}\n`;
    csv += `Total Orders,${reports.totalOrders}\n`;
    csv += `Delivered Orders,${reports.deliveredOrders}\n\n`;

    csv += 'Restaurant Breakdown\nRestaurant Name,Orders,Gross Sales (₹),Discounts (₹),Net Payout (₹),Platform Commission (₹)\n';
    reports.salesByRestaurant.forEach((r) => {
      csv += `"${r.restaurantName}",${r.orderCount},${r.grossSales},${r.discounts},${r.restaurantNetPayout},${r.commissionEarned}\n`;
    });

    csv += '\nBest Selling Dishes\nDish Name,Restaurant,Quantity Sold,Revenue Generated (₹)\n';
    reports.bestSellingDishes.forEach((d) => {
      csv += `"${d.name}","${d.restaurantName}",${d.quantity},${d.revenue}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aajori_settlement_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report Exported', 'CSV settlement breakdown downloaded successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            Financial Reports & Settlement Reconciliation
          </h2>
          <p className="text-sm text-slate-500">
            Authoritative platform commission accounting, restaurant disbursements & sales density
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Partner Kitchens</option>
            {restaurantsList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            disabled={!reports}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Accounting Principles Banner */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Strict Accounting Formula Applied: </span>
          <span>
            Total Customer GMV is NOT platform revenue. Platform Revenue = 15% Restaurant Commission + Delivery & Packaging Fees.
            Restaurant Net Payout = Food Subtotal - 15% Platform Commission. All calculations reconcile with verified orders.
          </span>
        </div>
      </div>

      {reports && (
        <>
          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Order Value (GOV)</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">₹{reports.grossOrderValue.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400 mt-1">Total food value ordered</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discounts Absorbed</span>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">₹{reports.totalDiscounts.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400 mt-1">Promotional coupon subsidies</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Commission (Revenue)</span>
              <div className="text-2xl font-bold font-mono text-brand-600 mt-1">₹{reports.platformCommission.toLocaleString()}</div>
              <p className="text-[11px] text-brand-700 font-semibold mt-1">Net Aajori platform earnings</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Restaurant Settlements</span>
              <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">₹{reports.restaurantNetPayout.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400 mt-1">Net disbursements due to kitchens</p>
            </div>
          </div>

          {/* Restaurant Sales Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-brand-600" />
                Performance Breakdown by Restaurant Partner
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Restaurant Partner</th>
                    <th className="py-3 px-4">Orders Fulfilled</th>
                    <th className="py-3 px-4">Gross Sales (₹)</th>
                    <th className="py-3 px-4">Discounts (₹)</th>
                    <th className="py-3 px-4">Platform Commission (15%)</th>
                    <th className="py-3 px-4 text-right">Net Kitchen Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {reports.salesByRestaurant.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                        No sales recorded for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    reports.salesByRestaurant.map((r) => (
                      <tr key={r.restaurantId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-sans font-bold text-slate-800">{r.restaurantName}</td>
                        <td className="py-3.5 px-4 text-slate-600">{r.orderCount}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">₹{r.grossSales.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-emerald-600">₹{r.discounts.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-brand-600 font-bold">₹{r.commissionEarned.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-indigo-700">₹{r.restaurantNetPayout.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grid: Best-Selling Dishes & Locality Density */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Selling Dishes */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Best-Selling Delicacies</h3>
              </div>
              <div className="space-y-3">
                {reports.bestSellingDishes.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">No dish sales recorded yet.</div>
                ) : (
                  reports.bestSellingDishes.map((dish, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{dish.name}</div>
                        <div className="text-[11px] text-slate-400">{dish.restaurantName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">₹{dish.revenue.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-500">{dish.quantity} portions ordered</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Locality Density */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <MapPin className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-slate-800 text-sm">Locality Order Density</h3>
              </div>
              <div className="space-y-3">
                {reports.localityMetrics.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">No delivery locality records yet.</div>
                ) : (
                  reports.localityMetrics.map((loc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{loc.locality}</div>
                        <div className="text-[11px] text-slate-400">Avg distance: {loc.avgDistanceKm} km</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 bg-brand-50 text-brand-700 font-bold rounded-lg">
                          {loc.orders} orders
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
