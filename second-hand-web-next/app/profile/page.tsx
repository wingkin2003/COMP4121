"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import {
    getBuyOrdersByAccount,
    getProductsByAccount,
    getRentalLendingsByAccount,
    getRentalRequestsByAccount,
    getRentalsByAccount,
    getRentalOrdersByAccount,
    getStaleProducts,
    getMysteryBoxPurchasesByAccount,
    updateBuyOrder,
    updateProduct,
    updateRental,
    updateRentalRequest,
    updateRentalOrder,
    moveToMysteryBox,
    getCurrentAccount,
    getProductTier,
    getUserProfile,
    updateUserEmail,
    uploadImage,
} from "@/lib/api-helpers";
import {
    BuyOrder,
    Product,
    ProductCategory,
    ProductCondition,
    ProductStatus,
    RentalLending,
    RentalListing,
    RentalRequest,
    RentalOrder,
    RentalStatus,
    MysteryBoxPurchase,
    PRODUCT_STATUSES,
    PRODUCT_CATEGORIES,
    PRODUCT_CONDITIONS,
    RENTAL_STATUSES,
} from "@/lib/mvp-types";
import { formatHKD, formatHKDate } from "@/lib/format";

type BuyOrderStatus = BuyOrder["status"];

const BUY_ORDER_STATUSES: BuyOrderStatus[] = ["open", "matched", "closed"];

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
    const [buyStatus, setBuyStatus] = useState<BuyOrderStatus>("open");
    const [buyImagePreview, setBuyImagePreview] = useState<string | null>(null);
    const [buyMsg, setBuyMsg] = useState<string | null>(null);
    const buyFileRef = useRef<HTMLInputElement>(null);

    // Rental state
    const [rentals, setRentals] = useState<RentalListing[]>([]);
    const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
    const [rentalLendings, setRentalLendings] = useState<RentalLending[]>([]);
    const [rentalBookings, setRentalBookings] = useState<RentalOrder[]>([]);
    const [rentalBookingMsg, setRentalBookingMsg] = useState<string | null>(null);
    const [rentalRequestMsg, setRentalRequestMsg] = useState<string | null>(null);

    // Mystery box state
    const [staleProducts, setStaleProducts] = useState<Product[]>([]);
    const [mysteryPurchases, setMysteryPurchases] = useState<MysteryBoxPurchase[]>([]);
    const [mysteryMsg, setMysteryMsg] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const user = getCurrentAccount();
            setAccount(user);

            try {
                const profile = await getUserProfile();
                setEmail(profile.email || "");
            } catch {
                setEmail("");
            }

            try {
                const [prods, buys, rents, reqs, lends, books, stale, mystery] =
                    await Promise.all([
                        getProductsByAccount(user),
                        getBuyOrdersByAccount(user),
                        getRentalsByAccount(user),
                        getRentalRequestsByAccount(user),
                        getRentalLendingsByAccount(user),
                        getRentalOrdersByAccount(user),
                        getStaleProducts(),
                        getMysteryBoxPurchasesByAccount(user),
                    ]);
                setProducts(prods);
                setBuyOrders(buys);
                setRentals(rents);
                setRentalRequests(reqs);
                setRentalLendings(lends);
                setRentalBookings(books);
                setStaleProducts(stale);
                setMysteryPurchases(mystery);
            } catch { /* ignore */ }

            setLoaded(true);
        };
        void load();
    }, []);

    const refreshProducts = async () => {
        try { setProducts(await getProductsByAccount(account)); } catch { /* ignore */ }
    };

    const refreshBuyOrders = async () => {
        try { setBuyOrders(await getBuyOrdersByAccount(account)); } catch { /* ignore */ }
    };

    const refreshRentals = async () => {
        try { setRentals(await getRentalsByAccount(account)); } catch { /* ignore */ }
    };

    const refreshRentalRequests = async () => {
        try { setRentalRequests(await getRentalRequestsByAccount(account)); } catch { /* ignore */ }
    };

    const refreshRentalBookings = async () => {
        try { setRentalBookings(await getRentalOrdersByAccount(account)); } catch { /* ignore */ }
    };

    const refreshRentalLendings = async () => {
        try { setRentalLendings(await getRentalLendingsByAccount(account)); } catch { /* ignore */ }
    };

    const handleCancelBooking = async (id: string) => {
        try {
            await updateRentalOrder(id, { status: "cancelled" });
            await refreshRentalBookings();
            setRentalBookingMsg("Booking cancelled.");
            setTimeout(() => setRentalBookingMsg(null), 2000);
        } catch { /* ignore */ }
    };

    const refreshStaleProducts = async () => {
        try {
            const [stale, prods] = await Promise.all([
                getStaleProducts(),
                getProductsByAccount(account),
            ]);
            setStaleProducts(stale);
            setProducts(prods);
        } catch { /* ignore */ }
    };

    const handleRentalStatusChange = async (id: string, status: RentalStatus) => {
        try { await updateRental(id, { status }); await refreshRentals(); } catch { /* ignore */ }
    };

    const handleRentalUnpublish = async (id: string) => {
        try { await updateRental(id, { status: "unpublished" }); await refreshRentals(); } catch { /* ignore */ }
    };

    const handleRentalRequestStatusChange = async (id: string, status: RentalRequest["status"]) => {
        try { await updateRentalRequest(id, { status }); await refreshRentalRequests(); } catch { /* ignore */ }
    };

    const handleRentalRequestUnpublish = async (id: string) => {
        try {
            await updateRentalRequest(id, { status: "closed" });
            await refreshRentalRequests();
            setRentalRequestMsg("Rent request unpublished.");
            setTimeout(() => setRentalRequestMsg(null), 2000);
        } catch { /* ignore */ }
    };

    const rentalRequestStatusLabel = (status: RentalRequest["status"]) => {
        switch (status) {
            case "open":
                return "Open";
            case "matched":
                return "Matched";
            case "closed":
                return "Closed";
            default:
                return status;
        }
    };

    const rentalRequestStatusClass = (status: RentalRequest["status"]) => {
        switch (status) {
            case "open":
                return "status-selling";
            case "matched":
                return "status-sold";
            case "closed":
                return "status-unpublished";
            default:
                return "";
        }
    };

    const handleMoveToMysteryBox = async (productId: string) => {
        try {
            await moveToMysteryBox(productId);
            await refreshStaleProducts();
            setMysteryMsg("Item moved to Mystery Box!");
            setTimeout(() => setMysteryMsg(null), 2000);
        } catch { /* ignore */ }
    };

    const rentalStatusLabel = (s: RentalStatus) => {
        switch (s) {
            case "available": return "Available";
            case "rented": return "Rented";
            case "returned": return "Returned";
            case "unpublished": return "Unpublished";
            default: return s;
        }
    };

    const rentalStatusClass = (s: RentalStatus) => {
        switch (s) {
            case "available": return "status-selling";
            case "rented": return "status-sold";
            case "returned": return "status-expired";
            case "unpublished": return "status-unpublished";
            default: return "";
        }
    };

    const handleStatusChange = async (id: string, status: ProductStatus) => {
        try { await updateProduct(id, { status }); await refreshProducts(); } catch { /* ignore */ }
    };

    const handleUnpublish = async (id: string) => {
        try { await updateProduct(id, { status: "unpublished" }); await refreshProducts(); } catch { /* ignore */ }
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
        setBuyStatus(order.status);
        setBuyImagePreview(order.image || null);
        if (buyFileRef.current) buyFileRef.current.value = "";
        setBuyMsg(null);
    };

    const cancelBuyEdit = () => {
        setEditingBuyId(null);
        if (buyFileRef.current) buyFileRef.current.value = "";
        setBuyMsg(null);
    };

    const handleBuyStatusChange = async (id: string, status: BuyOrderStatus) => {
        try { await updateBuyOrder(id, { status }); await refreshBuyOrders(); } catch { /* ignore */ }
    };

    const handleBuyImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setBuyImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeBuyImage = () => {
        setBuyImagePreview(null);
        if (buyFileRef.current) buyFileRef.current.value = "";
    };

    const saveBuyOrder = async () => {
        if (!editingBuyId) return;

        const numericBudget = Number(buyBudget);
        if (!buyTitle.trim() || Number.isNaN(numericBudget) || numericBudget <= 0) {
            setBuyMsg("Please provide a title and valid budget.");
            return;
        }

        try {
            // Upload new image if a file was selected
            let imageUrl = buyImagePreview || "";
            const file = buyFileRef.current?.files?.[0];
            if (file) {
                imageUrl = await uploadImage(file);
            }

            await updateBuyOrder(editingBuyId, {
                title: buyTitle.trim(),
                description: buyDescription.trim(),
                budget: numericBudget,
                category: buyCategory,
                condition: buyCondition,
                location: buyLocation.trim(),
                buyerName: buyName.trim(),
                status: buyStatus,
                image: imageUrl,
            });
            await refreshBuyOrders();
            setEditingBuyId(null);
            setBuyMsg("Buy request updated.");
            setTimeout(() => setBuyMsg(null), 2000);
        } catch { setBuyMsg("Failed to update buy request."); }
    };

    const buyStatusLabel = (status: BuyOrderStatus) => {
        switch (status) {
            case "open":
                return "Open";
            case "matched":
                return "Matched";
            case "closed":
                return "Closed";
            default:
                return status;
        }
    };

    const buyStatusClass = (status: BuyOrderStatus) => {
        switch (status) {
            case "open":
                return "status-selling";
            case "matched":
                return "status-sold";
            case "closed":
                return "status-unpublished";
            default:
                return "";
        }
    };

    const handleBuyUnpublish = async (id: string) => {
        try {
            await updateBuyOrder(id, { status: "closed" });
            await refreshBuyOrders();
            if (editingBuyId === id) {
                setBuyStatus("closed");
            }
            setBuyMsg("Buy request unpublished.");
            setTimeout(() => setBuyMsg(null), 2000);
        } catch { /* ignore */ }
    };

    const startEdit = () => {
        setEditEmail(email);
        setEditing(true);
        setProfileMsg(null);
    };

    const saveProfile = async () => {
        const trimmedEmail = editEmail.trim();
        if (!trimmedEmail) {
            setProfileMsg("Email cannot be empty.");
            return;
        }

        try {
            const updated = await updateUserEmail(trimmedEmail);
            setEmail(updated.email);
            setEditing(false);
            setProfileMsg("Profile updated.");
            setTimeout(() => setProfileMsg(null), 2000);
        } catch {
            setProfileMsg("Failed to update profile.");
        }
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
            case "mystery-box":
                return "Mystery Box";
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
            case "mystery-box":
                return "status-mystery";
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
                                    <th>Status</th>
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
                                        <td>
                                            <span className={`status-badge ${buyStatusClass(order.status)}`}>
                                                {buyStatusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td className="muted">{formatHKDate(order.createdAt)}</td>
                                        <td>
                                            <div className="listing-actions">
                                                <select
                                                    value={order.status}
                                                    onChange={(event) =>
                                                        handleBuyStatusChange(order.id, event.target.value as BuyOrderStatus)
                                                    }
                                                    className="status-select"
                                                >
                                                    {BUY_ORDER_STATUSES.map((status) => (
                                                        <option key={status} value={status}>
                                                            {buyStatusLabel(status)}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button className="btn" onClick={() => startBuyEdit(order)}>
                                                    Edit
                                                </button>
                                                {order.status !== "closed" && (
                                                    <button
                                                        className="btn btn-danger-sm"
                                                        onClick={() => handleBuyUnpublish(order.id)}
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
                            <label>
                                Status
                                <select
                                    value={buyStatus}
                                    onChange={(e) => setBuyStatus(e.target.value as BuyOrderStatus)}
                                >
                                    {BUY_ORDER_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {buyStatusLabel(status)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Reference image (optional)
                                <input
                                    ref={buyFileRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBuyImageChange}
                                />
                            </label>
                            {buyImagePreview && (
                                <div className="img-preview-wrap">
                                    <img src={buyImagePreview} alt="Preview" className="img-preview" />
                                    <button type="button" className="img-remove" onClick={removeBuyImage}>
                                        Remove
                                    </button>
                                </div>
                            )}
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

                {/* ---- my rentals ---- */}
                <div className="section-header" style={{ marginTop: "2rem" }}>
                    <h1>My Rental Listings</h1>
                    <p className="muted">{rentals.length} rental{rentals.length !== 1 ? "s" : ""}</p>
                </div>

                {rentals.length === 0 ? (
                    <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                        <p className="muted">You have not listed any rental items yet.</p>
                        <Link href="/order/rent" className="btn btn-fill" style={{ marginTop: "1rem", display: "inline-block" }}>
                            Create rental listing
                        </Link>
                    </div>
                ) : (
                    <div className="listing-table-wrap">
                        <table className="listing-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Daily Price</th>
                                    <th>Deposit</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Listed</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rentals.map((r) => (
                                    <tr key={r.id}>
                                        <td><strong>{r.title}</strong></td>
                                        <td>{formatHKD(r.dailyPrice)}/day</td>
                                        <td>{formatHKD(r.deposit)}</td>
                                        <td>{r.minDays}–{r.maxDays} days</td>
                                        <td>
                                            <span className={`status-badge ${rentalStatusClass(r.status)}`}>
                                                {rentalStatusLabel(r.status)}
                                            </span>
                                        </td>
                                        <td className="muted">{formatHKDate(r.createdAt)}</td>
                                        <td>
                                            <div className="listing-actions">
                                                <select
                                                    value={r.status}
                                                    onChange={(e) => handleRentalStatusChange(r.id, e.target.value as RentalStatus)}
                                                    className="status-select"
                                                >
                                                    {RENTAL_STATUSES.map((s) => (
                                                        <option key={s} value={s}>{rentalStatusLabel(s)}</option>
                                                    ))}
                                                </select>
                                                {r.status !== "unpublished" && (
                                                    <button className="btn btn-danger-sm" onClick={() => handleRentalUnpublish(r.id)}>
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

                {/* ---- my rent requests ---- */}
                <div className="section-header" style={{ marginTop: "2rem" }}>
                    <h1>My Rent Requests</h1>
                    <p className="muted">{rentalRequests.length} request{rentalRequests.length !== 1 ? "s" : ""}</p>
                </div>

                {rentalRequests.length === 0 ? (
                    <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                        <p className="muted">You have not posted any rent requests yet.</p>
                        <Link href="/order/rent/request" className="btn btn-fill" style={{ marginTop: "1rem", display: "inline-block" }}>
                            Post rent request
                        </Link>
                    </div>
                ) : (
                    <div className="listing-table-wrap">
                        {rentalRequestMsg && <p className="detail-msg">{rentalRequestMsg}</p>}
                        <table className="listing-table">
                            <thead>
                                <tr>
                                    <th>Request</th>
                                    <th>Daily Budget</th>
                                    <th>Deposit</th>
                                    <th>Duration</th>
                                    <th>Category</th>
                                    <th>Condition</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rentalRequests.map((request) => (
                                    <tr key={request.id}>
                                        <td>
                                            <div>
                                                <strong>{request.title}</strong>
                                                <div className="muted">{request.location || "No location set"}</div>
                                            </div>
                                        </td>
                                        <td>{formatHKD(request.dailyBudget)}/day</td>
                                        <td>{formatHKD(request.deposit)}</td>
                                        <td>{request.minDays}–{request.maxDays} days</td>
                                        <td>{request.category}</td>
                                        <td>{request.condition}</td>
                                        <td>
                                            <span className={`status-badge ${rentalRequestStatusClass(request.status)}`}>
                                                {rentalRequestStatusLabel(request.status)}
                                            </span>
                                        </td>
                                        <td className="muted">{formatHKDate(request.createdAt)}</td>
                                        <td>
                                            <div className="listing-actions">
                                                <select
                                                    value={request.status}
                                                    onChange={(event) =>
                                                        handleRentalRequestStatusChange(
                                                            request.id,
                                                            event.target.value as RentalRequest["status"],
                                                        )
                                                    }
                                                    className="status-select"
                                                >
                                                    <option value="open">Open</option>
                                                    <option value="matched">Matched</option>
                                                    <option value="closed">Closed</option>
                                                </select>
                                                {request.status !== "closed" && (
                                                    <button
                                                        className="btn btn-danger-sm"
                                                        onClick={() => handleRentalRequestUnpublish(request.id)}
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

                {/* ---- my rental lendings ---- */}
                <div className="section-header" style={{ marginTop: "2rem" }}>
                    <h1>My Rental Lending</h1>
                    <p className="muted">{rentalLendings.length} offer{rentalLendings.length !== 1 ? "s" : ""}</p>
                </div>

                {rentalLendings.length === 0 ? (
                    <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                        <p className="muted">You have not submitted any lending offers yet.</p>
                        <Link href="/marketplace/rent/request" className="btn btn-fill" style={{ marginTop: "1rem", display: "inline-block" }}>
                            Browse rent requests
                        </Link>
                    </div>
                ) : (
                    <div className="listing-table-wrap">
                        <table className="listing-table">
                            <thead>
                                <tr>
                                    <th>Request</th>
                                    <th>Duration</th>
                                    <th>Rental Fee</th>
                                    <th>Deposit</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rentalLendings.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            <div>
                                                <strong>{entry.requestTitle}</strong>
                                                <div className="muted">{entry.location || "No location set"}</div>
                                            </div>
                                        </td>
                                        <td>{entry.days} day{entry.days !== 1 ? "s" : ""}</td>
                                        <td>{formatHKD(entry.rentalFee)}</td>
                                        <td>{formatHKD(entry.deposit)}</td>
                                        <td>{formatHKD(entry.total)}</td>
                                        <td>
                                            <span className="status-badge status-selling">Offered</span>
                                        </td>
                                        <td className="muted">{formatHKDate(entry.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ---- my rental bookings ---- */}
                <div className="section-header" style={{ marginTop: "2rem" }}>
                    <h1>My Rental Bookings</h1>
                    <p className="muted">{rentalBookings.length} booking{rentalBookings.length !== 1 ? "s" : ""}</p>
                </div>

                {rentalBookings.length === 0 ? (
                    <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                        <p className="muted">You have not booked any rental items yet.</p>
                        <Link href="/marketplace/rent" className="btn btn-fill" style={{ marginTop: "1rem", display: "inline-block" }}>
                            Browse rentals
                        </Link>
                    </div>
                ) : (
                    <div className="listing-table-wrap">
                        {rentalBookingMsg && <p className="detail-msg">{rentalBookingMsg}</p>}
                        <table className="listing-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Duration</th>
                                    <th>Rental Fee</th>
                                    <th>Deposit</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Booked</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rentalBookings.map((b) => (
                                    <tr key={b.id}>
                                        <td>
                                            <Link href={`/rentals/${b.rentalId}`} className="listing-title">
                                                {b.rentalTitle || "Rental item"}
                                            </Link>
                                        </td>
                                        <td>{b.days} day{b.days !== 1 ? "s" : ""}</td>
                                        <td>{formatHKD(b.rentalFee)}</td>
                                        <td>{formatHKD(b.deposit)}</td>
                                        <td>{formatHKD(b.total)}</td>
                                        <td>
                                            <span className={`status-badge ${b.status === "active" ? "status-selling" :
                                                b.status === "returned" ? "status-expired" :
                                                    b.status === "cancelled" ? "status-unpublished" :
                                                        "status-sold"
                                                }`}>
                                                {b.status === "active" ? "Active" :
                                                    b.status === "returned" ? "Returned" :
                                                        b.status === "cancelled" ? "Cancelled" : "Overdue"}
                                            </span>
                                        </td>
                                        <td className="muted">{formatHKDate(b.createdAt)}</td>
                                        <td>
                                            {b.status === "active" && (
                                                <button className="btn btn-danger-sm" onClick={() => handleCancelBooking(b.id)}>
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ---- Mystery Box Invitations ---- */}
                {staleProducts.length > 0 && (
                    <>
                        <div className="section-header" style={{ marginTop: "2rem" }}>
                            <h1>Mystery Box Invitations</h1>
                            <p className="muted">
                                These items have been listed for 14+ days. Move them to the Mystery Box to recover value!
                            </p>
                        </div>
                        {mysteryMsg && <p className="detail-msg">{mysteryMsg}</p>}
                        <div className="listing-table-wrap">
                            <table className="listing-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Original Price</th>
                                        <th>Box Tier</th>
                                        <th>You Receive (70%)</th>
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
                                                <td>{tier ? <span className="status-badge status-mystery">{tier.label}</span> : <span className="muted">Too expensive</span>}</td>
                                                <td>{tier ? formatHKD(tier.price * 0.7) : "—"}</td>
                                                <td>
                                                    {tier ? (
                                                        <button className="btn btn-fill" onClick={() => handleMoveToMysteryBox(p.id)}>
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
                    </>
                )}

                {/* ---- Mystery Box Purchases ---- */}
                <div className="section-header" style={{ marginTop: "2rem" }}>
                    <h1>My Mystery Box Purchases</h1>
                    <p className="muted">{mysteryPurchases.length} box{mysteryPurchases.length !== 1 ? "es" : ""} opened</p>
                </div>

                {mysteryPurchases.length === 0 ? (
                    <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                        <p className="muted">You have not purchased any mystery boxes yet.</p>
                        <Link href="/mystery-box" className="btn btn-fill" style={{ marginTop: "1rem", display: "inline-block" }}>
                            Browse Mystery Boxes
                        </Link>
                    </div>
                ) : (
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
                                {mysteryPurchases.map((p) => (
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
                )}
            </main>
        </div>
    );
}
