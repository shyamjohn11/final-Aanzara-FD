// File: src/app/components/Contact/ContactQuickInfoGrid.tsx

"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, MapPin, Headset } from "lucide-react";
import { contentApi } from "@/app/api/services";
import { CONTACT_QUICK_INFO } from "@/app/data/contact";

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

function textField(
  row: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function extractRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const container = data as {
    items?: unknown;
    data?: unknown;
  } | null;
  if (container && Array.isArray(container.items)) {
    return container.items;
  }
  if (container && Array.isArray(container.data)) {
    return container.data;
  }
  return [];
}

function toContactInfo(row: unknown): unknown {
  if (typeof row === "string") {
    return {
      title: row,
      value: row,
      sub: "",
    };
  }

  const rec = row as Record<string, unknown>;
  const extra = rec.extra as Record<string, unknown> | null | undefined;
  return {
    title:
      textField(rec, "title", "Title") ||
      textField(rec, "name", "Name"),
    value:
      textField(
        rec,
        "description",
        "Description",
        "value",
        "Value",
        "phone",
        "Phone",
        "email",
        "Email",
        "address",
        "Address",
      ) ||
      textField(extra ?? {}, "value", "Value"),
    // JsonExtensionData flattens extra onto the object; also accept nested extra.
    sub:
      textField(rec, "sub", "Sub") ||
      textField(extra ?? {}, "sub", "Sub") ||
      textField(rec, "detail", "Detail"),
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

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        const res = await contentApi.list(
          "contact_quick_info",
        );

        if (!mounted) {
          return;
        }

        setRaw(extractRows(res.data).map(toContactInfo));
      } catch {
        // Static CONTACT_QUICK_INFO is used below when live data is empty.
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

  const liveItems: ContactInfo[] = Array.isArray(raw)
    ? raw.filter(isValidContactInfo).map((item) => ({
        title: item.title.trim(),
        value: item.value.trim(),
        sub: item.sub.trim(),
      }))
    : [];

  const validContactInfo: ContactInfo[] =
    liveItems.length > 0 ? liveItems : CONTACT_QUICK_INFO;

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