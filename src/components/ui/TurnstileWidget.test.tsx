import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TurnstileWidget } from "./TurnstileWidget";
import { config } from "@/lib/config";

describe("TurnstileWidget Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("automatically emits bypass token in development/sandbox mode when siteKey is empty", () => {
    const handleVerify = vi.fn();

    render(<TurnstileWidget onVerify={handleVerify} />);

    expect(handleVerify).toHaveBeenCalledWith("turnstile_client_bypass_aura");
    expect(screen.getByText(/Bot Protection Verified \(Sandbox Mode\)/i)).toBeInTheDocument();
  });

  it("renders Turnstile script and mounts widget with action when siteKey is provided", () => {
    const originalSiteKey = config.turnstileSiteKey;
    // @ts-expect-error mutating config for test
    config.turnstileSiteKey = "0x4AAAAAAFzJtl0q4HL2axkJ";

    // Simulate pre-loaded script tag
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    document.head.appendChild(script);

    const renderMock = vi.fn().mockReturnValue("cf-widget-id-123");
    const removeMock = vi.fn();
    window.turnstile = {
      render: renderMock,
      reset: vi.fn(),
      remove: removeMock,
    };

    const handleVerify = vi.fn();
    const { unmount } = render(
      <TurnstileWidget action="booking" onVerify={handleVerify} />
    );

    expect(renderMock).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        sitekey: "0x4AAAAAAFzJtl0q4HL2axkJ",
        action: "booking",
        theme: "light",
      })
    );

    unmount();
    expect(removeMock).toHaveBeenCalledWith("cf-widget-id-123");

    // Clean up
    script.remove();
    // @ts-expect-error restore
    config.turnstileSiteKey = originalSiteKey;
  });
});
