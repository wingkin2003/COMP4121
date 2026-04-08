"use client";

import { FormEvent, useRef, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { addProduct, getCurrentAccount } from "@/lib/mvp-data";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  ProductCategory,
  ProductCondition,
} from "@/lib/mvp-types";

export default function SellPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Electronics");
  const [condition, setCondition] = useState<ProductCondition>("Good");
  const [location, setLocation] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    const numericPrice = Number(price);
    if (!title || Number.isNaN(numericPrice) || numericPrice <= 0) {
      setResult("Please provide a title and valid price.");
      return;
    }

    addProduct({
      id: crypto.randomUUID(),
      title,
      description,
      price: numericPrice,
      category,
      condition,
      image: imagePreview || "",
      location,
      sellerName,
      sellerAccount: getCurrentAccount(),
      status: "selling",
      likes: 0,
      createdAt: new Date().toISOString(),
    });

    setTitle("");
    setDescription("");
    setPrice("");
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setResult("Listing created! Redirecting...");
    setTimeout(() => {
      window.location.href = "/marketplace";
    }, 1500);
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="section-header">
          <h1>Create listing</h1>
          <p className="muted">Post a second-hand item and start earning.</p>
        </div>

        <div className="content-card">
          <form className="sell-form" onSubmit={handleSubmit}>
            <label>
              Title
              <input
                type="text"
                placeholder="e.g. iPhone 14 Pro"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                placeholder="Describe your item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </label>
            <label>
              Product photo
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
            {imagePreview && (
              <div className="img-preview-wrap">
                <img src={imagePreview} alt="Preview" className="img-preview" />
                <button type="button" className="img-remove" onClick={removeImage}>Remove</button>
              </div>
            )}
            <label>
              Price (HKD)
              <input
                type="number"
                min={1}
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <div className="sell-row">
              <label>
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                >
                  {PRODUCT_CATEGORIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                Condition
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ProductCondition)}
                >
                  {PRODUCT_CONDITIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Pickup location
              <input
                type="text"
                placeholder="e.g. Mong Kok"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
            <label>
              Seller name
              <input
                type="text"
                placeholder="Your name"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
              />
            </label>
            <button className="btn btn-fill" type="submit">
              Publish listing
            </button>
            {result && <p className="detail-msg">{result}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}

