"use client";

import Link from "next/link";
import { useState } from "react";
import { getCart, getProducts, setCart } from "@/lib/mvp-data";
import { formatHKD } from "@/lib/format";

export default function CartPage() {
  const [, setVersion] = useState(0);
  const products = getProducts();
  const cartItems = getCart();

  const rows = cartItems
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

  const updateQty = (productId: string, quantity: number) => {
    const next = getCart()
      .map((item) => (item.productId === productId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);
    setCart(next);
    setVersion((value) => value + 1);
  };

  return (
    <section className="stack">
      <div className="card">
        <h1>Your cart</h1>
        {rows.length === 0 ? (
          <p>
            Cart is empty. <Link href="/marketplace">Browse marketplace</Link>
          </p>
        ) : (
          <>
            <div className="table">
              {rows.map((row) => (
                <div key={row.product.id} className="table-row">
                  <div>
                    <strong>{row.product.title}</strong>
                    <p className="muted">{formatHKD(row.product.price)} each</p>
                  </div>
                  <div className="qty">
                    <button
                      className="btn btn-secondary"
                      onClick={() => updateQty(row.product.id, row.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{row.quantity}</span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => updateQty(row.product.id, row.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="price">Subtotal: {formatHKD(subtotal)}</p>
            <Link href="/checkout" className="btn btn-primary">
              Proceed to checkout
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
