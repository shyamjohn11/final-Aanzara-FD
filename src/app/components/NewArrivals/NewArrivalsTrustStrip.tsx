"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  RotateCcw,
  FileText,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { contentApi } from "@/app/api/services";
import { NEW_ARRIVAL_TRUST_STRIP } from "@/app/data/newArrivals";

interface TrustItem {
  label: string;
}

interface SafeTrustItem extends TrustItem {
  icon: LucideIcon;
}

const ICONS: LucideIcon[] = [
  ShieldCheck,
  Lock,
  RotateCcw,
  FileText,
];

function isValidText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidTrustItem(
  value: unknown,
): value is string {
  return isValidText(value);
}

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

export default function NewArrivalsTrustStrip() {
  const [rawLabels, setRawLabels] = useState<string[]>(
    [],
  );
  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const { data } =
          await contentApi.list("na_trust");
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
        const mapped: string[] = candidate
          .map((row) => {
            if (typeof row === "string") return row.trim();
            const rec = row as Record<string, unknown>;
            if (
              typeof (rec.title ?? rec.Title) === "string"
            ) {
              return String(rec.title ?? rec.Title).trim();
            }
            if (
              typeof (rec.name ?? rec.Name) === "string"
            ) {
              return String(rec.name ?? rec.Name).trim();
            }
            return "";
          })
          .filter((title) => title.length > 0);
        if (mounted) {
          setRawLabels(mapped);
        }
      } catch {
        // Static NEW_ARRIVAL_TRUST_STRIP is used below when rawLabels is empty.
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

  const liveItems = getSafeTrustItems(rawLabels);
  const safeItems = getSafeTrustItems(
    liveItems.length > 0
      ? liveItems.map((item) => item.label)
      : NEW_ARRIVAL_TRUST_STRIP,
  );

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
