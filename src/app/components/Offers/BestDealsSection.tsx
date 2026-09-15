"use client";

import { useEffect, useMemo, useState } from "react";

import type { OfferProduct } from "@/app/data/offers";
import { offersApi } from "@/app/api/services";

import OfferProductCard from "./OfferProductCard";

/* --------------------------------
 * Types
 * -------------------------------- */

type BestDealProduct = OfferProduct;

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

/* --------------------------------
 * Safe Tabs
 * -------------------------------- */

function getSafeTabs(tabs: unknown): string[] {
  if (!Array.isArray(tabs)) {
    return [];
  }

  const usedTabs = new Set<string>();

  return (tabs as unknown[])
    .filter(isValidText)
    .map((tab) => tab.trim())
    .filter((tab) => {
      const normalizedTab =
        tab.toLowerCase();

      if (
        usedTabs.has(normalizedTab)
      ) {
        return false;
      }

      usedTabs.add(normalizedTab);

      return true;
    });
}

/* --------------------------------
 * Product Validation
 * -------------------------------- */

function isValidProduct(
  value: unknown,
): value is BestDealProduct {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const product =
    value as Record<string, unknown>;

  const hasValidId =
    typeof product.id === "string" ||
    typeof product.id === "number";

  return (
    hasValidId &&
    String(product.id).trim().length > 0
  );
}

/* --------------------------------
 * Safe Products
 * -------------------------------- */

function getSafeProducts(
  products: unknown,
): BestDealProduct[] {
  if (
    !Array.isArray(products)
  ) {
    return [];
  }

  const usedIds = new Set<string>();

  return (products as unknown[])
    .filter(isValidProduct)
    .filter((product) => {
      const id =
        String(product.id).trim();

      if (usedIds.has(id)) {
        return false;
      }

      usedIds.add(id);

      return true;
    });
}

/* --------------------------------
 * API mapping (offersApi.list)
 * -------------------------------- */

const DEAL_SWATCHES = [
  "#2563EB",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#DB2777",
  "#65A30D",
];

const DEAL_ACCENTS = [
  "#1E40AF",
  "#047857",
  "#B45309",
  "#B91C1C",
  "#6D28D9",
  "#0E7490",
  "#BE185D",
  "#4D7C0F",
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

function mapOfferToProduct(
  raw: Record<string, unknown>,
  index: number,
): BestDealProduct {
  const id =
    String(
      raw.offerId ??
        raw.id ??
        raw._id ??
        `offer-${index}`,
    ).trim() || `offer-${index}`;

  const name =
    String(
      raw.name ??
        raw.title ??
        "Offer",
    ).trim() || "Offer";

  const category =
    String(
      raw.category ??
        raw.categoryName ??
        "Aanzara",
    ).trim() || "Aanzara";

  const code = String(raw.code ?? raw.offerCode ?? raw.couponCode ?? "").trim();
  const minOrder = Number(
    raw.minOrder ??
      raw.minimumOrder ??
      raw.minOrderValue ??
      raw.minimumAmount ??
      0,
  );
  const safeMinOrder =
    Number.isFinite(minOrder) && minOrder > 0 ? minOrder : 999;

  const type = String(raw.type ?? "").trim();
  const value = Number(
    raw.value ??
      raw.discount ??
      raw.discountValue ??
      raw.percent ??
      0,
  );
  const safeValue =
    Number.isFinite(value) && value > 0 ? value : 10;

  const badge =
    String(
      raw.badge ??
        (type === "Flat"
          ? `₹${safeValue} OFF`
          : `${safeValue}% OFF`),
    ).trim() || `${safeValue}% OFF`;

  const isFlat = type === "Flat" || badge.startsWith("₹");
  const mrp = safeMinOrder;
  const price = isFlat
    ? Math.max(Math.round(mrp - safeValue), 1)
    : Math.max(Math.round(mrp * (1 - Math.min(safeValue, 90) / 100)), 1);

  const pack = code
    ? `Code: ${code}`
    : `Min order ₹${mrp.toLocaleString("en-IN")}`;

  const ratingRaw = Number(raw.rating ?? 4.2);
  const rating =
    Number.isFinite(ratingRaw)
      ? Math.min(Math.max(ratingRaw, 0), 5)
      : 4.2;
  const reviewsRaw = Number(
    raw.reviews ?? raw.used ?? raw.usage ?? 100,
  );
  const reviews =
    Number.isFinite(reviewsRaw) && reviewsRaw >= 0
      ? Math.floor(reviewsRaw)
      : 100;

  const moq = String(
    raw.moq ??
      (Number.isFinite(minOrder) && minOrder > 0
        ? `MOQ: ₹${Math.floor(minOrder).toLocaleString("en-IN")}`
        : "Wholesale Bulk: 1 unit"),
  ).trim() || "Wholesale Bulk: 1 unit";

  return {
    id,
    name,
    brand: category,
    pack,
    badge,
    swatch: DEAL_SWATCHES[index % DEAL_SWATCHES.length],
    accent: DEAL_ACCENTS[index % DEAL_ACCENTS.length],
    badgeColor: isFlat ? "#059669" : "#DC2626",
    rating,
    reviews,
    price,
    mrp,
    moq,
  };
}

function deriveTabs(
  rawItems: Record<string, unknown>[],
): string[] {
  const categories = rawItems
    .map((raw) =>
      String(raw.category ?? raw.categoryName ?? "").trim(),
    )
    .filter((c) => c.length > 0);
  const titles = rawItems
    .map((raw) => String(raw.name ?? raw.title ?? "").trim())
    .filter((t) => t.length > 0);
  const merged = ["All", ...categories, ...titles];
  return getSafeTabs(merged);
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function BestDealsSection() {
  const [products, setProducts] = useState<BestDealProduct[]>([]);
  const [tabs, setTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const response = await offersApi.list(1, 50);
        const payload: unknown =
          (response as { data?: unknown })?.data ?? response;
        const rawItems = unwrapItems(payload);
        const mapped = rawItems.map(mapOfferToProduct);
        const nextTabs = deriveTabs(rawItems);
        if (!cancelled) {
          setProducts(mapped);
          setTabs(nextTabs.length > 0 ? nextTabs : ["All"]);
        }
      } catch (error) {
        console.error("Unable to load best deals:", error);
        if (!cancelled) {
          setFetchError(
            "Unable to load best deals. Please try again.",
          );
          setProducts([]);
          setTabs([]);
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

  const safeTabs = useMemo(
    () => getSafeTabs(tabs),
    [tabs],
  );

  const safeProducts = useMemo(
    () => getSafeProducts(products),
    [products],
  );

  const initialTab =
    safeTabs[0] ?? "";

  const [activeTab, setActiveTab] =
    useState<string>("");

  useEffect(() => {
    if (!activeTab && initialTab) {
      setActiveTab(initialTab);
    }
  }, [activeTab, initialTab]);

  const visibleProducts = useMemo(() => {
    if (!activeTab || activeTab === "All") {
      return safeProducts;
    }
    const needle = activeTab.toLowerCase();
    const filtered = safeProducts.filter(
      (product) =>
        String(product.brand ?? "")
          .toLowerCase()
          .includes(needle) ||
        String(product.name ?? "")
          .toLowerCase()
          .includes(needle),
    );
    return filtered.length > 0 ? filtered : safeProducts;
  }, [safeProducts, activeTab]);

  /* --------------------------------
   * Tab Change
   * -------------------------------- */

  const handleTabChange = (
    tab: string,
  ): void => {
    if (!isValidText(tab)) {
      return;
    }

    const safeTab = tab.trim();

    if (!safeTabs.includes(safeTab)) {
      return;
    }

    setActiveTab(safeTab);
  };

  return (
    <section
      aria-labelledby="best-deals-title"
    >
      {/* --------------------------------
       * Header
       * -------------------------------- */}

      <div
        className="
          flex
          items-center
          justify-between
          mb-4
          flex-wrap
          gap-3
        "
      >
        <h2
          id="best-deals-title"
          className="
            font-sora
            font-bold
            text-[19px]
            text-navy
          "
        >
          Best Deals Right Now
        </h2>

        {/* Tabs */}
        {safeTabs.length > 0 && (
          <nav
            aria-label="Best deals categories"
            className="
              flex
              items-center
              gap-1.5
              overflow-x-auto
              scrollbar-none
            "
          >
            {safeTabs.map((tab) => {
              const isActive =
                activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() =>
                    handleTabChange(tab)
                  }
                  aria-current={
                    isActive
                      ? "page"
                      : undefined
                  }
                  className={`
                    shrink-0
                    text-[11.5px]
                    font-semibold
                    px-3
                    py-1.5
                    rounded-pill
                    transition-colors
                    cursor-pointer
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-navy
                    focus-visible:ring-offset-2
                    ${
                      isActive
                        ? "bg-navy text-white"
                        : "text-ink-soft hover:text-navy"
                    }
                  `}
                >
                  {tab}
                </button>
              );
            })}
          </nav>
        )}
      </div>

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

      {/* --------------------------------
       * Products
       * -------------------------------- */}

      {loading ? (
        <div
          className="
            min-h-[150px]
            flex
            items-center
            justify-center
            border
            border-line
            rounded-card
            bg-white
            text-[12.5px]
            text-ink-soft
            text-center
            px-4
          "
          role="status"
          aria-live="polite"
        >
          Loading best deals…
        </div>
      ) : visibleProducts.length > 0 ? (
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-4
            gap-4
          "
        >
          {visibleProducts.map(
            (product) => (
              <OfferProductCard
                key={String(
                  product.id,
                )}
                product={product}
              />
            ),
          )}
        </div>
      ) : (
        /* Empty State */
        <div
          className="
            min-h-[150px]
            flex
            items-center
            justify-center
            border
            border-dashed
            border-line
            rounded-card
            bg-white
            text-[12.5px]
            text-ink-soft
            text-center
            px-4
          "
          role="status"
          aria-live="polite"
        >
          No deals available right now.
        </div>
      )}
    </section>
  );
}
