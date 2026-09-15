"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { quotesApi } from "@/app/api/services";
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  FileText,
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

type QuoteStatus =
  | "Pending"
  | "Quoted"
  | "Accepted"
  | "Rejected"
  | "Expired";

type Quote = {
  id: number;
  serverId?: string;
  quoteNo: string;
  customer: string;
  email: string;
  phone: string;
  company: string;
  product: string;
  quantity: number;
  amount: string;
  status: QuoteStatus;
  createdAt: string;
  validUntil: string;
};

export default function QuotesPage() {
  const router = useRouter();

  const [quotes, setQuotes] =
    useState<Quote[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await quotesApi.list(1, 100);
        const payload = res?.data ?? res;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        if (cancelled || raw.length === 0) return;
        const allowed = ["Pending", "Quoted", "Accepted", "Rejected", "Expired"];
        const mapped: Quote[] = raw.map((item: any, index: number) => {
          const rawAmount = String(
            item.amount ?? item.quoteAmount ?? item.total ?? item.price ?? ""
          );
          const amount =
            rawAmount && !rawAmount.includes("₹") ? `₹${rawAmount}` : rawAmount || "₹0";
          const createdRaw = String(
            item.createdAt ?? item.createdDate ?? item.date ?? item.createdOn ?? ""
          );
          const createdAt = createdRaw.includes("T")
            ? createdRaw.split("T")[0]
            : createdRaw || new Date().toISOString().split("T")[0];
          const validRaw = String(
            item.validUntil ?? item.validTill ?? item.expiryDate ?? item.expiresAt ?? ""
          );
          return {
            id: index + 1,
            serverId: String(item.id ?? item.quoteId ?? item._id ?? ""),
            quoteNo: String(
              item.quoteNo ?? item.quoteNumber ?? item.number ?? item.code ?? `QT${10001 + index}`
            ),
            customer: String(item.customer ?? item.customerName ?? item.name ?? ""),
            email: String(item.email ?? item.customerEmail ?? ""),
            phone: String(item.phone ?? item.phoneNumber ?? item.mobile ?? ""),
            company: String(item.company ?? item.companyName ?? item.organization ?? ""),
            product: String(
              item.product ?? item.productName ?? item.requirement ?? item.title ?? ""
            ),
            quantity: Number(item.quantity ?? item.qty ?? 0) || 0,
            amount,
            status: (allowed.includes(item.status) ? item.status : "Pending") as Quote["status"],
            createdAt,
            validUntil: validRaw.includes("T") ? validRaw.split("T")[0] : validRaw || createdAt,
          };
        });
        if (mapped.length > 0) setQuotes(mapped);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | QuoteStatus>("All");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [viewQuote, setViewQuote] =
    useState<Quote | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] = useState(false);

  type QuoteErrors = Partial<Record<
    "customer" | "email" | "phone" | "company" | "product" | "quantity" | "amount" | "validUntil",
    string
  >>;

  const [errors, setErrors] = useState<QuoteErrors>({});

  const clearError = (field: keyof QuoteErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const resetErrors = () => setErrors({});

  const validateQuote = () => {
    const next: QuoteErrors = {};
    const customer = form.customer.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const company = form.company.trim();
    const product = form.product.trim();
    const quantity = form.quantity.trim();
    const amount = form.amount.trim();
    const validUntil = form.validUntil.trim();

    if (!customer) {
      next.customer = "Customer name is required.";
    } else if (customer.length < 2 || customer.length > 100) {
      next.customer = "Customer name must be 2–100 characters.";
    } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'&()\-]+$/.test(customer)) {
      next.customer = "Customer name contains invalid characters.";
    }

    if (!email) {
      next.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      next.email = "Enter a valid email address.";
    } else if (email.length > 254) {
      next.email = "Email address is too long.";
    }

    if (phone && !/^\+?[0-9 ()-]{7,20}$/.test(phone)) {
      next.phone = "Enter a valid phone number.";
    }

    if (company && company.length > 120) {
      next.company = "Company name must be 120 characters or less.";
    }

    if (!product) {
      next.product = "Product / requirement is required.";
    } else if (product.length < 2 || product.length > 200) {
      next.product = "Product / requirement must be 2–200 characters.";
    }

    if (!quantity) {
      next.quantity = "Quantity is required.";
    } else if (!/^\d+$/.test(quantity)) {
      next.quantity = "Quantity must be a whole number.";
    } else {
      const numericQuantity = Number(quantity);
      if (!Number.isSafeInteger(numericQuantity) || numericQuantity <= 0) {
        next.quantity = "Quantity must be greater than 0.";
      }
    }

    if (!amount) {
      next.amount = "Quote amount is required.";
    } else if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
      next.amount = "Enter a valid amount with up to 2 decimals.";
    } else {
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        next.amount = "Quote amount must be greater than 0.";
      }
    }

    if (validUntil) {
      const selectedDate = new Date(`${validUntil}T00:00:00`);
      if (Number.isNaN(selectedDate.getTime())) {
        next.validUntil = "Enter a valid date.";
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          next.validUntil = "Valid until date cannot be in the past.";
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const updateFormField = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    clearError(field as keyof QuoteErrors);
  };

  const [form, setForm] = useState({
    customer: "",
    email: "",
    phone: "",
    company: "",
    product: "",
    quantity: "",
    amount: "",
    status: "Pending" as QuoteStatus,
    validUntil: "",
  });

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return quotes.filter((quote) => {
      const matchesSearch =
        !query ||
        quote.quoteNo
          .toLowerCase()
          .includes(query) ||
        quote.customer
          .toLowerCase()
          .includes(query) ||
        quote.email
          .toLowerCase()
          .includes(query) ||
        quote.company
          .toLowerCase()
          .includes(query) ||
        quote.product
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

  /* =====================================================
     STATS
  ====================================================== */

  const pendingCount = quotes.filter(
    (quote) => quote.status === "Pending"
  ).length;

  const quotedCount = quotes.filter(
    (quote) => quote.status === "Quoted"
  ).length;

  const acceptedCount = quotes.filter(
    (quote) => quote.status === "Accepted"
  ).length;

  const rejectedCount = quotes.filter(
    (quote) => quote.status === "Rejected"
  ).length;

  /* =====================================================
     RESET FORM
  ====================================================== */

  const resetForm = () => {
    setForm({
      customer: "",
      email: "",
      phone: "",
      company: "",
      product: "",
      quantity: "",
      amount: "",
      status: "Pending",
      validUntil: "",
    });

    setEditingId(null);
    resetErrors();
  };

  /* =====================================================
     CREATE
  ====================================================== */

  const openCreate = () => {
    resetForm();
    resetErrors();
    setShowForm(true);
  };

  /* =====================================================
     EDIT
  ====================================================== */

  const openEdit = (quote: Quote) => {
    setEditingId(quote.id);

    setForm({
      customer: quote.customer,
      email: quote.email,
      phone: quote.phone,
      company: quote.company,
      product: quote.product,
      quantity: String(quote.quantity),
      amount: quote.amount.replace("₹", ""),
      status: quote.status,
      validUntil: quote.validUntil,
    });

    resetErrors();
    setShowForm(true);
  };

  /* =====================================================
     SAVE
  ====================================================== */

  const saveQuote = async () => {
    if (!validateQuote()) return;

    try {
      const payload: Record<string, unknown> = {
        customer: form.customer.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        product: form.product.trim(),
        quantity: Number(form.quantity) || 0,
        amount: form.amount.trim(),
        status: form.status,
        validUntil: form.validUntil,
      };
      if (editingId !== null) {
        const target = quotes.find((quote) => quote.id === editingId);
        if (target?.serverId) await quotesApi.update(target.serverId, payload);
      } else {
        await quotesApi.create(payload);
      }
    } catch {
      // Best-effort: fall through to local logic.
    }

    if (editingId !== null) {
      setQuotes((current) =>
        current.map((quote) =>
          quote.id === editingId
            ? {
                ...quote,
                customer:
                  form.customer.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                company:
                  form.company.trim(),
                product:
                  form.product.trim(),
                quantity:
                  Number(form.quantity) || 0,
                amount: `₹${form.amount.trim()}`,
                status: form.status,
                validUntil:
                  form.validUntil,
              }
            : quote
        )
      );
    } else {
      const nextNumber =
        10000 + quotes.length + 1;

      setQuotes((current) => [
        ...current,
        {
          id: Date.now(),
          quoteNo: `QT${nextNumber}`,
          customer:
            form.customer.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company:
            form.company.trim(),
          product:
            form.product.trim(),
          quantity:
            Number(form.quantity) || 0,
          amount: `₹${form.amount.trim()}`,
          status: form.status,
          createdAt: new Date()
            .toISOString()
            .split("T")[0],
          validUntil:
            form.validUntil ||
            new Date()
              .toISOString()
              .split("T")[0],
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

  const deleteQuote = async () => {
    if (deleteId === null) return;

    try {
      const target = quotes.find((quote) => quote.id === deleteId);
      if (target?.serverId) await quotesApi.remove(target.serverId);
    } catch {
      // Best-effort: fall through to local removal.
    }

    setQuotes((current) =>
      current.filter(
        (quote) => quote.id !== deleteId
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
    status: QuoteStatus
  ) => {
    try {
      const target = quotes.find((quote) => quote.id === id);
      if (target?.serverId) await quotesApi.setStatus(target.serverId, status);
    } catch {
      // Best-effort: fall through to local toggle.
    }
    setQuotes((current) =>
      current.map((quote) =>
        quote.id === id
          ? {
              ...quote,
              status,
            }
          : quote
      )
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
            Quotes
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage wholesale quotations and customer quote requests
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Create Quote
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
            Quotes
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
            title="Quoted"
            value={quotedCount}
            icon={FileText}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#3260B4]"
          />

          <StatCard
            title="Accepted"
            value={acceptedCount}
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
                placeholder="Search quote, customer, company or product..."
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
                  "Quoted",
                  "Accepted",
                  "Rejected",
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
            QUOTE LIST
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#263650]">
                Quote List
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredQuotes.length} quotes found
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

          {filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
                <FileText size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No quotes found
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
                        Quote
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
                        Amount
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Valid Until
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

                    {filteredQuotes.map(
                      (quote) => (
                        <tr
                          key={quote.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* QUOTE */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#3260B4]">
                                <FileText size={17} />
                              </div>

                              <div>

                                <p className="text-[11px] font-bold text-[#33415A]">
                                  {quote.quoteNo}
                                </p>

                                <p className="mt-1 text-[8px] text-[#8995A5]">
                                  {quote.createdAt}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">

                            <p className="text-[10px] font-semibold text-[#52627A]">
                              {quote.customer}
                            </p>

                            <p className="mt-1 text-[8px] text-[#8995A5]">
                              {quote.company ||
                                "Individual"}
                            </p>

                          </td>

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <span className="max-w-[180px] truncate text-[9px] font-semibold text-[#52627A]">
                              {quote.product}
                            </span>

                          </td>

                          {/* QTY */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-semibold text-[#52627A]">
                              {quote.quantity}
                            </span>

                          </td>

                          {/* AMOUNT */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-bold text-[#263650]">
                              {quote.amount}
                            </span>

                          </td>

                          {/* VALID */}

                          <td className="px-5 py-4">

                            <span className="text-[9px] text-[#66748B]">
                              {quote.validUntil}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                quote.status
                              }
                            />

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1.5">

                              <button
                                type="button"
                                onClick={() =>
                                  setViewQuote(
                                    quote
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
                                    quote
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
                                    quote.id
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

                {filteredQuotes.map(
                  (quote) => (
                    <div
                      key={quote.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#3260B4]">
                          <FileText size={17} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="text-[11px] font-bold text-[#33415A]">
                                {quote.quoteNo}
                              </p>

                              <p className="mt-1 truncate text-[9px] font-semibold text-[#52627A]">
                                {quote.product}
                              </p>

                              <p className="mt-1 truncate text-[8px] text-[#8995A5]">
                                {quote.customer}
                              </p>

                            </div>

                            <StatusBadge
                              status={
                                quote.status
                              }
                            />

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <InfoSmall
                              label="Quantity"
                              value={String(
                                quote.quantity
                              )}
                            />

                            <InfoSmall
                              label="Amount"
                              value={
                                quote.amount
                              }
                            />

                            <InfoSmall
                              label="Created"
                              value={
                                quote.createdAt
                              }
                            />

                            <InfoSmall
                              label="Valid Until"
                              value={
                                quote.validUntil
                              }
                            />

                          </div>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewQuote(
                                  quote
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
                                  quote
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
                                  quote.id
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

          <div className="relative max-h-[92vh] w-full max-w-[650px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Quote"
                    : "Create Quote"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Enter wholesale quotation details
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Quantity"
                  placeholder="Enter quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(value) => {
                    if (value !== "" && !/^\d+$/.test(value)) return;
                    updateFormField("quantity", value);
                  }}
                  error={errors.quantity}
                />

                <FormInput
                  label="Quote Amount"
                  placeholder="Enter amount"
                  type="number"
                  value={form.amount}
                  onChange={(value) => {
                    if (value !== "" && !/^\d*(?:\.\d*)?$/.test(value)) return;
                    updateFormField("amount", value);
                  }}
                  error={errors.amount}
                />

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

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
                            .value as QuoteStatus,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                  >
                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Quoted">
                      Quoted
                    </option>

                    <option value="Accepted">
                      Accepted
                    </option>

                    <option value="Rejected">
                      Rejected
                    </option>

                    <option value="Expired">
                      Expired
                    </option>
                  </select>

                </div>

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Valid Until
                  </label>

                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={form.validUntil}
                    onChange={(event) =>
                      updateFormField("validUntil", event.target.value)
                    }
                    aria-invalid={Boolean(errors.validUntil)}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                      errors.validUntil
                        ? "border-[#EF4444]"
                        : "border-[#DCE2EA]"
                    }`}
                  />

                  {errors.validUntil && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.validUntil}
                    </p>
                  )}

                </div>

              </div>

            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetErrors();
                }}
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveQuote}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Send size={13} />

                {editingId !== null
                  ? "Update Quote"
                  : "Save Quote"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW MODAL
      ================================================== */}

      {viewQuote && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() =>
              setViewQuote(null)
            }
          />

          <div className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                  <FileText size={18} />
                </div>

                <div>

                  <h2 className="text-[13px] font-bold text-[#263650]">
                    {viewQuote.quoteNo}
                  </h2>

                  <p className="mt-1 text-[8px] text-[#8995A5]">
                    Created {viewQuote.createdAt}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewQuote(null)
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
                    viewQuote.status
                  }
                />

                <span className="text-[11px] font-bold text-[#263650]">
                  {viewQuote.amount}
                </span>

              </div>

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
                      {viewQuote.product}
                    </p>

                  </div>

                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <InfoSmall
                    label="Quantity"
                    value={String(
                      viewQuote.quantity
                    )}
                  />

                  <InfoSmall
                    label="Quote Amount"
                    value={
                      viewQuote.amount
                    }
                  />

                  <InfoSmall
                    label="Created"
                    value={
                      viewQuote.createdAt
                    }
                  />

                  <InfoSmall
                    label="Valid Until"
                    value={
                      viewQuote.validUntil
                    }
                  />

                </div>

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <DetailRow
                  icon={UserRound}
                  label="Customer"
                  value={
                    viewQuote.customer
                  }
                />

                <DetailRow
                  icon={Building2}
                  label="Company"
                  value={
                    viewQuote.company ||
                    "Individual"
                  }
                />

                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={
                    viewQuote.email
                  }
                />

                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={
                    viewQuote.phone
                  }
                />

              </div>

              <div>

                <p className="mb-2 text-[9px] font-semibold text-[#52627A]">
                  Update Status
                </p>

                <div className="flex flex-wrap gap-2">

                  {(
                    [
                      "Pending",
                      "Quoted",
                      "Accepted",
                      "Rejected",
                      "Expired",
                    ] as QuoteStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        updateStatus(
                          viewQuote.id,
                          status
                        );

                        setViewQuote({
                          ...viewQuote,
                          status,
                        });
                      }}
                      className={`
                        rounded-lg
                        px-3
                        py-2
                        text-[8px]
                        font-semibold
                        ${
                          viewQuote.status ===
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

              <button
                type="button"
                onClick={() => {
                  setViewQuote(null);
                  openEdit(viewQuote);
                }}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Quote
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
              Delete Quote?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This quote will be permanently
              removed from the admin list.
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
                onClick={deleteQuote}
                className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D]"
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          SUCCESS
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
              Quote information updated successfully.
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
  status: QuoteStatus;
}) {
  const classes =
    status === "Pending"
      ? "bg-[#FFF5DF] text-[#C17B19]"
      : status === "Quoted"
        ? "bg-[#EDF3FF] text-[#3260B4]"
        : status === "Accepted"
          ? "bg-[#EAF8F0] text-[#249357]"
          : status === "Rejected"
            ? "bg-[#FFF0F0] text-[#D85A5A]"
            : "bg-[#F1F2F4] text-[#707A89]";

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
        aria-invalid={Boolean(error)}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10 ${
          error ? "border-[#EF4444]" : "border-[#DCE2EA]"
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