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
    window.location.hash = "#t=mock_manage_token";
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
    expect(screen.getByRole("button", { name: /Sign Out/i })).toBeInTheDocument();
  });

  it("does not load booking and renders login/recovery forms when navigating without #t= fragment (Strict Mode)", async () => {
    window.location.hash = "";
    render(<ManageBookingPage />);

    expect(screen.getByText(/Manage Your Appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/Look Up Your Appointment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Booking Reference/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email or Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Paste Magic Link or Token/i)).toBeInTheDocument();
    expect(screen.queryByText(/Welcome back,/i)).not.toBeInTheDocument();
  });

  it("extracts token and loads booking when pasting a full magic link URL into the access field", async () => {
    window.location.hash = "";
    const user = userEvent.setup();
    render(<ManageBookingPage />);

    const tokenInput = screen.getByLabelText(/Paste Magic Link or Token/i);
    await user.type(tokenInput, "https://client.aura.ph/manage#t=mock_manage_token");

    const submitBtn = screen.getByRole("button", { name: /Access Appointment Directly/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Welcome back,/i)).toBeInTheDocument();
    expect(screen.getByText("Maria")).toBeInTheDocument();
  });

  it("signs out and clears the session when Sign Out button is clicked", async () => {
    const user = userEvent.setup();
    const clearSpy = vi.spyOn(magicToken, "clearToken");
    render(<ManageBookingPage />);

    const signOutBtn = await screen.findByRole("button", { name: /Sign Out/i });
    await user.click(signOutBtn);

    expect(clearSpy).toHaveBeenCalledWith("manage");
    expect(screen.getByText(/Manage Your Appointment/i)).toBeInTheDocument();
    expect(screen.queryByText(/Welcome back,/i)).not.toBeInTheDocument();
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
