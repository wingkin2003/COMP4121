"use client";

import { FormEvent, useState } from "react";
import { addProduct } from "@/lib/mvp-data";
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
  const [location, setLocation] = useState("Central");
  const [sellerName, setSellerName] = useState("New Seller");
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericPrice = Number(price);
    if (!title || !description || Number.isNaN(numericPrice) || numericPrice <= 0) {
      setResult("Please complete all fields with a valid price.");
      return;
    }

    addProduct({
      id: crypto.randomUUID(),
      title,
      description,
      price: numericPrice,
      category,
      condition,
      image: "/file.svg",
      location,
      sellerName,
      createdAt: new Date().toISOString(),
    });

    setTitle("");
    setDescription("");
    setPrice("");
    setResult("Listing created successfully.");
  };

  return (
    <section className="stack">
      <div className="card">
        <h1>Create listing</h1>
        <p className="muted">
          Post a second-hand item and start earning in the circular economy.
        </p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <input
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
          />
          <input
            type="number"
            min={1}
            placeholder="Price (HKD)"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
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
          <select
            value={condition}
            onChange={(event) =>
              setCondition(event.target.value as ProductCondition)
            }
          >
            {PRODUCT_CONDITIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            placeholder="Pickup location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
          <input
            placeholder="Seller name"
            value={sellerName}
            onChange={(event) => setSellerName(event.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Publish listing
          </button>
          {result ? <p className="ok">{result}</p> : null}
        </form>
      </div>
    </section>
  );
}

