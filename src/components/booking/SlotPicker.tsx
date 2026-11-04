"use client";

import { useId, useMemo, useState } from "react";
import { formatTime, formatLongDate } from "@/lib/format";
import { groupSlotsByDayPart, DAY_PART_LABEL } from "@/lib/slots";
import { Icon } from "@/components/ui/Icon";
import type { AvailabilityDay } from "@/lib/api/types";

export interface SlotPickerProps {
  days: AvailabilityDay[];
  selectedSlot: string | null;
  onSelectSlot: (slotIso: string) => void;
  isLoading?: boolean;
}

export function SlotPicker({
  days,
  selectedSlot,
  onSelectSlot,
  isLoading = false,
}: SlotPickerProps) {
  const headingId = useId();

  // Selected date defaults to first available date with slots, or first day
  const availableDates = useMemo(() => {
    return days.filter((d) => d.slots && d.slots.length > 0);
  }, [days]);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return availableDates[0]?.date ?? days[0]?.date ?? "";
  });

  // If selectedDate is not among days or availableDates updated, re-sync
  const activeDay = useMemo(() => {
    return days.find((d) => d.date === selectedDate) ?? availableDates[0] ?? days[0];
  }, [days, selectedDate, availableDates]);

  const slotGroups = useMemo(() => {
    if (!activeDay || !activeDay.slots) {
      return [];
    }
    return groupSlotsByDayPart(activeDay.slots);
  }, [activeDay]);

  const totalSlotsForDay = activeDay?.slots?.length ?? 0;

  return (
    <div className="space-y-6" aria-labelledby={headingId}>
      <div className="flex items-center justify-between">
        <h3 id={headingId} className="font-serif text-xl font-medium text-forest">
          Select Date & Time
        </h3>
        <span className="text-xs text-graphite">Asia/Manila (PHT)</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7" aria-label="Loading calendar">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border hairline bg-sand/50"
            />
          ))}
        </div>
      ) : days.length === 0 ? (
        <div className="rounded-2xl border hairline bg-sand/30 p-6 text-center text-sm text-graphite">
          No availability found for this service or practitioner in the next 14 days. Please try another selection.
        </div>
      ) : (
        <>
          {/* Horizontal Date Strip */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max" role="radiogroup" aria-label="Choose appointment date">
              {days.map((day) => {
                const isSelected = (activeDay?.date === day.date);
                const hasSlots = day.slots && day.slots.length > 0;
                const dateObj = new Date(`${day.date}T00:00:00+08:00`);
                const dayName = dateObj.toLocaleDateString("en-PH", { weekday: "short", timeZone: "Asia/Manila" });
                const dayNum = dateObj.toLocaleDateString("en-PH", { day: "numeric", timeZone: "Asia/Manila" });
                const monthName = dateObj.toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" });

                return (
                  <button
                    key={day.date}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={!hasSlots}
                    onClick={() => {
                      setSelectedDate(day.date);
                    }}
                    className={`flex min-w-[76px] flex-col items-center rounded-2xl border p-2.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep ${
                      isSelected
                        ? "border-forest bg-forest text-alabaster shadow-soft"
                        : hasSlots
                        ? "border-field bg-paper text-forest hover:border-forest hover:bg-sand/30"
                        : "cursor-not-allowed border-field/40 bg-sand/20 text-graphite/40"
                    }`}
                  >
                    <span className={`text-[11px] font-medium uppercase tracking-wider ${isSelected ? "text-alabaster/80" : "text-graphite"}`}>
                      {dayName}
                    </span>
                    <span className="font-display text-xl font-semibold leading-tight my-0.5">
                      {dayNum}
                    </span>
                    <span className={`text-[10px] ${isSelected ? "text-alabaster/80" : "text-graphite"}`}>
                      {monthName}
                    </span>
                    <span className={`mt-1 text-[9px] font-medium ${isSelected ? "text-gold" : hasSlots ? "text-sage font-semibold" : "text-graphite/40"}`}>
                      {hasSlots ? `${day.slots.length} slots` : "Full"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Picker for the selected day */}
          <div className="rounded-3xl border hairline bg-paper p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between border-b hairline pb-3">
              <div className="flex items-center gap-2">
                <Icon name="calendar" className="size-4 text-sage" />
                <span className="text-sm font-medium text-forest">
                  {activeDay ? formatLongDate(`${activeDay.date}T09:00:00+08:00`) : "Select a date"}
                </span>
              </div>
              <span className="text-xs text-graphite">
                {totalSlotsForDay} available {totalSlotsForDay === 1 ? "slot" : "slots"}
              </span>
            </div>

            {totalSlotsForDay === 0 ? (
              <p className="py-8 text-center text-sm text-graphite">
                No slots remaining on this day. Please pick another date above.
              </p>
            ) : (
              <div className="space-y-5">
                {slotGroups.map((group) => (
                  <div key={group.part}>
                    <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-graphite">
                      <Icon name="clock" className="size-3.5 text-sage" />
                      {DAY_PART_LABEL[group.part]} ({group.part === "morning" ? "Before 12:00 PM" : group.part === "afternoon" ? "12:00 PM – 5:00 PM" : "After 5:00 PM"})
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6" role="radiogroup">
                      {group.slots.map((iso) => {
                        const isChosen = selectedSlot === iso;
                        return (
                          <button
                            key={iso}
                            type="button"
                            role="radio"
                            aria-checked={isChosen}
                            onClick={() => onSelectSlot(iso)}
                            className={`rounded-xl border px-3 py-2 text-center text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep ${
                              isChosen
                                ? "border-forest bg-forest text-alabaster shadow-xs"
                                : "border-field bg-sand/30 text-forest hover:border-forest hover:bg-paper"
                            }`}
                          >
                            {formatTime(iso)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
