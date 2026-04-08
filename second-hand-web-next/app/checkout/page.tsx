"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { addOrder, getCart, getProducts, setCart } from "@/lib/mvp-data";
import { formatHKD } from "@/lib/format";

const COMMISSION_RATE = 0.04;

export default function CheckoutPage() {
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [, setVersion] = useState(0);

  const products = getProducts();
  const cart = getCart();

  const rows = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return null;
      return { product, quantity: item.quantity };
    })
    .filter((entry): entry is { product: (typeof products)[number]; quantity: number } =>
      Boolean(entry),
    );

  const subtotal = rows.reduce(
    (sum, row) => sum + row.product.price * row.quantity,
    0,
  );
  const commission = Math.round(subtotal * COMMISSION_RATE);
  const sellerPayout = subtotal - commission;

  const handlePay = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!address.trim()) {
      setMessage("Please provide a Hong Kong shipping address.");
      return;
    }

    if (rows.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    addOrder({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      items: cart,
      subtotal,
      commission,
      sellerPayout,
      total: subtotal,
      shippingAddress: address.trim(),
    });
    setCart([]);
    setAddress("");
    setVersion((value) => value + 1);
    setMessage("Payment completed. Order confirmed.");
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <Link href="/cart" className="back-link">← Back to cart</Link>

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
            <button className="btn btn-fill" type="submit">
              Pay now
            </button>
            {message && <p className="detail-msg">{message}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}
