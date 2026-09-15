// Product snapshot cache.
//
// The backend cart/wishlist endpoints return flat rows (productId, name,
// sku, price, mrp, quantity) while the storefront renders the full
// `Product` shape (brand, pack, image, swatch, moq, ...). Every time a
// full Product is added to the cart or wishlist we persist its display
// fields here, so on later reloads the flat backend rows can be
// re-enriched into that same shape.

import type { Product } from "@/app/data/products";

const SNAPSHOT_KEY = "aanzara_product_snapshots_v1";
const MAX_SNAPSHOTS = 200;

export type ProductSnapshot = Omit<Product, "id">;

export function isGuid(value: string | undefined | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

type SnapshotMap = Record<string, ProductSnapshot>;

function readMap(): SnapshotMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    return parsed as SnapshotMap;
  } catch {
    return {};
  }
}

function writeMap(map: SnapshotMap) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(map));
  } catch (error) {
    console.error("Unable to save product snapshots:", error);
  }
}

export function saveProductSnapshot(product: Product) {
  if (!product?.id || !isGuid(product.id)) return;

  const { id: _id, ...rest } = product;
  const map = readMap();

  // Refresh insertion order so the map never grows unbounded.
  delete map[product.id];

  const entries = Object.entries(map) as [string, ProductSnapshot][];
  const trimmed = entries.slice(Math.max(0, entries.length - MAX_SNAPSHOTS + 1));

  writeMap({ ...Object.fromEntries(trimmed), [product.id]: rest });
}

export function loadProductSnapshot(productId: string): ProductSnapshot | null {
  const map = readMap();
  return map[productId] ?? null;
}

/**
 * All cached snapshots, most recently added first. Used to surface
 * "Recently Viewed" without any fabricated fallback data.
 */
export function loadAllProductSnapshots(): Array<
  Product & { id: string }
> {
  const map = readMap();

  return Object.entries(map)
    .reverse()
    .map(([id, snapshot]) => ({ id, ...snapshot }));
}

export function removeProductSnapshot(productId: string) {
  if (!productId) return;

  const map = readMap();
  if (!(productId in map)) return;

  delete map[productId];
  writeMap(map);
}
