"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Image as ImageIcon } from "lucide-react";
import { extractErrorMessage } from "@/app/api/api"; // Update path as needed
import { categoriesApi } from "@/app/api/services";

const INITIAL_COUNT = 12;

// =====================================================
// TYPES
// =====================================================

interface Category {
  categoryId: string;
  categoryName: string;
  description: string;
  productCount: number;
  hasSubCategory: boolean;
  imageUrl: string | null;
  imageError: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

type AllCategoriesGridProps = {
  activeCategory?: string;
};

export default function AllCategoriesGrid({ activeCategory }: AllCategoriesGridProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [savedCategories, setSavedCategories] = useState<string[]>([]);

  // =====================================================
  // FETCH CATEGORIES
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await categoriesApi.list();
        const payload: any = response?.data ?? response;

        // Handle both array and object responses
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (rawItems.length === 0 && !Array.isArray(payload)) {
          throw new Error("Invalid response format");
        }

        const items: Category[] = rawItems
          .filter((raw: any) => raw?.categoryId)
          .map((raw: any) => ({
            categoryId: String(raw.categoryId),
            categoryName: String(raw.categoryName ?? "Category"),
            description: String(raw.description ?? "Wholesale sourced range"),
            productCount: Number(raw.productCount ?? 0),
            hasSubCategory: Boolean(raw.hasSubCategory),
            imageUrl:
              typeof raw.primaryImageUrl === "string" &&
              raw.primaryImageUrl.length > 0
                ? raw.primaryImageUrl
                : null,
            imageError: false,
          }));

        if (!cancelled) {
          setCategories(items);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = extractErrorMessage(
            err,
            "Failed to load categories"
          );
          setError(errorMessage);
        }
        console.error("Error fetching categories:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================================
  // VALIDATE INITIAL COUNT
  // =====================================================

  const safeInitialCount =
    Number.isFinite(INITIAL_COUNT) && INITIAL_COUNT > 0
      ? Math.floor(INITIAL_COUNT)
      : 12;

  // =====================================================
  // FILTERED + VISIBLE CATEGORIES — actually honors the pill selection
  // =====================================================

  const filteredCategories =
    !activeCategory || activeCategory.toLowerCase() === "all"
      ? categories
      : categories.filter((c) => c.categoryName.toLowerCase() === activeCategory.toLowerCase());

  const visibleCategories = showAll
    ? filteredCategories
    : filteredCategories.slice(0, safeInitialCount);

  // =====================================================
  // TOGGLE WISHLIST
  // =====================================================

  const handleWishlist = (categoryId: string) => {
    if (typeof categoryId !== "string" || categoryId.trim().length === 0) {
      return;
    }

    setSavedCategories((current) => {
      if (current.includes(categoryId)) {
        return current.filter((item) => item !== categoryId);
      }
      return [...current, categoryId];
    });
  };

  // =====================================================
  // MARK BROKEN IMAGE
  // =====================================================

  const handleImageError = (categoryId: string) => {
    setCategories((current) =>
      current.map((cat) =>
        cat.categoryId === categoryId ? { ...cat, imageError: true } : cat
      )
    );
  };

  // =====================================================
  // VIEW ALL
  // =====================================================

  const handleViewAll = () => {
    if (categories.length <= safeInitialCount) {
      return;
    }
    setShowAll(true);
  };

  // =====================================================
  // RENDER
  // =====================================================

  // Loading State
  if (loading) {
    return (
      <section aria-label="All product categories">
        <div
          role="status"
          className="
            bg-white
            border border-line
            rounded-card
            p-8
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          Loading categories...
        </div>
      </section>
    );
  }

  // Error State
  if (error) {
    return (
      <section aria-label="All product categories">
        <div
          role="alert"
          className="
            bg-white
            border border-red-300
            rounded-card
            p-8
            text-center
            text-[12px]
            text-red-600
          "
        >
          {error}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="All product categories">
      {/* =================================================
          EMPTY STATE
      ================================================== */}

      {categories.length === 0 ? (
        <div
          role="status"
          className="
            bg-white
            border border-line
            rounded-card
            p-8
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          No categories available at this time.
        </div>
      ) : (
        <>
          {/* =================================================
              CATEGORY GRID
          ================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleCategories.map((category, index) => {
              const isSaved = savedCategories.includes(category.categoryId);

              return (
                <article
                  key={`${category.categoryId}-${index}`}
                  className="
                    bg-white
                    border border-line
                    rounded-card
                    overflow-hidden
                    hover:shadow-card
                    transition-shadow
                  "
                >
                  {/* ==========================================
                      CATEGORY IMAGE / FALLBACK
                  =========================================== */}

                  <div
                    className="relative h-[110px] overflow-hidden bg-gradient-to-br from-[#EEF3FF] to-[#DCE7FA]"
                    role="img"
                    aria-label={`${category.categoryName} category`}
                  >
                    {!category.imageUrl || category.imageError ? (
                      // Fallback icon when the category has no image or the
                      // image fails to load
                      <div className="absolute inset-0 flex items-center justify-center text-[#8FA6C9]">
                        <ImageIcon size={32} aria-hidden="true" />
                      </div>
                    ) : (
                      // Streaming endpoint for the category's primary image
                      // (anonymous); same-origin through the Next.js /api rewrite.
                      // The list payload only includes imageUrl when an image exists.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(category.categoryId)}
                      />
                    )}

                    {/* Wholesale Badge */}
                    <span
                      className="
                        absolute
                        top-2.5
                        right-2.5
                        bg-green-deep
                        text-white
                        text-[9.5px]
                        font-bold
                        px-2
                        py-1
                        rounded-md
                        z-10
                      "
                    >
                      Wholesale
                    </span>
                  </div>

                  {/* ==========================================
                      CATEGORY CONTENT
                  =========================================== */}

                  <div className="p-3.5">
                    {/* CATEGORY NAME */}

                    <h2 className="text-[13.5px] font-bold text-ink truncate">
                      {category.categoryName}
                    </h2>

                    {/* DESCRIPTION */}

                    <p
                      className="
                        text-[11px]
                        text-ink-faint
                        mt-0.5
                        leading-relaxed
                        line-clamp-1
                      "
                      title={category.description}
                    >
                      {category.description}
                    </p>

                    {/* ========================================
                        TYPE + PRODUCT COUNT
                    ========================================= */}

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <div className="text-[9.5px] font-semibold text-ink-faint uppercase tracking-wide">
                          Type
                        </div>
                        <div className="text-[13px] font-bold text-navy">
                          {category.hasSubCategory ? "Parent" : "Standard"}
                        </div>
                      </div>

                      <div className="text-[11px] text-ink-soft font-medium text-right">
                        {category.productCount > 0
                          ? `${category.productCount} Products`
                          : "Wholesale range"}
                      </div>
                    </div>

                    {/* ========================================
                        ACTIONS
                    ========================================= */}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                      {/* EXPLORE */}

                      <Link
                        href={`/categories/${encodeURIComponent(
                          category.categoryId
                        )}`}
                        aria-label={`Explore ${category.categoryName} category`}
                        className="
                          flex
                          items-center
                          gap-1
                          text-[11.5px]
                          font-bold
                          text-blue
                          hover:text-blue-deep
                          transition-colors
                        "
                      >
                        Explore Category
                        <ArrowRight size={12} aria-hidden="true" />
                      </Link>

                      {/* WISHLIST */}

                      <button
                        type="button"
                        onClick={() => handleWishlist(category.categoryId)}
                        aria-label={
                          isSaved
                            ? `Remove ${category.categoryName} from saved categories`
                            : `Save ${category.categoryName}`
                        }
                        aria-pressed={isSaved}
                        className="
                          text-ink-faint
                          hover:text-green
                          transition-colors
                        "
                      >
                        <Heart
                          size={15}
                          aria-hidden="true"
                          className={
                            isSaved ? "fill-green text-green" : ""
                          }
                        />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* =================================================
              VIEW ALL
          ================================================== */}

          {!showAll && categories.length > safeInitialCount && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={handleViewAll}
                className="
                  border
                  border-line
                  text-ink
                  font-semibold
                  text-[12.5px]
                  px-6
                  py-3
                  rounded-lg
                  hover:border-blue
                  hover:text-blue
                  transition-colors
                "
              >
                View All {categories.length} Categories
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
