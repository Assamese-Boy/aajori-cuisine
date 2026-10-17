import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { soundService } from '../services/soundEffects';
import { apiRequest } from '../services/api';

export interface NotificationItem {
  id: string;
  recipientUserId?: string;
  event: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: string[];
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('aajori_sound_enabled') !== 'false';
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  // Persist sound preference
  const toggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aajori_sound_enabled', String(enabled));
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
        .register('/sw.js')
        .then((reg) => {
          console.log('[Aajori SW] Registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.warn('[Aajori SW] Registration skipped/failed:', err);
        });
    }
  }, []);

  // Request native browser notification permission
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
        toast.success('Live Alerts Enabled! 🔔', 'You will receive real-time push updates for your food orders.');

        // Attempt native W3C VAPID push registration (zero 3rd party required)
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
                  role: 'CUSTOMER',
                  userId: user?.id,
                }),
              });
            }
          }
        } catch (pushErr) {
          console.info('[PushManager] VAPID registration gracefully skipped (SSE & In-tab active):', pushErr);
        }

        // Show test confirmation
        try {
          new Notification('Aajori Cuisine', {
            body: 'Web push notifications are now active!',
            icon: '/icon-192.png',
          });
        } catch (_) {}
      } else {
        toast.info('Notifications Blocked', 'Please enable permissions in your browser bar to get order alerts.');
      }
      return granted;
    } catch (err) {
      console.error('Permission request error', err);
      return false;
    }
  }, [toast, user?.id]);

  // Load existing notifications history
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications');
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, user?.id]);

  // Connect to SSE live stream
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
    const apiBase = envBase
      ? envBase.replace(/\/+$/, '')
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api/v1'
        : 'https://cuisine-admin.aajori.in/api/v1');

    try {
      const fullUrl = apiBase.startsWith('http')
        ? `${apiBase}/notifications/stream`
        : `${window.location.origin}${apiBase}/notifications/stream`;

      const streamUrl = new URL(fullUrl);
      if (user?.id) streamUrl.searchParams.set('userId', user.id);
      streamUrl.searchParams.set('role', 'CUSTOMER');
      if (token) streamUrl.searchParams.set('token', token);

      const es = new EventSource(streamUrl.toString());
      eventSourceRef.current = es;

      es.onmessage = (event) => {
      try {
        const item: NotificationItem = JSON.parse(event.data);
        if (!item || !item.id) return;

        // Check if matching recipient
        if (item.recipientUserId && user?.id && item.recipientUserId !== user.id) {
          return;
        }

        // 1. Play audio chime
        if (soundEnabled) {
          soundService.playCustomerChime();
        }

        // 2. Show native system notification if permitted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(item.title, {
              body: item.message,
              icon: '/icon-192.png',
              tag: item.data?.orderId || 'aajori-order',
            });
          } catch (_) {}
        }

        // 3. Show in-app Toast
        toast.info(item.title, item.message);

        // 4. Update local state
        setNotifications((prev) => [item, ...prev]);
        setUnreadCount((c) => c + 1);
      } catch (e) {
        console.warn('[SSE Parse Error]', e);
      }
    };

    es.onerror = () => {
      // Browser EventSource automatically handles reconnection
    };

      return () => {
        es.close();
        eventSourceRef.current = null;
      };
    } catch (sseErr) {
      console.info('[SSE] EventSource skipped or unreachable:', sseErr);
    }
  }, [user?.id, token, soundEnabled, toast]);

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
        body: JSON.stringify({ userId: user?.id, role: 'CUSTOMER' }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All Caught Up', 'Marked all notifications as read.');
    } catch (_) {}
  };

  const triggerTestNotification = async () => {
    try {
      await apiRequest('/notifications/test', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId: user?.id,
          targetRole: 'CUSTOMER',
          title: '🍲 Test Order Notification',
          message: 'Real-time Web Push notification verified successfully!',
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

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
