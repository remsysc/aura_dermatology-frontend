import { Suspense } from "react";
import { listServices, listPractitioners } from "@/lib/api/endpoints";
import { BookingIsland } from "@/components/booking/BookingIsland";
import { ApiUnavailable } from "@/components/catalog/ApiUnavailable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book an Appointment — AURA Dermatology",
  description: "Schedule your clinical dermatology assessment or laser treatment in Metro Manila.",
};

async function BookContent({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; practitioner?: string }>;
}) {
  const { service, practitioner } = await searchParams;

  let services = null;
  let practitioners = null;
  let fetchError: unknown = null;

  try {
    [services, practitioners] = await Promise.all([
      listServices(),
      listPractitioners(),
    ]);
  } catch (error) {
    fetchError = error;
  }

  if (fetchError || !services || !practitioners) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ApiUnavailable error={fetchError} what="the booking system" />
      </div>
    );
  }

  return (
    <BookingIsland
      services={services}
      practitioners={practitioners}
      initialServiceSlug={service}
      initialPractitionerSlug={practitioner}
    />
  );
}

export default function BookPage(props: {
  searchParams: Promise<{ service?: string; practitioner?: string }>;
}) {
  return (
    <main id="main-content" className="py-8 sm:py-12">
      <Suspense
        fallback={
          <div className="mx-auto max-w-xl py-20 text-center">
            <p className="text-sm text-graphite">Loading clinic booking schedule...</p>
          </div>
        }
      >
        <BookContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
