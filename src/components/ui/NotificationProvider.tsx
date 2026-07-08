import { Toaster } from 'sonner';
import { useRealtimeNotifications } from '../../lib/hooks/useRealtimeNotifications';
import { OfflineBanner } from './OfflineBanner';
import { useNativeApp } from '../../lib/hooks/useNativeApp';
import { usePushNotifications } from '../../lib/hooks/usePushNotifications';

/**
 * Mount once inside QueryClientProvider + HashRouter.
 * - Initialises Capacitor SplashScreen, StatusBar, back-button handler
 * - Registers the WebSocket listener for `notification:new` events
 * - Renders the sonner <Toaster /> for in-app toasts
 * - Renders the <OfflineBanner /> for offline detection
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useNativeApp();
  useRealtimeNotifications();
  usePushNotifications();

  return (
    <>
      <OfflineBanner />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: { fontFamily: 'inherit' },
        }}
      />
      {children}
    </>
  );
}
