import Link from "next/link";
import {
  ChevronRight,
  RefreshCw,
} from "lucide-react";

/* --------------------------------
 * Types
 * -------------------------------- */

interface PageHeaderContent {
  breadcrumb: string;
  title: string;
  description: string;
  updateTitle: string;
  updateDescription: string;
}

/* --------------------------------
 * Static Content
 * -------------------------------- */

const PAGE_CONTENT: PageHeaderContent = {
  breadcrumb: "New Arrivals",
  title: "New Arrivals",
  description:
    "Discover the latest products added to our catalog. Stock is limited — order now!",
  updateTitle: "New products added daily",
  updateDescription:
    "Check back often for more",
};

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function getSafeText(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return fallback;
  }

  return value.trim();
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function NewArrivalsPageHeader() {
  const safeContent: PageHeaderContent = {
    breadcrumb: getSafeText(
      PAGE_CONTENT.breadcrumb,
      "New Arrivals",
    ),
    title: getSafeText(
      PAGE_CONTENT.title,
      "New Arrivals",
    ),
    description: getSafeText(
      PAGE_CONTENT.description,
      "Discover our latest products.",
    ),
    updateTitle: getSafeText(
      PAGE_CONTENT.updateTitle,
      "New products added daily",
    ),
    updateDescription: getSafeText(
      PAGE_CONTENT.updateDescription,
      "Check back often for more",
    ),
  };

  return (
    <header
      className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        justify-between
        gap-4
      "
      aria-labelledby="new-arrivals-page-title"
    >
      {/* --------------------------------
       * Page Information
       * -------------------------------- */}

      <div>
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="
            flex
            items-center
            gap-1.5
            text-[12px]
            text-ink-faint
            mb-2
          "
        >
          <Link
            href="/dashboard"
            className="
              hover:text-navy
              transition-colors
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue
              focus-visible:ring-offset-2
              rounded
            "
          >
            Home
          </Link>

          <ChevronRight
            size={12}
            aria-hidden="true"
          />

          <span
            className="text-ink"
            aria-current="page"
          >
            {safeContent.breadcrumb}
          </span>
        </nav>

        {/* Page Title */}
        <h1
          id="new-arrivals-page-title"
          className="
            font-sora
            font-extrabold
            text-navy
            text-[22px]
            sm:text-[26px]
          "
        >
          {safeContent.title}
        </h1>

        {/* Description */}
        <p
          className="
            text-[12.5px]
            text-ink-soft
            mt-1
            max-w-[620px]
          "
        >
          {safeContent.description}
        </p>
      </div>

      {/* --------------------------------
       * Daily Update Card
       * -------------------------------- */}

      <div
        className="
          flex
          items-center
          gap-3
          bg-green/10
          border
          border-green/25
          rounded-lg
          px-4
          py-3
          shrink-0
        "
        role="status"
        aria-label={`${safeContent.updateTitle}. ${safeContent.updateDescription}.`}
      >
        {/* Icon */}
        <span
          className="
            w-8
            h-8
            rounded-lg
            bg-green
            text-white
            flex
            items-center
            justify-center
            shrink-0
          "
        >
          <RefreshCw
            size={14}
            aria-hidden="true"
          />
        </span>

        {/* Text */}
        <div>
          <div
            className="
              text-[12px]
              font-bold
              text-green-deep
            "
          >
            {safeContent.updateTitle}
          </div>

          <div
            className="
              text-[11px]
              text-ink-soft
            "
          >
            {safeContent.updateDescription}
          </div>
        </div>
      </div>
    </header>
  );
}