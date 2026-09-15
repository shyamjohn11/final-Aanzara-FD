"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  MapPinned,
  Wallet,
  BadgeX,
  Users,
  Handshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { contentApi, type ContentItem } from "@/app/api/services";

interface TrustGuarantee {
  title: string;
  desc: string;
}

interface TrustGuaranteeItem extends TrustGuarantee {
  icon: LucideIcon;
}

const ICONS: LucideIcon[] = [
  ShieldCheck,
  MapPinned,
  Wallet,
  BadgeX,
  Users,
  Handshake,
];

/* --------------------------------
 * Text validation
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
 * Guarantee validation
 * -------------------------------- */
function isValidGuarantee(
  value: unknown,
): value is TrustGuarantee {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    typeof item.desc === "string" &&
    item.desc.trim().length > 0
  );
}

/* --------------------------------
 * Safe guarantees
 * -------------------------------- */
function getSafeGuarantees(
  value: unknown,
): TrustGuaranteeItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isValidGuarantee)
    .map((item, index) => {
      const Icon =
        ICONS[index % ICONS.length];

      return {
        title: item.title.trim(),
        desc: item.desc.trim(),
        icon: Icon,
      };
    })
    .filter(
      (item): item is TrustGuaranteeItem =>
        typeof item.icon === "function",
    );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */
export default function TrustGuarantees() {
  const [raw, setRaw] = useState<unknown[]>([]);
  const [loading, setLoading] =
    useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await contentApi.list(
          "trust_guarantees",
        );

        const data = res.data as
          | ContentItem[]
          | { items: ContentItem[] };

        const rows: ContentItem[] =
          Array.isArray(data)
            ? data
            : Array.isArray(
                  (data as any)?.items,
                )
              ? (data as any).items
              : [];

        if (!mounted) {
          return;
        }

        setRaw(
          rows.map((row) => ({
            title: row.title,
            desc: row.description ?? "",
          })),
        );
      } catch {
        if (!mounted) {
          return;
        }
        setError(
          "Guarantees are currently unavailable. Please try again later.",
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

  const safeGuarantees = getSafeGuarantees(raw);

  return (
    <section
      className="w-full"
      aria-labelledby="trust-guarantees-title"
    >
      {/* Heading */}
      <h2
        id="trust-guarantees-title"
        className="
          font-sora
          font-bold
          text-[19px]
          text-navy
          text-center
        "
      >
        Shop Safely with Aanzara Guarantees
      </h2>

      {/* Description */}
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
        Every deal listed goes through a verification
        process so you can shop with total confidence.
      </p>

      {/* Guarantees */}
      {loading ? (
        <div
          className="
            flex
            items-center
            justify-center
            min-h-[100px]
            mt-6
            border
            border-dashed
            border-line
            rounded-card
            text-[12px]
            text-ink-faint
            text-center
            px-4
          "
          role="status"
          aria-live="polite"
        >
          Loading guarantees...
        </div>
      ) : error ? (
        <div
          className="
            flex
            items-center
            justify-center
            min-h-[100px]
            mt-6
            border
            border-dashed
            border-line
            rounded-card
            text-[12px]
            text-ink-faint
            text-center
            px-4
          "
          role="alert"
        >
          {error}
        </div>
      ) : safeGuarantees.length > 0 ? (
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-6
            gap-4
            mt-6
          "
        >
          {safeGuarantees.map(
            (item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={`${item.title}-${index}`}
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
                      rounded-lg
                      bg-blue/10
                      text-blue
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
                      text-[12px]
                      font-bold
                      text-ink
                      mb-1
                    "
                  >
                    {item.title}
                  </div>

                  {/* Description */}
                  <p
                    className="
                      text-[10.5px]
                      text-ink-soft
                      leading-relaxed
                    "
                  >
                    {item.desc}
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
            flex
            items-center
            justify-center
            min-h-[100px]
            mt-6
            border
            border-dashed
            border-line
            rounded-card
            text-[12px]
            text-ink-faint
            text-center
            px-4
          "
          role="status"
          aria-live="polite"
        >
          No guarantees available.
        </div>
      )}
    </section>
  );
}