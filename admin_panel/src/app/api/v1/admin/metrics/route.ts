import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const [users, restaurants, orders, partners] = await Promise.all([
      ServerDb.getAllUsers(),
      ServerDb.getAllRestaurants(),
      ServerDb.getAllOrders(),
      ServerDb.getAllDeliveryPartners(),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;

    return apiSuccess({
      totalUsers: users.length,
      totalCustomers: users.filter((u) => u.role === 'CUSTOMER').length,
      totalRestaurants: restaurants.length,
      activeRestaurants: restaurants.filter((r) => r.isActive).length,
      totalOrders: orders.length,
      pendingOrders,
      totalRiders: partners.length,
      activeRiders: partners.filter((p) => p.status === 'ACTIVE').length,
      totalRevenue,
      todayRevenue: totalRevenue,
      currencySymbol: '₹',
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve metrics', 500);
  }
}
