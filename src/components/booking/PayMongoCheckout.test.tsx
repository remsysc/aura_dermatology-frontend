import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PayMongoCheckout } from "./PayMongoCheckout";
import * as paymongo from "@/lib/paymongo";
import * as endpoints from "@/lib/api/endpoints";
import { config } from "@/lib/config";

vi.mock("@/lib/config", () => ({
  config: {
    paymongoPublicKey: "pk_test_sample_123",
    paymongoBaseUrl: "https://api.paymongo.com/v1",
  },
}));

vi.mock("@/lib/paymongo", () => ({
  createPaymentMethod: vi.fn(),
  attachPaymentMethod: vi.fn(),
  PaymongoError: class PaymongoError extends Error {},
}));

vi.mock("@/lib/api/endpoints", () => ({
  simulatePayment: vi.fn(),
}));

describe("PayMongoCheckout Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    vi.mocked(paymongo.createPaymentMethod).mockResolvedValueOnce("pm_123");
    vi.mocked(paymongo.attachPaymentMethod).mockResolvedValueOnce({ kind: "succeeded" });

    render(
      <PayMongoCheckout
        amountCents={100000}
        reference="AUR-TEST3"
        clientKey="pi_key"
        paymentIntentId="pi_id"
        onPaymentSuccess={handleSuccess}
      />
    );

    const phoneInput = screen.getByLabelText(/GCash Registered Mobile/i);
    await user.type(phoneInput, "09171234567");

    const submitBtn = screen.getByRole("button", { name: /Pay ₱1,000 Deposit via PayMongo/i });
    await user.click(submitBtn);

    await vi.waitFor(() => {
      expect(paymongo.createPaymentMethod).toHaveBeenCalledWith(
        "pk_test_sample_123",
        "gcash",
        expect.objectContaining({ phone: "09171234567" }),
        undefined
      );
      expect(paymongo.attachPaymentMethod).toHaveBeenCalledWith(
        "pk_test_sample_123",
        expect.objectContaining({
          paymentIntentId: "pi_id",
          clientKey: "pi_key",
          paymentMethodId: "pm_123",
        })
      );
      expect(handleSuccess).toHaveBeenCalled();
    });
  });

  it("handles redirect flow for 3DS or e-wallet authentication", async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, assign: assignMock, origin: "http://localhost:3000" },
    });

    vi.mocked(paymongo.createPaymentMethod).mockResolvedValueOnce("pm_456");
    vi.mocked(paymongo.attachPaymentMethod).mockResolvedValueOnce({
      kind: "redirect",
      url: "https://paymongo.test/checkout/authenticate",
    });

    render(
      <PayMongoCheckout
        amountCents={100000}
        reference="AUR-TEST4"
        clientKey="pi_key_4"
        paymentIntentId="pi_id_4"
        onPaymentSuccess={handleSuccess}
      />
    );

    const phoneInput = screen.getByLabelText(/GCash Registered Mobile/i);
    await user.type(phoneInput, "09181234567");

    const submitBtn = screen.getByRole("button", { name: /Pay ₱1,000 Deposit via PayMongo/i });
    await user.click(submitBtn);

    await vi.waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("https://paymongo.test/checkout/authenticate");
      expect(handleSuccess).not.toHaveBeenCalled();
    });
  });

  it("simulates payment in dev sandbox when paymongoPublicKey is unconfigured", async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    (config as { paymongoPublicKey: string }).paymongoPublicKey = "";

    vi.mocked(endpoints.simulatePayment).mockResolvedValueOnce({
      status: "confirmed",
      reference: "AUR-SANDBOX1",
    });

    render(
      <PayMongoCheckout
        amountCents={50000}
        reference="AUR-SANDBOX1"
        clientKey={null}
        paymentIntentId={null}
        statusToken="mock_status_token_xyz"
        onPaymentSuccess={handleSuccess}
      />
    );

    expect(screen.getByText(/Local Dev Sandbox \(Simulated PayMongo\)/i)).toBeInTheDocument();
    const phoneInput = screen.getByLabelText(/GCash Registered Mobile/i);
    await user.type(phoneInput, "09171234567");

    const submitBtn = screen.getByRole("button", { name: /Simulate ₱500 Deposit \(GCASH\)/i });
    expect(submitBtn).toBeInTheDocument();

    await user.click(submitBtn);

    await vi.waitFor(() => {
      expect(endpoints.simulatePayment).toHaveBeenCalledWith(
        "AUR-SANDBOX1",
        "mock_status_token_xyz",
        "gcash"
      );
      expect(handleSuccess).toHaveBeenCalled();
    });

    // Reset config for subsequent tests
    (config as { paymongoPublicKey: string }).paymongoPublicKey = "pk_test_sample_123";
  });
});

