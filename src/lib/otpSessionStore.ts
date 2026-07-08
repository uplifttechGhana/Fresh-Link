import { create } from 'zustand';

export type OtpPurpose = 'registration' | 'login' | 'password_reset';

interface OtpSessionState {
  phone: string;
  purpose: OtpPurpose;
  pendingPassword?: string; // stored temporarily for login-via-OTP flow
  set: (phone: string, purpose: OtpPurpose, pendingPassword?: string) => void;
  clear: () => void;
}

export const useOtpSession = create<OtpSessionState>()((set) => ({
  phone: '',
  purpose: 'login',
  pendingPassword: undefined,
  set: (phone, purpose, pendingPassword) => set({ phone, purpose, pendingPassword }),
  clear: () => set({ phone: '', purpose: 'login', pendingPassword: undefined }),
}));
