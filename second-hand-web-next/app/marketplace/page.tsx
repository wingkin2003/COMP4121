"use client";

import { useMemo, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/mvp-data";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  ProductCategory,
  ProductCondition,
} from "@/lib/mvp-types";

type SortMode = "newest" | "oldest" | "price-asc" | "price-desc";

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | ProductCategory>("All");
  const [condition, setCondition] = useState<"All" | ProductCondition>("All");
  const [sortBy, setSortBy] = useState<SortMode>("newest");

  const products = useMemo(() => getProducts(), []);

  const filtered = useMemo(() => {
    return [...products]
      .filter((product) =>
        product.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
      .filter((product) =>
        category === "All" ? true : product.category === category,
      )
      .filter((product) =>
        condition === "All" ? true : product.condition === condition,
      )
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "price-asc") {
          return a.price - b.price;
        }
        return b.price - a.price;
      });
  }, [products, query, category, condition, sortBy]);

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="marketplace-header">
          <h1>Marketplace</h1>
          <p className="muted">Discover second-hand listings across Hong Kong.</p>
          <div className="filters">
            <input
              type="search"
              placeholder="Search by title..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as "All" | ProductCategory)
              }
            >
              <option value="All">All categories</option>
              {PRODUCT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={condition}
              onChange={(event) =>
                setCondition(event.target.value as "All" | ProductCondition)
              }
            >
              <option value="All">All conditions</option>
              {PRODUCT_CONDITIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortMode)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>
            No products matched your filters.
          </p>
        ) : (
          <div className="grid-cards">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

