"use client";

import { useEffect, useState } from "react";
import { productsApi } from "@/app/api/services";
import { mapProductSummaries } from "@/app/api/productmap";
import type { Product } from "@/app/data/products";
import { useCart } from "@/app/context/cartcontext";

export default function CartFrequentlyBoughtTogether() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // ==================================================
  // LIVE DATA — #41 productsApi.popular(4)
  // ==================================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(false);

      try {
        const response = await productsApi.popular(4);
        const mapped = mapProductSummaries(response.data);

        if (!cancelled) {
          setProducts(mapped);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setLoadError(true);
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

  // ==================================================
  // ADD TO CART (backend-synced via cart context)
  // ==================================================

  const handleAdd = (id: string) => {
    // Prevent multiple clicks
    if (addingId !== null) {
      return;
    }

    // Find the validated item
    const item = products.find((product) => product.id === id);

    // Validate item before adding
    if (!item) {
      console.error("Invalid cart item:", id);
      return;
    }

    try {
      // Set loading state
      setAddingId(id);

      addToCart(item, 1);

      // Reset loading state
      setAddingId(null);
    } catch (error) {
      console.error("Failed to add item to cart:", error);

      // Reset loading state
      setAddingId(null);
    }
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <section
      aria-labelledby="frequently-bought-together-title"
    >
      {/* ==================================================
          TITLE
      ================================================== */}

      <h2
        id="frequently-bought-together-title"
        className="font-sora font-bold text-[17px] text-ink mb-4"
      >
        Frequently Bought Together
      </h2>

      {loadError && products.length === 0 && !loading && (
        <div
          role="alert"
          className="
            mb-4
            rounded-lg
            border
            border-amber-300
            bg-amber-50
            px-4
            py-2.5
            text-[12px]
            text-amber-800
          "
        >
          Recommendations could not be loaded. Please try again
          later.
        </div>
      )}

      {/* ==================================================
          LOADING STATE
      ================================================== */}

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          aria-label="Loading recommended products"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[0, 1, 2, 3].map((skeleton) => (
            <div
              key={skeleton}
              className="bg-white border border-line rounded-card overflow-hidden"
            >
              <div className="h-[110px] bg-paper-deep animate-pulse" />
              <div className="p-3 flex flex-col gap-2">
                <div className="h-3 rounded bg-paper-deep animate-pulse w-full" />
                <div className="h-3 rounded bg-paper-deep animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* ==================================================
           EMPTY STATE
        ================================================== */

        <div
          role="status"
          className="py-6 text-center text-[11px] text-ink-soft"
        >
          No recommended products available.
        </div>
      ) : (
        /* ==================================================
           PRODUCT GRID
        ================================================== */

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {products.map((item) => {
            // --------------------------------------------------
            // NORMALIZE PRICE
            // --------------------------------------------------

            const numericPrice = Number(item.price);

            if (!Number.isFinite(numericPrice) || numericPrice < 0) {
              return null;
            }

            // --------------------------------------------------
            // CHECK ADDING STATE
            // --------------------------------------------------

            const isAdding = addingId === item.id;

            return (
              <article
                key={item.id}
                className="
                  bg-white
                  border border-line
                  rounded-card
                  overflow-hidden
                "
              >
                {/* ==================================================
                    PRODUCT IMAGE / SWATCH
                ================================================== */}

                {item.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.image}
                    alt={`${item.name} product preview`}
                    loading="lazy"
                    className="h-[110px] w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-[110px]"
                    style={{
                      background: `linear-gradient(
                        160deg,
                        ${item.swatch},
                        ${item.swatch}99
                      )`,
                    }}
                    role="img"
                    aria-label={`${item.name} product preview`}
                  />
                )}

                {/* ==================================================
                    PRODUCT CONTENT
                ================================================== */}

                <div className="p-3">
                  {/* Product Name */}

                  <div
                    className="
                      text-[12.5px]
                      font-semibold
                      text-ink
                      leading-snug
                      h-[36px]
                      line-clamp-2
                    "
                    title={item.name}
                  >
                    {item.name}
                  </div>

                  {/* ==================================================
                      PRICE + ADD BUTTON
                  ================================================== */}

                  <div className="flex items-center justify-between mt-2">
                    {/* Price */}

                    <span
                      className="
                        font-sora
                        font-bold
                        text-[14px]
                        text-ink
                      "
                    >
                      ₹
                      {numericPrice.toLocaleString("en-IN")}
                    </span>

                    {/* Add Button */}

                    <button
                      type="button"
                      onClick={() => handleAdd(item.id)}
                      disabled={addingId !== null || !item.inStock}
                      aria-label={`Add ${item.name} to cart`}
                      aria-busy={isAdding}
                      className="
                        border
                        border-line
                        hover:bg-paper
                        transition-colors
                        text-ink
                        text-[12px]
                        font-semibold
                        px-3
                        py-1.5
                        rounded-md
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                      "
                    >
                      {isAdding
                        ? "Adding..."
                        : !item.inStock
                          ? "Sold out"
                          : "Add"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
