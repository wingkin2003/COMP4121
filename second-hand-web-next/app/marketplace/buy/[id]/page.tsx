"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { addBuyNegotiation, getBuyOrder, getCurrentAccount } from "@/lib/api-helpers";
import { formatHKD, formatHKDate } from "@/lib/format";
import { BuyOrder, ProductCondition, PRODUCT_CONDITIONS } from "@/lib/mvp-types";

const PLATFORM_FEE_RATE = 0.04;

export default function BuyRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<BuyOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sellingItemTitle, setSellingItemTitle] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [condition, setCondition] = useState<ProductCondition>("Good");
  const [meetupLocation, setMeetupLocation] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [offerMode, setOfferMode] = useState<"negotiate" | "sales">("negotiate");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const found = await getBuyOrder(id);
      if (!cancelled) {
        setRequest(found);
        setLoaded(true);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!request) return;
    if (offerMode === "sales") {
      setOfferedPrice(String(request.budget));
    }
  }, [offerMode, request]);

  const salesPricing = useMemo(() => {
    const price = offerMode === "sales" ? request?.budget ?? 0 : Number(offeredPrice);
    if (Number.isNaN(price) || price <= 0) {
      return { offered: 0, platformFee: 0, sellerNet: 0 };
    }
    const platformFee = Math.round(price * PLATFORM_FEE_RATE);
    return {
      offered: price,
      platformFee,
      sellerNet: price - platformFee,
    };
  }, [offeredPrice]);

  const isOwnRequest = request ? getCurrentAccount() === request.buyerAccount : false;

  if (!loaded) {
    return (
      <div className="page-shell">
        <AppNav />
        <main className="page-content" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="page-shell">
        <AppNav />
        <main className="page-content">
          <div className="detail-empty">
            <h1>Buy request not found</h1>
            <Link href="/marketplace/buy" className="btn">
              Back to buy requests
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmitNegotiation = async () => {
    setFormError(null);
    const numericPrice = offerMode === "sales" ? request.budget : Number(offeredPrice);

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setFormError("Please provide a valid offered price.");
      return;
    }
    if (!sellerName.trim()) {
      setFormError("Please provide your name.");
      return;
    }
    if (!sellerPhone.trim()) {
      setFormError("Please provide a contact number.");
      return;
    }
    if (offerMode === "negotiate") {
      if (!sellingItemTitle.trim()) {
        setFormError("Please enter your selling item title.");
        return;
      }
      if (!meetupLocation.trim()) {
        setFormError("Please provide a meetup location.");
        return;
      }
    }

    try {
      await addBuyNegotiation({
        buyOrderId: request.id,
        buyOrderTitle: request.title,
        mode: offerMode,
        sellerAccount: getCurrentAccount(),
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim(),
        sellingItemTitle: offerMode === "sales" ? request.title : sellingItemTitle.trim(),
        offeredPrice: numericPrice,
        condition: offerMode === "sales" ? request.condition : condition,
        meetupLocation: offerMode === "sales" ? request.location || "" : meetupLocation.trim(),
        note: note.trim(),
      });
      setSubmitted(true);
    } catch {
      setFormError("Failed to submit. Please try again.");
    }
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <Link href="/marketplace/buy" className="back-link">&larr; Back to buy requests</Link>
        <div className="detail-card">
          <div className="detail-left">
            {request.image ? (
              <img src={request.image} alt={request.title} className="detail-img" />
            ) : (
              <div className="detail-thumb">{request.category}</div>
            )}
          </div>
          <div className="detail-right">
            <span className="rd-type-badge">Buy Request</span>
            <h1>{request.title}</h1>
            <p className="price">{formatHKD(request.budget)}</p>
            {request.description && <p className="detail-desc">{request.description}</p>}
            <table className="detail-table">
              <tbody>
                <tr><td className="detail-label">Category</td><td>{request.category}</td></tr>
                <tr><td className="detail-label">Condition</td><td>{request.condition}</td></tr>
                <tr><td className="detail-label">Preferred location</td><td>{request.location || "-"}</td></tr>
                <tr><td className="detail-label">Requested by</td><td>{request.buyerName || "Anonymous"}</td></tr>
                <tr><td className="detail-label">Status</td><td>{request.status}</td></tr>
                <tr><td className="detail-label">Created</td><td>{formatHKDate(request.createdAt)}</td></tr>
              </tbody>
            </table>
            {isOwnRequest && (
              <p className="muted" style={{ fontSize: "0.88rem" }}>
                This is your own buy request.
              </p>
            )}
          </div>
        </div>

        {!isOwnRequest && submitted && (
          <div className="content-card" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.4rem" }}>
              {offerMode === "sales" ? "Sales offer submitted" : "Negotiation submitted"}
            </h2>
            <p className="muted">
              {offerMode === "sales"
                ? "Your sales proposal has been sent to the buyer request flow."
                : "Your selling details have been sent to the buyer request flow."}
            </p>
            <table className="detail-table" style={{ marginTop: "1rem" }}>
              <tbody>
                <tr><td className="detail-label">Item</td><td>{sellingItemTitle}</td></tr>
                <tr><td className="detail-label">Offered price</td><td>{formatHKD(Number(offeredPrice) || 0)}</td></tr>
                <tr><td className="detail-label">Condition</td><td>{condition}</td></tr>
                <tr><td className="detail-label">Meetup</td><td>{meetupLocation}</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {!isOwnRequest && !submitted && (
          <div className="content-card sell-form" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "1.15rem", margin: "0 0 1.2rem" }}>
              {offerMode === "sales" ? "Sales offer" : "Negotiate selling details"}
            </h2>

            <div className="detail-actions" style={{ marginBottom: "0.8rem" }}>
              <button
                type="button"
                className={`btn${offerMode === "negotiate" ? " btn-fill" : ""}`}
                onClick={() => setOfferMode("negotiate")}
              >
                Negotiate
              </button>
              <button
                type="button"
                className={`btn${offerMode === "sales" ? " btn-fill" : ""}`}
                onClick={() => setOfferMode("sales")}
              >
                Sales
              </button>
            </div>

            {offerMode === "sales" && (
              <div className="rd-form-section">
                <h3 className="rd-form-heading">Pricing Info</h3>
                <table className="detail-table">
                  <tbody>
                    <tr>
                      <td className="detail-label">Buyer budget</td>
                      <td style={{ textAlign: "right" }}>{formatHKD(request.budget)}</td>
                    </tr>
                    <tr>
                      <td className="detail-label">Offered price</td>
                      <td style={{ textAlign: "right" }}>{formatHKD(salesPricing.offered)}</td>
                    </tr>
                    <tr>
                      <td className="detail-label">Platform fee</td>
                      <td style={{ textAlign: "right" }}>{formatHKD(salesPricing.platformFee)}</td>
                    </tr>
                    <tr style={{ fontWeight: 700 }}>
                      <td className="detail-label" style={{ color: "#333" }}>You receive</td>
                      <td style={{ textAlign: "right" }}>{formatHKD(salesPricing.sellerNet)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="muted" style={{ fontSize: "0.8rem" }}>
                  Offered price is auto-filled from the buyer budget as a reference.
                </p>
              </div>
            )}

            {offerMode === "negotiate" ? (
              <>
                <label>
                  Your item title
                  <input
                    type="text"
                    placeholder="e.g. MacBook Air M1 256GB"
                    value={sellingItemTitle}
                    onChange={(e) => setSellingItemTitle(e.target.value)}
                  />
                </label>

                <div className="sell-row">
                  <label>
                    Offered price (HKD)
                    <input
                      type="number"
                      min={1}
                      value={offeredPrice}
                      onChange={(e) => setOfferedPrice(e.target.value)}
                    />
                  </label>
                  <label>
                    Item condition
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as ProductCondition)}
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
                  Meetup location
                  <input
                    type="text"
                    placeholder="e.g. Mong Kok MTR"
                    value={meetupLocation}
                    onChange={(e) => setMeetupLocation(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <p className="muted" style={{ fontSize: "0.85rem", margin: "0.1rem 0 0.2rem" }}>
                Offered price will follow buyer budget: {formatHKD(request.budget)}
              </p>
            )}

            <div className="sell-row">
              <label>
                Your name
                <input
                  type="text"
                  placeholder="Your name"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                />
              </label>
              <label>
                Contact number
                <input
                  type="tel"
                  placeholder="e.g. 9123 4567"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                />
              </label>
            </div>

            <label>
              Notes (optional)
              <textarea
                rows={3}
                placeholder="e.g. Includes original charger and box"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>

            {formError && <p className="rd-error">{formError}</p>}

            <button className="btn btn-fill" type="button" onClick={handleSubmitNegotiation}>
              {offerMode === "sales" ? "Submit sales offer" : "Submit negotiation"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
