"use client";

import { Sparkles, ArrowRight, Leaf } from "lucide-react";

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
    "NEW ARRIVALS · UPDATED DAILY",
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

  const marqueeItems = [
    "Snack Co. Multipacks",
    "Organic Cold-Press Oils",
    "Herbal Wellness Range",
    "Instant Beverage Mixes",
    "Eco Packaging Line",
    "Premium Spice Blends",
  ];

  // --------------------------------
  // Explore button
  // --------------------------------
  const handleExploreClick = () => {
    document
      .getElementById("new-arrivals-grid")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <section
      className="
        relative
        rounded-card
        overflow-hidden
        px-6
        sm:px-10
        py-6
        sm:py-8
        bg-white
      "
      aria-labelledby="new-arrivals-hero-title"
    >
      {/* =====================================================
          BACKGROUND IMAGE
      ===================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-cover
          bg-center
        "
        style={{
          backgroundImage:
            'url("/images/New%20Arrivals/newarrivals.png")',
        }}
        aria-hidden="true"
      />

      {/* Very light overlay */}
      <div
        className="
          absolute
          inset-0
          bg-white/5
        "
        aria-hidden="true"
      />

      {/* Center glass effect */}
      <div
        className="
          absolute
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2
          w-[65%]
          sm:w-[55%]
          h-[75%]
          rounded-[40px]
          bg-white/20
          backdrop-blur-[2px]
        "
        aria-hidden="true"
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        className="
          relative
          z-10
          flex
          flex-col
          items-center
          text-center
        "
      >
        {/* Badge */}
        <span
          className="
            inline-flex
            items-center
            gap-1.5
            bg-white/75
            text-green-deep
            text-[10.5px]
            font-bold
            tracking-wide
            px-2.5
            py-1
            rounded-md
            mb-3
            border
            border-white/80
            shadow-[0_2px_10px_rgba(0,0,0,0.12)]
            backdrop-blur-sm
          "
        >
          <Sparkles
            size={12}
            aria-hidden="true"
          />

          {badge}
        </span>

        {/* Heading */}
        <h1
          id="new-arrivals-hero-title"
          className="
            font-sora
            font-extrabold
            text-navy
            text-[27px]
            sm:text-[36px]
            leading-[1.08]
            max-w-[640px]
            drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]
          "
        >
          Fresh Arrivals.{" "}

          <span
            style={{
              background:
                "linear-gradient(90deg, #167A46, #C58A00)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Better Business.
          </span>
        </h1>

        {/* Description */}
        <p
          className="
            text-navy/85
            text-[13.5px]
            sm:text-[14.5px]
            mt-2.5
            max-w-[460px]
            leading-relaxed
            font-medium
            drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]
          "
        >
          {description}
        </p>

        {/* Explore Button */}
        <button
          type="button"
          onClick={handleExploreClick}
          aria-label={exploreLabel}
          className="
            inline-flex
            items-center
            gap-2
            bg-green
            hover:bg-green-deep
            transition-all
            duration-200
            text-white
            text-[12.5px]
            font-bold
            px-5
            py-2.5
            rounded-lg
            mt-4
            shadow-[0_5px_20px_rgba(0,0,0,0.25)]
            hover:shadow-[0_7px_25px_rgba(0,0,0,0.30)]
            hover:-translate-y-0.5
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
        </button>
      </div>

      {/* =====================================================
          MARQUEE STRIP
      ===================================================== */}

      <div
        className="
          relative
          z-10
          mt-6
          sm:mt-7
          border-t
          border-navy/15
          pt-3
          overflow-hidden
        "
        aria-hidden="true"
      >
        <div
          className="flex gap-8 w-max"
          style={{
            animation:
              "heroMarquee 22s linear infinite",
          }}
        >
          {[
            ...marqueeItems,
            ...marqueeItems,
          ].map((item, i) => (
            <span
              key={i}
              className="
                text-navy/70
                text-[11.5px]
                font-semibold
                tracking-wide
                whitespace-nowrap
                drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]
              "
            >
              ✦ &nbsp;{item}
            </span>
          ))}
        </div>
      </div>

      {/* =====================================================
          MARQUEE ANIMATION
      ===================================================== */}

      <style>{`
        @keyframes heroMarquee {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}