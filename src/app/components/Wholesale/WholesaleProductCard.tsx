"use client";

import { useState } from "react";
import { Check, Heart } from "lucide-react";

import type { NewArrivalProduct } from "@/app/data/newArrivals";
import type { Product } from "@/app/data/products";

import { useCart } from "@/app/context/cartcontext";
import { useWishlist } from "@/app/context/wishlistcontext";

import ShoppingListSavePopup from "@/app/components/ShoppingListSavePopup";

// Accepts full NewArrivalProduct rows as well as plain Product summaries
// produced by mapProductSummary (which lack moqUnit/tabCategory/filterCategory).
export type WholesaleCardProduct = NewArrivalProduct | Product;

export default function WholesaleProductCard({
  product,
}: {
  product: WholesaleCardProduct;
}) {
  const [added, setAdded] = useState(false);

  const [showShoppingListPopup, setShowShoppingListPopup] =
    useState(false);

  const { addToCart } = useCart();

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const saved = isInWishlist(product.id);

  const moqUnit =
    "moqUnit" in product &&
    typeof product.moqUnit === "string" &&
    product.moqUnit.trim().length > 0
      ? product.moqUnit
      : "Units";

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = () => {
    try {
      addToCart(product, product.moq);

      setAdded(true);

      window.setTimeout(() => {
        setAdded(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Failed to add product to cart:",
        error
      );
    }
  };

  // =====================================================
  // WISHLIST + SHOPPING LIST
  // =====================================================

  const handleWishlist = () => {
    try {
      const wasSaved = isInWishlist(product.id);

      toggleWishlist(product);

      // Show Shopping List popup only when
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

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <article className="bg-white border border-line rounded-card overflow-hidden flex flex-col hover:shadow-pop transition-shadow">

        {/* =====================================================
            PRODUCT IMAGE / SWATCH
        ====================================================== */}

        <div
          className="h-[120px] flex items-center justify-center relative"
          style={{
            background: `linear-gradient(160deg, ${product.swatch}22, ${product.swatch}0D)`,
          }}
        >
          {product.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="
                max-h-full
                max-w-[85%]
                object-contain
                drop-shadow-sm
              "
            />
          ) : (
            <div
              className="w-11 h-16 rounded-sm shadow-sm"
              style={{
                background: `linear-gradient(160deg, ${product.swatch}, ${product.accent})`,
              }}
              aria-hidden="true"
            />
          )}

          {/* =================================================
              WISHLIST HEART
          ================================================== */}

          <button
            type="button"
            onClick={handleWishlist}
            aria-label={
              saved
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            className="
              absolute
              top-2.5
              right-2.5
              w-8
              h-8
              rounded-full
              bg-white/90
              flex
              items-center
              justify-center
              shadow-sm
              hover:bg-white
              transition-all
            "
          >
            <Heart
              size={15}
              aria-hidden="true"
              className={
                saved
                  ? "fill-red-500 text-red-500"
                  : "text-ink-soft"
              }
            />
          </button>
        </div>

        {/* =====================================================
            PRODUCT DETAILS
        ====================================================== */}

        <div className="p-3.5 flex flex-col flex-1">

          {/* PRODUCT NAME */}

          <h3 className="text-[12.5px] font-bold text-ink leading-snug line-clamp-2 min-h-[32px]">
            {product.name}
          </h3>

          {/* MRP */}

          <div className="text-[11px] text-ink-faint line-through mt-1.5">
            MRP ₹{product.mrp}
          </div>

          {/* WHOLESALE PRICE */}

          <div className="text-[13.5px] font-extrabold text-navy">
            Wholesale Price ₹{product.price}
          </div>

          {/* MOQ */}

          <span className="inline-block w-fit text-[10px] font-semibold text-green-deep bg-green/10 px-2 py-0.5 rounded-md mt-1.5">
            MOQ: {product.moq} {moqUnit}
          </span>

          {/* ADD TO CART */}

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={
              added
                ? `${product.name} added to cart`
                : `Add ${product.name} to cart`
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
              mt-auto
              transition-colors
              ${
                added
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
            ) : (
              "Add to Cart"
            )}
          </button>
        </div>
      </article>

      {/* =====================================================
          SHOPPING LIST POPUP
      ====================================================== */}

      {showShoppingListPopup && (
        <ShoppingListSavePopup
          productId={product.id}
          productName={product.name}
          product={product}
          onClose={() =>
            setShowShoppingListPopup(false)
          }
        />
      )}
    </>
  );
}