"use client";

import { useMemo, useState } from "react";
import { ServiceCard } from "@/components/catalog/ServiceCard";
import { ChoiceGroup } from "@/components/ui/Choice";
import type { Service } from "@/lib/api/types";

type Filter = "all" | "doctor" | "technician";

const FILTERS = [
  { value: "all", label: "All treatments" },
  { value: "doctor", label: "Doctor-led" },
  { value: "technician", label: "Technician-led" },
] as const;

export function TreatmentCatalog({ services }: { services: Service[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () => (filter === "all" ? services : services.filter((service) => service.required_role === filter)),
    [filter, services],
  );

  return (
    <div className="space-y-8">
      <ChoiceGroup<Filter>
        name="treatment-filter"
        legend="Filter treatments"
        hideLegend
        variant="chip"
        layout="flex flex-wrap gap-2"
        options={FILTERS}
        value={filter}
        onChange={setFilter}
      />

      <p className="text-sm text-graphite" role="status">
        Showing {visible.length} of {services.length} treatments
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {visible.map((service) => (
          <ServiceCard key={service.slug} service={service} />
        ))}
      </div>
    </div>
  );
}
