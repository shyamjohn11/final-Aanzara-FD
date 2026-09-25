"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Store,
  Package,
  Eye,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Plus,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import StatusBadge from "@/app/components/Admin/StatusBadge";
import AddDealerDialog from "@/app/components/Admin/AddDealerDialog";
import { agentsApi } from "@/app/api/services";
import { extractErrorMessage } from "@/app/api/api";
import { toast } from "react-toastify";

type AgentDetails = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  employeeCode?: string | null;
  status: string;
  dealerCount: number;
  createdAt?: string;
};

type DealerRow = {
  id: string;
  shopName: string;
  dealerCode: string;
  ownerName: string;
  city?: string | null;
  status: string;
  productCount: number;
  phone?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
};

function toDealerRow(raw: Record<string, unknown>): DealerRow | null {
  const id = String(raw.id ?? raw.dealerId ?? "").trim();
  if (!id) return null;
  const str = (v: unknown) =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
  return {
    id,
    shopName: String(raw.shopName ?? ""),
    dealerCode: String(raw.dealerCode ?? ""),
    ownerName: String(raw.ownerName ?? ""),
    city: (raw.city as string | null) ?? null,
    status: String(raw.status ?? "Unknown"),
    productCount: Number(raw.productCount ?? 0) || 0,
    phone: str(raw.phone),
    alternatePhone: str(raw.alternatePhone),
    email: str(raw.email),
    address: str(raw.address),
    gstNumber: str(raw.gstNumber),
    panNumber: str(raw.panNumber),
  };
}

export default function AgentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = String(params?.agentId ?? "");

  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [dealers, setDealers] = useState<DealerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealersLoading, setDealersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editingDealer, setEditingDealer] =
    useState<DealerRow | null>(null);
  const pageSize = 6;

  const loadAgent = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const res = await agentsApi.details(agentId);
      const d = ((res as { data?: unknown })?.data ?? res) as Record<string, unknown>;
      setAgent({
        id: String(d.id ?? d.agentId ?? agentId),
        name: String(d.name ?? "Unknown"),
        email: (d.email as string | null) ?? null,
        phone: (d.phone as string | null) ?? null,
        employeeCode: (d.employeeCode as string | null) ?? null,
        status: String(d.status ?? "Unknown"),
        dealerCount: Number(d.dealerCount ?? 0) || 0,
        createdAt: (d.createdAt as string) ?? undefined,
      });
    } catch (error) {
      toast.error(extractErrorMessage(error, "Unable to load agent."));
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const loadDealers = useCallback(async () => {
    if (!agentId) return;
    setDealersLoading(true);
    try {
      const res = await agentsApi.dealers(agentId, {
        page,
        pageSize,
        search: search.trim() || undefined,
      });
      const payload = ((res as { data?: unknown })?.data ?? res) as Record<string, unknown>;
      const items = Array.isArray(payload.items)
        ? (payload.items as Record<string, unknown>[])
        : Array.isArray(payload)
          ? (payload as Record<string, unknown>[])
          : [];
      const rows = items.map(toDealerRow).filter((r): r is DealerRow => r !== null);
      setDealers(rows);
      setTotalCount(typeof payload.totalCount === "number" ? payload.totalCount : rows.length);
    } catch {
      setDealers([]);
      setTotalCount(0);
    } finally {
      setDealersLoading(false);
    }
  }, [agentId, page, search]);

  useEffect(() => {
    void loadAgent();
  }, [loadAgent]);

  useEffect(() => {
    void loadDealers();
  }, [loadDealers]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <button
          type="button"
          onClick={() => router.push("/admin/agents")}
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-ink-soft hover:text-navy"
        >
          <ArrowLeft size={13} /> Back to Agents
        </button>

        {loading ? (
          <div className="rounded-xl border border-line bg-white p-10 text-center text-[13px] text-ink-soft">
            Loading agent…
          </div>
        ) : !agent ? (
          <div className="rounded-xl border border-line bg-white p-10 text-center text-[13px] text-ink-soft">
            Agent not found.
          </div>
        ) : (
          <>
            {/* Agent Details Card */}
            <section className="rounded-xl border border-line bg-white p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white">
                    <UserRound size={22} />
                  </span>
                  <div>
                    <h1 className="font-sora text-[18px] font-bold text-navy">{agent.name}</h1>
                    <p className="font-mono text-[11.5px] text-ink-soft">{agent.employeeCode || "—"}</p>
                  </div>
                </div>
                <StatusBadge status={agent.status} size="lg" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Email</span>
                  <span className="inline-flex items-center gap-1 text-[13.5px] font-medium text-ink">
                    {agent.email ? <><Mail size={12} />{agent.email}</> : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Phone</span>
                  <span className="inline-flex items-center gap-1 text-[13.5px] font-medium text-ink">
                    {agent.phone ? <><Phone size={12} />{agent.phone}</> : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Dealers Assigned</span>
                  <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-navy">
                    <Store size={14} /> {agent.dealerCount}
                  </span>
                </div>
              </div>
            </section>

            {/* Assigned Dealers */}
            <section className="rounded-xl border border-line bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-sora text-[15px] font-bold text-ink">Dealers / Shops assigned to this Agent</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90"
                  >
                    <Plus size={13} /> Add Dealer
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/agents/${agentId}/dealers`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12px] font-semibold text-navy hover:border-navy"
                  >
                    <Eye size={13} /> View All Dealers
                  </button>
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search shop, owner, city…"
                    className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[12.5px] outline-none focus:border-navy"
                  />
                </div>
              </div>

              {dealersLoading ? (
                <div className="py-8 text-center text-[12.5px] text-ink-soft">Loading dealers…</div>
              ) : dealers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-ink-soft">No dealers assigned to this agent yet.</p>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/agents/${agentId}/dealers`)}
                    className="mt-3 rounded-lg bg-navy px-4 py-2 text-[12px] font-bold text-white"
                  >
                    Manage Dealers
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="min-w-[760px] w-full text-left">
                    <thead>
                      <tr className="border-b border-line bg-paper text-[11px] uppercase tracking-wide text-ink-faint">
                        <th className="px-3 py-2.5 font-semibold">Dealer Code</th>
                        <th className="px-3 py-2.5 font-semibold">Shop Name</th>
                        <th className="px-3 py-2.5 font-semibold">Owner</th>
                        <th className="px-3 py-2.5 font-semibold">City</th>
                        <th className="px-3 py-2.5 font-semibold">Products</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dealers.map((d) => (
                        <tr key={d.id} className="border-b border-line last:border-0 hover:bg-paper">
                          <td className="px-3 py-2.5 font-mono text-[11.5px] font-semibold text-ink">{d.dealerCode}</td>
                          <td className="px-3 py-2.5 text-[12.5px] font-bold text-ink">{d.shopName}</td>
                          <td className="px-3 py-2.5 text-[12.5px] text-ink-soft">{d.ownerName}</td>
                          <td className="px-3 py-2.5 text-[12.5px] text-ink-soft">{d.city || "—"}</td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#EAF8F0] px-2 py-0.5 text-[11px] font-bold text-[#249357]">
                              <Package size={11} /> {d.productCount}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge status={d.status} />
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="View dealer"
                                onClick={() => router.push(`/admin/agents/${agentId}/dealers/${d.id}`)}
                                className="rounded-md border border-line p-1.5 text-ink-soft hover:border-navy hover:text-navy"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                title="Edit dealer"
                                onClick={() => setEditingDealer(d)}
                                className="rounded-md border border-line p-1.5 text-ink-soft hover:border-navy hover:text-navy"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                title="Dealer products"
                                onClick={() => router.push(`/admin/agents/${agentId}/dealers/${d.id}/products`)}
                                className="rounded-md border border-line p-1.5 text-ink-soft hover:border-navy hover:text-navy"
                              >
                                <Package size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalCount > pageSize && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11.5px] text-ink-soft">
                    Showing {dealers.length} of {totalCount}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-md border border-line bg-white p-1.5 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="px-2 text-[11.5px] font-semibold text-ink">
                      {page} / {Math.max(1, Math.ceil(totalCount / pageSize))}
                    </span>
                    <button
                      type="button"
                      disabled={page >= Math.ceil(totalCount / pageSize)}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-md border border-line bg-white p-1.5 disabled:opacity-40"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </section>

            <AddDealerDialog
              open={addOpen || editingDealer !== null}
              onClose={() => {
                setAddOpen(false);
                setEditingDealer(null);
              }}
              agentId={agentId}
              agentName={agent?.name ?? ""}
              editing={editingDealer}
              onCreated={() => {
                setPage(1);
                void loadDealers();
                void loadAgent();
              }}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
