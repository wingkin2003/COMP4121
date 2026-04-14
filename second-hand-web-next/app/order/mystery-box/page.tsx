"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import Link from "next/link";
import {
    getCurrentAccount,
    getStaleProducts,
    moveToMysteryBox,
    getProductsByAccount,
    getProductTier,
} from "@/lib/api-helpers";
import { Product, MYSTERY_BOX_TIERS } from "@/lib/mvp-types";
import { formatHKD, formatHKDate } from "@/lib/format";

export default function OrderMysteryBoxPage() {
    const [account, setAccount] = useState("");
    const [staleProducts, setStaleProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const user = getCurrentAccount();
            setAccount(user);
            try {
                const [stale, all] = await Promise.all([
                    getStaleProducts(),
                    getProductsByAccount(user),
                ]);
                setStaleProducts(stale);
                setAllProducts(all);
            } catch { /* ignore */ }
            setLoaded(true);
        };
        void load();
    }, []);

    const handleMoveToBox = async (productId: string) => {
        try {
            await moveToMysteryBox(productId);
            const [stale, all] = await Promise.all([
                getStaleProducts(),
                getProductsByAccount(account),
            ]);
            setStaleProducts(stale);
            setAllProducts(all);
            setMsg("Item moved to Mystery Box pool!");
            setTimeout(() => setMsg(null), 2000);
        } catch { /* ignore */ }
    };

    const mysteryBoxItems = allProducts.filter(
        (p) => p.inMysteryBox && p.status === "mystery-box",
    );

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
                    <h1>Mystery Box Manager</h1>
                    <p className="muted">
                        Move stale listings into the Mystery Box pool to give them a second chance at finding a buyer.
                    </p>
                    <div className="order-tabs">
                        <Link href="/order/sell" className="order-tab">Sell</Link>
                        <Link href="/order/buy" className="order-tab">Buy</Link>
                        <Link href="/order/rent" className="order-tab">Rent</Link>
                        <Link href="/order/mystery-box" className="order-tab active" aria-current="page">Mystery Box</Link>
                    </div>
                </div>

                {msg && <p className="detail-msg">{msg}</p>}

                {/* ---- Eligible items ---- */}
                <div className="section-header" style={{ marginTop: "1.5rem" }}>
                    <h2>Eligible Items</h2>
                    <p className="muted">
                        These products have been listed for 14+ days without selling. Move them to the Mystery Box to recover value.
                    </p>
                </div>

                {staleProducts.length === 0 ? (
                    <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                        <p className="muted">No eligible items right now. Items become eligible after 14 days of listing.</p>
                    </div>
                ) : (
                    <div className="listing-table-wrap">
                        <table className="listing-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Original Price</th>
                                    <th>Box Tier</th>
                                    <th>You Receive (70%)</th>
                                    <th>Listed</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staleProducts.map((p) => {
                                    const tier = getProductTier(p.price);
                                    return (
                                        <tr key={p.id}>
                                            <td><strong>{p.title}</strong></td>
                                            <td>{formatHKD(p.price)}</td>
                                            <td>
                                                {tier ? (
                                                    <span className="status-badge status-selling">{tier.label}</span>
                                                ) : (
                                                    <span className="muted">Price too high</span>
                                                )}
                                            </td>
                                            <td>{tier ? formatHKD(tier.price * 0.7) : "—"}</td>
                                            <td className="muted">{formatHKDate(p.createdAt)}</td>
                                            <td>
                                                {tier ? (
                                                    <button
                                                        className="btn btn-fill"
                                                        onClick={() => handleMoveToBox(p.id)}
                                                    >
                                                        Move to Mystery Box
                                                    </button>
                                                ) : (
                                                    <span className="muted">Not eligible</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ---- Already in mystery box ---- */}
                <div className="section-header" style={{ marginTop: "2rem" }}>
                    <h2>Your Items in Mystery Box</h2>
                    <p className="muted">{mysteryBoxItems.length} item{mysteryBoxItems.length !== 1 ? "s" : ""} currently in the pool</p>
                </div>

                {mysteryBoxItems.length === 0 ? (
                    <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                        <p className="muted">No items in the Mystery Box yet.</p>
                    </div>
                ) : (
                    <div className="listing-table-wrap">
                        <table className="listing-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Original Price</th>
                                    <th>Box Tier</th>
                                    <th>You Receive (70%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mysteryBoxItems.map((p) => {
                                    const tier = getProductTier(p.price);
                                    return (
                                        <tr key={p.id}>
                                            <td><strong>{p.title}</strong></td>
                                            <td>{formatHKD(p.price)}</td>
                                            <td>{tier ? <span className="status-badge status-mystery">{tier.label}</span> : "—"}</td>
                                            <td>{tier ? formatHKD(tier.price * 0.7) : "—"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ---- Tier reference ---- */}
                <div className="section-header" style={{ marginTop: "2rem" }}>
                    <h2>Mystery Box Tiers</h2>
                </div>
                <div className="content-card">
                    <table className="listing-table">
                        <thead>
                            <tr>
                                <th>Tier</th>
                                <th>Box Price</th>
                                <th>Original Price Range</th>
                                <th>Seller Receives</th>
                                <th>Platform Fee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MYSTERY_BOX_TIERS.map((tier) => (
                                <tr key={tier.tier}>
                                    <td><strong>{tier.label}</strong></td>
                                    <td>{formatHKD(tier.price)}</td>
                                    <td>{tier.description}</td>
                                    <td>{formatHKD(tier.price * 0.7)} (70%)</td>
                                    <td>{formatHKD(tier.price * 0.3)} (30%)</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
