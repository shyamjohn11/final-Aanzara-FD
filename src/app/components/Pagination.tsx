"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const TOTAL_PAGES = 12;

export default function Pagination() {
  const [active, setActive] = useState(1);

  const goToPage = (page: number) => {
    if (
      page < 1 ||
      page > TOTAL_PAGES
    ) {
      return;
    }

    setActive(page);
  };

  const getPages = () => {
    if (TOTAL_PAGES <= 6) {
      return Array.from(
        { length: TOTAL_PAGES },
        (_, i) => i + 1
      );
    }

    if (active <= 4) {
      return [
        1,
        2,
        3,
        4,
        "...",
        TOTAL_PAGES,
      ];
    }

    if (active >= TOTAL_PAGES - 3) {
      return [
        1,
        "...",
        TOTAL_PAGES - 3,
        TOTAL_PAGES - 2,
        TOTAL_PAGES - 1,
        TOTAL_PAGES,
      ];
    }

    return [
      1,
      "...",
      active - 1,
      active,
      active + 1,
      "...",
      TOTAL_PAGES,
    ];
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-center gap-2">
      {/* PREVIOUS */}

      <button
        type="button"
        onClick={() =>
          goToPage(active - 1)
        }
        disabled={active === 1}
        aria-label="Previous page"
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-lg
          border
          border-line
          text-ink-soft
          transition-colors
          hover:border-blue
          hover:text-blue
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronLeft size={15} />
      </button>

      {/* PAGE NUMBERS */}

      {pages.map((page, index) =>
        page === "..." ? (
          <span
            key={`dots-${index}`}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              text-[13px]
              text-ink-faint
            "
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() =>
              goToPage(page as number)
            }
            aria-current={
              active === page
                ? "page"
                : undefined
            }
            className={`
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-[13px]
              font-semibold
              transition-colors
              ${
                active === page
                  ? "bg-navy text-white"
                  : "border border-line text-ink-soft hover:border-blue hover:text-blue"
              }
            `}
          >
            {page}
          </button>
        )
      )}

      {/* NEXT */}

      <button
        type="button"
        onClick={() =>
          goToPage(active + 1)
        }
        disabled={
          active === TOTAL_PAGES
        }
        aria-label="Next page"
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-lg
          border
          border-line
          text-ink-soft
          transition-colors
          hover:border-blue
          hover:text-blue
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}