import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';
import { notificationService } from '@/lib/notification-service';

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

    // Try extracting authenticated user from header if customerId missing
    let customerId = body.customerId;
    let customerName = body.customerName;
    let customerPhone = body.customerPhone;

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if ((!customerId || customerId === 'guest') && token) {
      const extractedUserId = token.replace(/^jwt_live_/, '').replace(/_\d+$/, '');
      if (extractedUserId) {
        const authUser = await ServerDb.getUserById(extractedUserId).catch(() => null);
        if (authUser) {
          customerId = authUser.id;
          if (!customerName) customerName = authUser.fullName;
          if (!customerPhone) customerPhone = authUser.phone;
        }
      }
    }

    const order = await ServerDb.createOrder({
      customerId: customerId || 'guest',
      customerName: customerName || 'Customer',
      customerPhone: customerPhone || '',
      restaurantId: body.restaurantId || '',
      restaurantName: body.restaurantName || 'Kitchen Partner',
      items: body.items,
      subtotal: Number(body.subtotal) || 0,
      tax: Number(body.tax) || 0,
      deliveryFee: Number(body.deliveryFee) || 0,
      packagingFee: Number(body.packagingFee) || 0,
      deliveryDistanceKm: Number(body.deliveryDistanceKm) || 2.0,
      discount: Number(body.discount) || 0,
      total: Number(body.total) || 0,
      paymentMethod: body.paymentMethod || 'UPI',
      paymentStatus: body.paymentStatus || 'PENDING',
      status: 'PENDING',
      deliveryAddress: body.deliveryAddress || {},
      customerInstructions: body.customerInstructions || undefined,
      idempotencyKey: body.idempotencyKey || undefined,
    });

    // 1. Dispatch high-priority real-time alert to Operations Staff & Admins via Push, SSE, and In-App
    try {
      await notificationService.dispatch(
        undefined,
        'NEW_ORDER_RECEIVED',
        `🚨 New Order #${order.orderNumber}`,
        `₹${order.total} • ${order.customerName || 'Customer'} placed an order at ${order.restaurantName || 'Kitchen'}`,
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          restaurantName: order.restaurantName,
          customerName: order.customerName,
        },
        ['PUSH', 'IN_APP'],
        'ADMIN'
      );
    } catch (notifErr) {
      console.warn('[Orders POST] Admin notification dispatch warning:', notifErr);
    }

    // 2. Dispatch order confirmation to Customer
    if (order.customerId && order.customerId !== 'guest') {
      try {
        await notificationService.dispatch(
          order.customerId,
          'ORDER_CREATED',
          `🍲 Order #${order.orderNumber} Placed!`,
          `Your delicious meal from ${order.restaurantName || 'Aajori Cuisine'} has been placed successfully.`,
          { orderId: order.id, orderNumber: order.orderNumber, total: order.total },
          ['PUSH', 'IN_APP'],
          'CUSTOMER'
        );
      } catch (_) {}
    }

    return apiSuccess(order, 201);
  } catch (err: any) {
    console.error('[Orders POST] Error creating order:', err);
    return apiError(err?.message || 'Failed to create order', 500);
  }
}
