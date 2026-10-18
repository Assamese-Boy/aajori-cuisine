import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';
import { notificationService, NotificationEvent } from '@/lib/notification-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const status = body.status || body.toStatus;
    if (!status) {
      return apiError('Status is required', 400);
    }

    const cleanId = decodeURIComponent(params.id || '').trim().replace(/\/+$/, '');
    const updated = await ServerDb.updateOrderStatus(cleanId, status, body.reason);
    if (!updated) {
      return apiError('Order not found', 404);
    }

    // Dispatch status change notification
    try {
      const statusMap: Record<string, { event: NotificationEvent; title: string; message: string }> = {
        PAYMENT_CONFIRMED: {
          event: 'ORDER_ACCEPTED',
          title: '💳 Payment Received',
          message: `Order #${updated.orderNumber} payment confirmed and sent to kitchen.`,
        },
        RESTAURANT_ACCEPTED: {
          event: 'ORDER_ACCEPTED',
          title: '👨‍🍳 Kitchen Accepted Order',
          message: `Order #${updated.orderNumber} is accepted by the restaurant partner.`,
        },
        PREPARING: {
          event: 'ORDER_PREPARING',
          title: '🍳 Cooking in Progress',
          message: `Your food for order #${updated.orderNumber} is being freshly prepared.`,
        },
        READY_FOR_PICKUP: {
          event: 'ORDER_READY',
          title: '🥡 Food Ready for Pickup',
          message: `Order #${updated.orderNumber} is packed and ready for delivery partner pickup.`,
        },
        RIDER_ASSIGNED: {
          event: 'SYSTEM_ALERT',
          title: '🛵 Delivery Partner Assigned',
          message: `A delivery partner has been assigned to order #${updated.orderNumber}.`,
        },
        PICKED_UP: {
          event: 'OUT_FOR_DELIVERY',
          title: '🛵 Food Picked Up',
          message: `Delivery partner has picked up order #${updated.orderNumber} from the kitchen.`,
        },
        OUT_FOR_DELIVERY: {
          event: 'OUT_FOR_DELIVERY',
          title: '🛵 Out for Delivery!',
          message: `Order #${updated.orderNumber} is on the way to your address.`,
        },
        DELIVERED: {
          event: 'ORDER_DELIVERED',
          title: '🎉 Order Delivered!',
          message: `Order #${updated.orderNumber} has been delivered successfully. Enjoy your meal!`,
        },
        CANCELLED: {
          event: 'ORDER_CANCELLED',
          title: '❌ Order Cancelled',
          message: `Order #${updated.orderNumber} has been cancelled.`,
        },
      };

      const notif = statusMap[updated.status] || {
        event: 'SYSTEM_ALERT' as NotificationEvent,
        title: `Order #${updated.orderNumber} Status Updated`,
        message: `Status updated to ${updated.status}.`,
      };

      if (updated.customerId) {
        notificationService.dispatch(
          updated.customerId,
          notif.event,
          notif.title,
          notif.message,
          { orderId: updated.id, orderNumber: updated.orderNumber, status: updated.status },
          ['PUSH', 'IN_APP'],
          'CUSTOMER'
        ).catch(() => {});
      }
    } catch (_) {}

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update order status', 500);
  }
}
