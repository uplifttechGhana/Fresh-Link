import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

/** Public VAPID key — safe to expose in frontend code */
export const FIREBASE_VAPID_KEY =
  (import.meta.env.VITE_FIREBASE_VAPID_KEY as string) ||
  'BC88poxIOKoN2-wY59PeURfaVhZ1haHB8T8RqMjZET-8QHjOO_J4PUWYL_xVGib-N-0EoHZsd0WtO1XZ-WkGAlE';

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/** Returns the Messaging instance only if the browser supports FCM. */
export async function getWebMessaging(): Promise<Messaging | null> {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(firebaseApp);
}
