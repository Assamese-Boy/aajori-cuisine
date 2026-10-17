import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import webpush from 'web-push';
import { db } from '../../data/mock-db';
import { whatsAppClientService } from '../whatsapp/whatsapp-client.service';
import { env } from '../../config/env';

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

export interface WebPushSubscription {
  id: string;
  userId?: string;
  role?: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  createdAt: string;
}

interface SseClient {
  id: string;
  res: Response;
  userId?: string;
  role?: string;
}

export class NotificationService {
  private notifications: NotificationPayload[] = [];
  private sseClients: Map<string, SseClient> = new Map();
  private pushSubscriptions: Map<string, WebPushSubscription> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;
  private vapidKeys: { publicKey: string; privateKey: string };

  constructor() {
    // 1. Initialize VAPID Keys: use environment variables if provided, or generate a zero-dependency pair
    const pubKey = process.env.VAPID_PUBLIC_KEY;
    const privKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:support@aajori.in';

    if (pubKey && privKey) {
      this.vapidKeys = { publicKey: pubKey, privateKey: privKey };
    } else {
      // Auto-generate standard W3C VAPID keypair so Web Push works out of the box with zero third-party accounts
      this.vapidKeys = webpush.generateVAPIDKeys();
    }

    try {
      webpush.setVapidDetails(subject, this.vapidKeys.publicKey, this.vapidKeys.privateKey);
      console.log('[NotificationService] Standard W3C VAPID Web Push initialized successfully.');
    } catch (err) {
      console.warn('[NotificationService] VAPID initialization note:', err);
    }

    // 2. Keepalive ping every 25s for active SSE sockets
    this.heartbeatInterval = setInterval(() => {
      this.broadcastKeepAlive();
    }, 25000);
  }

  /**
   * Returns the VAPID Public Key for client browser PushManager subscriptions
   */
  public getVapidPublicKey(): string {
    return this.vapidKeys.publicKey;
  }

  /**
   * Registers an active Server-Sent Events (SSE) browser client
   */
  public addSseClient(id: string, res: Response, userId?: string, role?: string): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`: connected clientId=${id}\n\n`);
    this.sseClients.set(id, { id, res, userId, role });

    res.on('close', () => {
      this.removeSseClient(id);
    });
  }

  public removeSseClient(id: string): void {
    this.sseClients.delete(id);
  }

  /**
   * Dispatches a notification across all channels:
   * 1. Active Browser Windows via SSE (Zero latency, live state sync)
   * 2. Background Mobile/Desktop Web Push via native W3C Web Push Protocol
   * 3. WhatsApp Messaging Gateway (if phone present)
   */
  public async dispatch(
    recipientUserId: string | undefined,
    event: NotificationEvent,
    title: string,
    message: string,
    data?: Record<string, any>,
    channels: NotificationChannel[] = ['PUSH', 'IN_APP', 'WHATSAPP'],
    recipientRole?: 'ADMIN' | 'CUSTOMER' | 'ALL' | 'RESTAURANT' | 'DELIVERY'
  ): Promise<NotificationPayload> {
    const notification: NotificationPayload = {
      id: uuidv4(),
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

    // Store in history
    this.notifications.unshift(notification);
    if (this.notifications.length > 500) {
      this.notifications.pop();
    }

    // 1. Dispatch over real-time SSE stream
    this.broadcastToSse(notification);

    // 2. Dispatch via W3C Web Push (reaches background/minimized devices)
    if (channels.includes('PUSH')) {
      this.dispatchWebPush(notification).catch((err) => {
        console.warn('[Web Push Dispatch Note]', err?.message || err);
      });
    }

    // 3. Dispatch via WhatsApp if configured
    if (channels.includes('WHATSAPP') && recipientUserId) {
      const user = db.users.get(recipientUserId);
      if (user && user.phone) {
        const formattedMsg = `🔔 *${title}*\n\n${message}`;
        await whatsAppClientService.sendTextMessage(user.phone, formattedMsg).catch((err) => {
          console.error('[Notification WhatsApp Dispatch Error]', err);
        });
      }
    }

    return notification;
  }

  /**
   * Sends encrypted payload via standard W3C Web Push to browser vendor push services (Google, Apple, Mozilla)
   */
  private async dispatchWebPush(notification: NotificationPayload): Promise<void> {
    const payloadString = JSON.stringify({
      title: notification.title,
      message: notification.message,
      event: notification.event,
      data: notification.data,
      createdAt: notification.createdAt,
    });

    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER'];

    for (const [subId, subRecord] of this.pushSubscriptions.entries()) {
      let isRecipient = false;

      if (notification.recipientRole === 'ALL') {
        isRecipient = true;
      } else if (notification.recipientRole === 'ADMIN') {
        if (subRecord.role && adminRoles.includes(subRecord.role)) {
          isRecipient = true;
        }
      } else if (notification.recipientUserId && subRecord.userId === notification.recipientUserId) {
        isRecipient = true;
      } else if (!notification.recipientUserId && !notification.recipientRole) {
        isRecipient = true;
      }

      if (isRecipient && subRecord.subscription && subRecord.subscription.endpoint) {
        try {
          await webpush.sendNotification(subRecord.subscription as any, payloadString);
        } catch (error: any) {
          // If subscription has expired (HTTP 410 or 404), clean it up
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            this.pushSubscriptions.delete(subId);
          }
        }
      }
    }
  }

  private broadcastToSse(notification: NotificationPayload): void {
    const rawPayload = `data: ${JSON.stringify(notification)}\n\n`;
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER', 'RESTAURANT_MANAGER'];

    for (const [_, client] of this.sseClients.entries()) {
      try {
        let shouldSend = false;

        if (notification.recipientRole === 'ALL') {
          shouldSend = true;
        } else if (notification.recipientRole === 'ADMIN') {
          if (client.role && adminRoles.includes(client.role)) {
            shouldSend = true;
          }
        } else if (notification.recipientUserId && client.userId === notification.recipientUserId) {
          shouldSend = true;
        } else if (!notification.recipientUserId && !notification.recipientRole) {
          shouldSend = true;
        }

        if (shouldSend) {
          client.res.write(rawPayload);
        }
      } catch (err) {
        console.error('[SSE Send Error]', err);
      }
    }
  }

  private broadcastKeepAlive(): void {
    for (const [id, client] of this.sseClients.entries()) {
      try {
        client.res.write(`: keepalive ${Date.now()}\n\n`);
      } catch (_) {
        this.sseClients.delete(id);
      }
    }
  }

  /**
   * Registers a client device's PushSubscription object from PushManager.subscribe()
   */
  public registerPushSubscription(subData: {
    userId?: string;
    role?: string;
    subscription: any;
  }): WebPushSubscription {
    const id = uuidv4();
    const record: WebPushSubscription = {
      id,
      userId: subData.userId,
      role: subData.role,
      subscription: subData.subscription,
      createdAt: new Date().toISOString(),
    };
    this.pushSubscriptions.set(id, record);
    return record;
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

  public getNotificationsForUser(userId: string): NotificationPayload[] {
    return this.getNotifications(userId);
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

export const notificationService = new NotificationService();
