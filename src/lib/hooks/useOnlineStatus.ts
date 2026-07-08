import { useState, useEffect } from 'react';
import { isNative } from '../native';

/**
 * Returns the current network connectivity status.
 *
 * - On native (Android/iOS): uses @capacitor/network for accurate connectivity info
 * - On web: falls back to navigator.onLine + window events
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (isNative) {
      // Capacitor Network plugin — accurate on-device connectivity
      let removeListener: (() => void) | null = null;

      const initNativeNetwork = async () => {
        const { Network } = await import('@capacitor/network');

        // Get current status immediately
        const status = await Network.getStatus();
        setIsOnline(status.connected);

        // Listen for changes
        const handler = await Network.addListener('networkStatusChange', (s) => {
          setIsOnline(s.connected);
        });

        removeListener = () => handler.remove();
      };

      initNativeNetwork().catch(() => {
        // Fall through to web fallback if something goes wrong
        setIsOnline(navigator.onLine);
      });

      return () => {
        removeListener?.();
      };
    } else {
      // Web fallback
      setIsOnline(navigator.onLine);

      const goOnline = () => setIsOnline(true);
      const goOffline = () => setIsOnline(false);

      window.addEventListener('online', goOnline);
      window.addEventListener('offline', goOffline);

      return () => {
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
      };
    }
  }, []);

  return isOnline;
}
