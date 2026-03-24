"use client";

import { FormEvent, useState } from "react";
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
    setMessage("Payment completed in test mode. Order confirmed.");
  };

  return (
    <section className="stack">
      <div className="card">
        <h1>Checkout</h1>
        <p className="muted">
          MVP test payment flow with transparent 4% platform commission.
        </p>
        <div className="summary">
          <p>Items total: {formatHKD(subtotal)}</p>
          <p>Platform commission (4%): {formatHKD(commission)}</p>
          <p>Estimated seller payout: {formatHKD(sellerPayout)}</p>
          <p className="price">Amount charged: {formatHKD(subtotal)}</p>
        </div>
        <form className="form-stack" onSubmit={handlePay}>
          <textarea
            rows={3}
            placeholder="Shipping address (Hong Kong)"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Pay now (test)
          </button>
          {message ? <p className="ok">{message}</p> : null}
        </form>
      </div>
    </section>
  );
}
