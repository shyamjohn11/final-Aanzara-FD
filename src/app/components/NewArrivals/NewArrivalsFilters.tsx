"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { NEW_ARRIVAL_SORT_OPTIONS } from "@/app/data/newArrivals";

/* --------------------------------
 * Types
 * -------------------------------- */

interface FilterCategory {
  name: string;
  count?: number;
}

interface FilterBrand {
  name: string;
  count?: number;
}

interface CheckboxProps {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}

interface RadioProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

interface NewArrivalsFiltersProps {
  categories: FilterCategory[];
  brands: FilterBrand[];
  priceCeiling: number;
  selectedCategories: string[];
  onToggleCategory: (name: string) => void;
  selectedBrands: string[];
  onToggleBrand: (name: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  priceMax: number;
  onPriceMaxChange: (value: number) => void;
  onClearAll: () => void;
}

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function isValidText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function isValidCategory(
  value: unknown,
): value is FilterCategory {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const category =
    value as Record<string, unknown>;

  return (
    isValidText(category.name) &&
    (category.count === undefined ||
      isValidCount(category.count))
  );
}

function isValidBrand(
  value: unknown,
): value is FilterBrand {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const brand =
    value as Record<string, unknown>;

  return (
    isValidText(brand.name) &&
    (brand.count === undefined ||
      isValidCount(brand.count))
  );
}

function getSafeCategories(
  categories: unknown,
): FilterCategory[] {
  if (!Array.isArray(categories)) {
    return [];
  }

  const used = new Set<string>();

  return categories
    .filter(isValidCategory)
    .map((category) => ({
      name: category.name.trim(),
      count: category.count,
    }))
    .filter((category) => {
      if (used.has(category.name)) {
        return false;
      }

      used.add(category.name);
      return true;
    });
}

function getSafeBrands(
  brands: unknown,
): FilterBrand[] {
  if (!Array.isArray(brands)) {
    return [];
  }

  const used = new Set<string>();

  return brands
    .filter(isValidBrand)
    .map((brand) => ({
      name: brand.name.trim(),
      count: brand.count,
    }))
    .filter((brand) => {
      if (used.has(brand.name)) {
        return false;
      }

      used.add(brand.name);
      return true;
    });
}

const FALLBACK_SORT_OPTIONS: string[] = [
  "Featured",
  "Price: Low to High",
  "Price: High to Low",
  "Newest First",
  "Discount",
];

function getSafeSortOptions(): string[] {
  const staticOptions = Array.isArray(NEW_ARRIVAL_SORT_OPTIONS)
    ? NEW_ARRIVAL_SORT_OPTIONS
    : [];

  const source =
    staticOptions.length > 0
      ? staticOptions
      : FALLBACK_SORT_OPTIONS;

  const used = new Set<string>();

  return source
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
 * Checkbox
 * -------------------------------- */

function Checkbox({
  label,
  count,
  checked,
  onChange,
}: CheckboxProps) {
  const safeLabel = isValidText(label)
    ? label.trim()
    : "Unknown";

  const safeCount = isValidCount(count)
    ? count
    : undefined;

  return (
    <label
      className="
        flex
        items-center
        justify-between
        gap-2
        cursor-pointer
        group
      "
    >
      <span className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
          aria-label={safeLabel}
        />

        <span
          aria-hidden="true"
          className={`
            w-[17px]
            h-[17px]
            rounded-[5px]
            border
            flex
            items-center
            justify-center
            shrink-0
            transition-colors
            ${
              checked
                ? "bg-green border-green"
                : "border-ink-faint group-hover:border-green"
            }
          `}
        >
          {checked && (
            <Check
              size={12}
              strokeWidth={3}
              className="text-white"
            />
          )}
        </span>

        <span
          className="
            text-[12.5px]
            text-ink
          "
        >
          {safeLabel}
        </span>
      </span>

      {safeCount !== undefined && (
        <span
          className="
            text-[11px]
            text-ink-faint
          "
        >
          ({safeCount})
        </span>
      )}
    </label>
  );
}

/* --------------------------------
 * Radio
 * -------------------------------- */

function Radio({
  label,
  checked,
  onChange,
}: RadioProps) {
  const safeLabel = isValidText(label)
    ? label.trim()
    : "Unknown";

  return (
    <label
      className="
        flex
        items-center
        gap-2.5
        cursor-pointer
        group
      "
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="sr-only"
        aria-label={safeLabel}
      />

      <span
        aria-hidden="true"
        className={`
          w-[17px]
          h-[17px]
          rounded-full
          border
          flex
          items-center
          justify-center
          shrink-0
          transition-colors
          ${
            checked
              ? "border-green"
              : "border-ink-faint group-hover:border-green"
          }
        `}
      >
        {checked && (
          <span
            className="
              w-[9px]
              h-[9px]
              rounded-full
              bg-green
            "
          />
        )}
      </span>

      <span
        className="
          text-[12.5px]
          text-ink
        "
      >
        {safeLabel}
      </span>
    </label>
  );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function NewArrivalsFilters({
  categories,
  brands,
  priceCeiling,
  selectedCategories,
  onToggleCategory,
  selectedBrands,
  onToggleBrand,
  sort,
  onSortChange,
  priceMax,
  onPriceMaxChange,
  onClearAll,
}: NewArrivalsFiltersProps) {
  const [showMoreBrands, setShowMoreBrands] =
    useState<boolean>(false);

  const safeCeiling =
    typeof priceCeiling === "number" &&
    Number.isFinite(priceCeiling) &&
    priceCeiling > 0
      ? Math.ceil(priceCeiling)
      : 2000;

  const safeCategories =
    getSafeCategories(categories);

  const safeBrands =
    getSafeBrands(brands);

  const safeSortOptions =
    getSafeSortOptions();

  /* --------------------------------
   * Safe selected values
   * -------------------------------- */

  const safeSelectedCategories =
    Array.isArray(selectedCategories)
      ? selectedCategories.filter(isValidText)
      : [];

  const safeSelectedBrands =
    Array.isArray(selectedBrands)
      ? selectedBrands.filter(isValidText)
      : [];

  /* --------------------------------
   * Safe price
   * -------------------------------- */

  const safePriceMax =
    typeof priceMax === "number" &&
    Number.isFinite(priceMax)
      ? Math.min(
          Math.max(priceMax, 0),
          safeCeiling,
        )
      : 0;

  /* --------------------------------
   * Visible brands
   * -------------------------------- */

  const visibleBrands = showMoreBrands
    ? safeBrands
    : safeBrands.slice(0, 6);

  return (
    <aside
      className="
        bg-white
        border
        border-line
        rounded-card
        p-5
        h-fit
      "
      aria-label="Product filters"
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
        "
      >
        <h2
          className="
            font-sora
            font-bold
            text-[15px]
            text-ink
          "
        >
          Filters
        </h2>

        <button
          type="button"
          onClick={onClearAll}
          className="
            text-[12px]
            font-semibold
            text-blue
            hover:underline
            cursor-pointer
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue
            focus-visible:ring-offset-2
            rounded
          "
        >
          Clear All
        </button>
      </div>

      {/* --------------------------------
       * Categories
       * -------------------------------- */}

      <div
        className="
          pb-4
          border-b
          border-line
        "
      >
        <h3
          className="
            text-[12.5px]
            font-bold
            text-ink
            mb-3
          "
        >
          Categories
        </h3>

        {safeCategories.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {safeCategories.map(
              (category) => (
                <Checkbox
                  key={category.name}
                  label={category.name}
                  count={category.count}
                  checked={safeSelectedCategories.includes(
                    category.name,
                  )}
                  onChange={() =>
                    onToggleCategory(
                      category.name,
                    )
                  }
                />
              ),
            )}
          </div>
        ) : (
          <p className="text-[11.5px] text-ink-faint">
            No categories available.
          </p>
        )}
      </div>

      {/* --------------------------------
       * Brands
       * -------------------------------- */}

      <div
        className="
          py-4
          border-b
          border-line
        "
      >
        <h3
          className="
            text-[12.5px]
            font-bold
            text-ink
            mb-3
          "
        >
          Brands
        </h3>

        {visibleBrands.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {visibleBrands.map(
              (brand) => (
                <Checkbox
                  key={brand.name}
                  label={brand.name}
                  count={brand.count}
                  checked={safeSelectedBrands.includes(
                    brand.name,
                  )}
                  onChange={() =>
                    onToggleBrand(
                      brand.name,
                    )
                  }
                />
              ),
            )}
          </div>
        ) : (
          <p className="text-[11.5px] text-ink-faint">
            No brands available.
          </p>
        )}

        {safeBrands.length > 6 && (
          <button
            type="button"
            onClick={() =>
              setShowMoreBrands(
                (previous) => !previous,
              )
            }
            className="
              flex
              items-center
              gap-1
              text-[11.5px]
              font-semibold
              text-green-deep
              hover:underline
              mt-3
              cursor-pointer
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-green
              focus-visible:ring-offset-2
              rounded
            "
            aria-expanded={showMoreBrands}
          >
            {showMoreBrands
              ? "View Less"
              : "View More"}

            <ChevronDown
              size={12}
              aria-hidden="true"
              className={
                showMoreBrands
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
            />
          </button>
        )}
      </div>

      {/* --------------------------------
       * Price Range
       * -------------------------------- */}

      <div
        className="
          py-4
          border-b
          border-line
        "
      >
        <h3
          className="
            text-[12.5px]
            font-bold
            text-ink
            mb-3
          "
        >
          Price Range
        </h3>

        <div
          className="
            flex
            items-center
            gap-2
            mb-3
          "
        >
          {/* Min */}
          <input
            type="number"
            min={0}
            max={safeCeiling}
            placeholder="Min"
            inputMode="numeric"
            aria-label="Minimum price"
            className="
              w-full
              bg-paper
              border
              border-line
              rounded-lg
              px-2.5
              py-1.5
              text-[12px]
              text-ink
              outline-none
              focus:border-green
              focus:ring-1
              focus:ring-green/20
            "
          />

          <span
            className="
              text-ink-faint
              text-[12px]
            "
          >
            to
          </span>

          {/* Max */}
          <input
            type="number"
            min={0}
            max={safeCeiling}
            placeholder="Max"
            inputMode="numeric"
            value={safePriceMax}
            onChange={(event) => {
              const rawValue =
                event.target.value;

              const nextValue =
                Number(rawValue);

              if (
                rawValue === "" ||
                !Number.isFinite(nextValue)
              ) {
                return;
              }

              const clampedValue = Math.min(
                Math.max(nextValue, 0),
                safeCeiling,
              );

              onPriceMaxChange(
                clampedValue,
              );
            }}
            aria-label="Maximum price"
            className="
              w-full
              bg-paper
              border
              border-line
              rounded-lg
              px-2.5
              py-1.5
              text-[12px]
              text-ink
              outline-none
              focus:border-green
              focus:ring-1
              focus:ring-green/20
            "
          />
        </div>

        {/* Range */}
        <input
          type="range"
          min={0}
          max={safeCeiling}
          step={1}
          value={safePriceMax}
          onChange={(event) => {
            const value = Number(
              event.target.value,
            );

            if (
              Number.isFinite(value) &&
              value >= 0 &&
              value <= safeCeiling
            ) {
              onPriceMaxChange(value);
            }
          }}
          aria-label="Maximum price range"
          className="
            w-full
            accent-green
          "
        />

        <div
          className="
            flex
            items-center
            justify-between
            text-[11px]
            text-ink-soft
            mt-1
          "
        >
          <span>₹0</span>

          <span>
            ₹{safeCeiling.toLocaleString()}+
          </span>
        </div>
      </div>

      {/* --------------------------------
       * Sort
       * -------------------------------- */}

      <div className="py-4">
        <h3
          className="
            text-[12.5px]
            font-bold
            text-ink
            mb-3
          "
        >
          Sort by
        </h3>

        {safeSortOptions.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {safeSortOptions.map(
              (option) => (
                <Radio
                  key={option}
                  label={option}
                  checked={sort === option}
                  onChange={() =>
                    onSortChange(option)
                  }
                />
              ),
            )}
          </div>
        ) : (
          <p className="text-[11.5px] text-ink-faint">
            No sorting options available.
          </p>
        )}
      </div>
    </aside>
  );
}
