"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Heart,
  Bell,
  UserRound,
  MapPin,
  Package,
  LockKeyhole,
  LogOut,
  ChevronRight,
  ShoppingCart,
  Menu,
  X,
  Home,
  Phone,
  FileText,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type UserData = {
  name: string;
  email: string;
};

/* =========================================================
   ACCOUNT MENU
========================================================= */

const accountMenu = [
  {
    title: "My Profile",
    path: "/account/profile",
    icon: UserRound,
  },
  {
    title: "My Orders",
    path: "/account/orders",
    icon: Package,
  },
  {
    title: "Addresses",
    path: "/account/addresses",
    icon: MapPin,
  },
  {
    title: "Wishlist",
    path: "/account/wishlist",
    icon: Heart,
  },
  {
    title: "Alerts",
    path: "/account/alerts",
    icon: Bell,
  },
  {
    title: "Change Password",
    path: "/account/change-password",
    icon: LockKeyhole,
  },
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function WishlistPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserData>({
    name: "Sam",
    email: "sam@example.com",
  });

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {
    try {
      const profileData =
        localStorage.getItem("aanzara-profile");

      const userData =
        localStorage.getItem("user");

      let data: any = null;

      if (profileData) {
        data = JSON.parse(profileData);
      } else if (userData) {
        data = JSON.parse(userData);
      }

      if (data) {
        setUser({
          name:
            data.name ||
            data.fullName ||
            "Sam",

          email:
            data.email ||
            "sam@example.com",
        });
      }
    } catch (error) {
      console.error(
        "Unable to load user:",
        error
      );
    }
  }, []);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const goTo = (path: string) => {
    setMobileMenuOpen(false);
    router.push(path);
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    // Best-effort server logout, then the central session clear
    // (tokens + middleware guard cookies). Without the cookie clear
    // the edge guard keeps redirecting /login back into the app.
    try {
      const { authApi } = await import("@/app/api/services");
      await authApi.logout();
    } catch (error) {
      console.error("Server logout failed:", error);
    }

    try {
      const { clearSession } = await import("@/app/api/api");
      clearSession();
    } catch (error) {
      console.error("Unable to clear authentication:", error);
    }

    localStorage.removeItem("aanzara-profile");

    router.push("/login");
  };

  /* =======================================================
     INITIAL
  ======================================================= */

  const initial =
    user.name?.trim()?.charAt(0)?.toUpperCase() ||
    "S";

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#10265B]">

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <div className="hidden h-[42px] bg-[#10265B] text-white lg:block">

        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-7">

          {/* LEFT */}

          <div className="flex items-center gap-7 text-[13px]">

            <span className="flex items-center gap-2">
              <Phone size={14} />
              Toll Free: 1800-309-8080
            </span>

            <span className="flex items-center gap-2">
              <FileText size={14} />
              GST Compliant Invoicing
            </span>

          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-5 text-[13px]">

            <button
              type="button"
              onClick={() =>
                goTo("/wholesale")
              }
              className="hover:underline"
            >
              Track Wholesale Order
            </button>

            <span className="opacity-50">
              |
            </span>

            <button
              type="button"
              onClick={() =>
                goTo("/contact")
              }
              className="hover:underline"
            >
              Enterprise Support
            </button>

          </div>
        </div>
      </div>

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="border-b border-[#E5EAF1] bg-white">

        <div className="mx-auto flex h-[78px] max-w-[1600px] items-center gap-5 px-5 lg:px-7">

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(true)
            }
            className="flex h-10 w-10 items-center justify-center rounded-lg lg:hidden"
          >
            <Menu size={23} />
          </button>

          {/* LOGO */}

          <button
            type="button"
            onClick={() => goTo("/")}
            className="shrink-0 text-[30px] font-extrabold tracking-[-1.5px] text-[#10265B]"
          >
            Aanzara
          </button>

          {/* SEARCH */}

          <div className="hidden h-[55px] flex-1 overflow-hidden rounded-xl border border-[#DCE4EF] lg:flex">

            <button
              type="button"
              onClick={() =>
                goTo("/search")
              }
              className="flex flex-1 items-center gap-3 px-5 text-left"
            >
              <Search
                size={22}
                className="text-[#70809A]"
              />

              <span className="text-[16px] text-[#8B9AB0]">
                Search products, brands, SKU, categories...
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                goTo("/search")
              }
              className="w-[125px] bg-[#10265B] text-[16px] font-bold text-white"
            >
              Search
            </button>
          </div>

          {/* ACTIONS */}

          <div className="ml-auto flex items-center gap-5">

            {/* WISHLIST */}

            <button
              type="button"
              onClick={() =>
                goTo("/account/wishlist")
              }
              className="hidden flex-col items-center lg:flex"
            >
              <div className="relative">

                <Heart
                  size={24}
                  className="text-[#EF4444]"
                />

                <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
                  2
                </span>

              </div>

              <span className="mt-1 text-[11px] text-[#61718A]">
                Wishlist
              </span>
            </button>

            {/* ALERTS */}

            <button
              type="button"
              onClick={() =>
                goTo("/account/alerts")
              }
              className="hidden flex-col items-center lg:flex"
            >
              <div className="relative">

                <Bell
                  size={24}
                  className="text-[#60718C]"
                />

                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
                  2
                </span>

              </div>

              <span className="mt-1 text-[11px] text-[#61718A]">
                Alerts
              </span>
            </button>

            {/* ACCOUNT */}

            <button
              type="button"
              onClick={() =>
                goTo("/account")
              }
              className="hidden items-center gap-2 lg:flex"
            >

              <UserRound
                size={24}
                className="text-[#60718C]"
              />

              <div className="text-left leading-tight">

                <span className="block text-[11px] text-[#718096]">
                  Welcome
                </span>

                <span className="text-[14px] font-medium">
                  {user.name}
                </span>

              </div>

              <span className="text-[#60718C]">
               ⌄
              </span>

            </button>

            {/* CART */}

            <button
              type="button"
              onClick={() =>
                goTo("/cart")
              }
              className="relative hidden lg:block"
            >

              <ShoppingCart
                size={26}
                className="text-[#60718C]"
              />

              <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#16A34A] px-1 text-[10px] font-bold text-white">
                10
              </span>

            </button>

            {/* BULK QUOTE */}

            <button
              type="button"
              onClick={() =>
                goTo("/wholesale")
              }
              className="hidden h-[46px] rounded-lg bg-[#16A34A] px-5 text-[14px] font-bold text-white lg:block"
            >
              ▣ &nbsp; Bulk Quote
            </button>

          </div>
        </div>
      </header>

      {/* ===================================================
          MAIN NAVIGATION
      =================================================== */}

      <nav className="hidden border-b border-[#E5EAF1] bg-white lg:block">

        <div className="mx-auto flex h-[55px] max-w-[1600px] items-center gap-8 px-7">

          <NavItem
            title="Home"
            onClick={() => goTo("/")}
          />

          <NavItem
            title="Categories"
            onClick={() =>
              goTo("/categories")
            }
          />

          <NavItem
            title="Wholesale"
            onClick={() =>
              goTo("/wholesale")
            }
          />

          <NavItem
            title="Retail"
            onClick={() =>
              goTo("/retail")
            }
          />

          <NavItem
            title="Brands"
            onClick={() =>
              goTo("/brands")
            }
          />

          <NavItem
            title="Offers"
            onClick={() =>
              goTo("/offers")
            }
          />

          <NavItem
            title="New Arrivals"
            onClick={() =>
              goTo("/new-arrivals")
            }
          />

          <NavItem
            title="Business Solutions"
            onClick={() =>
              goTo("/business-solutions")
            }
          />

          <NavItem
            title="Contact"
            onClick={() =>
              goTo("/contact")
            }
          />

        </div>
      </nav>

      {/* ===================================================
          MOBILE MENU
      =================================================== */}

      <div
        className={`fixed inset-0 z-[100] lg:hidden ${
          mobileMenuOpen
            ? "visible"
            : "invisible"
        }`}
      >

        {/* OVERLAY */}

        <div
          onClick={() =>
            setMobileMenuOpen(false)
          }
          className={`absolute inset-0 bg-black/40 transition ${
            mobileMenuOpen
              ? "opacity-100"
              : "opacity-0"
          }`}
        />

        {/* DRAWER */}

        <aside
          className={`absolute left-0 top-0 h-full w-[310px] bg-white shadow-2xl transition-transform ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >

          <div className="flex h-[70px] items-center justify-between border-b px-5">

            <span className="text-[25px] font-extrabold">
              Aanzara
            </span>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F3F5F8]"
            >
              <X size={21} />
            </button>

          </div>

          <div className="p-4">

            <button
              type="button"
              onClick={() =>
                goTo("/search")
              }
              className="flex h-[48px] w-full items-center gap-3 rounded-lg border px-4"
            >
              <Search size={19} />

              <span className="text-sm text-[#8A98AB]">
                Search products...
              </span>
            </button>

          </div>

          <div className="border-t">

            <MobileNavItem
              title="Home"
              onClick={() => goTo("/")}
            />

            <MobileNavItem
              title="Categories"
              onClick={() =>
                goTo("/categories")
              }
            />

            <MobileNavItem
              title="Wholesale"
              onClick={() =>
                goTo("/wholesale")
              }
            />

            <MobileNavItem
              title="Retail"
              onClick={() =>
                goTo("/retail")
              }
            />

            <MobileNavItem
              title="Brands"
              onClick={() =>
                goTo("/brands")
              }
            />

            <MobileNavItem
              title="Offers"
              onClick={() =>
                goTo("/offers")
              }
            />

            <MobileNavItem
              title="Account"
              onClick={() =>
                goTo("/account")
              }
            />

          </div>
        </aside>
      </div>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="mx-auto flex w-full max-w-[1450px] gap-9 px-5 py-7 lg:px-7">

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="hidden w-[307px] shrink-0 rounded-[18px] border border-[#DCE5F0] bg-white px-4 py-7 lg:block">

          {/* USER */}

          <div className="flex flex-col items-center">

            <div className="flex h-[128px] w-[128px] items-center justify-center rounded-full bg-[#E6EFFF]">

              <span className="text-[43px] font-semibold text-[#1769F5]">
                {initial}
              </span>

            </div>

            <h2 className="mt-5 text-[25px] font-bold">
              {user.name}
            </h2>

            <p className="mt-1 text-[15px] text-[#718096]">
              {user.email}
            </p>

          </div>

          {/* MENU */}

          <div className="mt-7 space-y-1">

            {accountMenu.map(
              ({
                title,
                path,
                icon: Icon,
              }) => {

                const active =
                  pathname === path;

                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() =>
                      goTo(path)
                    }
                    className={`flex h-[52px] w-full items-center rounded-xl px-4 text-left transition ${
                      active
                        ? "border-l-[4px] border-[#1769F5] bg-[#EAF2FF] text-[#1769F5]"
                        : "text-[#10265B] hover:bg-[#F5F8FC]"
                    }`}
                  >

                    <Icon
                      size={23}
                      strokeWidth={1.9}
                    />

                    <span className="ml-4 text-[16px] font-semibold">
                      {title}
                    </span>

                  </button>
                );
              }
            )}

            {/* LOGOUT */}

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-[52px] w-full items-center rounded-xl px-4 text-left text-[#10265B] hover:bg-[#FFF5F5]"
            >

              <LogOut
                size={23}
                strokeWidth={1.9}
              />

              <span className="ml-4 text-[16px] font-semibold">
                Logout
              </span>

            </button>

          </div>
        </aside>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <section className="min-w-0 flex-1">

          {/* BREADCRUMB */}

          <div className="flex flex-wrap items-center gap-2 text-[14px]">

            <button
              type="button"
              onClick={() => goTo("/")}
              className="flex items-center gap-2 text-[#1769F5] hover:underline"
            >
              <Home size={17} />
              Home
            </button>

            <ChevronRight
              size={15}
              className="text-[#8391A5]"
            />

            <button
              type="button"
              onClick={() =>
                goTo("/account")
              }
              className="text-[#718096] hover:text-[#1769F5]"
            >
              My Account
            </button>

            <ChevronRight
              size={15}
              className="text-[#8391A5]"
            />

            <strong className="text-[#10265B]">
              My Wishlist
            </strong>

          </div>

          {/* TITLE */}

          <div className="mt-3">

            <h1 className="text-[32px] font-bold tracking-[-0.8px] text-[#10265B]">
              My Wishlist
            </h1>

            <p className="mt-1 text-[16px] text-[#718096]">
              Your saved products will appear here.
            </p>

          </div>

          {/* =================================================
              WISHLIST CARD
          ================================================= */}

          <div className="mt-4 overflow-hidden rounded-[18px] border border-[#DDE6F0] bg-white">

            {/* EMPTY AREA */}

            <div className="flex min-h-[340px] flex-col items-center justify-center px-5 py-10 text-center">

              {/* HEART */}

              <div className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-[#FFF0F4]">

                <Heart
                  size={54}
                  strokeWidth={1.7}
                  className="text-[#EF476F]"
                />

              </div>

              {/* TITLE */}

              <h2 className="mt-5 text-[24px] font-bold text-[#10265B]">
                Your Wishlist is Empty
              </h2>

              {/* DESCRIPTION */}

              <p className="mt-2 text-[16px] leading-6 text-[#718096]">
                Save your favorite products and
                <br />
                shop them anytime.
              </p>

              {/* BUTTON */}

              <button
                type="button"
                onClick={() => goTo("/")}
                className="mt-5 flex h-[57px] items-center gap-3 rounded-xl bg-[#1769F5] px-7 text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(23,105,245,0.18)] transition hover:bg-[#0F5DDF]"
              >

                <ShoppingCart
                  size={21}
                />

                Browse Products

              </button>

            </div>

            {/* =================================================
                DIVIDER
            ================================================= */}

            <div className="mx-7 border-t border-[#E5EAF1]" />

            {/* =================================================
                FEATURES
            ================================================= */}

            <div className="grid grid-cols-1 gap-8 px-8 py-7 md:grid-cols-3">

              <Feature
                icon={
                  <Heart
                    size={26}
                    strokeWidth={1.7}
                  />
                }
                iconStyle="bg-[#E8F1FF] text-[#1769F5]"
                title="Save Products"
                description={
                  <>
                    Keep your favorite items
                    <br />
                    in one place.
                  </>
                }
              />

              <Feature
                icon={
                  <ShoppingCart
                    size={26}
                    strokeWidth={1.7}
                  />
                }
                iconStyle="bg-[#E5F8ED] text-[#16A34A]"
                title="Easy Checkout"
                description={
                  <>
                    Shop faster with your
                    <br />
                    saved products.
                  </>
                }
              />

              <Feature
                icon={
                  <Bell
                    size={26}
                    strokeWidth={1.7}
                  />
                }
                iconStyle="bg-[#F3E9FF] text-[#8B3DFF]"
                title="Get Notified"
                description={
                  <>
                    Be the first to know about
                    <br />
                    price drops and offers.
                  </>
                }
              />

            </div>
          </div>
        </section>
      </main>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="mt-auto border-t border-[#E3E8EF] bg-white">

        <div className="mx-auto flex min-h-[100px] max-w-[1450px] items-center justify-between px-7">

          <div className="flex items-center gap-4">

            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#10265B] text-[21px] font-semibold text-white">
              A
            </div>

            <p className="text-[13px] leading-5 text-[#718096]">
              Aanzara — Shop More.
              <br />
              Live Better.
            </p>

          </div>

          <div className="hidden items-center gap-5 text-[14px] text-[#718096] md:flex">

            <button
              type="button"
              className="hover:text-[#1769F5]"
            >
              Help
            </button>

            <span className="text-[#CBD5E1]">
              |
            </span>

            <button
              type="button"
              className="hover:text-[#1769F5]"
            >
              Privacy
            </button>

            <span className="text-[#CBD5E1]">
              |
            </span>

            <button
              type="button"
              className="hover:text-[#1769F5]"
            >
              Terms
            </button>

          </div>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================
   NAV ITEM
========================================================= */

function NavItem({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap text-[15px] font-medium text-[#52627A] transition hover:text-[#1769F5]"
    >
      {title}
    </button>
  );
}

/* =========================================================
   MOBILE NAV ITEM
========================================================= */

function MobileNavItem({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[52px] w-full items-center justify-between border-b border-[#EEF1F5] px-5 text-left text-[15px] font-medium text-[#10265B]"
    >
      {title}

      <ChevronRight size={17} />
    </button>
  );
}

/* =========================================================
   FEATURE
========================================================= */

function Feature({
  icon,
  iconStyle,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconStyle: string;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">

      <div
        className={`flex h-[57px] w-[57px] shrink-0 items-center justify-center rounded-full ${iconStyle}`}
      >
        {icon}
      </div>

      <div>

        <h3 className="text-[16px] font-bold text-[#10265B]">
          {title}
        </h3>

        <p className="mt-1 text-[14px] leading-5 text-[#718096]">
          {description}
        </p>

      </div>
    </div>
  );
}