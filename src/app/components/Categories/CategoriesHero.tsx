// File: app/components/Categories/CategoriesHero.tsx

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
    /^https?:\/\//i.test(
      backgroundImage
    );

  const validTitle =
    typeof title === "string" &&
    title.trim().length > 0;

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
        h-[220px]
        sm:h-[260px]
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
          OVERLAY
      ================================================== */}

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, #0B1E4Bd9 0%, #0C7F4Fb3 100%)",
        }}
        aria-hidden="true"
      />

      {/* =================================================
          CONTENT
      ================================================== */}

      <div
        className="
          relative
          h-full
          flex
          flex-col
          items-center
          justify-center
          text-center
          px-6
        "
      >
        {/* TITLE */}

        <h1
          id="categories-hero-title"
          className="
            font-sora
            font-extrabold
            text-white
            text-[26px]
            sm:text-[32px]
            leading-tight
          "
        >
          {title}
        </h1>

        {/* DESCRIPTION */}

        <p
          className="
            text-white/80
            text-[13px]
            sm:text-[13.5px]
            mt-2
            max-w-[520px]
            leading-relaxed
          "
        >
          {description}
        </p>
      </div>
    </section>
  );
}