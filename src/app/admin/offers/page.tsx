"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { offersApi, categoriesApi } from "@/app/api/services";
import {
  ArrowLeft,
  Plus,
  Search,
  Tag,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Percent,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type OfferStatus = "Active" | "Scheduled" | "Expired";

type Offer = {
  id: number;
  serverId?: string;
  name: string;
  code: string;
  type: "Percentage" | "Flat";
  value: number;
  minOrder: number;
  category: string;
  startDate: string;
  endDate: string;
  status: OfferStatus;
};

/* API-first: offers load from backend; empty until fetch resolves.
   Category filter is no longer hardcoded — live catalog categories from
   GET /api/v1/categories populate the dropdown, and search/status filters
   are pushed to GET /api/admin/offers?Search=&Status= as query params. */

const DEFAULT_CATEGORIES = [
  "All Products",
  "Staples",
  "Biscuits",
  "Beverages",
  "Home Care",
  "Personal Care",
  "Instant Food",
];

export default function OffersPage() {
  const router = useRouter();

  const [offers, setOffers] =
    useState<Offer[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | OfferStatus>("All");

  const [categoryFilter, setCategoryFilter] =
    useState("All Products");

  const [categories, setCategories] =
    useState<string[]>(DEFAULT_CATEGORIES);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] =
    useState(false);

  type FormErrors = {
    name?: string;
    code?: string;
    value?: string;
    minOrder?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    general?: string;
  };

  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "Percentage" as
      | "Percentage"
      | "Flat",
    value: "",
    minOrder: "",
    category: "All Products",
    startDate: "",
    endDate: "",
  });

  /* =====================================================
     LOAD LIVE CATEGORIES — replaces hardcoded CATEGORIES dropdown
     GET /api/v1/categories → ["All Products", ...live names]
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const response: any = await categoriesApi.list();
        const payload: any = (response as any)?.data ?? response;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (cancelled || rawItems.length === 0) return;

        const names = rawItems
          .map((raw: any) => String(raw.categoryName ?? raw.name ?? "").trim())
          .filter((name: string) => name.length > 0);

        const unique = Array.from(new Set(names));
        if (!cancelled && unique.length > 0) {
          setCategories(["All Products", ...unique]);
        }
      } catch {
        // Keep DEFAULT_CATEGORIES as fallback so filter stays usable.
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     LOAD OFFERS — server-filtered via API (#80)
     Search + Status push as ?Search=&Status= to the backend
     (GetOffersQuery). Category remains a live-dropdown but
     offers have no persisted category column, so it stays
     as a client-side filter until the domain adds it.
     Debounced so typing does not spam the API.
  ====================================================== */

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const extra: Record<string, string> = {};
        const trimmedSearch = search.trim();
        if (trimmedSearch) extra.Search = trimmedSearch;
        if (statusFilter !== "All") extra.Status = statusFilter;

        const response = await offersApi.list(1, 100, extra);
        const payload: any = (response as any)?.data ?? response;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (cancelled) return;

        // Even an empty result is a valid server response — clear the list
        // so stale hard-coded offers don't linger after a filter clears.
        if (rawItems.length === 0) {
          setOffers([]);
          return;
        }

        const mapped: Offer[] = rawItems.map((raw: any, index: number) => ({
          id: index + 1,
          serverId: String(raw.offerId ?? raw.id ?? raw._id ?? ""),
          name: String(raw.name ?? raw.title ?? "Untitled offer"),
          code: String(raw.code ?? raw.offerCode ?? raw.couponCode ?? ""),
          type: raw.type === "Flat" ? "Flat" : "Percentage",
          value: Number(raw.value ?? raw.discount ?? raw.discountValue ?? raw.percent ?? 0),
          minOrder: Number(raw.minOrder ?? raw.minimumOrder ?? raw.minOrderValue ?? raw.minimumAmount ?? 0),
          category: String(raw.category ?? raw.categoryName ?? "All Products"),
          startDate: String(raw.startDate ?? raw.start ?? raw.validFrom ?? "").slice(0, 10),
          endDate: String(raw.endDate ?? raw.end ?? raw.validTo ?? "").slice(0, 10),
          status: (["Active", "Scheduled", "Expired"] as OfferStatus[]).includes(raw.status as OfferStatus)
            ? (raw.status as OfferStatus)
            : "Active",
        }));

        setOffers(mapped);
      } catch (error) {
        console.error("Unable to load offers:", error);
        if (!cancelled) setOffers([]);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, statusFilter]);

  /* =====================================================
     FILTER
  ====================================================== */

  // After API-connected filters, offers is already server-filtered by
  // Search+Status. Only category remains client-side until Offer domain
  // persists it — still uses live categories so the dropdown is not hardcoded.
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesCategory =
        categoryFilter === "All Products" ||
        offer.category === categoryFilter ||
        offer.category === "All Products";
      return matchesCategory;
    });
  }, [offers, categoryFilter]);

  /* =====================================================
     STATS
  ====================================================== */

  const activeCount = offers.filter(
    (offer) => offer.status === "Active"
  ).length;

  const scheduledCount = offers.filter(
    (offer) => offer.status === "Scheduled"
  ).length;

  const expiredCount = offers.filter(
    (offer) => offer.status === "Expired"
  ).length;

  /* =====================================================
     FORM
  ====================================================== */

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      type: "Percentage",
      value: "",
      minOrder: "",
      category: "All Products",
      startDate: "",
      endDate: "",
    });

    setEditingId(null);
    setErrors({});
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingId(offer.id);

    setForm({
      name: offer.name,
      code: offer.code,
      type: offer.type,
      value: String(offer.value),
      minOrder: String(offer.minOrder),
      category: offer.category,
      startDate: offer.startDate,
      endDate: offer.endDate,
    });

    setErrors({});
    setShowForm(true);
  };

  /* =====================================================
     SAVE OFFER
  ====================================================== */

  const saveOffer = async () => {
    const nextErrors: FormErrors = {};

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const valueText = form.value.trim();
    const minOrderText = form.minOrder.trim();
    const startDate = form.startDate;
    const endDate = form.endDate;

    // Offer name
    if (!name) {
      nextErrors.name = "Offer name is required.";
    } else if (name.length < 3) {
      nextErrors.name = "Offer name must be at least 3 characters.";
    } else if (name.length > 100) {
      nextErrors.name = "Offer name cannot exceed 100 characters.";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9 &'().,_-]*$/.test(name)) {
      nextErrors.name = "Offer name contains invalid characters.";
    }

    // Offer code
    if (!code) {
      nextErrors.code = "Offer code is required.";
    } else if (code.length < 4) {
      nextErrors.code = "Offer code must be at least 4 characters.";
    } else if (code.length > 30) {
      nextErrors.code = "Offer code cannot exceed 30 characters.";
    } else if (!/^[A-Z0-9_-]+$/.test(code)) {
      nextErrors.code =
        "Offer code can contain only letters, numbers, hyphens and underscores.";
    } else {
      const duplicate = offers.some(
        (offer) =>
          offer.code.toUpperCase() === code &&
          offer.id !== editingId
      );

      if (duplicate) {
        nextErrors.code = "This offer code already exists.";
      }
    }

    // Discount value
    if (!valueText) {
      nextErrors.value = "Discount value is required.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(valueText)) {
      nextErrors.value =
        "Enter a valid positive number with up to 2 decimal places.";
    } else {
      const numericValue = Number(valueText);

      if (!Number.isFinite(numericValue)) {
        nextErrors.value = "Enter a valid discount value.";
      } else if (numericValue <= 0) {
        nextErrors.value = "Discount value must be greater than 0.";
      } else if (
        form.type === "Percentage" &&
        numericValue > 100
      ) {
        nextErrors.value = "Percentage discount cannot exceed 100%.";
      } else if (
        form.type === "Flat" &&
        numericValue > 100000000
      ) {
        nextErrors.value =
          "Flat discount cannot exceed ₹10,00,00,000.";
      }
    }

    // Minimum order
    if (!minOrderText) {
      nextErrors.minOrder = "Minimum order value is required.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(minOrderText)) {
      nextErrors.minOrder =
        "Enter a valid amount with up to 2 decimal places.";
    } else {
      const minOrderValue = Number(minOrderText);

      if (!Number.isFinite(minOrderValue)) {
        nextErrors.minOrder = "Enter a valid minimum order value.";
      } else if (minOrderValue < 0) {
        nextErrors.minOrder =
          "Minimum order value cannot be negative.";
      } else if (minOrderValue > 1000000000) {
        nextErrors.minOrder =
          "Minimum order value cannot exceed ₹1,00,00,00,000.";
      }
    }

    // Category — live catalog categories, fallback to defaults while loading
    if (!categories.includes(form.category)) {
      nextErrors.category = "Please select a valid category.";
    }

    // Dates
    if (!startDate) {
      nextErrors.startDate = "Start date is required.";
    }

    if (!endDate) {
      nextErrors.endDate = "End date is required.";
    }

    if (startDate && endDate && endDate < startDate) {
      nextErrors.endDate =
        "End date cannot be earlier than the start date.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const value = Number(valueText);
    const minOrder = Number(minOrderText);

    const today = new Date()
      .toISOString()
      .split("T")[0];

    let status: OfferStatus;

    if (startDate > today) {
      status = "Scheduled";
    } else if (endDate < today) {
      status = "Expired";
    } else {
      status = "Active";
    }

    const payload: Record<string, unknown> = {
      name,
      code,
      type: form.type,
      value,
      minOrder,
      category: form.category,
      startDate,
      endDate,
      status,
    };

    if (editingId !== null) {
      const editingRow = offers.find(
        (offer) => offer.id === editingId
      );

      if (editingRow?.serverId) {
        try {
          await offersApi.update(editingRow.serverId, payload);
        } catch (error) {
          console.error("Offer update failed:", error);
        }
      }
    } else {
      try {
        await offersApi.create(payload);
      } catch (error) {
        console.error("Offer create failed:", error);
      }
    }

    if (editingId !== null) {
      setOffers((current) =>
        current.map((offer) =>
          offer.id === editingId
            ? {
                ...offer,
                name,
                code,
                type: form.type,
                value,
                minOrder,
                category: form.category,
                startDate,
                endDate,
                status,
              }
            : offer
        )
      );
    } else {
      setOffers((current) => [
        ...current,
        {
          id: Date.now(),
          name,
          code,
          type: form.type,
          value,
          minOrder,
          category: form.category,
          startDate,
          endDate,
          status,
        },
      ]);
    }

    setShowForm(false);
    resetForm();

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  const updateForm = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]:
        field === "code"
          ? value.toUpperCase()
          : value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
      general: undefined,
    }));
  };

  /* =====================================================
     DELETE
  ====================================================== */

  const deleteOffer = async () => {
    if (deleteId === null) return;

    const deletingRow = offers.find(
      (offer) => offer.id === deleteId
    );

    if (deletingRow?.serverId) {
      try {
        await offersApi.remove(deletingRow.serverId);
      } catch (error) {
        console.error("Offer delete failed:", error);
      }
    }

    setOffers((current) =>
      current.filter(
        (offer) => offer.id !== deleteId
      )
    );

    setDeleteId(null);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  /* =====================================================
     DATE FORMAT
  ====================================================== */

  const formatDate = (date: string) => {
    if (!date) return "-";

    const value = new Date(
      `${date}T00:00:00`
    );

    return value.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
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
          aria-label="Back to admin"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
            Offers
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage discounts, promotions and offer codes
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Create Offer
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
            Offers
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            title="Total Offers"
            value={offers.length}
            icon={Tag}
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
            title="Expired"
            value={expiredCount}
            icon={XCircle}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

        </section>

        {/* =================================================
            FILTERS
        ================================================== */}

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
                placeholder="Search offer name or code..."
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

            {/* CATEGORY */}

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="h-10 rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 text-[10px] text-[#5D6C80] outline-none focus:border-[#1769F5]"
            >

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}

            </select>

            {/* STATUS */}

            <div className="flex flex-wrap gap-1.5 xl:ml-auto">

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
            OFFERS TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>
              <h2 className="text-[13px] font-bold text-[#263650]">
                All Offers
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredOffers.length} offers found
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setCategoryFilter(
                  "All Products"
                );
              }}
              className="text-[9px] font-semibold text-[#1769F5] hover:underline"
            >
              Clear Filters
            </button>

          </div>

          {filteredOffers.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
                <Tag size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No offers found
              </h3>

              <p className="mt-1 text-[10px] text-[#8995A5]">
                Try changing your search or filters.
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
                        Offer
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Code
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Discount
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Min. Order
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

                    {filteredOffers.map(
                      (offer) => (
                        <tr
                          key={offer.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* OFFER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                                <Tag size={18} />
                              </div>

                              <div>

                                <p className="text-[11px] font-bold text-[#33415A]">
                                  {offer.name}
                                </p>

                                <p className="mt-1 text-[9px] text-[#8995A5]">
                                  {offer.category}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CODE */}

                          <td className="px-5 py-4">

                            <span className="rounded-md bg-[#F0F4FA] px-2.5 py-1.5 font-mono text-[9px] font-semibold text-[#31558E]">
                              {offer.code}
                            </span>

                          </td>

                          {/* DISCOUNT */}

                          <td className="px-5 py-4">

                            <span className="text-[12px] font-bold text-[#293953]">

                              {offer.type ===
                              "Percentage"
                                ? `${offer.value}%`
                                : `₹${offer.value.toLocaleString(
                                    "en-IN"
                                  )}`}

                            </span>

                            <p className="mt-1 text-[8px] text-[#8995A5]">
                              {offer.type}
                            </p>

                          </td>

                          {/* MIN ORDER */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] text-[#5F6E82]">
                              ₹
                              {offer.minOrder.toLocaleString(
                                "en-IN"
                              )}
                            </span>

                          </td>

                          {/* VALIDITY */}

                          <td className="px-5 py-4">

                            <p className="text-[9px] text-[#52627A]">
                              {formatDate(
                                offer.startDate
                              )}
                            </p>

                            <p className="mt-1 text-[9px] text-[#8995A5]">
                              to{" "}
                              {formatDate(
                                offer.endDate
                              )}
                            </p>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                offer.status
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
                                    offer
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E5EC] text-[#1769F5] hover:bg-[#EDF3FF]"
                                title="Edit"
                              >
                                <Pencil
                                  size={13}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteId(
                                    offer.id
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0D4D4] text-[#D85A5A] hover:bg-[#FFF0F0]"
                                title="Delete"
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

                {filteredOffers.map(
                  (offer) => (
                    <div
                      key={offer.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                          <Tag size={18} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-[11px] font-bold text-[#33415A]">
                                {offer.name}
                              </p>

                              <p className="mt-1 text-[9px] text-[#8995A5]">
                                {offer.category}
                              </p>

                            </div>

                            <StatusBadge
                              status={
                                offer.status
                              }
                            />

                          </div>

                          <div className="mt-3 flex items-center gap-2">

                            <span className="rounded-md bg-[#F0F4FA] px-2 py-1 font-mono text-[8px] font-semibold text-[#31558E]">
                              {offer.code}
                            </span>

                            <span className="text-[11px] font-bold text-[#293953]">
                              {offer.type ===
                              "Percentage"
                                ? `${offer.value}% OFF`
                                : `₹${offer.value.toLocaleString(
                                    "en-IN"
                                  )} OFF`}
                            </span>

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <Info
                              label="Minimum Order"
                              value={`₹${offer.minOrder.toLocaleString(
                                "en-IN"
                              )}`}
                            />

                            <Info
                              label="Type"
                              value={
                                offer.type
                              }
                            />

                            <Info
                              label="Start"
                              value={formatDate(
                                offer.startDate
                              )}
                            />

                            <Info
                              label="End"
                              value={formatDate(
                                offer.endDate
                              )}
                            />

                          </div>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  offer
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
                                  offer.id
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
                    {filteredOffers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#4D5C72]">
                    {offers.length}
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
            onClick={() =>
              setShowForm(false)
            }
          />

          <div className="relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Offer"
                    : "Create New Offer"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Add discount and validity details
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
                label="Offer Name"
                placeholder="Enter offer name"
                value={form.name}
                onChange={(value) =>
                  updateForm("name", value)
                }
                error={errors.name}
              />

              <FormInput
                label="Offer Code"
                placeholder="Example: WELCOME10"
                value={form.code}
                onChange={(value) =>
                  updateForm("code", value)
                }
                error={errors.code}
              />

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Discount Type
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) => {
                      const nextType =
                        event.target.value as
                          | "Percentage"
                          | "Flat";

                      setForm({
                        ...form,
                        type: nextType,
                      });

                      setErrors((current) => ({
                        ...current,
                        value: undefined,
                      }));
                    }}
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
                  onChange={(value) =>
                    updateForm("value", value)
                  }
                  error={errors.value}
                />

              </div>

              <FormInput
                label="Minimum Order Value"
                placeholder="Example: 999"
                value={form.minOrder}
                type="number"
                onChange={(value) =>
                  updateForm("minOrder", value)
                }
                error={errors.minOrder}
              />

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    updateForm(
                      "category",
                      event.target.value
                    )
                  }
                  className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                    errors.category
                      ? "border-[#D85A5A]"
                      : "border-[#DCE2EA]"
                  }`}
                  aria-invalid={Boolean(errors.category)}
                >

                  {categories.map(
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

                {errors.category && (
                  <p className="mt-1 text-[9px] font-medium text-[#D85A5A]">
                    {errors.category}
                  </p>
                )}

              </div>

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
                    value={form.startDate}
                    max={form.endDate || undefined}
                    onChange={(event) =>
                      updateForm(
                        "startDate",
                        event.target.value
                      )
                    }
                    aria-invalid={Boolean(errors.startDate)}
                    className={`mt-1.5 h-10 w-full rounded-lg border px-2 text-[10px] outline-none focus:border-[#1769F5] ${
                      errors.startDate
                        ? "border-[#D85A5A]"
                        : "border-[#DCE2EA]"
                    }`}
                  />

                  {errors.startDate && (
                    <p className="mt-1 text-[9px] font-medium text-[#D85A5A]">
                      {errors.startDate}
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
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(event) =>
                      updateForm(
                        "endDate",
                        event.target.value
                      )
                    }
                    aria-invalid={Boolean(errors.endDate)}
                    className={`mt-1.5 h-10 w-full rounded-lg border px-2 text-[10px] outline-none focus:border-[#1769F5] ${
                      errors.endDate
                        ? "border-[#D85A5A]"
                        : "border-[#DCE2EA]"
                    }`}
                  />

                  {errors.endDate && (
                    <p className="mt-1 text-[9px] font-medium text-[#D85A5A]">
                      {errors.endDate}
                    </p>
                  )}

                </div>

              </div>

              {Object.keys(errors).length > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#F0CACA] bg-[#FFF4F4] px-3 py-2"
                >
                  <p className="text-[9px] font-semibold text-[#C94D4D]">
                    Please correct the highlighted fields before saving.
                  </p>
                </div>
              )}

              {/* PREVIEW */}

              <div className="rounded-xl border border-[#D7E5FF] bg-[#F2F7FF] p-4">

                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#8995A5]">
                  Offer Preview
                </p>

                <div className="mt-3 flex items-center">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#1769F5] shadow-sm">
                    <Tag size={16} />
                  </div>

                  <div className="ml-3">

                    <p className="text-[11px] font-bold text-[#33415A]">
                      {form.name ||
                        "Offer Name"}
                    </p>

                    <p className="mt-1 font-mono text-[8px] text-[#5271A4]">
                      {form.code ||
                        "OFFER_CODE"}
                    </p>

                  </div>

                  <span className="ml-auto text-[12px] font-bold text-[#1769F5]">

                    {form.value
                      ? form.type ===
                        "Percentage"
                        ? `${form.value}%`
                        : `₹${Number(
                            form.value
                          ).toLocaleString(
                            "en-IN"
                          )}`
                      : "--"}

                  </span>

                </div>

              </div>

            </div>

            {/* FOOTER */}

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
                onClick={saveOffer}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <CheckCircle2 size={13} />

                {editingId !== null
                  ? "Update Offer"
                  : "Create Offer"}
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
              Delete Offer?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This offer will be permanently
              removed from the offers list.
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
                onClick={deleteOffer}
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
              Offer information updated successfully.
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
  status: OfferStatus;
}) {
  const styles = {
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
  const isNumeric = type === "number";

  return (
    <div>
      <label className="text-[9px] font-semibold text-[#52627A]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        min={isNumeric ? "0" : undefined}
        max={
          isNumeric && label === "Discount (%)"
            ? "100"
            : undefined
        }
        step={isNumeric ? "0.01" : undefined}
        inputMode={isNumeric ? "decimal" : undefined}
        onChange={(event) => {
          const nextValue = event.target.value;

          if (
            isNumeric &&
            nextValue !== "" &&
            !/^\d*(\.\d{0,2})?$/.test(nextValue)
          ) {
            return;
          }

          onChange(nextValue);
        }}
        placeholder={placeholder}
        maxLength={
          label === "Offer Name"
            ? 100
            : label === "Offer Code"
            ? 30
            : undefined
        }
        aria-invalid={Boolean(error)}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10 ${
          error
            ? "border-[#D85A5A]"
            : "border-[#DCE2EA]"
        }`}
      />

      {error && (
        <p
          role="alert"
          className="mt-1 text-[9px] font-medium text-[#D85A5A]"
        >
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