// File: app/brands/[slug]/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import TopBar from "@/app/components/Dashboard/TopBar";
import Breadcrumb from "@/app/components/Dashboard/Breadcrumb";
import BulkCTA from "@/app/components/Dashboard/BulkCTA";
import BrandFiltersSidebar from "@/app/components/Dashboard/BrandFiltersSidebar";
import BrandProductGrid from "@/app/components/Dashboard/BrandProductGrid";
import ProductToolbar from "@/app/components/Dashboard/ProductToolbar";
import Pagination from "@/app/components/Pagination";

/* ============================================================
   SLUG HELPER — same rule used on the Brands list page, so
   card links and this route agree on the same slug format.
============================================================ */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ============================================================
   DUMMY BRAND DATA
   Replace this with a real brandsApi.list() lookup later — the
   rest of the page (state, rendering) does not need to change.
============================================================ */

const DUMMY_BRANDS = [
  { id: "brand-1", name: "aanzara" },
  { id: "brand-2", name: "apple" },
  { id: "brand-3", name: "cadbory" },
  { id: "brand-4", name: "Ponds" },
  { id: "brand-5", name: "Sunfeast" },
];

/* ============================================================
   PAGE
============================================================ */

export default function BrandDetailPage() {
  const params = useParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params?.slug)
    ? (params.slug[0] ?? "")
    : (params?.slug ?? "");

  /* =======================================================
     MOBILE NAVIGATION
  ======================================================= */

  const [navOpen, setNavOpen] = useState(false);

  /* =======================================================
     RESOLVE SLUG -> DUMMY BRAND
  ======================================================= */

  const brand = useMemo(() => {
    const target = slug.toLowerCase().trim();
    return DUMMY_BRANDS.find((entry) => slugify(entry.name) === target);
  }, [slug]);

  /* =======================================================
     CATEGORY FILTER (left sidebar) — empty string = All Categories
  ======================================================= */

  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  /* =======================================================
     PRODUCT COUNT (from BrandProductGrid, for the header line)
  ======================================================= */

  const [productCount, setProductCount] = useState(0);

  /* =======================================================
     NAVIGATION HANDLERS
  ======================================================= */

  const handleOpenNavigation = () => setNavOpen(true);
  const handleCloseNavigation = () => setNavOpen(false);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* =================================================
          STICKY TOP: TOPBAR + HEADER + MOBILE NAV
          (identical structure to the Brands list page —
          nothing changes visually)
      ================================================= */}

      <div className="sticky top-0 z-50">
        <TopBar />

        <Header onMenuClick={handleOpenNavigation} />

        <MainNav open={navOpen} onClose={handleCloseNavigation} />
      </div>

      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <Breadcrumb
          trail={["Home", "Brands", brand?.name || "Brand"]}
        />

        {/* =================================================
            BRAND HEADER
        ================================================= */}

        <div className="border-b border-line pb-5">
          <h1 className="text-[25px] font-bold text-ink capitalize">
            {brand?.name || "Brand not found"}
          </h1>

          {brand && (
            <p className="mt-1 text-[14px] text-ink-soft">
              {productCount > 0
                ? `${productCount} products available`
                : "Browse products from this brand"}
            </p>
          )}

          {!brand && (
            <p className="mt-1 text-[14px] text-red-600">
              This brand could not be found.
            </p>
          )}
        </div>

        {brand && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
            {/* =================================================
                CATEGORY FILTER SIDEBAR
            ================================================= */}

            <aside aria-label="Product filters" className="min-w-0">
              <BrandFiltersSidebar
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
              />
            </aside>

            {/* =================================================
                PRODUCT CONTENT
            ================================================= */}

            <div className="flex min-w-0 flex-col gap-6">
              <section aria-label="Brand products" className="min-w-0">
                <ProductToolbar />

                <BrandProductGrid
                  brandId={brand.id}
                  categoryId={selectedCategoryId || undefined}
                  onTotalCountChange={setProductCount}
                />
              </section>

              <BulkCTA />

              <nav aria-label="Product pagination">
                <Pagination />
              </nav>
            </div>
          </div>
        )}
      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />
    </div>
  );
}
