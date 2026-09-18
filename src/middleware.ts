import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge auth guard. Presence cookies (no credentials) are set by
// saveSession()/clearSession() in app/api/api.ts; the backend API
// remains the real enforcer for every data call.
//
// - /admin/*      → session + role=admin (else login / dashboard)
// - /agent-shop-onboarding → session + role=agent (else login / home)
// - account/checkout/orders/... → session (else login?redirect=)
// - /login, /register → public routes (never redirect away unless logged in)

const SESSION_COOKIE = "aanzara_session";
const ROLE_COOKIE = "aanzara_role";

// Public routes that never require auth and never redirect away
const PUBLIC_ROUTES = ["/login", "/register"];

// Routes that require authentication (redirect to /login?redirect=…
// when there is no session).
//
// /dashboard is deliberately NOT here: it is the public storefront home
// (Hero, ShopByCategory, PopularProducts, ...), reached by the root "/"
// redirect, and must render for guests. Signed-in customers still land
// there after login via homeFor() below — this list only controls the
// guest-visits-directly case.
const AUTH_ROUTES = [
  "/account",
  "/checkout",
  "/orders",
  "/order-confirmation",
  "/payment",
  "/invoice",
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

// Guarded pages must never sit in the back-forward cache or the disk
// cache: after logout, Back would otherwise redisplay a protected page
// without ever hitting this guard. Chrome opts out of bfcache for
// `Cache-Control: no-store` responses.
function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
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
      return noStore(NextResponse.redirect(url));
    }

    if (!isAdminRole(role)) {
      const url = request.nextUrl.clone();
      url.pathname = homeFor(role);
      url.search = "";
      return noStore(NextResponse.redirect(url));
    }

    return noStore(NextResponse.next());
  }

  // ---- Agent onboarding: session + agent role ----
  // Must be checked before the generic AUTH_ROUTES branch, which would
  // otherwise admit any signed-in user (customers included).
  if (
    pathname === "/agent-shop-onboarding" ||
    pathname.startsWith("/agent-shop-onboarding/")
  ) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
      return noStore(NextResponse.redirect(url));
    }

    if (!isAgentRole(role)) {
      const url = request.nextUrl.clone();
      url.pathname = homeFor(role);
      url.search = "";
      return noStore(NextResponse.redirect(url));
    }

    return noStore(NextResponse.next());
  }

  // ---- Customer private routes: session only ----
  const needsAuth = AUTH_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );

  if (needsAuth) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
      return noStore(NextResponse.redirect(url));
    }

    return noStore(NextResponse.next());
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