"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  hasSession,
  reconcileGuardCookies,
  restoreSessionFromCookies,
  PROTECTED_PREFIXES,
} from "@/app/api/api";

/* ============================================================
   COMPONENT
============================================================ */

/**
 * Keeps the client session in sync with the HttpOnly cookies on every
 * navigation.
 *
 * Restore-first: when this tab has no session state (fresh tab, browser
 * restart, cleared storage) but the cookies are still alive, one silent
 * cookie refresh rebuilds sessionStorage instead of wiping shared
 * localStorage and bouncing to /login — which the edge guard would
 * bounce straight back from (valid cookies), looping forever or landing
 * on the wrong dashboard.
 *
 * Only when the restore fails (session truly dead — the backend drops
 * the dead cookies on refresh failure) do we clear and bounce protected
 * routes to /login, which now renders instead of bouncing back.
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
    let cancelled = false;

    void (async () => {
      if (!hasSession()) {
        await restoreSessionFromCookies({
          // Protected routes: the edge guard already proved cookies
          // exist by letting the page render, so always attempt.
          // Public routes: attempt only with traces of a prior session
          // (returning user in a fresh tab), never for plain guests.
          force: isProtectedPath(pathname),
        }).catch(() => null);
        if (cancelled) return;
        if (!hasSession() && isProtectedPath(pathname)) {
          router.replace("/login");
          return;
        }
      }
      if (cancelled) return;

      const result = reconcileGuardCookies();

      if (!cancelled && result === "cleared" && isProtectedPath(pathname)) {
        router.replace("/login");
      }
    })();

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
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [pathname, router]);

  return null;
}
