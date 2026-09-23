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
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import StatusBadge from "@/app/components/Admin/StatusBadge";
import ConfirmModal from "@/app/components/Admin/ConfirmModal";
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

function firstDefined(
  raw: Record<string, unknown>,
  keys: string[]
): unknown {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
}

function toRow(raw: Record<string, unknown>): AgentRow | null {
  const id = String(
    firstDefined(raw, ["id", "agentId", "_id", "uuid"]) ?? ""
  ).trim();
  if (!id) return null;
  return {
    id,
    agentId: id,
    name: String(firstDefined(raw, ["name", "agentName", "fullName"]) ?? "Unknown"),
    email: (firstDefined(raw, ["email", "agentEmail"]) as string | null) ?? null,
    phone: (firstDefined(raw, ["phone", "phoneNumber", "mobile", "contact"]) as
      | string
      | null) ?? null,
    employeeCode:
      (firstDefined(raw, ["employeeCode", "empCode", "code"]) as
        | string
        | null) ?? null,
    status: String(firstDefined(raw, ["status", "agentStatus"]) ?? "Unknown"),
    dealerCount:
      Number(
        firstDefined(raw, [
          "dealerCount",
          "dealersCount",
          "totalDealers",
          "dealers",
          "shopCount",
        ])
      ) || 0,
  };
}

/**
 * Tolerant unwrapper: backend list responses come in many shapes
 * ({ items }, { agents }, { rows }, { results }, { data }, or a raw
 * array). Only accepting one shape here is what was silently making
 * the table show "No agents found" even on a successful API call.
 */
function unwrapList(payload: unknown): {
  rows: AgentRow[];
  total: number;
} {
  const root = (payload as Record<string, unknown> | null) ?? {};

  let data: unknown[] = [];
  if (Array.isArray(root)) {
    data = root;
  } else {
    const candidateKeys = [
      "items",
      "agents",
      "rows",
      "results",
      "records",
      "list",
      "data",
    ];
    for (const key of candidateKeys) {
      const value = root[key];
      if (Array.isArray(value)) {
        data = value;
        break;
      }
      // handle one extra level of nesting, e.g. { data: { items: [...] } }
      if (value && typeof value === "object") {
        const nested = value as Record<string, unknown>;
        for (const nestedKey of candidateKeys) {
          if (Array.isArray(nested[nestedKey])) {
            data = nested[nestedKey] as unknown[];
            break;
          }
        }
        if (data.length) break;
      }
    }
  }

  const rows = (data as Record<string, unknown>[])
    .map(toRow)
    .filter((r): r is AgentRow => r !== null);

  const totalRaw = firstDefined(root, [
    "totalCount",
    "total",
    "count",
    "totalItems",
  ]);
  const total = typeof totalRaw === "number" ? totalRaw : rows.length;

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

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AgentRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    passphrase: "",
    employeeCode: "",
    status: "Active",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      const payload = (res as { data?: unknown })?.data ?? res;
      const { rows: mapped, total } = unwrapList(payload);

      if (mapped.length === 0 && total === 0) {
        // Helpful during integration — remove once confirmed working.
        // eslint-disable-next-line no-console
        console.debug("[AdminAgentsPage] Empty result. Raw payload:", payload);
      }

      setRows(mapped);
      setTotalCount(total);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Unable to load agents."));
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-sora text-[20px] font-bold leading-tight text-navy">
              Agents
            </h1>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">
              Select an agent to view and manage their dealers/shops.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5">
              <Users size={16} className="text-navy" />
              <span className="text-[13px] font-bold text-ink">
                {totalCount}
              </span>
              <span className="text-[12px] text-ink-soft">total agents</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({
                  name: "",
                  email: "",
                  phone: "",
                  passphrase: "",
                  employeeCode: "",
                  status: "Active",
                });
                setFormErrors({});
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
            >
              <Plus size={15} />
              Add Agent
            </button>
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
          <table className="min-w-[860px] w-full text-left">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Employee Code</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Dealers</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
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
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-[13px] text-white">
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/agents/${row.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12px] font-semibold text-navy hover:border-navy"
                        >
                          <Eye size={13} />
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/admin/agents/${row.id}/dealers`)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#EDF3FF] px-3 py-2 text-[12px] font-bold text-[#1769F5] hover:bg-[#DCE8FF]"
                        >
                          <Store size={13} />
                          Dealers
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => {
                            setEditing(row);
                            setForm({
                              name: row.name,
                              email: row.email ?? "",
                              phone: row.phone ?? "",
                              passphrase: "",
                              employeeCode: row.employeeCode ?? "",
                              status: row.status,
                            });
                            setFormErrors({});
                            setModalOpen(true);
                          }}
                          className="rounded-lg border border-line p-2 text-ink-soft hover:border-navy hover:text-navy"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteId(row.id)}
                          className="rounded-lg border border-line p-2 text-ink-soft hover:border-red-400 hover:text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-line bg-white p-2 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit agent modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-xl bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-5 py-4">
              <h2 className="font-sora text-[15px] font-bold text-navy">
                {editing ? "Edit Agent" : "Add Agent"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-line p-1.5 text-ink-soft hover:text-ink"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-[11.5px] font-semibold text-ink">
                  Name <span className="text-red-500">*</span>
                </span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Agent full name"
                  className={`h-10 rounded-lg border bg-white px-3 text-[13px] outline-none focus:border-navy ${formErrors.name ? "border-red-400" : "border-line"}`}
                />
                {formErrors.name && (
                  <span className="text-[11px] text-red-500">
                    {formErrors.name}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-semibold text-ink">
                  Email <span className="text-red-500">*</span>
                </span>
                <input
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="agent@example.com"
                  className={`h-10 rounded-lg border bg-white px-3 text-[13px] outline-none focus:border-navy ${formErrors.email ? "border-red-400" : "border-line"}`}
                />
                {formErrors.email && (
                  <span className="text-[11px] text-red-500">
                    {formErrors.email}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-semibold text-ink">
                  Phone
                </span>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="10-digit mobile"
                  className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] outline-none focus:border-navy"
                />
              </label>
              {!editing && (
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[11.5px] font-semibold text-ink">
                    Passphrase <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="password"
                    value={form.passphrase}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        passphrase: e.target.value,
                      }))
                    }
                    placeholder="Min 12 characters"
                    className={`h-10 rounded-lg border bg-white px-3 text-[13px] outline-none focus:border-navy ${formErrors.passphrase ? "border-red-400" : "border-line"}`}
                  />
                  {formErrors.passphrase && (
                    <span className="text-[11px] text-red-500">
                      {formErrors.passphrase}
                    </span>
                  )}
                </label>
              )}
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-semibold text-ink">
                  Employee Code
                </span>
                <input
                  value={form.employeeCode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      employeeCode: e.target.value,
                    }))
                  }
                  placeholder="EMP-0001"
                  className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] outline-none focus:border-navy"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-semibold text-ink">
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </label>
            </div>
            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-line bg-white px-5 py-3.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-line px-4 py-2.5 text-[12.5px] font-semibold text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const next: Record<string, string> = {};
                  if (!form.name.trim()) next.name = "Name is required.";
                  if (!form.email.trim()) next.email = "Email is required.";
                  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
                    next.email = "Enter a valid email.";
                  if (!editing && form.passphrase.length < 12)
                    next.passphrase = "Min 12 characters.";
                  setFormErrors(next);
                  if (Object.keys(next).length > 0) return;
                  setSaving(true);
                  try {
                    if (editing) {
                      await agentsApi.update(editing.id, {
                        name: form.name.trim(),
                        email: form.email.trim(),
                        phone: form.phone.trim() || null,
                        employeeCode: form.employeeCode.trim() || null,
                        status: form.status,
                      });
                      toast.success("Agent updated successfully.");
                    } else {
                      await agentsApi.create({
                        name: form.name.trim(),
                        email: form.email.trim(),
                        phone: form.phone.trim() || null,
                        passphrase: form.passphrase,
                        employeeCode: form.employeeCode.trim() || null,
                        status: form.status,
                      });
                      toast.success("Agent created successfully.");
                    }
                    setModalOpen(false);
                    void load();
                  } catch (error) {
                    toast.error(
                      extractErrorMessage(error, "Unable to save agent.")
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                className="rounded-lg bg-navy px-5 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : editing
                    ? "Save Changes"
                    : "Add Agent"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="Delete agent?"
        description="The agent and their user account link will be removed. Agents with dealers cannot be deleted."
        confirmText="Delete"
        onConfirm={async () => {
          if (!deleteId) return;
          setDeleting(true);
          try {
            await agentsApi.remove(deleteId);
            toast.success("Agent deleted successfully.");
            setDeleteId(null);
            void load();
          } catch (error) {
            toast.error(
              extractErrorMessage(error, "Unable to delete agent.")
            );
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
        danger
      />
    </AdminLayout>
  );
}
