import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

describe("buildIcs", () => {
  const event = {
    reference: "AUR-7K2Q9",
    title: "Dermatology Consultation, AURA",
    startsAtIso: "2026-11-02T09:00:00+08:00",
    durationMinutes: 30,
  };
  const now = new Date("2026-10-30T00:00:00Z");

  it("emits UTC start/end computed from the duration", () => {
    const ics = buildIcs(event, now);

    expect(ics).toContain("DTSTART:20261102T010000Z");
    expect(ics).toContain("DTEND:20261102T013000Z");
    expect(ics).toContain("UID:AUR-7K2Q9@aura-dermatology");
  });

  it("escapes TEXT values and uses CRLF line endings", () => {
    const ics = buildIcs(event, now);

    expect(ics).toContain("SUMMARY:Dermatology Consultation\\, AURA");
    expect(ics.split("\r\n").length).toBeGreaterThan(5);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("omits LOCATION unless provided", () => {
    expect(buildIcs(event, now)).not.toContain("LOCATION");
    expect(buildIcs({ ...event, location: "Makati; Floor 2" }, now)).toContain(
      "LOCATION:Makati\\; Floor 2",
    );
  });
});
