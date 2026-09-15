"use client";

import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Bell,
  LockKeyhole,
  MonitorSmartphone,
  LogOut,
  CheckCircle2,
  Headphones,
} from "lucide-react";

/* =========================================================
   ACCOUNT MENU (single source of truth — no per-page copies)
========================================================= */

const accountMenu = [
  {
    label: "My Profile",
    icon: User,
    href: "/account/profile",
  },
  {
    label: "My Orders",
    icon: ShoppingBag,
    href: "/account/orders",
  },
  {
    label: "Addresses",
    icon: MapPin,
    href: "/account/addresses",
  },
  {
    label: "Wishlist",
    icon: Heart,
    href: "/account/wishlist",
  },
  {
    label: "Alerts",
    icon: Bell,
    href: "/account/alerts",
  },
  {
    label: "Change Password",
    icon: LockKeyhole,
    href: "/account/change-password",
  },
  {
    label: "Sessions",
    icon: MonitorSmartphone,
    href: "/account/sessions",
  },
];

/* =========================================================
   PROPS
========================================================= */

type AccountSidebarProps = {
  currentPath: string;
  profileName: string;
  profileEmail: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AccountSidebar({
  currentPath,
  profileName,
  profileEmail,
}: AccountSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    // Server logout best-effort, then central session clear
    // (tokens, cookies) so route guards engage.
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

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("aanzara-profile");

    router.push("/login");
  };

  return (
    <aside className="w-full shrink-0 rounded-[20px] border border-[#E2EAF4] bg-white p-4 shadow-[0_12px_35px_rgba(30,72,130,0.06)] lg:w-[280px]">
      {/* PROFILE */}
      <div className="flex flex-col items-center border-b border-[#EEF2F7] px-2 pb-5 pt-2">
        <div className="flex h-[112px] w-[112px] items-center justify-center rounded-full bg-gradient-to-br from-[#E8F1FF] to-[#D9E8FF] text-[38px] font-bold text-[#1769F5]">
          {profileName.charAt(0).toUpperCase() || "S"}
        </div>

        <h2 className="mt-4 text-[21px] font-bold text-[#102D62]">
          {profileName || "Sam"}
        </h2>

        <p className="mt-1 max-w-full truncate px-2 text-center text-[13px] text-[#718096]">
          {profileEmail || "sam@example.com"}
        </p>

        <div className="mt-3 flex items-center gap-1.5 rounded-full bg-[#EAF9F0] px-3 py-1.5 text-[11px] font-semibold text-[#159447]">
          <CheckCircle2 size={14} />
          Verified Account
        </div>
      </div>

      {/* MENU */}
      <nav className="mt-4 space-y-1.5" aria-label="My Account">
        {accountMenu.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === currentPath;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.href)}
              className={`group flex h-[54px] w-full items-center rounded-[12px] px-4 text-left text-[15px] font-semibold transition ${
                isActive
                  ? "border-l-[4px] border-[#1769F5] bg-[#EAF2FF] pl-3 text-[#1769F5]"
                  : "text-[#102D62] hover:bg-[#F5F8FC]"
              }`}
            >
              <Icon
                size={21}
                strokeWidth={1.9}
                className="mr-4 shrink-0"
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <span className="text-[18px]">›</span>}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-[54px] w-full items-center rounded-[12px] px-4 text-left text-[15px] font-semibold text-[#EF4444] transition hover:bg-[#FFF5F5]"
        >
          <LogOut
            size={21}
            strokeWidth={1.9}
            className="mr-4 shrink-0"
          />
          <span>Logout</span>
        </button>
      </nav>

      {/* HELP */}
      <div className="mt-4 rounded-[15px] bg-[#F0F6FF] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1769F5] shadow-sm">
            <Headphones size={19} />
          </div>

          <div>
            <p className="text-[12px] font-semibold text-[#102D62]">
              Need Help?
            </p>
            <p className="mt-1 text-[10px] text-[#718096]">
              We're here to support you.
            </p>
            <button
              type="button"
              onClick={() => router.push("/contact")}
              className="mt-2 text-[11px] font-semibold text-[#1769F5] hover:underline"
            >
              Contact Support →
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
