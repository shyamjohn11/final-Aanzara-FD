// File: src/app/components/Contact/ContactQuickInfoGrid.tsx

"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, MapPin, Headset } from "lucide-react";
import { contentApi, type ContentItem } from "@/app/api/services";

// =====================================================
// TYPES
// =====================================================

type ContactInfo = {
  title: string;
  value: string;
  sub: string;
};

// =====================================================
// CONSTANTS
// =====================================================

const ICONS = [Phone, Mail, MapPin, Headset];
const COLORS = ["#2448C4", "#1E7A3C", "#E8641C", "#7C3AED"];
const FALLBACK_COLOR = "#2448C4";

// =====================================================
// VALIDATION HELPERS
// =====================================================

function isValidText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidContactInfo(value: unknown): value is ContactInfo {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<ContactInfo>;

  return (
    isValidText(item.title) &&
    isValidText(item.value) &&
    isValidText(item.sub)
  );
}

// =====================================================
// SAFE DATA
// =====================================================

function toContactInfo(row: ContentItem): unknown {
  return {
    title: row.title,
    value: row.description ?? "",
    sub: (row.extra as any)?.sub ?? "",
  };
}

// =====================================================
// LINK BUILDER (detects phone / email / address)
// =====================================================

function getHref(value: string): {
  href: string;
  external: boolean;
} {
  const trimmed = value.trim();

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { href: `mailto:${trimmed}`, external: false };
  }

  // Phone (starts with +, digits, spaces, dashes, parentheses)
  if (/^\+?[\d\s\-()]{6,}$/.test(trimmed) && /\d/.test(trimmed)) {
    const digits = trimmed.replace(/[^\d+]/g, "");
    return { href: `tel:${digits}`, external: false };
  }

  // Fallback: treat as address search on Google Maps
  return {
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      trimmed
    )}`,
    external: true,
  };
}

// =====================================================
// COMPONENT
// =====================================================

export default function ContactQuickInfoGrid() {
  const [raw, setRaw] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await contentApi.list(
          "contact_quick_info",
        );

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

        setRaw(rows.map(toContactInfo));
      } catch {
        if (!mounted) {
          return;
        }
        setError(
          "Contact details are currently unavailable. Please try again later.",
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

  const validContactInfo: ContactInfo[] = Array.isArray(raw)
    ? raw.filter(isValidContactInfo).map((item) => ({
        title: item.title.trim(),
        value: item.value.trim(),
        sub: item.sub.trim(),
      }))
    : [];

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (loading) {
    return (
      <section
        aria-label="Contact information"
        role="status"
        aria-live="polite"
        className="rounded-card border border-dashed border-line bg-white p-6 text-center"
      >
        <div className="text-[13px] font-bold text-ink">
          Loading contact information...
        </div>
      </section>
    );
  }

  // ===================================================
  // ERROR STATE
  // ===================================================

  if (error) {
    return (
      <section
        aria-label="Contact information"
        role="alert"
        className="rounded-card border border-line bg-white p-6 text-center"
      >
        <div className="text-[13px] font-bold text-ink">
          Contact information unavailable
        </div>

        <p className="text-[11.5px] text-ink-soft mt-1">
          {error}
        </p>
      </section>
    );
  }

  // ===================================================
  // EMPTY STATE
  // ===================================================

  if (validContactInfo.length === 0) {
    return (
      <section
        aria-label="Contact information"
        role="status"
        className="rounded-card border border-line bg-white p-6 text-center"
      >
        <div className="text-[13px] font-bold text-ink">
          Contact information unavailable
        </div>

        <p className="text-[11.5px] text-ink-soft mt-1">
          Contact details are currently unavailable. Please try again later.
        </p>
      </section>
    );
  }

  // ===================================================
  // CONTACT GRID
  // ===================================================

  return (
    <section
      aria-label="Contact information"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {validContactInfo.map((info, index) => {
        const Icon = ICONS[index] ?? Headset;
        const color = COLORS[index] ?? FALLBACK_COLOR;
        const key = `${info.title}-${info.value}-${index}`;

        const { href, external } = getHref(info.value);

        return (
          <a
            key={key}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            aria-label={`${info.title}: ${info.value}`}
            className="
              bg-white
              border
              border-line
              rounded-card
              p-5
              flex
              items-start
              gap-3.5
              transition-all
              duration-200
              hover:border-navy/30
              hover:shadow-md
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-navy
              focus-visible:ring-offset-2
              cursor-pointer
            "
          >
            {/* ICON */}
            <span
              aria-hidden="true"
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${color}1A`,
                color,
              }}
            >
              <Icon size={18} />
            </span>

            {/* INFORMATION */}
            <div className="min-w-0">
              <div className="text-[12px] text-ink-soft mb-0.5">
                {info.title}
              </div>

              <div className="text-[13.5px] font-bold text-ink leading-snug break-words">
                {info.value}
              </div>

              <div className="text-[11px] text-ink-soft mt-1 leading-relaxed">
                {info.sub}
              </div>
            </div>
          </a>
        );
      })}
    </section>
  );
}