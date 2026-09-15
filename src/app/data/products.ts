// Product display type shared across customer pages. Instances are produced by
// mapProductSummary (app/api/productmap.ts) from backend API payloads.

export type Brand = {
  name: string;
};

export type Product = {
  id: string;
  brand: string;
  sku: string;
  name: string;
  pack: string;
  rating: number;
  reviews: number;
  discount: number;
  mrp: number;
  price: number;
  bulkRate: number;
  bulkMoq: number;
  moq: number;
  inStock: boolean;
  stockStatus?: string;
  dispatch: string;
  image?: string;
  swatch: string;
  accent: string;
};

export const BRANDS: Brand[] = [];

export const PRODUCTS: Product[] = [];