"use client";

import {
  Search,
  Heart,
  Bell,
  User,
  ShoppingCart,
  FileText,
  Menu,
  ChevronDown,
  LayoutDashboard,
  UserRound,
  Package,
  LogOut,
  CheckCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCart } from "@/app/context/cartcontext";
import { useWishlist } from "@/app/context/wishlistcontext";
import {
  hasSession,
  SESSION_CHANGED_EVENT,
} from "@/app/api/api";
import { customerNotificationsApi } from "@/app/api/services";
import {
  isTypeAllowed,
  loadPrefs,
  loadReadIds,
  saveReadIds,
  toRelativeTime,
  type CustomerNotificationRow,
} from "@/app/utils/notifications";

/* =========================================================
   TYPES
========================================================= */

type HeaderProps = {
  onMenuClick?: () => void;
};

type AanzaraUser = {
  id?: string | number;
  name?: string;
  mobile?: string;
  email?: string;
  accountType?: string;
  loginMethod?: string;
};

type AlertNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
};

/* =========================================================
   LIVE NOTIFICATIONS — GET /api/v1/notifications?count=
   (derived from order history, read-only server-side; read
   state lives in the shared `aanzara-alerts-read` key so the
   bell, /alerts, and /account/alerts always agree).
========================================================= */

const ALERTS_PREVIEW_COUNT = 3;

/* =========================================================
   HEADER
========================================================= */

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const router = useRouter();

  /* =======================================================
     CART / WISHLIST
  ======================================================= */

  const { totalUnits } = useCart();

  const {
    totalItems: wishlistCount,
  } = useWishlist();

  /* =======================================================
     SEARCH
  ======================================================= */

  const [searchQuery, setSearchQuery] =
    useState("");

  /* =======================================================
     USER
  ======================================================= */

  const [user, setUser] =
    useState<AanzaraUser | null>(null);

  const [userLoaded, setUserLoaded] =
    useState(false);

  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  /* =======================================================
     ALERTS / NOTIFICATIONS
  ======================================================= */

  const [notifications, setNotifications] =
    useState<AlertNotification[]>([]);

  const [alertsOpen, setAlertsOpen] =
    useState(false);

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  const refreshNotifications = async () => {
    if (!hasSession()) {
      setNotifications([]);
      return;
    }
    try {
      const response = await customerNotificationsApi.list(8);
      const payload: unknown = response?.data;
      const rawItems: unknown[] = Array.isArray(payload)
        ? payload
        : [];
      const prefs = loadPrefs();
      const readIds = loadReadIds();
      const mapped: AlertNotification[] = [];
      rawItems.forEach((entry) => {
        if (typeof entry !== "object" || entry === null) return;
        const row = entry as CustomerNotificationRow;
        const id = String(row.id ?? "");
        if (!id) return;
        if (!isTypeAllowed(row.type, prefs)) return;
        const title = String(row.title ?? "Notification").trim() || "Notification";
        const message =
          (typeof row.message === "string" && row.message.trim()) ||
          "You have a new update.";
        mapped.push({
          id,
          title,
          message,
          time: toRelativeTime(row.createdAt),
          read: row.isRead === true || readIds.has(id),
          link:
            typeof row.link === "string" && row.link.startsWith("/")
              ? row.link
              : undefined,
        });
      });
      setNotifications(mapped);
    } catch {
      // Bell stays empty rather than showing stale mock data.
      setNotifications([]);
    }
  };

  useEffect(() => {
    void refreshNotifications();
    const sync = () => {
      void refreshNotifications();
    };
    window.addEventListener(SESSION_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const closeAlerts = () => {
    setAlertsOpen(false);
  };

  const toggleAlerts = () => {
    setUserMenuOpen(false);
    setAlertsOpen((previous) => {
      if (!previous) void refreshNotifications();
      return !previous;
    });
  };

  const markAllAsRead = () => {
    const readIds = loadReadIds();
    notifications.forEach((item) => readIds.add(item.id));
    saveReadIds(readIds);
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true }))
    );
  };

  const markOneAsRead = (id: string) => {
    const readIds = loadReadIds();
    readIds.add(id);
    saveReadIds(readIds);
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  const openNotification = (item: AlertNotification) => {
    markOneAsRead(item.id);
    if (item.link) {
      closeAlerts();
      router.push(item.link);
    }
  };

  const viewAllAlerts = () => {
    closeAlerts();
    router.push("/alerts");
  };

  /* =========================================================
     LOAD LOGGED-IN USER
  ========================================================= */

  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser =
          localStorage.getItem(
            "aanzara_user"
          );

        if (!savedUser) {
          setUser(null);
          setUserLoaded(true);
          return;
        }

        const parsedUser: AanzaraUser =
          JSON.parse(savedUser);

        setUser(parsedUser);
      } catch (error) {
        console.error(
          "Failed to load Aanzara user:",
          error
        );

        setUser(null);
      } finally {
        setUserLoaded(true);
      }
    };

    /*
     * Load user when Header mounts.
     */
    loadUser();

    /*
     * Detect localStorage changes
     * from another browser tab.
     */
    const handleStorageChange = () => {
      loadUser();
    };

    /*
     * Detect profile changes
     * from the same browser tab.
     */
    const handleUserUpdated = () => {
      loadUser();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    window.addEventListener(
      "aanzara-user-updated",
      handleUserUpdated
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      window.removeEventListener(
        "aanzara-user-updated",
        handleUserUpdated
      );
    };
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = () => {
    const query =
      searchQuery.trim();

    if (!query) return;

    router.push(
      `/search?query=${encodeURIComponent(
        query
      )}`
    );

    setSearchQuery("");
  };

  const handleSearchKeyDown = (
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      handleSearch();
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    /*
     * Server logout best-effort, then central session clear
     * (tokens, cookies) so route guards engage.
     */
    try {
      const { authApi } = await import(
        "@/app/api/services"
      );
      await authApi.logout();
    } catch {
      // Local clear still applies below.
    }

    const { clearSession } = await import(
      "@/app/api/api"
    );
    clearSession();

    localStorage.removeItem(
      "aanzara_remember_me"
    );

    /*
     * Reset UI
     */
    setUser(null);

    setUserMenuOpen(false);

    /*
     * Redirect home
     */
    router.push("/");
  };

  /* =========================================================
     USER DISPLAY NAME
  ========================================================= */

  const displayName =
    user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Account";

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <header className="w-full border-b border-line bg-white">

      {/* =====================================================
          MAIN HEADER
      ===================================================== */}

      <div
        className="
          flex
          h-[58px]
          items-center
          gap-3
          px-4
          sm:h-[72px]
          sm:px-6
          lg:gap-6
        "
      >

        {/* ===================================================
            MOBILE MENU
        =================================================== */}

        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-navy
            hover:bg-[#F5F8FC]
            lg:hidden
          "
        >
          <Menu
            size={24}
            strokeWidth={1.8}
          />
        </button>

        {/* ===================================================
            LOGO
        =================================================== */}

        <Link
          href="/"
          className="
            shrink-0
            font-sora
            text-[22px]
            font-extrabold
            tracking-tight
            text-navy
            sm:text-[26px]
          "
        >
          Aanzara
        </Link>

        {/* ===================================================
            DESKTOP SEARCH
        =================================================== */}

        <div className="hidden max-w-[700px] flex-1 md:flex">

          <div
            className="
              flex
              h-[52px]
              flex-1
              items-center
              rounded-l-xl
              border
              border-line
              bg-white
              pl-4
            "
          >

            <Search
              size={19}
              className="shrink-0 text-[#64748B]"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              onKeyDown={
                handleSearchKeyDown
              }
              placeholder="Search products, brands, SKU, categories..."
              autoComplete="off"
              aria-label="Search products"
              className="
                w-full
                bg-transparent
                px-3
                py-2.5
                text-[14px]
                text-ink
                outline-none
                placeholder:text-[#8A99AD]
              "
            />

          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="
              h-[52px]
              rounded-r-xl
              bg-navy
              px-7
              text-[14px]
              font-semibold
              text-white
              hover:bg-navy-deep
            "
          >
            Search
          </button>

        </div>

        {/* ===================================================
            DESKTOP ACTIONS
        =================================================== */}

        <div
          className="
            ml-auto
            hidden
            shrink-0
            items-center
            gap-5
            lg:flex
          "
        >

          {/* =================================================
              WISHLIST
          ================================================= */}

          <Link
            href="/wishlist"
            aria-label={`Wishlist${
              wishlistCount > 0
                ? `, ${wishlistCount} items`
                : ""
            }`}
            className="
              relative
              flex
              flex-col
              items-center
              gap-0.5
              text-ink-soft
              transition-colors
              hover:text-navy
            "
          >

            <Heart
              size={20}
              className={
                wishlistCount > 0
                  ? "fill-red-500 text-red-500"
                  : ""
              }
            />

            {wishlistCount > 0 && (
              <span
                className="
                  absolute
                  -right-2
                  -top-2
                  flex
                  h-4
                  min-w-4
                  items-center
                  justify-center
                  rounded-full
                  bg-red-500
                  px-1
                  text-[9px]
                  font-bold
                  text-white
                "
              >
                {wishlistCount > 99
                  ? "99+"
                  : wishlistCount}
              </span>
            )}

            <span className="text-[10.5px]">
              Wishlist
            </span>

          </Link>

          {/* =================================================
              ALERTS
              Dynamic dropdown: the red dot only renders when
              unreadCount > 0. Data is live from
              GET /api/v1/notifications (order-derived feed);
              read state is shared via `aanzara-alerts-read`.
              "View all alerts" navigates to /alerts.
          ================================================= */}

          <div className="relative">

            <button
              type="button"
              onClick={toggleAlerts}
              aria-haspopup="menu"
              aria-expanded={alertsOpen}
              aria-label={`Alerts${
                unreadCount > 0
                  ? `, ${unreadCount} unread`
                  : ""
              }`}
              className="
                relative
                flex
                flex-col
                items-center
                gap-0.5
                text-ink-soft
                transition-colors
                hover:text-navy
              "
            >

              <Bell
                size={20}
                strokeWidth={1.7}
              />

              {unreadCount > 0 && (
                <span
                  className="
                    absolute
                    right-0
                    top-0
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-red-500
                    ring-2
                    ring-white
                  "
                  aria-hidden="true"
                />
              )}

              <span className="text-[10.5px]">
                Alerts
              </span>

            </button>

            {/* ===============================================
                ALERTS DROPDOWN
            =============================================== */}

            {alertsOpen && (
              <>
                {/* BACKDROP */}

                <button
                  type="button"
                  aria-label="Close alerts menu"
                  onClick={closeAlerts}
                  className="
                    fixed
                    inset-0
                    z-40
                    cursor-default
                  "
                />

                {/* PANEL */}

                <div
                  role="menu"
                  className="
                    absolute
                    right-0
                    top-[48px]
                    z-50
                    w-[340px]
                    overflow-hidden
                    rounded-xl
                    border
                    border-[#E2E7EE]
                    bg-white
                    shadow-xl
                  "
                >

                  {/* HEADER */}

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      border-b
                      border-[#EDF1F5]
                      px-4
                      py-3
                    "
                  >
                    <p className="text-[13px] font-bold text-[#33415A]">
                      Notifications
                    </p>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="
                          flex
                          items-center
                          gap-1
                          text-[11px]
                          font-semibold
                          text-[#1769F5]
                          hover:underline
                        "
                      >
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* LIST */}

                  <div className="max-h-[320px] overflow-y-auto">

                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-[12px] text-[#8A96A7]">
                          You're all caught up.
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, ALERTS_PREVIEW_COUNT).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openNotification(item)}
                          className={`
                            flex
                            w-full
                            items-start
                            gap-3
                            border-b
                            border-[#F1F4F8]
                            px-4
                            py-3
                            text-left
                            transition
                            hover:bg-[#F8FAFC]
                            ${
                              item.read
                                ? ""
                                : "bg-[#F5F9FF]"
                            }
                          `}
                        >
                          <span
                            className={`
                              mt-1.5
                              h-2
                              w-2
                              shrink-0
                              rounded-full
                              ${
                                item.read
                                  ? "bg-transparent"
                                  : "bg-[#1769F5]"
                              }
                            `}
                            aria-hidden="true"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-semibold text-[#33415A]">
                              {item.title}
                            </p>

                            <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[#71809B]">
                              {item.message}
                            </p>

                            <p className="mt-1 text-[10px] text-[#9AA5B4]">
                              {item.time}
                            </p>
                          </div>
                        </button>
                      ))
                    )}

                  </div>

                  {/* FOOTER */}

                  {notifications.length > ALERTS_PREVIEW_COUNT && (
                    <button
                      type="button"
                      onClick={viewAllAlerts}
                      className="
                        block
                        w-full
                        border-t
                        border-[#EDF1F5]
                        px-4
                        py-3
                        text-center
                        text-[12px]
                        font-semibold
                        text-[#1769F5]
                        hover:bg-[#F8FAFC]
                      "
                    >
                      View all alerts
                    </button>
                  )}

                </div>
              </>
            )}

          </div>

          {/* =================================================
              USER ACCOUNT
          ================================================= */}

          {!userLoaded ? (

            /* =================================================
               LOADING STATE
            ================================================= */

            <div
              className="
                flex
                items-center
                gap-2
                text-ink-soft
              "
            >

              <User size={20} />

              <span className="leading-tight">

                <span
                  className="
                    block
                    text-[10.5px]
                    text-ink-faint
                  "
                >
                  Welcome
                </span>

                <span
                  className="
                    block
                    text-[12.5px]
                    font-semibold
                    text-ink
                  "
                >
                  Sign In / Join
                </span>

              </span>

            </div>

          ) : !user ? (

            /* =================================================
               NOT LOGGED IN
            ================================================= */

            <Link
              href="/login"
              className="
                flex
                items-center
                gap-2
                text-ink-soft
                transition-colors
                hover:text-navy
              "
            >

              <User size={20} />

              <span className="leading-tight">

                <span
                  className="
                    block
                    text-[10.5px]
                    text-ink-faint
                  "
                >
                  Welcome
                </span>

                <span
                  className="
                    block
                    text-[12.5px]
                    font-semibold
                    text-ink
                  "
                >
                  Sign In / Join
                </span>

              </span>

            </Link>

          ) : (

            /* =================================================
               LOGGED IN
            ================================================= */

            <div className="relative">

              {/* =================================================
                  USER BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={() => {
                  setAlertsOpen(false);
                  setUserMenuOpen(
                    (previous) =>
                      !previous
                  );
                }}
                aria-expanded={
                  userMenuOpen
                }
                aria-haspopup="menu"
                className="
                  flex
                  items-center
                  gap-2
                  text-ink-soft
                  transition-colors
                  hover:text-navy
                "
              >

                <User
                  size={20}
                />

                <span className="leading-tight text-left">

                  <span
                    className="
                      block
                      text-[10.5px]
                      text-ink-faint
                    "
                  >
                    Welcome
                  </span>

                  <span
                    className="
                      flex
                      max-w-[145px]
                      items-center
                      gap-1
                      text-[12.5px]
                      font-semibold
                      text-ink
                    "
                  >

                    <span className="max-w-[125px] truncate">
                      {displayName}
                    </span>

                    <ChevronDown
                      size={13}
                      className={`
                        shrink-0
                        transition-transform
                        ${
                          userMenuOpen
                            ? "rotate-180"
                            : ""
                        }
                      `}
                    />

                  </span>

                </span>

              </button>

              {/* =================================================
                  USER DROPDOWN
              ================================================= */}

              {userMenuOpen && (
                <div
                  className="
                    absolute
                    right-0
                    top-[48px]
                    z-[9999]
                    w-[250px]
                    overflow-hidden
                    rounded-xl
                    border
                    border-[#E2E8F0]
                    bg-white
                    shadow-[0_15px_40px_rgba(15,35,70,0.18)]
                  "
                >

                  {/* =================================================
                      USER INFORMATION
                  ================================================= */}

                  <div
                    className="
                      border-b
                      border-[#EDF1F5]
                      p-4
                    "
                  >

                    <div className="flex items-center gap-3">

                      {/* AVATAR */}

                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-navy
                          text-sm
                          font-bold
                          text-white
                        "
                      >
                        {displayName
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      {/* USER DETAILS */}

                      <div className="min-w-0">

                        <p
                          className="
                            truncate
                            text-[14px]
                            font-bold
                            text-navy
                          "
                        >
                          {displayName}
                        </p>

                        {user.email && (
                          <p
                            className="
                              mt-0.5
                              truncate
                              text-[11px]
                              text-[#7B8799]
                            "
                          >
                            {user.email}
                          </p>
                        )}

                        {user.accountType && (
                          <p
                            className="
                              mt-1
                              text-[10px]
                              font-semibold
                              uppercase
                              tracking-wide
                              text-green
                            "
                          >
                            {user.accountType}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      MY DASHBOARD
                  ================================================= */}

                  <Link
                    href="/dashboard"
                    onClick={() =>
                      setUserMenuOpen(false)
                    }
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      text-[13px]
                      font-medium
                      text-ink
                      transition
                      hover:bg-[#F5F8FC]
                      hover:text-navy
                    "
                  >

                    <LayoutDashboard
                      size={17}
                      className="text-[#536B8D]"
                    />

                    My Dashboard

                  </Link>

                  {/* =================================================
                      MY PROFILE
                  ================================================= */}

                  <Link
                    href="/account/profile"
                    onClick={() =>
                      setUserMenuOpen(false)
                    }
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      text-[13px]
                      font-medium
                      text-ink
                      transition
                      hover:bg-[#F5F8FC]
                      hover:text-navy
                    "
                  >

                    <UserRound
                      size={17}
                      className="text-[#536B8D]"
                    />

                    My Profile

                  </Link>

                  {/* =================================================
                      MY ORDERS
                  ================================================= */}

                  <Link
                    href="/account/orders"
                    onClick={() =>
                      setUserMenuOpen(false)
                    }
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      text-[13px]
                      font-medium
                      text-ink
                      transition
                      hover:bg-[#F5F8FC]
                      hover:text-navy
                    "
                  >

                    <Package
                      size={17}
                      className="text-[#536B8D]"
                    />

                    My Orders

                  </Link>

                  {/* =================================================
                      LOGOUT
                  ================================================= */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      border-t
                      border-[#EDF1F5]
                      px-4
                      py-3
                      text-left
                      text-[13px]
                      font-semibold
                      text-red-600
                      transition
                      hover:bg-red-50
                    "
                  >

                    <LogOut
                      size={17}
                    />

                    Logout

                  </button>

                </div>
              )}

            </div>

          )}

          {/* =================================================
              CART
          ================================================= */}

          <Link
            href="/cart"
            aria-label={`Cart${
              totalUnits > 0
                ? `, ${totalUnits} items`
                : ""
            }`}
            className="
              relative
              text-ink-soft
              transition-colors
              hover:text-navy
            "
          >

            <ShoppingCart
              size={21}
            />

            {totalUnits > 0 && (
              <span
                className="
                  absolute
                  -right-2
                  -top-2
                  flex
                  h-4
                  min-w-4
                  items-center
                  justify-center
                  rounded-full
                  bg-green
                  px-1
                  text-[9px]
                  font-bold
                  text-white
                "
              >
                {totalUnits > 99
                  ? "99+"
                  : totalUnits}
              </span>
            )}

          </Link>

          {/* =================================================
              BULK QUOTE
          ================================================= */}

          <Link
            href="/contact"
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-green
              px-4
              py-2.5
              text-[13px]
              font-semibold
              text-white
              transition-colors
              hover:bg-green-deep
            "
          >

            <FileText
              size={15}
            />

            Bulk Quote

          </Link>

        </div>

        {/* ===================================================
            MOBILE ACTIONS
        =================================================== */}

        <div
          className="
            ml-auto
            flex
            items-center
            gap-2
            lg:hidden
          "
        >

          {/* =================================================
              MOBILE ALERTS
          ================================================= */}

          <Link
            href="/alerts"
            aria-label="View alerts"
            className="
              relative
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-[#D8E3F3]
              bg-white
              text-navy
              shadow-sm
              transition
              hover:bg-[#F5F8FC]
            "
          >

            <Bell
              size={22}
              strokeWidth={1.8}
            />

            {/* RED UNREAD DOT — live count, hidden when all read */}

            {unreadCount > 0 && (
              <span
                className="
                  absolute
                  right-[6px]
                  top-[5px]
                  h-2.5
                  w-2.5
                  rounded-full
                  bg-red-500
                  ring-2
                  ring-white
                "
                aria-hidden="true"
              />
            )}

          </Link>

          {/* =================================================
              MOBILE CART
          ================================================= */}

          <Link
            href="/cart"
            aria-label={`Cart${
              totalUnits > 0
                ? `, ${totalUnits} items`
                : ""
            }`}
            className="
              relative
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              text-navy
              hover:bg-[#F5F8FC]
            "
          >

            <ShoppingCart
              size={22}
            />

            {totalUnits > 0 && (
              <span
                className="
                  absolute
                  right-0
                  top-0
                  flex
                  h-4
                  min-w-4
                  items-center
                  justify-center
                  rounded-full
                  bg-green
                  px-1
                  text-[9px]
                  font-bold
                  text-white
                "
              >
                {totalUnits > 99
                  ? "99+"
                  : totalUnits}
              </span>
            )}

          </Link>

        </div>

      </div>

      {/* =====================================================
          MOBILE SEARCH
      ===================================================== */}

      <div
        className="
          border-t
          border-line
          px-3
          pb-3
          pt-2
          md:hidden
        "
      >

        <div
          className="
            flex
            h-[44px]
            items-center
            rounded-lg
            border
            border-line
            bg-white
            pl-3
          "
        >

          <Search
            size={17}
            className="text-[#64748B]"
          />

          <input
            type="search"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            onKeyDown={
              handleSearchKeyDown
            }
            placeholder="Search products, brands, SKU..."
            autoComplete="off"
            aria-label="Search products"
            className="
              w-full
              bg-transparent
              px-2.5
              text-[13px]
              outline-none
              placeholder:text-[#8A99AD]
            "
          />

          {searchQuery.trim() && (
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Submit search"
              className="
                mr-1
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-md
                bg-navy
                text-white
              "
            >
              <Search
                size={15}
              />
            </button>
          )}

        </div>

      </div>

    </header>
  );
}