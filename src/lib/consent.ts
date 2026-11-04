import { config } from "@/lib/config";

/**
 * Patient-facing privacy notice text.
 *
 * The API stores consent notices as `{ version, content_hash }` only; it never serves
 * the notice body. The wording here is therefore owned by this frontend, keyed by
 * version, and MUST be reviewed by the clinic's legal / DPO before launch.
 */
export interface NoticeSection {
  heading: string;
  body: string;
}

export const BOOKING_NOTICE: readonly NoticeSection[] = [
  {
    heading: "What we collect",
    body: "Your name, email address and mobile number, the treatment you choose and your appointment time.",
  },
  {
    heading: "Why we collect it",
    body: "To reserve your appointment, send confirmations and reminders, and process any deposit. We do not use it for marketing.",
  },
  {
    heading: "How long we keep it",
    body: "Holds you do not complete are anonymised after 7 days. Confirmed booking records are kept for the period the clinic is required to retain them.",
  },
  {
    heading: "Your rights",
    body: "Under the Philippine Data Privacy Act of 2012 you may ask to access, correct or erase your personal data by contacting the clinic.",
  },
];

export const INTAKE_NOTICE: readonly NoticeSection[] = [
  {
    heading: "Sensitive health information",
    body: "Your answers are sensitive personal information. They are encrypted before storage and shown only to your treating clinician and authorised clinic administrators; every access is logged.",
  },
  {
    heading: "Why we ask",
    body: "To check a treatment is safe for you, for example allergies, medications, skin type and pregnancy status.",
  },
  {
    heading: "Optional fields",
    body: "All questions are optional. Anything you leave blank can be discussed with your clinician at your appointment.",
  },
  {
    heading: "Retention and erasure",
    body: "Intake answers are deleted after the retention period set by the clinic. You may request earlier erasure at any time.",
  },
];

export const NOTICE_REVIEW_BANNER =
  "Draft notice text for prototype purposes. Pending review by the clinic's legal counsel / Data Protection Officer.";

export const consentVersions = {
  booking: config.bookingConsentVersion,
} as const;
