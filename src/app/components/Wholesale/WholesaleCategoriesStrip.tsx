"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { categoriesApi } from "@/app/api/services";

type WholesaleTile = {
  name: string;
  image: string;
};

export default function WholesaleCategoriesStrip() {
  // =====================================================
  // LIVE DATA — GET /api/v1/categories (#20)
  // =====================================================

  const [tiles, setTiles] = useState<WholesaleTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await categoriesApi.list();
        const items = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        if (cancelled) return;

        const live: WholesaleTile[] = items
          .map((raw: any) => ({
            name: String(raw?.categoryName ?? "").trim(),
            image:
              typeof raw?.primaryImageUrl === "string"
                ? raw.primaryImageUrl
                : "",
          }))
          .filter(
            (tile: WholesaleTile) =>
              typeof tile.name === "string" && tile.name.trim().length > 0
          );

        setTiles(live);
      } catch {
        if (!cancelled) {
          setError("Wholesale categories are currently unavailable.");
          setTiles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================================
  // VALIDATION
  // =====================================================

  const validTiles = Array.isArray(tiles)
    ? tiles.filter(
        (tile: WholesaleTile) =>
          tile &&
          typeof tile.name === "string" &&
          tile.name.trim().length > 0
      )
    : [];

  return (
    <section
      aria-labelledby="wholesale-categories-title"
      className="w-full"
    >
      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="flex items-center justify-between mb-4">
        {/* CATEGORY TITLE */}
        <h2
          id="wholesale-categories-title"
          className="
            font-sora
            font-bold
            text-[19px]
            leading-tight
            !text-black
          "
        >
          Wholesale Categories
        </h2>

        {/* VIEW ALL */}
        <Link
          href="/categories"
          className="
            flex
            items-center
            gap-1
            text-[12px]
            font-semibold
            text-blue
            hover:underline
            shrink-0
          "
        >
          View All Categories

          <ArrowRight
            size={13}
            strokeWidth={2}
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* =========================================================
          CATEGORY GRID
      ========================================================= */}
      {loading ? (
        <div
          role="status"
          className="rounded-card border border-line bg-white p-6 text-center text-[12px] text-ink-soft"
        >
          Loading wholesale categories…
        </div>
      ) : error && validTiles.length === 0 ? (
        <div
          role="alert"
          className="rounded-card border border-line bg-white p-6 text-center text-[12px] text-ink-soft"
        >
          {error}
        </div>
      ) : validTiles.length > 0 ? (
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-4
            lg:grid-cols-8
            gap-4
          "
        >
          {validTiles.map((cat) => (
            <Link
              key={cat.name}
              href={`/categories?category=${encodeURIComponent(
                cat.name,
              )}`}
              className="
                group
                block
                overflow-hidden
                rounded-card
                bg-white
                border
                border-line
                text-center
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-pop
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-green
                focus-visible:ring-offset-2
              "
            >
              {/* =================================================
                  CATEGORY IMAGE
              ================================================= */}
              <div
                className="
                  h-[70px]
                  w-full
                  bg-cover
                  bg-center
                  bg-no-repeat
                  transition-transform
                  duration-300
                  group-hover:scale-[1.02]
                "
                style={
                  cat.image
                    ? {
                        backgroundImage: `url(${cat.image})`,
                      }
                    : undefined
                }
                role="img"
                aria-label={cat.name}
              />

              {/* =================================================
                  CATEGORY NAME
              ================================================= */}
              <div
                className="
                  flex
                  min-h-[42px]
                  items-center
                  justify-center
                  px-2
                  py-2.5
                  text-[11px]
                  font-semibold
                  leading-snug
                  !text-black
                "
              >
                {cat.name}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          role="status"
          className="rounded-card border border-line bg-white p-6 text-center text-[12px] text-ink-soft"
        >
          Wholesale categories are currently unavailable.
        </div>
      )}
    </section>
  );
}
