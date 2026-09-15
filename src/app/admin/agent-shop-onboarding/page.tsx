"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Users,
  Clock3,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Phone,
  Filter,
  X,
  Mail,
  MapPin,
  Building2,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import { agentOnboardingApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type OnboardingType = "Agent" | "Shop";

type OnboardingStatus =
  | "Pending"
  | "Approved"
  | "Rejected";

type OnboardingItem = {
  id: number;
  serverId?: string;
  owner: string;
  email: string;
  business: string;
  location: string;
  phone: string;
  type: OnboardingType;
  status: OnboardingStatus;
  registeredOn: string;
};

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: OnboardingStatus;
}) {
  const styles: Record<OnboardingStatus, string> = {
    Pending: "bg-[#FFF7E8] text-[#E99500]",
    Approved: "bg-[#EAF9EF] text-[#16A34A]",
    Rejected: "bg-[#FFECEE] text-[#EF4444]",
  };

  const dots: Record<OnboardingStatus, string> = {
    Pending: "bg-[#F59E0B]",
    Approved: "bg-[#22C55E]",
    Rejected: "bg-[#EF4444]",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-md
        px-2.5
        py-1
        text-[9px]
        font-semibold
        ${styles[status]}
      `}
    >
      <span
        className={`
          h-1.5
          w-1.5
          rounded-full
          ${dots[status]}
        `}
      />

      {status}
    </span>
  );
}

/* =========================================================
   TYPE BADGE
========================================================= */

function TypeBadge({
  type,
}: {
  type: OnboardingType;
}) {
  return (
    <span
      className={`
        inline-flex
        rounded-md
        px-2.5
        py-1
        text-[9px]
        font-semibold
        ${
          type === "Shop"
            ? "bg-[#F4EAFE] text-[#A855F7]"
            : "bg-[#FFF5DE] text-[#D99100]"
        }
      `}
    >
      {type}
    </span>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  description,
  icon,
  bg,
  iconColor,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  bg: string;
  iconColor: string;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-[#E8EDF3]
        bg-white
        px-3
        py-4
        shadow-[0_2px_10px_rgba(20,40,80,0.03)]
      "
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            ${bg}
            ${iconColor}
          `}
        >
          {icon}
        </div>

        <div>
          <p className="text-[9px] font-medium text-[#718096]">
            {title}
          </p>

          <p className="mt-1 text-[21px] font-bold leading-none text-[#172B4D]">
            {value}
          </p>

          <p className="mt-1.5 text-[8px] text-[#8A96A8]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function AgentShopOnboardingPage() {
  const [items, setItems] =
    useState<OnboardingItem[]>([]);

  /* Backend: fetch on mount. */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res: any = await agentOnboardingApi.list(1, 100);
        const payload = res?.data ?? res;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        if (cancelled || raw.length === 0) return;
        const mapped: OnboardingItem[] = raw.map((r: any, index: number) => {
          const s = String(r.status ?? "Pending");
          const status: OnboardingStatus =
            s.toLowerCase() === "approved"
              ? "Approved"
              : s.toLowerCase() === "rejected"
                ? "Rejected"
                : "Pending";
          const t = String(r.type ?? r.onboardingType ?? r.category ?? r.role ?? "Shop");
          return {
            id: index + 1,
            serverId: String(r.onboardingId ?? r.agentOnboardingId ?? r.id ?? ""),
            owner: String(r.owner ?? r.ownerName ?? r.agentName ?? r.name ?? ""),
            email: String(r.email ?? ""),
            business: String(r.business ?? r.businessName ?? r.shopName ?? ""),
            location: String(r.location ?? r.address ?? r.city ?? ""),
            phone: String(r.phone ?? r.mobile ?? r.phoneNumber ?? ""),
            type: t.toLowerCase() === "agent" ? "Agent" : "Shop",
            status,
            registeredOn: String(r.registeredOn ?? r.createdAt ?? r.createdDate ?? ""),
          };
        });
        if (mapped.length > 0) setItems(mapped);
      } catch {}
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | OnboardingStatus>("All");

  const [typeFilter, setTypeFilter] =
    useState<"All" | OnboardingType>("All");

  const [activeTab, setActiveTab] =
    useState("All");

  const [selectedItem, setSelectedItem] =
    useState<OnboardingItem | null>(null);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [page, setPage] = useState(1);

  const rowsPerPage = 5;

  /* =========================================================
     COUNTS
  ========================================================= */

  const total = items.length;

  const pending = items.filter(
    (item) => item.status === "Pending"
  ).length;

  const approved = items.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejected = items.filter(
    (item) => item.status === "Rejected"
  ).length;

  const agents = items.filter(
    (item) => item.type === "Agent"
  ).length;

  const shops = items.filter(
    (item) => item.type === "Shop"
  ).length;

  /* =========================================================
     FILTERING
  ========================================================= */

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (activeTab === "Agents") {
      result = result.filter(
        (item) => item.type === "Agent"
      );
    }

    if (activeTab === "Shops") {
      result = result.filter(
        (item) => item.type === "Shop"
      );
    }

    if (activeTab === "Pending") {
      result = result.filter(
        (item) => item.status === "Pending"
      );
    }

    if (activeTab === "Approved") {
      result = result.filter(
        (item) => item.status === "Approved"
      );
    }

    if (activeTab === "Rejected") {
      result = result.filter(
        (item) => item.status === "Rejected"
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (item) => item.status === statusFilter
      );
    }

    if (typeFilter !== "All") {
      result = result.filter(
        (item) => item.type === typeFilter
      );
    }

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter(
        (item) =>
          item.owner
            .toLowerCase()
            .includes(searchValue) ||
          item.email
            .toLowerCase()
            .includes(searchValue) ||
          item.business
            .toLowerCase()
            .includes(searchValue) ||
          item.phone
            .toLowerCase()
            .includes(searchValue) ||
          item.location
            .toLowerCase()
            .includes(searchValue)
      );
    }

    return result;
  }, [
    items,
    activeTab,
    statusFilter,
    typeFilter,
    search,
  ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredItems.length / rowsPerPage
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedItems =
    filteredItems.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  const updateStatus = async (
    id: number,
    status: OnboardingStatus
  ) => {
    const target = items.find((item) => item.id === id);
    if (target?.serverId) {
      try {
        await agentOnboardingApi.setStatus(target.serverId, status);
      } catch {
        /* best-effort */
      }
    }
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
            }
          : item
      )
    );

    setSelectedItem((current) =>
      current?.id === id
        ? {
            ...current,
            status,
          }
        : current
    );
  };

  /* =========================================================
     DELETE ITEM
  ========================================================= */

  const deleteItem = async (id: number) => {
    const target = items.find((item) => item.id === id);
    if (target?.serverId) {
      try {
        await agentOnboardingApi.remove(target.serverId);
      } catch {
        /* best-effort */
      }
    }
    setItems((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );

    setSelectedItem(null);
  };

  /* =========================================================
     TABS
  ========================================================= */

  const tabs = [
    {
      label: "All",
      count: total,
    },
    {
      label: "Agents",
      count: agents,
    },
    {
      label: "Shops",
      count: shops,
    },
    {
      label: "Pending",
      count: pending,
      dot: "orange",
    },
    {
      label: "Approved",
      count: approved,
      dot: "green",
    },
    {
      label: "Rejected",
      count: rejected,
      dot: "red",
    },
  ];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
        <div className="mx-auto max-w-[1400px]">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[18px] font-bold text-[#10265B]">
                Agent / Shop Onboarding
              </h1>

              <p className="mt-1 text-[9px] text-[#7A8799]">
                Manage agents and shops onboarding requests
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowAddModal(true)
              }
              className="
                flex
                h-9
                items-center
                gap-2
                rounded-md
                bg-[#1769F5]
                px-4
                text-[10px]
                font-semibold
                text-white
                hover:bg-[#1258D4]
              "
            >
              <Plus size={13} />
              Add New
            </button>
          </div>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <SummaryCard
              title="Total"
              value={total}
              description="All agents & shops"
              icon={<Users size={17} />}
              bg="bg-[#EEF4FF]"
              iconColor="text-[#1769F5]"
            />

            <SummaryCard
              title="Pending"
              value={pending}
              description="Awaiting approval"
              icon={<Clock3 size={17} />}
              bg="bg-[#FFF1E8]"
              iconColor="text-[#F97316]"
            />

            <SummaryCard
              title="Approved"
              value={approved}
              description="Active agents & shops"
              icon={<CheckCircle2 size={17} />}
              bg="bg-[#ECFDF3]"
              iconColor="text-[#16A34A]"
            />

            <SummaryCard
              title="Rejected"
              value={rejected}
              description="Rejected requests"
              icon={<XCircle size={17} />}
              bg="bg-[#FFF0F2]"
              iconColor="text-[#EF4444]"
            />

          </div>

          {/* =================================================
              FILTER BAR
          ================================================= */}

          <div className="rounded-xl border border-[#E7ECF2] bg-white p-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">

              {/* SEARCH */}

              <div className="relative flex-1">
                <Search
                  size={14}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-[#91A0B4]
                  "
                />

                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(
                      e.target.value
                    );
                    setPage(1);
                  }}
                  placeholder="Search agent or shop name, phone, email..."
                  className="
                    h-9
                    w-full
                    rounded-md
                    border
                    border-[#E2E8F0]
                    pl-9
                    pr-3
                    text-[9px]
                    outline-none
                    focus:border-[#1769F5]
                  "
                />
              </div>

              {/* STATUS */}

              <div className="relative w-full lg:w-[130px]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value as
                        | "All"
                        | OnboardingStatus
                    );
                    setPage(1);
                  }}
                  className="
                    h-9
                    w-full
                    appearance-none
                    rounded-md
                    border
                    border-[#E2E8F0]
                    bg-white
                    px-3
                    pr-7
                    text-[9px]
                    outline-none
                  "
                >
                  <option value="All">
                    All Status
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Approved">
                    Approved
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>
                </select>

                <ChevronDown
                  size={12}
                  className="
                    pointer-events-none
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                  "
                />
              </div>

              {/* TYPE */}

              <div className="relative w-full lg:w-[120px]">
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(
                      e.target.value as
                        | "All"
                        | OnboardingType
                    );
                    setPage(1);
                  }}
                  className="
                    h-9
                    w-full
                    appearance-none
                    rounded-md
                    border
                    border-[#E2E8F0]
                    bg-white
                    px-3
                    pr-7
                    text-[9px]
                    outline-none
                  "
                >
                  <option value="All">
                    All Type
                  </option>

                  <option value="Agent">
                    Agent
                  </option>

                  <option value="Shop">
                    Shop
                  </option>
                </select>

                <ChevronDown
                  size={12}
                  className="
                    pointer-events-none
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                  "
                />
              </div>

              <button
                type="button"
                className="
                  flex
                  h-9
                  items-center
                  justify-center
                  gap-2
                  rounded-md
                  border
                  border-[#E2E8F0]
                  px-3
                  text-[9px]
                  font-semibold
                  text-[#526174]
                "
              >
                <Filter size={13} />
                Filters
              </button>
            </div>
          </div>

          {/* =================================================
              TABS
          ================================================= */}

          <div className="mt-3 overflow-x-auto rounded-xl border border-[#E7ECF2] bg-white">
            <div className="flex min-w-max">

              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    setActiveTab(
                      tab.label
                    );
                    setPage(1);
                  }}
                  className={`
                    relative
                    flex
                    h-10
                    items-center
                    gap-1.5
                    border-b-2
                    px-4
                    text-[9px]
                    font-semibold
                    ${
                      activeTab ===
                      tab.label
                        ? "border-[#1769F5] text-[#1769F5]"
                        : "border-transparent text-[#637188]"
                    }
                  `}
                >
                  {tab.label} ({tab.count})

                  {tab.dot && (
                    <span
                      className={`
                        h-1.5
                        w-1.5
                        rounded-full
                        ${
                          tab.dot ===
                          "orange"
                            ? "bg-[#F59E0B]"
                            : tab.dot ===
                              "green"
                            ? "bg-[#22C55E]"
                            : "bg-[#EF4444]"
                        }
                      `}
                    />
                  )}
                </button>
              ))}

            </div>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="mt-3 overflow-hidden rounded-xl border border-[#E7ECF2] bg-white">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px] border-collapse">

                <thead>
                  <tr className="border-b border-[#EDF1F5] bg-[#FBFCFE]">

                    <th className="px-3 py-3 text-left text-[8px] font-bold text-[#536176]">
                      Agent / Owner
                    </th>

                    <th className="px-3 py-3 text-left text-[8px] font-bold text-[#536176]">
                      Shop / Business Name
                    </th>

                    <th className="px-3 py-3 text-left text-[8px] font-bold text-[#536176]">
                      Phone
                    </th>

                    <th className="px-3 py-3 text-left text-[8px] font-bold text-[#536176]">
                      Type
                    </th>

                    <th className="px-3 py-3 text-left text-[8px] font-bold text-[#536176]">
                      Status
                    </th>

                    <th className="px-3 py-3 text-left text-[8px] font-bold text-[#536176]">
                      Registered On
                    </th>

                    <th className="px-3 py-3 text-center text-[8px] font-bold text-[#536176]">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center">

                          <Search
                            size={25}
                            className="text-[#CBD5E1]"
                          />

                          <p className="mt-2 text-[10px] font-semibold text-[#64748B]">
                            No onboarding records found
                          </p>

                          <p className="mt-1 text-[8px] text-[#94A3B8]">
                            Try changing your search or filters
                          </p>

                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="
                            border-b
                            border-[#F0F3F7]
                            last:border-0
                            hover:bg-[#FCFDFF]
                          "
                        >

                          {/* OWNER */}

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">

                              <div className="
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-[#F3E9FF]
                                text-[9px]
                                font-bold
                                text-[#9B5DE5]
                              ">
                                {item.owner
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="text-[9px] font-bold text-[#33415A]">
                                  {item.owner}
                                </p>

                                <p className="mt-0.5 text-[8px] text-[#8793A5]">
                                  {item.email}
                                </p>
                              </div>

                            </div>
                          </td>

                          {/* BUSINESS */}

                          <td className="px-3 py-3">

                            <p className="text-[9px] font-bold text-[#33415A]">
                              {item.business}
                            </p>

                            <p className="mt-0.5 text-[8px] text-[#8793A5]">
                              {item.location}
                            </p>

                          </td>

                          {/* PHONE */}

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5 text-[9px] text-[#526174]">

                              <Phone size={10} />

                              {formatPhone(
                                item.phone
                              )}

                            </div>
                          </td>

                          {/* TYPE */}

                          <td className="px-3 py-3">
                            <TypeBadge
                              type={item.type}
                            />
                          </td>

                          {/* STATUS */}

                          <td className="px-3 py-3">
                            <StatusBadge
                              status={item.status}
                            />
                          </td>

                          {/* REGISTERED */}

                          <td className="px-3 py-3 text-[9px] text-[#526174]">
                            {item.registeredOn}
                          </td>

                          {/* ACTION */}

                          <td className="px-3 py-3">

                            <div className="flex items-center justify-center gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedItem(
                                    item
                                  )
                                }
                                className="
                                  rounded-md
                                  border
                                  border-[#E1E7EF]
                                  px-3
                                  py-1.5
                                  text-[8px]
                                  font-semibold
                                  text-[#526174]
                                  hover:bg-[#F6F8FB]
                                "
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedItem(
                                    item
                                  )
                                }
                                aria-label="More actions"
                                className="
                                  flex
                                  h-7
                                  w-6
                                  items-center
                                  justify-center
                                  rounded-md
                                  text-[#718096]
                                  hover:bg-[#F4F6F9]
                                "
                              >
                                <MoreVertical
                                  size={14}
                                />
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            <div className="
              flex
              flex-col
              gap-3
              border-t
              border-[#EDF1F5]
              px-3
              py-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            ">

              <p className="text-[8px] text-[#7D899B]">
                Showing{" "}
                {filteredItems.length === 0
                  ? 0
                  : (currentPage - 1) *
                      rowsPerPage +
                    1}{" "}
                to{" "}
                {Math.min(
                  currentPage *
                    rowsPerPage,
                  filteredItems.length
                )}{" "}
                of{" "}
                {filteredItems.length}{" "}
                results
              </p>

              <div className="flex items-center gap-1">

                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setPage((value) =>
                      Math.max(
                        1,
                        value - 1
                      )
                    )
                  }
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-md
                    border
                    border-[#E4E9F0]
                    disabled:opacity-40
                  "
                >
                  <ChevronLeft size={13} />
                </button>

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) =>
                    index + 1
                )
                  .slice(0, 5)
                  .map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() =>
                        setPage(number)
                      }
                      className={`
                        flex
                        h-7
                        w-7
                        items-center
                        justify-center
                        rounded-md
                        text-[9px]
                        ${
                          currentPage ===
                          number
                            ? "bg-[#1769F5] text-white"
                            : "border border-[#E4E9F0] text-[#64748B]"
                        }
                      `}
                    >
                      {number}
                    </button>
                  ))}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setPage((value) =>
                      Math.min(
                        totalPages,
                        value + 1
                      )
                    )
                  }
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-md
                    border
                    border-[#E4E9F0]
                    disabled:opacity-40
                  "
                >
                  <ChevronRight size={13} />
                </button>

              </div>

              <div className="flex items-center gap-2">
                <span className="text-[8px] text-[#7D899B]">
                  Rows per page
                </span>

                <select
                  defaultValue="5"
                  className="
                    h-7
                    rounded-md
                    border
                    border-[#E4E9F0]
                    bg-white
                    px-2
                    text-[8px]
                  "
                >
                  <option value="5">
                    5
                  </option>

                  <option value="10">
                    10
                  </option>

                  <option value="20">
                    20
                  </option>
                </select>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {selectedItem && (
        <ViewDetailsModal
          item={selectedItem}
          onClose={() =>
            setSelectedItem(null)
          }
          onApprove={() =>
            updateStatus(
              selectedItem.id,
              "Approved"
            )
          }
          onReject={() =>
            updateStatus(
              selectedItem.id,
              "Rejected"
            )
          }
          onDelete={() =>
            deleteItem(selectedItem.id)
          }
        />
      )}

      {/* =====================================================
          ADD MODAL
      ===================================================== */}

      {showAddModal && (
        <AddNewModal
          existingItems={items}
          onClose={() =>
            setShowAddModal(false)
          }
          onAdd={async (newItem) => {
            try {
              await agentOnboardingApi.create({ ...newItem });
            } catch {
              /* best-effort: fall through to local logic */
            }
            setItems((current) => [
              {
                ...newItem,
                id:
                  Math.max(
                    0,
                    ...current.map(
                      (item) => item.id
                    )
                  ) + 1,
                registeredOn:
                  "Just now",
                status: "Pending",
              },
              ...current,
            ]);

            setShowAddModal(false);
            setPage(1);
          }}
        />
      )}
    </AdminLayout>
  );
}

/* =========================================================
   VIEW DETAILS MODAL
========================================================= */

function ViewDetailsModal({
  item,
  onClose,
  onApprove,
  onReject,
  onDelete,
}: {
  item: OnboardingItem;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/40
        p-4
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="
          flex
          items-center
          justify-between
          border-b
          px-5
          py-4
        ">
          <div>
            <h2 className="text-[14px] font-bold text-[#10265B]">
              Onboarding Details
            </h2>

            <p className="mt-1 text-[8px] text-[#8995A5]">
              View agent / shop information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-lg
              hover:bg-[#F4F6F9]
            "
          >
            <X size={15} />
          </button>
        </div>

        {/* BODY */}

        <div className="space-y-4 p-5">

          {/* OWNER */}

          <div className="
            flex
            items-center
            gap-3
            rounded-xl
            bg-[#F7F9FC]
            p-3
          ">
            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#EEF4FF]
              text-[#1769F5]
            ">
              {item.owner
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <p className="text-[11px] font-bold text-[#33415A]">
                {item.owner}
              </p>

              <p className="text-[8px] text-[#8995A5]">
                {item.email}
              </p>
            </div>
          </div>

          {/* DETAILS */}

          <div className="grid grid-cols-2 gap-4">

            <DetailItem
              icon={<Building2 size={12} />}
              label="Business"
              value={item.business}
            />

            <div>
              <p className="text-[8px] text-[#8995A5]">
                Type
              </p>

              <div className="mt-1">
                <TypeBadge
                  type={item.type}
                />
              </div>
            </div>

            <DetailItem
              icon={<Phone size={12} />}
              label="Phone"
              value={formatPhone(
                item.phone
              )}
            />

            <DetailItem
              icon={<MapPin size={12} />}
              label="Location"
              value={item.location}
            />

            <DetailItem
              icon={<Mail size={12} />}
              label="Email"
              value={item.email}
            />

            <DetailItem
              label="Registered On"
              value={item.registeredOn}
            />

          </div>

          {/* STATUS */}

          <div>
            <p className="text-[8px] text-[#8995A5]">
              Status
            </p>

            <div className="mt-1">
              <StatusBadge
                status={item.status}
              />
            </div>
          </div>

        </div>

        {/* FOOTER */}

        <div className="
          flex
          flex-wrap
          justify-end
          gap-2
          border-t
          px-5
          py-4
        ">

          {item.status !==
            "Approved" && (
            <button
              type="button"
              onClick={onApprove}
              className="
                rounded-md
                bg-[#16A34A]
                px-4
                py-2
                text-[9px]
                font-semibold
                text-white
                hover:bg-[#15803D]
              "
            >
              Approve
            </button>
          )}

          {item.status !==
            "Rejected" && (
            <button
              type="button"
              onClick={onReject}
              className="
                rounded-md
                bg-[#EF4444]
                px-4
                py-2
                text-[9px]
                font-semibold
                text-white
                hover:bg-[#DC2626]
              "
            >
              Reject
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            className="
              rounded-md
              border
              border-[#FECACA]
              px-4
              py-2
              text-[9px]
              font-semibold
              text-[#EF4444]
              hover:bg-[#FFF1F2]
            "
          >
            Delete
          </button>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-md
              border
              border-[#E2E8F0]
              px-4
              py-2
              text-[9px]
              font-semibold
              text-[#526174]
            "
          >
            Close
          </button>

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[8px] text-[#8995A5]">
        {icon}
        {label}
      </p>

      <p className="mt-1 text-[10px] font-semibold text-[#33415A]">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   ADD NEW MODAL
   FULL VALIDATION
========================================================= */

function AddNewModal({
  onClose,
  onAdd,
  existingItems,
}: {
  onClose: () => void;
  onAdd: (
    item: Omit<
      OnboardingItem,
      "id" | "registeredOn" | "status"
    >
  ) => void;
  existingItems: OnboardingItem[];
}) {
  const [owner, setOwner] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [business, setBusiness] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [type, setType] =
    useState<OnboardingType>("Shop");

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [submitted, setSubmitted] =
    useState(false);

  /* =======================================================
     VALIDATE OWNER
  ======================================================= */

  const validateOwner = (
    value: string
  ): string => {
    const name = value.trim();

    if (!name) {
      return "Agent / Owner name is required.";
    }

    if (name.length < 2) {
      return "Name must contain at least 2 characters.";
    }

    if (name.length > 50) {
      return "Name cannot exceed 50 characters.";
    }

    if (!/^[A-Za-z.\s]+$/.test(name)) {
      return "Name can contain only letters, spaces and dots.";
    }

    return "";
  };

  /* =======================================================
     VALIDATE EMAIL
  ======================================================= */

  const validateEmail = (
    value: string
  ): string => {
    const emailValue =
      value.trim().toLowerCase();

    if (!emailValue) {
      return "Email address is required.";
    }

    if (emailValue.length > 100) {
      return "Email cannot exceed 100 characters.";
    }

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(emailValue)) {
      return "Please enter a valid email address.";
    }

    const duplicate =
      existingItems.some(
        (item) =>
          item.email.toLowerCase() ===
          emailValue
      );

    if (duplicate) {
      return "This email is already registered.";
    }

    return "";
  };

  /* =======================================================
     VALIDATE BUSINESS
  ======================================================= */

  const validateBusiness = (
    value: string
  ): string => {
    const businessValue =
      value.trim();

    if (!businessValue) {
      return "Shop / Business name is required.";
    }

    if (businessValue.length < 2) {
      return "Business name must contain at least 2 characters.";
    }

    if (businessValue.length > 100) {
      return "Business name cannot exceed 100 characters.";
    }

    return "";
  };

  /* =======================================================
     VALIDATE PHONE
  ======================================================= */

  const validatePhone = (
    value: string
  ): string => {
    const phoneValue =
      value.replace(/\D/g, "");

    if (!phoneValue) {
      return "Phone number is required.";
    }

    if (phoneValue.length !== 10) {
      return "Phone number must contain exactly 10 digits.";
    }

    if (!/^[6-9]\d{9}$/.test(phoneValue)) {
      return "Enter a valid Indian mobile number.";
    }

    const duplicate =
      existingItems.some(
        (item) =>
          item.phone.replace(
            /\D/g,
            ""
          ) === phoneValue
      );

    if (duplicate) {
      return "This phone number is already registered.";
    }

    return "";
  };

  /* =======================================================
     VALIDATE LOCATION
  ======================================================= */

  const validateLocation = (
    value: string
  ): string => {
    const locationValue =
      value.trim();

    if (!locationValue) {
      return "Location is required.";
    }

    if (locationValue.length < 2) {
      return "Location must contain at least 2 characters.";
    }

    if (locationValue.length > 100) {
      return "Location cannot exceed 100 characters.";
    }

    return "";
  };

  /* =======================================================
     VALIDATE TYPE
  ======================================================= */

  const validateType = (
    value: string
  ): string => {
    if (
      value !== "Agent" &&
      value !== "Shop"
    ) {
      return "Please select Agent or Shop.";
    }

    return "";
  };

  /* =======================================================
     VALIDATE ALL
  ======================================================= */

  const validateAll = () => {
    const nextErrors: FormErrors = {};

    const ownerError =
      validateOwner(owner);

    const emailError =
      validateEmail(email);

    const businessError =
      validateBusiness(business);

    const phoneError =
      validatePhone(phone);

    const locationError =
      validateLocation(location);

    const typeError =
      validateType(type);

    if (ownerError) {
      nextErrors.owner =
        ownerError;
    }

    if (emailError) {
      nextErrors.email =
        emailError;
    }

    if (businessError) {
      nextErrors.business =
        businessError;
    }

    if (phoneError) {
      nextErrors.phone =
        phoneError;
    }

    if (locationError) {
      nextErrors.location =
        locationError;
    }

    if (typeError) {
      nextErrors.type =
        typeError;
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const submit = () => {
    setSubmitted(true);

    const valid = validateAll();

    if (!valid) {
      return;
    }

    onAdd({
      owner: owner.trim(),
      email: email.trim().toLowerCase(),
      business: business.trim(),
      phone: phone.replace(
        /\D/g,
        ""
      ),
      location: location.trim(),
      type,
    });
  };

  /* =======================================================
     INPUT CHANGE VALIDATION
  ======================================================= */

  const changeOwner = (
    value: string
  ) => {
    setOwner(value);

    if (submitted) {
      setErrors((current) => ({
        ...current,
        owner:
          validateOwner(value) ||
          undefined,
      }));
    }
  };

  const changeEmail = (
    value: string
  ) => {
    setEmail(value);

    if (submitted) {
      setErrors((current) => ({
        ...current,
        email:
          validateEmail(value) ||
          undefined,
      }));
    }
  };

  const changeBusiness = (
    value: string
  ) => {
    setBusiness(value);

    if (submitted) {
      setErrors((current) => ({
        ...current,
        business:
          validateBusiness(
            value
          ) || undefined,
      }));
    }
  };

  const changePhone = (
    value: string
  ) => {
    const numericValue =
      value
        .replace(/\D/g, "")
        .slice(0, 10);

    setPhone(numericValue);

    if (submitted) {
      setErrors((current) => ({
        ...current,
        phone:
          validatePhone(
            numericValue
          ) || undefined,
      }));
    }
  };

  const changeLocation = (
    value: string
  ) => {
    setLocation(value);

    if (submitted) {
      setErrors((current) => ({
        ...current,
        location:
          validateLocation(
            value
          ) || undefined,
      }));
    }
  };

  /* =======================================================
     MODAL
  ======================================================= */

  return (
    <div
      className="
        fixed
        inset-0
        z-[110]
        flex
        items-center
        justify-center
        bg-black/40
        p-4
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="
        max-h-[90vh]
        w-full
        max-w-lg
        overflow-y-auto
        rounded-2xl
        bg-white
        shadow-2xl
      ">

        {/* HEADER */}

        <div className="
          sticky
          top-0
          z-10
          flex
          items-center
          justify-between
          border-b
          bg-white
          px-5
          py-4
        ">
          <div>
            <h2 className="text-[14px] font-bold text-[#10265B]">
              Add New Onboarding
            </h2>

            <p className="mt-1 text-[8px] text-[#8995A5]">
              Add a new agent or shop request
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              hover:bg-[#F4F6F9]
            "
          >
            <X size={15} />
          </button>
        </div>

        {/* FORM */}

        <div className="
          grid
          gap-4
          p-5
          sm:grid-cols-2
        ">

          {/* OWNER */}

          <InputField
            label="Agent / Owner"
            value={owner}
            onChange={changeOwner}
            placeholder="Enter owner name"
            maxLength={50}
            error={errors.owner}
          />

          {/* EMAIL */}

          <InputField
            label="Email"
            value={email}
            onChange={changeEmail}
            placeholder="Enter email"
            type="email"
            maxLength={100}
            error={errors.email}
          />

          {/* BUSINESS */}

          <InputField
            label="Shop / Business Name"
            value={business}
            onChange={changeBusiness}
            placeholder="Enter business name"
            maxLength={100}
            error={errors.business}
          />

          {/* PHONE */}

          <InputField
            label="Phone"
            value={phone}
            onChange={changePhone}
            placeholder="10 digit mobile"
            type="tel"
            maxLength={10}
            error={errors.phone}
          />

          {/* LOCATION */}

          <InputField
            label="Location"
            value={location}
            onChange={changeLocation}
            placeholder="City, State"
            maxLength={100}
            error={errors.location}
          />

          {/* TYPE */}

          <div>
            <label className="
              mb-1.5
              block
              text-[8px]
              font-semibold
              text-[#526174]
            ">
              Type

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={type}
              onChange={(event) => {
                setType(
                  event.target
                    .value as OnboardingType
                );

                if (submitted) {
                  setErrors((current) => ({
                    ...current,
                    type:
                      validateType(
                        event.target
                          .value
                      ) ||
                      undefined,
                  }));
                }
              }}
              className={`
                h-9
                w-full
                rounded-md
                border
                bg-white
                px-3
                text-[9px]
                outline-none
                ${
                  errors.type
                    ? "border-red-500"
                    : "border-[#E2E8F0]"
                }
              `}
            >
              <option value="Shop">
                Shop
              </option>

              <option value="Agent">
                Agent
              </option>
            </select>

            {errors.type && (
              <p className="mt-1 text-[8px] text-red-500">
                {errors.type}
              </p>
            )}
          </div>

          {/* INFO */}

          <div className="
            sm:col-span-2
            rounded-lg
            border
            border-[#DBEAFE]
            bg-[#EFF6FF]
            px-3
            py-2.5
          ">
            <p className="
              text-[8px]
              leading-4
              text-[#2563EB]
            ">
              New onboarding requests will
              be created with{" "}
              <b>Pending</b> status and
              require approval.
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div className="
          sticky
          bottom-0
          flex
          justify-end
          gap-2
          border-t
          bg-white
          px-5
          py-4
        ">
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-md
              border
              border-[#E2E8F0]
              px-4
              py-2
              text-[9px]
              font-semibold
              text-[#526174]
              hover:bg-[#F7F9FC]
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            className="
              rounded-md
              bg-[#1769F5]
              px-5
              py-2
              text-[9px]
              font-semibold
              text-white
              hover:bg-[#1258D4]
            "
          >
            Add New
          </button>
        </div>

      </div>
    </div>
  );
}

/* =========================================================
   FORM ERRORS
========================================================= */

type FormErrors = {
  owner?: string;
  email?: string;
  business?: string;
  phone?: string;
  location?: string;
  type?: string;
};

/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  error,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
  type?: string;
  maxLength?: number;
  error?: string;
}) {
  return (
    <div>
      <label className="
        mb-1.5
        block
        text-[8px]
        font-semibold
        text-[#526174]
      ">
        {label}

        <span className="ml-1 text-red-500">
          *
        </span>
      </label>

      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        aria-invalid={
          Boolean(error)
        }
        className={`
          h-9
          w-full
          rounded-md
          border
          px-3
          text-[9px]
          outline-none
          transition
          ${
            error
              ? "border-red-500 bg-[#FFF9F9]"
              : "border-[#E2E8F0] bg-white focus:border-[#1769F5]"
          }
        `}
      />

      {error && (
        <p className="
          mt-1
          text-[8px]
          leading-3
          text-red-500
        ">
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   PHONE FORMAT
========================================================= */

function formatPhone(
  phone: string
) {
  const value =
    phone.replace(/\D/g, "");

  if (value.length !== 10) {
    return phone;
  }

  return `${value.slice(
    0,
    5
  )} ${value.slice(5)}`;
}