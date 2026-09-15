// File: app/components/Dashboard/FAQAccordion.tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQS } from "@/app/data/productDetail";
import { contentApi, type ContentItem } from "@/app/api/services";

/* ============================================================
   TYPES
============================================================ */

type FAQItem = {
  q: string;
  a: string;
};

/* ============================================================
   VALIDATION
============================================================ */

function isValidText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function normalizeFAQ(
  item: unknown
): FAQItem | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const faq = item as Partial<FAQItem>;

  if (
    !isValidText(faq.q) ||
    !isValidText(faq.a)
  ) {
    return null;
  }

  return {
    q: faq.q.trim(),
    a: faq.a.trim(),
  };
}

function mapContentToFAQ(row: ContentItem): FAQItem | null {
  const q =
    typeof row.title === "string" ? row.title.trim() : "";
  const a =
    typeof row.description === "string"
      ? row.description.trim()
      : "";
  if (!q || !a) return null;
  return { q, a };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function FAQAccordion() {
  const [open, setOpen] = useState<number>(0);
  const [liveFAQs, setLiveFAQs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await contentApi.list("faqs");
        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];
        if (!cancelled) {
          setLiveFAQs(
            rows
              .map(mapContentToFAQ)
              .filter((f): f is FAQItem => f !== null)
          );
        }
      } catch {
        if (!cancelled) setLiveFAQs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     SAFE FAQ DATA
  ========================================================== */

  const combinedFAQs: unknown[] = Array.isArray(FAQS)
    ? [...FAQS, ...liveFAQs]
    : [...liveFAQs];

  const validFAQs: FAQItem[] = combinedFAQs
    .map(normalizeFAQ)
    .filter(
      (faq): faq is FAQItem =>
        faq !== null
    );

  /* ==========================================================
     SAFE OPEN INDEX
  ========================================================== */

  const safeOpen =
    open >= 0 &&
    open < validFAQs.length
      ? open
      : -1;

  /* ==========================================================
     TOGGLE FAQ
  ========================================================== */

  const toggleFAQ = (index: number) => {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= validFAQs.length
    ) {
      return;
    }

    setOpen((current) =>
      current === index ? -1 : index
    );
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section
      aria-labelledby="faq-title"
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <h2
        id="faq-title"
        className="
          font-sora
          font-bold
          text-[20px]
          text-navy
          text-center
        "
      >
        Frequently Asked Questions
      </h2>

      <p
        className="
          text-[12.5px]
          text-ink-soft
          text-center
          mt-1.5
          max-w-[460px]
          mx-auto
        "
      >
        Clear and quick answers to common shipping
        and buying questions.
      </p>

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {loading && validFAQs.length === 0 ? (
        <div
          role="status"
          className="
            max-w-[820px]
            mx-auto
            mt-6
            bg-white
            border
            border-line
            rounded-lg
            px-4
            py-5
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          Loading frequently asked questions…
        </div>
      ) : validFAQs.length === 0 ? (
        <div
          role="status"
          className="
            max-w-[820px]
            mx-auto
            mt-6
            bg-white
            border
            border-line
            rounded-lg
            px-4
            py-5
            text-center
            text-[12px]
            text-ink-soft
          "
        >
          No frequently asked questions available.
        </div>
      ) : (
        /* ====================================================
           FAQ LIST
        ==================================================== */

        <div
          className="
            flex
            flex-col
            gap-2.5
            mt-6
            max-w-[820px]
            mx-auto
          "
        >
          {validFAQs.map((faq, i) => {
            const isOpen = safeOpen === i;

            const questionId =
              `faq-question-${i}`;

            const answerId =
              `faq-answer-${i}`;

            return (
              <div
                key={`${faq.q}-${i}`}
                className="
                  bg-white
                  border
                  border-line
                  rounded-lg
                  overflow-hidden
                "
              >
                {/* ==================================================
                    QUESTION BUTTON
                ================================================== */}

                <button
                  type="button"
                  id={questionId}
                  onClick={() =>
                    toggleFAQ(i)
                  }
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    gap-3
                    px-4
                    py-3.5
                    text-left
                    transition-colors
                    hover:bg-paper
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue/20
                    focus:ring-inset
                  "
                >
                  <span
                    className="
                      text-[13px]
                      font-semibold
                      text-ink
                    "
                  >
                    {faq.q}
                  </span>

                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`
                      text-ink-faint
                      shrink-0
                      transition-transform
                      duration-200
                      ${
                        isOpen
                          ? "rotate-180"
                          : ""
                      }
                    `}
                  />
                </button>

                {/* ==================================================
                    ANSWER
                ================================================== */}

                {isOpen && (
                  <div
                    id={answerId}
                    role="region"
                    aria-labelledby={questionId}
                    className="
                      border-t
                      border-line
                    "
                  >
                    <p
                      className="
                        px-4
                        pb-4
                        pt-3
                        text-[12.5px]
                        text-ink-soft
                        leading-relaxed
                      "
                    >
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
