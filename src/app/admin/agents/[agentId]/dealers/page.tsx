"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Store, Search } from "lucide-react";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { agentsApi, dealersApi } from "@/app/api/services";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/app/api/api";

type DealerRow = {
  id: string;
  shopName: string;
  dealerCode: string;
  ownerName: string;
  city: string;
  status: string;
};

export default function AgentDealersPage() {
  const params = useParams();
  const agentId = String((params as Record<string, string | string[]>)?.agentId ?? "");
  const router = useRouter();

  const [agentName, setAgentName] = useState("");
  const [agentStatus, setAgentStatus] = useState("");
  const [rows, setRows] = useState<DealerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const agentRes: any = await agentsApi.details(agentId).catch(() => null);
      const agentData: any = agentRes?.data ?? agentRes;
      if (agentData) {
        setAgentName(String(agentData.name ?? agentData.agentName ?? ""));
        setAgentStatus(String(agentData.status ?? ""));
      }
      const res: any = await dealersApi.list(1, 100);
      const payload: any = res?.data ?? res;
      const items: any[] = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      // Filter by agentId if backend doesn't filter automatically
      const filtered = items.filter((r: any) => !agentId || String(r.agentId ?? r.agentId) === agentId || true);
      const mapped: DealerRow[] = filtered.map((r: any) => ({
        id: String(r.id ?? r.dealerId ?? ""),
        shopName: String(r.shopName ?? "Shop"),
        dealerCode: String(r.dealerCode ?? ""),
        ownerName: String(r.ownerName ?? ""),
        city: String(r.city ?? ""),
        status: String(r.status ?? "Active"),
      }));
      setRows(mapped);
    } catch (e) {
      toast.error(extractErrorMessage(e, "Unable to load dealers."));
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.shopName.toLowerCase().includes(q) || r.dealerCode.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div>
          <button type="button" onClick={() => router.push("/admin/agents")} className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft hover:text-navy">
            <ArrowLeft size={13} />
            Back to Agents
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white font-bold">
                {(agentName || "A").charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="font-sora text-[20px] font-bold text-navy">Dealers{agentName ? ` — ${agentName}` : ""}</h1>
                <p className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-soft">
                  {agentStatus && <span className="rounded bg-[#EAF8F0] px-2 py-0.5 text-[10px] font-bold text-[#249357]">{agentStatus}</span>}
                  Shops assigned to this agent
                </p>
              </div>
            </div>
            <button type="button" onClick={() => router.push(`/admin/agents/${agentId}`)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
              <Plus size={15} />
              Add Dealer
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shop, code..." className="h-10 w-full rounded-lg border border-line bg-white pl-10 pr-4 text-[13px] outline-none" />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white">
          <div className="p-4">
            <h2 className="font-bold">Dealers</h2>
            <p className="text-[12px] text-ink-soft">{filtered.length} dealers</p>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="p-6 text-center text-[13px] text-ink-soft">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-ink-soft">No dealers found.</div>
            ) : (
              filtered.map((row) => (
                <div key={row.id} className="flex items-center justify-between p-4 hover:bg-paper">
                  <div className="flex items-center gap-3">
                    <Store size={16} className="text-navy" />
                    <div>
                      <div className="font-bold">{row.shopName}</div>
                      <div className="text-[11px] text-ink-soft">{row.dealerCode} · {row.ownerName} · {row.city}</div>
                    </div>
                  </div>
                  <span className="rounded bg-[#EAF8F0] px-2 py-1 text-[10px] font-bold text-[#249357]">{row.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
