'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';
import { soundService } from '../services/soundEffects';
import { apiRequest, getAuthToken, getCurrentStoredUser } from '../services/api';
import { requestFcmToken, listenForFcmMessages } from '../services/firebase';

export interface AdminNotificationItem {
  id: string;
  recipientUserId?: string;
  recipientRole?: string;
  event: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: string[];
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: AdminNotificationItem[];
  unreadCount: number;
  isPermissionGranted: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  requestNotificationPermission: () => Promise<boolean>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  triggerTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
  onNewOrderReceived?: () => void;
}> = ({ children, onNewOrderReceived }) => {
  const toast = useToast();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('aajori_admin_sound_enabled') !== 'false';
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const toggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aajori_admin_sound_enabled', String(enabled));
    }
  };

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

  // Register service worker on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((reg) => {
          console.log('[Admin FCM SW] Registered:', reg.scope);
        })
        .catch(() => {
          navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.warn('[Admin SW] Registration skipped/failed:', err);
          });
        });
    }
  }, []);

  // Request browser Notification permission & register FCM token
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.info('Not Supported', 'Browser does not support desktop notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsPermissionGranted(granted);

      if (granted) {
        toast.success('Live Order Alerts Enabled! 🚨', 'Admin Operations Control will alert you on every incoming order.');
        const user = getCurrentStoredUser();

        // 1. Register with Firebase Cloud Messaging (FCM)
        try {
          const fcmToken = await requestFcmToken();
          if (fcmToken) {
            await apiRequest('/notifications/subscribe', {
              method: 'POST',
              body: JSON.stringify({
                fcmToken,
                role: user?.role || 'SUPER_ADMIN',
                userId: user?.id,
              }),
            });
            console.log('[Admin NotificationContext] FCM token registered with server.');
          }
        } catch (fcmErr) {
          console.info('[Admin NotificationContext] FCM registration note:', fcmErr);
        }

        // 2. Also register native W3C VAPID push registration as fallback
        try {
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            const reg = await navigator.serviceWorker.ready;
            const vapidRes = await apiRequest<{ publicKey: string }>('/notifications/vapid-public-key');
            if (vapidRes?.success && vapidRes.data?.publicKey) {
              const convertedKey = urlBase64ToUint8Array(vapidRes.data.publicKey);
              const pushSubscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey,
              });
              await apiRequest('/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify({
                  subscription: pushSubscription.toJSON(),
                  role: user?.role || 'SUPER_ADMIN',
                  userId: user?.id,
                }),
              });
            }
          }
        } catch (pushErr) {
          console.info('[PushManager] Admin VAPID registration gracefully skipped (FCM/SSE active):', pushErr);
        }

        try {
          new Notification('Aajori Operations Center', {
            body: 'Web push notifications are now active for live order operations.',
            icon: '/favicon.ico',
          });
        } catch (_) {}
      } else {
        toast.info('Notifications Muted', 'Please allow notifications in browser address bar to get audible alerts.');
      }
      return granted;
    } catch (err) {
      console.error('Permission request error', err);
      return false;
    }
  }, [toast]);

  // Load existing notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiRequest<{ notifications: AdminNotificationItem[]; unreadCount: number }>('/notifications?role=SUPER_ADMIN');
      if (res?.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Connect to SSE live stream for real-time order alerts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = getAuthToken();
    const user = getCurrentStoredUser();

    const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    const apiBase = envBase
      ? envBase.replace(/\/+$/, '')
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:4000/api/v1'
        : '/api/v1');

    try {
      const fullUrl = apiBase.startsWith('http')
        ? `${apiBase}/notifications/stream`
        : `${window.location.origin}${apiBase}/notifications/stream`;

      const streamUrl = new URL(fullUrl);
      streamUrl.searchParams.set('role', user?.role || 'SUPER_ADMIN');
      if (user?.id) streamUrl.searchParams.set('userId', user.id);
      if (token) streamUrl.searchParams.set('token', token);

      const es = new EventSource(streamUrl.toString());
      eventSourceRef.current = es;

      es.onmessage = (event) => {
      try {
        const item: AdminNotificationItem = JSON.parse(event.data);
        if (!item || !item.id) return;

        // Check if matching admin role
        const isAdminRole = !item.recipientRole || item.recipientRole === 'ADMIN' || item.recipientRole === 'ALL';
        if (!isAdminRole && item.recipientUserId && user?.id && item.recipientUserId !== user.id) {
          return;
        }

        // 1. Play high-priority audible order chime for admin
        if (soundEnabled) {
          if (item.event === 'NEW_ORDER_RECEIVED' || item.event === 'ORDER_CREATED') {
            soundService.playAdminOrderChime();
          } else {
            soundService.playGentleAlert();
          }
        }

        // 2. Show native system notification if permitted (works even when tab is in background!)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(item.title, {
              body: item.message,
              icon: '/favicon.ico',
              tag: item.data?.orderId || 'admin-order',
            });
          } catch (_) {}
        }

        // 3. Show in-app Toast
        toast.info(item.title, item.message);

        // 4. Automatically trigger live data refresh for orders table & metrics!
        if (item.event === 'NEW_ORDER_RECEIVED' || item.event === 'ORDER_CREATED' || item.event.startsWith('ORDER_')) {
          if (onNewOrderReceived) {
            onNewOrderReceived();
          }
        }

        // 5. Update local state
        setNotifications((prev) => [item, ...prev]);
        setUnreadCount((c) => c + 1);
      } catch (e) {
        console.warn('[Admin SSE Parse Error]', e);
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects
    };

      return () => {
        es.close();
        eventSourceRef.current = null;
      };
    } catch (sseErr) {
      console.info('[Admin SSE] EventSource skipped or unreachable:', sseErr);
    }
  }, [soundEnabled, toast, onNewOrderReceived]);

  // Listen for foreground Firebase Cloud Messaging push events
  useEffect(() => {
    const unsub = listenForFcmMessages((payload) => {
      const title = payload.notification?.title || (payload.data as any)?.title || '🚨 Live Operations Alert';
      const body = payload.notification?.body || (payload.data as any)?.message || 'New activity on Aajori Operations.';

      if (soundEnabled) {
        soundService.playAdminOrderChime();
      }

      toast.info(title, body);

      if (onNewOrderReceived) {
        onNewOrderReceived();
      }

      const newItem: AdminNotificationItem = {
        id: (payload.data as any)?.id || `fcm_${Date.now()}`,
        event: (payload.data as any)?.event || 'ORDER_ALERT',
        title,
        message: body,
        data: payload.data as any,
        channels: ['PUSH'],
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [newItem, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [soundEnabled, toast, onNewOrderReceived]);

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/notifications/mark-all-read', {
        method: 'POST',
        body: JSON.stringify({ role: 'SUPER_ADMIN' }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All Caught Up', 'Marked all operational alerts as read.');
    } catch (_) {}
  };

  const triggerTestNotification = async () => {
    try {
      await apiRequest('/notifications/test', {
        method: 'POST',
        body: JSON.stringify({
          targetRole: 'ADMIN',
          title: '🚨 Test Order Received #AJR-202610-TEST',
          message: 'Order from Partha Pratim (+919864012345) • Total: ₹680 • 3 items. Tap to open.',
        }),
      });
    } catch (_) {}
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isPermissionGranted,
        soundEnabled,
        setSoundEnabled: toggleSound,
        requestNotificationPermission,
        markAsRead,
        markAllAsRead,
        triggerTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useAdminNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within a NotificationProvider');
  }
  return context;
};
