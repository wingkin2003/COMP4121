"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { addToCart, getProducts } from "@/lib/mvp-data";
import { formatHKD, formatHKDate } from "@/lib/format";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState<string | null>(null);

  const product = useMemo(
    () => getProducts().find((entry) => entry.id === id),
    [id],
  );

  if (!product) {
    return (
      <div className="page-shell">
        <AppNav />
        <main className="page-content">
          <div className="detail-empty">
            <h1>Product not found</h1>
            <Link href="/marketplace" className="btn">
              Back to marketplace
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleAdd = () => {
    addToCart(product.id);
    setMessage("Added to cart.");
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <Link href="/marketplace" className="back-link">← Back to marketplace</Link>
        <div className="detail-card">
          <div className="detail-thumb">{product.category}</div>
          <div className="detail-body">
            <h1>{product.title}</h1>
            <p className="price">{formatHKD(product.price)}</p>
            <p className="detail-desc">{product.description}</p>
            <div className="detail-meta">
              <span>{product.condition}</span>
              <span>{product.location}</span>
              <span>Listed {formatHKDate(product.createdAt)}</span>
              <span>Seller: {product.sellerName}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-fill" onClick={handleAdd}>
                Add to cart
              </button>
              <Link href="/cart" className="btn">
                Go to cart
              </Link>
            </div>
            {message && <p className="detail-msg">{message}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

