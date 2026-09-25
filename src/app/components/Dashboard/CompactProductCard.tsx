// File: app/components/Dashboard/CompactProductCard.tsx
"use client";

import Image from "next/image";

type CompactProductCardProps = {
  name: string;
  price: number;
  swatch: string;
  image?: string;
};

/* ============================================================
   VALIDATION HELPERS
============================================================ */

function getSafeName(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return "Product";
  }

  return value.trim();
}

function getSafePrice(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return value;
}

function getSafeSwatch(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return "#E5E7EB";
  }

  const swatch = value.trim();

  /*
   * Allow common CSS color formats:
   * #fff
   * #ffffff
   * rgb(...)
   * rgba(...)
   * hsl(...)
   * hsla(...)
   * named CSS colors
   */
  const isHex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(
    swatch
  );

  const isRgb =
    /^rgba?\(\s*[\d.\s%,]+\)$/.test(swatch);

  const isHsl =
    /^hsla?\(\s*[\d.\s%,deg]+\)$/.test(swatch);

  const isNamedColor =
    /^[A-Za-z]+$/.test(swatch);

  if (
    !isHex &&
    !isRgb &&
    !isHsl &&
    !isNamedColor
  ) {
    return "#E5E7EB";
  }

  return swatch;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function CompactProductCard({
  name,
  price,
  swatch,
  image,
}: CompactProductCardProps) {
  const safeName = getSafeName(name);
  const safePrice = getSafePrice(price);
  const safeSwatch = getSafeSwatch(swatch);

  const formattedPrice =
    safePrice.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const handleAddToCart = () => {
    /*
     * Add your cart logic here.
     *
     * Example:
     * addToCart({
     *   name: safeName,
     *   price: safePrice,
     *   swatch: safeSwatch,
     * });
     */

    console.log("Add to cart:", {
      name: safeName,
      price: safePrice,
      swatch: safeSwatch,
    });
  };

  return (
    <article
      aria-label={`${safeName} product`}
      className="
        w-[150px]
        shrink-0
        overflow-hidden
        rounded-card
        border
        border-line
        bg-white
        sm:w-auto
      "
    >
      {/* ======================================================
          PRODUCT PREVIEW
      ====================================================== */}

      <div
        aria-hidden="true"
        className="flex h-24 items-center justify-center overflow-hidden bg-white border-b border-line"
      >
        {image ? (
          <Image
            src={image}
            alt={safeName}
            width={96}
            height={96}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(160deg, ${safeSwatch}22, ${safeSwatch}0A)`,
            }}
          >
            <div
              className="h-14 w-9 rounded-sm"
              style={{
                background: `linear-gradient(160deg, ${safeSwatch}, ${safeSwatch}CC)`,
              }}
            />
          </div>
        )}
      </div>

      {/* ======================================================
          PRODUCT DETAILS
      ====================================================== */}

      <div className="p-2.5">
        <div
          title={safeName}
          className="
            min-h-[30px]
            line-clamp-2
            text-[11.5px]
            font-semibold
            leading-snug
            text-ink
          "
        >
          {safeName}
        </div>

        {/* ====================================================
            PRICE
        ==================================================== */}

        <div
          className="
            mt-1
            text-[13px]
            font-bold
            text-navy
          "
          aria-label={`Price ₹${formattedPrice}`}
        >
          ₹{formattedPrice}
        </div>

        {/* ====================================================
            ADD TO CART
        ==================================================== */}

        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={`Add ${safeName} to cart`}
          className="
            mt-2
            w-full
            rounded-md
            border
            border-blue
            py-1.5
            text-[10.5px]
            font-bold
            text-blue
            transition-colors
            hover:bg-blue
            hover:text-white
            focus:outline-none
            focus:ring-2
            focus:ring-blue/30
            focus:ring-offset-1
            active:scale-[0.98]
          "
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}