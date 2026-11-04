import { Icon } from "./Icon";

interface StepNavProps {
  steps: readonly string[];
  /** Zero-based index of the current step. */
  current: number;
  label?: string;
}

/** Ordered progress with `aria-current="step"`; completed steps show a check, not only a colour change. */
export function StepNav({ steps, current, label = "Booking progress" }: StepNavProps) {
  return (
    <nav aria-label={label}>
      <ol className="flex items-center gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
            >
              <span
                aria-hidden="true"
                className={`grid size-8 shrink-0 place-items-center rounded-full border text-sm font-semibold tabular ${
                  active
                    ? "border-forest bg-forest text-alabaster"
                    : done
                      ? "border-sage-deep bg-sage-deep text-alabaster"
                      : "border-field bg-paper text-graphite"
                }`}
              >
                {done ? <Icon name="check" className="size-4" strokeWidth={2.6} /> : index + 1}
              </span>
              <span
                className={`hidden truncate text-sm sm:block ${active ? "font-semibold text-forest" : "text-graphite"}`}
              >
                {step}
                {done ? <span className="sr-only"> (completed)</span> : null}
              </span>
              <span className="sr-only sm:hidden">
                Step {index + 1} of {steps.length}: {step}
                {done ? " (completed)" : active ? " (current)" : ""}
              </span>
              {index < steps.length - 1 ? (
                <span aria-hidden="true" className="hairline hidden h-px flex-1 border-t sm:block" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
