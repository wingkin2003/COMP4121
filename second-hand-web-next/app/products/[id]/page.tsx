"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
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
      <section className="stack">
        <div className="card">
          <h1>Product not found</h1>
          <Link href="/marketplace" className="btn btn-secondary">
            Back to marketplace
          </Link>
        </div>
      </section>
    );
  }

  const handleAdd = () => {
    addToCart(product.id);
    setMessage("Added to cart.");
  };

  return (
    <section className="stack">
      <div className="card product-detail">
        <div className="detail-thumb">{product.category}</div>
        <div className="detail-content">
          <h1>{product.title}</h1>
          <p className="price">{formatHKD(product.price)}</p>
          <p>{product.description}</p>
          <p className="muted">
            {product.condition} · {product.location}
          </p>
          <p className="muted">Listed {formatHKDate(product.createdAt)}</p>
          <p className="muted">Seller: {product.sellerName}</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={handleAdd}>
              Add to cart
            </button>
            <Link href="/cart" className="btn btn-secondary">
              Go to cart
            </Link>
          </div>
          {message ? <p className="ok">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}

