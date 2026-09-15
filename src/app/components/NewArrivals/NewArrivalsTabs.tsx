"use client";

interface NewArrivalsTabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

/* --------------------------------
 * Text validation
 * -------------------------------- */
function isValidText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */
export default function NewArrivalsTabs({
  tabs,
  active,
  onChange,
}: NewArrivalsTabsProps) {
  const safeTabs = Array.isArray(tabs)
    ? tabs.filter(isValidText).map((tab) => tab.trim())
    : [];

  const safeActive = isValidText(active)
    ? active.trim()
    : "";

  const handleTabChange = (
    tab: string,
  ): void => {
    if (!isValidText(tab)) {
      return;
    }

    const safeTab = tab.trim();

    /*
     * Only allow values that actually
     * exist in the server-derived tabs.
     */
    if (!safeTabs.includes(safeTab)) {
      return;
    }

    onChange(safeTab);
  };

  return (
    <nav
      aria-label="New arrival categories"
      className="
        flex
        items-center
        gap-2
        overflow-x-auto
        scrollbar-none
        pb-1
      "
    >
      {safeTabs.length > 0 ? (
        safeTabs.map((tab) => {
          const isActive =
            safeActive === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() =>
                handleTabChange(tab)
              }
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
              className={`
                shrink-0
                text-[12.5px]
                font-semibold
                px-4
                py-2
                rounded-pill
                border
                transition-colors
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-green
                focus-visible:ring-offset-2
                ${
                  isActive
                    ? "bg-green text-white border-green"
                    : "bg-white text-ink-soft border-line hover:border-green hover:text-green-deep"
                }
              `}
            >
              {tab}
            </button>
          );
        })
      ) : (
        <div
          className="
            w-full
            py-2
            text-[12px]
            text-ink-faint
            text-center
          "
          role="status"
          aria-live="polite"
        >
          No categories available.
        </div>
      )}
    </nav>
  );
}
