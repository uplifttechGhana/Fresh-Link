import { isNative } from '../native';

/**
 * Thin wrapper around @capacitor/haptics.
 * All methods are no-ops on web so they can be called unconditionally.
 */

async function impact(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
  await Haptics.impact({ style: map[style] }).catch(() => undefined);
}

async function notification(type: 'success' | 'warning' | 'error' = 'success') {
  if (!isNative) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  const map = {
    success: NotificationType.Success,
    warning: NotificationType.Warning,
    error: NotificationType.Error,
  };
  await Haptics.notification({ type: map[type] }).catch(() => undefined);
}

async function selectionChanged() {
  if (!isNative) return;
  const { Haptics } = await import('@capacitor/haptics');
  await Haptics.selectionChanged().catch(() => undefined);
}

export const haptics = { impact, notification, selectionChanged };

/**
 * Hook that returns haptic helpers.
 * @example
 * const { impact } = useHaptics();
 * <button onClick={() => { impact('light'); doThing(); }}>
 */
export function useHaptics() {
  return haptics;
}
