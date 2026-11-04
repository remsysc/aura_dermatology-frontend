import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PayMongoCheckout } from "./PayMongoCheckout";

describe("PayMongoCheckout Component", () => {
  it("renders payment options with amount in Philippine Pesos", () => {
    render(
      <PayMongoCheckout
        amountCents={250000} // ₱2,500
        currency="PHP"
        reference="AUR-TEST1"
        clientKey="pi_test_key_123"
        paymentIntentId="pi_test_123"
        onPaymentSuccess={vi.fn()}
      />
    );

    expect(screen.getByText("Pay Appointment Deposit")).toBeInTheDocument();
    expect(screen.getByText("₱2,500")).toBeInTheDocument();
    expect(screen.getByText("GCash")).toBeInTheDocument();
    expect(screen.getByText("Maya")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
  });

  it("switches payment methods and renders relevant inputs", async () => {
    const user = userEvent.setup();
    render(
      <PayMongoCheckout
        amountCents={150000}
        reference="AUR-TEST2"
        clientKey="pi_test_key"
        paymentIntentId="pi_test"
        onPaymentSuccess={vi.fn()}
      />
    );

    // Click Card
    await user.click(screen.getByRole("radio", { name: /card/i }));
    expect(screen.getByLabelText(/Card Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cardholder Name/i)).toBeInTheDocument();

    // Click Maya
    await user.click(screen.getByRole("radio", { name: /maya/i }));
    expect(screen.getByLabelText(/Maya Mobile Number/i)).toBeInTheDocument();
  });

  it("triggers onPaymentSuccess after submitting payment", async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();

    render(
      <PayMongoCheckout
        amountCents={100000}
        reference="AUR-TEST3"
        clientKey="pi_key"
        paymentIntentId="pi_id"
        onPaymentSuccess={handleSuccess}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Pay ₱1,000 Deposit via PayMongo/i });
    await user.click(submitBtn);

    // Wait for the simulated payment processing
    await vi.waitFor(
      () => {
        expect(handleSuccess).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });
});
