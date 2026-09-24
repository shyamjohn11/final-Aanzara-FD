"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Tag,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { contentApi } from "@/app/api/services";
import { NEW_ARRIVAL_FEATURES } from "@/app/data/newArrivals";

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

function textField(
  row: Record<string, unknown>,
  camel: string,
  pascal: string,
): string {
  const value = row[camel] ?? row[pascal];
  return typeof value === "string" ? value.trim() : "";
}

function extractRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const container = data as {
    items?: unknown;
    data?: unknown;
  } | null;
  if (container && Array.isArray(container.items)) {
    return container.items;
  }
  if (container && Array.isArray(container.data)) {
    return container.data;
  }
  return [];
}

function toFeaturePair(
  row: Record<string, unknown>,
): { title: string; desc: string } | null {
  const title =
    textField(row, "title", "Title") ||
    textField(row, "name", "Name");
  const desc =
    textField(row, "desc", "Desc") ||
    textField(row, "description", "Description");
  if (!title || !desc) return null;
  return { title, desc };
}

function withIcons(
  items: { title: string; desc: string }[],
): FeatureItem[] {
  return items.map((feature, index) => ({
    ...feature,
    icon: ICONS[index % ICONS.length],
  }));
}

export default function NewArrivalsFeatureStrip() {
  const [rawItems, setRawItems] = useState<
    { title: string; desc: string }[]
  >([]);
  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const { data } =
          await contentApi.list("na_features");
        const mapped = extractRows(data)
          .map((row) =>
            toFeaturePair(row as Record<string, unknown>),
          )
          .filter(
            (
              row,
            ): row is { title: string; desc: string } =>
              row !== null,
          );
        if (mounted) {
          setRawItems(mapped);
        }
      } catch {
        // Static NEW_ARRIVAL_FEATURES is used below when rawItems is empty.
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

  const liveFeatures = withIcons(rawItems).filter(
    (feature) => feature.title && feature.desc,
  );
  const safeFeatures = (
    liveFeatures.length > 0
      ? liveFeatures
      : withIcons(NEW_ARRIVAL_FEATURES)
  ).slice(0, 4);

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
