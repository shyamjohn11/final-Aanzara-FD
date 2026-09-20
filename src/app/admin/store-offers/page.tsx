"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { storeOffersApi, storesApi, dealersApi } from "@/app/api/services";
import {
  ArrowLeft,
  Plus,
  Search,
  Store,
  Tag,
  CalendarDays,
  Percent,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Eye,
  Package,
  IndianRupee,
} from "lucide-react";

type OfferStatus = "Active" | "Inactive" | "Scheduled";

type StoreOffer = {
  id: number;
  serverId?: string;
  title: string;
  code: string;
  store: string;
  storeCode: string;
  description: string;
  discountType: "Percentage" | "Flat";
  discountValue: number;
  minOrder: number;
  startDate: string;
  endDate: string;
  products: number;
  status: OfferStatus;
};

export default function StoreOffersPage() {
  const router = useRouter();

  const [offers, setOffers] =
    useState<StoreOffer[]>([]);

  /* Backend: fetch offers on mount. */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res: any = await storeOffersApi.list(1, 100);
        const payload = res?.data ?? res;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        if (cancelled || raw.length === 0) return;
        const mapped: StoreOffer[] = raw.map((r: any, index: number) => {
          const s = String(r.status ?? "Active");
          const status: OfferStatus =
            s.toLowerCase() === "inactive"
              ? "Inactive"
              : s.toLowerCase() === "scheduled"
                ? "Scheduled"
                : "Active";
          const dt = String(r.discountType ?? r.type ?? "Percentage");
          return {
            id: index + 1,
            serverId: String(r.offerId ?? r.storeOfferId ?? r.id ?? ""),
            title: String(r.title ?? r.offerTitle ?? r.name ?? ""),
            code: String(r.code ?? r.offerCode ?? ""),
            store: String(r.store ?? r.storeName ?? ""),
            storeCode: String(r.storeCode ?? r.storeId ?? ""),
            description: String(r.description ?? ""),
            discountType: dt.toLowerCase() === "flat" ? "Flat" : "Percentage",
            discountValue: Number(r.discountValue ?? r.discount ?? r.value ?? 0) || 0,
            minOrder: Number(r.minOrder ?? r.minimumOrder ?? r.minOrderValue ?? 0) || 0,
            startDate: String(r.startDate ?? r.start ?? r.validFrom ?? ""),
            endDate: String(r.endDate ?? r.end ?? r.validTo ?? ""),
            products: Number(r.products ?? r.productCount ?? r.productsCovered ?? 0) || 0,
            status,
          };
        });
        if (mapped.length > 0) setOffers(mapped);
      } catch {}
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Backend: fetch store list once — now merges legacy Stores + agent Dealer shops
     so the Store Offers picker shows every agent-added store ("agent added stores
     are displayed in this place and that stores offers are displayed in stores
     offers place"). */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [storesRes, dealersRes] = await Promise.all([
          storesApi.list(1, 100).catch(() => null),
          dealersApi.list(1, 100).catch(() => null),
        ]);
        const toItems = (payload: any): any[] => {
          const p = payload?.data ?? payload;
          if (!p) return [];
          if (Array.isArray(p)) return p;
          if (Array.isArray(p?.items)) return p.items;
          if (Array.isArray(p?.data)) return p.data;
          return [];
        };
        const storeItems = toItems(storesRes).map((r: any) => ({
          id: String(r.storeId ?? r.id ?? ""),
          name: String(r.storeName ?? r.name ?? ""),
          code: String(r.storeCode ?? r.code ?? ""),
        }));
        const dealerItems = toItems(dealersRes).map((r: any) => ({
          id: String(r.id ?? r.dealerId ?? ""),
          name: String(r.shopName ?? r.storeName ?? "Dealer Shop"),
          code: String(r.dealerCode ?? r.storeCode ?? ""),
        }));
        const merged = [...storeItems, ...dealerItems].filter((s) => s.id && s.name);
        // Deduplicate by id
        const dedup = Array.from(new Map(merged.map((m) => [m.id, m])).values());
        if (!cancelled && dedup.length > 0) setStores(dedup);
      } catch {}
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | OfferStatus>("All");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [viewOffer, setViewOffer] =
    useState<StoreOffer | null>(null);

  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    title: "",
    code: "",
    store: "",
    storeCode: "",
    description: "",
    discountType: "Percentage" as
      | "Percentage"
      | "Flat",
    discountValue: "",
    minOrder: "",
    startDate: "",
    endDate: "",
    products: "0",
    status: "Active" as OfferStatus,
  });

  /* New: store options for the picker */
  const [stores, setStores] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  type OfferFormErrors = {
    title?: string;
    code?: string;
    store?: string;
    storeCode?: string;
    description?: string;
    discountValue?: string;
    minOrder?: string;
    startDate?: string;
    endDate?: string;
    products?: string;
    status?: string;
  };

  const [errors, setErrors] = useState<OfferFormErrors>({});

  const clearError = (field: keyof OfferFormErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateOffer = () => {
    const next: OfferFormErrors = {};
    const title = form.title.trim();
    const code = form.code.trim();
    const store = form.store.trim();
    const storeCode = form.storeCode.trim();
    const description = form.description.trim();
    const discountValue = Number(form.discountValue);
    const minOrder = Number(form.minOrder);
    const products = Number(form.products);

    if (!title) {
      next.title = "Offer title is required.";
    } else if (title.length < 2 || title.length > 100) {
      next.title = "Offer title must be 2–100 characters.";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9 &'().,_-]*$/.test(title)) {
      next.title = "Offer title contains invalid characters.";
    }

    if (!code) {
      next.code = "Offer code is required.";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,29}$/.test(code)) {
      next.code = "Use 3–30 letters, numbers, hyphens or underscores.";
    } else if (
      offers.some(
        (offer) =>
          offer.code.toLowerCase() === code.toLowerCase() &&
          offer.id !== editingId
      )
    ) {
      next.code = "This offer code already exists.";
    }

    if (!store) {
      next.store = "Store name is required.";
    } else if (store.length > 100) {
      next.store = "Store name must be 100 characters or less.";
    }

    if (!storeCode) {
      next.storeCode = "Store code is required.";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,29}$/.test(storeCode)) {
      next.storeCode =
        "Use 3–30 letters, numbers, hyphens or underscores.";
    }

    if (description.length > 500) {
      next.description = "Description must be 500 characters or less.";
    }

    if (!form.discountValue.trim()) {
      next.discountValue = "Discount value is required.";
    } else if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      next.discountValue = "Discount must be greater than 0.";
    } else if (
      form.discountType === "Percentage" &&
      discountValue > 100
    ) {
      next.discountValue = "Percentage discount cannot exceed 100%.";
    } else if (
      form.discountType === "Flat" &&
      discountValue > 100000000
    ) {
      next.discountValue = "Discount amount is too large.";
    }

    if (!form.minOrder.trim()) {
      next.minOrder = "Minimum order value is required.";
    } else if (!Number.isFinite(minOrder) || minOrder < 0) {
      next.minOrder = "Minimum order value cannot be negative.";
    }

    if (!form.startDate) {
      next.startDate = "Start date is required.";
    }

    if (!form.endDate) {
      next.endDate = "End date is required.";
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      next.endDate = "End date must be on or after the start date.";
    }

    if (!form.products.trim()) {
      next.products = "Products covered is required.";
    } else if (
      !Number.isInteger(products) ||
      products < 0
    ) {
      next.products = "Products covered must be a whole number (0 or more).";
    }

    if (
      form.status !== "Active" &&
      form.status !== "Inactive" &&
      form.status !== "Scheduled"
    ) {
      next.status = "Please select a valid status.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return offers.filter((offer) => {
      const matchesSearch =
        !query ||
        offer.title.toLowerCase().includes(query) ||
        offer.code.toLowerCase().includes(query) ||
        offer.store.toLowerCase().includes(query) ||
        offer.storeCode.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        offer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [offers, search, statusFilter]);

  /* =====================================================
     STATS
  ====================================================== */

  const activeCount = offers.filter(
    (offer) => offer.status === "Active"
  ).length;

  const scheduledCount = offers.filter(
    (offer) => offer.status === "Scheduled"
  ).length;

  const inactiveCount = offers.filter(
    (offer) => offer.status === "Inactive"
  ).length;

  const totalProducts = offers.reduce(
    (total, offer) => total + offer.products,
    0
  );

  /* =====================================================
     RESET
  ====================================================== */

  const resetForm = () => {
    setForm({
      title: "",
      code: "",
      store: "",
      storeCode: "",
      description: "",
      discountType: "Percentage",
      discountValue: "",
      minOrder: "",
      startDate: "",
      endDate: "",
      products: "0",
      status: "Active",
    });

    setSelectedStoreId(null);
    setErrors({});
  };

  /* =====================================================
     CREATE
  ====================================================== */

  const openCreate = () => {
    resetForm();
    setErrors({});
    setSelectedStoreId(null);
    setShowForm(true);
  };

  /* =====================================================
     EDIT
  ====================================================== */

  const openEdit = (offer: StoreOffer) => {
    setEditingId(offer.id);

    /* Pre-select the store if we have a matching id */
    const storeOpt = stores.find(
      (s) => s.id === offer.store || s.code === offer.storeCode
    );
    setSelectedStoreId(storeOpt?.id ?? null);

    setForm({
      title: offer.title,
      code: offer.code,
      store: offer.store,
      storeCode: offer.storeCode,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      minOrder: String(offer.minOrder),
      startDate: offer.startDate,
      endDate: offer.endDate,
      products: String(offer.products),
      status: offer.status,
    });

    setErrors({});
    setShowForm(true);
  };

  /* =====================================================
     SAVE
  ====================================================== */

  const saveOffer = async () => {
    if (!validateOffer()) return;

    const offerData = {
      title: form.title.trim(),
      code: form.code
        .trim()
        .toUpperCase(),
      store: form.store.trim(),
      storeCode: form.storeCode
        .trim()
        .toUpperCase(),
      description:
        form.description.trim(),
      discountType:
        form.discountType,
      discountValue:
        Number(form.discountValue) || 0,
      minOrder:
        Number(form.minOrder) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      products:
        Number(form.products) || 0,
      status: form.status,
    };

    const editing =
      editingId !== null
        ? offers.find((offer) => offer.id === editingId)
        : undefined;
    try {
      if (editing?.serverId) {
        await storeOffersApi.update(editing.serverId, { ...offerData });
      } else {
        await storeOffersApi.create({ ...offerData });
      }
    } catch {
      /* best-effort: fall through to local logic */
    }

    if (editingId !== null) {
      setOffers((current) =>
        current.map((offer) =>
          offer.id === editingId
            ? {
                ...offer,
                ...offerData,
              }
            : offer
        )
      );
    } else {
      setOffers((current) => [
        ...current,
        {
          id: Date.now(),
          ...offerData,
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

  const deleteOffer = async () => {
    if (deleteId === null) return;

    const target = offers.find((offer) => offer.id === deleteId);
    if (target?.serverId) {
      try {
        await storeOffersApi.remove(target.serverId);
      } catch {
        /* best-effort */
      }
    }

    setOffers((current) =>
      current.filter(
        (offer) => offer.id !== deleteId
      )
    );

    setDeleteId(null);
    showSuccess();
  };

  /* =====================================================
     TOGGLE STATUS
  ====================================================== */

  const toggleStatus = async (id: number) => {
    const target = offers.find((offer) => offer.id === id);
    const newStatus = target?.status === "Active" ? "Inactive" : "Active";
    if (target?.serverId) {
      try {
        await storeOffersApi.setStatus(target.serverId, newStatus);
      } catch {
        /* best-effort */
      }
    }
    setOffers((current) =>
      current.map((offer) => {
        if (offer.id !== id) {
          return offer;
        }

        return {
          ...offer,
          status:
            offer.status === "Active"
              ? "Inactive"
              : "Active",
        };
      })
    );

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
     MONEY
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
            Store Offers
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage offers for individual stores
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Add Store Offer
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
            Store Offers
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
            title="Active Offers"
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
            title="Products Covered"
            value={totalProducts}
            icon={Package}
            bg="bg-[#F3F0FF]"
            iconColor="text-[#7053A8]"
          />

        </section>

        {/* =================================================
            SEARCH / FILTER
        ================================================== */}

        <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row md:items-center">

            <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 md:max-w-[500px]">

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
                placeholder="Search offer, code, store..."
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
                  "Scheduled",
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
            OFFERS TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#263650]">
                Store Offer List
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
                        Offer
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Store
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Discount
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Min Order
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Validity
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Products
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

                                <p className="max-w-[190px] truncate text-[11px] font-bold text-[#33415A]">
                                  {offer.title}
                                </p>

                                <span className="mt-1 inline-block rounded-md bg-[#F0F4FA] px-2 py-1 font-mono text-[8px] font-semibold text-[#31558E]">
                                  {offer.code}
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* STORE */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Store
                                size={14}
                                className="text-[#1769F5]"
                              />

                              <div>

                                <p className="max-w-[160px] truncate text-[9px] font-semibold text-[#52627A]">
                                  {offer.store}
                                </p>

                                <p className="mt-1 font-mono text-[7px] text-[#8995A5]">
                                  {offer.storeCode}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* DISCOUNT */}

                          <td className="px-5 py-4">

                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF8F0] px-2.5 py-1 text-[8px] font-semibold text-[#249357]">

                              {offer.discountType ===
                              "Percentage" ? (
                                <>
                                  <Percent size={10} />
                                  {offer.discountValue}%
                                </>
                              ) : (
                                <>
                                  <IndianRupee
                                    size={10}
                                  />
                                  {offer.discountValue}
                                </>
                              )}

                            </span>

                          </td>

                          {/* MIN ORDER */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-semibold text-[#52627A]">
                              {money(
                                offer.minOrder
                              )}
                            </span>

                          </td>

                          {/* VALIDITY */}

                          <td className="px-5 py-4">

                            <div className="flex items-start gap-1.5">

                              <CalendarDays
                                size={12}
                                className="mt-0.5 text-[#8995A5]"
                              />

                              <div>

                                <p className="text-[8px] font-semibold text-[#52627A]">
                                  {offer.startDate}
                                </p>

                                <p className="mt-1 text-[8px] text-[#8995A5]">
                                  to{" "}
                                  {offer.endDate}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* PRODUCTS */}

                          <td className="px-5 py-4">

                            <span className="inline-flex items-center gap-1 rounded-md bg-[#F3F0FF] px-2 py-1.5 text-[8px] font-semibold text-[#7053A8]">
                              <Package size={11} />
                              {offer.products}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                toggleStatus(
                                  offer.id
                                )
                              }
                            >
                              <StatusBadge
                                status={
                                  offer.status
                                }
                              />
                            </button>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1.5">

                              <button
                                type="button"
                                onClick={() =>
                                  setViewOffer(
                                    offer
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E5EC] text-[#52627A] hover:bg-[#F4F6F9]"
                              >
                                <Eye size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    offer
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E5EC] text-[#1769F5] hover:bg-[#EDF3FF]"
                              >
                                <Pencil size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteId(
                                    offer.id
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0D4D4] text-[#D85A5A] hover:bg-[#FFF0F0]"
                              >
                                <Trash2 size={13} />
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
                                {offer.title}
                              </p>

                              <span className="mt-1 inline-block rounded-md bg-[#F0F4FA] px-2 py-1 font-mono text-[8px] font-semibold text-[#31558E]">
                                {offer.code}
                              </span>

                            </div>

                            <StatusBadge
                              status={
                                offer.status
                              }
                            />

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <Info
                              label="Store"
                              value={
                                offer.store
                              }
                            />

                            <Info
                              label="Discount"
                              value={
                                offer.discountType ===
                                "Percentage"
                                  ? `${offer.discountValue}%`
                                  : money(
                                      offer.discountValue
                                    )
                              }
                            />

                            <Info
                              label="Min Order"
                              value={money(
                                offer.minOrder
                              )}
                            />

                            <Info
                              label="Products"
                              value={String(
                                offer.products
                              )}
                            />

                            <Info
                              label="Start Date"
                              value={
                                offer.startDate
                              }
                            />

                            <Info
                              label="End Date"
                              value={
                                offer.endDate
                              }
                            />

                          </div>

                          <p className="mt-3 text-[9px] leading-4 text-[#8995A5]">
                            {offer.description}
                          </p>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewOffer(
                                  offer
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[9px] font-semibold text-[#52627A]"
                            >
                              <Eye size={12} />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  offer
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[9px] font-semibold text-[#1769F5]"
                            >
                              <Pencil size={12} />
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
                              <Trash2 size={12} />
                              Delete
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>

            </>
          )}

        </section>

      </div>

      {/* =================================================
          ADD / EDIT MODAL
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

          <div className="relative max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Store Offer"
                    : "Add Store Offer"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Create an offer for a specific store
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                }}
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Offer Title"
                  placeholder="Example: Chennai Store Special"
                  maxLength={100}
                  error={errors.title}
                  value={form.title}
                  onChange={(value) => {
                    setForm({
                      ...form,
                      title: value,
                    });
                    clearError("title");
                  }}
                />

                <FormInput
                  label="Offer Code"
                  placeholder="Example: CHN10"
                  maxLength={30}
                  error={errors.code}
                  value={form.code}
                  onChange={(value) => {
                    setForm({
                      ...form,
                      code: value,
                    });
                    clearError("code");
                  }}
                />

              </div>

<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <select
                  value={selectedStoreId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedStoreId(id);
                    const store = stores.find((s) => s.id === id);
                    if (store) {
                      setForm((current) => ({
                        ...current,
                        store: store.name,
                        storeCode: store.code,
                      }));
                      clearError("store");
                      clearError("storeCode");
                    }
                  }}
                  className="w-full rounded-lg border border-[#DCE2EA] px-3 py-2 text-[10px] outline-none focus:border-[#1769F5] focus:shadow-outline sm:text-[11px]"
                >
                  <option disabled value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </option>
                  ))}
                </select>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="Describe this store offer..."
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-lg border border-[#DCE2EA] px-3 py-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5]"
                />

              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Discount Type
                  </label>

                  <select
                    value={
                      form.discountType
                    }
                    onChange={(event) => {
                      setForm({
                        ...form,
                        discountType: event.target.value as
                          | "Percentage"
                          | "Flat",
                      });
                      clearError("discountValue");
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
                    form.discountType ===
                    "Percentage"
                      ? "Discount (%)"
                      : "Discount Amount"
                  }
                  placeholder={
                    form.discountType ===
                    "Percentage"
                      ? "10"
                      : "500"
                  }
                  value={
                    form.discountValue
                  }
                  type="number"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      discountValue:
                        value,
                    })
                  }
                />

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Minimum Order Value"
                  placeholder="Example: 2500"
                  value={
                    form.minOrder
                  }
                  type="number"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      minOrder: value,
                    })
                  }
                />

                <FormInput
                  label="Products Covered"
                  placeholder="Example: 25"
                  value={
                    form.products
                  }
                  type="number"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      products: value,
                    })
                  }
                />

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.startDate
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        startDate:
                          event.target
                            .value,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                  />

                </div>

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.endDate
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        endDate:
                          event.target
                            .value,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                  />

                </div>

              </div>

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status:
                        event.target
                          .value as OfferStatus,
                    })
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Scheduled">
                    Scheduled
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

              {/* PREVIEW */}

              <div className="rounded-xl border border-[#D7E5FF] bg-[#F2F7FF] p-4">

                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#8995A5]">
                  Offer Preview
                </p>

                <div className="mt-3 flex items-center">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#1769F5] shadow-sm">
                    <Tag size={18} />
                  </div>

                  <div className="ml-3 min-w-0">

                    <p className="truncate text-[11px] font-bold text-[#33415A]">
                      {form.title ||
                        "Offer Title"}
                    </p>

                    <p className="mt-1 font-mono text-[8px] text-[#5271A4]">
                      {form.code ||
                        "OFFER-CODE"}
                    </p>

                  </div>

                  <div className="ml-auto text-right">

                    <p className="text-[14px] font-bold text-[#1769F5]">

                      {form.discountValue
                        ? form.discountType ===
                          "Percentage"
                          ? `${form.discountValue}%`
                          : money(
                              Number(
                                form.discountValue
                              )
                            )
                        : "--"}

                    </p>

                    <p className="mt-1 text-[8px] font-semibold text-[#249357]">
                      {form.discountType ===
                      "Percentage"
                        ? "DISCOUNT"
                        : "FLAT DISCOUNT"}
                    </p>

                  </div>

                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">

                  <div className="rounded-lg bg-white px-3 py-2">

                    <p className="text-[7px] uppercase text-[#9AA5B4]">
                      Store
                    </p>

                    <p className="mt-1 truncate text-[9px] font-semibold text-[#52627A]">
                      {form.store ||
                        "Store Name"}
                    </p>

                  </div>

                  <div className="rounded-lg bg-white px-3 py-2">

                    <p className="text-[7px] uppercase text-[#9AA5B4]">
                      Min Order
                    </p>

                    <p className="mt-1 text-[9px] font-semibold text-[#52627A]">
                      {form.minOrder
                        ? money(
                            Number(
                              form.minOrder
                            )
                          )
                        : "--"}
                    </p>

                  </div>

                </div>

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
                onClick={saveOffer}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <CheckCircle2 size={13} />

                {editingId !== null
                  ? "Update Offer"
                  : "Save Offer"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW MODAL
      ================================================== */}

      {viewOffer && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() =>
              setViewOffer(null)
            }
          />

          <div className="relative w-full max-w-[480px] rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                  <Tag size={18} />
                </div>

                <div>

                  <h2 className="text-[13px] font-bold text-[#263650]">
                    {viewOffer.title}
                  </h2>

                  <p className="mt-1 font-mono text-[8px] text-[#8995A5]">
                    {viewOffer.code}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewOffer(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="space-y-3 p-5">

              <ViewRow
                icon={Store}
                label="Store"
                value={`${viewOffer.store} (${viewOffer.storeCode})`}
              />

              <ViewRow
                icon={Tag}
                label="Description"
                value={
                  viewOffer.description ||
                  "No description"
                }
              />

              <ViewRow
                icon={
                  viewOffer.discountType ===
                  "Percentage"
                    ? Percent
                    : IndianRupee
                }
                label="Discount"
                value={
                  viewOffer.discountType ===
                  "Percentage"
                    ? `${viewOffer.discountValue}%`
                    : money(
                        viewOffer.discountValue
                      )
                }
              />

              <ViewRow
                icon={IndianRupee}
                label="Minimum Order"
                value={money(
                  viewOffer.minOrder
                )}
              />

              <ViewRow
                icon={CalendarDays}
                label="Validity"
                value={`${viewOffer.startDate} to ${viewOffer.endDate}`}
              />

              <ViewRow
                icon={Package}
                label="Products Covered"
                value={String(
                  viewOffer.products
                )}
              />

              <div className="flex items-center justify-between rounded-xl bg-[#F7F9FC] px-4 py-3">

                <span className="text-[9px] font-semibold text-[#8995A5]">
                  Offer Status
                </span>

                <StatusBadge
                  status={
                    viewOffer.status
                  }
                />

              </div>

            </div>

            <div className="border-t border-[#E5E9EF] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  setViewOffer(null);
                  openEdit(viewOffer);
                }}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Offer
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          DELETE MODAL
      ================================================== */}

      {deleteId !== null && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">

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
              Delete Store Offer?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This offer will be permanently
              removed from the store offers list.
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
              Store offer updated successfully.
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
  const classes =
    status === "Active"
      ? "bg-[#EAF8F0] text-[#249357]"
      : status === "Scheduled"
        ? "bg-[#FFF5DF] text-[#C17B19]"
        : "bg-[#FFF0F0] text-[#D85A5A]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold ${classes}`}
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

/* ============================================================
   VIEW ROW
============================================================ */

function ViewRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start rounded-xl bg-[#F7F9FC] px-4 py-3">

      <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
        <Icon size={14} />
      </div>

      <div className="min-w-0">

        <p className="text-[8px] uppercase tracking-wide text-[#9AA5B4]">
          {label}
        </p>

        <p className="mt-1 break-words text-[10px] font-semibold text-[#52627A]">
          {value}
        </p>

      </div>

    </div>
  );
}