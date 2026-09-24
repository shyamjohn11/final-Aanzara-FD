"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Package, Truck, MapPin, Clock } from "lucide-react";
import { ordersApi } from "@/app/api/services";
import { extractErrorMessage } from "@/app/api/api";

type Tracking = {
  orderId: string;
  orderNo: string;
  status: string;
  grandTotal?: number;
  trackingNumber?: string;
  courierName?: string;
  currentLocation?: string;
  estimatedDeliveryDate?: string | null;
  warehouseName?: string;
  dealerShopName?: string;
  // Legacy shape from earlier handler (for backward compat)
  shipment?: {
    courierName: string;
    trackingNumber?: string;
    status: string;
    shippedAt?: string | null;
    estimatedDelivery?: string | null;
  };
  timeline?: { status: string; remarks?: string | null; changedAt: string }[];
  history?: { status: string; remarks?: string | null; changedAt: string; location?: string }[];
  progressPercent?: number;
  estimatedDeliveryText?: string;
  updatedAt?: string;
};

export default function OrderLiveTracking({ orderId }: { orderId: string }) {
  const [data, setData] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res: any = await ordersApi.tracking(orderId);
      const payload: any = res?.data ?? res;
      setData(payload as Tracking);
      setError("");
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to load tracking. Retrying…"));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="rounded-card border border-line bg-white p-6 text-center text-[12px] text-ink-soft">Loading live tracking…</div>
    );
  }
  if (error && !data) {
    return (
      <div role="alert" className="rounded-card border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-800">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const steps = ["Pending", "Confirmed", "Shipped", "Delivered"];
  const activeIdx = steps.findIndex((s) => s.toLowerCase() === data.status.toLowerCase());
  // Support both new backend shape (history/trackingNumber) and legacy (timeline/shipment/progressPercent)
  const timeline = (data.timeline ?? data.history ?? []) as { status: string; remarks?: string | null; changedAt: string; location?: string }[];
  const trackingNumber = data.trackingNumber ?? data.shipment?.trackingNumber ?? "";
  const courier = data.courierName ?? data.shipment?.courierName ?? "Aanzara Logistics";
  const currentLoc = data.currentLocation ?? "";
  const warehouse = (data as any).warehouseName ?? "";
  const dealerShop = (data as any).dealerShopName ?? "";
  const estimated = data.estimatedDeliveryDate ?? data.shipment?.estimatedDelivery ?? data.estimatedDeliveryText ?? "";
  const pct = data.progressPercent ?? (activeIdx >= 0 ? Math.round(((activeIdx + 1) / steps.length) * 100) : 25);
  const updatedAt = data.updatedAt ?? (timeline.length > 0 ? timeline[timeline.length - 1].changedAt : new Date().toISOString());

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-sora text-[13px] font-bold text-ink">Live Tracking • {data.orderNo}</h3>
          <span className="rounded-full bg-navy px-2.5 py-1 text-[10px] font-bold text-white">{data.status}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
          <div className="h-full bg-navy transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-ink-faint">
          {steps.map((s, i) => (
            <span key={s} className={i <= activeIdx ? "font-semibold text-navy" : ""}>
              {i < activeIdx ? <Check size={12} className="inline text-green" /> : null} {s}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-soft">
          <MapPin size={11} className="inline" /> {courier} • {trackingNumber} • ETA {estimated ? new Date(estimated).toLocaleDateString() : "—"}
        </p>
        {(warehouse || dealerShop || currentLoc) && (
          <p className="mt-1 text-[11px] text-ink-soft">
            {warehouse ? `Warehouse: ${warehouse} • ` : ""}
            {dealerShop ? `Shop: ${dealerShop} • ` : ""}
            {currentLoc ? `Current: ${currentLoc}` : ""}
          </p>
        )}
        <p className="text-[10px] text-ink-faint">
          <Clock size={10} className="inline" /> Updated {new Date(updatedAt).toLocaleTimeString()} • auto-refresh 8s
        </p>
      </div>

      <div className="rounded-card border border-line bg-white p-4">
        <h4 className="text-[12px] font-bold text-ink">Timeline</h4>
        <div className="mt-3 space-y-3">
          {timeline.length === 0 ? (
            <p className="text-[11px] text-ink-soft">No events yet.</p>
          ) : (
            timeline.map((ev, i) => (
              <div key={`${ev.status}-${i}`} className="flex gap-3">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${i === timeline.length - 1 ? "bg-navy" : "bg-green"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-ink">{ev.status}</p>
                  {ev.remarks && <p className="text-[11px] text-ink-soft">{ev.remarks}</p>}
                  {ev.location && <p className="text-[10px] text-ink-faint">📍 {ev.location}</p>}
                  <p className="text-[10px] text-ink-faint">{new Date(ev.changedAt).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-card border border-line bg-white p-4 flex items-center gap-3">
        <Truck size={18} className="text-navy" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-ink">{data.status}</p>
          <p className="text-[10px] text-ink-soft truncate">{trackingNumber} • {courier} {currentLoc ? `• ${currentLoc}` : ""}</p>
        </div>
        <Package size={16} className="text-ink-faint" />
      </div>
    </div>
  );
}
