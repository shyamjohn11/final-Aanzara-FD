"use client";

import { useEffect, useState } from "react";
import type { SeasonalOffer as SeasonalOfferType } from "@/app/data/offers";
import { dealsApi } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

type SeasonalOffer = SeasonalOfferType;

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function isValidText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidId(
  value: unknown,
): value is string | number {
  return (
    (typeof value === "string" ||
      typeof value === "number") &&
    String(value).trim().length > 0
  );
}

function isValidImageUrl(
  value: unknown,
): value is string {
  if (!isValidText(value)) {
    return false;
  }

  const url = value.trim();

  return (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../")
  );
}

function isValidSeasonalOffer(
  offer: unknown,
): offer is SeasonalOffer {
  if (
    !offer ||
    typeof offer !== "object"
  ) {
    return false;
  }

  const item =
    offer as Partial<SeasonalOffer>;

  return (
    isValidId(item.id) &&
    isValidImageUrl(item.image) &&
    isValidText(item.title) &&
    isValidText(item.desc)
  );
}

/* --------------------------------
 * Safe Data
 * -------------------------------- */

function getSafeSeasonalOffers(
  offers: unknown,
): SeasonalOffer[] {
  if (!Array.isArray(offers)) {
    return [];
  }

  const usedIds = new Set<string>();

  return (offers as unknown[])
    .filter(isValidSeasonalOffer)
    .map((offer) => ({
      ...offer,
      image: offer.image.trim(),
      title: offer.title.trim(),
      desc: offer.desc.trim(),
    }))
    .filter((offer) => {
      const id = String(offer.id)
        .trim()
        .toLowerCase();

      if (usedIds.has(id)) {
        return false;
      }

      usedIds.add(id);

      return true;
    });
}

/* --------------------------------
 * API mapping (bannersApi.list)
 * -------------------------------- */

function unwrapItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (payload && typeof payload === "object") {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.items)) {
      return rec.items as Record<string, unknown>[];
    }
    if (Array.isArray(rec.data)) {
      return rec.data as Record<string, unknown>[];
    }
  }
  return [];
}

function resolveBannerImage(
  raw: Record<string, unknown>,
  _fallbackId: string,
): string {
  const direct = String(
    raw.imageUrl ??
      raw.image ??
      raw.imagePath ??
      raw.bannerImage ??
      raw.fileUrl ??
      raw.filePath ??
      "",
  ).trim();
  if (direct) {
    return direct;
  }
  const gallery = raw.images ?? raw.gallery ?? raw.files;
  if (Array.isArray(gallery) && gallery.length > 0) {
    const first = gallery[0] as unknown;
    const nested =
      typeof first === "string"
        ? first.trim()
        : String(
            (first as Record<string, unknown>)?.imageUrl ??
              (first as Record<string, unknown>)?.url ??
              (first as Record<string, unknown>)?.filePath ??
              "",
          ).trim();
    if (nested) {
      return nested;
    }
  }
  // Public banners already carry imageUrl; no admin imageFileUrl fallback for guests.
  return "";
}

function mapBannerToSeasonalOffer(
  raw: Record<string, unknown>,
  index: number,
): SeasonalOffer {
  const rawId =
    String(
      raw.bannerId ??
        raw.id ??
        raw._id ??
        `seasonal-${index}`,
    ).trim() || `seasonal-${index}`;

  return {
    id: rawId,
    image: resolveBannerImage(raw, rawId),
    title:
      String(
        raw.title ??
          raw.name ??
          "Seasonal Offer",
      ).trim() || "Seasonal Offer",
    desc:
      String(
        raw.subtitle ??
          raw.description ??
          raw.position ??
          "Limited time seasonal offer",
      ).trim() || "Limited time seasonal offer",
  };
}

/* --------------------------------
 * Component
 * -------------------------------- */

export default function SeasonalOffers() {
  const [offers, setOffers] = useState<SeasonalOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError("");
      try {
        // Public active banners — no auth, works for guests.
        const response = await dealsApi.banners(25);
        const payload: unknown =
          (response as { data?: unknown })?.data ?? response;
        const rawItems = unwrapItems(payload);
        const mapped = rawItems.map(mapBannerToSeasonalOffer);
        if (!cancelled) {
          setOffers(mapped);
        }
      } catch (error) {
        console.error("Unable to load seasonal offers:", error);
        if (!cancelled) {
          setFetchError(
            "Unable to load seasonal offers. Please try again.",
          );
          setOffers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const safeOffers =
    getSafeSeasonalOffers(offers);

  if (loading) {
    return (
      <section
        aria-labelledby="seasonal-offers-title"
      >
        <h2
          id="seasonal-offers-title"
          className="
            font-sora
            font-bold
            text-[19px]
            text-navy
            mb-4
          "
        >
          Seasonal Offers
        </h2>

        <div
          className="
            min-h-[120px]
            bg-white
            border
            border-line
            rounded-card
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          Loading seasonal offers…
        </div>
      </section>
    );
  }

  if (fetchError) {
    return (
      <section
        aria-labelledby="seasonal-offers-title"
      >
        <h2
          id="seasonal-offers-title"
          className="
            font-sora
            font-bold
            text-[19px]
            text-navy
            mb-4
          "
        >
          Seasonal Offers
        </h2>

        <div
          className="
            min-h-[120px]
            bg-white
            border
            border-line
            rounded-card
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[12px]
            text-red-600
          "
          role="alert"
        >
          {fetchError}
        </div>
      </section>
    );
  }

  if (safeOffers.length === 0) {
    return (
      <section
        aria-labelledby="seasonal-offers-title"
      >
        <h2
          id="seasonal-offers-title"
          className="
            font-sora
            font-bold
            text-[19px]
            text-navy
            mb-4
          "
        >
          Seasonal Offers
        </h2>

        <div
          className="
            min-h-[120px]
            bg-white
            border
            border-dashed
            border-line
            rounded-card
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          No seasonal offers available
          right now.
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="seasonal-offers-title"
    >
      {/* Section Title */}
      <h2
        id="seasonal-offers-title"
        className="
          font-sora
          font-bold
          text-[19px]
          text-navy
          mb-4
        "
      >
        Seasonal Offers
      </h2>

      {/* Offers */}
      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-4
        "
      >
        {safeOffers.map((offer) => {
          const offerId =
            String(offer.id).trim();

          return (
            <article
              key={offerId}
              className="
                relative
                rounded-card
                overflow-hidden
                h-[150px]
              "
            >
              {/* Image */}
              <div
                className="
                  absolute
                  inset-0
                  bg-cover
                  bg-center
                "
                style={{
                  backgroundImage: `url("${offer.image}")`,
                }}
                aria-hidden="true"
              />

              {/* Overlay */}
              <div
                className="
                  absolute
                  inset-0
                "
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, #0B1E4Be6 100%)",
                }}
                aria-hidden="true"
              />

              {/* Content */}
              <div
                className="
                  relative
                  h-full
                  flex
                  flex-col
                  justify-end
                  p-3.5
                "
              >
                <h3
                  className="
                    text-white
                    text-[13px]
                    font-bold
                    leading-snug
                  "
                >
                  {offer.title}
                </h3>

                <p
                  className="
                    text-white/70
                    text-[10px]
                    mt-0.5
                    leading-snug
                    line-clamp-2
                  "
                >
                  {offer.desc}
                </p>

                <button
                  type="button"
                  aria-label={`Explore ${offer.title}`}
                  className="
                    w-fit
                    bg-white
                    hover:bg-paper
                    transition-colors
                    text-ink
                    text-[10.5px]
                    font-bold
                    px-3
                    py-1.5
                    rounded-md
                    mt-2.5
                    cursor-pointer
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-white
                    focus-visible:ring-offset-2
                  "
                >
                  Explore
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
