"use client";

import { useRef, useState } from "react";
import { ButtonLink, Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/Choice";
import {
  QUIZ_CONCERNS,
  QUIZ_HISTORY,
  recommend,
  type QuizConcern,
  type QuizHistory,
} from "@/lib/quiz";

/**
 * Two-question guide to the right first appointment. Presentational only: it links to
 * `/book?service=<slug>` and holds no personal data.
 */
export function SkinQuiz() {
  const [concern, setConcern] = useState<QuizConcern | null>(null);
  const [history, setHistory] = useState<QuizHistory | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const result = concern && history ? recommend(concern, history) : null;

  function restart(): void {
    setConcern(null);
    setHistory(null);
  }

  return (
    <section
      aria-labelledby="quiz-heading"
      className="relative overflow-hidden rounded-[2rem] border hairline bg-sand p-6 sm:p-10"
    >
      <div className="max-w-2xl space-y-2">
        <p className="eyebrow">Find your first appointment</p>
        <h2 id="quiz-heading" className="text-4xl sm:text-5xl">
          Not sure where to start?
        </h2>
        <p className="text-graphite">
          Two quick questions. This is a guide to help you choose, not a diagnosis.
        </p>
      </div>

      <form
        className="mt-8 space-y-8"
        onSubmit={(event) => event.preventDefault()}
        aria-describedby="quiz-result"
      >
        <ChoiceGroup<QuizConcern>
          name="quiz-concern"
          legend="1. What brings you in?"
          options={QUIZ_CONCERNS.map((option) => ({
            value: option.value,
            label: option.label,
            description: option.hint,
          }))}
          value={concern}
          onChange={setConcern}
          layout="grid gap-3 sm:grid-cols-2"
        />

        {concern ? (
          <div className="rise-in">
            <ChoiceGroup<QuizHistory>
              name="quiz-history"
              legend="2. Have you seen a dermatologist about this before?"
              options={QUIZ_HISTORY.map((option) => ({
                value: option.value,
                label: option.label,
                description: option.hint,
              }))}
              value={history}
              onChange={(value) => {
                setHistory(value);
                requestAnimationFrame(() => resultRef.current?.focus());
              }}
              layout="grid gap-3 sm:grid-cols-2"
            />
          </div>
        ) : null}
      </form>

      <div id="quiz-result" aria-live="polite">
        {result ? (
          <div
            ref={resultRef}
            tabIndex={-1}
            className="rise-in mt-8 rounded-2xl bg-forest p-6 text-alabaster outline-offset-4 sm:p-8"
          >
            <p className="eyebrow !text-gold">Our suggestion</p>
            <h3 className="mt-2 !text-alabaster text-3xl sm:text-4xl">{result.headline}</h3>
            <p className="mt-3 max-w-xl text-alabaster/85">{result.reason}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={`/book?service=${encodeURIComponent(result.serviceSlug)}`}
                className="!bg-alabaster !text-forest hover:!bg-gold"
              >
                Book this appointment
              </ButtonLink>
              <Button variant="ghost" className="!text-alabaster" onClick={restart}>
                Start over
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
