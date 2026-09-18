"use client";

import { useEffect, useMemo, useState } from "react";
import { dealsApi, categoriesApi } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

interface OfferFilterPillsProps {
  onChange?: (pill: string) => void;
}

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function isValidText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

/* --------------------------------
 * Safe Pills
 * -------------------------------- */

function getSafePills(
  pills: unknown,
): string[] {
  if (!Array.isArray(pills)) {
    return [];
  }

  const usedPills = new Set<string>();

  return (pills as unknown[])
    .filter(isValidText)
    .map((pill) => pill.trim())
    .filter((pill) => {
      const normalizedPill =
        pill.toLowerCase();

      if (
        usedPills.has(normalizedPill)
      ) {
        return false;
      }

      usedPills.add(normalizedPill);

      return true;
    });
}

function unwrapItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (payload && typeof payload === "object") {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.items)) {
      return rec.items as Record<string, unknown>[];
    }
    if (Array.isArray(rec.data)) {
      return rec.data as Record<string, unknown>[];
    }
  }
  return [];
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function OfferFilterPills({
  onChange,
}: OfferFilterPillsProps) {
  const [pills, setPills] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError("");
      try {
        // Public storefront offers (active only, no auth required).
        const offersResponse = await dealsApi.offers(50);
        const offersPayload: unknown =
          (offersResponse as { data?: unknown })?.data ?? offersResponse;
        const offerItems = unwrapItems(offersPayload);

        const offerTitles = offerItems
          .map((raw) =>
            String(raw.name ?? raw.title ?? "").trim(),
          )
          .filter((t) => t.length > 0);
        const offerCategories = offerItems
          .map((raw) =>
            String(raw.category ?? raw.categoryName ?? "").trim(),
          )
          .filter((c) => c.length > 0);

        let merged = getSafePills(["All", ...offerCategories, ...offerTitles]);

        if (merged.length <= 1) {
          try {
            const catsResponse = await categoriesApi.list();
            const catsPayload: unknown =
              (catsResponse as { data?: unknown })?.data ?? catsResponse;
            const catItems = unwrapItems(catsPayload);
            const catNames = catItems
              .map((raw) =>
                String(
                  raw.categoryName ??
                    raw.name ??
                    raw.title ??
                    "",
                ).trim(),
              )
              .filter((n) => n.length > 0);
            merged = getSafePills(["All", ...catNames]);
          } catch (error) {
            console.error("Unable to load categories for pills:", error);
          }
        }

        if (!cancelled) {
          setPills(merged);
        }
      } catch (error) {
        console.error("Unable to load offer filters:", error);
        if (!cancelled) {
          setFetchError(
            "Unable to load offer filters. Please try again.",
          );
          setPills([]);
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

  const safePills = useMemo(
    () => getSafePills(pills),
    [pills],
  );

  const [active, setActive] =
    useState<string>("");

  useEffect(() => {
    if (!active && safePills.length > 0) {
      setActive(safePills[0] ?? "");
    }
  }, [active, safePills]);

  /* --------------------------------
   * Pill Change
   * -------------------------------- */

  const handlePillChange = (
    pill: string,
  ): void => {
    if (!isValidText(pill)) {
      return;
    }

    const safePill = pill.trim();

    if (!safePills.includes(safePill)) {
      return;
    }

    setActive(safePill);

    onChange?.(safePill);
  };

  /* --------------------------------
   * More Button
   * -------------------------------- */

  const handleMoreClick = (): void => {
    // Reserved for opening the remaining
    // offer filters/modal in the future.
  };

  if (loading) {
    return (
      <nav
        aria-label="Offer filters"
        className="
          flex
          items-center
          gap-2
          overflow-x-auto
          scrollbar-none
          pb-1
        "
      >
        <div
          className="
            w-full
            py-2
            text-center
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          Loading offer filters…
        </div>
      </nav>
    );
  }

  if (fetchError) {
    return (
      <nav
        aria-label="Offer filters"
        className="
          flex
          items-center
          gap-2
          overflow-x-auto
          scrollbar-none
          pb-1
        "
      >
        <div
          className="
            w-full
            py-2
            text-center
            text-[12px]
            text-red-600
          "
          role="alert"
        >
          {fetchError}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Offer filters"
      className="
        flex
        items-center
        gap-2
        overflow-x-auto
        scrollbar-none
        pb-1
      "
    >
      {safePills.length > 0 ? (
        <>
          {safePills.map((pill) => {
            const isActive =
              active === pill;

            return (
              <button
                key={pill}
                type="button"
                onClick={() =>
                  handlePillChange(pill)
                }
                aria-pressed={isActive}
                className={`
                  shrink-0
                  text-[12.5px]
                  font-semibold
                  px-4
                  py-2
                  rounded-pill
                  border
                  transition-colors
                  cursor-pointer
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-navy
                  focus-visible:ring-offset-2
                  ${
                    isActive
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-ink-soft border-line hover:border-navy hover:text-navy"
                  }
                `}
              >
                {pill}
              </button>
            );
          })}

          {/* More Filters */}
          <button
            type="button"
            onClick={handleMoreClick}
            className="
              shrink-0
              text-[12.5px]
              font-semibold
              text-blue
              hover:underline
              px-2
              cursor-pointer
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue
              focus-visible:ring-offset-2
              rounded
            "
            aria-label="Show 2 more offer filters"
          >
            +2 More
          </button>
        </>
      ) : (
        <div
          className="
            w-full
            py-2
            text-center
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          No offer filters available.
        </div>
      )}
    </nav>
  );
}
