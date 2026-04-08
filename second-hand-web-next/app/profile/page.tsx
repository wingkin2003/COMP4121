"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import {
    getProductsByAccount,
    updateProduct,
    getCurrentAccount,
} from "@/lib/mvp-data";
import { Product, ProductStatus, PRODUCT_STATUSES } from "@/lib/mvp-types";
import { formatHKD, formatHKDate } from "@/lib/format";

export default function ProfilePage() {
    const [account, setAccount] = useState("");
    const [email, setEmail] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [profileMsg, setProfileMsg] = useState<string | null>(null);

    useEffect(() => {
        const user = getCurrentAccount();
        setAccount(user);

        const raw = localStorage.getItem("currentUser");
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                setEmail(parsed.email || "");
            } catch {
                setEmail("");
            }
        }

        setProducts(getProductsByAccount(user));
        setLoaded(true);
    }, []);

    const refreshProducts = () => {
        setProducts(getProductsByAccount(account));
    };

    const handleStatusChange = (id: string, status: ProductStatus) => {
        updateProduct(id, { status });
        refreshProducts();
    };

    const handleUnpublish = (id: string) => {
        updateProduct(id, { status: "unpublished" });
        refreshProducts();
    };

    const startEdit = () => {
        setEditName(account);
        setEditEmail(email);
        setEditing(true);
        setProfileMsg(null);
    };

    const saveProfile = () => {
        const trimmedEmail = editEmail.trim();
        if (!trimmedEmail) {
            setProfileMsg("Email cannot be empty.");
            return;
        }

        // update users array
        const users: { username: string; email: string; password: string }[] =
            JSON.parse(localStorage.getItem("users") || "[]");
        const idx = users.findIndex((u) => u.username === account);
        if (idx !== -1) {
            users[idx].email = trimmedEmail;
            localStorage.setItem("users", JSON.stringify(users));
        }

        // update currentUser
        const raw = localStorage.getItem("currentUser");
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                parsed.email = trimmedEmail;
                localStorage.setItem("currentUser", JSON.stringify(parsed));
            } catch { /* ignore */ }
        }

        setEmail(trimmedEmail);
        setEditing(false);
        setProfileMsg("Profile updated.");
        setTimeout(() => setProfileMsg(null), 2000);
    };

    if (!loaded) {
        return (
            <div className="page-shell">
                <AppNav />
                <main className="page-content" />
            </div>
        );
    }

    const statusLabel = (s: ProductStatus) => {
        switch (s) {
            case "selling":
                return "Selling";
            case "sold":
                return "Sold";
            case "expired":
                return "Expired";
            case "unpublished":
                return "Unpublished";
            default:
                return s;
        }
    };

    const statusClass = (s: ProductStatus) => {
        switch (s) {
            case "selling":
                return "status-selling";
            case "sold":
                return "status-sold";
            case "expired":
                return "status-expired";
            case "unpublished":
                return "status-unpublished";
            default:
                return "";
        }
    };

    return (
        <div className="page-shell">
            <AppNav />
            <main className="page-content">
                {/* ---- profile card ---- */}
                <div className="section-header">
                    <h1>My Profile</h1>
                </div>

                <div className="content-card profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar">{account.charAt(0).toUpperCase()}</div>
                        <div className="profile-header-text">
                            <h2>{account}</h2>
                            <p className="muted">{email || "No email set"}</p>
                        </div>
                        {!editing && (
                            <button className="btn profile-edit-btn" onClick={startEdit}>
                                Edit
                            </button>
                        )}
                    </div>

                    {editing && (
                        <div className="profile-edit-section">
                            <div className="profile-field">
                                <label className="profile-label">Account</label>
                                <span className="profile-value-readonly">{account}</span>
                            </div>
                            <div className="profile-field">
                                <label className="profile-label">Email</label>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div className="profile-btn-row">
                                <button className="btn btn-fill" onClick={saveProfile}>
                                    Save changes
                                </button>
                                <button className="btn" onClick={() => setEditing(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {profileMsg && <p className="detail-msg">{profileMsg}</p>}
                </div>

                {/* ---- my listings ---- */}
                <div className="section-header" style={{ marginTop: "2rem" }}>
                    <h1>My Listings</h1>
                    <p className="muted">{products.length} product{products.length !== 1 ? "s" : ""}</p>
                </div>

                {products.length === 0 ? (
                    <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                        <p className="muted">You have not listed any products yet.</p>
                        <Link href="/sell" className="btn btn-fill" style={{ marginTop: "1rem", display: "inline-block" }}>
                            Create listing
                        </Link>
                    </div>
                ) : (
                    <div className="listing-table-wrap">
                        <table className="listing-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Likes</th>
                                    <th>Status</th>
                                    <th>Listed</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <Link href={`/products/${p.id}`} className="listing-title">
                                                {p.title}
                                            </Link>
                                        </td>
                                        <td>{formatHKD(p.price)}</td>
                                        <td>
                                            <span className="like-count-cell">♥ {p.likes || 0}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${statusClass(p.status || "selling")}`}>
                                                {statusLabel(p.status || "selling")}
                                            </span>
                                        </td>
                                        <td className="muted">{formatHKDate(p.createdAt)}</td>
                                        <td>
                                            <div className="listing-actions">
                                                <select
                                                    value={p.status || "selling"}
                                                    onChange={(e) =>
                                                        handleStatusChange(p.id, e.target.value as ProductStatus)
                                                    }
                                                    className="status-select"
                                                >
                                                    {PRODUCT_STATUSES.map((s) => (
                                                        <option key={s} value={s}>
                                                            {statusLabel(s)}
                                                        </option>
                                                    ))}
                                                </select>
                                                {(p.status || "selling") !== "unpublished" && (
                                                    <button
                                                        className="btn btn-danger-sm"
                                                        onClick={() => handleUnpublish(p.id)}
                                                    >
                                                        Unpublish
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
