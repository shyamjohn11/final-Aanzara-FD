// File: src/app/MainNav.tsx

"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWholesaleAudience } from "@/app/api/api";

import {
  X,
  Heart,
  Bell,
  User,
  Search,
  ChevronRight,
  Grid2X2,
  Store,
  Tag,
  Sparkles,
  BriefcaseBusiness,
  Phone,
  CircleHelp,
  Settings,
  ShoppingBag,
  LayoutDashboard,
} from "lucide-react";

/* ============================================================
   NAVIGATION LINKS
============================================================ */

const LINKS = [
  "Home",
  "Categories",
  "Wholesale",
  "Retail",
  "Brands",
  "Offers",
  "New Arrivals",
  "Business Solutions",
  "Contact",
] as const;

/* ============================================================
   ROUTES
============================================================ */

const ROUTES: Record<(typeof LINKS)[number], string> = {
  Home: "/dashboard",
  Categories: "/categories",
  Wholesale: "/wholesale",
  Retail: "/retail",
  Brands: "/brands",
  Offers: "/offers",
  "New Arrivals": "/new-arrivals",
  "Business Solutions": "/business-solutions",
  Contact: "/contact",
};

/* ============================================================
   MAIN NAV
============================================================ */

export default function MainNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Wholesale is admin/agent-only — customers and guests don't see the link.
  const showWholesale = useWholesaleAudience();
  const visibleLinks = showWholesale
    ? LINKS
    : LINKS.filter((link) => link !== "Wholesale");

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const navigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleNavigation = (link: (typeof LINKS)[number]) => {
    const path = ROUTES[link];

    if (!path) {
      return;
    }

    navigate(path);
  };

  /* ==========================================================
     ACTIVE ROUTE
  ========================================================== */

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  };

  return (
    <>
      {/* ======================================================
          DESKTOP NAVIGATION
      ====================================================== */}

      <nav className="hidden w-full border-b border-line bg-[#F6F8FB] lg:block">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
          <div className="flex h-[52px] items-center gap-7">
            {visibleLinks.map((link) => {
              const path = ROUTES[link];
              const active = isActive(path);

              return (
                <button
                  key={link}
                  type="button"
                  onClick={() => handleNavigation(link)}
                  aria-current={active ? "page" : undefined}
                  className={`
                    relative
                    flex
                    h-full
                    items-center
                    whitespace-nowrap
                    text-[13.5px]
                    transition-colors
                    ${
                      active
                        ? "font-semibold text-navy"
                        : "font-medium text-ink-soft hover:text-navy"
                    }
                  `}
                >
                  {link}

                  {active && (
                    <span
                      className="
                        absolute
                        bottom-0
                        left-0
                        right-0
                        h-[2px]
                        rounded-full
                        bg-blue
                      "
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ======================================================
          MOBILE SIDE DRAWER
      ====================================================== */}

      <div
        className={`
          fixed
          inset-0
          z-[100]
          lg:hidden
          transition-opacity
          duration-300
          ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
        aria-hidden={!open}
      >
        {/* ====================================================
            OVERLAY
        ===================================================== */}

        <div
          aria-hidden="true"
          onClick={onClose}
          className={`
            absolute
            inset-0
            bg-black/50
            transition-opacity
            duration-300
            ${
              open
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        />

        {/* ====================================================
            DRAWER
        ===================================================== */}

        <aside
          aria-label="Main navigation"
          className={`
            absolute
            left-0
            top-0
            flex
            h-full
            w-[320px]
            max-w-[88vw]
            flex-col
            bg-white
            shadow-2xl
            transition-transform
            duration-300
            ease-out
            ${
              open
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          {/* ==================================================
              DRAWER HEADER
          ================================================== */}

          <div
            className="
              flex
              h-[68px]
              shrink-0
              items-center
              justify-between
              border-b
              border-line
              px-5
            "
          >
            <span
              className="
                font-sora
                text-[23px]
                font-extrabold
                tracking-tight
                text-navy
              "
            >
              Aanzara
            </span>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                text-ink-soft
                transition-colors
                hover:bg-paper
                hover:text-navy
              "
            >
              <X size={21} />
            </button>
          </div>

          {/* ==================================================
              SEARCH
          ================================================== */}

          <div
            className="
              shrink-0
              border-b
              border-line
              px-5
              py-4
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
                bg-paper
                px-3
              "
            >
              <Search
                size={18}
                className="mr-3 shrink-0 text-ink-faint"
              />

              <input
                type="search"
                placeholder="Search products..."
                aria-label="Search products"
                className="
                  w-full
                  bg-transparent
                  text-[13px]
                  text-ink
                  outline-none
                  placeholder:text-ink-faint
                "
              />
            </div>
          </div>

          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}

          <div
            className="
              grid
              grid-cols-3
              shrink-0
              border-b
              border-line
            "
          >
            {/* =================================================
                WISHLIST
            ================================================= */}

            <button
              type="button"
              onClick={() => navigate("/wishlist")}
              className="
                flex
                h-[78px]
                flex-col
                items-center
                justify-center
                border-r
                border-line
                text-ink-soft
                transition-colors
                hover:bg-paper
                hover:text-navy
              "
            >
              <Heart size={21} />

              <span className="mt-2 text-[10.5px]">
                Wishlist
              </span>
            </button>

            {/* =================================================
                ALERTS
                FIXED: NOW NAVIGATES TO /alerts
            ================================================= */}

            <button
              type="button"
              onClick={() => navigate("/alerts")}
              aria-label="Open alerts"
              className="
                flex
                h-[78px]
                flex-col
                items-center
                justify-center
                border-r
                border-line
                text-ink-soft
                transition-colors
                hover:bg-paper
                hover:text-navy
              "
            >
              <Bell size={21} />

              <span className="mt-2 text-[10.5px]">
                Alerts
              </span>
            </button>

            {/* =================================================
                SIGN IN
            ================================================= */}

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="
                flex
                h-[78px]
                flex-col
                items-center
                justify-center
                text-ink-soft
                transition-colors
                hover:bg-paper
                hover:text-navy
              "
            >
              <User size={21} />

              <span className="mt-2 text-[10.5px]">
                Sign In
              </span>
            </button>
          </div>

          {/* ==================================================
              NAVIGATION LIST
          ================================================== */}

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {/* =================================================
                HOME
            ================================================= */}

            <DrawerItem
              icon={<Grid2X2 size={20} />}
              label="Home"
              active={isActive("/dashboard")}
              onClick={() => navigate("/dashboard")}
            />

            {/* =================================================
                CATEGORIES
            ================================================= */}

            <DrawerItem
              icon={<ShoppingBag size={20} />}
              label="Categories"
              arrow
              active={isActive("/categories")}
              onClick={() => navigate("/categories")}
            />

            {/* =================================================
                WHOLESALE (admin/agent only)
            ================================================= */}

            {showWholesale && (
              <DrawerItem
                icon={<LayoutDashboard size={20} />}
                label="Wholesale Dashboard"
                active={isActive("/wholesale")}
                blue
                onClick={() => navigate("/wholesale")}
              />
            )}

            {/* =================================================
                RETAIL
            ================================================= */}

            <DrawerItem
              icon={<Store size={20} />}
              label="Retail"
              arrow
              active={isActive("/retail")}
              onClick={() => navigate("/retail")}
            />

            {/* =================================================
                BRANDS
            ================================================= */}

            <DrawerItem
              icon={<Tag size={20} />}
              label="Brands"
              arrow
              active={isActive("/brands")}
              onClick={() => navigate("/brands")}
            />

            {/* =================================================
                OFFERS
            ================================================= */}

            <DrawerItem
              icon={<Tag size={20} />}
              label="Offers"
              badge="3"
              active={isActive("/offers")}
              onClick={() => navigate("/offers")}
            />

            {/* =================================================
                NEW ARRIVALS
            ================================================= */}

            <DrawerItem
              icon={<Sparkles size={20} />}
              label="New Arrivals"
              badge="NEW"
              active={isActive("/new-arrivals")}
              onClick={() => navigate("/new-arrivals")}
            />

            {/* =================================================
                BUSINESS SOLUTIONS
            ================================================= */}

            <DrawerItem
              icon={<BriefcaseBusiness size={20} />}
              label="Business Solutions"
              arrow
              active={isActive("/business-solutions")}
              onClick={() =>
                navigate("/business-solutions")
              }
            />

            {/* =================================================
                CONTACT
            ================================================= */}

            <DrawerItem
              icon={<Phone size={20} />}
              label="Contact"
              arrow
              active={isActive("/contact")}
              onClick={() => navigate("/contact")}
            />

            {/* =================================================
                HELP & SUPPORT
            ================================================= */}

            <DrawerItem
              icon={<CircleHelp size={20} />}
              label="Help & Support"
              arrow
              active={isActive("/help")}
              onClick={() => navigate("/help")}
            />

            {/* =================================================
                ACCOUNT
            ================================================= */}

            <DrawerItem
              icon={<Settings size={20} />}
              label="Account"
              arrow
              active={isActive("/account")}
              onClick={() => navigate("/account")}
            />
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div
            className="
              shrink-0
              border-t
              border-line
              px-5
              py-4
            "
          >
            <p
              className="
                text-center
                text-[10px]
                text-ink-faint
              "
            >
              Aanzara — Shop More. Live Better.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

/* ============================================================
   DRAWER ITEM
============================================================ */

function DrawerItem({
  icon,
  label,
  arrow = false,
  badge,
  active = false,
  blue = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  arrow?: boolean;
  badge?: string;
  active?: boolean;
  blue?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`
        mb-1
        flex
        min-h-[50px]
        w-full
        items-center
        rounded-xl
        px-3
        text-left
        transition-colors
        ${
          active
            ? "bg-[#F1F6FF] text-navy"
            : "text-[#526B91] hover:bg-[#F8FAFD] hover:text-navy"
        }
      `}
    >
      {/* =====================================================
          ICON
      ===================================================== */}

      <span
        className={`
          mr-4
          shrink-0
          ${
            active || blue
              ? "text-blue"
              : "text-[#607594]"
          }
        `}
      >
        {icon}
      </span>

      {/* =====================================================
          LABEL
      ===================================================== */}

      <span
        className={`
          flex-1
          text-[14px]
          ${
            active || blue
              ? "font-semibold"
              : "font-medium"
          }
        `}
      >
        {label}
      </span>

      {/* =====================================================
          BADGE
      ===================================================== */}

      {badge && (
        <span
          className="
            mr-2
            rounded-md
            bg-[#EAF2FF]
            px-2
            py-1
            text-[8px]
            font-bold
            text-[#1769F5]
          "
        >
          {badge}
        </span>
      )}

      {/* =====================================================
          ARROW
      ===================================================== */}

      {arrow && (
        <ChevronRight
          size={17}
          className="shrink-0 text-[#91A0B5]"
        />
      )}
    </button>
  );
}