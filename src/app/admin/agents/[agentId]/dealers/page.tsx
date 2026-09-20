"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Package,
  ArrowLeft,
  Store,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import StatusBadge from "@/app/components/Admin/StatusBadge";
import { agentsApi, dealersApi } from "@/app/api/services";
import { extractErrorMessage } from "@/app/api/api";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

/* ============================================================
   TYPES
============================================================ */

type DealerRow = {
  id: string;
  agentId: string;
  agentName?: string | null;
  dealerCode: string;
  shopName: string;
  ownerName: string;
  email?: string | null;
  phone: string;
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  shopDescription?: string | null;
  shopLogo?: string | null;
  status: string;
  productCount: number;
};

const EMPTY_FORM = {
  dealerCode: "",
  shopName: "",
  ownerName: "",
  email: "",
  phone: "",
  alternatePhone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  gstNumber: "",
  panNumber: "",
  shopDescription: "",
  shopLogo: "",
  status: "Active",
};

type DealerForm = typeof EMPTY_FORM;

function toRow(raw: Record<string, unknown>): DealerRow | null {
  const id = String(
    raw.id ?? raw.dealerId ?? ""
  ).trim();
  if (!id) return null;
  return {
    id,
    agentId: String(raw.agentId ?? ""),
    agentName: (raw.agentName as string | null) ?? null,
    dealerCode: String(raw.dealerCode ?? ""),
    shopName: String(raw.shopName ?? ""),
    ownerName: String(raw.ownerName ?? ""),
    email: (raw.email as string | null) ?? null,
    phone: String(raw.phone ?? ""),
    alternatePhone: (raw.alternatePhone as string | null) ?? null,
    address: (raw.address as string | null) ?? null,
    city: (raw.city as string | null) ?? null,
    state: (raw.state as string | null) ?? null,
    country: (raw.country as string | null) ?? null,
    pincode: (raw.pincode as string | null) ?? null,
    gstNumber:
      ((raw.gstNumber ?? raw.gSTNumber) as string | null) ?? null,
    panNumber:
      ((raw.panNumber ?? raw.pANNumber) as string | null) ?? null,
    shopDescription:
      (raw.shopDescription as string | null) ?? null,
    shopLogo: (raw.shopLogo as string | null) ?? null,
    status: String(raw.status ?? "Unknown"),
    productCount: Number(raw.productCount ?? 0) || 0,
  };
}

function unwrapList(payload: unknown): {
  rows: DealerRow[];
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
    .filter((r): r is DealerRow => r !== null);
  const total =
    typeof root.totalCount === "number"
      ? root.totalCount
      : rows.length;
  return { rows, total };
}

/* ============================================================
   FORM INPUT
============================================================ */

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-semibold text-ink">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-10 rounded-lg border bg-white px-3 text-[13px] outline-none focus:border-navy ${
          error ? "border-red-400" : "border-line"
        }`}
      />
      {error && (
        <span className="text-[11px] text-red-500">{error}</span>
      )}
    </label>
  );
}

/* ============================================================
   PAGE — Admin → Agents → Dealers
============================================================ */

export default function AgentDealersPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = String(params?.agentId ?? "");

  const [agentName, setAgentName] = useState("");
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [rows, setRows] = useState<DealerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DealerRow | null>(null);
  const [form, setForm] = useState<DealerForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<DealerForm>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const [agentRes, dealerRes] = await Promise.all([
        agentsApi.details(agentId).catch(() => null),
        agentsApi.dealers(agentId, {
          page,
          pageSize,
          search: debouncedSearch || undefined,
          status: statusFilter === "All" ? undefined : statusFilter,
        }),
      ]);
      if (agentRes) {
        const a =
          ((agentRes as { data?: unknown })?.data ??
            agentRes) as Record<string, unknown>;
        setAgentName(String(a.name ?? "Agent"));
        setAgentStatus(String(a.status ?? ""));
      }
      const { rows: mapped, total } = unwrapList(
        (dealerRes as { data?: unknown })?.data ?? dealerRes
      );
      setRows(mapped);
      setTotalCount(total);
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Unable to load dealers.")
      );
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [agentId, page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ---------------- validation ---------------- */

  const validate = (f: DealerForm): Partial<DealerForm> => {
    const errors: Partial<DealerForm> = {};
    if (!f.shopName.trim()) errors.shopName = "Shop name is required.";
    if (!f.ownerName.trim()) errors.ownerName = "Owner name is required.";
    if (!f.phone.trim()) errors.phone = "Phone is required.";
    if (
      f.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())
    ) {
      errors.email = "Enter a valid email address.";
    }
    return errors;
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (row: DealerRow) => {
    setEditing(row);
    setForm({
      dealerCode: row.dealerCode,
      shopName: row.shopName,
      ownerName: row.ownerName,
      email: row.email ?? "",
      phone: row.phone,
      alternatePhone: row.alternatePhone ?? "",
      address: row.address ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      country: row.country ?? "",
      pincode: row.pincode ?? "",
      gstNumber: row.gstNumber ?? "",
      panNumber: row.panNumber ?? "",
      shopDescription: row.shopDescription ?? "",
      shopLogo: row.shopLogo ?? "",
      status: row.status,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const errors = validate(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        shopName: form.shopName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        country: form.country.trim() || null,
        pincode: form.pincode.trim() || null,
        gstNumber: form.gstNumber.trim() || null,
        panNumber: form.panNumber.trim() || null,
        shopDescription: form.shopDescription.trim() || null,
        shopLogo: form.shopLogo.trim() || null,
        status: form.status,
      };
      if (form.dealerCode.trim()) {
        payload.dealerCode = form.dealerCode.trim();
      }

      if (editing) {
        await dealersApi.update(editing.id, payload);
        toast.success("Dealer updated successfully.");
      } else {
        // The agent is fixed by the page context — never free-assignable.
        await dealersApi.create({ ...payload, agentId });
        toast.success("Dealer added successfully.");
      }
      setModalOpen(false);
      void load();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Unable to save dealer.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async (row: DealerRow) => {
    const result = await Swal.fire({
      title: "Delete dealer?",
      text: `${row.shopName} will be permanently removed. Dealers with products cannot be deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await dealersApi.remove(row.id);
      void load();
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Dealer deleted successfully.",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } catch (error) {
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: extractErrorMessage(error, "Unable to delete dealer."),
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const toggleStatus = async (row: DealerRow) => {
    try {
      await dealersApi.setStatus(
        row.id,
        row.status === "Active" ? "Inactive" : "Active"
      );
      toast.success("Dealer status updated.");
      void load();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Unable to update status.")
      );
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const activeCount = rows.filter((r) => r.status === "Active").length;

  const set = (key: keyof DealerForm) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {/* Header */}
        <div>
          <button
            type="button"
            onClick={() => router.push("/admin/agents")}
            className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft hover:text-navy"
          >
            <ArrowLeft size={13} />
            Back to Agents
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3">
<<<<<<< HEAD
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white font-bold">
                {(agentName || "A").charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="font-sora text-[18px] font-bold text-navy">
                  Dealers{agentName ? ` — ${agentName}` : ""}
                </h1>
                <p className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-soft">
                  {agentStatus && <span className="rounded bg-[#EAF8F0] px-2 py-0.5 text-[10px] font-bold text-[#249357]">{agentStatus}</span>}
                  Shops assigned to this agent
                </p>
              </div>
=======
            <div>
              <h1 className="font-sora text-[20px] font-bold text-navy">
                Dealers{agentName ? ` — ${agentName}` : ""}
              </h1>
              <p className="mt-1 text-[12.5px] text-ink-soft">
                Shops served by this agent. Every dealer
                created here is automatically assigned to
                this agent.
              </p>
>>>>>>> J-Devops
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
            >
              <Plus size={15} />
              Add Dealer
            </button>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/admin/agents/${agentId}`)}
            className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-ink-soft hover:text-navy"
          >
            View Agent Details
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Total dealers", value: totalCount },
            { label: "Active (this page)", value: activeCount },
            {
              label: "Inactive (this page)",
              value: rows.length - activeCount,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                <Store size={16} />
              </span>
              <div>
                <div className="text-[16px] font-bold text-ink">
                  {s.value}
                </div>
                <div className="text-[11.5px] text-ink-soft">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
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
              placeholder="Search shop, owner, code, city, phone…"
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
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="min-w-[980px] w-full text-left">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Dealer Code</th>
                <th className="px-4 py-3 font-semibold">Shop Name</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[13px] text-ink-soft"
                  >
                    Loading dealers…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center"
                  >
                    <p className="text-[13px] text-ink-soft">
                      No dealers found.
                    </p>
                    <button
                      type="button"
                      onClick={openAdd}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-[12px] font-bold text-white"
                    >
                      <Plus size={14} />
                      Add Dealer
                    </button>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line last:border-0 hover:bg-paper"
                  >
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-[#F3F5F8] px-2 py-1 font-mono text-[11.5px] font-semibold text-ink">
                        {row.dealerCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold text-ink">
                      {row.shopName}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-ink-soft">
                      {row.ownerName}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-ink-soft">
                      {row.phone}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-ink-soft">
                      {row.city || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleStatus(row)}
                        title="Toggle status"
                      >
                        <StatusBadge status={row.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="View details"
                          onClick={() =>
                            router.push(
                              `/admin/agents/${agentId}/dealers/${row.id}`
                            )
                          }
                          className="rounded-lg border border-line p-2 text-ink-soft hover:border-navy hover:text-navy"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          title="Products"
                          onClick={() =>
                            router.push(
                              `/admin/agents/${agentId}/dealers/${row.id}/products`
                            )
                          }
                          className="rounded-lg border border-line p-2 text-ink-soft hover:border-navy hover:text-navy"
                        >
                          <Package size={14} />
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(row)}
                          className="rounded-lg border border-line p-2 text-ink-soft hover:border-navy hover:text-navy"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => handleDeleteClick(row)}
                          className="rounded-lg border border-line p-2 text-ink-soft hover:border-red-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
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
            Showing {rows.length} of {totalCount} dealers
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

      {/* Add / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-xl bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-5 py-4">
              <h2 className="font-sora text-[15px] font-bold text-navy">
                {editing ? "Edit Dealer" : "Add Dealer"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[13px] font-semibold text-ink-soft hover:text-ink"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
              <FormInput
                label="Dealer Code (auto if empty)"
                value={form.dealerCode}
                onChange={set("dealerCode")}
                placeholder="DLR-XXXXXX"
              />
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-semibold text-ink">
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(e) => set("status")(e.target.value)}
                  className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
              <FormInput
                label="Shop Name"
                value={form.shopName}
                onChange={set("shopName")}
                required
                error={formErrors.shopName}
              />
              <FormInput
                label="Owner Name"
                value={form.ownerName}
                onChange={set("ownerName")}
                required
                error={formErrors.ownerName}
              />
              <FormInput
                label="Email"
                value={form.email}
                onChange={set("email")}
                placeholder="shop@example.com"
                error={formErrors.email}
              />
              <FormInput
                label="Phone"
                value={form.phone}
                onChange={set("phone")}
                required
                error={formErrors.phone}
              />
              <FormInput
                label="Alternate Phone"
                value={form.alternatePhone}
                onChange={set("alternatePhone")}
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="Address"
                  value={form.address}
                  onChange={set("address")}
                />
              </div>
              <FormInput label="City" value={form.city} onChange={set("city")} />
              <FormInput
                label="State"
                value={form.state}
                onChange={set("state")}
              />
              <FormInput
                label="Country"
                value={form.country}
                onChange={set("country")}
              />
              <FormInput
                label="Pincode"
                value={form.pincode}
                onChange={set("pincode")}
              />
              <FormInput
                label="GST Number"
                value={form.gstNumber}
                onChange={set("gstNumber")}
              />
              <FormInput
                label="PAN Number"
                value={form.panNumber}
                onChange={set("panNumber")}
              />
              <FormInput
                label="Shop Logo (URL)"
                value={form.shopLogo}
                onChange={set("shopLogo")}
              />
              <div className="sm:col-span-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[11.5px] font-semibold text-ink">
                    Shop Description
                  </span>
                  <textarea
                    value={form.shopDescription}
                    onChange={(e) =>
                      set("shopDescription")(e.target.value)
                    }
                    rows={3}
                    className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-navy"
                  />
                </label>
              </div>
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
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-navy px-5 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : editing
                    ? "Save Changes"
                    : "Add Dealer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
