import { config } from "@/lib/config";
import type { ApiErrorEnvelope, ValidationErrorBody } from "./types";

/** Machine-readable codes the UI branches on. Unknown codes fall through to `unknown`. */
export type ApiErrorCode =
  | "slot_unavailable"
  | "validation_failed"
  | "not_found"
  | "rate_limited"
  | "idempotency_conflict"
  | "missing_idempotency_key"
  | "booking_not_held"
  | "payment_unavailable"
  | "network"
  | "server"
  | "unknown"
  | (string & {});

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  /** Per-field validation messages keyed by API field path, e.g. `patient.mobile`. */
  readonly fieldErrors: Record<string, string[]>;
  /** Seconds from `Retry-After`, when the API rate-limited the request. */
  readonly retryAfterSeconds: number | null;

  constructor(init: {
    status: number;
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
    retryAfterSeconds?: number | null;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors ?? {};
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | undefined>;
  body?: unknown;
  /** Magic-link bearer token, sent as `X-Booking-Token`. */
  token?: string;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

function isEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }
  const error = (value as { error: unknown }).error;
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { code?: unknown }).code === "string" &&
    typeof (error as { message?: unknown }).message === "string"
  );
}

function isValidationBody(value: unknown): value is ValidationErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "errors" in value &&
    typeof (value as { errors: unknown }).errors === "object" &&
    (value as { errors: unknown }).errors !== null
  );
}

function parseRetryAfter(headers: Headers): number | null {
  const raw = headers.get("Retry-After");
  if (raw === null) {
    return null;
  }
  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

/** Converts any non-2xx response into a typed {@link ApiError}. Exported for tests. */
export function toApiError(status: number, body: unknown, headers: Headers): ApiError {
  const retryAfterSeconds = parseRetryAfter(headers);

  if (isEnvelope(body)) {
    return new ApiError({
      status,
      code: status === 429 ? "rate_limited" : body.error.code,
      message: body.error.message,
      retryAfterSeconds,
    });
  }

  if (status === 422 && isValidationBody(body)) {
    return new ApiError({
      status,
      code: "validation_failed",
      message: body.message,
      fieldErrors: body.errors,
    });
  }

  if (status === 429) {
    return new ApiError({
      status,
      code: "rate_limited",
      message: "Too many requests.",
      retryAfterSeconds,
    });
  }

  return new ApiError({
    status,
    code: status >= 500 ? "server" : "unknown",
    message: "Unexpected response from the clinic server.",
  });
}

function buildUrl(path: string, query?: Record<string, string | undefined>): string {
  const url = new URL(`${config.apiBaseUrl}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/** Sends the request and resolves with the parsed JSON body, or throws {@link ApiError}. */
async function send(path: string, options: RequestOptions): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token !== undefined) {
    headers["X-Booking-Token"] = options.token;
  }
  if (options.idempotencyKey !== undefined) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }
    throw new ApiError({
      status: 0,
      code: "network",
      message: "Could not reach the clinic server.",
    });
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw toApiError(response.status, json, response.headers);
  }

  return json;
}

/** Typed request that resolves with the unwrapped `data` member of the response. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const json = await send(path, options);
  if (typeof json === "object" && json !== null && "data" in json) {
    return (json as { data: T }).data;
  }
  throw new ApiError({
    status: 200,
    code: "unknown",
    message: "Unexpected response shape from the clinic server.",
  });
}

/** Typed request that resolves with the whole body (`/availability` returns `timezone` + `data`). */
export async function apiRequestBody<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await send(path, options)) as T;
}
