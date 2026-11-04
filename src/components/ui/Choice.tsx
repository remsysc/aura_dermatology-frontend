import type { ReactNode } from "react";
import { Icon } from "./Icon";

export interface ChoiceOption<V extends string> {
  value: V;
  label: ReactNode;
  description?: ReactNode;
  /** Right-aligned secondary text, e.g. a price. */
  aside?: ReactNode;
  disabled?: boolean;
}

interface ChoiceGroupProps<V extends string> {
  name: string;
  legend: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  options: readonly ChoiceOption<V>[];
  value: V | null;
  onChange: (value: V) => void;
  variant?: "card" | "chip";
  /** Grid classes for the option container. */
  layout?: string;
  hideLegend?: boolean;
  required?: boolean;
}

const FOCUS =
  "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-deep";

/**
 * A native `<fieldset>` of real radio inputs, visually restyled. Keyboard behaviour
 * (arrow keys, roving selection) and screen-reader semantics come from the browser.
 * Used for any exclusive choice of fewer than six options.
 */
export function ChoiceGroup<V extends string>({
  name,
  legend,
  hint,
  error,
  options,
  value,
  onChange,
  variant = "card",
  layout = "grid gap-3",
  hideLegend = false,
  required = false,
}: ChoiceGroupProps<V>) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset aria-describedby={describedBy} className="min-w-0 space-y-3">
      <legend className={hideLegend ? "sr-only" : "text-sm font-semibold text-forest"}>
        {legend}
        {required ? <span className="ms-1.5 font-normal text-graphite">(required)</span> : null}
      </legend>
      {hint ? (
        <p id={hintId} className="text-sm text-graphite">
          {hint}
        </p>
      ) : null}

      <div className={layout}>
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={`relative block ${option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                disabled={option.disabled}
                required={required}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              {variant === "card" ? (
                <span
                  className={`${FOCUS} flex min-h-12 items-start gap-3 rounded-2xl border bg-paper p-4 transition-all duration-200 hover:border-forest peer-checked:border-2 peer-checked:border-forest peer-checked:bg-sand peer-checked:shadow-soft border-field`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${
                      selected ? "border-forest bg-forest text-alabaster" : "border-field"
                    }`}
                  >
                    {selected ? <Icon name="check" className="size-3.5" strokeWidth={2.6} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-forest">{option.label}</span>
                    {option.description ? (
                      <span className="mt-0.5 block text-sm text-graphite">{option.description}</span>
                    ) : null}
                  </span>
                  {option.aside ? (
                    <span className="shrink-0 text-end text-sm font-semibold text-forest tabular">
                      {option.aside}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span
                  className={`${FOCUS} grid min-h-12 min-w-16 place-items-center rounded-full border border-field bg-paper px-4 text-sm font-semibold text-forest tabular transition-colors duration-150 hover:border-forest peer-checked:border-forest peer-checked:bg-forest peer-checked:text-alabaster`}
                >
                  {option.label}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-danger">
          <span aria-hidden="true">!</span>
          <span>{error}</span>
        </p>
      ) : null}
    </fieldset>
  );
}
