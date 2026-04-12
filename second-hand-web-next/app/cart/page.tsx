"use client";

import Link from "next/link";
import { useState } from "react";
import { AppNav } from "@/components/app-nav";
import {
  getCart,
  getProductAvailableQuantity,
  getProducts,
  updateCartItemQuantity,
} from "@/lib/mvp-data";
import { formatHKD } from "@/lib/format";

export default function CartPage() {
  const [, setVersion] = useState(0);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const products = getProducts();
  const cartItems = getCart();

  const rows = cartItems
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return null;
      return {
        product,
        quantity: item.quantity,
        maxQuantity: getProductAvailableQuantity(item.productId),
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        product: (typeof products)[number];
        quantity: number;
        maxQuantity: number;
      } => Boolean(entry),
    );

  const subtotal = rows.reduce(
    (sum, row) => sum + row.product.price * row.quantity,
    0,
  );

  const updateQty = (productId: string, quantity: number) => {
    const maxAllowed = getProductAvailableQuantity(productId);
    const nextQuantity = updateCartItemQuantity(productId, quantity);

    if (quantity > maxAllowed && maxAllowed > 0) {
      setCartMessage(
        `Only ${maxAllowed} item${maxAllowed > 1 ? "s" : ""} available for this listing.`,
      );
    } else if (quantity > 0 && nextQuantity === 0) {
      setCartMessage(
        "This listing is no longer available and was removed from your cart.",
      );
    } else {
      setCartMessage(null);
    }

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
                      <span className="muted">
                        Available: {row.maxQuantity}
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
                        disabled={row.quantity >= row.maxQuantity}
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
              {cartMessage ? <p className="detail-msg">{cartMessage}</p> : null}
            </div>

            <div className="cart-footer">
              <span className="price">Subtotal: {formatHKD(subtotal)}</span>
              <Link href="/checkout" className="btn btn-fill">
                Proceed to checkout
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
