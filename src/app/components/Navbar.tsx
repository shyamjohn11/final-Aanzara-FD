"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound, LogOut, ChevronDown } from "lucide-react";

type User = {
  id?: string;
  name?: string;
  email?: string;
  accountType?: "customer" | "business";
};

const USER_STORAGE_KEY = "aanzara_user";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  /* =========================
     LOAD USER
  ========================= */

  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser =
          localStorage.getItem(USER_STORAGE_KEY);

        if (!savedUser) {
          setUser(null);
          return;
        }

        const parsedUser: User = JSON.parse(savedUser);

        if (parsedUser && typeof parsedUser === "object") {
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error(
          "Unable to load user:",
          error
        );

        setUser(null);
      }
    };

    // Initial load
    loadUser();

    // Cross-tab localStorage changes
    window.addEventListener(
      "storage",
      loadUser
    );

    // Same-tab login/logout changes
    window.addEventListener(
      "aanzara-auth-change",
      loadUser
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadUser
      );

      window.removeEventListener(
        "aanzara-auth-change",
        loadUser
      );
    };
  }, []);

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = async () => {
    try {
      setUser(null);
      setShowMenu(false);

      // Notify other same-page components
      window.dispatchEvent(
        new Event("aanzara-auth-change")
      );

      // Central logout replaces history so Back cannot return here.
      const { logoutAndRedirect } = await import(
        "@/app/api/api"
      );
      await logoutAndRedirect("/login");
    } catch (error) {
      console.error(
        "Unable to logout:",
        error
      );
    }
  };

  /* =========================
     USER DISPLAY NAME
  ========================= */

  const displayName =
    user?.name ||
    user?.email ||
    "User";

  return (
    <nav
      className="
        flex
        h-[70px]
        items-center
        justify-between
        border-b
        border-gray-200
        bg-white
        px-6
      "
    >
      {/* =========================
          LOGO
      ========================= */}

      <Link
        href="/"
        className="
          text-2xl
          font-bold
          text-[#1748B5]
        "
      >
        Aanzara
      </Link>

      {/* =========================
          RIGHT SIDE
      ========================= */}

      <div className="relative flex items-center">
        {user ? (
          /* =========================
             LOGGED IN
          ========================= */

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowMenu(
                  (value) => !value
                )
              }
              aria-expanded={showMenu}
              aria-haspopup="menu"
              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-2
                transition
                hover:bg-gray-50
              "
            >
              {/* USER AVATAR */}

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-[#1748B5]
                  text-white
                "
              >
                <UserRound size={20} />
              </div>

              {/* USER NAME */}

              <div className="hidden text-left sm:block">
                <p className="text-[11px] text-gray-500">
                  Welcome
                </p>

                <p
                  className="
                    max-w-[150px]
                    truncate
                    text-sm
                    font-bold
                    text-[#122447]
                  "
                >
                  {displayName}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`
                  hidden
                  text-gray-400
                  transition-transform
                  sm:block
                  ${
                    showMenu
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {/* =========================
                DROPDOWN
            ========================= */}

            {showMenu && (
              <>
                {/* Outside click layer */}

                <button
                  type="button"
                  aria-label="Close user menu"
                  onClick={() =>
                    setShowMenu(false)
                  }
                  className="
                    fixed
                    inset-0
                    z-40
                    cursor-default
                  "
                />

                <div
                  role="menu"
                  className="
                    absolute
                    right-0
                    top-[58px]
                    z-50
                    w-[240px]
                    overflow-hidden
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    shadow-xl
                  "
                >
                  {/* USER INFO */}

                  <div
                    className="
                      border-b
                      border-gray-100
                      bg-gray-50
                      px-4
                      py-3
                    "
                  >
                    <p className="text-sm font-bold text-[#122447]">
                      {user.name ||
                        "User"}
                    </p>

                    {user.email && (
                      <p
                        className="
                          mt-1
                          truncate
                          text-xs
                          text-gray-500
                        "
                      >
                        {user.email}
                      </p>
                    )}

                    {user.accountType && (
                      <span
                        className="
                          mt-2
                          inline-block
                          rounded-md
                          bg-[#F1F5FF]
                          px-2
                          py-1
                          text-[10px]
                          font-bold
                          uppercase
                          text-[#1748B5]
                        "
                      >
                        {user.accountType}
                      </span>
                    )}
                  </div>

                  {/* PROFILE */}

                  <Link
                    href="/account/profile"
                    onClick={() =>
                      setShowMenu(false)
                    }
                    role="menuitem"
                    className="
                      block
                      px-4
                      py-3
                      text-sm
                      text-gray-700
                      transition
                      hover:bg-gray-50
                    "
                  >
                    Profile
                  </Link>

                  {/* ORDERS */}

                  <Link
                    href="/orders"
                    onClick={() =>
                      setShowMenu(false)
                    }
                    role="menuitem"
                    className="
                      block
                      px-4
                      py-3
                      text-sm
                      text-gray-700
                      transition
                      hover:bg-gray-50
                    "
                  >
                    My Orders
                  </Link>

                  {/* ACCOUNT */}

                  <Link
                    href="/account"
                    onClick={() =>
                      setShowMenu(false)
                    }
                    role="menuitem"
                    className="
                      block
                      px-4
                      py-3
                      text-sm
                      text-gray-700
                      transition
                      hover:bg-gray-50
                    "
                  >
                    Account Settings
                  </Link>

                  {/* LOGOUT */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    role="menuitem"
                    className="
                      flex
                      w-full
                      items-center
                      gap-2
                      border-t
                      border-gray-100
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-semibold
                      text-red-600
                      transition
                      hover:bg-red-50
                    "
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* =========================
             NOT LOGGED IN
          ========================= */

          <Link
            href="/login"
            className="
              flex
              items-center
              gap-2
              rounded-lg
              px-4
              py-2
              text-sm
              font-bold
              text-[#1748B5]
              transition
              hover:bg-[#F1F5FF]
            "
          >
            <UserRound size={19} />

            <span>
              Sign In / Join
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}