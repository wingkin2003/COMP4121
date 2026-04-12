"use client";

import Link from "next/link";
import { useState } from "react";
import { AppNav } from "@/components/app-nav";
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

  const updateQty = (productId: string, quantity: number) => {
    const next = getCart()
      .map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      )
      .filter((item) => item.quantity > 0);
    setCart(next);
    setVersion((value) => value + 1);
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="section-header">
          <h1>Your cart</h1>
        </div>

        {rows.length === 0 ? (
          <div
            className="content-card"
            style={{ textAlign: "center", padding: "3rem 1rem" }}
          >
            <p>Cart is empty.</p>
            <Link
              href="/marketplace"
              className="btn"
              style={{ marginTop: "1rem" }}
            >
              Browse marketplace
            </Link>
          </div>
        ) : (
          <>
            <div className="content-card">
              <div className="cart-list">
                {rows.map((row) => (
                  <div key={row.product.id} className="cart-item">
                    <div className="cart-item-info">
                      <strong>{row.product.title}</strong>
                      <span className="muted">
                        {formatHKD(row.product.price)} each
                      </span>
                    </div>
                    <div className="cart-qty">
                      <button
                        className="qty-btn"
                        onClick={() =>
                          updateQty(row.product.id, row.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="qty-num">{row.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() =>
                          updateQty(row.product.id, row.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-total">
                      {formatHKD(row.product.price * row.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cart-footer">
              <span className="price">Subtotal: {formatHKD(subtotal)}</span>
              <Link href="/checkout" className="btn btn-fill">
                Proceed to Stripe checkout
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
