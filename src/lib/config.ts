/**
 * Public runtime configuration. Every value is a `NEXT_PUBLIC_*` variable and is
 * therefore inlined into the browser bundle: never put secrets here.
 */
export const config = {
  apiBaseUrl: (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
  ).replace(/\/+$/, ""),
  bookingConsentVersion:
    process.env.NEXT_PUBLIC_BOOKING_CONSENT_VERSION ?? "2026-10-v1",
  /** Canonical public origin, used for the sitemap and robots.txt. */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  /** PayMongo *public* key (pk_...). Safe for the browser; never put the secret key here. */
  paymongoPublicKey: process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY ?? "",
  paymongoBaseUrl: "https://api.paymongo.com/v1",
  clinic: {
    name: process.env.NEXT_PUBLIC_CLINIC_NAME ?? "AURA Dermatology & Laser Studio",
    address: process.env.NEXT_PUBLIC_CLINIC_ADDRESS ?? "",
    phone: process.env.NEXT_PUBLIC_CLINIC_PHONE ?? "",
    email: process.env.NEXT_PUBLIC_CLINIC_EMAIL ?? "",
  },
  /** Clinic wall-clock zone. The API also returns this in `/availability`. */
  defaultTimezone: "Asia/Manila",
  /** Minutes the API holds a slot before releasing it (SPEC: 15 minutes). */
  holdMinutes: 15,
  /** Notice required for a full automated deposit refund (PRD / SPEC). */
  cancellationNoticeHours: 24,
} as const;
