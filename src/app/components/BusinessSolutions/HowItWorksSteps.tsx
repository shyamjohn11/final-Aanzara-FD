// File: src/app/components/BusinessSolutions/HowItWorksSteps.tsx

"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  contentApi,
  type ContentItem,
} from "@/app/api/services";

type StepRow = {
  step: string | number;
  title: string;
  desc: string;
};

export default function HowItWorksSteps() {
  const [rawSteps, setRawSteps] = useState<StepRow[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setLoadError("");
      try {
        const { data } = await contentApi.list(
          "bs_how_it_works",
        );
        const rows: ContentItem[] = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        const mapped: StepRow[] = rows.map(
          (row, index) => ({
            step:
              (row.extra as any)?.step ??
              index + 1,
            title: row.title ?? "",
            desc: row.description ?? "",
          }),
        );
        if (mounted) {
          setRawSteps(mapped);
        }
      } catch {
        if (mounted) {
          setLoadError("Failed to load steps.");
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

  const validSteps = Array.isArray(rawSteps)
    ? rawSteps.filter((step) => {
        if (!step || typeof step !== "object") return false;
        const { step: stepValue, title, desc } = step;
        return (
          (typeof stepValue === "string" || typeof stepValue === "number") &&
          String(stepValue).trim().length > 0 &&
          typeof title === "string" &&
          title.trim().length > 0 &&
          typeof desc === "string" &&
          desc.trim().length > 0
        );
      })
    : [];

  return (
    <section aria-labelledby="how-it-works-title">
      <h2
        id="how-it-works-title"
        className="font-sora font-bold text-[22px] text-navy text-center"
      >
        How It Works
      </h2>

      <p className="text-[12.5px] text-ink-soft text-center mt-1.5 max-w-[520px] mx-auto">
        Simple steps to start your business partnership
      </p>

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-7 text-center text-[11px] text-ink-soft"
        >
          Loading steps…
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="mt-7 text-center text-[11px] text-red-500"
        >
          {loadError}
        </div>
      ) : validSteps.length > 0 ? (
        <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-2 mt-7">
          {validSteps.map((step, i) => (
            <div
              key={`${String(step.step)}-${i}`}
              className="flex items-center flex-1"
            >
              <div className="flex-1">
                <span
                  className="w-9 h-9 rounded-full bg-navy text-white text-[13px] font-bold flex items-center justify-center mb-3"
                  aria-label={`Step ${step.step}`}
                >
                  {step.step}
                </span>

                <h3 className="text-[12.5px] font-bold text-ink mb-1">
                  {step.title}
                </h3>

                <p className="text-[11px] text-ink-soft leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {i < validSteps.length - 1 && (
                <ArrowRight
                  size={16}
                  className="hidden sm:block text-ink-faint shrink-0 mx-2 mt-1"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          role="status"
          className="mt-7 text-center text-[11px] text-ink-soft"
        >
          Steps are currently unavailable.
        </div>
      )}
    </section>
  );
}
