// Product tabs, filter categories and brand lists are derived at runtime from
// the catalog API (see components/NewArrivals/NewArrivalsResults.tsx).
// All static content is fetched dynamically from the backend API.

import type { Product } from "@/app/data/products";

export const NEW_ARRIVAL_SORT_OPTIONS: string[] = [];

export type NewArrivalFeature = {
  title: string;
  desc: string;
};

// Fallback when GET /content?section=na_features is empty or fails
// (mirrors ContentSeeds in ContentModule.cs).
export const NEW_ARRIVAL_FEATURES: NewArrivalFeature[] = [
  { title: "Fresh Stock Weekly", desc: "New products added every week." },
  { title: "Introductory Prices", desc: "Launch discounts on new arrivals." },
  { title: "Verified Suppliers", desc: "Every listing is quality checked." },
  { title: "Fast Dispatch", desc: "Orders ship within 24 hours." },
];

export type NewArrivalPerk = {
  title: string;
  desc: string;
};

export const NEW_ARRIVAL_PERKS: NewArrivalPerk[] = [
  { title: "Early Access", desc: "Shop new launches before everyone else." },
  { title: "Launch Offers", desc: "Extra savings on freshly added products." },
  { title: "Curated Picks", desc: "Handpicked products from top brands." },
  { title: "Fresh Inventory", desc: "Stock rotates with every new drop." },
];

export const NEW_ARRIVAL_TRUST_STRIP: string[] = [
  "Quality Checked",
  "GST Invoiced",
  "Easy Returns",
  "Secure Payments",
];

export type NewArrivalProduct = Product & {
  moqUnit: string;
  tabCategory: string;
  filterCategory: string;
};

export const NEW_ARRIVAL_PRODUCTS: NewArrivalProduct[] = [];