import "./index.css";
import "./lib/i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

// ── One-time localStorage cleanup ──────────────────────────────────────────
// Remove legacy keys that carried mock/demo data from old builds.
// This runs before React mounts, so no stale data ever reaches the UI.
const LEGACY_KEYS = ['freshlink-storage'];
LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));

// If the persisted auth user is the hardcoded demo account, clear it so
// the real logged-in user is loaded from the server on bootstrap.
try {
  const raw = localStorage.getItem('freshlink-auth');
  if (raw) {
    const parsed = JSON.parse(raw);
    const name: string | undefined = parsed?.state?.user?.name;
    const phone: string | undefined = parsed?.state?.user?.phone;
    if (name === 'Robert Martiz' || phone === '+233241234567') {
      localStorage.removeItem('freshlink-auth');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }
} catch { /* ignore parse errors */ }

// Paystack redirects to callback_url without the hash — fix before HashRouter mounts.
const { pathname, search, hash } = window.location;
if (!hash && pathname !== '/' && !/\.[a-z0-9]+$/i.test(pathname)) {
  window.location.replace(`/#${pathname}${search}`);
}
// ─────────────────────────────────────────────────────────────────────────

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />);
}