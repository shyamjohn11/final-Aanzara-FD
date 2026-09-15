"use client";

import { Check } from "lucide-react";
import {
  CHECKOUT_STEPS,
  CURRENT_STEP_INDEX,
} from "@/app/data/checkout";

// UI stepper labels — no backend publishes these, so fall back to the
// standard checkout flow when the backend-fed list is empty.
const FALLBACK_STEPS = [
  "Cart",
  "Delivery Address",
  "Payment",
  "Review",
  "Confirmation",
];

export default function CheckoutSteps() {
  // =====================================================
  // FULL DATA VALIDATION
  // =====================================================

  const staticSteps = Array.isArray(
    CHECKOUT_STEPS
  )
    ? CHECKOUT_STEPS.filter(
        (step): step is string =>
          typeof step === "string" &&
          step.trim().length > 0
      )
    : [];

  const validSteps =
    staticSteps.length > 0
      ? staticSteps
      : FALLBACK_STEPS;

  // =====================================================
  // CURRENT STEP VALIDATION
  // =====================================================

  const rawStepIndex =
    typeof CURRENT_STEP_INDEX === "number"
      ? CURRENT_STEP_INDEX
      : Number(CURRENT_STEP_INDEX);

  const validStepIndex =
    Number.isInteger(rawStepIndex) &&
    rawStepIndex >= 0 &&
    rawStepIndex < validSteps.length
      ? rawStepIndex
      : 0;

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (validSteps.length === 0) {
    return (
      <div
        role="status"
        className="
          max-w-[640px]
          mx-auto
          text-center
          text-[12px]
          text-ink-soft
          py-3
        "
      >
        Checkout steps are currently unavailable.
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <nav
      aria-label="Checkout progress"
      className="
        flex
        items-center
        justify-between
        max-w-[640px]
        mx-auto
        w-full
      "
    >
      {validSteps.map(
        (step, index) => {
          const done =
            index < validStepIndex;

          const active =
            index === validStepIndex;

          return (
            <div
              key={`${step}-${index}`}
              className="
                flex
                items-center
                flex-1
                last:flex-none
                min-w-0
              "
            >
              {/* =================================================
                  STEP
              ================================================== */}

              <div className="flex flex-col items-center gap-1.5 shrink-0">

                {/* STEP NUMBER / CHECK */}

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
                    shrink-0
                    ${
                      done
                        ? "bg-green text-white"
                        : active
                          ? "bg-navy text-white"
                          : "bg-paper border border-line text-ink-faint"
                    }
                  `}
                  aria-current={
                    active
                      ? "step"
                      : undefined
                  }
                  aria-label={
                    done
                      ? `${step} completed`
                      : active
                        ? `${step} current step`
                        : `${step} upcoming step`
                  }
                >
                  {done ? (
                    <Check
                      size={14}
                      aria-hidden="true"
                    />
                  ) : (
                    index + 1
                  )}
                </span>

                {/* STEP LABEL */}

                <span
                  className={`
                    text-[11px]
                    font-semibold
                    whitespace-nowrap
                    ${
                      active
                        ? "text-navy"
                        : done
                          ? "text-green-deep"
                          : "text-ink-faint"
                    }
                  `}
                >
                  {step}
                </span>
              </div>

              {/* =================================================
                  CONNECTOR
              ================================================== */}

              {index <
                validSteps.length - 1 && (
                <div
                  className={`
                    h-[2px]
                    flex-1
                    mx-2
                    mb-4
                    min-w-[10px]
                    ${
                      done
                        ? "bg-green"
                        : "bg-line"
                    }
                  `}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        }
      )}
    </nav>
  );
}