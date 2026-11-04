"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to telemetry if configured
    console.error("Clinical Sanctuary boundary caught an error:", error);
  }, [error]);

  return (
    <main id="main-content" className="py-20">
      <div className="mx-auto max-w-xl px-4 text-center space-y-6">
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-red-100 text-danger">
          <Icon name="alert" className="size-7" />
        </div>
        <p className="eyebrow">Service Notice</p>
        <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
          An Unexpected Interruption Occurred
        </h1>
        <p className="text-sm text-graphite">
          Our scheduling systems remain secure. You may attempt to reload this view, or contact our clinic concierge if the issue persists.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
          <Button variant="primary" onClick={() => reset()}>
            Try Again
          </Button>
          <ButtonLink href="/" variant="secondary">
            Return to Sanctuary Home
          </ButtonLink>
        </div>

        <p className="text-xs text-graphite pt-4">
          Concierge Assistance: concierge@aura-dermatology.ph • +63 2 8888 2872
        </p>
      </div>
    </main>
  );
}
