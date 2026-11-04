import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Tone = "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, { box: string; icon: IconName }> = {
  info: { box: "border-info/30 bg-info-wash text-info", icon: "info" },
  success: { box: "border-success/30 bg-success-wash text-success", icon: "check" },
  warning: { box: "border-warning/30 bg-warning-wash text-warning", icon: "alert" },
  danger: { box: "border-danger/30 bg-danger-wash text-danger", icon: "alert" },
};

interface AlertProps {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  /** Errors interrupt (`alert`); everything else is announced politely (`status`). */
  live?: boolean;
  actions?: ReactNode;
  className?: string;
}

/** Colour is never the only cue: every tone carries an icon and, usually, a title. */
export function Alert({ tone = "info", title, children, live = true, actions, className = "" }: AlertProps) {
  const { box, icon } = TONES[tone];
  return (
    <div
      role={live ? (tone === "danger" ? "alert" : "status") : undefined}
      className={`flex gap-3 rounded-2xl border p-4 ${box} ${className}`}
    >
      <Icon name={icon} className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1 text-[0.95rem] leading-relaxed">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-ink/85">{children}</div> : null}
        {actions ? <div className="pt-2">{actions}</div> : null}
      </div>
    </div>
  );
}
