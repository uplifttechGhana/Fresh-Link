import { useState, useEffect, useCallback } from 'react';
import { isNative } from '../native';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

interface BiometricState {
  available: boolean;
  biometryType: BiometricType;
  enrolled: boolean;
}

async function checkAvailability(): Promise<BiometricState> {
  if (!isNative) return { available: false, biometryType: 'none', enrolled: false };

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
    };
  } catch {
    return { available: false, biometryType: 'none', enrolled: false };
  }
}

export async function authenticateWithBiometric(reason?: string): Promise<boolean> {
  if (!isNative) return false;
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    await BiometricAuth.authenticate({
      reason: reason ?? 'Log in to FreshLink',
      cancelTitle: 'Use password',
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
