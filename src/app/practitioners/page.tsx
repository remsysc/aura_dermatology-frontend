import { Suspense } from "react";
import { PractitionerList } from "@/components/catalog/PractitionerList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Specialist Directory — AURA Dermatology & Laser Studio",
  description:
    "Meet our Board-Certified Dermatologists and licensed aesthetic medicine specialists in Metro Manila.",
};

export default function PractitionersPage() {
  return (
    <main id="main-content" className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Medical Faculty</p>
          <h1 className="mt-2 text-balance">
            Board-Certified Clinical Specialists
          </h1>
          <p className="mt-4 text-base text-graphite sm:text-lg">
            At AURA, every medical consultation and procedural laser treatment is directly overseen by dermatologists credentialed by the Philippine Dermatological Society and international aesthetic medicine academies.
          </p>
        </div>

        <div className="mt-12">
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
                <div className="h-24 rounded-3xl bg-sand/60" />
                <div className="h-24 rounded-3xl bg-sand/60" />
              </div>
            }
          >
            <PractitionerList />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
