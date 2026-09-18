"use client";

import { useState } from "react";
import { Heart, Check } from "lucide-react";

import type { NewArrivalProduct } from "@/app/data/newArrivals";
import type { Product } from "@/app/data/products";
import { useCart } from "@/app/context/cartcontext";
import { useWishlist } from "@/app/context/wishlistcontext";
import ShoppingListSavePopup from "@/app/components/ShoppingListSavePopup";

// Accepts full NewArrivalProduct rows as well as plain Product summaries
// produced by mapProductSummary (which lack moqUnit/tabCategory/filterCategory).
export type NewArrivalCardProduct = NewArrivalProduct | Product;

interface NewArrivalProductCardProps {
  product: NewArrivalCardProduct;
}

/* --------------------------------
 * Safe text
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
 * Safe number
 * -------------------------------- */
function getSafeNumber(
  value: unknown,
  fallback: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return value;
}

/* --------------------------------
 * Safe color
 * -------------------------------- */
function getSafeColor(
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
 * Product validation
 * -------------------------------- */
function isValidProduct(
  value: unknown,
): value is NewArrivalCardProduct {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const product = value as Record<string, unknown>;

  const hasMoqUnit =
    product.moqUnit === undefined ||
    (typeof product.moqUnit === "string" &&
      (product.moqUnit as string).trim().length > 0);

  return (
    typeof product.id === "string" &&
    product.id.trim().length > 0 &&

    typeof product.name === "string" &&
    product.name.trim().length > 0 &&

    typeof product.mrp === "number" &&
    Number.isFinite(product.mrp) &&
    product.mrp >= 0 &&

    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    product.price >= 0 &&

    typeof product.moq === "number" &&
    Number.isFinite(product.moq) &&
    product.moq > 0 &&

    hasMoqUnit &&

    typeof product.swatch === "string" &&
    product.swatch.trim().length > 0 &&

    typeof product.accent === "string" &&
    product.accent.trim().length > 0
  );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */
export default function NewArrivalProductCard({
  product,
}: NewArrivalProductCardProps) {
  const [added, setAdded] =
    useState<boolean>(false);

  const [showShoppingListPopup, setShowShoppingListPopup] =
    useState<boolean>(false);

  const { addToCart } = useCart();

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const saved = isInWishlist(product.id);

  /* --------------------------------
   * Invalid product protection
   * -------------------------------- */
  if (!isValidProduct(product)) {
    return (
      <div
        className="
          bg-white
          border
          border-line
          rounded-card
          min-h-[260px]
          flex
          items-center
          justify-center
          px-5
          text-center
          text-[12px]
          text-ink-faint
        "
        role="status"
        aria-live="polite"
      >
        Product information is unavailable.
      </div>
    );
  }

  /* --------------------------------
   * Safe values
   * -------------------------------- */
  const productName = getSafeText(
    product.name,
    "Product",
  );

  const brandName = getSafeText(
    product.brand,
    "",
  );

  const mrp = getSafeNumber(
    product.mrp,
    0,
  );

  const price = getSafeNumber(
    product.price,
    0,
  );

  const discount = getSafeNumber(
    product.discount,
    0,
  );

  const inStock =
    typeof product.inStock === "boolean"
      ? product.inStock
      : true;

  const moq = getSafeNumber(
    product.moq,
    1,
  );

  const moqUnit = getSafeText(
    "moqUnit" in product ? product.moqUnit : undefined,
    "unit",
  );

  const swatch = getSafeColor(
    product.swatch,
    "#E5E7EB",
  );

  const accent = getSafeColor(
    product.accent,
    "#CBD5E1",
  );

  /* --------------------------------
   * Add to Cart
   * -------------------------------- */
  const handleAddToCart = (): void => {
    if (added) {
      return;
    }

    if (!inStock) {
      return;
    }

    if (moq <= 0) {
      return;
    }

    try {
      addToCart(product, moq);

      setAdded(true);

      window.setTimeout(() => {
        setAdded(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Failed to add product to cart:",
        error,
      );

      setAdded(false);
    }
  };

  /* --------------------------------
   * Wishlist
   * -------------------------------- */
  const handleWishlist = (): void => {
    try {
      const wasSaved =
        isInWishlist(product.id);

      toggleWishlist(product);

      /*
       * Show Shopping List popup only
       * when the product is newly added
       * to the Wishlist.
       */
      if (!wasSaved) {
        setShowShoppingListPopup(true);
      }
    } catch (error) {
      console.error(
        "Failed to update wishlist:",
        error,
      );
    }
  };

  return (
    <>
      <article
        className="
          bg-white
          border
          border-line
          rounded-card
          overflow-hidden
          flex
          flex-col
          hover:shadow-pop
          transition-shadow
        "
      >
        {/* --------------------------------
         * Product Visual
         * -------------------------------- */}
        <div
          className="
            relative
            h-[130px]
            flex
            items-center
            justify-center
          "
          style={{
            background: `linear-gradient(
              160deg,
              ${swatch}22,
              ${swatch}0D
            )`,
          }}
        >
          {/* Product Image (streaming API URL) or gradient fallback
              Rendered FIRST so it sits at the base of the stack;
              badges/wishlist button (below) use z-10 to stay on top
              regardless of DOM order. */}
          {product.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.image}
              alt={productName}
              loading="lazy"
              className="
                relative
                z-0
                max-h-full
                max-w-[85%]
                object-contain
                drop-shadow-sm
              "
            />
          ) : (
            <div
              className="
                relative
                z-0
                w-11
                h-16
                rounded-sm
                shadow-sm
              "
              style={{
                background: `linear-gradient(
                  160deg,
                  ${swatch},
                  ${accent}
                )`,
              }}
              aria-hidden="true"
            />
          )}

          {/* Badges */}
          <span
            className="
              absolute
              z-10
              top-2.5
              left-2.5
              bg-green
              text-white
              text-[10px]
              font-bold
              px-2
              py-1
              rounded-md
            "
          >
            New
          </span>

          {discount > 0 && (
            <span
              className="
                absolute
                z-10
                top-11
                left-2.5
                bg-[#dc2626]
                text-white
                text-[10px]
                font-bold
                px-2
                py-1
                rounded-md
              "
            >
              {discount}% OFF
            </span>
          )}

          {/* Wishlist */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={
              saved
                ? `Remove ${productName} from wishlist`
                : `Add ${productName} to wishlist`
            }
            aria-pressed={saved}
            className="
              absolute
              z-10
              top-2.5
              right-2.5
              w-7
              h-7
              rounded-full
              bg-white
              shadow
              flex
              items-center
              justify-center
              cursor-pointer
              transition-transform
              hover:scale-105
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue
              focus-visible:ring-offset-2
            "
          >
            <Heart
              size={13}
              aria-hidden="true"
              className={
                saved
                  ? "fill-red-500 text-red-500"
                  : "text-ink-faint"
              }
            />
          </button>
        </div>

        {/* --------------------------------
         * Product Details
         * -------------------------------- */}
        <div
          className="
            p-3.5
            flex
            flex-col
            flex-1
          "
        >
          {/* Brand */}
          {brandName && (
            <span
              className="
                text-[10px]
                font-bold
                text-ink-faint
                uppercase
                tracking-wide
                truncate
                mt-1
              "
            >
              {brandName}
            </span>
          )}

          {/* Product Name */}
          <h3
            className="
              text-[12.5px]
              font-bold
              text-ink
              leading-snug
              line-clamp-2
              min-h-[32px]
            "
          >
            {productName}
          </h3>

          {/* MRP */}
          <div
            className="
              text-[11px]
              text-ink-faint
              line-through
              mt-1.5
            "
          >
            MRP ₹{mrp}
          </div>

          {/* Wholesale Price */}
          <div
            className="
              text-[14px]
              font-extrabold
              text-navy
            "
          >
            Wholesale Price ₹{price}
          </div>

          {/* MOQ */}
          <div
            className="
              text-[10.5px]
              text-ink-soft
              mt-0.5
            "
          >
            MOQ: {moq} {moqUnit}
          </div>

          {/* --------------------------------
           * Cart Button
           * -------------------------------- */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={added || !inStock}
            aria-label={
              added
                ? `${productName} added to cart`
                : inStock
                  ? `Add ${productName} to cart`
                  : `${productName} is out of stock`
            }
            className={`
              flex
              items-center
              justify-center
              gap-1.5
              text-white
              text-[11.5px]
              font-bold
              py-2.5
              rounded-lg
              mt-3
              transition-colors
              cursor-pointer
              disabled:cursor-default
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-green
              focus-visible:ring-offset-2
              ${
                !inStock
                  ? "bg-ink-faint"
                  : added
                    ? "bg-navy"
                    : "bg-green hover:bg-green-deep"
              }
            `}
          >
            {added ? (
              <>
                <Check
                  size={13}
                  aria-hidden="true"
                />
                Added
              </>
            ) : inStock ? (
              "Add to Cart"
            ) : (
              "Out of Stock"
            )}
          </button>
        </div>
      </article>

      {/* --------------------------------
       * Shopping List Popup
       * -------------------------------- */}
      {showShoppingListPopup && (
        <ShoppingListSavePopup
          productId={product.id}
          productName={productName}
          onClose={() =>
            setShowShoppingListPopup(false)
          }
        />
      )}
    </>
  );
}