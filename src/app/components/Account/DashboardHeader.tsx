"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Truck,
  PiggyBank,
  User,
} from "lucide-react";

import { authApi, ordersApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type StatIconKey =
  | "package"
  | "truck"
  | "piggy"
  | "user";

type StatNoteTone =
  | "positive"
  | string;

/* =========================================================
   ICON MAP
========================================================= */

const ICONS: Record<
  StatIconKey,
  typeof Package
> = {
  package: Package,
  truck: Truck,
  piggy: PiggyBank,
  user: User,
};

/* =========================================================
   VALIDATION HELPERS
========================================================= */

/**
 * Safely convert a value into display text.
 */
function safeText(
  value: unknown,
  fallback = "—"
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
 * Safely validate customer data.
 */
function getSafeCustomer(source: unknown) {
  const customer =
    source &&
    typeof source === "object"
      ? source as {
          name?: unknown;
          enterprise?: unknown;
          tier?: unknown;
          email?: unknown;
        }
      : null;

  return {
    name: safeText(
      customer?.name,
      "Customer"
    ),

    enterprise: safeText(
      customer?.enterprise,
      "Enterprise"
    ),

    tier: safeText(
      customer?.tier,
      "Standard"
    ),
  };
}

/**
 * Validate stat icon key.
 */
function isValidIconKey(
  value: unknown
): value is StatIconKey {
  return (
    value === "package" ||
    value === "truck" ||
    value === "piggy" ||
    value === "user"
  );
}

/**
 * Validate a stat item.
 */
function isValidStat(
  stat: unknown
): boolean {
  if (
    !stat ||
    typeof stat !== "object"
  ) {
    return false;
  }

  const item = stat as {
    label?: unknown;
    value?: unknown;
    note?: unknown;
    noteTone?: unknown;
    icon?: unknown;
  };

  const label = safeText(
    item.label,
    ""
  );

  const value = safeText(
    item.value,
    ""
  );

  const note = safeText(
    item.note,
    ""
  );

  if (!label) {
    return false;
  }

  if (!value) {
    return false;
  }

  if (!note) {
    return false;
  }

  if (
    !isValidIconKey(
      item.icon
    )
  ) {
    return false;
  }

  return true;
}

/**
 * Validate and remove duplicate stats.
 */
function getSafeStats(source: unknown) {
  if (!Array.isArray(source)) {
    return [];
  }

  const seen = new Set<string>();

  return source.filter(
    isValidStat
  ).filter((stat) => {
    const label =
      safeText(
        (stat as {
          label?: unknown;
        }).label,
        ""
      );

    const key =
      label.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

/* =========================================================
   COMPONENT
========================================================= */

export default function DashboardHeader() {
  const [customerSource, setCustomerSource] = useState<unknown>(null);
  const [rawStats, setRawStats] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await authApi.me();
        const me = (meRes as { data?: unknown })?.data ?? meRes;
        if (!cancelled) {
          const m = me as Record<string, unknown>;
          setCustomerSource({
            name: m["name"],
            enterprise: m["email"] ?? "Enterprise",
            tier:
              Array.isArray(m["roles"]) && (m["roles"] as unknown[]).length > 0
                ? String((m["roles"] as unknown[])[0])
                : "Standard",
          });
        }
      } catch {
        if (!cancelled)
          setCustomerSource({ name: "Customer", enterprise: "Enterprise", tier: "Standard" });
      }
      try {
        const res = await ordersApi.list();
        const payload: unknown = (res as { data?: unknown })?.data ?? res;
        const list: Record<string, unknown>[] = (
          Array.isArray(payload)
            ? payload
            : Array.isArray((payload as { items?: unknown })?.items)
              ? (payload as { items: unknown[] }).items
              : []
        ) as Record<string, unknown>[];
        if (!cancelled) {
          const total = list.length;
          const delivered = list.filter((o) =>
            String(o["status"] ?? "").toLowerCase().includes("deliver")
          ).length;
          const pending = list.filter((o) => {
            const s = String(o["status"] ?? "").toLowerCase();
            return !s.includes("deliver") && !s.includes("cancel");
          }).length;
          const spent = list.reduce(
            (sum, o) =>
              sum +
              (typeof o["grandTotal"] === "number"
                ? (o["grandTotal"] as number)
                : Number(o["grandTotal"] ?? 0) || 0),
            0
          );
          setRawStats([
            { label: "Total Orders", value: String(total), note: `${delivered} delivered`, noteTone: "positive", icon: "package" },
            { label: "Pending Orders", value: String(pending), note: "Awaiting fulfilment", noteTone: "", icon: "truck" },
            { label: "Total Spent", value: `₹${spent.toLocaleString("en-IN")}`, note: "Lifetime value", noteTone: "positive", icon: "piggy" },
            { label: "Account", value: delivered > 0 ? "Active" : "New", note: `${total} orders placed`, noteTone: "", icon: "user" },
          ]);
        }
      } catch {
        if (!cancelled) setRawStats([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const customer = getSafeCustomer(customerSource);

  const stats = getSafeStats(rawStats);

  return (
    <section
      aria-labelledby="dashboard-title"
      className="flex flex-col gap-5"
    >
      {/* =================================================
          EYEBROW + TITLE
      ================================================= */}

      <div>
        <p className="text-[11.5px] font-semibold uppercase tracking-wide text-blue">
          Enterprise Dashboard
        </p>

        <h1
          id="dashboard-title"
          className="font-sora text-[26px] font-extrabold text-navy sm:text-[30px]"
        >
          Customer Dashboard
        </h1>

        <p className="mt-1 text-[13.5px] text-ink-soft">
          Welcome back,{" "}
          <span className="font-semibold text-navy">
            {customer.name}
          </span>

          {" · "}

          <span className="text-blue">
            {customer.enterprise} (
            {customer.tier})
          </span>
        </p>
      </div>

      {/* =================================================
          STAT CARDS
      ================================================= */}

      {loading ? (
        <div className="rounded-card border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            Loading dashboard…
          </p>
        </div>
      ) : stats.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          aria-label="Dashboard statistics"
        >
          {stats.map((stat) => {
            const item =
              stat as {
                label: string;
                value: unknown;
                note: string;
                noteTone?: unknown;
                icon: StatIconKey;
              };

            const Icon =
              ICONS[item.icon];

            const label =
              safeText(
                item.label
              );

            const value =
              safeText(
                item.value
              );

            const note =
              safeText(
                item.note
              );

            const isPositive =
              item.noteTone ===
              "positive";

            return (
              <article
                key={label}
                className="rounded-card border border-slate-200 bg-white p-4"
              >
                {/* =================================================
                    CARD HEADER
                ================================================= */}

                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 text-[12.5px] text-ink-soft">
                    {label}
                  </span>

                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue/10 text-blue"
                    aria-hidden="true"
                  >
                    <Icon
                      size={16}
                      strokeWidth={
                        isPositive
                          ? 2.2
                          : 2
                      }
                    />
                  </span>
                </div>

                {/* =================================================
                    VALUE
                ================================================= */}

                <p className="mt-2 break-words font-sora text-[22px] font-extrabold text-navy">
                  {value}
                </p>

                {/* =================================================
                    NOTE
                ================================================= */}

                <p
                  className={`mt-1 text-[11.5px] font-medium ${
                    isPositive
                      ? "text-green"
                      : "text-ink-soft"
                  }`}
                >
                  {note}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        /* =================================================
           EMPTY STATS STATE
        ================================================= */

        <div className="rounded-card border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-[12.5px] font-medium text-slate-600">
            Dashboard statistics are
            currently unavailable.
          </p>
        </div>
      )}
    </section>
  );
}