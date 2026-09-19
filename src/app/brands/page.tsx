"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  ChevronDown,
  Search,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import MainNav from "@/app/MainNav";
import TopBar from "../components/Dashboard/TopBar";
import { storefrontBrandsApi } from "@/app/api/services";
import { toast } from "react-toastify";

type Brand = {
  name: string;
  category: string;
  logo: string;
  logoClass?: string;
  imageUrl?: string;
  brandId?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const categories = [
  "All Brands",
  "Food & Beverages",
  "Personal Care",
  "Home Care",
  "Health Care",
  "Baby Care",
  "Snacks & Branded Foods",
  "Dairy & Bakery",
];

/* ---------------------------------------------------------
   BRANDS — backend only (GET /api/v1/brands, public, active only).
   No hardcoded brands: the grid below renders live API data only.
--------------------------------------------------------- */

/* ---------------------------------------------------------
   VALIDATION HELPERS
--------------------------------------------------------- */

const MAX_SEARCH_LENGTH = 50;

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

function isValidBrand(brand: Brand): boolean {
  if (!brand) return false;

  if (
    typeof brand.name !== "string" ||
    typeof brand.category !== "string" ||
    typeof brand.logo !== "string"
  ) {
    return false;
  }

  const name = normalizeText(brand.name);
  const category = normalizeText(brand.category);
  const logo = normalizeText(brand.logo);

  if (!name || !category || !logo) {
    return false;
  }

  if (name.length > 100) {
    return false;
  }

  if (category.length > 100) {
    return false;
  }

  if (logo.length > 100) {
    return false;
  }

  return true;
}

function sanitizeSearch(value: string): string {
  return normalizeText(value)
    .slice(0, MAX_SEARCH_LENGTH);
}

/* ---------------------------------------------------------
   PAGE
--------------------------------------------------------- */

export default function BrandsPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] =
    useState<string>("");

  const [visibleCount, setVisibleCount] =
    useState<number>(21);

  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  /* -------------------------------------------------------
     LIVE CATALOG + SERVER SEARCH (GET /api/v1/brands) — backend only.
     Public endpoint: works for guests and signed-in users alike.
     No static fallback: only backend data is displayed.
  ------------------------------------------------------- */

  const [catalogBrands, setCatalogBrands] = useState<Brand[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      try {
        setCatalogLoading(true);
        setCatalogError("");
        // GET /api/v1/brands — full public brand catalogue
        const response = await storefrontBrandsApi.list({ count: 100 });
        const payload: unknown = response.data;
        const items: unknown[] = Array.isArray(payload)
          ? payload
          : Array.isArray(
              (payload as Record<string, unknown>)?.items,
            )
            ? ((payload as Record<string, unknown>).items as unknown[])
            : [];

        if (cancelled) return;

        const mapped: Brand[] = [];

        items.forEach((entry) => {
          if (typeof entry !== "object" || entry === null) return;
          const raw = entry as Record<string, unknown>;
          const name = String(
            raw.brandName ?? raw.name ?? "",
          ).trim();
          if (!name) return;

          const brandId = String(raw.brandId ?? raw.id ?? "").trim();
          const imageUrl = String(raw.imageUrl ?? "").trim();
          mapped.push({
            name,
            category: String(
              raw.categoryName ?? raw.category ?? "General",
            ),
            logo: name.slice(0, 24),
            imageUrl: imageUrl || undefined,
            brandId: brandId || undefined,
          });
        });

        setCatalogBrands(mapped.filter(isValidBrand));
      } catch {
        // Backend-only: show empty state when the brand API is unreachable.
        if (!cancelled) {
          const message = "Live brand catalogue is currently unavailable.";
          setCatalogError(message);
          setCatalogBrands([]);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    };

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const [serverBrands, setServerBrands] =
    useState<Brand[]>([]);

  useEffect(() => {
    const query = sanitizeSearch(searchQuery).trim();

    if (!query) {
      setServerBrands([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        // GET /api/v1/brands?search= — public name-filtered catalogue
        const response = await storefrontBrandsApi.list({
          search: query,
          count: 21,
        });
        const payload: unknown = response.data;
        const rawItems: unknown[] = Array.isArray(payload)
          ? payload
          : Array.isArray(
              (payload as Record<string, unknown>)?.items,
            )
            ? ((payload as Record<string, unknown>).items as unknown[])
            : [];

        if (cancelled) return;

        const mapped: Brand[] = [];

        rawItems.forEach((entry) => {
          if (typeof entry !== "object" || entry === null) return;
          const raw = entry as Record<string, unknown>;
          const name = String(
            raw.brandName ?? raw.name ?? "",
          ).trim();
          if (!name) return;

          const brandId = String(raw.brandId ?? raw.id ?? "").trim();
          const imageUrl = String(raw.imageUrl ?? "").trim();
          mapped.push({
            name,
            category: String(
              raw.categoryName ?? raw.category ?? "General",
            ),
            logo: name.slice(0, 24),
            imageUrl: imageUrl || undefined,
            brandId: brandId || undefined,
          });
        });

        setServerBrands(
          mapped.filter(isValidBrand).slice(0, 21),
        );
      } catch {
        // Backend-only: clear server results when search API is unreachable.
        if (!cancelled) setServerBrands([]);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  /* -------------------------------------------------------
     VALIDATED BRAND LIST
  ------------------------------------------------------- */

  const validBrands = useMemo(() => {
    const uniqueBrands = new Map<string, Brand>();

    // Backend-only: server search + catalog list. No hardcoded brands.
    [...serverBrands, ...catalogBrands].forEach((brand) => {
      if (!isValidBrand(brand)) {
        return;
      }

      const normalizedName = normalizeText(
        brand.name
      ).toLowerCase();

      if (!uniqueBrands.has(normalizedName)) {
        uniqueBrands.set(normalizedName, {
          ...brand,
          name: normalizeText(brand.name),
          category: normalizeText(brand.category),
          logo: brand.logo,
        });
      }
    });

    return Array.from(uniqueBrands.values());
  }, [serverBrands, catalogBrands]);

  /* -------------------------------------------------------
     SEARCH FILTER — by brand name only (no "General" category)
  ------------------------------------------------------- */

  const filteredBrands = useMemo(() => {
    const query = sanitizeSearch(searchQuery).toLowerCase();
    if (!query) return validBrands;
    return validBrands.filter((brand) =>
      brand.name.toLowerCase().includes(query)
    );
  }, [validBrands, searchQuery]);

  /* -------------------------------------------------------
     VISIBLE BRANDS
  ------------------------------------------------------- */

  const visibleBrands = useMemo(() => {
    return filteredBrands.slice(
      0,
      Math.max(0, visibleCount)
    );
  }, [filteredBrands, visibleCount]);

  /* -------------------------------------------------------
     HANDLERS
  ------------------------------------------------------- */

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    const sanitizedValue =
      sanitizeSearch(value);

    setSearchQuery(sanitizedValue);

    // Reset pagination whenever search changes.
    setVisibleCount(21);
  };

  const handleLoadMore = () => {
    setVisibleCount((current) => {
      const nextCount = current + 14;

      return Math.min(
        nextCount,
        filteredBrands.length
      );
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setVisibleCount(21);
  };

  /* -------------------------------------------------------
     COUNTS
  ------------------------------------------------------- */

  const hasFilters = searchQuery.trim().length > 0;

  const hasMore =
    visibleCount < filteredBrands.length;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* STICKY TOP: TOPBAR + HEADER + MOBILE NAV */}
      <div className="sticky top-0 z-50">
        {/* TOP BAR */}
        <TopBar />

        {/* HEADER */}
        <Header
          onMenuClick={() =>
            setMobileMenuOpen(true)
          }
        />

        {/* MOBILE NAV */}
        <MainNav
          open={mobileMenuOpen}
          onClose={() =>
            setMobileMenuOpen(false)
          }
        />
      </div>

      <main className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6">
                {/* =================================================
            HERO
        ================================================= */}

        <section
          aria-labelledby="brands-page-title"
          className="relative min-h-[400px] w-full overflow-hidden rounded-xl shadow-lg"
        >
          {/* Background Image - Changed to object-contain with a clean background so it fits entirely */}
          <img
            src="/images/Brand/Brand.png"
            alt="Brands hero background"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* Overlay - Added a radial gradient to darken the center for readability */}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.2)_70%)]"
            aria-hidden="true"
          />

          {/* Content - Narrower max-width to avoid covering side logos */}
          <div className="relative z-10 flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
            
            {/* Title */}
            <h1
              id="brands-page-title"
              className="text-[36px] font-bold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] sm:text-[44px] md:text-[48px]"
            >
              Shop by Brands
            </h1>

            {/* Description - Added max-width to keep it centered and clean */}
            <p className="mt-3 max-w-[450px] text-[15px] font-medium leading-6 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] sm:text-[16px]">
              Partnering with India&apos;s most trusted brands to bring quality products to your business.
            </p>
          </div>
        </section>

        {/* =================================================
            TRUST CARDS
        ================================================= */}

        <section
          aria-label="Brand trust benefits"
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <TrustCard
            icon={
              <Award
                size={31}
                strokeWidth={1.6}
              />
            }
            title="100+ Trusted Brands"
            text="Top national & international brands"
          />

          <TrustCard
            icon={
              <ShieldCheck
                size={31}
                strokeWidth={1.6}
              />
            }
            title="100% Original Products"
            text="Genuine products, always"
          />

          <TrustCard
            icon={
              <Truck
                size={31}
                strokeWidth={1.6}
              />
            }
            title="Direct from Distributors"
            text="Best prices, direct access"
          />

          <TrustCard
            icon={
              <Star
                size={31}
                strokeWidth={1.6}
              />
            }
            title="Quality You Can Trust"
            text="Verified & quality assured"
          />
        </section>

        {/* =================================================
            TITLE + SEARCH
        ================================================= */}

        <section className="mt-7 flex flex-col gap-5 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-[25px] font-bold">
              All Brands
            </h2>

            <p className="mt-1 text-[14px] text-ink-soft">
              Explore products from 100+ trusted
              brands
            </p>
          </div>

          <div className="relative w-full lg:w-[310px]">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
              aria-hidden="true"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              maxLength={MAX_SEARCH_LENGTH}
              autoComplete="off"
              spellCheck={false}
              placeholder="Search brands..."
              aria-label="Search brands"
              className="h-[42px] w-full rounded-lg border border-line bg-white pl-11 pr-4 text-[13px] outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
            />
          </div>
        </section>

        {/* =================================================
            CATEGORY BUTTONS
        ================================================= */}

        {/* =================================================
            RESULT INFO
        ================================================= */}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p
            className="text-[12px] text-ink-soft"
            aria-live="polite"
          >
            {catalogLoading && filteredBrands.length === 0
              ? "Loading brands…"
              : filteredBrands.length === 0
                ? (catalogError || "No brands found")
                : `Showing ${Math.min(
                  visibleCount,
                  filteredBrands.length
                )} of ${
                  filteredBrands.length
                } brands`}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[12px] font-semibold text-navy underline underline-offset-2 hover:opacity-80"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* =================================================
            BRAND GRID
        ================================================= */}

        {visibleBrands.length > 0 ? (
          <section
            aria-label="Brand list"
            className="mt-4 grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7"
          >
            {visibleBrands.map(
              (brand) => (
                <Link
                  href={`/brands/${slugify(brand.name)}`}
                  key={`${brand.name}-${brand.category}`}
                  aria-label={`View ${brand.name} brand`}
                  className="group flex min-h-[114px] flex-col items-center justify-center rounded-xl border border-line bg-white px-4 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-1 hover:border-[#b8c7dc] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <div className="flex h-[52px] items-center justify-center text-center">
                    <span
                      className={
                        brand.logoClass ||
                        "font-semibold text-ink"
                      }
                    >
                      {brand.logo}
                    </span>
                  </div>

                  <p className="mt-2 text-center text-[13px] font-bold text-ink truncate w-full px-2" title={brand.name}>
                    {brand.name}
                  </p>
                </Link>
              )
            )}
          </section>
        ) : (
          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="mt-6 rounded-xl border border-dashed border-line bg-white py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper">
              <Search
                size={22}
                className="text-ink-soft"
              />
            </div>

            <h3 className="mt-4 text-lg font-semibold">
              No brands found
            </h3>

            <p className="mt-2 text-sm text-ink-soft">
              Try searching for another brand or
              category.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-5 rounded-lg bg-navy px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* =================================================
            LOAD MORE
        ================================================= */}

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              aria-label="Load more brands"
              className="flex items-center gap-2 rounded-xl border border-line bg-white px-8 py-3 text-[13px] font-semibold text-navy shadow-sm transition hover:bg-paper focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              Load More Brands

              <ChevronDown
                size={17}
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

/* =========================================================
   TRUST CARD
========================================================= */

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-[78px] items-center gap-4 rounded-xl border border-line bg-white px-6 shadow-sm">
      <div
        className="text-navy"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div>
        <h3 className="text-[14px] font-bold">
          {title}
        </h3>

        <p className="mt-1 text-[12px] text-ink-soft">
          {text}
        </p>
      </div>
    </div>
  );
}
