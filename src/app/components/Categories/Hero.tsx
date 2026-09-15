// File: app/components/Home/Hero.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  PhoneCall,
  Grid2x2,
} from "lucide-react";

// =====================================================
// SLIDE IMAGES
// =====================================================

const SLIDE_IMAGES = [
  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1749244768351-2726dc23d26c?auto=format&fit=crop&w=1600&q=80",
  "/Hero/pexels-freestocks-1366594.jpg",
  "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1600&q=80",
] as const;

// =====================================================
// CONFIGURATION
// =====================================================

const SLIDE_INTERVAL = 5000;

// =====================================================
// URL VALIDATION
// =====================================================

function isValidImageSource(
  src: unknown
): src is string {
  if (typeof src !== "string") {
    return false;
  }

  const value = src.trim();

  if (!value) {
    return false;
  }

  // Allow local Next.js public paths
  if (value.startsWith("/")) {
    return true;
  }

  // Allow HTTP / HTTPS image URLs
  return /^https?:\/\//i.test(value);
}

// =====================================================
// VALID SLIDES
// =====================================================

const VALID_SLIDE_IMAGES =
  Array.isArray(SLIDE_IMAGES)
    ? SLIDE_IMAGES.filter(
        isValidImageSource
      )
    : [];

// =====================================================
// HERO COMPONENT
// =====================================================

export default function Hero() {
  // ===================================================
  // SLIDE STATE
  // ===================================================

  const [slide, setSlide] = useState(0);

  // ===================================================
  // SAFE SLIDE INDEX
  // ===================================================

  const safeSlide =
    VALID_SLIDE_IMAGES.length > 0
      ? Math.min(
          Math.max(slide, 0),
          VALID_SLIDE_IMAGES.length - 1
        )
      : 0;

  // ===================================================
  // AUTO SLIDER
  // ===================================================

  useEffect(() => {
    // No valid slides
    if (
      VALID_SLIDE_IMAGES.length <= 1
    ) {
      return;
    }

    // Validate interval
    if (
      !Number.isFinite(
        SLIDE_INTERVAL
      ) ||
      SLIDE_INTERVAL <= 0
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setSlide((current) => {
        const next =
          current + 1;

        return next >=
          VALID_SLIDE_IMAGES.length
          ? 0
          : next;
      });
    }, SLIDE_INTERVAL);

    return () =>
      window.clearInterval(timer);
  }, []);

  // ===================================================
  // MANUAL SLIDE CHANGE
  // ===================================================

  const handleSlideChange = (
    index: number
  ) => {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >=
        VALID_SLIDE_IMAGES.length
    ) {
      return;
    }

    setSlide(index);
  };

  // ===================================================
  // EMPTY SLIDE FALLBACK
  // ===================================================

  if (
    VALID_SLIDE_IMAGES.length === 0
  ) {
    return (
      <section
        role="alert"
        className="
          relative
          rounded-card
          overflow-hidden
          h-[300px]
          sm:h-[340px]
          bg-navy
          flex
          items-center
          px-6
          sm:px-10
        "
      >
        <div>
          <h1 className="font-sora font-extrabold text-white text-[26px] sm:text-[34px] leading-[1.15]">
            Your Complete FMCG Supply Partner
          </h1>

          <p className="text-white/80 text-[13px] mt-3 max-w-[460px]">
            Product information is currently unavailable.
          </p>
        </div>
      </section>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section
      aria-label="Aanzara FMCG marketplace hero"
      className="
        relative
        rounded-card
        overflow-hidden
        h-[300px]
        sm:h-[340px]
      "
    >
      {/* =================================================
          SLIDES
      ================================================== */}

      {VALID_SLIDE_IMAGES.map(
        (src, index) => (
          <div
            key={`${src}-${index}`}
            className={`
              absolute
              inset-0
              bg-cover
              bg-center
              transition-opacity
              duration-700
              ${
                safeSlide === index
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
            style={{
              backgroundImage: `url("${src}")`,
            }}
            aria-hidden={
              safeSlide !== index
            }
          />
        )
      )}

      {/* =================================================
          OVERLAY
      ================================================== */}

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, #0B1E4Bb3 0%, #0B1E4B99 35%, #0B1E4B80 100%)",
        }}
        aria-hidden="true"
      />

      {/* =================================================
          CONTENT
      ================================================== */}

      <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 py-8 max-w-[600px]">

        {/* BADGE */}

        <span
          className="
            inline-flex
            w-fit
            items-center
            bg-green
            text-white
            text-[10px]
            font-bold
            tracking-wide
            px-2.5
            py-1
            rounded-md
            mb-3
          "
        >
          B2B &amp; D2C WHOLESALE MARKETPLACE
        </span>

        {/* TITLE */}

        <h1
          className="
            font-sora
            font-extrabold
            text-white
            text-[26px]
            sm:text-[34px]
            leading-[1.15]
          "
        >
          Your Complete FMCG Supply Partner
        </h1>

        {/* DESCRIPTION */}

        <p
          className="
            text-white/80
            text-[13px]
            sm:text-[13.5px]
            mt-3
            leading-relaxed
            max-w-[460px]
          "
        >
          Direct manufacturer sourcing, unified B2B bulk ordering, and
          reliable door-step logistics. Empowering retail stores,
          restaurants, and corporate environments.
        </p>

        {/* =================================================
            CTA BUTTONS
        ================================================== */}

        <div className="flex flex-wrap items-center gap-2.5 mt-5">

          {/* SHOP NOW */}

          <Link
            href="/"
            aria-label="Shop now"
            className="
              flex
              items-center
              gap-2
              bg-blue-deep
              hover:bg-blue
              transition-colors
              text-white
              text-[12.5px]
              font-bold
              px-5
              py-3
              rounded-lg
            "
          >
            Shop Now

            <ArrowRight
              size={14}
              aria-hidden="true"
            />
          </Link>

          {/* BULK ENQUIRY */}

          <Link
            href="/contact?type=bulk-enquiry"
            aria-label="Make a bulk enquiry"
            className="
              flex
              items-center
              gap-2
              bg-green
              hover:bg-green-deep
              transition-colors
              text-white
              text-[12.5px]
              font-bold
              px-5
              py-3
              rounded-lg
            "
          >
            <PhoneCall
              size={14}
              aria-hidden="true"
            />

            Bulk Enquiry
          </Link>

          {/* EXPLORE CATEGORIES */}

          <Link
            href="/categories"
            aria-label="Explore categories"
            className="
              flex
              items-center
              gap-2
              bg-white
              hover:bg-paper
              transition-colors
              text-ink
              text-[12.5px]
              font-bold
              px-5
              py-3
              rounded-lg
            "
          >
            <Grid2x2
              size={14}
              aria-hidden="true"
            />

            Explore Categories
          </Link>

        </div>
      </div>

      {/* =================================================
          SLIDE INDICATORS
      ================================================== */}

      {VALID_SLIDE_IMAGES.length > 1 && (
        <div
          className="
            absolute
            bottom-4
            right-6
            flex
            items-center
            gap-1.5
          "
          role="tablist"
          aria-label="Hero slides"
        >
          {VALID_SLIDE_IMAGES.map(
            (_, index) => {
              const isActive =
                safeSlide === index;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    handleSlideChange(
                      index
                    )
                  }
                  role="tab"
                  aria-selected={
                    isActive
                  }
                  aria-label={`Show slide ${
                    index + 1
                  }`}
                  className={`
                    h-1.5
                    rounded-pill
                    transition-all
                    ${
                      isActive
                        ? "w-5 bg-green"
                        : "w-1.5 bg-white/50"
                    }
                  `}
                />
              );
            }
          )}
        </div>
      )}
    </section>
  );
}