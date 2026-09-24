// File: src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  dashboardApi,
  inventoryApi,
  categoriesApi,
  dealersApi,
  productsApi,
  productImagesApi,
  storefrontReviewsApi,
  businessAccountsApi,
} from "@/app/api/services";

import {
  ChevronRight,
  LayoutDashboard,
  BarChart3,
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Clock3,
  Star,
} from "lucide-react";

import AdminSidebar from "@/app/components/Admin/AdminSidebar";
import AdminHeader from "@/app/components/Admin/AdminHeader";

type IconType = React.ElementType;

/* ============================================================
   QUICK OVERVIEW MAPPING (#69 stats -> rows, no hardcodes)
============================================================ */

function mapOverviewStats(s: any, totalOrdersRaw: any) {
  const pick = (...keys: string[]): any => {
    for (const k of keys) {
      if (s[k] !== undefined && s[k] !== null) return s[k];
    }
    return undefined;
  };
  const num = (v: any): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const money = (v: any): string => {
    if (v === undefined) return "₹0";
    if (typeof v === "string" && v.trim().startsWith("₹")) return v;
    return `₹${num(v).toLocaleString("en-IN")}`;
  };
  const clampPct = (v: any): number =>
    Math.min(100, Math.max(0, Math.round(num(v))));

  const totalOrders = num(totalOrdersRaw);
  const completed = num(
    pick("completedOrders", "ordersCompleted", "deliveredOrders", "completed"),
  );
  const processing = num(
    pick("processingOrders", "ordersProcessing", "processing"),
  );
  const pending = pick(
    "pendingPayments",
    "pendingPaymentsAmount",
    "pendingAmount",
  );
  const accounts = num(
    pick("businessAccounts", "businessAccountsCount", "totalBusinessAccounts"),
  );

  return {
    completedOrders: String(completed),
    processingOrders: String(processing),
    pendingPayments: money(pending),
    businessAccounts: String(accounts),
    completedPct: clampPct(
      pick("completedPct", "completedPercentage") ??
        (totalOrders > 0 ? (completed / totalOrders) * 100 : 0),
    ),
    processingPct: clampPct(
      pick("processingPct", "processingPercentage") ??
        (totalOrders > 0 ? (processing / totalOrders) * 100 : 0),
    ),
    paymentsPct: clampPct(pick("paymentsPct", "pendingPaymentsPct")),
    accountsPct: clampPct(pick("accountsPct", "businessAccountsPct")),
  };
}

/* ============================================================
   DASHBOARD DATA (API-first; empty until backend resolves)
============================================================ */

/* ============================================================
   PAGE
============================================================ */

export default function AdminDashboardPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [recentOrders, setRecentOrders] =
    useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] =
    useState<any[]>([]);
  const [categories, setCategories] =
    useState<any[]>([]);
  const [salesData, setSalesData] =
    useState<any[]>([]);
  const [dealerShops, setDealerShops] =
    useState<any[]>([]);
  const [riceProduct, setRiceProduct] =
    useState<any | null>(null);
  const [riceImageBroken, setRiceImageBroken] =
    useState(false);
  const [riceReviews, setRiceReviews] =
    useState<any[]>([]);
  const [statValues, setStatValues] = useState({
    revenue: "₹0",
    orders: "0",
    customers: "0",
    products: "0",
    completedOrders: "0",
    processingOrders: "0",
    pendingPayments: "₹0",
    businessAccounts: "0",
    completedPct: 0,
    processingPct: 0,
    paymentsPct: 0,
    accountsPct: 0,
  });

  /* ============================================================
     LOAD DASHBOARD DATA (API-first; leave empty on failure)
     #69 dashboard stats · #70 recent orders · #56 low stock
  ============================================================ */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Stats (stat cards + sales chart).
      try {
        const res: any = await dashboardApi.stats();
        const payload: any = res?.data ?? res;
        const s: any =
          payload?.stats ?? payload?.data ?? payload ?? {};
        if (!cancelled && s && typeof s === "object") {
          const pick = (...keys: string[]): any => {
            for (const k of keys) {
              if (s[k] !== undefined && s[k] !== null) return s[k];
            }
            return undefined;
          };
          const revenue =
            pick("totalRevenue", "revenue", "revenueDisplay");
          const orders =
            pick("totalOrders", "orders", "ordersCount");
          const customers =
            pick(
              "totalCustomers",
              "customers",
              "customersCount",
              "users",
              "totalUsers"
            );
          const products =
            pick(
              "totalProducts",
              "products",
              "activeProducts",
              "productsCount"
            );
          setStatValues((current) => ({
            revenue:
              revenue !== undefined
                ? String(revenue)
                : current.revenue,
            orders:
              orders !== undefined
                ? String(orders)
                : current.orders,
            customers:
              customers !== undefined
                ? String(customers)
                : current.customers,
            products:
              products !== undefined
                ? String(products)
                : current.products,
            ...mapOverviewStats(s, orders),
          }));

          // Sales chart: tolerate several envelope shapes.
          const rawChart: any =
            s.chart ??
            s.salesChart ??
            s.monthlySales ??
            s.sales ??
            s.chartData ??
            s.revenueByMonth;
          const chartItems: any[] = Array.isArray(rawChart)
            ? rawChart
            : Array.isArray(rawChart?.items)
              ? rawChart.items
              : Array.isArray(rawChart?.data)
                ? rawChart.data
                : [];
          if (chartItems.length > 0) {
            const mapped = chartItems.map(
              (entry: any, index: number) => ({
                month: String(
                  entry?.month ??
                    entry?.label ??
                    entry?.name ??
                    `M${index + 1}`
                ),
                value: Number(
                  entry?.value ??
                    entry?.revenue ??
                    entry?.total ??
                    entry?.amount ??
                    0
                ),
              })
            );
            setSalesData(mapped);
          }
        }
      } catch {
        // Leave state empty on failure.
      }

      // Recent orders widget.
      try {
        const res: any = await dashboardApi.recentOrders(5);
        const payload: any = res?.data ?? res;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
        if (!cancelled && rawItems.length > 0) {
          setRecentOrders(
            rawItems.map((raw: any, index: number) => {
              const idRaw =
                raw?.orderNo ??
                raw?.orderNumber ??
                raw?.id ??
                raw?.orderId ??
                `#ANZ-${index}`;
              const amountRaw =
                raw?.amount ??
                raw?.total ??
                raw?.grandTotal ??
                raw?.totalAmount ??
                "";
              return {
                id: String(idRaw),
                customer: String(
                  raw?.customer ??
                    raw?.customerName ??
                    raw?.name ??
                    "Unknown customer"
                ),
                amount:
                  typeof amountRaw === "number"
                    ? `₹${amountRaw.toLocaleString("en-IN")}`
                    : String(amountRaw),
                status: String(
                  raw?.status ?? "Processing"
                ),
                time: String(
                  raw?.time ??
                    raw?.createdAt ??
                    raw?.date ??
                    raw?.orderDate ??
                    ""
                ),
              };
            })
          );
        }
      } catch {
        // Leave state empty on failure.
      }

      // Low-stock widget (#56) — primary via /api/admin/inventory/low-stock, fallback via product summaries
      try {
        const res: any = await inventoryApi.lowStock();
        const payload: any = res?.data ?? res;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
        if (!cancelled && rawItems.length > 0) {
          setLowStockProducts(
            rawItems.map((raw: any, index: number) => ({
              name: String(raw?.productName ?? raw?.name ?? `Product ${index + 1}`),
              sku: String(raw?.sku ?? raw?.skuCode ?? ""),
              stock: Number(raw?.quantity ?? raw?.stock ?? raw?.availableQuantity ?? 0),
            }))
          );
        } else if (!cancelled) {
          // No low-stock rows from inventory — derive from enriched product summaries (availableStock)
          try {
            const pr: any = await productsApi.list({ page: 1, pageSize: 50 });
            const pp: any = pr?.data ?? pr;
            const pItems: any[] = Array.isArray(pp) ? pp : Array.isArray(pp?.items) ? pp.items : Array.isArray(pp?.data) ? pp.data : [];
            const lowFromProducts = pItems
              .filter((p: any) => {
                const avail = Number(p.availableStock ?? p.stock ?? p.quantity ?? 0);
                // Consider low if explicitly low_stock/out_of_stock or avail <= reorder (10 as demo threshold)
                const status = String(p.stockStatus ?? "").toLowerCase();
                return status === "low_stock" || status === "out_of_stock" || (Number.isFinite(avail) && avail <= 10);
              })
              .slice(0, 5)
              .map((p: any, idx: number) => ({
                name: String(p.productName ?? p.name ?? `Product ${idx + 1}`),
                sku: String(p.sku ?? ""),
                stock: Number(p.availableStock ?? p.stock ?? 0),
              }));
            if (lowFromProducts.length > 0) setLowStockProducts(lowFromProducts);
            else setLowStockProducts([]);
          } catch {
            if (!cancelled) setLowStockProducts([]);
          }
        }
      } catch {
        // Leave state empty on failure — empty placeholder will show.
      }

      // Home>Products>RIce — exact product 0de6ec0c-8018-4989-a79e-850de18f8a24 (RRS)
      try {
        const r: any = await productsApi.details("0de6ec0c-8018-4989-a79e-850de18f8a24");
        const rp: any = r?.data ?? r;
        const prod = rp && typeof rp === "object" && (rp.productId || rp.id) ? rp : null;
        if (!cancelled && prod) {
          const mapped: any = {
            productId: prod.productId ?? prod.id,
            productName: prod.productName ?? prod.name,
            sku: prod.sku,
            price: prod.price,
            moq: prod.moq,
            status: prod.status,
            brandName: prod.brandName ?? prod.brand ?? "",
            imageUrl: undefined,
          };
          // 1) Enriched list image (search is case-insensitive, so "Rice" covers "RIce")
          try {
            const lr: any = await productsApi.list({ search: "Rice", page: 1, pageSize: 20 });
            const lp: any = lr?.data ?? lr;
            const li: any[] = Array.isArray(lp) ? lp : Array.isArray(lp?.items) ? lp.items : Array.isArray(lp?.data) ? lp.data : [];
            const found = li.find((x: any) => String(x.productId) === String(mapped.productId)) ?? li[0];
            if (found?.imageUrl) mapped.imageUrl = found.imageUrl;
            if (found?.brandName) mapped.brandName = found.brandName;
            if (found?.stockStatus) mapped.stockStatus = found.stockStatus;
          } catch {}
          // 2) Direct product-images fallback — reliable even when list enrichment misses
          if (!mapped.imageUrl) {
            try {
              const ir: any = await productImagesApi.list(mapped.productId);
              const ip: any = ir?.data ?? ir;
              const imgs: any[] = Array.isArray(ip) ? ip : Array.isArray(ip?.items) ? ip.items : Array.isArray(ip?.data) ? ip.data : [];
              const primary = imgs.find((x: any) => x.isPrimary) ?? imgs[0];
              const imageId = primary?.imageId ?? primary?.id;
              if (imageId) {
                mapped.imageUrl = `/api/v1/products/${mapped.productId}/images/${imageId}/file`;
              }
            } catch {}
          }
          if (!cancelled) {
            setRiceImageBroken(false);
            setRiceProduct(mapped);
          }
        }
      } catch {}
      try {
        const r: any = await storefrontReviewsApi.list("RIce", 5);
        const rp: any = r?.data ?? r;
        const revs: any[] = Array.isArray(rp) ? rp : Array.isArray(rp?.items) ? rp.items : Array.isArray(rp?.data) ? rp.data : [];
        if (!cancelled && revs.length > 0) setRiceReviews(revs.slice(0, 5));
      } catch {}

      // Agent dealer shops (Dealers table) — show agent-added shops on Dashboard.
      // Business Accounts quick overview now correctly reflects businessAccounts + dealers
      try {
        const [dealersRes, baRes] = await Promise.all([
          dealersApi.list(1, 6),
          businessAccountsApi.list(1, 100).catch(() => null),
        ]);
        const dPayload: any = (dealersRes as any)?.data ?? dealersRes;
        const dRaw: any[] = Array.isArray(dPayload)
          ? dPayload
          : Array.isArray(dPayload?.items)
            ? dPayload.items
            : Array.isArray(dPayload?.data)
              ? dPayload.data
              : [];
        const bPayload: any = (baRes as any)?.data ?? baRes;
        const bRaw: any[] = bPayload
          ? Array.isArray(bPayload)
            ? bPayload
            : Array.isArray(bPayload?.items)
              ? bPayload.items
              : []
          : [];

        if (!cancelled && dRaw.length > 0) {
          setDealerShops(
            dRaw.map((raw: any) => ({
              id: String(raw.id ?? raw.dealerId ?? ""),
              shopName: String(raw.shopName ?? "Shop"),
              dealerCode: String(raw.dealerCode ?? ""),
              ownerName: String(raw.ownerName ?? ""),
              city: String(raw.city ?? ""),
              phone: String(raw.phone ?? ""),
              status: String(raw.status ?? "Active"),
              productCount: Number(raw.productCount ?? 0),
              agentName: String(raw.agentName ?? ""),
            }))
          );
        }

        // Correct balance: total accounts = businessAccounts + dealers, pct = active/total*100
        const allDealers = dRaw;
        const allBAs = bRaw;
        const total = allDealers.length + allBAs.length;
        if (!cancelled && total > 0) {
          const activeDealers = allDealers.filter(
            (r: any) => String(r.status ?? "").toLowerCase() === "active"
          ).length;
          const activeBAs = allBAs.filter(
            (r: any) => String(r.status ?? "").toLowerCase() === "active"
          ).length;
          const active = activeDealers + activeBAs;
          const pct = Math.round((active / total) * 100);
          setStatValues((current) => ({
            ...current,
            businessAccounts: String(total),
            accountsPct: Math.min(100, Math.max(0, pct)),
          }));
        } else if (!cancelled && dRaw.length > 0) {
          // Fallback when BA fetch fails — dealers only
          const active = dRaw.filter((r: any) => String(r.status ?? "").toLowerCase() === "active").length;
          const pct = dRaw.length > 0 ? Math.round((active / dRaw.length) * 100) : 0;
          setStatValues((current) => ({
            ...current,
            businessAccounts: String(dRaw.length),
            accountsPct: pct,
          }));
        }
      } catch {
        // Leave state empty on failure.
      }

      // Catalog categories widget (primary images streamed anonymously).
      try {
        const res: any = await categoriesApi.list();
        const payload: any = res?.data ?? res;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
        if (!cancelled && rawItems.length > 0) {
          setCategories(
            rawItems
              .filter((raw: any) => raw?.categoryId)
              .map((raw: any) => ({
                categoryId: String(raw.categoryId),
                categoryName: String(raw.categoryName ?? "Category"),
                hasSubCategory: Boolean(raw.hasSubCategory),
                isActive: raw.isActive !== false,
              }))
          );
        }
      } catch {
        // Leave state empty on failure.
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const navigate = (path: string) => {
    setSidebarOpen(false);
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

      {/* ======================================================
          ADMIN SIDEBAR
      ======================================================= */}

      <AdminSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      {/* ======================================================
          MAIN AREA
      ======================================================= */}

      <div className="lg:pl-[270px]">

        {/* ====================================================
            ADMIN HEADER
        ===================================================== */}

        <AdminHeader
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        {/* ====================================================
            DASHBOARD CONTENT
        ===================================================== */}

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">

          {/* ==================================================
              TITLE
          =================================================== */}

          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <div className="mb-2 flex items-center gap-2 text-[10px] text-[#8C98A9]">

                <LayoutDashboard size={13} />

                <span>/</span>

                <span className="text-[#53627A]">
                  Dashboard
                </span>

              </div>

              <h1 className="font-sora text-[25px] font-bold tracking-tight text-[#1D2D49] sm:text-[29px]">
                Dashboard
              </h1>

              <p className="mt-1 text-xs text-[#7B8798]">
                Welcome back! Here&apos;s what&apos;s
                happening with Aanzara today.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/reports")
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-[#173B7A] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#214B96]"
            >

              <BarChart3 size={16} />

              View Analytics

              <ChevronRight size={14} />

            </button>

          </div>

          {/* ==================================================
              STAT CARDS
          =================================================== */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Total Revenue"
              value={statValues.revenue}
              trend="+18.4%"
              description="vs previous month"
              icon={IndianRupee}
              positive
            />

            <StatCard
              title="Total Orders"
              value={statValues.orders}
              trend="+12.6%"
              description="vs previous month"
              icon={ShoppingBag}
              positive
            />

            <StatCard
              title="Total Customers"
              value={statValues.customers}
              trend="+8.2%"
              description="vs previous month"
              icon={Users}
              positive
            />

            <StatCard
              title="Active Products"
              value={statValues.products}
              trend="+4.8%"
              description="vs previous month"
              icon={Package}
              positive
            />

          </section>

          {/* ==================================================
              SALES + QUICK OVERVIEW
          =================================================== */}

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">

            {/* SALES OVERVIEW */}

            <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>

                  <h2 className="text-sm font-bold text-[#253650]">
                    Sales Overview
                  </h2>

                  <p className="mt-1 text-[10px] text-[#8793A4]">
                    Revenue performance over the last
                    7 months
                  </p>

                </div>

                <select
                  defaultValue="7"
                  className="rounded-lg border border-[#E0E5EC] bg-white px-3 py-2 text-[10px] font-medium text-[#59687D] outline-none"
                  aria-label="Select time range"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30" disabled>
                    Last 30 Days (coming soon)
                  </option>
                  <option value="year" disabled>
                    This Year (coming soon)
                  </option>
                </select>

              </div>

              <div className="relative flex h-[270px] items-end gap-3 border-b border-l border-[#EDF0F4] px-4 pb-8 pt-5 sm:gap-5 sm:px-7">

                {/* Y AXIS */}

                <div className="pointer-events-none absolute -left-1 top-0 flex h-[220px] -translate-x-full flex-col justify-between pr-3 text-[9px] text-[#A1AAB8]">

                  <span>100K</span>
                  <span>75K</span>
                  <span>50K</span>
                  <span>25K</span>
                  <span>0</span>

                </div>

                {/* BARS — heights normalized to max so 5K vs 9K visibly differ, not 5000% */}
                {(() => {
                  const max = Math.max(...salesData.map((d) => d.value), 1);
                  return salesData.map((item, index) => {
                    const pct = Math.min(100, Math.max(6, (item.value / max) * 100));
                    return (
                      <div
                        key={`${item.month}-${index}`}
                        className="group relative flex h-full flex-1 flex-col justify-end"
                      >
                        <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded-md bg-[#172D57] px-2 py-1 text-[9px] text-white shadow-md group-hover:block">
                          ₹{Number(item.value).toLocaleString("en-IN")}
                        </div>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${index === 5 ? "bg-[#2457B5]" : "bg-[#CAD7F0] hover:bg-[#91AAD7]"}`}
                          style={{ height: `${pct}%` }}
                        />
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-[#8995A5]">{item.month}</span>
                      </div>
                    );
                  });
                })()}

              </div>

            </div>

            {/* QUICK OVERVIEW */}

            <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-start justify-between">

                <div>

                  <h2 className="text-sm font-bold text-[#253650]">
                    Quick Overview
                  </h2>

                  <p className="mt-1 text-[10px] text-[#8793A4]">
                    Current business status
                  </p>

                </div>

                <div className="rounded-xl bg-[#EEF3FF] p-2 text-[#4B70BB]">
                  <BarChart3 size={18} />
                </div>

              </div>

              <div className="mt-6 space-y-5">

                <OverviewRow
                  label="Orders Completed"
                  value={statValues.completedOrders}
                  percentage={statValues.completedPct}
                />

                <OverviewRow
                  label="Orders Processing"
                  value={statValues.processingOrders}
                  percentage={statValues.processingPct}
                />

                <OverviewRow
                  label="Pending Payments"
                  value={statValues.pendingPayments}
                  percentage={statValues.paymentsPct}
                />

                <OverviewRow
                  label="Business Accounts"
                  value={statValues.businessAccounts}
                  percentage={statValues.accountsPct}
                />

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/reports")
                }
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-[#DFE5ED] py-2.5 text-[10px] font-semibold text-[#3D5F9F] transition hover:bg-[#F5F8FF]"
              >
                View Detailed Report
                <ChevronRight size={14} />
              </button>

            </div>

          </section>

          {/* ==================================================
              ORDERS + INVENTORY
          =================================================== */}

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">

            {/* RECENT ORDERS */}

            <div className="overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-[#EDF0F4] p-5 sm:p-6">

                <div>

                  <h2 className="text-sm font-bold text-[#253650]">
                    Recent Orders
                  </h2>

                  <p className="mt-1 text-[10px] text-[#8793A4]">
                    Latest orders from customers
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/admin/orders")
                  }
                  className="text-[10px] font-semibold text-[#3260B4] hover:underline"
                >
                  View All
                </button>

              </div>

              <div className="overflow-x-auto">

                <table className="min-w-full text-left">

                  <thead className="bg-[#FAFBFD]">

                    <tr className="border-b border-[#EDF0F4] text-[9px] uppercase tracking-wide text-[#98A3B2]">

                      <th className="px-5 py-3">
                        Order
                      </th>

                      <th className="px-5 py-3">
                        Customer
                      </th>

                      <th className="px-5 py-3">
                        Amount
                      </th>

                      <th className="px-5 py-3">
                        Status
                      </th>

                      <th className="px-5 py-3" />

                    </tr>

                  </thead>

                  <tbody>

                    {recentOrders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FAFBFD]"
                        >

                          <td className="px-5 py-4">

                            <p className="text-[10px] font-bold text-[#33415A]">
                              {order.id}
                            </p>

                            <p className="mt-1 text-[9px] text-[#9AA4B2]">
                              {order.time}
                            </p>

                          </td>

                          <td className="px-5 py-4 text-[10px] font-medium text-[#566579]">
                            {order.customer}
                          </td>

                          <td className="px-5 py-4 text-[10px] font-bold text-[#33415A]">
                            {order.amount}
                          </td>

                          <td className="px-5 py-4">

                            <OrderStatus
                              status={order.status}
                            />

                          </td>

                          <td className="px-5 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  "/admin/orders"
                                )
                              }
                              aria-label={`View ${order.id}`}
                              className="rounded-lg p-2 text-[#8D98A8] hover:bg-[#EDF2F8] hover:text-[#2457B5]"
                            >
                              <Eye size={15} />
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* LOW STOCK */}

            <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-start justify-between">

                <div>

                  <h2 className="text-sm font-bold text-[#253650]">
                    Low Stock Alert
                  </h2>

                  <p className="mt-1 text-[10px] text-[#8793A4]">
                    Products requiring attention
                  </p>

                </div>

                <div className="rounded-xl bg-[#FFF5E8] p-2 text-[#E89321]">
                  <AlertTriangle size={18} />
                </div>

              </div>

              {lowStockProducts.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-[#EDF0F4] bg-[#FAFBFD] p-6 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF5E8] text-[#E89321]">
                    <AlertTriangle size={16} />
                  </div>
                  <p className="mt-3 text-[11px] font-semibold text-[#33415A]">
                    All products sufficiently stocked
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-[#9AA4B2]">
                    No products below reorder level. Low stock alerts will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-2">
                  {lowStockProducts.map((product, idx) => (
                    <div
                      key={`${product.sku || product.name}-${idx}`}
                      className="flex items-center gap-3 rounded-xl border border-[#EDF0F4] p-3 hover:bg-[#FAFBFD]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2F5FA]">
                        <Package size={17} className="text-[#607087]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-semibold text-[#33415A]">
                          {product.name}
                        </p>
                        <p className="mt-1 text-[8px] text-[#9AA4B2]">SKU: {product.sku || "—"}</p>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${product.stock <= 6 ? "text-[#E34C4C]" : "text-[#E89B2B]"}`}
                        >
                          {product.stock}
                        </p>
                        <p className="text-[8px] text-[#9AA4B2]">in stock</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/inventory")
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFF8EE] py-2.5 text-[10px] font-semibold text-[#D77F16] hover:bg-[#FFF1DC]"
              >
                Manage Inventory
                <ChevronRight size={14} />
              </button>

            </div>

          </section>

          {/* ==================================================
              AGENT DEALER SHOPS (Business Accounts)
          =================================================== */}

          <section className="mt-6 rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#253650]">
                  Agent Dealer Shops
                </h2>
                <p className="mt-1 text-[10px] text-[#8793A4]">
                  Shops added by agents — dealer details live from Dealers table
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin/agents")}
                className="rounded-xl bg-[#EDF3FF] px-4 py-2.5 text-[10px] font-semibold text-[#3260B4] transition hover:bg-[#DCE8FF]"
              >
                Manage Agents & Dealers
              </button>
            </div>

            {dealerShops.length === 0 ? (
              <div
                role="status"
                className="rounded-xl border border-[#EDF0F4] p-6 text-center text-[10px] text-[#9AA4B2]"
              >
                No dealer shops added by agents yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dealerShops.map((shop) => (
                  <div
                    key={shop.id}
                    onClick={() => navigate(`/admin/agents`)}
                    className="cursor-pointer overflow-hidden rounded-xl border border-[#EDF0F4] p-4 transition hover:border-[#B9CCEC] hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                        <Users size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-[#33415A]">
                          {shop.shopName}
                        </p>
                        <p className="truncate text-[9px] text-[#9AA4B2]">
                          {shop.dealerCode} · {shop.ownerName}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-semibold ${
                          shop.status === "Active"
                            ? "bg-[#EAF8F0] text-[#249357]"
                            : "bg-[#FFF0F0] text-[#D85A5A]"
                        }`}
                      >
                        {shop.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-[9px] text-[#66758A]">
                      <p>
                        <span className="font-semibold text-[#33415A]">Agent:</span> {shop.agentName || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-[#33415A]">City:</span> {shop.city || "—"} · {shop.phone || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-[#33415A]">Products:</span> {shop.productCount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ==================================================
              HOME > PRODUCTS > RICE + REVIEWS (live)
          =================================================== */}

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            {/* RIce live product */}
            <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#253650]">Home › Products › RIce</h2>
                <button
                  type="button"
                  onClick={() => riceProduct && navigate(`/product/${riceProduct.productId ?? riceProduct.id}`)}
                  className="text-[10px] font-semibold text-[#3260B4] hover:underline"
                >
                  View product
                </button>
              </div>
              {!riceProduct ? (
                <p className="rounded-xl border border-[#EDF0F4] p-6 text-center text-[10px] text-[#9AA4B2]">No RIce product found. Add one in Admin › Products.</p>
              ) : (
                <div className="flex gap-3 rounded-xl border border-[#EDF0F4] p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#EDF0F4] bg-[#F2F5FA] flex items-center justify-center">
                    {riceProduct.imageUrl && !riceImageBroken ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={riceProduct.imageUrl}
                        alt={riceProduct.productName}
                        className="h-full w-full object-cover"
                        onError={() => setRiceImageBroken(true)}
                      />
                    ) : (
                      <Package size={20} className="text-[#8FA6C9]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-[#33415A]">{riceProduct.productName}</p>
                    <p className="truncate text-[9px] text-[#9AA4B2]">SKU: {riceProduct.sku} · {riceProduct.brandName ?? riceProduct.brand ?? ""}</p>
                    <p className="mt-1 text-[10px] font-bold text-[#33415A]">₹{Number(riceProduct.price).toLocaleString("en-IN")}</p>
                    <p className="text-[9px] text-[#9AA4B2]">MOQ {riceProduct.moq ?? 1} · {riceProduct.status} · {riceProduct.stockStatus ?? "in_stock"}</p>
                  </div>
                </div>
              )}
              <p className="mt-2 text-[9px] text-[#7F8B9B]">Live via <span className="font-mono">GET /api/v1/products?search=RIce</span> + images + brand + stock enrichment.</p>
            </div>

            {/* RIce reviews live */}
            <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#253650]">RIce — Recent Reviews</h2>
                <button type="button" onClick={() => navigate("/admin/reviews")} className="text-[10px] font-semibold text-[#3260B4] hover:underline">Manage reviews</button>
              </div>
              {riceReviews.length === 0 ? (
                <p className="rounded-xl border border-[#EDF0F4] p-6 text-center text-[10px] text-[#9AA4B2]">No approved reviews yet. Storefront `POST /api/v1/reviews` creates them.</p>
              ) : (
                <div className="space-y-2">
                  {riceReviews.map((rv: any) => (
                    <div key={String(rv.id ?? rv._id ?? Math.random())} className="rounded-xl border border-[#EDF0F4] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[#33415A]">{String(rv.customerName ?? rv.name ?? "Customer")}</span>
                        <span className="text-[10px] text-amber-600">{"★".repeat(Number(rv.rating ?? 0))} {Number(rv.rating ?? 0)}/5</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] text-[#66758A]">{String(rv.comment ?? rv.text ?? "")}</p>
                      <p className="mt-1 text-[8px] text-[#9AA4B2]">{String(rv.productName ?? "RIce")} · {String(rv.status ?? "Approved")} · {new Date(rv.createdAt ?? Date.now()).toLocaleDateString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[9px] text-[#7F8B9B]">Live via <span className="font-mono">GET /api/v1/reviews?productName=RIce</span> (Approved only).</p>
            </div>
          </section>

          {/* ==================================================
              CATALOG CATEGORIES
          =================================================== */}

          <section className="mt-6 rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-sm font-bold text-[#253650]">
                  Catalog Categories
                </h2>

                <p className="mt-1 text-[10px] text-[#8793A4]">
                  Primary images streamed live from the catalog
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/categories")
                }
                className="rounded-xl bg-[#FFF8EE] px-4 py-2.5 text-[10px] font-semibold text-[#D77F16] transition hover:bg-[#FFF1DC]"
              >
                Manage Categories
              </button>

            </div>

            {categories.length === 0 ? (
              <div
                role="status"
                className="rounded-xl border border-[#EDF0F4] p-6 text-center text-[10px] text-[#9AA4B2]"
              >
                No categories available yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {categories.map((category) => (
                  <CategoryTile
                    key={category.categoryId}
                    category={category}
                  />
                ))}
              </div>
            )}

          </section>

          {/* ==================================================
              RECENT ACTIVITY
          =================================================== */}

          <section className="mt-6 rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-sm font-bold text-[#253650]">
                  Recent Activity
                </h2>

                <p className="mt-1 text-[10px] text-[#8793A4]">
                  Latest actions across your platform
                </p>

              </div>

              <button
                type="button"
                className="text-[10px] font-semibold text-[#3260B4] hover:underline"
              >
                View Activity
              </button>

            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

              <ActivityCard
                icon={Package}
                title="New product added"
                description="Surf Excel Liquid 1L"
                time="5 minutes ago"
              />

              <ActivityCard
                icon={Users}
                title="Business account approved"
                description="ABC Wholesale Traders"
                time="18 minutes ago"
              />

              <ActivityCard
                icon={ShoppingBag}
                title="New bulk order received"
                description="Order #ANZ-10842"
                time="24 minutes ago"
              />

              <ActivityCard
                icon={Star}
                title="New customer review"
                description="A 5-star review was submitted"
                time="1 hour ago"
              />

            </div>

          </section>

        </main>

      </div>

    </div>
  );
}

/* ============================================================
   CATEGORY TILE (dashboard catalog widget)
============================================================ */

function CategoryTile({ category }: { category: any }) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-[#EDF0F4] transition hover:border-[#B9CCEC] hover:shadow-sm">

      <div className="relative h-20 bg-gradient-to-br from-[#EEF3FF] to-[#DCE7FA]">
        {!broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={categoriesApi.primaryImageUrl(category.categoryId)}
            alt={category.categoryName}
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8FA6C9]">
            <Package size={22} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="p-2.5">

        <p
          className="truncate text-[10px] font-semibold text-[#33415A]"
          title={category.categoryName}
        >
          {category.categoryName}
        </p>

        <p className="mt-1 truncate text-[8px] text-[#9AA4B2]">
          {category.hasSubCategory
            ? "Has sub-categories"
            : "Category"}
          {category.isActive === false ? " · Inactive" : ""}
        </p>

      </div>

    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  trend,
  description,
  icon: Icon,
  positive,
}: {
  title: string;
  value: string;
  trend: string;
  description: string;
  icon: IconType;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-[10px] font-medium text-[#7B889A]">
            {title}
          </p>

          <h3 className="mt-2 text-[23px] font-bold tracking-tight text-[#22324D]">
            {value}
          </h3>

        </div>

        <div className="rounded-xl bg-[#EAF0FF] p-2.5 text-[#3260B4]">
          <Icon size={20} />
        </div>

      </div>

      <div className="mt-4 flex items-center gap-2">

        <span
          className={`
            inline-flex
            items-center
            gap-1
            rounded-md
            px-2
            py-1
            text-[9px]
            font-bold
            ${
              positive
                ? "bg-[#EAF8F0] text-[#269657]"
                : "bg-[#FFF0F0] text-[#E14B4B]"
            }
          `}
        >

          {positive ? (
            <ArrowUpRight size={11} />
          ) : (
            <ArrowDownRight size={11} />
          )}

          {trend}

        </span>

        <span className="text-[9px] text-[#9AA4B2]">
          {description}
        </span>

      </div>

    </div>
  );
}

/* ============================================================
   OVERVIEW ROW
============================================================ */

function OverviewRow({
  label,
  value,
  percentage,
}: {
  label: string;
  value: string;
  percentage: number;
}) {
  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <span className="text-[10px] font-medium text-[#66758A]">
          {label}
        </span>

        <span className="text-[10px] font-bold text-[#31415D]">
          {value}
        </span>

      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[#EDF1F6]">

        <div
          className="h-full rounded-full bg-[#4773C5] transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

/* ============================================================
   ORDER STATUS
============================================================ */

function OrderStatus({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    Processing:
      "bg-[#FFF5E8] text-[#D7871E]",
    Confirmed:
      "bg-[#EAF0FF] text-[#3260B4]",
    Shipped:
      "bg-[#F0EAFF] text-[#7A4FC0]",
    Delivered:
      "bg-[#EAF8F0] text-[#249357]",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1
        rounded-full
        px-2
        py-1
        text-[8px]
        font-semibold
        ${
          styles[status] ||
          "bg-slate-100 text-slate-600"
        }
      `}
    >

      {status === "Delivered" ? (
        <CheckCircle2 size={10} />
      ) : (
        <Clock3 size={10} />
      )}

      {status}

    </span>
  );
}

/* ============================================================
   ACTIVITY CARD
============================================================ */

function ActivityCard({
  icon: Icon,
  title,
  description,
  time,
}: {
  icon: IconType;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-[#EDF0F4] p-4 transition hover:bg-[#FAFBFD]">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#4773C5]">
        <Icon size={17} />
      </div>

      <div className="min-w-0">

        <p className="truncate text-[10px] font-semibold text-[#3B4961]">
          {title}
        </p>

        <p className="mt-1 truncate text-[9px] text-[#7F8B9B]">
          {description}
        </p>

        <p className="mt-2 text-[8px] text-[#A1AAB7]">
          {time}
        </p>

      </div>

    </div>
  );
}