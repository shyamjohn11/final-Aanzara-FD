"use client";

import { useState } from "react";
import { PRODUCT_TABS, SPEC_TABLE } from "@/app/data/productDetail";

export default function ProductTabs() {
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
            <h3 className="
              font-sora
              font-bold
              text-[14.5px]
              text-ink
              mb-3
            ">
              Fortune Sunflower Oil Specifications
            </h3>

            {Array.isArray(SPEC_TABLE) &&
            SPEC_TABLE.length > 0 ? (
              <div className="
                border
                border-line
                rounded-lg
                overflow-hidden
              ">
                {SPEC_TABLE.map(
                  (row, i) => {
                    if (
                      !row ||
                      typeof row !== "object"
                    ) {
                      return null;
                    }

                    const label =
                      typeof row.label === "string"
                        ? row.label.trim()
                        : "";

                    const value =
                      typeof row.value === "string"
                        ? row.value.trim()
                        : String(
                            row.value ?? ""
                          );

                    if (!label) {
                      return null;
                    }

                    return (
                      <div
                        key={`${label}-${i}`}
                        className={`
                          flex
                          flex-col
                          sm:flex-row
                          sm:items-center
                          px-4
                          py-3
                          text-[12.5px]
                          ${
                            i % 2 === 0
                              ? "bg-white"
                              : "bg-paper"
                          }
                          ${
                            i > 0
                              ? "border-t border-line"
                              : ""
                          }
                        `}
                      >
                        <span className="
                          sm:w-[220px]
                          shrink-0
                          text-ink-soft
                          font-medium
                        ">
                          {label}
                        </span>

                        <span className="
                          text-ink
                          font-semibold
                          mt-1
                          sm:mt-0
                        ">
                          {value || "—"}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div
                role="status"
                className="
                  border
                  border-line
                  rounded-lg
                  bg-paper
                  px-4
                  py-4
                  text-[12.5px]
                  text-ink-soft
                "
              >
                Product specifications are
                currently unavailable.
              </div>
            )}
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