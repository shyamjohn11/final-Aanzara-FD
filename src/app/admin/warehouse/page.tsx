// File: src/app/admin/warehouse/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ChevronRight,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import AdminSidebar from "@/app/components/Admin/AdminSidebar";
import AdminHeader from "@/app/components/Admin/AdminHeader";

import { extractErrorMessage } from "@/app/api/api";
import { warehousesApi } from "@/app/api/services";

/* ============================================================
   TYPES — API SHAPE
============================================================ */

// Confirmed from GET /api/admin/warehouses:
// status: 0 = Active, 1 = Inactive (flag if this is wrong and I'll flip it)
type ApiWarehouseStatus = 0 | 1;

interface ApiWarehouse {
  warehouseId: string;
  warehouseName: string;
  address: string;
  status: ApiWarehouseStatus;
  createdAt: string;
  updatedAt: string;
}

interface WarehousesResponse {
  items: ApiWarehouse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/* ============================================================
   TYPES — UI SHAPE
============================================================ */

type WarehouseStatus = "Active" | "Inactive";

type WarehouseRecord = {
  id: string;
  name: string;
  address: string;
  status: WarehouseStatus;
  createdAt: string;
};

/* ============================================================
   HELPERS
============================================================ */

function mapStatus(status: ApiWarehouseStatus): WarehouseStatus {
  return Number(status) === 0 ? "Active" : "Inactive";
}

function mapWarehouse(w: ApiWarehouse): WarehouseRecord {
  return {
    id: String(w.warehouseId ?? ""),
    name: String(w.warehouseName ?? "Warehouse"),
    address: String(w.address ?? ""),
    status: mapStatus(w.status),
    createdAt: String(w.createdAt ?? ""),
  };
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusStyles(status: WarehouseStatus) {
  switch (status) {
    case "Active":
      return {
        badge: "bg-[#EAF8F0] text-[#249357]",
        icon: CheckCircle2,
      };
    case "Inactive":
      return {
        badge: "bg-[#FDECEC] text-[#E14B4B]",
        icon: XCircle,
      };
  }
}

/* ============================================================
   PAGE
============================================================ */

export default function AdminWarehousePage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | WarehouseStatus>("All");

  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = (path: string) => {
    setSidebarOpen(false);
    router.push(path);
  };

  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      // #50 GET /api/admin/warehouses (proxied via /api rewrite)
      const response = await warehousesApi.list(1, 100);
      const payload = response.data as WarehousesResponse | ApiWarehouse[];
      const items: ApiWarehouse[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      setWarehouses(items.map(mapWarehouse));
    } catch (err) {
      setError(
        extractErrorMessage(err, "Failed to load warehouses. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  // #54 DELETE /api/admin/warehouses/{warehouseId} (two-click confirm)
  const confirmDelete = async (id: string) => {
    if (!id || deleting) return;
    setDeleting(true);
    try {
      await warehousesApi.remove(id);
      setConfirmDeleteId(null);
      await fetchWarehouses();
    } catch (err) {
      setError(
        extractErrorMessage(err, "Failed to delete warehouse. Please try again.")
      );
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const totalWarehouses = warehouses.length;
  const activeCount = warehouses.filter(
    (w) => w.status === "Active"
  ).length;
  const inactiveCount = warehouses.filter(
    (w) => w.status === "Inactive"
  ).length;

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const matchesSearch =
      warehouse.name.toLowerCase().includes(search.toLowerCase()) ||
      warehouse.address.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || warehouse.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const needsAttention = inactiveCount;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

      {/* ======================================================
          ADMIN SIDEBAR
      ======================================================= */}

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ======================================================
          MAIN AREA
      ======================================================= */}

      <div className="lg:pl-[270px]">

        {/* ====================================================
            ADMIN HEADER
        ===================================================== */}

        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* ====================================================
            CONTENT
        ===================================================== */}

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">

          {/* ==================================================
              PAGE HEADER
          =================================================== */}

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div className="flex items-center gap-4">

              <button
                type="button"
                onClick={() => navigate("/admin")}
                aria-label="Back to dashboard"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E3E8EF] bg-white text-[#10265B] shadow-sm transition hover:bg-[#F5F8FF]"
              >
                <ArrowLeft size={19} />
              </button>

              <div>

                <h1 className="font-sora text-[25px] font-bold tracking-tight text-[#1D2D49] sm:text-[29px]">
                  Warehouse
                </h1>

                <p className="mt-1 text-xs text-[#7B8798]">
                  Manage warehouse locations and capacity
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/warehouse/new")
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-[#1769F5] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0F5DDF]"
            >
              <Plus size={16} />
              Add Warehouse
            </button>

          </div>

          {/* ==================================================
              BREADCRUMB
          =================================================== */}

          <div className="mb-6 flex items-center gap-2 text-[11px] text-[#8C98A9]">

            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="hover:text-[#1769F5]"
            >
              Dashboard
            </button>

            <ChevronRight size={12} />

            <span className="text-[#53627A]">
              Warehouse
            </span>

          </div>

          {/* ==================================================
              ERROR BANNER
          =================================================== */}

          {error && (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-[#F5C2C2] bg-[#FDECEC] p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FBD9D9] text-[#E14B4B]">
                  <AlertTriangle size={17} />
                </div>

                <div>

                  <p className="text-[11px] font-bold text-[#8A2323]">
                    Couldn&apos;t load warehouses
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#A34747]">
                    {error}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={fetchWarehouses}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[10px] font-semibold text-[#E14B4B] shadow-sm hover:bg-[#FFF5F5]"
              >
                <RefreshCw size={12} />
                Retry
              </button>

            </div>
          )}

          {/* ==================================================
              STAT CARDS
          =================================================== */}

          <section className="grid gap-4 sm:grid-cols-3">

            <StatCard
              label="Warehouses"
              value={loading ? "—" : String(totalWarehouses)}
              icon={WarehouseIcon}
              iconStyle="bg-[#EAF0FF] text-[#3260B4]"
            />

            <StatCard
              label="Active"
              value={loading ? "—" : String(activeCount)}
              icon={CheckCircle2}
              iconStyle="bg-[#EAF8F0] text-[#249357]"
            />

            <StatCard
              label="Inactive"
              value={loading ? "—" : String(inactiveCount)}
              icon={XCircle}
              iconStyle="bg-[#FDECEC] text-[#E14B4B]"
            />

          </section>

          {/* ==================================================
              ATTENTION BANNER
          =================================================== */}

          {!loading && !error && needsAttention > 0 && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#F5DFA8] bg-[#FFF8EA] p-4">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FCEFCB] text-[#D7871E]">
                <AlertTriangle size={17} />
              </div>

              <div>

                <p className="text-[11px] font-bold text-[#8A5A0F]">
                  Warehouse attention required
                </p>

                <p className="mt-0.5 text-[10px] text-[#9A7328]">
                  {inactiveCount} inactive warehouse
                  {inactiveCount !== 1 ? "s" : ""} need attention.
                </p>

              </div>

            </div>
          )}

          {/* ==================================================
              FILTER BAR
          =================================================== */}

          <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#E4E8EF] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

            <div className="flex flex-1 items-center gap-3">

              <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-[#E0E5EC] px-3.5">

                <Search
                  size={16}
                  className="shrink-0 text-[#98A3B2]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search warehouse or address..."
                  className="w-full bg-transparent text-[11px] text-[#33415A] outline-none placeholder:text-[#98A3B2]"
                />

              </div>

            </div>

            <div className="flex flex-wrap items-center gap-2">

              <FilterPill
                label="All"
                active={statusFilter === "All"}
                onClick={() => setStatusFilter("All")}
              />

              <FilterPill
                label="Active"
                active={statusFilter === "Active"}
                onClick={() => setStatusFilter("Active")}
              />

              <FilterPill
                label="Inactive"
                active={statusFilter === "Inactive"}
                onClick={() => setStatusFilter("Inactive")}
              />

            </div>

          </section>

          {/* ==================================================
              WAREHOUSE LIST
          =================================================== */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-[#EDF0F4] p-5 sm:p-6">

              <div>

                <h2 className="text-sm font-bold text-[#253650]">
                  Warehouse List
                </h2>

                <p className="mt-1 text-[10px] text-[#8793A4]">
                  {loading
                    ? "Loading..."
                    : `${filteredWarehouses.length} warehouse${
                        filteredWarehouses.length !== 1 ? "s" : ""
                      } found`}
                </p>

              </div>

              {(search || statusFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                  }}
                  className="text-[10px] font-semibold text-[#3260B4] hover:underline"
                >
                  Clear Filters
                </button>
              )}

            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full text-left">

                <thead className="bg-[#FAFBFD]">

                  <tr className="border-b border-[#EDF0F4] text-[9px] uppercase tracking-wide text-[#98A3B2]">

                    <th className="px-5 py-3">
                      Warehouse
                    </th>

                    <th className="px-5 py-3">
                      Address
                    </th>

                    <th className="px-5 py-3">
                      Created
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {loading &&
                    Array.from({ length: 4 }).map((_, index) => (
                      <tr
                        key={`skeleton-${index}`}
                        className="border-b border-[#F0F2F5] last:border-0"
                      >
                        <td className="px-5 py-4" colSpan={5}>
                          <div className="h-4 w-full max-w-[520px] animate-pulse rounded bg-[#EEF1F5]" />
                        </td>
                      </tr>
                    ))}

                  {!loading &&
                    filteredWarehouses.map((warehouse) => {

                      const { badge, icon: StatusIcon } =
                        statusStyles(warehouse.status);

                      return (
                        <tr
                          key={warehouse.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FAFBFD]"
                        >

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2F5FA] text-[#607087]">
                                <WarehouseIcon size={16} />
                              </div>

                              <div className="min-w-0">

                                <p className="truncate text-[10px] font-bold text-[#33415A]">
                                  {warehouse.name}
                                </p>

                                <p className="mt-1 text-[9px] text-[#9AA4B2]">
                                  {warehouse.id.slice(0, 8)}
                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-1.5 text-[10px] text-[#566579]">
                              <MapPin
                                size={12}
                                className="shrink-0 text-[#98A3B2]"
                              />
                              {warehouse.address}
                            </div>

                          </td>

                          <td className="px-5 py-4">

                            <p className="text-[10px] text-[#566579]">
                              {formatDate(warehouse.createdAt)}
                            </p>

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-semibold ${badge}`}
                            >
                              <StatusIcon size={10} />
                              {warehouse.status}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex items-center justify-end gap-1.5">

                              {confirmDeleteId === warehouse.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => confirmDelete(warehouse.id)}
                                    disabled={deleting}
                                    className="rounded-lg bg-[#E14B4B] px-2.5 py-1.5 text-[9px] font-bold text-white hover:bg-[#C93E3E] disabled:opacity-50"
                                  >
                                    {deleting ? "Deleting..." : "Confirm"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    disabled={deleting}
                                    className="rounded-lg border border-[#E3E8EF] px-2.5 py-1.5 text-[9px] font-semibold text-[#5B6B84] hover:bg-[#F5F8FF] disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/admin/warehouse/${warehouse.id}`
                                      )
                                    }
                                    aria-label={`Edit ${warehouse.name}`}
                                    className="rounded-lg p-2 text-[#8D98A8] hover:bg-[#EDF2F8] hover:text-[#2457B5]"
                                  >
                                    <Pencil size={14} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmDeleteId(warehouse.id)
                                    }
                                    aria-label={`Delete ${warehouse.name}`}
                                    className="rounded-lg p-2 text-[#8D98A8] hover:bg-[#FDECEC] hover:text-[#E14B4B]"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    })}

                  {!loading && !error && filteredWarehouses.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-14 text-center text-[11px] text-[#98A3B2]"
                      >
                        No warehouses match your search.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>

        </main>

      </div>

    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  icon: Icon,
  iconStyle,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconStyle: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-[10px] font-medium text-[#7B889A]">
            {label}
          </p>

          <h3 className="mt-2 text-[23px] font-bold tracking-tight text-[#22324D]">
            {value}
          </h3>

        </div>

        <div className={`rounded-xl p-2.5 ${iconStyle}`}>
          <Icon size={18} />
        </div>

      </div>

    </div>
  );
}

/* ============================================================
   FILTER PILL
============================================================ */

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-lg
        px-3.5
        py-2
        text-[10px]
        font-semibold
        transition
        ${
          active
            ? "bg-[#10265B] text-white"
            : "bg-[#F1F4F8] text-[#5B6B84] hover:bg-[#E6EBF2]"
        }
      `}
    >
      {label}
    </button>
  );
}
