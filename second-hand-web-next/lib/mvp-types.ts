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
