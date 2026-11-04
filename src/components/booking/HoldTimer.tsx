"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export interface HoldTimerProps {
  expiresAtIso: string;
  onExpired?: () => void;
  className?: string;
}

export function HoldTimer({ expiresAtIso, onExpired, className = "" }: HoldTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const target = new Date(expiresAtIso).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((target - now) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const target = new Date(expiresAtIso).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAtIso, onExpired]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isExpired = secondsRemaining <= 0;
  const isUrgent = secondsRemaining > 0 && secondsRemaining <= 180; // 3 minutes or less

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Reservation hold remaining time: ${minutes} minutes and ${seconds} seconds`}
      suppressHydrationWarning
      className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
        isExpired
          ? "border border-red-200 bg-red-50 text-red-800"
          : isUrgent
          ? "border border-amber-300 bg-amber-50 text-amber-900 animate-pulse"
          : "border border-line-slate bg-warm-alabaster text-forest-slate"
      } ${className}`}
    >
      <Icon
        name={isExpired ? "alert-circle" : "clock"}
        className={`h-4 w-4 shrink-0 ${
          isExpired ? "text-red-600" : isUrgent ? "text-amber-700" : "text-sage-deep"
        }`}
      />
      <div>
        {isExpired ? (
          <span>Reservation hold expired. This slot may no longer be reserved.</span>
        ) : (
          <span>
            Slot held for{" "}
            <span className="font-mono font-semibold tracking-wider" suppressHydrationWarning>{formattedTime}</span>. Complete confirmation before expiration.
          </span>
        )}
      </div>
    </div>
  );
}
