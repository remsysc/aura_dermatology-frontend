import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TurnstileWidget } from "./TurnstileWidget";

describe("TurnstileWidget Component", () => {
  it("automatically emits bypass token in development/sandbox mode", () => {
    const handleVerify = vi.fn();

    render(<TurnstileWidget onVerify={handleVerify} />);

    expect(handleVerify).toHaveBeenCalledWith("turnstile_client_bypass_aura");
    expect(screen.getByText(/Bot Protection Verified \(Sandbox Mode\)/i)).toBeInTheDocument();
  });
});
