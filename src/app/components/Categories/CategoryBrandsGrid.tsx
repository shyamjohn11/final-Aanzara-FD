// File: app/components/Categories/CategoryBrandsGrid.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  ArrowRight,
} from "lucide-react";
import { brandsApi } from "@/app/api/services";

type BrandTile = {
  name: string;
  count: string | number;
};

export default function CategoryBrandsGrid() {
  // =====================================================
  // LIVE DATA — GET /api/admin/brands (#43)
  // =====================================================

  const [tiles, setTiles] = useState<BrandTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await brandsApi.list();
        const items = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        if (cancelled) return;

        const live: BrandTile[] = items
          .map((raw: any) => {
            const name = String(raw?.brandName ?? raw?.name ?? "").trim();
            // Brand list carries no product count; keep a generic label
            // so the existing count validation + JSX stay intact.
            const count =
              typeof raw?.productCount === "number" && Number.isFinite(raw.productCount)
                ? raw.productCount
                : typeof raw?.count === "string" && raw.count.trim().length > 0
                  ? raw.count
                  : "Explore range";
            return { name, count };
          })
          .filter(
            (brand: BrandTile) =>
              typeof brand.name === "string" && brand.name.trim().length > 0
          );

        setTiles(live);
      } catch {
        if (!cancelled) {
          setError("Brand information is currently unavailable.");
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
  // FULL DATA VALIDATION
  // =====================================================

  const validBrands = Array.isArray(
    tiles
  )
    ? tiles.filter((brand: BrandTile) => {
        // ---------------------------------------------
        // OBJECT VALIDATION
        // ---------------------------------------------

        if (
          !brand ||
          typeof brand !== "object"
        ) {
          return false;
        }

        const {
          name,
          count,
        } = brand;

        // ---------------------------------------------
        // NAME VALIDATION
        // ---------------------------------------------

        const validName =
          typeof name === "string" &&
          name.trim().length > 0;

        // ---------------------------------------------
        // COUNT VALIDATION
        // ---------------------------------------------

        const validCount =
          (typeof count === "string" &&
            count.trim().length > 0) ||
          (typeof count === "number" &&
            Number.isFinite(count) &&
            count >= 0);

        return (
          validName &&
          validCount
        );
      })
    : [];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section
      aria-labelledby="popular-brands-title"
    >
      {/* =================================================
          HEADING
      ================================================== */}

      <h2
        id="popular-brands-title"
        className="font-sora font-bold text-[19px] text-navy"
      >
        Popular Brands
      </h2>

      {/* =================================================
          DESCRIPTION
      ================================================== */}

      <p className="text-[12.5px] text-ink-soft mt-1">
        We supply associations with leading FMCG manufacturers ensuring
        authentic quality and optimal margins
      </p>

      {/* =================================================
          BRANDS GRID
      ================================================== */}

      {loading ? (
        <div
          role="status"
          className="
            bg-white
            border border-line
            rounded-card
            p-6
            mt-5
            text-center
            text-[11px]
            text-ink-soft
          "
        >
          Loading brands…
        </div>
      ) : error && validBrands.length === 0 ? (
        <div
          role="alert"
          className="
            bg-white
            border border-line
            rounded-card
            p-6
            mt-5
            text-center
            text-[11px]
            text-ink-soft
          "
        >
          {error}
        </div>
      ) : validBrands.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {validBrands.map(
            (brand, index) => (
              <button
                key={`${brand.name}-${index}`}
                type="button"
                aria-label={`Explore ${brand.name}`}
                className="
                  flex
                  items-center
                  gap-3
                  bg-white
                  border border-line
                  rounded-card
                  p-3.5
                  text-left
                  hover:border-blue
                  hover:shadow-card
                  transition-all
                "
              >
                {/* ==========================================
                    BRAND ICON
                =========================================== */}

                <span
                  className="
                    w-11
                    h-11
                    rounded-lg
                    bg-paper-deep
                    text-navy
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                  aria-hidden="true"
                >
                  <Building2 size={18} />
                </span>

                {/* ==========================================
                    BRAND CONTENT
                =========================================== */}

                <div className="min-w-0">

                  {/* BRAND NAME */}

                  <div className="text-[13px] font-bold text-ink truncate">
                    {brand.name}
                  </div>

                  {/* BRAND COUNT */}

                  <div className="text-[11px] text-ink-faint mt-0.5">
                    {brand.count}
                  </div>

                  {/* EXPLORE */}

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue mt-1">
                    <span>Explore</span>

                    <ArrowRight
                      size={11}
                      aria-hidden="true"
                    />
                  </div>

                </div>
              </button>
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
            border border-line
            rounded-card
            p-6
            mt-5
            text-center
            text-[11px]
            text-ink-soft
          "
        >
          Brand information is currently unavailable.
        </div>
      )}
    </section>
  );
}
