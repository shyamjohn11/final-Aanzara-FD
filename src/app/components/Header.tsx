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
          ================================================= */}

          <Link
            href="/alerts"
            aria-label="View alerts"
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

            <span className="text-[10.5px]">
              Alerts
            </span>

          </Link>

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
                onClick={() =>
                  setUserMenuOpen(
                    (previous) =>
                      !previous
                  )
                }
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
                      px-4
                      py-4
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

            {/* RED UNREAD DOT */}

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