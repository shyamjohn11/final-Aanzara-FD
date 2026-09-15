"use client";

import { useEffect, useState } from "react";
import {
  Tag,
  Percent,
  LayoutGrid,
  Truck,
  Headset,
} from "lucide-react";
import {
  contentApi,
  type ContentItem,
} from "@/app/api/services";

const ICONS = [Tag, Percent, LayoutGrid, Truck, Headset];

type WhyBuyWholesale = {
  title: string;
  desc: string;
};

function mapRowToItem(row: ContentItem): WhyBuyWholesale {
  const title =
    typeof row.title === "string" ? row.title.trim() : "";
  const extraDesc = (row.extra as any)?.desc;
  const desc =
    typeof row.description === "string"
      ? row.description.trim()
      : typeof extraDesc === "string"
        ? extraDesc.trim()
        : "";
  return { title, desc };
}

export default function WhyBuyWholesaleGrid() {
  const [items, setItems] = useState<WhyBuyWholesale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await contentApi.list("ws_why_buy");
        const data = response.data as unknown;
        const rows: ContentItem[] = Array.isArray(data)
          ? (data as ContentItem[])
          : Array.isArray((data as any)?.items)
            ? ((data as any).items as ContentItem[])
            : [];
        const mapped = rows
          .map(mapRowToItem)
          .filter(
            (item) =>
              item.title.trim().length > 0 &&
              item.desc.trim().length > 0,
          );
        if (!cancelled) {
          setItems(mapped);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load wholesale benefits.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="why-buy-wholesale-title">
      {/* =========================
          SECTION HEADER
      ========================= */}

      <h2
        id="why-buy-wholesale-title"
        className="font-sora font-bold text-[19px] text-navy"
      >
        Why Buy Wholesale from Aanzara?
      </h2>

      {/* =========================
          BENEFITS GRID
      ========================= */}

      {loading ? (
        <div className="bg-white border border-line rounded-card p-6 mt-5 text-center">
          <p
            role="status"
            aria-live="polite"
            className="text-[12px] text-ink-soft"
          >
            Loading wholesale benefits…
          </p>
        </div>
      ) : error && items.length === 0 ? (
        <div className="bg-white border border-line rounded-card p-6 mt-5 text-center">
          <p role="alert" className="text-[12px] text-ink-soft">
            {error}
          </p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-5">
          {items.map((item, i) => {
            const Icon = ICONS[i];

            // Prevent rendering if there is no matching icon.
            if (!Icon) {
              return null;
            }

            return (
              <article
                key={`${item.title}-${i}`}
                className="bg-white border border-line rounded-card p-4 text-center"
              >
                {/* ICON */}

                <span className="w-10 h-10 rounded-full bg-green/10 text-green-deep flex items-center justify-center mx-auto mb-2.5">
                  <Icon size={16} aria-hidden="true" />
                </span>

                {/* TITLE */}

                <div className="text-[12px] font-bold text-ink mb-0.5">
                  {item.title}
                </div>

                {/* DESCRIPTION */}

                <p className="text-[10.5px] text-ink-soft leading-relaxed">
                  {item.desc}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-line rounded-card p-6 mt-5 text-center">
          <p className="text-[12px] text-ink-soft">
            No wholesale benefits available right now.
          </p>
        </div>
      )}
    </section>
  );
}
