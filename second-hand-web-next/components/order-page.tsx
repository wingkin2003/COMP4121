"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { addBuyOrder, addProduct, addRental, addRentalRequest, getCurrentAccount } from "@/lib/mvp-data";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  ProductCategory,
  ProductCondition,
} from "@/lib/mvp-types";

type OrderMode = "sell" | "buy" | "rent" | "rent-request";

type OrderPageProps = {
  mode: OrderMode;
};

export function OrderPage({ mode }: OrderPageProps) {
  const isSell = mode === "sell";
  const isBuy = mode === "buy";
  const isRent = mode === "rent" || mode === "rent-request";
  const isRentRequest = mode === "rent-request";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Electronics");
  const [condition, setCondition] = useState<ProductCondition>("Good");
  const [location, setLocation] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Rental-specific fields
  const [deposit, setDeposit] = useState("");
  const [minDays, setMinDays] = useState("1");
  const [maxDays, setMaxDays] = useState("7");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!title || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setResult(
        isSell
          ? "Please provide a title and valid price."
          : isBuy
          ? "Please provide a title and valid budget."
          : "Please provide a title and valid daily rental price.",
      );
      return;
    }

    if (isRent && !isRentRequest) {
      const numDeposit = Number(deposit);
      if (Number.isNaN(numDeposit) || numDeposit <= 0) {
        setResult("Please provide a valid deposit amount.");
        return;
      }
      addRental({
        id: crypto.randomUUID(),
        title,
        description,
        dailyPrice: numericAmount,
        deposit: numDeposit,
        minDays: Math.max(1, Number(minDays) || 1),
        maxDays: Math.max(1, Number(maxDays) || 7),
        category,
        condition,
        image: imagePreview || "",
        location,
        ownerName: displayName,
        ownerAccount: getCurrentAccount(),
        status: "available",
        likes: 0,
        createdAt: new Date().toISOString(),
      });
    } else if (isRentRequest) {
      addRentalRequest({
        id: crypto.randomUUID(),
        title,
        description,
        dailyBudget: numericAmount,
        minDays: Math.max(1, Number(minDays) || 1),
        maxDays: Math.max(1, Number(maxDays) || 7),
        category,
        condition,
        image: imagePreview || "",
        location,
        requesterName: displayName,
        requesterAccount: getCurrentAccount(),
        status: "open",
        createdAt: new Date().toISOString(),
      });
    } else if (isSell) {
      addProduct({
        id: crypto.randomUUID(),
        title,
        description,
        price: numericAmount,
        category,
        condition,
        image: imagePreview || "",
        location,
        sellerName: displayName,
        sellerAccount: getCurrentAccount(),
        status: "selling",
        likes: 0,
        createdAt: new Date().toISOString(),
      });
    } else {
      addBuyOrder({
        id: crypto.randomUUID(),
        title,
        description,
        budget: numericAmount,
        category,
        condition,
        image: imagePreview || "",
        location,
        buyerName: displayName,
        buyerAccount: getCurrentAccount(),
        status: "open",
        createdAt: new Date().toISOString(),
      });
    }

    setTitle("");
    setDescription("");
    setAmount("");
    setDisplayName("");
    setLocation("");
    setImagePreview(null);
    setDeposit("");
    setMinDays("1");
    setMaxDays("7");
    if (fileRef.current) fileRef.current.value = "";
    setResult(
      isSell
        ? "Listing created! Redirecting..."
        : isBuy
        ? "Buy request created! Redirecting..."
        : isRentRequest
        ? "Rent request created! Redirecting..."
        : "Rental listing created! Redirecting...",
    );

    setTimeout(() => {
      window.location.href = isSell
        ? "/marketplace/sell"
        : isBuy
        ? "/marketplace/buy"
        : isRentRequest
        ? "/marketplace/rent/request"
        : "/marketplace/rent";
    }, 1500);
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="section-header">
          <h1>
            {isSell
              ? "Create listing"
              : isBuy
              ? "Post buy request"
              : isRentRequest
              ? "Post rent request"
              : "Create rental listing"}
          </h1>
          <p className="muted">
            {isSell
              ? "Post a second-hand item and start earning."
              : isBuy
              ? "Tell sellers what you want and your target budget."
              : isRentRequest
              ? "Post what you need to rent and your daily budget target."
              : "List an item for short-term rental and earn while it's not in use."}
          </p>
          <div className="order-tabs">
            <Link
              href="/order/sell"
              className={`order-tab${isSell ? " active" : ""}`}
              aria-current={isSell ? "page" : undefined}
            >
              Sell
            </Link>
            <Link
              href="/order/buy"
              className={`order-tab${isBuy ? " active" : ""}`}
              aria-current={isBuy ? "page" : undefined}
            >
              Buy
            </Link>
            <Link
              href="/order/rent"
              className={`order-tab${isRent ? " active" : ""}`}
              aria-current={isRent ? "page" : undefined}
            >
              Rent
            </Link>
            <Link
              href="/order/mystery-box"
              className="order-tab"
            >
              Mystery Box
            </Link>
          </div>
          {isRent ? (
            <div className="order-tabs" style={{ marginTop: "0.6rem" }}>
              <Link
                href="/order/rent"
                className={`order-tab${!isRentRequest ? " active" : ""}`}
                aria-current={!isRentRequest ? "page" : undefined}
              >
                Listing
              </Link>
              <Link
                href="/order/rent/request"
                className={`order-tab${isRentRequest ? " active" : ""}`}
                aria-current={isRentRequest ? "page" : undefined}
              >
                Request
              </Link>
            </div>
          ) : null}
        </div>

        <div className="content-card">
          <form className="sell-form" onSubmit={handleSubmit}>
            <label>
              {isSell ? "Title" : isBuy || isRentRequest ? "Request title" : "Rental item title"}
              <input
                type="text"
                placeholder={
                  isSell
                    ? "e.g. iPhone 14 Pro"
                    : isBuy
                    ? "e.g. Looking for a used iPad"
                    : isRentRequest
                    ? "e.g. Looking for DSLR camera rental"
                    : "e.g. Sony Camera for weekend rental"
                }
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label>
              {isSell ? "Description" : isBuy || isRentRequest ? "Details" : "Description"}
              <textarea
                placeholder={
                  isSell
                    ? "Describe your item..."
                    : isBuy
                    ? "Describe the item you want..."
                    : isRentRequest
                    ? "Describe what you need, required features, expected timeline..."
                    : "Describe the rental item, what's included, condition notes..."
                }
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
              />
            </label>

            <label>
              {isSell ? "Product photo" : isBuy || isRentRequest ? "Reference image (optional)" : "Item photo"}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} />
            </label>

            {imagePreview && (
              <div className="img-preview-wrap">
                <img src={imagePreview} alt="Preview" className="img-preview" />
                <button type="button" className="img-remove" onClick={removeImage}>
                  Remove
                </button>
              </div>
            )}

            <label>
              {isSell ? "Price (HKD)" : isBuy ? "Budget (HKD)" : isRentRequest ? "Daily budget (HKD)" : "Daily rental price (HKD)"}
              <input
                type="number"
                min={1}
                placeholder="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>

            {isRent && (
              <>
                {!isRentRequest ? (
                  <label>
                    Deposit (HKD)
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 500"
                      value={deposit}
                      onChange={(event) => setDeposit(event.target.value)}
                    />
                    <span className="muted" style={{ fontSize: "0.8rem" }}>
                      Refundable deposit to secure the item. Typically 20–50% of item value.
                    </span>
                  </label>
                ) : null}
                <div className="sell-row">
                  <label>
                    Min rental days
                    <input
                      type="number"
                      min={1}
                      value={minDays}
                      onChange={(event) => setMinDays(event.target.value)}
                    />
                  </label>
                  <label>
                    Max rental days
                    <input
                      type="number"
                      min={1}
                      value={maxDays}
                      onChange={(event) => setMaxDays(event.target.value)}
                    />
                  </label>
                </div>
              </>
            )}

            <div className="sell-row">
              <label>
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ProductCategory)}
                >
                  {PRODUCT_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Condition
                <select
                  value={condition}
                  onChange={(event) => setCondition(event.target.value as ProductCondition)}
                >
                  {PRODUCT_CONDITIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              {isSell ? "Pickup location" : isBuy || isRentRequest ? "Preferred location" : "Pickup / return location"}
              <input
                type="text"
                placeholder="e.g. Mong Kok"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>

            <label>
              {isSell ? "Seller name" : isBuy ? "Buyer name" : isRentRequest ? "Requester name" : "Owner name"}
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>

            <button className="btn btn-fill" type="submit">
              {isSell
                ? "Publish listing"
                : isBuy
                ? "Publish buy request"
                : isRentRequest
                ? "Publish rent request"
                : "Publish rental listing"}
            </button>
            {result && <p className="detail-msg">{result}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}