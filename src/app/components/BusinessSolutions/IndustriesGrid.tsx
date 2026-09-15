// File: src/app/components/BusinessSolutions/IndustriesGrid.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  contentApi,
  type ContentItem,
} from "@/app/api/services";

type IndustryRow = {
  title: string;
  desc: string;
  image: string;
  cta: string;
};

export default function IndustriesGrid() {
  const [rawIndustries, setRawIndustries] = useState<
    IndustryRow[]
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
          await contentApi.list("bs_industries");
        const rows: ContentItem[] = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        const mapped: IndustryRow[] = rows.map(
          (row) => ({
            title: row.title ?? "",
            desc: row.description ?? "",
            image: row.imageUrl ?? "",
            cta:
              (row.extra as any)?.cta ??
              row.linkUrl ??
              "",
          }),
        );
        if (mounted) {
          setRawIndustries(mapped);
        }
      } catch {
        if (mounted) {
          setLoadError(
            "Failed to load industries.",
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

  const validIndustries = Array.isArray(rawIndustries)
    ? rawIndustries.filter((industry) => {
        if (!industry || typeof industry !== "object") return false;
        const { title, desc, image, cta } = industry;
        return (
          typeof title === "string" &&
          title.trim().length > 0 &&
          typeof desc === "string" &&
          desc.trim().length > 0 &&
          typeof image === "string" &&
          image.trim().length > 0 &&
          typeof cta === "string" &&
          cta.trim().length > 0
        );
      })
    : [];

  return (
    <section aria-labelledby="industries-title">
      <h2
        id="industries-title"
        className="font-sora font-bold text-[22px] text-navy text-center"
      >
        Industries We Serve
      </h2>

      <p className="text-[12.5px] text-ink-soft text-center mt-1.5 max-w-[520px] mx-auto">
        Trusted by businesses across diverse industries
      </p>

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-7 text-center text-[11px] text-ink-soft"
        >
          Loading industries…
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="mt-7 text-center text-[11px] text-red-500"
        >
          {loadError}
        </div>
      ) : validIndustries.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-7">
          {validIndustries.map((industry, index) => (
            <div
              key={`${industry.title}-${index}`}
              className="bg-white border border-line rounded-card overflow-hidden flex flex-col transition-colors hover:border-navy/30"
            >
              <div
                className="h-[90px] bg-cover bg-center"
                style={{ backgroundImage: `url(${industry.image})` }}
                role="img"
                aria-label={industry.title}
              />

              <div className="p-3.5 flex flex-col flex-1">
                <h3 className="text-[12.5px] font-bold text-ink mb-1">
                  {industry.title}
                </h3>

                <p className="text-[11px] text-ink-soft leading-relaxed mb-3">
                  {industry.desc}
                </p>

                <Link
                  href="/contact?topic=General%20Support"
                  aria-label={`${industry.cta} for ${industry.title}`}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue hover:underline mt-auto"
                >
                  {industry.cta}
                  <ArrowRight size={11} aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          role="status"
          className="mt-7 text-center text-[11px] text-ink-soft"
        >
          Industry information is currently unavailable.
        </div>
      )}
    </section>
  );
}
