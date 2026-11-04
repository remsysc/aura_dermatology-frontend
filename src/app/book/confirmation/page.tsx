"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadBookingSession, saveBookingSession, type BookingSession } from "@/lib/booking-session";
import { getBookingStatus, requestIntakeLink } from "@/lib/api/endpoints";
import { HoldTimer } from "@/components/booking/HoldTimer";
import { PayMongoCheckout } from "@/components/booking/PayMongoCheckout";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { formatDateTime, formatDuration, formatPesos } from "@/lib/format";
import { downloadIcs } from "@/lib/ics";
import { config } from "@/lib/config";
import type { BookingStatus } from "@/lib/api/types";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  const [session, setSession] = useState<BookingSession | null>(null);
  const [status, setStatus] = useState<BookingStatus>("held");
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Load session from sessionStorage
  useEffect(() => {
    if (!ref) return;
    const loaded = loadBookingSession(ref);
    if (loaded) {
      setSession(loaded);
    }
  }, [ref]);

  // Poll booking status every 3.5 seconds while status is "held" and not expired
  useEffect(() => {
    if (!ref || !session?.statusToken || status !== "held" || isExpired) return;

    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await getBookingStatus(ref, session.statusToken);
        if (!active) return;
        setStatus(res.status);
      } catch (err) {
        if (!active) return;
        setPollingError("Live synchronization paused. Retrying...");
      }
    }, 3500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [ref, session?.statusToken, status, isExpired]);

  // Once confirmed, exchange the status token for an intake link so the patient can continue
  // immediately instead of waiting for the confirmation email. Retries briefly because the
  // webhook may confirm the booking server-side a moment after the client shows success.
  useEffect(() => {
    if (!ref || status !== "confirmed" || !session?.statusToken || session.intakeToken) return;

    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const statusToken = session.statusToken;

    async function fetchIntakeLink() {
      attempts += 1;
      try {
        const res = await requestIntakeLink(ref as string, statusToken);
        if (!active) return;
        const fragment = res.intake_url.split("#t=")[1];
        if (!fragment) return;
        const updated = { ...session, intakeToken: fragment } as BookingSession;
        saveBookingSession(updated);
        setSession(updated);
      } catch {
        if (active && attempts < 5) {
          timer = setTimeout(fetchIntakeLink, 3000);
        }
      }
    }

    void fetchIntakeLink();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [ref, status, session]);

  function handleDownloadCalendar() {
    if (!session) return;
    downloadIcs({
      reference: session.reference,
      title: `${session.service.name} — AURA Dermatology`,
      startsAtIso: session.startsAt,
      durationMinutes: session.service.duration_min,
      description: `Appointment with ${session.practitionerLabel} at ${config.clinic.name}.\nBooking Reference: ${session.reference}`,
      location: config.clinic.address || "Metro Manila, Philippines",
    });
  }

  if (!ref) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <Alert tone="danger" title="Invalid Request">
          No booking reference was provided. Please return to the booking page.
        </Alert>
        <div className="mt-6">
          <ButtonLink href="/book" variant="primary">
            Start New Booking
          </ButtonLink>
        </div>
      </div>
    );
  }

  const isConfirmed = status === "confirmed";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-forest text-gold mb-4">
          <Icon name={isConfirmed ? "check" : "clock"} className="size-7" />
        </div>
        <p className="eyebrow">{isConfirmed ? "Appointment Verified" : "Temporary Hold Active"}</p>
        <h1 className="mt-1 font-serif text-3xl font-medium text-forest sm:text-4xl">
          {isConfirmed ? "Your Appointment is Confirmed" : "Your Slot is Reserved for 15 Minutes"}
        </h1>
        <p className="mt-2 text-sm text-graphite">
          Booking Reference: <span className="font-mono font-semibold text-forest">{ref}</span>
        </p>
      </div>

      {/* Countdown Timer for Held status */}
      {!isConfirmed && session && !isExpired && (
        <div className="flex justify-center">
          <HoldTimer
            expiresAtIso={session.holdExpiresAt}
            onExpired={() => {
              setIsExpired(true);
              setStatus("expired");
            }}
          />
        </div>
      )}

      {isExpired && (
        <Alert tone="danger" title="Hold Window Expired">
          Your 15-minute reservation hold has expired and this slot has been released back into the clinic calendar.
          Please select a new time slot.
        </Alert>
      )}

      {/* Appointment Ticket Card */}
      <div className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-6">
        <div className="flex items-center justify-between border-b hairline pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-graphite">Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${
                  isConfirmed
                    ? "bg-sage-deep/10 text-sage-deep border border-sage-deep/20"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}
              >
                {status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider font-semibold text-graphite">Clinic</span>
            <p className="text-sm font-semibold text-forest mt-0.5">{config.clinic.name}</p>
          </div>
        </div>

        {session ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
            <div>
              <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Treatment</span>
              <p className="font-semibold text-forest mt-0.5">{session.service.name}</p>
              <span className="text-xs text-graphite">{formatDuration(session.service.duration_min)}</span>
            </div>
            <div>
              <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Attending Specialist</span>
              <p className="font-semibold text-forest mt-0.5">{session.practitionerLabel}</p>
              <span className="text-xs text-graphite">Board-Certified or Licensed</span>
            </div>
            <div>
              <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Scheduled Date & Time</span>
              <p className="font-semibold text-forest mt-0.5">{formatDateTime(session.startsAt)}</p>
              <span className="text-xs text-graphite">Asia/Manila (PHT)</span>
            </div>
            <div>
              <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Deposit Details</span>
              <p className="font-semibold text-forest mt-0.5">
                {session.payment.required
                  ? `${formatPesos(session.payment.amount_cents)} required`
                  : "Zero Deposit Required"}
              </p>
              <span className="text-xs text-graphite">
                {session.payment.required ? "Credited to your treatment fee" : "Full fee payable on visit"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-graphite">
            Loading appointment ticket details...
          </p>
        )}

        {/* PayMongo Checkout Integration */}
        {!isConfirmed && !isExpired && session && session.payment.required && (
          <div className="pt-2">
            <PayMongoCheckout
              amountCents={session.payment.amount_cents}
              currency={session.payment.currency}
              reference={session.reference}
              clientKey={session.payment.client_key}
              paymentIntentId={session.payment.payment_intent_id}
              onPaymentSuccess={() => {
                setStatus("confirmed");
              }}
            />
          </div>
        )}

        {/* Polling Notice for zero-deposit or already submitted payments */}
        {!isConfirmed && !isExpired && (!session || !session.payment.required) && (
          <div className="rounded-2xl border hairline bg-sand/40 p-4 text-xs text-graphite space-y-3">
            <div className="flex items-center gap-2 text-forest font-semibold">
              <Icon name="clock" className="size-4 text-sage" />
              <span>Awaiting Zero-Deposit Verification</span>
            </div>
            <p>
              Please check your email. A verification link has been dispatched to confirm your appointment reservation.
            </p>
          </div>
        )}

        {/* Confirmed Actions */}
        {isConfirmed && (
          <div className="border-t hairline pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={handleDownloadCalendar}
                className="flex-1 justify-center"
              >
                <Icon name="calendar" className="size-4" />
                Add to Calendar (.ics)
              </Button>

              <ButtonLink
                href={session?.intakeToken ? `/intake#t=${encodeURIComponent(session.intakeToken)}` : "/intake"}
                variant="secondary"
                className="flex-1 justify-center"
              >
                <Icon name="sparkles" className="size-4" />
                Complete Medical Intake
              </ButtonLink>
            </div>

            {/* Prominent Intake Callout */}
            <div className="rounded-2xl border border-sage-deep/30 bg-sage-deep/5 p-4 text-xs text-graphite">
              <div className="flex items-center gap-1.5 font-semibold text-forest">
                <Icon name="shield" className="size-4 text-sage" />
                <span>Save 15 minutes at check-in</span>
              </div>
              <p className="mt-1">
                Complete our confidential online medical intake now. Your health history and Fitzpatrick skin type will be securely encrypted for your dermatologist before you arrive.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between text-xs text-graphite">
        <Link href="/" className="hover:text-forest transition-colors">
          Return to Home
        </Link>
        {session && (
          <Link
            href={`/manage#t=${encodeURIComponent(session.statusToken)}`}
            className="hover:text-forest underline transition-colors"
          >
            Manage this appointment
          </Link>
        )}
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <main id="main-content">
      <Suspense
        fallback={
          <div className="mx-auto max-w-xl py-20 text-center">
            <p className="text-sm text-graphite">Loading appointment details...</p>
          </div>
        }
      >
        <ConfirmationContent />
      </Suspense>
    </main>
  );
}
