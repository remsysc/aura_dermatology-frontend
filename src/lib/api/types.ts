/**
 * Wire types for the AURA API (`/api/v1`).
 *
 * Mapped from the Laravel controllers and resources rather than `docs/openapi.yaml`,
 * because the exported spec is behind the implementation (it omits `status_token`,
 * `verify_token`, `manage_url`/`intake_url` and the real error envelope).
 */

export type PractitionerRole = "doctor" | "technician";
export type DepositPolicy = "none" | "flat" | "percent";

export interface ServiceDeposit {
  policy: DepositPolicy;
  amount_cents: number;
  creditable: boolean;
}

export interface Service {
  slug: string;
  name: string;
  duration_min: number;
  price_cents: number;
  deposit: ServiceDeposit;
  intake_enabled: boolean;
  required_role: PractitionerRole;
  requires_machine: boolean;
  required_machine_type?: string | null;
}

export interface Practitioner {
  slug: string;
  name: string;
  role: PractitionerRole;
}

export interface AvailabilityDay {
  /** `YYYY-MM-DD` in the clinic timezone. */
  date: string;
  /** ISO-8601 start times with the clinic UTC offset, e.g. `2026-11-02T09:00:00+08:00`. */
  slots: string[];
}

export interface AvailabilityResponse {
  timezone: string;
  data: AvailabilityDay[];
}

export type BookingStatus =
  | "held"
  | "confirmed"
  | "expired"
  | "cancelled"
  | "completed"
  | "no_show";

export type IntakeStatus =
  | "not_requested"
  | "pending"
  | "completed"
  | "waived_in_person";

export interface CreateBookingPayload {
  service: string;
  starts_at: string;
  practitioner?: string;
  patient: { name: string; email: string; mobile: string };
  consent: { notice_version: string; accepted: true };
  turnstile_token?: string;
}

export interface BookingPayment {
  required: boolean;
  amount_cents: number;
  currency: string;
  payment_intent_id: string | null;
  client_key: string | null;
}

export interface BookingHold {
  reference: string;
  status: BookingStatus;
  hold_expires_at: string;
  starts_at: string;
  /** Bearer token for `GET /bookings/{reference}/status`. Treat as a secret. */
  status_token: string;
  /**
   * Single-use email-verification token for zero-deposit holds. Deliberately
   * ignored by this client: using it would bypass email-ownership verification.
   */
  verify_token: string | null;
  payment: BookingPayment;
}

export interface BookingStatusResult {
  reference: string;
  status: BookingStatus;
  hold_expires_at: string | null;
}

export interface VerifyResult {
  reference: string;
  status: BookingStatus;
  manage_url: string;
  intake_url: string;
}

export interface IntakeLinkResult {
  reference: string;
  intake_url: string;
}

export interface MagicLinkRequestResult {
  message: string;
}

export interface ManagedBooking {
  reference: string;
  first_name: string;
  /** Service display name. */
  service: string;
  service_slug?: string;
  starts_at: string;
  status: BookingStatus;
  can_reschedule: boolean;
  can_cancel: boolean;
  intake_status: IntakeStatus;
}

export interface RescheduleResult {
  reference: string;
  starts_at: string;
  status: BookingStatus;
}

export interface CancelResult {
  reference: string;
  status: BookingStatus;
  refund_status: "processed" | "none";
}

export interface IntakeFieldSchema {
  type: "string";
  label: string;
  required: boolean;
  options?: string[];
  max_length?: number;
}

export interface IntakeForm {
  reference: string;
  intake_status: IntakeStatus;
  can_submit: boolean;
  consent_notice: {
    version: string;
    content_hash: string;
    published_at: string;
  } | null;
  /** Ordered map of answer key to field definition. */
  schema: Record<string, IntakeFieldSchema>;
}

export interface SubmitIntakePayload {
  consent: { notice_version: string; accepted: true };
  answers: Record<string, string>;
  turnstile_token?: string;
}

export interface IntakeSubmitResult {
  status: string;
  submitted_at: string;
}

/** Error envelope returned by domain exceptions and middleware. */
export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Laravel's default validation (422) body. */
export interface ValidationErrorBody {
  message: string;
  errors: Record<string, string[]>;
}
