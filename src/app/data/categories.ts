// Categories, brands, and static content are now fetched dynamically
// from the backend API (GET /api/v1/categories, GET /api/admin/brands).
// No hardcoded data remains here.

export const CATEGORY_FILTERS: string[] = [];

export type CategoryItem = {
  name: string;
  image?: string;
  count?: number;
};

export const ALL_CATEGORIES: CategoryItem[] = [];

export type CategoryBrand = {
  name: string;
  image?: string;
  count?: string | number;
};

export const CATEGORY_BRANDS: CategoryBrand[] = [];

export type WhyShopItem = {
  title: string;
  desc: string;
};

export const WHY_SHOP_AANZARA: WhyShopItem[] = [];