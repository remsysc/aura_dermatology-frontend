import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IntakePage from "./page";
import * as endpoints from "@/lib/api/endpoints";
import * as magicToken from "@/lib/magic-token";
import type { IntakeForm } from "@/lib/api/types";

describe("IntakePage Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits medical intake with correct clinical schema and intake notice version", async () => {
    const user = userEvent.setup();

    vi.spyOn(magicToken, "consumeToken").mockReturnValue("test_intake_token_123");

    const mockForm: IntakeForm = {
      reference: "AUR-TEST01",
      intake_status: "pending",
      can_submit: true,
      consent_notice: {
        version: "2026-10-intake-v1",
        content_hash: "mock_hash",
        published_at: "2026-10-01T00:00:00Z",
      },
      schema: {
        skin_type: { type: "string", label: "Fitzpatrick Skin Type", required: false },
        allergies: { type: "string", label: "Known Allergies", required: false },
        medications: { type: "string", label: "Current Medications", required: false },
        pregnancy_status: { type: "string", label: "Pregnancy Status", required: false },
        history: { type: "string", label: "Medical History", required: false },
        main_concern: { type: "string", label: "Primary Skin Concern", required: false },
        prior_treatments: { type: "string", label: "Prior Treatments", required: false },
      },
    };

    vi.spyOn(endpoints, "getIntakeForm").mockResolvedValue(mockForm);
    const submitSpy = vi.spyOn(endpoints, "submitIntake").mockResolvedValue({
      status: "completed",
      submitted_at: "2026-11-03T10:00:00Z",
    });

    render(<IntakePage />);

    expect(await screen.findByText(/Pre-Arrival Medical Intake/i)).toBeInTheDocument();
    expect(screen.getByText("AUR-TEST01")).toBeInTheDocument();

    // Check consent checkbox
    const consentCheckbox = screen.getByRole("checkbox");
    await user.click(consentCheckbox);

    // Click submit
    const submitBtn = screen.getByRole("button", { name: /Submit Encrypted Medical Intake/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1);
    });

    expect(submitSpy).toHaveBeenCalledWith(
      "test_intake_token_123",
      expect.objectContaining({
        consent: {
          notice_version: "2026-10-intake-v1",
          accepted: true,
        },
        answers: expect.objectContaining({
          skin_type: "IV",
          pregnancy_status: "No",
          history: expect.stringContaining("Accutane"),
        }),
      })
    );

    expect(await screen.findByText(/Pre-Arrival Intake Completed/i)).toBeInTheDocument();
  });
});
