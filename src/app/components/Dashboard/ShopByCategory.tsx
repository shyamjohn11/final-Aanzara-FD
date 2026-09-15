"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoriesApi } from "@/app/api/services";

interface TileData {
  id: string;
  name: string;
  slug: string;
  count: string;
  swatch: string;
  image?: string | null;
}

const FALLBACK_SWATCHES = [
  "#D9C48A",
  "#B08A5C",
  "#E7B93F",
  "#C4791E",
  "#B7472A",
  "#4A79C7",
  "#D4A017",
  "#8FA6C9",
];

// Categories carry no slug in the API; /categories/[slug] resolves the
// same slugified name back to an id.
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const STATIC_TILES: TileData[] = [];

export default function ShopByCategory() {
  // Static tiles render instantly; the live API list (with streamed
  // primary images) replaces them once loaded.
  const [tiles, setTiles] = useState<TileData[]>(STATIC_TILES);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await categoriesApi.list();
        const items: any[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];
        if (cancelled || items.length === 0) return;

        const live = items
          .map((raw: any, index: number) => {
            const name = String(raw?.categoryName ?? "").trim();
            const slug = slugify(name);
            const staticMatch = STATIC_TILES.find(
              (tile) => tile.slug === slug
            );
            return {
              id: String(raw?.categoryId ?? ""),
              image:
                typeof raw?.primaryImageUrl === "string" &&
                raw.primaryImageUrl.length > 0
                  ? raw.primaryImageUrl
                  : null,
              name,
              slug,
              count: staticMatch?.count ?? "Wholesale range",
              swatch:
                staticMatch?.swatch ??
                FALLBACK_SWATCHES[index % FALLBACK_SWATCHES.length],
            };
          })
          .filter((tile) => tile.id && tile.name);

        if (!cancelled && live.length > 0) {
          setTiles(live);
        }
      } catch {
        // Keep the static tiles on failure.
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="shop-by-category">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-sora font-bold text-[19px] text-navy">
            Shop by Category
          </h2>

          <p className="text-[12.5px] text-ink-soft mt-1">
            Sourced directly from manufacturers for guaranteed purity and
            competitive wholesale prices
          </p>
        </div>

        {/* View All Categories */}
        <Link
          href="/categories"
          className="
            hidden
            sm:inline-flex
            items-center
            justify-center
            border
            border-line
            text-ink
            font-semibold
            text-[12px]
            px-4
            py-2.5
            rounded-lg
            whitespace-nowrap
            hover:border-blue
            hover:text-blue
            transition-colors
          "
        >
          View All Categories
        </Link>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((cat) => (
          <Link
            key={cat.id || cat.slug}
            href={`/categories/${encodeURIComponent(cat.slug)}`}
            aria-label={`Explore ${cat.name} category`}
            className="
              flex
              items-center
              gap-3
              bg-white
              border
              border-line
              rounded-card
              p-3
              text-left
              hover:border-blue
              hover:shadow-card
              transition-all
              group
            "
          >
            {/* Category Image / Swatch */}
            <div
              className="
                relative
                w-14
                h-14
                rounded-lg
                shrink-0
                overflow-hidden
                transition-transform
                group-hover:scale-105
              "
              style={{
                background: `linear-gradient(
                  160deg,
                  ${cat.swatch},
                  ${cat.swatch}99
                )`,
              }}
            >
              {cat.image && !brokenImages[cat.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                  onError={() =>
                    setBrokenImages((prev) => ({
                      ...prev,
                      [cat.id]: true,
                    }))
                  }
                />
              ) : null}
            </div>

            {/* Category Details */}
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-ink truncate group-hover:text-blue transition-colors">
                {cat.name}
              </div>

              <div className="text-[11px] text-ink-faint mt-0.5">
                {cat.count}
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-green-deep mt-1">
                Explore
                <ArrowRight
                  size={11}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile View All */}
      <div className="sm:hidden mt-4">
        <Link
          href="/categories"
          className="
            flex
            items-center
            justify-center
            w-full
            border
            border-line
            bg-white
            text-ink
            font-semibold
            text-[12px]
            px-4
            py-2.5
            rounded-lg
            hover:border-blue
            hover:text-blue
            transition-colors
          "
        >
          View All Categories
        </Link>
      </div>
    </section>
  );
}
