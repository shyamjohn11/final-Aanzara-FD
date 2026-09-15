"use client";

import { useEffect, useState } from "react";
import {
  MessageCircle,
  Phone,
  Mail,
  LifeBuoy,
} from "lucide-react";
import { contentApi, type ContentItem } from "@/app/api/services";

const ICONS = [
  MessageCircle,
  Phone,
  Mail,
  LifeBuoy,
] as const;

function isValidText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidId(value: unknown): boolean {
  return (
    (typeof value === "string" ||
      typeof value === "number") &&
    String(value).trim().length > 0
  );
}

export default function NeedHelpSection() {
  const [raw, setRaw] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await contentApi.list("help_options");

        const data = res.data as
          | ContentItem[]
          | { items: ContentItem[] };

        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];

        if (!mounted) {
          return;
        }

        setRaw(
          rows.map((row, index) => ({
            id: (row as ContentItem).id ?? String(index),
            title: row.title,
            detail:
              row.description ??
              (row.extra as any)?.detail ??
              "",
          })),
        );
      } catch {
        if (!mounted) {
          return;
        }
        setError(
          "Help options are currently unavailable. Please try again later.",
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

  // Validate live rows (same shape as previous HELP_OPTIONS)
  type HelpRow = { id?: unknown; title?: unknown; detail?: unknown };
  const safeOptions: HelpRow[] = Array.isArray(raw)
    ? (raw as HelpRow[]).filter((option: HelpRow) => {
        if (
          !option ||
          typeof option !== "object" ||
          Array.isArray(option)
        ) {
          return false;
        }

        const item = option as {
          id?: unknown;
          title?: unknown;
          detail?: unknown;
        };

        return (
          isValidId(item.id) &&
          isValidText(item.title) &&
          isValidText(item.detail)
        );
      })
    : [];

  // Prevent duplicate IDs
  const usedIds = new Set<string>();

  const validatedOptions = safeOptions
    .map((option: HelpRow) => ({
      ...option,
      title:
        typeof option.title === "string"
          ? option.title.trim()
          : "",
      detail:
        typeof option.detail === "string"
          ? option.detail.trim()
          : "",
    }))
    .filter((option: HelpRow) => {
      const id = String(option.id).trim();

      if (usedIds.has(id)) {
        return false;
      }

      usedIds.add(id);
      return true;
    });

  return (
    <section
      className="
        bg-white
        border
        border-line
        rounded-card
        p-6
        sm:p-8
      "
      aria-labelledby="need-help-title"
    >
      <h2
        id="need-help-title"
        className="text-[16px] font-bold text-ink mb-5"
      >
        Need Help with Your Wholesale Order?
      </h2>

      {loading ? (
        <div
          className="
            min-h-[80px]
            flex
            items-center
            justify-center
            border
            border-dashed
            border-line
            rounded-lg
            text-[12px]
            text-ink-faint
            text-center
          "
          role="status"
          aria-live="polite"
        >
          Loading help options...
        </div>
      ) : error ? (
        <div
          className="
            min-h-[80px]
            flex
            items-center
            justify-center
            border
            border-dashed
            border-line
            rounded-lg
            text-[12px]
            text-ink-faint
            text-center
          "
          role="alert"
        >
          {error}
        </div>
      ) : validatedOptions.length > 0 ? (
        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-5
          "
        >
          {validatedOptions.map((opt, index) => {
            // Safe icon fallback
            const Icon =
              ICONS[index] ?? LifeBuoy;

            return (
              <div
                key={String(opt.id)}
                className="
                  flex
                  items-center
                  gap-3
                  min-w-0
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
                  aria-hidden="true"
                >
                  <Icon size={15} />
                </span>

                <div className="min-w-0">
                  <div
                    className="
                      text-[12px]
                      font-bold
                      text-ink
                      truncate
                    "
                    title={opt.title}
                  >
                    {opt.title}
                  </div>

                  <div
                    className="
                      text-[11px]
                      text-ink-soft
                      truncate
                    "
                    title={opt.detail}
                  >
                    {opt.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="
            min-h-[80px]
            flex
            items-center
            justify-center
            border
            border-dashed
            border-line
            rounded-lg
            text-[12px]
            text-ink-faint
            text-center
          "
          role="status"
        >
          Help options are currently unavailable.
        </div>
      )}
    </section>
  );
}