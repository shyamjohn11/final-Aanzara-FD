"use client";

import { useEffect, useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import type { ComboDeal as ComboDealType } from "@/app/data/offers";
import { combosApi } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

type ComboDeal = ComboDealType;

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function isValidText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function isValidComboDeal(
  value: unknown,
): value is ComboDeal {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const combo =
    value as Record<string, unknown>;

  const validSwatches =
    Array.isArray(combo.swatches) &&
    combo.swatches.length > 0 &&
    combo.swatches.every(
      (swatch) =>
        isValidText(swatch),
    );

  const validId =
    (typeof combo.id === "string" ||
      typeof combo.id === "number") &&
    String(combo.id).trim().length > 0;

  return (
    validId &&
    isValidText(combo.name) &&
    validSwatches &&
    isValidNumber(combo.comboPrice) &&
    isValidNumber(combo.retailPrice) &&
    isValidNumber(combo.savings)
  );
}

/* --------------------------------
 * Safe Combo Deals
 * -------------------------------- */

function getSafeComboDeals(
  deals: unknown,
): ComboDeal[] {
  if (!Array.isArray(deals)) {
    return [];
  }

  const usedIds = new Set<string>();

  return (deals as unknown[])
    .filter(isValidComboDeal)
    .map((combo) => ({
      ...combo,
      name: combo.name.trim(),
      swatches: combo.swatches
        .filter(isValidText)
        .map((swatch) =>
          swatch.trim(),
        ),
    }))
    .filter((combo) => {
      const id =
        String(combo.id).trim();

      if (usedIds.has(id)) {
        return false;
      }

      usedIds.add(id);

      return true;
    })
    .filter(
      (combo) =>
        combo.swatches.length > 0,
    )
    .filter(
      (combo) =>
        combo.comboPrice <=
        combo.retailPrice,
    );
}

/* --------------------------------
 * API mapping (combosApi.list)
 * -------------------------------- */

const COMBO_SWATCHES = [
  "#2563EB",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
];

function unwrapItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (payload && typeof payload === "object") {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.items)) {
      return rec.items as Record<string, unknown>[];
    }
    if (Array.isArray(rec.data)) {
      return rec.data as Record<string, unknown>[];
    }
  }
  return [];
}

function mapComboRaw(
  raw: Record<string, unknown>,
  index: number,
): ComboDeal {
  const id =
    String(
      raw.comboId ??
        raw.id ??
        raw._id ??
        `combo-${index}`,
    ).trim() || `combo-${index}`;

  const name =
    String(
      raw.name ??
        raw.title ??
        "Combo",
    ).trim() || "Combo";

  let swatches: string[] = [];
  const rawSwatches = raw.swatches ?? raw.colors ?? raw.images;
  if (Array.isArray(rawSwatches)) {
    swatches = (rawSwatches as unknown[])
      .map((s) =>
        typeof s === "string"
          ? s.trim()
          : String(
              (s as Record<string, unknown>)?.imageUrl ??
                (s as Record<string, unknown>)?.url ??
                "",
            ).trim(),
      )
      .filter((s) => s.length > 0);
  }
  if (swatches.length === 0) {
    swatches = [
      COMBO_SWATCHES[index % COMBO_SWATCHES.length],
      COMBO_SWATCHES[(index + 1) % COMBO_SWATCHES.length],
    ];
  }

  let comboPrice = Number(
    raw.comboPrice ??
      raw.price ??
      raw.offerPrice ??
      raw.salePrice ??
      0,
  );
  let retailPrice = Number(
    raw.originalPrice ??
      raw.mrp ??
      raw.totalPrice ??
      raw.retailPrice ??
      0,
  );

  if (!Number.isFinite(comboPrice) || comboPrice < 0) comboPrice = 0;
  if (!Number.isFinite(retailPrice) || retailPrice < 0) retailPrice = 0;

  if (retailPrice <= 0 && comboPrice > 0) {
    retailPrice = Math.round(comboPrice * 1.25);
  }
  if (comboPrice <= 0 && retailPrice > 0) {
    comboPrice = Math.round(retailPrice * 0.8);
  }
  if (comboPrice > retailPrice && retailPrice > 0) {
    retailPrice = comboPrice;
  }

  let savings = Number(
    raw.savings ??
      raw.discount ??
      retailPrice - comboPrice,
  );
  if (!Number.isFinite(savings) || savings < 0) {
    savings = Math.max(retailPrice - comboPrice, 0);
  }

  return {
    id,
    name,
    swatches,
    comboPrice,
    retailPrice,
    savings,
  };
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function ComboDealsSection() {
  const [combos, setCombos] = useState<ComboDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const response = await combosApi.list(1, 25);
        const payload: unknown =
          (response as { data?: unknown })?.data ?? response;
        const rawItems = unwrapItems(payload);
        const mapped = rawItems.map(mapComboRaw);
        if (!cancelled) {
          setCombos(mapped);
        }
      } catch (error) {
        console.error("Unable to load combo deals:", error);
        if (!cancelled) {
          setFetchError(
            "Unable to load combo deals. Please try again.",
          );
          setCombos([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const safeCombos =
    getSafeComboDeals(combos);

  return (
    <section
      aria-labelledby="combo-deals-title"
    >
      {/* Heading */}
      <h2
        id="combo-deals-title"
        className="
          font-sora
          font-bold
          text-[19px]
          text-navy
          text-center
        "
      >
        Combo Deals — Save More Together
      </h2>

      <p
        className="
          text-[12.5px]
          text-ink-soft
          text-center
          mt-1.5
          max-w-[520px]
          mx-auto
        "
      >
        Bundle everyday essentials and
        unlock extra savings on every
        combo pack below.
      </p>

      {fetchError && (
        <p
          className="
            text-[12px]
            text-red-600
            text-center
            mt-4
          "
          role="alert"
        >
          {fetchError}
        </p>
      )}

      {/* Combo Deals */}
      {loading ? (
        <div
          className="
            min-h-[140px]
            flex
            items-center
            justify-center
            border
            border-line
            rounded-card
            bg-white
            text-[12px]
            text-ink-faint
            text-center
            mt-6
            px-4
          "
          role="status"
          aria-live="polite"
        >
          Loading combo deals…
        </div>
      ) : safeCombos.length > 0 ? (
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-3
            gap-4
            mt-6
          "
        >
          {safeCombos.map(
            (combo) => (
              <article
                key={String(combo.id)}
                className="
                  bg-white
                  border
                  border-line
                  rounded-card
                  p-5
                  flex
                  flex-col
                "
              >
                {/* Product Swatches */}
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    mb-4
                  "
                >
                  {combo.swatches.map(
                    (
                      swatch,
                      index,
                    ) => (
                      <div
                        key={`${swatch}-${index}`}
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >
                        <div
                          className="
                            w-11
                            h-11
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            shrink-0
                          "
                          style={{
                            background:
                              `linear-gradient(160deg, ${swatch}, ${swatch}CC)`,
                          }}
                          aria-hidden="true"
                        >
                          <ShoppingBag
                            size={16}
                            className="text-white/80"
                          />
                        </div>

                        {index <
                          combo
                            .swatches
                            .length -
                            1 && (
                          <Plus
                            size={13}
                            className="
                              text-ink-faint
                              shrink-0
                            "
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>

                {/* Combo Name */}
                <h3
                  className="
                    text-[13.5px]
                    font-bold
                    text-ink
                    leading-snug
                    mb-3
                  "
                >
                  {combo.name}
                </h3>

                {/* Combo Price */}
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    text-[11.5px]
                    mb-1
                  "
                >
                  <span className="text-ink-soft">
                    Combo Price
                  </span>

                  <span
                    className="
                      font-bold
                      text-green-deep
                    "
                  >
                    ₹
                    {combo.comboPrice.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>

                {/* Retail Price */}
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    text-[11.5px]
                    mb-3
                  "
                >
                  <span className="text-ink-soft">
                    Retail Price
                  </span>

                  <span
                    className="
                      text-ink-faint
                      line-through
                    "
                  >
                    ₹
                    {combo.retailPrice.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>

                {/* Savings */}
                <span
                  className="
                    inline-flex
                    w-fit
                    items-center
                    bg-green/10
                    text-green-deep
                    text-[11px]
                    font-bold
                    px-2.5
                    py-1
                    rounded-md
                    mb-4
                  "
                >
                  You Save ₹
                  {combo.savings.toLocaleString(
                    "en-IN",
                  )}
                </span>

                {/* CTA */}
                <button
                  type="button"
                  className="
                    mt-auto
                    bg-green
                    hover:bg-green-deep
                    transition-colors
                    text-white
                    text-[12px]
                    font-bold
                    py-2.5
                    rounded-lg
                    cursor-pointer
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-green
                    focus-visible:ring-offset-2
                  "
                  aria-label={`Add ${combo.name} to cart`}
                >
                  Add Combo to Cart
                </button>
              </article>
            ),
          )}
        </div>
      ) : (
        /* Empty State */
        <div
          className="
            min-h-[140px]
            flex
            items-center
            justify-center
            border
            border-dashed
            border-line
            rounded-card
            bg-white
            text-[12px]
            text-ink-faint
            text-center
            mt-6
            px-4
          "
          role="status"
          aria-live="polite"
        >
          No combo deals are available
          right now.
        </div>
      )}
    </section>
  );
}
