"use client";

import { useEffect, useState } from "react";
import {
  Rocket,
  BadgeCheck,
  Gem,
  Boxes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { contentApi, type ContentItem } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

interface NewArrivalPerk {
  title: string;
  desc: string;
}

interface SafePerk extends NewArrivalPerk {
  icon: LucideIcon;
}

/* --------------------------------
 * Icons
 * -------------------------------- */

const ICONS: LucideIcon[] = [
  Rocket,
  BadgeCheck,
  Gem,
  Boxes,
];

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

function isValidPerk(
  value: unknown,
): value is NewArrivalPerk {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const perk =
    value as Record<string, unknown>;

  return (
    isValidText(perk.title) &&
    isValidText(perk.desc)
  );
}

/* --------------------------------
 * Safe Perks
 * -------------------------------- */

function getSafePerks(
  value: unknown,
): SafePerk[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const usedTitles = new Set<string>();

  return value
    .filter(isValidPerk)
    .map((perk, index) => ({
      title: perk.title.trim(),
      desc: perk.desc.trim(),
      icon:
        ICONS[index % ICONS.length],
    }))
    .filter((perk) => {
      const normalizedTitle =
        perk.title.toLowerCase();

      if (
        usedTitles.has(normalizedTitle)
      ) {
        return false;
      }

      usedTitles.add(normalizedTitle);

      return (
        typeof perk.icon === "function"
      );
    });
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function NewArrivalsPerksStrip() {
  const [rawItems, setRawItems] = useState<
    NewArrivalPerk[]
  >([]);
  const [isLoading, setIsLoading] =
    useState<boolean>(true);
  const [loadError, setLoadError] =
    useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setLoadError("");
      try {
        const { data } =
          await contentApi.list("na_perks");
        const rows: ContentItem[] = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        const mapped: NewArrivalPerk[] = rows.map(
          (row) => ({
            title: row.title ?? "",
            desc: row.description ?? "",
          }),
        );
        if (mounted) {
          setRawItems(mapped);
        }
      } catch {
        if (mounted) {
          setLoadError(
            "Failed to load benefits.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const safePerks = getSafePerks(rawItems);

  if (isLoading) {
    return (
      <section
        className="
          bg-white
          border
          border-line
          rounded-card
          px-6
          py-6
        "
        aria-labelledby="new-arrivals-perks-title"
      >
        <h2
          id="new-arrivals-perks-title"
          className="sr-only"
        >
          New Arrivals Benefits
        </h2>
        <div
          className="
            min-h-[90px]
            flex
            items-center
            justify-center
            text-center
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          Loading benefits…
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section
        className="
          bg-white
          border
          border-line
          rounded-card
          px-6
          py-6
        "
        aria-labelledby="new-arrivals-perks-title"
      >
        <h2
          id="new-arrivals-perks-title"
          className="sr-only"
        >
          New Arrivals Benefits
        </h2>
        <div
          className="
            min-h-[90px]
            flex
            items-center
            justify-center
            text-center
            text-[12px]
            text-red-500
          "
          role="alert"
        >
          {loadError}
        </div>
      </section>
    );
  }

  return (
    <section
      className="
        bg-white
        border
        border-line
        rounded-card
        px-6
        py-6
      "
      aria-labelledby="new-arrivals-perks-title"
    >
      {/* Hidden semantic heading */}
      <h2
        id="new-arrivals-perks-title"
        className="sr-only"
      >
        New Arrivals Benefits
      </h2>

      {safePerks.length > 0 ? (
        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-6
          "
        >
          {safePerks.map(
            (perk, index) => {
              const Icon = perk.icon;

              return (
                <div
                  key={`${perk.title}-${index}`}
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
                      rounded-full
                      bg-green/10
                      text-green-deep
                      flex
                      items-center
                      justify-center
                      mx-auto
                      mb-3
                    "
                  >
                    <Icon
                      size={18}
                      aria-hidden="true"
                    />
                  </span>

                  {/* Title */}
                  <div
                    className="
                      text-[12.5px]
                      font-bold
                      text-navy
                      mb-1
                    "
                  >
                    {perk.title}
                  </div>

                  {/* Description */}
                  <p
                    className="
                      text-[11px]
                      text-ink-soft
                      leading-relaxed
                    "
                  >
                    {perk.desc}
                  </p>
                </div>
              );
            },
          )}
        </div>
      ) : (
        /* Empty State */
        <div
          className="
            min-h-[90px]
            flex
            items-center
            justify-center
            text-center
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          No benefits available right now.
        </div>
      )}
    </section>
  );
}
