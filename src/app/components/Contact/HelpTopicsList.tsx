// File: src/app/components/Contact/HelpTopicsList.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  FileText,
  Truck,
  RotateCcw,
  Handshake,
  ChevronRight,
} from "lucide-react";
import { enquiriesApi } from "@/app/api/services";
import { HELP_TOPICS } from "@/app/data/contact";

// =====================================================
// TYPES
// =====================================================

type HelpTopic = {
  title: string;
  desc: string;
};

// =====================================================
// CONSTANTS
// =====================================================

const ICONS = [Package, FileText, Truck, RotateCcw, Handshake];
const COLORS = ["#2448C4", "#1E7A3C", "#E8641C", "#D63A6B", "#E3A62F"];
const FALLBACK_COLOR = "#2448C4";

// =====================================================
// VALIDATION HELPERS
// =====================================================

function isValidText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isValidHelpTopic(value: unknown): value is HelpTopic {
  if (!value || typeof value !== "object") {
    return false;
  }

  const topic = value as Partial<HelpTopic>;

  return isValidText(topic.title) && isValidText(topic.desc);
}

// #131 GET /api/admin/enquiries — derive help topics from live
// enquiry subjects, falling back to static HELP_TOPICS.
function topicsFromEnquiries(payload: unknown): HelpTopic[] {
  const rows = Array.isArray(payload)
    ? payload.filter(isRecord)
    : isRecord(payload) &&
        Array.isArray(
          (payload as Record<string, unknown>)["items"],
        )
      ? (
          (payload as Record<string, unknown>)["items"] as unknown[]
        ).filter(isRecord)
      : isRecord(payload) &&
          Array.isArray(
            (payload as Record<string, unknown>)["data"],
          )
        ? (
            (payload as Record<string, unknown>)["data"] as unknown[]
          ).filter(isRecord)
        : [];

  const seen = new Set<string>();
  const topics: HelpTopic[] = [];

  for (const row of rows) {
    const subject =
      (typeof row["subject"] === "string" && row["subject"].trim()) ||
      (typeof row["category"] === "string" && row["category"].trim()) ||
      (typeof row["type"] === "string" && row["type"].trim()) ||
      "";

    if (!subject) {
      continue;
    }

    const key = subject.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    topics.push({
      title: subject,
      desc: `Get help with ${subject} — our support team will connect you with the right person.`,
    });
  }

  return topics;
}

function staticTopics(): HelpTopic[] {
  return Array.isArray(HELP_TOPICS)
    ? HELP_TOPICS.filter(isValidHelpTopic).map((topic) => ({
        title: topic.title.trim(),
        desc: topic.desc.trim(),
      }))
    : [];
}

// =====================================================
// SLUG HELPER (shared with src/app/help/[slug]/page.tsx)
// =====================================================

export function slugifyHelpTopic(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugify(value: string): string {
  return slugifyHelpTopic(value);
}

// =====================================================
// COMPONENT
// =====================================================

export default function HelpTopicsList() {
  const [topics, setTopics] = useState<HelpTopic[]>(() =>
    staticTopics(),
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Live topics — best-effort; static topics persist on failure.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await enquiriesApi.list(1, 50);
        const live = topicsFromEnquiries(data);

        if (!cancelled) {
          if (live.length > 0) {
            const merged = [
              ...live,
              ...staticTopics().filter(
                (topic) =>
                  !live.some(
                    (liveTopic) =>
                      liveTopic.title.toLowerCase() ===
                      topic.title.toLowerCase(),
                  ),
              ),
            ];

            setTopics(merged);
          }

          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (loading) {
    return (
      <section
        aria-labelledby="help-topics-title"
        aria-label="Loading help topics"
        className="bg-white border border-line rounded-card p-5 sm:p-6"
      >
        <h2
          id="help-topics-title"
          className="font-sora font-bold text-[17px] text-navy"
        >
          We&apos;re Here to Help
        </h2>

        <div
          className="mt-4 flex flex-col gap-3"
          role="status"
          aria-live="polite"
        >
          {[0, 1, 2].map((skeleton) => (
            <div key={skeleton} className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-lg bg-paper-deep animate-pulse shrink-0" />
              <span className="flex-1 flex flex-col gap-1.5">
                <span className="h-3 rounded bg-paper-deep animate-pulse w-1/2" />
                <span className="h-2.5 rounded bg-paper-deep animate-pulse w-full" />
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ===================================================
  // EMPTY STATE
  // ===================================================

  if (topics.length === 0) {
    return (
      <section
        aria-labelledby="help-topics-title"
        role="status"
        className="bg-white border border-line rounded-card p-5 sm:p-6"
      >
        <h2
          id="help-topics-title"
          className="font-sora font-bold text-[17px] text-navy"
        >
          We&apos;re Here to Help
        </h2>

        <p className="text-[12px] text-ink-soft mt-1">
          {loadError
            ? "Help topics could not be loaded. Please try again later."
            : "Help topics are currently unavailable. Please try again later."}
        </p>
      </section>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <section
      aria-labelledby="help-topics-title"
      className="bg-white border border-line rounded-card p-5 sm:p-6"
    >
      {/* HEADER */}
      <h2
        id="help-topics-title"
        className="font-sora font-bold text-[17px] text-navy"
      >
        We&apos;re Here to Help
      </h2>

      <p className="text-[12px] text-ink-soft mt-1 mb-4">
        Choose a topic and we&apos;ll connect you with the right person.
      </p>

      {/* TOPICS */}
      <div className="flex flex-col divide-y divide-line">
        {topics.map((topic, index) => {
          const Icon = ICONS[index] ?? Handshake;
          const color = COLORS[index] ?? FALLBACK_COLOR;
          const topicKey = `${topic.title}-${index}`;
          const href = `/help/${slugify(topic.title)}`;

          return (
            <Link
              key={topicKey}
              href={href}
              prefetch={false}
              aria-label={`Get help with ${topic.title}`}
              className="
                flex
                items-start
                gap-3
                py-3.5
                text-left
                group
                first:pt-0
                last:pb-0
                w-full
                transition-colors
                hover:bg-slate-50/60
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-navy
                focus-visible:ring-inset
                rounded-md
                -mx-2
                px-2
                cursor-pointer
              "
            >
              {/* ICON */}
              <span
                aria-hidden="true"
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${color}1A`,
                  color,
                }}
              >
                <Icon size={16} />
              </span>

              {/* CONTENT */}
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-bold text-ink group-hover:text-navy transition-colors">
                  {topic.title}
                </div>

                <p className="text-[11px] text-ink-soft mt-0.5 leading-relaxed">
                  {topic.desc}
                </p>
              </div>

              {/* ARROW */}
              <ChevronRight
                aria-hidden="true"
                size={15}
                className="
                  text-ink-faint
                  shrink-0
                  mt-1
                  transition-all
                  duration-200
                  group-hover:text-navy
                  group-hover:translate-x-0.5
                "
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
