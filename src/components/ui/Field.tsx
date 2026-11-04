import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const CONTROL =
  "block w-full rounded-xl border bg-paper px-4 py-3 text-base text-ink placeholder:text-graphite/70 min-h-12 transition-colors border-field hover:border-forest focus-visible:border-forest aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-wash/40";

interface ShellProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: (describedBy: string | undefined) => ReactNode;
}

/**
 * Label above the control, hint and error linked via `aria-describedby`.
 * "Required" is spelled out in text, not conveyed by colour or an asterisk alone.
 */
function FieldShell({ id, label, hint, error, required, children }: ShellProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-forest">
        {label}
        {required ? <span className="ms-1.5 font-normal text-graphite">(required)</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-graphite">
          {hint}
        </p>
      ) : null}
      {children(describedBy)}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-danger">
          <span aria-hidden="true">!</span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
}

export function TextField({ id, label, hint, error, required, className = "", ...rest }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      {(describedBy) => (
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${CONTROL} ${className}`}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "value"> {
  id: string;
  label: ReactNode;
  value: string;
  hint?: ReactNode;
  error?: string | null;
}

export function TextAreaField({
  id,
  label,
  hint,
  error,
  required,
  value,
  maxLength,
  className = "",
  ...rest
}: TextAreaFieldProps) {
  const counterId = maxLength ? `${id}-count` : undefined;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      {(describedBy) => (
        <>
          <textarea
            id={id}
            required={required}
            value={value}
            maxLength={maxLength}
            rows={3}
            aria-invalid={error ? true : undefined}
            aria-describedby={[describedBy, counterId].filter(Boolean).join(" ") || undefined}
            className={`${CONTROL} resize-y ${className}`}
            {...rest}
          />
          {maxLength ? (
            <p id={counterId} className="text-end text-xs text-graphite tabular">
              {value.length} / {maxLength}
            </p>
          ) : null}
        </>
      )}
    </FieldShell>
  );
}
