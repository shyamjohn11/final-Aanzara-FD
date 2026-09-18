"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Store,
  Eye,
  Phone,
  Mail,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import StatusBadge from "@/app/components/Admin/StatusBadge";
import { agentsApi } from "@/app/api/services";
import { extractErrorMessage } from "@/app/api/api";
import { toast } from "react-toastify";

/* ============================================================
   TYPES
============================================================ */

type AgentRow = {
  id: string;
  agentId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  employeeCode?: string | null;
  status: string;
  dealerCount: number;
};

function toRow(raw: Record<string, unknown>): AgentRow | null {
  const id = String(
    raw.id ?? raw.agentId ?? ""
  ).trim();
  if (!id) return null;
  return {
    id,
    agentId: id,
    name: String(raw.name ?? "Unknown"),
    email: (raw.email as string | null) ?? null,
    phone: (raw.phone as string | null) ?? null,
    employeeCode: (raw.employeeCode as string | null) ?? null,
    status: String(raw.status ?? "Unknown"),
    dealerCount: Number(raw.dealerCount ?? 0) || 0,
  };
}

function unwrapList(payload: unknown): {
  rows: AgentRow[];
  total: number;
} {
  const root =
    (payload as Record<string, unknown> | null) ?? {};
  const data = Array.isArray(root)
    ? root
    : Array.isArray(root.items)
      ? (root.items as unknown[])
      : [];
  const rows = (data as Record<string, unknown>[])
    .map(toRow)
    .filter((r): r is AgentRow => r !== null);
  const total =
    typeof root.totalCount === "number"
      ? root.totalCount
      : rows.length;
  return { rows, total };
}

/* ============================================================
   PAGE — Admin → Agents → (View Dealers)
============================================================ */

export default function AdminAgentsPage() {
  const router = useRouter();

  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await agentsApi.list({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter === "All" ? undefined : statusFilter,
      });
      const { rows: mapped, total } = unwrapList(
        (res as { data?: unknown })?.data ?? res
      );
      setRows(mapped);
      setTotalCount(total);
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Unable to load agents.")
      );
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize)
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-sora text-[20px] font-bold text-navy">
              Agents
            </h1>
            <p className="mt-1 text-[12.5px] text-ink-soft">
              Select an agent to view and manage their
              dealers/shops.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5">
            <Users size={16} className="text-navy" />
            <span className="text-[13px] font-bold text-ink">
              {totalCount}
            </span>
            <span className="text-[12px] text-ink-soft">
              total agents
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, employee code…"
              className="h-10 w-full rounded-lg border border-line bg-white pl-10 pr-4 text-[13px] outline-none focus:border-navy"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] outline-none"
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="min-w-[860px] min-w-full text-left">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Employee Code</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Dealers</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-[13px] text-ink-soft"
                  >
                    Loading agents…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-[13px] text-ink-soft"
                  >
                    No agents found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line last:border-0 hover:bg-paper"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-bold text-[13px] text-white">
                          {row.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className="text-[13px] font-bold text-ink">
                            {row.name}
                          </div>
                          {row.email && (
                            <div className="flex items-center gap-1 text-[11px] text-ink-soft">
                              <Mail size={11} />
                              {row.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.phone ? (
                        <span className="flex items-center gap-1 text-[12px] text-ink-soft">
                          <Phone size={12} />
                          {row.phone}
                        </span>
                      ) : (
                        <span className="text-[12px] text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-soft">
                      {row.employeeCode || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#EDF3FF] px-2.5 py-1 text-[12px] font-bold text-[#1769F5]">
                        <Store size={12} />
                        {row.dealerCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/agents/${row.id}/dealers`)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12px] font-semibold text-navy hover:border-navy"
                      >
                        <Eye size={13} />
                        View Dealers
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-ink-soft">
            Showing {rows.length} of {totalCount} agents
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-line bg-white p-2 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 text-[12px] font-semibold text-ink">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
              className="rounded-lg border border-line bg-white p-2 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
