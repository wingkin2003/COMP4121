"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { AppNav } from "@/components/app-nav";
import {
  getProducts,
  getBuyOrders,
  getRentalRequests,
  getRentals,
} from "@/lib/api-helpers";
import { formatHKD, formatHKDate } from "@/lib/format";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  SUSTAINABILITY_TAGS,
  BuyOrder,
  Product,
  ProductCategory,
  ProductCondition,
  RentalListing,
  RentalRequest,
  SustainabilityTag,
} from "@/lib/mvp-types";

type MarketplaceMode = "sell" | "buy" | "rent" | "rent-request";

type MarketplaceBrowserProps = {
  mode: MarketplaceMode;
};

type SellSortMode = "newest" | "oldest" | "price-asc" | "price-desc";
type BuySortMode = "newest" | "oldest" | "budget-asc" | "budget-desc";
type RentSortMode = "newest" | "oldest" | "daily-asc" | "daily-desc";
type RentRequestSortMode = "newest" | "oldest" | "budget-asc" | "budget-desc";

const BUY_CATEGORY_OPTIONS: ProductCategory[] = PRODUCT_CATEGORIES;
const BUY_CONDITION_OPTIONS: ProductCondition[] = PRODUCT_CONDITIONS;

export function MarketplaceBrowser({ mode }: MarketplaceBrowserProps) {
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | ProductCategory>("All");
  const [condition, setCondition] = useState<"All" | ProductCondition>("All");
  const [sustainabilityTag, setSustainabilityTag] = useState<
    "All" | SustainabilityTag
  >("All");
  const [sellSortBy, setSellSortBy] = useState<SellSortMode>("newest");
  const [buySortBy, setBuySortBy] = useState<BuySortMode>("newest");
  const [rentSortBy, setRentSortBy] = useState<RentSortMode>("newest");
  const [rentRequestSortBy, setRentRequestSortBy] = useState<RentRequestSortMode>("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<BuyOrder[]>([]);
  const [rentals, setRentals] = useState<RentalListing[]>([]);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [p, o, r, rr] = await Promise.all([
          getProducts({ status: "selling" }),
          getBuyOrders({ status: "open" }),
          getRentals({ status: "available" }),
          getRentalRequests({ status: "open" }),
        ]);
        if (!cancelled) {
          setProducts(p);
          setOrders(o);
          setRentals(r);
          setRentalRequests(rr);
          setHydrated(true);
        }
      } catch {
        if (!cancelled) setHydrated(true);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const sellFiltered = useMemo(() => {
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
      .filter((product) =>
        sustainabilityTag === "All"
          ? true
          : product.sustainabilityTag === sustainabilityTag,
      )
      .sort((a, b) => {
        if (sellSortBy === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        if (sellSortBy === "oldest") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        if (sellSortBy === "price-asc") {
          return a.price - b.price;
        }
        return b.price - a.price;
      });
  }, [products, query, category, condition, sustainabilityTag, sellSortBy]);

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
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        if (buySortBy === "oldest") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        if (buySortBy === "budget-asc") {
          return a.budget - b.budget;
        }
        return b.budget - a.budget;
      });
  }, [orders, query, category, condition, buySortBy]);

  const rentFiltered = useMemo(() => {
    return [...rentals]
      .filter((r) => r.status === "available")
      .filter((r) => r.title.toLowerCase().includes(query.trim().toLowerCase()))
      .filter((r) => (category === "All" ? true : r.category === category))
      .filter((r) => (condition === "All" ? true : r.condition === condition))
      .sort((a, b) => {
        if (rentSortBy === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        if (rentSortBy === "oldest") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        if (rentSortBy === "daily-asc") {
          return a.dailyPrice - b.dailyPrice;
        }
        return b.dailyPrice - a.dailyPrice;
      });
  }, [rentals, query, category, condition, rentSortBy]);

  const rentRequestFiltered = useMemo(() => {
    return [...rentalRequests]
      .filter((request) => request.status === "open")
      .filter((request) =>
        request.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
      .filter((request) =>
        category === "All" ? true : request.category === category,
      )
      .filter((request) =>
        condition === "All" ? true : request.condition === condition,
      )
      .sort((a, b) => {
        if (rentRequestSortBy === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        if (rentRequestSortBy === "oldest") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        if (rentRequestSortBy === "budget-asc") {
          return a.dailyBudget - b.dailyBudget;
        }
        return b.dailyBudget - a.dailyBudget;
      });
  }, [rentalRequests, query, category, condition, rentRequestSortBy]);

  const isSell = mode === "sell";
  const isBuy = mode === "buy";
  const isRent = mode === "rent" || mode === "rent-request";
  const isRentRequest = mode === "rent-request";
  const itemsEmpty = isSell
    ? sellFiltered.length === 0
    : isBuy
      ? buyFiltered.length === 0
      : isRentRequest
        ? rentRequestFiltered.length === 0
        : rentFiltered.length === 0;

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="marketplace-header">
          <h1>Marketplace</h1>
          <p className="muted">
            {isSell
              ? "Discover second-hand listings across Hong Kong."
              : isBuy
                ? "Browse buy requests posted by customers."
                : isRentRequest
                  ? "Browse rent requests posted by customers."
                  : "Rent items for short-term use — save money, reduce waste."}
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
              className={`marketplace-tab${isBuy ? " active" : ""}`}
              aria-current={isBuy ? "page" : undefined}
            >
              Buy
            </Link>
            <Link
              href="/marketplace/rent"
              className={`marketplace-tab${isRent ? " active" : ""}`}
              aria-current={isRent ? "page" : undefined}
            >
              Rent
            </Link>
          </div>
          {isRent ? (
            <div className="marketplace-tabs" style={{ marginTop: "0.6rem" }}>
              <Link
                href="/marketplace/rent"
                className={`marketplace-tab${!isRentRequest ? " active" : ""}`}
                aria-current={!isRentRequest ? "page" : undefined}
              >
                Listings
              </Link>
              <Link
                href="/marketplace/rent/request"
                className={`marketplace-tab${isRentRequest ? " active" : ""}`}
                aria-current={isRentRequest ? "page" : undefined}
              >
                Requests
              </Link>
            </div>
          ) : isSell ? (
            <div className="marketplace-tabs" style={{ marginTop: "0.6rem" }}>
              <button
                className={`marketplace-tab${sustainabilityTag === "All" ? " active" : ""}`}
                onClick={() => setSustainabilityTag("All")}
              >
                All
              </button>
              <button
                className={`marketplace-tab${sustainabilityTag === "Recyclable" ? " active" : ""}`}
                onClick={() => setSustainabilityTag("Recyclable")}
              >
                Recyclable
              </button>
              <button
                className={`marketplace-tab${sustainabilityTag === "Upcycled" ? " active" : ""}`}
                onClick={() => setSustainabilityTag("Upcycled")}
              >
                Upcycled
              </button>
            </div>
          ) : null}
          <div className="filters">
            <input
              type="search"
              placeholder={
                isSell
                  ? "Search by title..."
                  : isBuy
                    ? "Search by request title..."
                    : isRentRequest
                      ? "Search by rent request title..."
                      : "Search rentals..."
              }
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
                onChange={(event) =>
                  setSellSortBy(event.target.value as SellSortMode)
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
              </select>
            ) : isBuy ? (
              <select
                value={buySortBy}
                onChange={(event) =>
                  setBuySortBy(event.target.value as BuySortMode)
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="budget-asc">Budget low to high</option>
                <option value="budget-desc">Budget high to low</option>
              </select>
            ) : isRentRequest ? (
              <select
                value={rentRequestSortBy}
                onChange={(event) =>
                  setRentRequestSortBy(
                    event.target.value as RentRequestSortMode,
                  )
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="budget-asc">Budget low to high</option>
                <option value="budget-desc">Budget high to low</option>
              </select>
            ) : (
              <select
                value={rentSortBy}
                onChange={(event) =>
                  setRentSortBy(event.target.value as RentSortMode)
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="daily-asc">Daily price low to high</option>
                <option value="daily-desc">Daily price high to low</option>
              </select>
            )}
          </div>
        </div>

        {!hydrated ? (
          <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>
            Loading marketplace...
          </p>
        ) : itemsEmpty ? (
          <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>
            {isSell
              ? "No products matched your filters."
              : isBuy
                ? "No buy requests matched your filters."
                : isRentRequest
                  ? "No rent requests matched your filters."
                  : "No rental listings matched your filters."}
          </p>
        ) : isSell ? (
          <div className="grid-cards">
            {sellFiltered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : isBuy ? (
          <div className="grid-cards">
            {buyFiltered.map((order) => (
              <Link
                key={order.id}
                href={`/marketplace/buy/${order.id}`}
                className="product-card rental-card-link"
              >
                <div className="product-img-wrap">
                  {order.image ? (
                    <img src={order.image} alt={order.title} />
                  ) : (
                    <div className="product-thumb">{order.category}</div>
                  )}
                </div>
                <div className="product-info">
                  <h3>{order.title}</h3>
                  <p className="muted">
                    {order.condition} · {order.location || "—"}
                  </p>
                  <p className="price">{formatHKD(order.budget)}</p>
                  <span className="btn">View details</span>
                </div>
              </Link>
            ))}
          </div>
        ) : isRentRequest ? (
          <div className="grid-cards">
            {rentRequestFiltered.map((request) => (
              <Link
                key={request.id}
                href={`/marketplace/rent/request/${request.id}`}
                className="product-card rental-card rental-card-link"
              >
                <div className="product-img-wrap">
                  {request.image ? (
                    <img src={request.image} alt={request.title} />
                  ) : (
                    <div className="product-thumb">{request.category}</div>
                  )}
                  <span className="rental-badge">RENT REQUEST</span>
                </div>
                <div className="product-info">
                  <h3>{request.title}</h3>
                  <p className="muted">
                    {request.category} · {request.condition}
                  </p>
                  <div className="rental-pricing">
                    <span className="rental-daily">{formatHKD(request.dailyBudget)}<small>/day</small></span>
                  </div>
                  <p className="muted" style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                    {request.minDays}–{request.maxDays} days · {request.location || "—"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid-cards">
            {rentFiltered.map((rental) => (
              <Link
                key={rental.id}
                href={`/rentals/${rental.id}`}
                className="product-card rental-card rental-card-link"
              >
                <div className="product-img-wrap">
                  {rental.image ? (
                    <img src={rental.image} alt={rental.title} />
                  ) : (
                    <div className="product-thumb">
                      {rental.category}
                    </div>
                  )}
                  <span className="rental-badge">FOR RENT</span>
                </div>
                <div className="product-info">
                  <h3>{rental.title}</h3>
                  <p className="muted">
                    {rental.category} · {rental.condition}
                  </p>
                  <div className="rental-pricing">
                    <span className="rental-daily">
                      {formatHKD(rental.dailyPrice)}
                      <small>/day</small>
                    </span>
                    <span className="muted">
                      Deposit: {formatHKD(rental.deposit)}
                    </span>
                  </div>
                  <p
                    className="muted"
                    style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}
                  >
                    {rental.minDays}–{rental.maxDays} days ·{" "}
                    {rental.location || "—"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
