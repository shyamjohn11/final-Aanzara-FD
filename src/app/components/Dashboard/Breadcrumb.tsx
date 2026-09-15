// File: app/components/Dashboard/Breadcrumb.tsx
"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type Crumb =
  | string
  | {
      label: string;
      href?: string;
    };

type NormalizedCrumb = {
  label: string;
  href?: string;
};

/* ============================================================
   VALIDATION HELPERS
============================================================ */

function isValidLabel(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidHref(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

/* ============================================================
   NORMALIZE CRUMB
============================================================ */

function normalizeCrumb(
  crumb: Crumb
): NormalizedCrumb | null {
  /* ----------------------------------------------------------
     STRING CRUMB
  ---------------------------------------------------------- */

  if (typeof crumb === "string") {
    const label = crumb.trim();

    if (!isValidLabel(label)) {
      return null;
    }

    return {
      label,
    };
  }

  /* ----------------------------------------------------------
     OBJECT CRUMB
  ---------------------------------------------------------- */

  if (
    !crumb ||
    typeof crumb !== "object"
  ) {
    return null;
  }

  const label =
    typeof crumb.label === "string"
      ? crumb.label.trim()
      : "";

  if (!isValidLabel(label)) {
    return null;
  }

  const href =
    isValidHref(crumb.href)
      ? crumb.href.trim()
      : undefined;

  return {
    label,
    href,
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Breadcrumb({
  trail,
}: {
  trail: Crumb[];
}) {
  /* ----------------------------------------------------------
     SAFE TRAIL
  ---------------------------------------------------------- */

  const normalized: NormalizedCrumb[] =
    Array.isArray(trail)
      ? trail
          .map(normalizeCrumb)
          .filter(
            (
              crumb
            ): crumb is NormalizedCrumb =>
              crumb !== null
          )
      : [];

  /* ----------------------------------------------------------
     EMPTY STATE
  ---------------------------------------------------------- */

  if (normalized.length === 0) {
    return null;
  }

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */

  return (
    <nav
      aria-label="Breadcrumb"
      className="
        flex
        min-w-0
        items-center
        gap-1.5
        text-[13px]
        text-ink-faint
      "
    >
      <ol className="flex min-w-0 items-center gap-1.5">
        {normalized.map(
          (crumb, index) => {
            const isLast =
              index ===
              normalized.length - 1;

            /*
             * Label + index gives us a stable fallback key
             * even when the same breadcrumb label appears
             * more than once.
             */
            const key = `${crumb.label}-${index}`;

            return (
              <li
                key={key}
                className="
                  flex
                  min-w-0
                  items-center
                  gap-1.5
                "
              >
                {/* ==================================================
                    CRUMB
                ================================================== */}

                {crumb.href &&
                !isLast ? (
                  <Link
                    href={crumb.href}
                    className="
                      max-w-[220px]
                      truncate
                      hover:text-navy
                      transition-colors
                    "
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={
                      isLast
                        ? "page"
                        : undefined
                    }
                    className={`
                      max-w-[220px]
                      truncate
                      ${
                        isLast
                          ? "font-semibold text-ink"
                          : ""
                      }
                    `}
                  >
                    {crumb.label}
                  </span>
                )}

                {/* ==================================================
                    SEPARATOR
                ================================================== */}

                {!isLast && (
                  <ChevronRight
                    size={13}
                    aria-hidden="true"
                    className="
                      shrink-0
                      text-ink-faint
                    "
                  />
                )}
              </li>
            );
          }
        )}
      </ol>
    </nav>
  );
}