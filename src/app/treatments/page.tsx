import { Suspense } from "react";
import { listServices } from "@/lib/api/endpoints";
import { TreatmentCatalog } from "@/components/catalog/TreatmentCatalog";
import { ApiUnavailable } from "@/components/catalog/ApiUnavailable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Treatments & Clinical Lasers — AURA Dermatology",
  description:
    "Explore evidence-based dermatology treatments, medical-grade laser therapies, and physician-formulated chemical peels at AURA Metro Manila.",
};

async function TreatmentCatalogWrapper() {
  let services = null;
  let fetchError: unknown = null;

  try {
    services = await listServices();
  } catch (error) {
    fetchError = error;
  }

  if (fetchError || services === null) {
    return <ApiUnavailable error={fetchError} what="treatments" />;
  }

  return <TreatmentCatalog services={services} />;
}

export default function TreatmentsPage() {
  return (
    <main id="main-content" className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Doctor-Led Menu</p>
          <h1 className="mt-2 text-balance">
            Precision Clinical Treatments
          </h1>
          <p className="mt-4 text-base text-graphite sm:text-lg">
            Every procedure at AURA is performed or directly supervised by Board-Certified Dermatologists using FDA-cleared laser systems. Upfront pricing, explicit recovery expectations, and zero hidden fees.
          </p>
        </div>

        <div className="mt-12">
          <Suspense
            fallback={
              <div className="grid gap-5 sm:grid-cols-2 animate-pulse">
                <div className="h-64 rounded-3xl bg-sand/60" />
                <div className="h-64 rounded-3xl bg-sand/60" />
              </div>
            }
          >
            <TreatmentCatalogWrapper />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
