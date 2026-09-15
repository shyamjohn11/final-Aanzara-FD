"use client";

import { useEffect, useState } from "react";
import { contentApi, type ContentItem } from "@/app/api/services";

interface StepItem {
  step: number;
  title: string;
  desc: string;
}

interface StepColumnProps {
  heading: string;
  steps: StepItem[];
  accent: string;
}

/* --------------------------------
 * Validate a single step
 * -------------------------------- */
function isValidStep(value: unknown): value is StepItem {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.step === "number" &&
    Number.isFinite(item.step) &&
    item.step > 0 &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    typeof item.desc === "string" &&
    item.desc.trim().length > 0
  );
}

/* --------------------------------
 * Validate steps array
 * -------------------------------- */
function getSafeSteps(steps: unknown): StepItem[] {
  if (!Array.isArray(steps)) {
    return [];
  }

  const usedSteps = new Set<number>();

  return steps
    .filter(isValidStep)
    .map((step): StepItem => ({
      step: step.step,
      title: step.title.trim(),
      desc: step.desc.trim(),
    }))
    .filter((step) => {
      if (usedSteps.has(step.step)) {
        return false;
      }

      usedSteps.add(step.step);

      return true;
    });
}

/* --------------------------------
 * Validate text
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
 * Validate accent color
 * -------------------------------- */
function getSafeAccent(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    return value.trim();
  }

  return fallback;
}

/* --------------------------------
 * Step Column
 * -------------------------------- */
function StepColumn({
  heading,
  steps,
  accent,
}: StepColumnProps) {
  const safeHeading = getSafeText(
    heading,
    "Steps",
  );

  const safeSteps = getSafeSteps(steps);

  const safeAccent = getSafeAccent(
    accent,
    "#2448C4",
  );

  return (
    <div
      className="
        bg-white
        border
        border-line
        rounded-card
        p-6
        flex-1
      "
    >
      <h3
        className="
          text-[14px]
          font-bold
          text-ink
          mb-5
        "
      >
        {safeHeading}
      </h3>

      {safeSteps.length > 0 ? (
        <div className="flex flex-col gap-5">
          {safeSteps.map((step) => (
            <div
              key={`${safeHeading}-${step.step}`}
              className="
                flex
                items-start
                gap-3.5
              "
            >
              {/* Step Number */}
              <span
                className="
                  w-8
                  h-8
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-white
                  text-[13px]
                  font-bold
                  shrink-0
                "
                style={{
                  backgroundColor: safeAccent,
                }}
                aria-hidden="true"
              >
                {step.step}
              </span>

              {/* Step Content */}
              <div className="min-w-0">
                <div
                  className="
                    text-[13px]
                    font-bold
                    text-ink
                  "
                >
                  {step.title}
                </div>

                <p
                  className="
                    text-[11.5px]
                    text-ink-soft
                    leading-relaxed
                    mt-0.5
                  "
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="
            flex
            items-center
            justify-center
            min-h-[100px]
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
          No steps available.
        </div>
      )}
    </div>
  );
}

/* --------------------------------
 * Map a ContentItem row to a step shape
 * -------------------------------- */
function toStepItem(row: ContentItem): unknown {
  return {
    step: Number((row.extra as any)?.step),
    title: row.title,
    desc: row.description ?? "",
  };
}

/* --------------------------------
 * Main Component
 * -------------------------------- */
export default function HowAanzaraWorks() {
  const [customerRaw, setCustomerRaw] = useState<
    unknown[]
  >([]);
  const [ownerRaw, setOwnerRaw] = useState<
    unknown[]
  >([]);
  const [loading, setLoading] =
    useState<boolean>(true);
  const [error, setError] =
    useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [customerRes, ownerRes] =
          await Promise.all([
            contentApi.list("customer_steps"),
            contentApi.list("owner_steps"),
          ]);

        const customerData =
          customerRes.data as
            | ContentItem[]
            | { items: ContentItem[] };
        const ownerData =
          ownerRes.data as
            | ContentItem[]
            | { items: ContentItem[] };

        const customerRows: ContentItem[] =
          Array.isArray(customerData)
            ? customerData
            : Array.isArray(
                  (customerData as any)?.items,
                )
              ? (customerData as any).items
              : [];
        const ownerRows: ContentItem[] =
          Array.isArray(ownerData)
            ? ownerData
            : Array.isArray(
                  (ownerData as any)?.items,
                )
              ? (ownerData as any).items
              : [];

        if (!mounted) {
          return;
        }

        setCustomerRaw(
          customerRows.map(toStepItem),
        );
        setOwnerRaw(
          ownerRows.map(toStepItem),
        );
      } catch {
        if (!mounted) {
          return;
        }
        setError(
          "Steps are currently unavailable. Please try again later.",
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

  const safeCustomerSteps =
    getSafeSteps(customerRaw);

  const safeOwnerSteps =
    getSafeSteps(ownerRaw);

  return (
    <section
      className="w-full"
      aria-labelledby="how-aanzara-works-title"
    >
      {/* Section Heading */}
      <h2
        id="how-aanzara-works-title"
        className="
          font-sora
          font-bold
          text-[19px]
          text-navy
          text-center
        "
      >
        How Aanzara Works
      </h2>

      {/* Section Description */}
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
        Bringing Customers &amp; Stores Together
      </p>

      {/* Step Columns */}
      {loading ? (
        <div
          className="
            flex
            items-center
            justify-center
            min-h-[100px]
            border
            border-dashed
            border-line
            rounded-card
            text-[12px]
            text-ink-faint
            text-center
            px-4
            mt-7
          "
          role="status"
          aria-live="polite"
        >
          Loading steps...
        </div>
      ) : error ? (
        <div
          className="
            flex
            items-center
            justify-center
            min-h-[100px]
            border
            border-dashed
            border-line
            rounded-card
            text-[12px]
            text-ink-faint
            text-center
            px-4
            mt-7
          "
          role="alert"
        >
          {error}
        </div>
      ) : (
        <div
          className="
            flex
            flex-col
            sm:flex-row
            gap-5
            mt-7
          "
        >
          <StepColumn
            heading="For Customers"
            steps={safeCustomerSteps}
            accent="#2448C4"
          />

          <StepColumn
            heading="For Store Owners"
            steps={safeOwnerSteps}
            accent="#1E7A3C"
          />
        </div>
      )}
    </section>
  );
}