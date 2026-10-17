import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantFilter = searchParams.get('restaurantId');
    const localityFilter = searchParams.get('locality');

    const [allOrders, restaurants] = await Promise.all([
      ServerDb.getAllOrders(),
      ServerDb.getAllRestaurants(),
    ]);

    // Build restaurant lookup map
    const restaurantMap = new Map<string, string>();
    restaurants.forEach((r) => restaurantMap.set(r.id, r.name));

    // Filter orders
    let orders = allOrders;
    if (restaurantFilter && restaurantFilter !== 'ALL') {
      orders = orders.filter((o) => o.restaurantId === restaurantFilter);
    }
    if (localityFilter && localityFilter !== 'ALL') {
      orders = orders.filter((o) => {
        const addr = o.deliveryAddress || {};
        const fullAddr = `${addr.addressLine1 || ''} ${addr.city || ''} ${addr.locality || ''}`.toLowerCase();
        return fullAddr.includes(localityFilter.toLowerCase());
      });
    }

    const grossOrderValue = orders.reduce((sum, o) => sum + (Number(o.subtotal) || Number(o.total) || 0), 0);
    const totalDiscounts = orders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
    const totalDeliveryAndPackaging = orders.reduce((sum, o) => sum + (Number(o.deliveryFee) || 0), 0);
    const totalTax = orders.reduce((sum, o) => sum + (Number(o.tax) || 0), 0);
    const totalRefunds = orders
      .filter((o) => o.status === 'CANCELLED' || o.paymentStatus === 'REFUNDED')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const platformCommission = Math.round(grossOrderValue * 0.15 * 100) / 100;
    const restaurantNetPayout = Math.max(0, Math.round((grossOrderValue - totalDiscounts - platformCommission) * 100) / 100);
    const netSales = Math.round((grossOrderValue - totalDiscounts + totalDeliveryAndPackaging + totalTax) * 100) / 100;

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;

    // Sales by Restaurant
    const restaurantStats = new Map<string, { orderCount: number; grossSales: number; discounts: number }>();
    orders.forEach((o) => {
      const rId = o.restaurantId || 'unknown';
      const cur = restaurantStats.get(rId) || { orderCount: 0, grossSales: 0, discounts: 0 };
      cur.orderCount += 1;
      cur.grossSales += Number(o.subtotal) || Number(o.total) || 0;
      cur.discounts += Number(o.discount) || 0;
      restaurantStats.set(rId, cur);
    });

    const salesByRestaurant = Array.from(restaurantStats.entries()).map(([rId, st]) => {
      const commission = Math.round(st.grossSales * 0.15 * 100) / 100;
      const netPayout = Math.max(0, Math.round((st.grossSales - st.discounts - commission) * 100) / 100);
      return {
        restaurantId: rId,
        restaurantName: restaurantMap.get(rId) || 'Kitchen Partner',
        orderCount: st.orderCount,
        grossSales: Math.round(st.grossSales * 100) / 100,
        discounts: Math.round(st.discounts * 100) / 100,
        restaurantNetPayout: netPayout,
        commissionEarned: commission,
      };
    });

    // Best Selling Dishes
    const dishStats = new Map<string, { restaurantName: string; quantity: number; revenue: number }>();
    orders.forEach((o) => {
      const rName = restaurantMap.get(o.restaurantId) || o.restaurantName || 'Kitchen Partner';
      (o.items || []).forEach((item: any) => {
        const dishName = item.name || 'Dish Item';
        const cur = dishStats.get(dishName) || { restaurantName: rName, quantity: 0, revenue: 0 };
        const qty = Number(item.quantity) || 1;
        const rev = Number(item.subtotal) || (Number(item.unit_price || item.price || 0) * qty);
        cur.quantity += qty;
        cur.revenue += rev;
        dishStats.set(dishName, cur);
      });
    });

    const bestSellingDishes = Array.from(dishStats.entries())
      .map(([name, data]) => ({
        name,
        restaurantName: data.restaurantName,
        quantity: data.quantity,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Locality Metrics
    const locMap = new Map<string, { orders: number; totalDist: number }>();
    orders.forEach((o) => {
      const addr = o.deliveryAddress || {};
      const loc = addr.locality || addr.city || (addr.addressLine1 ? addr.addressLine1.split(',')[0] : 'Guwahati Urban');
      const cur = locMap.get(loc) || { orders: 0, totalDist: 0 };
      cur.orders += 1;
      cur.totalDist += 3.5; // average delivery distance estimate in km
      locMap.set(loc, cur);
    });

    const localityMetrics = Array.from(locMap.entries()).map(([locality, data]) => ({
      locality,
      orders: data.orders,
      avgDistanceKm: Math.round((data.totalDist / (data.orders || 1)) * 10) / 10,
    }));

    return apiSuccess({
      grossOrderValue: Math.round(grossOrderValue * 100) / 100,
      totalDiscounts: Math.round(totalDiscounts * 100) / 100,
      totalDeliveryAndPackaging: Math.round(totalDeliveryAndPackaging * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      platformCommission,
      restaurantNetPayout,
      netSales,
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      salesByRestaurant,
      bestSellingDishes,
      localityMetrics,
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to generate financial reports', 500);
  }
}
