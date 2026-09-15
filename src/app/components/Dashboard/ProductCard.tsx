// File: app/components/Dashboard/ProductCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Star,
  Minus,
  Plus,
  Circle,
  Check,
  AlertCircle,
} from "lucide-react";

import type { Product } from "@/app/data/products";
import { useCart } from "@/app/context/cartcontext";
import { useWishlist } from "@/app/context/wishlistcontext";
import ShoppingListSavePopup from "@/app/components/ShoppingListSavePopup";

type ProductCardProps = {
  product: Product;
};

/* ============================================================
   VALIDATION HELPERS
============================================================ */

const isFiniteNonNegativeNumber = (value: unknown): boolean => {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;

  return Number.isFinite(numericValue) && numericValue >= 0;
};

const toSafeNumber = (value: unknown, fallback = 0): number => {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;

  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const isValidProduct = (product: Product): boolean => {
  if (!product || typeof product !== "object") {
    return false;
  }

  if (
    typeof product.id !== "string" ||
    !product.id.trim()
  ) {
    return false;
  }

  if (
    typeof product.name !== "string" ||
    !product.name.trim()
  ) {
    return false;
  }

  if (!isFiniteNonNegativeNumber(product.mrp)) {
    return false;
  }

  if (!isFiniteNonNegativeNumber(product.price)) {
    return false;
  }

  return true;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function ProductCard({
  product,
}: ProductCardProps) {
  /*
   * Never allow malformed product data to break the complete
   * product listing page.
   */
  if (!isValidProduct(product)) {
    return (
      <div
        role="alert"
        className="
          bg-white
          border
          border-red-200
          rounded-card
          p-5
          flex
          flex-col
          items-center
          justify-center
          min-h-[250px]
          text-center
        "
      >
        <AlertCircle
          size={22}
          className="text-red-500 mb-2"
        />

        <p className="text-[12px] font-semibold text-red-600">
          Product information is unavailable.
        </p>
      </div>
    );
  }

  return <ValidatedProductCard product={product} />;
}

/* ============================================================
   VALIDATED PRODUCT CARD
============================================================ */

function ValidatedProductCard({
  product,
}: {
  product: Product;
}) {
  const initialMoq = Math.max(
    1,
    Math.floor(toSafeNumber(product.moq, 1))
  );

  const [qty, setQty] = useState(initialMoq);
  const [added, setAdded] = useState(false);
  const [quantityError, setQuantityError] =
    useState("");

  const { addToCart } = useCart();

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const saved = isInWishlist(product.id);
  const [showShoppingListPopup, setShowShoppingListPopup] =
    useState(false);
  /* ==========================================================
     SAFE NUMERIC VALUES
  ========================================================== */

  const numericPrice = toSafeNumber(product.price);
  const numericMrp = toSafeNumber(product.mrp);
  const numericBulkRate = toSafeNumber(product.bulkRate);
  const numericDiscount = toSafeNumber(product.discount);
  const numericRating = toSafeNumber(product.rating);
  const numericReviews = toSafeNumber(product.reviews);
  const numericMoq = Math.max(
    1,
    Math.floor(toSafeNumber(product.moq, 1))
  );
  const numericBulkMoq = Math.max(
    1,
    Math.floor(toSafeNumber(product.bulkMoq, 1))
  );
  
  // Determine if product is in stock (default to true if not specified)
  const isInStock = product.inStock !== undefined ? product.inStock : true;

  /* ==========================================================
     QUANTITY VALIDATION
  ========================================================== */

  const validateQuantity = (value: number): boolean => {
    if (!Number.isFinite(value)) {
      setQuantityError("Invalid quantity.");
      return false;
    }

    if (!Number.isInteger(value)) {
      setQuantityError("Quantity must be a whole number.");
      return false;
    }

    if (value < numericMoq) {
      setQuantityError(
        `Minimum order quantity is ${numericMoq} cases.`
      );
      return false;
    }

    if (value > 9999) {
      setQuantityError(
        "Maximum quantity is 9999 cases."
      );
      return false;
    }

    setQuantityError("");
    return true;
  };

  /* ==========================================================
     DECREASE
  ========================================================== */

  const handleDecrease = () => {
    setAdded(false);

    setQty((current) => {
      const next = Math.max(
        numericMoq,
        current - 1
      );

      validateQuantity(next);

      return next;
    });
  };

  /* ==========================================================
     INCREASE
  ========================================================== */

  const handleIncrease = () => {
    setAdded(false);

    setQty((current) => {
      const next = Math.min(
        9999,
        current + 1
      );

      if (next >= 9999) {
        setQuantityError(
          "Maximum quantity is 9999 cases."
        );
      } else {
        setQuantityError("");
      }

      return next;
    });
  };

  /* ==========================================================
     ADD TO CART
  ========================================================== */

  const handleAddToCart = () => {
    setAdded(false);

    if (!isInStock) {
      setQuantityError("This product is currently out of stock.");
      return;
    }

    if (!validateQuantity(qty)) {
      return;
    }

    try {
      addToCart(product, qty);

      setAdded(true);

      window.setTimeout(() => {
        setAdded(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Failed to add product to cart:",
        error
      );

      setQuantityError(
        "Unable to add this product to cart. Please try again."
      );
    }
  };

  /* ==========================================================
     WISHLIST
  ========================================================== */

 const handleWishlist = () => {
  try {
    const wasSaved = isInWishlist(product.id);

    toggleWishlist(product);

    // Show Shopping List option only when
    // the product is being added to Wishlist.
    if (!wasSaved) {
      setShowShoppingListPopup(true);
    }
  } catch (error) {
    console.error(
      "Failed to update wishlist:",
      error
    );
  }
};

  /* ==========================================================
     PRODUCT LINK
  ========================================================== */

  const productHref =
    product.id === "fort-sfo-1l"
      ? "/product/fortune-sunlite-sunflower-oil-5l"
      : `/product/${encodeURIComponent(product.id)}`;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="
      bg-white
      border
      border-line
      rounded-card
      overflow-hidden
      flex
      flex-col
      hover:shadow-pop
      transition-shadow
    ">

      {/* ======================================================
          PRODUCT IMAGE
      ====================================================== */}

      <div
        className="relative h-[150px] flex items-center justify-center"
        style={{
          background: `linear-gradient(
            160deg,
            ${product.swatch}22,
            ${product.swatch}0D
          )`,
        }}
      >
        {/* DISCOUNT */}

        {numericDiscount > 0 && (
          <span className="
            absolute
            top-2.5
            left-2.5
            bg-green
            text-white
            text-[11px]
            font-bold
            px-2
            py-1
            rounded-md
          ">
            {numericDiscount}% OFF
          </span>
        )}

        {/* OUT OF STOCK BADGE */}
        {!isInStock && (
          <span className="
            absolute
            top-2.5
            left-2.5
            bg-red-500
            text-white
            text-[11px]
            font-bold
            px-2
            py-1
            rounded-md
          ">
            OUT OF STOCK
          </span>
        )}

        {/* WISHLIST */}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={
            saved
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className={`
            absolute
            top-2.5
            right-2.5
            w-7
            h-7
            rounded-full
            shadow
            flex
            items-center
            justify-center
            transition-all
            hover:scale-110
            ${
              saved
                ? "bg-red-50"
                : "bg-white"
            }
          `}
        >
          <Heart
            size={14}
            className={
              saved
                ? "fill-red-500 text-red-500"
                : "text-ink-faint"
            }
          />
        </button>

        {/* PRODUCT VISUAL */}

        <div
          className="
            w-14
            h-20
            rounded-md
            shadow-sm
          "
          style={{
            background: `linear-gradient(
              160deg,
              ${product.swatch},
              ${product.accent}
            )`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* ======================================================
          PRODUCT DETAILS
      ====================================================== */}

      <div className="p-4 flex flex-col flex-1">

        {/* BRAND + SKU */}

        <div className="
          flex
          items-center
          justify-between
          gap-2
          mb-1
        ">
          <span className="
            text-[10.5px]
            font-bold
            tracking-wide
            text-ink-soft
            truncate
          ">
            {product.brand}
          </span>

          <span className="
            text-[10px]
            text-ink-faint
            truncate
            max-w-[100px]
          ">
            {product.sku}
          </span>
        </div>

        {/* ====================================================
            PRODUCT NAME
        ==================================================== */}

        <Link
          href={productHref}
          className="
            text-[13px]
            font-bold
            text-ink
            leading-snug
            mb-1
            line-clamp-2
            min-h-[34px]
            hover:text-blue
            transition-colors
          "
        >
          {product.name}
        </Link>

        {/* PACK */}

        <p className="
          text-[11.5px]
          text-ink-soft
          mb-1.5
        ">
          {product.pack}
        </p>

        {/* ====================================================
            RATING
        ==================================================== */}

        <div className="
          flex
          items-center
          gap-1
          mb-2
        ">
          <Star
            size={12}
            className="fill-amber text-amber"
          />

          <span className="
            text-[11.5px]
            font-semibold
            text-ink
          ">
            {numericRating.toFixed(1)}
          </span>

          <span className="
            text-[11px]
            text-ink-faint
          ">
            ({numericReviews.toLocaleString("en-IN")})
          </span>
        </div>

        {/* ====================================================
            MRP
        ==================================================== */}

        <div className="
          flex
          items-center
          gap-2
          mb-0.5
        ">
          <span className="
            text-[11.5px]
            text-ink-faint
            line-through
          ">
            MRP ₹{numericMrp.toLocaleString("en-IN")}
          </span>
        </div>

        {/* ====================================================
            PRICE
        ==================================================== */}

        <div className="
          flex
          items-baseline
          gap-1.5
          mb-1
        ">
          <span className="
            text-[19px]
            font-extrabold
            text-navy
          ">
            ₹{numericPrice.toLocaleString("en-IN")}
          </span>

          <span className="
            text-[10.5px]
            text-ink-faint
          ">
            GST Included
          </span>
        </div>

        {/* ====================================================
            BULK RATE
        ==================================================== */}

        <div className="
          text-[11.5px]
          font-semibold
          text-green-deep
          mb-2
        ">
          Bulk Rate: ₹
          {numericBulkRate.toLocaleString("en-IN")} (
          {numericBulkMoq}+ cases)
        </div>

        {/* ====================================================
            MOQ + STOCK
        ==================================================== */}

        <div className="
          flex
          items-center
          justify-between
          gap-2
          text-[11px]
          text-ink-soft
          mb-1
        ">
          <span className="
            flex
            items-center
            gap-1
            whitespace-nowrap
          ">
            <Circle
              size={7}
              className="
                fill-ink-faint
                text-ink-faint
              "
            />

            MOQ: {numericMoq} Cases
          </span>

          <span className="
            flex
            items-center
            gap-1
            font-semibold
            whitespace-nowrap
            ${isInStock ? 'text-green-deep' : 'text-red-500'}
          ">
            <Circle
              size={6}
              className={`
                ${isInStock ? 'fill-green-deep text-green-deep' : 'fill-red-500 text-red-500'}
              `}
            />

            {isInStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* ====================================================
            DISPATCH
        ==================================================== */}

        <div className="
          text-[11px]
          text-ink-faint
          mb-3
        ">
          Est. Dispatch: {isInStock ? product.dispatch : 'N/A'}
        </div>

        {/* ====================================================
            QUANTITY + CART
        ==================================================== */}

        <div className="
          mt-auto
          flex
          items-center
          gap-2
        ">

          {/* QUANTITY */}

          <div className="
            flex
            items-center
            border
            border-line
            rounded-lg
            overflow-hidden
          ">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={qty <= numericMoq || !isInStock}
              aria-label={`Decrease quantity of ${product.name}`}
              className="
                w-8
                h-9
                flex
                items-center
                justify-center
                text-ink-soft
                hover:text-navy
                hover:bg-paper
                transition-colors
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              <Minus size={13} />
            </button>

            <span
              aria-live="polite"
              className="
                w-9
                text-center
                text-[13px]
                font-semibold
                text-ink
              "
            >
              {qty}
            </span>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={qty >= 9999 || !isInStock}
              aria-label={`Increase quantity of ${product.name}`}
              className="
                w-8
                h-9
                flex
                items-center
                justify-center
                text-ink-soft
                hover:text-navy
                hover:bg-paper
                transition-colors
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              <Plus size={13} />
            </button>
          </div>

          {/* ADD TO CART */}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={`
              flex-1
              transition-colors
              text-white
              text-[12px]
              font-bold
              tracking-wide
              py-2.5
              rounded-lg
              flex
              items-center
              justify-center
              gap-1.5
              ${
                !isInStock 
                  ? 'bg-gray-400 cursor-not-allowed'
                  : added
                    ? "bg-green"
                    : "bg-blue hover:bg-blue-deep"
              }
            `}
          >
            {!isInStock ? (
              "OUT OF STOCK"
            ) : added ? (
              <>
                <Check size={14} />
                ADDED
              </>
            ) : (
              "ADD TO CART"
            )}
          </button>
        </div>

        {/* ====================================================
            VALIDATION ERROR
        ==================================================== */}

        {quantityError && (
          <p
            role="alert"
            className="
              text-[10.5px]
              text-red-500
              mt-1.5
            "
          >
            {quantityError}
          </p>
        )}

        {/* ====================================================
            QUOTE
        ==================================================== */}

        <button
          type="button"
          onClick={() => {
            if (!isInStock) {
              setQuantityError("This product is currently out of stock.");
              return;
            }

            if (!validateQuantity(qty)) {
              return;
            }

            console.log(
              "Quote requested:",
              {
                productId: product.id,
                quantity: qty,
              }
            );
          }}
          disabled={!isInStock}
          className={`
            text-[11px]
            font-semibold
            text-blue
            mt-2.5
            text-center
            hover:underline
            ${!isInStock ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          REQUEST QUOTE FOR 50+ CASES
        </button>
      </div>
      {/* SHOPPING LIST POPUP */}

      {showShoppingListPopup && (
        <ShoppingListSavePopup
          productId={product.id}
          productName={product.name}
          onClose={() =>
            setShowShoppingListPopup(false)
          }
        />
      )}
    </div>
  );
}