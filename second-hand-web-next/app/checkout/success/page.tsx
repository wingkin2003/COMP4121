"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { formatHKD } from "@/lib/format";
import { createOrder, getCartWithDetails } from "@/lib/api-helpers";
import type { CartItem } from "@/lib/mvp-types";

const PENDING_ORDER_KEY = "secondlife-pending-checkout-order";
const PROCESSED_SESSION_PREFIX = "secondlife-stripe-session-processed-";

type PendingOrderDraft = {
  items: CartItem[];
  subtotal: number;
  commission: number;
  sellerPayout: number;
  total: number;
  shippingAddress: string;
};

type StripeSessionResponse = {
  paid?: boolean;
  shippingAddress?: string;
  amountTotal?: number;
  error?: string;
};

export default function CheckoutSuccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying Stripe payment...");
  const [amountPaid, setAmountPaid] = useState<number | null>(null);

  useEffect(() => {
    const finalizeOrder = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      if (!sessionId) {
        setStatus("error");
        setMessage("Missing Stripe session ID.");
        return;
      }

      try {
        const response = await fetch(
          `/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`,
        );
        const payload = (await response.json()) as StripeSessionResponse;

        if (!response.ok) {
          throw new Error(payload.error || "Unable to verify Stripe payment.");
        }

        if (!payload.paid) {
          throw new Error("Payment is not completed yet.");
        }

        const processedKey = `${PROCESSED_SESSION_PREFIX}${sessionId}`;
        const alreadyProcessed = localStorage.getItem(processedKey) === "1";
        const stripeAmount =
          typeof payload.amountTotal === "number"
            ? Math.round(payload.amountTotal / 100)
            : 0;

        setAmountPaid(stripeAmount);

        if (!alreadyProcessed) {
          const rawDraft = sessionStorage.getItem(PENDING_ORDER_KEY);
          let draft: PendingOrderDraft | null = null;

          if (rawDraft) {
            try {
              draft = JSON.parse(rawDraft) as PendingOrderDraft;
            } catch {
              draft = null;
            }
          }

          const shippingAddress =
            draft?.shippingAddress || payload.shippingAddress || "Not provided";

          // Get items from draft or from current cart
          let items = draft?.items;
          if (!items || items.length === 0) {
            const cartData = await getCartWithDetails();
            items = cartData.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            }));
          }

          if (items.length > 0) {
            // Backend creates the order, marks products as sold, and clears cart
            await createOrder(items, shippingAddress);
          }

          sessionStorage.removeItem(PENDING_ORDER_KEY);
          localStorage.setItem(processedKey, "1");
        }

        setStatus("success");
        setMessage("Payment confirmed. Your order has been recorded.");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify Stripe payment.",
        );
      }
    };

    void finalizeOrder();
  }, []);

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="section-header">
          <h1>Checkout result</h1>
        </div>

        <div className="content-card" style={{ maxWidth: "620px" }}>
          <p
            className="detail-msg"
            style={{ color: status === "error" ? "#d64545" : undefined }}
          >
            {message}
          </p>

          {status === "loading" ? (
            <p className="muted">Please wait while we confirm your payment.</p>
          ) : null}

          {status === "success" ? (
            <>
              <div className="checkout-summary" style={{ marginTop: "1rem" }}>
                <div className="checkout-row checkout-total">
                  <span>Amount paid</span>
                  <span>{formatHKD(amountPaid ?? 0)}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
                <Link href="/order/buy" className="btn btn-fill">
                  View buy orders
                </Link>
                <Link href="/marketplace" className="btn">
                  Continue shopping
                </Link>
              </div>
            </>
          ) : null}

          {status === "error" ? (
            <div style={{ marginTop: "1rem" }}>
              <Link href="/checkout" className="btn">
                Back to checkout
              </Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
