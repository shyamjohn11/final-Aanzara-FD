// File: app/components/Dashboard/PopularProducts.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Minus,
  Plus,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { productsApi } from "@/app/api/services";
import { mapProductSummaries } from "@/app/api/productmap";
import type { Product } from "@/app/data/products";
import { useCart } from "@/app/context/cartcontext";
import { useWishlist } from "@/app/context/wishlistcontext";

/* ============================================================
   PRODUCT CARD
============================================================ */

function PopularProductCard({
  product,
}: {
  product: Product;
}) {
  const router = useRouter();

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const saved = isInWishlist(product.id);

  /* ==========================================================
     NAVIGATE TO PRODUCT DETAIL
  ========================================================== */

  const goToProduct = () => {
    router.push(`/product/${product.id}`);
  };

  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLElement>
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToProduct();
    }
  };

  const handleWishlist = (
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setError("");
    try {
      toggleWishlist(product);
    } catch {
      setError("Could not update wishlist. Please try again.");
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  const safeQty = Math.max(1, Math.min(9999, qty));

  const decreaseQty = (event: React.MouseEvent) => {
    event.stopPropagation();
    setError("");
    setAdded(false);

    setQty((current) => Math.max(1, current - 1));
  };

  const increaseQty = (event: React.MouseEvent) => {
    event.stopPropagation();
    setError("");
    setAdded(false);

    setQty((current) => {
      if (!Number.isFinite(current) || current < 1) {
        return 1;
      }

      if (current >= 9999) {
        setError("Maximum quantity reached.");
        return 9999;
      }

      return current + 1;
    });
  };

  /* ==========================================================
     ADD TO CART (backend-synced via cart context)
  ========================================================== */

  const handleAddToCart = (event: React.MouseEvent) => {
    event.stopPropagation();
    setError("");
    setAdded(false);

    if (!product.inStock) {
      setError("This product is currently out of stock.");
      return;
    }

    if (!Number.isInteger(safeQty) || safeQty < 1) {
      setQty(1);
      setError("Please select a valid quantity.");
      return;
    }

    try {
      addToCart(product, safeQty);

      setAdded(true);

      window.setTimeout(() => {
        setAdded(false);
      }, 1500);
    } catch {
      setError("Could not add to cart. Please try again.");
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onClick={goToProduct}
      onKeyDown={handleCardKeyDown}
      className="
        bg-white
        border
        border-line
        rounded-card
        overflow-hidden
        flex
        flex-col
        cursor-pointer
        transition-shadow
        hover:shadow-lg
        focus:outline-none
        focus:ring-2
        focus:ring-navy/30
      "
    >
      {/* ======================================================
          PRODUCT IMAGE / SWATCH
      ====================================================== */}

      <div
        className="
          relative
          h-[130px]
          w-full
          overflow-hidden
          flex
          items-center
          justify-center
        "
        style={{
          background: `linear-gradient(
            160deg,
            ${product.swatch}22,
            ${product.swatch}0A
          )`,
        }}
      >
        {/* DISCOUNT BADGE */}

        {product.discount > 0 && (
          <span className="
            absolute
            top-2.5
            left-2.5
            z-10
            bg-green
            text-white
            text-[10.5px]
            font-bold
            px-2
            py-1
            rounded-md
          ">
            SAVE {product.discount}%
          </span>
        )}

        {/* STOCK BADGE */}

        {product.stockStatus === "low_stock" && (
          <span className="
            absolute
            top-2.5
            right-2.5
            z-10
            bg-amber-500
            text-white
            text-[10px]
            font-bold
            px-2
            py-1
            rounded-md
          ">
            Low Stock
          </span>
        )}

        {!product.inStock && (
          <span className="
            absolute
            top-2.5
            right-2.5
            z-10
            bg-red-500
            text-white
            text-[10px]
            font-bold
            px-2
            py-1
            rounded-md
          ">
            Out of Stock
          </span>
        )}

        {/* WISHLIST HEART */}

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
            bottom-2.5
            right-2.5
            z-10
            w-8
            h-8
            rounded-full
            shadow
            flex
            items-center
            justify-center
            transition-all
            hover:scale-110
            ${saved ? "bg-red-50" : "bg-white"}
          `}
        >
          <Heart
            size={15}
            className={
              saved
                ? "fill-red-500 text-red-500"
                : "text-ink-faint"
            }
          />
        </button>

        {/* PRODUCT VISUAL — streaming API image or swatch fallback */}

        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 160px"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />
        ) : (
          <div
            className="w-12 h-16 rounded-md"
            style={{
              background: `linear-gradient(
                160deg,
                ${product.swatch},
                ${product.swatch}CC
              )`,
            }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* ======================================================
          PRODUCT DETAILS
      ====================================================== */}

      <div className="p-3.5 flex flex-col flex-1">
        {/* BRAND */}

        <span className="
          text-[10px]
          font-bold
          tracking-wide
          text-ink-faint
          truncate
          uppercase
        ">
          {product.brand || "Aanzara"}
        </span>

        {/* PRODUCT NAME */}

        <h3 className="
          text-[13px]
          font-bold
          text-ink
          mt-0.5
          leading-snug
          min-h-[34px]
        ">
          {product.name}
        </h3>

        {/* MOQ / DISPATCH */}

        <p className="text-[11px] text-ink-soft mt-0.5">
          MOQ: {product.moq} unit{product.moq === 1 ? "" : "s"}
          {product.dispatch ? ` • ${product.dispatch}` : ""}
        </p>

        {/* ====================================================
            PRICE
        ==================================================== */}

        <div className="
          border-t
          border-line
          mt-2.5
          pt-2.5
          flex
          flex-col
          gap-1
        ">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-faint">
              MRP:
            </span>

            <span className="text-ink-soft line-through">
              ₹{product.mrp.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center justify-between text-[12px]">
            <span className="text-green-deep font-semibold">
              Your Price:
            </span>

            <span className="text-green-deep font-bold">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* ====================================================
            GST + SKU
        ==================================================== */}

        <div className="flex items-center justify-between mt-2.5 gap-2">
          <span className="
            text-[10px]
            font-semibold
            text-green-deep
            bg-green/10
            px-1.5
            py-0.5
            rounded
            whitespace-nowrap
          ">
            GST INCLUDED
          </span>

          <span
            title={product.sku}
            className="
              text-[10px]
              text-ink-faint
              truncate
            "
          >
            {product.sku}
          </span>
        </div>

        {/* ====================================================
            QUANTITY
        ==================================================== */}

        <div className="flex items-center mt-3">
          <div className="
            flex
            items-center
            justify-between
            w-full
            border
            border-line
            rounded-lg
            overflow-hidden
          ">
            <button
              type="button"
              onClick={decreaseQty}
              disabled={safeQty <= 1}
              aria-label={`Decrease quantity of ${product.name}`}
              className="
                w-9
                h-9
                flex
                items-center
                justify-center
                text-ink-soft
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
                text-center
                text-[12px]
                font-semibold
                text-ink
              "
            >
              {safeQty} {safeQty === 1 ? "Unit" : "Units"}
            </span>

            <button
              type="button"
              onClick={increaseQty}
              disabled={safeQty >= 9999}
              aria-label={`Increase quantity of ${product.name}`}
              className="
                w-9
                h-9
                flex
                items-center
                justify-center
                text-ink-soft
                hover:bg-paper
                transition-colors
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <p
            role="alert"
            className="
              text-[10.5px]
              text-red-500
              mt-1.5
            "
          >
            {error}
          </p>
        )}

        {/* ====================================================
            ADD TO CART
        ==================================================== */}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className="
            mt-2.5
            flex
            items-center
            justify-center
            gap-2
            bg-blue-deep
            hover:bg-navy
            transition-colors
            text-white
            text-[12px]
            font-bold
            py-2.5
            rounded-lg
            disabled:bg-ink-faint
            disabled:cursor-default
          "
        >
          {added ? (
            <CheckCircle2 size={14} />
          ) : (
            <ShoppingCart size={14} />
          )}

          {!product.inStock
            ? "Out of Stock"
            : added
              ? "Added to Cart"
              : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

/* ============================================================
   INVALID PRODUCT FALLBACK
============================================================ */

function InvalidProductCard() {
  return (
    <article
      role="alert"
      className="
        bg-white
        border
        border-red-200
        rounded-card
        p-4
        text-center
      "
    >
      <AlertCircle
        size={20}
        className="text-red-500 mx-auto mb-2"
      />

      <p className="text-[12px] font-semibold text-red-600">
        Product information is unavailable.
      </p>
    </article>
  );
}

/* ============================================================
   POPULAR PRODUCTS
============================================================ */

type PopularTab = "fresh" | "best";

export default function PopularProducts() {
  const [tab, setTab] = useState<PopularTab>("best");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  /* ==========================================================
     FETCH — Best Selling → /popular, Fresh Arrivals → /fresh-arrivals
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const response =
          tab === "best"
            ? await productsApi.popular(8)
            : await productsApi.freshArrivals(8);

        const mapped = mapProductSummaries(response.data);

        if (!cancelled) {
          setProducts(mapped);
          setLoadFailed(false);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setLoadFailed(true);
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
  }, [tab]);

  /* ==========================================================
     TAB HANDLER
  ========================================================== */

  const handleTabChange = (nextTab: PopularTab) => {
    if (nextTab !== "fresh" && nextTab !== "best") {
      return;
    }

    setTab(nextTab);
  };

  /* ==========================================================
     STATUS MESSAGE
  ========================================================== */

  const statusMessage = loading
    ? tab === "best"
      ? "Loading best sellers…"
      : "Loading fresh arrivals…"
    : loadFailed
      ? "Products could not be loaded right now. Please try again later."
      : "No products available yet.";

  return (
    <section aria-labelledby="popular-products-title">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="
        flex
        flex-wrap
        items-start
        justify-between
        gap-4
        mb-5
      ">
        <div>
          <h2
            id="popular-products-title"
            className="
              font-sora
              font-bold
              text-[19px]
              text-navy
            "
          >
            Popular Products
          </h2>

          <p className="text-[12.5px] text-ink-soft mt-1">
            {tab === "best"
              ? "Best-selling active catalog with the deepest discounts"
              : "The newest additions to the Aanzara wholesale catalog"}
          </p>
        </div>

        {/* ====================================================
            TABS
        ==================================================== */}

        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Product listing"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "fresh"}
            onClick={() => handleTabChange("fresh")}
            className={`
              text-[12px]
              font-semibold
              px-4
              py-2.5
              rounded-lg
              border
              transition-colors
              ${
                tab === "fresh"
                  ? "bg-navy text-white border-navy"
                  : "border-line text-ink-soft hover:border-navy/40"
              }
            `}
          >
            Fresh Arrivals
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === "best"}
            onClick={() => handleTabChange("best")}
            className={`
              text-[12px]
              font-semibold
              px-4
              py-2.5
              rounded-lg
              border
              transition-colors
              ${
                tab === "best"
                  ? "bg-navy text-white border-navy"
                  : "border-line text-ink-soft hover:border-navy/40"
              }
            `}
          >
            Best Selling
          </button>
        </div>
      </div>

      {/* ======================================================
          EMPTY / LOADING STATE
      ====================================================== */}

      {products.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="
            bg-white
            border
            border-line
            rounded-card
            p-8
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          {statusMessage}
        </div>
      ) : (
        /* ====================================================
           PRODUCT GRID
        ==================================================== */

        <div
          className="
            grid
            grid-cols-1
            min-[480px]:grid-cols-2
            xl:grid-cols-4
            gap-4
          "
        >
          {products.map((product, index) =>
            product ? (
              <PopularProductCard
                key={product.id || `${product.name}-${index}`}
                product={product}
              />
            ) : (
              <InvalidProductCard
                key={`invalid-${index}`}
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}
