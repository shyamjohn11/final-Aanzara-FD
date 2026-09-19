// File: app/components/Dashboard/FrequentlyBoughtTogether.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { productsApi } from "@/app/api/services";
import {
  mapProductSummary,
  extractProductArray,
} from "@/app/api/productmap";

/* ============================================================
   TYPES
============================================================ */

type FrequentlyBoughtItem = {
  name: string;
  price: number;
  swatch: string;
  image?: string;
};

/* ============================================================
   VALIDATION HELPERS
============================================================ */

function isValidText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function getSafePrice(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return value;
}

function getSafeSwatch(value: unknown): string {
  if (!isValidText(value)) {
    return "#E5E7EB";
  }

  const swatch = value.trim();

  const isHex =
    /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(
      swatch
    );

  const isRgb =
    /^rgba?\(\s*[\d.\s%,]+\)$/.test(swatch);

  const isHsl =
    /^hsla?\(\s*[\d.\s%,deg]+\)$/.test(swatch);

  const isNamedColor =
    /^[A-Za-z]+$/.test(swatch);

  if (
    !isHex &&
    !isRgb &&
    !isHsl &&
    !isNamedColor
  ) {
    return "#E5E7EB";
  }

  return swatch;
}

function normalizeItem(
  item: unknown
): FrequentlyBoughtItem | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const value =
    item as Partial<FrequentlyBoughtItem>;

  if (!isValidText(value.name)) {
    return null;
  }

  return {
    name: value.name.trim(),
    price: getSafePrice(value.price),
    swatch: getSafeSwatch(value.swatch),
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function FrequentlyBoughtTogether() {
  const [rawItems, setRawItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await productsApi.popular(6);
        const arr = extractProductArray(response.data);
        const mapped = arr
          .map(mapProductSummary)
          .filter(
            (product): product is NonNullable<typeof product> =>
              product !== null
          )
          .map((product) => ({
            name: product.name,
            price: product.price,
            swatch: product.swatch || "#E5E7EB",
            image: product.image,
          }));

        if (!cancelled) {
          setRawItems(mapped);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load recommendations.");
          setRawItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     FULL DATA VALIDATION
  ========================================================== */

  const validItems: FrequentlyBoughtItem[] =
    Array.isArray(rawItems)
      ? rawItems
          .map(normalizeItem)
          .filter(
            (
              item
            ): item is FrequentlyBoughtItem =>
              item !== null
          )
      : [];

  const safeBundlePrice = validItems.reduce(
    (sum, item) => sum + item.price,
    0
  );

  const itemCount = validItems.length;

  /* ==========================================================
     ADD ALL HANDLER
  ========================================================== */

  const handleAddAll = () => {
    if (validItems.length === 0) {
      console.error(
        "Cannot add bundle: no valid products found."
      );
      return;
    }

    /*
     * Connect your actual cart logic here.
     *
     * Example:
     * validItems.forEach((item) => {
     *   addToCart(item);
     * });
     */

    console.log(
      "Adding bundle to cart:",
      validItems
    );
  };

  /* ==========================================================
     EMPTY / LOADING / ERROR STATES
  ========================================================== */

  if (loading) {
    return (
      <section
        aria-labelledby="frequently-bought-title"
        className="
          bg-white
          border
          border-line
          rounded-card
          p-5
        "
      >
        <h2
          id="frequently-bought-title"
          className="
            font-sora
            font-bold
            text-[15.5px]
            text-ink
            mb-4
          "
        >
          Frequently Bought Together
        </h2>

        <div
          role="status"
          className="
            rounded-lg
            border
            border-line
            bg-paper
            px-4
            py-5
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          Loading recommendations…
        </div>
      </section>
    );
  }

  if (error && validItems.length === 0) {
    return (
      <section
        aria-labelledby="frequently-bought-title"
        className="
          bg-white
          border
          border-line
          rounded-card
          p-5
        "
      >
        <h2
          id="frequently-bought-title"
          className="
            font-sora
            font-bold
            text-[15.5px]
            text-ink
            mb-4
          "
        >
          Frequently Bought Together
        </h2>

        <div
          role="alert"
          className="
            rounded-lg
            border
            border-line
            bg-paper
            px-4
            py-5
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          {error}
        </div>
      </section>
    );
  }

  if (validItems.length === 0) {
    return (
      <section
        aria-labelledby="frequently-bought-title"
        className="
          bg-white
          border
          border-line
          rounded-card
          p-5
        "
      >
        <h2
          id="frequently-bought-title"
          className="
            font-sora
            font-bold
            text-[15.5px]
            text-ink
            mb-4
          "
        >
          Frequently Bought Together
        </h2>

        <div
          role="status"
          className="
            rounded-lg
            border
            border-line
            bg-paper
            px-4
            py-5
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          No recommended products available.
        </div>
      </section>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section
      aria-labelledby="frequently-bought-title"
      className="
        bg-white
        border
        border-line
        rounded-card
        p-5
      "
    >
      {/* ======================================================
          TITLE
      ====================================================== */}

      <h2
        id="frequently-bought-title"
        className="
          font-sora
          font-bold
          text-[15.5px]
          text-ink
          mb-4
        "
      >
        Frequently Bought Together
      </h2>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:gap-3
        "
      >
        {/* ====================================================
            PRODUCTS
        ==================================================== */}

        <div
          className="
            flex
            flex-1
            items-center
            gap-3
            flex-wrap
            sm:flex-nowrap
          "
        >
          {validItems.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="
                flex
                items-center
                gap-3
                min-w-0
              "
            >
              {/* PRODUCT IMAGE */}

              <div className="flex items-center gap-2.5 min-w-0">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-11 w-11 rounded-lg object-cover border border-line shrink-0"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="w-11 h-11 rounded-lg shrink-0"
                    style={{
                      background: `linear-gradient(160deg, ${item.swatch}, ${item.swatch}CC)`,
                    }}
                  />
                )}

                <div className="min-w-0">
                  <div
                    title={item.name}
                    className="
                      text-[11.5px]
                      font-semibold
                      text-ink
                      leading-snug
                      max-w-[130px]
                      truncate
                    "
                  >
                    {item.name}
                  </div>

                  <div
                    className="
                      text-[12px]
                      font-bold
                      text-blue
                    "
                  >
                    ₹
                    {item.price.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits: 2,
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* PLUS */}

              {i <
                validItems.length - 1 && (
                <Plus
                  size={14}
                  aria-hidden="true"
                  className="
                    text-ink-faint
                    shrink-0
                  "
                />
              )}
            </div>
          ))}
        </div>

        {/* ====================================================
            BUNDLE SUMMARY
        ==================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-2
            border-t
            border-line
            pt-3
            sm:flex-col
            sm:items-end
            sm:gap-1
            sm:border-t-0
            sm:border-l
            sm:pt-0
            sm:pl-5
          "
        >
          <div className="text-right">
            <div
              className="
                text-[10.5px]
                text-ink-faint
              "
            >
              Bundle Total Price
            </div>

            <div
              className="
                font-sora
                font-bold
                text-[18px]
                text-ink
              "
            >
              ₹
              {safeBundlePrice.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </div>
          </div>

          {/* ==================================================
              ADD ALL BUTTON
          ================================================== */}

          <button
            type="button"
            onClick={handleAddAll}
            disabled={itemCount === 0}
            aria-label={`Add all ${itemCount} recommended items to cart`}
            className="
              bg-green
              hover:bg-green-deep
              transition-colors
              text-white
              text-[12px]
              font-bold
              px-4
              py-2.5
              rounded-lg
              whitespace-nowrap
              disabled:opacity-50
              disabled:cursor-not-allowed
              focus:outline-none
              focus:ring-2
              focus:ring-green/30
              focus:ring-offset-2
            "
          >
            Add All {itemCount}{" "}
            {itemCount === 1
              ? "Item"
              : "Items"}{" "}
            to Cart
          </button>
        </div>
      </div>
    </section>
  );
}