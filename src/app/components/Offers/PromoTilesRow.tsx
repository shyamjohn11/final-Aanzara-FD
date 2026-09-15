"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { PromoTile as PromoTileType } from "@/app/data/offers";
import { bannersApi } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

type PromoTile = PromoTileType;

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

function isValidPromoTile(
  tile: unknown,
): tile is PromoTile {
  if (
    !tile ||
    typeof tile !== "object"
  ) {
    return false;
  }

  const item = tile as Partial<PromoTile>;

  return (
    isValidId(item.id) &&
    isValidText(item.title) &&
    isValidText(item.desc) &&
    isValidText(item.cta) &&
    isValidText(item.gradient)
  );
}

/* --------------------------------
 * Safe Promo Tiles
 * -------------------------------- */

function getSafePromoTiles(
  tiles: unknown,
): PromoTile[] {
  if (!Array.isArray(tiles)) {
    return [];
  }

  const usedIds = new Set<string>();

  return (tiles as unknown[])
    .filter(isValidPromoTile)
    .map((tile) => ({
      ...tile,
      title: tile.title.trim(),
      desc: tile.desc.trim(),
      cta: tile.cta.trim(),
      gradient: tile.gradient.trim(),
    }))
    .filter((tile) => {
      const id = String(tile.id)
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

const TILE_GRADIENTS = [
  "linear-gradient(135deg, #1E3A8A, #3B82F6)",
  "linear-gradient(135deg, #065F46, #10B981)",
  "linear-gradient(135deg, #9A3412, #F59E0B)",
  "linear-gradient(135deg, #7C2D12, #DC2626)",
  "linear-gradient(135deg, #4C1D95, #A855F7)",
  "linear-gradient(135deg, #0C4A6E, #06B6D4)",
];

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

function mapBannerToTile(
  raw: Record<string, unknown>,
  index: number,
): PromoTile {
  const id =
    String(
      raw.bannerId ??
        raw.id ??
        raw._id ??
        `promo-${index}`,
    ).trim() || `promo-${index}`;

  const title =
    String(
      raw.title ??
        raw.name ??
        "Offer",
    ).trim() || "Offer";

  const desc =
    String(
      raw.subtitle ??
        raw.description ??
        raw.position ??
        "Limited time offer",
    ).trim() || "Limited time offer";

  const linkRaw = String(
    raw.link ??
      raw.url ??
      raw.targetUrl ??
      raw.cta ??
      "",
  ).trim();
  const cta =
    !linkRaw ||
    linkRaw.startsWith("/") ||
    /^https?:/i.test(linkRaw)
      ? "Shop Now"
      : linkRaw;

  return {
    id,
    title,
    desc,
    cta,
    gradient: TILE_GRADIENTS[index % TILE_GRADIENTS.length],
  };
}

/* --------------------------------
 * Component
 * -------------------------------- */

export default function PromoTilesRow() {
  const [tiles, setTiles] = useState<PromoTile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const response = await bannersApi.list(1, 25);
        const payload: unknown =
          (response as { data?: unknown })?.data ?? response;
        const rawItems = unwrapItems(payload);
        const mapped = rawItems.map(mapBannerToTile);
        if (!cancelled) {
          setTiles(mapped);
        }
      } catch (error) {
        console.error("Unable to load promo tiles:", error);
        if (!cancelled) {
          setFetchError(
            "Unable to load promotional offers. Please try again.",
          );
          setTiles([]);
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

  const safeTiles =
    getSafePromoTiles(tiles);

  if (loading) {
    return (
      <div
        className="
          rounded-card
          border
          border-line
          bg-white
          min-h-[120px]
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
        Loading promotional offers…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div
        className="
          rounded-card
          border
          border-line
          bg-white
          min-h-[120px]
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
    );
  }

  if (safeTiles.length === 0) {
    return (
      <div
        className="
          rounded-card
          border
          border-dashed
          border-line
          bg-white
          min-h-[120px]
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
        No promotional offers available
        right now.
      </div>
    );
  }

  return (
    <section
      aria-label="Promotional offers"
      className="
        grid
        grid-cols-1
        sm:grid-cols-3
        gap-4
      "
    >
      {safeTiles.map((tile) => {
        const tileId =
          String(tile.id).trim();

        const title =
          tile.title.trim();

        const description =
          tile.desc.trim();

        const cta =
          tile.cta.trim();

        return (
          <article
            key={tileId}
            className="
              rounded-card
              p-5
              flex
              flex-col
              justify-between
              h-[150px]
              text-white
            "
            style={{
              background: tile.gradient,
            }}
          >
            {/* Content */}
            <div>
              <h3
                className="
                  font-sora
                  font-bold
                  text-[17px]
                "
              >
                {title}
              </h3>

              <p
                className="
                  text-[11.5px]
                  text-white/75
                  mt-1.5
                  leading-relaxed
                  max-w-[240px]
                "
              >
                {description}
              </p>
            </div>

            {/* CTA */}
            <button
              type="button"
              aria-label={`${cta}: ${title}`}
              className="
                flex
                items-center
                gap-1.5
                w-fit
                bg-white/15
                hover:bg-white/25
                transition-colors
                text-white
                text-[11.5px]
                font-bold
                px-3.5
                py-2
                rounded-lg
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-white
                focus-visible:ring-offset-2
                focus-visible:ring-offset-transparent
              "
            >
              {cta}

              <ArrowRight
                size={12}
                aria-hidden="true"
              />
            </button>
          </article>
        );
      })}
    </section>
  );
}
