import axios, { type InternalAxiosRequestConfig } from "axios";
import { useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const SESSION_ID_KEY = "sessionId";
const USER_KEY = "aanzara_user";

// Browser requests remain same-origin and are forwarded to ASP.NET by the
// /api rewrite in next.config.js. This is the sole HTTP client for the app.
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/",
  // No JSON Content-Type default: axios would serialize FormData bodies to
  // JSON and the multipart endpoints reject them with 415. Object payloads
  // still get application/json automatically; FormData gets the boundary.
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window === "undefined"
      ? null
      : localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  requestId?: string;
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  sessionId: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  passphrase: string;
  confirmPassphrase: string;
}

export interface LoginPayload {
  email: string;
  passphrase: string;
}

// ============================================================
// ROLE RESOLUTION — single source of truth for the auth guard.
// saveSession() writes the aanzara_role cookie from this, and the
// login page redirects from this, so the middleware (which only
// sees the cookie) can never disagree with the pushed route.
// ============================================================

export type AppRole = "admin" | "agent" | "customer";

// The JWT carries one ClaimTypes.Role claim per role, serialized under
// this key when decoded.
const JWT_ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const ADMIN_ROLE_VALUES = ["admin", "administrator", "superadmin", "super_admin"];
const AGENT_ROLE_VALUES = ["agent", "sales_agent", "support_agent"];

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

export function resolveUserRole(auth: unknown): AppRole {
  const loginData = (auth ?? {}) as Record<string, any>;
  const user = (loginData?.user ?? {}) as Record<string, any>;
  const nested = (loginData?.data ?? {}) as Record<string, any>;

  // Collect every role-ish string the response or JWT might carry,
  // then match against the known admin/agent spellings.
  const candidates: string[] = [
    ...toStringArray(user?.roles),
    ...toStringArray(nested?.user?.roles),
    ...toStringArray(loginData?.[JWT_ROLE_CLAIM]),
    ...toStringArray(loginData?.role),
    ...toStringArray(loginData?.userRole),
    ...toStringArray(loginData?.account?.role),
    ...toStringArray(nested?.role),
    ...toStringArray(loginData?.role_name),
    ...toStringArray(user?.role),
    ...toStringArray(user?.role_name),
  ];

  const payload = typeof loginData?.accessToken === "string"
    ? decodeJwtPayload(loginData.accessToken)
    : null;
  if (payload) {
    candidates.push(
      ...toStringArray(payload[JWT_ROLE_CLAIM]),
      ...toStringArray(payload["role"]),
      ...toStringArray(payload["roles"]),
    );
  }

  const normalized = candidates
    .map((role) => String(role).toLowerCase().trim())
    .filter(Boolean);
  const hasAny = (list: string[]) => normalized.some((r) => list.includes(r));

  const isAdminFlag =
    loginData?.isAdmin === true ||
    user?.isAdmin === true ||
    nested?.isAdmin === true ||
    nested?.user?.isAdmin === true;
  const isAgentFlag =
    loginData?.isAgent === true ||
    user?.isAgent === true ||
    nested?.isAgent === true ||
    nested?.user?.isAgent === true;

  if (isAdminFlag || hasAny(ADMIN_ROLE_VALUES)) return "admin";
  if (isAgentFlag || hasAny(AGENT_ROLE_VALUES)) return "agent";
  return "customer";
}

export function saveSession(
  auth: AuthResponse,
  options?: { silent?: boolean },
) {
  const resolvedRole = resolveUserRole(auth);
  localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
  localStorage.setItem(SESSION_ID_KEY, auth.sessionId);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  sessionStorage.setItem("aanzara_logged_in", "true");
  sessionStorage.setItem("aanzara_user_id", auth.user.userId);
  sessionStorage.setItem("aanzara_user_data", JSON.stringify(auth.user));
  sessionStorage.setItem("aanzara_user_role", resolvedRole);
  // Presence cookies for the edge middleware (auth guard). The real
  // tokens stay in storage; these carry no credentials.
  setGuardCookie("aanzara_session", "1");
  setGuardCookie("aanzara_role", resolvedRole);
  if (!options?.silent) notifySessionChanged();
}

function setGuardCookie(
  name: string,
  value: string
) {
  if (typeof document === "undefined") return;
  // 30 days; cleared on logout.
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie =
    `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearGuardCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function clearSession(options?: { silent?: boolean }) {
  if (typeof window === "undefined") return;
  [
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    SESSION_ID_KEY,
    USER_KEY,
    // Legacy AuthContext display name + per-page profile drafts.
    // Stale values here repopulate the UI after logout.
    "userName",
    "aanzara-profile",
  ].forEach((key) => localStorage.removeItem(key));
  [
    "aanzara_logged_in",
    "aanzara_user_id",
    "aanzara_user_data",
    "aanzara_user_role",
  ].forEach((key) => sessionStorage.removeItem(key));
  clearGuardCookie("aanzara_session");
  clearGuardCookie("aanzara_role");
  if (!options?.silent) notifySessionChanged();
}

/** Role for client-side guards. The backend still enforces everything. */
export function getSessionRole(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = sessionStorage.getItem(
      "aanzara_user_role"
    );
    if (stored) return stored.toLowerCase();
    const match = document.cookie.match(
      /(?:^|;\s*)aanzara_role=([^;]*)/
    );
    return match
      ? decodeURIComponent(match[1]).toLowerCase()
      : "";
  } catch {
    return "";
  }
}

// Fired whenever the session is created or destroyed (not on background
// token refreshes). Cart/Wishlist contexts listen for this to switch
// between guest (localStorage) mode and backend-synced mode.
export const SESSION_CHANGED_EVENT = "aanzara:session-changed";

/**
 * Wholesale surfaces (/wholesale, wholesale nav entries, bulk-order promos)
 * are restricted to admin and agent roles. Customers and guests never see
 * them. There is no separate dealer login role — dealer/shop owners sign
 * in with agent accounts, so they are covered by the agent branch.
 */
export function isWholesaleAudience(role: unknown): boolean {
  const normalized = String(role ?? "").trim().toLowerCase();
  return (
    ADMIN_ROLE_VALUES.includes(normalized) ||
    AGENT_ROLE_VALUES.includes(normalized)
  );
}

/**
 * Mounted-safe audience flag for conditional rendering. Reads the role
 * after mount (and on session changes) so server HTML and the first
 * client paint agree — no hydration mismatch, no wholesale flash for
 * customers.
 */
export function useWholesaleAudience(): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAllowed(isWholesaleAudience(getSessionRole()));
    };
    sync();
    window.addEventListener(SESSION_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return allowed;
}

export function notifySessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function hasSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}

/**
 * Full logout in one call: revoke the server session (best-effort),
 * clear every client token/cookie, then hard-navigate with
 * `location.replace` so the protected page leaves the history stack —
 * the Back button can no longer land back inside it, and the fresh
 * document forces the edge middleware to re-evaluate.
 */
export async function logoutAndRedirect(to = "/login"): Promise<void> {
  try {
    await api.post("/api/v1/auth/logout");
  } catch {
    // Local clear below applies regardless.
  }
  clearSession();
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("aanzara_remember_me");
  } catch {
    // Ignore storage errors.
  }
  window.location.replace(to);
}

/**
 * Reconcile the middleware presence cookies with real session state.
 *
 * - Guard cookie without a token (e.g. a logout that only cleared
 *   storage, or a browser that kept the 30-day cookie after the
 *   token was removed): clears the whole session so the edge guard
 *   stops bouncing /login back into the app.
 * - Token without a guard cookie (cookie expired, storage kept):
 *   re-issues the cookies so logged-in users are recognized again.
 *
 * Returns what happened, or null when nothing drifted.
 */
export function reconcileGuardCookies(): "cleared" | "restored" | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)aanzara_session=([^;]*)/);
  const hasCookie = match ? decodeURIComponent(match[1]) === "1" : false;
  const loggedIn = hasSession();

  if (hasCookie && !loggedIn) {
    clearSession({ silent: true });
    return "cleared";
  }

  if (!hasCookie && loggedIn) {
    setGuardCookie("aanzara_session", "1");
    setGuardCookie("aanzara_role", getSessionRole() || "customer");
    return "restored";
  }

  return null;
}

// Routes that only make sense for a signed-in user. When a dead session
// is detected on one of them we bounce back to the login page; on public
// storefront pages (including /dashboard, the storefront home) we just
// drop to guest mode instead.
export const PROTECTED_PREFIXES = [
  "/account",
  "/checkout",
  "/orders",
  "/order-confirmation",
  "/payment",
  "/invoice",
  "/admin",
  "/agent-shop-onboarding",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Full page load (not router.push): guarantees the edge middleware
// re-evaluates with the now-cleared guard cookies.
function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (!isProtectedPath(pathname)) return;
  const onPublicRoute =
    pathname === "/login" || pathname.startsWith("/login/");
  if (onPublicRoute) return;
  window.location.assign(
    `/login?redirect=${encodeURIComponent(pathname + search)}`,
  );
}

let refreshInFlight: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;
    const isRefreshRequest = request?.url?.includes("/api/v1/auth/refresh");

    if (
      typeof window === "undefined" ||
      !request ||
      request._retried ||
      isRefreshRequest ||
      error.response?.status !== 401
    ) {
      return Promise.reject(error);
    }

    request._retried = true;
    refreshInFlight ??= api
      .post<AuthResponse>("/api/v1/auth/refresh", {
        refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
      })
      .then(({ data }) => {
        saveSession(data, { silent: true });
        return data.accessToken;
      })
      .catch(() => {
        // The session is really gone: clear state AND get the user
        // back to the login page (never silent — cart/wishlist must
        // drop to guest mode too).
        clearSession();
        redirectToLogin();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });

    const token = await refreshInFlight;
    if (!token) return Promise.reject(error);

    request.headers.Authorization = `Bearer ${token}`;
    return api.request(request);
  },
);

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<ProblemDetails & { errors?: Record<string, string[]> }>(err)) {
    const data = err.response?.data;
    if (data?.errors) {
      const firstValidationMessage = Object.values(data.errors)
        .flat()
        .filter(Boolean)[0];
      if (firstValidationMessage) return firstValidationMessage;
    }
    return data?.detail ?? data?.title ?? fallback;
  }
  return fallback;
}