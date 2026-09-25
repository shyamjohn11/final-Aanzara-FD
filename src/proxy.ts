import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge auth guard. Session + role come from HttpOnly cookies set by the
// backend on login/refresh (aanzara_at / aanzara_session / aanzara_role).
// Script-writable document.cookie values are never trusted for role.
// The backend API remains the real enforcer for every data call.
//
// - /admin/*      → session + role=admin (else login / dashboard)
// - /agent-shop-onboarding → session + role=agent (else login / home)
// - /wholesale/*   → session + admin|agent (else login / dashboard)
// - account/checkout/orders/... → session (else login?redirect=)
// - /login, /register → public routes (never redirect away unless logged in)

const SESSION_COOKIE = "aanzara_session";
const ROLE_COOKIE = "aanzara_role";
const ACCESS_COOKIE = "aanzara_at";

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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const accessCookie = request.cookies.get(ACCESS_COOKIE)?.value;
  const roleCookie = request.cookies.get(ROLE_COOKIE)?.value ?? "";

  // Prefer role claims from the HttpOnly access JWT (server-issued).
  // Fall back to the HttpOnly role cookie only when the JWT is unreadable.
  const jwt = accessCookie ? decodeJwtPayload(accessCookie) : null;
  const jwtExp = typeof jwt?.exp === "number" ? jwt.exp : null;
  const jwtExpired = jwtExp !== null && jwtExp * 1000 <= Date.now();
  let role = "";
  if (jwt && !jwtExpired) {
    // .NET ClaimTypes.Role serializes as the WS-* URI with an http://
    // scheme (NOT https://) — JsonWebTokenHandler writes Claim.Type
    // verbatim because MapInboundClaims=false. Check both schemes plus
    // the short names so a future handler change cannot blind the guard.
    const claim =
      jwt["role"] ??
      jwt["roles"] ??
      jwt["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      jwt["https://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    if (Array.isArray(claim)) role = String(claim[0] ?? "");
    else if (typeof claim === "string") role = claim;
    else if (claim && typeof claim === "object" && "value" in claim) {
      role = String((claim as { value?: unknown }).value ?? "");
    }
  }
  if (!role) role = roleCookie;

  // Session: HttpOnly presence cookie or a non-expired access JWT.
  const jwtValid = !!accessCookie && !!jwt && !jwtExpired;
  const isLoggedIn = sessionCookie === "1" || jwtValid;

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

    // Role must come from a server-issued JWT or HttpOnly role cookie —
    // never from a JS-writable cookie (document.cookie cannot set HttpOnly).
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

  // ---- Wholesale: session + admin/agent role (customers never see it) ----
  // Must be checked before the generic AUTH_ROUTES branch, which would
  // otherwise admit any signed-in user (customers included).
  if (
    pathname === "/wholesale" ||
    pathname.startsWith("/wholesale/")
  ) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
      return noStore(NextResponse.redirect(url));
    }

    if (!isAdminRole(role) && !isAgentRole(role)) {
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
    "/wholesale",
    "/wholesale/:path*",
    "/login",
    "/register",
  ],
};
