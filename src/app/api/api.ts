import axios, { type InternalAxiosRequestConfig } from "axios";
import { useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const SESSION_ID_KEY = "sessionId";
const USER_KEY = "aanzara_user";

// Browser requests remain same-origin and are forwarded to ASP.NET by the
// /api rewrite in next.config.js. This is the sole HTTP client for the app.
// Access/refresh tokens live in HttpOnly cookies set by the backend;
// withCredentials sends them automatically. A short-lived in-memory access
// token is still attached as Bearer when present for compatibility.
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/",
  withCredentials: true,
  // No JSON Content-Type default: axios would serialize FormData bodies to
  // JSON and the multipart endpoints reject them with 415. Object payloads
  // still get application/json automatically; FormData gets the boundary.
  headers: { Accept: "application/json" },
});

// In-memory only — never persisted to localStorage (XSS cannot steal cookies).
let memoryAccessToken: string | null = null;

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    memoryAccessToken ??
    (typeof window === "undefined"
      ? null
      : sessionStorage.getItem(ACCESS_TOKEN_KEY));
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
// ROLE RESOLUTION — single source of truth for client-side role
// UI. saveSession() stores the role in sessionStorage; the edge
// middleware reads the backend-issued HttpOnly cookies/JWT.
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
  // Access token: memory + sessionStorage only (not localStorage).
  // Refresh token: HttpOnly cookie only — never written to JS storage.
  memoryAccessToken = auth.accessToken;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  sessionStorage.setItem("aanzara_logged_in", "true");
  sessionStorage.setItem("aanzara_user_id", auth.user.userId);
  sessionStorage.setItem("aanzara_user_data", JSON.stringify(auth.user));
  sessionStorage.setItem("aanzara_user_role", resolvedRole);
  // Role/session presence cookies are set HttpOnly by the backend Set-Cookie
  // on login/refresh. Do not mirror them from JS — a script-writable role
  // cookie is forgeable. Edge proxy reads the HttpOnly cookies.
  if (!options?.silent) notifySessionChanged();
}

function setGuardCookie(
  name: string,
  value: string
) {
  // Retained only for logout cleanup of any legacy non-HttpOnly cookies.
  if (typeof document === "undefined") return;
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
  memoryAccessToken = null;
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
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  [
    "aanzara_logged_in",
    "aanzara_user_id",
    "aanzara_user_data",
    "aanzara_user_role",
  ].forEach((key) => sessionStorage.removeItem(key));
  // Clear legacy JS-writable cookies; HttpOnly cookies are cleared by POST /logout.
  clearGuardCookie("aanzara_session");
  clearGuardCookie("aanzara_role");
  if (!options?.silent) notifySessionChanged();
}

/** Role for client-side guards. The backend still enforces everything. */
export function getSessionRole(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = sessionStorage.getItem("aanzara_user_role");
    if (stored) return stored.toLowerCase();
    // HttpOnly role cookie is not readable from JS; edge proxy reads it.
    return "";
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
  const token = memoryAccessToken ?? sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    try {
      const payload = decodeJwtPayload(token);
      const exp = payload?.exp as number | undefined;
      if (typeof exp === "number" && exp * 1000 < Date.now() + 5000) return false;
      return true;
    } catch {
      return true;
    }
  }
  // No JS-readable access token (cookie-only session): rely on the
  // sessionStorage login flag; the refresh interceptor restores cookies.
  return sessionStorage.getItem("aanzara_logged_in") === "true";
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
 * Reconcile client session state with the edge guard.
 *
 * HttpOnly cookies are set only by the backend on login/refresh and are
 * not readable from JS — never mirror them from document.cookie.
 *
 * - Token/session flag gone: clear leftover client state so the edge
 *   guard stops bouncing /login back into the app.
 * - Logged-in but access token missing from JS: trigger a silent cookie
 *   refresh so the backend re-issues HttpOnly cookies (no-op failure
 *   leaves state cleared).
 */
export function reconcileGuardCookies(): "cleared" | "restored" | null {
  if (typeof window === "undefined") return null;
  const loggedIn = hasSession();
  const token = memoryAccessToken ?? sessionStorage.getItem(ACCESS_TOKEN_KEY);

  if (!loggedIn) {
    if (sessionStorage.getItem("aanzara_user_data") || localStorage.getItem(USER_KEY)) {
      clearSession({ silent: true });
      return "cleared";
    }
    return null;
  }

  if (!token) {
    // Cookie-only session (flag present, token gone from JS): restore in
    // the background via the shared refresh singleton. On failure drop
    // the stale client state silently; the backend drops the dead
    // cookies, and the next guard evaluation bounces correctly.
    void performRefresh().then((auth) => {
      if (!auth) clearSession({ silent: true });
    });
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

let refreshInFlight: Promise<AuthResponse | null> | null = null;

/**
 * Single shared cookie refresh. Every caller (401 interceptor, guard
 * reconcile, session restore) dedupes onto the same in-flight promise:
 * refresh tokens are single-use rotations, so two concurrent refresh
 * POSTs would make the second look like a replay and nuke ALL of the
 * user's sessions server-side.
 */
function performRefresh(): Promise<AuthResponse | null> {
  refreshInFlight ??= api
    .post<AuthResponse>("/api/v1/auth/refresh", {})
    .then(({ data }) => {
      saveSession(data, { silent: true });
      return data;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/**
 * Restore client session state from the HttpOnly cookies.
 *
 * sessionStorage is per-tab but cookies are shared: a fresh tab, a
 * browser restart, or a cleared storage leaves hasSession() false while
 * the backend session is still alive. Bouncing straight to /login then
 * makes the edge guard bounce back (cookies are valid) — an infinite
 * redirect loop that never reaches login OR the dashboard.
 *
 * Instead, attempt one silent cookie refresh first:
 * - success → sessionStorage repopulated, resolved role returned.
 * - failure → stale client state cleared; the backend also drops the
 *   dead cookies on refresh failure, so a subsequent /login renders.
 *
 * Skipped entirely for guests with no session traces (avoids a pointless
 * refresh POST — and auth rate-limit spend — on every public page load)
 * unless `force` is set (protected routes: the edge guard already proved
 * cookies exist by letting the page render).
 */
export function restoreSessionFromCookies(options?: {
  force?: boolean;
}): Promise<AppRole | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (hasSession()) {
    const role = getSessionRole();
    return Promise.resolve(role ? (role as AppRole) : "customer");
  }
  let hasTraces = false;
  try {
    hasTraces =
      !!sessionStorage.getItem("aanzara_user_data") ||
      !!localStorage.getItem(USER_KEY);
  } catch {
    hasTraces = false;
  }
  if (!hasTraces && !options?.force) return Promise.resolve(null);
  return performRefresh().then((auth) => {
    if (!auth) {
      clearSession({ silent: true });
      return null;
    }
    return resolveUserRole(auth);
  });
}

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
    const refreshed = await performRefresh();
    if (!refreshed) {
      // The session is really gone: clear state AND get the user
      // back to the login page (never silent — cart/wishlist must
      // drop to guest mode too). The backend drops the dead HttpOnly
      // cookies on refresh failure, so the edge guard lets /login
      // render instead of bouncing back into the app.
      clearSession();
      redirectToLogin();
      return Promise.reject(error);
    }

    request.headers.Authorization = `Bearer ${refreshed.accessToken}`;
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