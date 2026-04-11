"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import {
    deleteBuyOrder,
    getBuyOrdersByAccount,
    getProductsByAccount,
    updateBuyOrder,
    updateProduct,
    getCurrentAccount,
} from "@/lib/mvp-data";
import {
    BuyOrder,
    Product,
    ProductCategory,
    ProductCondition,
    ProductStatus,
    PRODUCT_STATUSES,
    PRODUCT_CATEGORIES,
    PRODUCT_CONDITIONS,
} from "@/lib/mvp-types";
import { formatHKD, formatHKDate } from "@/lib/format";

export default function ProfilePage() {
    const [account, setAccount] = useState("");
    const [email, setEmail] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editEmail, setEditEmail] = useState("");
    const [profileMsg, setProfileMsg] = useState<string | null>(null);
    const [editingBuyId, setEditingBuyId] = useState<string | null>(null);
    const [buyTitle, setBuyTitle] = useState("");
    const [buyDescription, setBuyDescription] = useState("");
    const [buyBudget, setBuyBudget] = useState("");
    const [buyCategory, setBuyCategory] = useState<ProductCategory>("Electronics");
    const [buyCondition, setBuyCondition] = useState<ProductCondition>("Good");
    const [buyLocation, setBuyLocation] = useState("");
    const [buyName, setBuyName] = useState("");
    const [buyMsg, setBuyMsg] = useState<string | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => {
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
            setBuyOrders(getBuyOrdersByAccount(user));
            setLoaded(true);
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    const refreshProducts = () => {
        setProducts(getProductsByAccount(account));
    };

    const refreshBuyOrders = () => {
        setBuyOrders(getBuyOrdersByAccount(account));
    };

    const handleStatusChange = (id: string, status: ProductStatus) => {
        updateProduct(id, { status });
        refreshProducts();
    };

    const handleUnpublish = (id: string) => {
        updateProduct(id, { status: "unpublished" });
        refreshProducts();
    };

    const startBuyEdit = (order: BuyOrder) => {
        setEditingBuyId(order.id);
        setBuyTitle(order.title);
        setBuyDescription(order.description);
        setBuyBudget(String(order.budget));
        setBuyCategory(order.category);
        setBuyCondition(order.condition);
        setBuyLocation(order.location);
        setBuyName(order.buyerName);
        setBuyMsg(null);
    };

    const cancelBuyEdit = () => {
        setEditingBuyId(null);
        setBuyMsg(null);
    };

    const saveBuyOrder = () => {
        if (!editingBuyId) return;

        const numericBudget = Number(buyBudget);
        if (!buyTitle.trim() || Number.isNaN(numericBudget) || numericBudget <= 0) {
            setBuyMsg("Please provide a title and valid budget.");
            return;
        }

        updateBuyOrder(editingBuyId, {
            title: buyTitle.trim(),
            description: buyDescription.trim(),
            budget: numericBudget,
            category: buyCategory,
            condition: buyCondition,
            location: buyLocation.trim(),
            buyerName: buyName.trim(),
        });
        refreshBuyOrders();
        setEditingBuyId(null);
        setBuyMsg("Buy request updated.");
        setTimeout(() => setBuyMsg(null), 2000);
    };

    const removeBuyOrder = (id: string) => {
        deleteBuyOrder(id);
        refreshBuyOrders();
        if (editingBuyId === id) {
            cancelBuyEdit();
        }
        setBuyMsg("Buy request deleted.");
        setTimeout(() => setBuyMsg(null), 2000);
    };

    const startEdit = () => {
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

                {/* ---- my buy requests ---- */}
                <div className="section-header" style={{ marginTop: "2rem" }}>
                    <h1>My Buy Requests</h1>
                    <p className="muted">{buyOrders.length} request{buyOrders.length !== 1 ? "s" : ""}</p>
                </div>

                {buyOrders.length === 0 ? (
                    <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                        <p className="muted">You have not posted any buy requests yet.</p>
                        <Link href="/buy" className="btn btn-fill" style={{ marginTop: "1rem", display: "inline-block" }}>
                            Post buy request
                        </Link>
                    </div>
                ) : (
                    <div className="listing-table-wrap">
                        <table className="listing-table">
                            <thead>
                                <tr>
                                    <th>Request</th>
                                    <th>Budget</th>
                                    <th>Category</th>
                                    <th>Condition</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {buyOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <div>
                                                <strong>{order.title}</strong>
                                                <div className="muted">{order.location || "No location set"}</div>
                                            </div>
                                        </td>
                                        <td>{formatHKD(order.budget)}</td>
                                        <td>{order.category}</td>
                                        <td>{order.condition}</td>
                                        <td className="muted">{formatHKDate(order.createdAt)}</td>
                                        <td>
                                            <div className="listing-actions">
                                                <button className="btn" onClick={() => startBuyEdit(order)}>
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-danger-sm"
                                                    onClick={() => removeBuyOrder(order.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {editingBuyId && (
                    <div className="content-card" style={{ marginTop: "1rem" }}>
                        <div className="section-header">
                            <h1>Edit Buy Request</h1>
                        </div>
                        <div className="sell-form">
                            <label>
                                Title
                                <input
                                    type="text"
                                    value={buyTitle}
                                    onChange={(e) => setBuyTitle(e.target.value)}
                                />
                            </label>
                            <label>
                                Description
                                <textarea
                                    rows={4}
                                    value={buyDescription}
                                    onChange={(e) => setBuyDescription(e.target.value)}
                                />
                            </label>
                            <label>
                                Budget (HKD)
                                <input
                                    type="number"
                                    min={1}
                                    value={buyBudget}
                                    onChange={(e) => setBuyBudget(e.target.value)}
                                />
                            </label>
                            <div className="sell-row">
                                <label>
                                    Category
                                    <select
                                        value={buyCategory}
                                        onChange={(e) => setBuyCategory(e.target.value as ProductCategory)}
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
                                        value={buyCondition}
                                        onChange={(e) => setBuyCondition(e.target.value as ProductCondition)}
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
                                    value={buyLocation}
                                    onChange={(e) => setBuyLocation(e.target.value)}
                                />
                            </label>
                            <label>
                                Buyer name
                                <input
                                    type="text"
                                    value={buyName}
                                    onChange={(e) => setBuyName(e.target.value)}
                                />
                            </label>
                            <div className="profile-btn-row">
                                <button className="btn btn-fill" onClick={saveBuyOrder}>
                                    Save changes
                                </button>
                                <button className="btn" onClick={cancelBuyEdit}>
                                    Cancel
                                </button>
                            </div>
                            {buyMsg && <p className="detail-msg">{buyMsg}</p>}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
