"use client";

import { useEffect, useState } from "react";
import { productsApi } from "@/app/api/services";
import {
  mapProductSummary,
  extractProductArray,
} from "@/app/api/productmap";

type RecentlyViewedItem = {
  name: string;
  price: number;
  swatch: string;
};

export default function RecentlyViewedProducts() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await productsApi.list({
          page: 1,
          pageSize: 6,
        });
        const mapped = extractProductArray(response.data)
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
          setError("Unable to load recently viewed products.");
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

  return (
    <section aria-labelledby="recently-viewed-products-heading">
      <h2
        id="recently-viewed-products-heading"
        className="font-sora font-bold text-[16px] text-navy mb-4"
      >
        Recently Viewed Products
      </h2>

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
          Loading recently viewed products…
        </div>
      ) : error && items.length === 0 ? (
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
      ) : Array.isArray(items) && items.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
          {items.map((item, index) => {
            if (!item || !item.name) {
              return null;
            }

            const productName = item.name.trim();

            if (!productName) {
              return null;
            }

            const hasPrice =
              typeof item.price === "number" &&
              Number.isFinite(item.price);

            const hasSwatch =
              typeof item.swatch === "string" &&
              item.swatch.trim().length > 0;

            return (
              <div
                key={`${productName}-${index}`}
                className="
                  flex
                  items-center
                  gap-2.5
                  bg-white
                  border
                  border-line
                  rounded-card
                  p-2.5
                  min-w-[190px]
                  shrink-0
                  hover:border-blue
                  hover:shadow-card
                  transition-all
                "
              >
                {/* Product Visual */}
                <div
                  aria-hidden="true"
                  className="w-10 h-10 rounded-lg shrink-0"
                  style={{
                    background: hasSwatch
                      ? `linear-gradient(160deg, ${item.swatch}, ${item.swatch}CC)`
                      : "linear-gradient(160deg, #E5E7EB, #F3F4F6)",
                  }}
                />

                {/* Product Details */}
                <div className="min-w-0 flex-1">
                  <div
                    title={productName}
                    className="
                      text-[11.5px]
                      font-semibold
                      text-ink
                      truncate
                    "
                  >
                    {productName}
                  </div>

                  {hasPrice ? (
                    <div className="text-[11.5px] font-bold text-blue">
                      ₹{item.price.toLocaleString("en-IN")}
                    </div>
                  ) : (
                    <div className="text-[10.5px] font-medium text-ink-faint">
                      Price unavailable
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
          No recently viewed products.
        </div>
      )}
    </section>
  );
}
