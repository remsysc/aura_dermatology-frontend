import { config } from "@/lib/config";
import { normalizePhMobile } from "@/lib/phone";

/**
 * Browser-side PayMongo client. Only the *public* key is ever used here: it can create
 * payment methods and attach them to an intent via the intent's `client_key`, and nothing
 * else. Card data goes straight to PayMongo and never touches our API.
 *
 * Payment *confirmation* is owned by the signed webhook on the API; the result of
 * `attachPaymentMethod` only tells the UI what to show next.
 */

export type PaymongoMethodType = "gcash" | "paymaya" | "card";

export interface CardDetails {
  number: string;
  /** `MM/YY` as typed by the patient. */
  expiry: string;
  cvc: string;
}

export interface BillingDetails {
  name: string;
  email?: string;
  /** Any PH mobile format; normalised to E.164 before sending. */
  phone?: string;
}

export type AttachOutcome =
  | { kind: "redirect"; url: string }
  | { kind: "succeeded" }
  | { kind: "processing" };

export class PaymongoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymongoError";
  }
}

function authHeader(publicKey: string): string {
  return `Basic ${btoa(`${publicKey}:`)}`;
}

function parseExpiry(expiry: string): { month: number; year: number } | null {
  const match = /^\s*(\d{1,2})\s*\/\s*(\d{2}|\d{4})\s*$/.exec(expiry);
  if (!match) {
    return null;
  }
  const month = Number.parseInt(match[1], 10);
  const rawYear = Number.parseInt(match[2], 10);
  const year = match[2].length === 2 ? 2000 + rawYear : rawYear;
  return month >= 1 && month <= 12 ? { month, year } : null;
}

async function paymongoFetch(path: string, publicKey: string, body: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${config.paymongoBaseUrl}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader(publicKey),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new PaymongoError("Could not reach the payment provider. Please try again.");
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const detail = (json as { errors?: { detail?: unknown }[] } | null)?.errors?.[0]?.detail;
    throw new PaymongoError(
      typeof detail === "string" && detail !== ""
        ? detail
        : "Payment authorization failed. Please verify your details or use another method.",
    );
  }

  return json;
}

export async function createPaymentMethod(
  publicKey: string,
  type: PaymongoMethodType,
  billing: BillingDetails,
  card?: CardDetails,
): Promise<string> {
  const phone = billing.phone ? normalizePhMobile(billing.phone) : null;
  const attributes: Record<string, unknown> = {
    type,
    billing: {
      name: billing.name,
      ...(billing.email ? { email: billing.email } : {}),
      ...(phone ? { phone } : {}),
    },
  };

  if (type === "card") {
    const expiry = card ? parseExpiry(card.expiry) : null;
    if (!card || !expiry) {
      throw new PaymongoError("Enter the card expiry as MM/YY.");
    }
    attributes.details = {
      card_number: card.number.replace(/\s+/g, ""),
      exp_month: expiry.month,
      exp_year: expiry.year,
      cvc: card.cvc,
    };
  }

  const json = (await paymongoFetch("/payment_methods", publicKey, {
    data: { attributes },
  })) as { data?: { id?: unknown } };

  const id = json.data?.id;
  if (typeof id !== "string" || id === "") {
    throw new PaymongoError("Unexpected response from the payment provider.");
  }
  return id;
}

export async function attachPaymentMethod(
  publicKey: string,
  params: {
    paymentIntentId: string;
    clientKey: string;
    paymentMethodId: string;
    returnUrl: string;
  },
): Promise<AttachOutcome> {
  const json = (await paymongoFetch(
    `/payment_intents/${encodeURIComponent(params.paymentIntentId)}/attach`,
    publicKey,
    {
      data: {
        attributes: {
          payment_method: params.paymentMethodId,
          client_key: params.clientKey,
          return_url: params.returnUrl,
        },
      },
    },
  )) as {
    data?: {
      attributes?: {
        status?: string;
        last_payment_error?: { failed_message?: string } | null;
        next_action?: { redirect?: { url?: string } } | null;
      };
    };
  };

  const attributes = json.data?.attributes;
  const redirectUrl = attributes?.next_action?.redirect?.url;

  if (typeof redirectUrl === "string" && redirectUrl !== "") {
    return { kind: "redirect", url: redirectUrl };
  }
  if (attributes?.status === "succeeded") {
    return { kind: "succeeded" };
  }
  if (attributes?.status === "processing") {
    return { kind: "processing" };
  }

  throw new PaymongoError(
    attributes?.last_payment_error?.failed_message ??
      "Payment was not completed. Please try again or use another method.",
  );
}
