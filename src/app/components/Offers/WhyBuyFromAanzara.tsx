"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  ShieldCheck,
  FileText,
  Truck,
  Percent,
  Lock,
} from "lucide-react";
import { contentApi, type ContentItem } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

type WhyBuyItem = {
  title: string;
  desc: string;
};

/* --------------------------------
 * Icons
 * -------------------------------- */

const ICONS = [
  BadgeCheck,
  ShieldCheck,
  FileText,
  Truck,
  Percent,
  Lock,
] as const;

const FALLBACK_ICON = ShieldCheck;

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

function isValidWhyBuyItem(
  item: unknown,
): item is WhyBuyItem {
  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item)
  ) {
    return false;
  }

  const value =
    item as Partial<WhyBuyItem>;

  return (
    isValidText(value.title) &&
    isValidText(value.desc)
  );
}

/* --------------------------------
 * Safe Data
 * -------------------------------- */

function getSafeWhyBuyItems(
  items: WhyBuyItem[],
): WhyBuyItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const usedTitles = new Set<string>();

  return items
    .filter(isValidWhyBuyItem)
    .map((item) => ({
      ...item,
      title: item.title.trim(),
      desc: item.desc.trim(),
    }))
    .filter((item) => {
      const normalizedTitle =
        item.title
          .trim()
          .toLowerCase();

      if (
        usedTitles.has(
          normalizedTitle,
        )
      ) {
        return false;
      }

      usedTitles.add(
        normalizedTitle,
      );

      return true;
    });
}

function mapRowToItem(row: ContentItem): WhyBuyItem {
  const title =
    typeof row.title === "string"
      ? row.title
      : "";
  const extraDesc = (row.extra as any)?.desc;
  const description =
    typeof row.description === "string"
      ? row.description
      : typeof extraDesc === "string"
        ? extraDesc
        : "";
  return { title, desc: description };
}

/* --------------------------------
 * Component
 * -------------------------------- */

export default function WhyBuyFromAanzara() {
  const [rawItems, setRawItems] = useState<
    WhyBuyItem[]
  >([]);
  const [loading, setLoading] =
    useState<boolean>(true);
  const [error, setError] =
    useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response =
          await contentApi.list("why_buy");
        const data = response.data as unknown;
        const rows: ContentItem[] = Array.isArray(
          data,
        )
          ? (data as ContentItem[])
          : Array.isArray((data as any)?.items)
            ? ((data as any).items as ContentItem[])
            : [];
        const mapped = rows.map(mapRowToItem);
        if (!cancelled) {
          setRawItems(mapped);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to load information.",
          );
          setRawItems([]);
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

  const safeItems =
    getSafeWhyBuyItems(rawItems);

  return (
    <section
      aria-labelledby="why-buy-aanzara-title"
    >
      {/* Heading */}
      <h2
        id="why-buy-aanzara-title"
        className="
          font-sora
          font-bold
          text-[19px]
          text-navy
          text-center
        "
      >
        Why Buy From Aanzara Marketplace?
      </h2>

      {/* Loading State */}
      {loading ? (
        <div
          className="
            min-h-[120px]
            mt-6
            bg-white
            border
            border-dashed
            border-line
            rounded-card
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          Loading information…
        </div>
      ) : error && safeItems.length === 0 ? (
        <div
          className="
            min-h-[120px]
            mt-6
            bg-white
            border
            border-dashed
            border-line
            rounded-card
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[12px]
            text-ink-faint
          "
          role="alert"
        >
          {error}
        </div>
      ) : /* Empty State */
      safeItems.length === 0 ? (
        <div
          className="
            min-h-[120px]
            mt-6
            bg-white
            border
            border-dashed
            border-line
            rounded-card
            flex
            items-center
            justify-center
            text-center
            px-4
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          Information is currently
          unavailable.
        </div>
      ) : (
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-6
            gap-4
            mt-6
          "
        >
          {safeItems.map(
            (item, index) => {
              /*
               * If the data contains more items
               * than the available icon list,
               * use a safe fallback icon.
               */
              const Icon =
                ICONS[index] ??
                FALLBACK_ICON;

              return (
                <article
                  key={item.title}
                  className="
                    text-center
                    px-2
                  "
                >
                  {/* Icon */}
                  <span
                    className="
                      w-11
                      h-11
                      rounded-lg
                      bg-blue/10
                      text-blue
                      flex
                      items-center
                      justify-center
                      mx-auto
                      mb-3
                    "
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>

                  {/* Title */}
                  <div
                    className="
                      text-[12px]
                      font-bold
                      text-ink
                      mb-1
                    "
                  >
                    {item.title}
                  </div>

                  {/* Description */}
                  <p
                    className="
                      text-[10.5px]
                      text-ink-soft
                      leading-relaxed
                    "
                  >
                    {item.desc}
                  </p>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}
