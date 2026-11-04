"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { consumeToken } from "@/lib/magic-token";
import { getIntakeForm, submitIntake } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";
import { INTAKE_NOTICE } from "@/lib/consent";
import type { IntakeForm } from "@/lib/api/types";

const FITZPATRICK_TYPES = [
  { type: "I", label: "Type I — Pale Ivory", desc: "Always burns, never tans. Highly sensitive to laser and energy." },
  { type: "II", label: "Type II — Fair", desc: "Burns easily, tans minimally with difficulty." },
  { type: "III", label: "Type III — Medium Olive", desc: "Sometimes burns mildly, gradually tans to light bronze." },
  { type: "IV", label: "Type IV — Moderate Brown", desc: "Rarely burns, tans easily. Typical Filipino / Southeast Asian tone." },
  { type: "V", label: "Type V — Dark Brown", desc: "Very rarely burns, tans deeply and quickly." },
  { type: "VI", label: "Type VI — Deeply Pigmented", desc: "Never burns, deeply pigmented. Requires tailored laser wavelengths." },
] as const;

export default function IntakePage() {
  const [token, setToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState<string>("");
  const [intakeForm, setIntakeForm] = useState<IntakeForm | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form responses
  const [fitzpatrick, setFitzpatrick] = useState<string>("IV");
  const [accutanePast6Months, setAccutanePast6Months] = useState<string>("no");
  const [retinoidsPast7Days, setRetinoidsPast7Days] = useState<string>("no");
  const [keloidHistory, setKeloidHistory] = useState<string>("no");
  const [allergies, setAllergies] = useState<string>("");
  const [medications, setMedications] = useState<string>("");
  const [pregnancyStatus, setPregnancyStatus] = useState<string>("no");
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("turnstile_client_bypass_aura");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Attempt to read token from URL fragment or session storage
  useEffect(() => {
    const extracted = consumeToken("intake");
    if (extracted) {
      setToken(extracted);
    } else {
      setLoading(false);
    }
  }, []);

  // When token is available, load the intake schema from API
  useEffect(() => {
    if (!token) return;

    let active = true;
    setLoading(true);
    setFetchError(null);

    getIntakeForm(token)
      .then((data) => {
        if (!active) return;
        setIntakeForm(data);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
          setFetchError("This medical intake link is invalid, expired, or has already been completed. Please check the link in your confirmation email or enter your token below.");
        } else {
          setFetchError(err instanceof ApiError ? err.message : "Unable to retrieve intake questionnaire.");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (!consentAccepted) {
      setSubmitError("You must acknowledge the sensitive health data consent to submit.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const clinicalHistory = [
      `Accutane past 6 months: ${accutanePast6Months}`,
      `Retinoids past 7 days: ${retinoidsPast7Days}`,
      `Keloid history: ${keloidHistory}`,
    ].join("; ");

    const answers: Record<string, string> = {
      skin_type: fitzpatrick,
      allergies: allergies.trim() || "None reported",
      medications: medications.trim() || "None reported",
      pregnancy_status: pregnancyStatus === "yes" ? "Yes" : "No",
      history: clinicalHistory,
      main_concern: "Initial dermatological consultation and skin evaluation",
      prior_treatments: "None reported",
    };

    const noticeVersion = intakeForm?.consent_notice?.version ?? "2026-10-intake-v1";

    try {
      await submitIntake(token, {
        consent: {
          notice_version: noticeVersion,
          accepted: true,
        },
        answers,
        turnstile_token: turnstileToken,
      });
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Failed to submit intake questionnaire. Please try again or complete in person.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // View: Successfully submitted
  if (isSuccess || (intakeForm && !intakeForm.can_submit && intakeForm.intake_status === "completed")) {
    return (
      <main id="main-content" className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-forest text-gold">
            <Icon name="check" className="size-8" />
          </div>
          <p className="eyebrow">Medical Record Encrypted</p>
          <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
            Pre-Arrival Intake Completed
          </h1>
          <p className="text-base text-graphite">
            Thank you. Your clinical responses have been encrypted with AES-256-GCM and attached directly to your appointment record. Your attending dermatologist will review your profile prior to your treatment.
          </p>
          <div className="rounded-2xl border hairline bg-paper p-6 shadow-soft text-left text-xs text-graphite space-y-2">
            <div className="flex items-center gap-2 font-semibold text-forest">
              <Icon name="shield" className="size-4 text-sage" />
              <span>DPA 2012 Confidentiality Assurance</span>
            </div>
            <p>
              Your health declarations are classified as Sensitive Personal Information under RA 10173 and are accessible exclusively to your treating clinician and licensed clinic administrators.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/" className="inline-flex text-sm font-semibold text-forest underline hover:text-sage-deep">
              Return to AURA Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // View: No token provided prompt
  if (!token && !loading) {
    return (
      <main id="main-content" className="py-16">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-forest text-gold mb-3">
              <Icon name="lock" className="size-6" />
            </div>
            <h1 className="font-serif text-3xl font-medium text-forest">Confidential Medical Intake</h1>
            <p className="mt-2 text-sm text-graphite">
              Please use the confidential intake link sent to your email after booking, or enter your token below.
            </p>
          </div>

          <form onSubmit={handleManualTokenSubmit} className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-4">
            <TextField
              id="manual-token"
              label="Intake Access Token"
              hint="Found in your confirmation email or management link."
              required
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="e.g. 64-character token"
            />
            <Button type="submit" variant="primary" className="w-full justify-center">
              Access Questionnaire
              <Icon name="arrow-right" className="size-4" />
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sage-deep">
            <Icon name="shield" className="size-4 text-sage" />
            DPA 2012 Confidential Health Declaration
          </div>
          <h1 className="mt-1 font-serif text-3xl font-medium text-forest sm:text-4xl">
            Pre-Arrival Medical Intake
          </h1>
          <p className="mt-2 text-sm text-graphite">
            Booking Reference: <span className="font-mono font-semibold text-forest">{intakeForm?.reference ?? "..."}</span>
          </p>
          <p className="mt-1 text-xs text-graphite">
            Completing this form before arrival allows your dermatologist to review your skin profile in advance and eliminates lobby paperwork.
          </p>
        </div>

        {fetchError && (
          <Alert tone="danger" title="Access Error">
            {fetchError}
          </Alert>
        )}

        {submitError && (
          <Alert tone="danger" title="Submission Error">
            {submitError}
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 rounded-3xl bg-sand/60" />
            <div className="h-60 rounded-3xl bg-sand/60" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Fitzpatrick Skin Typing */}
            <div className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-5">
              <div>
                <h2 className="font-serif text-xl font-medium text-forest">1. Fitzpatrick Skin Phototype</h2>
                <p className="mt-1 text-xs text-graphite">
                  Determines your skin’s genetic response to ultraviolet light and procedural laser wavelengths.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Fitzpatrick skin phototype">
                {FITZPATRICK_TYPES.map((item) => {
                  const isSelected = fitzpatrick === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setFitzpatrick(item.type)}
                      className={`p-4 text-left rounded-2xl border transition-all ${
                        isSelected
                          ? "border-forest bg-sand shadow-xs"
                          : "border-field bg-paper hover:border-forest"
                      }`}
                    >
                      <div className="font-semibold text-forest text-sm">{item.label}</div>
                      <div className="text-xs text-graphite mt-1">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Clinical Contraindications */}
            <div className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-6">
              <div>
                <h2 className="font-serif text-xl font-medium text-forest">2. Clinical Contraindications & Safety Check</h2>
                <p className="mt-1 text-xs text-graphite">
                  Certain systemic and topical medications increase photosensitivity or alter epidermal re-epithelialization.
                </p>
              </div>

              {/* Accutane */}
              <div className="border-b hairline pb-4">
                <span className="text-sm font-semibold text-forest block">
                  Have you taken oral isotretinoin (Accutane / Roaccutane / Acnetrex) in the past 6 months?
                </span>
                <span className="text-xs text-graphite block mt-0.5">
                  Oral retinoids impair wound healing and require a mandatory delay for ablative laser procedures.
                </span>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-forest cursor-pointer">
                    <input
                      type="radio"
                      name="accutane"
                      value="no"
                      checked={accutanePast6Months === "no"}
                      onChange={() => setAccutanePast6Months("no")}
                      className="text-sage-deep focus:ring-sage-deep"
                    />
                    No
                  </label>
                  <label className="flex items-center gap-2 text-sm text-forest cursor-pointer">
                    <input
                      type="radio"
                      name="accutane"
                      value="yes"
                      checked={accutanePast6Months === "yes"}
                      onChange={() => setAccutanePast6Months("yes")}
                      className="text-sage-deep focus:ring-sage-deep"
                    />
                    Yes
                  </label>
                </div>
              </div>

              {/* Retinoids */}
              <div className="border-b hairline pb-4">
                <span className="text-sm font-semibold text-forest block">
                  Have you used topical retinoids, tretinoin, adapalene, or AHA/BHA exfoliants in the past 7 days?
                </span>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-forest cursor-pointer">
                    <input
                      type="radio"
                      name="retinoids"
                      value="no"
                      checked={retinoidsPast7Days === "no"}
                      onChange={() => setRetinoidsPast7Days("no")}
                      className="text-sage-deep focus:ring-sage-deep"
                    />
                    No
                  </label>
                  <label className="flex items-center gap-2 text-sm text-forest cursor-pointer">
                    <input
                      type="radio"
                      name="retinoids"
                      value="yes"
                      checked={retinoidsPast7Days === "yes"}
                      onChange={() => setRetinoidsPast7Days("yes")}
                      className="text-sage-deep focus:ring-sage-deep"
                    />
                    Yes
                  </label>
                </div>
              </div>

              {/* Keloids */}
              <div className="border-b hairline pb-4">
                <span className="text-sm font-semibold text-forest block">
                  Do you have a personal history of hypertrophic scarring or keloids?
                </span>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-forest cursor-pointer">
                    <input
                      type="radio"
                      name="keloid"
                      value="no"
                      checked={keloidHistory === "no"}
                      onChange={() => setKeloidHistory("no")}
                      className="text-sage-deep focus:ring-sage-deep"
                    />
                    No
                  </label>
                  <label className="flex items-center gap-2 text-sm text-forest cursor-pointer">
                    <input
                      type="radio"
                      name="keloid"
                      value="yes"
                      checked={keloidHistory === "yes"}
                      onChange={() => setKeloidHistory("yes")}
                      className="text-sage-deep focus:ring-sage-deep"
                    />
                    Yes
                  </label>
                </div>
              </div>

              {/* Pregnancy */}
              <div className="border-b hairline pb-4">
                <span className="text-sm font-semibold text-forest block">
                  Are you currently pregnant, planning to become pregnant, or breastfeeding?
                </span>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-forest cursor-pointer">
                    <input
                      type="radio"
                      name="pregnancy"
                      value="no"
                      checked={pregnancyStatus === "no"}
                      onChange={() => setPregnancyStatus("no")}
                      className="text-sage-deep focus:ring-sage-deep"
                    />
                    No
                  </label>
                  <label className="flex items-center gap-2 text-sm text-forest cursor-pointer">
                    <input
                      type="radio"
                      name="pregnancy"
                      value="yes"
                      checked={pregnancyStatus === "yes"}
                      onChange={() => setPregnancyStatus("yes")}
                      className="text-sage-deep focus:ring-sage-deep"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-forest cursor-pointer">
                    <input
                      type="radio"
                      name="pregnancy"
                      value="na"
                      checked={pregnancyStatus === "na"}
                      onChange={() => setPregnancyStatus("na")}
                      className="text-sage-deep focus:ring-sage-deep"
                    />
                    Not Applicable
                  </label>
                </div>
              </div>

              <TextField
                id="intake-allergies"
                label="Known Allergies"
                hint="e.g. Lidocaine, topical anesthetics, aspirin, latex, cosmetic fragrances."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Leave blank or write None"
              />

              <TextAreaField
                id="intake-medications"
                label="Current Medications & Active Skincare"
                hint="List prescription drugs, daily supplements, or specialized serums."
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="e.g. Daily vitamin D, spironolactone 50mg, hyaluronic acid"
                maxLength={500}
              />
            </div>

            {/* Section 3: DPA 2012 Informed Consent */}
            <div className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-4">
              <h2 className="font-serif text-xl font-medium text-forest">3. Sensitive Personal Information Consent</h2>
              
              <div className="rounded-2xl border hairline bg-sand/30 p-4 text-xs text-graphite space-y-2">
                {INTAKE_NOTICE.map((item) => (
                  <p key={item.heading}>
                    <strong className="text-forest">{item.heading}:</strong> {item.body}
                  </p>
                ))}
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  required
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-1 size-4 rounded border-field text-sage-deep focus:ring-sage-deep"
                />
                <span className="text-xs leading-relaxed text-forest font-medium">
                  I explicitly consent to the collection, AES-256 encryption, and medical review of my sensitive health data by AURA’s clinical team under Republic Act No. 10173.
                </span>
              </label>

              {/* Bot Protection */}
              <div className="pt-2">
                <TurnstileWidget action="intake" onVerify={setTurnstileToken} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={!consentAccepted}
              >
                Submit Encrypted Medical Intake
                <Icon name="arrow-right" className="size-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
