import { ArrowRight, Store } from "lucide-react";

interface HeroStat {
  value: string;
  label: string;
}

interface NearbyHeroContent {
  badge: string;
  title: string;
  description: string;
  backgroundImage: string;
  stats: HeroStat[];
}

/* --------------------------------
 * Default / fallback values
 * -------------------------------- */

const DEFAULT_BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80";

const DEFAULT_HERO: NearbyHeroContent = {
  badge: "LOCAL OFFERS REFRESHED IN REAL-TIME",
  title: "Discover Real-Time Store Discounts Near You",
  description:
    "Find nearby deals from top-rated supermarkets, fashion outlets, electronics stores, restaurants, and more. Verified offers, updated every day.",
  backgroundImage: DEFAULT_BACKGROUND_IMAGE,
  stats: [
    {
      value: "450+",
      label: "Active Verified Offers Today",
    },
    {
      value: "120+",
      label: "Partner Stores On-boarded",
    },
  ],
};

/* --------------------------------
 * Text validation
 * -------------------------------- */

function getSafeText(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return fallback;
  }

  return value.trim();
}

/* --------------------------------
 * URL validation
 * -------------------------------- */

function getSafeImageUrl(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_BACKGROUND_IMAGE;
  }

  const trimmedUrl = value.trim();

  if (!trimmedUrl) {
    return DEFAULT_BACKGROUND_IMAGE;
  }

  try {
    const url = new URL(trimmedUrl);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return DEFAULT_BACKGROUND_IMAGE;
    }

    return url.toString();
  } catch {
    return DEFAULT_BACKGROUND_IMAGE;
  }
}

/* --------------------------------
 * Stat validation
 * -------------------------------- */

function isValidStat(
  value: unknown,
): value is HeroStat {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const stat = value as Record<string, unknown>;

  return (
    typeof stat.value === "string" &&
    stat.value.trim().length > 0 &&
    typeof stat.label === "string" &&
    stat.label.trim().length > 0
  );
}

function getSafeStats(
  stats: unknown,
): HeroStat[] {
  if (!Array.isArray(stats)) {
    return DEFAULT_HERO.stats;
  }

  const safeStats = stats
    .filter(isValidStat)
    .map((stat) => ({
      value: stat.value.trim(),
      label: stat.label.trim(),
    }));

  return safeStats.length > 0
    ? safeStats
    : DEFAULT_HERO.stats;
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function NearbyHero() {
  const safeBadge = getSafeText(
    DEFAULT_HERO.badge,
    "LOCAL OFFERS",
  );

  const safeTitle = getSafeText(
    DEFAULT_HERO.title,
    "Discover Local Deals Near You",
  );

  const safeDescription = getSafeText(
    DEFAULT_HERO.description,
    "Find verified discounts from local stores near you.",
  );

  const safeBackgroundImage = getSafeImageUrl(
    DEFAULT_HERO.backgroundImage,
  );

  const safeStats = getSafeStats(
    DEFAULT_HERO.stats,
  );

  return (
    <section
      className="
        relative
        rounded-card
        overflow-hidden
        w-full
      "
      aria-labelledby="nearby-hero-title"
    >
      {/* --------------------------------
       * Background Image
       * -------------------------------- */}
      <div
        className="
          absolute
          inset-0
          bg-cover
          bg-center
        "
        style={{
          backgroundImage: `url("${safeBackgroundImage}")`,
        }}
        aria-hidden="true"
      />

      {/* --------------------------------
       * Overlay
       * -------------------------------- */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, #0B1E4Be6 0%, #0B1E4Bcc 45%, #0B1E4B66 100%)",
        }}
        aria-hidden="true"
      />

      {/* --------------------------------
       * Hero Content
       * -------------------------------- */}
      <div
        className="
          relative
          flex
          flex-col
          lg:flex-row
          lg:items-center
          gap-6
          px-6
          sm:px-10
          py-9
          sm:py-12
        "
      >
        {/* --------------------------------
         * Main Content
         * -------------------------------- */}
        <div className="flex-1 max-w-[560px]">
          {/* Badge */}
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
            "
          >
            {safeBadge}
          </span>

          {/* Title */}
          <h1
            id="nearby-hero-title"
            className="
              font-sora
              font-extrabold
              text-white
              text-[26px]
              sm:text-[34px]
              leading-[1.15]
              mt-3
            "
          >
            {safeTitle}
          </h1>

          {/* Description */}
          <p
            className="
              text-white/80
              text-[13px]
              sm:text-[13.5px]
              mt-3
              leading-relaxed
              max-w-[480px]
            "
          >
            {safeDescription}
          </p>

          {/* --------------------------------
           * Action Buttons
           * -------------------------------- */}
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2.5
              mt-6
            "
          >
            <button
              type="button"
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
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-white
                focus-visible:ring-offset-2
                focus-visible:ring-offset-navy
              "
              aria-label="Explore nearby deals"
            >
              Explore Nearby Deals

              <ArrowRight
                size={14}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              className="
                flex
                items-center
                gap-2
                bg-white
                hover:bg-paper
                transition-colors
                text-navy
                text-[12.5px]
                font-bold
                px-5
                py-3
                rounded-lg
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-white
                focus-visible:ring-offset-2
              "
              aria-label="Register your store"
            >
              <Store
                size={14}
                aria-hidden="true"
              />

              Register Your Store
            </button>
          </div>
        </div>

        {/* --------------------------------
         * Statistics
         * -------------------------------- */}
        {safeStats.length > 0 && (
          <div
            className="
              flex
              sm:flex-col
              gap-3
              shrink-0
              lg:ml-auto
            "
            aria-label="Nearby deals statistics"
          >
            {safeStats.map((stat, index) => (
              <div
                key={`${stat.label}-${index}`}
                className="
                  bg-white/10
                  backdrop-blur-sm
                  border
                  border-white/15
                  rounded-lg
                  px-5
                  py-3.5
                  text-center
                  sm:text-left
                  flex-1
                "
              >
                <div
                  className="
                    font-sora
                    font-extrabold
                    text-white
                    text-[22px]
                    leading-tight
                  "
                >
                  {stat.value}
                </div>

                <div
                  className="
                    text-white/70
                    text-[11px]
                    mt-0.5
                  "
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}