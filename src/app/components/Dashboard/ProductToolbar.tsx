"use client";

import { useState } from "react";
import { ChevronDown, LayoutGrid, List } from "lucide-react";

type ViewMode = "grid" | "list";

const SORT_OPTIONS = [
  "Most Popular (Wholesale Vol.)",
  "Price: Low to High",
  "Price: High to Low",
  "Highest Discount",
  "Newest Arrivals",
] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

export default function ProductToolbar() {
  const [view, setView] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>(
    SORT_OPTIONS[0]
  );

  const handleViewChange = (mode: ViewMode) => {
    setView(mode);
  };

  const handleSortChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;

    if (
      SORT_OPTIONS.includes(
        value as SortOption
      )
    ) {
      setSortBy(value as SortOption);
    }
  };

  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      {/* =====================================================
          SORT
      ===================================================== */}

      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[12.5px] text-ink-soft shrink-0">
          Sort By:
        </span>

        <div className="relative">
          <select
            value={sortBy}
            onChange={handleSortChange}
            aria-label="Sort products"
            className="
              appearance-none
              bg-white
              border
              border-line
              rounded-lg
              pl-3
              pr-9
              py-2
              text-[12.5px]
              font-semibold
              text-ink
              outline-none
              focus:border-blue
              transition-colors
              max-w-[230px]
              sm:max-w-none
            "
          >
            {SORT_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>

          <ChevronDown
            size={14}
            aria-hidden="true"
            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-ink-faint
              pointer-events-none
            "
          />
        </div>
      </div>

      {/* =====================================================
          VIEW MODE
      ===================================================== */}

      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <span className="text-[12.5px] text-ink-soft">
          View Mode:
        </span>

        <button
          type="button"
          onClick={() =>
            handleViewChange("grid")
          }
          aria-label="Grid view"
          aria-pressed={view === "grid"}
          className={`
            w-8
            h-8
            rounded-md
            flex
            items-center
            justify-center
            border
            transition-colors
            ${
              view === "grid"
                ? "bg-blue border-blue text-white"
                : "bg-white border-line text-ink-faint hover:border-blue hover:text-blue"
            }
          `}
        >
          <LayoutGrid
            size={15}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={() =>
            handleViewChange("list")
          }
          aria-label="List view"
          aria-pressed={view === "list"}
          className={`
            w-8
            h-8
            rounded-md
            flex
            items-center
            justify-center
            border
            transition-colors
            ${
              view === "list"
                ? "bg-blue border-blue text-white"
                : "bg-white border-line text-ink-faint hover:border-blue hover:text-blue"
            }
          `}
        >
          <List
            size={15}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}