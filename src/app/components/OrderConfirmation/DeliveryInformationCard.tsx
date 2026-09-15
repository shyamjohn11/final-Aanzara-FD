"use client";

import { useEffect, useState } from "react";
import { DELIVERY_INFO } from "@/app/data/orderConfirmation";
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

/* --------------------------------
 * Types
 * -------------------------------- */

type DeliveryInformation =
  typeof DELIVERY_INFO;

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

/* --------------------------------
 * Safe Data
 * -------------------------------- */

function getSafeDeliveryInfo(): DeliveryInformation {
  const fallback = {
    repName: "Not available",
    shippingAddress: "Shipping address not available",
    contact: "Not available",
    deliveryWindow: "Delivery window not available",
    logisticsPartner: "Not available",
    originWarehouse: "Not available",
  } as DeliveryInformation;

  if (
    !DELIVERY_INFO ||
    typeof DELIVERY_INFO !== "object" ||
    Array.isArray(DELIVERY_INFO)
  ) {
    return fallback;
  }

  return {
    ...DELIVERY_INFO,

    repName: isValidText(DELIVERY_INFO.repName)
      ? DELIVERY_INFO.repName.trim()
      : fallback.repName,

    shippingAddress: isValidText(
      DELIVERY_INFO.shippingAddress,
    )
      ? DELIVERY_INFO.shippingAddress.trim()
      : fallback.shippingAddress,

    contact: isValidText(DELIVERY_INFO.contact)
      ? DELIVERY_INFO.contact.trim()
      : fallback.contact,

    deliveryWindow: isValidText(
      DELIVERY_INFO.deliveryWindow,
    )
      ? DELIVERY_INFO.deliveryWindow.trim()
      : fallback.deliveryWindow,

    logisticsPartner: isValidText(
      DELIVERY_INFO.logisticsPartner,
    )
      ? DELIVERY_INFO.logisticsPartner.trim()
      : fallback.logisticsPartner,

    originWarehouse: isValidText(
      DELIVERY_INFO.originWarehouse,
    )
      ? DELIVERY_INFO.originWarehouse.trim()
      : fallback.originWarehouse,
  };
}

/* --------------------------------
 * Component
 * -------------------------------- */

export default function DeliveryInformationCard({
  repName,
  shippingAddress,
  contact,
  deliveryWindow,
}: {
  repName?: string;
  shippingAddress?: string;
  contact?: string;
  deliveryWindow?: string;
} = {}) {
  const base = getSafeDeliveryInfo();

  const [live, setLive] = useState<{
    repName: string;
    shippingAddress: string;
    contact: string;
    deliveryWindow: string;
  } | null>(null);

  useEffect(() => {
    if (shippingAddress && contact) return;
    let cancelled = false;
    (async () => {
      try {
        let orderId = resolveOrderId();
        if (!orderId) {
          const res = await ordersApi.list();
          const payload: unknown = (res as { data?: unknown })?.data ?? res;
          const list: Record<string, unknown>[] = Array.isArray(payload)
            ? (payload as Record<string, unknown>[])
            : Array.isArray((payload as { items?: unknown })?.items)
              ? ((payload as { items: unknown[] }).items as Record<string, unknown>[])
              : [];
          const first = list[0];
          if (!first?.["orderId"]) return;
          orderId = String(first["orderId"]);
        }
        if (!orderId) return;
        const dRes = await ordersApi.details(orderId);
        const detail = ((dRes as { data?: unknown })?.data ??
          dRes) as {
          shippingAddress?: {
            recipientName: string;
            recipientPhone: string;
            addressLine1: string;
            addressLine2?: string | null;
            city: string;
            state: string;
            pincode: string;
          } | null;
          createdAt?: string;
        };
        if (cancelled || !detail?.shippingAddress) return;
        const a = detail.shippingAddress;
        const lines = [a.addressLine1, a.addressLine2]
          .filter((l) => typeof l === "string" && l.trim().length > 0)
          .join(", ");
        const full = `${lines}, ${a.city}, ${a.state} - ${a.pincode}`;
        const start = detail.createdAt ? new Date(detail.createdAt) : new Date();
        start.setDate(start.getDate() + 3);
        const end = new Date(start);
        end.setDate(end.getDate() + 2);
        const fmt = { day: "numeric", month: "long" } as const;
        if (cancelled) return;
        setLive({
          repName: a.recipientName || "Not available",
          shippingAddress: full,
          contact: a.recipientPhone || "Not available",
          deliveryWindow: `${start.toLocaleDateString("en-IN", fmt)}-${end.toLocaleDateString("en-IN", fmt)}, ${end.getFullYear()}`,
        });
      } catch {
        /* keep static fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shippingAddress, contact]);

  // Live order details take priority over the
  // static demo dataset.
  const delivery = {
    ...base,
    repName: repName?.trim() || live?.repName || base.repName,
    shippingAddress: shippingAddress?.trim() || live?.shippingAddress || base.shippingAddress,
    contact: contact?.trim() || live?.contact || base.contact,
    deliveryWindow: deliveryWindow?.trim() || live?.deliveryWindow || base.deliveryWindow,
  };

  return (
    <section
      className="
        bg-white
        border
        border-line
        rounded-card
        p-5
      "
      aria-labelledby="delivery-information-title"
    >
      {/* Heading */}
      <h2
        id="delivery-information-title"
        className="
          text-[14px]
          font-bold
          text-ink
          mb-4
        "
      >
        Delivery Information
      </h2>

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          gap-5
        "
      >
        {/* --------------------------------
         * Customer / Address Information
         * -------------------------------- */}

        <div>
          <div
            className="
              text-[10.5px]
              font-semibold
              text-ink-faint
              tracking-wide
            "
          >
            CUSTOMER REPRESENTATIVE
          </div>

          <div
            className="
              text-[13px]
              font-bold
              text-ink
              mt-0.5
            "
          >
            {delivery.repName}
          </div>

          <div
            className="
              text-[10.5px]
              font-semibold
              text-ink-faint
              tracking-wide
              mt-4
            "
          >
            REGISTERED SHIPPING ADDRESS
          </div>

          <p
            className="
              text-[12px]
              text-ink-soft
              mt-0.5
              leading-relaxed
            "
          >
            {delivery.shippingAddress}
          </p>

          <div
            className="
              text-[10.5px]
              font-semibold
              text-ink-faint
              tracking-wide
              mt-4
            "
          >
            CONTACT NUMBER
          </div>

          <div
            className="
              text-[12px]
              text-ink
              mt-0.5
            "
          >
            {delivery.contact}
          </div>
        </div>

        {/* --------------------------------
         * Delivery Information
         * -------------------------------- */}

        <div>
          <div
            className="
              text-[10.5px]
              font-semibold
              text-ink-faint
              tracking-wide
            "
          >
            ESTIMATED DELIVERY WINDOW
          </div>

          <div
            className="
              text-[13px]
              font-bold
              text-green-deep
              mt-0.5
            "
          >
            {delivery.deliveryWindow}
          </div>

          <div
            className="
              text-[10.5px]
              font-semibold
              text-ink-faint
              tracking-wide
              mt-4
            "
          >
            LOGISTICS PARTNER
          </div>

          <div
            className="
              text-[12px]
              text-ink-soft
              mt-0.5
            "
          >
            {delivery.logisticsPartner}
          </div>

          <div
            className="
              text-[10.5px]
              font-semibold
              text-ink-faint
              tracking-wide
              mt-4
            "
          >
            ORIGIN WAREHOUSE
          </div>

          <div
            className="
              text-[12px]
              text-ink-soft
              mt-0.5
            "
          >
            {delivery.originWarehouse}
          </div>
        </div>
      </div>
    </section>
  );
}