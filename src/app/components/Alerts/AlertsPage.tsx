"use client";

import { useEffect, useState } from "react";

import {
  Bell,
  CheckCheck,
  CircleAlert,
} from "lucide-react";

import AlertCard from "@/app/components/Alerts/AlertCard";
import AlertsEmptyState from "@/app/components/Alerts/AlertsEmptyState";

import { type AlertItem } from "@/app/data/alerts";
import {
  customerNotificationsApi,
  type CustomerNotification,
} from "@/app/api/services";
import { hasSession } from "@/app/api/api";

/* =========================================================
   FILTER TYPES
========================================================= */

type AlertFilter =
  | "all"
  | "unread"
  | "read";

/* =========================================================
   VALID ALERT TYPES
========================================================= */

const VALID_ALERT_TYPES = [
  "order",
  "offer",
  "delivery",
  "payment",
  "system",
] as const;

/* =========================================================
   ALERT TYPE VALIDATION
========================================================= */

function isValidAlertType(
  value: unknown,
): value is AlertItem["type"] {
  return (
    typeof value === "string" &&
    VALID_ALERT_TYPES.includes(
      value as AlertItem["type"],
    )
  );
}

/* =========================================================
   DATE VALIDATION
========================================================= */

function isValidDate(
  value: unknown,
): value is string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(
    date.getTime(),
  );
}

/* =========================================================
   ALERT VALIDATION
========================================================= */

function isValidAlert(
  value: unknown,
): value is AlertItem {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const item =
    value as Partial<AlertItem>;

  return (
    typeof item.id === "string" &&
    item.id.trim().length > 0 &&

    typeof item.title === "string" &&
    item.title.trim().length > 0 &&

    typeof item.message === "string" &&
    item.message.trim().length > 0 &&

    isValidDate(item.date) &&

    typeof item.read === "boolean" &&

    isValidAlertType(item.type)
  );
}

/* =========================================================
   SAFE ALERT DATA
========================================================= */

function getSafeAlerts(
  value: unknown,
): AlertItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const usedIds = new Set<string>();

  return value
    .filter(isValidAlert)
    .map((alert) => ({
      ...alert,
      id: alert.id.trim(),
      title: alert.title.trim(),
      message: alert.message.trim(),
      date: alert.date.trim(),
    }))
    .filter((alert) => {
      if (usedIds.has(alert.id)) {
        return false;
      }

      usedIds.add(alert.id);

      return true;
    });
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AlertsPage() {
  const [alerts, setAlerts] =
    useState<AlertItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Customer feed is read-only server-side; read state persists locally.
  const readStoredReadIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem(
        "aanzara-alerts-read"
      );
      const parsed: unknown = raw
        ? JSON.parse(raw)
        : [];
      return new Set(
        Array.isArray(parsed)
          ? parsed.filter(
              (id): id is string =>
                typeof id === "string"
            )
          : []
      );
    } catch {
      return new Set();
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        if (!hasSession()) {
          if (!cancelled) {
            setAlerts([]);
          }
          return;
        }

        const { data } =
          await customerNotificationsApi.list(20);
        const list: CustomerNotification[] =
          Array.isArray(data) ? data : [];
        if (cancelled) return;

        const readIds = readStoredReadIds();
        const mapped: AlertItem[] = list.map((n, i) => {
          const t = String(
            n.type ?? "system"
          ).toLowerCase();
          const type = (
            [
              "order",
              "offer",
              "delivery",
              "payment",
              "system",
            ] as const
          ).includes(t as AlertItem["type"])
            ? (t as AlertItem["type"])
            : "system";
          const created = String(
            n.createdAt ?? new Date().toISOString()
          );
          const id = String(
            n.id ?? `notif-${i}`
          ).trim();
          return {
            id,
            type,
            title: String(
              n.title ?? "Notification"
            ),
            message: String(n.message ?? ""),
            date: created,
            read:
              Boolean(n.isRead) ||
              readIds.has(id),
          };
        });
        setAlerts(getSafeAlerts(mapped));
      } catch {
        if (!cancelled)
          setLoadError(
            "Unable to load alerts. Please sign in to view your order updates."
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [filter, setFilter] =
    useState<AlertFilter>("all");

  /* =======================================================
     COUNTS
  ======================================================= */

  const unreadCount = alerts.filter(
    (alert) => !alert.read,
  ).length;

  const readCount = alerts.filter(
    (alert) => alert.read,
  ).length;

  const totalCount = alerts.length;

  /* =======================================================
     FILTERED ALERTS
  ======================================================= */

  const filteredAlerts =
    alerts.filter((alert) => {
      switch (filter) {
        case "unread":
          return !alert.read;

        case "read":
          return alert.read;

        case "all":
        default:
          return true;
      }
    });

  /* =======================================================
     MARK ONE AS READ
  ======================================================= */

  const handleMarkAsRead = (
    id: string,
  ) => {
    if (
      typeof id !== "string" ||
      id.trim().length === 0
    ) {
      return;
    }

    try {
      const readIds = readStoredReadIds();
      readIds.add(id);
      localStorage.setItem(
        "aanzara-alerts-read",
        JSON.stringify([...readIds])
      );
    } catch {
      // Read state is best-effort.
    }

    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) => {
        if (alert.id !== id) {
          return alert;
        }

        return {
          ...alert,
          read: true,
        };
      }),
    );
  };

  /* =======================================================
     MARK ALL AS READ
  ======================================================= */

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      const readIds = readStoredReadIds();
      alerts.forEach((alert) =>
        readIds.add(alert.id)
      );
      localStorage.setItem(
        "aanzara-alerts-read",
        JSON.stringify([...readIds])
      );
    } catch {
      // Read state is best-effort.
    }

    setAlerts((currentAlerts) =>
      currentAlerts.map(
        (alert) => ({
          ...alert,
          read: true,
        }),
      ),
    );
  };

  /* =======================================================
     EMPTY MESSAGE
  ======================================================= */

  const getEmptyMessage = () => {
    if (filter === "unread") {
      return "No unread alerts";
    }

    if (filter === "read") {
      return "No read alerts";
    }

    return "You're all caught up!";
  };

  /* =======================================================
     HEADING
  ======================================================= */

  const getListHeading = () => {
    if (filter === "unread") {
      return "Unread Alerts";
    }

    if (filter === "read") {
      return "Read Alerts";
    }

    return "All Alerts";
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      className="
        min-h-[calc(100vh-220px)]
        bg-[#F6F8FB]
        py-6
        sm:py-8
      "
      aria-labelledby="alerts-page-title"
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1100px]
          px-4
          sm:px-6
        "
      >
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          {/* TITLE */}

          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-blue-100
                text-blue-600
              "
            >
              <Bell
                size={21}
                aria-hidden="true"
              />
            </div>

            <div>
              <h1
                id="alerts-page-title"
                className="
                  !text-black
                  font-sora
                  text-[22px]
                  font-extrabold
                  leading-tight
                "
              >
                Alerts
              </h1>

              <p
                className="
                  mt-1
                  !text-gray-500
                  text-[12px]
                "
              >
                Stay updated with your orders,
                offers and account activity.
              </p>
            </div>
          </div>

          {/* MARK ALL */}

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-lg
              border
              border-gray-200
              bg-white
              px-4
              py-2.5
              !text-gray-700
              text-[11px]
              font-bold
              transition-colors
              hover:border-blue-200
              hover:!text-blue-600
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <CheckCheck
              size={15}
              aria-hidden="true"
            />

            Mark all as read
          </button>
        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div
          className="
            mt-6
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
          "
        >
          {/* ALL */}

          <button
            type="button"
            onClick={() =>
              setFilter("all")
            }
            className={`
              rounded-xl
              border
              bg-white
              p-4
              text-left
              transition-all
              ${
                filter === "all"
                  ? "border-blue-500 ring-1 ring-blue-500"
                  : "border-gray-200"
              }
            `}
          >
            <p
              className="
                !text-gray-500
                text-[11px]
                font-medium
              "
            >
              All Alerts
            </p>

            <p
              className="
                mt-1
                !text-black
                text-[22px]
                font-extrabold
              "
            >
              {totalCount}
            </p>
          </button>

          {/* UNREAD */}

          <button
            type="button"
            onClick={() =>
              setFilter("unread")
            }
            className={`
              rounded-xl
              border
              bg-white
              p-4
              text-left
              transition-all
              ${
                filter === "unread"
                  ? "border-blue-500 ring-1 ring-blue-500"
                  : "border-gray-200"
              }
            `}
          >
            <p
              className="
                !text-gray-500
                text-[11px]
                font-medium
              "
            >
              Unread
            </p>

            <p
              className="
                mt-1
                !text-blue-600
                text-[22px]
                font-extrabold
              "
            >
              {unreadCount}
            </p>
          </button>

          {/* READ */}

          <button
            type="button"
            onClick={() =>
              setFilter("read")
            }
            className={`
              col-span-2
              rounded-xl
              border
              bg-white
              p-4
              text-left
              transition-all
              sm:col-span-1
              ${
                filter === "read"
                  ? "border-blue-500 ring-1 ring-blue-500"
                  : "border-gray-200"
              }
            `}
          >
            <p
              className="
                !text-gray-500
                text-[11px]
                font-medium
              "
            >
              Read
            </p>

            <p
              className="
                mt-1
                !text-green-600
                text-[22px]
                font-extrabold
              "
            >
              {readCount}
            </p>
          </button>
        </div>

        {/* =================================================
            LIST HEADER
        ================================================= */}

        <div
          className="
            mt-7
            flex
            items-center
            justify-between
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <CircleAlert
              size={16}
              className="text-blue-600"
              aria-hidden="true"
            />

            <h2
              className="
                !text-black
                text-[14px]
                font-bold
              "
            >
              {getListHeading()}
            </h2>
          </div>

          <span
            className="
              !text-gray-500
              text-[11px]
            "
          >
            {filteredAlerts.length}{" "}
            {filteredAlerts.length === 1
              ? "alert"
              : "alerts"}
          </span>
        </div>

        {/* =================================================
            ALERT LIST
        ================================================= */}

        {loading ? (
          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-6 text-center text-[12px] text-gray-500">
            Loading alerts…
          </div>
        ) : loadError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-[12px] text-red-600">
            {loadError}
          </div>
        ) : (
        <div className="mt-3 space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(
              (alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onMarkAsRead={
                    handleMarkAsRead
                  }
                />
              ),
            )
          ) : (
            <AlertsEmptyState
              message={getEmptyMessage()}
            />
          )}
        </div>
        )}
      </div>
    </section>
  );
}