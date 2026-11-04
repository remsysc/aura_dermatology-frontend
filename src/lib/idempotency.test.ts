import { describe, expect, it } from "vitest";
import { createIdempotencyTracker } from "./idempotency";

function sequence(): () => string {
  let counter = 0;
  return () => `key-${++counter}`;
}

describe("createIdempotencyTracker", () => {
  it("reuses the key while the payload is unchanged (safe replay on retry)", () => {
    const tracker = createIdempotencyTracker(sequence());
    const payload = { service: "skin-analysis", starts_at: "2026-11-02T09:00:00+08:00" };

    expect(tracker.keyFor(payload)).toBe("key-1");
    expect(tracker.keyFor({ ...payload })).toBe("key-1");
  });

  it("mints a new key when the payload changes (avoids 409 idempotency_conflict)", () => {
    const tracker = createIdempotencyTracker(sequence());

    tracker.keyFor({ starts_at: "2026-11-02T09:00:00+08:00" });

    expect(tracker.keyFor({ starts_at: "2026-11-02T09:15:00+08:00" })).toBe("key-2");
  });

  it("mints a new key after reset", () => {
    const tracker = createIdempotencyTracker(sequence());
    const payload = { a: 1 };

    tracker.keyFor(payload);
    tracker.reset();

    expect(tracker.keyFor(payload)).toBe("key-2");
  });
});
