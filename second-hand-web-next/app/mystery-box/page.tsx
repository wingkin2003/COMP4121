"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import {
    getCurrentAccount,
    getMysteryBoxCounts,
    purchaseMysteryBox,
    getMysteryBoxPurchasesByAccount,
} from "@/lib/api-helpers";
import { MYSTERY_BOX_TIERS, MysteryBoxPurchase } from "@/lib/mvp-types";
import { formatHKD, formatHKDate } from "@/lib/format";

export default function MysteryBoxPage() {
    const [account, setAccount] = useState("");
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [purchases, setPurchases] = useState<MysteryBoxPurchase[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [reveal, setReveal] = useState<MysteryBoxPurchase | null>(null);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        const load = async () => {
            const user = getCurrentAccount();
            setAccount(user);
            try {
                const [c, p] = await Promise.all([
                    getMysteryBoxCounts(),
                    getMysteryBoxPurchasesByAccount(user),
                ]);
                setCounts(c);
                setPurchases(p);
            } catch { /* ignore */ }
            setLoaded(true);
        };
        void load();
    }, []);

    const handlePurchase = (tierKey: string) => {
        setAnimating(true);
        setReveal(null);

        // Simulate box-opening animation delay
        setTimeout(async () => {
            try {
                const result = await purchaseMysteryBox(tierKey);
                if (result) {
                    setReveal(result);
                    const [c, p] = await Promise.all([
                        getMysteryBoxCounts(),
                        getMysteryBoxPurchasesByAccount(account),
                    ]);
                    setCounts(c);
                    setPurchases(p);
                }
            } catch { /* ignore */ }
            setAnimating(false);
        }, 1500);
    };

    const closeReveal = () => setReveal(null);

    if (!loaded) {
        return (
            <div className="page-shell">
                <AppNav />
                <main className="page-content" />
            </div>
        );
    }

    return (
        <div className="page-shell">
            <AppNav />
            <main className="page-content">
                <div className="section-header">
                    <h1>Mystery Box</h1>
                    <p className="muted">
                        Get amazing deals on second-hand items! Each box contains a random item from the selected price tier.
                        You pay the box price — often much less than the original listing.
                    </p>
                </div>

                {/* ---- Reveal overlay ---- */}
                {(animating || reveal) && (
                    <div className="mystery-overlay" onClick={reveal ? closeReveal : undefined}>
                        <div className="mystery-reveal-card" onClick={(e) => e.stopPropagation()}>
                            {animating ? (
                                <div className="mystery-opening">
                                    <div className="mystery-box-icon spin"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg></div>
                                    <p>Opening your Mystery Box...</p>
                                </div>
                            ) : reveal ? (
                                <div className="mystery-result">
                                    <div className="mystery-box-icon bounce"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg></div>
                                    <h2>You got:</h2>
                                    <h3>{reveal.productTitle}</h3>
                                    <div className="mystery-result-details">
                                        <p><span className="muted">Original price:</span> <s>{formatHKD(reveal.originalPrice)}</s></p>
                                        <p><span className="muted">You paid:</span> <strong>{formatHKD(reveal.pricePaid)}</strong></p>
                                        <p className="mystery-savings">
                                            You saved {formatHKD(reveal.originalPrice - reveal.pricePaid)}!
                                        </p>
                                    </div>
                                    <button className="btn btn-fill" onClick={closeReveal} style={{ marginTop: "1rem" }}>
                                        Nice!
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* ---- Box tiers ---- */}
                <div className="mystery-grid">
                    {MYSTERY_BOX_TIERS.map((tier) => {
                        const count = counts[tier.tier] || 0;
                        const empty = count === 0;
                        return (
                            <div key={tier.tier} className={`mystery-tier-card${empty ? " empty" : ""}`}>
                                <div className="mystery-tier-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg></div>
                                <h2>{tier.label}</h2>
                                <p className="mystery-tier-price">{formatHKD(tier.price)}</p>
                                <p className="muted">{tier.description}</p>
                                <p className="mystery-tier-stock">
                                    {count} item{count !== 1 ? "s" : ""} available
                                </p>
                                <button
                                    className="btn btn-fill"
                                    disabled={empty || animating}
                                    onClick={() => handlePurchase(tier.tier)}
                                >
                                    {empty ? "Sold out" : `Buy for ${formatHKD(tier.price)}`}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* ---- How it works ---- */}
                <div className="content-card" style={{ marginTop: "2rem" }}>
                    <h2 style={{ marginBottom: "1rem" }}>How it works</h2>
                    <div className="mystery-how">
                        <div className="mystery-step">
                            <span className="mystery-step-num">1</span>
                            <div>
                                <strong>Choose a tier</strong>
                                <p className="muted">Pick a price range that fits your budget</p>
                            </div>
                        </div>
                        <div className="mystery-step">
                            <span className="mystery-step-num">2</span>
                            <div>
                                <strong>Pay the box price</strong>
                                <p className="muted">Always less than the original listing price</p>
                            </div>
                        </div>
                        <div className="mystery-step">
                            <span className="mystery-step-num">3</span>
                            <div>
                                <strong>Get a random item</strong>
                                <p className="muted">A surprise product from that tier is revealed!</p>
                            </div>
                        </div>
                        <div className="mystery-step">
                            <span className="mystery-step-num">4</span>
                            <div>
                                <strong>Enjoy your deal</strong>
                                <p className="muted">Sellers recover value, you get a bargain</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ---- Purchase history ---- */}
                {purchases.length > 0 && (
                    <>
                        <div className="section-header" style={{ marginTop: "2rem" }}>
                            <h2>Your Mystery Box History</h2>
                        </div>
                        <div className="listing-table-wrap">
                            <table className="listing-table">
                                <thead>
                                    <tr>
                                        <th>Tier</th>
                                        <th>Item Received</th>
                                        <th>Original Price</th>
                                        <th>You Paid</th>
                                        <th>Saved</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.map((p) => (
                                        <tr key={p.id}>
                                            <td><span className="status-badge status-mystery">{p.tier} Box</span></td>
                                            <td><strong>{p.productTitle}</strong></td>
                                            <td className="muted"><s>{formatHKD(p.originalPrice)}</s></td>
                                            <td>{formatHKD(p.pricePaid)}</td>
                                            <td className="mystery-savings-cell">{formatHKD(p.originalPrice - p.pricePaid)}</td>
                                            <td className="muted">{formatHKDate(p.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
