"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { consumeToken, clearToken, parseFragmentToken } from "@/lib/magic-token";
import { getManagedBooking, rescheduleBooking, cancelBooking, getAvailability, requestMagicLink } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { formatDateTime, dateKeyInZone } from "@/lib/format";
import type { ManagedBooking, AvailabilityDay } from "@/lib/api/types";

export default function ManageBookingPage() {
  const [token, setToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState<string>("");
  const [recoveryReference, setRecoveryReference] = useState<string>("");
  const [recoveryContact, setRecoveryContact] = useState<string>("");
  const [recoverySubmitting, setRecoverySubmitting] = useState<boolean>(false);
  const [recoveryNotice, setRecoveryNotice] = useState<{
    tone: "success" | "danger";
    title: string;
    message: string;
  } | null>(null);
  const [booking, setBooking] = useState<ManagedBooking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleDays, setRescheduleDays] = useState<AvailabilityDay[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [newSelectedSlot, setNewSelectedSlot] = useState<string | null>(null);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelSubmitting, setCancelSubmitting] = useState<boolean>(false);

  // Consume token on mount
  useEffect(() => {
    // Strict Mode (Option A): Only authenticate if an explicit token fragment (#t=...) was provided in the URL.
    // If arriving via a generic link (e.g. site footer /manage), never auto-resume from cache.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash && parseFragmentToken(hash)) {
      const extracted = consumeToken("manage");
      if (extracted) {
        setToken(extracted);
        return;
      }
    } else {
      // Direct navigation without a token fragment: clear any cached manage token
      clearToken("manage");
    }
    setLoading(false);
  }, []);

  // Fetch managed booking
  useEffect(() => {
    if (!token) return;

    let active = true;
    setLoading(true);
    setError(null);

    getManagedBooking(token)
      .then((data) => {
        if (!active) return;
        setBooking(data);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setError("This management link has expired or is invalid. Please request a new magic link.");
        } else {
          setError(err instanceof ApiError ? err.message : "Unable to load appointment.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  function handleManualTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setToken(manualToken.trim());
  }

  function handleSignOut() {
    clearToken("manage");
    setToken(null);
    setBooking(null);
    setManualToken("");
    setError(null);
    setActionNotice(null);
  }

  async function handleRecoverySubmit(e: React.FormEvent) {
    e.preventDefault();
    setRecoverySubmitting(true);
    setRecoveryNotice(null);

    try {
      const res = await requestMagicLink(recoveryReference.trim().toUpperCase(), recoveryContact.trim());
      setRecoveryNotice({ tone: "success", title: "Request received", message: res.message });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setRecoveryNotice({
          tone: "danger",
          title: "Check your details",
          message: "Enter a booking reference like AUR-XXXXX and the email or mobile number you booked with.",
        });
      } else if (err instanceof ApiError && err.code === "rate_limited") {
        setRecoveryNotice({
          tone: "danger",
          title: "Too many requests",
          message: "Please wait a little while before requesting another link.",
        });
      } else {
        setRecoveryNotice({
          tone: "danger",
          title: "Something went wrong",
          message: "We could not process your request. Please try again shortly.",
        });
      }
    } finally {
      setRecoverySubmitting(false);
    }
  }

  // Load availability when entering reschedule mode
  async function handleOpenReschedule() {
    setIsRescheduling(true);
    setIsCancelling(false);
    setActionNotice(null);
    setLoadingSlots(true);

    try {
      const today = new Date();
      const fromStr = dateKeyInZone(today);
      const toDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      const toStr = dateKeyInZone(toDate);

      const targetServiceSlug = booking?.service_slug || "dermatology-consultation";
      const res = await getAvailability({
        service: targetServiceSlug,
        from: fromStr,
        to: toStr,
      });
      setRescheduleDays(res.data);
    } catch {
      setError("Unable to load alternate appointment availability.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleConfirmReschedule() {
    if (!token || !newSelectedSlot) return;

    setRescheduleSubmitting(true);
    setActionNotice(null);

    try {
      const res = await rescheduleBooking(token, newSelectedSlot);
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              starts_at: res.starts_at,
              status: res.status,
              can_reschedule: false, // Single reschedule rule enforced
            }
          : null,
      );
      setIsRescheduling(false);
      setActionNotice("Appointment successfully rescheduled. A confirmation email has been dispatched.");
    } catch (err) {
      setActionNotice(err instanceof ApiError ? err.message : "Failed to reschedule appointment.");
    } finally {
      setRescheduleSubmitting(false);
    }
  }

  async function handleConfirmCancel() {
    if (!token) return;

    setCancelSubmitting(true);
    setActionNotice(null);

    try {
      const res = await cancelBooking(token, cancelReason);
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: res.status,
              can_reschedule: false,
              can_cancel: false,
            }
          : null,
      );
      setIsCancelling(false);
      setActionNotice(
        res.refund_status === "processed"
          ? "Appointment cancelled. Your deposit refund has been initiated to your original payment method."
          : "Appointment cancelled. Deposit was forfeited in accordance with the 24-hour clinic policy.",
      );
    } catch (err) {
      setActionNotice(err instanceof ApiError ? err.message : "Failed to cancel appointment.");
    } finally {
      setCancelSubmitting(false);
    }
  }

  // Token Prompt view
  if (!token && !loading) {
    return (
      <main id="main-content" className="py-16">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-forest text-gold mb-3">
              <Icon name="lock" className="size-6" />
            </div>
            <h1 className="font-serif text-3xl font-medium text-forest">Manage Your Appointment</h1>
            <p className="mt-2 text-sm text-graphite">
              Click the management link sent to your email, or enter your token below to access self-service rescheduling and cancellation.
            </p>
          </div>

          <form onSubmit={handleManualTokenSubmit} className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-4">
            <TextField
              id="manage-token"
              label="Management Access Token"
              hint="Check your email confirmation for the direct magic link."
              required
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="e.g. 64-character token"
            />
            <Button type="submit" variant="primary" className="w-full justify-center">
              Access Appointment
              <Icon name="arrow-right" className="size-4" />
            </Button>
          </form>

          <form onSubmit={handleRecoverySubmit} className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-4">
            <div>
              <h2 className="font-serif text-xl font-medium text-forest">Lost your link?</h2>
              <p className="mt-1 text-xs text-graphite">
                Enter your booking reference and the email or mobile number you booked with. If they match an upcoming confirmed appointment, we will email you a fresh link.
              </p>
            </div>
            <TextField
              id="recovery-reference"
              label="Booking Reference"
              required
              value={recoveryReference}
              onChange={(e) => setRecoveryReference(e.target.value)}
              placeholder="AUR-XXXXX"
              autoComplete="off"
            />
            <TextField
              id="recovery-contact"
              label="Email or Mobile Number"
              required
              value={recoveryContact}
              onChange={(e) => setRecoveryContact(e.target.value)}
              placeholder="you@example.com or +639171234567"
              autoComplete="off"
            />
            {recoveryNotice && (
              <Alert tone={recoveryNotice.tone} title={recoveryNotice.title}>
                {recoveryNotice.message}
              </Alert>
            )}
            <Button type="submit" variant="secondary" loading={recoverySubmitting} className="w-full justify-center">
              Email Me a New Link
            </Button>
          </form>
        </div>
      </main>
    );
  }

  // Calculate 24-hour notice window for cancellation notice
  const startsAtDate = booking ? new Date(booking.starts_at) : null;
  const hoursUntilAppointment = startsAtDate ? (startsAtDate.getTime() - Date.now()) / (1000 * 60 * 60) : 0;
  const isRefundEligible = hoursUntilAppointment >= 24;

  return (
    <main id="main-content" className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="eyebrow">Patient Self-Service</p>
            <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
              Appointment Management Portal
            </h1>
            {booking && (
              <p className="mt-1 text-sm text-graphite">
                Welcome back, <strong className="text-forest">{booking.first_name}</strong>. Reference:{" "}
                <span className="font-mono font-semibold text-forest">{booking.reference}</span>
              </p>
            )}
          </div>
          {booking && (
            <Button
              variant="secondary"
              onClick={handleSignOut}
              className="text-xs self-start"
            >
              Sign Out
            </Button>
          )}
        </div>

        {error && (
          <Alert tone="danger" title="Notice">
            {error}
          </Alert>
        )}

        {actionNotice && (
          <Alert tone="info" title="Status Update">
            {actionNotice}
          </Alert>
        )}

        {loading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-sand/60" />
        ) : booking ? (
          <div className="space-y-6">
            {/* Booking Details Card */}
            <div className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-6">
              <div className="flex items-center justify-between border-b hairline pb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-graphite">Appointment State</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${
                        booking.status === "confirmed"
                          ? "bg-sage-deep/10 text-sage-deep border border-sage-deep/20"
                          : booking.status === "cancelled"
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : "bg-amber-50 text-amber-900 border border-amber-200"
                      }`}
                    >
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider font-semibold text-graphite">Intake Status</span>
                  <p className="text-xs font-semibold text-forest mt-1 capitalize">
                    {booking.intake_status === "completed" ? "Completed (Encrypted)" : "Pending Completion"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Treatment</span>
                  <p className="font-semibold text-forest mt-0.5">{booking.service}</p>
                </div>
                <div>
                  <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Scheduled Date & Time</span>
                  <p className="font-semibold text-forest mt-0.5">{formatDateTime(booking.starts_at)}</p>
                  <span className="text-xs text-graphite">Asia/Manila (PHT)</span>
                </div>
              </div>

              {/* Action buttons */}
              {booking.status === "confirmed" && !isRescheduling && !isCancelling && (
                <div className="border-t hairline pt-6 flex flex-wrap gap-3">
                  {booking.can_reschedule ? (
                    <Button variant="secondary" onClick={handleOpenReschedule}>
                      <Icon name="calendar" className="size-4" />
                      Reschedule Appointment
                    </Button>
                  ) : (
                    <span className="text-xs text-graphite flex items-center gap-1.5 self-center">
                      <Icon name="shield" className="size-3.5 text-sage" />
                      Reschedule unavailable (already rescheduled once or &lt;24h notice).
                    </span>
                  )}

                  {booking.can_cancel && (
                    <Button
                      variant="danger"
                      onClick={() => {
                        setIsCancelling(true);
                        setIsRescheduling(false);
                      }}
                    >
                      Cancel Appointment
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Reschedule View */}
            {isRescheduling && (
              <div className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-6">
                <div className="flex items-center justify-between border-b hairline pb-4">
                  <h2 className="font-serif text-2xl text-forest">Pick a New Date & Time</h2>
                  <Button variant="ghost" onClick={() => setIsRescheduling(false)}>
                    Close
                  </Button>
                </div>

                <p className="text-xs text-graphite">
                  You may reschedule your appointment once without penalty. Your deposit will be fully transferred to your new slot.
                </p>

                <SlotPicker
                  days={rescheduleDays}
                  selectedSlot={newSelectedSlot}
                  onSelectSlot={(slot) => setNewSelectedSlot(slot)}
                  isLoading={loadingSlots}
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t hairline">
                  <Button variant="secondary" onClick={() => setIsRescheduling(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!newSelectedSlot}
                    loading={rescheduleSubmitting}
                    onClick={handleConfirmReschedule}
                  >
                    Confirm Reschedule
                  </Button>
                </div>
              </div>
            )}

            {/* Cancel Modal / Box */}
            {isCancelling && (
              <div className="rounded-3xl border border-red-200 bg-red-50/50 p-6 sm:p-8 shadow-soft space-y-6">
                <div className="flex items-center justify-between border-b border-red-200 pb-4">
                  <h2 className="font-serif text-2xl text-red-950">Confirm Cancellation</h2>
                  <Button variant="ghost" onClick={() => setIsCancelling(false)}>
                    Dismiss
                  </Button>
                </div>

                <div className="text-xs space-y-2">
                  <p className="font-semibold text-red-950">
                    Cancellation Policy Notice ({Math.round(hoursUntilAppointment)} hours notice):
                  </p>
                  {isRefundEligible ? (
                    <p className="text-red-900">
                      Because you are cancelling with <strong>at least 24 hours notice</strong>, your deposit will be 100% refunded to your payment method automatically.
                    </p>
                  ) : (
                    <p className="text-red-900">
                      Because your appointment is within 24 hours, your deposit will be <strong>forfeited</strong> in accordance with our clinic terms.
                    </p>
                  )}
                </div>

                <TextAreaField
                  id="cancel-reason"
                  label="Cancellation Reason (Optional)"
                  hint="Helps our clinical staff improve patient care."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule conflict, feeling unwell"
                  maxLength={250}
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-red-200">
                  <Button variant="secondary" onClick={() => setIsCancelling(false)}>
                    Keep Appointment
                  </Button>
                  <Button
                    variant="danger"
                    loading={cancelSubmitting}
                    onClick={handleConfirmCancel}
                  >
                    Confirm Cancellation
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="pt-4 text-center">
          <Link href="/" className="text-xs text-graphite hover:text-forest underline">
            Return to AURA Home
          </Link>
        </div>
      </div>
    </main>
  );
}
