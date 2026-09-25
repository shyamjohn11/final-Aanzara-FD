import { ReactNode } from "react";

// =====================================================
// TYPES
// =====================================================

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  iconClassName?: string;
  iconBgClassName?: string;
  valueClassName?: string;
  className?: string;
};

// =====================================================
// VALIDATION HELPERS
// =====================================================

function getSafeText(
  value: unknown,
  fallback: string
): string {
  if (
    typeof value !== "string"
  ) {
    return fallback;
  }

  const cleaned = value
    .trim()
    .replace(/\s+/g, " ");

  return cleaned || fallback;
}

// =====================================================
// VALUE VALIDATION
// =====================================================

function getSafeValue(
  value: unknown
): string {
  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? String(value)
      : "0";
  }

  if (
    typeof value === "string"
  ) {
    const cleaned = value.trim();

    return cleaned || "0";
  }

  return "0";
}

// =====================================================
// CLASS NAME VALIDATION
// =====================================================

function getSafeClassName(
  value: unknown,
  fallback = ""
): string {
  if (
    typeof value !== "string"
  ) {
    return fallback;
  }

  return value.trim();
}

// =====================================================
// COMPONENT
// =====================================================

export default function StatCard({
  title,
  value,
  description,
  icon,
  iconClassName = "text-[#1769F5]",
  iconBgClassName = "bg-[#EDF3FF]",
  valueClassName = "text-[#293953]",
  className = "",
}: StatCardProps) {
  // ===================================================
  // SAFE VALUES
  // ===================================================

  const safeTitle = getSafeText(
    title,
    "Untitled"
  );

  const safeValue =
    getSafeValue(value);

  const safeDescription =
    typeof description ===
      "string" &&
    description.trim().length > 0
      ? description
          .trim()
          .replace(/\s+/g, " ")
      : "";

  // ===================================================
  // SAFE CLASSES
  // ===================================================

  const safeIconClassName =
    getSafeClassName(
      iconClassName,
      "text-[#1769F5]"
    );

  const safeIconBgClassName =
    getSafeClassName(
      iconBgClassName,
      "bg-[#EDF3FF]"
    );

  const safeValueClassName =
    getSafeClassName(
      valueClassName,
      "text-[#293953]"
    );

  const safeClassName =
    getSafeClassName(
      className
    );

  // ===================================================
  // ICON VALIDATION
  // ===================================================

  const hasIcon =
    icon !== null &&
    icon !== undefined &&
    icon !== false;

  // ===================================================
  // CARD CLASS
  // ===================================================

  const cardClassName = [
    "w-full",
    "rounded-xl",
    "border",
    "border-[#E4E8EF]",
    "bg-white",
    "p-4",
    "shadow-sm",
    "transition",
    "hover:shadow-md",
    safeClassName,
  ]
    .filter(Boolean)
    .join(" ");

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <article
      className={cardClassName}
      aria-label={`${safeTitle}: ${safeValue}`}
    >
      <div className="flex items-start justify-between gap-3">

        {/* =================================================
            LEFT CONTENT
        ================================================== */}

        <div className="min-w-0 flex-1">

          {/* TITLE */}

          <p
            className="truncate text-[9px] font-medium text-[#8995A5]"
            title={safeTitle}
          >
            {safeTitle}
          </p>

          {/* VALUE */}

          <p
            className={`
              mt-2
              text-[20px]
              font-bold
              leading-none
              ${safeValueClassName}
            `}
          >
            {safeValue}
          </p>

          {/* DESCRIPTION */}

          {safeDescription && (
            <p
              className="mt-2 truncate text-[8px] text-[#9AA5B4]"
              title={safeDescription}
            >
              {safeDescription}
            </p>
          )}
        </div>

        {/* =================================================
            ICON
        ================================================== */}

        {hasIcon && (
          <div
            aria-hidden="true"
            className={`
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              ${safeIconBgClassName}
              ${safeIconClassName}
            `}
          >
            {icon}
          </div>
        )}
      </div>
    </article>
  );
}