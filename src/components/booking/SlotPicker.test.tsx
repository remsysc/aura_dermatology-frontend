import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SlotPicker } from "./SlotPicker";
import type { AvailabilityDay } from "@/lib/api/types";

const mockDays: AvailabilityDay[] = [
  {
    date: "2026-11-05",
    slots: [
      "2026-11-05T09:00:00+08:00",
      "2026-11-05T09:30:00+08:00",
      "2026-11-05T14:00:00+08:00",
      "2026-11-05T18:00:00+08:00",
    ],
  },
  {
    date: "2026-11-06",
    slots: [],
  },
];

describe("SlotPicker Component", () => {
  it("renders dates and shows slots grouped by period", () => {
    const handleSelect = vi.fn();
    render(
      <SlotPicker
        days={mockDays}
        selectedSlot={null}
        onSelectSlot={handleSelect}
      />
    );

    expect(screen.getByText("Select Date & Time")).toBeInTheDocument();
    expect(screen.getByText("Morning (Before 12:00 PM)")).toBeInTheDocument();
    expect(screen.getByText("Afternoon (12:00 PM – 5:00 PM)")).toBeInTheDocument();
    expect(screen.getByText("Evening (After 5:00 PM)")).toBeInTheDocument();
  });

  it("triggers onSelectSlot when a time slot button is clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <SlotPicker
        days={mockDays}
        selectedSlot={null}
        onSelectSlot={handleSelect}
      />
    );

    const slotBtn = screen.getByRole("radio", { name: /9:00/i });
    await user.click(slotBtn);

    expect(handleSelect).toHaveBeenCalledWith("2026-11-05T09:00:00+08:00");
  });

  it("renders empty state notice when no days are passed", () => {
    render(
      <SlotPicker
        days={[]}
        selectedSlot={null}
        onSelectSlot={vi.fn()}
      />
    );

    expect(
      screen.getByText(/No availability found for this service or practitioner/i)
    ).toBeInTheDocument();
  });
});
