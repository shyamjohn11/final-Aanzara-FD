"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { reportsApi } from "@/app/api/services";
import {
  ArrowLeft,
  Download,
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  IndianRupee,
  CalendarDays,
  RefreshCw,
  FileText,
  ChevronDown,
} from "lucide-react";

type ReportPeriod =
  | "7 Days"
  | "30 Days"
  | "90 Days"
  | "This Year";

type SalesRow = {
  month: string;
  orders: number;
  revenue: number;
  customers: number;
};

export default function ReportsPage() {
  const router = useRouter();

  const [period, setPeriod] =
    useState<ReportPeriod>("30 Days");

  const [reportType, setReportType] =
    useState("Sales Report");

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [reportRows, setReportRows] = useState<SalesRow[]>([]);

  const [topProducts, setTopProducts] = useState<
    { name: string; category: string; sold: number; revenue: number }[]
  >([]);

  const [topCategories, setTopCategories] = useState<
    { name: string; sales: number; percentage: number }[]
  >([]);

  const [recentReports, setRecentReports] = useState<
    { name: string; type: string; generated: string; format: string }[]
  >([]);

  /* =======================================================
     LOAD (#142 GET /api/admin/reports?period=)
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const toApiPeriod = (value: ReportPeriod) => {
      switch (value) {
        case "7 Days":
          return "7d";
        case "30 Days":
          return "30d";
        case "90 Days":
          return "90d";
        case "This Year":
          return "1y";
        default:
          return "30d";
      }
    };

    const load = async () => {
      try {
        const response = await reportsApi.summary(toApiPeriod(period));
        const payload = (response as any)?.data ?? response;
        const data = payload?.data ?? payload;

        if (cancelled) return;

        // #142 contract: { summary, chartSeries[], topProducts[], topCategories[] }
        // (camelCased by the API: label/orders/revenue/customers,
        // product/category/qty, category/sales/percentage).
        const rawRows: any[] = Array.isArray(data?.chartSeries)
          ? data.chartSeries
          : Array.isArray(data?.chart)
            ? data.chart
            : [];
        const mapped: SalesRow[] = rawRows.map(
          (item: any, index: number) => ({
            month: String(
              item?.label ??
                item?.month ??
                `P${index + 1}`
            ),
            orders: Number(item?.orders ?? 0),
            revenue: Number(
              item?.revenue ?? item?.value ?? 0
            ),
            customers: Number(
              item?.customers ?? 0
            ),
          })
        );
        setReportRows(mapped);

        const rawTop: any[] = Array.isArray(
          data?.topProducts
        )
          ? data.topProducts
          : [];
        setTopProducts(
          rawTop.map((item: any) => ({
            name: String(
              item?.product ?? item?.name ?? "Product"
            ),
            category: String(
              item?.category ?? ""
            ),
            sold: Number(item?.qty ?? 0),
            revenue: Number(item?.revenue ?? 0),
          }))
        );

        const rawCats: any[] = Array.isArray(
          data?.topCategories
        )
          ? data.topCategories
          : [];
        setTopCategories(
          rawCats.map((item: any) => ({
            name: String(
              item?.category ?? item?.name ?? "Category"
            ),
            sales: Number(item?.sales ?? 0),
            percentage: Number(
              item?.percentage ?? 0
            ),
          }))
        );

        // Recent reports have no backend store; they are tracked locally
        // (see loadRecentReports + handleGenerate below).
      } catch {
        if (!cancelled) {
          setReportRows([]);
          setTopProducts([]);
          setTopCategories([]);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [period]);

  /* =======================================================
     RECENT REPORTS (tracked locally; no backend store)
  ======================================================= */

  const RECENT_KEY = "aanzara-recent-reports";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const parsed: unknown = raw
        ? JSON.parse(raw)
        : [];
      if (Array.isArray(parsed)) {
        setRecentReports(
          parsed.filter(
            (item): item is {
              name: string;
              type: string;
              generated: string;
              format: string;
            } =>
              !!item &&
              typeof item === "object" &&
              typeof (item as { name?: unknown })
                .name === "string"
          )
        );
      }
    } catch {
      // Keep the list empty on failure.
    }
  }, []);

  type ReportErrors = Partial<Record<
    "reportType" | "period",
    string
  >>;

  const [errors, setErrors] =
    useState<ReportErrors>({});

  const clearError = (
    field: keyof ReportErrors
  ) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateReportControls = () => {
    const next: ReportErrors = {};

    const allowedReportTypes = [
      "Sales Report",
      "Product Report",
      "Customer Report",
      "Inventory Report",
      "Order Report",
    ];

    const allowedPeriods: ReportPeriod[] = [
      "7 Days",
      "30 Days",
      "90 Days",
      "This Year",
    ];

    if (!allowedReportTypes.includes(reportType)) {
      next.reportType = "Select a valid report type.";
    }

    if (!allowedPeriods.includes(period)) {
      next.period = "Select a valid date range.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePeriodChange = (value: string) => {
    const allowedPeriods: ReportPeriod[] = [
      "7 Days",
      "30 Days",
      "90 Days",
      "This Year",
    ];

    if (!allowedPeriods.includes(value as ReportPeriod)) {
      setErrors((current) => ({
        ...current,
        period: "Select a valid date range.",
      }));
      return;
    }

    setPeriod(value as ReportPeriod);
    clearError("period");
  };

  const handleReportTypeChange = (value: string) => {
    const allowedReportTypes = [
      "Sales Report",
      "Product Report",
      "Customer Report",
      "Inventory Report",
      "Order Report",
    ];

    if (!allowedReportTypes.includes(value)) {
      setErrors((current) => ({
        ...current,
        reportType: "Select a valid report type.",
      }));
      return;
    }

    setReportType(value);
    clearError("reportType");
  };

  const data = reportRows;

  const totals = useMemo(() => {
    return data.reduce(
      (result, item) => ({
        orders:
          result.orders + item.orders,
        revenue:
          result.revenue + item.revenue,
        customers:
          result.customers + item.customers,
      }),
      {
        orders: 0,
        revenue: 0,
        customers: 0,
      }
    );
  }, [data]);

  const averageOrderValue =
    totals.orders > 0
      ? Math.round(
          totals.revenue / totals.orders
        )
      : 0;

  const maxRevenue =
    data.length > 0
      ? Math.max(...data.map((item) => item.revenue))
      : 0;

  const handleGenerate = () => {
    if (!validateReportControls()) return;

    setIsGenerating(true);

    setTimeout(() => {
      const entry = {
        name: `${reportType} — ${period}`,
        type: reportType,
        generated: new Date().toLocaleString(
          "en-IN"
        ),
        format: "CSV",
      };

      setRecentReports((current) => {
        const next = [
          entry,
          ...current,
        ].slice(0, 10);

        try {
          localStorage.setItem(
            RECENT_KEY,
            JSON.stringify(next)
          );
        } catch {
          // Best-effort persistence.
        }

        return next;
      });

      setIsGenerating(false);
    }, 1200);
  };

  const handleExport = () => {
    if (!validateReportControls()) return;

    const escapeCsv = (value: string | number) => {
      const text = String(value);
      return /[",\n]/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
    };

    const rows = [
      [
        "Period",
        "Orders",
        "Revenue",
        "Customers",
      ],
      ...data.map((item) => [
        item.month,
        item.orders,
        item.revenue,
        item.customers,
      ]),
    ];

    const csv = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = `${reportType
      .toLowerCase()
      .replace(/\s+/g, "-")}-${period
      .toLowerCase()
      .replace(/\s+/g, "-")}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <main className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-[#E4E8EF] bg-white px-4 sm:px-6 lg:px-8">

        <button
          type="button"
          onClick={() =>
            router.push("/admin")
          }
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] hover:bg-[#F1F4F8]"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
            Reports
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Analyze sales, customers, products and business performance
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Download size={14} />

          <span className="hidden sm:inline">
            Export Report
          </span>

          <span className="sm:hidden">
            Export
          </span>
        </button>

      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* BREADCRUMB */}

        <div className="mb-5 flex items-center gap-2 text-[9px] text-[#8995A5]">

          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="hover:text-[#1769F5]"
          >
            Dashboard
          </button>

          <span>/</span>

          <span className="font-medium text-[#566579]">
            Reports
          </span>

        </div>

        {/* =====================================================
            REPORT CONTROLS
        ====================================================== */}

        <section className="rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

          {Object.keys(errors).length > 0 && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-[#F0D4D4] bg-[#FFF7F7] px-4 py-3"
            >
              <p className="text-[9px] font-bold text-[#B84A4A]">
                Please fix the report selection before continuing.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">

            {/* REPORT TYPE */}

            <div className="flex-1">

              <label className="text-[9px] font-semibold text-[#52627A]">
                Report Type
              </label>

              <div className="relative mt-1.5">

                <select
                  value={reportType}
                  onChange={(event) =>
                    handleReportTypeChange(event.target.value)
                  }
                  aria-invalid={Boolean(errors.reportType)}
                  className={`h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-[10px] text-[#52627A] outline-none focus:border-[#1769F5] ${
                    errors.reportType
                      ? "border-[#EF4444]"
                      : "border-[#DCE2EA]"
                  }`}
                >
                  <option>
                    Sales Report
                  </option>

                  <option>
                    Product Report
                  </option>

                  <option>
                    Customer Report
                  </option>

                  <option>
                    Inventory Report
                  </option>

                  <option>
                    Order Report
                  </option>
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-3 text-[#8995A5]"
                />

              </div>

              {errors.reportType && (
                <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                  {errors.reportType}
                </p>
              )}

            </div>

            {/* PERIOD */}

            <div className="flex-1">

              <label className="text-[9px] font-semibold text-[#52627A]">
                Date Range
              </label>

              <div className="relative mt-1.5">

                <CalendarDays
                  size={14}
                  className="pointer-events-none absolute left-3 top-3 text-[#8995A5]"
                />

                <select
                  value={period}
                  onChange={(event) =>
                    handlePeriodChange(event.target.value)
                  }
                  aria-invalid={Boolean(errors.period)}
                  className={`h-10 w-full appearance-none rounded-lg border bg-white px-9 text-[10px] text-[#52627A] outline-none focus:border-[#1769F5] ${
                    errors.period
                      ? "border-[#EF4444]"
                      : "border-[#DCE2EA]"
                  }`}
                >
                  <option>
                    7 Days
                  </option>

                  <option>
                    30 Days
                  </option>

                  <option>
                    90 Days
                  </option>

                  <option>
                    This Year
                  </option>
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-3 text-[#8995A5]"
                />

              </div>

              {errors.period && (
                <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                  {errors.period}
                </p>
              )}

            </div>

            {/* GENERATE */}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#10265B] px-5 text-[10px] font-semibold text-white hover:bg-[#0C1E4B] disabled:opacity-60"
            >

              <RefreshCw
                size={14}
                className={
                  isGenerating
                    ? "animate-spin"
                    : ""
                }
              />

              {isGenerating
                ? "Generating..."
                : "Generate Report"}

            </button>

          </div>

        </section>

        {/* =====================================================
            KPI CARDS
        ====================================================== */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <KpiCard
            title="Total Revenue"
            value={`₹${totals.revenue.toLocaleString(
              "en-IN"
            )}`}
            change="+12.8%"
            icon={IndianRupee}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <KpiCard
            title="Total Orders"
            value={totals.orders.toLocaleString(
              "en-IN"
            )}
            change="+9.4%"
            icon={ShoppingCart}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#1769F5]"
          />

          <KpiCard
            title="Customers"
            value={totals.customers.toLocaleString(
              "en-IN"
            )}
            change="+7.2%"
            icon={Users}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

          <KpiCard
            title="Avg. Order Value"
            value={`₹${averageOrderValue.toLocaleString(
              "en-IN"
            )}`}
            change="+4.6%"
            icon={TrendingUp}
            bg="bg-[#F0ECFF]"
            iconColor="text-[#7053C6]"
          />

        </section>

        {/* =====================================================
            SALES CHART + CATEGORY
        ====================================================== */}

        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">

          {/* SALES CHART */}

          <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <h2 className="text-[13px] font-bold text-[#293953]">
                  Revenue Overview
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Revenue performance for {period}
                </p>

              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                <BarChart3 size={17} />
              </div>

            </div>

            {/* CHART */}

            <div className="mt-6">

              <div className="flex h-[260px] items-end gap-2 border-b border-[#E9EDF2] px-1 sm:gap-4">

                {data.map(
                  (item) => {
                    const height =
                      maxRevenue > 0
                        ? Math.max(
                            8,
                            (item.revenue /
                              maxRevenue) *
                              210
                          )
                        : 8;

                    return (
                      <div
                        key={item.month}
                        className="flex h-full flex-1 flex-col justify-end"
                      >

                        <div className="group relative flex flex-1 items-end justify-center">

                          <div
                            className="w-full max-w-[58px] rounded-t-md bg-[#1769F5] transition-all hover:bg-[#0F5BDE]"
                            style={{
                              height: `${height}px`,
                            }}
                          >

                            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-[#1F2F49] px-2 py-1.5 text-[8px] text-white group-hover:block">
                              ₹
                              {item.revenue.toLocaleString(
                                "en-IN"
                              )}
                            </div>

                          </div>

                        </div>

                        <p className="mt-3 truncate text-center text-[8px] font-medium text-[#8995A5]">
                          {item.month}
                        </p>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

            <div className="mt-4 flex items-center justify-between">

              <div>

                <p className="text-[8px] text-[#8995A5]">
                  Total Revenue
                </p>

                <p className="mt-1 text-[15px] font-bold text-[#293953]">
                  ₹
                  {totals.revenue.toLocaleString(
                    "en-IN"
                  )}
                </p>

              </div>

              <div className="text-right">

                <p className="text-[8px] text-[#8995A5]">
                  Growth
                </p>

                <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-[#249357]">
                  <TrendingUp size={12} />
                  12.8%
                </p>

              </div>

            </div>

          </div>

          {/* CATEGORY */}

          <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-[13px] font-bold text-[#293953]">
                  Sales by Category
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Category contribution
                </p>

              </div>

              <BarChart3
                size={17}
                className="text-[#1769F5]"
              />

            </div>

            <div className="mt-6 space-y-5">

              {topCategories.map(
                (category, index) => (
                  <div
                    key={`${category.name}-${index}`}
                  >

                    <div className="flex items-center justify-between">

                      <p className="text-[9px] font-semibold text-[#52627A]">
                        {category.name}
                      </p>

                      <p className="text-[9px] font-bold text-[#52627A]">
                        ₹
                        {category.sales.toLocaleString(
                          "en-IN"
                        )}
                      </p>

                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF1F5]">

                      <div
                        className="h-full rounded-full bg-[#1769F5]"
                        style={{
                          width: `${category.percentage}%`,
                        }}
                      />

                    </div>

                    <p className="mt-1 text-right text-[7px] text-[#8995A5]">
                      {category.percentage}%
                    </p>

                  </div>
                )
              )}

            </div>

          </div>

        </section>

        {/* =====================================================
            TOP PRODUCTS
        ====================================================== */}

        <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#293953]">
                Top Performing Products
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                Best selling products during the selected period
              </p>

            </div>

            <Package
              size={17}
              className="text-[#1769F5]"
            />

          </div>

          {/* DESKTOP */}

          <div className="hidden overflow-x-auto md:block">

            <table className="min-w-full">

              <thead>

                <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">

                  <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                    Product
                  </th>

                  <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                    Category
                  </th>

                  <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                    Units Sold
                  </th>

                  <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                    Revenue
                  </th>

                </tr>

              </thead>

              <tbody>

                {topProducts.map(
                  (product, index) => (
                    <tr
                      key={`${product.name}-${index}`}
                      className="border-b border-[#F0F2F5] last:border-0"
                    >

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF3FF] text-[9px] font-bold text-[#1769F5]">
                            #{index + 1}
                          </div>

                          <span className="text-[10px] font-semibold text-[#33415A]">
                            {product.name}
                          </span>

                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[8px] text-[#66748B]">
                          {product.category}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-[10px] font-semibold text-[#52627A]">
                        {product.sold.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="px-5 py-4 text-[10px] font-bold text-[#293953]">
                        ₹
                        {product.revenue.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

          {/* MOBILE */}

          <div className="divide-y divide-[#EDF0F4] md:hidden">

            {topProducts.map(
              (product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="p-4"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[9px] font-bold text-[#1769F5]">
                      #{index + 1}
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-[10px] font-bold text-[#33415A]">
                        {product.name}
                      </p>

                      <p className="mt-1 text-[8px] text-[#8995A5]">
                        {product.category}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-[10px] font-bold text-[#293953]">
                        ₹
                        {product.revenue.toLocaleString(
                          "en-IN"
                        )}
                      </p>

                      <p className="mt-1 text-[8px] text-[#8995A5]">
                        {product.sold} sold
                      </p>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </section>

        {/* =====================================================
            QUICK REPORTS
        ====================================================== */}

        <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* QUICK GENERATE */}

          <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                <FileText size={18} />
              </div>

              <div>

                <h2 className="text-[13px] font-bold text-[#293953]">
                  Quick Reports
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Generate commonly used reports
                </p>

              </div>

            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">

              {[
                "Sales Report",
                "Product Report",
                "Customer Report",
                "Inventory Report",
              ].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    handleReportTypeChange(name)
                  }
                  className={`rounded-lg border px-3 py-3 text-left text-[9px] font-semibold transition ${
                    reportType === name
                      ? "border-[#1769F5] bg-[#EDF3FF] text-[#1769F5]"
                      : "border-[#E0E5EC] text-[#52627A] hover:bg-[#F7F9FC]"
                  }`}
                >
                  {name}
                </button>
              ))}

            </div>

          </div>

          {/* RECENT REPORTS */}

          <div className="rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

              <div>

                <h2 className="text-[13px] font-bold text-[#293953]">
                  Recent Reports
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Previously generated reports
                </p>

              </div>

              <FileText
                size={17}
                className="text-[#1769F5]"
              />

            </div>

            <div className="divide-y divide-[#EDF0F4]">

              {recentReports.map(
                (report, index) => (
                  <div
                    key={`${report.name}-${index}`}
                    className="flex items-center gap-3 px-5 py-3"
                  >

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F5F8] text-[#66748B]">
                      <FileText
                        size={14}
                      />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-[9px] font-semibold text-[#52627A]">
                        {report.name}
                      </p>

                      <p className="mt-1 text-[7px] text-[#9AA4B2]">
                        {report.generated}
                      </p>

                    </div>

                    <span className="rounded bg-[#EDF3FF] px-2 py-1 text-[7px] font-bold text-[#1769F5]">
                      {report.format}
                    </span>

                    <button
                      type="button"
                      onClick={handleExport}
                      className="text-[#1769F5] hover:text-[#0F5BDE]"
                      aria-label={`Download ${report.name}`}
                    >
                      <Download
                        size={14}
                      />
                    </button>

                  </div>
                )
              )}

            </div>

          </div>

        </section>

      </div>

      </main>
    </AdminLayout>
  );
}

/* ============================================================
   KPI CARD
============================================================ */

function KpiCard({
  title,
  value,
  change,
  icon: Icon,
  bg,
  iconColor,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  bg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

      <div className="flex items-start justify-between">

        <div className="min-w-0">

          <p className="truncate text-[8px] font-medium text-[#8995A5]">
            {title}
          </p>

          <p className="mt-2 truncate text-[17px] font-bold text-[#293953] sm:text-[20px]">
            {value}
          </p>

          <p className="mt-1 flex items-center gap-1 text-[8px] font-semibold text-[#249357]">
            <TrendingUp size={10} />
            {change}
          </p>

        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${iconColor}`}
        >
          <Icon size={17} />
        </div>

      </div>

    </div>
  );
}