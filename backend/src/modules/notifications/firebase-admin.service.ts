// ============================================================================
// AAJORI CUISINE - Backend Firebase Admin Service
// Dispatches push notifications to Customer and Admin devices via Firebase Cloud Messaging
// ============================================================================

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let firebaseApp: App | null = null;
let messagingInstance: Messaging | null = null;

export function initFirebaseAdmin(): { app: App | null; messaging: Messaging | null } {
  if (firebaseApp && messagingInstance) {
    return { app: firebaseApp, messaging: messagingInstance };
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    messagingInstance = getMessaging(firebaseApp);
    return { app: firebaseApp, messaging: messagingInstance };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      privateKey = privateKey.replace(/\\n/g, '\n');

      firebaseApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

      messagingInstance = getMessaging(firebaseApp);
      console.log(`[Firebase Admin Backend] Initialized successfully for project: ${projectId}`);
      return { app: firebaseApp, messaging: messagingInstance };
    } catch (err) {
      console.warn('[Firebase Admin Backend] Initialization failed with provided credentials:', err);
      return { app: null, messaging: null };
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      firebaseApp = initializeApp();
      messagingInstance = getMessaging(firebaseApp);
      console.log('[Firebase Admin Backend] Initialized via GOOGLE_APPLICATION_CREDENTIALS');
      return { app: firebaseApp, messaging: messagingInstance };
    } catch (err) {
      console.warn('[Firebase Admin Backend] Init failed via GOOGLE_APPLICATION_CREDENTIALS:', err);
      return { app: null, messaging: null };
    }
  }

  return { app: null, messaging: null };
}

export interface FcmDispatchOptions {
  tokens?: string[];
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  link?: string;
  icon?: string;
}

export async function sendFcmNotification(options: FcmDispatchOptions) {
  const { messaging } = initFirebaseAdmin();
  if (!messaging) {
    return { success: false, error: 'Firebase Admin credentials not configured' };
  }

  const icon = options.icon || '/icon-192.png';
  const dataPayload: Record<string, string> = {
    title: options.title,
    message: options.body,
    timestamp: new Date().toISOString(),
    ...(options.data || {}),
  };

  if (options.link) {
    dataPayload.link = options.link;
  }

  if (options.topic) {
    try {
      const response = await messaging.send({
        topic: options.topic,
        notification: {
          title: options.title,
          body: options.body,
        },
        data: dataPayload,
        webpush: {
          notification: {
            title: options.title,
            body: options.body,
            icon,
            badge: icon,
            requireInteraction: true,
          },
          fcmOptions: options.link ? { link: options.link } : undefined,
        },
      });
      return { success: true, response };
    } catch (err: any) {
      console.warn(`[FCM Backend] Error sending to topic "${options.topic}":`, err?.message || err);
      return { success: false, error: err?.message };
    }
  }

  if (options.tokens && options.tokens.length > 0) {
    const validTokens = Array.from(new Set(options.tokens.filter(Boolean)));
    if (validTokens.length === 0) return { success: false };

    try {
      const response = await messaging.sendEachForMulticast({
        tokens: validTokens,
        notification: {
          title: options.title,
          body: options.body,
        },
        data: dataPayload,
        webpush: {
          notification: {
            title: options.title,
            body: options.body,
            icon,
            badge: icon,
            requireInteraction: true,
          },
          fcmOptions: options.link ? { link: options.link } : undefined,
        },
      });
      return { success: response.successCount > 0, successCount: response.successCount };
    } catch (err: any) {
      console.warn('[FCM Backend] Multicast dispatch error:', err?.message || err);
      return { success: false, error: err?.message };
    }
  }

  return { success: false };
}
