// File: app/components/Dashboard/PopularBrands.tsx
"use client";

import { useEffect, useState } from "react";
import { storefrontBrandsApi } from "@/app/api/services";

export default function PopularBrands() {
  return null;
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  /* ============================================================
     BRANDS — live list from GET /api/v1/brands (public, active only)
  ============================================================ */

  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadBrands = async () => {
      try {
        setLoading(true);
        const { data } = await storefrontBrandsApi.list({ count: 12 });
        const items = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        if (cancelled) return;

        const names = items
          .map((raw: any) =>
            String(raw?.brandName ?? raw?.name ?? "").trim()
          )
          .filter((name: string) => name.length > 0)
          .slice(0, 12);

        setBrands(names);
      } catch {
        // Catalog unreachable — the section simply hides itself.
        if (!cancelled) {
          setBrands([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBrands();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     BRAND HANDLER
  ============================================================ */

  const handleBrandClick = (brand: string) => {
    if (
      typeof brand !== "string" ||
      brand.trim().length === 0
    ) {
      return;
    }

    setSelectedBrand(brand);
  };

  /* ============================================================
     EMPTY STATE — hide until the catalog provides brands
  ============================================================ */

  if (loading) {
    return null;
  }

  if (brands.length === 0) {
    return null;
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <section aria-labelledby="popular-brands-title">
      <h2
        id="popular-brands-title"
        className="font-sora font-bold text-[16px] text-navy mb-4"
      >
        Popular Brands
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {brands.map((brand, index) => {
          const isSelected = selectedBrand === brand;

          return (
            <button
              key={`${brand}-${index}`}
              type="button"
              onClick={() => handleBrandClick(brand)}
              aria-label={`Select ${brand}`}
              aria-pressed={isSelected}
              className={`
                bg-white
                border
                rounded-lg
                py-4
                px-2
                text-[13.5px]
                font-bold
                transition-colors
                ${
                  isSelected
                    ? "border-blue text-blue bg-blue/5"
                    : "border-line text-ink hover:border-blue hover:text-blue"
                }
              `}
            >
              {brand}
            </button>
          );
        })}
      </div>
    </section>
  );
}
