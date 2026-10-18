import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';
import { notificationService, NotificationEvent } from '@/lib/notification-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cleanId = (params.id || '').trim().replace(/\/+$/, '');
    const order = await ServerDb.getOrderById(cleanId);
    if (!order) {
      return apiError('Order not found', 404);
    }
    return apiSuccess(order);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve order', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cleanId = (params.id || '').trim().replace(/\/+$/, '');
    const body = await req.json();
    const updated = await ServerDb.updateOrderStatus(cleanId, body.status);
    if (!updated) {
      return apiError('Order not found or update failed', 404);
    }

    // Determine readable status description
    const statusMap: Record<string, { event: NotificationEvent; title: string; message: string }> = {
      CONFIRMED: {
        event: 'ORDER_ACCEPTED',
        title: '👨‍🍳 Kitchen Confirmed Order',
        message: `Order #${updated.orderNumber} is confirmed and sent to kitchen.`,
      },
      PREPARING: {
        event: 'ORDER_PREPARING',
        title: '🍳 Cooking in Progress',
        message: `Your food for order #${updated.orderNumber} is now being prepared fresh.`,
      },
      READY_FOR_PICKUP: {
        event: 'ORDER_READY',
        title: '🥡 Order Ready For Pickup',
        message: `Order #${updated.orderNumber} is packed and ready for delivery partner pickup.`,
      },
      OUT_FOR_DELIVERY: {
        event: 'OUT_FOR_DELIVERY',
        title: '🛵 Out for Delivery!',
        message: `Order #${updated.orderNumber} is on the way to your address.`,
      },
      DELIVERED: {
        event: 'ORDER_DELIVERED',
        title: '🎉 Order Delivered!',
        message: `Order #${updated.orderNumber} has been delivered. Bon appétit!`,
      },
      CANCELLED: {
        event: 'ORDER_CANCELLED',
        title: '❌ Order Cancelled',
        message: `Order #${updated.orderNumber} has been cancelled.`,
      },
    };

    const notifInfo = statusMap[body.status] || {
      event: 'SYSTEM_ALERT' as NotificationEvent,
      title: `Order #${updated.orderNumber} Status Updated`,
      message: `Status changed to ${body.status}.`,
    };

    // Dispatch to customer
    if (updated.customerId) {
      notificationService.dispatch(
        updated.customerId,
        notifInfo.event,
        notifInfo.title,
        notifInfo.message,
        { orderId: updated.id, orderNumber: updated.orderNumber, status: body.status },
        ['PUSH', 'IN_APP'],
        'CUSTOMER'
      ).catch(() => {});
    }

    // Dispatch to admin for synchronization
    notificationService.dispatch(
      undefined,
      notifInfo.event,
      `Status: Order #${updated.orderNumber} -> ${body.status}`,
      `Order #${updated.orderNumber} updated to ${body.status}`,
      { orderId: updated.id, orderNumber: updated.orderNumber, status: body.status },
      ['IN_APP'],
      'ADMIN'
    ).catch(() => {});

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update order', 500);
  }
}

export const PUT = PATCH;

