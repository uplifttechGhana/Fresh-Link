import { Capacitor } from '@capacitor/core';

/**
 * Central native capability helper.
 *
 * Always check `isNative` before calling any Capacitor plugin API so the app
 * continues to work in the browser during development.
 */

/** True when running inside a Capacitor native shell (Android / iOS) */
export const isNative = Capacitor.isNativePlatform();

/** 'android' | 'ios' | 'web' */
export const platform = Capacitor.getPlatform();

export const isAndroid = platform === 'android';
export const isIos = platform === 'ios';
export const isWeb = platform === 'web';

/**
 * Safely call a Capacitor plugin method.
 * Falls back silently on web so development is unaffected.
 *
 * @example
 * await nativeCall(() => Haptics.impact({ style: ImpactStyle.Light }));
 */
export async function nativeCall<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!isNative) return null;
  try {
    return await fn();
  } catch (err) {
    console.warn('[native] Plugin call failed:', err);
    return null;
  }
}
