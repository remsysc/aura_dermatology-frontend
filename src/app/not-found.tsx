import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <main id="main-content" className="py-24">
      <div className="mx-auto max-w-xl px-4 text-center space-y-6">
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-sand text-forest">
          <Icon name="info" className="size-7 text-sage" />
        </div>
        <p className="eyebrow">404 Notice</p>
        <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
          Clinical Sanctuary Page Not Found
        </h1>
        <p className="text-sm text-graphite">
          The requested page or procedure path may have been updated. Explore our active clinical treatments or schedule an initial consultation.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
          <ButtonLink href="/treatments" variant="primary">
            Explore Treatments
            <Icon name="arrow-right" className="size-4" />
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Return to Sanctuary Home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
