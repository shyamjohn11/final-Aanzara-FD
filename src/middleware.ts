import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge auth guard. Presence cookies (no credentials) are set by
// saveSession()/clearSession() in app/api/api.ts; the backend API
// remains the real enforcer for every data call.
//
// - /admin/*      → session + role=admin (else login / dashboard)
// - account/checkout/orders/... → session (else login?redirect=)
// - /login, /register → public routes (never redirect away unless logged in)

const SESSION_COOKIE = "aanzara_session";
const ROLE_COOKIE = "aanzara_role";

// Public routes that never require auth and never redirect away
const PUBLIC_ROUTES = ["/login", "/register"];

// Routes that require authentication (redirect to /login?redirect=…
// when there is no session). Includes the role home pages so a
// logged-out visitor always lands on the login page first.
const AUTH_ROUTES = [
  "/account",
  "/checkout",
  "/orders",
  "/order-confirmation",
  "/payment",
  "/invoice",
  "/dashboard",
  "/agent-shop-onboarding",
];

function isAdminRole(role: string): boolean {
  const normalized = role.trim().toLowerCase();
  return (
    normalized === "admin" ||
    normalized === "administrator" ||
    normalized === "superadmin" ||
    normalized === "super_admin"
  );
}

function isAgentRole(role: string): boolean {
  const normalized = role.trim().toLowerCase();
  return (
    normalized === "agent" ||
    normalized === "sales_agent" ||
    normalized === "support_agent"
  );
}

function homeFor(role: string): string {
  if (isAdminRole(role)) return "/admin";
  if (isAgentRole(role)) {
    return "/agent-shop-onboarding";
  }
  return "/dashboard";
}

function safeRedirect(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (
    value === "/login" ||
    value.startsWith("/login?") ||
    value.startsWith("/login/") ||
    value === "/register" ||
    value.startsWith("/register?") ||
    value.startsWith("/register/")
  ) {
    return null;
  }
  return value;
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value ?? "";

  const isLoggedIn = session === "1";

  // ---- Always allow public routes (login, register) for non-logged-in users ----
  if (isPublicRoute(pathname)) {
    // If logged in, redirect to appropriate home page
    if (isLoggedIn) {
      const redirect =
        safeRedirect(request.nextUrl.searchParams.get("redirect")) ??
        homeFor(role);
      const url = request.nextUrl.clone();
      url.pathname = redirect;
      url.search = "";
      return NextResponse.redirect(url);
    }
    // Not logged in - allow access to login/register
    return NextResponse.next();
  }

  // ---- Admin area: session + admin role ----
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }

    if (!isAdminRole(role)) {
      const url = request.nextUrl.clone();
      url.pathname = homeFor(role);
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // ---- Customer private routes: session only ----
  const needsAuth = AUTH_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );

  if (needsAuth && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // NOTE: both the exact path and its children must be listed — ":path*"
  // alone does not match the bare path ("/admin" or "/account"), and the
  // bare entry alone does not cover nested pages ("/orders/123").
  matcher: [
    "/admin",
    "/admin/:path*",
    "/account",
    "/account/:path*",
    "/checkout",
    "/checkout/:path*",
    "/orders",
    "/orders/:path*",
    "/order-confirmation",
    "/order-confirmation/:path*",
    "/payment",
    "/payment/:path*",
    "/invoice",
    "/invoice/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/agent-shop-onboarding",
    "/agent-shop-onboarding/:path*",
    "/login",
    "/register",
  ],
};
