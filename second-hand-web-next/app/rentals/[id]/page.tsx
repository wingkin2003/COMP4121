"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/app-nav";
import {
  getRentals,
  addRentalOrder,
  updateRental,
  getCurrentAccount,
} from "@/lib/mvp-data";
import { formatHKD, formatHKDate } from "@/lib/format";
import { RentalListing } from "@/lib/mvp-types";

const COMMISSION_RATE = 0.04;

/* ---- inline SVG icons (16x16) ---- */
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconReturn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);
const IconMapPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [rental, setRental] = useState<RentalListing | null>(null);
  const [loaded, setLoaded] = useState(false);

  /* booking form */
  const [startDate, setStartDate] = useState("");
  const [days, setDays] = useState(1);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [renterName, setRenterName] = useState("");
  const [renterPhone, setRenterPhone] = useState("");
  const [renterNote, setRenterNote] = useState("");
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const found = getRentals().find((r) => r.id === id) ?? null;
    setRental(found);
    setLoaded(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split("T")[0]);
  }, [id]);

  useEffect(() => {
    if (rental) setDays(rental.minDays);
  }, [rental]);

  const pricing = useMemo(() => {
    if (!rental) return { rentalFee: 0, commission: 0, deposit: 0, total: 0 };
    const rentalFee = rental.dailyPrice * days;
    const commission = Math.round(rentalFee * COMMISSION_RATE);
    return {
      rentalFee,
      commission,
      deposit: rental.deposit,
      total: rentalFee + commission + rental.deposit,
    };
  }, [rental, days]);

  const endDate = useMemo(() => {
    if (!startDate) return "";
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }, [startDate, days]);

  /* ---- loading / not found ---- */
  if (!loaded) {
    return (
      <div className="page-shell">
        <AppNav />
        <main className="page-content" />
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="page-shell">
        <AppNav />
        <main className="page-content">
          <div className="detail-empty">
            <h1>Rental not found</h1>
            <Link href="/marketplace/rent" className="btn">Back to rentals</Link>
          </div>
        </main>
      </div>
    );
  }

  const isOwn = getCurrentAccount() === rental.ownerAccount;
  const isAvailable = rental.status === "available";

  const handleBook = () => {
    setError(null);
    if (!startDate) { setError("Please select a start date."); return; }
    if (!renterName.trim()) { setError("Please enter your name."); return; }
    if (!renterPhone.trim()) { setError("Please enter a contact number."); return; }
    if (days < rental.minDays || days > rental.maxDays) {
      setError(`Duration must be between ${rental.minDays} and ${rental.maxDays} days.`);
      return;
    }
    const start = new Date(startDate);
    if (start.getTime() < Date.now()) {
      setError("Start date cannot be in the past.");
      return;
    }
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    addRentalOrder({
      id: crypto.randomUUID(),
      rentalId: rental.id,
      rentalTitle: rental.title,
      renterAccount: getCurrentAccount(),
      renterName: renterName.trim(),
      days,
      rentalFee: pricing.rentalFee,
      deposit: rental.deposit,
      commission: pricing.commission,
      total: pricing.total,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      status: "active",
      createdAt: new Date().toISOString(),
    });

    updateRental(rental.id, { status: "rented" });
    setBooked(true);
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <Link href="/marketplace/rent" className="back-link">&larr; Back to rentals</Link>

        {/* ---- detail card (same layout as product detail) ---- */}
        <div className="detail-card">
          <div className="detail-left">
            {rental.image ? (
              <img src={rental.image} alt={rental.title} className="detail-img" />
            ) : (
              <div className="detail-thumb">{rental.category}</div>
            )}
          </div>

          <div className="detail-right">
            <span className="rd-type-badge">For Rent</span>
            <h1>{rental.title}</h1>
            <p className="price">
              {formatHKD(rental.dailyPrice)}
              <span className="rd-price-unit"> / day</span>
            </p>

            {rental.description && (
              <p className="detail-desc">{rental.description}</p>
            )}

            <table className="detail-table">
              <tbody>
                <tr><td className="detail-label">Condition</td><td>{rental.condition}</td></tr>
                <tr><td className="detail-label">Category</td><td>{rental.category}</td></tr>
                <tr><td className="detail-label">Location</td><td>{rental.location || "—"}</td></tr>
                <tr><td className="detail-label">Duration</td><td>{rental.minDays}–{rental.maxDays} days</td></tr>
                <tr><td className="detail-label">Deposit</td><td>{formatHKD(rental.deposit)}</td></tr>
                <tr><td className="detail-label">Owner</td><td>{rental.ownerName || "\u2014"}</td></tr>
                <tr><td className="detail-label">Listed</td><td>{formatHKDate(rental.createdAt)}</td></tr>
              </tbody>
            </table>

            {isOwn && (
              <p className="muted" style={{ fontSize: "0.88rem" }}>This is your own rental listing.</p>
            )}
            {!isOwn && !isAvailable && (
              <p className="muted" style={{ fontSize: "0.88rem" }}>This item is currently not available for rent.</p>
            )}
          </div>
        </div>

        {/* ---- booking confirmed ---- */}
        {booked && (
          <div className="content-card" style={{ marginTop: "1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
              <div className="rd-check-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 style={{ margin: "0 0 0.2rem" }}>Booking Confirmed</h2>
              <p className="muted">Your rental has been reserved successfully.</p>
            </div>

            <div className="rd-timeline">
              <div className="rd-timeline-item">
                <span className="rd-timeline-icon"><IconCalendar /></span>
                <div>
                  <span className="rd-timeline-label">Pickup</span>
                  <span>{startDate} at {pickupTime}</span>
                </div>
              </div>
              <div className="rd-timeline-line" />
              <div className="rd-timeline-item">
                <span className="rd-timeline-icon"><IconReturn /></span>
                <div>
                  <span className="rd-timeline-label">Return by</span>
                  <span>{endDate}</span>
                </div>
              </div>
              <div className="rd-timeline-line" />
              <div className="rd-timeline-item">
                <span className="rd-timeline-icon"><IconMapPin /></span>
                <div>
                  <span className="rd-timeline-label">Location</span>
                  <span>{rental.location || "To be confirmed"}</span>
                </div>
              </div>
            </div>

            <table className="detail-table" style={{ marginTop: "1.2rem" }}>
              <tbody>
                <tr><td className="detail-label">Item</td><td>{rental.title}</td></tr>
                <tr><td className="detail-label">Duration</td><td>{days} day{days !== 1 ? "s" : ""}</td></tr>
                <tr><td className="detail-label">Rental fee</td><td>{formatHKD(pricing.rentalFee)}</td></tr>
                <tr><td className="detail-label">Deposit</td><td>{formatHKD(rental.deposit)}</td></tr>
                <tr style={{ fontWeight: 700 }}><td className="detail-label" style={{ color: "#333" }}>Total paid</td><td>{formatHKD(pricing.total)}</td></tr>
              </tbody>
            </table>

            {renterNote && (
              <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.6rem" }}>
                <strong>Your note:</strong> {renterNote}
              </p>
            )}

            <div className="detail-actions" style={{ marginTop: "1.2rem" }}>
              <Link href="/marketplace/rent" className="btn btn-fill">Browse more</Link>
              <Link href="/profile" className="btn">My profile</Link>
            </div>
          </div>
        )}

        {/* ---- booking form (only if available and not own) ---- */}
        {!booked && isAvailable && !isOwn && (
          <div className="content-card sell-form" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "1.15rem", margin: "0 0 1.2rem" }}>Book this item</h2>

            {/* Schedule */}
            <div className="rd-form-section">
              <h3 className="rd-form-heading">Schedule</h3>
              <div className="sell-row">
                <label>
                  Start date
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label>
                  Duration ({rental.minDays}–{rental.maxDays} days)
                  <input
                    type="number"
                    min={rental.minDays}
                    max={rental.maxDays}
                    value={days}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setDays(Math.max(rental.minDays, Math.min(rental.maxDays, v)));
                    }}
                  />
                </label>
                <label>
                  Pickup time
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </label>
              </div>

              {startDate && (
                <div className="rd-timeline" style={{ marginTop: "0.8rem" }}>
                  <div className="rd-timeline-item">
                    <span className="rd-timeline-icon"><IconCalendar /></span>
                    <div>
                      <span className="rd-timeline-label">Pickup</span>
                      <span>{startDate} at {pickupTime}</span>
                    </div>
                  </div>
                  <div className="rd-timeline-line" />
                  <div className="rd-timeline-item">
                    <span className="rd-timeline-icon"><IconReturn /></span>
                    <div>
                      <span className="rd-timeline-label">Return by</span>
                      <span>{endDate}</span>
                    </div>
                  </div>
                  <div className="rd-timeline-line" />
                  <div className="rd-timeline-item">
                    <span className="rd-timeline-icon"><IconMapPin /></span>
                    <div>
                      <span className="rd-timeline-label">Location</span>
                      <span>{rental.location || "To be confirmed"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="rd-form-section">
              <h3 className="rd-form-heading">Your details</h3>
              <div className="sell-row">
                <label>
                  Full name
                  <input
                    type="text"
                    placeholder="Your name"
                    value={renterName}
                    onChange={(e) => setRenterName(e.target.value)}
                  />
                </label>
                <label>
                  Contact number
                  <input
                    type="tel"
                    placeholder="e.g. 9123 4567"
                    value={renterPhone}
                    onChange={(e) => setRenterPhone(e.target.value)}
                  />
                </label>
              </div>
              <label>
                Note to owner (optional)
                <textarea
                  rows={2}
                  placeholder="e.g. Can we meet at the MTR station instead?"
                  value={renterNote}
                  onChange={(e) => setRenterNote(e.target.value)}
                />
              </label>
            </div>

            {/* Pricing */}
            <div className="rd-form-section">
              <h3 className="rd-form-heading">Pricing</h3>
              <table className="detail-table">
                <tbody>
                  <tr>
                    <td className="detail-label">Rental fee</td>
                    <td className="muted">{formatHKD(rental.dailyPrice)} &times; {days} day{days !== 1 ? "s" : ""}</td>
                    <td style={{ textAlign: "right" }}>{formatHKD(pricing.rentalFee)}</td>
                  </tr>
                  <tr>
                    <td className="detail-label">Platform fee</td>
                    <td className="muted">4%</td>
                    <td style={{ textAlign: "right" }}>{formatHKD(pricing.commission)}</td>
                  </tr>
                  <tr>
                    <td className="detail-label">Deposit</td>
                    <td className="muted">refundable</td>
                    <td style={{ textAlign: "right" }}>{formatHKD(rental.deposit)}</td>
                  </tr>
                  <tr style={{ fontWeight: 700 }}>
                    <td className="detail-label" style={{ color: "#333" }}>Total</td>
                    <td />
                    <td style={{ textAlign: "right" }}>{formatHKD(pricing.total)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.3rem" }}>
                The deposit of {formatHKD(rental.deposit)} will be refunded when the item is returned in acceptable condition.
              </p>
            </div>

            {error && <p className="rd-error">{error}</p>}

            <button className="btn btn-fill" style={{ width: "100%", marginTop: "1rem", padding: "0.75rem 1rem", fontSize: "1rem" }} onClick={handleBook}>
              Confirm Booking &mdash; {formatHKD(pricing.total)}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
