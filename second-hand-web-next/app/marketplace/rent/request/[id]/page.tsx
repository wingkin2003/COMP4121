"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { addRentalLending, getCurrentAccount, getRentalRequests } from "@/lib/mvp-data";
import { formatHKD, formatHKDate } from "@/lib/format";
import { RentalRequest } from "@/lib/mvp-types";

const COMMISSION_RATE = 0.04;

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

export default function RentRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<RentalRequest | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [days, setDays] = useState(1);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [lenderName, setLenderName] = useState("");
  const [lenderPhone, setLenderPhone] = useState("");
  const [lenderNote, setLenderNote] = useState("");
  const [deposit, setDeposit] = useState("");
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const found = getRentalRequests().find((entry) => entry.id === id) ?? null;
    setRequest(found);
    setLoaded(true);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split("T")[0]);
  }, [id]);

  useEffect(() => {
    if (!request) return;
    setDays(request.minDays);
    setDeposit(String(request.deposit));
  }, [request]);

  const pricing = useMemo(() => {
    if (!request) return { rentalFee: 0, commission: 0, deposit: 0, total: 0 };
    const rentalFee = request.dailyBudget * days;
    const commission = Math.round(rentalFee * COMMISSION_RATE);
    const depositValue = Math.max(0, Number(deposit) || 0);
    return {
      rentalFee,
      commission,
      deposit: depositValue,
      total: rentalFee + commission + depositValue,
    };
  }, [request, days, deposit]);

  const endDate = useMemo(() => {
    if (!startDate) return "";
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }, [startDate, days]);

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
            <h1>Rent request not found</h1>
            <Link href="/marketplace/rent/request" className="btn">
              Back to rent requests
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOwn = getCurrentAccount() === request.requesterAccount;

  const handleLend = () => {
    setError(null);
    if (!startDate) {
      setError("Please select a start date.");
      return;
    }
    if (!lenderName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!lenderPhone.trim()) {
      setError("Please enter a contact number.");
      return;
    }
    if (days < request.minDays || days > request.maxDays) {
      setError(`Duration must be between ${request.minDays} and ${request.maxDays} days.`);
      return;
    }

    const account = getCurrentAccount();
    const end = new Date(startDate);
    end.setDate(end.getDate() + days);

    addRentalLending({
      id: crypto.randomUUID(),
      requestId: request.id,
      requestTitle: request.title,
      lenderAccount: account,
      lenderName: lenderName.trim(),
      lenderPhone: lenderPhone.trim(),
      note: lenderNote.trim(),
      days,
      rentalFee: pricing.rentalFee,
      commission: pricing.commission,
      deposit: pricing.deposit,
      total: pricing.total,
      startDate: new Date(startDate).toISOString(),
      endDate: end.toISOString(),
      pickupTime,
      location: request.location || "",
      status: "offered",
      createdAt: new Date().toISOString(),
    });

    setBooked(true);
  };

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <Link href="/marketplace/rent/request" className="back-link">&larr; Back to rent requests</Link>
        <div className="detail-card">
          <div className="detail-left">
            {request.image ? (
              <img src={request.image} alt={request.title} className="detail-img" />
            ) : (
              <div className="detail-thumb">{request.category}</div>
            )}
          </div>
          <div className="detail-right">
            <span className="rd-type-badge">Rent Request</span>
            <h1>{request.title}</h1>
            <p className="price">{formatHKD(request.dailyBudget)} / day</p>
            {request.description && <p className="detail-desc">{request.description}</p>}
            <table className="detail-table">
              <tbody>
                <tr><td className="detail-label">Category</td><td>{request.category}</td></tr>
                <tr><td className="detail-label">Condition</td><td>{request.condition}</td></tr>
                <tr><td className="detail-label">Preferred duration</td><td>{request.minDays}-{request.maxDays} days</td></tr>
                <tr><td className="detail-label">Requested deposit</td><td>{formatHKD(request.deposit)}</td></tr>
                <tr><td className="detail-label">Preferred location</td><td>{request.location || "-"}</td></tr>
                <tr><td className="detail-label">Requested by</td><td>{request.requesterName || "Anonymous"}</td></tr>
                <tr><td className="detail-label">Status</td><td>{request.status}</td></tr>
                <tr><td className="detail-label">Created</td><td>{formatHKDate(request.createdAt)}</td></tr>
              </tbody>
            </table>
            {isOwn && (
              <p className="muted" style={{ fontSize: "0.88rem" }}>
                This is your own rental request.
              </p>
            )}
          </div>
        </div>

        {!isOwn && booked && (
          <div className="content-card" style={{ marginTop: "1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
              <div className="rd-check-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 style={{ margin: "0 0 0.2rem" }}>Lending Offer Sent</h2>
              <p className="muted">Your lending details have been submitted.</p>
            </div>

            <table className="detail-table" style={{ marginTop: "1.2rem" }}>
              <tbody>
                <tr><td className="detail-label">Request</td><td>{request.title}</td></tr>
                <tr><td className="detail-label">Duration</td><td>{days} day{days !== 1 ? "s" : ""}</td></tr>
                <tr><td className="detail-label">Rental fee</td><td>{formatHKD(pricing.rentalFee)}</td></tr>
                <tr><td className="detail-label">Deposit</td><td>{formatHKD(pricing.deposit)}</td></tr>
                <tr style={{ fontWeight: 700 }}><td className="detail-label" style={{ color: "#333" }}>Total</td><td>{formatHKD(pricing.total)}</td></tr>
              </tbody>
            </table>

            {lenderNote && (
              <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.6rem" }}>
                <strong>Your note:</strong> {lenderNote}
              </p>
            )}
          </div>
        )}

        {!isOwn && !booked && (
          <div className="content-card sell-form" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "1.15rem", margin: "0 0 1.2rem" }}>Lend this item</h2>

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
                  Duration ({request.minDays}-{request.maxDays} days)
                  <input
                    type="number"
                    min={request.minDays}
                    max={request.maxDays}
                    value={days}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setDays(Math.max(request.minDays, Math.min(request.maxDays, v)));
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
                      <span>{request.location || "To be confirmed"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rd-form-section">
              <h3 className="rd-form-heading">Your details</h3>
              <div className="sell-row">
                <label>
                  Full name
                  <input
                    type="text"
                    placeholder="Your name"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                  />
                </label>
                <label>
                  Contact number
                  <input
                    type="tel"
                    placeholder="e.g. 9123 4567"
                    value={lenderPhone}
                    onChange={(e) => setLenderPhone(e.target.value)}
                  />
                </label>
              </div>
              <label>
                Note to requester (optional)
                <textarea
                  rows={2}
                  placeholder="e.g. Can meet after 7pm on weekdays"
                  value={lenderNote}
                  onChange={(e) => setLenderNote(e.target.value)}
                />
              </label>
            </div>

            <div className="rd-form-section">
              <h3 className="rd-form-heading">Pricing</h3>
              <label>
                Deposit (HKD)
                <input
                  type="number"
                  min={0}
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                />
              </label>
              <table className="detail-table">
                <tbody>
                  <tr>
                    <td className="detail-label">Rental fee</td>
                    <td className="muted">{formatHKD(request.dailyBudget)} x {days} day{days !== 1 ? "s" : ""}</td>
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
                    <td style={{ textAlign: "right" }}>{formatHKD(pricing.deposit)}</td>
                  </tr>
                  <tr style={{ fontWeight: 700 }}>
                    <td className="detail-label" style={{ color: "#333" }}>Total</td>
                    <td />
                    <td style={{ textAlign: "right" }}>{formatHKD(pricing.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {error && <p className="rd-error">{error}</p>}

            <button className="btn btn-fill" style={{ width: "100%", marginTop: "1rem", padding: "0.75rem 1rem", fontSize: "1rem" }} onClick={handleLend}>
              Confirm Lending &mdash; {formatHKD(pricing.total)}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
