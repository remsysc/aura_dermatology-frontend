interface SkeletonProps {
  className?: string;
}

/** Decorative placeholder; the surrounding region announces loading via `aria-busy`. */
export function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton rounded-lg ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-3xl border hairline bg-paper p-6">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-12 w-40 rounded-full" />
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
