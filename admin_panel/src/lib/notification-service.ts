// ============================================================================
// AAJORI CUISINE - Server Notification Service
// Coordinates Push Notifications (Firebase FCM + W3C Web Push) and Realtime SSE
// ============================================================================

import { randomUUID } from 'crypto';
import webpush from 'web-push';
import { sendFcmNotification } from './firebase-admin';

export type NotificationEvent =
  | 'ORDER_CREATED'
  | 'NEW_ORDER_RECEIVED'
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
  | 'REFUND_COMPLETED'
  | 'TEST_NOTIFICATION'
  | 'SYSTEM_ALERT';

export type NotificationChannel = 'PUSH' | 'WHATSAPP' | 'SMS' | 'IN_APP';

export interface NotificationPayload {
  id: string;
  recipientUserId?: string;
  recipientRole?: 'ADMIN' | 'CUSTOMER' | 'ALL' | 'RESTAURANT' | 'DELIVERY';
  event: NotificationEvent;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  isRead: boolean;
  createdAt: string;
}

export interface DevicePushRegistration {
  id: string;
  userId?: string;
  role?: string;
  fcmToken?: string;
  subscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  createdAt: string;
}

export class NotificationService {
  private notifications: NotificationPayload[] = [];
  private deviceTokens: Map<string, DevicePushRegistration> = new Map();
  private sseControllers: Map<string, {
    controller: ReadableStreamDefaultController;
    userId?: string;
    role?: string;
  }> = new Map();
  private vapidKeys: { publicKey: string; privateKey: string };

  constructor() {
    // 1. Initialize VAPID Keys: use env if provided or generate valid pair
    const pubKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const privKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:support@aajori.in';

    if (pubKey && privKey) {
      this.vapidKeys = { publicKey: pubKey, privateKey: privKey };
    } else {
      this.vapidKeys = webpush.generateVAPIDKeys();
    }

    try {
      webpush.setVapidDetails(subject, this.vapidKeys.publicKey, this.vapidKeys.privateKey);
      console.log('[NotificationService] VAPID Web Push initialized successfully.');
    } catch (err) {
      console.warn('[NotificationService] VAPID initialization note:', err);
    }
  }

  public getVapidPublicKey(): string {
    return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || this.vapidKeys.publicKey;
  }

  /**
   * Registers a client device for notifications (supports both Firebase FCM tokens and W3C Push subscriptions)
   */
  public registerPushSubscription(subData: {
    userId?: string;
    role?: string;
    fcmToken?: string;
    subscription?: any;
  }): DevicePushRegistration {
    // Avoid duplicate registration for identical token/endpoint
    for (const [existingId, existing] of this.deviceTokens.entries()) {
      if (
        (subData.fcmToken && existing.fcmToken === subData.fcmToken) ||
        (subData.subscription?.endpoint && existing.subscription?.endpoint === subData.subscription.endpoint)
      ) {
        existing.userId = subData.userId || existing.userId;
        existing.role = subData.role || existing.role;
        return existing;
      }
    }

    const id = randomUUID();
    const record: DevicePushRegistration = {
      id,
      userId: subData.userId,
      role: subData.role,
      fcmToken: subData.fcmToken,
      subscription: subData.subscription,
      createdAt: new Date().toISOString(),
    };

    this.deviceTokens.set(id, record);
    console.log(`[NotificationService] Registered device: id=${id}, role=${subData.role || 'GUEST'}, hasFCM=${Boolean(subData.fcmToken)}`);
    return record;
  }

  /**
   * Dispatches a notification across all channels (Firebase FCM, W3C WebPush, SSE, In-app)
   */
  public async dispatch(
    recipientUserId: string | undefined,
    event: NotificationEvent,
    title: string,
    message: string,
    data?: Record<string, any>,
    channels: NotificationChannel[] = ['PUSH', 'IN_APP'],
    recipientRole?: 'ADMIN' | 'CUSTOMER' | 'ALL' | 'RESTAURANT' | 'DELIVERY'
  ): Promise<NotificationPayload> {
    const notification: NotificationPayload = {
      id: randomUUID(),
      recipientUserId,
      recipientRole,
      event,
      title,
      message,
      data,
      channels,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(notification);
    if (this.notifications.length > 500) {
      this.notifications.pop();
    }

    // 1. Dispatch over real-time SSE stream for open browser windows
    this.broadcastToSse(notification);

    // 2. Dispatch via Push (Firebase FCM + W3C Web Push)
    if (channels.includes('PUSH')) {
      await this.dispatchPushNotifications(notification).catch((err) => {
        console.warn('[Push Dispatch Warning]', err?.message || err);
      });
    }

    return notification;
  }

  private async dispatchPushNotifications(notification: NotificationPayload): Promise<void> {
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER'];
    const targetUrl = notification.data?.orderId
      ? (notification.recipientRole === 'ADMIN' ? '/orders' : `/order/${notification.data.orderId}`)
      : '/orders';

    const fcmTokensToSend: string[] = [];
    const webPushSubsToSend: any[] = [];

    for (const [id, record] of this.deviceTokens.entries()) {
      let isRecipient = false;

      if (notification.recipientRole === 'ALL') {
        isRecipient = true;
      } else if (notification.recipientRole === 'ADMIN') {
        if (record.role && adminRoles.includes(record.role)) {
          isRecipient = true;
        }
      } else if (notification.recipientUserId && record.userId === notification.recipientUserId) {
        isRecipient = true;
      } else if (!notification.recipientUserId && !notification.recipientRole) {
        isRecipient = true;
      }

      if (isRecipient) {
        if (record.fcmToken) {
          fcmTokensToSend.push(record.fcmToken);
        } else if (record.subscription && record.subscription.endpoint) {
          webPushSubsToSend.push({ id, sub: record.subscription });
        }
      }
    }

    // 1. Send via Firebase Cloud Messaging Admin SDK (FCM)
    if (fcmTokensToSend.length > 0) {
      await sendFcmNotification({
        tokens: fcmTokensToSend,
        title: notification.title,
        body: notification.message,
        data: {
          event: notification.event,
          orderId: notification.data?.orderId || '',
          url: targetUrl,
        },
        link: targetUrl,
      });
    }

    // Also dispatch to Firebase topic if role is ADMIN
    if (notification.recipientRole === 'ADMIN' || notification.recipientRole === 'ALL') {
      await sendFcmNotification({
        topic: 'admin_orders',
        title: notification.title,
        body: notification.message,
        data: {
          event: notification.event,
          orderId: notification.data?.orderId || '',
          url: targetUrl,
        },
        link: targetUrl,
      }).catch(() => {});
    }

    // 2. Fallback to native W3C WebPush for subscribers without FCM token
    if (webPushSubsToSend.length > 0) {
      const payloadString = JSON.stringify({
        title: notification.title,
        message: notification.message,
        event: notification.event,
        data: { ...notification.data, url: targetUrl },
        createdAt: notification.createdAt,
      });

      for (const item of webPushSubsToSend) {
        try {
          await webpush.sendNotification(item.sub, payloadString);
        } catch (error: any) {
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            this.deviceTokens.delete(item.id);
          }
        }
      }
    }
  }

  // SSE Stream Management
  public addSseController(id: string, controller: ReadableStreamDefaultController, userId?: string, role?: string): void {
    this.sseControllers.set(id, { controller, userId, role });
    // Send initial connection packet
    try {
      controller.enqueue(new TextEncoder().encode(`: connected id=${id}\n\n`));
    } catch (_) {}
  }

  public removeSseController(id: string): void {
    this.sseControllers.delete(id);
  }

  private broadcastToSse(notification: NotificationPayload): void {
    const rawPayload = `data: ${JSON.stringify(notification)}\n\n`;
    const encoded = new TextEncoder().encode(rawPayload);
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER'];

    for (const [id, client] of this.sseControllers.entries()) {
      try {
        let shouldSend = false;
        if (notification.recipientRole === 'ALL') shouldSend = true;
        else if (notification.recipientRole === 'ADMIN' && client.role && adminRoles.includes(client.role)) shouldSend = true;
        else if (notification.recipientUserId && client.userId === notification.recipientUserId) shouldSend = true;
        else if (!notification.recipientUserId && !notification.recipientRole) shouldSend = true;

        if (shouldSend) {
          client.controller.enqueue(encoded);
        }
      } catch (_) {
        this.sseControllers.delete(id);
      }
    }
  }

  public getNotifications(userId?: string, role?: string, limit: number = 50): NotificationPayload[] {
    const isAdmin = role && ['SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER'].includes(role);

    return this.notifications
      .filter((n) => {
        if (n.recipientRole === 'ALL') return true;
        if (isAdmin && n.recipientRole === 'ADMIN') return true;
        if (userId && n.recipientUserId === userId) return true;
        if (!userId && !role) return true;
        return false;
      })
      .slice(0, limit);
  }

  public markAsRead(id: string): boolean {
    const item = this.notifications.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      return true;
    }
    return false;
  }

  public markAllAsRead(userId?: string, role?: string): number {
    const isAdmin = role && ['SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER'].includes(role);
    let count = 0;

    for (const n of this.notifications) {
      let matches = false;
      if (n.recipientRole === 'ALL') matches = true;
      else if (isAdmin && n.recipientRole === 'ADMIN') matches = true;
      else if (userId && n.recipientUserId === userId) matches = true;

      if (matches && !n.isRead) {
        n.isRead = true;
        count++;
      }
    }
    return count;
  }

  public getUnreadCount(userId?: string, role?: string): number {
    return this.getNotifications(userId, role).filter((n) => !n.isRead).length;
  }
}

// Singleton instance preserved across Next.js API route calls
const globalForNotifications = global as unknown as { notificationService?: NotificationService };
export const notificationService =
  globalForNotifications.notificationService || new NotificationService();

if (process.env.NODE_ENV !== 'production') {
  globalForNotifications.notificationService = notificationService;
}
