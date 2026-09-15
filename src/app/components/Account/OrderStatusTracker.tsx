// File: app/components/Account/OrderStatusTracker.tsx
"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { ordersApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type OrderStepState =
  | "done"
  | "pending";

type OrderStep = {
  label: string;
  time: string;
  state: OrderStepState;
};

type CurrentOrder = {
  id: string;
  expected: string;
  steps: OrderStep[];
};

/* =========================================================
   CONSTANTS
========================================================= */

const FALLBACK_TEXT = "—";
const FALLBACK_ORDER_ID = "Order unavailable";

/* =========================================================
   VALIDATION HELPERS
========================================================= */

/**
 * Safely convert values to displayable text.
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
 * Validate order step state.
 */
function isValidStepState(
  value: unknown
): value is OrderStepState {
  return (
    value === "done" ||
    value === "pending"
  );
}

/**
 * Validate an individual order step.
 */
function isValidOrderStep(
  step: unknown
): step is OrderStep {
  if (
    !step ||
    typeof step !== "object"
  ) {
    return false;
  }

  const item =
    step as Partial<OrderStep>;

  const label = safeText(
    item.label,
    ""
  );

  const time = safeText(
    item.time,
    ""
  );

  if (!label) {
    return false;
  }

  if (!time) {
    return false;
  }

  if (
    !isValidStepState(
      item.state
    )
  ) {
    return false;
  }

  if (label.length > 100) {
    return false;
  }

  if (time.length > 100) {
    return false;
  }

  return true;
}

/**
 * Validate and clean order steps.
 *
 * Duplicate step labels are removed.
 */
function getValidSteps(
  steps: unknown
): OrderStep[] {
  if (!Array.isArray(steps)) {
    return [];
  }

  const seenLabels =
    new Set<string>();

  const validSteps: OrderStep[] =
    [];

  for (const step of steps) {
    if (!isValidOrderStep(step)) {
      continue;
    }

    const label = safeText(
      step.label
    );

    const key =
      label.toLowerCase();

    if (seenLabels.has(key)) {
      continue;
    }

    seenLabels.add(key);

    validSteps.push({
      label,
      time: safeText(step.time),
      state: step.state,
    });
  }

  return validSteps;
}

/**
 * Validate the complete order.
 */
function getSafeCurrentOrder(
  order: unknown
): CurrentOrder {
  if (
    !order ||
    typeof order !== "object"
  ) {
    return {
      id: FALLBACK_ORDER_ID,
      expected: FALLBACK_TEXT,
      steps: [],
    };
  }

  const data =
    order as Partial<CurrentOrder>;

  return {
    id:
      safeText(
        data.id,
        FALLBACK_ORDER_ID
      ),

    expected:
      safeText(
        data.expected,
        FALLBACK_TEXT
      ),

    steps:
      getValidSteps(
        data.steps
      ),
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function OrderStatusTracker() {
  /* =======================================================
     LIVE ORDER (ordersApi.list pick latest + details for steps)
  ======================================================= */

  const [rawOrder, setRawOrder] = useState<unknown>(null);
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
        const list: Record<string, unknown>[] = (
          Array.isArray(payload)
            ? payload
            : Array.isArray((payload as { items?: unknown })?.items)
              ? (payload as { items: unknown[] }).items
              : []
        ) as Record<string, unknown>[];
        if (cancelled) return;
        const latest = list[0];
        if (!latest) {
          setRawOrder(null);
          return;
        }
        const orderId = String(
          latest["orderId"] ?? latest["id"] ?? ""
        );
        const orderNo = String(
          latest["orderNo"] ?? latest["orderNumber"] ?? orderId
        );
        let steps: OrderStep[] = [];
        let expected = "—";
        try {
          if (orderId) {
            const detailRes = await ordersApi.details(orderId);
            const detail = (
              (detailRes as { data?: unknown })?.data ?? detailRes
            ) as Record<string, unknown>;
            const history = Array.isArray(detail?.["statusHistory"])
              ? (detail["statusHistory"] as Record<string, unknown>[])
              : [];
            steps = history.map((h) => ({
              label: String(h["status"] ?? "Update"),
              time: h["changedAt"]
                ? new Date(String(h["changedAt"])).toLocaleDateString(
                    "en-IN",
                    { day: "numeric", month: "short" }
                  )
                : "—",
              state: "done" as const,
            }));
            if (detail?.["createdAt"]) {
              const d = new Date(String(detail["createdAt"]));
              d.setDate(d.getDate() + 5);
              expected = d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
            }
          }
        } catch {
          steps = [];
        }
        if (cancelled) return;
        if (steps.length === 0) {
          const s = String(latest["status"] ?? "Confirmed").toLowerCase();
          const idx = s.includes("deliver")
            ? 3
            : s.includes("ship")
              ? 2
              : s.includes("process") || s.includes("pack")
                ? 1
                : 0;
          const labels = ["Confirmed", "Packed", "Shipped", "Delivered"];
          steps = labels.map((label, i) => ({
            label,
            time: i <= idx ? "Done" : "Pending",
            state: (i <= idx ? "done" : "pending") as OrderStepState,
          }));
          if (expected === "—") expected = "Within 5 days";
        }
        setRawOrder({ id: `#${orderNo}`, expected, steps });
      } catch {
        if (!cancelled) setError("Unable to load order status.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const order = getSafeCurrentOrder(rawOrder);

  return (
    <section
      aria-labelledby="current-order-status-title"
      className="rounded-card border border-slate-200 bg-white p-5"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="current-order-status-title"
          className="text-[14.5px] font-semibold text-navy"
        >
          Current Order Status{" "}
          <span className="ml-1 font-normal text-blue">
            {order.id}
          </span>
        </h2>

        <p className="text-[12.5px] text-ink-soft">
          Expected Delivery:{" "}
          <span className="font-semibold text-green">
            {order.expected}
          </span>
        </p>
      </div>

      {/* =================================================
          LOADING / ERROR
      ================================================= */}

      {loading && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            Loading order status…
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* =================================================
          NO STEPS
      ================================================= */}

      {!loading && !error && order.steps.length === 0 && (
        <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            Order tracking information is
            currently unavailable.
          </p>
        </div>
      )}

      {/* =================================================
          ORDER STEPS
      ================================================= */}

      {!loading && !error && order.steps.length > 0 && (
        <div
          className="mt-6 flex items-start"
          aria-label="Order progress"
        >
          {order.steps.map(
            (step, index) => {
              const isDone =
                step.state ===
                "done";

              const isLast =
                index ===
                order.steps.length -
                  1;

              return (
                <div
                  key={`${step.label}-${index}`}
                  className="flex min-w-0 flex-1 items-start"
                >
                  {/* =====================================
                      STEP
                  ===================================== */}

                  <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                    {/* STATUS ICON */}

                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                        isDone
                          ? "border-green bg-green text-white"
                          : "border-slate-200 bg-slate-50 text-slate-300"
                      }`}
                      aria-label={
                        isDone
                          ? `${step.label} completed`
                          : `${step.label} pending`
                      }
                    >
                      {isDone ? (
                        <Check
                          size={15}
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className="h-2 w-2 rounded-full bg-slate-300"
                          aria-hidden="true"
                        />
                      )}
                    </span>

                    {/* STEP LABEL */}

                    <span
                      className={`break-words text-[12px] font-semibold ${
                        isDone
                          ? "text-navy"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>

                    {/* STEP TIME */}

                    <span className="break-words text-[10.5px] text-ink-soft">
                      {step.time}
                    </span>
                  </div>

                  {/* =====================================
                      CONNECTOR
                  ===================================== */}

                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className={`mt-4 h-[2px] min-w-[12px] flex-1 ${
                        isDone
                          ? "bg-green"
                          : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}