// All offer content (filter pills, today deals, top brands on sale,
// why buy Aanzara) is now fetched dynamically from the backend API.
// No hardcoded data remains here. Types are kept so existing components
// compile and render empty states until the backend supplies data.

import type { Product } from "@/app/data/products";

export const OFFER_FILTER_PILLS: string[] = [];

export type TodayDeal = {
  id: string | number;
  brand: string;
  name: string;
  pack: string;
  mrp: number;
  price: number;
  discount: number;
  swatch: string;
  accent: string;
};

export const TODAY_DEALS: TodayDeal[] = [];

function toProductBase(
  id: string | number,
  name: string,
  brand: string,
  price: number,
  mrp: number,
  swatch: string,
  accent: string,
): Product {
  const safeId = String(id).trim();
  const safePrice = Number.isFinite(Number(price)) ? Number(price) : 0;
  const safeMrp = Number.isFinite(Number(mrp)) && Number(mrp) > 0 ? Number(mrp) : safePrice;
  return {
    id: safeId,
    brand: typeof brand === "string" ? brand : "",
    sku: safeId,
    name: typeof name === "string" ? name : "",
    pack: "",
    rating: 0,
    reviews: 0,
    discount:
      safeMrp > safePrice ? Math.round(((safeMrp - safePrice) / safeMrp) * 100) : 0,
    mrp: safeMrp,
    price: safePrice,
    bulkRate: safePrice,
    bulkMoq: 1,
    moq: 1,
    inStock: true,
    dispatch: "Ready to ship",
    swatch: typeof swatch === "string" && swatch ? swatch : "#E5E7EB",
    accent: typeof accent === "string" && accent ? accent : "#CBD5E1",
  };
}

export function todayDealToCartProduct(deal: TodayDeal): Product {
  return toProductBase(
    deal.id,
    deal.name,
    deal.brand,
    deal.price,
    deal.mrp,
    deal.swatch,
    deal.accent,
  );
}

export type BrandOnSale = {
  name: string;
  discount: string;
  swatch: string;
};

export const TOP_BRANDS_ON_SALE: BrandOnSale[] = [];

export type WhyBuyItem = {
  title: string;
  desc: string;
};

export const WHY_BUY_AANZARA: WhyBuyItem[] = [];

export type Coupon = {
  code: string;
  desc: string;
  validity: string;
};

export const AVAILABLE_COUPONS: Coupon[] = [];

export const BEST_DEALS_TABS: string[] = [];

export type OfferProduct = {
  id: string | number;
  name: string;
  brand: string;
  pack: string;
  badge: string;
  swatch: string;
  accent: string;
  badgeColor: string;
  rating: number;
  reviews: number;
  price: number;
  mrp: number;
  moq: string;
};

export const BEST_DEALS_PRODUCTS: OfferProduct[] = [];

export function offerProductToCartProduct(product: OfferProduct): Product {
  return toProductBase(
    product.id,
    product.name,
    product.brand,
    product.price,
    product.mrp,
    product.swatch,
    product.accent,
  );
}

export type BulkTier = {
  units: string;
  rate: string;
  label?: string | null;
  highlighted: boolean;
};

export const BULK_TIERS: BulkTier[] = [];

export type ComboDeal = {
  id: string | number;
  name: string;
  swatches: string[];
  comboPrice: number;
  retailPrice: number;
  savings: number;
};

export const COMBO_DEALS: ComboDeal[] = [];

export type PromoTile = {
  id: string | number;
  title: string;
  desc: string;
  cta: string;
  gradient: string;
};

export const PROMO_TILES: PromoTile[] = [];

export type SeasonalOffer = {
  id: string | number;
  image: string;
  title: string;
  desc: string;
};

export const SEASONAL_OFFERS: SeasonalOffer[] = [];