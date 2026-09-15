// All home page content (hero features, shop categories, popular products,
// industry solutions, testimonials) is now fetched dynamically from the
// backend API. No hardcoded data remains here.

export type HeroFeature = {
  title: string;
  desc: string;
};

export const HERO_FEATURES: HeroFeature[] = [];

export type ShopCategory = {
  name: string;
  image?: string;
};

export const SHOP_CATEGORIES: ShopCategory[] = [];

export type PopularProduct = {
  name: string;
  price?: number;
  image?: string;
};

export const POPULAR_PRODUCTS: PopularProduct[] = [];

export type IndustrySolution = {
  title: string;
  desc: string;
};

export const INDUSTRY_SOLUTIONS: IndustrySolution[] = [];

export type Testimonial = {
  name: string;
  text: string;
  role?: string;
};

export const TESTIMONIALS: Testimonial[] = [];