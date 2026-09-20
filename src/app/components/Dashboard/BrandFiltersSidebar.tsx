// File: app/components/Dashboard/BrandFiltersSidebar.tsx
"use client";

/* ============================================================
   DUMMY CATEGORY DATA
   Replace this array with a real API call later — the rest of
   the component (state, rendering) does not need to change.
============================================================ */

const DUMMY_CATEGORIES = [
  { id: "cat-1", name: "Food & Beverages" },
  { id: "cat-2", name: "Personal Care" },
  { id: "cat-3", name: "Home Care" },
  { id: "cat-4", name: "Health Care" },
  { id: "cat-5", name: "Baby Care" },
  { id: "cat-6", name: "Snacks & Branded Foods" },
  { id: "cat-7", name: "Dairy & Bakery" },
];

/* ============================================================
   TYPES
============================================================ */

interface BrandFiltersSidebarProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

/* ============================================================
   RADIO ROW
============================================================ */

function CategoryRadio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className="
        flex
        items-center
        gap-2.5
        cursor-pointer
        group
      "
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="sr-only"
        aria-label={label}
      />

      <span
        aria-hidden="true"
        className={`
          w-[18px]
          h-[18px]
          rounded-full
          border
          flex
          items-center
          justify-center
          shrink-0
          transition-colors
          ${
            checked
              ? "border-blue"
              : "border-ink-faint group-hover:border-blue"
          }
        `}
      >
        {checked && (
          <span className="w-[9px] h-[9px] rounded-full bg-blue" />
        )}
      </span>

      <span className="text-[13px] text-ink">{label}</span>
    </label>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function BrandFiltersSidebar({
  selectedCategoryId,
  onSelectCategory,
}: BrandFiltersSidebarProps) {
  return (
    <aside
      aria-label="Product category filter"
      className="
        bg-white
        border
        border-line
        rounded-card
        p-5
        h-fit
      "
    >
      <h2 className="font-sora font-bold text-[15px] text-ink mb-4">
        Categories
      </h2>

      <div
        role="radiogroup"
        aria-label="Filter by category"
        className="flex flex-col gap-2.5"
      >
        <CategoryRadio
          label="All Categories"
          checked={selectedCategoryId === ""}
          onChange={() => onSelectCategory("")}
        />

        {DUMMY_CATEGORIES.map((category) => (
          <CategoryRadio
            key={category.id}
            label={category.name}
            checked={selectedCategoryId === category.id}
            onChange={() => onSelectCategory(category.id)}
          />
        ))}
      </div>
    </aside>
  );
}
