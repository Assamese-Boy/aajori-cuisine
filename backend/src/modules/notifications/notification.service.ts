import { v4 as uuidv4 } from 'uuid';

export type NotificationEvent =
  | 'ORDER_CREATED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_REJECTED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'RIDER_ASSIGNED'
  | 'ORDER_PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED';

export interface NotificationPayload {
  id: string;
  recipientUserId: string;
  event: NotificationEvent;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: ('PUSH' | 'WHATSAPP' | 'SMS' | 'IN_APP')[];
  createdAt: string;
}

export class NotificationService {
  private notifications: NotificationPayload[] = [];

  public async dispatch(
    recipientUserId: string,
    event: NotificationEvent,
    title: string,
    message: string,
    data?: Record<string, any>,
    channels: ('PUSH' | 'WHATSAPP' | 'SMS' | 'IN_APP')[] = ['PUSH', 'IN_APP']
  ): Promise<NotificationPayload> {
    const notification: NotificationPayload = {
      id: uuidv4(),
      recipientUserId,
      event,
      title,
      message,
      data,
      channels,
      createdAt: new Date().toISOString(),
    };

    this.notifications.push(notification);

    // If channels include WhatsApp and user has phone, dispatch via WhatsApp service
    // If channels include PUSH, dispatch via FCM if configured
    return notification;
  }

  public getNotificationsForUser(userId: string): NotificationPayload[] {
    return this.notifications
      .filter((n) => n.recipientUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const notificationService = new NotificationService();
