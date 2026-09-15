"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Store,
  Building2,
  School,
  ChefHat,
} from "lucide-react";
import { categoriesApi } from "@/app/api/services";

const ICONS = [Store, Building2, School, ChefHat];

export default function BusinessSegmentsBanner() {
  // =====================================================
  // LIVE DATA — GET /api/v1/categories (#20), first 4 names
  // (storesApi.list() would be the alternate source; the
  // category catalogue is public and sufficient here.)
  // =====================================================

  const [segments, setSegments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await categoriesApi.list();
        const items = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        if (cancelled) return;

        const names = items
          .map((raw: any) => String(raw?.categoryName ?? "").trim())
          .filter((name: string) => name.length > 0)
          .slice(0, 4);

        setSegments(names);
      } catch {
        if (!cancelled) setSegments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================================
  // VALIDATION
  // =====================================================

  const validSegments = Array.isArray(segments)
    ? segments.filter(
        (segment): segment is string =>
          typeof segment === "string" && segment.trim().length > 0
      )
    : [];

  return (
    <section
      className="bg-navy rounded-card p-6 sm:p-8"
      aria-labelledby="business-segments-title"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* =========================
            CONTENT
        ========================= */}

        <div className="max-w-[420px] text-center lg:text-left">
          <h2
            id="business-segments-title"
            className="font-sora font-bold text-[19px] text-white"
          >
            Business Solutions for Every Need
          </h2>

          <p className="text-[12px] text-white/65 mt-2 leading-relaxed">
            We supply to Kirana Stores, Retailers, Wholesalers,
            Institutions, Caterers and more.
          </p>

          <Link
            href="/business-solutions"
            className="
              inline-flex
              items-center
              gap-2
              bg-green
              hover:bg-green-deep
              transition-colors
              text-white
              text-[12.5px]
              font-bold
              px-5
              py-3
              rounded-lg
              mt-4
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-green
              focus-visible:ring-offset-2
              focus-visible:ring-offset-navy
            "
          >
            Explore Business Solutions

            <ArrowRight
              size={14}
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* =========================
            BUSINESS SEGMENTS
        ========================= */}

        {loading ? (
          <div
            role="status"
            className="text-[12px] text-white/65"
          >
            Loading business segments…
          </div>
        ) : validSegments.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {validSegments.map((segment, i) => {
              const Icon = ICONS[i] ?? Store;

              return (
                <div
                  key={`${segment}-${i}`}
                  className="
                    bg-white
                    rounded-lg
                    px-4
                    sm:px-5
                    py-4
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-2
                    w-[110px]
                    min-h-[100px]
                  "
                >
                  <span
                    className="
                      w-9
                      h-9
                      rounded-lg
                      bg-blue/10
                      text-blue
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

                  <span className="text-[11px] font-bold text-ink text-center leading-tight">
                    {segment}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            role="status"
            className="text-[12px] text-white/65"
          >
            Business segments are currently unavailable.
          </div>
        )}
      </div>
    </section>
  );
}
