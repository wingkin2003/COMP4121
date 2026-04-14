const API_BASE_RAW = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = API_BASE_RAW.replace(/\/+$/, "");

// ── Token management ──

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("jwt_token");
}

export function setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("jwt_token", token);
}

export function clearToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("jwt_token");
}

// ── Core fetch wrapper ──

async function apiFetch<T = unknown>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Only set Content-Type for non-FormData bodies
    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new ApiError(res.status, body.detail || "Request failed");
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// ── Auth ──

export interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface UserProfile {
    username: string;
    email: string;
    created_at: string;
}

export const authApi = {
    async register(username: string, email: string, password: string): Promise<TokenResponse> {
        const data = await apiFetch<TokenResponse>("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, email, password }),
        });
        setToken(data.access_token);
        return data;
    },

    async login(username: string, password: string): Promise<TokenResponse> {
        const data = await apiFetch<TokenResponse>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });
        setToken(data.access_token);
        return data;
    },

    logout(): void {
        clearToken();
        localStorage.removeItem("currentUser");
        localStorage.removeItem("isLoggedIn");
    },

    async getMe(): Promise<UserProfile> {
        return apiFetch<UserProfile>("/api/auth/me");
    },

    async updateMe(email: string): Promise<UserProfile> {
        return apiFetch<UserProfile>("/api/auth/me", {
            method: "PATCH",
            body: JSON.stringify({ email }),
        });
    },
};

// ── Products ──

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    image: string;
    location: string;
    seller_name: string;
    seller_account: string;
    status: string;
    likes: number;
    created_at: string;
    sustainability_tag: string | null;
    in_mystery_box: boolean;
    mystery_box_invited: boolean;
}

export interface ProductFilters {
    status?: string;
    q?: string;
    category?: string;
    condition?: string;
    sustainability_tag?: string;
    sort?: string;
    seller_account?: string;
}

export const productsApi = {
    async list(filters: ProductFilters = {}): Promise<Product[]> {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(filters)) {
            if (v) params.set(k, v);
        }
        const qs = params.toString();
        return apiFetch<Product[]>(`/api/products${qs ? "?" + qs : ""}`);
    },

    async get(id: string): Promise<Product> {
        return apiFetch<Product>(`/api/products/${id}`);
    },

    async create(data: Partial<Product>): Promise<Product> {
        return apiFetch<Product>("/api/products", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Product>): Promise<Product> {
        return apiFetch<Product>(`/api/products/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    async toggleLike(id: string): Promise<{ liked: boolean; likes: number }> {
        return apiFetch(`/api/products/${id}/like`, { method: "POST" });
    },

    async checkLiked(id: string): Promise<{ liked: boolean }> {
        return apiFetch(`/api/products/${id}/liked`);
    },

    async getStale(): Promise<Product[]> {
        return apiFetch<Product[]>("/api/products/stale");
    },

    async moveToMysteryBox(id: string): Promise<Product> {
        return apiFetch<Product>(`/api/products/${id}/move-to-mystery-box`, {
            method: "POST",
        });
    },
};

// ── Buy Orders ──

export interface BuyOrder {
    id: string;
    title: string;
    description: string;
    budget: number;
    category: string;
    condition: string;
    image: string;
    location: string;
    buyer_name: string;
    buyer_account: string;
    status: string;
    created_at: string;
}

export interface BuyOrderFilters {
    status?: string;
    q?: string;
    category?: string;
    condition?: string;
    sort?: string;
    buyer_account?: string;
}

export const buyOrdersApi = {
    async list(filters: BuyOrderFilters = {}): Promise<BuyOrder[]> {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(filters)) {
            if (v) params.set(k, v);
        }
        const qs = params.toString();
        return apiFetch<BuyOrder[]>(`/api/buy-orders${qs ? "?" + qs : ""}`);
    },

    async get(id: string): Promise<BuyOrder> {
        return apiFetch<BuyOrder>(`/api/buy-orders/${id}`);
    },

    async create(data: Partial<BuyOrder>): Promise<BuyOrder> {
        return apiFetch<BuyOrder>("/api/buy-orders", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<BuyOrder>): Promise<BuyOrder> {
        return apiFetch<BuyOrder>(`/api/buy-orders/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        return apiFetch(`/api/buy-orders/${id}`, { method: "DELETE" });
    },

    async negotiate(data: {
        buy_order_id: string;
        mode?: string;
        seller_name?: string;
        seller_phone?: string;
        selling_item_title?: string;
        offered_price: number;
        condition?: string;
        meetup_location?: string;
        note?: string;
    }): Promise<unknown> {
        return apiFetch("/api/buy-orders/negotiations", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
};

// ── Rentals ──

export interface RentalListing {
    id: string;
    title: string;
    description: string;
    daily_price: number;
    deposit: number;
    min_days: number;
    max_days: number;
    category: string;
    condition: string;
    image: string;
    location: string;
    owner_name: string;
    owner_account: string;
    status: string;
    likes: number;
    created_at: string;
}

export interface RentalRequest {
    id: string;
    title: string;
    description: string;
    daily_budget: number;
    deposit: number;
    min_days: number;
    max_days: number;
    category: string;
    condition: string;
    image: string;
    location: string;
    requester_name: string;
    requester_account: string;
    status: string;
    created_at: string;
}

export interface RentalOrder {
    id: string;
    rental_id: string;
    renter_account: string;
    renter_name: string;
    days: number;
    rental_fee: number;
    deposit: number;
    commission: number;
    total: number;
    start_date: string;
    end_date: string;
    rental_title: string;
    status: string;
    created_at: string;
}

export interface RentalFilters {
    status?: string;
    q?: string;
    category?: string;
    condition?: string;
    sort?: string;
    owner_account?: string;
}

export const rentalsApi = {
    // Rental listings
    async list(filters: RentalFilters = {}): Promise<RentalListing[]> {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(filters)) {
            if (v) params.set(k, v);
        }
        const qs = params.toString();
        return apiFetch<RentalListing[]>(`/api/rentals${qs ? "?" + qs : ""}`);
    },

    async get(id: string): Promise<RentalListing> {
        return apiFetch<RentalListing>(`/api/rentals/${id}`);
    },

    async create(data: Partial<RentalListing>): Promise<RentalListing> {
        return apiFetch<RentalListing>("/api/rentals", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<RentalListing>): Promise<RentalListing> {
        return apiFetch<RentalListing>(`/api/rentals/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Rental requests
    async listRequests(filters: { status?: string; q?: string; category?: string; condition?: string; sort?: string; requester_account?: string } = {}): Promise<RentalRequest[]> {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(filters)) {
            if (v) params.set(k, v);
        }
        const qs = params.toString();
        return apiFetch<RentalRequest[]>(`/api/rental-requests${qs ? "?" + qs : ""}`);
    },

    async createRequest(data: Partial<RentalRequest>): Promise<RentalRequest> {
        return apiFetch<RentalRequest>("/api/rental-requests", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async updateRequest(id: string, data: Partial<RentalRequest>): Promise<RentalRequest> {
        return apiFetch<RentalRequest>(`/api/rental-requests/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Rental orders (bookings)
    async createOrder(data: {
        rental_id: string;
        renter_name?: string;
        days: number;
        start_date?: string;
        pickup_time?: string;
        phone?: string;
        note?: string;
    }): Promise<RentalOrder> {
        return apiFetch<RentalOrder>("/api/rental-orders", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async listOrders(): Promise<RentalOrder[]> {
        return apiFetch<RentalOrder[]>("/api/rental-orders");
    },

    async updateOrder(id: string, data: { status?: string }): Promise<RentalOrder> {
        return apiFetch<RentalOrder>(`/api/rental-orders/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    // Rental lendings
    async createLending(data: {
        request_id: string;
        lender_name?: string;
        lender_phone?: string;
        note?: string;
        days: number;
        rental_fee: number;
        deposit: number;
        start_date?: string;
        end_date?: string;
        pickup_time?: string;
        location?: string;
    }): Promise<unknown> {
        return apiFetch("/api/rental-lendings", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async listLendings(): Promise<unknown[]> {
        return apiFetch<unknown[]>("/api/rental-lendings");
    },
};

// ── Mystery Box ──

export interface MysteryBoxTier {
    tier: string;
    label: string;
    price: number;
    max_original_price: number;
    description: string;
    count: number;
}

export interface MysteryBoxPurchase {
    id: string;
    tier: string;
    price_paid: number;
    product_id: string;
    product_title: string;
    original_price: number;
    buyer_account: string;
    created_at: string;
}

export const mysteryBoxApi = {
    async getTiers(): Promise<MysteryBoxTier[]> {
        return apiFetch<MysteryBoxTier[]>("/api/mystery-box/tiers");
    },

    async purchase(tier: string): Promise<MysteryBoxPurchase> {
        return apiFetch<MysteryBoxPurchase>("/api/mystery-box/purchase", {
            method: "POST",
            body: JSON.stringify({ tier }),
        });
    },

    async getPurchases(): Promise<MysteryBoxPurchase[]> {
        return apiFetch<MysteryBoxPurchase[]>("/api/mystery-box/purchases");
    },
};

// ── Cart ──

export interface CartItem {
    product_id: string;
    quantity: number;
    title: string;
    price: number;
    image: string;
    seller_name: string;
    type: string;
    // mystery box fields
    tier: string;
    tier_label: string;
    // rental fields
    rental_id: string;
    days: number;
    daily_price: number;
    deposit: number;
    commission: number;
    rental_total: number;
    start_date: string;
    end_date: string;
    pickup_time: string;
    renter_name: string;
    renter_phone: string;
    renter_note: string;
    location: string;
    owner_name: string;
}

export interface Cart {
    items: CartItem[];
    subtotal: number;
}

export const cartApi = {
    async get(): Promise<Cart> {
        return apiFetch<Cart>("/api/cart");
    },

    async addItem(product_id: string, quantity = 1): Promise<Cart> {
        return apiFetch<Cart>("/api/cart/items", {
            method: "POST",
            body: JSON.stringify({ product_id, quantity }),
        });
    },

    async addMysteryBox(tier: string): Promise<Cart> {
        return apiFetch<Cart>("/api/cart/mystery-box", {
            method: "POST",
            body: JSON.stringify({ tier }),
        });
    },

    async addRental(data: {
        rental_id: string;
        days: number;
        start_date?: string;
        pickup_time?: string;
        renter_name?: string;
        renter_phone?: string;
        renter_note?: string;
    }): Promise<Cart> {
        return apiFetch<Cart>("/api/cart/rental", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async updateItem(product_id: string, quantity: number): Promise<Cart> {
        return apiFetch<Cart>(`/api/cart/items/${product_id}`, {
            method: "PATCH",
            body: JSON.stringify({ quantity }),
        });
    },

    async removeItem(product_id: string): Promise<Cart> {
        return apiFetch<Cart>(`/api/cart/items/${product_id}`, {
            method: "DELETE",
        });
    },
};

// ── Orders ──

export interface Order {
    id: string;
    created_at: string;
    items: { product_id: string; quantity: number; title: string; price: number }[];
    subtotal: number;
    commission: number;
    seller_payout: number;
    total: number;
    shipping_address: string;
}

export const ordersApi = {
    async create(items: { product_id: string; quantity: number }[], shipping_address: string): Promise<Order> {
        return apiFetch<Order>("/api/orders", {
            method: "POST",
            body: JSON.stringify({ items, shipping_address }),
        });
    },

    async list(): Promise<Order[]> {
        return apiFetch<Order[]>("/api/orders");
    },
};

// ── Comments ──

export interface Comment {
    id: string;
    product_id: string;
    user_account: string;
    text: string;
    parent_id: string | null;
    created_at: string;
    replies: Comment[];
}

export const commentsApi = {
    async list(productId: string): Promise<Comment[]> {
        return apiFetch<Comment[]>(`/api/products/${productId}/comments`);
    },

    async create(productId: string, text: string, parentId?: string): Promise<Comment> {
        return apiFetch<Comment>(`/api/products/${productId}/comments`, {
            method: "POST",
            body: JSON.stringify({ text, parent_id: parentId || null }),
        });
    },
};

// ── Uploads ──

export const uploadsApi = {
    async upload(file: File): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append("file", file);
        return apiFetch<{ url: string }>("/api/uploads", {
            method: "POST",
            body: formData,
        });
    },
};
