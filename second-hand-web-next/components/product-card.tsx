"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/lib/mvp-types";
import { formatHKD } from "@/lib/format";
import { toggleLike, hasUserLiked } from "@/lib/api-helpers";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(product.likes || 0);

  useEffect(() => {
    hasUserLiked(product.id).then(setLiked).catch(() => { });
  }, [product.id]);

  const handleLike = async () => {
    try {
      const result = await toggleLike(product.id);
      setLiked(result.liked);
      setCount(result.newCount);
    } catch { /* ignore */ }
  };

  return (
    <article className="product-card">
      <div className="product-img-wrap">
        {product.image ? (
          <img src={product.image} alt={product.title} className="product-img" />
        ) : (
          <div className="product-thumb">{product.category}</div>
        )}
      </div>
      <div className="product-info">
        <h3>{product.title}</h3>
        <p className="muted">
          {product.condition} · {product.location}
        </p>
        <p className="price">{formatHKD(product.price)}</p>
        <div className="product-actions">
          <Link href={`/products/${product.id}`} className="btn">
            View details
          </Link>
          <button
            className={`like-btn${liked ? " liked" : ""}`}
            onClick={handleLike}
            title={liked ? "Unlike" : "Like"}
          >
            <span className="like-icon">{liked ? "♥" : "♡"}</span>
            <span className="like-count">{count}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

