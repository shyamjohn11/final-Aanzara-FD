"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  RotateCcw,
  FileText,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { contentApi, type ContentItem } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

interface TrustItem {
  label: string;
}

interface SafeTrustItem extends TrustItem {
  icon: LucideIcon;
}

/* =========================================================
   ICONS
========================================================= */

const ICONS: LucideIcon[] = [
  ShieldCheck,
  Lock,
  RotateCcw,
  FileText,
];

/* =========================================================
   TEXT VALIDATION
========================================================= */

function isValidText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

/* =========================================================
   TRUST ITEM VALIDATION
========================================================= */

function isValidTrustItem(
  value: unknown,
): value is string {
  return isValidText(value);
}

/* =========================================================
   SAFE TRUST ITEMS
========================================================= */

function getSafeTrustItems(
  value: unknown,
): SafeTrustItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const usedLabels = new Set<string>();

  return value
    .filter(isValidTrustItem)
    .map((label, index) => ({
      label: label.trim(),
      icon: ICONS[index % ICONS.length],
    }))
    .filter((item) => {
      const normalizedLabel =
        item.label.toLowerCase();

      if (usedLabels.has(normalizedLabel)) {
        return false;
      }

      usedLabels.add(normalizedLabel);

      return typeof item.icon === "function";
    });
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function NewArrivalsTrustStrip() {
  const [rawLabels, setRawLabels] = useState<string[]>(
    [],
  );
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
          await contentApi.list("na_trust");
        const rows: ContentItem[] = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        const mapped: string[] = rows.map(
          (row) => row.title ?? "",
        );
        if (mounted) {
          setRawLabels(mapped);
        }
      } catch {
        if (mounted) {
          setLoadError(
            "Failed to load trust information.",
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

  const safeItems = getSafeTrustItems(rawLabels);

  const displayItems = safeItems.slice(0, 4);

  if (isLoading) {
    return (
      <section
        className="w-full bg-white border-t border-gray-200"
        aria-label="Wholesale trust and service guarantees"
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1360px]
            px-4
            sm:px-6
            min-h-[90px]
            flex
            items-center
            justify-center
            text-[12px]
            text-gray-500
          "
          role="status"
          aria-live="polite"
        >
          Loading trust information…
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section
        className="w-full bg-white border-t border-gray-200"
        aria-label="Wholesale trust and service guarantees"
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1360px]
            px-4
            sm:px-6
            min-h-[90px]
            flex
            items-center
            justify-center
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

  if (displayItems.length === 0) {
    return (
      <section
        className="w-full bg-white border-t border-gray-200"
        aria-label="Wholesale trust and service guarantees"
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1360px]
            px-4
            sm:px-6
            min-h-[90px]
            flex
            items-center
            justify-center
            text-[12px]
            text-gray-500
          "
          role="status"
          aria-live="polite"
        >
          No trust information available.
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full bg-white border-t border-gray-200"
      aria-label="Wholesale trust and service guarantees"
    >
      <div
        className="
          mx-auto
          grid
          w-full
          max-w-[1360px]
          grid-cols-2
          md:grid-cols-4
          px-4
          sm:px-6
        "
      >
        {displayItems.map(
          (item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={`${item.label}-${index}`}
                className="
                  flex
                  min-h-[90px]
                  items-center
                  justify-center
                  gap-3
                  px-4
                  border-r
                  border-gray-200
                  last:border-r-0
                "
              >
                {/* =================================================
                    ICON
                ================================================= */}
                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-green-50
                  "
                >
                  <Icon
                    size={17}
                    strokeWidth={2}
                    className="text-green-600"
                    aria-hidden="true"
                  />
                </div>

                {/* =================================================
                    TEXT
                ================================================= */}
                <div className="min-w-0">
                  <p
                    className="
                      !text-black
                      text-[12px]
                      font-bold
                      leading-5
                    "
                  >
                    {item.label}
                  </p>

                  <p
                    className="
                      !text-gray-600
                      mt-0.5
                      text-[10px]
                      leading-4
                    "
                  >
                    Trusted wholesale service
                  </p>
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}
