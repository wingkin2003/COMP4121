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

export type ProductStatus = "selling" | "sold" | "expired" | "unpublished";

export const PRODUCT_STATUSES: ProductStatus[] = [
  "selling",
  "sold",
  "expired",
  "unpublished",
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
