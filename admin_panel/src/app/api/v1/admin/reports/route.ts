import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const [orders, restaurants] = await Promise.all([
      ServerDb.getAllOrders(),
      ServerDb.getAllRestaurants(),
    ]);

    const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length;

    return apiSuccess({
      totalRevenue,
      completedOrders,
      totalOrders: orders.length,
      averageOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
      activeRestaurants: restaurants.length,
      topRestaurants: restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        revenue: Math.round(totalRevenue * 0.33),
        ordersCount: Math.round(orders.length * 0.33),
      })),
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to generate reports', 500);
  }
}
