// File: app/components/Account/AccountSidebar.tsx
"use client";

import {
  LayoutGrid,
  Package,
  FileText,
  Heart,
  ClipboardList,
  MapPin,
  CreditCard,
  Bell,
  Star,
  LifeBuoy,
  Building2,
  Settings,
  LogOut,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type NavItem = {
  label: string;
  icon: typeof LayoutGrid;
  active?: boolean;
};

/* =========================================================
   NAVIGATION ITEMS
========================================================= */

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutGrid,
    active: true,
  },
  {
    label: "My Orders",
    icon: Package,
  },
  {
    label: "Invoices",
    icon: FileText,
  },
  {
    label: "Wishlist",
    icon: Heart,
  },
  {
    label: "Bulk Quotes",
    icon: ClipboardList,
  },
  {
    label: "Addresses",
    icon: MapPin,
  },
  {
    label: "Payment Methods",
    icon: CreditCard,
  },
  {
    label: "Notifications",
    icon: Bell,
  },
  {
    label: "Reviews",
    icon: Star,
  },
  {
    label: "Support",
    icon: LifeBuoy,
  },
  {
    label: "Business Profile",
    icon: Building2,
  },
  {
    label: "Settings",
    icon: Settings,
  },
];

/* =========================================================
   VALIDATION
========================================================= */

/**
 * Validate navigation item.
 */
function isValidNavItem(
  item: NavItem
): boolean {
  if (!item) {
    return false;
  }

  if (
    typeof item.label !== "string" ||
    item.label.trim().length === 0
  ) {
    return false;
  }

  if (
    typeof item.icon !== "function"
  ) {
    return false;
  }

  return true;
}

/**
 * Remove invalid/duplicate navigation items.
 */
function getValidNavItems(
  items: NavItem[]
): NavItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!isValidNavItem(item)) {
      return false;
    }

    const key =
      item.label.trim().toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AccountSidebar() {
  const validNavItems =
    getValidNavItems(
      NAV_ITEMS
    );

  const handleLogout =
    async () => {
      // Central logout: revokes the server session, clears tokens and
      // guard cookies, then replaces history so Back cannot return here.
      const { logoutAndRedirect } =
        await import(
          "@/app/api/api"
        );
      await logoutAndRedirect(
        "/login"
      );
    };

  return (
    <aside className="hidden w-[220px] shrink-0 lg:block">
      <nav
        aria-label="Account navigation"
        className="rounded-card border border-slate-200 bg-white p-2"
      >
        <ul className="flex flex-col gap-0.5">
          {/* =================================================
              NAVIGATION ITEMS
          ================================================= */}

          {validNavItems.map(
            ({
              label,
              icon: Icon,
              active,
            }) => {
              const isActive =
                active === true;

              return (
                <li key={label}>
                  <button
                    type="button"
                    aria-current={
                      isActive
                        ? "page"
                        : undefined
                    }
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue/20 ${
                      isActive
                        ? "bg-blue/10 font-semibold text-blue"
                        : "text-slate-600 hover:bg-slate-50 hover:text-navy"
                    }`}
                  >
                    <Icon
                      size={17}
                      strokeWidth={
                        isActive
                          ? 2.4
                          : 2
                      }
                      aria-hidden="true"
                    />

                    <span className="truncate">
                      {label}
                    </span>
                  </button>
                </li>
              );
            }
          )}

          {/* =================================================
              LOGOUT
          ================================================= */}

          <li className="mt-1 border-t border-slate-100 pt-1">
            <button
              type="button"
              aria-label="Logout from your account"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <LogOut
                size={17}
                aria-hidden="true"
              />

              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}