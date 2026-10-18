import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
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
  | 'PROMOTION'
  | 'PROMOTIONAL_OFFER'
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
  private sseControllers: Map<
    string,
    {
      controller: ReadableStreamDefaultController;
      userId?: string;
      role?: string;
    }
  > = new Map();
  private vapidKeys: { publicKey: string; privateKey: string };

  constructor() {
    // 1. Initialize persistent VAPID Web Push protocol keys
    const fallbackPub = 'BKkXb4Piwtyf_WImDM8lSyBSvE4mscB1XfdSrwwY7DkgS2JM8QzYyHnxRlU1Y1v9KxhCEn-5kRM5xLuQowFFOW4';
    const fallbackPriv = 'oUXUF73BMJEoP5PshQYxQoOfOs-JxR950l6-a9AKKR0';

    const pubKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || fallbackPub;
    const privKey = process.env.VAPID_PRIVATE_KEY || fallbackPriv;
    const subject = process.env.VAPID_SUBJECT || 'mailto:support@aajori.in';

    this.vapidKeys = { publicKey: pubKey, privateKey: privKey };

    try {
      webpush.setVapidDetails(subject, this.vapidKeys.publicKey, this.vapidKeys.privateKey);
      console.log('[NotificationService] VAPID Web Push initialized successfully.');
    } catch (err) {
      console.warn('[NotificationService] VAPID initialization note:', err);
    }

    // 2. Load stored device tokens from disk so they survive server restarts
    this.loadDeviceTokensFromDisk();
  }

  private getTokensFilePath(): string {
    return path.join(
      process.env.VERCEL ? '/tmp' : path.join(process.cwd(), '.data'),
      'device_push_tokens.json'
    );
  }

  private loadDeviceTokensFromDisk(): void {
    try {
      const filePath = this.getTokensFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.id) {
              this.deviceTokens.set(item.id, item);
            }
          }
          console.log(`[NotificationService] Restored ${this.deviceTokens.size} registered device push tokens from disk.`);
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Load tokens note:', err);
    }
  }

  private saveDeviceTokensToDisk(): void {
    try {
      const filePath = this.getTokensFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(Array.from(this.deviceTokens.values()), null, 2), 'utf-8');
    } catch (err) {
      console.warn('[NotificationService] Save tokens note:', err);
    }
  }

  public getVapidPublicKey(): string {
    return this.vapidKeys.publicKey;
  }

  /**
   * Registers a client device for notifications (supports both W3C WebPush subscriptions and Firebase FCM tokens)
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
        if (subData.subscription) existing.subscription = subData.subscription;
        if (subData.fcmToken) existing.fcmToken = subData.fcmToken;
        this.saveDeviceTokensToDisk();
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
    this.saveDeviceTokensToDisk();
    console.log(
      `[NotificationService] Registered device: id=${id}, role=${subData.role || 'GUEST'}, hasFCM=${Boolean(
        subData.fcmToken
      )}, hasWebPush=${Boolean(subData.subscription)}`
    );
    return record;
  }

  /**
   * Dispatches a notification across all channels (Web Push, Firebase FCM, SSE, In-app)
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

    // 1. Dispatch over real-time SSE stream for active open browser windows
    this.broadcastToSse(notification);

    // 2. Dispatch via Web Push & Firebase FCM for background/offline delivery
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
      ? notification.recipientRole === 'ADMIN'
        ? '/orders'
        : `/order/${notification.data.orderId}`
      : '/orders';

    const fcmTokensToSend: string[] = [];
    const webPushSubsToSend: any[] = [];

    for (const [id, record] of this.deviceTokens.entries()) {
      let isRecipient = false;
      const recordIsAdmin = Boolean(record.role && adminRoles.includes(record.role));

      if (notification.recipientRole === 'ADMIN') {
        // Strictly only send to admin devices
        if (recordIsAdmin) {
          isRecipient = true;
        }
      } else if (notification.recipientRole === 'CUSTOMER') {
        // Customer targeted: order updates or general customer promotions
        if (notification.recipientUserId) {
          // Specific customer order update
          if (record.userId === notification.recipientUserId) {
            isRecipient = true;
          }
        } else {
          // Promotional / announcement: send to all customer/guest devices (never admin-only devices)
          if (!recordIsAdmin) {
            isRecipient = true;
          }
        }
      } else if (notification.recipientRole === 'ALL') {
        isRecipient = true;
      } else if (notification.recipientUserId && record.userId === notification.recipientUserId) {
        isRecipient = true;
      }

      if (isRecipient) {
        if (record.subscription && record.subscription.endpoint) {
          webPushSubsToSend.push({ id, sub: record.subscription });
        }
        if (record.fcmToken) {
          fcmTokensToSend.push(record.fcmToken);
        }
      }
    }

    // 1. Send via native standard W3C WebPush (reliable for Chrome, Edge, Firefox, Android, iOS)
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
            this.saveDeviceTokensToDisk();
          }
        }
      }
    }

    // 2. Also dispatch via Firebase Cloud Messaging Admin SDK if configured
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
      }).catch(() => {});
    }

    // 3. Dispatch to Firebase topic if role is ADMIN
    if (notification.recipientRole === 'ADMIN') {
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
  }

  // SSE Stream Management
  public addSseController(
    id: string,
    controller: ReadableStreamDefaultController,
    userId?: string,
    role?: string
  ): void {
    this.sseControllers.set(id, { controller, userId, role });
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
        const clientRoleUpper = (client.role || '').toUpperCase();
        const clientIsCustomer = clientRoleUpper === 'CUSTOMER';
        const clientIsAdmin =
          !clientIsCustomer &&
          (!client.role ||
            adminRoles.includes(clientRoleUpper) ||
            clientRoleUpper.includes('ADMIN') ||
            clientRoleUpper.includes('MANAGER') ||
            clientRoleUpper.includes('OWNER') ||
            clientRoleUpper.includes('SUPER'));

        if (notification.recipientRole === 'ADMIN') {
          // Deliver to operations & admin clients
          shouldSend = clientIsAdmin;
        } else if (notification.recipientRole === 'CUSTOMER') {
          // Customer targeted: order updates or customer promotions
          if (notification.recipientUserId) {
            shouldSend = client.userId === notification.recipientUserId;
          } else {
            shouldSend = clientIsCustomer;
          }
        } else if (notification.recipientRole === 'ALL') {
          shouldSend = true;
        } else if (notification.recipientUserId) {
          shouldSend = client.userId === notification.recipientUserId;
        }

        if (shouldSend) {
          client.controller.enqueue(encoded);
        }
      } catch (_) {
        this.sseControllers.delete(id);
      }
    }
  }

  public getNotifications(userId?: string, role?: string, limit: number = 50): NotificationPayload[] {
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER'];
    const isAdmin = Boolean(role && adminRoles.includes(role));

    return this.notifications
      .filter((n) => {
        // If notification is intended for ADMIN, ONLY admins can ever see it!
        if (n.recipientRole === 'ADMIN') {
          return isAdmin;
        }

        // If notification is for a specific user
        if (n.recipientUserId) {
          return userId === n.recipientUserId || isAdmin;
        }

        // If notification is for CUSTOMER
        if (n.recipientRole === 'CUSTOMER') {
          return !isAdmin || role === 'CUSTOMER' || role === 'ALL';
        }

        // If notification is for ALL
        if (n.recipientRole === 'ALL') {
          return true;
        }

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
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER'];
    const isAdmin = Boolean(role && adminRoles.includes(role));
    let count = 0;

    for (const n of this.notifications) {
      let matches = false;
      if (n.recipientRole === 'ADMIN') {
        matches = isAdmin;
      } else if (n.recipientRole === 'CUSTOMER') {
        matches = !isAdmin || role === 'CUSTOMER';
      } else if (n.recipientUserId && userId) {
        matches = n.recipientUserId === userId;
      } else if (n.recipientRole === 'ALL') {
        matches = true;
      }

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

// Global singleton instance preserved across Next.js API route calls
const globalForNotifications = global as unknown as { notificationService?: NotificationService };
export const notificationService =
  globalForNotifications.notificationService || new NotificationService();

globalForNotifications.notificationService = notificationService;
