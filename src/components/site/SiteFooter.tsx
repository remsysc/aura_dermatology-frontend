import Link from "next/link";
import { config } from "@/lib/config";

export function SiteFooter() {
  const { clinic } = config;
  const hasContact = Boolean(clinic.address || clinic.phone || clinic.email);

  return (
    <footer className="mt-24 bg-forest text-alabaster">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="font-display text-3xl tracking-[0.3em]">AURA</p>
          <p className="max-w-sm text-sm leading-relaxed text-alabaster/80">
            Doctor-led dermatology and precision laser treatments. Your slot is held for 15 minutes
            while you complete booking, and your medical history is encrypted.
          </p>
        </div>

        <nav aria-label="Footer" className="space-y-3 text-sm">
          <p className="font-semibold text-gold">Explore</p>
          <ul className="space-y-2 text-alabaster/85">
            <li>
              <Link className="underline-offset-4 hover:underline" href="/treatments">
                Treatments
              </Link>
            </li>
            <li>
              <Link className="underline-offset-4 hover:underline" href="/practitioners">
                Specialists
              </Link>
            </li>
            <li>
              <Link className="underline-offset-4 hover:underline" href="/book">
                Book an appointment
              </Link>
            </li>
            <li>
              <Link className="underline-offset-4 hover:underline" href="/privacy">
                Privacy notice
              </Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-3 text-sm">
          <p className="font-semibold text-gold">Visit</p>
          {hasContact ? (
            <address className="space-y-1 not-italic text-alabaster/85">
              {clinic.address ? <p>{clinic.address}</p> : null}
              {clinic.phone ? (
                <p>
                  <a className="underline-offset-4 hover:underline" href={`tel:${clinic.phone.replace(/\s/g, "")}`}>
                    {clinic.phone}
                  </a>
                </p>
              ) : null}
              {clinic.email ? (
                <p>
                  <a className="underline-offset-4 hover:underline" href={`mailto:${clinic.email}`}>
                    {clinic.email}
                  </a>
                </p>
              ) : null}
            </address>
          ) : (
            <p className="text-alabaster/70">Clinic address and contact details appear here once configured.</p>
          )}
        </div>
      </div>

      <div className="border-t border-alabaster/15">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-alabaster/70 sm:px-8">
          &copy; {clinic.name}. Online booking does not replace a medical consultation.
        </p>
      </div>
    </footer>
  );
}
