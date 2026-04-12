import {
  BuyOrder,
  CartItem,
  MysteryBoxPurchase,
  MysteryBoxTier,
  MYSTERY_BOX_TIERS,
  Order,
  Product,
  RentalListing,
  RentalRequest,
  RentalOrder,
} from "@/lib/mvp-types";

const PRODUCTS_KEY = "secondlife-products";
const BUY_ORDERS_KEY = "secondlife-buy-orders";
const CART_KEY = "secondlife-cart";
const ORDERS_KEY = "secondlife-orders";
const LIKES_KEY = "secondlife-user-likes";
const RENTALS_KEY = "secondlife-rentals";
const RENTAL_REQUESTS_KEY = "secondlife-rental-requests";
const RENTAL_ORDERS_KEY = "secondlife-rental-orders";
const MYSTERY_BOX_PURCHASES_KEY = "secondlife-mystery-box-purchases";

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
    sustainabilityTag: "Upcycled",
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
    sustainabilityTag: "Recyclable",
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
    sustainabilityTag: "Upcycled",
  },
];

const demoBuyOrders: BuyOrder[] = [
  {
    id: "b1",
    title: "Looking for a used MacBook Air",
    description:
      "Need a lightweight laptop for schoolwork and travel. Prefer good battery health and charger included.",
    budget: 4200,
    category: "Electronics",
    condition: "Good",
    image: "/window.svg",
    location: "Kowloon Tong",
    buyerName: "Grace Chan",
    buyerAccount: "gracechan",
    status: "open",
    createdAt: "2026-04-01T09:00:00.000Z",
  },
  {
    id: "b2",
    title: "Need a compact study desk",
    description:
      "Searching for a small desk that fits in a student flat. Wood finish preferred, but open to other styles.",
    budget: 900,
    category: "Furniture",
    condition: "Fair",
    image: "",
    location: "Sham Shui Po",
    buyerName: "Jason Ho",
    buyerAccount: "jasonho",
    status: "open",
    createdAt: "2026-04-04T13:30:00.000Z",
  },
  {
    id: "b3",
    title: "Looking for kids' bicycle",
    description:
      "Buying a safe second-hand bicycle for weekend rides. Open to 16-18 inch frames and basic accessories.",
    budget: 650,
    category: "Sports",
    condition: "Like New",
    image: "",
    location: "Tsuen Wan",
    buyerName: "Mina Wong",
    buyerAccount: "minawong",
    status: "open",
    createdAt: "2026-04-07T18:15:00.000Z",
  },
];

const demoRentals: RentalListing[] = [
  {
    id: "r1",
    title: "Sony A7 III Camera Body",
    description:
      "Full-frame mirrorless camera available for short-term rental. Ideal for events, travel, or trying before buying. Comes with battery and charger.",
    dailyPrice: 180,
    deposit: 2000,
    minDays: 1,
    maxDays: 14,
    category: "Electronics",
    condition: "Good",
    image: "/window.svg",
    location: "Central",
    ownerName: "Derek Lam",
    ownerAccount: "dereklam",
    status: "available",
    likes: 4,
    createdAt: "2026-03-25T08:00:00.000Z",
  },
  {
    id: "r2",
    title: "Camping Tent (4-Person)",
    description:
      "Waterproof dome tent perfect for weekend camping trips. Easy to set up. Includes carry bag and stakes.",
    dailyPrice: 60,
    deposit: 300,
    minDays: 2,
    maxDays: 7,
    category: "Sports",
    condition: "Like New",
    image: "/globe.svg",
    location: "Tai Po",
    ownerName: "Fiona Yip",
    ownerAccount: "fionayip",
    status: "available",
    likes: 6,
    createdAt: "2026-03-28T12:00:00.000Z",
  },
  {
    id: "r3",
    title: "Stand Mixer – KitchenAid",
    description:
      "Rent for baking projects or holiday cooking. Comes with whisk, paddle, and dough hook attachments.",
    dailyPrice: 45,
    deposit: 500,
    minDays: 1,
    maxDays: 10,
    category: "Appliances",
    condition: "Good",
    image: "/next.svg",
    location: "Sha Tin",
    ownerName: "Alan Tse",
    ownerAccount: "alantse",
    status: "available",
    likes: 2,
    createdAt: "2026-04-02T09:30:00.000Z",
  },
];

const demoRentalRequests: RentalRequest[] = [
  {
    id: "rr1",
    title: "Need a projector for class presentation",
    description:
      "Looking to rent a portable projector for 2-3 days. HDMI input required and brightness should be suitable for classroom use.",
    dailyBudget: 120,
    minDays: 2,
    maxDays: 3,
    category: "Electronics",
    condition: "Good",
    image: "/window.svg",
    location: "Kowloon Tong",
    requesterName: "Chloe Ng",
    requesterAccount: "chloeng",
    status: "open",
    createdAt: "2026-04-05T10:20:00.000Z",
  },
  {
    id: "rr2",
    title: "Looking for baby stroller rental",
    description:
      "Need a clean and foldable stroller for an 8-day family visit. Prefer easy transport and safety belt included.",
    dailyBudget: 55,
    minDays: 7,
    maxDays: 10,
    category: "Other",
    condition: "Like New",
    image: "",
    location: "Tseung Kwan O",
    requesterName: "Ivy Cheung",
    requesterAccount: "ivycheung",
    status: "open",
    createdAt: "2026-04-08T16:45:00.000Z",
  },
  {
    id: "rr3",
    title: "Renting camping cookware set",
    description:
      "Seeking a basic camping cookware set for a weekend trip. Pot, pan, and kettle preferred. Pick-up around New Territories.",
    dailyBudget: 40,
    minDays: 2,
    maxDays: 4,
    category: "Sports",
    condition: "Fair",
    image: "",
    location: "Tai Wai",
    requesterName: "Ryan Lau",
    requesterAccount: "ryanlau",
    status: "open",
    createdAt: "2026-04-10T08:10:00.000Z",
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
      } catch {
        /* ignore */
      }
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

export const getBuyOrders = (): BuyOrder[] => {
  if (!ensureBrowser()) return demoBuyOrders;
  const stored = safeParse<BuyOrder[]>(
    localStorage.getItem(BUY_ORDERS_KEY),
    [],
  );
  if (stored.length === 0) {
    localStorage.setItem(BUY_ORDERS_KEY, JSON.stringify(demoBuyOrders));
    return demoBuyOrders;
  }

  // Ensure at least one demo buy request has an image for marketplace preview.
  const hasImageOrder = stored.some(
    (order) => order.image && order.image.trim(),
  );
  if (!hasImageOrder) {
    const imageDemo = demoBuyOrders.find(
      (order) => order.image && order.image.trim(),
    );
    if (imageDemo && !stored.some((order) => order.id === imageDemo.id)) {
      const migrated = [imageDemo, ...stored];
      localStorage.setItem(BUY_ORDERS_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }

  return stored;
};

export const addBuyOrder = (order: BuyOrder): void => {
  if (!ensureBrowser()) return;
  const buyOrders = getBuyOrders();
  localStorage.setItem(BUY_ORDERS_KEY, JSON.stringify([order, ...buyOrders]));
};

export const getBuyOrdersByAccount = (account: string): BuyOrder[] =>
  getBuyOrders().filter((order) => order.buyerAccount === account);

export const updateBuyOrder = (
  id: string,
  updates: Partial<BuyOrder>,
): void => {
  if (!ensureBrowser()) return;
  const buyOrders = getBuyOrders();
  const index = buyOrders.findIndex((order) => order.id === id);
  if (index === -1) return;
  buyOrders[index] = { ...buyOrders[index], ...updates };
  localStorage.setItem(BUY_ORDERS_KEY, JSON.stringify(buyOrders));
};

export const deleteBuyOrder = (id: string): void => {
  if (!ensureBrowser()) return;
  const buyOrders = getBuyOrders().filter((order) => order.id !== id);
  localStorage.setItem(BUY_ORDERS_KEY, JSON.stringify(buyOrders));
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
  const all = safeParse<Record<string, string[]>>(
    localStorage.getItem(LIKES_KEY),
    {},
  );
  return all[user] || [];
};

const setUserLikes = (liked: string[]): void => {
  if (!ensureBrowser()) return;
  const user = getCurrentAccount();
  if (!user) return;
  const all = safeParse<Record<string, string[]>>(
    localStorage.getItem(LIKES_KEY),
    {},
  );
  all[user] = liked;
  localStorage.setItem(LIKES_KEY, JSON.stringify(all));
};

export const hasUserLiked = (productId: string): boolean =>
  getUserLikes().includes(productId);

export const toggleLike = (
  productId: string,
): { liked: boolean; newCount: number } => {
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

/* ---- Rentals ---- */

export const getRentals = (): RentalListing[] => {
  if (!ensureBrowser()) return demoRentals;
  const stored = safeParse<RentalListing[]>(
    localStorage.getItem(RENTALS_KEY),
    [],
  );
  if (stored.length === 0) {
    localStorage.setItem(RENTALS_KEY, JSON.stringify(demoRentals));
    return demoRentals;
  }
  return stored;
};

export const addRental = (rental: RentalListing): void => {
  if (!ensureBrowser()) return;
  const rentals = getRentals();
  localStorage.setItem(RENTALS_KEY, JSON.stringify([rental, ...rentals]));
};

export const getRentalRequests = (): RentalRequest[] => {
  if (!ensureBrowser()) return demoRentalRequests;
  const stored = safeParse<RentalRequest[]>(
    localStorage.getItem(RENTAL_REQUESTS_KEY),
    [],
  );
  if (stored.length === 0) {
    localStorage.setItem(
      RENTAL_REQUESTS_KEY,
      JSON.stringify(demoRentalRequests),
    );
    return demoRentalRequests;
  }
  return stored;
};

export const addRentalRequest = (request: RentalRequest): void => {
  if (!ensureBrowser()) return;
  const requests = getRentalRequests();
  localStorage.setItem(
    RENTAL_REQUESTS_KEY,
    JSON.stringify([request, ...requests]),
  );
};

export const getRentalRequestsByAccount = (account: string): RentalRequest[] =>
  getRentalRequests().filter((request) => request.requesterAccount === account);

export const updateRentalRequest = (
  id: string,
  updates: Partial<RentalRequest>,
): void => {
  if (!ensureBrowser()) return;
  const requests = getRentalRequests();
  const idx = requests.findIndex((request) => request.id === id);
  if (idx === -1) return;
  requests[idx] = { ...requests[idx], ...updates };
  localStorage.setItem(RENTAL_REQUESTS_KEY, JSON.stringify(requests));
};

export const updateRental = (
  id: string,
  updates: Partial<RentalListing>,
): void => {
  if (!ensureBrowser()) return;
  const rentals = getRentals();
  const idx = rentals.findIndex((r) => r.id === id);
  if (idx === -1) return;
  rentals[idx] = { ...rentals[idx], ...updates };
  localStorage.setItem(RENTALS_KEY, JSON.stringify(rentals));
};

export const getRentalsByAccount = (account: string): RentalListing[] =>
  getRentals().filter((r) => r.ownerAccount === account);

export const getRentalOrders = (): RentalOrder[] => {
  if (!ensureBrowser()) return [];
  return safeParse<RentalOrder[]>(localStorage.getItem(RENTAL_ORDERS_KEY), []);
};

export const addRentalOrder = (order: RentalOrder): void => {
  if (!ensureBrowser()) return;
  const orders = getRentalOrders();
  localStorage.setItem(RENTAL_ORDERS_KEY, JSON.stringify([order, ...orders]));
};

export const getRentalOrdersByAccount = (account: string): RentalOrder[] =>
  getRentalOrders().filter((o) => o.renterAccount === account);

export const updateRentalOrder = (
  id: string,
  updates: Partial<RentalOrder>,
): void => {
  if (!ensureBrowser()) return;
  const orders = getRentalOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return;
  orders[idx] = { ...orders[idx], ...updates };
  localStorage.setItem(RENTAL_ORDERS_KEY, JSON.stringify(orders));
};

/* ---- Mystery Box ---- */

/** How many days a product needs to be listed before qualifying for mystery box */
const MYSTERY_BOX_STALE_DAYS = 14;

/** Get products that qualify for mystery box invitation (stale, unsold, not yet invited) */
export const getStaleProducts = (account: string): Product[] => {
  const now = Date.now();
  return getProducts().filter((p) => {
    if (p.sellerAccount !== account) return false;
    if (p.status !== "selling") return false;
    if (p.inMysteryBox) return false;
    const age = now - new Date(p.createdAt).getTime();
    return age >= MYSTERY_BOX_STALE_DAYS * 24 * 60 * 60 * 1000;
  });
};

/** Move a product into the mystery box pool */
export const moveToMysteryBox = (productId: string): void => {
  updateProduct(productId, {
    status: "mystery-box",
    inMysteryBox: true,
    mysteryBoxInvited: true,
  });
};

/** Get all products currently in the mystery box pool */
export const getMysteryBoxProducts = (): Product[] =>
  getProducts().filter((p) => p.inMysteryBox && p.status === "mystery-box");

/** Determine which tier a product belongs to based on its original price */
export const getProductTier = (
  price: number,
): (typeof MYSTERY_BOX_TIERS)[number] | null => {
  for (const tier of MYSTERY_BOX_TIERS) {
    if (price <= tier.maxOriginalPrice) return tier;
  }
  return null;
};

/** Count items per tier currently in the mystery box pool */
export const getMysteryBoxCounts = (): Record<string, number> => {
  const products = getMysteryBoxProducts();
  const counts: Record<string, number> = {};
  for (const tier of MYSTERY_BOX_TIERS) {
    counts[tier.tier] = 0;
  }
  for (const p of products) {
    const tier = getProductTier(p.price);
    if (tier) {
      counts[tier.tier] = (counts[tier.tier] || 0) + 1;
    }
  }
  return counts;
};

/** Purchase a mystery box — picks a random product from the tier */
export const purchaseMysteryBox = (
  tierKey: string,
  buyerAccount: string,
): MysteryBoxPurchase | null => {
  const tier = MYSTERY_BOX_TIERS.find((t) => t.tier === tierKey);
  if (!tier) return null;

  const products = getMysteryBoxProducts().filter((p) => {
    const t = getProductTier(p.price);
    return t?.tier === tierKey;
  });

  if (products.length === 0) return null;

  const picked = products[Math.floor(Math.random() * products.length)];

  // Mark the product as sold and remove from mystery box pool
  updateProduct(picked.id, { status: "sold", inMysteryBox: false });

  const purchase: MysteryBoxPurchase = {
    id: crypto.randomUUID(),
    tier: tier.tier,
    pricePaid: tier.price,
    productId: picked.id,
    productTitle: picked.title,
    originalPrice: picked.price,
    buyerAccount,
    createdAt: new Date().toISOString(),
  };

  // save purchase
  const purchases = getMysteryBoxPurchases();
  localStorage.setItem(
    MYSTERY_BOX_PURCHASES_KEY,
    JSON.stringify([purchase, ...purchases]),
  );

  return purchase;
};

export const getMysteryBoxPurchases = (): MysteryBoxPurchase[] => {
  if (!ensureBrowser()) return [];
  return safeParse<MysteryBoxPurchase[]>(
    localStorage.getItem(MYSTERY_BOX_PURCHASES_KEY),
    [],
  );
};

export const getMysteryBoxPurchasesByAccount = (
  account: string,
): MysteryBoxPurchase[] =>
  getMysteryBoxPurchases().filter((p) => p.buyerAccount === account);
