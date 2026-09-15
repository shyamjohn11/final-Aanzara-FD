"use client";

import { CartLine } from "@/app/context/cartcontext";
import { useWishlist } from "@/app/context/wishlistcontext";
import { useSaveForLater } from "@/app/context/saveforlatercontext";

import {
  Minus,
  Plus,
  Truck,
  Heart,
} from "lucide-react";

export default function CartItemCard({
  line,
  onQtyChange,
  onRemove,
}: {
  line: CartLine;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  // =====================================================
  // BASIC LINE VALIDATION
  // =====================================================

  if (!line || typeof line !== "object") {
    return (
      <div
        role="alert"
        className="bg-white border border-line rounded-card p-5 text-[12px] text-red-600"
      >
        Invalid cart item.
      </div>
    );
  }

  const product = line.product;

  if (!product || typeof product !== "object") {
    return (
      <div
        role="alert"
        className="bg-white border border-line rounded-card p-5 text-[12px] text-red-600"
      >
        Product information is unavailable.
      </div>
    );
  }

  // =====================================================
  // WISHLIST
  // =====================================================

  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  // =====================================================
  // SAVE FOR LATER
  // =====================================================

  const {
    addToSaveForLater,
  } = useSaveForLater();

  // =====================================================
  // FIELD VALIDATION
  // =====================================================

  const validId =
    typeof product.id === "string" &&
    product.id.trim().length > 0;

  const brand =
    typeof product.brand === "string" &&
    product.brand.trim().length > 0
      ? product.brand
      : "Generic";

  const validName =
    typeof product.name === "string" &&
    product.name.trim().length > 0;

  const sku =
    typeof product.sku === "string" &&
    product.sku.trim().length > 0
      ? product.sku
      : "N/A";

  const pack =
    typeof product.pack === "string" &&
    product.pack.trim().length > 0
      ? product.pack
      : "Standard pack";

  const dispatch =
    typeof product.dispatch === "string" &&
    product.dispatch.trim().length > 0
      ? product.dispatch
      : "Ready to ship";

  const swatch =
    typeof product.swatch === "string" &&
    product.swatch.trim().length > 0
      ? product.swatch
      : "#f4f4f5";

  const accent =
    typeof product.accent === "string" &&
    product.accent.trim().length > 0
      ? product.accent
      : "#e4e4e7";

  // =====================================================
  // NUMERIC VALIDATION
  // =====================================================

  const numericQty = Number(line.qty);
  const numericMoq = Number(product.moq);
  const numericBulkMoq = Number(product.bulkMoq);
  const numericPrice = Number(product.price);
  const numericBulkRate = Number(product.bulkRate);
  const numericMrp = Number(product.mrp);
  const numericDiscount = Number(product.discount);

  const validQty =
    Number.isFinite(numericQty) &&
    numericQty >= 1;

  const validMoq =
    Number.isFinite(numericMoq) &&
    numericMoq >= 1;

  const validBulkMoq =
    Number.isFinite(numericBulkMoq) &&
    numericBulkMoq >= 1;

  const validPrice =
    Number.isFinite(numericPrice) &&
    numericPrice >= 0;

  const validBulkRate =
    Number.isFinite(numericBulkRate) &&
    numericBulkRate >= 0;

  const validMrp =
    Number.isFinite(numericMrp) &&
    numericMrp >= 0;

  const validDiscount =
    Number.isFinite(numericDiscount) &&
    numericDiscount >= 0 &&
    numericDiscount <= 100;

  // =====================================================
  // FINAL PRODUCT VALIDATION
  // =====================================================

  const productIsValid =
    validId &&
    validName &&
    validQty &&
    validPrice &&
    validMrp;

  // =====================================================
  // INVALID PRODUCT FALLBACK
  // =====================================================

  if (!productIsValid) {
    return (
      <div
        role="alert"
        className="bg-white border border-line rounded-card p-5"
      >
        <div className="text-[13px] font-bold text-ink">
          Product information is invalid
        </div>

        <p className="text-[11px] text-ink-soft mt-1">
          This cart item cannot be displayed correctly.
        </p>

        {validId && (
          <button
            type="button"
            onClick={() => onRemove(product.id)}
            className="mt-3 text-[11px] font-semibold text-red-600 hover:underline"
          >
            Remove Item
          </button>
        )}
      </div>
    );
  }

  // =====================================================
  // SAFE VALUES
  // =====================================================

  const qty = Math.max(
    1,
    Math.floor(numericQty)
  );

  const moq = Math.max(
    1,
    Math.floor(numericMoq)
  );

  const bulkMoq = Math.max(
    1,
    Math.floor(numericBulkMoq)
  );

  const inBulk = qty >= bulkMoq;

  const unitPrice = inBulk
    ? numericBulkRate
    : numericPrice;

  // =====================================================
  // WISHLIST STATE
  // =====================================================

  const alreadyInWishlist =
    isInWishlist(product.id);

  // =====================================================
  // QUANTITY DECREASE
  // =====================================================

  const dec = () => {
    if (!validQty) {
      return;
    }

    const nextQty = Math.max(
      1,
      qty - 1
    );

    if (nextQty === qty) {
      return;
    }

    try {
      onQtyChange(
        product.id,
        nextQty
      );
    } catch (error) {
      console.error(
        "Failed to decrease product quantity:",
        error
      );
    }
  };

  // =====================================================
  // QUANTITY INCREASE
  // =====================================================

  const inc = () => {
    if (!validQty) {
      return;
    }

    const nextQty = qty + 1;

    if (
      !Number.isSafeInteger(nextQty) ||
      nextQty < 1
    ) {
      return;
    }

    try {
      onQtyChange(
        product.id,
        nextQty
      );
    } catch (error) {
      console.error(
        "Failed to increase product quantity:",
        error
      );
    }
  };

  // =====================================================
  // REMOVE PRODUCT
  // =====================================================

  const handleRemove = () => {
    if (!validId) {
      return;
    }

    try {
      onRemove(product.id);
    } catch (error) {
      console.error(
        "Failed to remove product:",
        error
      );
    }
  };

  // =====================================================
  // MOVE TO WISHLIST
  // =====================================================

  const handleMoveToWishlist = () => {
    if (!validId) {
      return;
    }

    try {
      if (!alreadyInWishlist) {
        toggleWishlist(product);
      }

      onRemove(product.id);
    } catch (error) {
      console.error(
        "Failed to move product to wishlist:",
        error
      );
    }
  };

  // =====================================================
  // SAVE FOR LATER
  // =====================================================

  const handleSaveForLater = () => {
    if (!validId || !validQty) {
      return;
    }

    try {
      // Save the product with its current cart quantity.
      addToSaveForLater(
        product,
        qty
      );

      // Remove the product from the cart
      // after adding it to Save for Later.
      onRemove(product.id);
    } catch (error) {
      console.error(
        "Failed to save product for later:",
        error
      );
    }
  };

  // =====================================================
  // FORMAT PRICE
  // =====================================================

  const formatPrice = (value: number) => {
    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return "0";
    }

    return value.toLocaleString("en-IN");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <article className="bg-white border border-line rounded-card p-5">
      <div className="flex flex-col sm:flex-row gap-4">

        {/* =====================================================
            PRODUCT IMAGE
        ====================================================== */}

        <div
          className="w-full sm:w-[130px] h-[110px] shrink-0 rounded-lg flex items-center justify-center"
          style={{
            background: `linear-gradient(
              160deg,
              ${swatch}22,
              ${swatch}0D
            )`,
          }}
          role="img"
          aria-label={`${product.name} product preview`}
        >
          <div
            className="w-11 h-16 rounded-md shadow-sm"
            style={{
              background: `linear-gradient(
                160deg,
                ${swatch},
                ${accent}
              )`,
            }}
          />
        </div>

        {/* =====================================================
            PRODUCT DETAILS
        ====================================================== */}

        <div className="flex-1 min-w-0">

          {/* BRAND + SKU */}

          <div className="flex items-center gap-2 flex-wrap text-[11.5px]">

            <span className="font-bold text-navy tracking-wide">
              {brand}
            </span>

            <span
              className="text-ink-faint"
              aria-hidden="true"
            >
              |
            </span>

            <span className="text-ink-faint">
              SKU: {sku}
            </span>

            {/* BULK RATE */}

            {inBulk && (
              <span className="bg-blue/10 text-blue text-[10.5px] font-bold px-2 py-0.5 rounded">
                BULK RATE APPLIED
              </span>
            )}
          </div>

          {/* PRODUCT NAME */}

          <h3 className="font-sora font-bold text-[16px] text-ink mt-1.5 leading-snug">
            {product.name}
          </h3>

          {/* PACK */}

          <p className="text-[12.5px] text-ink-soft mt-1">
            {pack}
          </p>

          {/* DISPATCH */}

          <div className="flex items-center gap-1.5 text-[12px] text-green font-semibold mt-2">
            <Truck
              size={13}
              aria-hidden="true"
            />

            <span>
              Est. Dispatch:{" "}
              {dispatch}
            </span>
          </div>

          {/* =====================================================
              ACTIONS
          ====================================================== */}

          <div className="flex items-center gap-3 mt-3 text-[12.5px] flex-wrap">

            {/* REMOVE */}

            <button
              type="button"
              onClick={handleRemove}
              className="text-ink-soft hover:text-red-600 transition-colors"
              aria-label={`Remove ${product.name} from cart`}
            >
              Remove
            </button>

            <span
              className="text-line"
              aria-hidden="true"
            >
              |
            </span>

            {/* MOVE TO WISHLIST */}

            <button
              type="button"
              onClick={handleMoveToWishlist}
              className="flex items-center gap-1.5 text-ink-soft hover:text-red-600 transition-colors"
              aria-label={
                alreadyInWishlist
                  ? `${product.name} is already in wishlist`
                  : `Move ${product.name} to wishlist`
              }
            >
              <Heart
                size={13}
                aria-hidden="true"
                className={
                  alreadyInWishlist
                    ? "fill-red-500 text-red-500"
                    : ""
                }
              />

              {alreadyInWishlist
                ? "Already in Wishlist"
                : "Move to Wishlist"}
            </button>

            <span
              className="text-line"
              aria-hidden="true"
            >
              |
            </span>

            {/* SAVE FOR LATER */}

            <button
              type="button"
              onClick={handleSaveForLater}
              className="text-ink-soft hover:text-navy transition-colors"
              aria-label={`Save ${product.name} for later`}
            >
              Save for Later
            </button>

            <span
              className="text-line"
              aria-hidden="true"
            >
              |
            </span>

            {/* BULK QUOTE */}

            <button
              type="button"
              className="text-blue font-semibold hover:underline"
              aria-label={`Request bulk quote for ${product.name}`}
            >
              Request Bulk Quote
            </button>

            {/* STOCK */}

            {product.inStock === true && (
              <span className="flex items-center gap-1 text-green font-semibold">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-green"
                  aria-hidden="true"
                />

                In Stock
              </span>
            )}
          </div>
        </div>

        {/* =====================================================
            PRICE + QUANTITY
        ====================================================== */}

        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:w-[150px] shrink-0">

          {/* =====================================================
              PRICE
          ====================================================== */}

          <div className="text-right">

            {/* MRP */}

            <div className="text-[12px] text-ink-faint">
              MRP:{" "}

              <span className="line-through">
                ₹{formatPrice(numericMrp)}
              </span>
            </div>

            {/* CURRENT PRICE */}

            <div className="text-[13px] text-ink-soft">
              {inBulk
                ? "Bulk Rate:"
                : "Price:"}{" "}

              <span className="text-[19px] font-sora font-bold text-ink">
                ₹{formatPrice(unitPrice)}
              </span>
            </div>

            {/* DISCOUNT + GST */}

            <div className="flex items-center justify-end gap-2 text-[11px] mt-0.5">

              <span className="bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded">
                {numericDiscount}% OFF
              </span>

              <span className="text-ink-faint">
                GST Incl.
              </span>
            </div>
          </div>

          {/* =====================================================
              QUANTITY
          ====================================================== */}

          <div className="flex flex-col items-end gap-1">

            <div className="flex items-center border border-line rounded-lg overflow-hidden">

              {/* DECREASE */}

              <button
                type="button"
                onClick={dec}
                disabled={qty <= 1}
                className="
                  w-8
                  h-8
                  flex
                  items-center
                  justify-center
                  text-ink-soft
                  hover:bg-paper
                  transition-colors
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                "
                aria-label={`Decrease quantity of ${product.name}`}
              >
                <Minus
                  size={14}
                  aria-hidden="true"
                />
              </button>

              {/* QUANTITY */}

              <span
                className="w-10 text-center text-[13.5px] font-semibold text-ink"
                aria-label={`Quantity ${qty}`}
              >
                {qty}
              </span>

              {/* INCREASE */}

              <button
                type="button"
                onClick={inc}
                disabled={!Number.isSafeInteger(qty)}
                className="
                  w-8
                  h-8
                  flex
                  items-center
                  justify-center
                  text-ink-soft
                  hover:bg-paper
                  transition-colors
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                "
                aria-label={`Increase quantity of ${product.name}`}
              >
                <Plus
                  size={14}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* MOQ */}

            <span className="text-[10.5px] text-ink-faint">
              MOQ: {moq} cases
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
