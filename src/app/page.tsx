import Image from "next/image";
import { Suspense } from "react";
import { PractitionerList } from "@/components/catalog/PractitionerList";
import { ServiceList } from "@/components/catalog/ServiceList";
import { SkinQuiz } from "@/components/quiz/SkinQuiz";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { config } from "@/lib/config";

const PROMISES: readonly { icon: IconName; title: string; body: string }[] = [
  {
    icon: "user",
    title: "Doctor-led care",
    body: "Consultations and medical-grade lasers delivered by clinic doctors and trained technicians.",
  },
  {
    icon: "clock",
    title: "Your slot, held for 15 minutes",
    body: "Pick a time and we reserve it while you finish. No double bookings, ever.",
  },
  {
    icon: "lock",
    title: "A confidential intake",
    body: "Your medical history is encrypted and only seen by your clinician. Under the Data Privacy Act of 2012.",
  },
];

const STEPS = [
  { title: "Choose", body: "Pick a treatment and, if you like, your preferred specialist." },
  { title: "Reserve", body: "Select a real-time slot. Deposits are shown upfront, never at the end." },
  { title: "Arrive prepared", body: "Complete a short medical intake from your email, then simply show up." },
] as const;

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <svg
          aria-hidden="true"
          viewBox="0 0 600 600"
          className="pointer-events-none absolute -end-40 -top-24 -z-10 size-[44rem] max-w-none text-gold/35"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          {Array.from({ length: 9 }, (_, index) => (
            <circle key={index} cx="300" cy="300" r={40 + index * 32} />
          ))}
          <path d="M300 20C380 120 380 220 300 300C220 380 220 480 300 580" />
          <path d="M20 300C120 220 220 220 300 300C380 380 480 380 580 300" />
        </svg>

        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.25fr_1fr] lg:items-end">
          <div className="rise-in space-y-8">
            <p className="eyebrow">Doctor-led dermatology &amp; laser</p>
            <h1 className="text-[clamp(3rem,7.5vw,5.75rem)]">
              Skin care that begins with a <em className="font-normal text-sage-deep">real</em> diagnosis.
            </h1>
            <p className="max-w-xl text-lg text-graphite">
              Book a consultation or laser treatment in minutes. See real-time availability and transparent
              pricing before you commit to anything.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/book">
                Book an appointment
                <Icon name="arrow" className="size-4" />
              </ButtonLink>
              <ButtonLink href="#find-your-treatment" variant="secondary">
                Find your treatment
              </ButtonLink>
            </div>
          </div>

          <aside
            aria-label="What to expect"
            className="rise-in rounded-3xl border hairline bg-paper/90 p-6 shadow-lift backdrop-blur [animation-delay:120ms]"
          >
            {/* Sanctuary Suite Photography */}
            <div className="relative mb-5 overflow-hidden rounded-2xl border hairline">
              <Image
                src="/images/sanctuary-suite.jpg"
                alt="AURA Sanctuary Treatment Suite in BGC Metro Manila"
                width={600}
                height={340}
                className="h-44 w-full object-cover transition-transform duration-500 hover:scale-105"
                priority
              />
              <span className="absolute bottom-2.5 start-2.5 inline-flex items-center gap-1.5 rounded-full bg-forest/85 px-3 py-1 text-[11px] font-medium text-alabaster backdrop-blur-md">
                <Icon name="sparkles" className="size-3 text-gold" />
                Sanctuary Suite • BGC Flagship
              </span>
            </div>

            <p className="eyebrow">At {config.clinic.name}</p>
            <ul className="mt-4 space-y-4">
              {PROMISES.map((promise) => (
                <li key={promise.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sage-deep">
                    <Icon name={promise.icon} />
                  </span>
                  <div>
                    <h2 className="!font-sans !text-base !font-semibold !tracking-normal">{promise.title}</h2>
                    <p className="mt-0.5 text-sm text-graphite">{promise.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Treatments */}
      <section aria-labelledby="treatments-heading" className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">Treatments</p>
            <h2 id="treatments-heading" className="text-4xl sm:text-5xl">
              Clear prices. No surprises.
            </h2>
          </div>
          <ButtonLink href="/treatments" variant="ghost">
            View all treatments
            <Icon name="arrow" className="size-4" />
          </ButtonLink>
        </div>

        <div className="mt-8">
          <Suspense fallback={<CardGridSkeleton count={4} />}>
            <ServiceList />
          </Suspense>
        </div>
      </section>

      {/* Diagnostic skin quiz */}
      <section
        id="find-your-treatment"
        aria-labelledby="quiz-heading"
        className="mx-auto max-w-3xl px-5 py-24 sm:px-8"
      >
        <div className="text-center">
          <p className="eyebrow">Recommendation engine</p>
          <h2 id="quiz-heading" className="mt-2 text-4xl sm:text-5xl">
            Find your treatment in 30 seconds
          </h2>
          <p className="mt-4 text-graphite">
            Answer three quick questions about what you’d like to work on and we’ll match you to the right
            clinical protocol.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border hairline bg-paper p-6 shadow-lift sm:p-10">
          <SkinQuiz />
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="steps-heading" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <p className="eyebrow text-center">How it works</p>
        <h2 id="steps-heading" className="mt-2 text-center text-4xl sm:text-5xl">
          Three steps to your appointment
        </h2>

        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col rounded-3xl border hairline bg-sand/60 p-6 sm:p-7"
            >
              <span className="font-display text-4xl text-gold" aria-hidden="true">
                0{index + 1}
              </span>
              <h3 className="mt-4 text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm text-graphite">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Practitioners */}
      <section aria-labelledby="team-heading" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <p className="eyebrow">Our specialists</p>
        <h2 id="team-heading" className="mt-2 text-4xl sm:text-5xl">
          Experienced, credentialed care
        </h2>

        <div className="mt-8">
          <Suspense fallback={<CardGridSkeleton count={2} />}>
            <PractitionerList />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
