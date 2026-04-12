"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { getCart, getProducts } from "@/lib/mvp-data";
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

  const products = getProducts();
  const cart = getCart();

  const rows = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return null;
      return { product, quantity: item.quantity };
    })
    .filter(
      (
        entry,
      ): entry is { product: (typeof products)[number]; quantity: number } =>
        Boolean(entry),
    );

  const subtotal = rows.reduce(
    (sum, row) => sum + row.product.price * row.quantity,
    0,
  );
  const commission = Math.round(subtotal * COMMISSION_RATE);
  const sellerPayout = subtotal - commission;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cancelled") === "1") {
      setMessage("Stripe payment was cancelled. You can try again.");
    }
  }, []);

  const handlePay = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!address.trim()) {
      setMessage("Please provide a Hong Kong shipping address.");
      return;
    }

    if (rows.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const items: StripeCheckoutItem[] = rows.map((row) => ({
        id: row.product.id,
        title: row.product.title,
        unitAmount: row.product.price,
        quantity: row.quantity,
      }));

      sessionStorage.setItem(
        PENDING_ORDER_KEY,
        JSON.stringify({
          items: cart,
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
          shippingAddress: address.trim(),
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
            <div className="checkout-row">
              <span>Items total</span>
              <span>{formatHKD(subtotal)}</span>
            </div>
            <div className="checkout-row">
              <span>Platform commission (4%)</span>
              <span>{formatHKD(commission)}</span>
            </div>
            <div className="checkout-row">
              <span>Seller payout</span>
              <span>{formatHKD(sellerPayout)}</span>
            </div>
            <div className="checkout-row checkout-total">
              <span>Amount charged</span>
              <span>{formatHKD(subtotal)}</span>
            </div>
          </div>

          <form className="sell-form" onSubmit={handlePay}>
            <label>
              Shipping address
              <textarea
                rows={3}
                placeholder="Hong Kong shipping address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </label>
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
