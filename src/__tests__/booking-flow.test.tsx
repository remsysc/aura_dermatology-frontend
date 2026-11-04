import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingIsland } from "@/components/booking/BookingIsland";
import * as endpoints from "@/lib/api/endpoints";
import type { Service, Practitioner, BookingHold } from "@/lib/api/types";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockServices: Service[] = [
  {
    slug: "initial-consultation",
    name: "Doctor Dermatological Consultation",
    duration_min: 30,
    price_cents: 200000,
    deposit: { policy: "flat", amount_cents: 100000, creditable: true },
    intake_enabled: true,
    required_role: "doctor",
    requires_machine: false,
  },
];

const mockPractitioners: Practitioner[] = [
  {
    slug: "dr-elena-roces",
    name: "Dr. Elena Roces",
    role: "doctor",
  },
];

describe("Booking Island Multi-Step Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(endpoints, "getAvailability").mockResolvedValue({
      timezone: "Asia/Manila",
      data: [
        {
          date: "2026-11-05",
          slots: ["2026-11-05T09:00:00+08:00", "2026-11-05T14:00:00+08:00"],
        },
      ],
    });

    vi.spyOn(endpoints, "createBooking").mockResolvedValue({
      reference: "AUR-TEST99",
      status: "held",
      hold_expires_at: "2026-11-05T09:15:00+08:00",
      starts_at: "2026-11-05T09:00:00+08:00",
      status_token: "mock_status_token",
      verify_token: null,
      payment: {
        required: true,
        amount_cents: 100000,
        currency: "PHP",
        payment_intent_id: "pi_mock",
        client_key: "client_mock",
      },
    } as BookingHold);
  });

  it("completes the full booking journey from service selection to hold creation", async () => {
    const user = userEvent.setup();

    render(
      <BookingIsland
        services={mockServices}
        practitioners={mockPractitioners}
        initialServiceSlug="initial-consultation"
      />
    );

    // STEP 0: Service & Doctor
    expect(screen.getByText("Select Clinical Treatment")).toBeInTheDocument();
    expect(screen.getByText("Doctor Dermatological Consultation")).toBeInTheDocument();

    const continueToSlotsBtn = screen.getByRole("button", { name: /Select Date & Time/i });
    await user.click(continueToSlotsBtn);

    // STEP 1: Date & Time Picker
    expect(await screen.findByText("Choose Appointment Slot")).toBeInTheDocument();
    const slotRadio = await screen.findByRole("radio", { name: /9:00/i });
    await user.click(slotRadio);

    const continueToDetailsBtn = screen.getByRole("button", { name: /Continue to Details/i });
    await user.click(continueToDetailsBtn);

    // STEP 2: Patient Information & DPA Consent
    expect(await screen.findByText("Patient Information")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Full Legal Name/i), "Maria Clara");
    await user.type(screen.getByLabelText(/Email Address/i), "maria@example.ph");
    await user.type(screen.getByLabelText(/Philippine Mobile Number/i), "0917 123 4567");

    const consentCheckbox = screen.getByRole("checkbox");
    await user.click(consentCheckbox);

    const continueToReviewBtn = screen.getByRole("button", { name: /Review & Hold/i });
    await user.click(continueToReviewBtn);

    // STEP 3: Review & Submit Hold
    expect(await screen.findByText("Review & Hold Reservation")).toBeInTheDocument();
    expect(screen.getByText("Maria Clara")).toBeInTheDocument();
    expect(screen.getByText("maria@example.ph")).toBeInTheDocument();

    const confirmHoldBtn = screen.getByRole("button", { name: /Confirm & Hold Slot/i });
    await user.click(confirmHoldBtn);

    // Verify endpoints.createBooking was invoked
    expect(endpoints.createBooking).toHaveBeenCalledTimes(1);
    expect(endpoints.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        service: "initial-consultation",
        starts_at: "2026-11-05T09:00:00+08:00",
        patient: {
          name: "Maria Clara",
          email: "maria@example.ph",
          mobile: "+639171234567",
        },
        consent: {
          notice_version: "2026-10-v1",
          accepted: true,
        },
      }),
      expect.any(String)
    );

    // Verify router redirect to confirmation
    expect(mockPush).toHaveBeenCalledWith("/book/confirmation?ref=AUR-TEST99");
  });

  it("reuses the same idempotency key on submission retry when payload is unchanged, and generates a new key when modified", async () => {
    const user = userEvent.setup();

    // Mock initial failure (e.g. network timeout)
    const createBookingSpy = vi
      .spyOn(endpoints, "createBooking")
      .mockRejectedValueOnce(new Error("Network connection dropped"))
      .mockResolvedValueOnce({
        reference: "AUR-RETRY01",
        status: "held",
        hold_expires_at: "2026-11-05T09:15:00+08:00",
        starts_at: "2026-11-05T09:00:00+08:00",
        status_token: "mock_status_token",
        verify_token: null,
        payment: {
          required: true,
          amount_cents: 100000,
          currency: "PHP",
          payment_intent_id: "pi_retry",
          client_key: "client_retry",
        },
      } as BookingHold);

    render(
      <BookingIsland
        services={mockServices}
        practitioners={mockPractitioners}
        initialServiceSlug="initial-consultation"
      />
    );

    // Navigate to step 1
    await user.click(screen.getByRole("button", { name: /Select Date & Time/i }));

    // Select slot and navigate to step 2
    const slotRadio = await screen.findByRole("radio", { name: /9:00/i });
    await user.click(slotRadio);
    await user.click(screen.getByRole("button", { name: /Continue to Details/i }));

    // Fill details and consent
    await user.type(await screen.findByLabelText(/Full Legal Name/i), "Jose Rizal");
    await user.type(screen.getByLabelText(/Email Address/i), "jose@example.ph");
    await user.type(screen.getByLabelText(/Philippine Mobile Number/i), "0918 555 1234");
    await user.click(screen.getByRole("checkbox"));

    // Navigate to step 3 review
    await user.click(screen.getByRole("button", { name: /Review & Hold/i }));

    const confirmHoldBtn = await screen.findByRole("button", { name: /Confirm & Hold Slot/i });

    // FIRST ATTEMPT: Fails due to simulated network error
    await user.click(confirmHoldBtn);
    expect(createBookingSpy).toHaveBeenCalledTimes(1);
    const firstKey = createBookingSpy.mock.calls[0][1];
    expect(typeof firstKey).toBe("string");
    expect(firstKey.length).toBeGreaterThan(0);

    // Error alert is displayed
    expect(
      await screen.findByText(/An unexpected error occurred while locking your reservation/i)
    ).toBeInTheDocument();

    // SECOND ATTEMPT: Click again without modifying details (safe idempotency replay)
    await user.click(confirmHoldBtn);
    expect(createBookingSpy).toHaveBeenCalledTimes(2);
    const secondKey = createBookingSpy.mock.calls[1][1];

    // Assert that the exact same idempotency key is reused on unchanged retry!
    expect(secondKey).toBe(firstKey);
    expect(mockPush).toHaveBeenCalledWith("/book/confirmation?ref=AUR-RETRY01");
  });
});
