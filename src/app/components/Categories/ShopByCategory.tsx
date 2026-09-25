// File: app/components/Categories/ShopByCategory.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ALL_CATEGORIES } from "@/app/data/categories";
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

// Static tiles render instantly; the live API list (with streamed primary
// images) replaces them once loaded.
const STATIC_TILES: TileData[] = (
  Array.isArray(ALL_CATEGORIES) ? ALL_CATEGORIES : []
)
  .filter(
    (category: any) =>
      typeof category?.name === "string" &&
      typeof category?.slug === "string" &&
      category.name.trim().length > 0
  )
  .map((category: any, index: number) => ({
    id: "",
    name: category.name,
    slug: category.slug,
    count:
      typeof category.count === "string" && category.count.trim().length > 0
        ? category.count
        : "Wholesale range",
    swatch:
      typeof category.swatch === "string" && category.swatch.trim().length > 0
        ? category.swatch
        : FALLBACK_SWATCHES[index % FALLBACK_SWATCHES.length],
  }));

export default function ShopByCategory() {
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
    <section
      aria-labelledby="shop-by-category-title"
      id="shop-by-category"
    >
      {/* =================================================
          HEADER
      ================================================== */}

      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2
            id="shop-by-category-title"
            className="
              font-sora
              text-[20px]
              sm:text-[22px]
              font-bold
              text-navy
            "
          >
            Shop by Category
          </h2>

          <p className="text-[12px] sm:text-[12.5px] text-ink-soft mt-1">
            Sourced directly from manufacturers for guaranteed purity and
            prices
          </p>
        </div>

        {/* =================================================
            DESKTOP VIEW ALL
        ================================================== */}

        <Link
          href="/categories"
          className="
            hidden
            sm:inline-flex
            items-center
            justify-center
            rounded-lg
            border
            border-line
            bg-white
            px-4
            py-2
            text-[11.5px]
            font-semibold
            text-ink-soft
            hover:text-navy
            hover:border-blue
            transition-colors
          "
          aria-label="View all categories"
        >
          View All Categories
        </Link>
      </div>

      {/* =================================================
          CATEGORY GRID
      ================================================== */}

      {tiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map(
            (cat, index) => (
              <Link
                key={`${cat.id || cat.slug}-${index}`}
                href={`/categories/${encodeURIComponent(
                  cat.slug
                )}`}
                aria-label={`Explore ${cat.name} category`}
                className="
                  flex
                  items-center
                  gap-3
                  bg-white
                  border
                  border-line
                  rounded-card
                  p-3.5
                  hover:border-blue
                  hover:shadow-card
                  transition-all
                  group
                "
              >
                {/* =================================================
                    CATEGORY IMAGE / COLOR
                ================================================== */}

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
                  role="img"
                  aria-label={`${cat.name} category preview`}
                >
                  {cat.image && !brokenImages[cat.id] ? (
                    <Image
                      src={cat.image}
                      alt=""
                      fill
                      sizes="56px"
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

                {/* =================================================
                    CATEGORY DETAILS
                ================================================== */}

                <div className="min-w-0 flex-1">

                  {/* CATEGORY NAME */}

                  <div
                    className="
                      text-[13.5px]
                      font-bold
                      text-ink
                      truncate
                    "
                    title={cat.name}
                  >
                    {cat.name}
                  </div>

                  {/* PRODUCT COUNT */}

                  <div className="text-[11px] text-ink-faint mt-0.5">
                    {cat.count}
                  </div>

                  {/* EXPLORE */}

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-green-deep mt-1">
                    <span>Explore</span>

                    <ArrowRight
                      size={11}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      ) : (
        /* =================================================
            EMPTY STATE
        ================================================== */

        <div
          role="status"
          className="
            bg-white
            border
            border-line
            rounded-card
            p-6
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          Categories are currently unavailable.
        </div>
      )}

      {/* =================================================
          MOBILE VIEW ALL
      ================================================== */}

      <div className="sm:hidden mt-4">
        <Link
          href="/categories"
          aria-label="View all categories"
          className="
            flex
            items-center
            justify-center
            w-full
            rounded-lg
            border
            border-line
            bg-white
            px-4
            py-2.5
            text-[12px]
            font-semibold
            text-ink-soft
            hover:text-navy
            hover:border-blue
            transition-colors
          "
        >
          View All Categories
        </Link>
      </div>
    </section>
  );
}
