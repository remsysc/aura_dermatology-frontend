import { config } from "@/lib/config";

export type DayPart = "morning" | "afternoon" | "evening";

export const DAY_PART_LABEL: Record<DayPart, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const HOUR_FORMAT_CACHE = new Map<string, Intl.DateTimeFormat>();

function hourInZone(iso: string, timeZone: string): number {
  let formatter = HOUR_FORMAT_CACHE.get(timeZone);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    });
    HOUR_FORMAT_CACHE.set(timeZone, formatter);
  }
  return Number.parseInt(formatter.format(new Date(iso)), 10);
}

/** Morning < 12:00, afternoon 12:00-16:59, evening from 17:00 (clinic wall clock). */
export function dayPartOf(iso: string, timeZone: string = config.defaultTimezone): DayPart {
  const hour = hourInZone(iso, timeZone);
  if (hour < 12) {
    return "morning";
  }
  return hour < 17 ? "afternoon" : "evening";
}

export interface SlotGroup {
  part: DayPart;
  slots: string[];
}

/** Groups a day's slots into non-empty parts of the day, preserving chronological order. */
export function groupSlotsByDayPart(
  slots: readonly string[],
  timeZone: string = config.defaultTimezone,
): SlotGroup[] {
  const sorted = [...slots].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const buckets: Record<DayPart, string[]> = { morning: [], afternoon: [], evening: [] };
  for (const slot of sorted) {
    buckets[dayPartOf(slot, timeZone)].push(slot);
  }
  return (["morning", "afternoon", "evening"] as const)
    .filter((part) => buckets[part].length > 0)
    .map((part) => ({ part, slots: buckets[part] }));
}
