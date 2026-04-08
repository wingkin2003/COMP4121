import Link from "next/link";
import { Product } from "@/lib/mvp-types";
import { formatHKD } from "@/lib/format";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-thumb">{product.category}</div>
      <div className="product-info">
        <h3>{product.title}</h3>
        <p className="muted">
          {product.condition} · {product.location}
        </p>
        <p className="price">{formatHKD(product.price)}</p>
        <Link href={`/products/${product.id}`} className="btn">
          View details
        </Link>
      </div>
    </article>
  );
}

