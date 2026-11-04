import { config } from "@/lib/config";
import type { Service } from "@/lib/api/types";

const LOCALE = "en-PH";

/** `150000` -> `₱1,500`; keeps decimals only when the amount has centavos. */
export function formatPesos(cents: number): string {
  const hasCentavos = cents % 100 !== 0;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: hasCentavos ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatPrice(service: Pick<Service, "price_cents">): string {
  return service.price_cents === 0 ? "Complimentary" : formatPesos(service.price_cents);
}

export function describeDeposit(deposit: Service["deposit"]): string {
  if (deposit.policy === "none" || deposit.amount_cents === 0) {
    return "No deposit required";
  }
  const amount = formatPesos(deposit.amount_cents);
  return deposit.creditable
    ? `${amount} deposit, credited to your treatment`
    : `${amount} deposit`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function formatTime(iso: string, timeZone: string = config.defaultTimezone): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/\s/g, " ")
    .toUpperCase();
}

export function formatLongDate(iso: string, timeZone: string = config.defaultTimezone): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, timeZone: string = config.defaultTimezone): string {
  return `${formatLongDate(iso, timeZone)} at ${formatTime(iso, timeZone)}`;
}

/** `YYYY-MM-DD` for an instant, as seen on the clinic wall clock. */
export function dateKeyInZone(date: Date, timeZone: string = config.defaultTimezone): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string): string => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Adds whole days to a `YYYY-MM-DD` key (calendar arithmetic, no timezone involved). */
export function addDaysToKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

export interface DayLabel {
  weekday: string;
  day: string;
  month: string;
  long: string;
}

/** Labels for a `YYYY-MM-DD` key; formatted in UTC because the key is already a calendar date. */
export function labelDateKey(key: string): DayLabel {
  const date = new Date(`${key}T00:00:00Z`);
  const format = (options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...options }).format(date);
  return {
    weekday: format({ weekday: "short" }),
    day: format({ day: "numeric" }),
    month: format({ month: "short" }),
    long: format({ weekday: "long", month: "long", day: "numeric" }),
  };
}

/** Whole minutes and seconds remaining, clamped at zero. */
export function splitRemaining(msRemaining: number): { minutes: number; seconds: number } {
  const total = Math.max(0, Math.ceil(msRemaining / 1000));
  return { minutes: Math.floor(total / 60), seconds: total % 60 };
}
