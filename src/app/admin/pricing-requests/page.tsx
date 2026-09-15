"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { pricingRequestsApi } from "@/app/api/services";
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  DollarSign,
  UserRound,
  Mail,
  Phone,
  Building2,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock3,
  XCircle,
  Send,
  Package,
  IndianRupee,
} from "lucide-react";

type RequestStatus =
  | "Pending"
  | "Reviewed"
  | "Approved"
  | "Rejected";

type PricingRequest = {
  id: number;
  serverId?: string;
  requestNo: string;
  customer: string;
  email: string;
  phone: string;
  company: string;
  product: string;
  quantity: number;
  currentPrice: string;
  requestedPrice: string;
  status: RequestStatus;
  createdAt: string;
  notes: string;
};

export default function PricingRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] =
    useState<PricingRequest[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await pricingRequestsApi.list(1, 100);
        const payload = res?.data ?? res;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        if (cancelled) return;
        if (raw.length === 0) {
          setRequests([]);
          return;
        }
        const allowed = ["Pending", "Reviewed", "Approved", "Rejected"];
        const toPrice = (v: any) => {
          const s = String(v ?? "");
          if (!s) return "₹0";
          return s.includes("₹") ? s : `₹${s}`;
        };
        const mapped: PricingRequest[] = raw.map((item: any, index: number) => {
          const createdRaw = String(
            item.createdAt ?? item.createdDate ?? item.date ?? item.createdOn ?? ""
          );
          return {
            id: index + 1,
            serverId: String(item.id ?? item.requestId ?? item._id ?? ""),
            requestNo: String(
              item.requestNo ?? item.requestNumber ?? item.number ?? item.code ?? `PR${10001 + index}`
            ),
            customer: String(item.customer ?? item.customerName ?? item.name ?? ""),
            email: String(item.email ?? item.customerEmail ?? ""),
            phone: String(item.phone ?? item.phoneNumber ?? item.mobile ?? ""),
            company: String(item.company ?? item.companyName ?? item.organization ?? ""),
            product: String(
              item.product ?? item.productName ?? item.requirement ?? item.title ?? ""
            ),
            quantity: Number(item.quantity ?? item.qty ?? 0) || 0,
            currentPrice: toPrice(item.currentPrice ?? item.price ?? item.existingPrice),
            requestedPrice: toPrice(item.requestedPrice ?? item.priceRequested ?? item.newPrice ?? item.amount),
            status: (allowed.includes(item.status) ? item.status : "Pending") as PricingRequest["status"],
            createdAt: createdRaw.includes("T")
              ? createdRaw.split("T")[0]
              : createdRaw || new Date().toISOString().split("T")[0],
            notes: String(item.notes ?? item.note ?? item.message ?? item.comment ?? ""),
          };
        });
        setRequests(mapped);
      } catch {
        if (!cancelled) setRequests([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | RequestStatus>("All");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [viewRequest, setViewRequest] =
    useState<PricingRequest | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    customer: "",
    email: "",
    phone: "",
    company: "",
    product: "",
    quantity: "",
    currentPrice: "",
    requestedPrice: "",
    status: "Pending" as RequestStatus,
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateFormField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    const customer = form.customer.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const company = form.company.trim();
    const product = form.product.trim();
    const quantityText = form.quantity.trim();
    const currentPriceText = form.currentPrice.trim();
    const requestedPriceText = form.requestedPrice.trim();
    const notes = form.notes.trim();

    if (!customer) {
      nextErrors.customer = "Customer name is required.";
    } else if (customer.length < 2) {
      nextErrors.customer = "Customer name must be at least 2 characters.";
    } else if (customer.length > 100) {
      nextErrors.customer = "Customer name must be 100 characters or less.";
    } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'&()/-]*$/.test(customer)) {
      nextErrors.customer = "Enter a valid customer name.";
    }

    if (!email) {
      nextErrors.email = "Email address is required.";
    } else if (email.length > 150) {
      nextErrors.email = "Email address must be 150 characters or less.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (phone) {
      const digits = phone.replace(/\D/g, "");
      if (!/^[+()\-\s\d]+$/.test(phone)) {
        nextErrors.phone = "Enter a valid phone number.";
      } else if (digits.length < 10 || digits.length > 15) {
        nextErrors.phone = "Phone number must contain 10 to 15 digits.";
      }
    }

    if (company.length > 120) {
      nextErrors.company = "Company name must be 120 characters or less.";
    }

    if (!product) {
      nextErrors.product = "Product / requirement is required.";
    } else if (product.length < 2) {
      nextErrors.product = "Product / requirement must be at least 2 characters.";
    } else if (product.length > 200) {
      nextErrors.product = "Product / requirement must be 200 characters or less.";
    }

    if (!quantityText) {
      nextErrors.quantity = "Quantity is required.";
    } else if (!/^\d+$/.test(quantityText)) {
      nextErrors.quantity = "Quantity must be a whole number.";
    } else {
      const quantity = Number(quantityText);
      if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        nextErrors.quantity = "Quantity must be greater than 0.";
      } else if (quantity > 1000000000) {
        nextErrors.quantity = "Quantity is too large.";
      }
    }

    const pricePattern = /^\d+(?:\.\d{1,2})?$/;

    if (!currentPriceText) {
      nextErrors.currentPrice = "Current price is required.";
    } else if (!pricePattern.test(currentPriceText)) {
      nextErrors.currentPrice = "Enter a valid price with up to 2 decimals.";
    } else if (Number(currentPriceText) <= 0) {
      nextErrors.currentPrice = "Current price must be greater than 0.";
    } else if (Number(currentPriceText) > 1000000000) {
      nextErrors.currentPrice = "Current price is too large.";
    }

    if (!requestedPriceText) {
      nextErrors.requestedPrice = "Requested price is required.";
    } else if (!pricePattern.test(requestedPriceText)) {
      nextErrors.requestedPrice = "Enter a valid price with up to 2 decimals.";
    } else if (Number(requestedPriceText) <= 0) {
      nextErrors.requestedPrice = "Requested price must be greater than 0.";
    } else if (Number(requestedPriceText) > 1000000000) {
      nextErrors.requestedPrice = "Requested price is too large.";
    }

    if (
      !nextErrors.currentPrice &&
      !nextErrors.requestedPrice &&
      Number(requestedPriceText) > Number(currentPriceText)
    ) {
      nextErrors.requestedPrice =
        "Requested price cannot be higher than the current price.";
    }

    if (notes.length > 1000) {
      nextErrors.notes = "Notes must be 1000 characters or less.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return false;
    }

    return true;
  };

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        request.requestNo
          .toLowerCase()
          .includes(query) ||
        request.customer
          .toLowerCase()
          .includes(query) ||
        request.email
          .toLowerCase()
          .includes(query) ||
        request.company
          .toLowerCase()
          .includes(query) ||
          request.product
            .toLowerCase()
            .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  /* =====================================================
     STATS
  ====================================================== */

  const pendingCount = requests.filter(
    (item) => item.status === "Pending"
  ).length;

  const reviewedCount = requests.filter(
    (item) => item.status === "Reviewed"
  ).length;

  const approvedCount = requests.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === "Rejected"
  ).length;

  /* =====================================================
     RESET
  ====================================================== */

  const resetForm = () => {
    setForm({
      customer: "",
      email: "",
      phone: "",
      company: "",
      product: "",
      quantity: "",
      currentPrice: "",
      requestedPrice: "",
      status: "Pending",
      notes: "",
    });

    setEditingId(null);
    setErrors({});
  };

  /* =====================================================
     CREATE
  ====================================================== */

  const openCreate = () => {
    resetForm();
    setErrors({});
    setShowForm(true);
  };

  /* =====================================================
     EDIT
  ====================================================== */

  const openEdit = (request: PricingRequest) => {
    setEditingId(request.id);

    setForm({
      customer: request.customer,
      email: request.email,
      phone: request.phone,
      company: request.company,
      product: request.product,
      quantity: String(request.quantity),
      currentPrice:
        request.currentPrice.replace("₹", ""),
      requestedPrice:
        request.requestedPrice.replace("₹", ""),
      status: request.status,
      notes: request.notes,
    });

    setErrors({});
    setShowForm(true);
  };

  /* =====================================================
     SAVE
  ====================================================== */

  const saveRequest = async () => {
    if (!validateForm()) return;

    const customer = form.customer.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const company = form.company.trim();
    const product = form.product.trim();
    const quantity = Number(form.quantity.trim());
    const currentPrice = Number(form.currentPrice.trim());
    const requestedPrice = Number(form.requestedPrice.trim());
    const notes = form.notes.trim();

    const payload = {
      customerName: customer,
      email,
      phone,
      company,
      product,
      quantity,
      currentPrice,
      requestedPrice,
      status: form.status,
      message: notes,
    };

    if (editingId !== null) {
      // PUT /api/admin/pricing-requests/{id} best-effort, then local update.
      try {
        const target = requests.find((request) => request.id === editingId);
        if (target?.serverId) {
          await pricingRequestsApi.update(target.serverId, payload);
        }
      } catch (error) {
        console.error("Pricing request update failed:", error);
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === editingId
            ? {
                ...request,
                customer,
                email,
                phone,
                company,
                product,
                quantity,
                currentPrice: `₹${currentPrice.toFixed(2)}`,
                requestedPrice: `₹${requestedPrice.toFixed(2)}`,
                status: form.status,
                notes,
              }
            : request
        )
      );
    } else {
      // POST /api/admin/pricing-requests best-effort, then local add.
      let serverId: string | undefined;
      try {
        const response = await pricingRequestsApi.create(payload);
        const data = (response.data ?? {}) as Record<string, unknown>;
        const rawId = data.requestId ?? data.pricingRequestId ?? data.id;
        if (rawId !== undefined && rawId !== null && String(rawId)) {
          serverId = String(rawId);
        }
      } catch (error) {
        console.error("Pricing request create failed:", error);
      }

      const highestRequestNumber = requests.reduce((max, request) => {
        const number = Number(request.requestNo.replace(/^PR/, ""));
        return Number.isFinite(number) ? Math.max(max, number) : max;
      }, 10000);

      const nextNumber = highestRequestNumber + 1;

      setRequests((current) => [
        ...current,
        {
          id: Date.now(),
          serverId,
          requestNo: `PR${nextNumber}`,
          customer,
          email,
          phone,
          company,
          product,
          quantity,
          currentPrice: `₹${currentPrice.toFixed(2)}`,
          requestedPrice: `₹${requestedPrice.toFixed(2)}`,
          status: form.status,
          createdAt: new Date().toISOString().split("T")[0],
          notes,
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

  const deleteRequest = async () => {
    if (deleteId === null) return;

    try {
      const target = requests.find((request) => request.id === deleteId);
      if (target?.serverId) await pricingRequestsApi.remove(target.serverId);
    } catch {
      // Best-effort: fall through to local removal.
    }

    setRequests((current) =>
      current.filter(
        (request) => request.id !== deleteId
      )
    );

    setDeleteId(null);
    showSuccess();
  };

  /* =====================================================
     STATUS
  ====================================================== */

  const updateStatus = async (
    id: number,
    status: RequestStatus
  ) => {
    try {
      const target = requests.find((request) => request.id === id);
      if (target?.serverId) await pricingRequestsApi.setStatus(target.serverId, status);
    } catch {
      // Best-effort: fall through to local toggle.
    }
    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
            }
          : request
      )
    );

    if (viewRequest?.id === id) {
      setViewRequest({
        ...viewRequest,
        status,
      });
    }

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

  return (
    <AdminLayout>
      <main className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

      {/* =================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-[#E4E8EF] bg-white px-4 sm:px-6 lg:px-8">

        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] hover:bg-[#F1F4F8]"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
            Pricing Requests
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage customer requests for special and wholesale pricing
          </p>
        </div>

        {/* No create/update pricing-request endpoint — disabled */}
        <button
          type="button"
          onClick={openCreate}
         
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Create Request
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
            onClick={() => router.push("/admin")}
            className="hover:text-[#1769F5]"
          >
            Dashboard
          </button>

          <span>/</span>

          <span className="font-medium text-[#566579]">
            Pricing Requests
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            title="Pending"
            value={pendingCount}
            icon={Clock3}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

          <StatCard
            title="Reviewed"
            value={reviewedCount}
            icon={Eye}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#3260B4]"
          />

          <StatCard
            title="Approved"
            value={approvedCount}
            icon={CheckCircle2}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Rejected"
            value={rejectedCount}
            icon={XCircle}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

        </section>

        {/* =================================================
            SEARCH / FILTER
        ================================================== */}

        <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 lg:max-w-[550px]">

              <Search
                size={16}
                className="shrink-0 text-[#8995A5]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search request, customer, company or product..."
                className="w-full bg-transparent px-2.5 text-[11px] outline-none placeholder:text-[#A0AAB8]"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-[#8995A5]"
                >
                  <X size={14} />
                </button>
              )}

            </div>

            <div className="flex gap-1.5 overflow-x-auto">

              {(
                [
                  "All",
                  "Pending",
                  "Reviewed",
                  "Approved",
                  "Rejected",
                ] as const
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStatusFilter(status)
                  }
                  className={`
                    shrink-0
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
            REQUEST TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>
              <h2 className="text-[13px] font-bold text-[#263650]">
                Pricing Request List
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredRequests.length} requests found
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

          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
                <DollarSign size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No pricing requests found
              </h3>

              <p className="mt-1 text-[10px] text-[#8995A5]">
                Try changing your search or filter.
              </p>

            </div>
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
                        Request
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Product
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Qty
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Current
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Requested
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

                    {filteredRequests.map(
                      (request) => (
                        <tr
                          key={request.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* REQUEST */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#3260B4]">
                                <DollarSign size={17} />
                              </div>

                              <div>

                                <p className="text-[11px] font-bold text-[#33415A]">
                                  {request.requestNo}
                                </p>

                                <p className="mt-1 text-[8px] text-[#8995A5]">
                                  {request.createdAt}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">

                            <p className="text-[10px] font-semibold text-[#52627A]">
                              {request.customer}
                            </p>

                            <p className="mt-1 text-[8px] text-[#8995A5]">
                              {request.company ||
                                "Individual"}
                            </p>

                          </td>

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <span className="block max-w-[180px] truncate text-[9px] font-semibold text-[#52627A]">
                              {request.product}
                            </span>

                          </td>

                          {/* QTY */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-semibold text-[#52627A]">
                              {request.quantity}
                            </span>

                          </td>

                          {/* CURRENT */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-semibold text-[#718096]">
                              {request.currentPrice}
                            </span>

                          </td>

                          {/* REQUESTED */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-bold text-[#1769F5]">
                              {request.requestedPrice}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                request.status
                              }
                            />

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1.5">

                              <button
                                type="button"
                                onClick={() =>
                                  setViewRequest(
                                    request
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E5EC] text-[#52627A] hover:bg-[#F4F6F9]"
                              >
                                <Eye size={13} />
                              </button>

                              {/* No create/update pricing-request endpoint — disabled */}
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    request
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
                                    request.id
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

              {/* =================================================
                  MOBILE LIST
              ================================================== */}

              <div className="divide-y divide-[#EDF0F4] md:hidden">

                {filteredRequests.map(
                  (request) => (
                    <div
                      key={request.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#3260B4]">
                          <DollarSign size={17} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="text-[11px] font-bold text-[#33415A]">
                                {request.requestNo}
                              </p>

                              <p className="mt-1 truncate text-[9px] font-semibold text-[#52627A]">
                                {request.product}
                              </p>

                              <p className="mt-1 truncate text-[8px] text-[#8995A5]">
                                {request.customer}
                              </p>

                            </div>

                            <StatusBadge
                              status={
                                request.status
                              }
                            />

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <InfoSmall
                              label="Quantity"
                              value={String(
                                request.quantity
                              )}
                            />

                            <InfoSmall
                              label="Current Price"
                              value={
                                request.currentPrice
                              }
                            />

                            <InfoSmall
                              label="Requested Price"
                              value={
                                request.requestedPrice
                              }
                            />

                            <InfoSmall
                              label="Created"
                              value={
                                request.createdAt
                              }
                            />

                          </div>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewRequest(
                                  request
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[9px] font-semibold text-[#52627A]"
                            >
                              <Eye size={12} />
                              View
                            </button>

                            {/* No create/update pricing-request endpoint — disabled */}
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  request
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
                                  request.id
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

      {/* =====================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() => {
              setShowForm(false);
              setErrors({});
            }}
          />

          <div className="relative max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Pricing Request"
                    : "Create Pricing Request"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Enter customer and pricing request details
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
                  label="Customer Name"
                  placeholder="Enter customer name"
                  value={form.customer}
                  onChange={(value) => updateFormField("customer", value)}
                  error={errors.customer}
                />

                <FormInput
                  label="Email Address"
                  placeholder="Enter email address"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateFormField("email", value)}
                  error={errors.email}
                />

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Phone Number"
                  placeholder="Enter phone number"
                  type="tel"
                  value={form.phone}
                  onChange={(value) => updateFormField("phone", value)}
                  error={errors.phone}
                />

                <FormInput
                  label="Company"
                  placeholder="Enter company name"
                  value={form.company}
                  onChange={(value) => updateFormField("company", value)}
                  error={errors.company}
                />

              </div>

              <FormInput
                label="Product / Requirement"
                placeholder="Enter product or requirement"
                value={form.product}
                onChange={(value) => updateFormField("product", value)}
                error={errors.product}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <FormInput
                  label="Quantity"
                  placeholder="Quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(value) => updateFormField("quantity", value)}
                  error={errors.quantity}
                  min="1"
                  step="1"
                />

                <FormInput
                  label="Current Price"
                  placeholder="Current price"
                  type="number"
                  value={form.currentPrice}
                  onChange={(value) => updateFormField("currentPrice", value)}
                  error={errors.currentPrice}
                  min="0.01"
                  step="0.01"
                />

                <FormInput
                  label="Requested Price"
                  placeholder="Requested price"
                  type="number"
                  value={form.requestedPrice}
                  onChange={(value) => updateFormField("requestedPrice", value)}
                  error={errors.requestedPrice}
                  min="0.01"
                  step="0.01"
                />

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
                          .value as RequestStatus,
                    })
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                >
                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Reviewed">
                    Reviewed
                  </option>

                  <option value="Approved">
                    Approved
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>
                </select>

              </div>

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) => updateFormField("notes", event.target.value)}
                  placeholder="Add notes..."
                  rows={4}
                  maxLength={1000}
                  className="mt-1.5 w-full resize-none rounded-lg border border-[#DCE2EA] bg-white px-3 py-2.5 text-[10px] outline-none focus:border-[#1769F5]"
                />

              </div>

            </div>

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
                onClick={saveRequest}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Send size={13} />

                {editingId !== null
                  ? "Update Request"
                  : "Save Request"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          VIEW MODAL
      ====================================================== */}

      {viewRequest && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() =>
              setViewRequest(null)
            }
          />

          <div className="relative max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                  <DollarSign size={18} />
                </div>

                <div>

                  <h2 className="text-[13px] font-bold text-[#263650]">
                    {viewRequest.requestNo}
                  </h2>

                  <p className="mt-1 text-[8px] text-[#8995A5]">
                    Created {viewRequest.createdAt}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewRequest(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="space-y-4 p-5">

              <div className="flex items-center justify-between">

                <StatusBadge
                  status={
                    viewRequest.status
                  }
                />

                <div className="text-right">

                  <p className="text-[8px] text-[#8995A5]">
                    Requested Price
                  </p>

                  <p className="mt-1 text-[14px] font-bold text-[#1769F5]">
                    {viewRequest.requestedPrice}
                  </p>

                </div>

              </div>

              {/* PRODUCT */}

              <div className="rounded-xl bg-[#F7F9FC] p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                    <Package size={17} />
                  </div>

                  <div>

                    <p className="text-[8px] uppercase tracking-wide text-[#98A3B2]">
                      Product / Requirement
                    </p>

                    <p className="mt-1 text-[11px] font-bold text-[#33415A]">
                      {viewRequest.product}
                    </p>

                  </div>

                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">

                  <InfoSmall
                    label="Quantity"
                    value={String(
                      viewRequest.quantity
                    )}
                  />

                  <InfoSmall
                    label="Current Price"
                    value={
                      viewRequest.currentPrice
                    }
                  />

                  <InfoSmall
                    label="Requested"
                    value={
                      viewRequest.requestedPrice
                    }
                  />

                </div>

              </div>

              {/* CUSTOMER */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <DetailRow
                  icon={UserRound}
                  label="Customer"
                  value={
                    viewRequest.customer
                  }
                />

                <DetailRow
                  icon={Building2}
                  label="Company"
                  value={
                    viewRequest.company ||
                    "Individual"
                  }
                />

                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={
                    viewRequest.email
                  }
                />

                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={
                    viewRequest.phone
                  }
                />

              </div>

              {/* NOTES */}

              <div className="rounded-xl border border-[#E5E9EF] p-4">

                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                  Notes
                </p>

                <p className="mt-2 text-[10px] leading-5 text-[#66748B]">
                  {viewRequest.notes ||
                    "No notes added."}
                </p>

              </div>

              {/* STATUS */}

              <div>

                <p className="mb-2 text-[9px] font-semibold text-[#52627A]">
                  Update Status
                </p>

                <div className="flex flex-wrap gap-2">

                  {(
                    [
                      "Pending",
                      "Reviewed",
                      "Approved",
                      "Rejected",
                    ] as RequestStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        updateStatus(
                          viewRequest.id,
                          status
                        )
                      }
                      className={`
                        rounded-lg
                        px-3
                        py-2
                        text-[8px]
                        font-semibold
                        ${
                          viewRequest.status ===
                          status
                            ? "bg-[#1769F5] text-white"
                            : "bg-[#F3F5F8] text-[#66748B]"
                        }
                      `}
                    >
                      {status}
                    </button>
                  ))}

                </div>

              </div>

            </div>

            <div className="border-t border-[#E5E9EF] px-5 py-4">

              {/* No create/update pricing-request endpoint — disabled */}
              <button
                type="button"
                onClick={() => {
                  const selected =
                    viewRequest;

                  setViewRequest(null);
                  openEdit(selected);
                }}
               
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Pricing Request
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          DELETE MODAL
      ====================================================== */}

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
              Delete Pricing Request?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This pricing request will be
              permanently removed from the
              admin list.
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
                onClick={deleteRequest}
                className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D]"
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          SUCCESS
      ====================================================== */}

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
              Pricing request updated successfully.
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
  status: RequestStatus;
}) {
  const classes =
    status === "Pending"
      ? "bg-[#FFF5DF] text-[#C17B19]"
      : status === "Reviewed"
        ? "bg-[#EDF3FF] text-[#3260B4]"
        : status === "Approved"
          ? "bg-[#EAF8F0] text-[#249357]"
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
  min,
  step,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
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
        min={min}
        step={step}
        inputMode={
          type === "number"
            ? step === "1"
              ? "numeric"
              : "decimal"
            : undefined
        }
        onChange={(event) => {
          const nextValue = event.target.value;

          if (type === "number") {
            if (nextValue !== "" && !/^\d*(?:\.\d*)?$/.test(nextValue)) {
              return;
            }
          }

          onChange(nextValue);
        }}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${label}-error` : undefined}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] focus:ring-1 ${
          error
            ? "border-[#D85A5A] focus:border-[#D85A5A] focus:ring-[#D85A5A]/10"
            : "border-[#DCE2EA] focus:border-[#1769F5] focus:ring-[#1769F5]/10"
        }`}
      />

      {error && (
        <p id={`${label}-error`} className="mt-1 text-[8px] font-medium text-[#D85A5A]">
          {error}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   INFO SMALL
============================================================ */

function InfoSmall({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white px-3 py-2.5">

      <p className="text-[7px] uppercase tracking-wide text-[#9AA5B4]">
        {label}
      </p>

      <p className="mt-1 text-[9px] font-semibold text-[#52627A]">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start rounded-xl bg-[#F7F9FC] px-3 py-3">

      <div className="mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
        <Icon size={13} />
      </div>

      <div className="min-w-0">

        <p className="text-[7px] uppercase tracking-wide text-[#9AA5B4]">
          {label}
        </p>

        <p className="mt-1 break-words text-[9px] font-semibold text-[#52627A]">
          {value}
        </p>

      </div>

    </div>
  );
}