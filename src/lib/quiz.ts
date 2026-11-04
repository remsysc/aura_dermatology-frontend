/**
 * Skin-concern quiz: a guide to the right first appointment, not a diagnosis.
 *
 * The concern -> service mapping below is a product decision that needs clinic
 * sign-off. Slugs are matched against the live catalogue at runtime; an unknown
 * slug degrades to the full treatment list instead of a broken booking link.
 */

export type QuizConcern = "acne" | "pigmentation" | "hair" | "unsure";
export type QuizHistory = "new" | "returning";

export interface QuizOption<T extends string> {
  value: T;
  label: string;
  hint: string;
}

export const QUIZ_CONCERNS: readonly QuizOption<QuizConcern>[] = [
  { value: "acne", label: "Acne or scarring", hint: "Breakouts, marks, texture" },
  { value: "pigmentation", label: "Dark spots or uneven tone", hint: "Melasma, sun spots, post-acne marks" },
  { value: "hair", label: "Unwanted hair", hint: "Long-term hair reduction" },
  { value: "unsure", label: "I'm not sure", hint: "I'd like a doctor's opinion" },
];

export const QUIZ_HISTORY: readonly QuizOption<QuizHistory>[] = [
  { value: "new", label: "No, this is my first time", hint: "We'll start with an assessment" },
  { value: "returning", label: "Yes, I've been assessed for this", hint: "You may be able to book treatment directly" },
];

export interface QuizRecommendation {
  serviceSlug: string;
  headline: string;
  reason: string;
}

export function recommend(concern: QuizConcern, history: QuizHistory): QuizRecommendation {
  if (concern === "acne" || concern === "unsure") {
    return {
      serviceSlug: "dermatology-consultation",
      headline: "Start with a dermatology consultation",
      reason:
        "A doctor needs to look at your skin first to diagnose the cause and plan treatment.",
    };
  }

  if (concern === "pigmentation") {
    return history === "returning"
      ? {
          serviceSlug: "pigmentation-laser",
          headline: "Book a pigmentation laser session",
          reason: "You've already been assessed, so you can go straight to treatment.",
        }
      : {
          serviceSlug: "dermatology-consultation",
          headline: "Start with a dermatology consultation",
          reason:
            "Pigmentation has several causes. A doctor should assess yours before any laser treatment.",
        };
  }

  return history === "returning"
    ? {
        serviceSlug: "laser-hair-removal",
        headline: "Book laser hair removal",
        reason: "You've been assessed before, so you can book your session directly.",
      }
    : {
        serviceSlug: "skin-analysis",
        headline: "Start with a complimentary skin analysis",
        reason: "A quick 15-minute analysis checks your skin is suitable before your first laser session.",
      };
}
