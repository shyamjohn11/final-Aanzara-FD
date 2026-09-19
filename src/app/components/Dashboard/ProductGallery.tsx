// File: app/components/Dashboard/ProductGallery.tsx
"use client";

import { useState } from "react";
import { Expand, AlertCircle } from "lucide-react";

type ProductGalleryProps = {
  images: string[];
  count: number;
};

export default function ProductGallery({
  images,
  count,
}: ProductGalleryProps) {
  /* ============================================================
     FULL DATA VALIDATION
  ============================================================ */

  const validImages = Array.isArray(images)
    ? images.filter(
        (image): image is string =>
          typeof image === "string" &&
          image.trim().length > 0
      )
    : [];

  const numericCount =
    typeof count === "number" &&
    Number.isFinite(count) &&
    count > 0
      ? Math.floor(count)
      : validImages.length;

  const safeCount = Math.min(
    Math.max(numericCount, 1),
    validImages.length || 1
  );

  return (
    <ValidatedProductGallery
      images={validImages}
      count={safeCount}
    />
  );
}

/* ============================================================
   VALIDATED GALLERY
============================================================ */

function ValidatedProductGallery({
  images,
  count,
}: {
  images: string[];
  count: number;
}) {
  const [active, setActive] = useState(0);

  /* ============================================================
     EMPTY STATE
  ============================================================ */

  if (images.length === 0) {
    return (
      <div
        role="status"
        className="
          bg-white
          border
          border-line
          rounded-card
          h-[280px]
          sm:h-[380px]
          flex
          flex-col
          items-center
          justify-center
          text-center
          p-5
        "
      >
        <AlertCircle
          size={24}
          className="text-ink-faint mb-2"
        />

        <p className="text-[12.5px] font-semibold text-ink">
          Product images unavailable
        </p>

        <p className="text-[11px] text-ink-soft mt-1">
          No valid gallery images were provided.
        </p>
      </div>
    );
  }

  /* ============================================================
     SAFE ACTIVE INDEX
  ============================================================ */

  const safeActive =
    active >= 0 && active < images.length
      ? active
      : 0;

  const activeImage = images[safeActive];

  /* ============================================================
      IMAGE vs COLOR DETECTION
      - Streaming URLs: /api/v1/products/.../file or http(s)://
      - Otherwise treat as color like "#2448C4"
  ============================================================ */

  const isImageUrl = (value: string) => {
    const v = value.trim();
    return v.startsWith("/api/") || v.startsWith("/uploads/") || /^https?:\/\//i.test(v);
  };

  const isValidColor = (value: string) => {
    const color = value.trim();

    return (
      /^#[0-9A-Fa-f]{3,8}$/.test(color) ||
      /^rgba?\([^)]*\)$/.test(color) ||
      /^hsla?\([^)]*\)$/.test(color)
    );
  };

  const activeIsImage = isImageUrl(activeImage);
  const safeColor = !activeIsImage && isValidColor(activeImage) ? activeImage : "#E4E8EF";

  /* ============================================================
     DISPLAY COUNT
  ============================================================ */

  const displayCount = Math.min(
    Math.max(count, 1),
    images.length
  );

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div>
      {/* ======================================================
          MAIN IMAGE
      ====================================================== */}

      <div
        className="
          relative
          bg-white
          border
          border-line
          rounded-card
          h-[280px]
          sm:h-[380px]
          flex
          items-center
          justify-center
          overflow-hidden
        "
        style={{
          background: `linear-gradient(
            160deg,
            ${safeColor}1A,
            ${safeColor}0A
          )`,
        }}
      >
        {/* EXPAND */}

        <button
          type="button"
          aria-label="Expand product image"
          className="
            absolute
            top-3
            right-3
            w-8
            h-8
            rounded-full
            bg-white
            shadow
            flex
            items-center
            justify-center
            text-ink-soft
            hover:text-navy
            hover:scale-105
            transition-all
          "
        >
          <Expand size={14} />
        </button>

        {/* PRODUCT IMAGE */}
        {activeIsImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeImage}
            alt={`Product image ${safeActive + 1}`}
            className="max-h-[240px] sm:max-h-[340px] max-w-[90%] object-contain rounded-lg"
            loading="eager"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div
            className="
              w-24
              sm:w-28
              h-36
              sm:h-44
              rounded-lg
              shadow-md
            "
            style={{
              background: `linear-gradient(
                160deg,
                ${safeColor},
                ${safeColor}CC
              )`,
            }}
            role="img"
            aria-label={`Product image ${safeActive + 1}`}
          />
        )}

        {/* IMAGE COUNTER */}

        <span className="
          absolute
          bottom-3
          right-3
          bg-navy/80
          text-white
          text-[10.5px]
          font-semibold
          px-2
          py-1
          rounded-md
        ">
          {safeActive + 1}/{displayCount}
        </span>
      </div>

      {/* ======================================================
          THUMBNAILS
      ====================================================== */}

      <div
        className="
          flex
          items-center
          gap-2.5
          mt-3
          overflow-x-auto
          pb-1
        "
      >
        {images.map((value, i) => {
          const thumbIsImage = isImageUrl(value);
          const safeThumbnailColor = !thumbIsImage && isValidColor(value) ? value : "#E4E8EF";
          const isActive = safeActive === i;

          return (
            <button
              key={`${value}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show product image ${i + 1}`}
              aria-current={isActive ? "true" : undefined}
              className={`
                w-14
                h-14
                sm:w-16
                sm:h-16
                rounded-lg
                border-2
                flex
                items-center
                justify-center
                shrink-0
                overflow-hidden
                transition-colors
                ${isActive ? "border-blue" : "border-line hover:border-blue/50"}
              `}
              style={
                thumbIsImage
                  ? { background: "#fff" }
                  : {
                      background: `linear-gradient(160deg, ${safeThumbnailColor}22, ${safeThumbnailColor}0A)`,
                    }
              }
            >
              {thumbIsImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="w-5 h-8 rounded-sm" style={{ background: safeThumbnailColor }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}