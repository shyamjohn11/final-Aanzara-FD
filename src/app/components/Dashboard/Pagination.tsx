// File: app/components/Dashboard/Pagination.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type PageItem = number | "...";

/* ============================================================
   DATA
============================================================ */

const PAGES: PageItem[] = [1, 2, 3, 4, "...", 12];

/* ============================================================
   COMPONENT
============================================================ */

export default function Pagination() {
  const [active, setActive] = useState(1);

  /* ==========================================================
     VALID PAGE DATA
  ========================================================== */

  const validPages = PAGES.filter(
    (page): page is PageItem =>
      page === "..." ||
      (typeof page === "number" &&
        Number.isInteger(page) &&
        page > 0)
  );

  const numericPages = validPages.filter(
    (page): page is number => typeof page === "number"
  );

  const firstPage = numericPages.length > 0
    ? Math.min(...numericPages)
    : 1;

  const lastPage = numericPages.length > 0
    ? Math.max(...numericPages)
    : 1;

  const safeActive =
    Number.isInteger(active) &&
    active >= firstPage &&
    active <= lastPage
      ? active
      : firstPage;

  /* ==========================================================
     HANDLERS
  ========================================================== */

  const goToPage = (page: number) => {
    if (
      !Number.isInteger(page) ||
      page < firstPage ||
      page > lastPage
    ) {
      return;
    }

    setActive(page);
  };

  const goPrevious = () => {
    if (safeActive > firstPage) {
      setActive(safeActive - 1);
    }
  };

  const goNext = () => {
    if (safeActive < lastPage) {
      setActive(safeActive + 1);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2"
    >
      {/* ======================================================
          PREVIOUS
      ====================================================== */}

      <button
        type="button"
        onClick={goPrevious}
        disabled={safeActive <= firstPage}
        aria-label="Previous page"
        className="
          w-9
          h-9
          rounded-lg
          border
          border-line
          flex
          items-center
          justify-center
          text-ink-soft
          hover:border-blue
          hover:text-blue
          transition-colors
          disabled:opacity-40
          disabled:cursor-not-allowed
          disabled:hover:border-line
          disabled:hover:text-ink-soft
        "
      >
        <ChevronLeft size={15} />
      </button>

      {/* ======================================================
          PAGE NUMBERS
      ====================================================== */}

      {validPages.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`dots-${index}`}
              aria-hidden="true"
              className="
                w-9
                h-9
                flex
                items-center
                justify-center
                text-ink-faint
                text-[13px]
              "
            >
              …
            </span>
          );
        }

        const isActive = safeActive === page;

        return (
          <button
            key={`page-${page}`}
            type="button"
            onClick={() => goToPage(page)}
            aria-label={`Go to page ${page}`}
            aria-current={isActive ? "page" : undefined}
            className={`
              w-9
              h-9
              rounded-lg
              text-[13px]
              font-semibold
              flex
              items-center
              justify-center
              transition-colors
              ${
                isActive
                  ? "bg-navy text-white"
                  : "border border-line text-ink-soft hover:border-blue hover:text-blue"
              }
            `}
          >
            {page}
          </button>
        );
      })}

      {/* ======================================================
          NEXT
      ====================================================== */}

      <button
        type="button"
        onClick={goNext}
        disabled={safeActive >= lastPage}
        aria-label="Next page"
        className="
          w-9
          h-9
          rounded-lg
          border
          border-line
          flex
          items-center
          justify-center
          text-ink-soft
          hover:border-blue
          hover:text-blue
          transition-colors
          disabled:opacity-40
          disabled:cursor-not-allowed
          disabled:hover:border-line
          disabled:hover:text-ink-soft
        "
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}