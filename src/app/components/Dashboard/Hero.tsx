// File: app/components/Dashboard/Hero.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PhoneCall, Grid2x2 } from "lucide-react";

/* ============================================================
   SLIDES
============================================================ */

const SLIDE_IMAGES = [
  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1749244768351-2726dc23d26c?auto=format&fit=crop&w=1600&q=80",
  "/Images/Hero.jpeg",
  "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1600&q=80",
] as const;

const SLIDE_INTERVAL = 5000;

/* ============================================================
   VALIDATION
============================================================ */

function isValidImageSource(
  value: unknown
): value is string {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return false;
  }

  const source = value.trim();

  return (
    source.startsWith("/") ||
    source.startsWith("https://") ||
    source.startsWith("http://")
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Hero() {
  /* ==========================================================
     SAFE SLIDES
  ========================================================== */

  const validSlides = SLIDE_IMAGES.filter(
    isValidImageSource
  );

  /* ==========================================================
     SLIDE STATE
  ========================================================== */

  const [slide, setSlide] = useState(0);

  /* ==========================================================
     AUTO SLIDE
  ========================================================== */

  useEffect(() => {
    if (validSlides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setSlide((current) => {
        const next =
          current + 1;

        return next >= validSlides.length
          ? 0
          : next;
      });
    }, SLIDE_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [validSlides.length]);

  /* ==========================================================
     SAFETY CHECK
  ========================================================== */

  const safeSlide =
    slide >= 0 &&
    slide < validSlides.length
      ? slide
      : 0;

  /* ==========================================================
     EMPTY IMAGE FALLBACK
  ========================================================== */

  if (validSlides.length === 0) {
    return (
      <section
        aria-label="Aanzara wholesale marketplace"
        className="
          relative
          h-[300px]
          overflow-hidden
          rounded-card
          bg-navy
          sm:h-[340px]
        "
      >
        <div
          className="
            relative
            flex
            h-full
            max-w-[600px]
            flex-col
            justify-center
            px-6
            py-8
            sm:px-10
          "
        >
          <span
            className="
              mb-3
              inline-flex
              w-fit
              items-center
              rounded-md
              bg-green
              px-2.5
              py-1
              text-[10px]
              font-bold
              tracking-wide
              text-white
            "
          >
            B2B & D2C WHOLESALE MARKETPLACE
          </span>

          <h1
            className="
              font-sora
              text-[26px]
              font-extrabold
              leading-[1.15]
              text-white
              sm:text-[34px]
            "
          >
            Your Complete FMCG Supply Partner
          </h1>

          <p
            className="
              mt-3
              max-w-[460px]
              text-[13px]
              leading-relaxed
              text-white/80
              sm:text-[13.5px]
            "
          >
            Direct manufacturer sourcing, unified B2B
            bulk ordering, and reliable door-step
            logistics. Empowering retail stores,
            restaurants, and corporate environments.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Link
              href="/contact"
              className="
                flex
                items-center
                gap-2
                rounded-lg
                bg-green
                px-5
                py-3
                text-[12.5px]
                font-bold
                text-white
                transition-colors
                hover:bg-green-deep
                focus:outline-none
                focus:ring-2
                focus:ring-green/40
                focus:ring-offset-2
                focus:ring-offset-navy
              "
            >
              <PhoneCall
                size={14}
                aria-hidden="true"
              />
              Bulk Enquiry
            </Link>

            <Link
              href="/categories"
              className="
                flex
                items-center
                gap-2
                rounded-lg
                bg-white
                px-5
                py-3
                text-[12.5px]
                font-bold
                text-ink
                transition-colors
                hover:bg-paper
                focus:outline-none
                focus:ring-2
                focus:ring-white/50
                focus:ring-offset-2
                focus:ring-offset-navy
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
      </section>
    );
  }

  /* ==========================================================
     MAIN RENDER
  ========================================================== */

  return (
    <section
      aria-label="Aanzara wholesale marketplace hero"
      className="
        relative
        h-[300px]
        overflow-hidden
        rounded-card
        sm:h-[340px]
      "
    >
      {/* ======================================================
          SLIDES
      ====================================================== */}

      {validSlides.map((src, index) => {
        const isActive =
          safeSlide === index;

        return (
          <div
            key={`${src}-${index}`}
            aria-hidden={!isActive}
            className={`
              absolute
              inset-0
              bg-cover
              bg-center
              transition-opacity
              duration-700
              ${
                isActive
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
            style={{
              backgroundImage: `url("${src}")`,
            }}
          />
        );
      })}

      {/* ======================================================
          OVERLAY
      ====================================================== */}

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, #0B1E4Bb3 0%, #0B1E4B99 35%, #0B1E4B80 100%)",
        }}
      />

      {/* ======================================================
          HERO CONTENT
      ====================================================== */}

      <div
        className="
          relative
          flex
          h-full
          max-w-[600px]
          flex-col
          justify-center
          px-6
          py-8
          sm:px-10
        "
      >
        {/* BADGE */}

        <span
          className="
            mb-3
            inline-flex
            w-fit
            items-center
            rounded-md
            bg-green
            px-2.5
            py-1
            text-[10px]
            font-bold
            tracking-wide
            text-white
          "
        >
          B2B & D2C WHOLESALE MARKETPLACE
        </span>

        {/* TITLE */}

        <h1
          className="
            font-sora
            text-[26px]
            font-extrabold
            leading-[1.15]
            text-white
            sm:text-[34px]
          "
        >
          Your Complete FMCG Supply Partner
        </h1>

        {/* DESCRIPTION */}

        <p
          className="
            mt-3
            max-w-[460px]
            text-[13px]
            leading-relaxed
            text-white/80
            sm:text-[13.5px]
          "
        >
          Direct manufacturer sourcing, unified B2B
          bulk ordering, and reliable door-step
          logistics. Empowering retail stores,
          restaurants, and corporate environments.
        </p>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div
          className="
            mt-5
            flex
            flex-wrap
            items-center
            gap-2.5
          "
        >
          {/* BULK ENQUIRY */}

          <Link
            href="/contact"
            aria-label="Go to contact page for bulk enquiry"
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-green
              px-5
              py-3
              text-[12.5px]
              font-bold
              text-white
              transition-colors
              hover:bg-green-deep
              focus:outline-none
              focus:ring-2
              focus:ring-green/40
              focus:ring-offset-2
              focus:ring-offset-navy
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
            aria-label="Explore product categories"
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-white
              px-5
              py-3
              text-[12.5px]
              font-bold
              text-ink
              transition-colors
              hover:bg-paper
              focus:outline-none
              focus:ring-2
              focus:ring-white/50
              focus:ring-offset-2
              focus:ring-offset-navy
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

      {/* ======================================================
          SLIDE CONTROLS
      ====================================================== */}

      {validSlides.length > 1 && (
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
          {validSlides.map((_, index) => {
            const isActive =
              safeSlide === index;

            return (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show slide ${
                  index + 1
                }`}
                onClick={() =>
                  setSlide(index)
                }
                className={`
                  h-1.5
                  rounded-pill
                  transition-all
                  focus:outline-none
                  focus:ring-2
                  focus:ring-white/60
                  focus:ring-offset-1
                  focus:ring-offset-transparent
                  ${
                    isActive
                      ? "w-5 bg-green"
                      : "w-1.5 bg-white/50 hover:bg-white/80"
                  }
                `}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}