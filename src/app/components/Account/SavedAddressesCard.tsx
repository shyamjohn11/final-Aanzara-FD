// File: app/components/Account/SavedAddressesCard.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  CheckCircle2,
} from "lucide-react";

import { addressesApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type SavedAddress = {
  label: string;
  lines: string[];
  primary?: boolean;
};

/* =========================================================
   CONSTANTS
========================================================= */

const FALLBACK_LABEL =
  "Address";

const MAX_LABEL_LENGTH = 80;
const MAX_LINE_LENGTH = 200;
const MAX_ADDRESS_LINES = 10;

/* =========================================================
   VALIDATION HELPERS
========================================================= */

/**
 * Safely normalize text.
 */
function safeText(
  value: unknown,
  fallback = ""
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const text = value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

/**
 * Validate an individual address.
 */
function isValidAddress(
  address: unknown
): address is SavedAddress {
  if (
    !address ||
    typeof address !== "object"
  ) {
    return false;
  }

  const item =
    address as Partial<SavedAddress>;

  const label = safeText(
    item.label
  );

  if (!label) {
    return false;
  }

  if (
    label.length >
    MAX_LABEL_LENGTH
  ) {
    return false;
  }

  if (
    !Array.isArray(item.lines)
  ) {
    return false;
  }

  if (
    item.lines.length === 0 ||
    item.lines.length >
      MAX_ADDRESS_LINES
  ) {
    return false;
  }

  const validLines =
    item.lines.filter(
      (line) =>
        typeof line ===
          "string" &&
        safeText(line).length >
          0 &&
        safeText(line).length <=
          MAX_LINE_LENGTH
    );

  if (
    validLines.length === 0
  ) {
    return false;
  }

  return true;
}

/**
 * Validate and clean address list.
 *
 * Duplicate labels are removed.
 */
function getValidAddresses(
  addresses: unknown
): SavedAddress[] {
  if (!Array.isArray(addresses)) {
    return [];
  }

  const seenLabels =
    new Set<string>();

  const validAddresses: SavedAddress[] =
    [];

  for (const address of addresses) {
    if (!isValidAddress(address)) {
      continue;
    }

    const label =
      safeText(
        address.label,
        FALLBACK_LABEL
      );

    const normalizedLabel =
      label.toLowerCase();

    if (
      seenLabels.has(
        normalizedLabel
      )
    ) {
      continue;
    }

    seenLabels.add(
      normalizedLabel
    );

    const lines =
      address.lines
        .filter(
          (line) =>
            typeof line ===
              "string"
        )
        .map((line) =>
          safeText(line)
        )
        .filter(
          (line) =>
            line.length > 0 &&
            line.length <=
              MAX_LINE_LENGTH
        )
        .slice(
          0,
          MAX_ADDRESS_LINES
        );

    if (lines.length === 0) {
      continue;
    }

    validAddresses.push({
      label,
      lines,
      primary:
        address.primary === true,
    });
  }

  return validAddresses;
}

/**
 * Ensure only one address is marked primary.
 *
 * The first primary address is retained.
 */
function normalizePrimaryAddress(
  addresses: SavedAddress[]
): SavedAddress[] {
  let primaryFound = false;

  return addresses.map(
    (address) => {
      if (
        address.primary &&
        !primaryFound
      ) {
        primaryFound = true;

        return address;
      }

      return {
        ...address,
        primary: false,
      };
    }
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function SavedAddressesCard() {
  const [raw, setRaw] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await addressesApi.list();
        const payload: unknown = (res as { data?: unknown })?.data ?? res;
        const list: Record<string, unknown>[] = (
          Array.isArray(payload) ? payload : []
        ) as Record<string, unknown>[];
        if (cancelled) return;
        const mapped: SavedAddress[] = list.map((a) => {
          const label = String(a["label"] ?? "Address");
          const line1 = String(a["addressLine1"] ?? "");
          const line2 = a["addressLine2"]
            ? String(a["addressLine2"])
            : "";
          const cityLine = [a["city"], a["state"], a["pincode"]]
            .filter((p) => p && String(p).trim().length > 0)
            .map((p) => String(p))
            .join(", ");
          const lines = [line1, line2, cityLine].filter(
            (l) => l.trim().length > 0
          );
          return {
            label,
            lines: lines.length > 0 ? lines : ["Address unavailable"],
            primary: a["isDefault"] === true,
          };
        });
        setRaw(mapped);
      } catch {
        if (!cancelled) setError("Unable to load saved addresses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addresses = normalizePrimaryAddress(getValidAddresses(raw));

  return (
    <section
      aria-labelledby="saved-addresses-title"
      className="rounded-card border border-slate-200 bg-white p-5"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="saved-addresses-title"
          className="text-[14.5px] font-semibold text-navy"
        >
          Saved Shipping Addresses
        </h2>

        {/* ADD ADDRESS */}

        <button
          type="button"
          aria-label="Add a new shipping address"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-blue px-3 py-1.5 text-[12px] font-semibold text-blue transition-colors hover:bg-blue/5 focus:outline-none focus:ring-2 focus:ring-blue/20"
        >
          <Plus
            size={13}
            aria-hidden="true"
          />

          <span>
            Add New Address
          </span>
        </button>
      </div>

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {loading && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            Loading saved addresses…
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && addresses.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            No saved shipping addresses
            available.
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Add an address to make
            checkout faster.
          </p>
        </div>
      )}

      {/* =================================================
          ADDRESS GRID
      ================================================= */}

      {!loading && !error && addresses.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {addresses.map(
            (address) => (
              <article
                key={address.label}
                className="rounded-lg border border-slate-100 p-3.5"
              >
                {/* =====================================
                    ADDRESS HEADER
                ===================================== */}

                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`min-w-0 truncate text-[13px] font-semibold ${
                      address.primary
                        ? "text-blue"
                        : "text-navy"
                    }`}
                  >
                    {address.label}
                  </p>

                  {address.primary && (
                    <CheckCircle2
                      size={15}
                      className="shrink-0 text-blue"
                      aria-label="Primary address"
                    />
                  )}
                </div>

                {/* =====================================
                    ADDRESS LINES
                ===================================== */}

                <address className="mt-1.5 not-italic text-[12px] leading-relaxed text-ink-soft">
                  {address.lines.map(
                    (
                      line,
                      index
                    ) => (
                      <p
                        key={`${address.label}-${index}`}
                        className="break-words"
                      >
                        {line}
                      </p>
                    )
                  )}
                </address>

                {/* =====================================
                    ACTIONS
                ===================================== */}

                <div className="mt-2.5 flex gap-3 text-[12px] font-medium text-blue">
                  {/* EDIT */}

                  <button
                    type="button"
                    aria-label={`Edit ${address.label} address`}
                    className="transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-blue/20"
                  >
                    Edit
                  </button>

                  {/* DELETE */}

                  <button
                    type="button"
                    aria-label={`Delete ${address.label} address`}
                    className="transition-colors hover:text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-200"
                  >
                    Delete
                  </button>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}