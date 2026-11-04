import { Alert } from "@/components/ui/Alert";
import { ReloadButton } from "@/components/ui/ReloadButton";
import { ApiError } from "@/lib/api/client";

/** Shared server-side fallback when the clinic API cannot be reached or returns an error. */
export function ApiUnavailable({ error, what }: { error: unknown; what: string }) {
  const detail =
    error instanceof ApiError && error.code === "network"
      ? "We could not reach the clinic booking server."
      : "The clinic booking server returned an unexpected response.";

  return (
    <Alert tone="warning" title={`We couldn't load ${what} right now`} actions={<ReloadButton />}>
      {detail} Please try again in a moment.
    </Alert>
  );
}
