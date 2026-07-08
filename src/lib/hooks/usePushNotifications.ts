import { useEffect } from 'react';
import { isNative, isWeb } from '../native';
import { api } from '../api';
import { useAuthStore } from '../authStore';

/**
 * Silently completes push registration when permission is already granted.
 * On web, the first permission prompt must come from a user click — see Settings → Notifications.
 */
export function usePushNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    let removeListeners: Array<() => void> = [];
    let webUnsubscribe: (() => void) | undefined;

    const registerNativeIfGranted = async () => {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const { Capacitor } = await import('@capacitor/core');

      const check = await PushNotifications.checkPermissions();
      if (check.receive !== 'granted') return;

      await PushNotifications.register();

      const regHandler = await PushNotifications.addListener('registration', async (token) => {
        try {
          await api.post('/users/me/device-token', {
            token: token.value,
            platform: Capacitor.getPlatform(),
          });
        } catch {
          console.warn('[push] Failed to register device token');
        }
      });

      const errHandler = await PushNotifications.addListener('registrationError', (err) => {
        console.error('[push] Registration error:', err);
      });

      const recvHandler = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          console.log('[push] Foreground push:', notification);
        },
      );

      const actionHandler = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action) => {
          console.log('[push] Action performed:', action);
        },
      );

      removeListeners = [
        () => regHandler.remove(),
        () => errHandler.remove(),
        () => recvHandler.remove(),
        () => actionHandler.remove(),
      ];
    };

    const registerWebIfGranted = async () => {
      if (!isWeb || Notification.permission !== 'granted') return;

      const vapidKey = (await import('../firebase')).FIREBASE_VAPID_KEY;
      if (!vapidKey) return;

      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        await navigator.serviceWorker.ready;

        const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
        const { firebaseApp } = await import('../firebase');
        const messaging = getMessaging(firebaseApp);

        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          await api.post('/users/me/device-token', { token, platform: 'web' });
        }

        webUnsubscribe = onMessage(messaging, (payload) => {
          console.log('[push] Foreground web push:', payload);
        });
      } catch (err) {
        console.warn('[push] Web registration failed:', err);
      }
    };

    const register = isNative ? registerNativeIfGranted : registerWebIfGranted;
    register().catch(console.error);

    return () => {
      removeListeners.forEach((fn) => fn());
      webUnsubscribe?.();
    };
  }, [user]);
}
