"use client";

import { useEffect, useMemo, useState } from "react";
import { DISCOUNT_CATEGORIES } from "@/app/data/nearbyDiscounts";
import { storesApi, storeOffersApi } from "@/app/api/services";

interface DiscountCategoryTabsProps {
  value?: string;
  onChange?: (category: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    for (const key of ["items", "stores", "offers", "data"]) {
      const nested = payload[key];

      if (Array.isArray(nested)) {
        return nested.filter(isRecord);
      }
    }
  }

  return [];
}

function normalizeCategories(values: unknown[]): string[] {
  const unique = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0 || unique.has(trimmed)) {
      continue;
    }

    unique.add(trimmed);
  }

  return [...unique];
}

export default function DiscountCategoryTabs({
  value,
  onChange,
}: DiscountCategoryTabsProps) {
  const [liveCategories, setLiveCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // --------------------------------
  // Live categories — #100 stores +
  // #105 store offers (best-effort)
  // --------------------------------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [storesRes, offersRes] = await Promise.all([
          storesApi.list(1, 50),
          storeOffersApi.list(1, 50),
        ]);

        const rows = [
          ...extractRows(storesRes.data),
          ...extractRows(offersRes.data),
        ];

        const categories = normalizeCategories(
          rows.flatMap((row) => [
            row["category"],
            row["categoryName"],
            row["storeCategory"],
            row["offerCategory"],
          ]),
        );

        if (!cancelled) {
          setLiveCategories(categories);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setLiveCategories([]);
          setLoadError(true);
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

  // --------------------------------
  // Validate and sanitize categories
  // (live API first, static fallback)
  // --------------------------------
  const safeCategories = useMemo(() => {
    const live = normalizeCategories(liveCategories);

    if (live.length > 0) {
      return live;
    }

    if (!Array.isArray(DISCOUNT_CATEGORIES)) {
      return [];
    }

    return normalizeCategories(DISCOUNT_CATEGORIES);
  }, [liveCategories]);

  // --------------------------------
  // Active category (controlled or internal)
  // --------------------------------
  const [internalActive, setInternalActive] = useState<string>("");

  const active = value ?? internalActive;

  const handleSelect = (category: string) => {
    if (category !== active) {
      setInternalActive(category);
      onChange?.(category);
    }
  };

  // --------------------------------
  // Keep active category valid
  // --------------------------------
  useEffect(() => {
    if (safeCategories.length === 0) {
      if (internalActive !== "") {
        setInternalActive("");
      }
      return;
    }

    // If current active category no longer exists,
    // select the first valid category.
    if (!safeCategories.includes(active)) {
      const next = safeCategories[0];
      setInternalActive(next);
      onChange?.(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCategories]);

  // --------------------------------
  // Loading state
  // --------------------------------
  if (loading) {
    return (
      <div
        className="flex items-center gap-2 overflow-hidden pb-1"
        role="status"
        aria-live="polite"
        aria-label="Loading discount categories"
      >
        {[0, 1, 2, 3].map((skeleton) => (
          <span
            key={skeleton}
            className="shrink-0 h-[34px] w-24 rounded-pill bg-paper-deep animate-pulse"
          />
        ))}
      </div>
    );
  }

  // --------------------------------
  // Enabled empty state (never unmount
  // the filter area without explanation)
  // --------------------------------
  if (safeCategories.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="
          flex
          items-center
          justify-center
          rounded-lg
          border
          border-dashed
          border-line
          bg-white
          px-4
          py-3
          text-[12px]
          text-ink-faint
        "
      >
        {loadError
          ? "Discount categories could not be loaded. Please try again later."
          : "No discount categories available right now."}
      </div>
    );
  }

  return (
    <div
      className="
        flex
        items-center
        gap-2
        overflow-x-auto
        scrollbar-none
        pb-1
      "
      role="tablist"
      aria-label="Discount categories"
    >
      {safeCategories.map((category) => {
        const isActive = active === category;

        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls="discount-category-content"
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleSelect(category)}
            className={`
              shrink-0
              text-[12.5px]
              font-semibold
              px-4
              py-2
              rounded-pill
              border
              transition-colors
              cursor-pointer
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue
              focus-visible:ring-offset-2
              ${
                isActive
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-ink-soft border-line hover:border-navy hover:text-navy"
              }
            `}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
