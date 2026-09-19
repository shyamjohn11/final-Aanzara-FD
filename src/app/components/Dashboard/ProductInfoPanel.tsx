// File: app/components/Dashboard/ProductInfoPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  CircleCheck,
  Minus,
  Plus,
  ChevronDown,
  Truck,
  ShieldCheck,
  Share2,
  Scale,
  FileText,
  Snowflake,
  Sparkles,
  Tag,
  AlertCircle,
} from "lucide-react";

import { PRODUCT_DETAIL } from "@/app/data/productDetail";
import { productsApi } from "@/app/api/services";
import {
  mapProductSummary,
  extractProductArray,
} from "@/app/api/productmap";
import type { Product } from "@/app/data/products";
import { useCart } from "@/app/context/cartcontext";

const BADGE_ICONS = [
  FileText,
  Snowflake,
  Sparkles,
  Tag,
  Scale,
];

type ProductDetailData = typeof PRODUCT_DETAIL;

/* ============================================================
   VALIDATION HELPERS
============================================================ */

const toSafeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
};

const isValidString = (
  value: unknown
): value is string => {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
};

const isValidProductDetail = (
  product: ProductDetailData
): boolean => {
  if (!product || typeof product !== "object") {
    return false;
  }

  if (!isValidString(product.brand)) return false;
  if (!isValidString(product.name)) return false;
  if (!isValidString(product.sku)) return false;
  if (!isValidString(product.productCode)) return false;

  if (!Array.isArray(product.tags)) return false;
  if (!Array.isArray(product.priceTiers)) return false;
  if (!Array.isArray(product.cartonOptions)) return false;
  if (!Array.isArray(product.deliveryPerks)) return false;
  if (!Array.isArray(product.trustBadges)) return false;

  if (
    !Number.isFinite(
      toSafeNumber(product.rating, NaN)
    )
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      toSafeNumber(product.reviewCount, NaN)
    )
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      toSafeNumber(product.ordersFilled, NaN)
    )
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      toSafeNumber(product.minOrderQty, NaN)
    ) ||
    toSafeNumber(product.minOrderQty) < 1
  ) {
    return false;
  }

  if (!isValidString(product.deliveryEstimate)) {
    return false;
  }

  if (!isValidString(product.bulkNote)) {
    return false;
  }

  return true;
};

/* ============================================================
   LIVE PRODUCT ADAPTER
============================================================ */

export type ProductInfoPanelProps = {
  product?: ProductDetailData | Product | null;
};

function isLiveProduct(
  value: unknown
): value is Product {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  // Product summaries have id + price; detail rows have priceTiers.
  return (
    typeof record.id === "string" &&
    typeof record.price === "number" &&
    !Array.isArray(record.priceTiers)
  );
}

function adaptLiveProduct(live: Product): ProductDetailData {
  const moq =
    Number.isFinite(live.moq) && live.moq > 0
      ? Math.floor(live.moq)
      : 1;

  return {
    productId: live.id,
    brand: live.brand?.trim() ? live.brand : "Brand",
    name: live.name,
    tags: [],
    sku: live.sku?.trim() ? live.sku : live.id,
    productCode: live.sku?.trim() ? live.sku : live.id,
    rating:
      Number.isFinite(live.rating) && live.rating >= 0
        ? live.rating
        : 0,
    reviewCount:
      Number.isFinite(live.reviews) && live.reviews >= 0
        ? Math.floor(live.reviews)
        : 0,
    ordersFilled: 0,
    inStock: live.inStock,
    minOrderQty: moq,
    images: live.image ? [live.image] : [],
    priceTiers: [
      {
        range: `1-${moq} units`,
        price: live.price,
        note: live.discount > 0 ? `${live.discount}% OFF` : "",
      },
    ],
    bulkNote: "Bulk pricing available. Add to cart for wholesale rates.",
    deliveryEstimate: "3-5 business days",
    deliveryPerks: ["Free delivery on bulk orders"],
    cartonOptions: [`Carton of ${moq}`],
    trustBadges: [],
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function ProductInfoPanel({
  product: liveProp,
}: ProductInfoPanelProps = {}) {
  const [fetched, setFetched] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!liveProp);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (liveProp) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const response = await productsApi.list({
          page: 1,
          pageSize: 1,
        });
        const first = extractProductArray(response.data)
          .map(mapProductSummary)
          .find(
            (entry): entry is Product => entry !== null
          );

        if (!cancelled) {
          setFetched(first ?? null);
        }
      } catch {
        if (!cancelled) {
          setFetchError("Unable to load product information.");
          setFetched(null);
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
  }, [liveProp]);

  /* ==========================================================
     RESOLVE DATA SOURCE (prop first, then live fetch, then static)
  ========================================================== */

  if (loading && !liveProp) {
    return (
      <div
        role="status"
        className="
          bg-white
          border
          border-line
          rounded-card
          p-6
          flex
          flex-col
          items-center
          justify-center
          min-h-[300px]
          text-center
          text-[12px]
          text-ink-soft
        "
      >
        Loading product information…
      </div>
    );
  }

  let p: ProductDetailData = PRODUCT_DETAIL;

  if (liveProp) {
    p = isLiveProduct(liveProp)
      ? adaptLiveProduct(liveProp)
      : (liveProp as ProductDetailData);
  } else if (fetched) {
    p = adaptLiveProduct(fetched);
  } else if (fetchError) {
    // Keep static fallback below so validation decides the UI.
    p = PRODUCT_DETAIL;
  }

  /* ==========================================================
     INVALID DATA FALLBACK
  ========================================================== */

  if (!isValidProductDetail(p)) {
    return (
      <div
        role="alert"
        className="
          bg-white
          border
          border-red-200
          rounded-card
          p-6
          flex
          flex-col
          items-center
          justify-center
          min-h-[300px]
          text-center
        "
      >
        <AlertCircle
          size={24}
          className="text-red-500 mb-2"
        />

        <h2 className="text-[14px] font-bold text-ink">
          Product information unavailable
        </h2>

        <p className="text-[11.5px] text-ink-soft mt-1">
          Some required product information is missing
          or invalid.
        </p>
      </div>
    );
  }

  return <ValidatedProductInfoPanel product={p} />;
}

/* ============================================================
   VALIDATED PRODUCT PANEL
============================================================ */

function ValidatedProductInfoPanel({
  product: p,
}: {
  product: ProductDetailData;
}) {
  const { addToCart } = useCart();
  const router = useRouter();

  const minimumQty = Math.max(
    1,
    Math.floor(
      toSafeNumber(p.minOrderQty, 1)
    )
  );

  const safeRating = Math.min(
    5,
    Math.max(
      0,
      toSafeNumber(p.rating, 0)
    )
  );

  const reviewCount = Math.max(
    0,
    Math.floor(
      toSafeNumber(p.reviewCount, 0)
    )
  );

  const ordersFilled = Math.max(
    0,
    Math.floor(
      toSafeNumber(p.ordersFilled, 0)
    )
  );

  const [qty, setQty] = useState(minimumQty);

  const firstCarton =
    Array.isArray(p.cartonOptions) &&
    p.cartonOptions.length > 0
      ? p.cartonOptions[0]
      : "";

  const [carton, setCarton] =
    useState(firstCarton);

  const [pincode, setPincode] =
    useState("");

  const [pincodeError, setPincodeError] =
    useState("");

  const [added, setAdded] =
    useState(false);

  /* ==========================================================
     QUANTITY
  ========================================================== */

  const decreaseQty = () => {
    setQty((current) =>
      Math.max(
        minimumQty,
        current - 1
      )
    );

    setAdded(false);
  };

  const increaseQty = () => {
    setQty((current) =>
      Math.min(
        9999,
        current + 1
      )
    );

    setAdded(false);
  };

  /* ==========================================================
     PINCODE VALIDATION
  ========================================================== */

  const validatePincode = () => {
    const value = pincode.trim();

    if (!value) {
      setPincodeError(
        "Please enter a pincode."
      );
      return false;
    }

    if (!/^[1-9][0-9]{5}$/.test(value)) {
      setPincodeError(
        "Please enter a valid 6-digit Indian pincode."
      );
      return false;
    }

    setPincodeError("");
    return true;
  };

  const handleCheckDelivery = () => {
    if (!validatePincode()) {
      return;
    }

    console.log(
      "Checking delivery for:",
      pincode.trim()
    );
  };

  /* ==========================================================
      ADD TO CART — live cartApi via context, works for RIce + any product
  ========================================================== */

  const handleAddToCart = () => {
    if (!Number.isFinite(qty) || qty < minimumQty || qty > 9999) return;

    // Resolve the live product id: prefer liveProp/fetched id, fallback to sku/code
    const liveId = (p as unknown as Record<string, unknown>).productId as string | undefined;
    const fallbackId = liveId || p.sku || p.productCode;
    if (!fallbackId) return;

    try {
      // Build a minimal Product shape the cart context expects — price/moq come from live tier
      const cartProduct = {
        id: String(fallbackId),
        name: p.name,
        brand: p.brand,
        sku: p.sku,
        pack: `Carton of ${minimumQty}`,
        rating: safeRating,
        reviews: reviewCount,
        discount: 0,
        mrp: p.priceTiers[0]?.price ?? 0,
        price: p.priceTiers[0]?.price ?? 0,
        bulkRate: p.priceTiers[0]?.price ?? 0,
        bulkMoq: minimumQty,
        moq: minimumQty,
        inStock: p.inStock,
        dispatch: p.deliveryEstimate,
        swatch: "#2563EB",
        accent: "#1E40AF",
      } as unknown as import("@/app/data/products").Product;

      addToCart(cartProduct, qty);

      setAdded(true);
      window.setTimeout(() => setAdded(false), 1500);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };

  const handleBuyNow = () => {
    if (!Number.isFinite(qty) || qty < minimumQty || qty > 9999) return;
    if (!p.inStock) return;

    const liveId = (p as unknown as Record<string, unknown>).productId as string | undefined;
    const fallbackId = liveId || p.sku || p.productCode;
    if (!fallbackId) return;

    try {
      const cartProduct = {
        id: String(fallbackId),
        name: p.name,
        brand: p.brand,
        sku: p.sku,
        pack: `Carton of ${minimumQty}`,
        rating: safeRating,
        reviews: reviewCount,
        discount: 0,
        mrp: p.priceTiers[0]?.price ?? 0,
        price: p.priceTiers[0]?.price ?? 0,
        bulkRate: p.priceTiers[0]?.price ?? 0,
        bulkMoq: minimumQty,
        moq: minimumQty,
        inStock: p.inStock,
        dispatch: p.deliveryEstimate,
        swatch: "#2563EB",
        accent: "#1E40AF",
      } as unknown as import("@/app/data/products").Product;

      addToCart(cartProduct, qty);
      router.push("/checkout");
    } catch (error) {
      console.error("Failed to buy now:", error);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div>

      {/* ======================================================
          BRAND
      ====================================================== */}

      <span className="
        text-[11.5px]
        font-bold
        text-blue
        tracking-wide
      ">
        {p.brand}
      </span>

      {/* ======================================================
          PRODUCT NAME
      ====================================================== */}

      <h1 className="
        font-sora
        font-bold
        text-[20px]
        sm:text-[23px]
        text-ink
        leading-snug
        mt-1
      ">
        {p.name}
      </h1>

      {/* ======================================================
          TAGS
      ====================================================== */}

      {p.tags.length > 0 && (
        <div className="
          flex
          flex-wrap
          items-center
          gap-2
          mt-2
        ">
          {p.tags.map((tag, index) => {
            if (!isValidString(tag)) {
              return null;
            }

            return (
              <span
                key={`${tag}-${index}`}
                className="
                  text-[10.5px]
                  font-semibold
                  text-green-deep
                  bg-green/10
                  border
                  border-green/20
                  px-2
                  py-1
                  rounded-md
                "
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}

      {/* ======================================================
          SKU / PRODUCT CODE
      ====================================================== */}

      <div className="
        flex
        flex-wrap
        items-center
        gap-x-3
        gap-y-1
        text-[11.5px]
        text-ink-faint
        mt-3
      ">
        <span>
          SKU: {p.sku}
        </span>

        <span>
          Product Code: {p.productCode}
        </span>
      </div>

      {/* ======================================================
          RATING
      ====================================================== */}

      <div className="
        flex
        flex-wrap
        items-center
        gap-2
        mt-2
      ">
        <div className="flex items-center gap-0.5">
          {Array.from({
            length: 5,
          }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={
                i < Math.round(safeRating)
                  ? "fill-amber text-amber"
                  : "text-line"
              }
            />
          ))}
        </div>

        <span className="
          text-[12.5px]
          font-semibold
          text-ink
        ">
          {safeRating.toFixed(1)}
        </span>

        <a
          href="#reviews"
          className="
            text-[12px]
            text-blue
            hover:underline
          "
        >
          {reviewCount.toLocaleString(
            "en-IN"
          )}{" "}
          Reviews
        </a>

        <span className="
          text-[12px]
          text-ink-faint
        ">
          {ordersFilled.toLocaleString(
            "en-IN"
          )}
          + Orders Filled
        </span>
      </div>

      {/* ======================================================
          STOCK
      ====================================================== */}

      <div className="
        flex
        flex-wrap
        items-center
        gap-3
        mt-3
      ">
        <span className="
          flex
          items-center
          gap-1.5
          text-[12.5px]
          font-semibold
          text-green-deep
        ">
          <CircleCheck
            size={14}
            className="
              fill-green-deep
              text-white
            "
          />

          In Stock
        </span>

        <span className="
          text-[12px]
          text-amber-600
          font-medium
        ">
          Minimum Order Quantity:{" "}
          {minimumQty} units per carton
        </span>
      </div>

      {/* ======================================================
          PRICE TIERS
      ====================================================== */}

      <div className="
        border
        border-line
        rounded-card
        mt-4
        overflow-hidden
      ">
        <div className="
          flex
          items-center
          justify-between
          bg-paper
          px-4
          py-2.5
          border-b
          border-line
        ">
          <span className="
            text-[11.5px]
            font-bold
            text-ink
            tracking-wide
          ">
            WHOLESALE PRICE TIERS
          </span>

          <span className="
            text-[10.5px]
            text-ink-faint
          ">
            GST Included
          </span>
        </div>

        {p.priceTiers.length > 0 && (
          <div className="divide-y divide-line">
            {p.priceTiers.map(
              (tier, index) => {
                if (
                  !tier ||
                  typeof tier !== "object"
                ) {
                  return null;
                }

                const range =
                  isValidString(
                    tier.range
                  )
                    ? tier.range
                    : `Tier ${index + 1}`;

                const price =
                  toSafeNumber(
                    tier.price
                  );

                const hasNote =
                  isValidString(
                    tier.note
                  );

                return (
                  <div
                    key={`${range}-${index}`}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                      px-4
                      py-2.5
                    "
                  >
                    <span className="
                      text-[12.5px]
                      text-ink-soft
                    ">
                      {range}
                    </span>

                    <span className="
                      flex
                      items-center
                      gap-2
                      shrink-0
                    ">
                      {hasNote && (
                        <span className="
                          text-[10.5px]
                          font-bold
                          text-green-deep
                          bg-green/10
                          px-1.5
                          py-0.5
                          rounded
                        ">
                          {tier.note}
                        </span>
                      )}

                      <span
                        className={`
                          text-[14px]
                          font-bold
                          ${
                            hasNote
                              ? "text-green-deep"
                              : "text-ink"
                          }
                        `}
                      >
                        ₹
                        {price.toLocaleString(
                          "en-IN"
                        )}

                        <span className="
                          text-[10.5px]
                          font-normal
                          text-ink-faint
                        ">
                          /unit
                        </span>
                      </span>
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* BULK NOTE */}

        <div className="
          px-4
          py-2.5
          bg-blue/[0.05]
          text-[11.5px]
          text-blue-deep
          flex
          items-start
          gap-1.5
        ">
          <Sparkles
            size={13}
            className="
              shrink-0
              mt-0.5
            "
          />

          {p.bulkNote}
        </div>
      </div>

      {/* ======================================================
          DELIVERY CHECK
      ====================================================== */}

      <div className="mt-4">

        <div className="
          text-[11.5px]
          font-bold
          text-ink
          tracking-wide
          mb-2
        ">
          DELIVERY CHECK
        </div>

        <div className="flex gap-2">

          <input
            value={pincode}
            onChange={(e) => {
              const value =
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);

              setPincode(value);

              if (pincodeError) {
                setPincodeError("");
              }
            }}
            placeholder="Enter Pincode / Address"
            inputMode="numeric"
            maxLength={6}
            aria-invalid={
              pincodeError
                ? true
                : undefined
            }
            className={`
              flex-1
              border
              rounded-lg
              px-3
              py-2.5
              text-[12.5px]
              outline-none
              ${
                pincodeError
                  ? "border-red-500 focus:border-red-500"
                  : "border-line focus:border-blue"
              }
            `}
          />

          <button
            type="button"
            onClick={
              handleCheckDelivery
            }
            className="
              bg-blue
              hover:bg-blue-deep
              transition-colors
              text-white
              text-[12.5px]
              font-semibold
              px-5
              rounded-lg
            "
          >
            Check
          </button>
        </div>

        {pincodeError && (
          <p
            role="alert"
            className="
              text-[10.5px]
              text-red-500
              mt-1.5
            "
          >
            {pincodeError}
          </p>
        )}

        {/* DELIVERY INFORMATION */}

        <div className="
          flex
          flex-col
          gap-1.5
          mt-2.5
          text-[11.5px]
          text-ink-soft
        ">
          <span className="
            flex
            items-center
            gap-1.5
          ">
            <Truck
              size={13}
              className="text-ink-faint"
            />

            Estimated Delivery:{" "}
            {p.deliveryEstimate}
          </span>

          {p.deliveryPerks.map(
            (perk, i) => {
              if (!isValidString(perk)) {
                return null;
              }

              return (
                <span
                  key={`${perk}-${i}`}
                  className={`
                    flex
                    items-center
                    gap-1.5
                    ${
                      i === 0
                        ? "text-green-deep font-medium"
                        : ""
                    }
                  `}
                >
                  {i === 0 ? (
                    <ShieldCheck size={13} />
                  ) : (
                    <Truck
                      size={13}
                      className="text-ink-faint"
                    />
                  )}

                  {perk}
                </span>
              );
            }
          )}
        </div>
      </div>

      {/* ======================================================
          QUANTITY + CARTON
      ====================================================== */}

      <div className="
        flex
        flex-col
        sm:flex-row
        gap-3
        mt-4
      ">

        {/* QUANTITY */}

        <div>
          <div className="
            text-[11px]
            font-semibold
            text-ink-soft
            mb-1.5
          ">
            QUANTITY
          </div>

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
              onClick={decreaseQty}
              disabled={
                qty <= minimumQty
              }
              aria-label="Decrease quantity"
              className="
                w-9
                h-10
                flex
                items-center
                justify-center
                text-ink-soft
                hover:bg-paper
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              <Minus size={14} />
            </button>

            <span
              aria-live="polite"
              className="
                w-10
                text-center
                text-[13.5px]
                font-semibold
              "
            >
              {qty}
            </span>

            <button
              type="button"
              onClick={increaseQty}
              disabled={qty >= 9999}
              aria-label="Increase quantity"
              className="
                w-9
                h-10
                flex
                items-center
                justify-center
                text-ink-soft
                hover:bg-paper
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* CARTON */}

        <div className="flex-1">
          <div className="
            text-[11px]
            font-semibold
            text-ink-soft
            mb-1.5
          ">
            CARTON
          </div>

          <div className="relative">

            <select
              value={carton}
              onChange={(e) =>
                setCarton(
                  e.target.value
                )
              }
              disabled={
                p.cartonOptions.length === 0
              }
              className="
                w-full
                appearance-none
                border
                border-line
                rounded-lg
                h-10
                px-3
                pr-9
                text-[12.5px]
                font-medium
                text-ink
                outline-none
                focus:border-blue
                disabled:opacity-50
              "
            >
              {p.cartonOptions.map(
                (option, index) => {
                  if (
                    !isValidString(
                      option
                    )
                  ) {
                    return null;
                  }

                  return (
                    <option
                      key={`${option}-${index}`}
                      value={option}
                    >
                      {option}
                    </option>
                  );
                }
              )}
            </select>

            <ChevronDown
              size={14}
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-ink-faint
                pointer-events-none
              "
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          CTA BUTTONS
      ====================================================== */}

      <div className="
        flex
        flex-col
        gap-2.5
        mt-4
      ">

        {/* ADD TO CART */}

        <button
          type="button"
          onClick={
            handleAddToCart
          }
          className={`
            transition-colors
            text-white
            font-bold
            text-[13px]
            tracking-wide
            py-3.5
            rounded-lg
            ${
              added
                ? "bg-green"
                : "bg-blue-deep hover:bg-navy"
            }
          `}
        >
          {added
            ? "ADDED TO WHOLESALE CART"
            : "ADD TO WHOLESALE CART"}
        </button>

        {/* BUY NOW */}

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!p.inStock}
          className="
            bg-green
            hover:bg-green-deep
            transition-colors
            text-white
            font-bold
            text-[13px]
            tracking-wide
            py-3.5
            rounded-lg
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          BUY NOW (INSTANT CHECKOUT)
        </button>

        {/* SECONDARY ACTIONS */}

        <div className="
          flex
          flex-wrap
          items-center
          gap-2.5
        ">
          <button
            type="button"
            className="
              flex-1
              min-w-[140px]
              border-2
              border-blue
              text-blue
              font-bold
              text-[12px]
              py-2.5
              rounded-lg
              hover:bg-blue
              hover:text-white
              transition-colors
            "
          >
            Request Custom Quote
          </button>

          <button
            type="button"
            className="
              flex-1
              min-w-[120px]
              text-ink-soft
              font-semibold
              text-[12px]
              border
              border-line
              py-2.5
              rounded-lg
              hover:border-navy
              hover:text-navy
              transition-colors
            "
          >
            Apply GST Invoice
          </button>

          <button
            type="button"
            aria-label="Share product"
            className="
              w-10
              h-10
              shrink-0
              border
              border-line
              rounded-lg
              flex
              items-center
              justify-center
              text-ink-soft
              hover:border-navy
              hover:text-navy
              transition-colors
            "
          >
            <Share2 size={15} />
          </button>

          <button
            type="button"
            aria-label="Compare product"
            className="
              w-10
              h-10
              shrink-0
              border
              border-line
              rounded-lg
              flex
              items-center
              justify-center
              text-ink-soft
              hover:border-navy
              hover:text-navy
              transition-colors
            "
          >
            <Scale size={15} />
          </button>
        </div>
      </div>

      {/* ======================================================
          TRUST BADGES
      ====================================================== */}

      {p.trustBadges.length > 0 && (
        <>
          <div className="
            text-[11px]
            text-ink-faint
            mt-4
            mb-2
          ">
            Trusted Bulk Buyers Choose This
            Product For:
          </div>

          <div className="
            grid
            grid-cols-2
            sm:grid-cols-5
            gap-2
          ">
            {p.trustBadges.map(
              (badge, i) => {
                if (!isValidString(badge)) {
                  return null;
                }

                const Icon =
                  BADGE_ICONS[
                    i %
                      BADGE_ICONS.length
                  ];

                return (
                  <div
                    key={`${badge}-${i}`}
                    className="
                      flex
                      flex-col
                      items-center
                      gap-1.5
                      border
                      border-line
                      rounded-lg
                      py-2.5
                      px-1
                    "
                  >
                    <Icon
                      size={16}
                      className="text-blue"
                    />

                    <span className="
                      text-[9.5px]
                      font-semibold
                      text-ink-soft
                      text-center
                      leading-tight
                    ">
                      {badge}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </>
      )}
    </div>
  );
}