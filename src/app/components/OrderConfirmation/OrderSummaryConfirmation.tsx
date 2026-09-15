"use client";

import { useEffect, useState } from "react";
import { PartyPopper, ChevronRight } from "lucide-react";

type Product = {
  id: string | number;
  name: string;
  price?: number;
  mrp?: number;
  bulkMoq?: number;
  bulkRate?: number;
  swatch?: string;
  image?: string;
  sku?: string;
};

type CartLine = {
  product: Product;
  qty: number;
};

type OrderSummary = {
  totalUnits: number;
  mrpTotal: number;
  itemsTotal: number;
  wholesaleDiscount: number;
  couponDiscount: number;
  couponCode: string;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  shipping: number;
  handlingFee: number;
  grandTotal: number;
  totalSavings: number;
};

type SavedOrder = {
  items: CartLine[];
  summary: OrderSummary;
  createdAt: string;
};

/* =========================
   VALIDATION HELPERS
========================= */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidProduct(value: unknown): value is Product {
  if (!isObject(value)) return false;

  return (
    (typeof value.id === "string" ||
      typeof value.id === "number") &&
    typeof value.name === "string"
  );
}

function isValidCartLine(value: unknown): value is CartLine {
  if (!isObject(value)) return false;

  return (
    isValidProduct(value.product) &&
    typeof value.qty === "number" &&
    Number.isFinite(value.qty) &&
    value.qty > 0
  );
}

function isValidOrderSummary(
  value: unknown
): value is OrderSummary {
  if (!isObject(value)) return false;

  const numericFields = [
    "totalUnits",
    "mrpTotal",
    "itemsTotal",
    "wholesaleDiscount",
    "couponDiscount",
    "subtotal",
    "gstRate",
    "gstAmount",
    "shipping",
    "handlingFee",
    "grandTotal",
    "totalSavings",
  ] as const;

  const numbersValid = numericFields.every(
    (field) =>
      typeof value[field] === "number" &&
      Number.isFinite(value[field] as number)
  );

  return (
    numbersValid &&
    typeof value.couponCode === "string"
  );
}

function isValidSavedOrder(
  value: unknown
): value is SavedOrder {
  if (!isObject(value)) return false;

  return (
    Array.isArray(value.items) &&
    value.items.every(isValidCartLine) &&
    isValidOrderSummary(value.summary) &&
    typeof value.createdAt === "string"
  );
}

function formatCurrency(value: number): string {
  return `₹${Math.max(0, value).toLocaleString("en-IN")}`;
}

/* =========================
   MAIN COMPONENT
========================= */

export default function OrderSummaryConfirmation() {
  const [order, setOrder] = useState<SavedOrder | null>(
    null
  );
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lastOrder");

      if (!saved) {
        return;
      }

      const parsed: unknown = JSON.parse(saved);

      if (isValidSavedOrder(parsed)) {
        setOrder(parsed);
      } else {
        console.warn(
          "Invalid lastOrder data found in localStorage."
        );
      }
    } catch (error) {
      console.error(
        "Unable to load last order:",
        error
      );
    }
  }, []);

  /* =========================
     NO ORDER
  ========================= */

  if (!order) {
    return (
      <div className="bg-white border border-line rounded-card p-5">
        <h2 className="text-[15px] font-bold text-ink">
          Order Summary
        </h2>

        <p className="text-[12px] text-ink-soft mt-3">
          No order information found.
        </p>
      </div>
    );
  }

  const items = order.items;
  const summary = order.summary;

  /* =========================
     ITEMS
  ========================= */

  const visibleItems = showAll
    ? items
    : items.slice(0, 3);

  const moreItems = Math.max(
    0,
    items.length - 3
  );

  return (
    <div className="bg-white border border-line rounded-card p-5">
      {/* TITLE */}

      <h2 className="text-[14px] font-bold text-ink mb-4">
        Order Summary ({summary.totalUnits} items)
      </h2>

      {/* PRODUCTS */}

      <div className="flex flex-col gap-3 mb-3">
        {visibleItems.map((item, index) => {
          const product = item.product;

          const qty = Math.max(
            1,
            Math.floor(item.qty)
          );

          const normalPrice = Math.max(
            0,
            Number(product.price ?? 0)
          );

          const bulkMoq =
            typeof product.bulkMoq === "number" &&
            Number.isFinite(product.bulkMoq) &&
            product.bulkMoq > 0
              ? product.bulkMoq
              : Infinity;

          const bulkRate =
            typeof product.bulkRate === "number" &&
            Number.isFinite(product.bulkRate) &&
            product.bulkRate >= 0
              ? product.bulkRate
              : normalPrice;

          /*
           * Same bulk pricing logic as cart.
           */
          const unitPrice =
            qty >= bulkMoq
              ? bulkRate
              : normalPrice;

          const lineTotal =
            unitPrice * qty;

          return (
            <div
              key={`${product.id}-${index}`}
              className="flex items-center gap-3"
            >
              {/* PRODUCT IMAGE */}

              <div
                className="w-11 h-11 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
                style={{
                  background:
                    product.swatch || "#f3e5bd",
                }}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div
                    className="w-6 h-8 rounded-md"
                    style={{
                      background:
                        product.swatch ||
                        "#e5b93f",
                    }}
                  />
                )}
              </div>

              {/* PRODUCT DETAILS */}

              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-ink leading-snug">
                  {product.name}
                </div>

                <div className="text-[10.5px] text-ink-faint">
                  {product.sku
                    ? `${product.sku} • `
                    : ""}
                  Qty: {qty}
                </div>
              </div>

              {/* LINE TOTAL */}

              <span className="text-[13px] font-bold text-ink shrink-0">
                {formatCurrency(lineTotal)}
              </span>
            </div>
          );
        })}
      </div>

      {/* MORE ITEMS */}

      {moreItems > 0 && (
        <button
          type="button"
          onClick={() =>
            setShowAll((previous) => !previous)
          }
          className="flex items-center gap-1 text-[11.5px] font-semibold text-blue hover:underline mb-4"
          aria-expanded={showAll}
        >
          {showAll
            ? "Show less"
            : `+${moreItems} More Item${
                moreItems > 1 ? "s" : ""
              } in this Dispatch`}

          <ChevronRight
            size={12}
            className={
              showAll ? "rotate-90 transition-transform" : ""
            }
          />
        </button>
      )}

      {/* PRICE DETAILS */}

      <div className="border-t border-line pt-3 flex flex-col gap-2.5">
        <Row
          label="Subtotal (Items Total)"
          value={formatCurrency(
            summary.itemsTotal
          )}
        />

        {summary.wholesaleDiscount > 0 && (
          <Row
            label="Enterprise Wholesale Discount"
            value={`-${formatCurrency(
              summary.wholesaleDiscount
            )}`}
            positive
          />
        )}

        {summary.couponDiscount > 0 && (
          <div className="flex items-center justify-between gap-4 text-[12.5px]">
            <span className="flex items-center gap-1.5 text-ink-soft min-w-0">
              <span>Promo Code Discount</span>

              {summary.couponCode && (
                <span className="text-[9.5px] font-bold text-blue bg-blue/10 px-1.5 py-0.5 rounded-md shrink-0">
                  {summary.couponCode}
                </span>
              )}
            </span>

            <span className="font-semibold text-green-deep shrink-0">
              -{formatCurrency(
                summary.couponDiscount
              )}
            </span>
          </div>
        )}

        <Row
          label={`GST (Integrated Tax at ${summary.gstRate}%)`}
          value={formatCurrency(
            summary.gstAmount
          )}
        />

        <Row
          label="Bulk Cargo Shipping"
          value={
            summary.shipping === 0
              ? "FREE"
              : formatCurrency(summary.shipping)
          }
          positive={summary.shipping === 0}
        />

        <Row
          label="FMCG Safe Handling Fee"
          value={formatCurrency(
            summary.handlingFee
          )}
        />
      </div>

      {/* GRAND TOTAL */}

      <div className="border-t border-line my-4" />

      <div className="flex items-center justify-between gap-4">
        <span className="text-[14px] font-bold text-ink">
          Grand Invoice Total
        </span>

        <span className="text-[18px] font-extrabold text-navy shrink-0">
          {formatCurrency(summary.grandTotal)}
        </span>
      </div>

      {/* SAVINGS */}

      {summary.totalSavings > 0 && (
        <div className="flex items-start gap-2 bg-green/10 text-green-deep text-[11.5px] font-semibold rounded-lg px-3 py-2.5 mt-4">
          <PartyPopper
            size={14}
            className="shrink-0 mt-0.5"
          />

          <span>
            Congratulations! You saved a total of{" "}
            {formatCurrency(summary.totalSavings)}{" "}
            on this wholesale transaction.
          </span>
        </div>
      )}
    </div>
  );
}

/* =========================
   ROW COMPONENT
========================= */

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
    <div className="flex items-center justify-between gap-4 text-[12.5px]">
      <span className="text-ink-soft min-w-0">
        {label}
      </span>

      <span
        className={
          positive
            ? "font-semibold text-green-deep shrink-0"
            : "font-semibold text-ink shrink-0"
        }
      >
        {value}
      </span>
    </div>
  );
}