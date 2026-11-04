"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { consumeToken, toInternalLink } from "@/lib/magic-token";
import { verifyBooking } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { VerifyResult } from "@/lib/api/types";

function VerifyContent() {
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("t");

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check fragment first (#t=...), then search query (?t=...)
    const fragmentToken = consumeToken("verify");
    const token = fragmentToken || queryToken;

    if (!token) {
      setLoading(false);
      setError("No verification token found. Please use the exact link sent to your email.");
      return;
    }

    let active = true;
    verifyBooking(token)
      .then((data) => {
        if (!active) return;
        setResult(data);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          setError("This verification link has expired or has already been used.");
        } else {
          setError(err instanceof ApiError ? err.message : "Verification failed.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [queryToken]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="inline-block size-10 animate-spin rounded-full border-4 border-sage border-t-forest" />
        <p className="text-sm text-graphite">Verifying your email and confirming appointment slot...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl py-16 px-4 space-y-6">
        <Alert tone="danger" title="Verification Unsuccessful">
          {error}
        </Alert>
        <div className="text-center pt-4">
          <ButtonLink href="/book" variant="primary">
            Start a New Booking
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (result) {
    const internalManage = toInternalLink(result.manage_url, ["/manage"]) ?? "/manage";
    const internalIntake = toInternalLink(result.intake_url, ["/intake"]) ?? "/intake";

    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 text-center space-y-6">
        <div className="inline-flex size-16 items-center justify-center rounded-full bg-forest text-gold">
          <Icon name="check" className="size-8" />
        </div>
        <p className="eyebrow">Email Verified</p>
        <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
          Your Booking is Confirmed!
        </h1>
        <p className="text-sm text-graphite">
          Booking Reference: <span className="font-mono font-semibold text-forest">{result.reference}</span>
        </p>

        <p className="text-base text-graphite">
          Thank you for confirming your zero-deposit appointment. Your clinician has reserved this dedicated time on their clinical schedule.
        </p>

        <div className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft text-left space-y-4">
          <h2 className="font-serif text-xl text-forest">Next Steps Before Arrival:</h2>
          <ul className="space-y-2 text-xs text-graphite">
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sage mt-1.5 shrink-0" />
              <span>Complete your confidential medical intake now so your dermatologist can review your profile in advance.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sage mt-1.5 shrink-0" />
              <span>Discontinue topical retinoids and strong acids 5 days prior to your visit.</span>
            </li>
          </ul>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <ButtonLink href={internalIntake} variant="primary" className="flex-1 justify-center">
              Complete Medical Intake
              <Icon name="arrow-right" className="size-4" />
            </ButtonLink>
            <ButtonLink href={internalManage} variant="secondary" className="flex-1 justify-center">
              Manage Appointment
            </ButtonLink>
          </div>
        </div>

        <div className="pt-4">
          <Link href="/" className="text-xs text-graphite hover:text-forest underline">
            Return to AURA Home
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default function VerifyPage() {
  return (
    <main id="main-content">
      <Suspense
        fallback={
          <div className="py-20 text-center">
            <p className="text-sm text-graphite">Processing verification...</p>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </main>
  );
}
