import type { CapacitorConfig } from '@capacitor/cli';

// Set CAP_LIVE_RELOAD=1 only when actively developing against the Vite dev server.
const liveReload = process.env.CAP_LIVE_RELOAD === '1';
const devServerUrl = process.env.CAP_DEV_SERVER_URL ?? 'http://10.250.39.2:5173';

const config: CapacitorConfig = {
  appId: 'com.freshlink.app',
  appName: 'FreshLink',
  webDir: 'dist',
  ...(liveReload
    ? {
        server: {
          url: devServerUrl,
          cleartext: true,
        },
      }
    : {
        // Bundled APK: http scheme avoids mixed-content blocks against local HTTP API.
        server: {
          androidScheme: 'http',
        },
      }),
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0E4D2C',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'Default',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0E4D2C',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
