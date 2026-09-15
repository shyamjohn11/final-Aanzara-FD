"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  customerNotificationsApi,
  notificationsApi,
} from "@/app/api/services";
import { hasSession } from "@/app/api/api";

import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  User,
  X,
  Info,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type AlertType =
  | "order"
  | "delivery"
  | "offer"
  | "account"
  | "general";

type AlertItem = {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  time: string;
  createdAt: number;
  read: boolean;
  href?: string;
};

type AlertFilter =
  | "all"
  | "unread"
  | "orders"
  | "offers"
  | "account";

// ============================================================
// CONSTANTS
// ============================================================

const ALERTS_KEY = "aanzara-alerts";

const VALID_ALERT_TYPES: AlertType[] = [
  "order",
  "delivery",
  "offer",
  "account",
  "general",
];

// ============================================================
// DEFAULT ALERTS
// ============================================================

function createDefaultAlerts(): AlertItem[] {
  const now = Date.now();

  return [
    {
      id: "order-confirmed",
      type: "order",
      title: "Order Confirmed",
      message:
        "Your order has been confirmed successfully. We are preparing your items for dispatch.",
      time: "30 minutes ago",
      createdAt: now - 30 * 60 * 1000,
      read: false,
      href: "/account/orders",
    },
    {
      id: "order-shipped",
      type: "delivery",
      title: "Order Shipped",
      message:
        "Your order has been shipped and is on its way. You can track your order from My Orders.",
      time: "3 hours ago",
      createdAt: now - 3 * 60 * 60 * 1000,
      read: false,
      href: "/account/orders",
    },
    {
      id: "wholesale-offer",
      type: "offer",
      title: "Wholesale Offer Available",
      message:
        "Save more on selected bulk products. Explore our latest wholesale deals.",
      time: "Yesterday",
      createdAt: now - 24 * 60 * 60 * 1000,
      read: true,
      href: "/wholesale",
    },
    {
      id: "special-discount",
      type: "offer",
      title: "Special Discount For You",
      message:
        "Selected products are now available with exclusive discounts for a limited time.",
      time: "2 days ago",
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
      read: true,
      href: "/shop",
    },
    {
      id: "profile-updated",
      type: "account",
      title: "Profile Updated",
      message:
        "Your account profile information has been updated successfully.",
      time: "3 days ago",
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      read: true,
      href: "/account/profile",
    },
    {
      id: "welcome",
      type: "general",
      title: "Welcome to Aanzara",
      message:
        "Thank you for joining Aanzara. Explore products, offers and wholesale solutions.",
      time: "5 days ago",
      createdAt: now - 5 * 24 * 60 * 60 * 1000,
      read: true,
      href: "/shop",
    },
  ];
}

// ============================================================
// VALIDATION
// ============================================================

function isValidAlert(value: unknown): value is AlertItem {
  if (!value || typeof value !== "object") return false;

  const alert = value as Partial<AlertItem>;

  if (typeof alert.id !== "string" || alert.id.trim().length === 0) {
    return false;
  }

  if (
    typeof alert.type !== "string" ||
    !VALID_ALERT_TYPES.includes(alert.type as AlertType)
  ) {
    return false;
  }

  if (
    typeof alert.title !== "string" ||
    alert.title.trim().length === 0 ||
    alert.title.length > 150
  ) {
    return false;
  }

  if (
    typeof alert.message !== "string" ||
    alert.message.trim().length === 0 ||
    alert.message.length > 500
  ) {
    return false;
  }

  if (
    typeof alert.time !== "string" ||
    alert.time.trim().length === 0 ||
    alert.time.length > 100
  ) {
    return false;
  }

  if (
    typeof alert.createdAt !== "number" ||
    !Number.isFinite(alert.createdAt)
  ) {
    return false;
  }

  if (typeof alert.read !== "boolean") return false;

  if (
    alert.href !== undefined &&
    (typeof alert.href !== "string" ||
      !alert.href.startsWith("/") ||
      alert.href.startsWith("//"))
  ) {
    return false;
  }

  return true;
}

function validateAlerts(value: unknown): AlertItem[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > 100) return null;

  const valid = value.every(isValidAlert);
  if (!valid) return null;

  const uniqueIds = new Set(value.map((alert) => alert.id));
  if (uniqueIds.size !== value.length) return null;

  return value;
}

// ============================================================
// ICON HELPERS
// ============================================================

function getAlertIcon(type: AlertType) {
  switch (type) {
    case "order":
      return ShoppingBag;
    case "delivery":
      return Truck;
    case "offer":
      return Tag;
    case "account":
      return User;
    case "general":
    default:
      return Info;
  }
}

function getAlertIconStyle(type: AlertType) {
  switch (type) {
    case "order":
      return "bg-blue-50 text-blue-600";
    case "delivery":
      return "bg-emerald-50 text-emerald-600";
    case "offer":
      return "bg-amber-50 text-amber-500";
    case "account":
      return "bg-purple-50 text-purple-600";
    case "general":
    default:
      return "bg-blue-50 text-blue-600";
  }
}

// ============================================================
// PAGE CONTENT
// (renders inside src/app/account/layout.tsx —
//  no TopBar/Header/MainNav/Footer/sidebar here anymore)
// ============================================================

export default function AlertsPage() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<AlertFilter>("all");
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);

  // ==========================================================
  // LOAD ALERTS
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    try {
      const savedAlerts = localStorage.getItem(ALERTS_KEY);

      if (!savedAlerts) {
        const defaults = createDefaultAlerts();
        if (mounted) setAlerts(defaults);
        localStorage.setItem(ALERTS_KEY, JSON.stringify(defaults));
        return;
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(savedAlerts);
      } catch {
        parsed = null;
      }

      const validated = validateAlerts(parsed);

      if (validated) {
        if (mounted) setAlerts(validated);
        return;
      }

      const defaults = createDefaultAlerts();
      if (mounted) setAlerts(defaults);
      localStorage.setItem(ALERTS_KEY, JSON.stringify(defaults));
    } catch (error) {
      console.error("Unable to load alerts:", error);

      const defaults = createDefaultAlerts();
      if (mounted) setAlerts(defaults);

      try {
        localStorage.setItem(ALERTS_KEY, JSON.stringify(defaults));
      } catch {
        // Ignore localStorage write errors.
      }
    } finally {
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // SAVE ALERTS
  // ==========================================================

  useEffect(() => {
    if (loading) return;

    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.error("Unable to save alerts:", error);
    }
  }, [alerts, loading]);

  // ==========================================================
  // MERGE LIVE CUSTOMER NOTIFICATIONS (logged in)
  // Order-event feed; local defaults remain the base list.
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    if (!hasSession()) {
      return;
    }

    customerNotificationsApi
      .list(20)
      .then(({ data }) => {
        if (cancelled) {
          return;
        }

        const rows = Array.isArray(data)
          ? data
          : [];

        if (rows.length === 0) {
          return;
        }

        const mapped: AlertItem[] = rows.map(
          (row, index) => {
            const rawType = String(
              row.type ?? "general"
            ).toLowerCase();
            const type: AlertType = (
              VALID_ALERT_TYPES as string[]
            ).includes(rawType)
              ? (rawType as AlertType)
              : "general";
            const createdRaw = String(
              row.createdAt ?? ""
            );
            const createdAt = Number.isNaN(
              Date.parse(createdRaw)
            )
              ? Date.now() - index * 60000
              : Date.parse(createdRaw);
            const id = String(
              row.id ?? `live-${createdAt}-${index}`
            ).trim();
            return {
              id,
              type,
              title: String(
                row.title ?? "Notification"
              ).trim(),
              message: String(
                row.message ?? ""
              ).trim(),
              time: new Date(
                createdAt
              ).toLocaleString("en-IN"),
              createdAt,
              read: false,
              href: "/account/orders",
            };
          }
        );

        setAlerts((current) => {
          const known = new Set(
            current.map((alert) => alert.id)
          );
          const fresh = mapped.filter(
            (alert) =>
              !known.has(alert.id) &&
              alert.title.length > 0 &&
              alert.message.length > 0
          );
          return fresh.length > 0
            ? [...fresh, ...current]
            : current;
        });
      })
      .catch(() => {
        // Local alerts remain on failure.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // MERGE LIVE BACKEND NOTIFICATIONS (admin role only;
  // the admin feed requires the Admin role)
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    if (!hasSession()) {
      return;
    }

    try {
      if (
        sessionStorage.getItem(
          "aanzara_user_role"
        ) !== "admin"
      ) {
        return;
      }
    } catch {
      return;
    }

    notificationsApi
      .list()
      .then((response) => {
        if (cancelled) {
          return;
        }

        const payload: unknown =
          (response as { data?: unknown })?.data ??
          response;
        const rows: Record<string, unknown>[] = Array.isArray(
          payload
        )
          ? (payload as Record<string, unknown>[])
          : Array.isArray(
                (payload as Record<string, unknown>)?.items
              )
            ? ((payload as Record<string, unknown>)
                .items as Record<string, unknown>[])
            : [];

        if (rows.length === 0) {
          return;
        }

        const mapped: AlertItem[] = rows.map((row, index) => {
          const rawType = String(
            row.type ?? row.category ?? "general"
          ).toLowerCase();
          const type: AlertType = (
            VALID_ALERT_TYPES as string[]
          ).includes(rawType)
            ? (rawType as AlertType)
            : "general";
          const createdRaw = String(
            row.createdAt ?? row.date ?? row.time ?? ""
          );
          const createdAt = Number.isNaN(
            Date.parse(createdRaw)
          )
            ? Date.now() - index * 60000
            : Date.parse(createdRaw);
          const id = String(
            row.id ?? row.notificationId ?? `live-${createdAt}-${index}`
          ).trim();
          return {
            id,
            type,
            title: String(
              row.title ?? row.subject ?? "Notification"
            ).trim(),
            message: String(
              row.message ?? row.body ?? row.description ?? ""
            ).trim(),
            time: new Date(createdAt).toLocaleString("en-IN"),
            createdAt,
            read: row.read === true || row.isRead === true,
            href:
              type === "order" || type === "delivery"
                ? "/account/orders"
                : type === "offer"
                  ? "/offers"
                  : "/account/alerts",
          };
        });

        setAlerts((current) => {
          const known = new Set(
            current.map((alert) => alert.id)
          );
          const fresh = mapped.filter(
            (alert) =>
              !known.has(alert.id) &&
              alert.title.length > 0 &&
              alert.message.length > 0
          );
          return fresh.length > 0
            ? [...fresh, ...current]
            : current;
        });
      })
      .catch(() => {
        // Local alerts remain on failure.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // COUNTS
  // ==========================================================

  const totalAlerts = alerts.length;
  const unreadCount = alerts.filter((alert) => !alert.read).length;

  const orderCount = alerts.filter(
    (alert) => alert.type === "order" || alert.type === "delivery"
  ).length;

  const offerCount = alerts.filter(
    (alert) => alert.type === "offer"
  ).length;

  const accountCount = alerts.filter(
    (alert) => alert.type === "account"
  ).length;

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredAlerts = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return alerts.filter((alert) => !alert.read);
      case "orders":
        return alerts.filter(
          (alert) => alert.type === "order" || alert.type === "delivery"
        );
      case "offers":
        return alerts.filter((alert) => alert.type === "offer");
      case "account":
        return alerts.filter((alert) => alert.type === "account");
      case "all":
      default:
        return alerts;
    }
  }, [alerts, activeFilter]);

  // ==========================================================
  // ACTIONS
  // ==========================================================

  const markAsRead = (id: string) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  };

  const markAllAsRead = () => {
    if (unreadCount === 0) return;

    setAlerts((current) =>
      current.map((alert) => ({ ...alert, read: true }))
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    setShowClearModal(false);
    setActiveFilter("all");
  };

  const handleAlertClick = (alert: AlertItem) => {
    if (!alert.read) markAsRead(alert.id);

    if (
      alert.href &&
      alert.href.startsWith("/") &&
      !alert.href.startsWith("//")
    ) {
      router.push(alert.href);
    }
  };

  // ==========================================================
  // FILTERS
  // ==========================================================

  const filters: { id: AlertFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: totalAlerts },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "orders", label: "Orders", count: orderCount },
    { id: "offers", label: "Offers", count: offerCount },
    { id: "account", label: "Account", count: accountCount },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* BREADCRUMB */}

      <div className="flex items-center gap-2 text-sm mb-7">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-blue-600 hover:underline"
        >
          Home
        </button>

        <ChevronRight size={14} className="text-slate-400" />

        <button
          type="button"
          onClick={() => router.push("/account/profile")}
          className="text-slate-500 hover:text-blue-600 transition"
        >
          My Account
        </button>

        <ChevronRight size={14} className="text-slate-400" />

        <span className="font-semibold text-[#0d2d62]">Alerts</span>
      </div>

      {/* TITLE + ACTIONS */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] md:text-[36px] font-bold text-[#0d2d62]">
              Alerts
            </h1>

            {unreadCount > 0 && (
              <span className="min-w-7 h-7 px-2 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm md:text-base text-slate-500">
            Stay updated with your orders, offers and account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="h-11 px-4 sm:px-5 rounded-xl border border-blue-300 bg-white text-[#0d2d62] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Check size={18} />
            <span className="hidden sm:inline">Mark All Read</span>
            <span className="sm:hidden">Read All</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            disabled={alerts.length === 0}
            className="h-11 px-4 sm:px-5 rounded-xl border border-red-300 bg-white text-red-500 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Trash2 size={18} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell size={23} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Alerts</p>
              <p className="mt-1 text-2xl font-bold text-[#0d2d62]">
                {totalAlerts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
              <AlertCircle size={23} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Unread</p>
              <p className="mt-1 text-2xl font-bold text-[#0d2d62]">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag size={23} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Order Updates</p>
              <p className="mt-1 text-2xl font-bold text-[#0d2d62]">
                {orderCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <Tag size={23} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Offers</p>
              <p className="mt-1 text-2xl font-bold text-[#0d2d62]">
                {offerCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS */}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {filters.map((filter) => {
          const active = activeFilter === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition ${
                active
                  ? "bg-[#123d7a] text-white"
                  : "bg-white border border-slate-200 text-[#0d2d62] hover:border-blue-300"
              }`}
            >
              {filter.label}
              <span
                className={`min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center text-xs ${
                  active
                    ? "bg-white text-[#123d7a]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ALERT LIST */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && (
          <div className="p-14 text-center">
            <div className="mx-auto w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <p className="mt-4 text-sm text-slate-500">Loading alerts...</p>
          </div>
        )}

        {!loading && filteredAlerts.length === 0 && (
          <div className="p-12 sm:p-16 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Bell size={36} />
            </div>

            <h3 className="mt-5 text-xl font-bold text-[#0d2d62]">
              {alerts.length === 0 ? "No alerts yet" : "No alerts found"}
            </h3>

            <p className="max-w-md mx-auto mt-2 text-sm leading-6 text-slate-500">
              {alerts.length === 0
                ? "Your latest order updates, offers and account notifications will appear here automatically."
                : "There are no notifications available for the selected filter."}
            </p>

            {alerts.length > 0 && activeFilter !== "all" && (
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                View All Alerts
              </button>
            )}
          </div>
        )}

        {!loading && filteredAlerts.length > 0 && (
          <div>
            {filteredAlerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);

              return (
                <div
                  key={alert.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleAlertClick(alert)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleAlertClick(alert);
                    }
                  }}
                  className={`group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 border-b border-slate-100 last:border-b-0 cursor-pointer outline-none focus:bg-blue-50/50 transition ${
                    alert.read
                      ? "hover:bg-slate-50"
                      : "bg-blue-50/20 hover:bg-blue-50/50"
                  }`}
                >
                  <div className="w-2 shrink-0">
                    {!alert.read && (
                      <span className="block w-2.5 h-2.5 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <div
                    className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${getAlertIconStyle(
                      alert.type
                    )}`}
                  >
                    <Icon size={25} strokeWidth={1.8} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
                      <h3
                        className={`text-sm sm:text-base text-[#102f61] ${
                          alert.read ? "font-semibold" : "font-bold"
                        }`}
                      >
                        {alert.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                        <Clock3 size={13} />
                        {alert.time}
                      </div>
                    </div>

                    <p className="mt-1 text-xs sm:text-sm text-slate-500 line-clamp-2">
                      {alert.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!alert.read && (
                      <button
                        type="button"
                        title="Mark as read"
                        aria-label={`Mark ${alert.title} as read`}
                        onClick={(event) => {
                          event.stopPropagation();
                          markAsRead(alert.id);
                        }}
                        className="hidden sm:flex w-11 h-11 rounded-xl bg-slate-50 text-[#0d2d62] items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        <Check size={19} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Delete alert"
                      aria-label={`Delete ${alert.title}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteAlert(alert.id);
                      }}
                      className="w-11 h-11 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition"
                    >
                      <Trash2 size={18} />
                    </button>

                    <ChevronRight
                      size={20}
                      className="hidden sm:block text-slate-400 group-hover:text-blue-600 transition"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INFO BOX */}

      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Bell size={23} />
          </div>

          <div>
            <h3 className="font-bold text-[#123d7a]">Stay updated</h3>
            <p className="mt-1 text-sm leading-6 text-[#476184]">
              Your latest order updates, offers and account notifications
              will appear here automatically.
            </p>
          </div>
        </div>
      </div>

      {/* CLEAR ALL MODAL */}

      {showClearModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowClearModal(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-[420px] rounded-2xl bg-white shadow-2xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <Trash2 size={23} />
              </div>

              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#0d2d62]">
              Clear all alerts?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This will permanently remove all your notifications. This
              action cannot be undone.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 h-11 rounded-xl border border-slate-200 text-[#0d2d62] font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={clearAllAlerts}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
