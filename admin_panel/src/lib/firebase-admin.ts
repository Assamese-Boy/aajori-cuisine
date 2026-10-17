// ============================================================================
// AAJORI CUISINE - Server-Side Firebase Admin SDK & FCM Dispatcher
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
      console.log(`[Firebase Admin] Initialized successfully for project: ${projectId}`);
      return { app: firebaseApp, messaging: messagingInstance };
    } catch (err) {
      console.warn('[Firebase Admin] Initialization failed with provided credentials:', err);
      return { app: null, messaging: null };
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      firebaseApp = initializeApp();
      messagingInstance = getMessaging(firebaseApp);
      console.log('[Firebase Admin] Initialized successfully via GOOGLE_APPLICATION_CREDENTIALS');
      return { app: firebaseApp, messaging: messagingInstance };
    } catch (err) {
      console.warn('[Firebase Admin] Init failed via GOOGLE_APPLICATION_CREDENTIALS:', err);
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

export interface FcmDispatchResult {
  success: boolean;
  sentCount: number;
  failureCount: number;
  error?: string;
}

/**
 * Sends a push notification to specific FCM device registration tokens or a topic
 */
export async function sendFcmNotification(options: FcmDispatchOptions): Promise<FcmDispatchResult> {
  const { messaging } = initFirebaseAdmin();
  if (!messaging) {
    return {
      success: false,
      sentCount: 0,
      failureCount: 0,
      error: 'Firebase Admin not initialized (credentials missing in environment).',
    };
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

  // 1. Topic Broadcast
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

      console.log(`[FCM Admin] Dispatched to topic "${options.topic}": ${response}`);
      return { success: true, sentCount: 1, failureCount: 0 };
    } catch (err: any) {
      console.warn(`[FCM Admin] Error sending to topic "${options.topic}":`, err?.message || err);
      return { success: false, sentCount: 0, failureCount: 1, error: err?.message };
    }
  }

  // 2. Multicast to Device Tokens
  if (options.tokens && options.tokens.length > 0) {
    const validTokens = Array.from(new Set(options.tokens.filter(Boolean)));
    if (validTokens.length === 0) {
      return { success: false, sentCount: 0, failureCount: 0, error: 'No valid tokens provided' };
    }

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

      console.log(`[FCM Admin] Multicast completed: ${response.successCount} sent, ${response.failureCount} failed.`);
      return {
        success: response.successCount > 0,
        sentCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (err: any) {
      console.warn('[FCM Admin] Multicast dispatch error:', err?.message || err);
      return { success: false, sentCount: 0, failureCount: validTokens.length, error: err?.message };
    }
  }

  return { success: false, sentCount: 0, failureCount: 0, error: 'Neither tokens nor topic provided.' };
}
