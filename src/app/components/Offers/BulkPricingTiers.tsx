"use client";

import { useEffect, useState } from "react";
import type { BulkTier as BulkTierType } from "@/app/data/offers";
import { dealsApi } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

type BulkTier = BulkTierType;

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

function isValidBulkTier(
  value: unknown,
): value is BulkTier {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const tier =
    value as Record<string, unknown>;

  return (
    isValidText(tier.units) &&
    isValidText(tier.rate) &&
    (tier.label === undefined ||
      tier.label === null ||
      isValidText(tier.label)) &&
    typeof tier.highlighted ===
      "boolean"
  );
}

/* --------------------------------
 * Safe Bulk Tiers
 * -------------------------------- */

function getSafeBulkTiers(
  tiers: unknown,
): BulkTier[] {
  if (!Array.isArray(tiers)) {
    return [];
  }

  const usedUnits = new Set<string>();

  return (tiers as unknown[])
    .filter(isValidBulkTier)
    .map((tier) => ({
      ...tier,
      units: tier.units.trim(),
      rate: tier.rate.trim(),
      label:
        isValidText(tier.label)
          ? tier.label.trim()
          : tier.label,
    }))
    .filter((tier) => {
      const normalizedUnits =
        tier.units.toLowerCase();

      if (
        usedUnits.has(normalizedUnits)
      ) {
        return false;
      }

      usedUnits.add(normalizedUnits);

      return true;
    });
}

/* --------------------------------
 * API mapping (dealsApi.cartRules + dealsApi.bulkTiers — public)
 * -------------------------------- */

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

function mapCartRuleToTier(
  raw: Record<string, unknown>,
  index: number,
): BulkTier {
  const units =
    String(
      raw.condition ??
        raw.conditionValue ??
        raw.rule ??
        raw.name ??
        raw.title ??
        `Tier ${index + 1}`,
    ).trim() || `Tier ${index + 1}`;

  const discountRaw = String(
    raw.discount ??
      raw.benefit ??
      raw.value ??
      "",
  ).trim();
  const rate = discountRaw || "Special Rate";

  const labelRaw = String(
    raw.type ??
      raw.label ??
      "",
  ).trim();

  return {
    units,
    rate,
    label: labelRaw || undefined,
    highlighted: index === 1,
  };
}

function mapWholesaleToTier(
  raw: Record<string, unknown>,
  index: number,
): BulkTier {
  const minQty = Number(
    raw.minQty ??
      raw.min_qty ??
      raw.minimumQty ??
      0,
  );
  const maxQty = Number(
    raw.maxQty ??
      raw.max_qty ??
      raw.maximumQty ??
      0,
  );
  const wholesalePrice = Number(
    raw.wholesalePrice ??
      raw.wholesale_price ??
      raw.price ??
      0,
  );

  const units =
    Number.isFinite(minQty) && minQty > 0
      ? Number.isFinite(maxQty) && maxQty > minQty
        ? `${Math.floor(minQty)}-${Math.floor(maxQty)} units`
        : `${Math.floor(minQty)}+ units`
      : String(
          raw.product ??
            raw.productName ??
            raw.category ??
            `Tier ${index + 1}`,
        ).trim() || `Tier ${index + 1}`;

  const rate =
    Number.isFinite(wholesalePrice) && wholesalePrice > 0
      ? `₹${Math.floor(wholesalePrice).toLocaleString("en-IN")}`
      : String(raw.discount ?? raw.rate ?? "Special Rate").trim() ||
        "Special Rate";

  const labelRaw = String(
    raw.customerType ??
      raw.customer_type ??
      raw.category ??
      "",
  ).trim();

  return {
    units,
    rate,
    label: labelRaw || undefined,
    highlighted: index === 1,
  };
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function BulkPricingTiers() {
  const [tiers, setTiers] = useState<BulkTier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        // Public storefront sources (active only, no auth required).
        // Network/CORS failures are swallowed — shelf shows empty state
        // instead of a red error so the offer page stays usable.
        let mapped: BulkTier[] = [];
        try {
          const rulesResponse = await dealsApi.cartRules(25);
          const rulesPayload: unknown =
            (rulesResponse as { data?: unknown })?.data ?? rulesResponse;
          const ruleItems = unwrapItems(rulesPayload);
          mapped = ruleItems.map(mapCartRuleToTier);
        } catch {
          mapped = [];
        }

        if (mapped.length === 0) {
          try {
            const wholesaleResponse = await dealsApi.bulkTiers(25);
            const wholesalePayload: unknown =
              (wholesaleResponse as { data?: unknown })?.data ??
              wholesaleResponse;
            const wholesaleItems = unwrapItems(wholesalePayload);
            mapped = wholesaleItems.map(mapWholesaleToTier);
          } catch {
            // keep mapped as-is (empty) on wholesale failure
          }
        }

        if (!cancelled) {
          setTiers(mapped);
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

  const safeTiers =
    getSafeBulkTiers(tiers);

  return (
    <section
      aria-labelledby="bulk-pricing-title"
      className="
        bg-white
        border
        border-line
        rounded-card
        px-6
        sm:px-10
        py-9
      "
    >
      {/* Heading */}
      <h2
        id="bulk-pricing-title"
        className="
          font-sora
          font-bold
          text-[19px]
          text-navy
          text-center
        "
      >
        Save More with Bulk Orders
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
        Unlock higher margins for your
        business as your order volume
        grows.
      </p>

      {/* Pricing Tiers */}
      {loading ? (
        <div
          className="
            min-h-[120px]
            flex
            items-center
            justify-center
            border
            border-line
            rounded-card
            bg-paper
            text-[12px]
            text-ink-faint
            text-center
            mt-7
            px-4
          "
          role="status"
          aria-live="polite"
        >
          Loading bulk pricing…
        </div>
      ) : safeTiers.length > 0 ? (
        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-4
            mt-7
          "
        >
          {safeTiers.map(
            (tier, index) => {
              const isHighlighted =
                tier.highlighted === true;

              return (
                <div
                  key={`${tier.units}-${index}`}
                  className={`
                    rounded-card
                    p-5
                    text-center
                    border
                    ${
                      isHighlighted
                        ? "bg-navy border-navy text-white"
                        : "bg-paper border-line text-ink"
                    }
                  `}
                >
                  {/* Optional Label */}
                  {isValidText(
                    tier.label,
                  ) && (
                    <span
                      className={`
                        inline-block
                        text-[10px]
                        font-bold
                        px-2
                        py-0.5
                        rounded-md
                        mb-2
                        ${
                          isHighlighted
                            ? "bg-green text-white"
                            : "bg-blue/10 text-blue"
                        }
                      `}
                    >
                      {tier.label.trim()}
                    </span>
                  )}

                  {/* Units */}
                  <div
                    className={`
                      text-[13px]
                      font-semibold
                      ${
                        isHighlighted
                          ? "text-white/80"
                          : "text-ink-soft"
                      }
                    `}
                  >
                    {tier.units}
                  </div>

                  {/* Rate */}
                  <div
                    className={`
                      font-sora
                      font-extrabold
                      text-[22px]
                      mt-1
                      ${
                        isHighlighted
                          ? "text-white"
                          : "text-navy"
                      }
                    `}
                  >
                    {tier.rate}
                  </div>
                </div>
              );
            },
          )}
        </div>
      ) : (
        /* Empty State */
        <div
          className="
            min-h-[120px]
            flex
            items-center
            justify-center
            border
            border-dashed
            border-line
            rounded-card
            bg-paper
            text-[12px]
            text-ink-faint
            text-center
            mt-7
            px-4
          "
          role="status"
          aria-live="polite"
        >
          Bulk pricing tiers are
          currently unavailable.
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-center mt-7">
        <button
          type="button"
          className="
            bg-green
            hover:bg-green-deep
            transition-colors
            text-white
            text-[13px]
            font-bold
            px-6
            py-3
            rounded-lg
            cursor-pointer
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-green
            focus-visible:ring-offset-2
          "
        >
          Request Wholesale Pricing
        </button>
      </div>
    </section>
  );
}
