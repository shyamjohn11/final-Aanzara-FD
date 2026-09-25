// All product detail content is now fetched dynamically
// from the backend API. No hardcoded data remains here.

export type PriceTier = {
  range: string;
  price: number;
  note: string;
};

export type ProductDetail = {
  productId?: string;
  brand: string;
  name: string;
  tags: string[];
  sku: string;
  productCode: string;
  rating: number;
  reviewCount: number;
  ordersFilled: number;
  inStock: boolean;
  minOrderQty: number;
  images: string[];
  priceTiers: PriceTier[];
  bulkNote: string;
  deliveryEstimate: string;
  deliveryPerks: string[];
  cartonOptions: string[];
  trustBadges: string[];
};

export const PRODUCT_DETAIL: ProductDetail = {
  brand: "",
  name: "",
  tags: [],
  sku: "",
  productCode: "",
  rating: 0,
  reviewCount: 0,
  ordersFilled: 0,
  inStock: true,
  minOrderQty: 1,
  images: [],
  priceTiers: [],
  bulkNote: "",
  deliveryEstimate: "",
  deliveryPerks: [],
  cartonOptions: [],
  trustBadges: [],
};

export type SpecRow = {
  label: string;
  value: string;
};

// Generic fallback rows when a product has no Specification field
// (mirrors typical admin-entered spec format).
export const SPEC_TABLE: SpecRow[] = [
  { label: "Brand", value: "Aanzara" },
  { label: "Category", value: "FMCG" },
  { label: "Pack Type", value: "Retail pack" },
  { label: "Country of Origin", value: "India" },
  { label: "Storage", value: "Cool, dry place" },
  { label: "Availability", value: "In stock" },
];

export const PRODUCT_TABS: string[] = [
  "Product Specifications",
  "Description",
  "Shipping & Returns",
];

export type EnterpriseInfoItem = {
  title: string;
  desc: string;
};

export const ENTERPRISE_INFO: EnterpriseInfoItem[] = [];

export type EnterpriseDocument = {
  name: string;
  meta: string;
};

export const ENTERPRISE_DOCS: EnterpriseDocument[] = [];

export type ReviewBreakdownRow = {
  star: number;
  percent: number;
};

export type ReviewSummary = {
  average: number;
  total: number;
  recommendPercent: number;
  breakdown: ReviewBreakdownRow[];
};

export const REVIEW_SUMMARY: ReviewSummary = {
  average: 0,
  total: 0,
  recommendPercent: 0,
  breakdown: [],
};

export type Review = {
  name: string;
  role: string;
  verified: boolean;
  date: string;
  rating: number;
  text: string;
  helpful: number;
};

export const REVIEWS: Review[] = [];

export type FrequentlyBoughtItem = {
  name: string;
  price: number;
  swatch: string;
};

export const FREQUENTLY_BOUGHT: FrequentlyBoughtItem[] = [];
export const BUNDLE_PRICE = 0;

export type RelatedProduct = {
  name: string;
  price: number;
  swatch: string;
};

export const RELATED_PRODUCTS: RelatedProduct[] = [];
export const RECENTLY_VIEWED_PRODUCTS: RelatedProduct[] = [];

export type WhyAanzaraItem = {
  title: string;
  desc: string;
};

export const WHY_AANZARA_PRODUCT: WhyAanzaraItem[] = [];

export type Faq = {
  q: string;
  a: string;
};

export const FAQS: Faq[] = [];