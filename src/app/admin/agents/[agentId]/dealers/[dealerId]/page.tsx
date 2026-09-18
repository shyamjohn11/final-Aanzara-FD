"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Store,
  UserRound,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import StatusBadge from "@/app/components/Admin/StatusBadge";
import { agentsApi, dealersApi } from "@/app/api/services";
import { extractErrorMessage } from "@/app/api/api";
import { toast } from "react-toastify";

/* ============================================================
   TYPES
============================================================ */

type DealerDetails = {
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
  status: string;
  productCount: number;
};

type AgentInfo = {
  name: string;
  email?: string | null;
  phone?: string | null;
};

function Info({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      <span className="text-[13.5px] font-medium text-ink">
        {value ?? "—"}
      </span>
    </div>
  );
}

/* ============================================================
   PAGE — Admin → Agents → Dealers → Details
============================================================ */

export default function DealerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = String(params?.agentId ?? "");
  const dealerId = String(params?.dealerId ?? "");

  const [dealer, setDealer] = useState<DealerDetails | null>(null);
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!dealerId) return;
    setLoading(true);
    try {
      const res = await dealersApi.details(dealerId);
      const d = ((res as { data?: unknown })?.data ??
        res) as Record<string, unknown>;
      const details: DealerDetails = {
        id: String(d.id ?? d.dealerId ?? dealerId),
        agentId: String(d.agentId ?? agentId),
        agentName: (d.agentName as string | null) ?? null,
        dealerCode: String(d.dealerCode ?? ""),
        shopName: String(d.shopName ?? ""),
        ownerName: String(d.ownerName ?? ""),
        email: (d.email as string | null) ?? null,
        phone: String(d.phone ?? ""),
        alternatePhone:
          (d.alternatePhone as string | null) ?? null,
        address: (d.address as string | null) ?? null,
        city: (d.city as string | null) ?? null,
        state: (d.state as string | null) ?? null,
        country: (d.country as string | null) ?? null,
        pincode: (d.pincode as string | null) ?? null,
        gstNumber:
          ((d.gstNumber ?? d.gSTNumber) as string | null) ?? null,
        panNumber:
          ((d.panNumber ?? d.pANNumber) as string | null) ?? null,
        shopDescription:
          (d.shopDescription as string | null) ?? null,
        status: String(d.status ?? "Unknown"),
        productCount: Number(d.productCount ?? 0) || 0,
      };
      setDealer(details);

      const ownerId = details.agentId || agentId;
      if (ownerId) {
        const agentRes = await agentsApi
          .details(ownerId)
          .catch(() => null);
        if (agentRes) {
          const a = ((agentRes as { data?: unknown })?.data ??
            agentRes) as Record<string, unknown>;
          setAgent({
            name: String(a.name ?? details.agentName ?? "Agent"),
            email: (a.email as string | null) ?? null,
            phone: (a.phone as string | null) ?? null,
          });
        } else if (details.agentName) {
          setAgent({ name: details.agentName });
        }
      }
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Unable to load dealer.")
      );
      setDealer(null);
    } finally {
      setLoading(false);
    }
  }, [dealerId, agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(`/admin/agents/${agentId}/dealers`)
            }
            className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft hover:text-navy"
          >
            <ArrowLeft size={13} />
            Back to Dealers
          </button>
          <h1 className="font-sora text-[20px] font-bold text-navy">
            Dealer Details
          </h1>
        </div>

        {loading ? (
          <div className="rounded-xl border border-line bg-white p-10 text-center text-[13px] text-ink-soft">
            Loading dealer…
          </div>
        ) : !dealer ? (
          <div className="rounded-xl border border-line bg-white p-10 text-center text-[13px] text-ink-soft">
            Dealer not found.
          </div>
        ) : (
          <>
            {/* Shop information */}
            <section className="rounded-xl border border-line bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1769F5]">
                    <Store size={20} />
                  </span>
                  <div>
                    <h2 className="font-sora text-[16px] font-bold text-ink">
                      {dealer.shopName}
                    </h2>
                    <p className="font-mono text-[11.5px] text-ink-soft">
                      {dealer.dealerCode}
                    </p>
                  </div>
                </div>
                <StatusBadge status={dealer.status} size="lg" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Owner" value={dealer.ownerName} />
                <Info
                  label="Email"
                  value={
                    dealer.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} />
                        {dealer.email}
                      </span>
                    ) : undefined
                  }
                />
                <Info
                  label="Phone"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Phone size={12} />
                      {dealer.phone}
                    </span>
                  }
                />
                <Info
                  label="Alternate Phone"
                  value={dealer.alternatePhone}
                />
                <Info
                  label="Address"
                  value={
                    [
                      dealer.address,
                      dealer.city,
                      dealer.state,
                      dealer.country,
                      dealer.pincode,
                    ].filter(Boolean).length > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        {
                          [
                            dealer.address,
                            dealer.city,
                            dealer.state,
                            dealer.country,
                            dealer.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        }
                      </span>
                    ) : undefined
                  }
                />
                <Info label="GST Number" value={dealer.gstNumber} />
                <Info label="PAN Number" value={dealer.panNumber} />
              </div>
              {dealer.shopDescription && (
                <p className="mt-4 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-soft">
                  {dealer.shopDescription}
                </p>
              )}
            </section>

            {/* Agent information */}
            <section className="rounded-xl border border-line bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF5DE] text-[#D99100]">
                  <UserRound size={20} />
                </span>
                <h2 className="font-sora text-[15px] font-bold text-ink">
                  Agent Information
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Info
                  label="Agent Name"
                  value={agent?.name ?? dealer.agentName}
                />
                <Info label="Agent Email" value={agent?.email} />
                <Info label="Agent Phone" value={agent?.phone} />
              </div>
            </section>

            {/* Dealer products */}
            <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF8F0] text-[#249357]">
                  <Package size={20} />
                </span>
                <div>
                  <h2 className="font-sora text-[15px] font-bold text-ink">
                    Dealer Products
                  </h2>
                  <p className="text-[12.5px] text-ink-soft">
                    {dealer.productCount} product
                    {dealer.productCount === 1 ? "" : "s"} belong
                    to this dealer.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/admin/agents/${agentId}/dealers/${dealer.id}/products`
                  )
                }
                className="rounded-lg bg-navy px-5 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
              >
                Manage Products
              </button>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
