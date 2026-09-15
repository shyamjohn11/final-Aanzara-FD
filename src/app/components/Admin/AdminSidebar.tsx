"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Package,
  BadgePercent,
  Store,
  UserRoundCheck,
  ShoppingBag,
  Users,
  MessageSquareText,
  Heart,
  Image,
  BarChart3,
  ShieldCheck,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

/* ============================================================
   TYPES
============================================================ */

type AdminSidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

type MenuChild = {
  label: string;
  href: string;
};

type MenuItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: MenuChild[];
};

/* ============================================================
   MENU ITEMS
============================================================ */

const MENU_ITEMS: MenuItem[] = [

  /* ==========================================================
     DASHBOARD
  ========================================================== */

  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },

  /* ==========================================================
     CATALOG
  ========================================================== */

  {
    label: "Catalog",
    icon: Package,
    children: [
      {
        label: "Categories",
        href: "/admin/categories",
      },
      {
        label: "Subcategories",
        href: "/admin/subcategories",
      },
      {
        label: "Brands",
        href: "/admin/brands",
      },
      {
        label: "Products",
        href: "/admin/products",
      },
      {
        label: "Inventory",
        href: "/admin/inventory",
      },
    ],
  },

  /* ==========================================================
     SALES & OFFERS
  ========================================================== */

  {
    label: "Sales & Offers",
    icon: BadgePercent,
    children: [
      {
        label: "Offers",
        href: "/admin/offers",
      },
      {
        label: "Combos",
        href: "/admin/combos",
      },
      {
        label: "Coupons",
        href: "/admin/coupons",
      },
      {
        label: "Wholesale Pricing",
        href: "/admin/wholesale-pricing",
      },
      {
        label: "Cart Rules",
        href: "/admin/cart-rules",
      },
    ],
  },

  /* ==========================================================
     STORES
  ========================================================== */

  {
    label: "Stores",
    icon: Store,
    children: [
      {
        label: "Stores",
        href: "/admin/stores",
      },
      {
        label: "Store Offers",
        href: "/admin/store-offers",
      },
    ],
  },

  /* ==========================================================
     AGENT / SHOP ONBOARDING
  ========================================================== */

  {
  label: "Agent / Shop Onboarding",
  href: "/admin/agent-shop-onboarding",
  icon: UserRoundCheck,
},

  /* ==========================================================
     CUSTOMERS
  ========================================================== */

  {
    label: "Customers",
    icon: Users,
    children: [
      {
        label: "Users",
        href: "/admin/users",
      },
      {
        label: "Business Accounts",
        href: "/admin/business-accounts",
      },
    ],
  },

  /* ==========================================================
     ENQUIRIES & QUOTES
  ========================================================== */

  {
    label: "Enquiries & Quotes",
    icon: MessageSquareText,
    children: [
      {
        label: "Enquiries",
        href: "/admin/enquiries",
      },
      {
        label: "Quotes",
        href: "/admin/quotes",
      },
      {
        label: "Pricing Requests",
        href: "/admin/pricing-requests",
      },
    ],
  },

  /* ==========================================================
     ORDERS
  ========================================================== */

  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },

  /* ==========================================================
     ENGAGEMENT
  ========================================================== */

  {
    label: "Engagement",
    icon: Heart,
    children: [
      {
        label: "Wishlist Insights",
        href: "/admin/wishlist-insights",
      },
      {
        label: "Reviews",
        href: "/admin/reviews",
      },
    ],
  },

  /* ==========================================================
     CONTENT
  ========================================================== */

  {
    label: "Content",
    icon: Image,
    children: [
      {
        label: "Banners",
        href: "/admin/banners",
      },
      {
        label: "Site Content",
        href: "/admin/content",
      },
    ],
  },

  /* ==========================================================
     REPORTS
  ========================================================== */

  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },

  /* ==========================================================
     ROLES
  ========================================================== */

  {
    label: "Roles & Permissions",
    href: "/admin/roles",
    icon: ShieldCheck,
  },
];

/* ============================================================
   ADMIN SIDEBAR
============================================================ */

export default function AdminSidebar({
  open = false,
  onClose,
}: AdminSidebarProps) {

  const pathname = usePathname();

  /* ==========================================================
     ACTIVE PATH
  ========================================================== */

  const isPathActive = (
    href: string
  ) => {

    if (href === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  };

  /* ==========================================================
     ACTIVE CHILD
  ========================================================== */

  const hasActiveChild = (
    children?: MenuChild[]
  ) => {

    if (!children) {
      return false;
    }

    return children.some(
      (item) =>
        isPathActive(item.href)
    );
  };

  /* ==========================================================
     BODY SCROLL CONTROL - MOBILE
  ========================================================== */

  useEffect(() => {

    if (!open) {
      return;
    }

    if (
      typeof window !==
      "undefined" &&
      window.innerWidth < 1024
    ) {
      document.body.style.overflow =
        "hidden";
    }

    return () => {
      document.body.style.overflow =
        "";
    };

  }, [open]);

  /* ==========================================================
     SIDEBAR
  ========================================================== */

  return (
    <>
      {/* ======================================================
          MOBILE OVERLAY
      ======================================================= */}

      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`
          fixed
          inset-0
          z-40
          bg-black/40
          transition-opacity
          duration-300
          lg:hidden
          ${
            open
              ? "visible opacity-100"
              : "invisible opacity-0"
          }
        `}
      />

      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-[100dvh]
          w-[270px]
          flex-col
          overflow-hidden
          border-r
          border-[#E3E8EF]
          bg-white
          shadow-[4px_0_20px_rgba(15,30,55,0.04)]
          transition-transform
          duration-300

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }

          lg:translate-x-0
          lg:shadow-none
        `}
      >

        {/* ====================================================
            LOGO HEADER
        ===================================================== */}

        <div
          className="
            flex
            h-[76px]
            shrink-0
            items-center
            border-b
            border-[#E7EBF0]
            px-5
          "
        >

          <Link
            href="/admin"
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
            className="
              flex
              min-w-0
              items-center
            "
          >

            {/* LOGO */}

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-[#10265B]
                text-[15px]
                font-bold
                text-white
              "
            >
              A
            </div>

            {/* BRAND */}

            <div className="ml-3 min-w-0">

              <p
                className="
                  font-sora
                  text-[18px]
                  font-extrabold
                  tracking-tight
                  text-[#10265B]
                "
              >
                Aanzara
              </p>

              <p
                className="
                  mt-0.5
                  text-[8px]
                  font-medium
                  uppercase
                  tracking-[0.14em]
                  text-[#8995A5]
                "
              >
                Admin Panel
              </p>

            </div>

          </Link>

          {/* MOBILE CLOSE */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="
              ml-auto
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-[#718096]
              transition
              hover:bg-[#F3F5F8]
              hover:text-[#10265B]
              lg:hidden
            "
          >
            <X size={18} />
          </button>

        </div>

        {/* ====================================================
            ADMIN PROFILE
        ===================================================== */}

        <div
          className="
            mx-4
            mt-4
            shrink-0
            rounded-xl
            bg-[#F4F7FC]
            p-3
          "
        >

          <div className="flex items-center">

            {/* ICON */}

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#DDE9FF]
                text-[#1769F5]
              "
            >
              <ShieldCheck size={18} />
            </div>

            {/* DETAILS */}

            <div className="ml-2.5 min-w-0">

              <p
                className="
                  truncate
                  text-[10px]
                  font-bold
                  text-[#33415A]
                "
              >
                Administrator
              </p>

              <p
                className="
                  mt-0.5
                  text-[8px]
                  text-[#8995A5]
                "
              >
                Super Admin
              </p>

            </div>

            {/* ONLINE */}

            <span
              className="
                ml-auto
                h-2
                w-2
                shrink-0
                rounded-full
                bg-[#22C55E]
              "
            />

          </div>

        </div>

        {/* ====================================================
            NAVIGATION
        ===================================================== */}

        <nav
          className="
            mt-4
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            px-3
            pb-4
            [scrollbar-width:thin]
            [scrollbar-color:#AEB8C6_transparent]
          "
        >

          {/* MAIN MENU TITLE */}

          <p
            className="
              mb-2
              px-3
              text-[8px]
              font-bold
              uppercase
              tracking-[0.12em]
              text-[#A0AAB8]
            "
          >
            Main Menu
          </p>

          {/* MENU */}

          <div className="space-y-1">

            {MENU_ITEMS.map(
              (item) => (
                <SidebarMenuItem
                  key={item.label}
                  item={item}
                  onClose={onClose}
                  isPathActive={
                    isPathActive
                  }
                  hasActiveChild={
                    hasActiveChild
                  }
                />
              )
            )}

          </div>

          {/* ==================================================
              SYSTEM
          =================================================== */}

          <div
            className="
              mt-5
              border-t
              border-[#EDF0F4]
              pt-4
            "
          >

            <p
              className="
                mb-2
                px-3
                text-[8px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-[#A0AAB8]
              "
            >
              System
            </p>

            <Link
              href="/admin/settings"
              onClick={onClose}
              className={`
                relative
                flex
                h-10
                w-full
                items-center
                rounded-lg
                px-3
                transition-colors
                ${
                  isPathActive("/admin/settings")
                    ? "bg-[#EDF3FF] font-bold text-[#1769F5]"
                    : "text-[#647287] hover:bg-[#F5F7FA] hover:text-[#10265B]"
                }
              `}
            >

              <Settings
                size={16}
                strokeWidth={1.8}
              />

              <span
                className="
                  ml-3
                  text-[10px]
                  font-semibold
                "
              >
                System Settings
              </span>

              {isPathActive("/admin/settings") && (
                <span
                  className="
                    absolute
                    -left-[1px]
                    h-5
                    w-[2px]
                    rounded-full
                    bg-[#1769F5]
                  "
                />
              )}

            </Link>

          </div>

        </nav>

        {/* ====================================================
            FOOTER
        ===================================================== */}

        <div
          className="
            shrink-0
            border-t
            border-[#E7EBF0]
            bg-white
            p-4
          "
        >

          <Link
            href="/"
            onClick={onClose}
            className="
              flex
              items-center
              rounded-lg
              px-3
              py-2.5
              text-[#647287]
              transition
              hover:bg-[#F5F7FA]
              hover:text-[#10265B]
            "
          >

            <ArrowBackIcon />

            <span
              className="
                ml-3
                text-[9px]
                font-semibold
              "
            >
              Back to Website
            </span>

          </Link>

        </div>

      </aside>
    </>
  );
}

/* ============================================================
   SIDEBAR MENU ITEM
============================================================ */

function SidebarMenuItem({
  item,
  onClose,
  isPathActive,
  hasActiveChild,
}: {
  item: MenuItem;
  onClose?: () => void;
  isPathActive: (
    href: string
  ) => boolean;
  hasActiveChild: (
    children?: MenuChild[]
  ) => boolean;
}) {

  /* ==========================================================
     ACTIVE
  ========================================================== */

  const active = item.href
    ? isPathActive(item.href)
    : false;

  const childActive =
    hasActiveChild(
      item.children
    );

  /* ==========================================================
     EXPANDED
     
     IMPORTANT:
     Hook is always called before
     conditional return.
  ========================================================== */

  const [
    expanded,
    setExpanded,
  ] = useState(
    childActive
  );

  /* ==========================================================
     OPEN ACTIVE SECTION
  ========================================================== */

  useEffect(() => {

    if (childActive) {
      setExpanded(true);
    }

  }, [childActive]);

  /* ==========================================================
     SINGLE LINK
  ========================================================== */

  if (item.href) {

    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={`
          flex
          h-10
          w-full
          items-center
          rounded-lg
          px-3
          transition-colors
          ${
            active
              ? "bg-[#1769F5] text-white shadow-sm"
              : "text-[#647287] hover:bg-[#F5F7FA] hover:text-[#10265B]"
          }
        `}
      >

        <item.icon
          size={16}
          strokeWidth={1.8}
        />

        <span
          className="
            ml-3
            text-[10px]
            font-semibold
          "
        >
          {item.label}
        </span>

      </Link>
    );
  }

  /* ==========================================================
     DROPDOWN
  ========================================================== */

  return (
    <div>

      {/* ======================================================
          PARENT
      ======================================================= */}

      <button
        type="button"
        onClick={() =>
          setExpanded(
            (value) => !value
          )
        }
        aria-expanded={expanded}
        className={`
          flex
          h-10
          w-full
          items-center
          rounded-lg
          px-3
          text-left
          transition-colors
          ${
            childActive
              ? "bg-[#F2F6FC] text-[#1769F5]"
              : "text-[#647287] hover:bg-[#F5F7FA] hover:text-[#10265B]"
          }
        `}
      >

        <item.icon
          size={16}
          strokeWidth={1.8}
        />

        <span
          className="
            ml-3
            flex-1
            text-[10px]
            font-semibold
          "
        >
          {item.label}
        </span>

        {expanded ? (
          <ChevronDown
            size={14}
            className="text-[#8995A5]"
          />
        ) : (
          <ChevronRight
            size={14}
            className="text-[#8995A5]"
          />
        )}

      </button>

      {/* ======================================================
          CHILDREN
      ======================================================= */}

      {expanded &&
        item.children && (
          <div
            className="
              ml-4
              mt-1
              space-y-0.5
              border-l
              border-[#E2E7EE]
              pl-3
            "
          >

            {item.children.map(
              (child) => {

                const childIsActive =
                  isPathActive(
                    child.href
                  );

                return (
                  <Link
                    key={
                      child.href
                    }
                    href={
                      child.href
                    }
                    onClick={
                      onClose
                    }
                    className={`
                      relative
                      flex
                      h-9
                      w-full
                      items-center
                      rounded-md
                      px-3
                      transition-colors
                      ${
                        childIsActive
                          ? "bg-[#EDF3FF] font-bold text-[#1769F5]"
                          : "text-[#718096] hover:bg-[#F7F9FC] hover:text-[#10265B]"
                      }
                    `}
                  >

                    {/* ACTIVE LINE */}

                    {childIsActive && (
                      <span
                        className="
                          absolute
                          -left-[17px]
                          h-5
                          w-[2px]
                          rounded-full
                          bg-[#1769F5]
                        "
                      />
                    )}

                    <span
                      className="
                        text-[9px]
                        font-medium
                      "
                    >
                      {child.label}
                    </span>

                  </Link>
                );
              }
            )}

          </div>
        )}

    </div>
  );
}

/* ============================================================
   BACK TO WEBSITE ICON
============================================================ */

function ArrowBackIcon() {

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}