"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  Settings,
  User,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useId,
  type KeyboardEvent,
} from "react";

type AdminHeaderProps = {
  onMenuClick?: () => void;
};

/* ============================================================
   LOGGED-IN ADMIN USER
   Same localStorage key/shape the storefront Header.tsx reads
   ("aanzara_user"), plus optional role fields — different auth
   responses have used different keys for this in the past, so
   we check a few and fall back gracefully if none are present.
============================================================ */

type AdminUser = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  accountType?: string;
};

const ROUTES = {
  admin: "/admin",
  dashboard: "/dashboard",
  products: "/admin/products",
  notifications: "/admin/notifications",
  profile: "/account/profile",
  roles: "/admin/roles",
  login: "/login",
} as const;

const MAX_SEARCH_LENGTH = 100;

function normalizeSearch(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidSearch(value: string): boolean {
  const query = normalizeSearch(value);

  return (
    query.length > 0 &&
    query.length <= MAX_SEARCH_LENGTH
  );
}

export default function AdminHeader({
  onMenuClick,
}: AdminHeaderProps) {
  const router = useRouter();
  const mobileSearchId = useId();

  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  /* ==========================================================
     LOAD LOGGED-IN ADMIN
  ========================================================== */

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem("aanzara_user");

        if (!savedUser) {
          setAdminUser(null);
          setUserLoaded(true);
          return;
        }

        const parsedUser: AdminUser = JSON.parse(savedUser);
        setAdminUser(parsedUser);
      } catch (error) {
        console.error("Failed to load admin user:", error);
        setAdminUser(null);
      } finally {
        setUserLoaded(true);
      }
    };

    // Initial load.
    loadUser();

    // Cross-tab localStorage changes.
    const handleStorageChange = () => loadUser();

    // Same-tab login/profile updates (dispatched by login/profile flows).
    const handleUserUpdated = () => loadUser();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("aanzara-user-updated", handleUserUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("aanzara-user-updated", handleUserUpdated);
    };
  }, []);

  const displayName =
    adminUser?.name?.trim() ||
    adminUser?.email?.split("@")[0] ||
    "Admin";

  const displayEmail = adminUser?.email || "";

  const displayRole =
    adminUser?.role?.trim() ||
    adminUser?.accountType?.trim() ||
    "Admin";

  /* ==========================================================
     SEARCH
  ========================================================== */

  const handleSearch = () => {
    const query = normalizeSearch(search);

    if (!isValidSearch(query)) {
      return;
    }

    router.push(
      `${ROUTES.products}?search=${encodeURIComponent(query)}`
    );

    setSearch("");
  };

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSearch("");
      event.currentTarget.blur();
    }
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  /**
   * Sign out: revoke the server session, clear the client session and the
   * middleware guard cookies, then hard-navigate to /login. Without the
   * clear, the guard cookie survives and the middleware bounces /login
   * straight back to /admin, so logout never visibly completes.
   */
  const handleAdminLogout = async () => {
    closeProfile();

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

    window.location.assign(ROUTES.login);
  };

  const handleMobileMenu = () => {
    onMenuClick?.();
  };

  const focusMobileSearch = () => {
    const element =
      document.getElementById(mobileSearchId);

    if (element instanceof HTMLInputElement) {
      element.focus();
    }
  };

  return (
    <header
      className="
        sticky top-0 z-40
        flex h-[70px] w-full items-center
        border-b border-[#E4E8EF]
        bg-white
        px-4
        shadow-sm
        sm:px-6
        lg:px-8
      "
    >

      {/* MOBILE MENU */}

      <button
        type="button"
        aria-label="Open admin menu"
        onClick={handleMobileMenu}
        className="
          mr-3 flex h-9 w-9 shrink-0
          items-center justify-center
          rounded-lg
          text-[#263A59]
          hover:bg-[#F2F5F9]
          lg:hidden
        "
      >
        <Menu size={21} />
      </button>

      {/* MOBILE LOGO */}

      <button
        type="button"
        onClick={() => router.push(ROUTES.admin)}
        aria-label="Go to admin dashboard"
        className="
          mr-4 flex items-center
          lg:hidden
        "
      >
        <div
          className="
            flex h-8 w-8 items-center justify-center
            rounded-lg bg-[#10265B]
            text-[12px] font-bold text-white
          "
        >
          A
        </div>

        <span
          className="
            ml-2 font-sora
            text-[15px] font-extrabold
            text-[#10265B]
          "
        >
          Aanzara
        </span>
      </button>

      {/* DESKTOP SEARCH */}

      <div className="hidden max-w-[500px] flex-1 md:flex">
        <div
          className="
            flex h-10 w-full items-center
            rounded-xl
            border border-[#E0E5EC]
            bg-[#F8FAFC]
            px-3
            focus-within:border-[#1769F5]
            focus-within:bg-white
          "
        >
          <Search
            size={17}
            className="shrink-0 text-[#8995A5]"
          />

          <input
            type="search"
            value={search}
            maxLength={MAX_SEARCH_LENGTH}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products, users, orders..."
            autoComplete="off"
            aria-label="Search admin"
            className="
              h-full w-full
              bg-transparent
              px-2.5
              text-[11px]
              text-[#33415A]
              outline-none
              placeholder:text-[#9AA5B4]
            "
          />

          {normalizeSearch(search) && (
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Search"
              className="
                flex h-7 w-7 shrink-0
                items-center justify-center
                rounded-lg
                bg-[#1769F5]
                text-white
                hover:bg-[#0F5BDE]
              "
            >
              <Search size={13} />
            </button>
          )}
        </div>
      </div>

      {/* MOBILE SEARCH */}

      <button
        type="button"
        onClick={focusMobileSearch}
        aria-label="Search"
        className="
          flex h-9 w-9
          items-center justify-center
          rounded-lg
          text-[#68778B]
          hover:bg-[#F2F5F9]
          md:hidden
        "
      >
        <Search size={19} />
      </button>

      {/* RIGHT SIDE */}

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">

        {/* =================================================
            VIEW SITE
            GOES DIRECTLY TO /dashboard
        ================================================= */}

        <Link
          href={ROUTES.dashboard}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View Dashboard"
          className="
            hidden h-10
            items-center gap-2
            rounded-lg
            border border-[#E0E5EC]
            bg-white
            px-4
            text-[11px]
            font-semibold
            text-[#33415A]
            transition
            hover:border-[#1769F5]
            hover:bg-[#F8FAFC]
            hover:text-[#1769F5]
            md:flex
          "
        >
          <ExternalLink size={15} />

          <span>
            View Site
          </span>
        </Link>

        {/* NOTIFICATIONS */}

        <button
          type="button"
          aria-label="Notifications"
          onClick={() =>
            router.push(
              ROUTES.notifications
            )
          }
          className="
            relative flex h-9 w-9
            items-center justify-center
            rounded-lg
            text-[#68778B]
            hover:bg-[#F2F5F9]
          "
        >
          <Bell size={18} />

          <span
            className="
              absolute -right-0.5 -top-0.5
              flex h-[17px] min-w-[17px]
              items-center justify-center
              rounded-full
              bg-[#EF4444]
              px-1
              text-[9px]
              font-bold
              text-white
            "
          >
            5
          </span>
        </button>

        {/* DIVIDER */}

        <div
          className="
            hidden h-7 w-px
            bg-[#E7EBF0]
            sm:block
          "
        />

        {/* PROFILE */}

        <div className="relative">

          <button
            type="button"
            onClick={() =>
              setProfileOpen(
                (current) => !current
              )
            }
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            className="
              flex items-center gap-2
              rounded-xl
              px-1.5 py-1.5
              hover:bg-[#F4F6F9]
            "
          >

            {/* AVATAR */}

            <div
              className="
                flex h-9 w-9 shrink-0
                items-center justify-center
                rounded-full
                bg-[#E5EEFF]
                text-[#1769F5]
              "
            >
              <User size={17} />
            </div>

            {/* USER */}

            <div className="hidden text-left lg:block">
              <p
                className="
                  max-w-[120px]
                  truncate
                  text-[10px]
                  font-bold
                  text-[#33415A]
                "
              >
                {userLoaded ? displayName : "Admin"}
              </p>

              <p
                className="
                  mt-0.5
                  text-[8px]
                  text-[#8B97A7]
                "
              >
                {userLoaded ? displayRole : "Super Admin"}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`
                hidden
                text-[#8995A5]
                transition-transform
                lg:block
                ${
                  profileOpen
                    ? "rotate-180"
                    : ""
                }
              `}
            />

          </button>

          {/* PROFILE DROPDOWN */}

          {profileOpen && (
            <>
              {/* BACKDROP */}

              <button
                type="button"
                aria-label="Close profile menu"
                onClick={closeProfile}
                className="
                  fixed inset-0 z-40
                  cursor-default
                "
              />

              {/* DROPDOWN */}

              <div
                role="menu"
                className="
                  absolute right-0 top-[48px]
                  z-50 w-[240px]
                  overflow-hidden
                  rounded-xl
                  border border-[#E2E7EE]
                  bg-white
                  shadow-xl
                "
              >

                {/* PROFILE INFO */}

                <div
                  className="
                    border-b
                    border-[#EDF0F4]
                    p-4
                  "
                >
                  <div
                    className="
                      flex items-center gap-3
                    "
                  >
                    <div
                      className="
                        flex h-11 w-11
                        items-center justify-center
                        rounded-full
                        bg-[#E5EEFF]
                        text-[#1769F5]
                      "
                    >
                      <User size={19} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          truncate
                          text-[11px]
                          font-bold
                          text-[#33415A]
                        "
                      >
                        {userLoaded ? displayName : "Admin"}
                      </p>

                      {displayEmail && (
                        <p
                          className="
                            mt-1 truncate
                            text-[9px]
                            text-[#8A96A7]
                          "
                        >
                          {displayEmail}
                        </p>
                      )}

                      <span
                        className="
                          mt-1.5 inline-flex
                          rounded-full
                          bg-[#EAF8EF]
                          px-2 py-0.5
                          text-[8px]
                          font-semibold
                          text-[#219653]
                        "
                      >
                        {userLoaded ? displayRole : "Super Admin"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* MENU */}

                <div className="p-2">

                  {/* PROFILE */}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeProfile();
                      router.push(
                        ROUTES.profile
                      );
                    }}
                    className="
                      flex h-10 w-full
                      items-center
                      rounded-lg
                      px-3
                      text-left
                      text-[#59687C]
                      hover:bg-[#F4F7FA]
                    "
                  >
                    <User size={15} />

                    <span className="ml-3 text-[10px] font-semibold">
                      My Profile
                    </span>
                  </button>

                  {/* ROLES */}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeProfile();
                      router.push(
                        ROUTES.roles
                      );
                    }}
                    className="
                      flex h-10 w-full
                      items-center
                      rounded-lg
                      px-3
                      text-left
                      text-[#59687C]
                      hover:bg-[#F4F7FA]
                    "
                  >
                    <Settings size={15} />

                    <span className="ml-3 text-[10px] font-semibold">
                      Roles &amp; Permissions
                    </span>
                  </button>

                  {/* VIEW SITE */}

                  <Link
                    href={ROUTES.dashboard}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    onClick={closeProfile}
                    className="
                      flex h-10 w-full
                      items-center
                      rounded-lg
                      px-3
                      text-left
                      text-[#59687C]
                      hover:bg-[#F4F7FA]
                    "
                  >
                    <ExternalLink size={15} />

                    <span className="ml-3 text-[10px] font-semibold">
                      View Site
                    </span>
                  </Link>

                </div>

                {/* LOGOUT */}

                <div
                  className="
                    border-t
                    border-[#EDF0F4]
                    p-2
                  "
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      void handleAdminLogout();
                    }}
                    className="
                      flex h-10 w-full
                      items-center
                      rounded-lg
                      px-3
                      text-left
                      text-[#D85A5A]
                      hover:bg-[#FFF3F3]
                    "
                  >
                    <LogOut size={15} />

                    <span className="ml-3 text-[10px] font-semibold">
                      Sign Out
                    </span>
                  </button>
                </div>

              </div>
            </>
          )}

        </div>
      </div>

      {/* MOBILE SEARCH INPUT */}

      <div
        className="
          absolute
          left-0 right-0
          top-[70px]
          hidden
          border-b
          border-[#E4E8EF]
          bg-white
          p-3
          md:hidden
        "
      >
        <div
          className="
            flex h-10
            items-center
            rounded-lg
            border border-[#DFE5ED]
            bg-[#F8FAFC]
            px-3
          "
        >
          <Search
            size={15}
            className="shrink-0 text-[#8995A5]"
          />

          <input
            id={mobileSearchId}
            type="search"
            value={search}
            maxLength={MAX_SEARCH_LENGTH}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products, orders..."
            autoComplete="off"
            className="
              w-full
              bg-transparent
              px-2
              text-[10px]
              outline-none
            "
          />

          {normalizeSearch(search) && (
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Search"
              className="
                flex h-7 w-7
                items-center justify-center
                rounded-lg
                bg-[#1769F5]
                text-white
              "
            >
              <Search size={13} />
            </button>
          )}
        </div>
      </div>

    </header>
  );
}
