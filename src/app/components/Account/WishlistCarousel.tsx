// File: app/components/Account/WishlistCarousel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";

import { wishlistApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type WishlistItem = {
  name: string;
  pack: string;
  price: string | number;
};

/* =========================================================
   CONSTANTS
========================================================= */

const SCROLL_AMOUNT = 220;

const FALLBACK_TEXT = "Not available";

const MAX_NAME_LENGTH = 150;
const MAX_PACK_LENGTH = 100;
const MAX_PRICE_LENGTH = 50;

/* =========================================================
   VALIDATION HELPERS
========================================================= */

/**
 * Safely convert a value to displayable text.
 */
function safeText(
  value: unknown,
  fallback = FALLBACK_TEXT
): string {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return fallback;
  }

  const text = String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

/**
 * Validate a wishlist item.
 */
function isValidWishlistItem(
  item: unknown
): item is WishlistItem {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return false;
  }

  const data =
    item as Partial<WishlistItem>;

  const name = safeText(
    data.name,
    ""
  );

  const pack = safeText(
    data.pack,
    ""
  );

  const price = safeText(
    data.price,
    ""
  );

  if (!name) {
    return false;
  }

  if (!pack) {
    return false;
  }

  if (!price) {
    return false;
  }

  if (
    name.length >
    MAX_NAME_LENGTH
  ) {
    return false;
  }

  if (
    pack.length >
    MAX_PACK_LENGTH
  ) {
    return false;
  }

  if (
    price.length >
    MAX_PRICE_LENGTH
  ) {
    return false;
  }

  return true;
}

/**
 * Validate and clean wishlist items.
 *
 * Duplicate product names are removed.
 */
function getValidWishlistItems(
  items: unknown
): WishlistItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const seenNames =
    new Set<string>();

  const validItems: WishlistItem[] =
    [];

  for (const item of items) {
    if (
      !isValidWishlistItem(item)
    ) {
      continue;
    }

    const name = safeText(
      item.name
    );

    const normalizedName =
      name.toLowerCase();

    if (
      seenNames.has(
        normalizedName
      )
    ) {
      continue;
    }

    seenNames.add(
      normalizedName
    );

    validItems.push({
      name,
      pack: safeText(
        item.pack
      ),
      price: item.price,
    });
  }

  return validItems;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function WishlistCarousel() {
  /* =======================================================
     SCROLL REF
  ======================================================= */

  const scrollRef =
    useRef<HTMLDivElement>(null);

  const [raw, setRaw] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await wishlistApi.get();
        const payload: unknown = (res as { data?: unknown })?.data ?? res;
        const list: Record<string, unknown>[] = (
          Array.isArray(payload) ? payload : []
        ) as Record<string, unknown>[];
        if (cancelled) return;
        const mapped: WishlistItem[] = list.map((w) => ({
          name: String(w["productName"] ?? "Product"),
          pack: String(w["sku"] ?? ""),
          price: `₹${Number(w["price"] ?? 0).toLocaleString("en-IN")}`,
        }));
        setRaw(mapped);
      } catch {
        if (!cancelled) setError("Unable to load wishlist.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const wishlistItems = getValidWishlistItems(raw);

  /* =======================================================
     SCROLL HANDLER
  ======================================================= */

  const scrollBy = (
    direction: 1 | -1
  ) => {
    const container =
      scrollRef.current;

    if (!container) {
      return;
    }

    const amount =
      direction *
      SCROLL_AMOUNT;

    try {
      container.scrollBy({
        left: amount,
        behavior: "smooth",
      });
    } catch {
      /*
       * Fallback for browsers/environments
       * where smooth scrolling is unavailable.
       */
      container.scrollLeft +=
        amount;
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      aria-labelledby="wishlist-title"
      className="rounded-card border border-slate-200 bg-white p-5"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="wishlist-title"
          className="text-[14.5px] font-semibold text-navy"
        >
          Saved Items &amp; Wishlist
        </h2>

        {/* =================================================
            SCROLL CONTROLS
        ================================================= */}

        <div className="flex gap-1.5">
          {/* LEFT */}

          <button
            type="button"
            aria-label="Scroll wishlist left"
            onClick={() =>
              scrollBy(-1)
            }
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue/20"
          >
            <ChevronLeft
              size={15}
              aria-hidden="true"
            />
          </button>

          {/* RIGHT */}

          <button
            type="button"
            aria-label="Scroll wishlist right"
            onClick={() =>
              scrollBy(1)
            }
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue/20"
          >
            <ChevronRight
              size={15}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {loading && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            Loading wishlist…
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && wishlistItems.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            Your wishlist is empty.
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Saved products will appear
            here.
          </p>
        </div>
      )}

      {/* =================================================
          WISHLIST CAROUSEL
      ================================================= */}

      {!loading && !error && wishlistItems.length > 0 && (
        <div
          ref={scrollRef}
          className="scrollbar-none mt-4 flex gap-4 overflow-x-auto scroll-smooth"
          role="region"
          aria-label="Saved wishlist products"
          tabIndex={0}
        >
          {wishlistItems.map(
            (item) => (
              <article
                key={item.name}
                className="w-[180px] shrink-0 rounded-lg border border-slate-100 p-3"
              >
                {/* =====================================
                    PRODUCT IMAGE PLACEHOLDER
                ===================================== */}

                <div
                  className="mb-3 flex h-24 items-center justify-center rounded-md bg-slate-50 text-[11px] text-slate-300"
                  aria-label={`Product image placeholder for ${item.name}`}
                >
                  Product image
                </div>

                {/* =====================================
                    PRODUCT NAME
                ===================================== */}

                <p className="break-words text-[12.5px] font-semibold leading-snug text-navy">
                  {safeText(
                    item.name
                  )}
                </p>

                {/* =====================================
                    PACK
                ===================================== */}

                <p className="break-words text-[11px] text-ink-soft">
                  {safeText(
                    item.pack
                  )}
                </p>

                {/* =====================================
                    PRICE
                ===================================== */}

                <p className="mt-1 break-words text-[13px] font-bold text-navy">
                  {safeText(
                    item.price
                  )}
                </p>

                {/* =====================================
                    ADD TO CART
                ===================================== */}

                <button
                  type="button"
                  aria-label={`Add ${item.name} to cart`}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-navy py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <ShoppingCart
                    size={13}
                    aria-hidden="true"
                  />

                  <span>
                    Add to Cart
                  </span>
                </button>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}