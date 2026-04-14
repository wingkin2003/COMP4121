"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import {
  getCartWithDetails,
  updateCartItem,
  removeCartItem,
  type CartItemDetail,
} from "@/lib/api-helpers";
import { formatHKD } from "@/lib/format";

export default function CartPage() {
  const [rows, setRows] = useState<CartItemDetail[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const loadCart = async () => {
    try {
      const data = await getCartWithDetails();
      setRows(data.items);
      setSubtotal(data.subtotal);
    } catch {
      setRows([]);
      setSubtotal(0);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    void loadCart();
  }, []);

  const updateQty = async (productId: string, quantity: number) => {
    try {
      await updateCartItem(productId, quantity);
      await loadCart();
    } catch {
      /* ignore */
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await removeCartItem(productId);
      await loadCart();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="section-header">
          <h1>Your cart</h1>
        </div>

        {!loaded ? (
          <div className="content-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <p className="muted">Loading cart...</p>
          </div>
        ) : rows.length === 0 ? (
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
                  <div key={row.productId} className="cart-item">
                    <div className="cart-item-info">
                      <strong>{row.title}</strong>
                      {row.type === "product" && (
                        <span className="muted">
                          {formatHKD(row.price)} each
                        </span>
                      )}
                      {row.type === "mystery_box" && (
                        <span className="muted">
                          Mystery Box · {formatHKD(row.price)} each
                        </span>
                      )}
                      {row.type === "rental" && (
                        <span className="muted">
                          {formatHKD(row.dailyPrice)}/day × {row.days} day{row.days !== 1 ? "s" : ""}
                          {row.deposit > 0 ? ` + ${formatHKD(row.deposit)} deposit` : ""}
                          {" · "}{row.startDate} → {row.endDate}
                          {row.location ? ` · ${row.location}` : ""}
                        </span>
                      )}
                    </div>
                    {row.type === "product" ? (
                      <div className="cart-qty">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            updateQty(row.productId, row.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span className="qty-num">{row.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() =>
                            updateQty(row.productId, row.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    ) : row.type === "mystery_box" ? (
                      <div className="cart-qty">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            updateQty(row.productId, row.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span className="qty-num">{row.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() =>
                            updateQty(row.productId, row.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="cart-qty">
                        <button
                          className="qty-btn"
                          onClick={() => removeItem(row.productId)}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <div className="cart-item-total">
                      {formatHKD(row.price * row.quantity)}
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
