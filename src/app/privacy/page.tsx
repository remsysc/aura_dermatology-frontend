import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { config } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Privacy & Clinical Notice — AURA Dermatology",
  description:
    "Information on our compliance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and our medical data encryption standards.",
};

export default function PrivacyPolicyPage() {
  return (
    <main id="main-content" className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div>
          <p className="eyebrow">Regulatory Compliance</p>
          <h1 className="mt-1 font-serif text-3xl font-medium text-forest sm:text-4xl">
            Clinical Data Privacy Notice
          </h1>
          <p className="mt-2 text-sm text-graphite">
            Compliance with the <strong>Philippine Data Privacy Act of 2012 (Republic Act No. 10173)</strong>, NPC Circular 16-01, and DOH Medical Record Guidelines.
          </p>
          <p className="mt-1 text-xs text-graphite">
            Notice Version: <span className="font-mono font-semibold text-forest">{config.bookingConsentVersion}</span> | Effective: November 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-graphite">
          {/* Section 1 */}
          <section className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-3">
            <h2 className="font-serif text-xl font-medium text-forest flex items-center gap-2">
              <Icon name="shield" className="size-5 text-sage" />
              1. Personal Information Controller (PIC)
            </h2>
            <p>
              <strong>{config.clinic.name}</strong> operates as the Personal Information Controller under Republic Act No. 10173. Our clinical practice is committed to protecting the privacy, confidentiality, and integrity of all patient personal information and sensitive personal information collected through our digital booking portal and clinic visits.
            </p>
            <p className="text-xs text-graphite">
              Clinic Address: {config.clinic.address || "Metro Manila, Philippines"} | Contact: {config.clinic.email || "privacy@aura-dermatology.ph"}
            </p>
          </section>

          {/* Section 2 */}
          <section className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-3">
            <h2 className="font-serif text-xl font-medium text-forest flex items-center gap-2">
              <Icon name="sparkles" className="size-5 text-sage" />
              2. Classification of Data Collected
            </h2>
            <p>
              We collect and process the following categories of data:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>Personal Information:</strong> Full legal name, email address, Philippine mobile contact number (`+63`), and booking reservation records.
              </li>
              <li>
                <strong>Sensitive Personal Information (SPI):</strong> Fitzpatrick skin phototyping scale responses, history of dermatological medication use (oral isotretinoin, topical retinoids), contraindications (keloid propensity, allergy declarations, pregnancy/nursing status), and physician diagnostic treatment notes.
              </li>
              <li>
                <strong>Technical Metadata:</strong> Cryptographic idempotency fingerprints, timestamp logs, and pseudonymized IP address hashes used exclusively for rate limiting and bot deterrence via Cloudflare Turnstile.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-3">
            <h2 className="font-serif text-xl font-medium text-forest flex items-center gap-2">
              <Icon name="lock" className="size-5 text-sage" />
              3. Purpose & Legal Basis of Processing
            </h2>
            <p>
              Your data is processed strictly under the following lawful bases:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>Medical Consultation & Patient Safety:</strong> SPI is collected solely to evaluate procedural safety, calculate laser fluences, prevent adverse reactions (such as post-inflammatory hyperpigmentation or burns), and provide clinical medical care.
              </li>
              <li>
                <strong>Contractual Necessity:</strong> Contact details are required to hold appointment slots, dispatch confirmations, provide 24-hour reminders, and process payment intent deposits via PayMongo.
              </li>
              <li>
                <strong>Explicit Informed Consent:</strong> You provide explicit digital consent prior to submitting intake forms and booking requests. We never sell, rent, or trade your personal data to marketing third parties or cosmetic sponsors.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-3">
            <h2 className="font-serif text-xl font-medium text-forest flex items-center gap-2">
              <Icon name="check" className="size-5 text-sage" />
              4. Cryptographic Security Standards
            </h2>
            <p>
              AURA applies medical-grade cryptographic measures across all digital infrastructure:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>AES-256-GCM Encryption at Rest:</strong> Sensitive medical intake answers are encrypted using dedicated clinic-side cryptographic keys before persisting into database tables.
              </li>
              <li>
                <strong>URL Fragment Isolation:</strong> Magic link authentication tokens are delivered exclusively in URL fragments (`#t=...`), preventing server logs and referrer headers from ever capturing patient tokens. Tokens are moved to tab-scoped `sessionStorage` and immediately removed from the address bar.
              </li>
              <li>
                <strong>Restricted Role Access:</strong> Medical answers are decrypted exclusively inside authenticated clinical admin dashboards for the attending Board-Certified Dermatologist and licensed clinic staff.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-3">
            <h2 className="font-serif text-xl font-medium text-forest flex items-center gap-2">
              <Icon name="clock" className="size-5 text-sage" />
              5. Data Retention & Anonymization
            </h2>
            <p>
              In accordance with Philippine medical regulatory practice and Department of Health standards:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>Clinical Patient Records:</strong> Maintained for a minimum of ten (10) years following the last patient consultation.
              </li>
              <li>
                <strong>Uncompleted Booking Holds:</strong> Automatically expired after 15 minutes, and unconfirmed patient records are permanently purged or anonymized after 7 days.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-3">
            <h2 className="font-serif text-xl font-medium text-forest flex items-center gap-2">
              <Icon name="user" className="size-5 text-sage" />
              6. Your Statutory Rights as a Data Subject
            </h2>
            <p>
              Under the Data Privacy Act of 2012, you are entitled to exercise the following rights:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li><strong>Right to be Informed:</strong> To know how and why your personal data is collected and processed.</li>
              <li><strong>Right of Access:</strong> To request a copy of your personal and medical record on file.</li>
              <li><strong>Right to Rectification:</strong> To correct inaccurate or outdated information in your profile.</li>
              <li><strong>Right to Erasure or Blocking:</strong> To request the suspension, withdrawal, or deletion of your personal data, subject to medical record retention statutes.</li>
              <li><strong>Right to Damages:</strong> To be indemnified for any damages sustained due to inaccurate, false, unlawfully obtained, or unauthorized use of personal data.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-3">
            <h2 className="font-serif text-xl font-medium text-forest flex items-center gap-2">
              <Icon name="arrow-right" className="size-5 text-sage" />
              7. Contact Our Data Protection Officer (DPO)
            </h2>
            <p>
              For inquiries, data access requests, or privacy concerns, please contact our designated Data Protection Officer:
            </p>
            <div className="rounded-2xl border hairline bg-sand/30 p-4 text-xs space-y-1">
              <p className="font-semibold text-forest">AURA Dermatology Data Protection Officer</p>
              <p>Email: <span className="font-mono text-forest">dpo@aura-dermatology.ph</span></p>
              <p>National Privacy Commission Inquiries: <span className="font-mono text-forest">complaints@privacy.gov.ph</span></p>
            </div>
          </section>
        </div>

        <div className="pt-4 text-center">
          <Link href="/" className="text-xs text-graphite hover:text-forest underline">
            Return to AURA Home
          </Link>
        </div>
      </div>
    </main>
  );
}
