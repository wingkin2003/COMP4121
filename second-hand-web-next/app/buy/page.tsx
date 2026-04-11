"use client";

import { FormEvent, useRef, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { addBuyOrder, getCurrentAccount } from "@/lib/mvp-data";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  ProductCategory,
  ProductCondition,
} from "@/lib/mvp-types";

export default function BuyPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Electronics");
  const [condition, setCondition] = useState<ProductCondition>("Good");
  const [location, setLocation] = useState("");
  const [buyerName, setBuyerName] = useState("");
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
    const numericBudget = Number(budget);
    if (!title || Number.isNaN(numericBudget) || numericBudget <= 0) {
      setResult("Please provide a title and valid budget.");
      return;
    }

    addBuyOrder({
      id: crypto.randomUUID(),
      title,
      description,
      budget: numericBudget,
      category,
      condition,
      image: imagePreview || "",
      location,
      buyerName,
      buyerAccount: getCurrentAccount(),
      status: "open",
      createdAt: new Date().toISOString(),
    });

    setTitle("");
    setDescription("");
    setBudget("");
    setBuyerName("");
    setLocation("");
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setResult("Buy request created! Redirecting...");
    setTimeout(() => {
      window.location.href = "/marketplace/buy";
    }, 1500);
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="section-header">
          <h1>Post buy request</h1>
          <p className="muted">Tell sellers what you want and your target budget.</p>
        </div>

        <div className="content-card">
          <form className="sell-form" onSubmit={handleSubmit}>
            <label>
              Request title
              <input
                type="text"
                placeholder="e.g. Looking for a used iPad"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Details
              <textarea
                placeholder="Describe the item you want..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
              />
            </label>
            <label>
              Reference image (optional)
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
              Budget (HKD)
              <input
                type="number"
                min={1}
                placeholder="0"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
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
              Preferred location
              <input
                type="text"
                placeholder="e.g. Mong Kok"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>
            <label>
              Buyer name
              <input
                type="text"
                placeholder="Your name"
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
              />
            </label>
            <button className="btn btn-fill" type="submit">
              Publish buy request
            </button>
            {result && <p className="detail-msg">{result}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}