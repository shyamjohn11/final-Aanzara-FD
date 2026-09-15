"use client";

import { Truck } from "lucide-react";

/* ============================================================
   COMPONENT
============================================================ */

export default function BulkCTA() {
  return (
    <section
      aria-labelledby="bulk-cta-title"
      className="
        bg-blue/[0.06]
        border
        border-blue/20
        rounded-card
        p-5
        flex
        flex-col
        sm:flex-row
        items-start
        sm:items-center
        justify-between
        gap-4
      "
    >
      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="flex items-start sm:items-center gap-4 min-w-0">
        {/* ICON */}

        <span
          aria-hidden="true"
          className="
            w-11
            h-11
            rounded-full
            bg-blue
            text-white
            flex
            items-center
            justify-center
            shrink-0
          "
        >
          <Truck size={20} />
        </span>

        {/* TEXT */}

        <div className="min-w-0">
          <h2
            id="bulk-cta-title"
            className="
              font-sora
              font-bold
              text-[15.5px]
              text-navy
              leading-snug
            "
          >
            Planning a massive procurement of 500+ units?
          </h2>

          <p
            className="
              text-[12.5px]
              text-ink-soft
              mt-0.5
              leading-relaxed
            "
          >
            Unlock raw manufacturer rates, priority shipment dispatch,
            custom warehousing options and structured credit cycles.
          </p>
        </div>
      </div>

      {/* ======================================================
          CTA BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() => {
          // Add your wholesale quote flow here.
          // Example:
          // router.push("/contact?type=wholesale");
        }}
        aria-label="Get wholesale quote now for bulk procurement"
        className="
          bg-blue
          hover:bg-blue-deep
          active:scale-[0.98]
          transition-all
          text-white
          text-[12.5px]
          font-bold
          tracking-wide
          px-5
          py-3
          rounded-lg
          shrink-0
          w-full
          sm:w-auto
          focus:outline-none
          focus:ring-2
          focus:ring-blue/30
          focus:ring-offset-2
        "
      >
        GET WHOLESALE QUOTE NOW
      </button>
    </section>
  );
}