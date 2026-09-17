"use client";

import { useRouter } from "next/navigation";

import {
  Bell,
  CheckCircle2,
  CreditCard,
  FileText,
  Package,
  Percent,
  Truck,
} from "lucide-react";

import type { AlertItem } from "@/app/data/alerts";

/* =========================================================
   ICON MAP
========================================================= */

const ALERT_ICONS = {
  order: Package,
  offer: Percent,
  delivery: Truck,
  payment: CreditCard,
  system: FileText,
} as const;

/* =========================================================
   PROPS
========================================================= */

type AlertCardProps = {
  alert: AlertItem;
  onMarkAsRead: (id: string) => void;
};

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatAlertDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* =========================================================
   GET ORDER NUMBER FROM ALERT
========================================================= */

function getOrderNumber(alert: AlertItem): string | null {
  const text = `${alert.title} ${alert.message}`;

  const match = text.match(/#AZ\d+/i);

  if (!match?.[0]) {
    return null;
  }

  return match[0];
}

/* =========================================================
   ACTION URL
========================================================= */

function getActionHref(alert: AlertItem): string {
  /*
   * ORDER / DELIVERY
   *
   * Example:
   *
   * Order Delivered
   * #AZ10210
   *
   * ↓
   *
   * /orders?order=AZ10210
   */

  if (
    alert.type === "order" ||
    alert.type === "delivery"
  ) {
    const orderNumber = getOrderNumber(alert);

    if (orderNumber) {
      const cleanOrderNumber =
        orderNumber.replace(/^#/, "");

      return `/orders?order=${encodeURIComponent(
        cleanOrderNumber,
      )}`;
    }
  }

  /* =======================================================
     USE actionHref FOR OTHER ALERTS
  ======================================================= */

  if (
    typeof alert.actionHref === "string" &&
    alert.actionHref.trim().length > 0
  ) {
    return alert.actionHref.trim();
  }

  /* =======================================================
     DEFAULT ROUTES
  ======================================================= */

  switch (alert.type) {
    case "order":
      return "/orders";

    case "delivery":
      return "/orders";

    case "offer":
      return "/offers";

    case "payment":
      return "/payment";

    case "system":
      return "/invoice";

    default:
      return "/";
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AlertCard({
  alert,
  onMarkAsRead,
}: AlertCardProps) {
  const router = useRouter();

  /* =======================================================
     ICON
  ======================================================= */

  const Icon = ALERT_ICONS[alert.type] ?? Bell;

  /* =======================================================
     ACTION URL
  ======================================================= */

  const actionHref = getActionHref(alert);

  /* =======================================================
     ACTION CLICK
  ======================================================= */

  const handleActionClick = () => {
    /*
     * Mark notification as read
     */

    if (!alert.read) {
      onMarkAsRead(alert.id);
    }

    /*
     * Navigate
     */

    router.push(actionHref);
  };

  /* =======================================================
     MARK AS READ
  ======================================================= */

  const handleMarkAsRead = () => {
    onMarkAsRead(alert.id);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <article
      className="
        relative
        w-full
        rounded-[15px]
        border
        border-[#E1E5EB]
        bg-white
        px-6
        py-6
        shadow-[0_1px_3px_rgba(15,23,42,0.06)]
        transition-all
        duration-200
        hover:shadow-[0_3px_10px_rgba(15,23,42,0.08)]
      "
    >
      <div className="flex items-start gap-5">

        {/* =================================================
            ICON
        ================================================= */}

        <div
          className="
            flex
            h-[54px]
            w-[54px]
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#F1F3F6]
          "
        >
          <Icon
            size={23}
            strokeWidth={1.8}
            className="text-[#4B5563]"
            aria-hidden="true"
          />
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="min-w-0 flex-1">

          {/* =================================================
              TITLE + DATE
          ================================================= */}

          <div
            className="
              flex
              items-start
              justify-between
              gap-6
            "
          >

            {/* TITLE */}

            <div className="flex items-center gap-2">

              <h3
                className="
                  !m-0
                  !text-[#111827]
                  text-[16px]
                  font-bold
                  leading-6
                "
              >
                {alert.title}
              </h3>

              {/* UNREAD DOT */}

              {!alert.read && (
                <span
                  className="
                    h-2
                    w-2
                    shrink-0
                    rounded-full
                    bg-[#2563EB]
                  "
                  aria-label="Unread"
                  title="Unread"
                />
              )}

            </div>

            {/* DATE */}

            <time
              dateTime={alert.date}
              className="
                shrink-0
                !text-[#64748B]
                text-[12px]
                font-normal
                leading-5
              "
            >
              {formatAlertDate(alert.date)}
            </time>

          </div>

          {/* =================================================
              MESSAGE
          ================================================= */}

          <p
            className="
              !m-0
              mt-1
              !text-[#334E73]
              text-[14px]
              font-normal
              leading-6
            "
          >
            {alert.message}
          </p>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div
            className="
              mt-3
              flex
              flex-wrap
              items-center
              gap-3
            "
          >

            {/* =================================================
                ACTION BUTTON
            ================================================= */}

            {alert.actionLabel && (
              <button
                type="button"
                onClick={handleActionClick}
                className="
                  inline-flex
                  h-[40px]
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-[9px]
                  bg-[#0B2A66]
                  px-5
                  !text-white
                  text-[13px]
                  font-bold
                  leading-none
                  transition-all
                  duration-200
                  hover:bg-[#071D49]
                  active:scale-[0.98]
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#0B2A66]
                  focus-visible:ring-offset-2
                "
              >
                {alert.actionLabel}
              </button>
            )}

            {/* =================================================
                MARK AS READ
            ================================================= */}

            {!alert.read && (
              <button
                type="button"
                onClick={handleMarkAsRead}
                className="
                  inline-flex
                  cursor-pointer
                  items-center
                  gap-1.5
                  !text-gray-500
                  text-[12px]
                  font-semibold
                  transition-colors
                  hover:!text-[#0B2A66]
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#0B2A66]
                  focus-visible:ring-offset-2
                "
                aria-label={`Mark ${alert.title} as read`}
              >
                <CheckCircle2
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                Mark as read
              </button>
            )}

          </div>
        </div>
      </div>
    </article>
  );
}