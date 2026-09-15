"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Copy,
  Check,
} from "lucide-react";

import type { Coupon as CouponType } from "@/app/data/offers";
import { couponsApi } from "@/app/api/services";

/* --------------------------------
 * Types
 * -------------------------------- */

type Coupon = CouponType;

interface CouponCardProps {
  coupon: Coupon;
}

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

function isValidCoupon(
  value: unknown,
): value is Coupon {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const coupon =
    value as Record<string, unknown>;

  return (
    isValidText(coupon.code) &&
    isValidText(coupon.desc) &&
    isValidText(coupon.validity)
  );
}

/* --------------------------------
 * Safe Coupon List
 * -------------------------------- */

function getSafeCoupons(
  coupons: unknown,
): Coupon[] {
  if (!Array.isArray(coupons)) {
    return [];
  }

  const usedCodes = new Set<string>();

  return (coupons as unknown[])
    .filter(isValidCoupon)
    .map((coupon) => ({
      ...coupon,
      code: coupon.code.trim(),
      desc: coupon.desc.trim(),
      validity: coupon.validity.trim(),
    }))
    .filter((coupon) => {
      const normalizedCode =
        coupon.code.toUpperCase();

      if (
        usedCodes.has(normalizedCode)
      ) {
        return false;
      }

      usedCodes.add(normalizedCode);

      return true;
    });
}

/* --------------------------------
 * API mapping (couponsApi.list)
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

function mapCouponRaw(
  raw: Record<string, unknown>,
  index: number,
): Coupon {
  const code =
    String(
      raw.code ??
        raw.couponCode ??
        raw.offerCode ??
        "",
    ).trim().toUpperCase() || `COUPON${index + 1}`;

  const name = String(
    raw.name ??
      raw.title ??
      "Coupon",
  ).trim();

  const type = String(raw.type ?? "").trim();
  const value = Number(
    raw.value ??
      raw.discount ??
      raw.discountValue ??
      0,
  );
  const minOrder = Number(
    raw.minOrder ??
      raw.minimumOrder ??
      raw.minOrderValue ??
      0,
  );

  const discountLabel =
    Number.isFinite(value) && value > 0
      ? type === "Flat"
        ? `₹${Math.floor(value).toLocaleString("en-IN")} off`
        : `${value}% off`
      : "Special discount";
  const minLabel =
    Number.isFinite(minOrder) && minOrder > 0
      ? ` on orders above ₹${Math.floor(minOrder).toLocaleString("en-IN")}`
      : "";

  const descRaw = String(
    raw.description ??
      raw.subtitle ??
      "",
  ).trim();
  const desc =
    descRaw ||
    `${name || "Coupon"}: ${discountLabel}${minLabel}`;

  const endRaw = String(
    raw.endDate ??
      raw.end ??
      raw.validTo ??
      raw.validTill ??
      "",
  ).trim();
  const validity = endRaw
    ? `Valid till ${endRaw.slice(0, 10)}`
    : String(
        raw.validity ??
          raw.validTill ??
          "Limited period offer",
      ).trim() || "Limited period offer";

  return {
    code,
    desc,
    validity,
  };
}

/* --------------------------------
 * Coupon Card
 * -------------------------------- */

function CouponCard({
  coupon,
}: CouponCardProps) {
  const [copied, setCopied] =
    useState<boolean>(false);

  const [copyError, setCopyError] =
    useState<boolean>(false);

  const handleCopy = useCallback(
    async (): Promise<void> => {
      const code =
        typeof coupon.code === "string"
          ? coupon.code.trim()
          : "";

      if (!code) {
        setCopyError(true);
        return;
      }

      try {
        if (
          !navigator.clipboard ||
          typeof navigator.clipboard
            .writeText !== "function"
        ) {
          throw new Error(
            "Clipboard API unavailable",
          );
        }

        await navigator.clipboard.writeText(
          code,
        );

        setCopied(true);
        setCopyError(false);
      } catch {
        setCopied(false);
        setCopyError(true);
      }
    },
    [coupon.code],
  );

  /* --------------------------------
   * Reset copied state
   * -------------------------------- */

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setCopied(false);
      }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  return (
    <article
      className="
        bg-white
        border
        border-dashed
        border-line
        rounded-card
        p-4
      "
    >
      {/* Coupon Code */}
      <div
        className="
          text-[13.5px]
          font-extrabold
          text-navy
          tracking-wide
        "
      >
        {coupon.code}
      </div>

      {/* Description */}
      <p
        className="
          text-[11.5px]
          text-ink-soft
          mt-1.5
          leading-relaxed
          min-h-[32px]
        "
      >
        {coupon.desc}
      </p>

      {/* Validity */}
      <div
        className="
          text-[10.5px]
          text-ink-faint
          mt-1
          mb-3
        "
      >
        {coupon.validity}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Copy */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={copied}
          aria-label={
            copied
              ? `Coupon ${coupon.code} copied`
              : `Copy coupon ${coupon.code}`
          }
          className="
            flex
            items-center
            gap-1.5
            text-[11.5px]
            font-semibold
            text-ink-soft
            hover:text-navy
            transition-colors
            disabled:cursor-default
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue
            focus-visible:ring-offset-2
            rounded
          "
        >
          {copied ? (
            <Check
              size={12}
              className="text-green"
              aria-hidden="true"
            />
          ) : (
            <Copy
              size={12}
              aria-hidden="true"
            />
          )}

          {copied
            ? "Copied"
            : "Copy Code"}
        </button>

        {/* Separator */}
        <span
          className="text-line"
          aria-hidden="true"
        >
          |
        </span>

        {/* Apply */}
        <button
          type="button"
          className="
            text-[11.5px]
            font-semibold
            text-blue
            hover:underline
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue
            focus-visible:ring-offset-2
            rounded
          "
          aria-label={`Apply coupon ${coupon.code}`}
        >
          Apply Now
        </button>
      </div>

      {/* Clipboard Error */}
      {copyError && (
        <p
          className="
            text-[10.5px]
            text-red-500
            mt-2
          "
          role="alert"
        >
          Unable to copy the coupon code.
        </p>
      )}
    </article>
  );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function AvailableCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const response = await couponsApi.list(1, 25);
        const payload: unknown =
          (response as { data?: unknown })?.data ?? response;
        const rawItems = unwrapItems(payload);
        const mapped = rawItems.map(mapCouponRaw);
        if (!cancelled) {
          setCoupons(mapped);
        }
      } catch (error) {
        console.error("Unable to load coupons:", error);
        if (!cancelled) {
          setFetchError(
            "Unable to load coupons. Please try again.",
          );
          setCoupons([]);
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

  const safeCoupons = getSafeCoupons(coupons);

  return (
    <section
      aria-labelledby="available-coupons-title"
    >
      <h2
        id="available-coupons-title"
        className="
          font-sora
          font-bold
          text-[19px]
          text-navy
          mb-4
        "
      >
        Available Coupons
      </h2>

      {fetchError && (
        <div
          className="
            mb-4
            text-[12px]
            text-red-600
          "
          role="alert"
        >
          {fetchError}
        </div>
      )}

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
            bg-white
            text-center
            text-[12px]
            text-ink-faint
            px-4
          "
          role="status"
          aria-live="polite"
        >
          Loading coupons…
        </div>
      ) : safeCoupons.length > 0 ? (
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-4
          "
        >
          {safeCoupons.map(
            (coupon) => (
              <CouponCard
                key={coupon.code}
                coupon={coupon}
              />
            ),
          )}
        </div>
      ) : (
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
            bg-white
            text-center
            text-[12px]
            text-ink-faint
            px-4
          "
          role="status"
          aria-live="polite"
        >
          No coupons available right now.
        </div>
      )}
    </section>
  );
}
