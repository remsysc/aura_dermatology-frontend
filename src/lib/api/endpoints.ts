import { apiRequest, apiRequestBody } from "./client";
import type {
  AvailabilityResponse,
  BookingHold,
  BookingStatusResult,
  CancelResult,
  CreateBookingPayload,
  IntakeForm,
  IntakeLinkResult,
  IntakeSubmitResult,
  MagicLinkRequestResult,
  ManagedBooking,
  Practitioner,
  RescheduleResult,
  Service,
  SubmitIntakePayload,
  VerifyResult,
} from "./types";

/** One function per API operation. Components never build URLs or headers themselves. */

export function listServices(signal?: AbortSignal): Promise<Service[]> {
  return apiRequest<Service[]>("/services", { signal });
}

export function listPractitioners(signal?: AbortSignal): Promise<Practitioner[]> {
  return apiRequest<Practitioner[]>("/practitioners", { signal });
}

export function getAvailability(
  params: { service: string; from: string; to: string; practitioner?: string },
  signal?: AbortSignal,
): Promise<AvailabilityResponse> {
  return apiRequestBody<AvailabilityResponse>("/availability", {
    query: {
      service: params.service,
      from: params.from,
      to: params.to,
      practitioner: params.practitioner,
    },
    signal,
  });
}

export function createBooking(
  payload: CreateBookingPayload,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<BookingHold> {
  return apiRequest<BookingHold>("/bookings", {
    method: "POST",
    body: payload,
    idempotencyKey,
    signal,
  });
}

export function getBookingStatus(
  reference: string,
  token: string,
  signal?: AbortSignal,
): Promise<BookingStatusResult> {
  return apiRequest<BookingStatusResult>(
    `/bookings/${encodeURIComponent(reference)}/status`,
    { token, signal },
  );
}

export function verifyBooking(token: string, signal?: AbortSignal): Promise<VerifyResult> {
  return apiRequest<VerifyResult>("/bookings/verify", {
    method: "POST",
    body: {},
    token,
    signal,
  });
}

export function getManagedBooking(token: string, signal?: AbortSignal): Promise<ManagedBooking> {
  return apiRequest<ManagedBooking>("/manage/booking", { token, signal });
}

export function rescheduleBooking(
  token: string,
  startsAt: string,
  signal?: AbortSignal,
): Promise<RescheduleResult> {
  return apiRequest<RescheduleResult>("/manage/reschedule", {
    method: "POST",
    body: { starts_at: startsAt },
    token,
    signal,
  });
}

export function cancelBooking(
  token: string,
  reason: string | undefined,
  signal?: AbortSignal,
): Promise<CancelResult> {
  return apiRequest<CancelResult>("/manage/cancel", {
    method: "POST",
    body: reason ? { reason } : {},
    token,
    signal,
  });
}

export function getIntakeForm(token: string, signal?: AbortSignal): Promise<IntakeForm> {
  return apiRequest<IntakeForm>("/intake", { token, signal });
}

export function submitIntake(
  token: string,
  payload: SubmitIntakePayload,
  signal?: AbortSignal,
): Promise<IntakeSubmitResult> {
  return apiRequest<IntakeSubmitResult>("/intake", {
    method: "POST",
    body: payload,
    token,
    signal,
  });
}

/** Exchanges the booking status token for an intake link once the booking is confirmed. */
export function requestIntakeLink(
  reference: string,
  token: string,
  signal?: AbortSignal,
): Promise<IntakeLinkResult> {
  return apiRequest<IntakeLinkResult>(
    `/bookings/${encodeURIComponent(reference)}/intake-link`,
    { method: "POST", body: {}, token, signal },
  );
}

/** Asks the API to email a fresh manage link. Always resolves the same way on a well-formed request. */
export function requestMagicLink(
  reference: string,
  contact: string,
  signal?: AbortSignal,
): Promise<MagicLinkRequestResult> {
  return apiRequest<MagicLinkRequestResult>("/magic-links/request", {
    method: "POST",
    body: { reference, contact },
    signal,
  });
}
