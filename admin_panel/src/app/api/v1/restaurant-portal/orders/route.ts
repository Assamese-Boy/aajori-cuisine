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

    let orders = await ServerDb.getAllOrders();
    if (restaurantId) {
      orders = orders.filter((o) => o.restaurantId === restaurantId);
    }

    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      restaurantId: o.restaurantId,
      status: o.status,
      createdAt: o.createdAt,
      items: o.items.map((it: any) => ({
        id: it.id,
        name: it.name,
        quantity: it.quantity,
        subtotal: it.subtotal || it.unit_price * it.quantity,
      })),
      pricing: {
        subtotal: o.subtotal,
        totalCustomerPrice: o.total,
      },
      deliveryAddress: {
        addressLine1: o.deliveryAddress?.addressLine1 || o.deliveryAddress?.city || 'Customer Address',
      },
      customerInstructions: o.customerInstructions || '',
    }));

    return apiSuccess(mapped);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to fetch restaurant orders', 500);
  }
} 
