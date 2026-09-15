import {
  BadgeCheck,
  Star,
  MapPin,
  Clock,
  Navigation,
} from "lucide-react";
import type { StoreDiscount } from "@/app/data/nearbyDiscounts";

interface StoreDiscountCardProps {
  store: StoreDiscount;
}

/* --------------------------------
 * Safe text validation
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
 * Image URL validation
 * -------------------------------- */
function getSafeImageUrl(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const url = value.trim();

  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      return "";
    }

    return parsedUrl.toString();
  } catch {
    return "";
  }
}

/* --------------------------------
 * Badge color validation
 * -------------------------------- */
function getSafeBadgeColor(
  value: unknown,
): string {
  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    return value.trim();
  }

  return "#2448C4";
}

/* --------------------------------
 * Store validation
 * -------------------------------- */
function isValidStoreDiscount(
  value: unknown,
): value is StoreDiscount {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const store = value as Record<string, unknown>;

  return (
    typeof store.image === "string" &&
    store.image.trim().length > 0 &&

    typeof store.badge === "string" &&
    store.badge.trim().length > 0 &&

    typeof store.badgeColor === "string" &&
    store.badgeColor.trim().length > 0 &&

    typeof store.status === "string" &&
    store.status.trim().length > 0 &&

    typeof store.category === "string" &&
    store.category.trim().length > 0 &&

    typeof store.name === "string" &&
    store.name.trim().length > 0 &&

    typeof store.title === "string" &&
    store.title.trim().length > 0 &&

    typeof store.desc === "string" &&
    store.desc.trim().length > 0 &&

    (typeof store.rating === "number" ||
      typeof store.rating === "string") &&

    typeof store.distance === "string" &&
    store.distance.trim().length > 0 &&

    typeof store.minPurchase === "string" &&
    store.minPurchase.trim().length > 0 &&

    typeof store.validity === "string" &&
    store.validity.trim().length > 0 &&

    typeof store.locations === "string" &&
    store.locations.trim().length > 0 &&

    typeof store.verified === "boolean"
  );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */
export default function StoreDiscountCard({
  store,
}: StoreDiscountCardProps) {
  /* --------------------------------
   * Invalid store protection
   * -------------------------------- */
  if (!isValidStoreDiscount(store)) {
    return (
      <div
        className="
          bg-white
          border
          border-line
          rounded-card
          min-h-[160px]
          flex
          items-center
          justify-center
          px-5
          text-center
          text-[12px]
          text-ink-faint
        "
        role="status"
        aria-live="polite"
      >
        Store information is unavailable.
      </div>
    );
  }

  /* --------------------------------
   * Safe values
   * -------------------------------- */
  const imageUrl = getSafeImageUrl(store.image);

  const badge = getSafeText(
    store.badge,
    "Offer",
  );

  const status = getSafeText(
    store.status,
    "Status unavailable",
  );

  const category = getSafeText(
    store.category,
    "Local Store",
  );

  const name = getSafeText(
    store.name,
    "Store",
  );

  const title = getSafeText(
    store.title,
    "Special Offer",
  );

  const description = getSafeText(
    store.desc,
    "Offer details unavailable.",
  );

  const distance = getSafeText(
    store.distance,
    "Distance unavailable",
  );

  const minPurchase = getSafeText(
    store.minPurchase,
    "Minimum purchase unavailable",
  );

  const validity = getSafeText(
    store.validity,
    "Validity unavailable",
  );

  const locations = getSafeText(
    store.locations,
    "Locations unavailable",
  );

  const badgeColor = getSafeBadgeColor(
    store.badgeColor,
  );

  /* --------------------------------
   * Status
   * -------------------------------- */
  const isOpen =
    status.toLowerCase() === "open now";

  return (
    <article
      className="
        bg-white
        border
        border-line
        rounded-card
        overflow-hidden
        flex
        flex-col
        sm:flex-row
        hover:shadow-pop
        transition-shadow
      "
    >
      {/* --------------------------------
       * Store Image
       * -------------------------------- */}
      <div
        className="
          relative
          w-full
          sm:w-[220px]
          h-[160px]
          sm:h-auto
          shrink-0
          bg-cover
          bg-center
          bg-paper
        "
        style={
          imageUrl
            ? {
                backgroundImage: `url("${imageUrl}")`,
              }
            : undefined
        }
        aria-label={`${name} store image`}
      >
        {/* Badge */}
        <span
          className="
            absolute
            top-2.5
            left-2.5
            text-white
            text-[11px]
            font-bold
            px-2.5
            py-1
            rounded-md
          "
          style={{
            backgroundColor: badgeColor,
          }}
        >
          {badge}
        </span>

        {/* Open / Closed Status */}
        <span
          className={`
            absolute
            top-2.5
            right-2.5
            flex
            items-center
            gap-1
            text-[10px]
            font-bold
            px-2
            py-1
            rounded-md
            ${
              isOpen
                ? "bg-green text-white"
                : "bg-amber text-white"
            }
          `}
        >
          <Clock
            size={10}
            aria-hidden="true"
          />

          {status}
        </span>
      </div>

      {/* --------------------------------
       * Store Content
       * -------------------------------- */}
      <div
        className="
          p-4
          sm:p-5
          flex
          flex-col
          flex-1
          min-w-0
        "
      >
        {/* Category */}
        <div
          className="
            flex
            flex-wrap
            items-center
            gap-x-3
            gap-y-1
            mb-1.5
          "
        >
          <span
            className="
              text-[10.5px]
              font-bold
              tracking-wide
              text-ink-faint
            "
          >
            {category}
          </span>
        </div>

        {/* Store Name / Rating / Distance */}
        <div
          className="
            flex
            items-center
            gap-2
            mb-1.5
            flex-wrap
          "
        >
          <h3
            className="
              text-[15px]
              font-bold
              text-ink
            "
          >
            {name}
          </h3>

          {/* Verified */}
          {store.verified && (
            <BadgeCheck
              size={15}
              className="
                fill-blue
                text-white
                shrink-0
              "
              aria-label="Verified store"
            />
          )}

          {/* Rating */}
          <span
            className="
              flex
              items-center
              gap-1
              text-[11.5px]
              font-semibold
              text-ink
            "
            aria-label={`Rating ${store.rating}`}
          >
            <Star
              size={12}
              className="
                fill-amber
                text-amber
              "
              aria-hidden="true"
            />

            {store.rating}
          </span>

          {/* Distance */}
          <span
            className="
              flex
              items-center
              gap-1
              text-[11.5px]
              text-ink-soft
            "
          >
            <MapPin
              size={12}
              aria-hidden="true"
            />

            {distance}
          </span>
        </div>

        {/* Offer Title */}
        <h4
          className="
            text-[13.5px]
            font-bold
            text-navy
            leading-snug
            mb-1.5
          "
        >
          {title}
        </h4>

        {/* Description */}
        <p
          className="
            text-[12px]
            text-ink-soft
            leading-relaxed
            mb-3
          "
        >
          {description}
        </p>

        {/* Offer Details */}
        <div
          className="
            flex
            flex-wrap
            items-center
            gap-x-4
            gap-y-1
            text-[11.5px]
            text-ink-soft
            mb-4
          "
        >
          <span>{minPurchase}</span>

          <span
            className="text-ink-faint"
            aria-hidden="true"
          >
            •
          </span>

          <span>{validity}</span>
        </div>

        {/* --------------------------------
         * Actions
         * -------------------------------- */}
        <div
          className="
            mt-auto
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          {/* Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="
                border
                border-line
                text-ink
                text-[12px]
                font-bold
                px-4
                py-2.5
                rounded-lg
                hover:border-navy
                hover:text-navy
                transition-colors
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-navy
                focus-visible:ring-offset-2
              "
              aria-label={`Know more about ${name}`}
            >
              Know More
            </button>

            <button
              type="button"
              className="
                bg-green
                hover:bg-green-deep
                transition-colors
                text-white
                text-[12px]
                font-bold
                px-4
                py-2.5
                rounded-lg
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-green
                focus-visible:ring-offset-2
              "
              aria-label={`View offer from ${name}`}
            >
              View Offer
            </button>
          </div>

          {/* Locations / Directions */}
          <div
            className="
              flex
              items-center
              gap-3
              text-[11.5px]
            "
          >
            <span className="text-ink-soft">
              {locations}
            </span>

            <button
              type="button"
              className="
                flex
                items-center
                gap-1
                text-blue
                font-semibold
                hover:underline
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-blue
                focus-visible:ring-offset-2
                rounded
              "
              aria-label={`Get directions to ${name}`}
            >
              <Navigation
                size={12}
                aria-hidden="true"
              />

              Get Directions
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}