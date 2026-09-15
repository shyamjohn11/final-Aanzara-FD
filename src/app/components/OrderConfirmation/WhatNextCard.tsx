import Link from "next/link";

/* =========================
   CONSTANTS
========================= */

const HOME_ROUTE = "/";

/* =========================
   COMPONENT
========================= */

export default function WhatNextCard() {
  return (
    <section
      className="bg-white border border-line rounded-card p-5"
      aria-labelledby="what-next-title"
    >
      <h2
        id="what-next-title"
        className="text-[14px] font-bold text-ink mb-4"
      >
        What would you like to do next?
      </h2>

      <div className="flex flex-col gap-2.5">
        {/* TRACK ORDER */}

        <button
          type="button"
          className="
            bg-green
            hover:bg-green-deep
            transition-colors
            text-white
            text-[12.5px]
            font-bold
            py-2.5
            rounded-lg
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-green
            focus-visible:ring-offset-2
          "
        >
          Real-time Track Order
        </button>

        {/* CONTINUE SHOPPING */}

        <Link
          href={HOME_ROUTE}
          className="
            text-center
            bg-blue
            hover:bg-navy
            transition-colors
            text-white
            text-[12.5px]
            font-bold
            py-2.5
            rounded-lg
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue
            focus-visible:ring-offset-2
          "
        >
          Continue Shopping
        </Link>

        {/* REPEAT ORDER */}

        <button
          type="button"
          className="
            border
            border-line
            text-ink
            text-[12.5px]
            font-bold
            py-2.5
            rounded-lg
            hover:border-navy
            hover:text-navy
            transition-colors
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-navy
            focus-visible:ring-offset-2
          "
        >
          Repeat This Wholesale Order
        </button>

        {/* PRICE LIST */}

        <button
          type="button"
          className="
            border
            border-line
            text-ink
            text-[12.5px]
            font-bold
            py-2.5
            rounded-lg
            hover:border-navy
            hover:text-navy
            transition-colors
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-navy
            focus-visible:ring-offset-2
          "
        >
          Download August Price List
        </button>
      </div>

      {/* CUSTOM QUOTE */}

      <button
        type="button"
        className="
          block
          text-center
          w-full
          text-[11.5px]
          font-semibold
          text-blue
          hover:underline
          mt-3
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-blue
          focus-visible:ring-offset-2
          rounded
        "
      >
        Request Custom Business Quote
      </button>
    </section>
  );
}