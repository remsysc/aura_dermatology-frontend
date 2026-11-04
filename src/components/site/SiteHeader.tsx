"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { config } from "@/lib/config";

const NAV = [
  { href: "/treatments", label: "Treatments" },
  { href: "/practitioners", label: "Specialists" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="hairline sticky top-0 z-40 border-b bg-alabaster/90 backdrop-blur supports-[backdrop-filter]:bg-alabaster/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 sm:px-8">
        <Link href="/" className="group flex flex-col leading-none" aria-label={`${config.clinic.name}, home`}>
          <span className="font-display text-[1.7rem] font-medium tracking-[0.32em] text-forest">AURA</span>
          <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-graphite">
            Dermatology &amp; Laser Studio
          </span>
        </Link>

        <nav aria-label="Primary" className="order-3 w-full sm:order-2 sm:w-auto">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => {
              const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors hover:bg-sand ${
                      current ? "text-forest underline decoration-gold decoration-2 underline-offset-8" : "text-graphite"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link href="/book" className={`${buttonClasses("primary")} order-2 min-h-11 px-5 sm:order-3`}>
          Book appointment
        </Link>
      </div>
    </header>
  );
}
