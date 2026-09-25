"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Bell,
  ShoppingCart,
  Package,
  CreditCard,
  Users,
  Tag,
  Settings,
  CheckCircle2,
  Trash2,
  List,
  Check,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import { notificationsApi } from "@/app/api/services";
import { toAbsoluteTime } from "@/app/utils/notifications";

/* =========================================================
   TYPES
========================================================= */

type NotificationType =
  | "order"
  | "delivery"
  | "payment"
  | "customer"
  | "offer"
  | "enquiry"
  | "pricing"
  | "quote"
  | "review"
  | "inventory"
  | "account"
  | "system";

type Notification = {
  id: number;
  serverId?: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
};

/* =========================================================
   ICON
========================================================= */

function NotificationIcon({
  type,
}: {
  type: NotificationType;
}) {
  const base =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl";

  switch (type) {
    case "order":
      return (
        <div className={`${base} bg-blue-50 text-blue-600`}>
          <ShoppingCart size={23} strokeWidth={1.8} />
        </div>
      );

    case "delivery":
      return (
        <div className={`${base} bg-purple-50 text-purple-600`}>
          <Package size={23} strokeWidth={1.8} />
        </div>
      );

    case "payment":
      return (
        <div className={`${base} bg-green-50 text-green-600`}>
          <CreditCard size={23} strokeWidth={1.8} />
        </div>
      );

    case "customer":
      return (
        <div className={`${base} bg-orange-50 text-orange-600`}>
          <Users size={23} strokeWidth={1.8} />
        </div>
      );

    case "account":
      return (
        <div className={`${base} bg-orange-50 text-orange-600`}>
          <Users size={23} strokeWidth={1.8} />
        </div>
      );

    case "enquiry":
      return (
        <div className={`${base} bg-cyan-50 text-cyan-600`}>
          <Bell size={23} strokeWidth={1.8} />
        </div>
      );

    case "pricing":
    case "quote":
      return (
        <div className={`${base} bg-pink-50 text-pink-600`}>
          <Tag size={23} strokeWidth={1.8} />
        </div>
      );

    case "review":
      return (
        <div className={`${base} bg-yellow-50 text-yellow-600`}>
          <CheckCircle2 size={23} strokeWidth={1.8} />
        </div>
      );

    case "inventory":
      return (
        <div className={`${base} bg-amber-50 text-amber-600`}>
          <Package size={23} strokeWidth={1.8} />
        </div>
      );

    case "offer":
      return (
        <div className={`${base} bg-pink-50 text-pink-600`}>
          <Tag size={23} strokeWidth={1.8} />
        </div>
      );

    default:
      return (
        <div className={`${base} bg-gray-100 text-gray-600`}>
          <Settings size={23} strokeWidth={1.8} />
        </div>
      );
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(
    [],
  );

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState(false);

  /* =======================================================
     LOAD (#139 GET /api/admin/notifications)
     Backend shape: PagedResult { items, totalCount, ... } with
     rows { id, title, message?, isRead, type, link?, createdAt }.
  ======================================================= */

  const loadNotifications = useCallback(async () => {
    try {
      // First page is enough for the inbox view; TotalCount drives badges.
      const response = await notificationsApi.list({ page: 1, pageSize: 50 });
      const payload = (response as any)?.data ?? response;
      const raw: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
      const mapped: Notification[] = raw.map((item: any, index: number) => ({
        id: index + 1,
        serverId: String(
          item?.id ?? item?.notificationId ?? item?._id ?? "",
        ),
        type: ((): NotificationType => {
          const t = String(
            item?.type ?? item?.category ?? "system",
          ).toLowerCase();
          return (
            [
              "order",
              "delivery",
              "payment",
              "customer",
              "offer",
              "enquiry",
              "pricing",
              "quote",
              "review",
              "inventory",
              "account",
              "system",
            ] as const
          ).includes(t as NotificationType)
            ? (t as NotificationType)
            : "system";
        })(),
        title: String(item?.title ?? item?.subject ?? "Notification"),
        message: String(item?.message ?? item?.body ?? item?.description ?? ""),
        time: toAbsoluteTime(
          item?.createdAt ?? item?.time ?? item?.timeAgo ?? item?.date ?? "",
        ),
        read: Boolean(item?.read ?? item?.isRead ?? item?.seen ?? false),
        link:
          typeof item?.link === "string" && item.link.startsWith("/")
            ? item.link
            : undefined,
      }));
      setNotifications(mapped);
    } catch {
      // Keep the previous list; the header badge polls independently.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!cancelled) await loadNotifications();
    };

    void load();

    // Refresh so new order/enquiry/payment events appear live.
    // Skip ticks while the tab is hidden; catch up on visibilitychange.
    let timer: number | undefined;
    const start = () => {
      if (timer !== undefined) return;
      timer = window.setInterval(load, 30000);
    };
    const stop = () => {
      if (timer === undefined) return;
      window.clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void load();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadNotifications]);

  /* =======================================================
     COUNTS
  ======================================================= */

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const readCount = notifications.length - unreadCount;

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.read);
    }

    if (filter === "read") {
      return notifications.filter((item) => item.read);
    }

    return notifications;
  }, [notifications, filter]);

  /* =======================================================
     ACTIONS
  ======================================================= */

  const markAsRead = async (id: number) => {
    const target = notifications.find((item) => item.id === id);
    if (!target?.serverId) return;
    setActing(true);
    setActionError("");
    try {
      // PATCH /api/admin/notifications/{id}/read {isRead:true}
      await notificationsApi.markRead(target.serverId, true);
      await loadNotifications();
    } catch {
      setActionError("Could not mark the notification as read. Please retry.");
    } finally {
      setActing(false);
    }
  };

  const markAllAsRead = async () => {
    const pending = notifications.filter(
      (item) => !item.read && item.serverId,
    );
    if (pending.length === 0) return;
    setActing(true);
    setActionError("");
    try {
      await Promise.all(
        pending.map((item) =>
          notificationsApi.markRead(item.serverId as string, true),
        ),
      );
      await loadNotifications();
    } catch {
      setActionError("Some notifications could not be marked read. Please retry.");
      await loadNotifications();
    } finally {
      setActing(false);
    }
  };

  const deleteNotification = async (id: number) => {
    const target = notifications.find((item) => item.id === id);
    if (!target?.serverId) return;
    setActing(true);
    setActionError("");
    try {
      // DELETE /api/admin/notifications/{id}
      await notificationsApi.remove(target.serverId);
      await loadNotifications();
    } catch {
      setActionError("Could not delete the notification. Please retry.");
    } finally {
      setActing(false);
    }
  };

  const clearAll = async () => {
    const withServerId = notifications.filter((item) => item.serverId);
    if (withServerId.length === 0) return;
    setActing(true);
    setActionError("");
    try {
      await Promise.all(
        withServerId.map((item) =>
          notificationsApi.remove(item.serverId as string),
        ),
      );
      await loadNotifications();
    } catch {
      setActionError("Some notifications could not be deleted. Please retry.");
      await loadNotifications();
    } finally {
      setActing(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#F5F7FB] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1200px]">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <section className="rounded-2xl bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              {/* LEFT */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Bell
                    size={27}
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <h1 className="text-[24px] font-bold leading-tight text-[#0B2255] sm:text-[28px]">
                    Notifications
                  </h1>

                  <p className="mt-1 text-sm text-[#64748B] sm:text-[15px]">
                    Manage all admin alerts and notifications
                  </p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0 || acting}
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-xl border border-[#E2E8F0]
                    bg-white px-4 py-2.5
                    text-sm font-semibold text-[#334155]
                    transition
                    hover:bg-[#F8FAFC]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <CheckCircle2
                    size={18}
                    strokeWidth={1.8}
                  />
                  Mark all read
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={notifications.length === 0 || acting}
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-xl border border-red-100
                    bg-red-50 px-4 py-2.5
                    text-sm font-semibold text-red-600
                    transition
                    hover:bg-red-100
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <Trash2
                    size={18}
                    strokeWidth={1.8}
                  />
                  Clear all
                </button>
              </div>
            </div>
          </section>

          {actionError && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700"
            >
              {actionError}
            </p>
          )}

          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* TOTAL */}
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`
                rounded-2xl border bg-white p-5 text-left
                shadow-sm transition
                hover:-translate-y-[1px]
                ${
                  filter === "all"
                    ? "border-blue-400 ring-1 ring-blue-300"
                    : "border-[#E2E8F0]"
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <List
                    size={23}
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#64748B]">
                    Total Notifications
                  </p>

                  <p className="mt-1 text-[30px] font-extrabold leading-none text-[#0B2255]">
                    {notifications.length}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs text-[#64748B]">
                All time notifications
              </p>
            </button>

            {/* UNREAD */}
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`
                rounded-2xl border bg-white p-5 text-left
                shadow-sm transition
                hover:-translate-y-[1px]
                ${
                  filter === "unread"
                    ? "border-blue-400 ring-1 ring-blue-300"
                    : "border-[#E2E8F0]"
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <Bell
                    size={23}
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#64748B]">
                    Unread
                  </p>

                  <p className="mt-1 text-[30px] font-extrabold leading-none text-red-500">
                    {unreadCount}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs text-[#64748B]">
                Need your attention
              </p>
            </button>

            {/* READ */}
            <button
              type="button"
              onClick={() => setFilter("read")}
              className={`
                rounded-2xl border bg-white p-5 text-left
                shadow-sm transition
                hover:-translate-y-[1px]
                ${
                  filter === "read"
                    ? "border-blue-400 ring-1 ring-blue-300"
                    : "border-[#E2E8F0]"
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Check
                    size={24}
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#64748B]">
                    Read
                  </p>

                  <p className="mt-1 text-[30px] font-extrabold leading-none text-[#0B2255]">
                    {readCount}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs text-[#64748B]">
                Already read
              </p>
            </button>
          </section>

          {/* =================================================
              FILTER TABS
          ================================================= */}

          <section className="mt-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex w-full overflow-x-auto rounded-xl bg-transparent">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`
                    flex shrink-0 items-center gap-2
                    rounded-xl px-5 py-2.5
                    text-sm font-semibold transition
                    ${
                      filter === "all"
                        ? "border border-blue-500 bg-white text-blue-600 shadow-sm"
                        : "border border-transparent text-[#64748B] hover:bg-white"
                    }
                  `}
                >
                  <List size={17} />
                  All Notifications ({notifications.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("unread")}
                  className={`
                    flex shrink-0 items-center gap-2
                    rounded-xl px-5 py-2.5
                    text-sm font-semibold transition
                    ${
                      filter === "unread"
                        ? "border border-blue-500 bg-white text-blue-600 shadow-sm"
                        : "border border-transparent text-[#64748B] hover:bg-white"
                    }
                  `}
                >
                  Unread ({unreadCount})

                  <span className="h-2 w-2 rounded-full bg-red-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("read")}
                  className={`
                    flex shrink-0 items-center gap-2
                    rounded-xl px-5 py-2.5
                    text-sm font-semibold transition
                    ${
                      filter === "read"
                        ? "border border-blue-500 bg-white text-blue-600 shadow-sm"
                        : "border border-transparent text-[#64748B] hover:bg-white"
                    }
                  `}
                >
                  Read ({readCount})

                  <span className="h-2 w-2 rounded-full bg-green-500" />
                </button>
              </div>

              <span className="shrink-0 text-sm text-[#64748B]">
                {filteredNotifications.length}{" "}
                {filteredNotifications.length === 1
                  ? "notification"
                  : "notifications"}
              </span>
            </div>
          </section>

          {/* =================================================
              LIST
          ================================================= */}

          <section className="mt-3 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">

            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    group relative
                    border-b border-[#E8EDF4]
                    px-5 py-5
                    transition
                    last:border-b-0
                    hover:bg-[#FAFCFF]
                    ${
                      !notification.read
                        ? "bg-white"
                        : "bg-white"
                    }
                  `}
                >
                  <div className="flex items-start gap-4">

                    {/* ICON */}
                    <NotificationIcon
                      type={notification.type}
                    />

                    {/* CONTENT */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                        <h3 className="text-[15px] font-bold text-[#0B2255] sm:text-[16px]">
                          {notification.title}
                        </h3>

                        {!notification.read && (
                          <span
                            className="
                              h-2.5 w-2.5
                              shrink-0
                              rounded-full
                              bg-red-500
                              sm:ml-2
                            "
                            aria-label="Unread"
                          />
                        )}
                      </div>

                      <p className="mt-1 text-sm leading-6 text-[#475569]">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-[#94A3B8]">
                        {notification.time}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {!notification.read && (
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                            className="
                              rounded-lg
                              bg-blue-600
                              px-3 py-1.5
                              text-xs font-semibold
                              text-white
                              transition
                              hover:bg-blue-700
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            Mark as read
                          </button>
                        )}

                        {notification.link && (
                          <Link
                            href={notification.link}
                            className="
                              rounded-lg
                              border
                              border-[#E2E8F0]
                              px-3 py-1.5
                              text-xs font-semibold
                              text-[#334155]
                              transition
                              hover:bg-[#F8FAFC]
                            "
                          >
                            Open
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* DELETE */}
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() =>
                        deleteNotification(notification.id)
                      }
                      aria-label={`Delete ${notification.title}`}
                      className="
                        shrink-0
                        rounded-lg
                        p-2
                        text-[#94A3B8]
                        transition
                        hover:bg-red-50
                        hover:text-red-500
                      "
                    >
                      <Trash2
                        size={18}
                        strokeWidth={1.8}
                      />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-20 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <Bell
                    size={28}
                    strokeWidth={1.8}
                  />
                </div>

                <h3 className="mt-4 text-lg font-bold text-[#0B2255]">
                  No notifications
                </h3>

                <p className="mt-1 text-sm text-[#64748B]">
                  There are no notifications to display.
                </p>

                {filter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="
                      mt-4
                      rounded-lg
                      bg-blue-600
                      px-4 py-2
                      text-sm font-semibold
                      text-white
                      hover:bg-blue-700
                    "
                  >
                    View all notifications
                  </button>
                )}
              </div>
            )}
          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="py-8 text-center">
            <p className="text-xs text-[#94A3B8]">
              Aanzara Admin Notification Center
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}