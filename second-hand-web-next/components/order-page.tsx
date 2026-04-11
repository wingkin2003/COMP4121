"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { addBuyOrder, addProduct, getCurrentAccount } from "@/lib/mvp-data";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  ProductCategory,
  ProductCondition,
} from "@/lib/mvp-types";

type OrderMode = "sell" | "buy";

type OrderPageProps = {
  mode: OrderMode;
};

export function OrderPage({ mode }: OrderPageProps) {
  const isSell = mode === "sell";

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
          : "Please provide a title and valid budget.",
      );
      return;
    }

    if (isSell) {
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
    if (fileRef.current) fileRef.current.value = "";
    setResult(isSell ? "Listing created! Redirecting..." : "Buy request created! Redirecting...");

    setTimeout(() => {
      window.location.href = isSell ? "/marketplace/sell" : "/marketplace/buy";
    }, 1500);
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="section-header">
          <h1>{isSell ? "Create listing" : "Post buy request"}</h1>
          <p className="muted">
            {isSell
              ? "Post a second-hand item and start earning."
              : "Tell sellers what you want and your target budget."}
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
              className={`order-tab${!isSell ? " active" : ""}`}
              aria-current={!isSell ? "page" : undefined}
            >
              Buy
            </Link>
          </div>
        </div>

        <div className="content-card">
          <form className="sell-form" onSubmit={handleSubmit}>
            <label>
              {isSell ? "Title" : "Request title"}
              <input
                type="text"
                placeholder={isSell ? "e.g. iPhone 14 Pro" : "e.g. Looking for a used iPad"}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label>
              {isSell ? "Description" : "Details"}
              <textarea
                placeholder={isSell ? "Describe your item..." : "Describe the item you want..."}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
              />
            </label>

            <label>
              {isSell ? "Product photo" : "Reference image (optional)"}
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
              {isSell ? "Price (HKD)" : "Budget (HKD)"}
              <input
                type="number"
                min={1}
                placeholder="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>

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
              {isSell ? "Pickup location" : "Preferred location"}
              <input
                type="text"
                placeholder="e.g. Mong Kok"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>

            <label>
              {isSell ? "Seller name" : "Buyer name"}
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>

            <button className="btn btn-fill" type="submit">
              {isSell ? "Publish listing" : "Publish buy request"}
            </button>
            {result && <p className="detail-msg">{result}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}