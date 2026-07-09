import { useState, useEffect, useCallback } from 'react';
import { isNative } from '../native';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

const BIOMETRIC_ENABLED_KEY = 'freshlink_biometric_enabled';

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

/** Call this after a successful password login to arm biometric for future logins */
export function enableBiometricLogin() {
  localStorage.setItem(BIOMETRIC_ENABLED_KEY, '1');
}

/** Call this on logout to disarm biometric */
export function disableBiometricLogin() {
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
}

/**
 * Show the biometric prompt. Returns true if the user passed biometric/device-credential check.
 * Does NOT log the user in — the caller must handle the actual login using the refresh token.
 */
export async function authenticateWithBiometric(reason?: string): Promise<boolean> {
  if (!isNative) return false;
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    await BiometricAuth.authenticate({
      reason: reason ?? 'Log in to FreshLink',
      cancelTitle: 'Cancel',
      // false = only biometric, no PIN/pattern fallback shown
      // This removes the "use numeric" button that confused the user
      allowDeviceCredential: false,
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
