// Product tabs, filter categories and brand lists are derived at runtime from
// the catalog API (see components/NewArrivals/NewArrivalsResults.tsx).
// All static content is fetched dynamically from the backend API.

import type { Product } from "@/app/data/products";

export const NEW_ARRIVAL_SORT_OPTIONS: string[] = [];

export type NewArrivalFeature = {
  title: string;
  desc: string;
};

export const NEW_ARRIVAL_FEATURES: NewArrivalFeature[] = [];

export type NewArrivalPerk = {
  title: string;
  desc: string;
};

export const NEW_ARRIVAL_PERKS: NewArrivalPerk[] = [];

export const NEW_ARRIVAL_TRUST_STRIP: string[] = [];

export type NewArrivalProduct = Product & {
  moqUnit: string;
  tabCategory: string;
  filterCategory: string;
};

export const NEW_ARRIVAL_PRODUCTS: NewArrivalProduct[] = [];