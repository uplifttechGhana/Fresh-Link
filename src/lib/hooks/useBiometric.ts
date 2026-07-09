import { useState, useEffect, useCallback } from 'react';
import { isNative } from '../native';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

const BIOMETRIC_ENABLED_KEY = 'freshlink_biometric_enabled';
// Separate key — NOT cleared on logout so biometric survives across sessions
const BIOMETRIC_REFRESH_KEY = 'freshlink_bio_refresh';

interface BiometricState {
  available: boolean;
  biometryType: BiometricType;
  enrolled: boolean;
  /** True if the user has previously logged in and biometric is armed */
  hasSavedSession: boolean;
}

async function checkAvailability(): Promise<BiometricState> {
  // hasSavedSession = user has previously logged in with password on this device
  // We only need the biometric flag — the refresh token check happens at tap time
  const hasSavedSession = !!localStorage.getItem(BIOMETRIC_ENABLED_KEY);

  if (!isNative) return { available: false, biometryType: 'none', enrolled: false, hasSavedSession };

  try {
    const { BiometricAuth, BiometryType } = await import('@aparajita/capacitor-biometric-auth');
    const info = await BiometricAuth.checkBiometry();

    let biometryType: BiometricType = 'none';
    if (info.biometryType === BiometryType.faceId || info.biometryType === BiometryType.faceAuthentication) {
      biometryType = 'face';
    } else if (
      info.biometryType === BiometryType.touchId ||
      info.biometryType === BiometryType.fingerprintAuthentication
    ) {
      biometryType = 'fingerprint';
    } else if (info.biometryType === BiometryType.irisAuthentication) {
      biometryType = 'iris';
    }

    return {
      available: info.isAvailable,
      biometryType,
      enrolled: info.isEnrolled ?? info.isAvailable,
      hasSavedSession,
    };
  } catch {
    return { available: false, biometryType: 'none', enrolled: false, hasSavedSession };
  }
}

/**
 * Call after a successful password login.
 * Saves the refresh token under a biometric-specific key that is NOT
 * cleared on regular logout, so fingerprint works after sign-out.
 */
export function enableBiometricLogin(refreshToken: string) {
  localStorage.setItem(BIOMETRIC_ENABLED_KEY, '1');
  localStorage.setItem(BIOMETRIC_REFRESH_KEY, refreshToken);
}

/** Returns the stored biometric refresh token (survives logout). */
export function getBiometricRefreshToken(): string | null {
  return localStorage.getItem(BIOMETRIC_REFRESH_KEY);
}

/** Update the stored biometric refresh token after a successful biometric login. */
export function updateBiometricRefreshToken(token: string) {
  localStorage.setItem(BIOMETRIC_REFRESH_KEY, token);
}

/** Call this to fully disable biometric (e.g. user turns it off in settings). */
export function disableBiometricLogin() {
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  localStorage.removeItem(BIOMETRIC_REFRESH_KEY);
}

/**
 * Show the biometric prompt. Returns true if the user passed the check.
 * allowDeviceCredential=true so side-mounted fingerprints (Tecno power button)
 * and in-display sensors that fall back to device credential all work.
 */
export async function authenticateWithBiometric(reason?: string): Promise<boolean> {
  if (!isNative) return false;
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    await BiometricAuth.authenticate({
      reason: reason ?? 'Confirm your identity',
      iosFallbackTitle: 'Use passcode',
      androidTitle: 'FreshLink',
      androidSubtitle: 'Verify to sign in',
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}

export function useBiometric() {
  const [state, setState] = useState<BiometricState>({
    available: false,
    biometryType: 'none',
    enrolled: false,
    hasSavedSession: false,
  });

  useEffect(() => {
    checkAvailability().then(setState);
  }, []);

  const authenticate = useCallback(
    (reason?: string) => authenticateWithBiometric(reason),
    [],
  );

  return { ...state, authenticate };
}
