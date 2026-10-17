// ============================================================================
// AAJORI CUISINE - Customer Web Firebase Client Initialization & FCM Helper
// ============================================================================

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, MessagePayload } from 'firebase/messaging';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId: string;
  appId: string;
  vapidKey?: string;
}

export function getFirebaseConfig(): FirebaseClientConfig | null {
  const env = (import.meta as any).env || {};
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = env.VITE_FIREBASE_APP_ID;
  const vapidKey = env.VITE_FIREBASE_VAPID_KEY;

  if (apiKey && projectId && messagingSenderId && appId) {
    return {
      apiKey,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId,
      appId,
      vapidKey,
    };
  }

  return null;
}

let firebaseApp: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

export function getOrInitFirebase(): { app: FirebaseApp | null; messaging: Messaging | null } {
  if (typeof window === 'undefined') {
    return { app: null, messaging: null };
  }

  const config = getFirebaseConfig();
  if (!config) {
    return { app: null, messaging: null };
  }

  try {
    if (!firebaseApp) {
      const existingApps = getApps();
      firebaseApp = existingApps.length > 0 ? existingApps[0] : initializeApp(config);
    }

    if (!messagingInstance && 'Notification' in window && 'serviceWorker' in navigator) {
      messagingInstance = getMessaging(firebaseApp);
    }
  } catch (err) {
    console.warn('[Firebase] Init note:', err);
  }

  return { app: firebaseApp, messaging: messagingInstance };
}

/**
 * Registers the service worker with Firebase config query parameters and requests an FCM registration token
 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  const config = getFirebaseConfig();
  if (!config) {
    console.info('[Firebase] Config keys not found in .env. Falling back to native W3C VAPID push.');
    return null;
  }

  try {
    const { messaging } = getOrInitFirebase();
    if (!messaging) return null;

    // Register service worker with query params so the SW knows the Firebase credentials
    const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(config.apiKey)}&projectId=${encodeURIComponent(config.projectId)}&messagingSenderId=${encodeURIComponent(config.messagingSenderId)}&appId=${encodeURIComponent(config.appId)}`;

    const swReg = await navigator.serviceWorker.register(swUrl, { scope: '/' });
    await navigator.serviceWorker.ready;

    const currentToken = await getToken(messaging, {
      vapidKey: config.vapidKey,
      serviceWorkerRegistration: swReg,
    });

    if (currentToken) {
      console.log('[Firebase FCM] Token acquired:', currentToken.substring(0, 15) + '...');
      return currentToken;
    } else {
      console.warn('[Firebase FCM] No registration token available.');
      return null;
    }
  } catch (err) {
    console.warn('[Firebase FCM] Error retrieving registration token:', err);
    return null;
  }
}

/**
 * Listen for foreground Firebase Cloud Messaging push events
 */
export function listenForFcmMessages(callback: (payload: MessagePayload) => void): (() => void) | null {
  try {
    const { messaging } = getOrInitFirebase();
    if (!messaging) return null;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[Firebase FCM] Foreground message received:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[Firebase FCM] Foreground listener setup error:', err);
    return null;
  }
}
