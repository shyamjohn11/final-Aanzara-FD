"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
} from "lucide-react";

import type { Coupon as CouponType } from "@/app/data/offers";
import {
  loadStorefrontCoupons,
  writePendingCouponCode,
  type StorefrontCoupon,
} from "@/app/data/storefrontcoupons";

/* --------------------------------
 * Types
 * -------------------------------- */

type Coupon = CouponType;

interface CouponCardProps {
  coupon: Coupon;
  onApply?: (code: string) => void;
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
 * API mapping (public deals coupons)
 * -------------------------------- */

function mapStorefrontCoupon(
  coupon: StorefrontCoupon,
): Coupon {
  const isPercent = ["percent", "percentage", "%"].includes(
    coupon.discountType.trim().toLowerCase(),
  );
  const value = Number(coupon.discountValue) || 0;
  const minOrder = Number(coupon.minOrderValue) || 0;

  const discountLabel =
    value > 0
      ? isPercent
        ? `${Math.floor(value)}% off`
        : `₹${Math.floor(value).toLocaleString("en-IN")} off`
      : "Special discount";
  const minLabel =
    minOrder > 0
      ? ` on orders above ₹${Math.floor(minOrder).toLocaleString("en-IN")}`
      : "";

  const desc =
    coupon.description?.trim() ||
    `${coupon.title || coupon.code}: ${discountLabel}${minLabel}`;

  const endRaw = (coupon.endsAt ?? "").trim();
  const validity = endRaw
    ? `Valid till ${endRaw.slice(0, 10)}`
    : "Limited period offer";

  return {
    code: coupon.code,
    desc,
    validity,
  };
}

/* --------------------------------
 * Coupon Card
 * -------------------------------- */

function CouponCard({
  coupon,
  onApply,
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
          onClick={() => onApply?.(coupon.code)}
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
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const rows = await loadStorefrontCoupons(50);
        if (!cancelled) {
          setCoupons(rows.map(mapStorefrontCoupon));
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

  const handleApply = useCallback(
    (code: string) => {
      writePendingCouponCode(code);
      router.push("/cart");
    },
    [router],
  );

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
                onApply={handleApply}
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
