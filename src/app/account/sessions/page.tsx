// File: src/app/account/sessions/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  MonitorSmartphone,
  LogOut,
  ShieldCheck,
  Loader2,
  XCircle,
  CheckCircle2,
} from "lucide-react";

import { toast } from "react-toastify";
import { clearSession, extractErrorMessage } from "@/app/api/api";
import { authApi } from "@/app/api/services";

/* =====================================================
   TYPES (#9 sessions — tolerant of backend key variants)
===================================================== */

type SessionRow = {
  id: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string;
  ipAddress: string;
  userAgent: string;
  isCurrent: boolean;
};

function currentSessionId(): string {
  try {
    return localStorage.getItem("sessionId") ?? "";
  } catch {
    return "";
  }
}

function mapSession(entry: unknown): SessionRow | null {
  if (typeof entry !== "object" || entry === null) return null;
  const raw = entry as Record<string, unknown>;
  const id = String(raw.id ?? raw.sessionId ?? "").trim();
  if (!id) return null;
  return {
    id,
    createdAt: String(raw.createdAtUtc ?? raw.createdAt ?? ""),
    expiresAt: String(raw.expiresAtUtc ?? raw.expiresAt ?? ""),
    lastUsedAt: String(raw.lastUsedAtUtc ?? raw.lastUsedAt ?? ""),
    ipAddress: String(raw.ipAddress ?? raw.ip ?? ""),
    userAgent: String(raw.userAgent ?? raw.user_agent ?? raw.device ?? ""),
    isCurrent:
      Boolean(raw.isCurrent) || (currentSessionId() !== "" && id === currentSessionId()),
  };
}

function formatDateTime(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =====================================================
   PAGE
===================================================== */

export default function SessionsPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  /* =====================================================
     LOAD (#9 GET /api/v1/auth/sessions)
  ===================================================== */

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await authApi.sessions();
      const payload: unknown = response.data;
      const rawItems: unknown[] = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as Record<string, unknown>)?.items)
          ? ((payload as Record<string, unknown>).items as unknown[])
          : Array.isArray((payload as Record<string, unknown>)?.data)
            ? ((payload as Record<string, unknown>).data as unknown[])
            : [];
      setSessions(
        rawItems.flatMap((entry) => {
          const row = mapSession(entry);
          return row ? [row] : [];
        })
      );
    } catch (err) {
      console.error("Failed to load sessions:", err);
      const message = extractErrorMessage(
        err,
        "Failed to load sessions. Please try again."
      );
      setError(message);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /* =====================================================
     REVOKE ONE (#10 DELETE .../{sessionId} → 204)
  ===================================================== */

  const revokeSession = async (session: SessionRow) => {
    if (revokingId) return;
    setRevokingId(session.id);

    try {
      await authApi.revokeSession(session.id);

      if (session.isCurrent) {
        // Revoked the session this device uses — sign out locally.
        clearSession();
        toast.success("Current session revoked. Signing you out...");
        setTimeout(() => router.push("/login"), 800);
        return;
      }

      setSessions((current) =>
        current.filter((item) => item.id !== session.id)
      );
      toast.success("Session revoked.");
    } catch (err) {
      console.error("Failed to revoke session:", err);
      // 404 unknown session — drop the stale row anyway.
      if ((err as { response?: { status?: number } })?.response?.status === 404) {
        setSessions((current) =>
          current.filter((item) => item.id !== session.id)
        );
      } else {
        toast.error(
          extractErrorMessage(err, "Unable to revoke session. Please try again.")
        );
      }
    } finally {
      setRevokingId(null);
    }
  };

  /* =====================================================
     LOGOUT ALL (#7 POST /api/v1/auth/logout-all)
  ===================================================== */

  const logoutAll = async () => {
    if (loggingOutAll) return;
    if (
      !window.confirm(
        "End all sessions including this device? You will be signed out everywhere."
      )
    ) {
      return;
    }

    setLoggingOutAll(true);
    try {
      await authApi.logoutAll();
    } catch (err) {
      console.error("Logout-all failed:", err);
    } finally {
      clearSession();
      router.push("/login");
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1769F5]" />
          <p className="mt-4 text-[13px] font-medium text-[#718096]">
            Loading your sessions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* BREADCRUMB */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[13px]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[#1769F5] hover:underline"
        >
          Home
        </button>
        <span className="text-[#9AA9BF]">›</span>
        <button
          type="button"
          onClick={() => router.push("/account")}
          className="text-[#718096] hover:text-[#1769F5]"
        >
          My Account
        </button>
        <span className="text-[#9AA9BF]">›</span>
        <strong className="font-semibold text-[#102D62]">Sessions</strong>
      </div>

      {/* HEADER */}
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#102D62] transition hover:bg-white hover:shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#102D62] sm:text-[34px]">
              Active Sessions
            </h1>
            <p className="mt-1 text-[13px] text-[#718096] sm:text-[14px]">
              {sessions.length === 0
                ? "No active sessions found."
                : `${sessions.length} device${sessions.length === 1 ? "" : "s"} signed in to your account.`}
            </p>
          </div>
        </div>

        {sessions.length > 0 && (
          <button
            type="button"
            onClick={logoutAll}
            disabled={loggingOutAll}
            className="flex h-11 items-center gap-2 rounded-[12px] border border-[#F0D4D4] bg-white px-4 text-[12px] font-bold text-[#D92D20] transition hover:bg-[#FFF5F5] disabled:opacity-50"
          >
            {loggingOutAll ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            Sign out all devices
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-center rounded-[12px] border border-[#FECACA] bg-[#FFF2F2] px-4 py-3"
        >
          <XCircle size={18} className="mr-2 shrink-0 text-[#EF4444]" />
          <p className="text-[12px] font-medium text-[#D92D20]">{error}</p>
          <button
            type="button"
            onClick={fetchSessions}
            className="ml-auto shrink-0 text-[12px] font-bold text-[#D92D20] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* SESSION LIST */}
      {sessions.length === 0 && !error ? (
        <section className="rounded-[20px] border border-dashed border-[#D9E2EE] bg-white px-6 py-14 text-center">
          <MonitorSmartphone size={28} className="mx-auto text-[#9AA9BF]" />
          <h2 className="mt-3 text-[15px] font-bold text-[#102D62]">
            No active sessions
          </h2>
          <p className="mx-auto mt-1 max-w-[380px] text-[12px] text-[#718096]">
            Devices you sign in with will appear here so you can review
            and revoke them.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {sessions.map((session) => (
            <article
              key={session.id}
              className="flex flex-col gap-4 rounded-[16px] border border-[#E1E8F1] bg-white p-4 shadow-[0_12px_35px_rgba(30,72,130,0.05)] sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#1769F5]">
                <MonitorSmartphone size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[13px] font-bold text-[#102D62]">
                    {session.userAgent || "Unknown device"}
                  </p>
                  {session.isCurrent && (
                    <span className="flex items-center gap-1 rounded-full bg-[#EAF9F0] px-2.5 py-1 text-[10px] font-bold text-[#159447]">
                      <CheckCircle2 size={12} />
                      This device
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#718096]">
                  {session.ipAddress && <span>IP {session.ipAddress}</span>}
                  {session.lastUsedAt && (
                    <span>Last active {formatDateTime(session.lastUsedAt)}</span>
                  )}
                  {session.expiresAt && (
                    <span>Expires {formatDateTime(session.expiresAt)}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => revokeSession(session)}
                disabled={revokingId === session.id}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-[#E1E8EF] px-4 text-[12px] font-bold text-[#D92D20] transition hover:border-[#F0D4D4] hover:bg-[#FFF5F5] disabled:opacity-50 sm:w-auto"
              >
                {revokingId === session.id ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <LogOut size={15} />
                )}
                Revoke
              </button>
            </article>
          ))}
        </section>
      )}

      {/* SECURITY NOTE */}
      <div className="mt-5 flex items-start gap-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <ShieldCheck size={23} />
        </div>
        <div>
          <h3 className="font-bold text-[#123d7a]">Keep your account secure</h3>
          <p className="mt-1 text-sm leading-6 text-[#476184]">
            If you notice a device you don&apos;t recognise, revoke it
            right away and change your password.
          </p>
        </div>
      </div>
    </>
  );
}
