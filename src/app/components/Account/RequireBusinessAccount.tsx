"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

interface RequireBusinessAccountProps {
  children: ReactNode;
}

/* =========================================================
   SESSION KEYS
========================================================= */

const SESSION_KEYS = {
  loggedIn: "aanzara_logged_in",
  accountType: "aanzara_account_type",
} as const;

/* =========================================================
   ROUTES
========================================================= */

const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
} as const;

/* =========================================================
   VALIDATION HELPERS
========================================================= */

/**
 * Safely read a sessionStorage value.
 *
 * sessionStorage can throw in restricted browser
 * environments, so keep access protected.
 */
function getSessionValue(
  key: string
): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Validate logged-in session.
 */
function isLoggedIn(
  value: string | null
): boolean {
  return value === "true";
}

/**
 * Validate business account type.
 */
function isBusinessAccount(
  value: string | null
): boolean {
  return value === "business";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RequireBusinessAccount({
  children,
}: RequireBusinessAccountProps) {
  const router = useRouter();

  /* =======================================================
     STATE
  ======================================================= */

  const [checking, setChecking] =
    useState(true);

  const [allowed, setAllowed] =
    useState(false);

  /* =======================================================
     AUTHENTICATION CHECK
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const checkBusinessAccount =
      () => {
        /*
         * Always start with a locked state.
         */
        if (!mounted) {
          return;
        }

        setChecking(true);
        setAllowed(false);

        /* -----------------------------------------------
           READ SESSION
        ----------------------------------------------- */

        const loggedIn =
          getSessionValue(
            SESSION_KEYS.loggedIn
          );

        const accountType =
          getSessionValue(
            SESSION_KEYS.accountType
          );

        /* -----------------------------------------------
           LOGIN VALIDATION
        ----------------------------------------------- */

        if (!isLoggedIn(loggedIn)) {
          router.replace(
            ROUTES.login
          );
          return;
        }

        /* -----------------------------------------------
           BUSINESS ACCOUNT VALIDATION
        ----------------------------------------------- */

        if (
          !isBusinessAccount(
            accountType
          )
        ) {
          router.replace(
            ROUTES.dashboard
          );
          return;
        }

        /* -----------------------------------------------
           ACCESS GRANTED
        ----------------------------------------------- */

        if (!mounted) {
          return;
        }

        setAllowed(true);
        setChecking(false);
      };

    checkBusinessAccount();

    /* =====================================================
       CLEANUP
    ===================================================== */

    return () => {
      mounted = false;
    };
  }, [router]);

  /* =======================================================
     CHECKING STATE
  ======================================================= */

  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#F5F8FC]"
        role="status"
        aria-live="polite"
        aria-label="Checking business account"
      >
        <div className="text-center">
          {/* LOADING SPINNER */}

          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#2848A0]/30 border-t-[#2848A0]"
            aria-hidden="true"
          />

          {/* LOADING MESSAGE */}

          <p className="mt-3 text-[13px] font-medium text-[#637188]">
            Checking business
            account...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ACCESS DENIED / REDIRECT IN PROGRESS
  ======================================================= */

  if (!allowed) {
    return null;
  }

  /* =======================================================
     AUTHORIZED CONTENT
  ======================================================= */

  return <>{children}</>;
}