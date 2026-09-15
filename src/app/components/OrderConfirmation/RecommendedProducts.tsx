"use client";

import { useEffect, useState } from "react";
import { productsApi } from "@/app/api/services";

type RecommendedProduct = {
  id: string;
  name: string;
  price: string;
  image: string;
};

/* =========================
   VALIDATION HELPERS
========================= */

function isValidText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidId(value: unknown): boolean {
  return (
    (typeof value === "string" ||
      typeof value === "number") &&
    String(value).trim().length > 0
  );
}

function isValidRecommendedProduct(
  product: unknown
): product is RecommendedProduct {
  if (
    !product ||
    typeof product !== "object" ||
    Array.isArray(product)
  ) {
    return false;
  }

  const item = product as {
    id?: unknown;
    name?: unknown;
    price?: unknown;
    image?: unknown;
  };

  return (
    isValidId(item.id) &&
    isValidText(item.name) &&
    ((typeof item.price === "string" && item.price.trim().length > 0) ||
      (typeof item.price === "number" && Number.isFinite(item.price))) &&
    isValidText(item.image)
  );
}

function unwrapProducts(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (Array.isArray(p["items"])) return p["items"] as Record<string, unknown>[];
    if (Array.isArray(p["products"])) return p["products"] as Record<string, unknown>[];
    if (Array.isArray(p["data"])) return p["data"] as Record<string, unknown>[];
  }
  return [];
}

/* =========================
   COMPONENT
========================= */

export default function RecommendedProducts() {
  const [raw, setRaw] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await productsApi.popular(5);
        const payload: unknown = (res as { data?: unknown })?.data ?? res;
        const list = unwrapProducts(payload);
        if (cancelled) return;
        const mapped: RecommendedProduct[] = list.slice(0, 5).map((p, i) => {
          const priceRaw = p["price"] ?? p["sellingPrice"] ?? p["mrp"] ?? 0;
          const price =
            typeof priceRaw === "number"
              ? `₹${priceRaw.toLocaleString("en-IN")}`
              : String(priceRaw ?? "").trim().startsWith("₹")
                ? String(priceRaw).trim()
                : `₹${String(priceRaw ?? "0").trim()}`;
          const img =
            typeof p["imageUrl"] === "string" && p["imageUrl"]
              ? String(p["imageUrl"])
              : typeof p["primaryImageUrl"] === "string" && p["primaryImageUrl"]
                ? String(p["primaryImageUrl"])
                : typeof p["image"] === "string" && p["image"]
                  ? String(p["image"])
                  : "/placeholder-product.png";
          return {
            id: String(p["productId"] ?? p["id"] ?? `rec-${i}`),
            name: String(p["productName"] ?? p["name"] ?? "Product"),
            price,
            image: img,
          };
        });
        setRaw(mapped);
      } catch {
        if (!cancelled) setError("Unable to load recommendations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const safeProducts = Array.isArray(raw)
    ? raw
        .filter(isValidRecommendedProduct)
        .map((product) => ({
          ...product,
          name: product.name.trim(),
          price: String(product.price).trim(),
          image: product.image.trim(),
        }))
    : [];

  // Prevent duplicate product IDs
  const usedIds = new Set<string>();

  const validatedProducts = safeProducts.filter(
    (product) => {
      const id = String(product.id).trim();

      if (usedIds.has(id)) {
        return false;
      }

      usedIds.add(id);
      return true;
    }
  );

  return (
    <section aria-labelledby="recommended-products-title">
      <h2
        id="recommended-products-title"
        className="font-sora font-bold text-[19px] text-navy mb-4"
      >
        Recommended Based on Your Purchase
      </h2>

      {loading ? (
        <div
          className="
            min-h-[120px]
            flex
            items-center
            justify-center
            border
            border-dashed
            border-line
            rounded-card
            bg-white
            text-[12px]
            text-ink-faint
            text-center
            px-4
          "
          role="status"
        >
          Loading recommendations…
        </div>
      ) : error ? (
        <div
          className="
            min-h-[120px]
            flex
            items-center
            justify-center
            border
            border-dashed
            border-line
            rounded-card
            bg-white
            text-[12px]
            text-red-600
            text-center
            px-4
          "
          role="status"
        >
          {error}
        </div>
      ) : validatedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {validatedProducts.map((product) => (
            <div
              key={String(product.id)}
              className="
                bg-white
                border
                border-line
                rounded-card
                overflow-hidden
                hover:shadow-pop
                transition-shadow
              "
            >
              {/* PRODUCT IMAGE */}

              <div
                className="h-[110px] bg-cover bg-center"
                style={{
                  backgroundImage: `url("${product.image}")`,
                }}
                role="img"
                aria-label={product.name}
              />

              {/* PRODUCT DETAILS */}

              <div className="p-3">
                <div
                  className="
                    text-[12px]
                    font-semibold
                    text-ink
                    leading-snug
                    line-clamp-2
                    min-h-[32px]
                  "
                  title={product.name}
                >
                  {product.name}
                </div>

                <div
                  className="
                    text-[13px]
                    font-bold
                    text-navy
                    mt-1.5
                    mb-2.5
                  "
                >
                  {product.price}
                </div>

                <button
                  type="button"
                  className="
                    w-full
                    border
                    border-line
                    text-ink
                    text-[11px]
                    font-bold
                    py-2
                    rounded-lg
                    hover:border-navy
                    hover:text-navy
                    transition-colors
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-navy
                    focus-visible:ring-offset-2
                  "
                  aria-label={`Add ${product.name} to cart`}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* EMPTY STATE */

        <div
          className="
            min-h-[120px]
            flex
            items-center
            justify-center
            border
            border-dashed
            border-line
            rounded-card
            bg-white
            text-[12px]
            text-ink-faint
            text-center
            px-4
          "
          role="status"
          aria-live="polite"
        >
          No recommended products available right now.
        </div>
      )}
    </section>
  );
}
