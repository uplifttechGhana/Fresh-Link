import { isNative, isWeb } from '../native';
import { api } from '../api';
import { firebaseApp, FIREBASE_VAPID_KEY } from '../firebase';

export type PushPermissionStatus = 'unsupported' | 'default' | 'granted' | 'denied';

export function getPushPermissionStatus(): PushPermissionStatus {
  if (isNative) return 'default';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as PushPermissionStatus;
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Register for push notifications. Must be called from a user click on web browsers. */
export async function registerPushNotifications(): Promise<{ ok: boolean; message: string }> {
  if (isNative) return registerNativePush();
  if (isWeb) return registerWebPush();
  return { ok: false, message: 'Push notifications are not supported on this platform.' };
}

async function registerNativePush(): Promise<{ ok: boolean; message: string }> {
  const { PushNotifications } = await import('@capacitor/push-notifications');
  const { Capacitor } = await import('@capacitor/core');

  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    return { ok: false, message: 'Notification permission was denied.' };
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: { ok: boolean; message: string }) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    PushNotifications.addListener('registration', async (token) => {
      try {
        await api.post('/users/me/device-token', {
          token: token.value,
          platform: Capacitor.getPlatform(),
        });
        finish({ ok: true, message: 'Push notifications enabled.' });
      } catch {
        finish({ ok: false, message: 'Permission granted but failed to register with server.' });
      }
    }).then((handler) => {
      PushNotifications.addListener('registrationError', (err) => {
        console.error('[push] Registration error:', err);
        finish({ ok: false, message: 'Failed to register for push notifications.' });
      }).then(() => {
        PushNotifications.register().catch(() => {
          finish({ ok: false, message: 'Failed to start push registration.' });
        });
      });

      setTimeout(() => {
        handler.remove();
        finish({ ok: false, message: 'Push registration timed out. Try again.' });
      }, 15000);
    });
  });
}

async function registerWebPush(): Promise<{ ok: boolean; message: string }> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ok: false, message: 'This browser does not support push notifications.' };
  }

  const { isSupported, getMessaging, getToken } = await import('firebase/messaging');
  const supported = await isSupported();
  if (!supported) {
    return {
      ok: false,
      message: 'Push is not supported here. Use Chrome/Firefox on localhost (not private/incognito).',
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      message:
        permission === 'denied'
          ? 'Notifications are blocked. Enable them in your browser settings for localhost.'
          : 'Notification permission was not granted.',
    };
  }

  const vapidKey = FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return { ok: false, message: 'Push is not configured (missing VAPID key).' };
  }

  try {
    // Register the service worker BEFORE getMessaging/getToken
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none', // always check for a fresh SW
    });
    await registration.update();
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return {
        ok: false,
        message:
          'Could not get a push token. In Google Cloud Console, enable "Firebase Cloud Messaging API" for project fresh-link-717f4.',
      };
    }

    await api.post('/users/me/device-token', { token, platform: 'web' });
    return { ok: true, message: 'Push notifications enabled.' };
  } catch (err) {
    console.error('[push] Web registration failed:', err);
    return { ok: false, message: formatError(err) };
  }
}
