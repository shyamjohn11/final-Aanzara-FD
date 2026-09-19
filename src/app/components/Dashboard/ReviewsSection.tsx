"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, ThumbsUp, BadgeCheck } from "lucide-react";
import { storefrontReviewsApi } from "@/app/api/services";
import {
  REVIEW_SUMMARY,
  REVIEWS,
} from "@/app/data/productDetail";

type LiveReview = {
  name: string;
  date: string;
  rating: number;
  text: string;
  verified: boolean;
  helpful: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    for (const key of ["items", "reviews", "data"]) {
      const nested = payload[key];

      if (Array.isArray(nested)) {
        return nested.filter(isRecord);
      }
    }
  }

  return [];
}

function getTextField(
  raw: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = raw[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function getRating(raw: Record<string, unknown>): number {
  for (const key of ["rating", "stars", "score"]) {
    const value = Number(raw[key]);

    if (Number.isFinite(value)) {
      return Math.min(Math.max(Math.round(value), 0), 5);
    }
  }

  return 0;
}

function formatReviewDate(raw: Record<string, unknown>): string {
  const rawDate = getTextField(raw, [
    "createdAt",
    "reviewDate",
    "date",
    "updatedAt",
  ]);

  if (!rawDate) {
    return "Recently";
  }

  const parsed = new Date(rawDate);

  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// #127 GET /api/admin/reviews — map backend rows onto review cards.
function mapReviewRow(raw: Record<string, unknown>): LiveReview | null {
  const text = getTextField(raw, [
    "reviewText",
    "comment",
    "text",
    "message",
    "review",
  ]);

  if (!text) {
    return null;
  }

  const status = getTextField(raw, ["status"]);

  return {
    name: getTextField(raw, [
      "reviewerName",
      "customerName",
      "userName",
      "name",
    ]) || "Customer",
    date: formatReviewDate(raw),
    rating: getRating(raw),
    text,
    verified: Boolean(
      raw["isVerified"] ??
        raw["verified"] ??
        (status ? status.toLowerCase() === "approved" : true),
    ),
    helpful: Number.isFinite(Number(raw["helpfulCount"]))
      ? Number(raw["helpfulCount"])
      : Number.isFinite(Number(raw["likes"]))
        ? Number(raw["likes"])
        : 0,
  };
}

function mapStaticReviews(): LiveReview[] {
  if (!Array.isArray(REVIEWS)) {
    return [];
  }

  return REVIEWS.filter(isRecord)
    .map((raw) => {
      const record = raw as unknown as Record<string, unknown>;
      const text = getTextField(record, ["text"]);

      if (!text) {
        return null;
      }

      return {
        name: getTextField(record, ["name"]) || "Customer",
        date: getTextField(record, ["date"]) || "Recently",
        rating: getRating(record),
        text,
        verified: Boolean(record["verified"] ?? false),
        helpful: Number.isFinite(Number(record["helpful"]))
          ? Number(record["helpful"])
          : 0,
      };
    })
    .filter((review): review is LiveReview => review !== null);
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<LiveReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Live reviews — public storefront GET /api/v1/reviews?productName=RIce, Approved only.
  // Tries product-specific first (Rice page), then generic latest.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(false);

      // Try to scope to the current product name if available from URL / product context
      const productName =
        typeof window !== "undefined"
          ? decodeURIComponent(window.location.pathname.split("/").pop() || "")
              .replace(/-/g, " ")
              .trim() || undefined
          : undefined;

      try {
        let live: LiveReview[] = [];
        // 1) product-scoped (e.g., RIce)
        if (productName && productName.length >= 2) {
          try {
            const res = await storefrontReviewsApi.list(productName, 25);
            const payload: unknown = (res as { data?: unknown })?.data ?? res;
            live = extractRows(payload).map(mapReviewRow).filter((r): r is LiveReview => r !== null);
          } catch {}
        }
        // 2) fallback to latest approved reviews
        if (live.length === 0) {
          const res = await storefrontReviewsApi.list(undefined, 25);
          const payload: unknown = (res as { data?: unknown })?.data ?? res;
          live = extractRows(payload).map(mapReviewRow).filter((r): r is LiveReview => r !== null);
        }

        if (!cancelled) {
          setReviews(live.length > 0 ? live : mapStaticReviews());
          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setReviews(mapStaticReviews());
          setLoadError(true);
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

  // Rating summary computed from live reviews, static fallback.
  const summary = useMemo(() => {
    if (reviews.length > 0) {
      const total = reviews.length;
      const sum = reviews.reduce(
        (acc, review) => acc + review.rating,
        0,
      );
      const average = Math.round((sum / total) * 10) / 10;
      const recommendPercent = Math.round(
        (reviews.filter((review) => review.rating >= 4).length /
          total) *
          100,
      );
      const breakdown = [5, 4, 3, 2, 1].map((star) => ({
        star,
        percent: Math.round(
          (reviews.filter((review) => review.rating === star).length /
            total) *
            100,
        ),
      }));

      return { average, total, recommendPercent, breakdown };
    }

    return REVIEW_SUMMARY;
  }, [reviews]);

  return (
    <section
      id="reviews"
      className="bg-white border border-line rounded-card p-5 sm:p-6"
    >
      {/* =====================================================
          REVIEW HEADER
      ===================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Rating Summary */}
        <div className="shrink-0">
          <h2 className="font-sora font-bold text-[15.5px] text-ink mb-3">
            {summary.total.toLocaleString()} Customer Reviews
          </h2>

          <div className="flex items-end gap-3">
            <span className="font-sora font-extrabold text-[34px] text-ink leading-none">
              {summary.average}
            </span>

            <div>
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled =
                    i < Math.round(summary.average);

                  return (
                    <Star
                      key={i}
                      size={14}
                      className={
                        filled
                          ? "fill-amber text-amber"
                          : "text-line"
                      }
                    />
                  );
                })}
              </div>

              <span className="text-[11.5px] text-ink-soft">
                {summary.recommendPercent}% of customers
                recommend this product
              </span>
            </div>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="flex-1 w-full max-w-[420px] flex flex-col gap-1.5">
          {summary.breakdown.map((row) => (
            <div
              key={row.star}
              className="flex items-center gap-2.5"
            >
              {/* Star Label */}
              <span className="text-[11px] text-ink-soft w-8 shrink-0">
                {row.star} Star
              </span>

              {/* Progress Bar */}
              <div className="flex-1 h-1.5 rounded-pill bg-paper-deep overflow-hidden">
                <div
                  className="h-full bg-green rounded-pill transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(row.percent, 0),
                      100
                    )}%`,
                  }}
                />
              </div>

              {/* Percentage */}
              <span className="text-[11px] text-ink-faint w-8 shrink-0 text-right">
                {row.percent}%
              </span>
            </div>
          ))}
        </div>

        {/* Write Review */}
        <button
          type="button"
          className="
            border
            border-line
            bg-white
            text-ink
            font-semibold
            text-[12px]
            px-4
            py-2.5
            rounded-lg
            shrink-0
            self-start
            hover:border-blue
            hover:text-blue
            transition-colors
          "
        >
          Write a Business Review
        </button>
      </div>

      {loadError && (
        <div
          role="alert"
          className="
            mt-4
            rounded-lg
            border
            border-amber-300
            bg-amber-50
            px-4
            py-2.5
            text-[12px]
            text-amber-800
          "
        >
          Live reviews could not be loaded. Showing available
          reviews instead.
        </div>
      )}

      {/* =====================================================
          CUSTOMER REVIEWS
      ===================================================== */}

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          aria-label="Loading customer reviews"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6"
        >
          {[0, 1, 2].map((skeleton) => (
            <div
              key={skeleton}
              className="border border-line rounded-lg p-4 flex flex-col gap-2"
            >
              <div className="h-3 rounded bg-paper-deep animate-pulse w-1/3" />
              <div className="h-2.5 rounded bg-paper-deep animate-pulse w-full" />
              <div className="h-2.5 rounded bg-paper-deep animate-pulse w-5/6" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {reviews.map((review, index) => {
            const rating = Math.min(
              Math.max(Number(review.rating) || 0, 0),
              5
            );

            const reviewerName =
              review.name?.trim() || "Customer";

            const initial =
              reviewerName.charAt(0).toUpperCase();

            return (
              <article
                key={`${reviewerName}-${review.date}-${index}`}
                className="
                  border
                  border-line
                  rounded-lg
                  p-4
                  flex
                  flex-col
                  bg-white
                "
              >
                {/* Reviewer */}
                <div className="flex items-center gap-2.5 mb-2">
                  {/* Avatar */}
                  <span
                    className="
                      w-8
                      h-8
                      rounded-full
                      bg-blue/10
                      text-blue
                      flex
                      items-center
                      justify-center
                      font-sora
                      font-bold
                      text-[12px]
                      shrink-0
                    "
                  >
                    {initial}
                  </span>

                  {/* Name + Verified */}
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-bold text-ink truncate">
                      {reviewerName}
                    </div>

                    {review.verified && (
                      <div className="flex items-center gap-1 text-[10.5px] text-green-deep font-medium">
                        <BadgeCheck size={11} />
                        <span>Verified Buyer</span>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <span className="text-[10.5px] text-ink-faint shrink-0">
                    {review.date}
                  </span>
                </div>

                {/* Rating */}
                <div
                  className="flex items-center gap-0.5 mb-2"
                  aria-label={`${rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i < rating
                          ? "fill-amber text-amber"
                          : "text-line"
                      }
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-[12px] text-ink-soft leading-relaxed flex-1">
                  {review.text}
                </p>

                {/* Helpful */}
                <button
                  type="button"
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-[11px]
                    text-ink-faint
                    mt-3
                    w-fit
                    hover:text-blue
                    transition-colors
                  "
                >
                  <ThumbsUp size={12} />
                  Helpful ({review.helpful})
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {!loading && reviews.length === 0 && (
        <div className="border border-dashed border-line rounded-lg p-6 mt-6 text-center">
          <p className="text-[12.5px] text-ink-soft">
            No customer reviews available yet.
          </p>
        </div>
      )}
    </section>
  );
}
