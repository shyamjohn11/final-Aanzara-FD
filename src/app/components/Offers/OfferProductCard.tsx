"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Heart,
  Star,
  Check,
} from "lucide-react";

import type { OfferProduct } from "@/app/data/offers";

import {
  offerProductToCartProduct,
} from "@/app/data/offers";

import { useCart } from "@/app/context/cartcontext";

import { useWishlist } from "@/app/context/wishlistcontext";

import ShoppingListSavePopup from "@/app/components/ShoppingListSavePopup";

/* --------------------------------
 * Props
 * -------------------------------- */

interface OfferProductCardProps {
  product: OfferProduct;
}

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function isValidText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isValidOfferProduct(
  product: OfferProduct,
): boolean {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return false;
  }

  return (
    (typeof product.id === "string" ||
      typeof product.id === "number") &&

    String(product.id).trim().length > 0 &&

    isValidText(product.name) &&

    isValidText(product.brand) &&

    isValidText(product.pack) &&

    isValidText(product.badge) &&

    isValidText(product.swatch) &&

    isValidText(product.accent) &&

    isValidText(product.badgeColor) &&

    isValidNumber(product.rating) &&
    product.rating >= 0 &&
    product.rating <= 5 &&

    isValidNumber(product.reviews) &&
    product.reviews >= 0 &&

    isValidNumber(product.price) &&
    product.price >= 0 &&

    isValidNumber(product.mrp) &&
    product.mrp >= 0 &&

    isValidText(product.moq)
  );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function OfferProductCard({
  product,
}: OfferProductCardProps) {
  const [justAdded, setJustAdded] =
    useState<boolean>(false);

  const [cartError, setCartError] =
    useState<boolean>(false);

  const [
    showShoppingListPopup,
    setShowShoppingListPopup,
  ] = useState<boolean>(false);

  const { addToCart } = useCart();

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const router = useRouter();

  /* --------------------------------
   * Invalid Product Guard
   * -------------------------------- */

  if (!isValidOfferProduct(product)) {
    return (
      <div
        className="
          bg-white
          border
          border-dashed
          border-line
          rounded-card
          min-h-[220px]
          flex
          items-center
          justify-center
          text-center
          px-4
          text-[12px]
          text-ink-faint
        "
        role="alert"
      >
        Product information is
        unavailable.
      </div>
    );
  }

  /* --------------------------------
   * Safe Product Values
   * -------------------------------- */

  const productName =
    product.name.trim();

  const productId =
    String(product.id).trim();

  /* --------------------------------
   * Wishlist State
   * -------------------------------- */

  const saved =
    isInWishlist(productId);

  /* --------------------------------
   * Wishlist
   * -------------------------------- */

  const handleWishlist = (): void => {
    try {
      const wasSaved =
        isInWishlist(productId);

      /*
       * Convert the OfferProduct into
       * the standard Product structure
       * used by WishlistContext.
       */
      const wishlistProduct =
        offerProductToCartProduct(
          product,
        );

      if (!wishlistProduct) {
        throw new Error(
          "Unable to convert product for wishlist.",
        );
      }

      toggleWishlist(
        wishlistProduct,
      );

      /*
       * Show Shopping List popup only
       * when the product is newly added
       * to Wishlist.
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

  /* --------------------------------
   * Add To Cart
   * -------------------------------- */

  const handleAddToCart =
    useCallback((): void => {
      try {
        const cartProduct =
          offerProductToCartProduct(
            product,
          );

        if (!cartProduct) {
          throw new Error(
            "Unable to convert product.",
          );
        }

        addToCart(cartProduct);

        setJustAdded(true);
        setCartError(false);
      } catch (error) {
        console.error(
          "Failed to add offer product to cart:",
          error,
        );

        setJustAdded(false);
        setCartError(true);
      }
    }, [
      product,
      addToCart,
    ]);

  /* --------------------------------
   * Buy Now
   * -------------------------------- */

  const handleBuyNow =
    useCallback((): void => {
      try {
        const cartProduct =
          offerProductToCartProduct(
            product,
          );

        if (!cartProduct) {
          throw new Error(
            "Unable to convert product.",
          );
        }

        addToCart(cartProduct);

        router.push("/cart");
      } catch (error) {
        console.error(
          "Failed to buy product:",
          error,
        );

        setCartError(true);
      }
    }, [
      product,
      addToCart,
      router,
    ]);

  /* --------------------------------
   * Reset Added State
   * -------------------------------- */

  useEffect(() => {
    if (!justAdded) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setJustAdded(false);
      }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [justAdded]);

  /* --------------------------------
   * Render
   * -------------------------------- */

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
        data-product-id={productId}
      >
        {/* --------------------------------
         * Product Image / Swatch
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
              ${product.swatch}22,
              ${product.swatch}0D
            )`,
          }}
        >
          {/* Badge */}

          <span
            className="
              absolute
              top-2.5
              left-2.5
              text-white
              text-[10px]
              font-bold
              px-2
              py-1
              rounded-md
            "
            style={{
              backgroundColor:
                product.badgeColor,
            }}
          >
            {product.badge}
          </span>

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

          {/* Product Placeholder */}

          <div
            className="
              w-11
              h-16
              rounded-sm
              shadow-sm
            "
            aria-hidden="true"
            style={{
              background: `linear-gradient(
                160deg,
                ${product.swatch},
                ${product.accent}
              )`,
            }}
          />
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

          <span
            className="
              text-[10px]
              font-bold
              tracking-wide
              text-ink-soft
            "
          >
            {product.brand.trim()}
          </span>

          {/* Name */}

          <h3
            className="
              text-[12.5px]
              font-bold
              text-ink
              leading-snug
              mt-0.5
              line-clamp-2
              min-h-[32px]
            "
          >
            {productName}
          </h3>

          {/* Pack */}

          <p
            className="
              text-[10.5px]
              text-ink-faint
              mt-0.5
            "
          >
            {product.pack.trim()}
          </p>

          {/* Rating */}

          <div
            className="
              flex
              items-center
              gap-1
              mt-1.5
            "
            aria-label={`Rated ${product.rating} out of 5 from ${product.reviews} reviews`}
          >
            <Star
              size={11}
              className="fill-amber text-amber"
              aria-hidden="true"
            />

            <span
              className="
                text-[11px]
                font-semibold
                text-ink
              "
            >
              {product.rating.toFixed(1)}
            </span>

            <span
              className="
                text-[10.5px]
                text-ink-faint
              "
            >
              (
              {product.reviews.toLocaleString(
                "en-IN",
              )}
              )
            </span>
          </div>

          {/* Pricing */}

          <div
            className="
              flex
              items-baseline
              gap-1.5
              mt-1.5
            "
          >
            <span
              className="
                text-[15px]
                font-extrabold
                text-navy
              "
            >
              ₹
              {product.price.toLocaleString(
                "en-IN",
              )}
            </span>

            <span
              className="
                text-[11px]
                text-ink-faint
                line-through
              "
            >
              ₹
              {product.mrp.toLocaleString(
                "en-IN",
              )}
            </span>
          </div>

          {/* MOQ */}

          <div
            className="
              text-[10.5px]
              font-semibold
              text-green-deep
              mt-0.5
            "
          >
            Wholesale Bulk:{" "}
            {product.moq}
          </div>

          {/* --------------------------------
           * Actions
           * -------------------------------- */}

          <div
            className="
              flex
              items-center
              gap-2
              mt-3
              mt-auto
            "
          >
            {/* Add To Cart */}

            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={
                justAdded
                  ? `${productName} added to cart`
                  : `Add ${productName} to cart`
              }
              className={`
                flex-1
                flex
                items-center
                justify-center
                gap-1.5
                border
                text-[11px]
                font-bold
                py-2
                rounded-lg
                transition-colors
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-green
                focus-visible:ring-offset-2
                ${
                  justAdded
                    ? "border-green bg-green/10 text-green-deep"
                    : "border-line text-ink hover:border-navy hover:text-navy"
                }
              `}
            >
              {justAdded ? (
                <>
                  <Check
                    size={12}
                    aria-hidden="true"
                  />
                  Added
                </>
              ) : (
                "Add to Cart"
              )}
            </button>

            {/* Buy Now */}

            <button
              type="button"
              onClick={handleBuyNow}
              aria-label={`Buy ${productName} now`}
              className="
                flex-1
                bg-navy
                hover:bg-navy-deep
                transition-colors
                text-white
                text-[11px]
                font-bold
                py-2
                rounded-lg
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-navy
                focus-visible:ring-offset-2
              "
            >
              Buy Now
            </button>
          </div>

          {/* Cart Error */}

          {cartError && (
            <p
              className="
                text-[10.5px]
                text-red-500
                mt-2
              "
              role="alert"
            >
              Unable to add this product
              to your cart. Please try again.
            </p>
          )}
        </div>
      </article>

      {/* --------------------------------
       * Shopping List Popup
       * -------------------------------- */}

      {showShoppingListPopup && (
        <ShoppingListSavePopup
          productId={productId}
          productName={productName}
          product={offerProductToCartProduct(product)}
          onClose={() =>
            setShowShoppingListPopup(false)
          }
        />
      )}
    </>
  );
}