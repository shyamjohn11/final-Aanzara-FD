// File: app/components/Admin/AdminLayout.tsx

"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import AdminSidebar from "@/app/components/Admin/AdminSidebar";
import AdminHeader from "@/app/components/Admin/AdminHeader";
import {
  getSessionRole,
  hasSession,
} from "@/app/api/api";

/* =========================================================
   TYPES
========================================================= */

type AdminLayoutProps = {
  children: ReactNode;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  /* =======================================================
     CLIENT ROLE GUARD (defense-in-depth: the edge middleware
     + backend enforce first; this avoids flashing admin UI)
  ======================================================= */

  useEffect(() => {
    if (!hasSession()) {
      router.replace(
        `/login?redirect=${encodeURIComponent(pathname || "/admin")}`
      );
      return;
    }

    if (getSessionRole() !== "admin") {
      router.replace("/dashboard");
      return;
    }

    setAllowed(true);
  }, [router, pathname]);

  /* =======================================================
     SIDEBAR STATE
  ======================================================= */

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  /* =======================================================
     OPEN SIDEBAR
  ======================================================= */

  const handleOpenSidebar = () => {
    setSidebarOpen(true);
  };

  /* =======================================================
     CLOSE SIDEBAR
  ======================================================= */

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  if (!allowed) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F5F7FA]">
        <p className="text-[12px] text-[#7B8798]">
          Checking permissions…
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-[#F5F7FA]
        text-[#1F2F49]
      "
      data-admin-layout="true"
    >
      {/* ===================================================
          ADMIN SIDEBAR
      =================================================== */}

      <AdminSidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* ===================================================
          MAIN AREA

          Desktop:
          Sidebar = 270px
          Main area starts after sidebar

          Mobile:
          Main area = full width

          NOTE: `calc()` requires a space on both sides of the
          `-` operator to be valid CSS. `calc(100%-270px)` (no
          spaces) is invalid, and browsers silently drop the
          whole `width` declaration when they can't parse it —
          that was the bug causing admin pages to overflow
          270px past the right edge of the viewport. Tailwind's
          arbitrary-value syntax needs underscores in place of
          spaces: `calc(100%_-_270px)` compiles to the valid
          CSS `calc(100% - 270px)`.
      =================================================== */}

      <div
        className="
          min-h-screen
          w-full
          min-w-0
          overflow-x-hidden

          lg:ml-[270px]
          lg:w-[calc(100%_-_270px)]
        "
      >
        {/* =================================================
            ADMIN HEADER
        ================================================= */}

        <AdminHeader
          onMenuClick={handleOpenSidebar}
        />

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main
          id="admin-main-content"
          className="
            min-h-[calc(100vh-70px)]
            w-full
            min-w-0
            overflow-x-hidden
            bg-[#F5F7FA]
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}
