"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Heart,
  Bell,
  UserRound,
  Search,
  Home,
  Grid2X2,
  ShoppingBag,
  Store,
  Tag,
  Sparkles,
  BriefcaseBusiness,
  Phone,
  CircleHelp,
  Settings,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export default function MobileMenu({
  open,
  onClose,
}: MobileMenuProps) {
  const router = useRouter();

  const [categoriesOpen, setCategoriesOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  /* =========================
     SEARCH
  ========================= */

  const handleSearch = () => {
    const query = searchQuery.trim();

    if (!query) return;

    onClose();

    setSearchQuery("");

    router.push(
      `/search?query=${encodeURIComponent(query)}`
    );
  };

  const handleSearchKeyDown = (
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  /* =========================
     CLOSE + NAVIGATION
  ========================= */

  const handleNavigation = () => {
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* =========================
          OVERLAY
      ========================= */}

      <div
        className="fixed inset-0 z-[9998] bg-navy/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* =========================
          DRAWER
      ========================= */}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        className="
          fixed
          left-0
          top-0
          z-[9999]
          flex
          h-[100dvh]
          w-[350px]
          max-w-[92vw]
          flex-col
          overflow-hidden
          glass-strong
          shadow-pop
          md:hidden
        "
      >
        {/* =========================
            HEADER
        ========================= */}

        <div
          className="
            flex
            h-[82px]
            shrink-0
            items-center
            justify-between
            border-b
            border-line
            px-6
          "
        >
          <Link
            href="/"
            onClick={handleNavigation}
            className="
              font-sora
              text-[25px]
              font-extrabold
              tracking-[-0.5px]
              text-navy
            "
          >
            Aanzara
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              text-ink-soft
              transition-colors
              hover:bg-paper
              hover:text-blue
            "
          >
            <X
              size={25}
              strokeWidth={1.8}
            />
          </button>
        </div>

        {/* =========================
            SCROLL AREA
        ========================= */}

        <div className="flex-1 overflow-y-auto">
          {/* =========================
              SEARCH
          ========================= */}

          <div
            className="
              border-b
              border-[#e5e7eb]
              px-5
              py-4
            "
          >
            <div
              className="
                flex
                h-[46px]
                items-center
                rounded-xl
                border
                border-[#d9e0e9]
                bg-[#f8fafc]
                px-4
              "
            >
              <Search
                size={19}
                className="mr-3 shrink-0 text-[#71839d]"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                onKeyDown={handleSearchKeyDown}
                placeholder="Search products..."
                autoComplete="off"
                aria-label="Search products"
                className="
                  w-full
                  bg-transparent
                  text-[14px]
                  text-[#111827]
                  outline-none
                  placeholder:text-[#8a99ad]
                "
              />

              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={handleSearch}
                  aria-label="Search"
                  className="
                    ml-2
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-[#12346b]
                    text-white
                  "
                >
                  <Search size={15} />
                </button>
              )}
            </div>
          </div>

          {/* =========================
              QUICK ACTIONS
          ========================= */}

          <div className="grid grid-cols-3 border-b border-[#e5e7eb]">
            {/* WISHLIST */}

            <Link
              href="/wishlist"
              onClick={handleNavigation}
              className="
                flex
                min-h-[88px]
                flex-col
                items-center
                justify-center
                gap-2
                border-r
                border-[#e5e7eb]
                text-[#58708f]
                hover:bg-[#f8fafc]
              "
            >
              <Heart
                size={23}
                strokeWidth={1.7}
              />

              <span className="text-[13px]">
                Wishlist
              </span>
            </Link>

            {/* ALERTS */}

            <button
              type="button"
              onClick={handleNavigation}
              className="
                flex
                min-h-[88px]
                flex-col
                items-center
                justify-center
                gap-2
                border-r
                border-[#e5e7eb]
                text-[#58708f]
                hover:bg-[#f8fafc]
              "
            >
              <Bell
                size={23}
                strokeWidth={1.7}
              />

              <span className="text-[13px]">
                Alerts
              </span>
            </button>

            {/* SIGN IN */}

            <Link
              href="/login"
              onClick={handleNavigation}
              className="
                flex
                min-h-[88px]
                flex-col
                items-center
                justify-center
                gap-2
                text-[#58708f]
                hover:bg-[#f8fafc]
              "
            >
              <UserRound
                size={23}
                strokeWidth={1.7}
              />

              <span className="text-[13px]">
                Sign In
              </span>
            </Link>
          </div>

          {/* =========================
              NAVIGATION
          ========================= */}

          <nav
            className="px-4 py-4"
            aria-label="Mobile navigation"
          >
            {/* HOME */}

            <Link
              href="/"
              onClick={handleNavigation}
              className="
                flex
                min-h-[52px]
                items-center
                rounded-xl
                px-2
                text-[16px]
                font-medium
                text-[#506a8b]
                hover:bg-[#f5f8fc]
              "
            >
              <Home
                size={20}
                className="mr-4"
                strokeWidth={1.8}
              />

              Home
            </Link>

            {/* =========================
                CATEGORIES
            ========================= */}

            <button
              type="button"
              onClick={() =>
                setCategoriesOpen(
                  (previous) => !previous
                )
              }
              aria-expanded={categoriesOpen}
              className="
                mt-1
                flex
                min-h-[52px]
                w-full
                items-center
                rounded-xl
                px-2
                text-left
                text-[16px]
                font-semibold
                text-[#111827]
                hover:bg-[#f5f8fc]
              "
            >
              <Grid2X2
                size={20}
                className="mr-4 text-[#506a8b]"
                strokeWidth={1.8}
              />

              <span className="flex-1">
                Categories
              </span>

              {categoriesOpen ? (
                <ChevronDown
                  size={19}
                  className="text-[#2d63d7]"
                />
              ) : (
                <ChevronRight
                  size={19}
                  className="text-[#2d63d7]"
                />
              )}
            </button>

            {/* CATEGORY LIST */}

            {categoriesOpen && (
              <div
                className="
                  ml-10
                  mt-1
                  rounded-xl
                  bg-[#f7f9fc]
                  px-3
                  py-2
                "
              >
                <Link
                  href="/categories"
                  onClick={handleNavigation}
                  className="
                    flex
                    min-h-[42px]
                    items-center
                    text-[14px]
                    text-[#506a8b]
                  "
                >
                  All Categories
                </Link>

                <Link
                  href="/categories"
                  onClick={handleNavigation}
                  className="
                    flex
                    min-h-[42px]
                    items-center
                    justify-between
                    text-[14px]
                    text-[#506a8b]
                  "
                >
                  Electronics
                  <ChevronRight size={16} />
                </Link>

                <Link
                  href="/categories"
                  onClick={handleNavigation}
                  className="
                    flex
                    min-h-[42px]
                    items-center
                    justify-between
                    text-[14px]
                    text-[#506a8b]
                  "
                >
                  Fashion
                  <ChevronRight size={16} />
                </Link>

                <Link
                  href="/categories"
                  onClick={handleNavigation}
                  className="
                    flex
                    min-h-[42px]
                    items-center
                    justify-between
                    text-[14px]
                    text-[#506a8b]
                  "
                >
                  Grocery
                  <ChevronRight size={16} />
                </Link>

                <Link
                  href="/categories"
                  onClick={handleNavigation}
                  className="
                    flex
                    min-h-[42px]
                    items-center
                    justify-between
                    text-[14px]
                    text-[#506a8b]
                  "
                >
                  Home & Kitchen
                  <ChevronRight size={16} />
                </Link>

                <Link
                  href="/categories"
                  onClick={handleNavigation}
                  className="
                    flex
                    min-h-[42px]
                    items-center
                    justify-between
                    text-[14px]
                    text-[#506a8b]
                  "
                >
                  Beauty
                  <ChevronRight size={16} />
                </Link>
              </div>
            )}

            {/* =========================
                WHOLESALE
            ========================= */}

            <Link
              href="/wholesale"
              onClick={handleNavigation}
              className="
                mt-1
                flex
                min-h-[52px]
                items-center
                rounded-xl
                px-2
                text-[16px]
                font-medium
                text-[#506a8b]
                hover:bg-[#f5f8fc]
              "
            >
              <ShoppingBag
                size={20}
                className="mr-4"
                strokeWidth={1.8}
              />

              <span className="flex-1">
                Wholesale
              </span>

              <ChevronRight size={18} />
            </Link>

            {/* WHOLESALE DASHBOARD */}

            <Link
              href="/wholesale/dashboard"
              onClick={handleNavigation}
              className="
                ml-10
                flex
                min-h-[45px]
                items-center
                rounded-lg
                px-3
                text-[14px]
                font-medium
                text-[#2d63d7]
                hover:bg-[#eef4ff]
              "
            >
              <LayoutDashboard
                size={17}
                className="mr-3"
                strokeWidth={1.8}
              />

              Wholesale Dashboard
            </Link>

            {/* =========================
                RETAIL
            ========================= */}

            <Link
              href="/retail"
              onClick={handleNavigation}
              className="
                mt-1
                flex
                min-h-[52px]
                items-center
                rounded-xl
                px-2
                text-[16px]
                font-medium
                text-[#506a8b]
                hover:bg-[#f5f8fc]
              "
            >
              <Store
                size={20}
                className="mr-4"
                strokeWidth={1.8}
              />

              <span className="flex-1">
                Retail
              </span>

              <ChevronRight size={18} />
            </Link>

            {/* =========================
                BRANDS
            ========================= */}

            <Link
              href="/brands"
              onClick={handleNavigation}
              className="
                mt-1
                flex
                min-h-[52px]
                items-center
                rounded-xl
                px-2
                text-[16px]
                font-medium
                text-[#506a8b]
                hover:bg-[#f5f8fc]
              "
            >
              <Tag
                size={20}
                className="mr-4"
                strokeWidth={1.8}
              />

              <span className="flex-1">
                Brands
              </span>

              <ChevronRight size={18} />
            </Link>

            {/* =========================
                OFFERS
            ========================= */}

            <Link
              href="/offers"
              onClick={handleNavigation}
              className="
                mt-1
                flex
                min-h-[52px]
                items-center
                rounded-xl
                px-2
                text-[16px]
                font-medium
                text-[#506a8b]
                hover:bg-[#f5f8fc]
              "
            >
              <Tag
                size={20}
                className="mr-4"
                strokeWidth={1.8}
              />

              <span className="flex-1">
                Offers
              </span>

              <span
                className="
                  flex
                  h-6
                  min-w-6
                  items-center
                  justify-center
                  rounded-full
                  bg-[#eaf1ff]
                  px-2
                  text-[11px]
                  font-bold
                  text-[#2d63d7]
                "
              >
                3
              </span>
            </Link>

            {/* =========================
                NEW ARRIVALS
            ========================= */}

            <Link
              href="/new-arrivals"
              onClick={handleNavigation}
              className="
                mt-1
                flex
                min-h-[52px]
                items-center
                rounded-xl
                px-2
                text-[16px]
                font-medium
                text-[#506a8b]
                hover:bg-[#f5f8fc]
              "
            >
              <Sparkles
                size={20}
                className="mr-4"
                strokeWidth={1.8}
              />

              <span className="flex-1">
                New Arrivals
              </span>

              <span
                className="
                  rounded-md
                  bg-[#edf5ff]
                  px-2
                  py-1
                  text-[10px]
                  font-bold
                  text-[#2d63d7]
                "
              >
                NEW
              </span>
            </Link>

            {/* =========================
                BUSINESS SOLUTIONS
            ========================= */}

            <Link
              href="/business-solutions"
              onClick={handleNavigation}
              className="
                mt-1
                flex
                min-h-[52px]
                items-center
                rounded-xl
                px-2
                text-[16px]
                font-medium
                text-[#506a8b]
                hover:bg-[#f5f8fc]
              "
            >
              <BriefcaseBusiness
                size={20}
                className="mr-4"
                strokeWidth={1.8}
              />

              Business Solutions
            </Link>

            {/* =========================
                CONTACT
            ========================= */}

            <Link
              href="/contact"
              onClick={handleNavigation}
              className="
                mt-1
                flex
                min-h-[52px]
                items-center
                rounded-xl
                px-2
                text-[16px]
                font-medium
                text-[#506a8b]
                hover:bg-[#f5f8fc]
              "
            >
              <Phone
                size={20}
                className="mr-4"
                strokeWidth={1.8}
              />

              Contact
            </Link>

            {/* =========================
                HELP
            ========================= */}

            <Link
              href="/"
              onClick={handleNavigation}
              className="
                mt-1
                flex
                min-h-[52px]
                items-center
                rounded-xl
                px-2
                text-[16px]
                font-medium
                text-[#506a8b]
                hover:bg-[#f5f8fc]
              "
            >
              <CircleHelp
                size={20}
                className="mr-4"
                strokeWidth={1.8}
              />

              Help & Support
            </Link>

            {/* =========================
                SETTINGS
            ========================= */}

            <Link
              href="/account"
              onClick={handleNavigation}
              className="
                mt-1
                mb-5
                flex
                min-h-[52px]
                items-center
                rounded-xl
                px-2
                text-[16px]
                font-medium
                text-[#506a8b]
                hover:bg-[#f5f8fc]
              "
            >
              <Settings
                size={20}
                className="mr-4"
                strokeWidth={1.8}
              />

              Settings
            </Link>
          </nav>
        </div>

        {/* =========================
            FOOTER
        ========================= */}

        <div
          className="
            flex
            min-h-[58px]
            shrink-0
            items-center
            border-t
            border-[#e5e7eb]
            bg-white
            px-5
          "
        >
          <div
            className="
              mr-3
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#202020]
              text-[17px]
              font-medium
              text-white
            "
          >
            N
          </div>

          <p className="text-[12px] text-[#12346b]">
            <span className="font-semibold">
              Aanzara
            </span>{" "}
            — Shop More. Live Better.
          </p>
        </div>
      </aside>
    </>
  );
}