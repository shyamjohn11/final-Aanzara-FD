// File: app/components/Dashboard/IndustrySolutions.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Building2,
  UtensilsCrossed,
  Laptop,
  Cross,
  GraduationCap,
} from "lucide-react";

import { INDUSTRY_SOLUTIONS } from "@/app/data/home";
import { contentApi, type ContentItem } from "@/app/api/services";

/* ============================================================
   ICONS
============================================================ */

const ICONS = [
  Store,
  Building2,
  UtensilsCrossed,
  Laptop,
  Cross,
  GraduationCap,
] as const;

type IndustryItem = {
  title: string;
  desc: string;
};

function mapContentToIndustry(row: ContentItem): IndustryItem | null {
  const title =
    typeof row.title === "string" ? row.title.trim() : "";
  const desc =
    typeof row.description === "string"
      ? row.description.trim()
      : "";
  if (!title || !desc) return null;
  return { title, desc };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function IndustrySolutions() {
  const [liveItems, setLiveItems] = useState<IndustryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await contentApi.list("industry_solutions");
        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];
        if (!cancelled) {
          setLiveItems(
            rows
              .map(mapContentToIndustry)
              .filter((i): i is IndustryItem => i !== null)
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

  /* ==========================================================
     VALIDATE DATA
  ========================================================== */

  const combinedItems: unknown[] = Array.isArray(INDUSTRY_SOLUTIONS)
    ? [...INDUSTRY_SOLUTIONS, ...liveItems]
    : [...liveItems];

  const validItems = combinedItems.filter((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const record = item as Partial<IndustryItem>;
    const title = record.title;
    const desc = record.desc;

    const validTitle =
      typeof title === "string" && title.trim().length > 0;

    const validDescription =
      typeof desc === "string" && desc.trim().length > 0;

    return validTitle && validDescription;
  }) as IndustryItem[];

  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  if (validItems.length === 0) {
    return (
      <section aria-labelledby="industry-solutions-title">
        <h2
          id="industry-solutions-title"
          className="font-sora font-bold text-[19px] text-navy"
        >
          Industry Solutions
        </h2>

        <p className="text-[12.5px] text-ink-soft mt-1 mb-5">
          Specially engineered logistics supply chains for diverse
          physical sectors
        </p>

        <div
          role="status"
          className="
            bg-white
            border
            border-line
            rounded-card
            p-5
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          {loading
            ? "Loading industry solutions…"
            : "No industry solutions available."}
        </div>
      </section>
    );
  }

  /* ==========================================================
     MAIN RENDER
  ========================================================== */

  return (
    <section aria-labelledby="industry-solutions-title">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <h2
        id="industry-solutions-title"
        className="font-sora font-bold text-[19px] text-navy"
      >
        Industry Solutions
      </h2>

      <p className="text-[12.5px] text-ink-soft mt-1 mb-5">
        Specially engineered logistics supply chains for diverse
        physical sectors
      </p>

      {/* ======================================================
          GRID
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {validItems.map((item, i) => {
          /*
           * If the data contains more items than available icons,
           * safely fall back to the first icon.
           */
          const Icon = ICONS[i] ?? ICONS[0] ?? Store;

          return (
            <article
              key={`${item.title}-${i}`}
              className="
                bg-white
                border
                border-line
                rounded-card
                p-4
                transition-all
                hover:shadow-card
                hover:border-navy/20
              "
            >
              {/* ==================================================
                  ICON
              ================================================== */}

              <span
                className="
                  w-9
                  h-9
                  rounded-lg
                  bg-paper-deep
                  text-navy
                  flex
                  items-center
                  justify-center
                  mb-3
                "
                aria-hidden="true"
              >
                <Icon size={17} />
              </span>

              {/* ==================================================
                  TITLE
              ================================================== */}

              <h3 className="text-[14px] font-bold text-ink mb-1">
                {item.title}
              </h3>

              {/* ==================================================
                  DESCRIPTION
              ================================================== */}

              <p className="text-[12px] text-ink-soft leading-relaxed">
                {item.desc}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
