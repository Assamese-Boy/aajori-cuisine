import { describe, it, expect } from 'vitest';
import { notificationService } from '../src/modules/notifications/notification.service';
import { sendFcmNotification } from '../src/modules/notifications/firebase-admin.service';

describe('Firebase Cloud Messaging (FCM) & Web Push Engine', () => {
  it('should register a client FCM device token properly', () => {
    const fcmToken = 'fake_fcm_registration_token_district_assam_2026';
    const sub = notificationService.registerPushSubscription({
      userId: 'usr_fcm_customer_01',
      role: 'CUSTOMER',
      fcmToken,
    });

    expect(sub).toBeDefined();
    expect(sub.id).toBeDefined();
    expect(sub.fcmToken).toBe(fcmToken);
    expect(sub.role).toBe('CUSTOMER');
    expect(sub.userId).toBe('usr_fcm_customer_01');
  });

  it('should dispatch an order notification to registered customer and admin queues', async () => {
    const notif = await notificationService.dispatch(
      'usr_fcm_customer_01',
      'ORDER_CREATED',
      '🍲 Order Placed Successfully #AJR-FCM-001',
      'Your order has been received and sent to the restaurant kitchen.',
      { orderId: 'ord_fcm_test', orderNumber: 'AJR-FCM-001' },
      ['PUSH', 'IN_APP'],
      'CUSTOMER'
    );

    expect(notif).toBeDefined();
    expect(notif.event).toBe('ORDER_CREATED');
    expect(notif.recipientUserId).toBe('usr_fcm_customer_01');
    expect(notif.isRead).toBe(false);

    // Verify unread count and fetch
    const unread = notificationService.getUnreadCount('usr_fcm_customer_01', 'CUSTOMER');
    expect(unread).toBeGreaterThan(0);

    const history = notificationService.getNotifications('usr_fcm_customer_01');
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].title).toContain('Order Placed Successfully');
  });

  it('should gracefully handle sendFcmNotification without throwing when credentials are not configured', async () => {
    // When Firebase credentials are not provided in environment, it should fail gracefully with a safe error
    const result = await sendFcmNotification({
      tokens: ['fake_token_123'],
      title: 'Test FCM Notification',
      body: 'Testing graceful fallback behavior',
    });

    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });
});
