// File: app/components/Categories/WhyShopFromAanzara.tsx
"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Percent,
  Truck,
  RotateCcw,
  Headset,
} from "lucide-react";

import { contentApi, type ContentItem } from "@/app/api/services";

// Live rows from section "why_shop" are merged OVER the static
// empty list; validated logic + empty state below are unchanged.

// =====================================================
// ICONS
// =====================================================

const ICONS = [
  ShieldCheck,
  Percent,
  Truck,
  RotateCcw,
  Headset,
] as const;

type WhyShopItem = {
  title: string;
  desc: string;
};

function mapContentToWhyShop(row: ContentItem): WhyShopItem | null {
  const title =
    typeof row.title === "string" ? row.title.trim() : "";
  const desc =
    typeof row.description === "string"
      ? row.description.trim()
      : "";
  if (!title || !desc) return null;
  return { title, desc };
}

// =====================================================
// COMPONENT
// =====================================================

export default function WhyShopFromAanzara() {
  const [liveItems, setLiveItems] = useState<WhyShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await contentApi.list("why_shop");
        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];
        if (!cancelled) {
          setLiveItems(
            rows
              .map(mapContentToWhyShop)
              .filter((i): i is WhyShopItem => i !== null)
          );
        }
      } catch {
        if (!cancelled) setLiveItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===================================================
  // FULL DATA VALIDATION
  // ===================================================

  // Static source is intentionally empty; live rows are merged over it.
  const staticItems: WhyShopItem[] = [];
  const combinedItems: unknown[] = [...staticItems, ...liveItems];

  const validItems: WhyShopItem[] = combinedItems.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as Partial<WhyShopItem>;
    return (
      typeof record.title === "string" &&
      record.title.trim().length > 0 &&
      typeof record.desc === "string" &&
      record.desc.trim().length > 0
    );
  }) as WhyShopItem[];

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section
      aria-labelledby="why-shop-aanzara-title"
    >
      {/* =================================================
          TITLE
      ================================================== */}

      <h2
        id="why-shop-aanzara-title"
        className="
          font-sora
          font-bold
          text-[19px]
          text-navy
          text-center
        "
      >
        Why Shop from Aanzara?
      </h2>

      {/* =================================================
          DESCRIPTION
      ================================================== */}

      <p
        className="
          text-[12.5px]
          text-ink-soft
          text-center
          mt-1.5
          max-w-[560px]
          mx-auto
        "
      >
        Simplifying FMCG procurement for thousands of businesses across the
        nation with a tech-enabled supply ecosystem.
      </p>

      {/* =================================================
          ITEMS
      ================================================== */}

      {loading && validItems.length === 0 ? (
        <div
          role="status"
          className="
            bg-white
            border
            border-line
            rounded-card
            p-6
            mt-6
            text-center
            text-[11px]
            text-ink-soft
          "
        >
          Loading Aanzara benefits…
        </div>
      ) : validItems.length > 0 ? (
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-5
            gap-4
            mt-6
          "
          role="list"
          aria-label="Reasons to shop from Aanzara"
        >
          {validItems.map(
            (item, index) => {
              // -----------------------------------------
              // SAFE ICON
              // -----------------------------------------

              const Icon =
                ICONS[index % ICONS.length] ??
                ICONS[0] ??
                ShieldCheck;

              return (
                <article
                  key={`${item.title}-${index}`}
                  className="
                    text-center
                    px-2
                  "
                  role="listitem"
                >
                  {/* =====================================
                      ICON
                  ====================================== */}

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

                  {/* =====================================
                      TITLE
                  ====================================== */}

                  <h3
                    className="
                      text-[12.5px]
                      font-bold
                      text-ink
                      mb-1
                    "
                  >
                    {item.title}
                  </h3>

                  {/* =====================================
                      DESCRIPTION
                  ====================================== */}

                  <p
                    className="
                      text-[11px]
                      text-ink-soft
                      leading-relaxed
                    "
                  >
                    {item.desc}
                  </p>
                </article>
              );
            }
          )}
        </div>
      ) : (
        /* =================================================
            EMPTY STATE
        ================================================== */

        <div
          role="status"
          className="
            bg-white
            border
            border-line
            rounded-card
            p-6
            mt-6
            text-center
            text-[11px]
            text-ink-soft
          "
        >
          Aanzara benefits are currently unavailable.
        </div>
      )}
    </section>
  );
}
