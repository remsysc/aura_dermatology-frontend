import type { BookingHold, BookingPayment, Service } from "@/lib/api/types";

/**
 * Tab-scoped record of the booking the visitor just created, so the status page can
 * survive a reload and a PayMongo redirect round-trip. It holds the status token
 * (a bearer secret), so it lives in `sessionStorage` only and never in `localStorage`.
 */
export interface BookingSession {
  reference: string;
  statusToken: string;
  intakeToken?: string;
  holdExpiresAt: string;
  startsAt: string;
  payment: BookingPayment;
  service: Pick<Service, "slug" | "name" | "duration_min" | "price_cents">;
  practitionerLabel: string;
}

const KEY_PREFIX = "aura:booking:";

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function sessionFromHold(
  hold: BookingHold,
  service: BookingSession["service"],
  practitionerLabel: string,
): BookingSession {
  return {
    reference: hold.reference,
    statusToken: hold.status_token,
    holdExpiresAt: hold.hold_expires_at,
    startsAt: hold.starts_at,
    payment: hold.payment,
    service,
    practitionerLabel,
  };
}

export function saveBookingSession(session: BookingSession): void {
  storage()?.setItem(`${KEY_PREFIX}${session.reference}`, JSON.stringify(session));
}

function isBookingSession(value: unknown): value is BookingSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<BookingSession>;
  return (
    typeof candidate.reference === "string" &&
    typeof candidate.statusToken === "string" &&
    typeof candidate.holdExpiresAt === "string" &&
    typeof candidate.startsAt === "string" &&
    typeof candidate.payment === "object" &&
    candidate.payment !== null &&
    typeof candidate.service === "object" &&
    candidate.service !== null
  );
}

export function loadBookingSession(reference: string): BookingSession | null {
  const raw = storage()?.getItem(`${KEY_PREFIX}${reference}`);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return isBookingSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearBookingSession(reference: string): void {
  storage()?.removeItem(`${KEY_PREFIX}${reference}`);
}
