"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { formatPesos } from "@/lib/format";
import { config } from "@/lib/config";
import { attachPaymentMethod, createPaymentMethod, PaymongoError } from "@/lib/paymongo";
import { simulatePayment } from "@/lib/api/endpoints";

export interface PayMongoCheckoutProps {
  amountCents: number;
  currency?: string;
  reference: string;
  clientKey: string | null;
  paymentIntentId: string | null;
  statusToken?: string | null;
  onPaymentSuccess: () => void;
  /** Billing name for e-wallet payments (cards use the cardholder name). */
  patientName?: string;
  patientEmail?: string;
  className?: string;
}

type PaymentMethod = "gcash" | "card" | "maya";

export function PayMongoCheckout({
  amountCents,
  currency = "PHP",
  reference,
  clientKey,
  paymentIntentId,
  statusToken,
  onPaymentSuccess,
  patientName = "AURA Patient",
  patientEmail,
  className = "",
}: PayMongoCheckoutProps) {
  const [method, setMethod] = useState<PaymentMethod>("gcash");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSimulationMode =
    process.env.NEXT_PUBLIC_PAYMONGO_SIMULATE === "true" ||
    !config.paymongoPublicKey;

  // Card form state
  const [cardName, setCardName] = useState<string>("");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvc, setCardCvc] = useState<string>("");

  // E-Wallet form state
  const [walletPhone, setWalletPhone] = useState<string>("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!config.paymongoPublicKey || !paymentIntentId || !clientKey) {
      if (isSimulationMode && statusToken) {
        setLoading(true);
        try {
          await simulatePayment(reference, statusToken, method === "maya" ? "paymaya" : method);
          onPaymentSuccess();
          return;
        } catch (err) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to simulate payment in dev sandbox.");
          return;
        } finally {
          setLoading(false);
        }
      }

      setErrorMessage("Online payment is temporarily unavailable. Please contact the clinic to complete your booking.");
      return;
    }

    setLoading(true);
    try {
      const methodId = await createPaymentMethod(
        config.paymongoPublicKey,
        method === "maya" ? "paymaya" : method,
        {
          name: method === "card" ? cardName : patientName,
          email: patientEmail,
          phone: method === "card" ? undefined : walletPhone,
        },
        method === "card" ? { number: cardNumber, expiry: cardExpiry, cvc: cardCvc } : undefined,
      );

      const outcome = await attachPaymentMethod(config.paymongoPublicKey, {
        paymentIntentId,
        clientKey,
        paymentMethodId: methodId,
        returnUrl: `${window.location.origin}/book/confirmation?ref=${encodeURIComponent(reference)}`,
      });

      if (outcome.kind === "redirect") {
        // E-wallet / 3-D Secure authentication happens on the provider's page; the patient
        // returns to /book/confirmation, which polls until the webhook confirms the booking.
        window.location.assign(outcome.url);
        return;
      }

      onPaymentSuccess();
    } catch (err) {
      setErrorMessage(
        err instanceof PaymongoError
          ? err.message
          : "Payment authorization failed. Please verify your details or use another method.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-3xl border hairline bg-paper p-6 sm:p-8 shadow-soft space-y-6 ${className}`}>
      <div className="flex items-center justify-between border-b hairline pb-4">
        <div>
          <span className="eyebrow">PayMongo Gateway</span>
          <h3 className="font-serif text-2xl text-forest mt-0.5">Pay Appointment Deposit</h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-graphite uppercase tracking-wider font-semibold">Deposit Total</span>
          <p className="font-display text-2xl text-forest mt-0.5">{formatPesos(amountCents)}</p>
          <span className="text-[10px] text-graphite">{currency} • Credited to treatment</span>
        </div>
      </div>

      {/* Local Dev Sandbox Mode Notice */}
      {isSimulationMode && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950">
            <Icon name="shield" className="size-4 text-amber-700" />
            <span>Local Dev Sandbox (Simulated PayMongo)</span>
          </div>
          <p>
            Operating in developer simulation mode. Submitting below will simulate an instant verified {method.toUpperCase()} payment and unlock your medical intake form.
          </p>
        </div>
      )}

      {/* Payment Method Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
          Select Payment Method
        </label>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Payment method">
          {/* GCash */}
          <button
            type="button"
            role="radio"
            aria-checked={method === "gcash"}
            onClick={() => setMethod("gcash")}
            className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all ${
              method === "gcash"
                ? "border-forest bg-sand shadow-xs font-semibold text-forest"
                : "border-field bg-paper text-graphite hover:border-forest"
            }`}
          >
            <div className="size-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-1.5">
              G
            </div>
            <span className="text-xs font-semibold text-forest">GCash</span>
            <span className="text-[10px] text-graphite">Instant e-Wallet</span>
          </button>

          {/* Maya */}
          <button
            type="button"
            role="radio"
            aria-checked={method === "maya"}
            onClick={() => setMethod("maya")}
            className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all ${
              method === "maya"
                ? "border-forest bg-sand shadow-xs font-semibold text-forest"
                : "border-field bg-paper text-graphite hover:border-forest"
            }`}
          >
            <div className="size-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-1.5">
              M
            </div>
            <span className="text-xs font-semibold text-forest">Maya</span>
            <span className="text-[10px] text-graphite">e-Wallet / App</span>
          </button>

          {/* Credit / Debit Card */}
          <button
            type="button"
            role="radio"
            aria-checked={method === "card"}
            onClick={() => setMethod("card")}
            className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all ${
              method === "card"
                ? "border-forest bg-sand shadow-xs font-semibold text-forest"
                : "border-field bg-paper text-graphite hover:border-forest"
            }`}
          >
            <div className="size-8 rounded-full bg-forest text-gold font-bold text-xs flex items-center justify-center mb-1.5">
              <Icon name="shield" className="size-4" />
            </div>
            <span className="text-xs font-semibold text-forest">Card</span>
            <span className="text-[10px] text-graphite">Visa / Mastercard</span>
          </button>
        </div>
      </div>

      {/* Form Details */}
      <form onSubmit={handlePay} className="space-y-4">
        {method === "gcash" && (
          <div className="space-y-3 rounded-2xl border hairline bg-sand/30 p-4">
            <TextField
              id="gcash-phone"
              type="tel"
              label="GCash Registered Mobile"
              hint="You will receive a one-time MPIN verification prompt."
              value={walletPhone}
              onChange={(e) => setWalletPhone(e.target.value)}
              required
            />
            <p className="text-[11px] text-graphite flex items-center gap-1.5">
              <Icon name="check" className="size-3 text-sage" />
              You will be redirected to GCash to approve the payment, then brought back here.
            </p>
          </div>
        )}

        {method === "maya" && (
          <div className="space-y-3 rounded-2xl border hairline bg-sand/30 p-4">
            <TextField
              id="maya-phone"
              type="tel"
              label="Maya Mobile Number"
              hint="Enter your registered Maya mobile account."
              value={walletPhone}
              onChange={(e) => setWalletPhone(e.target.value)}
              required
            />
          </div>
        )}

        {method === "card" && (
          <div className="space-y-4 rounded-2xl border hairline bg-sand/30 p-4">
            <TextField
              id="cardholder-name"
              label="Cardholder Name"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="e.g. Maria Clara Santos"
              required
            />
            <TextField
              id="card-number"
              label="Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4242 •••• •••• 4242"
              maxLength={19}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                id="card-expiry"
                label="Expires (MM/YY)"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                placeholder="12/28"
                maxLength={5}
                required
              />
              <TextField
                id="card-cvc"
                label="CVC / CVV"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>
        )}

        {errorMessage && (
          <p className="text-xs font-semibold text-danger flex items-center gap-1">
            <Icon name="alert" className="size-3.5" />
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="w-full justify-center py-3 text-sm"
        >
          {isSimulationMode
            ? `Simulate ${formatPesos(amountCents)} Deposit (${method.toUpperCase()})`
            : `Pay ${formatPesos(amountCents)} Deposit via PayMongo`}
          <Icon name="arrow-right" className="size-4" />
        </Button>

        <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-graphite">
          <Icon name="lock" className="size-3 text-sage" />
          <span>PCI-DSS Level 1 Certified • 256-bit Encrypted Checkout</span>
        </div>
      </form>
    </div>
  );
}
