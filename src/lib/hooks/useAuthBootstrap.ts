import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore, AuthUser } from '../authStore';
import { connectSocket, disconnectSocket } from '../socket';

/**
 * On app load (and whenever the access token changes), validate the stored JWT
 * against /users/me and sync the full user object from the database.
 *
 * This ensures:
 *   1. Stale/demo data in localStorage is replaced with real server data.
 *   2. After OTP login the auth store always holds the freshly-fetched user.
 *   3. If the token is invalid/expired the session is cleared immediately.
 */
export function useAuthBootstrap() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  // Track which token value we have already validated so we never double-fetch
  // for the same token, but always re-fetch when the token actually changes
  // (e.g. new login, token refresh).
  const validatedToken = useRef<string | null>(null);

  // Listen for token-expiry events dispatched by api.ts when refresh fails
  useEffect(() => {
    const handleExpired = () => {
      disconnectSocket();
      clearAuth();
      navigate('/login', { replace: true });
    };
    window.addEventListener('freshlink:auth-expired', handleExpired);
    return () => window.removeEventListener('freshlink:auth-expired', handleExpired);
  }, [clearAuth, navigate]);

  // Validate token and hydrate full user from the database
  useEffect(() => {
    const token = accessToken ?? localStorage.getItem('access_token');
    if (!token) return;

    // Skip if we already validated this exact token in this session
    if (validatedToken.current === token) return;
    validatedToken.current = token;

    api
      .get<AuthUser>('/users/me')
      .then((user) => {
        // Preserve the existing refreshToken — bootstrap only re-syncs the user
        // profile; it doesn't receive a new refresh token from /users/me.
        const existingRefreshToken = useAuthStore.getState().refreshToken ?? undefined;
        setAuth(user, token, existingRefreshToken);
        connectSocket(token);
      })
      .catch(() => {
        // Reset the validated-token flag so bootstrap retries on next token change.
        // Do NOT call clearAuth() here: a transient network error (no connectivity,
        // server restart) would silently log the user out. If the token is truly
        // invalid, the next API call will return 401, triggering tryRefresh and
        // ultimately dispatching 'freshlink:auth-expired' which clears auth properly.
        validatedToken.current = null;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
}
