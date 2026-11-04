# AURA Dermatology & Laser Studio — Client Frontend

> **Patient-Facing Web Application** for AURA Dermatology & Laser Studio. Decoupled Next.js application built with TypeScript, React 19, Tailwind CSS 4, and Vitest.

---

## 1. Prerequisites

Ensure your host environment meets the following requirements:
* **Node.js:** `22.x+` (LTS recommended)
* **Package Manager:** `npm 10+` (or `pnpm 9+`)
* **Backend API:** An active instance of [`aura_dermatology-api`](https://github.com/remsysc/aura_dermatology-api) running at `http://localhost:8000`

---

## 2. Quickstart Onboarding

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local

# 3. Start development server (Turbopack)
npm run dev

# 4. Open in browser
# http://localhost:3000
```

---

## 3. Environment Variables Reference

Configure `.env.local` for local development or staging environments:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for the Laravel REST API `/api/v1` | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin for SEO, sitemaps, and robots | `http://localhost:3000` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile public site key | `0x4AAAAAA...` (dummy in dev) |
| `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` | PayMongo public key (`pk_...`) for browser attachment | `pk_test_...` |
| `NEXT_PUBLIC_CLINIC_NAME` | Flagship clinic display name | `AURA Dermatology & Laser Studio` |
| `NEXT_PUBLIC_CLINIC_ADDRESS` | Physical clinic address in footer & contact cards | BGC Flagship Clinic Address |
| `NEXT_PUBLIC_CLINIC_PHONE` | Direct clinic concierge telephone | `+63 (2) 8812-2872` |
| `NEXT_PUBLIC_CLINIC_EMAIL` | Direct clinic concierge email | `concierge@aura.ph` |

---

## 4. Key Workflows & Pages

* **`/`** — Clinical Sanctuary landing page with doctor menu preview, credentials, and location highlights.
* **`/treatments`** — Doctor-led treatment catalog with upfront pricing and recovery expectations.
* **`/practitioners`** — Board-Certified Dermatologists and clinical technicians directory.
* **`/book`** — Concurrency-safe 4-step booking island with live 14-day slot availability and idempotency protection.
* **`/book/confirmation`** — Live status polling, PayMongo checkout / 3DS redirect handler, and instant intake link delivery.
* **`/intake`** — Confidential medical questionnaire with field-level encryption under DPA 2012.
* **`/manage`** — Strict-mode guest self-service portal for appointment rescheduling, cancellation, and magic link recovery.

---

## 5. Verification & Testing

```bash
# Run unit and integration tests (16 suites, 82 tests)
npm test

# Run TypeScript compiler type-check
npm run typecheck

# Run ESLint linter
npm run lint

# Compile optimized production build (15 static & dynamic routes)
npm run build
```
