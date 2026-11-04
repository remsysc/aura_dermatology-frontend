import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  dateKeyInZone,
  describeDeposit,
  formatDateTime,
  formatDuration,
  formatPesos,
  formatPrice,
  formatTime,
  labelDateKey,
  splitRemaining,
} from "./format";

describe("formatPesos", () => {
  it("drops decimals for whole pesos", () => {
    expect(formatPesos(150000)).toBe("₱1,500");
  });

  it("keeps centavos when present", () => {
    expect(formatPesos(150050)).toBe("₱1,500.50");
  });
});

describe("formatPrice / describeDeposit", () => {
  it("labels free services as complimentary", () => {
    expect(formatPrice({ price_cents: 0 })).toBe("Complimentary");
  });

  it("describes creditable flat deposits", () => {
    expect(describeDeposit({ policy: "flat", amount_cents: 50000, creditable: true })).toBe(
      "₱500 deposit, credited to your treatment",
    );
  });

  it("describes the no-deposit case", () => {
    expect(describeDeposit({ policy: "none", amount_cents: 0, creditable: false })).toBe(
      "No deposit required",
    );
  });
});

describe("formatDuration", () => {
  it.each([
    [15, "15 min"],
    [60, "1 hr"],
    [90, "1 hr 30 min"],
  ])("%i minutes -> %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("clinic wall-clock formatting", () => {
  it("renders an instant in Asia/Manila regardless of the machine timezone", () => {
    expect(formatTime("2026-11-02T01:00:00Z")).toBe("9:00 AM");
    expect(formatDateTime("2026-11-02T09:00:00+08:00")).toBe("Monday, November 2, 2026 at 9:00 AM");
  });

  it("computes the clinic calendar date across the UTC day boundary", () => {
    // 20:00 UTC on Nov 2 is already 04:00 on Nov 3 in Manila.
    expect(dateKeyInZone(new Date("2026-11-02T20:00:00Z"))).toBe("2026-11-03");
  });
});

describe("date keys", () => {
  it("adds days across month boundaries", () => {
    expect(addDaysToKey("2026-11-28", 5)).toBe("2026-12-03");
  });

  it("labels a key without timezone drift", () => {
    expect(labelDateKey("2026-11-02")).toMatchObject({ weekday: "Mon", day: "2", month: "Nov" });
  });
});

describe("splitRemaining", () => {
  it("rounds up partial seconds and clamps at zero", () => {
    expect(splitRemaining(61_001)).toEqual({ minutes: 1, seconds: 2 });
    expect(splitRemaining(-5_000)).toEqual({ minutes: 0, seconds: 0 });
  });
});
