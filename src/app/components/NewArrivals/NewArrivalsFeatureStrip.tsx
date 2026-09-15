"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Tag,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { contentApi, type ContentItem } from "@/app/api/services";

interface FeatureItem {
  title: string;
  desc: string;
  icon: LucideIcon;
}

const ICONS: LucideIcon[] = [
  Sparkles,
  ShieldCheck,
  Tag,
  Truck,
];

/* --------------------------------
 * Safe text validation
 * -------------------------------- */
function getSafeText(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return fallback;
  }

  return value.trim();
}

/* --------------------------------
 * Feature validation
 * -------------------------------- */
function isValidFeature(
  value: unknown,
): value is {
  title: string;
  desc: string;
} {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const feature =
    value as Record<string, unknown>;

  return (
    typeof feature.title === "string" &&
    feature.title.trim().length > 0 &&
    typeof feature.desc === "string" &&
    feature.desc.trim().length > 0
  );
}

/* --------------------------------
 * Get safe features
 * -------------------------------- */
function getSafeFeatures(
  value: unknown,
): FeatureItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isValidFeature)
    .map((feature, index) => ({
      title: feature.title.trim(),
      desc: feature.desc.trim(),
      icon:
        ICONS[index % ICONS.length],
    }))
    .filter(
      (
        feature,
      ): feature is FeatureItem =>
        typeof feature.icon === "function",
    );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */
export default function NewArrivalsFeatureStrip() {
  const [rawItems, setRawItems] = useState<
    { title: string; desc: string }[]
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
          await contentApi.list("na_features");
        const rows: ContentItem[] = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        const mapped = rows.map((row) => ({
          title: row.title ?? "",
          desc: row.description ?? "",
        }));
        if (mounted) {
          setRawItems(mapped);
        }
      } catch {
        if (mounted) {
          setLoadError(
            "Failed to load feature information.",
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

  // Keep helper referenced so existing validation stays intact.
  void getSafeText;

  const safeFeatures =
    getSafeFeatures(rawItems);

  if (isLoading) {
    return (
      <section
        className="
          bg-white
          border
          border-line
          rounded-card
          overflow-hidden
        "
        aria-label="New arrivals benefits"
      >
        <div
          className="
            min-h-[80px]
            flex
            items-center
            justify-center
            px-4
            text-center
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          Loading features…
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
          overflow-hidden
        "
        aria-label="New arrivals benefits"
      >
        <div
          className="
            min-h-[80px]
            flex
            items-center
            justify-center
            px-4
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
        overflow-hidden
      "
      aria-label="New arrivals benefits"
    >
      {safeFeatures.length > 0 ? (
        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-4
            divide-x
            divide-line
          "
        >
          {safeFeatures.map(
            (feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={`${feature.title}-${index}`}
                  className="
                    flex
                    items-center
                    gap-3
                    px-4
                    py-4
                  "
                >
                  {/* Icon */}
                  <span
                    className="
                      w-9
                      h-9
                      rounded-lg
                      bg-green/10
                      text-green-deep
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >
                    <Icon
                      size={16}
                      aria-hidden="true"
                    />
                  </span>

                  {/* Content */}
                  <div className="min-w-0">
                    <div
                      className="
                        text-[12px]
                        font-bold
                        text-ink
                        leading-tight
                      "
                    >
                      {feature.title}
                    </div>

                    <div
                      className="
                        text-[10.5px]
                        text-ink-soft
                        leading-tight
                        mt-0.5
                      "
                    >
                      {feature.desc}
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      ) : (
        <div
          className="
            min-h-[80px]
            flex
            items-center
            justify-center
            px-4
            text-center
            text-[12px]
            text-ink-faint
          "
          role="status"
          aria-live="polite"
        >
          No feature information available.
        </div>
      )}
    </section>
  );
}
