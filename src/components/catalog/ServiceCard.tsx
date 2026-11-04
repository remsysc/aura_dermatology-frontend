import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Service } from "@/lib/api/types";
import { describeDeposit, formatDuration, formatPrice } from "@/lib/format";

export function roleLabel(role: Service["required_role"]): string {
  return role === "doctor" ? "Doctor-led" : "Clinic technician";
}

export function ServiceCard({ service }: { service: Service }) {
  const free = service.price_cents === 0;
  return (
    <article className="group flex h-full flex-col rounded-3xl border hairline bg-paper p-6 shadow-soft transition-shadow duration-300 hover:shadow-lift sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow">{roleLabel(service.required_role)}</p>
        <p className={`text-end font-display text-3xl leading-none tabular ${free ? "text-sage-deep" : "text-forest"}`}>
          {formatPrice(service)}
        </p>
      </div>

      <h3 className="mt-4 text-[1.75rem]">
        <Link
          href={`/treatments/${service.slug}`}
          className="underline-offset-4 decoration-gold decoration-2 hover:underline"
        >
          {service.name}
        </Link>
      </h3>

      <ul className="mt-4 space-y-2 text-sm text-graphite">
        <li className="flex items-center gap-2">
          <Icon name="clock" className="size-4 text-sage" />
          {formatDuration(service.duration_min)}
        </li>
        <li className="flex items-center gap-2">
          <Icon name="shield" className="size-4 text-sage" />
          {describeDeposit(service.deposit)}
        </li>
        {service.intake_enabled ? (
          <li className="flex items-center gap-2">
            <Icon name="lock" className="size-4 text-sage" />
            Confidential medical intake before your visit
          </li>
        ) : null}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
        <ButtonLink href={`/book?service=${encodeURIComponent(service.slug)}`}>
          Book
          <span className="sr-only"> {service.name}</span>
        </ButtonLink>
        <ButtonLink href={`/treatments/${service.slug}`} variant="ghost">
          Details
          <span className="sr-only"> for {service.name}</span>
        </ButtonLink>
      </div>
    </article>
  );
}
