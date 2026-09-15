"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { enquiriesApi } from "@/app/api/services";
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  MessageSquare,
  UserRound,
  Mail,
  Phone,
  Building2,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock3,
  Check,
  XCircle,
  Send,
} from "lucide-react";

type EnquiryStatus =
  | "New"
  | "In Progress"
  | "Resolved"
  | "Closed";

type EnquiryPriority =
  | "Low"
  | "Medium"
  | "High";

type Enquiry = {
  id: number;
  serverId?: string;
  enquiryNo: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  priority: EnquiryPriority;
  createdAt: string;
};

export default function EnquiriesPage() {
  const router = useRouter();

  const [enquiries, setEnquiries] =
    useState<Enquiry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await enquiriesApi.list(1, 100);
        const payload = res?.data ?? res;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        if (cancelled) return;
        if (raw.length === 0) {
          setEnquiries([]);
          return;
        }
        const allowedStatus = ["New", "In Progress", "Resolved", "Closed"];
        const allowedPriority = ["Low", "Medium", "High"];
        const mapped: Enquiry[] = raw.map((item: any, index: number) => {
          const createdRaw = String(
            item.createdAt ?? item.createdDate ?? item.date ?? item.createdOn ?? ""
          );
          return {
            id: index + 1,
            serverId: String(item.id ?? item.enquiryId ?? item._id ?? ""),
            enquiryNo: String(
              item.enquiryNo ?? item.enquiryNumber ?? item.number ?? item.code ?? `ENQ${10001 + index}`
            ),
            name: String(item.name ?? item.customer ?? item.customerName ?? ""),
            email: String(item.email ?? item.customerEmail ?? ""),
            phone: String(item.phone ?? item.phoneNumber ?? item.mobile ?? ""),
            company: String(item.company ?? item.companyName ?? item.organization ?? ""),
            subject: String(item.subject ?? item.title ?? ""),
            message: String(item.message ?? item.comment ?? item.description ?? ""),
            status: (allowedStatus.includes(item.status) ? item.status : "New") as Enquiry["status"],
            priority: (allowedPriority.includes(item.priority)
              ? item.priority
              : "Medium") as Enquiry["priority"],
            createdAt: createdRaw.includes("T")
              ? createdRaw.split("T")[0]
              : createdRaw || new Date().toISOString().split("T")[0],
          };
        });
        setEnquiries(mapped);
      } catch {
        if (!cancelled) setEnquiries([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | EnquiryStatus>("All");

  const [priorityFilter, setPriorityFilter] =
    useState<"All" | EnquiryPriority>("All");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [viewEnquiry, setViewEnquiry] =
    useState<Enquiry | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
    status: "New" as EnquiryStatus,
    priority: "Medium" as EnquiryPriority,
  });

  type FormErrors = {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    subject?: string;
    message?: string;
  };

  const [formErrors, setFormErrors] =
    useState<FormErrors>({});

  const [formError, setFormError] = useState("");

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enquiries.filter((enquiry) => {
      const matchesSearch =
        !query ||
        enquiry.enquiryNo
          .toLowerCase()
          .includes(query) ||
        enquiry.name
          .toLowerCase()
          .includes(query) ||
        enquiry.email
          .toLowerCase()
          .includes(query) ||
        enquiry.phone
          .toLowerCase()
          .includes(query) ||
        enquiry.company
          .toLowerCase()
          .includes(query) ||
        enquiry.subject
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        enquiry.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        enquiry.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    enquiries,
    search,
    statusFilter,
    priorityFilter,
  ]);

  /* =====================================================
     STATS
  ====================================================== */

  const newCount = enquiries.filter(
    (item) => item.status === "New"
  ).length;

  const inProgressCount = enquiries.filter(
    (item) => item.status === "In Progress"
  ).length;

  const resolvedCount = enquiries.filter(
    (item) => item.status === "Resolved"
  ).length;

  const closedCount = enquiries.filter(
    (item) => item.status === "Closed"
  ).length;

  /* =====================================================
     RESET FORM
  ====================================================== */

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      subject: "",
      message: "",
      status: "New",
      priority: "Medium",
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

  const openEdit = (enquiry: Enquiry) => {
    setEditingId(enquiry.id);

    setForm({
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      company: enquiry.company,
      subject: enquiry.subject,
      message: enquiry.message,
      status: enquiry.status,
      priority: enquiry.priority,
    });

    setShowForm(true);
  };

  /* =====================================================
     VALIDATION
  ====================================================== */

  const validateForm = () => {
    const errors: FormErrors = {};

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const company = form.company.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    /* CUSTOMER NAME */
    if (!name) {
      errors.name = "Customer name is required.";
    } else if (name.length < 2) {
      errors.name = "Customer name must be at least 2 characters.";
    } else if (name.length > 80) {
      errors.name = "Customer name cannot exceed 80 characters.";
    } else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) {
      errors.name =
        "Use only letters, spaces, apostrophes, periods or hyphens.";
    }

    /* EMAIL */
    if (!email) {
      errors.email = "Email address is required.";
    } else if (email.length > 120) {
      errors.email = "Email address cannot exceed 120 characters.";
    } else if (
      !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(email)
    ) {
      errors.email = "Enter a valid email address.";
    }

    /* PHONE - optional, but validate when entered */
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, "");

      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        errors.phone =
          "Phone number must contain 10 to 15 digits.";
      } else if (!/^[+0-9()\-\s]+$/.test(phone)) {
        errors.phone =
          "Enter a valid phone number.";
      }
    }

    /* COMPANY - optional */
    if (company) {
      if (company.length < 2) {
        errors.company =
          "Company name must be at least 2 characters.";
      } else if (company.length > 100) {
        errors.company =
          "Company name cannot exceed 100 characters.";
      } else if (
        !/^[A-Za-z0-9][A-Za-z0-9 &.'()\-]*$/.test(company)
      ) {
        errors.company =
          "Use only letters, numbers, spaces and basic punctuation.";
      }
    }

    /* SUBJECT */
    if (!subject) {
      errors.subject = "Subject is required.";
    } else if (subject.length < 3) {
      errors.subject = "Subject must be at least 3 characters.";
    } else if (subject.length > 150) {
      errors.subject = "Subject cannot exceed 150 characters.";
    }

    /* MESSAGE */
    if (!message) {
      errors.message = "Message is required.";
    } else if (message.length < 10) {
      errors.message = "Message must be at least 10 characters.";
    } else if (message.length > 2000) {
      errors.message = "Message cannot exceed 2000 characters.";
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

  const saveEnquiry = async () => {
    if (!validateForm()) {
      return;
    }

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const company = form.company.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    const payload = {
      name,
      email,
      phone,
      company,
      subject,
      message,
      status: form.status,
      priority: form.priority,
    };

    if (editingId !== null) {
      // PUT /api/admin/enquiries/{id} best-effort, then local update.
      try {
        const target = enquiries.find((enquiry) => enquiry.id === editingId);
        if (target?.serverId) {
          await enquiriesApi.update(target.serverId, payload);
        }
      } catch (error) {
        console.error("Enquiry update failed:", error);
      }

      setEnquiries((current) =>
        current.map((enquiry) =>
          enquiry.id === editingId
            ? {
                ...enquiry,
                ...payload,
              }
            : enquiry
        )
      );
    } else {
      // POST /api/admin/enquiries best-effort, then local add.
      let serverId: string | undefined;
      try {
        const response = await enquiriesApi.create(payload);
        const data = (response.data ?? {}) as Record<string, unknown>;
        const rawId = data.enquiryId ?? data.id;
        if (rawId !== undefined && rawId !== null && String(rawId)) {
          serverId = String(rawId);
        }
      } catch (error) {
        console.error("Enquiry create failed:", error);
      }

      const nextNumber =
        10000 + enquiries.length + 1;

      setEnquiries((current) => [
        ...current,
        {
          id: Date.now(),
          serverId,
          enquiryNo: `ENQ${nextNumber}`,
          ...payload,
          createdAt: new Date()
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

  const deleteEnquiry = async () => {
    if (deleteId === null) return;

    try {
      const target = enquiries.find((item) => item.id === deleteId);
      if (target?.serverId) await enquiriesApi.remove(target.serverId);
    } catch {
      // Best-effort: fall through to local removal.
    }

    setEnquiries((current) =>
      current.filter(
        (item) => item.id !== deleteId
      )
    );

    setDeleteId(null);
    showSuccess();
  };

  /* =====================================================
     STATUS UPDATE
  ====================================================== */

  const updateStatus = async (
    id: number,
    status: EnquiryStatus
  ) => {
    try {
      const target = enquiries.find((enquiry) => enquiry.id === id);
      if (target?.serverId) await enquiriesApi.setStatus(target.serverId, status);
    } catch {
      // Best-effort: fall through to local toggle.
    }
    setEnquiries((current) =>
      current.map((enquiry) =>
        enquiry.id === id
          ? { ...enquiry, status }
          : enquiry
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
            Enquiries
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage customer enquiries and support requests
          </p>
        </div>

        {/* No create/update enquiry endpoint — disabled */}
        <button
          type="button"
          onClick={openCreate}
         
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Add Enquiry
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
            Enquiries
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            title="New Enquiries"
            value={newCount}
            icon={MessageSquare}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#3260B4]"
          />

          <StatCard
            title="In Progress"
            value={inProgressCount}
            icon={Clock3}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

          <StatCard
            title="Resolved"
            value={resolvedCount}
            icon={CheckCircle2}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Closed"
            value={closedCount}
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

            <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 lg:max-w-[500px]">

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
                placeholder="Search enquiry, customer, email or subject..."
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

            {/* STATUS */}

            <div className="flex gap-1.5 overflow-x-auto">

              {(
                [
                  "All",
                  "New",
                  "In Progress",
                  "Resolved",
                  "Closed",
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

            {/* PRIORITY */}

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as
                    | "All"
                    | EnquiryPriority
                )
              }
              className="h-9 rounded-lg border border-[#DCE2EA] bg-white px-3 text-[9px] font-semibold text-[#52627A] outline-none focus:border-[#1769F5]"
            >
              <option value="All">
                All Priority
              </option>

              <option value="High">
                High
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Low">
                Low
              </option>
            </select>

          </div>

        </section>

        {/* =================================================
            ENQUIRY LIST
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#263650]">
                Enquiry List
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredEnquiries.length} enquiries found
              </p>

            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setPriorityFilter("All");
              }}
              className="text-[9px] font-semibold text-[#1769F5] hover:underline"
            >
              Clear Filters
            </button>

          </div>

          {filteredEnquiries.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
                <MessageSquare size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No enquiries found
              </h3>

              <p className="mt-1 text-[10px] text-[#8995A5]">
                Try changing your search or filters.
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
                        Enquiry
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Subject
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Priority
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Created
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

                    {filteredEnquiries.map(
                      (enquiry) => (
                        <tr
                          key={enquiry.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* ENQUIRY */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#3260B4]">
                                <MessageSquare size={17} />
                              </div>

                              <div className="min-w-0">

                                <p className="text-[11px] font-bold text-[#33415A]">
                                  {enquiry.enquiryNo}
                                </p>

                                <p className="mt-1 max-w-[190px] truncate text-[8px] text-[#8995A5]">
                                  {enquiry.message}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">

                            <div>

                              <p className="text-[10px] font-semibold text-[#52627A]">
                                {enquiry.name}
                              </p>

                              <p className="mt-1 text-[8px] text-[#8995A5]">
                                {enquiry.company ||
                                  "Individual"}
                              </p>

                            </div>

                          </td>

                          {/* SUBJECT */}

                          <td className="px-5 py-4">

                            <span className="max-w-[180px] truncate text-[9px] font-semibold text-[#52627A]">
                              {enquiry.subject}
                            </span>

                          </td>

                          {/* PRIORITY */}

                          <td className="px-5 py-4">

                            <PriorityBadge
                              priority={
                                enquiry.priority
                              }
                            />

                          </td>

                          {/* CREATED */}

                          <td className="px-5 py-4">

                            <span className="text-[9px] text-[#66748B]">
                              {enquiry.createdAt}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                enquiry.status
                              }
                            />

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1.5">

                              <button
                                type="button"
                                onClick={() =>
                                  setViewEnquiry(
                                    enquiry
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E5EC] text-[#52627A] hover:bg-[#F4F6F9]"
                              >
                                <Eye size={13} />
                              </button>

                              {/* No create/update enquiry endpoint — disabled */}
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    enquiry
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
                                    enquiry.id
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
                  MOBILE
              ================================================== */}

              <div className="divide-y divide-[#EDF0F4] md:hidden">

                {filteredEnquiries.map(
                  (enquiry) => (
                    <div
                      key={enquiry.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#3260B4]">
                          <MessageSquare size={17} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="text-[11px] font-bold text-[#33415A]">
                                {enquiry.enquiryNo}
                              </p>

                              <p className="mt-1 truncate text-[9px] font-semibold text-[#52627A]">
                                {enquiry.subject}
                              </p>

                              <p className="mt-1 truncate text-[8px] text-[#8995A5]">
                                {enquiry.name}
                              </p>

                            </div>

                            <StatusBadge
                              status={
                                enquiry.status
                              }
                            />

                          </div>

                          <div className="mt-3 flex items-center gap-2">

                            <PriorityBadge
                              priority={
                                enquiry.priority
                              }
                            />

                            <span className="text-[8px] text-[#8995A5]">
                              {enquiry.createdAt}
                            </span>

                          </div>

                          <p className="mt-3 line-clamp-2 text-[9px] leading-5 text-[#66748B]">
                            {enquiry.message}
                          </p>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewEnquiry(
                                  enquiry
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[9px] font-semibold text-[#52627A]"
                            >
                              <Eye size={12} />
                              View
                            </button>

                            {/* No create/update enquiry endpoint — disabled */}
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  enquiry
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
                                  enquiry.id
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
              resetForm();
            }}
          />

          <div className="relative max-h-[92vh] w-full max-w-[650px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Enquiry"
                    : "Add Enquiry"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Enter customer enquiry information
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            {/* FORM */}

            <div className="space-y-4 p-5">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Customer Name"
                  placeholder="Enter customer name"
                  value={form.name}
                  error={formErrors.name}
                  onChange={(value) => {
                    setForm({
                      ...form,
                      name: value.slice(0, 80),
                    });
                    setFormErrors((current) => ({
                      ...current,
                      name: undefined,
                    }));
                    setFormError("");
                  }}
                />

                <FormInput
                  label="Email Address"
                  placeholder="Enter email address"
                  type="email"
                  value={form.email}
                  error={formErrors.email}
                  onChange={(value) => {
                    setForm({
                      ...form,
                      email: value.slice(0, 120),
                    });
                    setFormErrors((current) => ({
                      ...current,
                      email: undefined,
                    }));
                    setFormError("");
                  }}
                />

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Phone Number"
                  placeholder="Enter phone number"
                  type="tel"
                  value={form.phone}
                  error={formErrors.phone}
                  onChange={(value) => {
                    const cleaned = value
                      .replace(/[^0-9+()\-\s]/g, "")
                      .slice(0, 20);

                    setForm({
                      ...form,
                      phone: cleaned,
                    });
                    setFormErrors((current) => ({
                      ...current,
                      phone: undefined,
                    }));
                    setFormError("");
                  }}
                />

                <FormInput
                  label="Company"
                  placeholder="Enter company name"
                  value={form.company}
                  error={formErrors.company}
                  onChange={(value) => {
                    setForm({
                      ...form,
                      company: value.slice(0, 100),
                    });
                    setFormErrors((current) => ({
                      ...current,
                      company: undefined,
                    }));
                    setFormError("");
                  }}
                />

              </div>

              <FormInput
                label="Subject"
                placeholder="Enter enquiry subject"
                value={form.subject}
                error={formErrors.subject}
                onChange={(value) => {
                  setForm({
                    ...form,
                    subject: value.slice(0, 150),
                  });
                  setFormErrors((current) => ({
                    ...current,
                    subject: undefined,
                  }));
                  setFormError("");
                }}
              />

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Message
                </label>

                <textarea
                  value={form.message}
                  onChange={(event) => {
                    setForm({
                      ...form,
                      message: event.target.value.slice(0, 2000),
                    });
                    setFormErrors((current) => ({
                      ...current,
                      message: undefined,
                    }));
                    setFormError("");
                  }}
                  placeholder="Enter enquiry message"
                  rows={5}
                  maxLength={2000}
                  aria-invalid={!!formErrors.message}
                  className={`mt-1.5 w-full resize-none rounded-lg border px-3 py-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] ${
                    formErrors.message
                      ? "border-[#EF4444] bg-[#FFF8F8]"
                      : "border-[#DCE2EA]"
                  }`}
                />

                {formErrors.message && (
                  <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                    {formErrors.message}
                  </p>
                )}

                <div className="mt-1 flex justify-end">
                  <span className="text-[8px] text-[#98A3B2]">
                    {form.message.length}/2000
                  </span>
                </div>

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
                            .value as EnquiryStatus,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                  >
                    <option value="New">
                      New
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Resolved">
                      Resolved
                    </option>

                    <option value="Closed">
                      Closed
                    </option>
                  </select>

                </div>

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority:
                          event.target
                            .value as EnquiryPriority,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                  >
                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>
                  </select>

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

            {/* FOOTER */}

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveEnquiry}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Send size={13} />

                {editingId !== null
                  ? "Update Enquiry"
                  : "Save Enquiry"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW MODAL
      ================================================== */}

      {viewEnquiry && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() =>
              setViewEnquiry(null)
            }
          />

          <div className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                  <MessageSquare size={18} />
                </div>

                <div>

                  <h2 className="text-[13px] font-bold text-[#263650]">
                    {viewEnquiry.enquiryNo}
                  </h2>

                  <p className="mt-1 text-[8px] text-[#8995A5]">
                    {viewEnquiry.createdAt}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewEnquiry(null)
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
                    viewEnquiry.status
                  }
                />

                <PriorityBadge
                  priority={
                    viewEnquiry.priority
                  }
                />

              </div>

              <div>

                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                  Subject
                </p>

                <p className="mt-1 text-[13px] font-bold text-[#33415A]">
                  {viewEnquiry.subject}
                </p>

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <DetailRow
                  icon={UserRound}
                  label="Customer"
                  value={viewEnquiry.name}
                />

                <DetailRow
                  icon={Building2}
                  label="Company"
                  value={
                    viewEnquiry.company ||
                    "Individual"
                  }
                />

                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={viewEnquiry.email}
                />

                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={viewEnquiry.phone}
                />

              </div>

              <div className="rounded-xl bg-[#F7F9FC] p-4">

                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                  Enquiry Message
                </p>

                <p className="mt-2 text-[10px] leading-6 text-[#52627A]">
                  {viewEnquiry.message}
                </p>

              </div>

              <div>

                <p className="mb-2 text-[9px] font-semibold text-[#52627A]">
                  Update Status
                </p>

                <div className="flex flex-wrap gap-2">

                  {(
                    [
                      "New",
                      "In Progress",
                      "Resolved",
                      "Closed",
                    ] as EnquiryStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        updateStatus(
                          viewEnquiry.id,
                          status
                        );

                        setViewEnquiry({
                          ...viewEnquiry,
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
                          viewEnquiry.status ===
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

              {/* No create/update enquiry endpoint — disabled */}
              <button
                type="button"
                onClick={() => {
                  setViewEnquiry(null);
                  openEdit(viewEnquiry);
                }}
               
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Enquiry
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
              Delete Enquiry?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This enquiry will be permanently
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
                onClick={deleteEnquiry}
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
              Enquiry information updated successfully.
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
  status: EnquiryStatus;
}) {
  const classes =
    status === "New"
      ? "bg-[#EDF3FF] text-[#3260B4]"
      : status === "In Progress"
        ? "bg-[#FFF5DF] text-[#C17B19]"
        : status === "Resolved"
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
   PRIORITY BADGE
============================================================ */

function PriorityBadge({
  priority,
}: {
  priority: EnquiryPriority;
}) {
  const classes =
    priority === "High"
      ? "bg-[#FFF0F0] text-[#D85A5A]"
      : priority === "Medium"
        ? "bg-[#FFF5DF] text-[#C17B19]"
        : "bg-[#EAF8F0] text-[#249357]";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[8px] font-semibold ${classes}`}
    >
      {priority}
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