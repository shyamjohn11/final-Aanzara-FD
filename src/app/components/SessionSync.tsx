"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { reconcileGuardCookies, PROTECTED_PREFIXES } from "@/app/api/api";

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
export default function SessionSync() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const result = reconcileGuardCookies();

    if (
      result === "cleared" &&
      PROTECTED_PREFIXES.some(
        (prefix) =>
          pathname === prefix || pathname.startsWith(`${prefix}/`)
      )
    ) {
      router.replace("/login");
    }
  }, [pathname, router]);

  return null;
}
