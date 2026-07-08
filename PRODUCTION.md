# FreshLink — Staging Production Deploy (Vercel + Railway)

Deploy with **test/sandbox keys** already in your local `.env` files.

**Recommended order:** Vercel first (frontend goes live) → Railway second (API connects).

---

## Phase A — Vercel first (frontend only)

The app UI will deploy immediately. **Login/API won't work** until Railway is up and `VITE_API_BASE_URL` points to it.

### Option 1 — Vercel Dashboard (easiest, no git required)

1. Go to [vercel.com/new](https://vercel.com/new) → sign in with GitHub/email
2. **If your code is on GitHub:** Import the `Fresh-Link` repo
3. **If not on GitHub yet:** Install Vercel CLI locally:
   ```bash
   npm i -g vercel
   cd /path/to/Fresh-Link
   vercel login
   vercel
   ```
4. Framework preset: **Vite** (auto-detected from `vercel.json`)
5. Root directory: `.` (repo root — **not** `backend/`)
6. Add **Environment Variables** (Production):

```env
VITE_API_BASE_URL=https://PLACEHOLDER.up.railway.app
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...          # from your .env
VITE_FIREBASE_API_KEY=...                     # from your .env
VITE_FIREBASE_AUTH_DOMAIN=fresh-link-717f4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fresh-link-717f4
VITE_FIREBASE_STORAGE_BUCKET=fresh-link-717f4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
VITE_USSD_SHORTCODE=*384*45670#
```

> Use a placeholder for `VITE_API_BASE_URL` now — update after Railway deploy, then **Redeploy** Vercel.

7. Click **Deploy** → you get `https://your-app.vercel.app`

### After Vercel deploys

- ✅ Splash, onboarding, UI, static pages work
- ❌ Login, browse, cart — need Railway API (Phase B)
- Save your Vercel URL for `FRONTEND_URL` on Railway

---

## Phase B — Railway (backend API)

1. New project → **Add PostgreSQL**
2. New service → connect GitHub repo → **Root Directory: `backend`**
3. Railway reads `backend/railway.toml` for build/start commands
4. Copy env vars from `backend/.env` into Railway → Variables
5. **Override these:**

```env
NODE_ENV=production
DATABASE_URL=<from Railway Postgres plugin>
FRONTEND_URL=https://YOUR-APP.vercel.app
WALLET_SIMULATE_WITHDRAWALS=true
```

6. Deploy → copy public URL: `https://YOUR-API.up.railway.app`

### Connect Vercel ↔ Railway

1. **Vercel** → Settings → Environment Variables → set:
   ```
   VITE_API_BASE_URL=https://YOUR-API.up.railway.app
   ```
2. **Redeploy** Vercel (Deployments → ⋯ → Redeploy)
3. **Railway** → set `FRONTEND_URL=https://YOUR-APP.vercel.app` → redeploy backend

---

## Phase C — Webhooks (optional for test payments)

In Paystack dashboard → Webhooks:
```
https://YOUR-API.up.railway.app/api/v1/payments/webhook/paystack
```

### USSD callback (sandbox)

In AT Sandbox → USSD → Service Codes:
```
https://YOUR-API.up.railway.app/api/v1/ussd/callback
```

---

## Smoke test (after both phases)

| Test | URL |
|------|-----|
| API health | `https://YOUR-API.up.railway.app/api/v1/integrations/africas-talking/status` |
| Swagger | `https://YOUR-API.up.railway.app/api/docs` |
| App | `https://YOUR-APP.vercel.app` |
| Login | Use **password** (sandbox SMS won't reach real phones) |
| Chat | Open messages — WebSocket now connects to Railway |

---

## Already configured (copy as-is)

| Service | Your local `.env` |
|---------|-------------------|
| Paystack test | `sk_test_` / `pk_test_` |
| AT sandbox | API key + `*384*45670#` |
| Cloudinary | All 3 vars set |
| Firebase | All vars set |
| JWT secrets | Set |
| Admin | `ADMIN_PHONES`, `ADMIN_SETUP_CODE` |

---

## OTP on staging

- **Sandbox SMS** → PIN only in AT Simulator, not on real phone
- **Password login** → works for testers on live URL
- **Dev OTP endpoint** → disabled when `NODE_ENV=production`

---

## When you have budget (switch to live)

| Variable | Change |
|----------|--------|
| `AFRICASTALKING_USERNAME` | `sandbox` → live app username |
| `AFRICASTALKING_API_KEY` | Live API key |
| `PAYSTACK_*` | `sk_live_` / `pk_live_` |
| `WALLET_SIMULATE_WITHDRAWALS` | `false` |
| JWT secrets | Generate new ones |

---

See [DOCUMENTATION.md](DOCUMENTATION.md) for full system reference.
