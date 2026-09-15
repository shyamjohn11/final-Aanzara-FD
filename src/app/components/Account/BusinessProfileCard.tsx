"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { authApi, businessAccountsApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type BusinessProfileData = {
  enterpriseName?: unknown;
  gstin?: unknown;
  category?: unknown;
  shipTo?: unknown;
  turnover?: unknown;
  memberSince?: unknown;
  address?: unknown;
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
  value: unknown
): string {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return FALLBACK_TEXT;
  }

  const text = String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return FALLBACK_TEXT;
  }

  return text;
}

/**
 * Validate GSTIN format.
 *
 * Standard GSTIN structure:
 * 2 digits
 * 5 letters
 * 4 digits
 * 1 letter
 * 1 alphanumeric
 * Z
 * 1 alphanumeric
 */
function validateGSTIN(
  value: unknown
): string {
  const gstin = safeText(value);

  if (gstin === FALLBACK_TEXT) {
    return FALLBACK_TEXT;
  }

  const normalized =
    gstin.toUpperCase();

  const gstinRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  if (!gstinRegex.test(normalized)) {
    return "GSTIN not verified";
  }

  return normalized;
}

/**
 * Validate business profile object.
 */
function getSafeBusinessProfile(
  profile: unknown
) {
  if (
    !profile ||
    typeof profile !== "object"
  ) {
    return {
      enterpriseName:
        FALLBACK_TEXT,
      gstin: FALLBACK_TEXT,
      category: FALLBACK_TEXT,
      shipTo: FALLBACK_TEXT,
      turnover: FALLBACK_TEXT,
      memberSince:
        FALLBACK_TEXT,
      address: FALLBACK_TEXT,
    };
  }

  const data =
    profile as BusinessProfileData;

  return {
    enterpriseName: safeText(
      data.enterpriseName
    ),

    gstin: validateGSTIN(
      data.gstin
    ),

    category: safeText(
      data.category
    ),

    shipTo: safeText(
      data.shipTo
    ),

    turnover: safeText(
      data.turnover
    ),

    memberSince: safeText(
      data.memberSince
    ),

    address: safeText(
      data.address
    ),
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function BusinessProfileCard() {
  const [source, setSource] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        let mapped: Record<string, unknown> | null = null;
        try {
          const res: unknown = await businessAccountsApi.list(1, 10);
          const payload: unknown =
            (res as { data?: unknown })?.data ?? res;
          const list: Record<string, unknown>[] = (
            Array.isArray(payload)
              ? payload
              : Array.isArray((payload as { items?: unknown })?.items)
                ? (payload as { items: unknown[] }).items
                : []
          ) as Record<string, unknown>[];
          const first = list[0];
          if (first) {
            mapped = {
              enterpriseName:
                first["businessName"] ?? first["name"] ?? first["companyName"],
              gstin: first["gst"] ?? first["gstNumber"] ?? first["gstin"],
              category: first["status"] ?? first["category"] ?? "Business",
              shipTo: first["address"] ?? first["businessAddress"],
              turnover: first["turnover"] ?? "—",
              memberSince: first["createdAt"],
              address: first["address"] ?? first["businessAddress"],
            };
          }
        } catch {
          mapped = null;
        }
        if (!mapped) {
          try {
            const meRes = await authApi.me();
            const me = ((meRes as { data?: unknown })?.data ?? meRes) as Record<
              string,
              unknown
            >;
            mapped = {
              enterpriseName: me["name"],
              gstin: "—",
              category: Array.isArray(me["roles"])
                ? String((me["roles"] as unknown[])[0] ?? "Business")
                : "Business",
              shipTo: me["email"],
              turnover: "—",
              memberSince: me["createdAt"],
              address: me["email"],
            };
          } catch {
            mapped = null;
          }
        }
        if (!cancelled) setSource(mapped);
      } catch {
        if (!cancelled) setError("Unable to load business profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const profile = getSafeBusinessProfile(source);

  if (loading) {
    return (
      <section
        aria-labelledby="business-profile-title"
        className="rounded-card border border-slate-200 bg-white p-5"
      >
        <p className="text-[12.5px] font-medium text-slate-600">
          Loading business profile…
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        aria-labelledby="business-profile-title"
        className="rounded-card border border-red-200 bg-red-50 p-5"
      >
        <p className="text-[12.5px] font-medium text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="business-profile-title"
      className="rounded-card border border-slate-200 bg-white p-5"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2
            id="business-profile-title"
            className="truncate text-[14.5px] font-semibold text-navy"
          >
            Business Enterprise Profile
          </h2>

          <span
            role="status"
            className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600"
          >
            Gold Partner
          </span>
        </div>

        {/* EDIT PROFILE */}

        <button
          type="button"
          aria-label="Edit business enterprise profile"
          className="flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold text-blue transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-blue/20"
        >
          <Pencil
            size={13}
            aria-hidden="true"
          />

          <span>
            Edit Profile
          </span>
        </button>
      </div>

      {/* =================================================
          PROFILE DETAILS
      ================================================= */}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* =================================================
            ENTERPRISE NAME
        ================================================= */}

        <ProfileField
          label="Enterprise Name"
          value={
            profile.enterpriseName
          }
        />

        {/* =================================================
            GSTIN
        ================================================= */}

        <ProfileField
          label="Registered GSTIN"
          value={profile.gstin}
        />

        {/* =================================================
            BUSINESS CATEGORY
        ================================================= */}

        <ProfileField
          label="Business Category"
          value={profile.category}
        />

        {/* =================================================
            SHIP TO
        ================================================= */}

        <ProfileField
          label="Ship to Address"
          value={profile.shipTo}
        />

        {/* =================================================
            TURNOVER
        ================================================= */}

        <ProfileField
          label="Annual Turnover"
          value={profile.turnover}
          valueClassName="text-green"
        />

        {/* =================================================
            MEMBER SINCE
        ================================================= */}

        <ProfileField
          label="Member Since"
          value={
            profile.memberSince
          }
        />
      </div>

      {/* =================================================
          FULL ADDRESS
      ================================================= */}

      <p className="mt-4 border-t border-slate-100 pt-3 text-[12px] text-ink-soft">
        {profile.address}
      </p>
    </section>
  );
}

/* =========================================================
   PROFILE FIELD
========================================================= */

function ProfileField({
  label,
  value,
  valueClassName = "text-navy",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11.5px] text-ink-soft">
        {label}
      </p>

      <p
        className={`mt-0.5 break-words text-[13px] font-semibold ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}