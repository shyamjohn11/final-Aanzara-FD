"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { wholesalePricingApi } from "@/app/api/services";
import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  IndianRupee,
  Package,
  Percent,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type PricingStatus = "Active" | "Inactive";

type WholesalePrice = {
  id: number;
  serverId?: string;
  product: string;
  sku: string;
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  minQty: number;
  maxQty: number;
  discount: number;
  customerType: string;
  status: PricingStatus;
};

export default function WholesalePricingPage() {
  const router = useRouter();

  const [prices, setPrices] =
    useState<WholesalePrice[]>([]);

  /* =====================================================
     LOAD (#145 GET /api/admin/wholesale-pricing)
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await wholesalePricingApi.list();
        const payload = (response as any)?.data ?? response;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
        if (cancelled) return;
        if (raw.length === 0) {
          setPrices([]);
          return;
        }
        const mapped: WholesalePrice[] = raw.map((item: any, index: number) => {
          const retailPrice = Number(
            item?.retailPrice ?? item?.retail_price ?? item?.mrp ?? 0,
          );
          const wholesalePrice = Number(
            item?.wholesalePrice ?? item?.wholesale_price ?? item?.price ?? 0,
          );
          const discount = Number(
            item?.discount ??
              (retailPrice > 0
                ? ((retailPrice - wholesalePrice) / retailPrice) * 100
                : 0),
          );
          return {
            id: index + 1,
            serverId: String(item?.id ?? item?.pricingId ?? item?._id ?? ""),
            product: String(item?.product ?? item?.productName ?? "Product"),
            sku: String(item?.sku ?? item?.skuCode ?? ""),
            category: String(item?.category ?? item?.categoryName ?? ""),
            retailPrice,
            wholesalePrice,
            minQty: Number(item?.minQty ?? item?.min_qty ?? item?.minimumQty ?? 1),
            maxQty: Number(item?.maxQty ?? item?.max_qty ?? item?.maximumQty ?? 0),
            discount: Number.isFinite(discount) ? Number(discount.toFixed(2)) : 0,
            customerType: String(item?.customerType ?? item?.customer_type ?? "Business"),
            status: ((): PricingStatus =>
              String(item?.status ?? "Active") === "Inactive"
                ? "Inactive"
                : "Active")(),
          };
        });
        setPrices(mapped);
      } catch {
        if (!cancelled) setPrices([]);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | PricingStatus>("All");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    product: "",
    sku: "",
    category: "",
    retailPrice: "",
    wholesalePrice: "",
    minQty: "",
    maxQty: "",
    customerType: "Business",
    status: "Active" as PricingStatus,
  });

  type PricingFormErrors = Partial<
    Record<
      | "product"
      | "sku"
      | "category"
      | "retailPrice"
      | "wholesalePrice"
      | "minQty"
      | "maxQty"
      | "customerType"
      | "status",
      string
    >
  >;

  const [errors, setErrors] = useState<PricingFormErrors>({});

  const clearError = (field: keyof PricingFormErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validatePricing = () => {
    const next: PricingFormErrors = {};
    const product = form.product.trim();
    const sku = form.sku.trim().toUpperCase();
    const category = form.category.trim();
    const retailPrice = Number(form.retailPrice);
    const wholesalePrice = Number(form.wholesalePrice);
    const minQty = Number(form.minQty);
    const maxQty = form.maxQty.trim() ? Number(form.maxQty) : 0;

    if (!product) next.product = "Product name is required.";
    else if (product.length < 2 || product.length > 150)
      next.product = "Product name must be 2–150 characters.";

    if (!sku) next.sku = "SKU is required.";
    else if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(sku))
      next.sku = "SKU can contain uppercase letters/numbers separated by hyphens.";
    else if (sku.length < 3 || sku.length > 40)
      next.sku = "SKU must be 3–40 characters.";
    else if (
      prices.some(
        (item) => item.sku.toUpperCase() === sku && item.id !== editingId
      )
    )
      next.sku = "This SKU already has a pricing rule.";

    if (!category) next.category = "Category is required.";
    else if (category.length < 2 || category.length > 100)
      next.category = "Category must be 2–100 characters.";

    if (!form.retailPrice.trim()) next.retailPrice = "Retail price is required.";
    else if (!Number.isFinite(retailPrice) || retailPrice <= 0)
      next.retailPrice = "Retail price must be greater than 0.";
    else if (retailPrice > 100000000)
      next.retailPrice = "Retail price is too large.";

    if (!form.wholesalePrice.trim())
      next.wholesalePrice = "Wholesale price is required.";
    else if (!Number.isFinite(wholesalePrice) || wholesalePrice <= 0)
      next.wholesalePrice = "Wholesale price must be greater than 0.";
    else if (wholesalePrice > 100000000)
      next.wholesalePrice = "Wholesale price is too large.";
    else if (
      Number.isFinite(retailPrice) &&
      retailPrice > 0 &&
      wholesalePrice >= retailPrice
    )
      next.wholesalePrice =
        "Wholesale price must be lower than the retail price.";

    if (!form.minQty.trim()) next.minQty = "Minimum quantity is required.";
    else if (!Number.isInteger(minQty) || minQty < 1)
      next.minQty = "Minimum quantity must be a whole number greater than 0.";
    else if (minQty > 1000000000)
      next.minQty = "Minimum quantity is too large.";

    if (form.maxQty.trim()) {
      if (!Number.isInteger(maxQty) || maxQty < 1)
        next.maxQty = "Maximum quantity must be a whole number greater than 0.";
      else if (maxQty > 1000000000)
        next.maxQty = "Maximum quantity is too large.";
      else if (Number.isInteger(minQty) && maxQty < minQty)
        next.maxQty =
          "Maximum quantity must be greater than or equal to minimum quantity.";
    }

    if (
      form.customerType !== "Business" &&
      form.customerType !== "Wholesale" &&
      form.customerType !== "Distributor"
    )
      next.customerType = "Please select a valid customer type.";

    if (form.status !== "Active" && form.status !== "Inactive")
      next.status = "Please select a valid status.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredPrices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return prices.filter((item) => {
      const matchesSearch =
        !query ||
        item.product.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [prices, search, statusFilter]);

  /* =====================================================
     STATS
  ====================================================== */

  const activeCount = prices.filter(
    (item) => item.status === "Active"
  ).length;

  const inactiveCount = prices.filter(
    (item) => item.status === "Inactive"
  ).length;

  const averageDiscount =
    prices.length > 0
      ? prices.reduce(
          (sum, item) => sum + item.discount,
          0
        ) / prices.length
      : 0;

  /* =====================================================
     RESET FORM
  ====================================================== */

  const resetForm = () => {
    setForm({
      product: "",
      sku: "",
      category: "",
      retailPrice: "",
      wholesalePrice: "",
      minQty: "",
      maxQty: "",
      customerType: "Business",
      status: "Active",
    });

    setEditingId(null);
    setErrors({});
  };

  /* =====================================================
     CREATE
  ====================================================== */

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  /* =====================================================
     EDIT
  ====================================================== */

  const openEdit = (item: WholesalePrice) => {
    setEditingId(item.id);

    setForm({
      product: item.product,
      sku: item.sku,
      category: item.category,
      retailPrice: String(item.retailPrice),
      wholesalePrice: String(item.wholesalePrice),
      minQty: String(item.minQty),
      maxQty: String(item.maxQty),
      customerType: item.customerType,
      status: item.status,
    });

    setErrors({});
    setShowForm(true);
  };

  /* =====================================================
     SAVE
  ====================================================== */

  const savePricing = async () => {
    if (!validatePricing()) return;

    const retailPrice = Number(
      form.retailPrice
    );

    const wholesalePrice = Number(
      form.wholesalePrice
    );

    const minQty = Number(form.minQty);

    const maxQty =
      Number(form.maxQty) || 0;

    const discount =
      retailPrice > 0
        ? ((retailPrice - wholesalePrice) /
            retailPrice) *
          100
        : 0;

    const pricingData = {
      product: form.product.trim(),
      sku: form.sku
        .trim()
        .toUpperCase(),
      category: form.category.trim(),
      retailPrice,
      wholesalePrice,
      minQty,
      maxQty,
      discount: Number(
        discount.toFixed(2)
      ),
      customerType:
        form.customerType,
      status: form.status,
    };

    // Best-effort bulk save (#146 PUT /api/admin/wholesale-pricing),
    // then existing local logic unchanged.
    try {
      const changed =
        editingId !== null
          ? ((): Record<string, unknown>[] => {
              const existing = prices.find((item) => item.id === editingId);
              return [
                {
                  ...(existing?.serverId ? { id: existing.serverId } : {}),
                  ...pricingData,
                },
              ];
            })()
          : [pricingData];
      await wholesalePricingApi.saveBulk({ items: changed } as unknown as Record<string, unknown>);
    } catch {
      // Keep local behavior when the backend is unreachable.
    }

    if (editingId !== null) {
      setPrices((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...pricingData,
              }
            : item
        )
      );
    } else {
      setPrices((current) => [
        ...current,
        {
          id: Date.now(),
          ...pricingData,
        },
      ]);
    }

    setShowForm(false);
    resetForm();
    showSuccess();
  };

  /* =====================================================
     DELETE
  ====================================================== */

  const deletePricing = () => {
    if (deleteId === null) return;

    setPrices((current) =>
      current.filter(
        (item) => item.id !== deleteId
      )
    );

    setDeleteId(null);
    showSuccess();
  };

  /* =====================================================
     SUCCESS
  ====================================================== */

  const showSuccess = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  /* =====================================================
     CURRENCY
  ====================================================== */

  const money = (value: number) =>
    `₹${value.toLocaleString("en-IN")}`;

  return (
    <AdminLayout>
      <main className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

      {/* =================================================
          HEADER
      ================================================== */}

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
            Wholesale Pricing
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage business and bulk pricing
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Add Wholesale Price
          </span>

          <span className="sm:hidden">
            Add
          </span>
        </button>

      </header>

      {/* =================================================
          CONTENT
      ================================================== */}

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
            Wholesale Pricing
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            title="Total Pricing"
            value={prices.length}
            icon={IndianRupee}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#3260B4]"
          />

          <StatCard
            title="Active Pricing"
            value={activeCount}
            icon={CheckCircle2}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Inactive"
            value={inactiveCount}
            icon={X}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

          <StatCard
            title="Avg. Discount"
            value={`${averageDiscount.toFixed(
              1
            )}%`}
            icon={Percent}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

        </section>

        {/* =================================================
            SEARCH / FILTER
        ================================================== */}

        <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row md:items-center">

            <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 md:max-w-[480px]">

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
                placeholder="Search product, SKU or category..."
                className="w-full bg-transparent px-2.5 text-[11px] outline-none placeholder:text-[#A0AAB8]"
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

            <div className="flex gap-1.5 md:ml-auto">

              {(
                [
                  "All",
                  "Active",
                  "Inactive",
                ] as const
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStatusFilter(status)
                  }
                  className={`
                    rounded-lg
                    px-3
                    py-2
                    text-[9px]
                    font-semibold
                    ${
                      statusFilter === status
                        ? "bg-[#173B7A] text-white"
                        : "bg-[#F5F7FA] text-[#68778B] hover:bg-[#EDEFF3]"
                    }
                  `}
                >
                  {status}
                </button>
              ))}

            </div>

          </div>

        </section>

        {/* =================================================
            TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>
              <h2 className="text-[13px] font-bold text-[#263650]">
                Wholesale Price List
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredPrices.length} pricing rules found
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              className="text-[9px] font-semibold text-[#1769F5] hover:underline"
            >
              Clear Filters
            </button>

          </div>

          {filteredPrices.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
                <IndianRupee size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No pricing rules found
              </h3>

              <p className="mt-1 text-[10px] text-[#8995A5]">
                Try changing your search or filter.
              </p>

            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

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
                        Retail Price
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Wholesale
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Discount
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Quantity
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredPrices.map(
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

                                <p className="max-w-[190px] truncate text-[11px] font-bold text-[#33415A]">
                                  {item.product}
                                </p>

                                <p className="mt-1 text-[8px] text-[#8995A5]">
                                  {item.category}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* SKU */}

                          <td className="px-5 py-4">

                            <span className="rounded-md bg-[#F0F4FA] px-2 py-1.5 font-mono text-[8px] font-semibold text-[#31558E]">
                              {item.sku}
                            </span>

                          </td>

                          {/* RETAIL */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] text-[#7C8797]">
                              {money(
                                item.retailPrice
                              )}
                            </span>

                          </td>

                          {/* WHOLESALE */}

                          <td className="px-5 py-4">

                            <span className="text-[12px] font-bold text-[#263650]">
                              {money(
                                item.wholesalePrice
                              )}
                            </span>

                          </td>

                          {/* DISCOUNT */}

                          <td className="px-5 py-4">

                            <span className="rounded-full bg-[#EAF8F0] px-2.5 py-1 text-[8px] font-semibold text-[#249357]">
                              {item.discount.toFixed(
                                2
                              )}
                              % OFF
                            </span>

                          </td>

                          {/* QUANTITY */}

                          <td className="px-5 py-4">

                            <p className="text-[9px] font-semibold text-[#52627A]">
                              {item.minQty}
                              {" - "}
                              {item.maxQty ||
                                "∞"}
                            </p>

                            <p className="mt-1 text-[8px] text-[#8995A5]">
                              units
                            </p>

                          </td>

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">

                            <span className="inline-flex items-center gap-1 rounded-md bg-[#F3F0FF] px-2 py-1.5 text-[8px] font-semibold text-[#7053A8]">
                              <Users size={11} />
                              {item.customerType}
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

                            <div className="flex justify-end gap-1.5">

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    item
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E5EC] text-[#1769F5] hover:bg-[#EDF3FF]"
                              >
                                <Pencil
                                  size={13}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteId(
                                    item.id
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0D4D4] text-[#D85A5A] hover:bg-[#FFF0F0]"
                              >
                                <Trash2
                                  size={13}
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

              {/* MOBILE */}

              <div className="divide-y divide-[#EDF0F4] md:hidden">

                {filteredPrices.map(
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
                                {item.product}
                              </p>

                              <p className="mt-1 text-[8px] text-[#8995A5]">
                                {item.category}
                              </p>

                              <span className="mt-2 inline-block rounded-md bg-[#F0F4FA] px-2 py-1 font-mono text-[8px] font-semibold text-[#31558E]">
                                {item.sku}
                              </span>

                            </div>

                            <StatusBadge
                              status={
                                item.status
                              }
                            />

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <Info
                              label="Retail Price"
                              value={money(
                                item.retailPrice
                              )}
                            />

                            <Info
                              label="Wholesale Price"
                              value={money(
                                item.wholesalePrice
                              )}
                            />

                            <Info
                              label="Discount"
                              value={`${item.discount.toFixed(
                                2
                              )}%`}
                            />

                            <Info
                              label="Quantity"
                              value={`${item.minQty} - ${
                                item.maxQty ||
                                "∞"
                              }`}
                            />

                            <Info
                              label="Customer"
                              value={
                                item.customerType
                              }
                            />

                            <Info
                              label="Category"
                              value={
                                item.category
                              }
                            />

                          </div>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  item
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[9px] font-semibold text-[#1769F5]"
                            >
                              <Pencil
                                size={12}
                              />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteId(
                                  item.id
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#F0D4D4] px-3 text-[9px] font-semibold text-[#D85A5A]"
                            >
                              <Trash2
                                size={12}
                              />
                              Delete
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
                    {filteredPrices.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#4D5C72]">
                    {prices.length}
                  </span>
                </p>

                <div className="flex items-center gap-1">

                  <button
                    type="button"
                    disabled
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E1E6ED] text-[#B3BBC6]"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-[#173B7A] px-2 text-[9px] font-semibold text-white">
                    1
                  </span>

                  <button
                    type="button"
                    disabled
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E1E6ED] text-[#B3BBC6]"
                  >
                    <ChevronRight size={14} />
                  </button>

                </div>

              </div>

            </>
          )}

        </section>

      </div>

      {/* =================================================
          CREATE / EDIT MODAL
      ================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() => {
              setShowForm(false);
              setErrors({});
            }}
          />

          <div className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Wholesale Pricing"
                    : "Add Wholesale Pricing"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Configure bulk pricing for business customers
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            {/* FORM */}

            <div className="space-y-4 p-5">

              {Object.keys(errors).length > 0 && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#F0D4D4] bg-[#FFF7F7] px-4 py-3"
                >
                  <p className="text-[9px] font-bold text-[#B84A4A]">
                    Please fix the highlighted fields before saving.
                  </p>
                </div>
              )}

              <FormInput
                label="Product Name"
                placeholder="Enter product name"
                value={form.product}
                onChange={(value) => {
                    setForm({
                      ...form,
                      product: value,
                    });
                    clearError("product");
                  }}
              
                  maxLength={150}
                  error={errors.product}
                />

              <div className="grid grid-cols-2 gap-3">

                <FormInput
                  label="SKU"
                  placeholder="Example: PROD-001"
                  value={form.sku}
                  onChange={(value) => {
                    setForm({
                      ...form,
                      sku: value,
                    });
                    clearError("sku");
                  }}
                
                  maxLength={40}
                  error={errors.sku}
                />

                <FormInput
                  label="Category"
                  placeholder="Example: Staples"
                  value={form.category}
                  onChange={(value) => {
                    setForm({
                      ...form,
                      category: value,
                    });
                    clearError("category");
                  }}
                
                  maxLength={100}
                  error={errors.category}
                />

              </div>

              <div className="grid grid-cols-2 gap-3">

                <FormInput
                  label="Retail Price"
                  placeholder="Example: 500"
                  value={form.retailPrice}
                  type="number"
                  onChange={(value) => {
                    setForm({
                      ...form,
                      retailPrice: value,
                    });
                    clearError("retailPrice");
                  }}
                
                  min="0"
                  step="0.01"
                  error={errors.retailPrice}
                />

                <FormInput
                  label="Wholesale Price"
                  placeholder="Example: 450"
                  value={
                    form.wholesalePrice
                  }
                  type="number"
                  onChange={(value) => {
                    setForm({
                      ...form,
                      wholesalePrice: value,
                    });
                    clearError("wholesalePrice");
                  }}
                
                  min="0"
                  step="0.01"
                  error={errors.wholesalePrice}
                />

              </div>

              <div className="grid grid-cols-2 gap-3">

                <FormInput
                  label="Minimum Quantity"
                  placeholder="Example: 10"
                  value={form.minQty}
                  type="number"
                  onChange={(value) => {
                    setForm({
                      ...form,
                      minQty: value,
                    });
                    clearError("minQty");
                  }}
                
                  min="1"
                  step="1"
                  error={errors.minQty}
                />

                <FormInput
                  label="Maximum Quantity"
                  placeholder="Example: 100"
                  value={form.maxQty}
                  type="number"
                  onChange={(value) => {
                    setForm({
                      ...form,
                      maxQty: value,
                    });
                    clearError("maxQty");
                  }}
                
                  min="1"
                  step="1"
                  error={errors.maxQty}
                />

              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Customer Type
                  </label>

                  <select
                    value={
                      form.customerType
                    }
                    onChange={(event) => {
                      setForm({
                        ...form,
                        customerType: event.target.value,
                      });
                      clearError("customerType");
                    }}
                    aria-invalid={Boolean(errors.customerType)}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                      errors.customerType
                        ? "border-[#EF4444]"
                        : "border-[#DCE2EA]"
                    }`}
                  >
                    <option value="Business">
                      Business
                    </option>

                    <option value="Wholesale">
                      Wholesale
                    </option>

                    <option value="Distributor">
                      Distributor
                    </option>

                  </select>

                  {errors.customerType && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.customerType}
                    </p>
                  )}

                </div>

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) => {
                      setForm({
                        ...form,
                        status: event.target.value as PricingStatus,
                      });
                      clearError("status");
                    }}
                    aria-invalid={Boolean(errors.status)}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                      errors.status
                        ? "border-[#EF4444]"
                        : "border-[#DCE2EA]"
                    }`}
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>

                  {errors.status && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.status}
                    </p>
                  )}

                </div>

              </div>

              {/* PREVIEW */}

              <div className="rounded-xl border border-[#D7E5FF] bg-[#F2F7FF] p-4">

                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#8995A5]">
                  Pricing Preview
                </p>

                <div className="mt-3 flex items-center">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#1769F5] shadow-sm">
                    <IndianRupee size={18} />
                  </div>

                  <div className="ml-3 min-w-0">

                    <p className="truncate text-[11px] font-bold text-[#33415A]">
                      {form.product ||
                        "Product Name"}
                    </p>

                    <p className="mt-1 font-mono text-[8px] text-[#5271A4]">
                      {form.sku ||
                        "PRODUCT-SKU"}
                    </p>

                  </div>

                  <div className="ml-auto text-right">

                    <p className="text-[13px] font-bold text-[#1769F5]">
                      {form.wholesalePrice
                        ? money(
                            Number(
                              form.wholesalePrice
                            )
                          )
                        : "--"}
                    </p>

                    {form.retailPrice &&
                      form.wholesalePrice && (
                        <p className="mt-1 text-[8px] font-semibold text-[#249357]">
                          {(
                            ((Number(
                              form.retailPrice
                            ) -
                              Number(
                                form.wholesalePrice
                              )) /
                              Number(
                                form.retailPrice
                              )) *
                            100
                          ).toFixed(2)}
                          % OFF
                        </p>
                      )}

                  </div>

                </div>

                {form.minQty && (
                  <div className="mt-3 rounded-lg bg-white px-3 py-2">

                    <p className="text-[8px] text-[#8995A5]">
                      Quantity Range
                    </p>

                    <p className="mt-1 text-[9px] font-semibold text-[#52627A]">
                      {form.minQty} -{" "}
                      {form.maxQty ||
                        "Unlimited"}{" "}
                      units
                    </p>

                  </div>
                )}

              </div>

            </div>

            {/* FOOTER */}

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                }}
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={savePricing}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <CheckCircle2 size={13} />

                {editingId !== null
                  ? "Update Pricing"
                  : "Save Pricing"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          DELETE MODAL
      ================================================== */}

      {deleteId !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() =>
              setDeleteId(null)
            }
          />

          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D85A5A]">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-4 text-[14px] font-bold text-[#263650]">
              Delete Pricing Rule?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This wholesale pricing rule
              will be permanently removed.
            </p>

            <div className="mt-5 flex justify-end gap-2">

              <button
                type="button"
                onClick={() =>
                  setDeleteId(null)
                }
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deletePricing}
                className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D]"
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          SUCCESS TOAST
      ================================================== */}

      {saved && (
        <div className="fixed bottom-5 right-5 z-[150] flex items-center rounded-xl bg-[#173B7A] px-5 py-3 text-white shadow-xl">

          <CheckCircle2
            size={17}
            className="mr-2 text-[#69D393]"
          />

          <div>

            <p className="text-[10px] font-bold">
              Done
            </p>

            <p className="mt-0.5 text-[8px] text-[#C8D4E7]">
              Wholesale pricing updated successfully.
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
  bg,
  iconColor,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  bg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

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
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${iconColor}`}
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
  status: PricingStatus;
}) {
  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-2.5
        py-1
        text-[8px]
        font-semibold
        ${
          status === "Active"
            ? "bg-[#EAF8F0] text-[#249357]"
            : "bg-[#FFF0F0] text-[#D85A5A]"
        }
      `}
    >
      {status}
    </span>
  );
}

/* ============================================================
   FORM INPUT
============================================================ */

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  maxLength,
  min,
  step,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  maxLength?: number;
  min?: string;
  step?: string;
}) {
  return (
    <div>

      <label className="text-[9px] font-semibold text-[#52627A]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        step={step}
        aria-invalid={Boolean(error)}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10 ${
          error
            ? "border-[#EF4444]"
            : "border-[#DCE2EA]"
        }`}
      />

      {error && (
        <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
          {error}
        </p>
      )}

    </div>
  );
}

/* ============================================================
   MOBILE INFO
============================================================ */

function Info({
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