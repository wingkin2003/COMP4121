/**
 * api-helpers.ts
 * Adapter layer: wraps lib/api.ts (snake_case responses) and exposes
 * async functions returning camelCase types matching lib/mvp-types.ts.
 *
 * Frontend pages import from here instead of mvp-data.ts.
 */

import {
    authApi,
    productsApi,
    buyOrdersApi,
    rentalsApi,
    mysteryBoxApi,
    cartApi,
    ordersApi,
    commentsApi,
    uploadsApi,
    getToken,
    ApiError,
} from "./api";

import type {
    Product,
    BuyOrder,
    RentalListing,
    RentalRequest,
    RentalOrder,
    RentalLending,
    MysteryBoxPurchase,
    Order,
} from "./mvp-types";

import { MYSTERY_BOX_TIERS } from "./mvp-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Generic snake_case ↔ camelCase converters ──

function snakeToCamel<T>(obj: unknown): T {
    if (Array.isArray(obj)) return obj.map((v) => snakeToCamel(v)) as T;
    if (obj !== null && typeof obj === "object") {
        return Object.entries(obj as Record<string, unknown>).reduce(
            (acc, [key, val]) => {
                const camelKey = key.replace(/_([a-z])/g, (_, c: string) =>
                    c.toUpperCase(),
                );
                acc[camelKey] = snakeToCamel(val);
                return acc;
            },
            {} as Record<string, unknown>,
        ) as T;
    }
    return obj as T;
}

function camelToSnake(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(camelToSnake);
    if (obj !== null && typeof obj === "object") {
        return Object.entries(obj as Record<string, unknown>).reduce(
            (acc, [key, val]) => {
                const snakeKey = key.replace(
                    /[A-Z]/g,
                    (c) => `_${c.toLowerCase()}`,
                );
                acc[snakeKey] = camelToSnake(val);
                return acc;
            },
            {} as Record<string, unknown>,
        );
    }
    return obj;
}

/** Prefix image URLs that come from backend uploads */
export function resolveImageUrl(url: string | undefined | null): string {
    if (!url) return "";
    if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    )
        return url;
    return url; // e.g. /window.svg (Next.js public)
}

function resolveProductImage<T extends { image: string }>(item: T): T {
    return { ...item, image: resolveImageUrl(item.image) };
}

// ── Auth ──

export function getCurrentAccount(): string {
    if (typeof window === "undefined") return "";
    const raw = localStorage.getItem("currentUser");
    if (!raw) return "";
    try {
        return JSON.parse(raw).username || "";
    } catch {
        return "";
    }
}

export function isLoggedIn(): boolean {
    return !!getToken();
}

export async function loginUser(
    username: string,
    password: string,
): Promise<void> {
    await authApi.login(username, password);
    const me = await authApi.getMe();
    localStorage.setItem(
        "currentUser",
        JSON.stringify({ username: me.username, email: me.email }),
    );
    localStorage.setItem("isLoggedIn", "true");
}

export async function registerUser(
    username: string,
    email: string,
    password: string,
): Promise<void> {
    await authApi.register(username, email, password);
    const me = await authApi.getMe();
    localStorage.setItem(
        "currentUser",
        JSON.stringify({ username: me.username, email: me.email }),
    );
    localStorage.setItem("isLoggedIn", "true");
}

export function logoutUser(): void {
    authApi.logout();
}

export async function getUserProfile(): Promise<{
    username: string;
    email: string;
}> {
    const me = await authApi.getMe();
    return { username: me.username, email: me.email };
}

export async function updateUserEmail(
    email: string,
): Promise<{ username: string; email: string }> {
    const updated = await authApi.updateMe(email);
    const raw = localStorage.getItem("currentUser");
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            parsed.email = updated.email;
            localStorage.setItem("currentUser", JSON.stringify(parsed));
        } catch {
            /* ignore */
        }
    }
    return { username: updated.username, email: updated.email };
}

// ── Products ──

export async function getProducts(
    filters: Record<string, string> = {},
): Promise<Product[]> {
    const data = await productsApi.list(filters);
    return snakeToCamel<Product[]>(data).map(resolveProductImage);
}

export async function getProduct(id: string): Promise<Product | null> {
    try {
        const data = await productsApi.get(id);
        return resolveProductImage(snakeToCamel<Product>(data));
    } catch {
        return null;
    }
}

export async function getProductsByAccount(
    account: string,
): Promise<Product[]> {
    return getProducts({ seller_account: account });
}

export async function createProduct(
    data: Record<string, unknown>,
    imageFile?: File,
): Promise<Product> {
    let imageUrl = (data.image as string) || "";
    if (imageFile) {
        const result = await uploadsApi.upload(imageFile);
        imageUrl = result.url;
    }
    const payload: Record<string, unknown> = { ...data, image: imageUrl };
    // Remove client-generated fields the backend doesn't expect
    delete payload.id;
    delete payload.likes;
    delete payload.createdAt;
    delete payload.created_at;
    delete payload.inMysteryBox;
    delete payload.mysteryBoxInvited;
    const snakeData = camelToSnake(payload) as Record<string, unknown>;
    const resp = await productsApi.create(snakeData as Partial<import("./api").Product>);
    return resolveProductImage(snakeToCamel<Product>(resp));
}

export async function updateProduct(
    id: string,
    updates: Record<string, unknown>,
): Promise<Product> {
    const snakeData = camelToSnake(updates) as Record<string, unknown>;
    const resp = await productsApi.update(id, snakeData as Partial<import("./api").Product>);
    return resolveProductImage(snakeToCamel<Product>(resp));
}

export async function toggleLike(
    productId: string,
): Promise<{ liked: boolean; newCount: number }> {
    const resp = await productsApi.toggleLike(productId);
    return { liked: resp.liked, newCount: resp.likes };
}

export async function hasUserLiked(productId: string): Promise<boolean> {
    try {
        const resp = await productsApi.checkLiked(productId);
        return resp.liked;
    } catch {
        return false;
    }
}

export async function getStaleProducts(): Promise<Product[]> {
    const data = await productsApi.getStale();
    return snakeToCamel<Product[]>(data).map(resolveProductImage);
}

export async function moveToMysteryBox(id: string): Promise<Product> {
    const resp = await productsApi.moveToMysteryBox(id);
    return resolveProductImage(snakeToCamel<Product>(resp));
}

// ── Buy Orders ──

export async function getBuyOrders(
    filters: Record<string, string> = {},
): Promise<BuyOrder[]> {
    const data = await buyOrdersApi.list(filters);
    return snakeToCamel<BuyOrder[]>(data).map(resolveProductImage);
}

export async function getBuyOrder(id: string): Promise<BuyOrder | null> {
    try {
        const data = await buyOrdersApi.get(id);
        return resolveProductImage(snakeToCamel<BuyOrder>(data));
    } catch {
        return null;
    }
}

export async function getBuyOrdersByAccount(
    account: string,
): Promise<BuyOrder[]> {
    return getBuyOrders({ buyer_account: account });
}

export async function createBuyOrder(
    data: Record<string, unknown>,
    imageFile?: File,
): Promise<BuyOrder> {
    let imageUrl = (data.image as string) || "";
    if (imageFile) {
        const result = await uploadsApi.upload(imageFile);
        imageUrl = result.url;
    }
    const payload: Record<string, unknown> = { ...data, image: imageUrl };
    delete payload.id;
    delete payload.createdAt;
    delete payload.created_at;
    const snakeData = camelToSnake(payload) as Record<string, unknown>;
    const resp = await buyOrdersApi.create(snakeData as Partial<import("./api").BuyOrder>);
    return resolveProductImage(snakeToCamel<BuyOrder>(resp));
}

export async function updateBuyOrder(
    id: string,
    updates: Record<string, unknown>,
): Promise<BuyOrder> {
    const snakeData = camelToSnake(updates) as Record<string, unknown>;
    const resp = await buyOrdersApi.update(id, snakeData as Partial<import("./api").BuyOrder>);
    return resolveProductImage(snakeToCamel<BuyOrder>(resp));
}

export async function deleteBuyOrder(id: string): Promise<void> {
    await buyOrdersApi.delete(id);
}

export async function addBuyNegotiation(
    data: Record<string, unknown>,
): Promise<unknown> {
    const snakeData = camelToSnake(data) as Record<string, unknown>;
    return buyOrdersApi.negotiate(snakeData as Parameters<typeof buyOrdersApi.negotiate>[0]);
}

// ── Rentals ──

export async function getRentals(
    filters: Record<string, string> = {},
): Promise<RentalListing[]> {
    const data = await rentalsApi.list(filters);
    return snakeToCamel<RentalListing[]>(data).map(resolveProductImage);
}

export async function getRental(id: string): Promise<RentalListing | null> {
    try {
        const data = await rentalsApi.get(id);
        return resolveProductImage(snakeToCamel<RentalListing>(data));
    } catch {
        return null;
    }
}

export async function getRentalsByAccount(
    account: string,
): Promise<RentalListing[]> {
    return getRentals({ owner_account: account });
}

export async function createRental(
    data: Record<string, unknown>,
    imageFile?: File,
): Promise<RentalListing> {
    let imageUrl = (data.image as string) || "";
    if (imageFile) {
        const result = await uploadsApi.upload(imageFile);
        imageUrl = result.url;
    }
    const payload: Record<string, unknown> = { ...data, image: imageUrl };
    delete payload.id;
    delete payload.likes;
    delete payload.createdAt;
    delete payload.created_at;
    const snakeData = camelToSnake(payload) as Record<string, unknown>;
    const resp = await rentalsApi.create(snakeData as Partial<import("./api").RentalListing>);
    return resolveProductImage(snakeToCamel<RentalListing>(resp));
}

export async function updateRental(
    id: string,
    updates: Record<string, unknown>,
): Promise<RentalListing> {
    const snakeData = camelToSnake(updates) as Record<string, unknown>;
    const resp = await rentalsApi.update(id, snakeData as Partial<import("./api").RentalListing>);
    return resolveProductImage(snakeToCamel<RentalListing>(resp));
}

// Rental Requests

export async function getRentalRequests(
    filters: Record<string, string> = {},
): Promise<RentalRequest[]> {
    const data = await rentalsApi.listRequests(filters);
    return snakeToCamel<RentalRequest[]>(data).map(resolveProductImage);
}

export async function getRentalRequest(
    id: string,
): Promise<RentalRequest | null> {
    const requests = await getRentalRequests();
    return requests.find((r) => r.id === id) || null;
}

export async function getRentalRequestsByAccount(
    account: string,
): Promise<RentalRequest[]> {
    return getRentalRequests({ requester_account: account });
}

export async function createRentalRequest(
    data: Record<string, unknown>,
    imageFile?: File,
): Promise<RentalRequest> {
    let imageUrl = (data.image as string) || "";
    if (imageFile) {
        const result = await uploadsApi.upload(imageFile);
        imageUrl = result.url;
    }
    const payload: Record<string, unknown> = { ...data, image: imageUrl };
    delete payload.id;
    delete payload.createdAt;
    delete payload.created_at;
    const snakeData = camelToSnake(payload) as Record<string, unknown>;
    const resp = await rentalsApi.createRequest(snakeData as Partial<import("./api").RentalRequest>);
    return resolveProductImage(snakeToCamel<RentalRequest>(resp));
}

export async function updateRentalRequest(
    id: string,
    updates: Record<string, unknown>,
): Promise<RentalRequest> {
    const snakeData = camelToSnake(updates) as Record<string, unknown>;
    const resp = await rentalsApi.updateRequest(id, snakeData as Partial<import("./api").RentalRequest>);
    return resolveProductImage(snakeToCamel<RentalRequest>(resp));
}

// Rental Orders

export async function getRentalOrders(): Promise<RentalOrder[]> {
    const data = await rentalsApi.listOrders();
    return snakeToCamel<RentalOrder[]>(data);
}

export async function getRentalOrdersByAccount(
    account: string,
): Promise<RentalOrder[]> {
    const orders = await getRentalOrders();
    return orders.filter((o) => o.renterAccount === account);
}

export async function createRentalOrder(
    data: Record<string, unknown>,
): Promise<RentalOrder> {
    const snakeData = camelToSnake(data) as Record<string, unknown>;
    const resp = await rentalsApi.createOrder(
        snakeData as Parameters<typeof rentalsApi.createOrder>[0],
    );
    return snakeToCamel<RentalOrder>(resp);
}

export async function updateRentalOrder(
    id: string,
    updates: Record<string, unknown>,
): Promise<RentalOrder> {
    const snakeData = camelToSnake(updates) as Record<string, unknown>;
    const resp = await rentalsApi.updateOrder(
        id,
        snakeData as { status?: string },
    );
    return snakeToCamel<RentalOrder>(resp);
}

// Rental Lendings

export async function getRentalLendings(): Promise<RentalLending[]> {
    const data = await rentalsApi.listLendings();
    return snakeToCamel<RentalLending[]>(data);
}

export async function getRentalLendingsByAccount(
    account: string,
): Promise<RentalLending[]> {
    const lendings = await getRentalLendings();
    return lendings.filter((l) => l.lenderAccount === account);
}

export async function createRentalLending(
    data: Record<string, unknown>,
): Promise<unknown> {
    const snakeData = camelToSnake(data) as Record<string, unknown>;
    return rentalsApi.createLending(
        snakeData as Parameters<typeof rentalsApi.createLending>[0],
    );
}

// ── Cart ──

export interface CartItemDetail {
    productId: string;
    quantity: number;
    title: string;
    price: number;
    image: string;
    sellerName: string;
}

export async function getCartWithDetails(): Promise<{
    items: CartItemDetail[];
    subtotal: number;
}> {
    const data = await cartApi.get();
    return {
        items: (data.items || []).map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
            title: item.title,
            price: item.price,
            image: resolveImageUrl(item.image),
            sellerName: item.seller_name,
        })),
        subtotal: data.subtotal,
    };
}

export async function addToCart(productId: string): Promise<void> {
    await cartApi.addItem(productId, 1);
}

export async function updateCartItem(
    productId: string,
    quantity: number,
): Promise<void> {
    if (quantity <= 0) {
        await cartApi.removeItem(productId);
    } else {
        await cartApi.updateItem(productId, quantity);
    }
}

export async function removeCartItem(productId: string): Promise<void> {
    await cartApi.removeItem(productId);
}

// ── Orders ──

export async function createOrder(
    items: { productId: string; quantity: number }[],
    shippingAddress: string,
): Promise<Order> {
    const snakeItems = items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
    }));
    const resp = await ordersApi.create(snakeItems, shippingAddress);
    return snakeToCamel<Order>(resp);
}

export async function getOrdersList(): Promise<Order[]> {
    const data = await ordersApi.list();
    return snakeToCamel<Order[]>(data);
}

// ── Mystery Box ──

export async function getMysteryBoxCounts(): Promise<Record<string, number>> {
    const tiers = await mysteryBoxApi.getTiers();
    const counts: Record<string, number> = {};
    for (const tier of tiers) {
        counts[tier.tier] = tier.count;
    }
    return counts;
}

export async function purchaseMysteryBox(
    tier: string,
): Promise<MysteryBoxPurchase | null> {
    try {
        const data = await mysteryBoxApi.purchase(tier);
        return snakeToCamel<MysteryBoxPurchase>(data);
    } catch {
        return null;
    }
}

export async function getMysteryBoxPurchases(): Promise<MysteryBoxPurchase[]> {
    const data = await mysteryBoxApi.getPurchases();
    return snakeToCamel<MysteryBoxPurchase[]>(data);
}

export async function getMysteryBoxPurchasesByAccount(
    account: string,
): Promise<MysteryBoxPurchase[]> {
    const purchases = await getMysteryBoxPurchases();
    return purchases.filter((p) => p.buyerAccount === account);
}

// ── Comments ──

export interface CommentData {
    id: string;
    productId: string;
    userAccount: string;
    text: string;
    parentId: string | null;
    createdAt: string;
    replies: CommentData[];
}

export async function getComments(productId: string): Promise<CommentData[]> {
    const data = await commentsApi.list(productId);
    return snakeToCamel<CommentData[]>(data);
}

export async function addComment(
    productId: string,
    text: string,
    parentId?: string,
): Promise<CommentData> {
    const data = await commentsApi.create(productId, text, parentId);
    return snakeToCamel<CommentData>(data);
}

// ── Upload ──

export async function uploadImage(file: File): Promise<string> {
    const result = await uploadsApi.upload(file);
    return resolveImageUrl(result.url);
}

// ── Mystery Box Tier Helpers ──

export function getProductTier(
    price: number,
): (typeof MYSTERY_BOX_TIERS)[number] | null {
    for (const tier of MYSTERY_BOX_TIERS) {
        if (price <= tier.maxOriginalPrice) return tier;
    }
    return null;
}

// Re-export for convenience
export { ApiError };
