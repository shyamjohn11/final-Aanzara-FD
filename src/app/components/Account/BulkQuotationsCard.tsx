"use client";

import { useEffect, useState } from "react";
import { quotesApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type QuoteStatus =
  | "Pending"
  | "Approved"
  | "Closed";

type BulkQuotation = {
  id: string;
  status: string;
  meta: string;
};

/* =========================================================
   STATUS STYLES
========================================================= */

const STATUS_STYLES: Record<
  QuoteStatus,
  string
> = {
  Pending:
    "bg-amber-100 text-amber-600",

  Approved:
    "bg-green-100 text-green-600",

  Closed:
    "bg-slate-100 text-slate-500",
};

/* =========================================================
   FALLBACK STATUS
========================================================= */

const FALLBACK_STATUS: QuoteStatus =
  "Closed";

/* =========================================================
   VALIDATION HELPERS
========================================================= */

/**
 * Normalize text safely.
 */
function normalizeText(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Validate quotation status.
 */
function isValidStatus(
  value: unknown
): value is QuoteStatus {
  return (
    value === "Pending" ||
    value === "Approved" ||
    value === "Closed"
  );
}

/**
 * Validate quotation.
 */
function isValidQuotation(
  quote: unknown
): quote is BulkQuotation {
  if (
    !quote ||
    typeof quote !== "object"
  ) {
    return false;
  }

  const quotation =
    quote as Partial<BulkQuotation>;

  const id = normalizeText(
    quotation.id
  );

  const meta = normalizeText(
    quotation.meta
  );

  if (!id) {
    return false;
  }

  if (!meta) {
    return false;
  }

  if (!isValidStatus(quotation.status)) {
    return false;
  }

  if (id.length > 100) {
    return false;
  }

  if (meta.length > 250) {
    return false;
  }

  return true;
}

/**
 * Validate and clean quotation list.
 *
 * Duplicate quotation IDs are removed.
 */
function getValidQuotations(
  quotations: unknown
): BulkQuotation[] {
  if (!Array.isArray(quotations)) {
    return [];
  }

  const seenIds = new Set<string>();

  const validQuotations: BulkQuotation[] =
    [];

  for (const quote of quotations) {
    if (!isValidQuotation(quote)) {
      continue;
    }

    const id = normalizeText(
      quote.id
    );

    const normalizedId =
      id.toLowerCase();

    if (seenIds.has(normalizedId)) {
      continue;
    }

    seenIds.add(normalizedId);

    validQuotations.push({
      id,
      meta: normalizeText(
        quote.meta
      ),
      status: quote.status,
    });
  }

  return validQuotations;
}

/**
 * Get safe status.
 */
function getSafeStatus(
  status: string
): QuoteStatus {
  return isValidStatus(status)
    ? status
    : FALLBACK_STATUS;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function BulkQuotationsCard() {
  const [raw, setRaw] = useState<BulkQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res: unknown = await quotesApi.list(1, 10);
        const payload: unknown = (res as { data?: unknown })?.data ?? res;
        const list: Record<string, unknown>[] = (
          Array.isArray(payload)
            ? payload
            : Array.isArray((payload as { items?: unknown })?.items)
              ? (payload as { items: unknown[] }).items
              : []
        ) as Record<string, unknown>[];
        if (cancelled) return;
        const mapped: BulkQuotation[] = list.map((q, i) => {
          const s = String(q["status"] ?? "Pending").toLowerCase();
          const status = s.includes("approv") || s.includes("accept")
            ? "Approved"
            : s.includes("clos") || s.includes("reject") || s.includes("expir")
              ? "Closed"
              : "Pending";
          const id = String(
            q["quoteNo"] ?? q["quoteNumber"] ?? q["id"] ?? q["quoteId"] ?? `QT-${i + 1}`
          );
          const product = String(
            q["product"] ?? q["productName"] ?? q["title"] ?? "Bulk request"
          );
          const qty = q["quantity"] ?? q["qty"];
          return {
            id,
            status,
            meta: qty ? `${product} · Qty ${String(qty)}` : product,
          };
        });
        setRaw(mapped);
      } catch {
        if (!cancelled) setError("Unable to load quotations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const quotations = getValidQuotations(raw);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      aria-labelledby="bulk-quotations-title"
      className="rounded-card border border-slate-200 bg-white p-5"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="bulk-quotations-title"
          className="text-[14.5px] font-semibold text-navy"
        >
          Bulk Quotations
        </h2>

        <button
          type="button"
          aria-label="Request a custom bulk quotation"
          className="text-[12.5px] font-semibold text-blue transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-blue/20"
        >
          Request Custom Quote
        </button>
      </div>

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {loading && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            Loading quotations…
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && quotations.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            No bulk quotations available.
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Your quotation requests will
            appear here.
          </p>
        </div>
      )}

      {/* =================================================
          QUOTATIONS
      ================================================= */}

      {!loading && !error && quotations.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-slate-50">
          {quotations.map(
            (quote) => {
              const status =
                getSafeStatus(
                  quote.status
                );

              return (
                <li
                  key={quote.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  {/* =====================================
                      QUOTE DETAILS
                  ===================================== */}

                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-navy">
                      {quote.id}
                    </p>

                    <p className="mt-0.5 truncate text-[11.5px] text-ink-soft">
                      {quote.meta}
                    </p>
                  </div>

                  {/* =====================================
                      STATUS + VIEW
                  ===================================== */}

                  <div className="flex shrink-0 items-center gap-3">
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

                    <button
                      type="button"
                      aria-label={`View quotation ${quote.id}`}
                      className="text-[12px] font-medium text-blue transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-blue/20"
                    >
                      View
                    </button>
                  </div>
                </li>
              );
            }
          )}
        </ul>
      )}
    </section>
  );
}