"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileCheck2,
  Truck,
  RefreshCcw,
  Lock,
} from "lucide-react";

import { contentApi, type ContentItem } from "@/app/api/services";
import { CART_TRUST_ITEMS } from "@/app/data/cartdata";

// UI copy — no backend publishes trust badge labels, so fall back to
// standard items when the backend-fed list is empty.
const FALLBACK_TRUST_ITEMS: string[] = [
  "100% Genuine Products",
  "GST Invoice Available",
  "Pan-India Delivery",
  "Easy Returns",
  "Secure Payments",
];

// =====================================================
// ICONS
// =====================================================

const ICONS = [
  ShieldCheck,
  FileCheck2,
  Truck,
  RefreshCcw,
  Lock,
] as const;

export default function CartTrustBadges() {
  const [liveItems, setLiveItems] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setLoadError("");

        const res = await contentApi.list("cart_trust");

        const data = res.data as
          | ContentItem[]
          | { items: ContentItem[] };

        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];

        if (!mounted) {
          return;
        }

        const titles = rows
          .map((row) =>
            typeof row.title === "string"
              ? row.title.trim()
              : "",
          )
          .filter((title) => title.length > 0);

        setLiveItems(titles);
      } catch {
        if (!mounted) {
          return;
        }
        setLoadError(
          "Trust information could not be refreshed.",
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

  // =====================================================
  // FULL DATA VALIDATION
  // =====================================================

  const staticTrustItems = Array.isArray(CART_TRUST_ITEMS)
    ? CART_TRUST_ITEMS.filter(
        (item): item is string =>
          typeof item === "string" &&
          item.trim().length > 0
      )
    : [];

  const validTrustItems =
    liveItems.length > 0
      ? liveItems
      : staticTrustItems.length > 0
        ? staticTrustItems
        : FALLBACK_TRUST_ITEMS;

  const showLoading =
    loading && validTrustItems.length === 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section
      aria-labelledby="cart-trust-title"
      className="bg-white border border-line rounded-card p-5"
    >
      {/* =================================================
          TITLE
      ================================================== */}

      <h3
        id="cart-trust-title"
        className="
          text-center
          font-sora
          font-bold
          text-[13px]
          text-ink
          tracking-wide
          mb-4
        "
      >
        AANZARA WHOLESALE TRUST
      </h3>

      {/* =================================================
          TRUST ITEMS
      ================================================== */}

      {showLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="
            text-center
            text-[11px]
            text-ink-soft
            py-2
          "
        >
          Loading trust information...
        </div>
      ) : validTrustItems.length > 0 ? (
        <div
          className="flex flex-col gap-3"
          role="list"
          aria-label="Aanzara wholesale trust benefits"
        >
          {validTrustItems.map((item, i) => {
            // ---------------------------------------------
            // SAFE ICON FALLBACK
            // ---------------------------------------------

            const Icon =
              ICONS[i] ?? ShieldCheck;

            return (
              <div
                key={`${item}-${i}`}
                className="
                  flex
                  items-center
                  gap-2.5
                  text-[12.5px]
                  text-ink-soft
                "
                role="listitem"
              >
                <Icon
                  size={15}
                  className="text-navy shrink-0"
                  aria-hidden="true"
                />

                <span>{item}</span>
              </div>
            );
          })}
        </div>
      ) : (
        /* =================================================
            EMPTY STATE
        ================================================== */

        <div
          role={loadError ? "alert" : "status"}
          className="
            text-center
            text-[11px]
            text-ink-soft
            py-2
          "
        >
          {loadError ||
            "Trust information is currently unavailable."}
        </div>
      )}
    </section>
  );
}