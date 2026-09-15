// File: src/app/components/BusinessSolutions/SolutionsGrid.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  FileText,
  ReceiptText,
  Truck,
  RotateCcw,
  Headset,
  ArrowRight,
} from "lucide-react";
import {
  contentApi,
  type ContentItem,
} from "@/app/api/services";

const ICONS = [
  Package,
  FileText,
  ReceiptText,
  Truck,
  RotateCcw,
  Headset,
] as const;

export default function SolutionsGrid() {
  const [rawSolutions, setRawSolutions] = useState<
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
          await contentApi.list("bs_solutions");
        const rows: ContentItem[] = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        const mapped = rows.map((row) => ({
          title: row.title ?? "",
          desc: row.description ?? "",
        }));
        if (mounted) {
          setRawSolutions(mapped);
        }
      } catch {
        if (mounted) {
          setLoadError(
            "Failed to load solutions.",
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

  const validSolutions = Array.isArray(rawSolutions)
    ? rawSolutions.filter(
        (s) =>
          s &&
          typeof s === "object" &&
          typeof s.title === "string" &&
          s.title.trim().length > 0 &&
          typeof s.desc === "string" &&
          s.desc.trim().length > 0
      )
    : [];

  return (
    <section id="solutions" aria-labelledby="solutions-title">
      <h2
        id="solutions-title"
        className="font-sora font-bold text-[22px] text-navy text-center"
      >
        Solutions We Offer
      </h2>

      <p className="text-[12.5px] text-ink-soft text-center mt-1.5 max-w-[520px] mx-auto">
        Comprehensive solutions designed to meet every business need
      </p>

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-7 text-center text-[11px] text-ink-soft"
        >
          Loading solutions…
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="mt-7 text-center text-[11px] text-red-500"
        >
          {loadError}
        </div>
      ) : validSolutions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
          {validSolutions.map((solution, i) => {
            const Icon = ICONS[i];
            if (!Icon) return null;

            return (
              <article
                key={`${solution.title}-${i}`}
                className="bg-white border border-line rounded-card p-5 transition-colors hover:border-navy/30"
              >
                <span
                  className="w-11 h-11 rounded-lg bg-green/10 text-green-deep flex items-center justify-center mb-3"
                  aria-hidden="true"
                >
                  <Icon size={19} />
                </span>

                <h3 className="text-[13.5px] font-bold text-ink mb-1.5">
                  {solution.title}
                </h3>

                <p className="text-[11.5px] text-ink-soft leading-relaxed mb-3">
                  {solution.desc}
                </p>

                <Link
                  href="/contact?topic=General%20Support"
                  aria-label={`Learn more about ${solution.title}`}
                  className="inline-flex items-center gap-1 text-[11.5px] font-bold text-green-deep hover:underline"
                >
                  Learn More
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div
          role="status"
          className="mt-7 text-center text-[11px] text-ink-soft"
        >
          Solutions are currently unavailable.
        </div>
      )}
    </section>
  );
}
