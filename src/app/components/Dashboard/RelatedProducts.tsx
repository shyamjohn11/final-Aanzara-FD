// File: app/components/Dashboard/RelatedProducts.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { productsApi } from "@/app/api/services";
import {
  mapProductSummary,
  extractProductArray,
} from "@/app/api/productmap";
import CompactProductCard from "./CompactProductCard";

type RelatedItem = {
  name: string;
  price: number;
  swatch: string;
};

export default function RelatedProducts() {
  const scrollRef =
    useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        let payload: unknown = [];
        try {
          const response = await productsApi.popular(8);
          payload = response.data;
        } catch {
          const fallback = await productsApi.list({
            page: 1,
            pageSize: 8,
          });
          payload = fallback.data;
        }

        const mapped = extractProductArray(payload)
          .map(mapProductSummary)
          .filter(
            (product): product is NonNullable<typeof product> =>
              product !== null
          )
          .map((product) => ({
            name: product.name,
            price: product.price,
            swatch: product.swatch || "#E5E7EB",
          }));

        if (!cancelled) {
          setItems(mapped);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load related products.");
          setItems([]);
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

  const hasProducts =
    Array.isArray(items) &&
    items.length > 0;

  const scrollByAmount = (
    direction: "left" | "right"
  ) => {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    const amount =
      direction === "left" ? -320 : 320;

    container.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  };

  return (
    <section
      aria-labelledby="related-products-heading"
      className="w-full"
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between gap-3 mb-4">
        <h2
          id="related-products-heading"
          className="
            font-sora
            font-bold
            text-[16px]
            text-navy
          "
        >
          Related Wholesale Cooking Oils
        </h2>

        {hasProducts && (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {/* Previous */}
            <button
              type="button"
              onClick={() =>
                scrollByAmount("left")
              }
              aria-label="Previous related products"
              className="
                w-8
                h-8
                rounded-lg
                border
                border-line
                bg-white
                flex
                items-center
                justify-center
                text-ink-soft
                hover:border-blue
                hover:text-blue
                transition-colors
              "
            >
              <ChevronLeft
                size={15}
                aria-hidden="true"
              />
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={() =>
                scrollByAmount("right")
              }
              aria-label="Next related products"
              className="
                w-8
                h-8
                rounded-lg
                border
                border-line
                bg-white
                flex
                items-center
                justify-center
                text-ink-soft
                hover:border-blue
                hover:text-blue
                transition-colors
              "
            >
              <ChevronRight
                size={15}
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      {loading ? (
        <div
          role="status"
          className="
            bg-white
            border
            border-line
            rounded-card
            p-4
            text-[12px]
            text-ink-soft
          "
        >
          Loading related products…
        </div>
      ) : error ? (
        <div
          role="alert"
          className="
            bg-white
            border
            border-line
            rounded-card
            p-4
            text-[12px]
            text-ink-soft
          "
        >
          {error}
        </div>
      ) : hasProducts ? (
        <div
          ref={scrollRef}
          className="
            flex
            gap-4
            overflow-x-auto
            scrollbar-none
            pb-1
            scroll-smooth
          "
          aria-label="Related wholesale products"
        >
          {items.map(
            (product, index) => {
              if (!product) {
                return null;
              }

              const productName =
                typeof product.name ===
                "string"
                  ? product.name.trim()
                  : "";

              if (!productName) {
                return null;
              }

              const productPrice =
                typeof product.price ===
                  "number" &&
                Number.isFinite(
                  product.price
                )
                  ? product.price
                  : 0;

              const productSwatch =
                typeof product.swatch ===
                  "string" &&
                product.swatch.trim()
                  ? product.swatch
                  : "#E5E7EB";

              return (
                <div
                  key={`${productName}-${index}`}
                  className="
                    shrink-0
                    w-[calc(50%-8px)]
                    sm:w-[calc(33.333%-11px)]
                    lg:w-[calc(20%-13px)]
                  "
                >
                  <CompactProductCard
                    name={productName}
                    price={productPrice}
                    swatch={
                      productSwatch
                    }
                  />
                </div>
              );
            }
          )}
        </div>
      ) : (
        <div
          role="status"
          className="
            bg-white
            border
            border-line
            rounded-card
            p-4
            text-[12px]
            text-ink-soft
          "
        >
          No related products available.
        </div>
      )}
    </section>
  );
}