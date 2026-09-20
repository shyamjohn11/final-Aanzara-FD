"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  Building2,
  UserRound,
  Mail,
  Phone,
  MapPin,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  UserCheck,
  UserX,
  Clock3,
  FileText,
} from "lucide-react";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { businessAccountsApi, dealersApi } from "@/app/api/services";
import { extractErrorMessage } from "@/app/api/api";
import { toast } from "react-toastify";

type AccountStatus = "Active" | "Pending" | "Inactive";

type BusinessAccount = {
  id: number;
  serverId?: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  gst: string;
  address: string;
  status: AccountStatus;
  createdAt: string;
  source: "business" | "dealer";
  dealerCode?: string;
  agentName?: string;
};

type FormErrors = {
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  gst?: string;
  address?: string;
};

export default function BusinessAccountsPage() {
  const router = useRouter();

  const [accounts, setAccounts] =
    useState<BusinessAccount[]>([]);

  /* Backend: fetch business accounts + agent dealers together. */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const combined: BusinessAccount[] = [];
      let idx = 1;
      try {
        const res: any = await businessAccountsApi.list(1, 100);
        const payload = res?.data ?? res;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        raw.forEach((r: any) => {
          const s = String(r.status ?? "Active");
          const status: AccountStatus =
            s.toLowerCase() === "pending"
              ? "Pending"
              : s.toLowerCase() === "inactive"
                ? "Inactive"
                : "Active";
          combined.push({
            id: idx++,
            serverId: String(r.businessAccountId ?? r.accountId ?? r.id ?? ""),
            businessName: String(r.businessName ?? r.name ?? r.company ?? r.companyName ?? ""),
            ownerName: String(r.ownerName ?? r.owner ?? r.contactPerson ?? ""),
            email: String(r.email ?? ""),
            phone: String(r.phone ?? r.phoneNumber ?? r.contact ?? ""),
            gst: String(r.gst ?? r.gstNumber ?? r.gstin ?? ""),
            address: String(r.address ?? r.businessAddress ?? r.location ?? ""),
            status,
            createdAt: String(r.createdAt ?? r.createdDate ?? r.registeredOn ?? ""),
            source: "business",
          });
        });
      } catch {}
      // Agent-added dealer shops — same list, so Business Account List shows all shops
      try {
        const res: any = await dealersApi.list(1, 100);
        const payload = res?.data ?? res;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        raw.forEach((r: any) => {
          const s = String(r.status ?? "Active");
          const status: AccountStatus =
            s.toLowerCase() === "pending"
              ? "Pending"
              : s.toLowerCase() === "inactive"
                ? "Inactive"
                : "Active";
          combined.push({
            id: idx++,
            serverId: String(r.id ?? r.dealerId ?? ""),
            businessName: String(r.shopName ?? r.businessName ?? ""),
            ownerName: String(r.ownerName ?? ""),
            email: String(r.email ?? ""),
            phone: String(r.phone ?? ""),
            gst: String(r.gstNumber ?? r.gst ?? ""),
            address: String([r.address, r.city, r.state].filter(Boolean).join(", ") ?? ""),
            status,
            createdAt: String(r.createdAt ?? ""),
            source: "dealer",
            dealerCode: String(r.dealerCode ?? ""),
            agentName: String(r.agentName ?? ""),
          });
        });
      } catch {}
      if (!cancelled && combined.length > 0) setAccounts(combined);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | AccountStatus>("All");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [viewAccount, setViewAccount] =
    useState<BusinessAccount | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    gst: "",
    address: "",
    status: "Active" as AccountStatus,
  });

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesSearch =
        !query ||
        account.businessName
          .toLowerCase()
          .includes(query) ||
        account.ownerName
          .toLowerCase()
          .includes(query) ||
        account.email
          .toLowerCase()
          .includes(query) ||
        account.phone
          .toLowerCase()
          .includes(query) ||
        account.gst
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        account.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [accounts, search, statusFilter]);

  /* =====================================================
     STATS
  ====================================================== */

  const activeCount = accounts.filter(
    (account) => account.status === "Active"
  ).length;

  const pendingCount = accounts.filter(
    (account) => account.status === "Pending"
  ).length;

  const inactiveCount = accounts.filter(
    (account) => account.status === "Inactive"
  ).length;

  /* =====================================================
     RESET FORM
  ====================================================== */

  const resetForm = () => {
    setForm({
      businessName: "",
      ownerName: "",
      email: "",
      phone: "",
      gst: "",
      address: "",
      status: "Active",
    });

    setEditingId(null);
    setErrors({});
  };

  /* =====================================================
     OPEN CREATE
  ====================================================== */

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  /* =====================================================
     OPEN EDIT
  ====================================================== */

  const openEdit = (account: BusinessAccount) => {
    setEditingId(account.id);

    setErrors({});

    setForm({
      businessName: account.businessName,
      ownerName: account.ownerName,
      email: account.email,
      phone: account.phone,
      gst: account.gst,
      address: account.address,
      status: account.status,
    });

    setShowForm(true);
  };

  /* =====================================================
     VALIDATION
  ====================================================== */

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    const businessName = form.businessName.trim();
    const ownerName = form.ownerName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const gst = form.gst.trim().toUpperCase();
    const address = form.address.trim();

    /* BUSINESS NAME */
    if (!businessName) {
      nextErrors.businessName = "Business name is required.";
    } else if (businessName.length < 2) {
      nextErrors.businessName = "Business name must be at least 2 characters.";
    } else if (businessName.length > 100) {
      nextErrors.businessName = "Business name cannot exceed 100 characters.";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9 &.'()\-]*$/.test(businessName)) {
      nextErrors.businessName = "Business name contains invalid characters.";
    } else if (
      accounts.some(
        (account) =>
          account.businessName.trim().toLowerCase() === businessName.toLowerCase() &&
          account.id !== editingId
      )
    ) {
      nextErrors.businessName = "This business name already exists.";
    }

    /* OWNER NAME */
    if (!ownerName) {
      nextErrors.ownerName = "Owner name is required.";
    } else if (ownerName.length < 2) {
      nextErrors.ownerName = "Owner name must be at least 2 characters.";
    } else if (ownerName.length > 80) {
      nextErrors.ownerName = "Owner name cannot exceed 80 characters.";
    } else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(ownerName)) {
      nextErrors.ownerName = "Enter a valid owner name.";
    }

    /* EMAIL */
    if (!email) {
      nextErrors.email = "Email address is required.";
    } else if (email.length > 120) {
      nextErrors.email = "Email address cannot exceed 120 characters.";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    } else if (
      accounts.some(
        (account) =>
          account.email.trim().toLowerCase() === email &&
          account.id !== editingId
      )
    ) {
      nextErrors.email = "This email address is already registered.";
    }

    /* PHONE */
    const phoneDigits = phone.replace(/\D/g, "");
    if (!phone) {
      nextErrors.phone = "Phone number is required.";
    } else if (!/^[+0-9()\-\s]{10,18}$/.test(phone)) {
      nextErrors.phone = "Enter a valid phone number.";
    } else if (phoneDigits.length !== 10 && phoneDigits.length !== 12) {
      nextErrors.phone = "Phone number must contain 10 digits, or 12 digits with country code.";
    }

    /* GST */
    if (gst) {
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)) {
        nextErrors.gst = "Enter a valid 15-character GST number.";
      } else if (
        accounts.some(
          (account) =>
            account.gst.trim().toUpperCase() === gst &&
            account.gst.trim() !== "" &&
            account.id !== editingId
        )
      ) {
        nextErrors.gst = "This GST number is already registered.";
      }
    }

    /* ADDRESS */
    if (address.length > 250) {
      nextErrors.address = "Address cannot exceed 250 characters.";
    } else if (address && address.length < 5) {
      nextErrors.address = "Address must be at least 5 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /* =====================================================
     SAVE
  ====================================================== */

  const saveAccount = async () => {
    if (!validateForm()) return;

    const businessName = form.businessName.trim();
    const ownerName = form.ownerName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const gst = form.gst.trim().toUpperCase();
    const address = form.address.trim();

    const editing =
      editingId !== null
        ? accounts.find((account) => account.id === editingId)
        : undefined;
    // Dealer rows use Dealers API (shopName/gstNumber), business rows use BusinessAccounts API
    const isDealerEdit = editing?.source === "dealer";
    try {
      if (isDealerEdit && editing?.serverId) {
        await dealersApi.update(editing.serverId, {
          shopName: businessName,
          ownerName,
          email: email || null,
          phone,
          gstNumber: gst || null,
          address: address || null,
          status: form.status,
        });
      } else if (editing?.serverId) {
        await businessAccountsApi.update(editing.serverId, {
          businessName,
          ownerName,
          email,
          phone,
          gst,
          address,
          status: form.status,
        });
      } else {
        await businessAccountsApi.create({
          businessName,
          ownerName,
          email,
          phone,
          gst,
          address,
          status: form.status,
        });
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, "Unable to save. Please try again."));
      return;
    }

    if (editingId !== null) {
      setAccounts((current) =>
        current.map((account) =>
          account.id === editingId
            ? {
                ...account,
                businessName,
                ownerName,
                email,
                phone,
                gst,
                address,
                status: form.status,
              }
            : account
        )
      );
      toast.success("Updated successfully");
    } else {
      // Re-fetch to get real serverId instead of local Date.now
      try {
        const res: any = await businessAccountsApi.list(1, 100);
        const payload: any = res?.data ?? res;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        if (raw.length > 0) {
          const last = raw[raw.length - 1];
          setAccounts((current) => [
            ...current,
            {
              id: Date.now(),
              serverId: String(last.businessAccountId ?? last.id ?? ""),
              businessName,
              ownerName,
              email,
              phone,
              gst,
              address,
              status: form.status,
              createdAt: new Date().toISOString().split("T")[0],
              source: "business",
            },
          ]);
        }
      } catch {}
      toast.success("Created successfully");
    }

    setShowForm(false);
    resetForm();
  };

  /* =====================================================
     DELETE
  ====================================================== */

  const deleteAccount = async () => {
    if (deleteId === null) return;

    const target = accounts.find((account) => account.id === deleteId);
    if (target?.serverId) {
      try {
        if (target.source === "dealer") {
          await dealersApi.remove(target.serverId);
        } else {
          await businessAccountsApi.remove(target.serverId);
        }
      } catch (error) {
        toast.error(extractErrorMessage(error, "Unable to delete. Dealers with products cannot be deleted."));
        return;
      }
    }

    setAccounts((current) =>
      current.filter((account) => account.id !== deleteId)
    );

    setDeleteId(null);
    toast.success("Deleted successfully");
  };

  /* =====================================================
     STATUS
  ====================================================== */

  const toggleStatus = async (id: number) => {
    const target = accounts.find((account) => account.id === id);
    const newStatus = target?.status === "Active" ? "Inactive" : "Active";
    if (target?.serverId) {
      try {
        if (target.source === "dealer") {
          await dealersApi.setStatus(target.serverId, newStatus);
        } else {
          await businessAccountsApi.setStatus(target.serverId, newStatus);
        }
      } catch (error) {
        toast.error(extractErrorMessage(error, "Unable to update status."));
        return;
      }
    }
    setAccounts((current) =>
      current.map((account) => {
        if (account.id !== id) return account;
        return { ...account, status: newStatus };
      })
    );
    toast.success("Status updated");
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
      <div className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

        <main className="min-h-screen">

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
            Business Accounts
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage wholesale business accounts
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Add Business Account
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
            Business Accounts
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            title="Total Accounts"
            value={accounts.length}
            icon={Building2}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#3260B4]"
          />

          <StatCard
            title="Active"
            value={activeCount}
            icon={UserCheck}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Pending Approval"
            value={pendingCount}
            icon={Clock3}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

          <StatCard
            title="Inactive"
            value={inactiveCount}
            icon={UserX}
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
                placeholder="Search business, owner, email, phone or GST..."
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
                  "Active",
                  "Pending",
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
            TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#263650]">
                Business Account List
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredAccounts.length} accounts found
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

          {filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
                <Building2 size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No business accounts found
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
                        Business
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Owner
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Contact
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        GST
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

                    {filteredAccounts.map(
                      (account) => (
                        <tr
                          key={account.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* BUSINESS */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${account.source === "dealer" ? "bg-[#FFF5DF] text-[#C17B19]" : "bg-[#EDF3FF] text-[#3260B4]"}`}>
                                <Building2 size={17} />
                              </div>

                              <div>

                                <p className="text-[11px] font-bold text-[#33415A]">
                                  {account.businessName}
                                </p>

                                <p className="mt-1 flex items-center gap-1 text-[8px] text-[#8995A5]">
                                  {account.source === "dealer" ? (
                                    <>
                                      <span className="rounded bg-[#FFF5DF] px-1.5 py-0.5 text-[7px] font-bold text-[#C17B19]">Dealer</span>
                                      {account.dealerCode && <span>{account.dealerCode}</span>}
                                      {account.agentName && <span>· {account.agentName}</span>}
                                    </>
                                  ) : (
                                    <>ID: BA-{String(account.id).padStart(4, "0")}</>
                                  )}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* OWNER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <UserRound
                                size={13}
                                className="text-[#8995A5]"
                              />

                              <span className="text-[9px] font-semibold text-[#52627A]">
                                {account.ownerName}
                              </span>

                            </div>

                          </td>

                          {/* CONTACT */}

                          <td className="px-5 py-4">

                            <div className="space-y-1">

                              <div className="flex items-center gap-1.5">

                                <Mail
                                  size={10}
                                  className="text-[#8995A5]"
                                />

                                <span className="text-[9px] text-[#52627A]">
                                  {account.email}
                                </span>

                              </div>

                              <div className="flex items-center gap-1.5">

                                <Phone
                                  size={10}
                                  className="text-[#8995A5]"
                                />

                                <span className="text-[8px] text-[#8995A5]">
                                  {account.phone}
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* GST */}

                          <td className="px-5 py-4">

                            <span className="rounded-md bg-[#F5F7FA] px-2 py-1 text-[8px] font-medium text-[#52627A]">
                              {account.gst ||
                                "Not Added"}
                            </span>

                          </td>

                          {/* CREATED */}

                          <td className="px-5 py-4">

                            <span className="text-[9px] text-[#66748B]">
                              {account.createdAt}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                toggleStatus(
                                  account.id
                                )
                              }
                            >
                              <StatusBadge
                                status={
                                  account.status
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
                                  setViewAccount(
                                    account
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
                                    account
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
                                    account.id
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

                {filteredAccounts.map(
                  (account) => (
                    <div
                      key={account.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#3260B4]">
                          <Building2 size={17} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-[11px] font-bold text-[#33415A]">
                                {account.businessName}
                              </p>

                              <p className="mt-1 truncate text-[8px] text-[#8995A5]">
                                {account.ownerName}
                              </p>

                            </div>

                            <StatusBadge
                              status={
                                account.status
                              }
                            />

                          </div>

                          <div className="mt-3 space-y-2">

                            <InfoRow
                              icon={Mail}
                              value={
                                account.email
                              }
                            />

                            <InfoRow
                              icon={Phone}
                              value={
                                account.phone
                              }
                            />

                            <InfoRow
                              icon={MapPin}
                              value={
                                account.address ||
                                "Address not added"
                              }
                            />

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <InfoBox
                              label="GST"
                              value={
                                account.gst ||
                                "Not Added"
                              }
                            />

                            <InfoBox
                              label="Created"
                              value={
                                account.createdAt
                              }
                            />

                          </div>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewAccount(
                                  account
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
                                  account
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
                                  account.id
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

          <div className="relative max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Business Account"
                    : "Add Business Account"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Enter business account information
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Business Name"
                  placeholder="Enter business name"
                  value={form.businessName}
                  required
                  maxLength={100}
                  error={errors.businessName}
                  onChange={(value) => {
                    setForm({ ...form, businessName: value });
                    setErrors({ ...errors, businessName: undefined });
                  }}
                />

                <FormInput
                  label="Owner Name"
                  placeholder="Enter owner name"
                  value={form.ownerName}
                  required
                  maxLength={80}
                  error={errors.ownerName}
                  onChange={(value) => {
                    setForm({ ...form, ownerName: value });
                    setErrors({ ...errors, ownerName: undefined });
                  }}
                />

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Email Address"
                  placeholder="Enter email address"
                  type="email"
                  value={form.email}
                  required
                  maxLength={120}
                  error={errors.email}
                  onChange={(value) => {
                    setForm({ ...form, email: value });
                    setErrors({ ...errors, email: undefined });
                  }}
                />

                <FormInput
                  label="Phone Number"
                  placeholder="Enter phone number"
                  type="tel"
                  value={form.phone}
                  required
                  maxLength={18}
                  error={errors.phone}
                  onChange={(value) => {
                    const cleaned = value.replace(/[^0-9+()\-\s]/g, "");
                    setForm({ ...form, phone: cleaned });
                    setErrors({ ...errors, phone: undefined });
                  }}
                />

              </div>

              <FormInput
                label="GST Number"
                placeholder="Enter GST number"
                value={form.gst}
                maxLength={15}
                error={errors.gst}
                onChange={(value) => {
                  const cleaned = value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 15);
                  setForm({ ...form, gst: cleaned });
                  setErrors({ ...errors, gst: undefined });
                }}
              />

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Business Address
                </label>

                <textarea
                  value={form.address}
                  maxLength={250}
                  onChange={(event) => {
                    setForm({
                      ...form,
                      address: event.target.value,
                    });
                    setErrors({
                      ...errors,
                      address: undefined,
                    });
                  }}
                  placeholder="Enter business address"
                  rows={3}
                  aria-invalid={!!errors.address}
                  className={`mt-1.5 w-full resize-none rounded-lg border px-3 py-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8] ${
                    errors.address
                      ? "border-[#EF4444] bg-[#FFF8F8]"
                      : "border-[#DCE2EA] focus:border-[#1769F5]"
                  }`}
                />

                <div className="mt-1 flex items-start justify-between gap-2">
                  {errors.address ? (
                    <p className="text-[8px] font-medium text-[#EF4444]">
                      {errors.address}
                    </p>
                  ) : (
                    <p className="text-[7px] text-[#A0AAB8]">
                      Optional · Maximum 250 characters
                    </p>
                  )}
                  <span className="shrink-0 text-[7px] text-[#A0AAB8]">
                    {form.address.length}/250
                  </span>
                </div>

              </div>

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Account Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status:
                        event.target
                          .value as AccountStatus,
                    })
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>

              </div>

              {Object.keys(errors).length > 0 && (
                <div className="rounded-xl border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">
                  <p className="text-[9px] font-semibold text-[#DC2626]">
                    Please correct the highlighted fields before saving.
                  </p>
                  <ul className="mt-2 space-y-1">
                    {Object.values(errors).map((error, index) => (
                      <li
                        key={`${error}-${index}`}
                        className="text-[8px] text-[#DC2626]"
                      >
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-[#D7E5FF] bg-[#F2F7FF] p-4">

                <div className="flex items-center">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1769F5]">
                    <Building2 size={18} />
                  </div>

                  <div className="ml-3 min-w-0">

                    <p className="truncate text-[11px] font-bold text-[#33415A]">
                      {form.businessName ||
                        "Business Name"}
                    </p>

                    <p className="mt-1 truncate text-[8px] text-[#8995A5]">
                      {form.ownerName ||
                        "Business Owner"}
                    </p>

                  </div>

                  <div className="ml-auto">

                    <StatusBadge
                      status={form.status}
                    />

                  </div>

                </div>

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
                onClick={saveAccount}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <CheckCircle2 size={13} />

                {editingId !== null
                  ? "Update Account"
                  : "Save Account"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW MODAL
      ================================================== */}

      {viewAccount && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() =>
              setViewAccount(null)
            }
          />

          <div className="relative w-full max-w-[500px] rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                  <Building2 size={18} />
                </div>

                <div>

                  <h2 className="text-[13px] font-bold text-[#263650]">
                    {viewAccount.businessName}
                  </h2>

                  <p className="mt-1 text-[8px] text-[#8995A5]">
                    Account ID: BA-
                    {String(
                      viewAccount.id
                    ).padStart(4, "0")}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewAccount(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="space-y-3 p-5">

              <DetailRow
                icon={UserRound}
                label="Business Owner"
                value={
                  viewAccount.ownerName
                }
              />

              <DetailRow
                icon={Mail}
                label="Email"
                value={viewAccount.email}
              />

              <DetailRow
                icon={Phone}
                label="Phone"
                value={viewAccount.phone}
              />

              <DetailRow
                icon={FileText}
                label="GST Number"
                value={
                  viewAccount.gst ||
                  "Not Added"
                }
              />

              <DetailRow
                icon={MapPin}
                label="Business Address"
                value={
                  viewAccount.address ||
                  "Address not added"
                }
              />

              <DetailRow
                icon={Clock3}
                label="Created"
                value={
                  viewAccount.createdAt
                }
              />

              <div className="flex items-center justify-between rounded-xl bg-[#F7F9FC] px-4 py-3">

                <span className="text-[9px] font-semibold text-[#8995A5]">
                  Account Status
                </span>

                <StatusBadge
                  status={
                    viewAccount.status
                  }
                />

              </div>

            </div>

            <div className="border-t border-[#E5E9EF] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  setViewAccount(null);
                  openEdit(viewAccount);
                }}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Business Account
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
              Delete Business Account?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This business account will be
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
                onClick={deleteAccount}
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
              Business account updated successfully.
            </p>

          </div>

        </div>
      )}

          </main>
        </div>
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
  status: AccountStatus;
}) {
  const classes =
    status === "Active"
      ? "bg-[#EAF8F0] text-[#249357]"
      : status === "Pending"
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
  required = false,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="text-[9px] font-semibold text-[#52627A]">
        {label}
        {required && (
          <span className="ml-1 text-[#EF4444]">*</span>
        )}
      </label>

      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] ${
          error
            ? "border-[#EF4444] bg-[#FFF8F8]"
            : "border-[#DCE2EA] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10"
        }`}
      />

      <div className="mt-1 min-h-[12px]">
        {error ? (
          <p className="text-[8px] font-medium text-[#EF4444]">
            {error}
          </p>
        ) : (
          <span className="text-[7px] text-transparent">.</span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MOBILE INFO ROW
============================================================ */

function InfoRow({
  icon: Icon,
  value,
}: {
  icon: React.ElementType;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">

      <Icon
        size={11}
        className="shrink-0 text-[#8995A5]"
      />

      <span className="truncate text-[9px] text-[#66748B]">
        {value}
      </span>

    </div>
  );
}

/* ============================================================
   MOBILE INFO BOX
============================================================ */

function InfoBox({
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