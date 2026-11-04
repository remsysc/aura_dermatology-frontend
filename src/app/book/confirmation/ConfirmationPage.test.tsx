import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmationPage from "./page";
import * as endpoints from "@/lib/api/endpoints";
import { saveBookingSession, type BookingSession } from "@/lib/booking-session";

// Mock next/navigation
const mockSearchParams = new URLSearchParams("ref=AUR-INTTEST");
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock config
vi.mock("@/lib/config", () => ({
  config: {
    paymongoPublicKey: "", // simulate local dev mode
    paymongoBaseUrl: "https://api.paymongo.com/v1",
    clinic: {
      name: "AURA Dermatology & Laser Studio",
      address: "BGC, Taguig",
      phone: "+63 2 8888 2872",
      email: "concierge@aura-dermatology.ph",
    },
    defaultTimezone: "Asia/Manila",
  },
}));

describe("Confirmation Page Integration Flow", () => {
  const sampleSession: BookingSession = {
    reference: "AUR-INTTEST",
    statusToken: "status_token_xyz_123",
    holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    startsAt: "2026-11-06T14:00:00+08:00",
    service: {
      slug: "laser-hair-removal",
      name: "Laser Hair Removal",
      duration_min: 45,
      price_cents: 350000,
    },
    practitionerLabel: "Nurse J. Santos",
    payment: {
      required: true,
      amount_cents: 100000,
      currency: "PHP",
      payment_intent_id: "pi_mock_int_123",
      client_key: "client_mock_key_123",
    },
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    sessionStorage.clear();
    saveBookingSession(sampleSession);

    vi.spyOn(endpoints, "getBookingStatus").mockResolvedValue({
      reference: "AUR-INTTEST",
      status: "confirmed",
      hold_expires_at: sampleSession.holdExpiresAt,
    });

    vi.spyOn(endpoints, "simulatePayment").mockResolvedValue({
      status: "confirmed",
      reference: "AUR-INTTEST",
    });

    vi.spyOn(endpoints, "requestIntakeLink").mockResolvedValue({
      reference: "AUR-INTTEST",
      intake_url: "http://localhost:3000/intake#t=intake_exchange_token_abc",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders hold state, simulates GCash payment, polls to confirmed, and unlocks medical intake", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<ConfirmationPage />);

    // Allow initial loadBookingSession effect to run
    await act(async () => {
      await Promise.resolve();
    });

    // 1. Initial State: Held, ticket loaded
    expect(screen.getByText("Your Slot is Reserved for 15 Minutes")).toBeInTheDocument();
    expect(screen.getByText("AUR-INTTEST")).toBeInTheDocument();
    expect(screen.getByText("Laser Hair Removal")).toBeInTheDocument();
    expect(screen.getByText("Nurse J. Santos")).toBeInTheDocument();
    expect(screen.getByText("Local Dev Sandbox (Simulated PayMongo)")).toBeInTheDocument();

    // 2. Fill phone and submit simulated payment
    const phoneInput = screen.getByLabelText(/GCash Registered Mobile/i);
    await user.type(phoneInput, "09171234567");

    const submitBtn = screen.getByRole("button", { name: /Simulate ₱1,000 Deposit \(GCASH\)/i });
    await user.click(submitBtn);

    // 3. Verify simulatePayment called with booking token
    expect(endpoints.simulatePayment).toHaveBeenCalledWith(
      "AUR-INTTEST",
      "status_token_xyz_123",
      "gcash"
    );

    // 4. Advance timers for status polling interval (3.5s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    // 5. Polling updates status to confirmed
    await waitFor(() => {
      expect(screen.getByText("Your Appointment is Confirmed")).toBeInTheDocument();
      expect(screen.getByText("CONFIRMED")).toBeInTheDocument();
    });

    // 6. Advance timers for intake link exchange
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await waitFor(() => {
      expect(endpoints.requestIntakeLink).toHaveBeenCalledWith(
        "AUR-INTTEST",
        "status_token_xyz_123"
      );
    });

    const intakeLink = screen.getByRole("link", { name: /Complete Medical Intake/i });
    expect(intakeLink).toBeInTheDocument();
    expect(intakeLink).toHaveAttribute(
      "href",
      "/intake#t=intake_exchange_token_abc"
    );

    const calendarBtn = screen.getByRole("button", { name: /Add to Calendar/i });
    expect(calendarBtn).toBeInTheDocument();
  });
});
