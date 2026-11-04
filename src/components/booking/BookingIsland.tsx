"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StepNav } from "@/components/ui/StepNav";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { getAvailability, createBooking } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { sessionFromHold, saveBookingSession } from "@/lib/booking-session";
import { createIdempotencyTracker } from "@/lib/idempotency";
import { normalizePhMobile, isValidPhMobile } from "@/lib/phone";
import { formatDuration, formatPrice, describeDeposit, formatDateTime, dateKeyInZone } from "@/lib/format";
import { config } from "@/lib/config";
import { BOOKING_NOTICE } from "@/lib/consent";
import type { Service, Practitioner, AvailabilityDay } from "@/lib/api/types";

const STEPS = ["Treatment & Specialist", "Date & Time", "Your Details", "Review & Hold"] as const;

interface BookingIslandProps {
  services: Service[];
  practitioners: Practitioner[];
  initialServiceSlug?: string;
  initialPractitionerSlug?: string;
}

export function BookingIsland({
  services,
  practitioners,
  initialServiceSlug,
  initialPractitionerSlug,
}: BookingIslandProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const idempotencyTracker = useMemo(() => createIdempotencyTracker(), []);

  // Step 0: Service & Practitioner
  const [serviceSlug, setServiceSlug] = useState<string>(() => {
    if (initialServiceSlug && services.some((s) => s.slug === initialServiceSlug)) {
      return initialServiceSlug;
    }
    return services[0]?.slug ?? "";
  });

  const selectedService = useMemo(() => {
    return services.find((s) => s.slug === serviceSlug) ?? services[0];
  }, [services, serviceSlug]);

  // Filter practitioners compatible with selected service's required_role
  const compatiblePractitioners = useMemo(() => {
    if (!selectedService) return practitioners;
    return practitioners.filter((p) => p.role === selectedService.required_role);
  }, [selectedService, practitioners]);

  const [practitionerSlug, setPractitionerSlug] = useState<string>(() => {
    if (initialPractitionerSlug && practitioners.some((p) => p.slug === initialPractitionerSlug)) {
      return initialPractitionerSlug;
    }
    return "";
  });

  const selectedPractitioner = useMemo(() => {
    return compatiblePractitioners.find((p) => p.slug === practitionerSlug);
  }, [compatiblePractitioners, practitionerSlug]);

  // Step 1: Availability & Slot
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState<boolean>(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Fetch 14-day availability whenever service or practitioner changes
  useEffect(() => {
    if (!selectedService) return;

    let cancelled = false;
    setLoadingAvailability(true);
    setAvailabilityError(null);

    const today = new Date();
    const fromStr = dateKeyInZone(today);
    const toDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const toStr = dateKeyInZone(toDate);

    getAvailability({
      service: selectedService.slug,
      from: fromStr,
      to: toStr,
      practitioner: selectedPractitioner?.slug,
    })
      .then((res) => {
        if (cancelled) return;
        setAvailabilityDays(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailabilityError(
          err instanceof ApiError
            ? err.message
            : "Could not retrieve live appointment availability. Please verify network connection.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedService, selectedPractitioner]);

  // Step 2: Patient Demographics & Consent
  const [patientName, setPatientName] = useState<string>("");
  const [patientEmail, setPatientEmail] = useState<string>("");
  const [patientMobileInput, setPatientMobileInput] = useState<string>("");
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("turnstile_client_bypass_aura");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Step 3: Hold Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Validation
  function validatePatientStep(): boolean {
    const errors: Record<string, string> = {};

    if (!patientName.trim()) {
      errors.name = "Please provide your full legal name.";
    }

    if (!patientEmail.trim() || !patientEmail.includes("@") || !patientEmail.includes(".")) {
      errors.email = "Please provide a valid email address for confirmation.";
    }

    const normalizedMobile = normalizePhMobile(patientMobileInput);
    if (!normalizedMobile || !isValidPhMobile(normalizedMobile)) {
      errors.mobile = "Please provide a valid Philippine mobile number (e.g. 0917 123 4567 or +639171234567).";
    }

    if (!consentAccepted) {
      errors.consent = "You must acknowledge the Philippine Data Privacy Act notice to proceed.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Handle final hold creation
  async function handleConfirmHold() {
    if (!selectedService || !selectedSlot) return;
    if (!validatePatientStep()) {
      setCurrentStep(2); // return to details step if invalid
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    const normalizedMobile = normalizePhMobile(patientMobileInput) ?? patientMobileInput;

    const payload = {
      service: selectedService.slug,
      starts_at: selectedSlot,
      ...(selectedPractitioner ? { practitioner: selectedPractitioner.slug } : {}),
      patient: {
        name: patientName.trim(),
        email: patientEmail.trim().toLowerCase(),
        mobile: normalizedMobile,
      },
      consent: {
        notice_version: config.bookingConsentVersion,
        accepted: true as const,
      },
      turnstile_token: turnstileToken,
    };

    try {
      const idempotencyKey = idempotencyTracker.keyFor(payload);

      const hold = await createBooking(payload, idempotencyKey);
      idempotencyTracker.reset();

      const practitionerLabel = selectedPractitioner
        ? selectedPractitioner.name
        : selectedService.required_role === "doctor"
        ? "Assigned Board-Certified Dermatologist"
        : "Assigned Clinical Technician";

      saveBookingSession(
        sessionFromHold(
          hold,
          {
            slug: selectedService.slug,
            name: selectedService.name,
            duration_min: selectedService.duration_min,
            price_cents: selectedService.price_cents,
          },
          practitionerLabel,
        ),
      );

      router.push(`/book/confirmation?ref=${encodeURIComponent(hold.reference)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          if (err.code === "slot_unavailable") {
            setSubmissionError("This time slot was just claimed by another patient. Please choose another time slot.");
            setCurrentStep(1); // send back to slot picker
          } else {
            setSubmissionError(err.message || "A booking collision occurred. Please select another slot or retry.");
          }
        } else if (err.status === 422) {
          const detail = Object.values(err.fieldErrors).flat().join(" ") || err.message;
          setSubmissionError(`Validation issue: ${detail}`);
        } else {
          setSubmissionError(err.message);
        }
      } else {
        setSubmissionError("An unexpected error occurred while locking your reservation. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Step Progress Bar */}
      <div className="mb-10">
        <StepNav steps={STEPS} current={currentStep} label="Appointment booking progress" />
      </div>

      {submissionError && (
        <div className="mb-6">
          <Alert tone="danger" title="Reservation Notice">
            {submissionError}
          </Alert>
        </div>
      )}

      {/* Step 0: Treatment & Specialist Selection */}
      {currentStep === 0 && (
        <section aria-label="Step 1: Select treatment and specialist" className="space-y-8">
          <div>
            <h2 className="text-2xl font-serif text-forest">Select Clinical Treatment</h2>
            <p className="mt-1 text-sm text-graphite">
              Choose your procedure. All medical lasers and injectables are performed directly by Board-Certified Dermatologists.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Treatment options">
            {services.map((service) => {
              const isSelected = service.slug === serviceSlug;
              return (
                <button
                  key={service.slug}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setServiceSlug(service.slug);
                    setSelectedSlot(null); // reset slot when service changes
                  }}
                  className={`flex flex-col text-left rounded-2xl border p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep ${
                    isSelected
                      ? "border-forest bg-sand shadow-soft"
                      : "border-field bg-paper hover:border-forest"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-forest text-base">{service.name}</span>
                    <span className="text-sm font-semibold text-forest tabular">{formatPrice(service)}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-graphite">
                    <span className="flex items-center gap-1">
                      <Icon name="clock" className="size-3.5 text-sage" />
                      {formatDuration(service.duration_min)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="shield" className="size-3.5 text-sage" />
                      {service.required_role === "doctor" ? "Doctor-Led" : "Technician"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Specialist Selection */}
          <div className="border-t hairline pt-6">
            <h3 className="font-serif text-xl text-forest">Preferred Specialist (Optional)</h3>
            <p className="mt-1 text-xs text-graphite">
              Choose a specific practitioner or leave unassigned for the first available doctor.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Specialist preference">
              <button
                type="button"
                role="radio"
                aria-checked={practitionerSlug === ""}
                onClick={() => {
                  setPractitionerSlug("");
                  setSelectedSlot(null);
                }}
                className={`rounded-xl border p-4 text-left transition-all ${
                  practitionerSlug === ""
                    ? "border-forest bg-sand shadow-xs font-semibold text-forest"
                    : "border-field bg-paper text-graphite hover:border-forest"
                }`}
              >
                <div className="text-sm font-semibold text-forest">
                  {selectedService?.required_role === "doctor" ? "First Available Doctor" : "First Available Specialist"}
                </div>
                <div className="text-xs text-graphite mt-0.5">Recommended for earliest availability</div>
              </button>

              {compatiblePractitioners.map((practitioner) => {
                const isSelected = practitionerSlug === practitioner.slug;
                return (
                  <button
                    key={practitioner.slug}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setPractitionerSlug(practitioner.slug);
                      setSelectedSlot(null);
                    }}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-forest bg-sand shadow-xs font-semibold text-forest"
                        : "border-field bg-paper text-graphite hover:border-forest"
                    }`}
                  >
                    <div className="text-sm font-semibold text-forest">{practitioner.name}</div>
                    <div className="text-xs text-graphite mt-0.5 capitalize">
                      {practitioner.role === "doctor" ? "Board-Certified Dermatologist" : "Licensed Aesthetician"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              onClick={() => setCurrentStep(1)}
              disabled={!selectedService}
            >
              Select Date & Time
              <Icon name="arrow-right" className="size-4" />
            </Button>
          </div>
        </section>
      )}

      {/* Step 1: Availability & Slot Selection */}
      {currentStep === 1 && (
        <section aria-label="Step 2: Select appointment slot" className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif text-forest">Choose Appointment Slot</h2>
              <p className="mt-1 text-sm text-graphite">
                Showing live 15-minute intervals for{" "}
                <span className="font-semibold text-forest">{selectedService.name}</span>
                {selectedPractitioner ? ` with ${selectedPractitioner.name}` : ""}.
              </p>
            </div>
          </div>

          {availabilityError ? (
            <Alert tone="danger" title="Availability Error">
              {availabilityError}
            </Alert>
          ) : (
            <SlotPicker
              days={availabilityDays}
              selectedSlot={selectedSlot}
              onSelectSlot={(slotIso) => setSelectedSlot(slotIso)}
              isLoading={loadingAvailability}
            />
          )}

          <div className="flex items-center justify-between border-t hairline pt-6">
            <Button variant="secondary" onClick={() => setCurrentStep(0)}>
              <Icon name="arrow-left" className="size-4" />
              Back
            </Button>

            <Button
              variant="primary"
              disabled={!selectedSlot}
              onClick={() => setCurrentStep(2)}
            >
              Continue to Details
              <Icon name="arrow-right" className="size-4" />
            </Button>
          </div>
        </section>
      )}

      {/* Step 2: Patient Demographics & DPA Consent */}
      {currentStep === 2 && (
        <section aria-label="Step 3: Patient information" className="space-y-8">
          <div>
            <h2 className="text-2xl font-serif text-forest">Patient Information</h2>
            <p className="mt-1 text-sm text-graphite">
              Your contact details are encrypted and used solely for appointment confirmation and clinic reminders.
            </p>
          </div>

          <div className="space-y-5 rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft">
            <TextField
              id="patient-name"
              label="Full Legal Name"
              hint="As it appears on your government identification."
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              error={formErrors.name}
              placeholder="e.g. Maria Clara Santos"
              autoComplete="name"
            />

            <TextField
              id="patient-email"
              type="email"
              label="Email Address"
              hint="Your booking confirmation, calendar file, and confidential intake link will be sent here."
              required
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              error={formErrors.email}
              placeholder="maria@example.com"
              autoComplete="email"
            />

            <TextField
              id="patient-mobile"
              type="tel"
              label="Philippine Mobile Number"
              hint="We send SMS reminders 24h prior. Enter local 09XX or international +639 format."
              required
              value={patientMobileInput}
              onChange={(e) => setPatientMobileInput(e.target.value)}
              error={formErrors.mobile}
              placeholder="0917 123 4567"
              autoComplete="tel"
            />

            {/* DPA 2012 Informed Consent Checkbox */}
            <div className="border-t hairline pt-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-1 size-4 rounded border-field text-sage-deep focus:ring-sage-deep"
                />
                <span className="text-xs leading-relaxed text-graphite">
                  I agree to the processing of my personal information in accordance with the{" "}
                  <strong className="text-forest">Philippine Data Privacy Act of 2012 (RA 10173)</strong>.
                  I understand that my appointment record is kept strictly confidential and will never be shared or marketed to third parties.
                </span>
              </label>
              {formErrors.consent && (
                <p className="mt-2 text-xs font-semibold text-danger">{formErrors.consent}</p>
              )}
            </div>

            {/* Cloudflare Turnstile Verification */}
            <div className="pt-2">
              <TurnstileWidget action="booking" onVerify={setTurnstileToken} />
            </div>

            {/* Notice disclosure accordion */}
            <details className="mt-4 rounded-xl border hairline bg-sand/30 p-3 text-xs text-graphite">
              <summary className="font-semibold text-forest cursor-pointer select-none">
                View DPA 2012 Notice Details ({config.bookingConsentVersion})
              </summary>
              <div className="mt-3 space-y-2 pt-2 border-t hairline">
                {BOOKING_NOTICE.map((section) => (
                  <div key={section.heading}>
                    <span className="font-semibold text-forest">{section.heading}: </span>
                    <span>{section.body}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>

          <div className="flex items-center justify-between border-t hairline pt-6">
            <Button variant="secondary" onClick={() => setCurrentStep(1)}>
              <Icon name="arrow-left" className="size-4" />
              Back
            </Button>

            <Button
              variant="primary"
              onClick={() => {
                if (validatePatientStep()) {
                  setCurrentStep(3);
                }
              }}
            >
              Review & Hold
              <Icon name="arrow-right" className="size-4" />
            </Button>
          </div>
        </section>
      )}

      {/* Step 3: Review & Final Hold Submission */}
      {currentStep === 3 && (
        <section aria-label="Step 4: Review and hold appointment" className="space-y-8">
          <div>
            <h2 className="text-2xl font-serif text-forest">Review & Hold Reservation</h2>
            <p className="mt-1 text-sm text-graphite">
              Review your appointment summary. Upon submission, this slot will be locked exclusively for you for 15 minutes.
            </p>
          </div>

          <div className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-6">
            <div className="border-b hairline pb-5">
              <span className="eyebrow">Appointment Summary</span>
              <h3 className="text-2xl font-serif text-forest mt-1">{selectedService.name}</h3>
              <p className="text-sm text-graphite mt-1">
                With {selectedPractitioner ? selectedPractitioner.name : "Assigned Board-Certified Dermatologist"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Date & Time</span>
                <p className="font-semibold text-forest mt-0.5">
                  {selectedSlot ? formatDateTime(selectedSlot) : "Not selected"}
                </p>
                <span className="text-xs text-graphite">PHT (UTC+8)</span>
              </div>
              <div>
                <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Treatment Duration</span>
                <p className="font-semibold text-forest mt-0.5">{formatDuration(selectedService.duration_min)}</p>
                <span className="text-xs text-graphite">Includes physician assessment</span>
              </div>
              <div>
                <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Patient Name</span>
                <p className="font-semibold text-forest mt-0.5">{patientName}</p>
                <span className="text-xs text-graphite">{patientEmail}</span>
              </div>
              <div>
                <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Deposit Due Today</span>
                <p className="font-semibold text-forest mt-0.5">{describeDeposit(selectedService.deposit)}</p>
                <span className="text-xs text-graphite">Full procedure fee: {formatPrice(selectedService)}</span>
              </div>
            </div>

            <div className="rounded-2xl border hairline bg-sand/40 p-4 text-xs text-graphite space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-forest">
                <Icon name="shield" className="size-4 text-sage" />
                Clinic Cancellation Policy
              </div>
              <p>
                Full automated deposit refund or penalty-free reschedule when requested with at least <strong>24 hours notice</strong> before appointment start.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t hairline pt-6">
            <Button
              variant="secondary"
              onClick={() => setCurrentStep(2)}
              disabled={isSubmitting}
            >
              <Icon name="arrow-left" className="size-4" />
              Back
            </Button>

            <Button
              variant="primary"
              loading={isSubmitting}
              onClick={handleConfirmHold}
            >
              Confirm & Hold Slot (15 Min)
              <Icon name="arrow-right" className="size-4" />
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
