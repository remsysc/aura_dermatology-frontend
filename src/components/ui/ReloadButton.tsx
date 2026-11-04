"use client";

import { Button } from "@/components/ui/Button";

export function ReloadButton({ label = "Reload this page" }: { label?: string }) {
  return (
    <Button variant="secondary" className="min-h-11" onClick={() => window.location.reload()}>
      {label}
    </Button>
  );
}
