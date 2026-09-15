// All nearby discount content is now fetched dynamically
// from the backend API. No hardcoded data remains here.

export const DISCOUNT_CATEGORIES: string[] = [];
export const DISTANCE_OPTIONS: string[] = [];
export const SORT_OPTIONS: string[] = [];

export type StoreDiscount = {
  id: string;
  name: string;
  category: string;
  badge: string;
  badgeColor: string;
  status: "Open Now" | "Closing Soon";
  rating: number;
  distance: string;
  title: string;
  desc: string;
  minPurchase: string;
  validity: string;
  locations: string;
  image: string;
  verified: boolean;
};

export const STORE_DISCOUNTS: StoreDiscount[] = [];

export type DealCardData = {
  id: string;
  store: string;
  title: string;
  tag: string;
  tagColor: string;
  meta: string;
  image: string;
};

export const ENDING_SOON_DEALS: DealCardData[] = [];
export const HIGHEST_DISCOUNT_DEALS: DealCardData[] = [];
export const FRESHLY_ADDED_DEALS: DealCardData[] = [];

export type StepItem = {
  step: string;
  title: string;
  desc: string;
};

export const CUSTOMER_STEPS: StepItem[] = [];
export const OWNER_STEPS: StepItem[] = [];

export type TrustGuarantee = {
  title: string;
  desc: string;
};

export const TRUST_GUARANTEES: TrustGuarantee[] = [];