"use client";

import { useEffect, useState } from "react";
import { Factory, ReceiptText, Truck, Wallet, Headset } from "lucide-react";
import { WHY_AANZARA_PRODUCT } from "@/app/data/productDetail";
import { contentApi, type ContentItem } from "@/app/api/services";

const ICONS = [Factory, ReceiptText, Truck, Wallet, Headset];

// Live rows from section "why_choose" are merged OVER the static
// empty array; validated static logic + empty state below are unchanged.

type WhyItem = {
  title: string;
  desc: string;
};

function mapContentToWhy(row: ContentItem): WhyItem | null {
  const title =
    typeof row.title === "string" ? row.title.trim() : "";
  const desc =
    typeof row.description === "string"
      ? row.description.trim()
      : "";
  if (!title || !desc) return null;
  return { title, desc };
}

export default function WhyChooseAanzara() {
  const [liveItems, setLiveItems] = useState<WhyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await contentApi.list("why_choose");
        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];
        if (!cancelled) {
          setLiveItems(
            rows
              .map(mapContentToWhy)
              .filter((i): i is WhyItem => i !== null)
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

  const combinedItems: unknown[] = Array.isArray(WHY_AANZARA_PRODUCT)
    ? [...WHY_AANZARA_PRODUCT, ...liveItems]
    : [...liveItems];

  const validItems = combinedItems.filter((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const record = item as Partial<WhyItem>;

    return (
      typeof record.title === "string" &&
      record.title.trim().length > 0 &&
      typeof record.desc === "string" &&
      record.desc.trim().length > 0
    );
  }) as WhyItem[];

  return (
    <div>
      <h2 className="font-sora font-bold text-[19px] text-navy text-center">
        Why Indian Businesses Choose Aanzara
      </h2>
      <p className="text-[12.5px] text-ink-soft text-center mt-1.5 max-w-[560px] mx-auto">
        An ecosystem engineered for serious buyers — pricing, logistics,
        support and compliance all in one place.
      </p>
      {loading && validItems.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="
            mt-6
            mx-auto
            max-w-[560px]
            bg-white
            border
            border-dashed
            border-line
            rounded-card
            p-6
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          Loading business benefits…
        </div>
      ) : validItems.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="
            mt-6
            mx-auto
            max-w-[560px]
            bg-white
            border
            border-dashed
            border-line
            rounded-card
            p-6
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          Business benefits are currently unavailable.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          {validItems.map((item, i) => {
            const Icon = ICONS[i % ICONS.length] ?? ICONS[0] ?? Factory;
            return (
              <div
                key={`${item.title}-${i}`}
                className="bg-white border border-line rounded-card p-4"
              >
                <span className="w-9 h-9 rounded-lg bg-blue/10 text-blue flex items-center justify-center mb-3">
                  <Icon size={17} />
                </span>
                <div className="text-[12.5px] font-bold text-ink mb-1">
                  {item.title}
                </div>
                <p className="text-[11px] text-ink-soft leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
