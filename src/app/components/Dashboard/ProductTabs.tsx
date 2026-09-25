"use client";

import { useState } from "react";
import { PRODUCT_TABS, SPEC_TABLE } from "@/app/data/productDetail";

type ProductTabsProps = {
  productName?: string;
  specification?: string | null;
};

export default function ProductTabs({ productName, specification }: ProductTabsProps) {
  const displayName = productName?.trim() || "Product";
  const defaultTab = "Product Specifications";

  const [active, setActive] = useState<string>(
    PRODUCT_TABS.includes(defaultTab)
      ? defaultTab
      : PRODUCT_TABS[0] ?? defaultTab
  );

  const handleTabChange = (tab: string) => {
    if (!PRODUCT_TABS.includes(tab)) {
      return;
    }

    setActive(tab);
  };

  const isSpecificationsTab =
    active === "Product Specifications";

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden">
      {/* =====================================================
          TABS
      ===================================================== */}

      <div
        className="
          flex
          items-center
          gap-6
          px-5
          border-b
          border-line
          overflow-x-auto
          scrollbar-none
        "
        role="tablist"
        aria-label="Product information"
      >
        {PRODUCT_TABS.map((tab) => {
          if (
            typeof tab !== "string" ||
            !tab.trim()
          ) {
            return null;
          }

          const isActive = active === tab;

          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() =>
                handleTabChange(tab)
              }
              className={`
                relative
                py-4
                text-[12.5px]
                font-semibold
                whitespace-nowrap
                transition-colors
                ${
                  isActive
                    ? "text-blue"
                    : "text-ink-soft hover:text-ink"
                }
              `}
            >
              {tab}

              {isActive && (
                <span
                  className="
                    absolute
                    left-0
                    right-0
                    -bottom-px
                    h-[2px]
                    bg-blue
                    rounded-full
                  "
                />
              )}
            </button>
          );
        })}
      </div>

      {/* =====================================================
          TAB CONTENT
      ===================================================== */}

      <div className="p-5">
        {isSpecificationsTab ? (
          <>
            <h3 className="font-sora font-bold text-[14.5px] text-ink mb-3">{displayName} Specifications</h3>
            {(() => {
              // Try to parse specification as JSON array of {label,value} or as plain text lines
              const specText = specification?.trim();
              let rows: { label: string; value: string }[] = [];
              if (specText) {
                try {
                  const parsed = JSON.parse(specText);
                  if (Array.isArray(parsed)) {
                    rows = parsed
                      .map((r: any) => ({
                        label: String(r.label ?? r.key ?? "").trim(),
                        value: String(r.value ?? "").trim(),
                      }))
                      .filter((r) => r.label);
                  } else {
                    // Single object case
                    const label = String((parsed as any).label ?? "").trim();
                    const value = String((parsed as any).value ?? "").trim();
                    if (label) rows = [{ label, value }];
                  }
                } catch {
                  // Plain text fallback: split by lines, each line "Label: Value" or just "Label"
                  const lines = specText.split("\n").map((l) => l.trim()).filter(Boolean);
                  rows = lines.map((line, idx) => {
                    const sepIdx = line.indexOf(":");
                    if (sepIdx > 0) {
                      return { label: line.slice(0, sepIdx).trim(), value: line.slice(sepIdx + 1).trim() };
                    }
                    return { label: `Spec ${idx + 1}`, value: line };
                  });
                }
              }
              const displayRows =
                rows.length > 0
                  ? rows
                  : SPEC_TABLE.length > 0
                    ? SPEC_TABLE
                    : [
                        { label: "Brand", value: "Aanzara" },
                        { label: "Category", value: "FMCG" },
                        { label: "Country of Origin", value: "India" },
                        { label: "Storage", value: "Cool, dry place" },
                      ];
              return (
                <div className="border border-line rounded-lg overflow-hidden">
                  {displayRows.map((row: any, i: number) => {
                    const label = String(row.label ?? "").trim();
                    const value = String(row.value ?? "").trim();
                    if (!label) return null;
                    return (
                      <div
                        key={`${label}-${i}`}
                        className={`flex flex-col sm:flex-row sm:items-center px-4 py-3 text-[12.5px] ${i % 2 === 0 ? "bg-white" : "bg-paper"} ${i > 0 ? "border-t border-line" : ""}`}
                      >
                        <span className="sm:w-[220px] shrink-0 text-ink-soft font-medium">{label}</span>
                        <span className="text-ink font-semibold mt-1 sm:mt-0">{value || "—"}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        ) : (
          <p className="
            text-[13px]
            text-ink-soft
            leading-relaxed
          ">
            Details for &ldquo;
            {active || "this section"}
            &rdquo; will be available shortly.
            Contact our enterprise desk for a
            full specification sheet in the
            meantime.
          </p>
        )}
      </div>
    </div>
  );
}