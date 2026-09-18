"use client";

import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import type { BrandOnSale as BrandOnSaleType } from "@/app/data/offers";
import { storefrontBrandsApi } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

type TopBrand = BrandOnSaleType;

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function isValidText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidColor(
  value: unknown,
): value is string {
  if (!isValidText(value)) {
    return false;
  }

  const color = value.trim();

  // Supports HEX, rgb/rgba, hsl/hsla and CSS color names.
  return (
    /^#[0-9a-f]{3,8}$/i.test(color) ||
    /^(rgb|rgba|hsl|hsla)\(/i.test(color) ||
    /^[a-z]+$/i.test(color)
  );
}

function isValidTopBrand(
  brand: unknown,
): brand is TopBrand {
  if (
    !brand ||
    typeof brand !== "object" ||
    Array.isArray(brand)
  ) {
    return false;
  }

  const item =
    brand as Partial<TopBrand>;

  return (
    isValidText(item.name) &&
    isValidText(item.discount) &&
    isValidColor(item.swatch)
  );
}

/* --------------------------------
 * Safe Data
 * -------------------------------- */

function getSafeTopBrands(
  brands: unknown,
): TopBrand[] {
  if (!Array.isArray(brands)) {
    return [];
  }

  const usedNames = new Set<string>();

  return (brands as unknown[])
    .filter(isValidTopBrand)
    .map((brand) => ({
      ...brand,
      name: brand.name.trim(),
      discount: brand.discount.trim(),
      swatch: brand.swatch.trim(),
    }))
    .filter((brand) => {
      const name = brand.name
        .trim()
        .toLowerCase();

      if (usedNames.has(name)) {
        return false;
      }

      usedNames.add(name);

      return true;
    });
}

/* --------------------------------
 * API mapping (storefrontBrandsApi.list — public, active only)
 * -------------------------------- */

const BRAND_SWATCHES = [
  "#2563EB",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#DB2777",
  "#65A30D",
  "#0D9488",
];

function unwrapItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (payload && typeof payload === "object") {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.items)) {
      return rec.items as Record<string, unknown>[];
    }
    if (Array.isArray(rec.data)) {
      return rec.data as Record<string, unknown>[];
    }
  }
  return [];
}

function mapBrandRaw(
  raw: Record<string, unknown>,
  index: number,
): TopBrand {
  const name =
    String(
      raw.brandName ??
        raw.name ??
        raw.title ??
        "Brand",
    ).trim() || "Brand";

  const discountRaw = String(
    raw.discount ??
      raw.offer ??
      raw.discountLabel ??
      "",
  ).trim();
  const discountPercent = Number(
    raw.discountPercent ??
      raw.discountValue ??
      raw.percent ??
      0,
  );
  const isOnSale =
    raw.isOnSale === true ||
    String(raw.isOnSale ?? "").toLowerCase() === "true" ||
    String(raw.status ?? "").toLowerCase().includes("sale");

  const discount = discountRaw
    ? discountRaw
    : Number.isFinite(discountPercent) && discountPercent > 0
      ? `Up to ${Math.floor(discountPercent)}% Off`
      : isOnSale
        ? "On Sale"
        : "Up to 20% Off";

  const swatchRaw = String(
    raw.swatch ??
      raw.color ??
      "",
  ).trim();

  return {
    name,
    discount,
    swatch: swatchRaw || BRAND_SWATCHES[index % BRAND_SWATCHES.length],
  };
}

/* --------------------------------
 * Component
 * -------------------------------- */

export default function TopBrandsOnSale() {
  const [brands, setBrands] = useState<TopBrand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const response = await storefrontBrandsApi.list({ count: 25 });
        const payload: unknown =
          (response as { data?: unknown })?.data ?? response;
        const rawItems = unwrapItems(payload);
        const mapped = rawItems.map(mapBrandRaw);
        if (!cancelled) {
          setBrands(mapped);
        }
      } catch (error) {
        console.error("Unable to load top brands:", error);
        if (!cancelled) {
          setFetchError(
            "Unable to load brand offers. Please try again.",
          );
          setBrands([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const safeBrands =
    getSafeTopBrands(brands);

  return (
    <section
      aria-labelledby="top-brands-on-sale-title"
    >
      {/* Heading */}
      <h2
        id="top-brands-on-sale-title"
        className="
          font-sora
          font-bold
          text-[19px]
          text-navy
          mb-4
        "
      >
        Top Brands on Sale
      </h2>

      {fetchError && (
        <div
          className="
            mb-4
            text-[12px]
            text-red-600
          "
          role="alert"
        >
          {fetchError}
        </div>
      )}

      {/* Empty State */}
      {loading ? (
        <div
          className="
            min-h-[100px]
            bg-white
            border
            border-line
            rounded-card
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          Loading brand offers…
        </div>
      ) : safeBrands.length === 0 ? (
        <div
          className="
            min-h-[100px]
            bg-white
            border
            border-dashed
            border-line
            rounded-card
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          No brand offers available
          right now.
        </div>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            gap-4
          "
        >
          {safeBrands.map((brand) => (
            <article
              key={brand.name}
              className="
                bg-white
                border
                border-line
                rounded-card
                flex
                items-center
                gap-3
                px-4
                py-3.5
              "
            >
              {/* Brand Icon */}
              <span
                className="
                  w-10
                  h-10
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-white
                  shrink-0
                "
                style={{
                  backgroundColor:
                    brand.swatch,
                }}
                aria-hidden="true"
              >
                <Tag size={16} />
              </span>

              {/* Brand Details */}
              <div className="min-w-0">
                <div
                  className="
                    text-[12.5px]
                    font-bold
                    text-ink
                    truncate
                  "
                  title={brand.name}
                >
                  {brand.name}
                </div>

                <div
                  className="
                    text-[11px]
                    font-semibold
                    text-green-deep
                  "
                >
                  {brand.discount}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
