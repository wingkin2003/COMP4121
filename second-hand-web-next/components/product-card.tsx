import Link from "next/link";
import { Product } from "@/lib/mvp-types";
import { formatHKD } from "@/lib/format";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="card product-card">
      <div className="product-thumb" aria-hidden>
        {product.category}
      </div>
      <div className="card-body">
        <h3>{product.title}</h3>
        <p className="muted">
          {product.condition} · {product.location}
        </p>
        <p className="price">{formatHKD(product.price)}</p>
        <Link href={`/products/${product.id}`} className="btn btn-secondary">
          View details
        </Link>
      </div>
    </article>
  );
}

