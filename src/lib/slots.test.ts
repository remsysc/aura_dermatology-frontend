import { describe, expect, it } from "vitest";
import { dayPartOf, groupSlotsByDayPart } from "./slots";

describe("dayPartOf", () => {
  it.each([
    ["2026-11-02T09:00:00+08:00", "morning"],
    ["2026-11-02T11:45:00+08:00", "morning"],
    ["2026-11-02T12:00:00+08:00", "afternoon"],
    ["2026-11-02T16:45:00+08:00", "afternoon"],
    ["2026-11-02T17:00:00+08:00", "evening"],
  ])("%s is %s", (iso, expected) => {
    expect(dayPartOf(iso)).toBe(expected);
  });

  it("buckets by the clinic clock, not the offset in the string", () => {
    // 01:00Z is 09:00 in Manila.
    expect(dayPartOf("2026-11-02T01:00:00Z")).toBe("morning");
  });
});

describe("groupSlotsByDayPart", () => {
  it("sorts chronologically and omits empty parts", () => {
    const groups = groupSlotsByDayPart([
      "2026-11-02T13:00:00+08:00",
      "2026-11-02T09:00:00+08:00",
      "2026-11-02T09:15:00+08:00",
    ]);

    expect(groups.map((group) => group.part)).toEqual(["morning", "afternoon"]);
    expect(groups[0].slots).toEqual(["2026-11-02T09:00:00+08:00", "2026-11-02T09:15:00+08:00"]);
  });

  it("returns no groups for a fully booked day", () => {
    expect(groupSlotsByDayPart([])).toEqual([]);
  });
});
