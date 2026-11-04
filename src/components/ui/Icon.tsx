import type { SVGProps } from "react";

const PATHS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  clock: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  shield: "M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3zM9 12l2 2 4-4",
  arrow: "M5 12h14M13 6l6 6-6 6",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-left": "M19 12H5M11 6l-6 6 6 6",
  calendar: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6",
  alert: "M12 8v5m0 3.5v.01M10.3 4.3L2.9 17.5A2 2 0 004.6 20.5h14.8a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z",
  "alert-circle": "M12 8v4m0 4h.01M22 12A10 10 0 112 12a10 10 0 0120 0z",
  info: "M12 11v5m0-8v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  download: "M12 4v11m0 0l-4-4m4 4l4-4M5 20h14",
  leaf: "M5 19c0-9 5-14 14-14 0 9-5 14-14 14zM5 19l7-7",
  lock: "M7 11V8a5 5 0 0110 0v3M6 11h12a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1v-7a1 1 0 011-1z",
  sparkles: "M12 3l1.9 4.5L18.4 9.4 13.9 11.3 12 15.8 10.1 11.3 5.6 9.4 10.1 7.5z",
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Decorative by default. Pass a label only when the icon conveys meaning on its own. */
  label?: string;
}

export function Icon({ name, label, className = "size-5", ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
