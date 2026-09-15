import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  Sparkles,
} from "lucide-react";

/* --------------------------------
 * Constants
 * -------------------------------- */

const SHOP_OFFERS_PATH = "/nearby-discounts";

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function isValidText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getSafeText(value: unknown, fallback: string): string {
  return isValidText(value) ? value.trim() : fallback;
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function OffersHero() {
  const badge = getSafeText(
    "LIMITED TIME BUSINESS SAVINGS",
    "BUSINESS SAVINGS",
  );

  const title = getSafeText(
    "Exclusive Offers for Every Customer",
    "Exclusive Offers",
  );

  const description = getSafeText(
    "Save more with daily deals, wholesale bundles, seasonal offers, and business discounts curated across every category.",
    "Explore daily deals, wholesale bundles, seasonal offers, and business discounts.",
  );

  const shopOffersLabel = getSafeText("Shop Offers", "Shop Offers");
  const businessDealsLabel = getSafeText("Business Deals", "Business Deals");

  return (
    <section
      aria-labelledby="offers-hero-title"
      className="
        relative
        w-full
        rounded-2xl
        overflow-hidden
        shadow-md
        /* Responsive Aspect Ratio */
        aspect-[4/3] 
        sm:aspect-[16/9] 
        md:aspect-[21/9]
        /* Minimum height so content never overlaps */
        min-h-[420px] 
        md:min-h-[380px]
      "
    >
      {/* --------------------------------
       * Background Image Container
       * -------------------------------- */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/Offer/offer.png"
          alt="Exclusive offers and business savings background"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={90}
        />
      </div>

      {/* --------------------------------
       * Clean Overlay
       * -------------------------------- */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(to right, rgba(7, 8, 9, 0.92) 0%, rgba(0, 0, 0, 0.56) 50%, rgba(0, 0, 0, 0.05) 100%)
          `,
        }}
        aria-hidden="true"
      />

      {/* --------------------------------
       * Content
       * -------------------------------- */}
      <div
        className="
          absolute
          inset-0
          flex
          flex-col
          justify-center
          px-6
          sm:px-10
          lg:px-14
          py-12
          max-w-[620px]
        "
      >
        {/* Badge */}
        <div
          className="
            inline-flex
            w-fit
            items-center
            gap-1.5
            bg-white/10
            border
            border-white/20
            text-white
            text-[10px]
            font-bold
            tracking-wider
            px-3
            py-1.5
            rounded-full
            mb-4
          "
        >
          <Sparkles size={12} aria-hidden="true" />
          {badge}
        </div>

        {/* Title */}
        <h1
          id="offers-hero-title"
          className="
            font-sora
            font-extrabold
            text-white
            text-[28px]
            sm:text-[36px]
            md:text-[42px]
            lg:text-[48px]
            leading-[1.1]
            tracking-tight
          "
        >
          {title}
        </h1>

        {/* Description */}
        <p
          className="
            text-white/80
            text-[13px]
            sm:text-[14px]
            md:text-[15px]
            mt-4
            leading-relaxed
            max-w-[480px]
          "
        >
          {description}
        </p>

        {/* Actions */}
        <div
          className="
            flex
            flex-wrap
            items-center
            gap-3
            mt-8
          "
        >
          {/* Shop Offers - Primary Button */}
          <Link
            href={SHOP_OFFERS_PATH}
            aria-label={shopOffersLabel}
            className="
              group
              flex
              items-center
              gap-2
              bg-white
              text-ink
              text-[12.5px]
              sm:text-[13px]
              font-bold
              px-6
              py-3.5
              rounded-xl
              transition-colors
              duration-200
              hover:bg-gray-100
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-white
              focus-visible:ring-offset-2
              focus-visible:ring-offset-navy
            "
          >
            {shopOffersLabel}
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>

          {/* Business Deals - Secondary Button */}
          <button
            type="button"
            aria-label={businessDealsLabel}
            className="
              group
              flex
              items-center
              gap-2
              bg-white/10
              border
              border-white/30
              text-white
              text-[12.5px]
              sm:text-[13px]
              font-bold
              px-6
              py-3.5
              rounded-xl
              cursor-pointer
              transition-colors
              duration-200
              hover:bg-white/20
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-white
              focus-visible:ring-offset-2
              focus-visible:ring-offset-navy
            "
          >
            <Briefcase size={14} aria-hidden="true" />
            {businessDealsLabel}
          </button>
        </div>
      </div>
    </section>
  );
}