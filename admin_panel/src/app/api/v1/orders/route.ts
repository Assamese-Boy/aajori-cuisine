import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const orders = await ServerDb.getAllOrders();
    return apiSuccess(orders);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve orders', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return apiError('Order must contain at least one item', 400);
    }

    const order = await ServerDb.createOrder({
      customerId: body.customerId || 'usr_guest',
      customerName: body.customerName || 'Customer',
      customerPhone: body.customerPhone || '+919864000000',
      restaurantId: body.restaurantId || 'd0000000-0000-0000-0000-000000000001',
      restaurantName: body.restaurantName || 'Aajori Kitchen',
      items: body.items,
      subtotal: body.subtotal || 0,
      tax: body.tax || 0,
      deliveryFee: body.deliveryFee || 0,
      discount: body.discount || 0,
      total: body.total || 0,
      paymentMethod: body.paymentMethod || 'COD',
      paymentStatus: body.paymentStatus || 'PENDING',
      status: 'PENDING',
      deliveryAddress: body.deliveryAddress || {},
    });

    return apiSuccess(order, 201);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to create order', 500);
  }
}
