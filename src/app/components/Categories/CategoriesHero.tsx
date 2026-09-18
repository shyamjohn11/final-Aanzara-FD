import { ArrowRight, LayoutGrid } from "lucide-react";

export default function CategoriesHero() {
  // =====================================================
  // HERO CONFIGURATION
  // =====================================================

  const backgroundImage =
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=80";

  const title = "Shop by Categories";

  const description =
    "Browse thousands of FMCG products across all business and retail categories. Direct dispatch from distributor partners at unbeatable bulk prices.";

  // =====================================================
  // VALIDATION
  // =====================================================

  const validBackgroundImage =
    typeof backgroundImage === "string" &&
    backgroundImage.trim().length > 0 &&
    /^https?:\/\/.+/i.test(backgroundImage);

  const validTitle =
    typeof title === "string" && title.trim().length > 0;

  const validDescription =
    typeof description === "string" &&
    description.trim().length > 0;

  // =====================================================
  // FALLBACK
  // =====================================================

  if (!validTitle || !validDescription) {
    return (
      <section
        role="alert"
        className="
          relative
          rounded-card
          overflow-hidden
          h-[220px]
          sm:h-[260px]
          bg-navy
          flex
          items-center
          justify-center
          text-center
          px-6
        "
      >
        <p className="text-white text-[13px]">
          Category information is currently unavailable.
        </p>
      </section>
    );
  }

  // =====================================================
  // HERO
  // =====================================================

  return (
    <section
      aria-labelledby="categories-hero-title"
      className="
        relative
        rounded-card
        overflow-hidden
        h-[360px]
        sm:h-[400px]
      "
    >
      {/* =================================================
          BACKGROUND IMAGE
      ================================================== */}

      {validBackgroundImage && (
        <div
          className="
            absolute
            inset-0
            bg-cover
            bg-center
          "
          style={{
            backgroundImage: `url("${backgroundImage}")`,
          }}
          role="img"
          aria-label="FMCG wholesale products"
        />
      )}

      {/* =================================================
          LEFT SIDE OVERLAY
      ================================================== */}

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, #0B1E4B33 0%, transparent 45%)",
        }}
        aria-hidden="true"
      />

      {/* =================================================
          CENTERED WHITE CONTENT CARD
      ================================================== */}

      <div
        className="
          absolute
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2
          bg-white
          rounded-2xl
          shadow-2xl
          px-6
          py-6
          w-[88%]
          sm:w-[400px]
        "
      >
        {/* =================================================
            LABEL
        ================================================== */}

        <span
          className="
            inline-flex
            items-center
            gap-1.5
            text-[#0C7F4F]
            bg-[#0C7F4F]/10
            text-[11px]
            font-bold
            uppercase
            tracking-wide
            px-2.5
            py-1
            rounded-full
            mb-3
          "
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Explore the Catalog
        </span>

        {/* =================================================
            TITLE
        ================================================== */}

        <h1
          id="categories-hero-title"
          className="
            font-sora
            font-extrabold
            text-[#0B1E4B]
            text-[22px]
            sm:text-[26px]
            leading-tight
          "
        >
          {title}
        </h1>

        {/* =================================================
            DESCRIPTION
        ================================================== */}

        <p
          className="
            text-[#5B6B8C]
            text-[12.5px]
            mt-2
            leading-relaxed
          "
        >
          {description}
        </p>

        {/* =================================================
            BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            document
              .querySelector(
                'section[aria-label="All product categories"]'
              )
              ?.scrollIntoView({
                behavior: "smooth",
              })
          }
          className="
            inline-flex
            items-center
            gap-2
            bg-[#0C7F4F]
            text-white
            font-semibold
            text-[12.5px]
            px-4
            py-2.5
            rounded-full
            mt-4
          "
        >
          Browse All Categories

          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
}
