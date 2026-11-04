import Image from "next/image";
import { ApiUnavailable } from "@/components/catalog/ApiUnavailable";
import { Icon } from "@/components/ui/Icon";
import type { Practitioner } from "@/lib/api/types";
import { listPractitioners } from "@/lib/api/endpoints";

const PRACTITIONER_PHOTOS: Record<string, string> = {
  "dr-elena-roces": "/images/dr-elena-roces.jpg",
  "dr-marcus-valerius": "/images/dr-marcus-valerius.jpg",
  "dr-reyes": "/images/dr-elena-roces.jpg",
  "nurse-santos": "/images/dr-marcus-valerius.jpg",
};

function initials(name: string): string {
  return name
    .replace(/^(Dr|Nurse)\.?\s+/i, "")
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PractitionerCard({ practitioner }: { practitioner: Practitioner }) {
  const photo = PRACTITIONER_PHOTOS[practitioner.slug];

  return (
    <li className="flex items-center gap-4 rounded-3xl border hairline bg-paper p-5 shadow-soft">
      {photo ? (
        <Image
          src={photo}
          alt={`Portrait of ${practitioner.name}`}
          width={64}
          height={64}
          className="size-16 rounded-full object-cover shrink-0 border hairline shadow-xs"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center rounded-full bg-forest font-display text-2xl text-gold"
        >
          {initials(practitioner.name)}
        </span>
      )}
      <div>
        <p className="font-display text-2xl leading-tight text-forest">{practitioner.name}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-graphite">
          <Icon name="user" className="size-4 text-sage" />
          {practitioner.role === "doctor" ? "Board-Certified Dermatologist" : "Clinic Technician"}
        </p>
      </div>
    </li>
  );
}

export async function PractitionerList() {
  let practitioners = null;
  let fetchError: unknown = null;

  try {
    practitioners = await listPractitioners();
  } catch (error) {
    fetchError = error;
  }

  if (fetchError || practitioners === null) {
    return <ApiUnavailable error={fetchError} what="our specialists" />;
  }

  if (practitioners.length === 0) {
    return <p className="text-graphite">Our team will be listed here soon.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {practitioners.map((practitioner) => (
        <PractitionerCard key={practitioner.slug} practitioner={practitioner} />
      ))}
    </ul>
  );
}
