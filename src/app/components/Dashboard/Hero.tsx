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
          h-[340px]
          overflow-hidden
          rounded-card
          bg-navy
          sm:h-[420px]
        "
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #2B57FF 0%, transparent 70%)" }}
        />

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
              mb-4
              inline-flex
              w-fit
              items-center
              gap-1.5
              rounded-pill
              bg-white/10
              px-3
              py-1.5
              text-[10.5px]
              font-bold
              tracking-wide
              text-white
              backdrop-blur-sm
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            B2B & D2C Wholesale Marketplace
          </span>

          <h1
            className="
              font-sora
              text-[28px]
              font-extrabold
              leading-[1.12]
              text-white
              sm:text-[38px]
            "
          >
            Your Complete FMCG Supply Partner
          </h1>

          <p
            className="
              mt-3
              max-w-[460px]
              text-[13.5px]
              leading-relaxed
              text-white/75
              sm:text-[14.5px]
            "
          >
            Direct manufacturer sourcing, unified B2B
            bulk ordering, and reliable door-step
            logistics. Empowering retail stores,
            restaurants, and corporate environments.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="
                flex
                items-center
                gap-2
                rounded-pill
                bg-blue
                px-6
                py-3.5
                text-[13px]
                font-bold
                text-white
                shadow-pop
                transition-all
                hover:bg-blue-deep
                hover:-translate-y-0.5
                focus:outline-none
                focus:ring-2
                focus:ring-blue/40
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
                glass-navy
                flex
                items-center
                gap-2
                rounded-pill
                px-6
                py-3.5
                text-[13px]
                font-bold
                text-white
                transition-all
                hover:bg-white/10
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
        h-[340px]
        overflow-hidden
        rounded-card
        sm:h-[420px]
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
              overflow-hidden
              transition-opacity
              duration-[1200ms]
              ease-out
              ${
                isActive
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
          >
            <div
              className={`
                absolute
                inset-0
                bg-cover
                bg-center
                ${
                  isActive
                    ? "animate-[azHeroZoom_7s_ease-out_forwards]"
                    : ""
                }
              `}
              style={{
                backgroundImage: `url("${src}")`,
              }}
            />
          </div>
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
            "linear-gradient(105deg, #0A1F44E6 0%, #0A1F44B3 38%, #0A1F4433 75%, transparent 100%)",
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
          az-fade-up
        "
      >
        {/* BADGE */}

        <span
          className="
            mb-4
            inline-flex
            w-fit
            items-center
            gap-1.5
            rounded-pill
            bg-white/10
            px-3
            py-1.5
            text-[10.5px]
            font-bold
            tracking-wide
            text-white
            backdrop-blur-sm
          "
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green" />
          B2B & D2C Wholesale Marketplace
        </span>

        {/* TITLE */}

        <h1
          className="
            font-sora
            text-[28px]
            font-extrabold
            leading-[1.12]
            text-white
            sm:text-[38px]
          "
        >
          Your Complete FMCG Supply Partner
        </h1>

        {/* DESCRIPTION */}

        <p
          className="
            mt-3
            max-w-[460px]
            text-[13.5px]
            leading-relaxed
            text-white/75
            sm:text-[14.5px]
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
            mt-6
            flex
            flex-wrap
            items-center
            gap-3
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
              rounded-pill
              bg-blue
              px-6
              py-3.5
              text-[13px]
              font-bold
              text-white
              shadow-pop
              transition-all
              hover:bg-blue-deep
              hover:-translate-y-0.5
              focus:outline-none
              focus:ring-2
              focus:ring-blue/40
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
              glass-navy
              flex
              items-center
              gap-2
              rounded-pill
              px-6
              py-3.5
              text-[13px]
              font-bold
              text-white
              transition-all
              hover:bg-white/10
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
            glass-navy
            absolute
            bottom-4
            right-4
            flex
            items-center
            gap-1.5
            rounded-pill
            px-2.5
            py-2
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