import { ReactNode } from "react";

// ============================================================
// TYPES
// ============================================================

type StatusType =
  | "Active"
  | "Inactive"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Completed"
  | "Draft"
  | "Published"
  | "Low Stock"
  | "Out of Stock"
  | "Paid"
  | "Unpaid"
  | "Open"
  | "Closed"
  | "New"
  | "Resolved"
  | "Expired"
  | "Enabled"
  | "Disabled"
  | string;

type StatusBadgeProps = {
  status: StatusType;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_STATUS_STYLE = {
  bg: "bg-[#F1F3F6]",
  text: "text-[#66748B]",
};

const STATUS_STYLES: Record<
  string,
  {
    bg: string;
    text: string;
    border?: string;
  }
> = {
  active: {
    bg: "bg-[#EAF8F0]",
    text: "text-[#249357]",
  },

  inactive: {
    bg: "bg-[#FFF0F0]",
    text: "text-[#D85A5A]",
  },

  pending: {
    bg: "bg-[#FFF7E6]",
    text: "text-[#C98512]",
  },

  approved: {
    bg: "bg-[#EAF8F0]",
    text: "text-[#249357]",
  },

  rejected: {
    bg: "bg-[#FFF0F0]",
    text: "text-[#D85A5A]",
  },

  confirmed: {
    bg: "bg-[#EAF2FF]",
    text: "text-[#1769F5]",
  },

  processing: {
    bg: "bg-[#EEF4FF]",
    text: "text-[#3260B4]",
  },

  shipped: {
    bg: "bg-[#F0EEFF]",
    text: "text-[#6957C7]",
  },

  delivered: {
    bg: "bg-[#EAF8F0]",
    text: "text-[#249357]",
  },

  cancelled: {
    bg: "bg-[#FFF0F0]",
    text: "text-[#D85A5A]",
  },

  completed: {
    bg: "bg-[#EAF8F0]",
    text: "text-[#249357]",
  },

  draft: {
    bg: "bg-[#F1F3F6]",
    text: "text-[#6B7789]",
  },

  published: {
    bg: "bg-[#EAF8F0]",
    text: "text-[#249357]",
  },

  "low stock": {
    bg: "bg-[#FFF7E6]",
    text: "text-[#C98512]",
  },

  "out of stock": {
    bg: "bg-[#FFF0F0]",
    text: "text-[#D85A5A]",
  },

  paid: {
    bg: "bg-[#EAF8F0]",
    text: "text-[#249357]",
  },

  unpaid: {
    bg: "bg-[#FFF7E6]",
    text: "text-[#C98512]",
  },

  open: {
    bg: "bg-[#EAF2FF]",
    text: "text-[#1769F5]",
  },

  closed: {
    bg: "bg-[#F1F3F6]",
    text: "text-[#6B7789]",
  },

  new: {
    bg: "bg-[#EAF2FF]",
    text: "text-[#1769F5]",
  },

  resolved: {
    bg: "bg-[#EAF8F0]",
    text: "text-[#249357]",
  },

  expired: {
    bg: "bg-[#FFF0F0]",
    text: "text-[#D85A5A]",
  },

  enabled: {
    bg: "bg-[#EAF8F0]",
    text: "text-[#249357]",
  },

  disabled: {
    bg: "bg-[#F1F3F6]",
    text: "text-[#6B7789]",
  },
};

// ============================================================
// SIZE STYLES
// ============================================================

const SIZE_STYLES = {
  sm: {
    wrapper: "px-2 py-0.5 text-[7px]",
    dot: "h-1.5 w-1.5",
    gap: "gap-1",
  },

  md: {
    wrapper: "px-2.5 py-1 text-[8px]",
    dot: "h-1.5 w-1.5",
    gap: "gap-1.5",
  },

  lg: {
    wrapper: "px-3 py-1.5 text-[9px]",
    dot: "h-2 w-2",
    gap: "gap-1.5",
  },
} as const;

// ============================================================
// VALIDATION HELPERS
// ============================================================

function normalizeStatus(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getSafeStatusText(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "Unknown";
  }

  const cleaned = value
    .trim()
    .replace(/\s+/g, " ");

  return cleaned || "Unknown";
}

function getSafeSize(
  value: unknown
): keyof typeof SIZE_STYLES {
  if (
    value === "sm" ||
    value === "md" ||
    value === "lg"
  ) {
    return value;
  }

  return "md";
}

function isValidClassName(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function StatusBadge({
  status,
  icon,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  // ==========================================================
  // SAFE STATUS
  // ==========================================================

  const statusText =
    getSafeStatusText(status);

  const normalizedStatus =
    normalizeStatus(status);

  // ==========================================================
  // STATUS STYLE
  // ==========================================================

  const style =
    STATUS_STYLES[
      normalizedStatus
    ] ?? DEFAULT_STATUS_STYLE;

  // ==========================================================
  // SAFE SIZE
  // ==========================================================

  const safeSize =
    getSafeSize(size);

  const sizeStyle =
    SIZE_STYLES[safeSize];

  // ==========================================================
  // SAFE CUSTOM CLASS
  // ==========================================================

  const safeClassName =
    isValidClassName(className)
      ? className.trim()
      : "";

  // ==========================================================
  // ICON VALIDATION
  // ==========================================================

  const hasIcon =
    icon !== null &&
    icon !== undefined &&
    icon !== false;

  // ==========================================================
  // FINAL CLASS
  // ==========================================================

  const badgeClassName = [
    "inline-flex",
    "w-fit",
    "items-center",
    "justify-center",
    "rounded-full",
    "font-semibold",
    "leading-none",
    style.bg,
    style.text,
    sizeStyle.wrapper,
    sizeStyle.gap,
    safeClassName,
  ]
    .filter(Boolean)
    .join(" ");

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <span
      className={badgeClassName}
      role="status"
      aria-label={`Status: ${statusText}`}
    >
      {/* ====================================================
          ICON / STATUS DOT
      ===================================================== */}

      {hasIcon ? (
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center"
        >
          {icon}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={[
            "shrink-0",
            "rounded-full",
            "bg-current",
            sizeStyle.dot,
          ].join(" ")}
        />
      )}

      {/* ====================================================
          STATUS TEXT
      ===================================================== */}

      <span>
        {statusText}
      </span>
    </span>
  );
}