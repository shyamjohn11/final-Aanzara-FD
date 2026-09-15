// File: app/components/Account/RecentInvoicesCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { ordersApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type RecentInvoice = {
  id: string;
  meta: string;
  amount: string | number;
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
 * Validate a single invoice.
 */
function isValidInvoice(
  invoice: unknown
): invoice is RecentInvoice {
  if (
    !invoice ||
    typeof invoice !== "object"
  ) {
    return false;
  }

  const item =
    invoice as Partial<RecentInvoice>;

  const id = safeText(
    item.id,
    ""
  );

  const meta = safeText(
    item.meta,
    ""
  );

  const amount =
    safeText(
      item.amount,
      ""
    );

  if (!id) {
    return false;
  }

  if (!meta) {
    return false;
  }

  if (!amount) {
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
 * Validate invoice collection.
 *
 * Duplicate invoice IDs are removed.
 */
function getValidInvoices(
  invoices: unknown
): RecentInvoice[] {
  if (!Array.isArray(invoices)) {
    return [];
  }

  const seenIds =
    new Set<string>();

  const validInvoices: RecentInvoice[] =
    [];

  for (const invoice of invoices) {
    if (!isValidInvoice(invoice)) {
      continue;
    }

    const id = safeText(
      invoice.id
    );

    const normalizedId =
      id.toLowerCase();

    if (seenIds.has(normalizedId)) {
      continue;
    }

    seenIds.add(normalizedId);

    validInvoices.push({
      id,
      meta: safeText(
        invoice.meta
      ),
      amount: invoice.amount,
    });
  }

  return validInvoices;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RecentInvoicesCard() {
  const [raw, setRaw] = useState<RecentInvoice[]>([]);
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
        const mapped: RecentInvoice[] = list.slice(0, 5).map((o) => {
          const orderNo = String(o["orderNo"] ?? o["orderId"] ?? "");
          const created = String(o["createdAt"] ?? "");
          const date = created
            ? new Date(created).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "";
          const count = o["itemCount"];
          const total = o["grandTotal"];
          return {
            id: `INV-${orderNo.replace(/^#/, "") || orderNo}`,
            meta: `${date}${count ? ` · ${String(count)} items` : ""}`,
            amount:
              typeof total === "number"
                ? `₹${total.toLocaleString("en-IN")}`
                : String(total ?? "—"),
          };
        });
        setRaw(mapped);
      } catch {
        if (!cancelled) setError("Unable to load invoices.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const invoices = getValidInvoices(raw);

  return (
    <section
      aria-labelledby="recent-invoices-title"
      className="rounded-card border border-slate-200 bg-white p-5"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="recent-invoices-title"
          className="text-[14.5px] font-semibold text-navy"
        >
          Recent Invoices
        </h2>

        <button
          type="button"
          aria-label="View all invoices"
          className="text-[12.5px] font-semibold text-blue transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-blue/20"
        >
          View All
        </button>
      </div>

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {loading && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            Loading invoices…
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            No recent invoices available.
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Your invoices will appear
            here when available.
          </p>
        </div>
      )}

      {/* =================================================
          INVOICE LIST
      ================================================= */}

      {!loading && !error && invoices.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-slate-50">
          {invoices.map(
            (invoice) => (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                {/* =====================================
                    INVOICE DETAILS
                ===================================== */}

                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-navy">
                    {invoice.id}
                  </p>

                  <p className="mt-0.5 truncate text-[11.5px] text-ink-soft">
                    {safeText(
                      invoice.meta
                    )}
                  </p>
                </div>

                {/* =====================================
                    AMOUNT + DOWNLOAD
                ===================================== */}

                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-[13px] font-semibold text-navy">
                    {safeText(
                      invoice.amount
                    )}
                  </span>

                  <button
                    type="button"
                    aria-label={`Download invoice ${invoice.id}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-blue/10 text-blue transition-colors hover:bg-blue/20 focus:outline-none focus:ring-2 focus:ring-blue/20"
                  >
                    <Download
                      size={14}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}