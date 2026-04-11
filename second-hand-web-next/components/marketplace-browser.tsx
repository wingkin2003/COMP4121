"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { AppNav } from "@/components/app-nav";
import { getBuyOrders, getProducts } from "@/lib/mvp-data";
import { formatHKD, formatHKDate } from "@/lib/format";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  BuyOrder,
  Product,
  ProductCategory,
  ProductCondition,
} from "@/lib/mvp-types";

type MarketplaceMode = "sell" | "buy";

type MarketplaceBrowserProps = {
  mode: MarketplaceMode;
};

type SellSortMode = "newest" | "oldest" | "price-asc" | "price-desc";
type BuySortMode = "newest" | "oldest" | "budget-asc" | "budget-desc";

const BUY_CATEGORY_OPTIONS: ProductCategory[] = PRODUCT_CATEGORIES;
const BUY_CONDITION_OPTIONS: ProductCondition[] = PRODUCT_CONDITIONS;

export function MarketplaceBrowser({ mode }: MarketplaceBrowserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | ProductCategory>("All");
  const [condition, setCondition] = useState<"All" | ProductCondition>("All");
  const [sellSortBy, setSellSortBy] = useState<SellSortMode>("newest");
  const [buySortBy, setBuySortBy] = useState<BuySortMode>("newest");
  const [products] = useState<Product[]>(() => getProducts());
  const [orders] = useState<BuyOrder[]>(() => getBuyOrders());

  const sellFiltered = useMemo(() => {
    return [...products]
      .filter((product) => !product.status || product.status === "selling")
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
        if (sellSortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sellSortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sellSortBy === "price-asc") {
          return a.price - b.price;
        }
        return b.price - a.price;
      });
  }, [products, query, category, condition, sellSortBy]);

  const buyFiltered = useMemo(() => {
    return [...orders]
      .filter((order) => order.status === "open")
      .filter((order) =>
        order.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
      .filter((order) =>
        category === "All" ? true : order.category === category,
      )
      .filter((order) =>
        condition === "All" ? true : order.condition === condition,
      )
      .sort((a, b) => {
        if (buySortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (buySortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (buySortBy === "budget-asc") {
          return a.budget - b.budget;
        }
        return b.budget - a.budget;
      });
  }, [orders, query, category, condition, buySortBy]);

  const isSell = mode === "sell";
  const itemsEmpty = isSell ? sellFiltered.length === 0 : buyFiltered.length === 0;

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="marketplace-header">
          <h1>Marketplace</h1>
          <p className="muted">
            {isSell
              ? "Discover second-hand listings across Hong Kong."
              : "Browse buy requests posted by customers."}
          </p>
          <div className="marketplace-tabs">
            <Link
              href="/marketplace/sell"
              className={`marketplace-tab${isSell ? " active" : ""}`}
              aria-current={isSell ? "page" : undefined}
            >
              Sell
            </Link>
            <Link
              href="/marketplace/buy"
              className={`marketplace-tab${!isSell ? " active" : ""}`}
              aria-current={!isSell ? "page" : undefined}
            >
              Buy
            </Link>
          </div>
          <div className="filters">
            <input
              type="search"
              placeholder={isSell ? "Search by title..." : "Search by request title..."}
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
              {BUY_CATEGORY_OPTIONS.map((item) => (
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
              {BUY_CONDITION_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {isSell ? (
              <select
                value={sellSortBy}
                onChange={(event) => setSellSortBy(event.target.value as SellSortMode)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
              </select>
            ) : (
              <select
                value={buySortBy}
                onChange={(event) => setBuySortBy(event.target.value as BuySortMode)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="budget-asc">Budget low to high</option>
                <option value="budget-desc">Budget high to low</option>
              </select>
            )}
          </div>
        </div>

        {itemsEmpty ? (
          <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>
            {isSell ? "No products matched your filters." : "No buy requests matched your filters."}
          </p>
        ) : isSell ? (
          <div className="grid-cards">
            {sellFiltered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="request-grid">
            {buyFiltered.map((order) => (
              <article key={order.id} className="request-card">
                <div className="request-card-top">
                  <div>
                    <h3>{order.title}</h3>
                    <p className="muted">
                      {order.category} · {order.condition}
                    </p>
                  </div>
                  <span className="request-budget">{formatHKD(order.budget)}</span>
                </div>
                {order.image ? (
                  <img src={order.image} alt={order.title} className="request-img" />
                ) : (
                  <p className="request-no-image">No reference image provided.</p>
                )}
                <p className="request-desc">{order.description}</p>
                <div className="request-meta">
                  <span>{order.location || "—"}</span>
                  <span>{order.buyerName || "Anonymous"}</span>
                  <span>{formatHKDate(order.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}