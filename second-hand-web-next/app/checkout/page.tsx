"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { getCartWithDetails, type CartItemDetail } from "@/lib/api-helpers";
import { formatHKD } from "@/lib/format";

const COMMISSION_RATE = 0.04;
const PENDING_ORDER_KEY = "secondlife-pending-checkout-order";

type StripeCheckoutItem = {
  id: string;
  title: string;
  unitAmount: number;
  quantity: number;
};

export default function CheckoutPage() {
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rows, setRows] = useState<CartItemDetail[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCartWithDetails();
        setRows(data.items);
      } catch {
        setRows([]);
      } finally {
        setLoaded(true);
      }
    };
    void load();

    const params = new URLSearchParams(window.location.search);
    if (params.get("cancelled") === "1") {
      setMessage("Stripe payment was cancelled. You can try again.");
    }
  }, []);

  const hasProducts = rows.some((r) => r.type === "product");
  const hasMysteryBox = rows.some((r) => r.type === "mystery_box");
  const hasRental = rows.some((r) => r.type === "rental");
  const needsAddress = hasProducts;

  const subtotal = rows.reduce(
    (sum, row) => sum + row.price * row.quantity,
    0,
  );
  // Commission only on product items
  const productSubtotal = rows
    .filter((r) => r.type === "product")
    .reduce((sum, r) => sum + r.price * r.quantity, 0);
  const commission = Math.round(productSubtotal * COMMISSION_RATE);
  const sellerPayout = productSubtotal - commission;

  const handlePay = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (needsAddress && !address.trim()) {
      setMessage("Please provide a Hong Kong shipping address for your product items.");
      return;
    }

    if (rows.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const items: StripeCheckoutItem[] = rows.map((row) => ({
        id: row.productId,
        title: row.title,
        unitAmount: Math.round(row.price),
        quantity: row.quantity,
      }));

      // Save cart details for the success page to process
      const cartItemsForOrder = rows.map((row) => ({
        productId: row.productId,
        quantity: row.quantity,
        type: row.type,
        tier: row.tier,
        rentalId: row.rentalId,
        days: row.days,
        startDate: row.startDate,
        pickupTime: row.pickupTime,
        renterName: row.renterName,
        renterPhone: row.renterPhone,
        renterNote: row.renterNote,
      }));

      sessionStorage.setItem(
        PENDING_ORDER_KEY,
        JSON.stringify({
          items: cartItemsForOrder,
          subtotal,
          commission,
          sellerPayout,
          total: subtotal,
          shippingAddress: address.trim(),
        }),
      );

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          shippingAddress: address.trim() || "N/A",
        }),
      });

      const payload = (await response.json()) as {
        sessionUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.sessionUrl) {
        throw new Error(
          payload.error || "Unable to create Stripe checkout session.",
        );
      }

      window.location.assign(payload.sessionUrl);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start Stripe checkout. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <Link href="/cart" className="back-link">
          ← Back to cart
        </Link>

        <div className="section-header">
          <h1>Checkout</h1>
        </div>

        <div className="content-card">
          <div className="checkout-summary">
            {hasProducts && (
              <>
                <div className="checkout-row">
                  <span>Products total</span>
                  <span>{formatHKD(productSubtotal)}</span>
                </div>
                <div className="checkout-row">
                  <span>Platform commission (4%)</span>
                  <span>{formatHKD(commission)}</span>
                </div>
                <div className="checkout-row">
                  <span>Seller payout</span>
                  <span>{formatHKD(sellerPayout)}</span>
                </div>
              </>
            )}
            {hasMysteryBox && (
              <div className="checkout-row">
                <span>Mystery Box{rows.filter(r => r.type === "mystery_box").length > 1 ? "es" : ""}</span>
                <span>{formatHKD(rows.filter(r => r.type === "mystery_box").reduce((s, r) => s + r.price * r.quantity, 0))}</span>
              </div>
            )}
            {hasRental && (
              <div className="checkout-row">
                <span>Rental booking{rows.filter(r => r.type === "rental").length > 1 ? "s" : ""}</span>
                <span>{formatHKD(rows.filter(r => r.type === "rental").reduce((s, r) => s + r.price, 0))}</span>
              </div>
            )}
            <div className="checkout-row checkout-total">
              <span>Amount charged</span>
              <span>{formatHKD(subtotal)}</span>
            </div>
          </div>

          <form className="sell-form" onSubmit={handlePay}>
            {needsAddress && (
              <label>
                Shipping address
                <textarea
                  rows={3}
                  placeholder="Hong Kong shipping address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </label>
            )}
            <button
              className="btn btn-fill"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Redirecting to Stripe..." : "Pay with Stripe"}
            </button>
            <p className="muted">
              Stripe test card: 4242 4242 4242 4242, any future expiry date, any
              CVC.
            </p>
            {message && <p className="detail-msg">{message}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}
