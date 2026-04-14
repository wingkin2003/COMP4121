"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { formatHKD } from "@/lib/format";
import {
  createOrder,
  getCartWithDetails,
  purchaseMysteryBox,
  createRentalOrder,
} from "@/lib/api-helpers";

const PENDING_ORDER_KEY = "secondlife-pending-checkout-order";
const PROCESSED_SESSION_PREFIX = "secondlife-stripe-session-processed-";

type PendingCartItem = {
  productId: string;
  quantity: number;
  type: "product" | "mystery_box" | "rental";
  tier?: string;
  rentalId?: string;
  days?: number;
  startDate?: string;
  pickupTime?: string;
  renterName?: string;
  renterPhone?: string;
  renterNote?: string;
};

type PendingOrderDraft = {
  items: PendingCartItem[];
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

type MysteryBoxResult = {
  productTitle: string;
  pricePaid: number;
  originalPrice: number;
};

export default function CheckoutSuccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying Stripe payment...");
  const [amountPaid, setAmountPaid] = useState<number | null>(null);
  const [mysteryBoxResults, setMysteryBoxResults] = useState<MysteryBoxResult[]>([]);
  const [processedRentals, setProcessedRentals] = useState(0);
  const [processedProducts, setProcessedProducts] = useState(0);

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
          let items: PendingCartItem[] = draft?.items || [];
          if (!items || items.length === 0) {
            const cartData = await getCartWithDetails();
            items = cartData.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              type: i.type,
              tier: i.tier,
              rentalId: i.rentalId,
              days: i.days,
              startDate: i.startDate,
              pickupTime: i.pickupTime,
              renterName: i.renterName,
              renterPhone: i.renterPhone,
              renterNote: i.renterNote,
            }));
          }

          // Process product items → create order
          const productItems = items.filter((i) => i.type === "product" || !i.type);
          if (productItems.length > 0) {
            await createOrder(
              productItems.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
              })),
              shippingAddress,
            );
            setProcessedProducts(productItems.length);
          }

          // Process mystery box items → purchase each
          const mysteryBoxItems = items.filter((i) => i.type === "mystery_box");
          const mbResults: MysteryBoxResult[] = [];
          for (const item of mysteryBoxItems) {
            for (let q = 0; q < item.quantity; q++) {
              const result = await purchaseMysteryBox(item.tier || "");
              if (result) {
                mbResults.push({
                  productTitle: result.productTitle,
                  pricePaid: result.pricePaid,
                  originalPrice: result.originalPrice,
                });
              }
            }
          }
          setMysteryBoxResults(mbResults);

          // Process rental items → create rental orders
          const rentalItems = items.filter((i) => i.type === "rental");
          for (const item of rentalItems) {
            if (item.rentalId) {
              await createRentalOrder({
                rentalId: item.rentalId,
                renterName: item.renterName || "",
                days: item.days || 1,
                startDate: item.startDate || "",
                pickupTime: item.pickupTime || "",
                phone: item.renterPhone || "",
                note: item.renterNote || "",
              });
            }
          }
          setProcessedRentals(rentalItems.length);

          sessionStorage.removeItem(PENDING_ORDER_KEY);
          localStorage.setItem(processedKey, "1");
        }

        setStatus("success");
        setMessage("Payment confirmed. Your orders have been recorded.");
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

              {/* Mystery box reveals */}
              {mysteryBoxResults.length > 0 && (
                <div style={{ margin: "1rem 0", padding: "1rem", background: "#f0f7f0", borderRadius: "0.5rem" }}>
                  <h3 style={{ margin: "0 0 0.5rem" }}>🎁 Mystery Box Reveals</h3>
                  {mysteryBoxResults.map((mb, i) => (
                    <div key={i} style={{ padding: "0.4rem 0", borderBottom: i < mysteryBoxResults.length - 1 ? "1px solid #ddd" : "none" }}>
                      <strong>{mb.productTitle}</strong>
                      <span className="muted" style={{ marginLeft: "0.5rem" }}>
                        Paid {formatHKD(mb.pricePaid)} · Was <s>{formatHKD(mb.originalPrice)}</s> · Saved {formatHKD(mb.originalPrice - mb.pricePaid)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Rental confirmations */}
              {processedRentals > 0 && (
                <p className="muted" style={{ marginTop: "0.5rem" }}>
                  ✓ {processedRentals} rental booking{processedRentals > 1 ? "s" : ""} confirmed
                </p>
              )}

              {/* Product order */}
              {processedProducts > 0 && (
                <p className="muted" style={{ marginTop: "0.5rem" }}>
                  ✓ {processedProducts} product{processedProducts > 1 ? "s" : ""} ordered
                </p>
              )}

              <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginTop: "1rem" }}>
                <Link href="/profile" className="btn btn-fill">
                  View profile
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
