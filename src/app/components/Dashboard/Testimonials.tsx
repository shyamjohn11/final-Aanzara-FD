"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Building2,
  Landmark,
  Star,
} from "lucide-react";

import { TESTIMONIALS } from "@/app/data/home";
import { contentApi, type ContentItem } from "@/app/api/services";

const ICONS = [ShoppingCart, Building2, Landmark];

// Live rows from section "testimonials" are merged OVER the static
// empty array; validated static logic + empty state below are unchanged.

type ValidTestimonial = {
  name: string;
  text: string;
  role: string;
};

function getValidTestimonials(
  source: unknown
): ValidTestimonial[] {
  if (!Array.isArray(source)) {
    return [];
  }

  return (source as unknown[]).filter(
    (item): item is ValidTestimonial => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const testimonial =
        item as Partial<ValidTestimonial>;

      return (
        typeof testimonial.name === "string" &&
        testimonial.name.trim().length > 0 &&
        typeof testimonial.text === "string" &&
        testimonial.text.trim().length > 0
      );
    }
  ).map((item) => ({
    name: item.name.trim(),
    text: item.text.trim(),
    role:
      typeof item.role === "string" &&
      item.role.trim().length > 0
        ? item.role.trim()
        : "Verified Partner",
  }));
}

function mapContentToTestimonial(
  row: ContentItem
): ValidTestimonial | null {
  const name =
    typeof row.title === "string"
      ? row.title.trim()
      : "";
  const text =
    typeof row.description === "string"
      ? row.description.trim()
      : "";
  if (!name || !text) return null;
  const rawRole = (row.extra as any)?.role;
  return {
    name,
    text,
    role:
      typeof rawRole === "string" && rawRole.trim().length > 0
        ? rawRole.trim()
        : "Verified Partner",
  };
}

export default function Testimonials() {
  const [liveTestimonials, setLiveTestimonials] = useState<
    ValidTestimonial[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await contentApi.list("testimonials");
        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];
        if (!cancelled) {
          setLiveTestimonials(
            rows
              .map(mapContentToTestimonial)
              .filter(
                (
                  t
                ): t is ValidTestimonial =>
                  t !== null
              )
          );
        }
      } catch {
        if (!cancelled) setLiveTestimonials([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validTestimonials = getValidTestimonials([
    ...TESTIMONIALS,
    ...liveTestimonials,
  ]);

  return (
    <section>
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-sora font-bold text-[19px] text-navy">
          What Our Partners Say
        </h2>

        <p className="text-[12.5px] text-ink-soft mt-1">
          We help businesses scale their supply systems seamlessly
        </p>
      </div>

      {loading && validTestimonials.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="
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
          Loading partner testimonials…
        </div>
      ) : validTestimonials.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="
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
          No partner testimonials available right now.
        </div>
      ) : (
        /* Testimonials Grid */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {validTestimonials.map((testimonial, index) => {
            const Icon = ICONS[index % ICONS.length] ?? ShoppingCart;

            return (
              <article
                key={`${testimonial.name}-${index}`}
                className="
                  bg-white
                  border
                  border-line
                  rounded-card
                  p-4
                  hover:border-blue/40
                  hover:shadow-card
                  transition-all
                "
              >
                {/* Icon + Rating */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="
                      w-9
                      h-9
                      rounded-lg
                      bg-paper-deep
                      text-navy
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >
                    <Icon size={16} />
                  </span>

                  <div
                    className="flex items-center gap-0.5"
                    aria-label="5 out of 5 stars"
                  >
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        size={12}
                        className="fill-amber text-amber"
                      />
                    ))}
                  </div>
                </div>

                {/* Testimonial */}
                <blockquote className="text-[12.5px] text-ink-soft italic leading-relaxed mb-3">
                  &ldquo;{testimonial.text}&rdquo;
                </blockquote>

                {/* Customer */}
                <div className="text-[12.5px] font-bold text-ink">
                  {testimonial.name}
                </div>

                <div className="text-[11px] text-ink-faint mt-0.5">
                  {testimonial.role}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
