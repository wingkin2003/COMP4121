export type ProductCondition = "Like New" | "Good" | "Fair" | "Poor";

export type ProductCategory =
  | "Electronics"
  | "Furniture"
  | "Fashion"
  | "Books"
  | "Appliances"
  | "Toys"
  | "Sports"
  | "Other";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Electronics",
  "Furniture",
  "Fashion",
  "Books",
  "Appliances",
  "Toys",
  "Sports",
  "Other",
];

export const PRODUCT_CONDITIONS: ProductCondition[] = [
  "Like New",
  "Good",
  "Fair",
  "Poor",
];

export type ProductStatus =
  | "selling"
  | "sold"
  | "expired"
  | "unpublished"
  | "mystery-box";

export const PRODUCT_STATUSES: ProductStatus[] = [
  "selling",
  "sold",
  "expired",
  "unpublished",
  "mystery-box",
];

export type SustainabilityTag = "Recyclable" | "Upcycled";

export const SUSTAINABILITY_TAGS: SustainabilityTag[] = [
  "Recyclable",
  "Upcycled",
];

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  condition: ProductCondition;
  image: string;
  location: string;
  sellerName: string;
  sellerAccount: string;
  status: ProductStatus;
  likes: number;
  createdAt: string;
  /** If true, seller has been invited to move this to mystery box */
  mysteryBoxInvited?: boolean;
  /** If true, seller has accepted and item is in mystery box pool */
  inMysteryBox?: boolean;
  /** Optional sustainability tag (Recyclable or Upcycled) */
  sustainabilityTag?: SustainabilityTag;
};

export type BuyOrder = {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: ProductCategory;
  condition: ProductCondition;
  image: string;
  location: string;
  buyerName: string;
  buyerAccount: string;
  status: "open" | "matched" | "closed";
  createdAt: string;
};

/* ---- Rental ---- */

export type RentalStatus = "available" | "rented" | "returned" | "unpublished";

export const RENTAL_STATUSES: RentalStatus[] = [
  "available",
  "rented",
  "returned",
  "unpublished",
];

export type RentalListing = {
  id: string;
  title: string;
  description: string;
  dailyPrice: number;
  deposit: number;
  minDays: number;
  maxDays: number;
  category: ProductCategory;
  condition: ProductCondition;
  image: string;
  location: string;
  ownerName: string;
  ownerAccount: string;
  status: RentalStatus;
  likes: number;
  createdAt: string;
};

export type RentalRequest = {
  id: string;
  title: string;
  description: string;
  dailyBudget: number;
  minDays: number;
  maxDays: number;
  category: ProductCategory;
  condition: ProductCondition;
  image: string;
  location: string;
  requesterName: string;
  requesterAccount: string;
  status: "open" | "matched" | "closed";
  createdAt: string;
};

export type RentalOrder = {
  id: string;
  rentalId: string;
  renterAccount: string;
  renterName: string;
  days: number;
  rentalFee: number;
  deposit: number;
  commission: number;
  total: number;
  startDate: string;
  endDate: string;
  rentalTitle: string;
  status: "active" | "returned" | "overdue" | "cancelled";
  createdAt: string;
};

/* ---- Mystery Box ---- */

export type MysteryBoxTier = "$50" | "$150" | "$300" | "$500" | "$1500";

export const MYSTERY_BOX_TIERS: {
  tier: MysteryBoxTier;
  label: string;
  price: number;
  maxOriginalPrice: number;
  description: string;
}[] = [
  {
    tier: "$50",
    label: "$50 Box",
    price: 50,
    maxOriginalPrice: 100,
    description: "Items originally ≤ HK$100",
  },
  {
    tier: "$150",
    label: "$150 Box",
    price: 150,
    maxOriginalPrice: 300,
    description: "Items originally HK$101–300",
  },
  {
    tier: "$300",
    label: "$300 Box",
    price: 300,
    maxOriginalPrice: 500,
    description: "Items originally HK$301–500",
  },
  {
    tier: "$500",
    label: "$500 Box",
    price: 500,
    maxOriginalPrice: 1000,
    description: "Items originally HK$501–1,000",
  },
  {
    tier: "$1500",
    label: "$1500 Box",
    price: 1500,
    maxOriginalPrice: 3000,
    description: "Items originally HK$1,001–3,000",
  },
];

export type MysteryBoxPurchase = {
  id: string;
  tier: MysteryBoxTier;
  pricePaid: number;
  productId: string;
  productTitle: string;
  originalPrice: number;
  buyerAccount: string;
  createdAt: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  commission: number;
  sellerPayout: number;
  total: number;
  shippingAddress: string;
};
