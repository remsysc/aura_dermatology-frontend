import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { HoldTimer } from "./HoldTimer";

describe("HoldTimer Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates remaining minutes and seconds and counts down", () => {
    const now = new Date("2026-11-05T10:00:00Z").getTime();
    vi.setSystemTime(now);

    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    render(<HoldTimer expiresAtIso={expiresAt} />);

    expect(screen.getByText("10:00")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000); // 5 seconds pass
    });

    expect(screen.getByText("09:55")).toBeInTheDocument();
  });

  it("shows expired state when time elapses", () => {
    const now = new Date("2026-11-05T10:00:00Z").getTime();
    vi.setSystemTime(now);

    const onExpired = vi.fn();
    const expiresAt = new Date(now + 2000).toISOString(); // 2 seconds

    render(<HoldTimer expiresAtIso={expiresAt} onExpired={onExpired} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onExpired).toHaveBeenCalled();
    expect(screen.getByText(/Reservation hold expired/i)).toBeInTheDocument();
  });
});
