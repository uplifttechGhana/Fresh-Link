import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from './queryClient';

export type UserRole = 'buyer' | 'farmer' | 'transport' | 'investor' | 'admin';

export interface FarmerProfile {
  location?: string;
  farmName?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  totalReviews?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  language: string;
  avatarUrl?: string | null;
  farmerProfile?: FarmerProfile | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  setLanguage: (language: string) => void;
  setPendingRole: (role: UserRole) => void;
  pendingRole: UserRole | null;
  /** Role chosen during guest onboarding — user is browsing without an account */
  guestRole: UserRole | null;
  setGuestRole: (role: UserRole | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      pendingRole: null,
      guestRole: null,
      setGuestRole: (role) => set({ guestRole: role }),
      setAuth: (user, accessToken, refreshToken) => {
        const prevUserId = useAuthStore.getState().user?.id;
        if (prevUserId && prevUserId !== user.id) {
          queryClient.clear();
        }
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        set({
          user,
          accessToken,
          refreshToken: refreshToken ?? null,
          guestRole: null,
          pendingRole: null,
        });
      },
      clearAuth: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Note: freshlink_biometric_enabled is intentionally kept so the
        // fingerprint button reappears on the login screen after logout.
        queryClient.clear();
        set({ user: null, accessToken: null, refreshToken: null, guestRole: null });
      },
      setLanguage: (language) =>
        set((s) => ({ user: s.user ? { ...s.user, language } : s.user })),
      setPendingRole: (role) => set({ pendingRole: role }),
    }),
    {
      name: 'freshlink-auth',
      version: 2,
      // Any browser with version < 2 (old demo data) starts with a clean slate.
      // The user will simply be asked to log in again.
      migrate: (_old, _v) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        pendingRole: null,
        guestRole: null,
      }),
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        pendingRole: s.pendingRole,
        guestRole: s.guestRole,
      }),
    },
  ),
);
