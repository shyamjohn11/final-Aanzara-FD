"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { ORDER_INFO } from "@/app/data/orderConfirmation";
import { ordersApi } from "@/app/api/services";

function resolveOrderId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const q =
      params.get("orderId") ?? params.get("order") ?? params.get("orderNo");
    if (q && q.trim().length > 0) return q.trim();
    const raw = localStorage.getItem("lastOrder");
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const id = (parsed as Record<string, unknown>)["orderId"];
        if (typeof id === "string" && id.trim().length > 0) return id.trim();
      }
    }
  } catch {
    return null;
  }
  return null;
}

function unwrapList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const p = payload as { items?: unknown };
    if (Array.isArray(p.items)) return p.items as Record<string, unknown>[];
  }
  return [];
}

/* --------------------------------
 * Types
 * -------------------------------- */

type PillColor = "green" | "blue";

interface InfoItemProps {
  label: string;
  value: string;
  blue?: boolean;
  pill?: PillColor;
}

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function isValidText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

/* --------------------------------
 * Safe Order Info
 * -------------------------------- */

function getSafeOrderInfo() {
  const fallback = {
    orderNumber: "N/A",
    orderDate: "N/A",
    payment: "N/A",
    invoice: "N/A",
    status: "N/A",
  };

  if (
    !ORDER_INFO ||
    typeof ORDER_INFO !== "object" ||
    Array.isArray(ORDER_INFO)
  ) {
    return fallback;
  }

  return {
    orderNumber: isValidText(ORDER_INFO.orderNumber)
      ? ORDER_INFO.orderNumber.trim()
      : fallback.orderNumber,

    orderDate: isValidText(ORDER_INFO.orderDate)
      ? ORDER_INFO.orderDate.trim()
      : fallback.orderDate,

    payment: isValidText(ORDER_INFO.payment)
      ? ORDER_INFO.payment.trim()
      : fallback.payment,

    invoice: isValidText(ORDER_INFO.invoice)
      ? ORDER_INFO.invoice.trim()
      : fallback.invoice,

    status: isValidText(ORDER_INFO.status)
      ? ORDER_INFO.status.trim()
      : fallback.status,
  };
}

/* --------------------------------
 * Info Item
 * -------------------------------- */

function InfoItem({
  label,
  value,
  blue = false,
  pill,
}: InfoItemProps) {
  const safeLabel = isValidText(label)
    ? label.trim()
    : "Information";

  const safeValue = isValidText(value)
    ? value.trim()
    : "N/A";

  return (
    <div className="text-left min-w-0">
      <div className="text-[10.5px] text-ink-faint">
        {safeLabel}
      </div>

      {pill ? (
        <span
          className={`
            inline-block
            text-[11px]
            font-bold
            px-2
            py-0.5
            rounded-md
            mt-0.5
            ${
              pill === "green"
                ? "bg-green/10 text-green-deep"
                : "bg-blue/10 text-blue"
            }
          `}
        >
          {safeValue}
        </span>
      ) : (
        <div
          className={`
            text-[12.5px]
            font-bold
            mt-0.5
            break-words
            ${
              blue
                ? "text-blue"
                : "text-ink"
            }
          `}
        >
          {safeValue}
        </div>
      )}
    </div>
  );
}

/* --------------------------------
 * Main Component
 * -------------------------------- */

export default function OrderConfirmedBanner({
  orderInfo,
}: {
  orderInfo?: Partial<{
    orderNumber: string;
    orderDate: string;
    payment: string;
    invoice: string;
    status: string;
  }>;
} = {}) {
  const staticOrderInfo = getSafeOrderInfo();

  const [liveInfo, setLiveInfo] = useState<{
    orderNumber: string;
    orderDate: string;
    payment: string;
    invoice: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (orderInfo?.orderNumber) return;
    let cancelled = false;
    (async () => {
      try {
        let orderId = resolveOrderId();
        let detail: Record<string, unknown> | null = null;
        if (!orderId) {
          const res = await ordersApi.list();
          const payload: unknown = (res as { data?: unknown })?.data ?? res;
          const list = unwrapList(payload);
          const first = list[0];
          if (!first) return;
          orderId = String(first["orderId"] ?? "");
          detail = first;
          if (orderId) {
            try {
              const dRes = await ordersApi.details(orderId);
              detail = ((dRes as { data?: unknown })?.data ??
                dRes) as Record<string, unknown>;
            } catch {
              /* keep summary */
            }
          }
        } else {
          const dRes = await ordersApi.details(orderId);
          detail = ((dRes as { data?: unknown })?.data ??
            dRes) as Record<string, unknown>;
        }
        if (cancelled || !detail) return;
        const created = String(detail["createdAt"] ?? "");
        const date = created
          ? new Date(created).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
        const payment = detail["payment"] as Record<string, unknown> | undefined;
        setLiveInfo({
          orderNumber: `#${String(detail["orderNo"] ?? orderId ?? "N/A")}`,
          orderDate: date,
          payment: String(payment?.["status"] ?? detail["paymentStatus"] ?? "Pending"),
          invoice: "Generated",
          status: String(detail["status"] ?? "Confirmed"),
        });
      } catch {
        /* keep static fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderInfo?.orderNumber]);

  // Live order details take priority over the
  // static demo dataset.
  const safeOrderInfo = {
    orderNumber:
      orderInfo?.orderNumber || liveInfo?.orderNumber || staticOrderInfo.orderNumber,
    orderDate:
      orderInfo?.orderDate || liveInfo?.orderDate || staticOrderInfo.orderDate,
    payment: orderInfo?.payment || liveInfo?.payment || staticOrderInfo.payment,
    invoice: orderInfo?.invoice || liveInfo?.invoice || staticOrderInfo.invoice,
    status: orderInfo?.status || liveInfo?.status || staticOrderInfo.status,
  };

  return (
    <section
      className="text-center"
      aria-labelledby="order-confirmed-title"
    >
      {/* Success Icon */}

      <span
        className="
          inline-flex
          w-14
          h-14
          rounded-full
          bg-green/15
          items-center
          justify-center
          mb-4
        "
        aria-hidden="true"
      >
        <span
          className="
            w-9
            h-9
            rounded-full
            bg-green
            text-white
            flex
            items-center
            justify-center
          "
        >
          <Check
            size={18}
            strokeWidth={3}
          />
        </span>
      </span>

      {/* Heading */}

      <h1
        id="order-confirmed-title"
        className="
          font-sora
          font-extrabold
          text-navy
          text-[24px]
          sm:text-[28px]
        "
      >
        Order Confirmed Successfully
      </h1>

      {/* Description */}

      <p
        className="
          text-[13px]
          text-ink-soft
          mt-2
          max-w-[480px]
          mx-auto
          leading-relaxed
        "
      >
        Thank you for shopping with Aanzara. Your order has
        been received and is now being processed by our
        fulfilment division.
      </p>

      {/* Order Information */}

      <div
        className="
          inline-flex
          flex-wrap
          items-center
          justify-center
          gap-x-8
          gap-y-3
          bg-white
          border
          border-line
          rounded-card
          px-8
          py-4
          mt-6
        "
      >
        <InfoItem
          label="Order Number"
          value={safeOrderInfo.orderNumber}
          blue
        />

        <InfoItem
          label="Order Date"
          value={safeOrderInfo.orderDate}
        />

        <InfoItem
          label="Payment"
          value={safeOrderInfo.payment}
          pill="green"
        />

        <InfoItem
          label="Invoice"
          value={safeOrderInfo.invoice}
          pill="blue"
        />

        <InfoItem
          label="Status"
          value={safeOrderInfo.status}
          pill="blue"
        />
      </div>
    </section>
  );
}