// File: app/components/Dashboard/FiltersSidebar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { storefrontBrandsApi } from "@/app/api/services";

/* ============================================================
   TYPES
============================================================ */

type StockFilter = "exclude" | "all";

type Brand = {
  name: string;
  checked?: boolean;
};

/* ============================================================
   VALIDATION HELPERS
============================================================ */

function isValidText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function normalizeBrand(
  value: unknown
): Brand | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const brand = value as Partial<Brand>;

  if (!isValidText(brand.name)) {
    return null;
  }

  return {
    name: brand.name.trim(),
    checked:
      typeof brand.checked === "boolean"
        ? brand.checked
        : false,
  };
}

/* ============================================================
   CHECKBOX
============================================================ */

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  const safeLabel = isValidText(label)
    ? label.trim()
    : "Option";

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
        type="checkbox"
        checked={Boolean(checked)}
        onChange={onChange}
        className="sr-only"
        aria-label={safeLabel}
      />

      <span
        aria-hidden="true"
        className={`
          w-[18px]
          h-[18px]
          rounded-[5px]
          border
          flex
          items-center
          justify-center
          shrink-0
          transition-colors
          ${
            checked
              ? "bg-blue border-blue"
              : "border-ink-faint group-hover:border-blue"
          }
        `}
      >
        {checked && (
          <Check
            size={13}
            strokeWidth={3}
            className="text-white"
          />
        )}
      </span>

      <span className="text-[13px] text-ink">
        {safeLabel}
      </span>
    </label>
  );
}

/* ============================================================
   RADIO
============================================================ */

function Radio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  const safeLabel = isValidText(label)
    ? label.trim()
    : "Option";

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
        checked={Boolean(checked)}
        onChange={onChange}
        className="sr-only"
        aria-label={safeLabel}
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

      <span className="text-[13px] text-ink">
        {safeLabel}
      </span>
    </label>
  );
}

/* ============================================================
   TOGGLE
============================================================ */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`
        w-10
        h-[22px]
        rounded-pill
        flex
        items-center
        px-[3px]
        transition-colors
        focus:outline-none
        focus:ring-2
        focus:ring-green/30
        ${
          checked
            ? "bg-green justify-end"
            : "bg-line-soft justify-start border border-line"
        }
      `}
    >
      <span className="w-4 h-4 rounded-full bg-white shadow" />
    </button>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function FiltersSidebar() {
  /* ==========================================================
     LIVE BRAND DATA — GET /api/v1/brands (public, active only)
  ========================================================== */

  const [brandNames, setBrandNames] = useState<string[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setBrandsLoading(true);
        setBrandsError("");
        const { data } = await storefrontBrandsApi.list({ count: 100 });
        const items = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
        if (cancelled) return;
        const names = items
          .map((raw: any) =>
            String(raw?.brandName ?? raw?.name ?? "").trim()
          )
          .filter((name: string) => name.length > 0);
        setBrandNames(names);
      } catch {
        if (!cancelled) {
          setBrandsError("Brands are currently unavailable.");
          setBrandNames([]);
        }
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     VALIDATE BRAND DATA
  ========================================================== */

  const validBrands: Brand[] = useMemo(
    () =>
      Array.isArray(brandNames)
        ? brandNames
            .map((name) => normalizeBrand({ name }))
            .filter(
              (brand): brand is Brand =>
                brand !== null
            )
        : [],
    [brandNames]
  );

  /* ==========================================================
     BRAND STATE
  ========================================================== */

  const [brands, setBrands] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      validBrands.map((brand) => [
        brand.name,
        Boolean(brand.checked),
      ])
    )
  );

  const [brandSearch, setBrandSearch] =
    useState("");

  /* ==========================================================
     PRICE STATE
  ========================================================== */

  const [price, setPrice] = useState(2500);

  const MIN_PRICE = 100;
  const MAX_PRICE = 5000;

  /* ==========================================================
     DISCOUNT STATE
  ========================================================== */

  const [discount10, setDiscount10] =
    useState(true);

  const [discount20, setDiscount20] =
    useState(false);

  const [discount30, setDiscount30] =
    useState(false);

  /* ==========================================================
     OTHER FILTER STATE
  ========================================================== */

  const [stock, setStock] =
    useState<StockFilter>("exclude");

  const [moq, setMoq] =
    useState<string | null>(null);

  const [organic, setOrganic] =
    useState(false);

  const [gstFree, setGstFree] =
    useState(true);

  /* ==========================================================
     FILTERED BRANDS
  ========================================================== */

  const filteredBrands = useMemo(() => {
    const query = brandSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return validBrands;
    }

    return validBrands.filter((brand) =>
      brand.name
        .toLowerCase()
        .includes(query)
    );
  }, [brandSearch, validBrands]);

  /* ==========================================================
     BRAND TOGGLE
  ========================================================== */

  const toggleBrand = (name: string) => {
    if (!isValidText(name)) {
      return;
    }

    setBrands((previous) => ({
      ...previous,
      [name]: !Boolean(previous[name]),
    }));
  };

  /* ==========================================================
     PRICE VALIDATION
  ========================================================== */

  const handlePriceChange = (
    value: string
  ) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    const safeValue = Math.min(
      MAX_PRICE,
      Math.max(MIN_PRICE, numericValue)
    );

    setPrice(safeValue);
  };

  /* ==========================================================
     CLEAR ALL
  ========================================================== */

  const clearAll = () => {
    setBrands(
      Object.fromEntries(
        validBrands.map((brand) => [
          brand.name,
          false,
        ])
      )
    );

    setBrandSearch("");
    setPrice(MAX_PRICE);

    setDiscount10(false);
    setDiscount20(false);
    setDiscount30(false);

    setStock("exclude");
    setMoq(null);
    setOrganic(false);
    setGstFree(false);
  };

  /* ==========================================================
     APPLY FILTERS
  ========================================================== */

  const applyFilters = () => {
    const selectedBrands =
      Object.entries(brands)
        .filter(([, checked]) => checked)
        .map(([name]) => name);

    const selectedDiscounts: number[] = [];

    if (discount10) {
      selectedDiscounts.push(10);
    }

    if (discount20) {
      selectedDiscounts.push(20);
    }

    if (discount30) {
      selectedDiscounts.push(30);
    }

    const filters = {
      brands: selectedBrands,
      maxPrice: price,
      discounts: selectedDiscounts,
      stock,
      moq,
      organic,
      gstFree,
    };

    /*
     * Connect this object to your product filtering logic/API.
     */
    console.log(
      "Applied filters:",
      filters
    );
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <aside
      aria-label="Product filters"
      className="
        bg-white
        border
        border-line
        rounded-card
        p-5
        h-fit
      "
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sora font-bold text-[15px] text-ink">
          Filters
        </h2>

        <button
          type="button"
          onClick={clearAll}
          className="
            text-[12px]
            font-semibold
            text-blue
            hover:underline
            focus:outline-none
            focus:ring-2
            focus:ring-blue/20
            rounded
          "
        >
          Clear All
        </button>
      </div>

      {/* ======================================================
          BRANDS
      ====================================================== */}

      <div className="pb-4 border-b border-line">
        <h3 className="text-[12.5px] font-bold text-ink mb-3">
          Brands
        </h3>

        <div
          className="
            flex
            items-center
            bg-paper
            border
            border-line
            rounded-lg
            px-3
            py-2
            mb-3
          "
        >
          <Search
            size={14}
            aria-hidden="true"
            className="text-ink-faint shrink-0"
          />

          <input
            type="search"
            value={brandSearch}
            onChange={(event) =>
              setBrandSearch(
                event.target.value
              )
            }
            placeholder="Search Brands"
            aria-label="Search brands"
            className="
              w-full
              bg-transparent
              px-2
              text-[12.5px]
              outline-none
              placeholder:text-ink-faint
            "
          />
        </div>

        {brandsLoading ? (
          <p
            role="status"
            className="
              text-[11.5px]
              text-ink-soft
              py-2
            "
          >
            Loading brands…
          </p>
        ) : brandsError && filteredBrands.length === 0 ? (
          <p
            role="alert"
            className="
              text-[11.5px]
              text-ink-soft
              py-2
            "
          >
            {brandsError}
          </p>
        ) : filteredBrands.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {filteredBrands.map((brand) => (
              <Checkbox
                key={brand.name}
                label={brand.name}
                checked={Boolean(
                  brands[brand.name]
                )}
                onChange={() =>
                  toggleBrand(brand.name)
                }
              />
            ))}
          </div>
        ) : (
          <p
            role="status"
            className="
              text-[11.5px]
              text-ink-soft
              py-2
            "
          >
            No brands found.
          </p>
        )}
      </div>

      {/* ======================================================
          PRICE RANGE
      ====================================================== */}

      <div className="py-4 border-b border-line">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-[12.5px] font-bold text-ink">
            Price Range (per carton)
          </h3>

          <span className="text-[11px] font-semibold text-blue">
            ₹{price.toLocaleString("en-IN")}
          </span>
        </div>

        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={50}
          value={price}
          onChange={(event) =>
            handlePriceChange(
              event.target.value
            )
          }
          aria-label="Maximum price per carton"
          className="w-full"
        />

        <div className="flex items-center justify-between text-[11.5px] text-ink-soft mt-1.5">
          <span>
            ₹{MIN_PRICE.toLocaleString("en-IN")}
          </span>

          <span>
            ₹{MAX_PRICE.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* ======================================================
          DISCOUNTS
      ====================================================== */}

      <div className="py-4 border-b border-line">
        <h3 className="text-[12.5px] font-bold text-ink mb-3">
          Discounts (GST Excl.)
        </h3>

        <div className="flex flex-col gap-2.5">
          <Checkbox
            label="10% and above"
            checked={discount10}
            onChange={() =>
              setDiscount10(
                (value) => !value
              )
            }
          />

          <Checkbox
            label="20% and above"
            checked={discount20}
            onChange={() =>
              setDiscount20(
                (value) => !value
              )
            }
          />

          <Checkbox
            label="30% and above"
            checked={discount30}
            onChange={() =>
              setDiscount30(
                (value) => !value
              )
            }
          />
        </div>
      </div>

      {/* ======================================================
          STOCK STATUS
      ====================================================== */}

      <div className="py-4 border-b border-line">
        <h3 className="text-[12.5px] font-bold text-ink mb-3">
          Stock Status
        </h3>

        <div
          role="radiogroup"
          aria-label="Stock status"
          className="flex flex-col gap-2.5"
        >
          <Radio
            label="Exclude Out of Stock"
            checked={
              stock === "exclude"
            }
            onChange={() =>
              setStock("exclude")
            }
          />

          <Radio
            label="Show All Products"
            checked={
              stock === "all"
            }
            onChange={() =>
              setStock("all")
            }
          />
        </div>
      </div>

      {/* ======================================================
          MOQ
      ====================================================== */}

      <div className="py-4 border-b border-line">
        <h3 className="text-[12.5px] font-bold text-ink mb-3">
          Minimum Order Qty
        </h3>

        <div className="flex flex-col gap-2.5">
          {[
            "Less than 5 Cartons",
            "5 to 10 Cartons",
            "10+ Cartons",
          ].map((label) => (
            <Checkbox
              key={label}
              label={label}
              checked={moq === label}
              onChange={() =>
                setMoq((current) =>
                  current === label
                    ? null
                    : label
                )
              }
            />
          ))}
        </div>
      </div>

      {/* ======================================================
          ADDITIONAL OPTIONS
      ====================================================== */}

      <div className="py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-ink">
            100% Organic Only
          </span>

          <Toggle
            label="100% Organic Only"
            checked={organic}
            onChange={() =>
              setOrganic(
                (value) => !value
              )
            }
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-ink">
            GST Free Packs Only
          </span>

          <Toggle
            label="GST Free Packs Only"
            checked={gstFree}
            onChange={() =>
              setGstFree(
                (value) => !value
              )
            }
          />
        </div>
      </div>

      {/* ======================================================
          APPLY
      ====================================================== */}

      <button
        type="button"
        onClick={applyFilters}
        className="
          w-full
          bg-navy
          hover:bg-navy-deep
          transition-colors
          text-white
          font-bold
          text-[13px]
          tracking-wide
          py-3
          rounded-lg
          mt-1
          focus:outline-none
          focus:ring-2
          focus:ring-navy/30
          focus:ring-offset-2
        "
      >
        APPLY FILTERS
      </button>
    </aside>
  );
}