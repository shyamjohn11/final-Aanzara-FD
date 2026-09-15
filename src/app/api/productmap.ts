// File: app/api/productmap.ts
// Maps backend ProductSummaryResponse payloads onto the frontend Product shape.
//
// Stored product image URLs in the database are unreliable — the API enriches
// summaries with streaming routes (/api/v1/products/{id}/images/{imageId}/file)
// which render directly in <img src> through the /api proxy. Never render a raw
// imageUrl coming from a non-enriched payload.

import type { Product } from "@/app/data/products";

/**
 * Unwraps the many response shapes used by the API:
 * plain array, { items }, { products }, { data }, paged results.
 */
export function extractProductArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (payload === null || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;

  for (const key of ["items", "products", "data"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }

  return [];
}

/**
 * Maps one backend product summary to the frontend Product shape.
 * Returns null for entries without the minimum viable fields so callers
 * can filter them out instead of rendering broken cards.
 */
export function mapProductSummary(raw: unknown): Product | null {
  if (raw === null || typeof raw !== "object") return null;

  const r = raw as Record<string, unknown>;

  const id =
    typeof r.productId === "string" || typeof r.productId === "number"
      ? String(r.productId).trim()
      : "";

  const name =
    typeof r.productName === "string" && r.productName.trim().length > 0
      ? r.productName.trim()
      : typeof r.name === "string" && r.name.trim().length > 0
        ? r.name.trim()
        : "";

  const price = Number(r.price);

  if (!id || !name || !Number.isFinite(price) || price < 0) {
    return null;
  }

  const mrp = Number.isFinite(Number(r.mrp)) ? Number(r.mrp) : price;
  const safeMrp = mrp > 0 ? mrp : price;

  const moq =
    Number.isFinite(Number(r.moq)) && Number(r.moq) > 0 ? Number(r.moq) : 1;

  const stockStatus =
    typeof r.stockStatus === "string" ? r.stockStatus : null;

  // stockStatus === null means the product has no inventory rows yet
  // (freshly created admin products) — surface it as in stock.
  const inStock = stockStatus === null ? true : stockStatus !== "out_of_stock";

  const backendDiscount = Number(r.discount);
  const discount =
    Number.isFinite(backendDiscount) && backendDiscount > 0
      ? Math.round(backendDiscount)
      : safeMrp > price
        ? Math.round(((safeMrp - price) / safeMrp) * 100)
        : 0;

  const image =
    typeof r.imageUrl === "string" && r.imageUrl.trim().length > 0
      ? r.imageUrl.trim()
      : undefined;

  const backendBrand =
    typeof r.brandName === "string" ? r.brandName.trim() : "";

  return {
    id,
    brand: backendBrand || "Generic",
    sku:
      typeof r.sku === "string" && r.sku.trim().length > 0
        ? r.sku.trim()
        : id.slice(0, 8).toUpperCase(),
    name,
    pack: "Standard pack",
    rating: 0,
    reviews: 0,
    discount,
    mrp: safeMrp,
    price,
    bulkRate: price,
    bulkMoq: moq,
    moq,
    inStock,
    stockStatus: stockStatus ?? undefined,
    dispatch:
      stockStatus === "low_stock"
        ? "Low stock"
        : inStock
          ? "Ready to ship"
          : "Out of stock",
    image,
    swatch: "#E5E7EB",
    accent: "#CBD5E1",
  };
}

/** Maps a whole API payload, dropping unmappable entries. */
export function mapProductSummaries(payload: unknown): Product[] {
  return extractProductArray(payload)
    .map(mapProductSummary)
    .filter((product): product is Product => product !== null);
}
