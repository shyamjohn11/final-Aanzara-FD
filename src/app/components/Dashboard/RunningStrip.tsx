// File: app/components/Dashboard/RunningStrip.tsx
"use client";

import { Sparkles } from "lucide-react";

/* ============================================================
   DEFAULT ITEMS
   Swap these for whatever you want to advertise — offers,
   categories, trust signals, etc.
============================================================ */

const DEFAULT_ITEMS = [
  "Free Delivery on Bulk Orders",
  "1000+ Trusted Brands",
  "GST Compliant Invoicing",
  "Secure B2B Payments",
  "Dedicated Wholesale Support",
  "Pan-India Logistics Network",
];

type RunningStripProps = {
  items?: string[];
  /**
   * Seconds for one full loop. Lower = faster scroll.
   */
  durationSeconds?: number;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function RunningStrip({
  items = DEFAULT_ITEMS,
  durationSeconds = 22,
}: RunningStripProps) {
  const safeItems =
    Array.isArray(items) && items.length > 0
      ? items
      : DEFAULT_ITEMS;

  // Render the list twice back-to-back so the marquee loop is seamless.
  const loopItems = [...safeItems, ...safeItems];

  return (
    <div
      className="
        glass-navy
        relative
        overflow-hidden
        rounded-card
        py-3
      "
      aria-label="Aanzara highlights"
    >
      {/* Edge fade so the loop doesn't look cut off */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-y-0
          left-0
          z-10
          w-10
          bg-gradient-to-r
          from-navy/60
          to-transparent
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-y-0
          right-0
          z-10
          w-10
          bg-gradient-to-l
          from-navy/60
          to-transparent
        "
      />

      <div
        className="az-marquee-track flex w-max items-center gap-10 whitespace-nowrap"
        style={{
          animationDuration: `${durationSeconds}s`,
        }}
      >
        {loopItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="
              flex
              items-center
              gap-2
              text-[12.5px]
              font-semibold
              tracking-wide
              text-white
            "
          >
            <Sparkles
              size={13}
              className="text-green"
              aria-hidden="true"
            />
            {item}
          </span>
        ))}
      </div>

      {/* Scoped marquee keyframes — no Tailwind config changes needed */}
      <style>{`
        .az-marquee-track {
          animation-name: az-marquee-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes az-marquee-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .az-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
