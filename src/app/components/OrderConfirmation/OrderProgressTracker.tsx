"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  ORDER_PROGRESS_STEPS,
  CURRENT_PROGRESS_INDEX,
} from "@/app/data/orderConfirmation";
import { ordersApi } from "@/app/api/services";

const FALLBACK_STEPS = [
  "Order Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const PROGRESS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 0,
  processing: 1,
  packed: 2,
  shipped: 3,
  "out for delivery": 4,
  outfordelivery: 4,
  delivered: 5,
};

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

function isValidStep(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export default function OrderProgressTracker({
  currentIndex,
}: {
  currentIndex?: number;
} = {}) {
  // Validate progress steps
  const safeSteps = Array.isArray(ORDER_PROGRESS_STEPS)
    ? ORDER_PROGRESS_STEPS
        .filter(isValidStep)
        .map((step) => step.trim())
    : [];

  const baseSteps = safeSteps.length > 0 ? safeSteps : FALLBACK_STEPS;

  // Live order status (search-param orderId or latest order) overrides
  // the static index when no explicit currentIndex prop is given.
  const [liveIndex, setLiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (typeof currentIndex === "number") return;
    let cancelled = false;
    (async () => {
      try {
        let orderId = resolveOrderId();
        if (!orderId) {
          const res = await ordersApi.list();
          const payload: unknown = (res as { data?: unknown })?.data ?? res;
          const list = Array.isArray(payload)
            ? payload
            : Array.isArray((payload as { items?: unknown })?.items)
              ? (payload as { items: unknown[] }).items
              : [];
          const first = (list[0] ?? null) as Record<string, unknown> | null;
          if (!first) return;
          const s = String(first["status"] ?? "").toLowerCase();
          if (!cancelled && s && s in PROGRESS_INDEX)
            setLiveIndex(PROGRESS_INDEX[s]);
          else if (!cancelled && first["status"]) setLiveIndex(0);
          return;
        }
        const detailRes = await ordersApi.details(orderId);
        const detail = ((detailRes as { data?: unknown })?.data ??
          detailRes) as Record<string, unknown>;
        const key = String(detail?.["status"] ?? "").toLowerCase();
        if (!cancelled && key in PROGRESS_INDEX)
          setLiveIndex(PROGRESS_INDEX[key]);
      } catch {
        /* keep static fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentIndex]);

  // Remove duplicate step names
  const usedSteps = new Set<string>();

  const validatedSteps = baseSteps.filter(isValidStep).map((s) => s.trim()).filter((step) => {
    if (usedSteps.has(step)) {
      return false;
    }

    usedSteps.add(step);
    return true;
  });

  // Validate current progress index; a live order
  // status overrides the static demo index.
  const rawProgressIndex = Number(
    typeof currentIndex === "number"
      ? currentIndex
      : liveIndex ?? CURRENT_PROGRESS_INDEX
  );

  const safeProgressIndex =
    validatedSteps.length > 0 &&
    Number.isFinite(rawProgressIndex)
      ? Math.min(
          Math.max(Math.trunc(rawProgressIndex), -1),
          validatedSteps.length - 1
        )
      : -1;

  return (
    <section
      className="
        bg-white
        border
        border-line
        rounded-card
        px-4
        sm:px-10
        py-6
        overflow-x-auto
      "
      aria-label="Order progress"
    >
      {validatedSteps.length > 0 ? (
        <div className="flex items-center min-w-[600px]">
          {validatedSteps.map((step, i) => {
            const done = i <= safeProgressIndex;
            const isLast = i === validatedSteps.length - 1;

            return (
              <div
                key={`${step}-${i}`}
                className={`
                  flex
                  items-center
                  ${isLast ? "flex-none" : "flex-1"}
                `}
              >
                {/* Step */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span
                    className={`
                      w-8
                      h-8
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-[12px]
                      font-bold
                      ${
                        done
                          ? "bg-green text-white"
                          : "bg-paper border border-line text-ink-faint"
                      }
                    `}
                    aria-current={
                      i === safeProgressIndex
                        ? "step"
                        : undefined
                    }
                  >
                    {done ? (
                      <Check
                        size={14}
                        aria-hidden="true"
                      />
                    ) : (
                      i + 1
                    )}
                  </span>

                  <span
                    className={`
                      text-[10.5px]
                      font-semibold
                      whitespace-nowrap
                      ${
                        done
                          ? "text-green-deep"
                          : "text-ink-faint"
                      }
                    `}
                  >
                    {step}
                  </span>
                </div>

                {/* Connector */}
                {!isLast && (
                  <div
                    className={`
                      h-[2px]
                      flex-1
                      mx-1.5
                      mb-4
                      ${
                        i < safeProgressIndex
                          ? "bg-green"
                          : "bg-line"
                      }
                    `}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="
            min-h-[80px]
            flex
            items-center
            justify-center
            text-[12px]
            text-ink-faint
            text-center
          "
          role="status"
        >
          Order progress is currently unavailable.
        </div>
      )}
    </section>
  );
}