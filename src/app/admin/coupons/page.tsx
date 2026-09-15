"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { couponsApi } from "@/app/api/services";
import {
  ArrowLeft,
  Plus,
  Search,
  Ticket,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  CalendarDays,
  IndianRupee,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type CouponStatus = "Active" | "Scheduled" | "Expired";

type Coupon = {
  id: number;
  serverId?: string;
  name: string;
  code: string;
  type: "Percentage" | "Flat";
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageLimit: number;
  used: number;
  startDate: string;
  endDate: string;
  status: CouponStatus;
};

/* API-first: coupons load from backend; empty until fetch resolves. */

export default function CouponsPage() {
  const router = useRouter();

  const [coupons, setCoupons] =
    useState<Coupon[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | CouponStatus>("All");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "Percentage" as
      | "Percentage"
      | "Flat",
    value: "",
    minOrder: "",
    maxDiscount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
  });

  type FormErrors = {
    name?: string;
    code?: string;
    value?: string;
    minOrder?: string;
    maxDiscount?: string;
    usageLimit?: string;
    startDate?: string;
    endDate?: string;
  };

  const [formErrors, setFormErrors] =
    useState<FormErrors>({});

  const [formError, setFormError] =
    useState("");

  /* =====================================================
     LOAD COUPONS (#85 GET /api/admin/coupons; API-first)
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadCoupons = async () => {
      try {
        const response = await couponsApi.list(1, 100);
        const payload: any = (response as any)?.data ?? response;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (cancelled || rawItems.length === 0) return;

        const mapped: Coupon[] = rawItems.map((raw: any, index: number) => ({
          id: index + 1,
          serverId: String(raw.couponId ?? raw.id ?? raw._id ?? ""),
          name: String(raw.name ?? raw.title ?? "Untitled coupon"),
          code: String(raw.code ?? raw.couponCode ?? ""),
          type: raw.type === "Flat" ? "Flat" : "Percentage",
          value: Number(raw.value ?? raw.discount ?? raw.discountValue ?? 0),
          minOrder: Number(raw.minOrder ?? raw.minimumOrder ?? raw.minOrderValue ?? 0),
          maxDiscount: Number(raw.maxDiscount ?? raw.maxDiscountAmount ?? raw.cap ?? 0),
          usageLimit: Number(raw.usageLimit ?? raw.maxUsage ?? raw.limit ?? 0),
          used: Number(raw.used ?? raw.usedCount ?? raw.redemptions ?? 0),
          startDate: String(raw.startDate ?? raw.start ?? raw.validFrom ?? "").slice(0, 10),
          endDate: String(raw.endDate ?? raw.end ?? raw.validTo ?? "").slice(0, 10),
          status: (["Active", "Scheduled", "Expired"] as CouponStatus[]).includes(raw.status as CouponStatus)
            ? (raw.status as CouponStatus)
            : "Active",
        }));

        if (mapped.length > 0) setCoupons(mapped);
      } catch (error) {
        console.error("Unable to load coupons:", error);
      }
    };

    loadCoupons();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredCoupons = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return coupons.filter((coupon) => {
      const matchesSearch =
        !query ||
        coupon.name
          .toLowerCase()
          .includes(query) ||
        coupon.code
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        coupon.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    coupons,
    search,
    statusFilter,
  ]);

  /* =====================================================
     STATS
  ====================================================== */

  const activeCount = coupons.filter(
    (coupon) =>
      coupon.status === "Active"
  ).length;

  const scheduledCount = coupons.filter(
    (coupon) =>
      coupon.status === "Scheduled"
  ).length;

  const expiredCount = coupons.filter(
    (coupon) =>
      coupon.status === "Expired"
  ).length;

  const totalUsed = coupons.reduce(
    (total, coupon) =>
      total + coupon.used,
    0
  );

  /* =====================================================
     RESET FORM
  ====================================================== */

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      type: "Percentage",
      value: "",
      minOrder: "",
      maxDiscount: "",
      usageLimit: "",
      startDate: "",
      endDate: "",
    });

    setEditingId(null);
    setFormErrors({});
    setFormError("");
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

  const openEdit = (
    coupon: Coupon
  ) => {
    setEditingId(coupon.id);

    setForm({
      name: coupon.name,
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrder: String(
        coupon.minOrder
      ),
      maxDiscount: String(
        coupon.maxDiscount
      ),
      usageLimit: String(
        coupon.usageLimit
      ),
      startDate: coupon.startDate,
      endDate: coupon.endDate,
    });

    setShowForm(true);
  };

  /* =====================================================
     VALIDATION
  ====================================================== */

  const validateForm = () => {
    const errors: FormErrors = {};

    const cleanName = form.name.trim();
    const cleanCode = form.code.trim().toUpperCase();

    const value = Number(form.value);
    const minOrder = Number(form.minOrder);
    const maxDiscount = Number(form.maxDiscount);
    const usageLimit = Number(form.usageLimit);

    /* COUPON NAME */
    if (!cleanName) {
      errors.name = "Coupon name is required.";
    } else if (cleanName.length < 3) {
      errors.name =
        "Coupon name must be at least 3 characters.";
    } else if (cleanName.length > 100) {
      errors.name =
        "Coupon name cannot exceed 100 characters.";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9 &.'()\-]*$/.test(cleanName)) {
      errors.name =
        "Use only letters, numbers, spaces and basic punctuation.";
    }

    /* COUPON CODE */
    if (!cleanCode) {
      errors.code = "Coupon code is required.";
    } else if (cleanCode.length < 4) {
      errors.code =
        "Coupon code must be at least 4 characters.";
    } else if (cleanCode.length > 30) {
      errors.code =
        "Coupon code cannot exceed 30 characters.";
    } else if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      errors.code =
        "Use only uppercase letters, numbers, hyphens or underscores.";
    } else {
      const duplicate = coupons.some(
        (coupon) =>
          coupon.code.trim().toUpperCase() === cleanCode &&
          coupon.id !== editingId
      );

      if (duplicate) {
        errors.code =
          "A coupon with this code already exists.";
      }
    }

    /* DISCOUNT VALUE */
    if (!form.value.trim()) {
      errors.value = "Discount value is required.";
    } else if (!Number.isFinite(value)) {
      errors.value = "Enter a valid discount value.";
    } else if (value <= 0) {
      errors.value =
        "Discount value must be greater than 0.";
    } else if (
      form.type === "Percentage" &&
      value > 100
    ) {
      errors.value =
        "Percentage discount cannot exceed 100%.";
    } else if (
      form.type === "Flat" &&
      value > 10000000
    ) {
      errors.value =
        "Flat discount cannot exceed ₹1,00,00,000.";
    } else if (
      form.type === "Percentage" &&
      !/^\d+(\.\d{1,2})?$/.test(form.value.trim())
    ) {
      errors.value =
        "Percentage can contain a maximum of 2 decimal places.";
    } else if (
      form.type === "Flat" &&
      !/^\d+(\.\d{1,2})?$/.test(form.value.trim())
    ) {
      errors.value =
        "Discount amount can contain a maximum of 2 decimal places.";
    }

    /* MINIMUM ORDER */
    if (!form.minOrder.trim()) {
      errors.minOrder = "Minimum order is required.";
    } else if (!Number.isFinite(minOrder)) {
      errors.minOrder =
        "Enter a valid minimum order amount.";
    } else if (minOrder < 0) {
      errors.minOrder =
        "Minimum order cannot be negative.";
    } else if (minOrder > 100000000) {
      errors.minOrder =
        "Minimum order cannot exceed ₹10,00,00,000.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.minOrder.trim())) {
      errors.minOrder =
        "Minimum order can contain a maximum of 2 decimal places.";
    }

    /* MAXIMUM DISCOUNT */
    if (form.maxDiscount.trim()) {
      if (!Number.isFinite(maxDiscount)) {
        errors.maxDiscount =
          "Enter a valid maximum discount.";
      } else if (maxDiscount < 0) {
        errors.maxDiscount =
          "Maximum discount cannot be negative.";
      } else if (maxDiscount > 10000000) {
        errors.maxDiscount =
          "Maximum discount cannot exceed ₹1,00,00,000.";
      } else if (
        !/^\d+(\.\d{1,2})?$/.test(
          form.maxDiscount.trim()
        )
      ) {
        errors.maxDiscount =
          "Maximum discount can contain a maximum of 2 decimal places.";
      }
    }

    /* PERCENTAGE MAX DISCOUNT */
    if (
      form.type === "Percentage" &&
      form.maxDiscount.trim() &&
      Number.isFinite(maxDiscount) &&
      maxDiscount <= 0
    ) {
      errors.maxDiscount =
        "Maximum discount must be greater than 0.";
    }

    /* USAGE LIMIT */
    if (form.usageLimit.trim()) {
      if (!Number.isFinite(usageLimit)) {
        errors.usageLimit =
          "Enter a valid usage limit.";
      } else if (!Number.isInteger(usageLimit)) {
        errors.usageLimit =
          "Usage limit must be a whole number.";
      } else if (usageLimit < 0) {
        errors.usageLimit =
          "Usage limit cannot be negative.";
      } else if (usageLimit > 100000000) {
        errors.usageLimit =
          "Usage limit cannot exceed 100,000,000.";
      }
    }

    /* START DATE */
    if (!form.startDate) {
      errors.startDate = "Start date is required.";
    }

    /* END DATE */
    if (!form.endDate) {
      errors.endDate = "End date is required.";
    }

    if (form.startDate && form.endDate) {
      const startDate = new Date(
        `${form.startDate}T00:00:00`
      );
      const endDate = new Date(
        `${form.endDate}T00:00:00`
      );

      if (Number.isNaN(startDate.getTime())) {
        errors.startDate = "Enter a valid start date.";
      }

      if (Number.isNaN(endDate.getTime())) {
        errors.endDate = "Enter a valid end date.";
      }

      if (
        !Number.isNaN(startDate.getTime()) &&
        !Number.isNaN(endDate.getTime()) &&
        endDate < startDate
      ) {
        errors.endDate =
          "End date cannot be before the start date.";
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError(
        "Please correct the highlighted fields before saving."
      );
      return false;
    }

    setFormError("");
    return true;
  };

  /* =====================================================
     SAVE
  ====================================================== */

  const saveCoupon = async () => {
    if (!validateForm()) {
      return;
    }

    const value = Number(form.value);
    const minOrder = Number(form.minOrder);
    const maxDiscount =
      form.maxDiscount.trim()
        ? Number(form.maxDiscount)
        : 0;
    const usageLimit =
      form.usageLimit.trim()
        ? Number(form.usageLimit)
        : 0;

    const today = new Date()
      .toISOString()
      .split("T")[0];

    let status: CouponStatus;

    if (form.startDate > today) {
      status = "Scheduled";
    } else if (form.endDate < today) {
      status = "Expired";
    } else {
      status = "Active";
    }

    const couponData = {
      name: form.name.trim(),
      code: form.code
        .trim()
        .toUpperCase(),
      type: form.type,
      value,
      minOrder,
      maxDiscount,
      usageLimit,
      startDate: form.startDate,
      endDate: form.endDate,
      status,
    };

    const payload: Record<string, unknown> = { ...couponData };

    if (editingId !== null) {
      const editingRow = coupons.find(
        (coupon) => coupon.id === editingId
      );

      if (editingRow?.serverId) {
        try {
          await couponsApi.update(editingRow.serverId, payload);
        } catch (error) {
          console.error("Coupon update failed:", error);
        }
      }
    } else {
      try {
        await couponsApi.create(payload);
      } catch (error) {
        console.error("Coupon create failed:", error);
      }
    }

    if (editingId !== null) {
      setCoupons((current) =>
        current.map((coupon) =>
          coupon.id === editingId
            ? {
                ...coupon,
                ...couponData,
              }
            : coupon
        )
      );
    } else {
      setCoupons((current) => [
        ...current,
        {
          id: Date.now(),
          used: 0,
          ...couponData,
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

  const deleteCoupon = async () => {
    if (deleteId === null) {
      return;
    }

    const deletingRow = coupons.find(
      (coupon) => coupon.id === deleteId
    );

    if (deletingRow?.serverId) {
      try {
        await couponsApi.remove(deletingRow.serverId);
      } catch (error) {
        console.error("Coupon delete failed:", error);
      }
    }

    setCoupons((current) =>
      current.filter(
        (coupon) =>
          coupon.id !== deleteId
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
     DATE
  ====================================================== */

  const formatDate = (
    date: string
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
            Coupons
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage coupon codes and discount campaigns
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Create Coupon
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
            Coupons
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            title="Total Coupons"
            value={coupons.length}
            icon={Ticket}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#3260B4]"
          />

          <StatCard
            title="Active"
            value={activeCount}
            icon={CheckCircle2}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Scheduled"
            value={scheduledCount}
            icon={CalendarDays}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

          <StatCard
            title="Total Used"
            value={totalUsed}
            icon={Users}
            bg="bg-[#F1ECFF]"
            iconColor="text-[#7453B6]"
          />

        </section>

        {/* =================================================
            FILTERS
        ================================================== */}

        <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row md:items-center">

            <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 md:max-w-[440px]">

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
                placeholder="Search coupon name or code..."
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

            <div className="flex flex-wrap gap-1.5 md:ml-auto">

              {(
                [
                  "All",
                  "Active",
                  "Scheduled",
                  "Expired",
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
                      statusFilter ===
                      status
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
            COUPON TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>
              <h2 className="text-[13px] font-bold text-[#263650]">
                All Coupons
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredCoupons.length} coupons found
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

          {filteredCoupons.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
                <Ticket size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No coupons found
              </h3>

              <p className="mt-1 text-[10px] text-[#8995A5]">
                Try changing your search or filter.
              </p>

            </div>
          ) : (
            <>
              {/* DESKTOP */}

              <div className="hidden overflow-x-auto md:block">

                <table className="min-w-full">

                  <thead>

                    <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Coupon
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Code
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Discount
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Minimum Order
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Usage
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Validity
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

                    {filteredCoupons.map(
                      (coupon) => (
                        <tr
                          key={coupon.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* COUPON */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                                <Ticket size={18} />
                              </div>

                              <div>

                                <p className="text-[11px] font-bold text-[#33415A]">
                                  {coupon.name}
                                </p>

                                <p className="mt-1 text-[9px] text-[#8995A5]">
                                  Coupon
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CODE */}

                          <td className="px-5 py-4">

                            <span className="rounded-md bg-[#F0F4FA] px-2.5 py-1.5 font-mono text-[9px] font-semibold text-[#31558E]">
                              {coupon.code}
                            </span>

                          </td>

                          {/* DISCOUNT */}

                          <td className="px-5 py-4">

                            <p className="text-[12px] font-bold text-[#293953]">

                              {coupon.type ===
                              "Percentage"
                                ? `${coupon.value}%`
                                : `₹${coupon.value.toLocaleString(
                                    "en-IN"
                                  )}`}

                            </p>

                            <p className="mt-1 text-[8px] text-[#8995A5]">
                              {coupon.type}
                            </p>

                            {coupon.maxDiscount >
                              0 && (
                              <p className="mt-1 text-[8px] text-[#66748B]">
                                Max ₹
                                {coupon.maxDiscount.toLocaleString(
                                  "en-IN"
                                )}
                              </p>
                            )}

                          </td>

                          {/* MINIMUM */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] text-[#52627A]">
                              ₹
                              {coupon.minOrder.toLocaleString(
                                "en-IN"
                              )}
                            </span>

                          </td>

                          {/* USAGE */}

                          <td className="px-5 py-4">

                            <p className="text-[10px] font-semibold text-[#52627A]">
                              {coupon.used}{" "}
                              /{" "}
                              {coupon.usageLimit ||
                                "∞"}
                            </p>

                            {coupon.usageLimit >
                              0 && (
                              <div className="mt-2 h-1.5 w-[75px] overflow-hidden rounded-full bg-[#E9EDF2]">
                                <div
                                  className="h-full rounded-full bg-[#1769F5]"
                                  style={{
                                    width: `${Math.min(
                                      (coupon.used /
                                        coupon.usageLimit) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            )}

                          </td>

                          {/* VALIDITY */}

                          <td className="px-5 py-4">

                            <p className="text-[9px] text-[#52627A]">
                              {formatDate(
                                coupon.startDate
                              )}
                            </p>

                            <p className="mt-1 text-[9px] text-[#8995A5]">
                              to{" "}
                              {formatDate(
                                coupon.endDate
                              )}
                            </p>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                coupon.status
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
                                    coupon
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
                                    coupon.id
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

                {filteredCoupons.map(
                  (coupon) => (
                    <div
                      key={coupon.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                          <Ticket size={18} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-[11px] font-bold text-[#33415A]">
                                {coupon.name}
                              </p>

                              <div className="mt-1">

                                <span className="rounded-md bg-[#F0F4FA] px-2 py-1 font-mono text-[8px] font-semibold text-[#31558E]">
                                  {coupon.code}
                                </span>

                              </div>

                            </div>

                            <StatusBadge
                              status={
                                coupon.status
                              }
                            />

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <Info
                              label="Discount"
                              value={
                                coupon.type ===
                                "Percentage"
                                  ? `${coupon.value}%`
                                  : `₹${coupon.value.toLocaleString(
                                      "en-IN"
                                    )}`
                              }
                            />

                            <Info
                              label="Minimum Order"
                              value={`₹${coupon.minOrder.toLocaleString(
                                "en-IN"
                              )}`}
                            />

                            <Info
                              label="Usage"
                              value={`${coupon.used} / ${
                                coupon.usageLimit ||
                                "∞"
                              }`}
                            />

                            <Info
                              label="Max Discount"
                              value={
                                coupon.maxDiscount
                                  ? `₹${coupon.maxDiscount.toLocaleString(
                                      "en-IN"
                                    )}`
                                  : "No limit"
                              }
                            />

                            <Info
                              label="Start"
                              value={formatDate(
                                coupon.startDate
                              )}
                            />

                            <Info
                              label="End"
                              value={formatDate(
                                coupon.endDate
                              )}
                            />

                          </div>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  coupon
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
                                  coupon.id
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
                    {filteredCoupons.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#4D5C72]">
                    {coupons.length}
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

      {/* =================================================
          CREATE / EDIT MODAL
      ================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          />

          <div className="relative max-h-[90vh] w-full max-w-[540px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Coupon"
                    : "Create New Coupon"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Configure coupon discount and usage rules
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

              <FormInput
                label="Coupon Name"
                placeholder="Enter coupon name"
                value={form.name}
                error={formErrors.name}
                onChange={(value) => {
                  setForm({
                    ...form,
                    name: value.slice(0, 100),
                  });
                  setFormErrors((current) => ({
                    ...current,
                    name: undefined,
                  }));
                  setFormError("");
                }}
              />

              <FormInput
                label="Coupon Code"
                placeholder="Example: SAVE20"
                value={form.code}
                error={formErrors.code}
                onChange={(value) => {
                  setForm({
                    ...form,
                    code: value
                      .toUpperCase()
                      .replace(/[^A-Z0-9_-]/g, "")
                      .slice(0, 30),
                  });
                  setFormErrors((current) => ({
                    ...current,
                    code: undefined,
                  }));
                  setFormError("");
                }}
              />

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Discount Type
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type: event.target
                          .value as
                          | "Percentage"
                          | "Flat",
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                  >

                    <option value="Percentage">
                      Percentage
                    </option>

                    <option value="Flat">
                      Flat Amount
                    </option>

                  </select>

                </div>

                <FormInput
                  label={
                    form.type ===
                    "Percentage"
                      ? "Discount (%)"
                      : "Discount Amount"
                  }
                  placeholder={
                    form.type ===
                    "Percentage"
                      ? "10"
                      : "500"
                  }
                  value={form.value}
                  type="number"
                  error={formErrors.value}
                  onChange={(value) => {
                    setForm({
                      ...form,
                      value: value
                        .replace(/[^0-9.]/g, "")
                        .replace(/(\..*)\./g, "$1")
                        .replace(/^(\d+\.\d{0,2}).*$/, "$1"),
                    });
                    setFormErrors((current) => ({
                      ...current,
                      value: undefined,
                    }));
                    setFormError("");
                  }}
                />

              </div>

              <div className="grid grid-cols-2 gap-3">

                <FormInput
                  label="Minimum Order"
                  placeholder="Example: 999"
                  value={form.minOrder}
                  type="number"
                  error={formErrors.minOrder}
                  onChange={(value) => {
                    setForm({
                      ...form,
                      minOrder: value
                        .replace(/[^0-9.]/g, "")
                        .replace(/(\..*)\./g, "$1")
                        .replace(/^(\d+\.\d{0,2}).*$/, "$1"),
                    });
                    setFormErrors((current) => ({
                      ...current,
                      minOrder: undefined,
                    }));
                    setFormError("");
                  }}
                />

                <FormInput
                  label="Maximum Discount"
                  placeholder="Example: 500"
                  value={
                    form.maxDiscount
                  }
                  type="number"
                  error={formErrors.maxDiscount}
                  onChange={(value) => {
                    setForm({
                      ...form,
                      maxDiscount: value
                        .replace(/[^0-9.]/g, "")
                        .replace(/(\..*)\./g, "$1")
                        .replace(/^(\d+\.\d{0,2}).*$/, "$1"),
                    });
                    setFormErrors((current) => ({
                      ...current,
                      maxDiscount: undefined,
                    }));
                    setFormError("");
                  }}
                />

              </div>

              <FormInput
                label="Usage Limit"
                placeholder="Example: 1000"
                value={form.usageLimit}
                type="number"
                error={formErrors.usageLimit}
                onChange={(value) => {
                  setForm({
                    ...form,
                    usageLimit: value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 9),
                  });
                  setFormErrors((current) => ({
                    ...current,
                    usageLimit: undefined,
                  }));
                  setFormError("");
                }}
              />

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="flex items-center text-[9px] font-semibold text-[#52627A]">
                    <CalendarDays
                      size={12}
                      className="mr-1"
                    />
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.startDate
                    }
                    onChange={(event) => {
                      setForm({
                        ...form,
                        startDate: event.target.value,
                      });
                      setFormErrors((current) => ({
                        ...current,
                        startDate: undefined,
                        endDate: undefined,
                      }));
                      setFormError("");
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    aria-invalid={!!formErrors.startDate}
                    className={`mt-1.5 h-10 w-full rounded-lg border px-2 text-[10px] outline-none focus:border-[#1769F5] ${
                      formErrors.startDate
                        ? "border-[#EF4444] bg-[#FFF8F8]"
                        : "border-[#DCE2EA]"
                    }`}
                  />

                  {formErrors.startDate && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {formErrors.startDate}
                    </p>
                  )}

                </div>

                <div>

                  <label className="flex items-center text-[9px] font-semibold text-[#52627A]">
                    <CalendarDays
                      size={12}
                      className="mr-1"
                    />
                    End Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.endDate
                    }
                    onChange={(event) => {
                      setForm({
                        ...form,
                        endDate: event.target.value,
                      });
                      setFormErrors((current) => ({
                        ...current,
                        endDate: undefined,
                      }));
                      setFormError("");
                    }}
                    min={
                      form.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    aria-invalid={!!formErrors.endDate}
                    className={`mt-1.5 h-10 w-full rounded-lg border px-2 text-[10px] outline-none focus:border-[#1769F5] ${
                      formErrors.endDate
                        ? "border-[#EF4444] bg-[#FFF8F8]"
                        : "border-[#DCE2EA]"
                    }`}
                  />

                  {formErrors.endDate && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {formErrors.endDate}
                    </p>
                  )}

                </div>

              </div>

              {/* PREVIEW */}

              <div className="rounded-xl border border-[#D7E5FF] bg-[#F2F7FF] p-4">

                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#8995A5]">
                  Coupon Preview
                </p>

                <div className="mt-3 flex items-center">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#1769F5] shadow-sm">
                    <Ticket size={16} />
                  </div>

                  <div className="ml-3 min-w-0">

                    <p className="truncate text-[11px] font-bold text-[#33415A]">
                      {form.name ||
                        "Coupon Name"}
                    </p>

                    <p className="mt-1 font-mono text-[8px] text-[#5271A4]">
                      {form.code ||
                        "COUPON_CODE"}
                    </p>

                  </div>

                  <div className="ml-auto text-right">

                    <p className="text-[12px] font-bold text-[#1769F5]">

                      {form.value
                        ? form.type ===
                          "Percentage"
                          ? `${form.value}% OFF`
                          : `₹${Number(
                              form.value
                            ).toLocaleString(
                              "en-IN"
                            )} OFF`
                        : "--"}

                    </p>

                    {form.minOrder && (
                      <p className="mt-1 text-[8px] text-[#8995A5]">
                        Min ₹
                        {Number(
                          form.minOrder
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    )}

                  </div>

                </div>

              </div>

              {formError && (
                <div className="rounded-lg border border-[#F3CACA] bg-[#FFF4F4] px-3 py-2.5">
                  <p className="text-[9px] font-semibold text-[#C43E3E]">
                    {formError}
                  </p>
                </div>
              )}

            </div>

            {/* MODAL FOOTER */}

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveCoupon}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <CheckCircle2 size={13} />

                {editingId !== null
                  ? "Update Coupon"
                  : "Create Coupon"}
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
              Delete Coupon?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This coupon will be permanently
              removed from the coupon list.
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
                onClick={deleteCoupon}
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
              Coupon information updated successfully.
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
  status: CouponStatus;
}) {
  const styles: Record<
    CouponStatus,
    string
  > = {
    Active:
      "bg-[#EAF8F0] text-[#249357]",
    Scheduled:
      "bg-[#FFF5DF] text-[#C17B19]",
    Expired:
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
   FORM INPUT
============================================================ */

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
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
        aria-invalid={!!error}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10 ${
          error
            ? "border-[#EF4444] bg-[#FFF8F8]"
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