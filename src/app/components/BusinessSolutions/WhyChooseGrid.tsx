// File: src/app/components/BusinessSolutions/WhyChooseGrid.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Lock,
  LayoutGrid,
  ShieldCheck,
  CreditCard,
  Truck,
} from "lucide-react";
import {
  contentApi,
  type ContentItem,
} from "@/app/api/services";

const ICONS = [Lock, LayoutGrid, ShieldCheck, CreditCard, Truck] as const;

export default function WhyChooseGrid() {
  const [rawItems, setRawItems] = useState<
    { title: string; desc: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setLoadError("");
      try {
        const { data } =
          await contentApi.list("bs_why_choose");
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
            "Failed to load business benefits.",
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

  const validItems = Array.isArray(rawItems)
    ? rawItems.filter(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.title === "string" &&
          item.title.trim().length > 0 &&
          typeof item.desc === "string" &&
          item.desc.trim().length > 0
      )
    : [];

  return (
    <section aria-labelledby="why-choose-title">
      <h2
        id="why-choose-title"
        className="font-sora font-bold text-[22px] text-navy text-center"
      >
        Why Choose Aanzara for Your Business?
      </h2>

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-7 text-center text-[11px] text-ink-soft"
        >
          Loading benefits…
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="mt-7 text-center text-[11px] text-red-500"
        >
          {loadError}
        </div>
      ) : validItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-7">
          {validItems.map((item, i) => {
            const Icon = ICONS[i];
            if (!Icon) return null;

            return (
              <article
                key={`${item.title}-${i}`}
                className="bg-white border border-line rounded-card p-4 flex items-start gap-3 transition-colors hover:border-navy/30"
              >
                <span
                  className="w-9 h-9 rounded-lg bg-green/10 text-green-deep flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </span>

                <div>
                  <h3 className="text-[12px] font-bold text-ink mb-0.5">
                    {item.title}
                  </h3>
                  <p className="text-[10.5px] text-ink-soft leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div
          role="status"
          className="mt-7 text-center text-[11px] text-ink-soft"
        >
          Business benefits are currently unavailable.
        </div>
      )}
    </section>
  );
}
