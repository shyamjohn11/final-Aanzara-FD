"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { api, extractErrorMessage } from "@/app/api/api";
import { inventoryApi, warehousesApi } from "@/app/api/services";
import {
  ArrowLeft,
  Search,
  Package,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  History,
  X,
} from "lucide-react";

type InventoryItem = {
  id: number;
  productId?: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  stock: number;
  minStock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
};

const CATEGORIES = [
  "Staples",
  "Biscuits",
  "Home Care",
  "Instant Food",
  "Beverages",
  "Personal Care",
];

export default function InventoryPage() {
  const router = useRouter();

  const [inventory, setInventory] = useState<
    InventoryItem[]
  >([]);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<
    "All" | "In Stock" | "Low Stock" | "Out of Stock"
  >("All");

  const [category, setCategory] =
    useState("All");

  const [adjustId, setAdjustId] =
    useState<number | null>(null);

  const [adjustAmount, setAdjustAmount] =
    useState("1");

  const [adjustType, setAdjustType] =
    useState<"add" | "remove" | "receive">("add");

  const [showSuccess, setShowSuccess] =
    useState(false);

  const [adjustError, setAdjustError] = useState("");

  // Warehouses are required by the backend stock endpoints
  // (#58 receive-stock, #59 adjust).
  const [warehouses, setWarehouses] = useState<
    { id: string; name: string }[]
  >([]);

  const [warehouseId, setWarehouseId] =
    useState("");

  const [warehousesLoading, setWarehousesLoading] =
    useState(false);

  // #56 below-reorder view + #60 movement history drawer state.
  const [lowOnly, setLowOnly] = useState(false);
  const [lowRows, setLowRows] = useState<InventoryItem[] | null>(null);
  const [lowError, setLowError] = useState("");
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [historyRows, setHistoryRows] = useState<
    { id: string; date: string; type: string; quantity: string; reason: string }[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  /* ==========================================================
     LOAD STOCK LIST (GET /api/admin/inventory)
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      try {
        const response = await api.get("/api/admin/inventory");
        const payload = response.data;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (cancelled) return;
        if (rawItems.length === 0) {
          setInventory([]);
          return;
        }

        const mapped: InventoryItem[] = rawItems.map((item, index) => {
          const stock = Number(
            item.quantity ?? item.stock ?? item.availableQuantity ?? 0
          );
          const minStock = Number(
            item.reorderLevel ?? item.minStock ?? item.minimumStock ?? 0
          );

          return {
            id: index + 1,
            productId: String(
              item.productId ?? item.id ?? ""
            ),
            name: String(
              item.productName ?? item.name ?? "Unnamed product"
            ),
            sku: String(item.sku ?? item.skuCode ?? ""),
            category: String(item.category ?? item.categoryName ?? "Uncategorized"),
            brand: String(item.brand ?? item.brandName ?? ""),
            stock,
            minStock,
            status: getStatus(stock, minStock),
          };
        });

        setInventory(mapped);
      } catch (error) {
        console.error("Unable to load inventory:", error);
        if (!cancelled) setInventory([]);
      }
    };

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     LOAD WAREHOUSES (needed for receive/adjust calls)
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadWarehouses = async () => {
      setWarehousesLoading(true);

      try {
        const response = await warehousesApi.list(
          1,
          100
        );
        const payload: unknown =
          (response as { data?: unknown })
            ?.data ?? response;
        const raw: unknown[] = Array.isArray(
          payload
        )
          ? payload
          : Array.isArray(
                (
                  payload as {
                    items?: unknown;
                  }
                )?.items
              )
            ? (
                payload as {
                  items: unknown[];
                }
              ).items
            : [];

        if (cancelled) {
          return;
        }

        const rows = raw
          .map((entry) => {
            if (
              entry === null ||
              typeof entry !== "object"
            ) {
              return null;
            }

            const record = entry as Record<
              string,
              unknown
            >;
            const id = String(
              record.warehouseId ??
                record.id ??
                ""
            ).trim();
            const name = String(
              record.warehouseName ??
                record.name ??
                "Warehouse"
            ).trim();

            return id
              ? { id, name }
              : null;
          })
          .filter(
            (
              row
            ): row is {
              id: string;
              name: string;
            } => row !== null
          );

        setWarehouses(rows);
        setWarehouseId((current) =>
          current ||
          rows[0]?.id ||
          ""
        );
      } catch (error) {
        console.error(
          "Unable to load warehouses:",
          error
        );
      } finally {
        if (!cancelled) {
          setWarehousesLoading(false);
        }
      }
    };

    loadWarehouses();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     UPDATE STATUS
  ========================================================== */

  const getStatus = (
    stock: number,
    minStock: number
  ): InventoryItem["status"] => {
    if (stock <= 0) {
      return "Out of Stock";
    }

    if (stock <= minStock) {
      return "Low Stock";
    }

    return "In Stock";
  };

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredInventory = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    // #56 below-reorder source when the pill is active.
    const source =
      lowOnly && lowRows !== null ? lowRows : inventory;

    return source.filter((item) => {
      const matchesSearch =
        !query ||
        item.name
          .toLowerCase()
          .includes(query) ||
        item.sku
          .toLowerCase()
          .includes(query) ||
        item.brand
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "All" ||
        item.status === filter;

      const matchesCategory =
        category === "All" ||
        item.category === category;

      return (
        matchesSearch &&
        matchesFilter &&
        matchesCategory
      );
    });
  }, [
    inventory,
    lowOnly,
    lowRows,
    search,
    filter,
    category,
  ]);

  /* ==========================================================
     STATS
  ========================================================== */

  const totalProducts = inventory.length;

  const inStock = inventory.filter(
    (item) => item.status === "In Stock"
  ).length;

  const lowStock = inventory.filter(
    (item) => item.status === "Low Stock"
  ).length;

  const outOfStock = inventory.filter(
    (item) => item.status === "Out of Stock"
  ).length;

  const totalUnits = inventory.reduce(
    (total, item) => total + item.stock,
    0
  );

  /* ==========================================================
     OPEN ADJUST MODAL
  ========================================================== */

  const openAdjust = (
    id: number,
    type: "add" | "remove" | "receive"
  ) => {
    setAdjustId(id);
    setAdjustType(type);
    setAdjustAmount("1");
    setAdjustError("");
  };

  /* ==========================================================
     ADJUST STOCK
  ========================================================== */

  const updateStock = async () => {
    setAdjustError("");

    if (adjustId === null) {
      setAdjustError("Please select a product.");
      return;
    }

    const rawAmount = adjustAmount.trim();

    if (!rawAmount) {
      setAdjustError("Quantity is required.");
      return;
    }

    // Only allow positive whole numbers for inventory units.
    if (!/^\d+$/.test(rawAmount)) {
      setAdjustError("Quantity must be a whole number.");
      return;
    }

    const amount = Number(rawAmount);

    if (!Number.isSafeInteger(amount)) {
      setAdjustError("Quantity is too large.");
      return;
    }

    if (amount <= 0) {
      setAdjustError("Quantity must be greater than 0.");
      return;
    }

    if (amount > 1000000) {
      setAdjustError("Quantity cannot exceed 1,000,000 units.");
      return;
    }

    const selected = inventory.find(
      (item) => item.id === adjustId
    );

    if (!selected) {
      setAdjustError("Selected product was not found.");
      return;
    }

    if (adjustType === "remove" && selected.stock <= 0) {
      setAdjustError("Cannot remove stock because this product is out of stock.");
      return;
    }

    if (
      adjustType === "remove" &&
      amount > selected.stock
    ) {
      setAdjustError(
        `Cannot remove ${amount} units. Only ${selected.stock} units are available.`
      );
      return;
    }

    const newStock =
      adjustType === "remove"
        ? selected.stock - amount
        : selected.stock + amount;

    if (!Number.isSafeInteger(newStock)) {
      setAdjustError("The resulting stock value is too large.");
      return;
    }

    // Persist (#59 adjust, or #58 receive-stock for inbound receipts).
    // Both endpoints require the warehouse the stock belongs to.
    const productId = selected.productId;

    if (!warehouseId) {
      setAdjustError(
        warehousesLoading
          ? "Warehouses are still loading. Please try again."
          : "No warehouse found. Create one in Warehouse first."
      );
      return;
    }

    if (adjustType === "receive") {
      if (!productId) {
        setAdjustError(
          "Selected product is not linked to the backend catalogue."
        );
        return;
      }
      try {
        await inventoryApi.receiveStock(productId, {
          warehouseId,
          quantity: amount,
          reason: "Stock received",
        });
      } catch (error) {
        console.error("Receive stock failed:", error);
        setAdjustError(
          extractErrorMessage(error, "Receive stock failed. Please try again.")
        );
        return;
      }
    } else if (productId) {
      try {
        await inventoryApi.adjust(productId, {
          warehouseId,
          quantity:
            adjustType === "remove"
              ? -amount
              : amount,
          reason:
            adjustType === "remove"
              ? "Stock removed"
              : "Stock received",
        });
      } catch (error) {
        console.error("Stock adjustment failed:", error);
        setAdjustError(
          extractErrorMessage(error, "Stock adjustment failed. Please try again.")
        );
        return;
      }
    }

    setInventory((current) =>
      current.map((item) => {
        if (item.id !== adjustId) {
          return item;
        }

        return {
          ...item,
          stock: newStock,
          status: getStatus(
            newStock,
            item.minStock
          ),
        };
      })
    );

    setAdjustId(null);
    setAdjustAmount("1");
    setAdjustError("");

    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
    }, 1800);
  };

  /* ==========================================================
     BELOW-REORDER VIEW (#56)
  ========================================================== */

  const toggleLowOnly = async () => {
    const next = !lowOnly;
    setLowOnly(next);
    setLowError("");

    if (!next) return;

    try {
      const response = await inventoryApi.lowStock();
      const payload: unknown = response.data;
      const rawItems: unknown[] = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as Record<string, unknown>)?.items)
          ? ((payload as Record<string, unknown>).items as unknown[])
          : [];
      const mapped: InventoryItem[] = [];
      rawItems.forEach((entry, index) => {
        if (typeof entry !== "object" || entry === null) return;
        const raw = entry as Record<string, unknown>;
        const stock = Number(
          raw.quantity ?? raw.stock ?? raw.availableQuantity ?? 0
        );
        const minStock = Number(
          raw.reorderLevel ?? raw.minStock ?? raw.minimumStock ?? 0
        );
        mapped.push({
          id: 100000 + index,
          productId: String(raw.productId ?? raw.id ?? ""),
          name: String(raw.productName ?? raw.name ?? "Unnamed product"),
          sku: String(raw.sku ?? raw.skuCode ?? ""),
          category: String(raw.category ?? raw.categoryName ?? "Uncategorized"),
          brand: String(raw.brand ?? raw.brandName ?? ""),
          stock,
          minStock,
          status: getStatus(stock, minStock),
        });
      });
      setLowRows(mapped);
    } catch (error) {
      console.error("Unable to load low-stock items:", error);
      setLowError(
        extractErrorMessage(error, "Unable to load below-reorder items.")
      );
      setLowRows([]);
    }
  };

  /* ==========================================================
     MOVEMENT HISTORY (#57 per-product + #60 movements)
  ========================================================== */

  const openHistory = async (item: InventoryItem) => {
    setHistoryItem(item);
    setHistoryRows([]);
    setHistoryError("");

    if (!item.productId) {
      setHistoryError("Selected product is not linked to the backend catalogue.");
      return;
    }

    setHistoryLoading(true);
    try {
      // #57 per-product stock (header context) — best-effort.
      try {
        await inventoryApi.byProduct(item.productId);
      } catch {
        // Header already shows local snapshot; ignore.
      }

      // #60 movement history.
      const response = await inventoryApi.movements(item.productId);
      const payload: unknown = response.data;
      const rawItems: unknown[] = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as Record<string, unknown>)?.items)
          ? ((payload as Record<string, unknown>).items as unknown[])
          : Array.isArray((payload as Record<string, unknown>)?.data)
            ? ((payload as Record<string, unknown>).data as unknown[])
            : [];
      const mapped = rawItems.map((entry, index) => {
        const raw =
          typeof entry === "object" && entry !== null
            ? (entry as Record<string, unknown>)
            : {};
        const qty = Number(raw.quantity ?? raw.adjustment ?? raw.change ?? 0);
        return {
          id: String(raw.movementId ?? raw.id ?? `m-${index}`),
          date: String(
            raw.createdAt ?? raw.date ?? raw.movementDate ?? ""
          ).slice(0, 16).replace("T", " "),
          type: String(raw.type ?? raw.movementType ?? (qty < 0 ? "Out" : "In")),
          quantity: `${qty > 0 ? "+" : ""}${Number.isFinite(qty) ? qty : 0}`,
          reason: String(raw.reason ?? raw.note ?? raw.remarks ?? "—"),
        };
      });
      setHistoryRows(mapped);
    } catch (error) {
      console.error("Unable to load movements:", error);
      setHistoryError(
        extractErrorMessage(error, "Unable to load movement history.")
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ==========================================================
     RESET FILTER
  ========================================================== */

  const clearFilters = () => {
    setSearch("");
    setFilter("All");
    setCategory("All");
    setLowOnly(false);
    setLowRows(null);
    setLowError("");
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
          aria-label="Back to admin"
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] transition hover:bg-[#F1F4F8] hover:text-[#1769F5]"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
            Inventory
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage product stock and inventory
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/products/create"
            )
          }
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white transition hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Add Product
          </span>

          <span className="sm:hidden">
            Add
          </span>
        </button>

      </header>

      {/* =====================================================
          MAIN
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
            Inventory
          </span>

        </div>

        {/* ===================================================
            STATS
        ==================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">

          <StatCard
            title="Products"
            value={totalProducts}
            icon={Package}
            iconClass="text-[#3260B4]"
            bgClass="bg-[#EDF3FF]"
          />

          <StatCard
            title="In Stock"
            value={inStock}
            icon={CheckCircle2}
            iconClass="text-[#249357]"
            bgClass="bg-[#EAF8F0]"
          />

          <StatCard
            title="Low Stock"
            value={lowStock}
            icon={AlertTriangle}
            iconClass="text-[#D58A20]"
            bgClass="bg-[#FFF5DF]"
          />

          <StatCard
            title="Out of Stock"
            value={outOfStock}
            icon={XCircle}
            iconClass="text-[#D85A5A]"
            bgClass="bg-[#FFF0F0]"
          />

          <StatCard
            title="Total Units"
            value={totalUnits.toLocaleString(
              "en-IN"
            )}
            icon={BoxesIcon}
            iconClass="text-[#6B54B6]"
            bgClass="bg-[#F1EDFF]"
            fullOnMobile
          />

        </section>

        {/* ===================================================
            LOW STOCK ALERT
        ==================================================== */}

        {lowStock + outOfStock > 0 && (
          <section className="mt-5 flex items-center rounded-xl border border-[#F0D99E] bg-[#FFF9E9] px-4 py-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF0C9] text-[#C88720]">
              <AlertTriangle size={17} />
            </div>

            <div className="ml-3">

              <p className="text-[10px] font-bold text-[#79551B]">
                Inventory attention required
              </p>

              <p className="mt-0.5 text-[9px] text-[#92713B]">
                {lowStock} low stock and{" "}
                {outOfStock} out of stock
                products need attention.
              </p>

            </div>

          </section>
        )}

        {/* ===================================================
            FILTERS
        ==================================================== */}

        <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

            {/* SEARCH */}

            <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 xl:max-w-[420px]">

              <Search
                size={16}
                className="shrink-0 text-[#8995A5]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product, SKU or brand..."
                className="w-full bg-transparent px-2.5 text-[11px] text-[#263A59] outline-none placeholder:text-[#A0AAB8]"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="text-[#8995A5]"
                >
                  <X size={14} />
                </button>
              )}

            </div>

            {/* CATEGORY */}

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              className="h-10 rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 text-[10px] text-[#5D6C80] outline-none focus:border-[#1769F5]"
            >

              <option value="All">
                All Categories
              </option>

              {CATEGORIES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}

            </select>

            {/* STATUS FILTER */}

            <div className="flex flex-wrap items-center gap-1.5 xl:ml-auto">

              {(
                [
                  "All",
                  "In Stock",
                  "Low Stock",
                  "Out of Stock",
                ] as const
              ).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setFilter(item)
                  }
                  className={`
                    rounded-lg
                    px-3
                    py-2
                    text-[9px]
                    font-semibold
                    transition
                    ${
                      filter === item
                        ? "bg-[#173B7A] text-white"
                        : "bg-[#F5F7FA] text-[#68778B] hover:bg-[#EDEFF3]"
                    }
                  `}
                >
                  {item}
                </button>
              ))}

              <button
                type="button"
                onClick={toggleLowOnly}
                title="Below reorder level (#56)"
                className={`
                  rounded-lg
                  px-3
                  py-2
                  text-[9px]
                  font-semibold
                  transition
                  ${
                    lowOnly
                      ? "bg-[#B45309] text-white"
                      : "bg-[#FFF7E8] text-[#92713B] hover:bg-[#FCEFCB]"
                  }
                `}
              >
                Below reorder
              </button>

            </div>

          </div>

          {lowError && (
            <p role="alert" className="mt-2 text-[9px] font-medium text-[#D85A5A]">
              {lowError}
            </p>
          )}

        </section>

        {/* ===================================================
            INVENTORY TABLE
        ==================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#263650]">
                Stock Inventory
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredInventory.length} products found
              </p>

            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="text-[9px] font-semibold text-[#1769F5] hover:underline"
            >
              Clear Filters
            </button>

          </div>

          {filteredInventory.length === 0 ? (
            <EmptyInventory
              onClear={clearFilters}
            />
          ) : (
            <>
              {/* =================================================
                  DESKTOP TABLE
              ================================================== */}

              <div className="hidden overflow-x-auto md:block">

                <table className="min-w-full">

                  <thead>

                    <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Product
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        SKU
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Category
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Stock
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Minimum
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Adjust
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredInventory.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                                <Package size={18} />
                              </div>

                              <div>

                                <p className="max-w-[230px] truncate text-[11px] font-bold text-[#33415A]">
                                  {item.name}
                                </p>

                                <p className="mt-1 text-[9px] text-[#8B96A5]">
                                  {item.brand}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* SKU */}

                          <td className="px-5 py-4">

                            <span className="rounded-md bg-[#F3F5F8] px-2 py-1 font-mono text-[9px] text-[#69778B]">
                              {item.sku}
                            </span>

                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] text-[#5F6E82]">
                              {item.category}
                            </span>

                          </td>

                          {/* STOCK */}

                          <td className="px-5 py-4">

                            <div className="min-w-[110px]">

                              <div className="flex items-center justify-between">

                                <span
                                  className={`
                                    text-[12px]
                                    font-bold
                                    ${
                                      item.stock ===
                                      0
                                        ? "text-[#D85A5A]"
                                        : item.stock <=
                                          item.minStock
                                        ? "text-[#D58A20]"
                                        : "text-[#33415A]"
                                    }
                                  `}
                                >
                                  {item.stock}
                                </span>

                                <span className="text-[8px] text-[#A0AAB8]">
                                  units
                                </span>

                              </div>

                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EDF0F4]">

                                <div
                                  className={`
                                    h-full rounded-full
                                    ${
                                      item.stock ===
                                      0
                                        ? "bg-[#D85A5A]"
                                        : item.stock <=
                                          item.minStock
                                        ? "bg-[#D58A20]"
                                        : "bg-[#249357]"
                                    }
                                  `}
                                  style={{
                                    width: `${Math.min(
                                      Math.max(
                                        item.stock,
                                        0
                                      ),
                                      100
                                    )}%`,
                                  }}
                                />

                              </div>

                            </div>

                          </td>

                          {/* MIN STOCK */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] text-[#65748A]">
                              {item.minStock}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                item.status
                              }
                            />

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1">

                              <button
                                type="button"
                                onClick={() =>
                                  openAdjust(
                                    item.id,
                                    "remove"
                                  )
                                }
                                disabled={
                                  item.stock ===
                                  0
                                }
                                title="Remove stock"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E7ED] text-[#D85A5A] transition hover:bg-[#FFF0F0] disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Minus
                                  size={14}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openAdjust(
                                    item.id,
                                    "add"
                                  )
                                }
                                title="Add stock"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5] transition hover:bg-[#DCE9FF]"
                              >
                                <Plus
                                  size={14}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openAdjust(
                                    item.id,
                                    "receive"
                                  )
                                }
                                title="Receive stock (#58)"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E7ED] text-[#1769F5] transition hover:bg-[#EDF3FF]"
                              >
                                <Package
                                  size={14}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openHistory(item)
                                }
                                title="Movement history (#60)"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E7ED] text-[#5B6B84] transition hover:bg-[#F1F4F8]"
                              >
                                <History
                                  size={14}
                                />
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  MOBILE
              ================================================== */}

              <div className="divide-y divide-[#EDF0F4] md:hidden">

                {filteredInventory.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                          <Package size={18} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-[11px] font-bold text-[#33415A]">
                                {item.name}
                              </p>

                              <p className="mt-1 font-mono text-[8px] text-[#8995A5]">
                                {item.sku}
                              </p>

                            </div>

                            <StatusBadge
                              status={
                                item.status
                              }
                            />

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <MobileInfo
                              label="Category"
                              value={
                                item.category
                              }
                            />

                            <MobileInfo
                              label="Brand"
                              value={
                                item.brand
                              }
                            />

                            <MobileInfo
                              label="Stock"
                              value={`${item.stock} units`}
                            />

                            <MobileInfo
                              label="Minimum"
                              value={`${item.minStock} units`}
                            />

                          </div>

                          <div className="mt-3">

                            <div className="flex items-center justify-between">

                              <span className="text-[8px] text-[#8995A5]">
                                Stock Level
                              </span>

                              <span className="text-[8px] font-semibold text-[#65748A]">
                                {item.stock}
                              </span>

                            </div>

                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EDF0F4]">

                              <div
                                className={`
                                  h-full rounded-full
                                  ${
                                    item.stock ===
                                    0
                                      ? "bg-[#D85A5A]"
                                      : item.stock <=
                                        item.minStock
                                      ? "bg-[#D58A20]"
                                      : "bg-[#249357]"
                                  }
                                `}
                                style={{
                                  width: `${Math.min(
                                    Math.max(
                                      item.stock,
                                      0
                                    ),
                                    100
                                  )}%`,
                                }}
                              />

                            </div>

                          </div>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openAdjust(
                                  item.id,
                                  "remove"
                                )
                              }
                              disabled={
                                item.stock ===
                                0
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E3E7ED] px-3 text-[9px] font-semibold text-[#D85A5A] disabled:opacity-30"
                            >
                              <Minus
                                size={13}
                              />
                              Remove
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openAdjust(
                                  item.id,
                                  "add"
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#1769F5] px-3 text-[9px] font-semibold text-white"
                            >
                              <Plus
                                size={13}
                              />
                              Add Stock
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openAdjust(
                                  item.id,
                                  "receive"
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E3E7ED] px-3 text-[9px] font-semibold text-[#1769F5]"
                            >
                              <Package
                                size={13}
                              />
                              Receive
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openHistory(item)
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E3E7ED] px-3 text-[9px] font-semibold text-[#5B6B84]"
                            >
                              <History
                                size={13}
                              />
                              History
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>

              {/* PAGINATION */}

              <div className="flex items-center justify-between border-t border-[#EDF0F4] px-5 py-4">

                <p className="text-[9px] text-[#8995A5]">
                  Showing{" "}
                  <span className="font-semibold text-[#4D5C72]">
                    {filteredInventory.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#4D5C72]">
                    {inventory.length}
                  </span>
                </p>

                <div className="flex items-center gap-1">

                  <button
                    type="button"
                    disabled
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E1E6ED] text-[#B3BBC6]"
                  >
                    <ChevronLeft
                      size={14}
                    />
                  </button>

                  <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-[#173B7A] px-2 text-[9px] font-semibold text-white">
                    1
                  </span>

                  <button
                    type="button"
                    disabled
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E1E6ED] text-[#B3BBC6]"
                  >
                    <ChevronRight
                      size={14}
                    />
                  </button>

                </div>

              </div>

            </>
          )}

        </section>

      </div>

      {/* =====================================================
          STOCK ADJUST MODAL
      ====================================================== */}

      {adjustId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() =>
              setAdjustId(null)
            }
          />

          <div className="relative w-full max-w-[400px] rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {adjustType === "receive"
                    ? "Receive Stock"
                    : adjustType === "add"
                      ? "Add Stock"
                      : "Remove Stock"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Update inventory quantity
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setAdjustId(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="p-5">

              {(() => {
                const selected =
                  inventory.find(
                    (item) =>
                      item.id ===
                      adjustId
                  );

                if (!selected) {
                  return null;
                }

                return (
                  <>
                    <div className="rounded-xl bg-[#F5F8FC] p-4">

                      <div className="flex items-center">

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E7F0FF] text-[#1769F5]">
                          <Package
                            size={18}
                          />
                        </div>

                        <div className="ml-3 min-w-0">

                          <p className="truncate text-[11px] font-bold text-[#33415A]">
                            {selected.name}
                          </p>

                          <p className="mt-1 font-mono text-[8px] text-[#8995A5]">
                            {selected.sku}
                          </p>

                        </div>

                      </div>

                      <div className="mt-4 flex items-center justify-between">

                        <span className="text-[9px] text-[#8995A5]">
                          Current Stock
                        </span>

                        <span className="text-[14px] font-bold text-[#33415A]">
                          {selected.stock}
                        </span>

                      </div>

                    </div>

                    <label className="mt-5 block text-[10px] font-semibold text-[#52627A]">
                      Quantity
                    </label>

                    <div className="mt-1.5 flex h-11 items-center rounded-lg border border-[#DCE2EA] focus-within:border-[#1769F5]">

                      <input
                        type="number"
                        min="1"
                        max="1000000"
                        step="1"
                        inputMode="numeric"
                        value={adjustAmount}
                        onChange={(event) => {
                          const value = event.target.value;

                          // Prevent decimals, negative values and scientific notation.
                          if (
                            value !== "" &&
                            !/^\d+$/.test(value)
                          ) {
                            setAdjustError(
                              "Quantity must be a positive whole number."
                            );
                            return;
                          }

                          if (value.length > 7) {
                            setAdjustError(
                              "Quantity cannot exceed 1,000,000 units."
                            );
                            return;
                          }

                          setAdjustAmount(value);
                          setAdjustError("");
                        }}
                        onBlur={() => {
                          if (!adjustAmount.trim()) {
                            setAdjustError("Quantity is required.");
                          } else if (
                            !/^\d+$/.test(adjustAmount) ||
                            Number(adjustAmount) <= 0
                          ) {
                            setAdjustError(
                              "Quantity must be a positive whole number."
                            );
                          }
                        }}
                        aria-invalid={Boolean(adjustError)}
                        aria-describedby="stock-adjust-error"
                        className={`w-full bg-transparent px-3 text-[12px] outline-none ${
                          adjustError ? "text-[#D85A5A]" : ""
                        }`}
                      />

                      <span className="pr-3 text-[9px] text-[#8995A5]">
                        units
                      </span>

                    </div>

                    {adjustError && (
                      <p
                        id="stock-adjust-error"
                        role="alert"
                        className="mt-2 text-[9px] font-medium text-[#D85A5A]"
                      >
                        {adjustError}
                      </p>
                    )}

                    <label className="mt-5 block text-[10px] font-semibold text-[#52627A]">
                      Warehouse
                    </label>

                    {warehousesLoading ? (
                      <p className="mt-1.5 text-[10px] text-[#8995A5]">
                        Loading warehouses…
                      </p>
                    ) : warehouses.length > 0 ? (
                      <select
                        value={warehouseId}
                        onChange={(event) => {
                          setWarehouseId(
                            event.target.value
                          );
                          setAdjustError("");
                        }}
                        className="mt-1.5 h-11 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[12px] text-[#33415A] outline-none focus:border-[#1769F5]"
                        aria-label="Select warehouse"
                      >
                        {warehouses.map(
                          (warehouse) => (
                            <option
                              key={warehouse.id}
                              value={warehouse.id}
                            >
                              {warehouse.name}
                            </option>
                          )
                        )}
                      </select>
                    ) : (
                      <p
                        role="status"
                        className="mt-1.5 text-[10px] font-medium text-[#D85A5A]"
                      >
                        No warehouse found. Create
                        one in Warehouse first.
                      </p>
                    )}

                    <div className="mt-5 grid grid-cols-3 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          setAdjustType(
                            "receive"
                          )
                        }
                        className={`
                          flex
                          h-10
                          items-center
                          justify-center
                          rounded-lg
                          text-[10px]
                          font-semibold
                          ${
                            adjustType ===
                            "receive"
                              ? "bg-[#EDF3FF] text-[#1769F5] ring-1 ring-[#B9D2F7]"
                              : "border border-[#E1E6ED] text-[#718096]"
                          }
                        `}
                      >
                        <Package
                          size={14}
                          className="mr-1.5"
                        />
                        Receive
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setAdjustType(
                            "remove"
                          )
                        }
                        className={`
                          flex
                          h-10
                          items-center
                          justify-center
                          rounded-lg
                          text-[10px]
                          font-semibold
                          ${
                            adjustType ===
                            "remove"
                              ? "bg-[#FFF0F0] text-[#D85A5A] ring-1 ring-[#EFCACA]"
                              : "border border-[#E1E6ED] text-[#718096]"
                          }
                        `}
                      >
                        <Minus
                          size={14}
                          className="mr-1.5"
                        />
                        Remove
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setAdjustType(
                            "add"
                          )
                        }
                        className={`
                          flex
                          h-10
                          items-center
                          justify-center
                          rounded-lg
                          text-[10px]
                          font-semibold
                          ${
                            adjustType ===
                            "add"
                              ? "bg-[#EAF8F0] text-[#249357] ring-1 ring-[#BDE5CE]"
                              : "border border-[#E1E6ED] text-[#718096]"
                          }
                        `}
                      >
                        <Plus
                          size={14}
                          className="mr-1.5"
                        />
                        Add
                      </button>

                    </div>

                  </>
                );
              })()}

            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setAdjustId(null)
                }
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updateStock}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw size={13} />
                Update Stock
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          MOVEMENT HISTORY (#57 + #60)
      ====================================================== */}

      {historyItem !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() => setHistoryItem(null)}
          />

          <div className="relative w-full max-w-[520px] rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E7F0FF] text-[#1769F5]">
                  <History size={18} />
                </div>

                <div className="min-w-0">

                  <h2 className="truncate text-[14px] font-bold text-[#263650]">
                    {historyItem.name}
                  </h2>

                  <p className="mt-1 font-mono text-[8px] text-[#8995A5]">
                    {historyItem.sku} · Stock {historyItem.stock} · Min {historyItem.minStock}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() => setHistoryItem(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="max-h-[50vh] overflow-y-auto p-5">

              {historyLoading && (
                <p className="py-8 text-center text-[11px] text-[#8995A5]">
                  Loading movements...
                </p>
              )}

              {!historyLoading && historyError && (
                <p role="alert" className="rounded-lg bg-[#FFF2F2] px-3 py-2.5 text-[9px] font-medium text-[#C43E3E]">
                  {historyError}
                </p>
              )}

              {!historyLoading && !historyError && historyRows.length === 0 && (
                <p className="py-8 text-center text-[11px] text-[#8995A5]">
                  No movements recorded for this product.
                </p>
              )}

              {!historyLoading && !historyError && historyRows.length > 0 && (
                <table className="min-w-full">

                  <thead>
                    <tr className="border-b border-[#EDF0F4] text-left text-[8px] uppercase tracking-wide text-[#98A3B2]">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3 text-right">Qty</th>
                      <th className="py-2">Reason</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historyRows.map((row) => (
                      <tr key={row.id} className="border-b border-[#F0F2F5] last:border-0 text-[10px] text-[#52627A]">
                        <td className="py-2.5 pr-3 whitespace-nowrap">{row.date || "—"}</td>
                        <td className="py-2.5 pr-3 font-semibold">{row.type}</td>
                        <td className={`py-2.5 pr-3 text-right font-bold ${row.quantity.startsWith("-") ? "text-[#D85A5A]" : "text-[#249357]"}`}>
                          {row.quantity}
                        </td>
                        <td className="py-2.5">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              )}

            </div>

            <div className="flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() => setHistoryItem(null)}
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {showSuccess && (
        <div className="fixed bottom-5 right-5 z-[120] flex items-center rounded-xl bg-[#173B7A] px-5 py-3 text-white shadow-xl">

          <CheckCircle2
            size={17}
            className="mr-2 text-[#69D393]"
          />

          <div>

            <p className="text-[10px] font-bold">
              Inventory updated
            </p>

            <p className="mt-0.5 text-[8px] text-[#C8D4E7]">
              Stock quantity has been updated.
            </p>

          </div>

        </div>
      )}

      </main>
    </AdminLayout>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  bgClass,
  fullOnMobile = false,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconClass: string;
  bgClass: string;
  fullOnMobile?: boolean;
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        border-[#E4E8EF]
        bg-white
        p-4
        shadow-sm
        ${
          fullOnMobile
            ? "col-span-2 lg:col-span-1"
            : ""
        }
      `}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-[9px] font-medium text-[#8995A5]">
            {title}
          </p>

          <p className="mt-2 text-[20px] font-bold text-[#293953]">
            {value}
          </p>

        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgClass} ${iconClass}`}
        >
          <Icon size={17} />
        </div>

      </div>

    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: InventoryItem["status"];
}) {
  const styles = {
    "In Stock":
      "bg-[#EAF8F0] text-[#249357]",
    "Low Stock":
      "bg-[#FFF5DF] text-[#C17B19]",
    "Out of Stock":
      "bg-[#FFF0F0] text-[#D85A5A]",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* ============================================================
   MOBILE INFO
============================================================ */

function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#F7F9FC] px-2.5 py-2">

      <p className="text-[7px] uppercase tracking-wide text-[#9AA5B4]">
        {label}
      </p>

      <p className="mt-1 truncate text-[9px] font-semibold text-[#52627A]">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyInventory({
  onClear,
}: {
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
        <Package size={25} />
      </div>

      <h3 className="mt-4 text-[13px] font-bold text-[#33415A]">
        No inventory found
      </h3>

      <p className="mt-1 text-[10px] leading-5 text-[#8995A5]">
        Try changing your search or filters.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-5 h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287] hover:bg-[#F7F9FC]"
      >
        Clear Filters
      </button>

    </div>
  );
}

/* ============================================================
   BOX ICON
============================================================ */

function BoxesIcon({
  size = 17,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
      <path d="m7.5 5.5 9 5" />
    </svg>
  );
}