// All wholesale content is now fetched dynamically
// from the backend API. No hardcoded data remains here.

export type WholesalePerk = {
  title: string;
  desc: string;
};

export const WHOLESALE_HERO_PERKS: WholesalePerk[] = [];

export type WholesaleHeroBar = {
  title: string;
  value: string;
};

export const WHOLESALE_HERO_BAR: WholesaleHeroBar[] = [];

export type WholesaleCategory = {
  name: string;
  image: string;
};

export const WHOLESALE_CATEGORIES: WholesaleCategory[] = [];
export const BULK_ORDER_CHECKLIST: string[] = [];

export type WhyBuyWholesale = {
  title: string;
  desc: string;
};

export const WHY_BUY_WHOLESALE: WhyBuyWholesale[] = [];
export const BUSINESS_SEGMENTS: string[] = [];