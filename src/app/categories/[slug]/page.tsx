"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import Footer from "@/app/components/Footer";
import Breadcrumb from "@/app/components/Dashboard/Breadcrumb";
import BulkCTA from "@/app/components/Dashboard/BulkCTA";
import CategoryHeader from "@/app/components/Dashboard/CategoryHeader";
import FiltersSidebar from "@/app/components/Dashboard/FiltersSidebar";
import MainNav from "@/app/MainNav";
import Newsletter from "@/app/components/Dashboard/Newsletter";
import PopularBrands from "@/app/components/Dashboard/PopularBrands";
import ProductGrid from "@/app/components/Dashboard/ProductGrid";
import ProductToolbar from "@/app/components/Dashboard/ProductToolbar";
import RecentlyViewed from "@/app/components/Dashboard/RecentlyViewed";
import WhyChooseUs from "@/app/components/Dashboard/WhyChooseUs";
import Header from "@/app/components/Header";
import Pagination from "@/app/components/Pagination";
import { categoriesApi } from "@/app/api/services";

/* =========================================================
    VALIDATION HELPERS
    ========================================================= */

/**
 * Validate category title.
 */
function isValidCategoryTitle(
  value: string
): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 100
  );
}

/**
 * Validate product count.
 */
function isValidProductCount(
  value: number
): boolean {
  return (
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

/**
 * Validate description.
 */
function isValidDescription(
  value: string
): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 500
  );
}

/**
 * Validate recently viewed user.
 */
function isValidUserName(
  value: string
): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 100
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CategoryPage() {
  const params = useParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params?.slug)
    ? (params.slug[0] ?? "")
    : (params?.slug ?? "");

  /* =======================================================
     MOBILE NAVIGATION
  ======================================================= */

  const [navOpen, setNavOpen] =
    useState(false);

  /* =======================================================
     RESOLVE SLUG -> CATEGORY (#20 list, #41 grid)
  ======================================================= */

  const [categoryId, setCategoryId] =
    useState("");

  const [resolvedTitle, setResolvedTitle] =
    useState("");

  const [resolvedDescription, setResolvedDescription] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const resolveSlug = async () => {
      try {
        // #20 GET /api/v1/categories
        const response = await categoriesApi.list();
        const payload: unknown = response.data;
        const items: unknown[] = Array.isArray(payload)
          ? payload
          : Array.isArray(
                (payload as Record<string, unknown>)?.items
              )
            ? ((payload as Record<string, unknown>).items as unknown[])
            : [];

        const target = slug.toLowerCase().trim();
        const match = items.find((entry) => {
          if (typeof entry !== "object" || entry === null) return false;
          const raw = entry as Record<string, unknown>;
          const name = String(raw.categoryName ?? raw.name ?? "");
          const slugified = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
          const code = String(
            raw.categoryCode ?? raw.code ?? ""
          ).toLowerCase();
          const id = String(
            raw.categoryId ?? raw.id ?? ""
          ).toLowerCase();
          return (
            target === slugified || target === code || target === id
          );
        }) as Record<string, unknown> | undefined;

        if (cancelled || !match) return;

        setCategoryId(String(match.categoryId ?? match.id ?? ""));
        if (typeof match.categoryName === "string" && match.categoryName) {
          setResolvedTitle(match.categoryName);
        }
        if (typeof match.description === "string" && match.description) {
          setResolvedDescription(match.description);
        }
      } catch {
        // Keep static fallback content below.
      }
    };

    if (slug) resolveSlug();
  }, [slug]);

  /* =======================================================
     VALIDATE STATIC CATEGORY DATA
  ======================================================= */

  const categoryTitle =
    resolvedTitle || "";

  const categoryCount = 0;

  const categoryDescription =
    resolvedDescription || "";

  const recentlyViewedUser = "";

  /* =======================================================
     NAVIGATION HANDLERS
  ======================================================= */

  const handleOpenNavigation = () => {
    setNavOpen(true);
  };

  const handleCloseNavigation = () => {
    setNavOpen(false);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* =================================================
          STICKY TOP: HEADER + MAIN NAV
      ================================================= */}

      <div className="sticky top-0 z-50 bg-white">
        {/* =================================================
            HEADER
        ================================================= */}

        <Header
          onMenuClick={
            handleOpenNavigation
          }
        />

        {/* =================================================
            MAIN NAVIGATION
        ================================================= */}

        <MainNav
          open={navOpen}
          onClose={
            handleCloseNavigation
          }
        />
      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <Breadcrumb
          trail={[
            "Home",
            "Categories",
            categoryTitle,
          ]}
        />

        {/* =================================================
            CATEGORY HEADER
        ================================================= */}

        <CategoryHeader
          title={categoryTitle}
          count={categoryCount}
          description={
            categoryDescription
          }
        />

        {/* =================================================
            PRODUCT AREA
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* =================================================
              FILTER SIDEBAR
          ================================================= */}

          <aside
            aria-label="Product filters"
            className="min-w-0"
          >
            <FiltersSidebar />
          </aside>

          {/* =================================================
              PRODUCT CONTENT
          ================================================= */}

          <div className="flex min-w-0 flex-col gap-6">
            {/* =================================================
                TOOLBAR + PRODUCTS
            ================================================= */}

            <section
              aria-label="Category products"
              className="min-w-0"
            >
              <ProductToolbar />

              {/* #41 products in this category */}
              <ProductGrid categoryId={categoryId} />
            </section>

            {/* =================================================
                BULK CTA
            ================================================= */}

            <BulkCTA />

            {/* =================================================
                PAGINATION
            ================================================= */}

            <nav
              aria-label="Product pagination"
            >
              <Pagination />
            </nav>
          </div>
        </div>

        {/* =================================================
            RECENTLY VIEWED
        ================================================= */}

        {recentlyViewedUser && (
          <RecentlyViewed
            user={
              recentlyViewedUser
            }
          />
        )}

        {/* =================================================
            POPULAR BRANDS
        ================================================= */}

        <PopularBrands />

        {/* =================================================
            WHY CHOOSE US
        ================================================= */}

        <WhyChooseUs />

        {/* =================================================
            NEWSLETTER
        ================================================= */}

        <Newsletter />
      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />
    </div>
  );
}
