"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, LayoutGrid, List } from "lucide-react";
import {
  DISTANCE_OPTIONS,
  SORT_OPTIONS,
} from "@/app/data/nearbyDiscounts";
import { storesApi, storeOffersApi } from "@/app/api/services";

type ViewMode = "list" | "grid";

interface DiscountFilterBarProps {
  onDistanceChange?: (distance: string) => void;
  onSortChange?: (sort: string) => void;
  onViewChange?: (view: ViewMode) => void;
}

// No backend endpoint publishes distance/sort facets, so validated
// static options are used with built-in fallbacks that keep the
// filter bar enabled. The live store/offer count below is
// best-effort (#100 storesApi.list + #105 storeOffersApi.list).
const FALLBACK_DISTANCE_OPTIONS = [
  "1 km",
  "3 km",
  "5 km",
  "10 km",
];

const FALLBACK_SORT_OPTIONS = [
  "Popularity",
  "Discount",
  "Rating",
  "Distance",
];

/**
 * Runtime validation for string options.
 */
function isValidStringOption(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function normalizeOptions(
  raw: unknown,
  fallback: string[],
): string[] {
  const unique = new Set<string>();

  const source = Array.isArray(raw) ? raw : [];

  const cleaned = source
    .filter(isValidStringOption)
    .map((option) => option.trim())
    .filter((option) => {
      if (unique.has(option)) {
        return false;
      }

      unique.add(option);
      return true;
    });

  return cleaned.length > 0 ? cleaned : [...fallback];
}

function countRows(payload: unknown): number {
  if (Array.isArray(payload)) {
    return payload.length;
  }

  if (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    const record = payload as Record<string, unknown>;

    for (const key of ["items", "stores", "offers", "data"]) {
      const nested = record[key];

      if (Array.isArray(nested)) {
        return nested.length;
      }
    }

    if (typeof record["totalCount"] === "number") {
      return record["totalCount"];
    }
  }

  return 0;
}

export default function DiscountFilterBar({
  onDistanceChange,
  onSortChange,
  onViewChange,
}: DiscountFilterBarProps) {
  // --------------------------------
  // Validate distance options
  // --------------------------------
  const safeDistanceOptions = useMemo(
    () => normalizeOptions(DISTANCE_OPTIONS, FALLBACK_DISTANCE_OPTIONS),
    [],
  );

  // --------------------------------
  // Validate sort options
  // --------------------------------
  const safeSortOptions = useMemo(
    () => normalizeOptions(SORT_OPTIONS, FALLBACK_SORT_OPTIONS),
    [],
  );

  // --------------------------------
  // Initial distance
  // --------------------------------
  const [distance, setDistance] = useState<string>(
    safeDistanceOptions[1] ??
      safeDistanceOptions[0] ??
      ""
  );

  // --------------------------------
  // Initial sort
  // --------------------------------
  const [sort, setSort] = useState<string>(
    safeSortOptions[0] ?? ""
  );

  // --------------------------------
  // View mode
  // --------------------------------
  const [view, setView] = useState<ViewMode>("list");

  // --------------------------------
  // Live offer count (best-effort,
  // controls stay enabled on failure)
  // --------------------------------
  const [liveCount, setLiveCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [storesRes, offersRes] = await Promise.all([
          storesApi.list(1, 1),
          storeOffersApi.list(1, 1),
        ]);

        const total =
          countRows(storesRes.data) + countRows(offersRes.data);

        if (!cancelled) {
          setLiveCount(total);
        }
      } catch {
        if (!cancelled) {
          setLiveCount(null);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------
  // Handlers (validated + notified)
  // --------------------------------
  const handleDistanceSelect = (option: string) => {
    if (
      typeof option === "string" &&
      option.trim().length > 0 &&
      safeDistanceOptions.includes(option)
    ) {
      setDistance(option);
      onDistanceChange?.(option);
    }
  };

  const handleSortSelect = (nextValue: string) => {
    // Only allow values from validated options.
    if (safeSortOptions.includes(nextValue)) {
      setSort(nextValue);
      onSortChange?.(nextValue);
    }
  };

  const handleViewSelect = (nextView: ViewMode) => {
    if (nextView !== "list" && nextView !== "grid") {
      return;
    }

    setView(nextView);
    onViewChange?.(nextView);
  };

  // --------------------------------
  // Empty options protection
  // --------------------------------
  if (
    safeDistanceOptions.length === 0 &&
    safeSortOptions.length === 0
  ) {
    return (
      <div
        className="
          flex
          items-center
          justify-between
          min-h-[40px]
        "
        role="status"
        aria-live="polite"
      >
        <span className="text-[12px] text-ink-faint">
          No filter options available.
        </span>
      </div>
    );
  }

  return (
    <div
      className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        justify-between
        gap-3
      "
    >
      {/* --------------------------------
          Distance Filters
          -------------------------------- */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="
            text-[12px]
            font-semibold
            text-ink-soft
            mr-1
          "
        >
          Discounts within:
        </span>

        {safeDistanceOptions.length > 0 ? (
          safeDistanceOptions.map((option) => {
            const isActive = distance === option;

            return (
              <button
                key={option}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleDistanceSelect(option)}
                className={`
                  text-[12px]
                  font-semibold
                  px-3.5
                  py-1.5
                  rounded-pill
                  border
                  transition-colors
                  cursor-pointer
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-green
                  focus-visible:ring-offset-2
                  ${
                    isActive
                      ? "bg-green text-white border-green"
                      : "bg-white text-ink-soft border-line hover:border-green hover:text-green-deep"
                  }
                `}
              >
                {option}
              </button>
            );
          })
        ) : (
          <span className="text-[12px] text-ink-faint">
            No distance options
          </span>
        )}

        {liveCount !== null && liveCount > 0 && (
          <span
            className="text-[11px] text-ink-faint ml-1"
            role="status"
            aria-live="polite"
          >
            {liveCount} live {liveCount === 1 ? "offer" : "offers"}
          </span>
        )}
      </div>

      {/* --------------------------------
          Sort + View Controls
          -------------------------------- */}
      <div className="flex items-center gap-3">
        {/* Sort */}
        {safeSortOptions.length > 0 && (
          <div className="relative">
            <select
              value={sort}
              onChange={(event) => {
                handleSortSelect(event.target.value);
              }}
              aria-label="Sort discounts"
              className="
                appearance-none
                bg-white
                border
                border-line
                rounded-lg
                pl-3
                pr-8
                py-2
                text-[12.5px]
                font-semibold
                text-ink
                outline-none
                cursor-pointer
                focus:ring-2
                focus:ring-blue
                focus:ring-offset-1
              "
            >
              {safeSortOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  Sort by: {option}
                </option>
              ))}
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

        {/* View Toggle */}
        <div
          className="
            flex
            items-center
            border
            border-line
            rounded-lg
            overflow-hidden
          "
          role="group"
          aria-label="Change discount view"
        >
          {/* List View */}
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => handleViewSelect("list")}
            className={`
              px-3
              py-2
              flex
              items-center
              gap-1.5
              text-[12px]
              font-semibold
              transition-colors
              cursor-pointer
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue
              focus-visible:ring-inset
              ${
                view === "list"
                  ? "bg-navy text-white"
                  : "bg-white text-ink-soft hover:text-navy"
              }
            `}
          >
            <List
              size={14}
              aria-hidden="true"
            />
            <span>List View</span>
          </button>

          {/* Map View */}
          <button
            type="button"
            aria-pressed={view === "grid"}
            onClick={() => handleViewSelect("grid")}
            className={`
              px-3
              py-2
              flex
              items-center
              gap-1.5
              text-[12px]
              font-semibold
              transition-colors
              border-l
              border-line
              cursor-pointer
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue
              focus-visible:ring-inset
              ${
                view === "grid"
                  ? "bg-navy text-white"
                  : "bg-white text-ink-soft hover:text-navy"
              }
            `}
          >
            <LayoutGrid
              size={14}
              aria-hidden="true"
            />
            <span>Map View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
