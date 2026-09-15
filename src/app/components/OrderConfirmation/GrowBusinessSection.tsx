"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  FileStack,
  UserCog,
} from "lucide-react";
import { contentApi, type ContentItem } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

type GrowBusinessCard = {
  id: string | number;
  title: string;
  desc: string;
  cta: string;
};

/* --------------------------------
 * Icons
 * -------------------------------- */

const ICONS = [
  CalendarClock,
  FileStack,
  UserCog,
] as const;

const FALLBACK_ICON = CalendarClock;

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

function isValidId(
  value: unknown,
): value is string | number {
  return (
    (typeof value === "string" ||
      typeof value === "number") &&
    String(value).trim().length > 0
  );
}

function isValidGrowBusinessCard(
  card: unknown,
): card is GrowBusinessCard {
  if (
    !card ||
    typeof card !== "object" ||
    Array.isArray(card)
  ) {
    return false;
  }

  const item =
    card as Partial<GrowBusinessCard>;

  return (
    isValidId(item.id) &&
    isValidText(item.title) &&
    isValidText(item.desc) &&
    isValidText(item.cta)
  );
}

/* --------------------------------
 * Safe Data
 * -------------------------------- */

function toGrowBusinessCard(
  row: ContentItem,
  index: number,
): unknown {
  return {
    id: (row as ContentItem).id ?? String(index),
    title: row.title,
    desc: row.description ?? "",
    cta: (row.extra as any)?.cta ?? "",
  };
}

function getSafeCards(raw: unknown): GrowBusinessCard[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const usedIds = new Set<string>();

  return raw
    .filter(isValidGrowBusinessCard)
    .map((card) => ({
      ...card,
      title: card.title.trim(),
      desc: card.desc.trim(),
      cta: card.cta.trim(),
    }))
    .filter((card) => {
      const id = String(card.id)
        .trim()
        .toLowerCase();

      if (usedIds.has(id)) {
        return false;
      }

      usedIds.add(id);
      return true;
    });
}

/* --------------------------------
 * Component
 * -------------------------------- */

export default function GrowBusinessSection() {
  const [raw, setRaw] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await contentApi.list("grow_business");

        const data = res.data as
          | ContentItem[]
          | { items: ContentItem[] };

        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];

        if (!mounted) {
          return;
        }

        setRaw(
          rows.map((row, index) =>
            toGrowBusinessCard(row, index),
          ),
        );
      } catch {
        if (!mounted) {
          return;
        }
        setError(
          "Business services are currently unavailable. Please try again later.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = getSafeCards(raw);

  return (
    <section
      aria-labelledby="grow-business-title"
    >
      {/* Section Heading */}
      <h2
        id="grow-business-title"
        className="
          font-sora
          font-bold
          text-[19px]
          text-navy
          text-center
        "
      >
        Grow Your Business with Aanzara
      </h2>

      <p
        className="
          text-[12.5px]
          text-ink-soft
          text-center
          mt-1.5
          max-w-[520px]
          mx-auto
        "
      >
        Exclusive value-added services
        custom-designed for enterprise
        procurers and wholesale merchants.
      </p>

      {/* Empty / Loading / Error State */}
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
          Loading business services...
        </div>
      ) : error ? (
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
      ) : cards.length === 0 ? (
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
          Business services are
          currently unavailable.
        </div>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-3
            gap-4
            mt-6
          "
        >
          {cards.map((card, index) => {
            const Icon =
              ICONS[index] ??
              FALLBACK_ICON;

            return (
              <article
                key={String(card.id)}
                className="
                  bg-white
                  border
                  border-line
                  rounded-card
                  p-5
                "
              >
                {/* Icon */}
                <span
                  className="
                    w-9
                    h-9
                    rounded-lg
                    bg-blue/10
                    text-blue
                    flex
                    items-center
                    justify-center
                    mb-3
                  "
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </span>

                {/* Title */}
                <h3
                  className="
                    text-[13.5px]
                    font-bold
                    text-ink
                    mb-1.5
                  "
                >
                  {card.title}
                </h3>

                {/* Description */}
                <p
                  className="
                    text-[11.5px]
                    text-ink-soft
                    leading-relaxed
                    mb-4
                  "
                >
                  {card.desc}
                </p>

                {/* CTA */}
                <button
                  type="button"
                  className="
                    border
                    border-line
                    text-ink
                    text-[11.5px]
                    font-bold
                    px-4
                    py-2
                    rounded-lg
                    hover:border-navy
                    hover:text-navy
                    transition-colors
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-navy
                    focus-visible:ring-offset-2
                  "
                >
                  {card.cta}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}