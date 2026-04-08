import { CartItem, Order, Product, ProductStatus } from "@/lib/mvp-types";

const PRODUCTS_KEY = "secondlife-products";
const CART_KEY = "secondlife-cart";
const ORDERS_KEY = "secondlife-orders";
const LIKES_KEY = "secondlife-user-likes";

const demoProducts: Product[] = [
  {
    id: "p1",
    title: "iPhone 13 128GB",
    description:
      "Excellent condition, battery health at 88%. Includes original box and charging cable.",
    price: 3300,
    category: "Electronics",
    condition: "Good",
    image: "/window.svg",
    location: "Mong Kok",
    sellerName: "Ken Wong",
    sellerAccount: "kenwong",
    status: "selling",
    likes: 5,
    createdAt: "2026-03-10T10:00:00.000Z",
  },
  {
    id: "p2",
    title: "Solid Oak Study Desk",
    description:
      "Sturdy desk suitable for home office. Light signs of wear, structurally perfect.",
    price: 1200,
    category: "Furniture",
    condition: "Good",
    image: "/next.svg",
    location: "Sha Tin",
    sellerName: "May Chan",
    sellerAccount: "maychan",
    status: "selling",
    likes: 2,
    createdAt: "2026-03-14T10:00:00.000Z",
  },
  {
    id: "p3",
    title: "Adidas Running Shoes US9",
    description:
      "Used only a few times. Clean sole, no tears, perfect for casual training.",
    price: 380,
    category: "Fashion",
    condition: "Like New",
    image: "/vercel.svg",
    location: "Tsuen Wan",
    sellerName: "Jason Lee",
    sellerAccount: "jasonlee",
    status: "selling",
    likes: 8,
    createdAt: "2026-03-18T10:00:00.000Z",
  },
  {
    id: "p4",
    title: "Air Fryer 4L",
    description:
      "Fully working appliance with basket and manual. Good for small households.",
    price: 450,
    category: "Appliances",
    condition: "Fair",
    image: "/globe.svg",
    location: "Yuen Long",
    sellerName: "Clara Ho",
    sellerAccount: "claraho",
    status: "selling",
    likes: 3,
    createdAt: "2026-03-20T10:00:00.000Z",
  },
];

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const ensureBrowser = () => typeof window !== "undefined";

export const getCurrentAccount = (): string => {
  if (!ensureBrowser()) return "";
  const raw = localStorage.getItem("currentUser");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return parsed.username || "";
  } catch {
    return raw;
  }
};

export const getProducts = (): Product[] => {
  if (!ensureBrowser()) return demoProducts;
  const stored = safeParse<Product[]>(localStorage.getItem(PRODUCTS_KEY), []);
  if (stored.length === 0) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(demoProducts));
    return demoProducts;
  }

  // migrate old products: fix sellerAccount stored as JSON string
  let dirty = false;
  for (const p of stored) {
    if (p.sellerAccount && p.sellerAccount.startsWith("{")) {
      try {
        const parsed = JSON.parse(p.sellerAccount);
        p.sellerAccount = parsed.username || "";
        dirty = true;
      } catch { /* ignore */ }
    }
    if (!p.status) {
      p.status = "selling";
      dirty = true;
    }
    if (p.likes == null) {
      p.likes = 0;
      dirty = true;
    }
  }
  if (dirty) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(stored));
  }

  return stored;
};

export const addProduct = (product: Product): void => {
  if (!ensureBrowser()) return;
  const products = getProducts();
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify([product, ...products]));
};

export const getCart = (): CartItem[] => {
  if (!ensureBrowser()) return [];
  return safeParse<CartItem[]>(localStorage.getItem(CART_KEY), []);
};

export const setCart = (items: CartItem[]): void => {
  if (!ensureBrowser()) return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
};

export const addToCart = (productId: string): void => {
  const current = getCart();
  const existing = current.find((item) => item.productId === productId);
  if (existing) {
    setCart(
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
    return;
  }
  setCart([...current, { productId, quantity: 1 }]);
};

export const getOrders = (): Order[] => {
  if (!ensureBrowser()) return [];
  return safeParse<Order[]>(localStorage.getItem(ORDERS_KEY), []);
};

export const addOrder = (order: Order): void => {
  if (!ensureBrowser()) return;
  const existing = getOrders();
  localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...existing]));
};

/* ---- likes ---- */

const getUserLikes = (): string[] => {
  if (!ensureBrowser()) return [];
  const user = getCurrentAccount();
  if (!user) return [];
  const all = safeParse<Record<string, string[]>>(localStorage.getItem(LIKES_KEY), {});
  return all[user] || [];
};

const setUserLikes = (liked: string[]): void => {
  if (!ensureBrowser()) return;
  const user = getCurrentAccount();
  if (!user) return;
  const all = safeParse<Record<string, string[]>>(localStorage.getItem(LIKES_KEY), {});
  all[user] = liked;
  localStorage.setItem(LIKES_KEY, JSON.stringify(all));
};

export const hasUserLiked = (productId: string): boolean =>
  getUserLikes().includes(productId);

export const toggleLike = (productId: string): { liked: boolean; newCount: number } => {
  const liked = getUserLikes();
  const products = getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return { liked: false, newCount: 0 };

  const alreadyLiked = liked.includes(productId);
  if (alreadyLiked) {
    setUserLikes(liked.filter((id) => id !== productId));
    product.likes = Math.max(0, (product.likes || 0) - 1);
  } else {
    setUserLikes([...liked, productId]);
    product.likes = (product.likes || 0) + 1;
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  return { liked: !alreadyLiked, newCount: product.likes };
};

/* ---- product updates ---- */

export const updateProduct = (id: string, updates: Partial<Product>): void => {
  if (!ensureBrowser()) return;
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return;
  products[idx] = { ...products[idx], ...updates };
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const getProductsByAccount = (account: string): Product[] =>
  getProducts().filter((p) => p.sellerAccount === account);

