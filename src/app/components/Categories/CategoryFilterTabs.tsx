// File: app/components/Categories/CategoryFilterTabs.tsx
"use client";

import { useEffect, useState } from "react";
import { categoriesApi } from "@/app/api/services";

type CategoryFilterTabsProps = {
  active?: string;
  onChange?: (filter: string) => void;
};

export default function CategoryFilterTabs({
  active: controlledActive,
  onChange,
}: CategoryFilterTabsProps) {
  // =====================================================
  // LIVE DATA — GET /api/v1/categories (#20), derive names
  // =====================================================

  const [filters, setFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await categoriesApi.list();
        const items = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        if (cancelled) return;
        const names = items
          .map((raw: any) => String(raw?.categoryName ?? "").trim())
          .filter((name: string) => name.length > 0);
        // "All" as first pill — matches screenshot request
        setFilters(["All", ...names]);
      } catch {
        if (!cancelled) setFilters([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================================
  // FULL DATA VALIDATION
  // =====================================================

  const validFilters = Array.isArray(filters)
    ? filters.filter(
        (filter): filter is string =>
          typeof filter === "string" &&
          filter.trim().length > 0
      )
    : [];

  // =====================================================
  // ACTIVE FILTER — controlled if parent provides active/onChange
  // =====================================================

  const [internalActive, setInternalActive] = useState<string>("");

  const isControlled = controlledActive !== undefined && onChange !== undefined;
  const active = isControlled ? (controlledActive as string) : internalActive;

  useEffect(() => {
    if (!active && validFilters.length > 0) {
      const first = validFilters[0] ?? "";
      if (isControlled) onChange?.(first);
      else setInternalActive(first);
    }
  }, [validFilters, active]);

  // =====================================================
  // FILTER CLICK VALIDATION
  // =====================================================

  const handleFilterChange = (filter: string) => {
    if (typeof filter !== "string" || filter.trim().length === 0) return;
    if (!validFilters.includes(filter)) return;
    if (isControlled) onChange?.(filter);
    else setInternalActive(filter);
  };

  // =====================================================
  // LOADING / EMPTY STATE
  // =====================================================

  if (loading) {
    return (
      <div
        role="status"
        className="text-[12px] text-ink-soft"
      >
        Loading category filters…
      </div>
    );
  }

  if (validFilters.length === 0) {
    return (
      <div
        role="status"
        className="text-[12px] text-ink-soft"
      >
        No category filters available.
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="tablist"
      aria-label="Category filters"
    >
      {validFilters.map((filter, index) => {
        const isActive = active === filter;

        return (
          <button
            key={`${filter}-${index}`}
            type="button"
            onClick={() =>
              handleFilterChange(filter)
            }
            role="tab"
            aria-selected={isActive}
            aria-label={`Filter categories by ${filter}`}
            className={`text-[12.5px] font-semibold px-4 py-2 rounded-pill border transition-colors ${
              isActive
                ? "bg-green text-white border-green"
                : "bg-white text-ink-soft border-line hover:border-green hover:text-green-deep"
            }`}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
