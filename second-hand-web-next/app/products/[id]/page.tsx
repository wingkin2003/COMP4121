"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { addToCart, getProducts } from "@/lib/mvp-data";
import { formatHKD, formatHKDate } from "@/lib/format";
import { Product } from "@/lib/mvp-types";
import { CommentSection } from "@/components/CommentSection";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const found = getProducts().find((entry) => entry.id === id) ?? null;
    setProduct(found);
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return (
      <div className="page-shell">
        <AppNav />
        <main className="page-content" />
      </div>
    );
  }

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
          <div className="detail-left">
            {product.image ? (
              <img src={product.image} alt={product.title} className="detail-img" />
            ) : (
              <div className="detail-thumb">{product.category}</div>
            )}
          </div>
          <div className="detail-right">
            <h1>{product.title}</h1>
            <p className="price">{formatHKD(product.price)}</p>
            {product.description && (
              <p className="detail-desc">{product.description}</p>
            )}
            <table className="detail-table">
              <tbody>
                <tr><td className="detail-label">Condition</td><td>{product.condition}</td></tr>
                <tr><td className="detail-label">Location</td><td>{product.location || "—"}</td></tr>
                <tr><td className="detail-label">Listed</td><td>{formatHKDate(product.createdAt)}</td></tr>
                <tr><td className="detail-label">Seller</td><td>{product.sellerName || "—"}</td></tr>
              </tbody>
            </table>
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
        <CommentSection productId={product.id} />
      </main>
    </div>
  );
}

