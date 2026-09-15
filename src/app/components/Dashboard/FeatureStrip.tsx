// File: app/components/Dashboard/FeatureStrip.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Truck,
  FileText,
  Grid2x2,
  Package,
  Headset,
  ShieldCheck,
} from "lucide-react";

import { HERO_FEATURES } from "@/app/data/home";
import { contentApi, type ContentItem } from "@/app/api/services";

/* ============================================================
   TYPES
============================================================ */

type FeatureItem = {
  title: string;
  desc: string;
};

type IconComponent = typeof Truck;

/* ============================================================
   ICONS
============================================================ */

const ICONS: IconComponent[] = [
  Truck,
  FileText,
  Grid2x2,
  Package,
  Headset,
  ShieldCheck,
];

/* ============================================================
   VALIDATION HELPERS
============================================================ */

function isValidText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidFeature(
  item: unknown
): item is FeatureItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const feature = item as Partial<FeatureItem>;

  return (
    isValidText(feature.title) &&
    isValidText(feature.desc)
  );
}

function mapContentToFeature(row: ContentItem): FeatureItem | null {
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

export default function FeatureStrip() {
  const [liveFeatures, setLiveFeatures] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await contentApi.list("hero_features");
        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];
        if (!cancelled) {
          setLiveFeatures(
            rows
              .map(mapContentToFeature)
              .filter((f): f is FeatureItem => f !== null)
          );
        }
      } catch {
        if (!cancelled) setLiveFeatures([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     FULL DATA VALIDATION
  ========================================================== */

  const combinedFeatures: unknown[] = Array.isArray(HERO_FEATURES)
    ? [...HERO_FEATURES, ...liveFeatures]
    : [...liveFeatures];

  const validFeatures: FeatureItem[] =
    combinedFeatures.filter(isValidFeature);

  /* ==========================================================
     SAFE FEATURE LIMIT
  ========================================================== */

  const visibleFeatures = validFeatures.slice(
    0,
    ICONS.length
  );

  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  if (visibleFeatures.length === 0) {
    return (
      <section
        aria-label="Store features"
        className="bg-white border-b border-line"
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4">
          <div
            role="status"
            className="
              rounded-lg
              border
              border-line
              bg-paper
              px-4
              py-3
              text-center
              text-[11.5px]
              text-ink-soft
            "
          >
            {loading
              ? "Loading store features…"
              : "Store features are currently unavailable."}
          </div>
        </div>
      </section>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section
      aria-label="Store features"
      className="bg-white border-b border-line"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4">
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-6
            gap-3
          "
        >
          {visibleFeatures.map((feature, index) => {
            const Icon = ICONS[index] ?? ICONS[0];

            if (!Icon) {
              return null;
            }

            return (
              <div
                key={`${feature.title}-${index}`}
                className="
                  flex
                  items-center
                  gap-3
                  border
                  border-line
                  rounded-lg
                  p-3
                  min-w-0
                "
              >
                {/* ==================================================
                    ICON
                ================================================== */}

                <span
                  aria-hidden="true"
                  className="
                    w-9
                    h-9
                    rounded-lg
                    bg-blue/10
                    text-blue
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  <Icon size={16} />
                </span>

                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="min-w-0">
                  <div
                    title={feature.title}
                    className="
                      text-[12px]
                      font-bold
                      text-ink
                      leading-tight
                      truncate
                    "
                  >
                    {feature.title}
                  </div>

                  <div
                    title={feature.desc}
                    className="
                      text-[10.5px]
                      text-ink-soft
                      leading-tight
                      mt-0.5
                      line-clamp-2
                    "
                  >
                    {feature.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
