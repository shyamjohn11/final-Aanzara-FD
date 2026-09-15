// File: app/components/Account/RecentOrdersTable.tsx
"use client";

import { useEffect, useState } from "react";
import { ordersApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type OrderStatus =
  | "Confirmed"
  | "Shipped"
  | "Delivered";

type RecentOrder = {
  id: string;
  date: string;
  items: string | number;
  status: string;
  amount: string | number;
};

/* =========================================================
   STATUS STYLES
========================================================= */

const STATUS_STYLES: Record<
  OrderStatus,
  string
> = {
  Confirmed:
    "bg-blue/10 text-blue",

  Shipped:
    "bg-green/10 text-green",

  Delivered:
    "bg-slate-100 text-slate-500",
};

/* =========================================================
   CONSTANTS
========================================================= */

const FALLBACK_TEXT = "Not available";

/* =========================================================
   VALIDATION HELPERS
========================================================= */

/**
 * Safely convert a value to displayable text.
 */
function safeText(
  value: unknown,
  fallback = FALLBACK_TEXT
): string {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return fallback;
  }

  const text = String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

/**
 * Validate order status.
 */
function isValidStatus(
  value: unknown
): value is OrderStatus {
  return (
    value === "Confirmed" ||
    value === "Shipped" ||
    value === "Delivered"
  );
}

/**
 * Validate an individual order.
 */
function isValidOrder(
  order: unknown
): order is RecentOrder {
  if (
    !order ||
    typeof order !== "object"
  ) {
    return false;
  }

  const item =
    order as Partial<RecentOrder>;

  const id = safeText(
    item.id,
    ""
  );

  const date = safeText(
    item.date,
    ""
  );

  const items = safeText(
    item.items,
    ""
  );

  const amount = safeText(
    item.amount,
    ""
  );

  if (!id) {
    return false;
  }

  if (!date) {
    return false;
  }

  if (!items) {
    return false;
  }

  if (!amount) {
    return false;
  }

  if (!isValidStatus(item.status)) {
    return false;
  }

  if (id.length > 100) {
    return false;
  }

  if (date.length > 100) {
    return false;
  }

  if (items.length > 100) {
    return false;
  }

  if (amount.length > 100) {
    return false;
  }

  return true;
}

/**
 * Validate and clean order collection.
 *
 * Duplicate order IDs are removed.
 */
function getValidOrders(
  orders: unknown
): RecentOrder[] {
  if (!Array.isArray(orders)) {
    return [];
  }

  const seenIds =
    new Set<string>();

  const validOrders: RecentOrder[] =
    [];

  for (const order of orders) {
    if (!isValidOrder(order)) {
      continue;
    }

    const id = safeText(
      order.id
    );

    const normalizedId =
      id.toLowerCase();

    if (seenIds.has(normalizedId)) {
      continue;
    }

    seenIds.add(normalizedId);

    validOrders.push({
      id,
      date: safeText(
        order.date
      ),
      items: order.items,
      status: order.status,
      amount: order.amount,
    });
  }

  return validOrders;
}

/**
 * Get a safe status.
 */
function getSafeStatus(
  status: string
): OrderStatus {
  return isValidStatus(status)
    ? status
    : "Delivered";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RecentOrdersTable() {
  /* =======================================================
     LIVE ORDERS (ordersApi.list)
  ======================================================= */

  const [rawOrders, setRawOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await ordersApi.list();
        const payload: unknown = (res as { data?: unknown })?.data ?? res;
        const list: unknown[] = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { items?: unknown })?.items)
            ? (payload as { items: unknown[] }).items
            : [];
        if (cancelled) return;
        const mapped: RecentOrder[] = list.slice(0, 5).map((o) => {
          const item = o as Record<string, unknown>;
          const statusRaw = String(item["status"] ?? "Confirmed");
          const s = statusRaw.toLowerCase();
          const status = s.includes("ship")
            ? "Shipped"
            : s.includes("deliver")
              ? "Delivered"
              : "Confirmed";
          const created = String(item["createdAt"] ?? "");
          const date = created
            ? new Date(created).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—";
          const count = item["itemCount"];
          const total = item["grandTotal"];
          return {
            id: String(item["orderNo"] ?? item["orderId"] ?? ""),
            date,
            items:
              typeof count === "number" || typeof count === "string"
                ? `${count} items`
                : "—",
            status,
            amount:
              typeof total === "number"
                ? `₹${total.toLocaleString("en-IN")}`
                : String(total ?? "—"),
          };
        });
        setRawOrders(mapped);
      } catch {
        if (!cancelled) setError("Unable to load recent orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const orders = getValidOrders(rawOrders);

  return (
    <section
      aria-labelledby="recent-orders-title"
      className="rounded-card border border-slate-200 bg-white p-5"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="recent-orders-title"
          className="text-[14.5px] font-semibold text-navy"
        >
          Recent Orders
        </h2>

        <button
          type="button"
          aria-label="View all orders"
          className="text-[12.5px] font-semibold text-blue transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-blue/20"
        >
          View All Orders
        </button>
      </div>

      {/* =================================================
          LOADING / ERROR STATES
      ================================================= */}

      {loading && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            Loading recent orders…
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {!loading && !error && orders.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            No recent orders available.
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Your recent orders will appear
            here when available.
          </p>
        </div>
      )}

      {/* =================================================
          ORDERS TABLE
      ================================================= */}

      {!loading && !error && orders.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr className="border-b border-slate-100 text-[11.5px] uppercase tracking-wide text-ink-soft">
                <th
                  scope="col"
                  className="pb-2 font-medium"
                >
                  Order ID
                </th>

                <th
                  scope="col"
                  className="pb-2 font-medium"
                >
                  Date
                </th>

                <th
                  scope="col"
                  className="pb-2 font-medium"
                >
                  Items
                </th>

                <th
                  scope="col"
                  className="pb-2 font-medium"
                >
                  Status
                </th>

                <th
                  scope="col"
                  className="pb-2 font-medium"
                >
                  Amount
                </th>

                <th
                  scope="col"
                  className="pb-2 font-medium"
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {orders.map(
                (order) => {
                  const status =
                    getSafeStatus(
                      order.status
                    );

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-slate-50 text-[12.5px] last:border-0"
                    >
                      {/* =====================================
                          ORDER ID
                      ===================================== */}

                      <td className="py-3 pr-2 font-semibold text-navy">
                        {order.id}
                      </td>

                      {/* =====================================
                          DATE
                      ===================================== */}

                      <td className="py-3 pr-2 text-ink-soft">
                        {safeText(
                          order.date
                        )}
                      </td>

                      {/* =====================================
                          ITEMS
                      ===================================== */}

                      <td className="py-3 pr-2 text-slate-600">
                        {safeText(
                          order.items
                        )}
                      </td>

                      {/* =====================================
                          STATUS
                      ===================================== */}

                      <td className="py-3 pr-2">
                        <span
                          role="status"
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            STATUS_STYLES[
                              status
                            ]
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* =====================================
                          AMOUNT
                      ===================================== */}

                      <td className="py-3 pr-2 font-semibold text-navy">
                        {safeText(
                          order.amount
                        )}
                      </td>

                      {/* =====================================
                          ACTIONS
                      ===================================== */}

                      <td className="py-3">
                        <div className="flex gap-3 text-[12px] font-medium text-blue">
                          {/* TRACK */}

                          <button
                            type="button"
                            aria-label={`Track order ${order.id}`}
                            className="transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-blue/20"
                          >
                            Track
                          </button>

                          {/* INVOICE */}

                          <button
                            type="button"
                            aria-label={`View invoice for order ${order.id}`}
                            className="transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-blue/20"
                          >
                            Invoice
                          </button>

                          {/* REORDER */}

                          <button
                            type="button"
                            aria-label={`Reorder ${order.id}`}
                            className="transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-blue/20"
                          >
                            Reorder
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}