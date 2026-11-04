import { ApiUnavailable } from "@/components/catalog/ApiUnavailable";
import { ServiceCard } from "@/components/catalog/ServiceCard";
import { TreatmentCatalog } from "@/components/catalog/TreatmentCatalog";
import { listServices } from "@/lib/api/endpoints";

/** Server component: fetches at request time (streamed behind a Suspense boundary). */
export async function ServiceList({ limit, filterable = false }: { limit?: number; filterable?: boolean }) {
  let services = null;
  let fetchError: unknown = null;

  try {
    services = await listServices();
  } catch (error) {
    fetchError = error;
  }

  if (fetchError || services === null) {
    return <ApiUnavailable error={fetchError} what="our treatments" />;
  }

  if (services.length === 0) {
    return <p className="text-graphite">No treatments are available to book at the moment.</p>;
  }

  if (filterable) {
    return <TreatmentCatalog services={services} />;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {services.slice(0, limit).map((service) => (
        <ServiceCard key={service.slug} service={service} />
      ))}
    </div>
  );
}
