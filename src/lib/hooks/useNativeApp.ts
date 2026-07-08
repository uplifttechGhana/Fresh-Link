import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isNative, isAndroid, nativeCall } from '../native';

/**
 * Mount once at the app root.
 * Handles:
 * - SplashScreen hide after app is ready
 * - StatusBar style (dark text on light backgrounds)
 * - Android hardware back button (navigate back or exit)
 * - App pause / resume lifecycle events
 */
export function useNativeApp() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNative) return;

    let splashHidden = false;

    const init = async () => {
      // Dynamic imports so the web bundle doesn't include native-only code
      const { SplashScreen } = await import('@capacitor/splash-screen');
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      const { App } = await import('@capacitor/app');

      // Hide splash screen after a short delay (transition looks smoother)
      if (!splashHidden) {
        setTimeout(async () => {
          await nativeCall(() => SplashScreen.hide({ fadeOutDuration: 400 }));
          splashHidden = true;
        }, 300);
      }

      // Set status bar style
      await nativeCall(() => StatusBar.setStyle({ style: Style.Dark }));
      await nativeCall(() => StatusBar.setBackgroundColor({ color: '#0E4D2C' }));

      // Android: hardware back button handler
      if (isAndroid) {
        const backHandler = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            navigate(-1);
          } else {
            // Exit app if nothing to go back to
            nativeCall(() => App.exitApp());
          }
        });

        // App lifecycle — pause / resume
        const pauseHandler = await App.addListener('pause', () => {
          console.log('[app] paused');
        });

        const resumeHandler = await App.addListener('resume', () => {
          console.log('[app] resumed');
        });

        return () => {
          backHandler.remove();
          pauseHandler.remove();
          resumeHandler.remove();
        };
      }
    };

    const cleanup = init();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [navigate]);
}
