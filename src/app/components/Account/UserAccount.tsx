"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserRound,
  ChevronDown,
  LayoutDashboard,
  User,
  Package,
  LogOut,
} from "lucide-react";
import { authApi } from "@/app/api/services";
import { hasSession } from "@/app/api/api";

/* =========================================================
   TYPES
========================================================= */

type AanzaraUser = {
  id?: string | number;
  name?: string;
  mobile?: string;
  email?: string;
  accountType?: string;
  loginMethod?: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function UserAccount() {
  const [user, setUser] = useState<AanzaraUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {
    setMounted(true);
    let cancelled = false;

    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem(
          "aanzara_user"
        );

        if (!savedUser) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const parsedUser: AanzaraUser =
          JSON.parse(savedUser);

        if (!cancelled) {
          setUser(parsedUser);
        }
      } catch (error) {
        console.error(
          "Failed to load Aanzara user:",
          error
        );

        if (!cancelled) {
          setUser(null);
        }
      }
    };

    loadUser();

    // Refresh from the live profile when logged in.
    if (hasSession()) {
      authApi
        .me()
        .then(({ data }) => {
          if (cancelled) {
            return;
          }

          setUser({
            id: data.userId,
            name: data.name,
            mobile: data.phone ?? undefined,
            email: data.email,
            accountType:
              data.roles[0] ?? "customer",
            loginMethod: "email",
          });
        })
        .catch(() => {
          // Keep the cached user on failure.
        });
    }

    /* =====================================================
       LISTEN FOR STORAGE CHANGES
    ===================================================== */

    const handleStorageChange = () => {
      loadUser();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  /* =======================================================
     LOGOUT (central session clear so route guards engage)
  ======================================================= */

  const handleLogout = async () => {
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

    setUser(null);
    setOpen(false);

    window.location.href = "/login";
  };

  /* =======================================================
     HYDRATION SAFE UI
  ======================================================= */

  if (!mounted) {
    return (
      <Link
        href="/login"
        className="hidden items-center gap-2 sm:flex"
      >
        <UserRound
          size={23}
          className="shrink-0 text-[#536b8d]"
        />

        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] text-[#71809a]">
            Welcome
          </span>

          <span className="mt-1 whitespace-nowrap text-[14px] font-semibold text-[#102c5d]">
            Sign In / Join
          </span>
        </div>
      </Link>
    );
  }

  /* =======================================================
     NOT LOGGED IN
  ======================================================= */

  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden items-center gap-2 sm:flex"
      >
        <UserRound
          size={23}
          className="shrink-0 text-[#536b8d]"
        />

        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] text-[#71809a]">
            Welcome
          </span>

          <span className="mt-1 whitespace-nowrap text-[14px] font-semibold text-[#102c5d]">
            Sign In / Join
          </span>
        </div>
      </Link>
    );
  }

  /* =======================================================
     DISPLAY NAME
  ======================================================= */

  const displayName =
    user.name?.trim() ||
    user.email?.split("@")[0] ||
    "Account";

  /* =======================================================
     LOGGED IN
  ======================================================= */

  return (
    <div className="relative hidden sm:block">
      {/* ===================================================
          USER BUTTON
      =================================================== */}

      <button
        type="button"
        onClick={() =>
          setOpen((previous) => !previous)
        }
        className="flex items-center gap-2"
      >
        <UserRound
          size={23}
          className="shrink-0 text-[#536b8d]"
        />

        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] text-[#71809a]">
            Welcome
          </span>

          <span className="mt-1 flex max-w-[135px] items-center gap-1 whitespace-nowrap text-[14px] font-semibold text-[#102c5d]">
            <span className="max-w-[115px] truncate">
              {displayName}
            </span>

            <ChevronDown
              size={13}
              className={`shrink-0 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </span>
        </div>
      </button>

      {/* ===================================================
          DROPDOWN
      =================================================== */}

      {open && (
        <div className="absolute right-0 top-[45px] z-[9999] w-[245px] overflow-hidden rounded-xl border border-[#dfe6ef] bg-white shadow-[0_15px_40px_rgba(10,35,75,0.18)]">

          {/* USER HEADER */}
          <div className="border-b border-[#edf1f5] px-4 py-4">
            <div className="flex items-center gap-3">

              {/* AVATAR */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#102c5d] text-base font-bold text-white">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              {/* USER INFO */}
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-[#102c5d]">
                  {displayName}
                </p>

                {user.email && (
                  <p className="mt-0.5 truncate text-[11px] text-[#7b8799]">
                    {user.email}
                  </p>
                )}

                {user.accountType && (
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#16a34a]">
                    {user.accountType}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              DASHBOARD
          ================================================= */}

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#34445d] transition hover:bg-[#f5f8fc] hover:text-[#102c5d]"
          >
            <LayoutDashboard
              size={17}
              className="text-[#536b8d]"
            />

            My Dashboard
          </Link>

          {/* =================================================
              PROFILE
          ================================================= */}

          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#34445d] transition hover:bg-[#f5f8fc] hover:text-[#102c5d]"
          >
            <User
              size={17}
              className="text-[#536b8d]"
            />

            My Profile
          </Link>

          {/* =================================================
              ORDERS
          ================================================= */}

          <Link
            href="/dashboard/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#34445d] transition hover:bg-[#f5f8fc] hover:text-[#102c5d]"
          >
            <Package
              size={17}
              className="text-[#536b8d]"
            />

            My Orders
          </Link>

          {/* =================================================
              LOGOUT
          ================================================= */}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 border-t border-[#edf1f5] px-4 py-3 text-left text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={17} />

            Logout
          </button>
        </div>
      )}
    </div>
  );
}