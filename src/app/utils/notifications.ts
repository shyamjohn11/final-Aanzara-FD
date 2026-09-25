// Shared notification helpers — single source of truth for the
// customer-facing notification flow.
//
// Backend contract (no new tables required):
// - GET /api/v1/notifications?count= is DERIVED from the caller's order
//   status history plus their enquiries and bulk-quote requests (matched
//   by account email) and READ-ONLY. Every row arrives with IsRead=false; there is no PATCH/DELETE.
//   Read state therefore lives in localStorage under READ_IDS_KEY, shared by
//   the header bell, /alerts, and /account/alerts so all three agree.
// - GET /api/admin/notifications (+PATCH read / DELETE) is the persisted
//   admin inbox (Notifications table, filled by NotificationEmitter).
// - Message can be null (orders without remarks) — callers must fall back
//   instead of dropping the row.
// - Link is a backend deep-link (/orders?order=<guid>, honored by
//   /orders via ?order=). Prefer it when present.

export const READ_IDS_KEY = "aanzara-alerts-read";

export const PREFS_KEY = "aanzara-notification-prefs";

export interface NotificationPrefs {
  orderUpdates: boolean;
  offers: boolean;
  email: boolean;
}

export interface CustomerNotificationRow {
  id?: string;
  type?: string;
  title?: string;
  message?: string | null;
  createdAt?: string;
  isRead?: boolean;
  link?: string | null;
}

function readJson<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadReadIds(): Set<string> {
  const raw = readJson<unknown>(READ_IDS_KEY);
  if (Array.isArray(raw)) {
    return new Set(
      raw.filter((entry): entry is string => typeof entry === "string"),
    );
  }
  return new Set();
}

export function saveReadIds(ids: Set<string>): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage failures must never break the notification UI.
  }
}

export function loadPrefs(): NotificationPrefs {
  const parsed = readJson<Partial<NotificationPrefs>>(PREFS_KEY);
  return {
    orderUpdates:
      typeof parsed?.orderUpdates === "boolean"
        ? parsed.orderUpdates
        : true,
    offers:
      typeof parsed?.offers === "boolean" ? parsed.offers : true,
    email: typeof parsed?.email === "boolean" ? parsed.email : false,
  };
}

/** Order/delivery rows honor `orderUpdates`; offer rows honor `offers`. */
export function isTypeAllowed(
  type: string | undefined,
  prefs: NotificationPrefs,
): boolean {
  const normalized = (type ?? "").toLowerCase();
  if (normalized === "order" || normalized === "delivery") {
    return prefs.orderUpdates;
  }
  if (normalized === "offer") {
    return prefs.offers;
  }
  return true;
}

export function toRelativeTime(iso: string | undefined): string {
  if (!iso) return "";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const diffMs = Date.now() - time;
  if (diffMs < 0) return "Just now";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
}

export function toAbsoluteTime(iso: string | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}
