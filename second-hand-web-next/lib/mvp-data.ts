import { CartItem, Order, Product } from "@/lib/mvp-types";

const PRODUCTS_KEY = "secondlife-products";
const CART_KEY = "secondlife-cart";
const ORDERS_KEY = "secondlife-orders";

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

export const getProducts = (): Product[] => {
  if (!ensureBrowser()) return demoProducts;
  const stored = safeParse<Product[]>(localStorage.getItem(PRODUCTS_KEY), []);
  if (stored.length === 0) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(demoProducts));
    return demoProducts;
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

