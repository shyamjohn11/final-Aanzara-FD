"use client";

import { ClipboardList } from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type CategoryHeaderProps = {
  title: string;
  count: number;
  description: string;
};

/* ============================================================
   VALIDATION HELPERS
============================================================ */

function safeText(
  value: unknown,
  fallback: string
): string {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return fallback;
  }

  return value.trim();
}

function safeCount(
  value: unknown
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return Math.floor(value);
}

/* ============================================================
   COMPONENT
============================================================ */

export default function CategoryHeader({
  title,
  count,
  description,
}: CategoryHeaderProps) {
  const safeTitle = safeText(
    title,
    "Category"
  );

  const safeDescription = safeText(
    description,
    "Browse products available in this category."
  );

  const safeProductCount =
    safeCount(count);

  return (
    <header
      aria-labelledby="category-header-title"
      className="
        flex
        flex-col
        gap-4
        lg:flex-row
        lg:items-start
        lg:justify-between
      "
    >
      {/* ======================================================
          CATEGORY INFORMATION
      ====================================================== */}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1
            id="category-header-title"
            className="
              font-sora
              text-[26px]
              font-bold
              tracking-tight
              text-navy
              sm:text-[30px]
            "
          >
            {safeTitle}
          </h1>

          <span
            aria-label={`${safeProductCount} products found`}
            className="
              rounded-pill
              border
              border-line
              bg-paper-deep
              px-2.5
              py-1
              text-[11.5px]
              font-semibold
              text-ink-soft
            "
          >
            {safeProductCount}{" "}
            {safeProductCount === 1
              ? "Product"
              : "Products"}{" "}
            Found
          </span>
        </div>

        <p
          className="
            mt-2
            max-w-[620px]
            text-[13px]
            leading-relaxed
            text-ink-soft
          "
        >
          {safeDescription}
        </p>
      </div>

      {/* ======================================================
          BUSINESS QUOTE BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() => {
          // Add your custom business quote flow here.
          //
          // Example:
          // router.push("/contact?type=business-quote");
        }}
        aria-label={`Request a custom business quote for ${safeTitle}`}
        className="
          flex
          shrink-0
          items-center
          gap-2
          self-start
          rounded-lg
          border-2
          border-blue
          px-5
          py-3
          text-[12.5px]
          font-bold
          text-blue
          transition-colors
          hover:bg-blue
          hover:text-white
          focus:outline-none
          focus:ring-2
          focus:ring-blue/30
          focus:ring-offset-2
        "
      >
        <ClipboardList
          size={16}
          aria-hidden="true"
        />

        <span>
          REQUEST CUSTOM BUSINESS QUOTE
        </span>
      </button>
    </header>
  );
}