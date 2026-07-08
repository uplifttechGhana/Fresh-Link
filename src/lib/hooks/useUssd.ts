import { useState, useCallback, useRef } from 'react';
import { api } from '../api';
import { useAuthStore } from '../authStore';
import { getUssdShortcode } from '../ussdConfig';

interface UssdResponse {
  type: 'CON' | 'END';
  text: string;
  raw: string;
}

interface UssdState {
  screen: string;
  isActive: boolean;
  loading: boolean;
  error: string | null;
}

function newSessionId() {
  return `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function useUssd(phoneNumber: string) {
  const user = useAuthStore((s) => s.user);
  const phone = phoneNumber || user?.phone || '';

  const sessionIdRef = useRef(newSessionId());
  const inputsRef = useRef<string[]>([]);

  const [state, setState] = useState<UssdState>({
    screen: '',
    isActive: false,
    loading: false,
    error: null,
  });

  const callUssd = useCallback(
    async (text: string) => {
      if (!phone) {
        throw new Error('PHONE_REQUIRED');
      }
      return api.post<UssdResponse>('/ussd/simulate', {
        sessionId: sessionIdRef.current,
        phoneNumber: phone,
        serviceCode: getUssdShortcode(),
        text,
      });
    },
    [phone],
  );

  const dial = useCallback(async () => {
    sessionIdRef.current = newSessionId();
    inputsRef.current = [];
    setState({ screen: '', isActive: false, loading: true, error: null });

    try {
      const res = await callUssd('');
      setState({ screen: res.text, isActive: res.type === 'CON', loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'PHONE_REQUIRED'
          ? 'Enter your phone number to link your account.'
          : 'Could not reach USSD service. Check your connection.';
      setState({ screen: '', isActive: false, loading: false, error: message });
    }
  }, [callUssd]);

  const send = useCallback(
    async (input: string) => {
      if (!input.trim() || !phone) return;
      inputsRef.current = [...inputsRef.current, input.trim()];
      const text = inputsRef.current.join('*');

      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await callUssd(text);
        setState({ screen: res.text, isActive: res.type === 'CON', loading: false, error: null });
      } catch {
        setState((s) => ({
          ...s,
          loading: false,
          error: 'Connection failed. Tap Redial to try again.',
        }));
      }
    },
    [callUssd, phone],
  );

  const reset = useCallback(() => {
    sessionIdRef.current = newSessionId();
    inputsRef.current = [];
    setState({ screen: '', isActive: false, loading: false, error: null });
  }, []);

  return { ...state, dial, send, reset, sessionId: sessionIdRef.current, phone };
}
