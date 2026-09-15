import {
  Zap,
  Percent,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CTAPoint {
  icon: LucideIcon;
  label: string;
}

const POINTS: CTAPoint[] = [
  {
    icon: Zap,
    label: "Instant Local Visibility",
  },
  {
    icon: Percent,
    label: "Zero Hidden Commissions",
  },
  {
    icon: TrendingUp,
    label: "Direct Footfall Boost",
  },
];

/* --------------------------------
 * Validate text
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
 * Validate CTA point
 * -------------------------------- */
function isValidPoint(
  value: unknown,
): value is CTAPoint {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const point = value as Record<string, unknown>;

  return (
    typeof point.label === "string" &&
    point.label.trim().length > 0 &&
    typeof point.icon === "function"
  );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */
export default function StoreOwnerCTA() {
  const safePoints = POINTS
    .filter(isValidPoint)
    .map((point) => ({
      icon: point.icon,
      label: point.label.trim(),
    }));

  return (
    <section
      className="
        bg-navy
        rounded-card
        px-6
        sm:px-10
        py-9
        sm:py-12
        text-center
      "
      aria-labelledby="store-owner-cta-title"
    >
      {/* Heading */}
      <h2
        id="store-owner-cta-title"
        className="
          font-sora
          font-bold
          text-[20px]
          sm:text-[24px]
          text-white
        "
      >
        Own a Local Retail Store? Grow with Aanzara
      </h2>

      {/* Description */}
      <p
        className="
          text-[12.5px]
          sm:text-[13px]
          text-white/70
          mt-2.5
          max-w-[540px]
          mx-auto
          leading-relaxed
        "
      >
        Boost physical store visibility, offload aging
        inventory, and reach directly targeting customers
        living within blocks of your storefront.
      </p>

      {/* Points */}
      {safePoints.length > 0 && (
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-center
            gap-x-8
            gap-y-3
            mt-6
          "
          aria-label="Store owner benefits"
        >
          {safePoints.map((point, index) => {
            const Icon = point.icon;

            return (
              <span
                key={`${point.label}-${index}`}
                className="
                  flex
                  items-center
                  gap-2
                  text-white/85
                  text-[12.5px]
                  font-semibold
                "
              >
                <Icon
                  size={15}
                  className="text-green"
                  aria-hidden="true"
                />

                {point.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div
        className="
          flex
          flex-wrap
          items-center
          justify-center
          gap-2.5
          mt-7
        "
      >
        {/* Onboard */}
        <button
          type="button"
          className="
            flex
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
            cursor-pointer
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-white
            focus-visible:ring-offset-2
            focus-visible:ring-offset-navy
          "
          aria-label="Onboard your shop now"
        >
          Onboard Your Shop Now

          <ArrowRight
            size={14}
            aria-hidden="true"
          />
        </button>

        {/* Partnering */}
        <button
          type="button"
          className="
            border
            border-white/30
            hover:bg-white/10
            transition-colors
            text-white
            text-[12.5px]
            font-bold
            px-5
            py-3
            rounded-lg
            cursor-pointer
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-white
            focus-visible:ring-offset-2
            focus-visible:ring-offset-navy
          "
          aria-label="Learn how partnering works"
        >
          How Partnering Works
        </button>
      </div>
    </section>
  );
}