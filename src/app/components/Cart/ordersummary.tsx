// File: app/components/Dashboard/OrderSummary.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Gift,
  MapPin,
  FileText,
  X,
} from "lucide-react";

import { CartLine } from "@/app/context/cartcontext";
import {
  CART_CONFIG,
  PAYMENT_METHODS,
} from "@/app/data/cartdata";
import {
  clearPendingCouponCode,
  computeCouponDiscount,
  loadStorefrontCoupons,
  readPendingCouponCode,
  validateCouponForSubtotal,
  writePendingCouponCode,
  type StorefrontCoupon,
} from "@/app/data/storefrontcoupons";
import { addressesApi, cartApi } from "@/app/api/services";
import { extractErrorMessage, hasSession } from "@/app/api/api";
import BulkQuoteDialog from "@/app/components/BulkQuoteDialog";

// UI fallback — no backend publishes accepted-method labels.
const FALLBACK_PAYMENT_METHODS: string[] = [
  "UPI",
  "Credit / Debit Card",
  "Net Banking",
  "Cash on Delivery",
  "Wallet",
];

type DeliverTo = {
  city: string;
  region: string;
  eta: string;
};

export default function OrderSummary({
  items,
}: {
  items: CartLine[];
}) {
  const [couponApplied, setCouponApplied] =
    useState(false);

  const [couponInput, setCouponInput] =
    useState("");

  const [couponError, setCouponError] =
    useState("");

  const [appliedCouponCode, setAppliedCouponCode] =
    useState("");

  const [appliedCouponDiscount, setAppliedCouponDiscount] =
    useState(0);

  const [liveCoupons, setLiveCoupons] = useState<
    StorefrontCoupon[]
  >([]);

  const [quoteOpen, setQuoteOpen] = useState(false);

  // =====================================================
  // BASIC ITEMS VALIDATION
  // =====================================================

  const safeItems = Array.isArray(items)
    ? items.filter((line) => {
        if (!line || typeof line !== "object") {
          return false;
        }

        if (
          !line.product ||
          typeof line.product !== "object"
        ) {
          return false;
        }

        return true;
      })
    : [];

  // =====================================================
  // VALIDATE INDIVIDUAL CART LINES
  // =====================================================

  const validItems = safeItems.filter((line) => {
    const product = line.product;

    const validId =
      typeof product.id === "string" &&
      product.id.trim().length > 0;

    const qty = Number(line.qty);

    const price = Number(product.price);
    const mrp = Number(product.mrp);
    const bulkRate = Number(product.bulkRate);
    const bulkMoq = Number(product.bulkMoq);

    const validQty =
      Number.isFinite(qty) &&
      qty >= 1;

    const validPrice =
      Number.isFinite(price) &&
      price >= 0;

    const validMrp =
      Number.isFinite(mrp) &&
      mrp >= 0;

    const validBulkRate =
      Number.isFinite(bulkRate) &&
      bulkRate >= 0;

    const validBulkMoq =
      Number.isFinite(bulkMoq) &&
      bulkMoq >= 1;

    return (
      validId &&
      validQty &&
      validPrice &&
      validMrp &&
      validBulkRate &&
      validBulkMoq
    );
  });

  // =====================================================
  // SAFE CONFIG VALUES
  // =====================================================

  const safeGstRate =
    Number.isFinite(Number(CART_CONFIG?.gstRate)) &&
    Number(CART_CONFIG.gstRate) >= 0
      ? Number(CART_CONFIG.gstRate)
      : 0;

  const safeHandlingFee =
    Number.isFinite(
      Number(CART_CONFIG?.handlingFee)
    ) &&
    Number(CART_CONFIG.handlingFee) >= 0
      ? Number(CART_CONFIG.handlingFee)
      : 0;

  const safeDeliveryFree =
    CART_CONFIG?.deliveryFree === true;

  // =====================================================
  // TOTAL UNITS
  // =====================================================

  const totalUnits = validItems.reduce(
    (sum, line) => {
      const qty = Number(line.qty);

      return (
        sum +
        (Number.isFinite(qty) && qty > 0
          ? Math.floor(qty)
          : 0)
      );
    },
    0
  );

  // =====================================================
  // MRP TOTAL
  // =====================================================

  const mrpTotal = validItems.reduce(
    (sum, line) => {
      const qty = Number(line.qty);
      const mrp = Number(line.product.mrp);

      if (
        !Number.isFinite(qty) ||
        !Number.isFinite(mrp)
      ) {
        return sum;
      }

      return sum + mrp * qty;
    },
    0
  );

  // =====================================================
  // ACTUAL ITEMS TOTAL
  // BULK RATE APPLIED PER LINE
  // =====================================================

  const itemsTotal = validItems.reduce(
    (sum, line) => {
      const qty = Number(line.qty);
      const price = Number(line.product.price);
      const bulkRate = Number(
        line.product.bulkRate
      );
      const bulkMoq = Number(
        line.product.bulkMoq
      );

      if (
        !Number.isFinite(qty) ||
        !Number.isFinite(price) ||
        !Number.isFinite(bulkRate) ||
        !Number.isFinite(bulkMoq)
      ) {
        return sum;
      }

      const unitPrice =
        qty >= bulkMoq
          ? bulkRate
          : price;

      return sum + unitPrice * qty;
    },
    0
  );

  // =====================================================
  // WHOLESALE / BULK SAVINGS
  // =====================================================

  const wholesaleDiscount = Math.max(
    0,
    mrpTotal - itemsTotal
  );

  // =====================================================
  // COUPON DISCOUNT
  // =====================================================

  const couponDiscount =
    couponApplied && appliedCouponDiscount > 0
      ? Math.min(appliedCouponDiscount, itemsTotal)
      : 0;

  // =====================================================
  // SUBTOTAL
  //
  // IMPORTANT:
  // itemsTotal already contains wholesale/bulk pricing.
  // Do NOT subtract wholesaleDiscount again.
  // =====================================================

  const subtotal = Math.max(
    0,
    itemsTotal - couponDiscount
  );

  // =====================================================
  // GST
  // =====================================================

  const gst = Math.round(
    subtotal * safeGstRate
  );

  // =====================================================
  // GRAND TOTAL
  // =====================================================

  const grandTotal = Math.max(
    0,
    subtotal +
      gst +
      safeHandlingFee
  );

  // =====================================================
  // TOTAL SAVINGS
  // =====================================================

  const totalSavings =
    wholesaleDiscount +
    couponDiscount;

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (
    value: number
  ): string => {
    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return "0";
    }

    return value.toLocaleString("en-IN");
  };

  // =====================================================
  // LOAD LIVE COUPONS + AUTO-APPLY PENDING
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    loadStorefrontCoupons(50)
      .then((coupons) => {
        if (cancelled) return;
        setLiveCoupons(coupons);
      })
      .catch(() => {
        // Keep empty list — apply shows unavailable.
      });

    const pending = readPendingCouponCode();
    if (pending) {
      setCouponInput(pending);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (liveCoupons.length === 0 || !couponInput) {
      return;
    }
    if (couponApplied) return;

    const pending = readPendingCouponCode();
    const target = pending || couponInput.trim().toUpperCase();
    if (!target) return;

    const match = liveCoupons.find(
      (coupon) => coupon.code === target
    );
    if (!match) return;

    applyCouponCode(match.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCoupons, couponInput]);

  // =====================================================
  // APPLY COUPON
  // =====================================================

  const applyCouponCode = async (rawCode: string) => {
    const enteredCode = rawCode.trim().toUpperCase();
    setCouponError("");

    if (!enteredCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    const match = liveCoupons.find(
      (coupon) => coupon.code === enteredCode
    );

    if (!match) {
      setCouponApplied(false);
      setAppliedCouponCode("");
      setAppliedCouponDiscount(0);
      setCouponError(
        liveCoupons.length === 0
          ? "Coupons are currently unavailable."
          : "Invalid coupon code."
      );
      return;
    }

    const localError = validateCouponForSubtotal(
      match,
      itemsTotal
    );
    if (localError) {
      setCouponError(localError);
      return;
    }

    if (hasSession()) {
      try {
        const { data } = await cartApi.applyCoupon(
          enteredCode
        );
        const discount = Number(
          data?.discountTotal
        );
        setCouponApplied(true);
        setAppliedCouponCode(
          (data?.appliedCouponCode || enteredCode)
            .trim()
            .toUpperCase()
        );
        setAppliedCouponDiscount(
          Number.isFinite(discount) && discount > 0
            ? discount
            : computeCouponDiscount(match, itemsTotal)
        );
        setCouponInput("");
        setCouponError("");
        clearPendingCouponCode();
        return;
      } catch (error) {
        setCouponError(
          extractErrorMessage(
            error,
            "Unable to apply coupon. Please try again."
          )
        );
        return;
      }
    }

    setCouponApplied(true);
    setAppliedCouponCode(match.code);
    setAppliedCouponDiscount(
      computeCouponDiscount(match, itemsTotal)
    );
    setCouponInput("");
    setCouponError("");
    writePendingCouponCode(match.code);
  };

  const applyCoupon = () => {
    void applyCouponCode(couponInput);
  };

  // =====================================================
  // REMOVE COUPON
  // =====================================================

  const removeCoupon = () => {
    setCouponApplied(false);
    setAppliedCouponCode("");
    setAppliedCouponDiscount(0);
    setCouponInput("");
    setCouponError("");
    clearPendingCouponCode();

    if (hasSession()) {
      cartApi.removeCoupon().catch(() => {
        // Best-effort — UI already cleared.
      });
    }
  };

  // =====================================================
  // DELIVERY VALIDATION
  // Live default address when logged in; static config otherwise.
  // =====================================================

  const [liveDeliverTo, setLiveDeliverTo] =
    useState<DeliverTo | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!hasSession()) {
      return;
    }

    addressesApi
      .list()
      .then(({ data }) => {
        if (cancelled) {
          return;
        }

        const rows = Array.isArray(data)
          ? data
          : [];
        const primary =
          rows.find(
            (row) => row.isDefault
          ) ?? rows[0];

        if (primary) {
          setLiveDeliverTo({
            city: primary.city,
            region: `${primary.state} ${primary.pincode}`,
            eta: "2-4 business days",
          });
        }
      })
      .catch(() => {
        // Keep static fallback on failure.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const deliverTo =
    liveDeliverTo ??
    CART_CONFIG?.deliverTo;

  const validDelivery =
    deliverTo &&
    typeof deliverTo === "object" &&
    typeof deliverTo.city === "string" &&
    deliverTo.city.trim().length > 0 &&
    typeof deliverTo.region === "string" &&
    deliverTo.region.trim().length > 0 &&
    typeof deliverTo.eta === "string" &&
    deliverTo.eta.trim().length > 0;

  // =====================================================
  // PAYMENT METHODS VALIDATION
  // =====================================================

  const staticPaymentMethods =
    Array.isArray(PAYMENT_METHODS)
      ? PAYMENT_METHODS.filter(
          (method) =>
            typeof method === "string" &&
            method.trim().length > 0
        )
      : [];

  const validPaymentMethods =
    staticPaymentMethods.length > 0
      ? staticPaymentMethods
      : FALLBACK_PAYMENT_METHODS;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section
      aria-labelledby="order-summary-title"
      className="flex flex-col gap-5"
    >
      <div className="bg-white border border-line rounded-card p-5">

        {/* =================================================
            TITLE
        ================================================== */}

        <h2
          id="order-summary-title"
          className="font-sora font-bold text-[17px] text-ink mb-4"
        >
          Order Summary
        </h2>

        {/* =================================================
            SUMMARY ROWS
        ================================================== */}

        <div className="flex flex-col gap-2.5 text-[13px]">

          <Row
            label={`Items Total (${totalUnits} items)`}
            value={`₹${formatMoney(itemsTotal)}`}
          />

          <Row
            label="Wholesale / Bulk Discount"
            value={`-₹${formatMoney(
              wholesaleDiscount
            )}`}
            positive
          />

          {couponApplied &&
            couponDiscount > 0 && (
              <Row
                label="Coupon Discount"
                value={`-₹${formatMoney(
                  couponDiscount
                )}`}
                positive
              />
            )}

          <div
            className="h-px bg-line my-1"
            aria-hidden="true"
          />

          <Row
            label="Subtotal"
            value={`₹${formatMoney(subtotal)}`}
          />

          <Row
            label={`GST (${Math.round(
              safeGstRate * 100
            )}%)`}
            value={`₹${formatMoney(gst)}`}
          />

          <Row
            label="Delivery Charges"
            value={
              safeDeliveryFree
                ? "FREE"
                : "-"
            }
            positive={safeDeliveryFree}
          />

          <Row
            label="Handling Fee"
            value={`₹${formatMoney(
              safeHandlingFee
            )}`}
          />
        </div>

        {/* =================================================
            GRAND TOTAL
        ================================================== */}

        <div
          className="h-px bg-line my-3"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between">

          <span className="font-sora font-bold text-[17px] text-ink">
            Grand Total
          </span>

          <span className="font-sora font-bold text-[22px] text-navy">
            ₹{formatMoney(grandTotal)}
          </span>

        </div>

        {/* =================================================
            SAVINGS
        ================================================== */}

        <div className="flex items-center gap-2 bg-green/10 text-green font-semibold text-[12.5px] px-3 py-2 rounded-lg mt-3">

          <Gift
            size={15}
            aria-hidden="true"
          />

          <span>
            You save ₹
            {formatMoney(totalSavings)}
            {" "}on this order!
          </span>

        </div>

        <div
          className="h-px bg-line my-4"
          aria-hidden="true"
        />

        {/* =================================================
            COUPON
        ================================================== */}

        <div>

          <span className="text-[12.5px] font-semibold text-ink">
            Apply Corporate Promo / Coupon
          </span>

          <div className="flex items-center gap-2 mt-2">

            <input
              value={couponInput}
              onChange={(event) => {
                setCouponInput(
                  event.target.value
                );

                if (couponError) {
                  setCouponError("");
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyCoupon();
                }
              }}
              placeholder="Enter coupon code"
              maxLength={50}
              autoComplete="off"
              aria-label="Coupon code"
              aria-invalid={
                couponError
                  ? "true"
                  : "false"
              }
              className="
                flex-1
                border border-line
                rounded-lg
                px-3 py-2
                text-[13px]
                outline-none
                focus:border-navy
              "
            />

            <button
              type="button"
              onClick={applyCoupon}
              className="
                bg-navy
                hover:bg-navy-deep
                transition-colors
                text-white
                text-[13px]
                font-semibold
                px-4 py-2
                rounded-lg
              "
            >
              Apply
            </button>

          </div>

          {/* COUPON ERROR */}

          {couponError && (
            <p
              role="alert"
              className="text-[11px] text-red-600 mt-1.5"
            >
              {couponError}
            </p>
          )}

          {/* AVAILABLE COUPONS */}

          <Link
            href="/offers"
            className="inline-block text-blue text-[12.5px] font-semibold hover:underline mt-2"
          >
            View Available Coupons
          </Link>

          {/* APPLIED COUPON */}

          {couponApplied &&
            appliedCouponCode && (
              <div className="mt-2">

                <span className="inline-flex items-center gap-1.5 bg-paper border border-line text-[12px] font-semibold text-ink px-3 py-1.5 rounded-full">

                  {appliedCouponCode} applied

                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remove coupon"
                    className="flex items-center justify-center"
                  >
                    <X
                      size={12}
                      className="text-ink-faint hover:text-red-600"
                    />
                  </button>

                </span>

              </div>
            )}
        </div>

        <div
          className="h-px bg-line my-4"
          aria-hidden="true"
        />

        {/* =================================================
            DELIVERY ADDRESS
        ================================================== */}

        <div className="flex items-start gap-2.5">

          <MapPin
            size={17}
            className="text-navy shrink-0 mt-0.5"
            aria-hidden="true"
          />

          <div className="text-[12.5px] text-ink-soft flex-1">

            {validDelivery ? (
              <>
                <div className="flex items-center justify-between gap-3">

                  <span className="font-semibold text-ink">
                    Delivering to:{" "}
                    {deliverTo.city}
                  </span>

                  <button
                    type="button"
                    className="text-blue font-semibold text-[12px] hover:underline shrink-0"
                  >
                    Change
                  </button>

                </div>

                <div>
                  {deliverTo.region}
                </div>

                <div className="text-green font-medium">
                  Est. Delivery:{" "}
                  {deliverTo.eta}
                </div>
              </>
            ) : (
              <div
                role="status"
                className="text-ink-soft"
              >
                Add a delivery address at checkout.
              </div>
            )}

          </div>
        </div>

        <div
          className="h-px bg-line my-4"
          aria-hidden="true"
        />

        {/* =================================================
            PAYMENT METHODS
        ================================================== */}

        <div>

          <span className="text-[11px] font-semibold text-ink-faint tracking-wide">
            ACCEPTED PAYMENT METHODS
          </span>

          {validPaymentMethods.length > 0 ? (
            <div
              className="flex flex-wrap gap-2 mt-2"
              role="list"
            >
              {validPaymentMethods.map(
                (method, index) => (
                  <span
                    key={`${method}-${index}`}
                    role="listitem"
                    className="border border-line text-[12px] text-ink-soft px-2.5 py-1 rounded-md"
                  >
                    {method}
                  </span>
                )
              )}
            </div>
          ) : (
            <p
              role="status"
              className="text-[11px] text-ink-soft mt-2"
            >
              Payment methods are currently unavailable.
            </p>
          )}
        </div>

        {/* =================================================
            GST INVOICE
        ================================================== */}

        <div className="flex items-start gap-2.5 bg-blue/5 border border-blue/15 rounded-lg p-3 mt-4">

          <FileText
            size={16}
            className="text-blue shrink-0 mt-0.5"
            aria-hidden="true"
          />

          <div className="text-[12px] text-ink-soft">

            <span className="font-semibold text-ink block">
              Need GST Invoice?
            </span>

            <span>
              Input GSTIN at checkout to claim
              input tax credit benefits.
            </span>

            <button
              type="button"
              className="block text-blue font-semibold hover:underline mt-0.5"
            >
              Apply for Business Account
            </button>

          </div>
        </div>

        {/* =================================================
            CHECKOUT
        ================================================== */}

        {validItems.length === 0 ? (
          <button
            type="button"
            disabled
            className="
              w-full
              bg-green
              opacity-50
              cursor-not-allowed
              transition-colors
              text-white
              font-bold
              text-[14.5px]
              py-3
              rounded-lg
              mt-4
            "
          >
            Proceed to Checkout
          </button>
        ) : (
          <Link
            href="/checkout"
            className="
              block
              w-full
              text-center
              bg-green
              hover:bg-green-deep
              transition-colors
              text-white
              font-bold
              text-[14.5px]
              py-3
              rounded-lg
              mt-4
            "
          >
            Proceed to Checkout
          </Link>
        )}

        {/* =================================================
            BULK QUOTE — opens the quote request dialog,
            prefilled with the cart contents. Submissions
            land in /admin/pricing-requests.
        ================================================== */}

        <button
          type="button"
          onClick={() => setQuoteOpen(true)}
          className="
            block
            w-full
            text-center
            border border-navy
            text-navy
            font-bold
            text-[14.5px]
            py-3
            rounded-lg
            mt-3
            hover:bg-paper
            transition-colors
          "
        >
          Request Bulk Quote
        </button>

        {/* =================================================
            CONTINUE SHOPPING
        ================================================== */}

        <Link
          href="/"
          className="
            block
            w-full
            text-center
            text-navy
            font-semibold
            text-[13px]
            mt-3
            underline
          "
        >
          Continue Shopping
        </Link>

      </div>

      <BulkQuoteDialog
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        defaultProduct={
          validItems.length === 1
            ? String(validItems[0].product.name ?? "")
            : ""
        }
        defaultMessage={
          validItems.length > 1
            ? validItems
                .slice(0, 8)
                .map(
                  (line) =>
                    `- ${String(line.product.name ?? "Item")} × ${Number(line.qty) || 1}`
                )
                .join("\n")
            : ""
        }
      />
    </section>
  );
}

// =====================================================
// SUMMARY ROW
// =====================================================

function Row({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-ink-soft">
        {label}
      </span>

      <span
        className={
          positive
            ? "text-green font-semibold"
            : "text-ink font-semibold"
        }
      >
        {value}
      </span>

    </div>
  );
}