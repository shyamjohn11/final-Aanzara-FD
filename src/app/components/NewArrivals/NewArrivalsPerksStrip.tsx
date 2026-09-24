"use client";

import { useEffect, useState } from "react";
import {
  Rocket,
  BadgeCheck,
  Gem,
  Boxes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { contentApi } from "@/app/api/services";
import { NEW_ARRIVAL_PERKS } from "@/app/data/newArrivals";

interface NewArrivalPerk {
  title: string;
  desc: string;
}

interface SafePerk extends NewArrivalPerk {
  icon: LucideIcon;
}

const ICONS: LucideIcon[] = [
  Rocket,
  BadgeCheck,
  Gem,
  Boxes,
];

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

export default function NewArrivalsPerksStrip() {
  const [rawItems, setRawItems] = useState<
    NewArrivalPerk[]
  >([]);
  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const { data } =
          await contentApi.list("na_perks");
        const container = data as {
          items?: unknown;
          data?: unknown;
        } | null;
        const candidate: unknown[] = Array.isArray(data)
          ? data
          : container && Array.isArray(container.items)
            ? container.items
            : container && Array.isArray(container.data)
              ? container.data
              : [];
        const mapped: NewArrivalPerk[] = candidate
          .map((row) => {
            const rec = row as Record<string, unknown>;
            const title =
              typeof (rec.title ?? rec.Title) === "string"
                ? String(rec.title ?? rec.Title).trim()
                : "";
            const desc =
              typeof (rec.desc ?? rec.Desc) === "string"
                ? String(rec.desc ?? rec.Desc).trim()
                : typeof (rec.description ?? rec.Description) ===
                    "string"
                  ? String(rec.description ?? rec.Description).trim()
                  : "";
            return title && desc ? { title, desc } : null;
          })
          .filter(
            (
              row,
            ): row is NewArrivalPerk => row !== null,
          );
        if (mounted) {
          setRawItems(mapped);
        }
      } catch {
        // Static NEW_ARRIVAL_PERKS is used below when rawItems is empty.
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

  const livePerks = getSafePerks(rawItems);
  const safePerks =
    livePerks.length > 0
      ? livePerks
      : getSafePerks(NEW_ARRIVAL_PERKS).length > 0
        ? getSafePerks(NEW_ARRIVAL_PERKS)
        : [
            {
              title: "Early Access",
              desc: "Shop new launches before everyone else.",
              icon: ICONS[0],
            },
            {
              title: "Launch Offers",
              desc: "Extra savings on freshly added products.",
              icon: ICONS[1],
            },
            {
              title: "Curated Picks",
              desc: "Handpicked products from top brands.",
              icon: ICONS[2],
            },
            {
              title: "Fresh Inventory",
              desc: "Stock rotates with every new drop.",
              icon: ICONS[3],
            },
          ] satisfies SafePerk[];

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
    </section>
  );
}
