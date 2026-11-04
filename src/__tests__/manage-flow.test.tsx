import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManageBookingPage from "@/app/manage/page";
import * as magicToken from "@/lib/magic-token";
import * as endpoints from "@/lib/api/endpoints";
import type { ManagedBooking } from "@/lib/api/types";

describe("Self-Service Portal Management Flow", () => {
  const mockBooking: ManagedBooking = {
    reference: "AUR-MNG01",
    first_name: "Maria",
    service: "Doctor Dermatological Consultation",
    starts_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h from now (eligible for refund)
    status: "confirmed",
    can_reschedule: true,
    can_cancel: true,
    intake_status: "pending",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(magicToken, "consumeToken").mockReturnValue("mock_manage_token");
    vi.spyOn(endpoints, "getManagedBooking").mockResolvedValue(mockBooking);
  });

  it("loads booking details and displays reschedule & cancel options", async () => {
    render(<ManageBookingPage />);

    expect(await screen.findByText(/Welcome back,/i)).toBeInTheDocument();
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("AUR-MNG01")).toBeInTheDocument();
    expect(screen.getByText("Doctor Dermatological Consultation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reschedule Appointment/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel Appointment/i })).toBeInTheDocument();
  });

  it("opens cancellation view and correctly displays 100% refund eligibility for >=24h notice", async () => {
    const user = userEvent.setup();
    render(<ManageBookingPage />);

    const cancelBtn = await screen.findByRole("button", { name: /Cancel Appointment/i });
    await user.click(cancelBtn);

    expect(screen.getByRole("heading", { name: /Confirm Cancellation/i })).toBeInTheDocument();
    expect(
      screen.getByText(/your deposit will be 100% refunded to your payment method automatically/i)
    ).toBeInTheDocument();
  });
});
