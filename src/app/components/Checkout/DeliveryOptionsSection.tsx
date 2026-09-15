"use client";

// VERIFIED: no customer-facing backend endpoint publishes delivery
// options. warehousesApi (#50-54), inventoryApi (#55-60) and
// settingsApi (#143-144) are admin-only (Bearer + admin role) and
// unsuitable for anonymous checkout shoppers, so this section keeps
// its validated static options with an enabled empty-state.

import { useState } from "react";
import { DELIVERY_OPTIONS } from "@/app/data/checkout";

// =====================================================
// TYPES
// =====================================================

export type DeliveryOption = {
  id: string | number;
  name: string;
  partner: string;
  detail: string;
  price: string;
  free?: boolean;
};

type DeliveryOptionsSectionProps = {
  onChange?: (option: DeliveryOption) => void;
};

// UI catalogue — no customer-facing backend publishes delivery options
// (warehouses/inventory/settings are admin-only), so fall back to
// standard options when the backend-fed list is empty.
const FALLBACK_DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: "standard",
    name: "Standard Delivery",
    partner: "Aanzara Logistics",
    detail: "Delivery in 3-5 business days",
    price: "FREE",
    free: true,
  },
  {
    id: "express",
    name: "Express Delivery",
    partner: "Aanzara Express",
    detail: "Delivery in 1-2 business days",
    price: "₹99",
    free: false,
  },
  {
    id: "bulk",
    name: "Bulk Freight",
    partner: "Aanzara Freight",
    detail: "For large wholesale consignments",
    price: "Calculated at dispatch",
    free: false,
  },
];

// =====================================================
// VALIDATION HELPERS
// =====================================================

function isValidId(value: unknown): boolean {
  return (
    (typeof value === "string" &&
      value.trim().length > 0) ||
    (typeof value === "number" &&
      Number.isFinite(value))
  );
}

function isValidText(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidPrice(value: unknown): boolean {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return false;
  }

  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return false;
  }

  const numericValue =
    typeof value === "number"
      ? value
      : Number(value.trim());

  return (
    Number.isFinite(numericValue) &&
    numericValue >= 0
  );
}

// =====================================================
// VALID DELIVERY OPTION
// =====================================================

function isValidDeliveryOption(
  option: unknown
): option is DeliveryOption {
  if (
    !option ||
    typeof option !== "object"
  ) {
    return false;
  }

  const item =
    option as Partial<DeliveryOption>;

  return (
    isValidId(item.id) &&
    isValidText(item.name) &&
    isValidText(item.partner) &&
    isValidText(item.detail) &&
    isValidPrice(item.price) &&
    (item.free === undefined ||
      typeof item.free === "boolean")
  );
}

// =====================================================
// COMPONENT
// =====================================================

export default function DeliveryOptionsSection({
  onChange,
}: DeliveryOptionsSectionProps) {
  // ===================================================
  // FULL DATA VALIDATION
  // ===================================================

  const staticOptions: DeliveryOption[] =
    Array.isArray(DELIVERY_OPTIONS)
      ? DELIVERY_OPTIONS.filter(
          isValidDeliveryOption
        )
      : [];

  const validOptions: DeliveryOption[] =
    staticOptions.length > 0
      ? staticOptions
      : FALLBACK_DELIVERY_OPTIONS.filter(
          isValidDeliveryOption
        );

  // ===================================================
  // INITIAL SELECTED OPTION
  // ===================================================

  const initialOption =
    validOptions.length > 0
      ? validOptions[0]
      : null;

  const [selected, setSelected] =
    useState<string | number | null>(
      initialOption?.id ?? null
    );

  // ===================================================
  // SELECT VALIDATION
  // ===================================================

  const handleSelect = (
    id: string | number
  ) => {
    // -----------------------------------------------
    // Validate ID
    // -----------------------------------------------

    if (!isValidId(id)) {
      console.error(
        "Invalid delivery option ID:",
        id
      );
      return;
    }

    // -----------------------------------------------
    // Find selected option
    // -----------------------------------------------

    const selectedOption =
      validOptions.find(
        (option) =>
          option.id === id
      );

    // -----------------------------------------------
    // Option does not exist
    // -----------------------------------------------

    if (!selectedOption) {
      console.error(
        "Invalid delivery option:",
        id
      );
      return;
    }

    // -----------------------------------------------
    // Update local state
    // -----------------------------------------------

    setSelected(selectedOption.id);

    // -----------------------------------------------
    // Send selected option to parent
    // -----------------------------------------------

    onChange?.(selectedOption);
  };

  // ===================================================
  // EMPTY STATE
  // ===================================================

  if (validOptions.length === 0) {
    return (
      <section
        aria-labelledby="delivery-options-title"
        className="bg-white border border-line rounded-card p-5"
      >
        {/* HEADER */}

        <div className="flex items-center gap-2.5 mb-4">
          <span
            className="w-6 h-6 rounded-full bg-navy text-white text-[12px] font-bold flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            2
          </span>

          <h2
            id="delivery-options-title"
            className="text-[14.5px] font-bold text-ink"
          >
            Delivery Options
          </h2>
        </div>

        {/* EMPTY MESSAGE */}

        <div
          role="status"
          className="border border-line rounded-lg p-4 text-center text-[11.5px] text-ink-soft"
        >
          No delivery options are currently available.
        </div>
      </section>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section
      aria-labelledby="delivery-options-title"
      className="bg-white border border-line rounded-card p-5"
    >
      {/* =================================================
          HEADER
      ================================================== */}

      <div className="flex items-center gap-2.5 mb-4">
        <span
          className="w-6 h-6 rounded-full bg-navy text-white text-[12px] font-bold flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          2
        </span>

        <h2
          id="delivery-options-title"
          className="text-[14.5px] font-bold text-ink"
        >
          Delivery Options
        </h2>
      </div>

      {/* =================================================
          DELIVERY OPTIONS
      ================================================== */}

      <div
        className="flex flex-col gap-2.5"
        role="radiogroup"
        aria-label="Delivery options"
      >
        {validOptions.map(
          (opt, index) => {
            const isSelected =
              selected === opt.id;

            const safeName =
              opt.name.trim();

            const safePartner =
              opt.partner.trim();

            const safeDetail =
              opt.detail.trim();

            const safePrice =
              String(opt.price).trim();

            const isFree =
              opt.free === true;

            return (
              <button
                key={`${String(
                  opt.id
                )}-${index}`}
                type="button"
                role="radio"
                aria-checked={
                  isSelected
                }
                onClick={() =>
                  handleSelect(
                    opt.id
                  )
                }
                className={`
                  flex
                  items-center
                  justify-between
                  gap-3
                  border
                  rounded-lg
                  px-4
                  py-3
                  text-left
                  transition-colors
                  ${
                    isSelected
                      ? "border-navy bg-blue/5"
                      : "border-line hover:border-navy/40"
                  }
                `}
              >
                {/* =========================================
                    LEFT SIDE
                ========================================== */}

                <div className="flex items-center gap-3 min-w-0">

                  {/* RADIO */}

                  <span
                    className={`
                      w-4
                      h-4
                      rounded-full
                      border-2
                      flex
                      items-center
                      justify-center
                      shrink-0
                      ${
                        isSelected
                          ? "border-navy"
                          : "border-line"
                      }
                    `}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-navy" />
                    )}
                  </span>

                  {/* DETAILS */}

                  <div className="min-w-0">

                    <div className="flex items-center gap-2 flex-wrap">

                      {/* OPTION NAME */}

                      <span className="text-[12.5px] font-bold text-ink">
                        {safeName}
                      </span>

                      {/* PARTNER */}

                      <span className="text-[9.5px] font-semibold text-blue bg-blue/10 px-1.5 py-0.5 rounded-md">
                        {safePartner}
                      </span>

                    </div>

                    {/* DETAIL */}

                    <p className="text-[11px] text-ink-soft mt-0.5">
                      {safeDetail}
                    </p>

                  </div>
                </div>

                {/* =========================================
                    PRICE
                ========================================== */}

                <span
                  className={`
                    text-[11.5px]
                    font-bold
                    shrink-0
                    ${
                      isFree
                        ? "text-green-deep"
                        : "text-ink"
                    }
                  `}
                >
                  {isFree
                    ? "FREE"
                    : safePrice}
                </span>
              </button>
            );
          }
        )}
      </div>
    </section>
  );
}