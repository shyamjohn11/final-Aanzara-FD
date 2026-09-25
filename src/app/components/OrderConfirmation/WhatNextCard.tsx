"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/* =========================
   CONSTANTS
========================= */

const HOME_ROUTE = "/";
const LAST_ORDER_KEY = "lastOrder";

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* =========================
   HELPERS
========================= */

// The checkout step saves the placed order to localStorage;
// reuse it so tracking opens the live-tracking page for
// THIS order. Falls back to null when absent/invalid.
function readLastOrderId(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const id =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? String(
            (parsed as Record<string, unknown>).orderId ?? ""
          ).trim()
        : "";
    return GUID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

/* =========================
   COMPONENT
========================= */

export default function WhatNextCard() {
  const router = useRouter();

  const handleTrackOrder = () => {
    const orderId = readLastOrderId();
    router.push(
      orderId ? `/orders/${orderId}/tracking` : "/account/orders"
    );
  };

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
        {/* TRACK ORDER — live-tracking page for this order,
            order list as fallback. */}

        <button
          type="button"
          onClick={handleTrackOrder}
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