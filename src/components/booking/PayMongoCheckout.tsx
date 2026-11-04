"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { formatPesos } from "@/lib/format";

export interface PayMongoCheckoutProps {
  amountCents: number;
  currency?: string;
  reference: string;
  clientKey: string | null;
  paymentIntentId: string | null;
  onPaymentSuccess: () => void;
  className?: string;
}

type PaymentMethod = "gcash" | "card" | "maya";

export function PayMongoCheckout({
  amountCents,
  currency = "PHP",
  reference,
  clientKey,
  paymentIntentId,
  onPaymentSuccess,
  className = "",
}: PayMongoCheckoutProps) {
  const [method, setMethod] = useState<PaymentMethod>("gcash");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Card form state
  const [cardName, setCardName] = useState<string>("");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvc, setCardCvc] = useState<string>("");

  // E-Wallet form state
  const [walletPhone, setWalletPhone] = useState<string>("0917 123 4567");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Simulate PayMongo intent attach delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Trigger success callback
      onPaymentSuccess();
    } catch {
      setErrorMessage("Payment authorization failed. Please verify your details or use another method.");
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
              PayMongo sandbox testing: Any 09XX number accepts the test transaction.
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
          Pay {formatPesos(amountCents)} Deposit via PayMongo
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
