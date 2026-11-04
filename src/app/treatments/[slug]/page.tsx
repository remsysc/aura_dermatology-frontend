import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listServices } from "@/lib/api/endpoints";
import { formatDuration, formatPrice, describeDeposit } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import type { Metadata } from "next";

interface TreatmentDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TreatmentDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const services = await listServices();
    const service = services.find((s) => s.slug === slug);
    if (!service) return { title: "Treatment Not Found — AURA" };
    return {
      title: `${service.name} — AURA Aesthetic Dermatology`,
      description: `Schedule ${service.name} at AURA Aesthetic Dermatology & Laser Studio. ${describeDeposit(service.deposit)}.`,
    };
  } catch {
    return { title: "Clinical Treatment — AURA" };
  }
}

async function TreatmentDetailContent({ params }: TreatmentDetailPageProps) {
  const { slug } = await params;

  let service;
  try {
    const services = await listServices();
    service = services.find((s) => s.slug === slug);
  } catch {
    // API offline
  }

  if (!service) {
    notFound();
  }

  const isDoctorRole = service.required_role === "doctor";

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-xs text-graphite">
          <li>
            <Link href="/" className="hover:text-forest transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/treatments" className="hover:text-forest transition-colors">
              Treatments
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-forest truncate max-w-xs" aria-current="page">
            {service.name}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  isDoctorRole
                    ? "bg-sage-deep/10 text-sage-deep border border-sage-deep/20"
                    : "bg-paper text-graphite border hairline"
                }`}
              >
                <Icon name="check" className="size-3.5" />
                {isDoctorRole ? "Doctor-Administered Only" : "Clinic Technician"}
              </span>
              {service.requires_machine && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-sand/60 text-forest border hairline">
                  <Icon name="sparkles" className="size-3.5 text-sage" />
                  FDA-Cleared Laser Suite
                </span>
              )}
            </div>

            <h1 className="text-balance">{service.name}</h1>

            <p className="mt-4 text-base leading-relaxed text-graphite sm:text-lg">
              Precision aesthetic care administered by board-certified practitioners. Every appointment includes a focused clinical review, personalized parameter calibration, and physician-prescribed post-care.
            </p>
          </div>

          {/* Clinical Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-3xl border hairline bg-sand/40 p-6 sm:grid-cols-3">
            <div>
              <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Duration</span>
              <p className="mt-1 font-display text-2xl text-forest">
                {formatDuration(service.duration_min)}
              </p>
              <span className="text-[11px] text-graphite">Clinical runtime</span>
            </div>
            <div>
              <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Specialist</span>
              <p className="mt-1 font-display text-2xl text-forest capitalize">
                {service.required_role}
              </p>
              <span className="text-[11px] text-graphite">Board-certified/licensed</span>
            </div>
            <div>
              <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Deposit Policy</span>
              <p className="mt-1 font-display text-2xl text-forest capitalize">
                {service.deposit.policy === "none" ? "None" : service.deposit.policy}
              </p>
              <span className="text-[11px] text-graphite">Refundable ≥24h notice</span>
            </div>
          </div>

          {/* Clinical Guidance Sections */}
          <div className="space-y-6">
            <div className="rounded-3xl border hairline bg-paper p-6 shadow-soft">
              <h2 className="flex items-center gap-2 font-display text-2xl text-forest">
                <Icon name="sparkles" className="size-5 text-sage" />
                Pre-Treatment Clinical Guidance
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-graphite">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage mt-2 shrink-0" />
                  <span>Discontinue topical retinoids, tretinoin, and exfoliating acids (AHA/BHA) at least 5 days prior to your appointment.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage mt-2 shrink-0" />
                  <span>Avoid direct sun exposure and tanning for at least 7 days before laser procedures.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage mt-2 shrink-0" />
                  <span>Notify our dermatologists if you have taken oral isotretinoin (Accutane) within the past 6 months.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border hairline bg-paper p-6 shadow-soft">
              <h2 className="flex items-center gap-2 font-display text-2xl text-forest">
                <Icon name="shield" className="size-5 text-sage" />
                Post-Care & Recovery Expectations
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-graphite">
                Mild transient erythema (redness) is normal following active clinical energy or laser treatments and typically resolves within 2 to 24 hours. A customized post-laser epidermal barrier restorative protocol and broad-spectrum physical SPF 50+ will be applied immediately post-treatment.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Booking Card Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border hairline bg-paper p-6 shadow-soft">
            <span className="eyebrow">Transparent Fee</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl text-forest">
                {formatPrice(service)}
              </span>
              <span className="text-xs text-graphite">VAT inclusive</span>
            </div>

            <div className="mt-4 border-t hairline pt-4 space-y-2 text-xs text-graphite">
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-medium text-forest">{formatDuration(service.duration_min)}</span>
              </div>
              <div className="flex justify-between">
                <span>Deposit Required</span>
                <span className="font-medium text-forest">
                  {describeDeposit(service.deposit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cancellation Window</span>
                <span className="font-medium text-forest">≥ 24 Hours</span>
              </div>
              {service.intake_enabled && (
                <div className="flex justify-between">
                  <span>Medical Intake</span>
                  <span className="font-medium text-forest">Confidential Online Form</span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <ButtonLink
                href={`/book?service=${encodeURIComponent(service.slug)}`}
                className="w-full justify-center"
              >
                Book This Treatment
                <Icon name="arrow-right" className="size-4" />
              </ButtonLink>
            </div>

            <p className="mt-4 text-center text-[11px] text-graphite">
              Encrypted via Philippine DPA 2012 medical standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TreatmentDetailPage(props: TreatmentDetailPageProps) {
  return (
    <main id="main-content" className="py-12 sm:py-16">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-20 text-center">
            <p className="text-sm text-graphite">Loading treatment details...</p>
          </div>
        }
      >
        <TreatmentDetailContent params={props.params} />
      </Suspense>
    </main>
  );
}
