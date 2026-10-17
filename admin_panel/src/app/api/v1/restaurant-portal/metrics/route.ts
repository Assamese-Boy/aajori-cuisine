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
    const restaurantId = searchParams.get('restaurantId') || '';

    const allOrders = await ServerDb.getAllOrders();
    const orders = restaurantId ? allOrders.filter((o) => o.restaurantId === restaurantId) : allOrders;

    const pendingCount = orders.filter((o) => ['CREATED', 'PENDING', 'CONFIRMED'].includes(o.status)).length;
    const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
    const readyCount = orders.filter((o) => o.status === 'READY_FOR_PICKUP').length;
    const completedCount = orders.filter((o) => o.status === 'DELIVERED').length;
    const todaySales = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.subtotal || 0), 0);

    return apiSuccess({
      pendingOrdersCount: pendingCount,
      preparingOrdersCount: preparingCount,
      readyOrdersCount: readyCount,
      completedOrdersCount: completedCount,
      todaySales,
      activeOrdersCount: pendingCount + preparingCount + readyCount,
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to fetch restaurant metrics', 500);
  }
}
