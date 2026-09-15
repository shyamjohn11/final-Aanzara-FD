import Link from "next/link";
import {
  Leaf,
  ArrowRight,
} from "lucide-react";

interface Swatch {
  color: string;
  accent: string;
  h: string;
}

const SWATCHES: Swatch[] = [
  {
    color: "#F4C64A",
    accent: "#E3B93A",
    h: "h-28",
  },
  {
    color: "#D9A94E",
    accent: "#B8862F",
    h: "h-24",
  },
  {
    color: "#2448C4",
    accent: "#1B37A0",
    h: "h-32",
  },
  {
    color: "#1F5FBF",
    accent: "#153E80",
    h: "h-20",
  },
];

/* --------------------------------
 * Safe text validation
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
 * Color validation
 * -------------------------------- */
function getSafeColor(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return fallback;
  }

  const color = value.trim();

  /*
   * Supports common HEX colors.
   */
  if (
    /^#[0-9A-Fa-f]{3}$/.test(color) ||
    /^#[0-9A-Fa-f]{6}$/.test(color) ||
    /^#[0-9A-Fa-f]{8}$/.test(color)
  ) {
    return color;
  }

  return fallback;
}

/* --------------------------------
 * Height validation
 * -------------------------------- */
function getSafeHeight(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return fallback;
  }

  const height = value.trim();

  /*
   * Only allow the Tailwind height
   * classes used by this component.
   */
  const allowedHeights = new Set([
    "h-20",
    "h-24",
    "h-28",
    "h-32",
  ]);

  return allowedHeights.has(height)
    ? height
    : fallback;
}

/* --------------------------------
 * Swatch validation
 * -------------------------------- */
function isValidSwatch(
  value: unknown,
): value is Swatch {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const swatch =
    value as Record<string, unknown>;

  return (
    typeof swatch.color === "string" &&
    swatch.color.trim().length > 0 &&
    typeof swatch.accent === "string" &&
    swatch.accent.trim().length > 0 &&
    typeof swatch.h === "string" &&
    swatch.h.trim().length > 0
  );
}

/* --------------------------------
 * Safe swatches
 * -------------------------------- */
function getSafeSwatches(
  value: unknown,
): Swatch[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isValidSwatch)
    .map((swatch) => ({
      color: getSafeColor(
        swatch.color,
        "#E5E7EB",
      ),
      accent: getSafeColor(
        swatch.accent,
        "#CBD5E1",
      ),
      h: getSafeHeight(
        swatch.h,
        "h-24",
      ),
    }));
}

/* --------------------------------
 * Main Component
 * -------------------------------- */
export default function NewArrivalsHero() {
  const safeSwatches =
    getSafeSwatches(SWATCHES);

  const badge = getSafeText(
    "NEW ARRIVALS",
    "NEW ARRIVALS",
  );

  const title = getSafeText(
    "Fresh Arrivals. Better Business.",
    "Fresh Arrivals",
  );

  const description = getSafeText(
    "Explore the latest FMCG products, new launches and trending brands now in stock.",
    "Explore our latest new arrivals.",
  );

  const exploreLabel = getSafeText(
    "Explore New Arrivals",
    "Explore",
  );

  return (
    <section
      className="
        relative
        rounded-card
        overflow-hidden
        px-6
        sm:px-10
        py-9
      "
      style={{
        background:
          "linear-gradient(120deg, #E9F6ED 0%, #F3FBF5 100%)",
      }}
      aria-labelledby="new-arrivals-hero-title"
    >
      {/* --------------------------------
       * Decorative Leaves
       * -------------------------------- */}
      <Leaf
        size={90}
        aria-hidden="true"
        className="
          absolute
          -top-4
          left-[38%]
          text-green/10
          rotate-12
        "
      />

      <Leaf
        size={60}
        aria-hidden="true"
        className="
          absolute
          bottom-2
          right-[6%]
          text-green/10
          -rotate-45
        "
      />

      {/* --------------------------------
       * Content
       * -------------------------------- */}
      <div
        className="
          relative
          flex
          flex-col
          lg:flex-row
          items-center
          gap-8
        "
      >
        {/* Text Content */}
        <div
          className="
            flex-1
            max-w-[520px]
          "
        >
          {/* Badge */}
          <span
            className="
              inline-flex
              w-fit
              items-center
              bg-green/15
              text-green-deep
              text-[10.5px]
              font-bold
              tracking-wide
              px-2.5
              py-1
              rounded-md
              mb-3
            "
          >
            {badge}
          </span>

          {/* Title */}
          <h1
            id="new-arrivals-hero-title"
            className="
              font-sora
              font-extrabold
              text-navy
              text-[26px]
              sm:text-[32px]
              leading-[1.15]
            "
          >
            {title}
          </h1>

          {/* Description */}
          <p
            className="
              text-ink-soft
              text-[13px]
              sm:text-[13.5px]
              mt-3
              leading-relaxed
              max-w-[440px]
            "
          >
            {description}
          </p>

          {/* Explore Button */}
          <Link
            href="#new-arrivals-grid"
            aria-label={exploreLabel}
            className="
              inline-flex
              items-center
              gap-2
              bg-green
              hover:bg-green-deep
              transition-colors
              text-white
              text-[12.5px]
              font-bold
              px-5
              py-3
              rounded-lg
              mt-6
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-green
              focus-visible:ring-offset-2
            "
          >
            {exploreLabel}

            <ArrowRight
              size={14}
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* --------------------------------
         * Product Swatches
         * -------------------------------- */}
        {safeSwatches.length > 0 && (
          <div
            className="
              flex
              items-end
              gap-3
              shrink-0
            "
            aria-hidden="true"
          >
            {safeSwatches.map(
              (swatch, index) => (
                <div
                  key={`${swatch.color}-${swatch.accent}-${index}`}
                  className={`
                    w-14
                    sm:w-16
                    ${swatch.h}
                    rounded-xl
                    shadow-md
                  `}
                  style={{
                    background: `linear-gradient(
                      160deg,
                      ${swatch.color},
                      ${swatch.accent}
                    )`,
                  }}
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}