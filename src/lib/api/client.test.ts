import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, toApiError } from "./client";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("toApiError", () => {
  it("maps the domain error envelope", () => {
    const error = toApiError(
      409,
      { error: { code: "slot_unavailable", message: "Taken.", details: {} } },
      new Headers(),
    );

    expect(error).toMatchObject({ status: 409, code: "slot_unavailable", message: "Taken." });
  });

  it("maps Laravel validation bodies to per-field errors", () => {
    const error = toApiError(
      422,
      { message: "Invalid.", errors: { "patient.mobile": ["Bad number."] } },
      new Headers(),
    );

    expect(error.code).toBe("validation_failed");
    expect(error.fieldErrors["patient.mobile"]).toEqual(["Bad number."]);
  });

  it("treats 429 as rate limited and reads Retry-After", () => {
    const error = toApiError(429, { message: "Too Many Attempts." }, new Headers({ "Retry-After": "42" }));

    expect(error).toMatchObject({ code: "rate_limited", retryAfterSeconds: 42 });
  });

  it("falls back to server/unknown for unrecognised bodies", () => {
    expect(toApiError(500, "<html>", new Headers()).code).toBe("server");
    expect(toApiError(418, null, new Headers()).code).toBe("unknown");
  });
});

describe("apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unwraps the data member and sends auth + idempotency headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { reference: "AUR-1" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest<{ reference: string }>("/bookings", {
      method: "POST",
      body: { a: 1 },
      token: "tok",
      idempotencyKey: "key-1",
    });

    expect(result).toEqual({ reference: "AUR-1" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/bookings");
    expect(init.headers).toMatchObject({
      "X-Booking-Token": "tok",
      "Idempotency-Key": "key-1",
      "Content-Type": "application/json",
    });
  });

  it("omits undefined query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/availability", { query: { service: "x", practitioner: undefined } });

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/api/v1/availability?service=x");
  });

  it("throws a typed ApiError for non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "not_found", message: "Resource not found." } }, { status: 404 }),
      ),
    );

    await expect(apiRequest("/manage/booking", { token: "bad" })).rejects.toMatchObject({
      status: 404,
      code: "not_found",
    });
  });

  it("wraps connection failures as a network ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const failure = await apiRequest("/services").catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({ code: "network", status: 0 });
  });
});
