"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  NEW_ARRIVAL_SORT_OPTIONS,
  type NewArrivalProduct,
} from "@/app/data/newArrivals";
import { categoriesApi, productsApi } from "@/app/api/services";
import {
  extractProductArray,
  mapProductSummary,
} from "@/app/api/productmap";

import NewArrivalsTabs from "./NewArrivalsTabs";
import NewArrivalsFilters from "./NewArrivalsFilters";
import NewArrivalProductCard from "./NewArrivalProductCard";

const PAGE_SIZE = 10;
const MIN_PRICE_CEILING = 2000;
const FETCH_COUNT = 40;

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

function isValidNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

/* --------------------------------
 * Safe Sort Options
 * -------------------------------- */

function getSafeSortOptions(): string[] {
  if (!Array.isArray(NEW_ARRIVAL_SORT_OPTIONS)) {
    return [];
  }

  const used = new Set<string>();

  return NEW_ARRIVAL_SORT_OPTIONS
    .filter(isValidText)
    .map((option) => option.trim())
    .filter((option) => {
      if (used.has(option)) {
        return false;
      }

      used.add(option);
      return true;
    });
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function NewArrivalsResults() {
  /* --------------------------------
   * Server data — sole product source
   * (GET /api/v1/products/fresh-arrivals)
   * -------------------------------- */

  const [serverProducts, setServerProducts] =
    useState<NewArrivalProduct[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [loadFailed, setLoadFailed] =
    useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const loadFreshArrivals = async () => {
      try {
        // Resolve categoryId -> category name so filter labels match the
        // admin-managed taxonomy instead of a hardcoded list.
        const categoryNames = new Map<string, string>();

        try {
          const categoryResponse = await categoriesApi.list();
          const categoryRows = extractProductArray(categoryResponse.data);

          categoryRows.forEach((row) => {
            if (row === null || typeof row !== "object") return;
            const record = row as Record<string, unknown>;
            const id =
              typeof record.categoryId === "string"
                ? record.categoryId.trim()
                : "";
            const name =
              typeof record.categoryName === "string"
                ? record.categoryName.trim()
                : "";
            if (id && name) {
              categoryNames.set(id, name);
            }
          });
        } catch {
          // Category taxonomy is optional — filters fall back to "Other".
        }

        // #40 GET /api/v1/products/fresh-arrivals?count=40
        const response = await productsApi.freshArrivals(FETCH_COUNT);
        const rawItems = extractProductArray(response.data);

        const mapped: NewArrivalProduct[] = [];
        const usedIds = new Set<string>();

        rawItems.forEach((entry) => {
          const base = mapProductSummary(entry);
          if (!base) return;

          if (usedIds.has(base.id)) return;
          usedIds.add(base.id);

          const record =
            entry !== null && typeof entry === "object"
              ? (entry as Record<string, unknown>)
              : {};

          const categoryId =
            typeof record.categoryId === "string"
              ? record.categoryId.trim()
              : "";

          const categoryName = categoryId
            ? categoryNames.get(categoryId) ?? "Other"
            : "Other";

          mapped.push({
            ...base,
            moqUnit: "Units",
            tabCategory: categoryName,
            filterCategory: categoryName,
          });
        });

        if (!cancelled) {
          setServerProducts(mapped);
          setLoadFailed(false);
        }
      } catch {
        if (!cancelled) {
          setServerProducts([]);
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFreshArrivals();

    return () => {
      cancelled = true;
    };
  }, []);

  const safeProducts = serverProducts;

  const safeSortOptions = useMemo(
    () => getSafeSortOptions(),
    [],
  );

  /* --------------------------------
   * Derived taxonomy (tabs, filter categories, brands)
   * -------------------------------- */

  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>();

    safeProducts.forEach((product) => {
      const category = product.filterCategory;
      if (!isValidText(category)) return;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });

    // "All Products" first, then categories by product count.
    return [
      "All Products",
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name),
    ];
  }, [safeProducts]);

  const filterCategories = useMemo(() => {
    const counts = new Map<string, number>();
    let total = 0;

    safeProducts.forEach((product) => {
      const category = product.filterCategory;
      if (!isValidText(category)) return;
      counts.set(category, (counts.get(category) ?? 0) + 1);
      total += 1;
    });

    return [
      { name: "All Categories", count: total },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
    ];
  }, [safeProducts]);

  const filterBrands = useMemo(() => {
    const counts = new Map<string, number>();

    safeProducts.forEach((product) => {
      const brand = product.brand;
      if (!isValidText(brand)) return;
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [safeProducts]);

  /* --------------------------------
   * Price ceiling from real data
   * -------------------------------- */

  const priceCeiling = useMemo(() => {
    const maxPrice = safeProducts.reduce(
      (max, product) => Math.max(max, product.price),
      0,
    );

    return Math.max(
      MIN_PRICE_CEILING,
      Math.ceil(maxPrice / 500) * 500,
    );
  }, [safeProducts]);

  /* --------------------------------
   * State
   * -------------------------------- */

  const defaultSort =
    safeSortOptions[0] ?? "";

  const [activeTab, setActiveTab] =
    useState<string>("All Products");

  const [selectedCategories, setSelectedCategories] =
    useState<string[]>([
      "All Categories",
    ]);

  const [selectedBrands, setSelectedBrands] =
    useState<string[]>([]);

  const [sort, setSort] =
    useState<string>(defaultSort);

  const [priceMax, setPriceMax] =
    useState<number>(priceCeiling);

  const [visibleCount, setVisibleCount] =
    useState<number>(PAGE_SIZE);

  /* Keep the price slider in sync when the server data arrives. */

  useEffect(() => {
    setPriceMax((previous) =>
      Math.min(previous, priceCeiling),
    );
  }, [priceCeiling]);

  /* Reset filters whose options no longer exist after data loads. */

  useEffect(() => {
    if (
      activeTab !== "All Products" &&
      !categoryTabs.includes(activeTab)
    ) {
      setActiveTab("All Products");
    }
  }, [categoryTabs, activeTab]);

  /* --------------------------------
   * Toggle Category
   * -------------------------------- */

  const toggleCategory = (
    name: string,
  ): void => {
    if (!isValidText(name)) {
      return;
    }

    const category = name.trim();

    setSelectedCategories((previous) => {
      if (category === "All Categories") {
        return ["All Categories"];
      }

      const withoutAll =
        previous.filter(
          (item) =>
            item !== "All Categories",
        );

      const next =
        withoutAll.includes(category)
          ? withoutAll.filter(
              (item) =>
                item !== category,
            )
          : [
              ...withoutAll,
              category,
            ];

      return next.length === 0
        ? ["All Categories"]
        : next;
    });

    setVisibleCount(PAGE_SIZE);
  };

  /* --------------------------------
   * Toggle Brand
   * -------------------------------- */

  const toggleBrand = (
    name: string,
  ): void => {
    if (!isValidText(name)) {
      return;
    }

    const brand = name.trim();

    setSelectedBrands((previous) =>
      previous.includes(brand)
        ? previous.filter(
            (item) => item !== brand,
          )
        : [...previous, brand],
    );

    setVisibleCount(PAGE_SIZE);
  };

  /* --------------------------------
   * Clear Filters
   * -------------------------------- */

  const handleClearAll = (): void => {
    setSelectedCategories([
      "All Categories",
    ]);

    setSelectedBrands([]);

    setPriceMax(priceCeiling);

    setSort(defaultSort);

    setActiveTab("All Products");

    setVisibleCount(PAGE_SIZE);
  };

  /* --------------------------------
   * Change Sort
   * -------------------------------- */

  const handleSortChange = (
    value: string,
  ): void => {
    if (
      !isValidText(value) ||
      !safeSortOptions.includes(
        value,
      )
    ) {
      return;
    }

    setSort(value);
    setVisibleCount(PAGE_SIZE);
  };

  /* --------------------------------
   * Change Price
   * -------------------------------- */

  const handlePriceChange = (
    value: number,
  ): void => {
    if (!isValidNumber(value)) {
      return;
    }

    const safeValue = Math.min(
      Math.max(value, 0),
      priceCeiling,
    );

    setPriceMax(safeValue);
    setVisibleCount(PAGE_SIZE);
  };

  /* --------------------------------
   * Filter + Sort
   * -------------------------------- */

  const filtered = useMemo(() => {
    let list = [...safeProducts];

    /* Tab */
    if (
      activeTab !== "All Products" &&
      isValidText(activeTab)
    ) {
      list = list.filter(
        (product) =>
          product.tabCategory ===
          activeTab,
      );
    }

    /* Category */
    if (
      !selectedCategories.includes(
        "All Categories",
      )
    ) {
      list = list.filter(
        (product) =>
          selectedCategories.includes(
            product.filterCategory,
          ),
      );
    }

    /* Brand */
    if (
      selectedBrands.length > 0
    ) {
      list = list.filter(
        (product) =>
          selectedBrands.includes(
            product.brand,
          ),
      );
    }

    /* Price */
    list = list.filter(
      (product) =>
        product.price <= priceMax,
    );

    /* Sort */
    switch (sort) {
      case "Price: Low to High":
        list.sort(
          (a, b) =>
            a.price - b.price,
        );
        break;

      case "Price: High to Low":
        list.sort(
          (a, b) =>
            b.price - a.price,
        );
        break;

      case "Popularity":
        list.sort(
          (a, b) =>
            b.reviews - a.reviews,
        );
        break;

      case "Discount: High to Low":
        list.sort(
          (a, b) =>
            b.discount - a.discount,
        );
        break;

      default:
        break;
    }

    return list;
  }, [
    safeProducts,
    activeTab,
    selectedCategories,
    selectedBrands,
    priceMax,
    sort,
  ]);

  /* --------------------------------
   * Pagination
   * -------------------------------- */

  const safeVisibleCount =
    isValidNumber(visibleCount)
      ? Math.max(
          PAGE_SIZE,
          Math.floor(visibleCount),
        )
      : PAGE_SIZE;

  const visibleProducts =
    filtered.slice(
      0,
      safeVisibleCount,
    );

  const hasMore =
    safeVisibleCount <
    filtered.length;

  const showingStart =
    filtered.length > 0
      ? 1
      : 0;

  const showingEnd =
    visibleProducts.length;

  /* --------------------------------
   * Status message for empty results
   * -------------------------------- */

  const emptyMessage = loading
    ? "Loading new arrivals…"
    : loadFailed
      ? "New arrivals could not be loaded right now. Please try again later."
      : safeProducts.length === 0
        ? "No products are available right now."
        : "No products match your current filters.";

  return (
    <div
      id="new-arrivals-grid"
      className="
        flex
        flex-col
        gap-5
      "
    >
      {/* --------------------------------
       * Tabs
       * -------------------------------- */}

      <NewArrivalsTabs
        tabs={categoryTabs}
        active={activeTab}
        onChange={(tab) => {
          if (!isValidText(tab)) {
            return;
          }

          setActiveTab(tab.trim());
          setVisibleCount(PAGE_SIZE);
        }}
      />

      {/* --------------------------------
       * Filters + Products
       * -------------------------------- */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-[260px_1fr]
          gap-6
          items-start
        "
      >
        {/* Filters */}
        <NewArrivalsFilters
          categories={filterCategories}
          brands={filterBrands}
          priceCeiling={priceCeiling}
          selectedCategories={
            selectedCategories
          }
          onToggleCategory={
            toggleCategory
          }
          selectedBrands={
            selectedBrands
          }
          onToggleBrand={
            toggleBrand
          }
          sort={sort}
          onSortChange={
            handleSortChange
          }
          priceMax={priceMax}
          onPriceMaxChange={
            handlePriceChange
          }
          onClearAll={
            handleClearAll
          }
        />

        {/* Products */}
        <div>
          {/* --------------------------------
           * Results Header
           * -------------------------------- */}

          <div
            className="
              flex
              items-center
              justify-between
              mb-4
              flex-wrap
              gap-2
            "
          >
            <span
              className="
                text-[12.5px]
                text-ink-soft
              "
            >
              Showing{" "}
              {showingStart}-
              {showingEnd} of{" "}
              {filtered.length}{" "}
              products
            </span>

            {/* Sort */}
            {safeSortOptions.length >
              0 && (
              <div className="relative">
                <select
                  value={sort}
                  onChange={(event) =>
                    handleSortChange(
                      event.target.value,
                    )
                  }
                  aria-label="Sort products"
                  className="
                    appearance-none
                    bg-white
                    border
                    border-line
                    rounded-lg
                    pl-3
                    pr-8
                    py-2
                    text-[12px]
                    font-semibold
                    text-ink
                    outline-none
                    cursor-pointer
                    focus:border-green
                    focus:ring-1
                    focus:ring-green/20
                  "
                >
                  {safeSortOptions.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        Sort by: {option}
                      </option>
                    ),
                  )}
                </select>

                <ChevronDown
                  size={13}
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                    text-ink-faint
                  "
                />
              </div>
            )}
          </div>

          {/* --------------------------------
           * Empty / Loading State
           * -------------------------------- */}

          {visibleProducts.length ===
          0 ? (
            <div
              className="
                min-h-[180px]
                flex
                items-center
                justify-center
                border
                border-dashed
                border-line
                rounded-card
                bg-white
                px-5
                text-center
              "
              role="status"
              aria-live="polite"
            >
              <p
                className="
                  text-[12.5px]
                  text-ink-soft
                "
              >
                {emptyMessage}
              </p>
            </div>
          ) : (
            <>
              {/* --------------------------------
               * Product Grid
               * -------------------------------- */}

              <div
                className="
                  grid
                  grid-cols-2
                  sm:grid-cols-3
                  lg:grid-cols-5
                  gap-4
                "
              >
                {visibleProducts.map(
                  (product) => (
                    <NewArrivalProductCard
                      key={String(
                        product.id,
                      )}
                      product={
                        product
                      }
                    />
                  ),
                )}
              </div>

              {/* --------------------------------
               * Load More
               * -------------------------------- */}

              {hasMore && (
                <div
                  className="
                    flex
                    justify-center
                    mt-6
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount(
                        (current) =>
                          Math.min(
                            current +
                              PAGE_SIZE,
                            filtered.length,
                          ),
                      )
                    }
                    className="
                      flex
                      items-center
                      gap-1.5
                      border
                      border-line
                      text-ink
                      text-[12.5px]
                      font-bold
                      px-6
                      py-2.5
                      rounded-lg
                      hover:border-green
                      hover:text-green-deep
                      transition-colors
                      cursor-pointer
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-green
                      focus-visible:ring-offset-2
                    "
                  >
                    Load More Products

                    <ChevronDown
                      size={13}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
