// File: src/app/help/[slug]/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { enquiriesApi } from "@/app/api/services";
import { HELP_TOPICS } from "@/app/data/contact";

type HelpTopic = {
  title: string;
  desc: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    for (const key of ["items", "enquiries", "data"]) {
      const nested = payload[key];

      if (Array.isArray(nested)) {
        return nested.filter(isRecord);
      }
    }
  }

  return [];
}

// Same derivation as HelpTopicsList: live enquiry subjects,
// static HELP_TOPICS as fallback.
function resolveTopics(payload: unknown): HelpTopic[] {
  const seen = new Set<string>();
  const topics: HelpTopic[] = [];

  for (const row of extractRows(payload)) {
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

  if (Array.isArray(HELP_TOPICS)) {
    for (const topic of HELP_TOPICS) {
      if (
        !topic ||
        typeof topic.title !== "string" ||
        topic.title.trim().length === 0 ||
        typeof topic.desc !== "string" ||
        topic.desc.trim().length === 0
      ) {
        continue;
      }

      const key = topic.title.trim().toLowerCase();

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      topics.push({
        title: topic.title.trim(),
        desc: topic.desc.trim(),
      });
    }
  }

  return topics;
}

export default function HelpTopicPage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] ?? "" : (rawSlug ?? "");

  const [topics, setTopics] = useState<HelpTopic[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Live topics (#131 enquiriesApi.list) with static fallback.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await enquiriesApi.list(1, 50);

        if (!cancelled) {
          setTopics(resolveTopics(data));
          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setTopics(resolveTopics(null));
          setLoadError(true);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (topics === null) {
    return (
      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-10">
        <div
          role="status"
          aria-live="polite"
          aria-label="Loading help topic"
          className="rounded-card border border-line bg-white p-6"
        >
          <div className="h-6 rounded bg-paper-deep animate-pulse w-1/2" />
          <div className="mt-3 h-3.5 rounded bg-paper-deep animate-pulse w-full" />
          <div className="mt-2 h-3.5 rounded bg-paper-deep animate-pulse w-5/6" />
        </div>
      </main>
    );
  }

  const topic = topics.find((t) => slugify(t.title) === slug);

  if (!topic) {
    return (
      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/contact"
          className="text-[12px] font-semibold text-blue hover:underline"
        >
          ← Back to Contact
        </Link>

        <div
          role="status"
          className="mt-4 rounded-card border border-dashed border-line bg-white p-6 text-center"
        >
          <h1 className="font-sora text-[20px] font-extrabold text-navy">
            Help topic not found
          </h1>
          <p className="mt-2 text-[13px] text-ink-soft">
            {loadError
              ? "Help topics could not be loaded. Please try again later."
              : "This help topic is currently unavailable."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/contact"
        className="text-[12px] font-semibold text-blue hover:underline"
      >
        ← Back to Contact
      </Link>

      <h1 className="mt-4 font-sora text-[28px] font-extrabold text-navy">
        {topic.title}
      </h1>

      <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">
        {topic.desc}
      </p>

      <div className="mt-8 rounded-card border border-line bg-white p-6">
        <p className="text-[13px] text-ink-soft">
          Detailed help content for <strong>{topic.title}</strong> will
          appear here.
        </p>

        <Link
          href={`/contact?topic=${encodeURIComponent(topic.title)}`}
          className="mt-4 inline-block text-[12.5px] font-bold text-green-deep hover:underline"
        >
          Contact us about {topic.title} →
        </Link>
      </div>
    </main>
  );
}
