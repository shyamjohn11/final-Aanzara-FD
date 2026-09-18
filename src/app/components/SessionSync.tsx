"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  hasSession,
  reconcileGuardCookies,
  PROTECTED_PREFIXES,
} from "@/app/api/api";

/* ============================================================
   COMPONENT
============================================================ */

/**
 * Keeps the middleware presence cookies (aanzara_session /
 * aanzara_role) in sync with the real session on every navigation.
 *
 * This heals browsers that already carry a stale guard cookie from
 * a pre-fix logout: the edge middleware runs before any client code
 * on /login, so the recovery has to happen on the page it bounces
 * to (dashboard / admin / onboarding), not on /login itself.
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function SessionSync() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const result = reconcileGuardCookies();

    if (result === "cleared" && isProtectedPath(pathname)) {
      router.replace("/login");
    }

    // Back/forward-button restores can come from the bfcache without
    // touching the edge middleware: if such a restore lands on a
    // protected route with no session, replace it with a full load
    // of the login page instead of showing the cached document.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      if (typeof window === "undefined") return;
      const current = window.location.pathname;
      if (isProtectedPath(current) && !hasSession()) {
        window.location.replace(
          `/login?redirect=${encodeURIComponent(current + window.location.search)}`
        );
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [pathname, router]);

  return null;
}
