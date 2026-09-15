"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { storesApi } from "@/app/api/services";
import {
  ArrowLeft,
  Plus,
  Search,
  Store,
  MapPin,
  Phone,
  Mail,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Users,
  Eye,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type StoreStatus = "Active" | "Inactive";

type StoreItem = {
  id: number;
  serverId?: string;
  name: string;
  code: string;
  manager: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  customers: number;
  status: StoreStatus;
};

export default function StoresPage() {
  const router = useRouter();

  const [stores, setStores] =
    useState<StoreItem[]>([]);

  /* Backend: fetch on mount. */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res: any = await storesApi.list(1, 100);
        const payload = res?.data ?? res;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        if (cancelled || raw.length === 0) return;
        const mapped: StoreItem[] = raw.map((r: any, index: number) => ({
          id: index + 1,
          serverId: String(r.storeId ?? r.id ?? r.storeID ?? ""),
          name: String(r.storeName ?? r.name ?? ""),
          code: String(r.storeCode ?? r.code ?? ""),
          manager: String(r.manager ?? r.managerName ?? r.storeManager ?? ""),
          phone: String(r.phone ?? r.phoneNumber ?? r.contact ?? ""),
          email: String(r.email ?? ""),
          address: String(r.address ?? ""),
          city: String(r.city ?? ""),
          state: String(r.state ?? ""),
          customers: Number(r.customers ?? r.customerCount ?? r.totalCustomers ?? 0) || 0,
          status: String(r.status ?? "Active").toLowerCase() === "inactive" ? "Inactive" : "Active",
        }));
        if (mapped.length > 0) setStores(mapped);
      } catch {}
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | StoreStatus>("All");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [viewStore, setViewStore] =
    useState<StoreItem | null>(null);

  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    manager: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    customers: "0",
    status: "Active" as StoreStatus,
  });

  type StoreFormErrors = Partial<
    Record<
      | "name"
      | "code"
      | "manager"
      | "phone"
      | "email"
      | "address"
      | "city"
      | "state"
      | "customers"
      | "status",
      string
    >
  >;

  const [errors, setErrors] = useState<StoreFormErrors>({});

  const clearError = (field: keyof StoreFormErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateStore = () => {
    const next: StoreFormErrors = {};
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const manager = form.manager.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const address = form.address.trim();
    const city = form.city.trim();
    const state = form.state.trim();
    const customersText = form.customers.trim();
    const customers = Number(customersText);

    if (!name) {
      next.name = "Store name is required.";
    } else if (name.length < 2 || name.length > 100) {
      next.name = "Store name must be 2–100 characters.";
    }

    if (!code) {
      next.code = "Store code is required.";
    } else if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)) {
      next.code =
        "Use uppercase letters/numbers separated by hyphens (e.g. AZ-CHN-001).";
    } else if (code.length < 3 || code.length > 30) {
      next.code = "Store code must be 3–30 characters.";
    } else if (
      stores.some(
        (store) =>
          store.code.toUpperCase() === code && store.id !== editingId
      )
    ) {
      next.code = "This store code already exists.";
    }

    if (!manager) {
      next.manager = "Store manager is required.";
    } else if (!/^[A-Za-z][A-Za-z .'-]{1,79}$/.test(manager)) {
      next.manager =
        "Manager name must contain letters, spaces, apostrophes or hyphens.";
    }

    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (!phone) {
      next.phone = "Phone number is required.";
    } else if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
      next.phone = "Enter a valid phone number (10–15 digits).";
    }

    if (!email) {
      next.email = "Email address is required.";
    } else if (
      !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
        email
      )
    ) {
      next.email = "Enter a valid email address.";
    }

    if (!address) {
      next.address = "Address is required.";
    } else if (address.length < 5 || address.length > 250) {
      next.address = "Address must be 5–250 characters.";
    }

    if (!city) {
      next.city = "City is required.";
    } else if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(city)) {
      next.city = "Enter a valid city name.";
    }

    if (!state) {
      next.state = "State is required.";
    } else if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(state)) {
      next.state = "Enter a valid state name.";
    }

    if (!customersText) {
      next.customers = "Customers count is required.";
    } else if (!/^\d+$/.test(customersText)) {
      next.customers = "Customers must be a whole number.";
    } else if (!Number.isSafeInteger(customers) || customers < 0) {
      next.customers = "Customers cannot be negative.";
    } else if (customers > 1000000000) {
      next.customers = "Customers count is too large.";
    }

    if (form.status !== "Active" && form.status !== "Inactive") {
      next.status = "Please select a valid status.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredStores = useMemo(() => {
    const query = search.trim().toLowerCase();

    return stores.filter((store) => {
      const matchesSearch =
        !query ||
        store.name.toLowerCase().includes(query) ||
        store.code.toLowerCase().includes(query) ||
        store.manager.toLowerCase().includes(query) ||
        store.city.toLowerCase().includes(query) ||
        store.state.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        store.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [stores, search, statusFilter]);

  const activeStores = stores.filter(
    (store) => store.status === "Active"
  ).length;

  const inactiveStores = stores.filter(
    (store) => store.status === "Inactive"
  ).length;

  const totalCustomers = stores.reduce(
    (total, store) => total + store.customers,
    0
  );

  /* =====================================================
     FORM RESET
  ====================================================== */

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      manager: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      customers: "0",
      status: "Active",
    });

    setEditingId(null);
    setErrors({});
  };

  /* =====================================================
     ADD
  ====================================================== */

  const openCreate = () => {
    resetForm();
    setErrors({});
    setShowForm(true);
  };

  /* =====================================================
     EDIT
  ====================================================== */

  const openEdit = (store: StoreItem) => {
    setEditingId(store.id);

    setForm({
      name: store.name,
      code: store.code,
      manager: store.manager,
      phone: store.phone,
      email: store.email,
      address: store.address,
      city: store.city,
      state: store.state,
      customers: String(store.customers),
      status: store.status,
    });

    setErrors({});
    setShowForm(true);
  };

  /* =====================================================
     SAVE
  ====================================================== */

  const saveStore = async () => {
    if (!validateStore()) return;

    const storeData = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      manager: form.manager.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      customers: Number(form.customers) || 0,
      status: form.status,
    };

    const editing =
      editingId !== null
        ? stores.find((store) => store.id === editingId)
        : undefined;
    try {
      if (editing?.serverId) {
        await storesApi.update(editing.serverId, { ...storeData });
      } else {
        await storesApi.create({ ...storeData });
      }
    } catch {
      /* best-effort: fall through to local logic */
    }

    if (editingId !== null) {
      setStores((current) =>
        current.map((store) =>
          store.id === editingId
            ? {
                ...store,
                ...storeData,
              }
            : store
        )
      );
    } else {
      setStores((current) => [
        ...current,
        {
          id: Date.now(),
          ...storeData,
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

  const deleteStore = async () => {
    if (deleteId === null) return;

    const target = stores.find((store) => store.id === deleteId);
    if (target?.serverId) {
      try {
        await storesApi.remove(target.serverId);
      } catch {
        /* best-effort */
      }
    }

    setStores((current) =>
      current.filter(
        (store) => store.id !== deleteId
      )
    );

    setDeleteId(null);
    showSuccess();
  };

  /* =====================================================
     TOGGLE STATUS
  ====================================================== */

  const toggleStatus = async (id: number) => {
    const target = stores.find((store) => store.id === id);
    const newStatus =
      target?.status === "Active" ? "Inactive" : "Active";
    if (target?.serverId) {
      try {
        await storesApi.setStatus(target.serverId, newStatus);
      } catch {
        /* best-effort */
      }
    }
    setStores((current) =>
      current.map((store) =>
        store.id === id
          ? {
              ...store,
              status:
                store.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : store
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
          aria-label="Back to admin"
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] hover:bg-[#F1F4F8]"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
            Stores
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage stores and branches
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Add Store
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
            Stores
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            title="Total Stores"
            value={stores.length}
            icon={Store}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#3260B4]"
          />

          <StatCard
            title="Active Stores"
            value={activeStores}
            icon={CheckCircle2}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Inactive Stores"
            value={inactiveStores}
            icon={X}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

          <StatCard
            title="Total Customers"
            value={totalCustomers.toLocaleString(
              "en-IN"
            )}
            icon={Users}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

        </section>

        {/* =================================================
            SEARCH
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
                  setSearch(event.target.value)
                }
                placeholder="Search store, code, manager or city..."
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
            STORE TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>
              <h2 className="text-[13px] font-bold text-[#263650]">
                Store List
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredStores.length} stores found
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

          {filteredStores.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
                <Store size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No stores found
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
                        Store
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Manager
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Location
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Contact
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Customers
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

                    {filteredStores.map((store) => (
                      <tr
                        key={store.id}
                        className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                      >

                        {/* STORE */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                              <Store size={18} />
                            </div>

                            <div>

                              <p className="max-w-[210px] truncate text-[11px] font-bold text-[#33415A]">
                                {store.name}
                              </p>

                              <span className="mt-1 inline-block rounded-md bg-[#F0F4FA] px-2 py-1 font-mono text-[8px] font-semibold text-[#31558E]">
                                {store.code}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* MANAGER */}

                        <td className="px-5 py-4">

                          <p className="text-[10px] font-semibold text-[#52627A]">
                            {store.manager}
                          </p>

                        </td>

                        {/* LOCATION */}

                        <td className="px-5 py-4">

                          <div className="flex items-start gap-1.5">

                            <MapPin
                              size={13}
                              className="mt-0.5 shrink-0 text-[#1769F5]"
                            />

                            <div>

                              <p className="text-[9px] font-semibold text-[#52627A]">
                                {store.city},{" "}
                                {store.state}
                              </p>

                              <p className="mt-1 max-w-[170px] truncate text-[8px] text-[#8995A5]">
                                {store.address}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* CONTACT */}

                        <td className="px-5 py-4">

                          <p className="flex items-center gap-1.5 text-[8px] text-[#52627A]">
                            <Phone size={11} />
                            {store.phone}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 text-[8px] text-[#8995A5]">
                            <Mail size={11} />
                            {store.email}
                          </p>

                        </td>

                        {/* CUSTOMERS */}

                        <td className="px-5 py-4">

                          <span className="inline-flex items-center gap-1 rounded-md bg-[#F3F0FF] px-2 py-1.5 text-[8px] font-semibold text-[#7053A8]">
                            <Users size={11} />
                            {store.customers}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(
                                store.id
                              )
                            }
                          >
                            <StatusBadge
                              status={
                                store.status
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
                                setViewStore(
                                  store
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
                                  store
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
                                  store.id
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0D4D4] text-[#D85A5A] hover:bg-[#FFF0F0]"
                            >
                              <Trash2 size={13} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

              {/* MOBILE */}

              <div className="divide-y divide-[#EDF0F4] md:hidden">

                {filteredStores.map(
                  (store) => (
                    <div
                      key={store.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                          <Store size={18} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-[11px] font-bold text-[#33415A]">
                                {store.name}
                              </p>

                              <span className="mt-1 inline-block rounded-md bg-[#F0F4FA] px-2 py-1 font-mono text-[8px] font-semibold text-[#31558E]">
                                {store.code}
                              </span>

                            </div>

                            <StatusBadge
                              status={
                                store.status
                              }
                            />

                          </div>

                          <div className="mt-3 space-y-2">

                            <MobileInfo
                              icon={Users}
                              label="Manager"
                              value={
                                store.manager
                              }
                            />

                            <MobileInfo
                              icon={MapPin}
                              label="Location"
                              value={`${store.city}, ${store.state}`}
                            />

                            <MobileInfo
                              icon={Phone}
                              label="Phone"
                              value={
                                store.phone
                              }
                            />

                            <MobileInfo
                              icon={Mail}
                              label="Email"
                              value={
                                store.email
                              }
                            />

                            <MobileInfo
                              icon={Users}
                              label="Customers"
                              value={String(
                                store.customers
                              )}
                            />


                          </div>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewStore(
                                  store
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
                                  store
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
                                  store.id
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

          <div className="relative max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Store"
                    : "Add Store"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Add and manage store information
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
                label="Store Name"
                placeholder="Enter store name"
                value={form.name}
                onChange={(value) => {
                  setForm({
                    ...form,
                    name: value,
                  });
                  clearError("name");
                }}
              
                  maxLength={100}
                  error={errors.name}/>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Store Code"
                  placeholder="Example: AZ-CHN-001"
                  value={form.code}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      code: value,
                    })
                  }
                
                  maxLength={30}
                  error={errors.code}/>

                <FormInput
                  label="Store Manager"
                  placeholder="Enter manager name"
                  value={form.manager}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      manager: value,
                    })
                  }
                
                  maxLength={80}
                  error={errors.manager}/>

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  type="tel"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      phone: value,
                    })
                  }
                
                  maxLength={20}
                  error={errors.phone}/>

                <FormInput
                  label="Email Address"
                  placeholder="store@aanzara.com"
                  value={form.email}
                  type="email"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      email: value,
                    })
                  }
                
                  maxLength={254}
                  error={errors.email}/>

              </div>

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) => {
                    setForm({
                      ...form,
                      address: event.target.value,
                    });
                    clearError("address");
                  }}
                  maxLength={250}
                  aria-invalid={Boolean(errors.address)}
                  placeholder="Enter store address"
                  rows={3}
                  className={`mt-1.5 w-full resize-none rounded-lg border px-3 py-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] ${
                    errors.address
                      ? "border-[#EF4444]"
                      : "border-[#DCE2EA]"
                  }`}
                />

                {errors.address && (
                  <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                    {errors.address}
                  </p>
                )}

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <FormInput
                  label="City"
                  placeholder="Chennai"
                  value={form.city}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      city: value,
                    })
                  }
                
                  maxLength={60}
                  error={errors.city}/>

                <FormInput
                  label="State"
                  placeholder="Tamil Nadu"
                  value={form.state}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      state: value,
                    })
                  }
                
                  maxLength={60}
                  error={errors.state}/>

                <FormInput
                  label="Customers"
                  placeholder="0"
                  type="number"
                  value={
                    form.customers
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      customers:
                        value,
                    })
                  }
                />

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
                      status: event.target.value as StoreStatus,
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
                onClick={saveStore}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <CheckCircle2 size={13} />

                {editingId !== null
                  ? "Update Store"
                  : "Save Store"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW MODAL
      ================================================== */}

      {viewStore && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() =>
              setViewStore(null)
            }
          />

          <div className="relative w-full max-w-[480px] rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                  <Store size={18} />
                </div>

                <div>

                  <h2 className="text-[13px] font-bold text-[#263650]">
                    {viewStore.name}
                  </h2>

                  <p className="mt-1 font-mono text-[8px] text-[#8995A5]">
                    {viewStore.code}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewStore(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="space-y-3 p-5">

              <ViewRow
                icon={Users}
                label="Store Manager"
                value={
                  viewStore.manager
                }
              />

              <ViewRow
                icon={MapPin}
                label="Address"
                value={`${viewStore.address}, ${viewStore.city}, ${viewStore.state}`}
              />

              <ViewRow
                icon={Phone}
                label="Phone"
                value={
                  viewStore.phone
                }
              />

              <ViewRow
                icon={Mail}
                label="Email"
                value={
                  viewStore.email
                }
              />

              <ViewRow
                icon={Users}
                label="Customers"
                value={String(
                  viewStore.customers
                )}
              />

              <div className="flex items-center justify-between rounded-xl bg-[#F7F9FC] px-4 py-3">

                <span className="text-[9px] font-semibold text-[#8995A5]">
                  Store Status
                </span>

                <StatusBadge
                  status={
                    viewStore.status
                  }
                />

              </div>

            </div>

            <div className="border-t border-[#E5E9EF] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  setViewStore(null);
                  openEdit(viewStore);
                }}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Store
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
              Delete Store?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This store will be permanently
              removed from the store list.
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
                onClick={deleteStore}
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
              Store information updated successfully.
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
   STATUS
============================================================ */

function StatusBadge({
  status,
}: {
  status: StoreStatus;
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

function MobileInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center rounded-lg bg-[#F7F9FC] px-3 py-2">

      <Icon
        size={12}
        className="mr-2 shrink-0 text-[#1769F5]"
      />

      <span className="w-[65px] shrink-0 text-[8px] text-[#9AA5B4]">
        {label}
      </span>

      <span className="truncate text-[9px] font-semibold text-[#52627A]">
        {value}
      </span>

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