// Shared helpers for shopper-facing coupon codes backed by the public
// GET /api/v1/deals/coupons endpoint (admin-managed marketing coupons).

import { dealsApi } from "@/app/api/services";

export type StorefrontCoupon = {
  code: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
};

export const PENDING_COUPON_STORAGE_KEY = "aanzara_pending_coupon";

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function unwrapRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (payload && typeof payload === "object") {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.items)) return rec.items as Record<string, unknown>[];
    if (Array.isArray(rec.data)) return rec.data as Record<string, unknown>[];
  }
  return [];
}

export function mapCouponRow(row: Record<string, unknown>): StorefrontCoupon | null {
  const code = toText(row.code ?? row.couponCode).toUpperCase();
  if (!code) return null;

  return {
    code,
    title: toText(row.title ?? row.name ?? code),
    description: toText(row.description ?? row.subtitle),
    discountType: toText(row.discountType ?? row.type ?? "Percent") || "Percent",
    discountValue: toNumber(row.discountValue ?? row.value ?? row.discount),
    minOrderValue: toNumber(row.minOrderValue ?? row.minOrder ?? row.minimumOrder),
    startsAt: typeof row.startsAt === "string" ? row.startsAt : null,
    endsAt: typeof row.endsAt === "string" ? row.endsAt : null,
    status: toText(row.status ?? "Active") || "Active",
  };
}

export async function loadStorefrontCoupons(count = 50): Promise<StorefrontCoupon[]> {
  const response = await dealsApi.coupons(count);
  const payload: unknown = (response as { data?: unknown })?.data ?? response;
  const seen = new Set<string>();

  return unwrapRows(payload)
    .map(mapCouponRow)
    .filter((coupon): coupon is StorefrontCoupon => {
      if (!coupon) return false;
      if (coupon.status.toLowerCase() !== "active") return false;
      if (seen.has(coupon.code)) return false;
      seen.add(coupon.code);
      return true;
    });
}

function isPercentType(type: string): boolean {
  const t = type.trim().toLowerCase();
  return t === "percent" || t === "percentage" || t === "%";
}

export function isCouponActiveNow(coupon: StorefrontCoupon, now = new Date()): boolean {
  if (coupon.status.toLowerCase() !== "active") return false;

  const start = coupon.startsAt ? Date.parse(coupon.startsAt) : NaN;
  const end = coupon.endsAt ? Date.parse(coupon.endsAt) : NaN;
  const t = now.getTime();

  if (Number.isFinite(start) && t < start) return false;
  if (Number.isFinite(end) && t > end) return false;
  return true;
}

/** Returns a shopper-facing error message, or null when the coupon applies. */
export function validateCouponForSubtotal(
  coupon: StorefrontCoupon,
  subtotal: number
): string | null {
  if (!isCouponActiveNow(coupon)) {
    return "This coupon has expired or is not active yet.";
  }
  if (subtotal + 1e-9 < coupon.minOrderValue) {
    return `This coupon requires a minimum order of ₹${Math.floor(coupon.minOrderValue).toLocaleString("en-IN")}.`;
  }
  if (coupon.discountValue <= 0) {
    return "This coupon cannot be applied to your cart.";
  }
  return null;
}

export function computeCouponDiscount(
  coupon: StorefrontCoupon,
  subtotal: number
): number {
  if (!coupon || subtotal <= 0 || coupon.discountValue <= 0) return 0;

  const raw = isPercentType(coupon.discountType)
    ? (subtotal * coupon.discountValue) / 100
    : coupon.discountValue;

  return Math.max(0, Math.min(raw, subtotal));
}

export function readPendingCouponCode(): string {
  if (typeof window === "undefined") return "";
  try {
    return (window.sessionStorage.getItem(PENDING_COUPON_STORAGE_KEY) ?? "")
      .trim()
      .toUpperCase();
  } catch {
    return "";
  }
}

export function writePendingCouponCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = code.trim().toUpperCase();
    if (normalized) {
      window.sessionStorage.setItem(PENDING_COUPON_STORAGE_KEY, normalized);
    } else {
      window.sessionStorage.removeItem(PENDING_COUPON_STORAGE_KEY);
    }
  } catch {
    // sessionStorage unavailable — apply still works in-page.
  }
}

export function clearPendingCouponCode(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_COUPON_STORAGE_KEY);
  } catch {
    // ignore
  }
}
