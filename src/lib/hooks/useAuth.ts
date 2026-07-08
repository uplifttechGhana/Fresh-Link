import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthStore, AuthUser, UserRole } from '../authStore';
import { connectSocket } from '../socket';
import type { OtpPurpose } from '../otpSessionStore';

interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: UserRole;
  language?: string;
}

interface LoginPayload {
  phone: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface OtpVerifyPayload {
  phone: string;
  code: string;
  purpose?: OtpPurpose;
}

interface OtpVerifyResponse extends AuthResponse {}

// ── Register ─────────────────────────────────────────────────────────────────

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api.post<{ message: string }>('/auth/register', payload),
  });
}

// ── Login (phone + password) ──────────────────────────────────────────────────

export function useLogin() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<AuthResponse>('/auth/login', payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      connectSocket(data.accessToken);
    },
  });
}

// ── OTP: send ─────────────────────────────────────────────────────────────────

export function useSendOtp() {
  return useMutation({
    mutationFn: ({ phone, purpose }: { phone: string; purpose?: OtpPurpose }) =>
      api.post<{ message: string }>('/auth/otp/send', { phone, purpose }),
  });
}

// ── OTP: verify ───────────────────────────────────────────────────────────────

export function useVerifyOtp() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: (payload: OtpVerifyPayload) =>
      api.post<OtpVerifyResponse>('/auth/otp/verify', payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      connectSocket(data.accessToken);
    },
  });
}

// ── Forgot password ───────────────────────────────────────────────────────────

export function useForgotPassword() {
  return useMutation({
    mutationFn: (phone: string) =>
      api.post<{ message: string }>('/auth/forgot-password', { phone }),
  });
}

// ── Reset password ────────────────────────────────────────────────────────────

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: { phone: string; otpCode: string; newPassword: string }) =>
      api.post<{ message: string }>('/auth/reset-password', payload),
  });
}
