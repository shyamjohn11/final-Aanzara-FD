"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import {
  ArrowLeft,
  Search,
  Plus,
  UserRound,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Pencil,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  UserCheck,
  UserX,
  KeyRound,
  Loader2,
} from "lucide-react";

import { toast } from "react-toastify";
import { extractErrorMessage } from "@/app/api/api";
import { adminUsersApi } from "@/app/api/services";

// =============================================================
// TYPE DEFINITIONS
// =============================================================

type UserStatus = "active" | "inactive" | "pending";
type UserRole = "admin" | "agent" | "customer";

interface UserItem {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  role: UserRole;
  status: UserStatus;
  joined: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiUser {
  userId: number | string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  mobile?: string;
  company?: string;
  roles?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

// =============================================================
// HELPER FUNCTIONS
// =============================================================

const mapApiUserToUserItem = (apiUser: ApiUser): UserItem => {
  // Determine status
  let status: UserStatus = "pending";
  if (apiUser.isActive === true) {
    status = "active";
  } else if (apiUser.isActive === false) {
    status = "inactive";
  } else if (apiUser.status) {
    const statusLower = apiUser.status.toLowerCase();
    if (statusLower === "active" || statusLower === "activated") {
      status = "active";
    } else if (statusLower === "inactive" || statusLower === "deactivated") {
      status = "inactive";
    } else {
      status = "pending";
    }
  }

  // Determine role
  let role: UserRole = "customer";
  if (apiUser.roles?.[0]) {
    const roleLower = apiUser.roles[0].toLowerCase();
    if (roleLower === "admin" || roleLower === "administrator") {
      role = "admin";
    } else if (roleLower === "agent" || roleLower === "sales_agent") {
      role = "agent";
    } else {
      role = "customer";
    }
  }

  // Get full name
  let name = apiUser.name || "";
  if (!name && apiUser.firstName) {
    name = apiUser.firstName;
    if (apiUser.lastName) {
      name += ` ${apiUser.lastName}`;
    }
  }

  return {
    id: apiUser.userId,
    name: name || "Unknown User",
    email: apiUser.email,
    phone: apiUser.phone || apiUser.mobile || "",
    company: apiUser.company || "",
    role: role,
    status: status,
    joined: apiUser.createdAt ? new Date(apiUser.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
  };
};

export default function UsersPage() {
  const router = useRouter();

  // =============================================================
  // STATE
  // =============================================================

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | UserStatus>("All");
  const [roleFilter, setRoleFilter] = useState<"All" | UserRole>("All");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [viewUser, setViewUser] = useState<UserItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [saved, setSaved] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "customer" as UserRole,
    status: "active" as UserStatus,
  });

  type UserFormErrors = Partial<
    Record<"name" | "email" | "phone" | "company" | "role" | "status", string>
  >;

  const [errors, setErrors] = useState<UserFormErrors>({});

  // =============================================================
  // FETCH USERS
  // =============================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user's role from session
      const userRole = sessionStorage.getItem("aanzara_user_role");
      
      // Only fetch if admin
      if (userRole !== "admin") {
        setError("Unauthorized: Admin access required");
        setLoading(false);
        return;
      }

      // #12 GET /api/admin/users?Page=1&PageSize=25 (paginated)
      const response = await adminUsersApi.list(1, 100);
      const data = response.data;

      if (Array.isArray(data)) {
        setUsers(data.map(mapApiUserToUserItem));
      } else if (data && Array.isArray(data.items)) {
        setUsers(data.items.map(mapApiUserToUserItem));
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      const errorMsg = extractErrorMessage(err, "Failed to load users. Please try again.");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // =============================================================
  // STATS
  // =============================================================

  const statusRoleCounts = useMemo(() => {
    let active = 0;
    let pending = 0;
    let inactive = 0;
    let admin = 0;
    let agent = 0;
    let customer = 0;

    for (const user of users) {
      if (user.status === "active") active += 1;
      else if (user.status === "pending") pending += 1;
      else if (user.status === "inactive") inactive += 1;

      if (user.role === "admin") admin += 1;
      else if (user.role === "agent") agent += 1;
      else if (user.role === "customer") customer += 1;
    }

    return { active, pending, inactive, admin, agent, customer };
  }, [users]);

  const activeUsers = statusRoleCounts.active;
  const pendingUsers = statusRoleCounts.pending;
  const inactiveUsers = statusRoleCounts.inactive;
  const adminUsers = statusRoleCounts.admin;

  // =============================================================
  // FILTER USERS
  // =============================================================

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        (user.company && user.company.toLowerCase().includes(query));

      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      const matchesRole = roleFilter === "All" || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  // =============================================================
  // CLEAR ERROR
  // =============================================================

  const clearError = (field: keyof UserFormErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  // =============================================================
  // VALIDATE USER
  // =============================================================

  const validateUser = () => {
    const next: UserFormErrors = {};
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!name) {
      next.name = "Full name is required.";
    } else if (name.length < 2 || name.length > 100) {
      next.name = "Full name must be 2–100 characters.";
    }

    if (!email) {
      next.email = "Email address is required.";
    } else if (email.length > 254) {
      next.email = "Email address is too long.";
    } else if (
      !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
        email
      )
    ) {
      next.email = "Enter a valid email address.";
    } else if (
      users.some(
        (user) =>
          user.email.trim().toLowerCase() === email && user.id !== editingId
      )
    ) {
      next.email = "This email address is already registered.";
    }

    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (phone && !/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
      next.phone = "Enter a valid phone number (10–15 digits).";
    } else if (
      phone &&
      users.some(
        (user) =>
          user.phone.replace(/[\s()-]/g, "") === normalizedPhone &&
          user.id !== editingId
      )
    ) {
      next.phone = "This phone number is already registered.";
    }

    if (form.role !== "admin" && form.role !== "agent" && form.role !== "customer") {
      next.role = "Please select a valid user role.";
    }

    if (
      form.status !== "active" &&
      form.status !== "inactive" &&
      form.status !== "pending"
    ) {
      next.status = "Please select a valid account status.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // =============================================================
  // RESET FORM
  // =============================================================

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "customer",
      status: "active",
    });
    setEditingId(null);
    setErrors({});
  };

  // =============================================================
  // CREATE USER
  // =============================================================

  const openCreate = () => {
    resetForm();
    setErrors({});
    setShowForm(true);
  };

  // =============================================================
  // EDIT USER
  // =============================================================

  const openEdit = (user: UserItem) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company || "",
      role: user.role,
      status: user.status,
    });
    setErrors({});
    setShowForm(true);
  };

  // =============================================================
  // VIEW USER (fresh details via #13)
  // =============================================================

  const openView = async (user: UserItem) => {
    // Show the row immediately, then refresh from the server.
    setViewUser(user);

    try {
      // #13 GET /api/admin/users/{userId} — user details
      const response = await adminUsersApi.details(user.id);
      const data = response.data as ApiUser;
      setViewUser(
        mapApiUserToUserItem({ ...data, userId: data.userId ?? user.id })
      );
    } catch (err) {
      console.error("Failed to load user details:", err);
    }
  };

  // =============================================================
  // SAVE USER (Create/Update via API)
  // =============================================================

  const saveUser = async () => {
    if (!validateUser()) return;

    try {
      setFormLoading(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        role: form.role,
        status: form.status,
      };

      if (editingId !== null) {
        // #15 PUT /api/admin/users/{userId} — update existing user
        await adminUsersApi.update(editingId, payload);

        // #17 PATCH /api/admin/users/{userId}/role — explicit role change
        const previous = users.find((user) => user.id === editingId);
        if (previous && previous.role !== form.role) {
          await adminUsersApi.setRole(editingId, form.role);
        }

        toast.success("User updated successfully!");
      } else {
        // #14 POST /api/admin/users — create new user
        await adminUsersApi.create(payload);
        toast.success("User created successfully!");
      }

      // Refresh user list
      await fetchUsers();

      setShowForm(false);
      resetForm();
      showSuccess();
    } catch (err) {
      console.error("Failed to save user:", err);
      const errorMsg = extractErrorMessage(err, "Failed to save user. Please try again.");
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  // =============================================================
  // DELETE USER
  // =============================================================

  const deleteUser = async () => {
    if (deleteId === null) return;

    try {
      setFormLoading(true);
      // #18 DELETE /api/admin/users/{userId}
      await adminUsersApi.remove(deleteId);
      
      // Refresh user list
      await fetchUsers();
      
      setDeleteId(null);
      toast.success("User deleted successfully!");
      showSuccess();
    } catch (err) {
      console.error("Failed to delete user:", err);
      const errorMsg = extractErrorMessage(err, "Failed to delete user. Please try again.");
      toast.error(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  // =============================================================
  // TOGGLE STATUS
  // =============================================================

  const toggleStatus = async (id: number | string) => {
    try {
      const user = users.find((u) => u.id === id);
      if (!user) return;

      const newStatus: UserStatus = user.status === "active" ? "inactive" : "active";

      // #16 PATCH /api/admin/users/{userId}/status — block/unblock
      await adminUsersApi.setStatus(id, newStatus);

      // Refresh user list
      await fetchUsers();
      
      toast.success(`User status updated to ${newStatus}`);
      showSuccess();
    } catch (err) {
      console.error("Failed to toggle status:", err);
      const errorMsg = extractErrorMessage(err, "Failed to update user status.");
      toast.error(errorMsg);
    }
  };

  // =============================================================
  // SUCCESS TOAST
  // =============================================================

  const showSuccess = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  // =============================================================
  // RENDER
  // =============================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#1769F5] mx-auto" />
            <p className="mt-4 text-sm text-[#52627A]">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && users.length === 0) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 mx-auto">
              <X size={32} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#263650]">Failed to Load Users</h3>
            <p className="mt-2 text-sm text-[#8995A5]">{error}</p>
            <button
              type="button"
              onClick={fetchUsers}
              className="mt-4 rounded-lg bg-[#1769F5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F5BDE]"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

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
              Users
            </h1>
            <p className="hidden text-[9px] text-[#8995A5] sm:block">
              Manage platform users and accounts
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </header>

        {/* =================================================
            CONTENT
        ================================================== */}

        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-2 text-[9px] text-[#8995A5]">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="hover:text-[#1769F5]"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="font-medium text-[#566579]">Users</span>
          </div>

          {/* Stats */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={users.length}
              icon={UserRound}
              bg="bg-[#EDF3FF]"
              iconColor="text-[#3260B4]"
            />
            <StatCard
              title="Active Users"
              value={activeUsers}
              icon={UserCheck}
              bg="bg-[#EAF8F0]"
              iconColor="text-[#249357]"
            />
            <StatCard
              title="Pending Users"
              value={pendingUsers}
              icon={KeyRound}
              bg="bg-[#FFF5DF]"
              iconColor="text-[#C17B19]"
            />
            <StatCard
              title="Admin Users"
              value={adminUsers}
              icon={ShieldCheck}
              bg="bg-[#F3F0FF]"
              iconColor="text-[#7053A8]"
            />
          </section>

          {/* Search / Filter */}
          <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 lg:max-w-[460px]">
                <Search size={16} className="shrink-0 text-[#8995A5]" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, phone or company..."
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

              {/* Status Filters */}
              <div className="flex gap-1.5 overflow-x-auto">
                {(["All", "active", "pending", "inactive"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`
                        shrink-0 rounded-lg px-3 py-2 text-[9px] font-semibold
                        ${
                          statusFilter === status
                            ? "bg-[#173B7A] text-white"
                            : "bg-[#F5F7FA] text-[#68778B] hover:bg-[#EDEFF3]"
                        }
                      `}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  )
                )}
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as "All" | UserRole)
                }
                className="h-9 rounded-lg border border-[#DCE2EA] bg-white px-3 text-[9px] font-semibold text-[#52627A] outline-none focus:border-[#1769F5]"
              >
                <option value="All">All Roles</option>
                <option value="admin">Admin</option>
                <option value="agent">Agent</option>
                <option value="customer">Customer</option>
              </select>
            </div>
          </section>

          {/* User List */}
          <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">
              <div>
                <h2 className="text-[13px] font-bold text-[#263650]">
                  User List
                </h2>
                <p className="mt-1 text-[9px] text-[#8995A5]">
                  {filteredUsers.length} users found
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setRoleFilter("All");
                }}
                className="text-[9px] font-semibold text-[#1769F5] hover:underline"
              >
                Clear Filters
              </button>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
                  <UserRound size={25} />
                </div>
                <h3 className="mt-4 text-[13px] font-bold">No users found</h3>
                <p className="mt-1 text-[10px] text-[#8995A5]">
                  Try changing your search or filters.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          User
                        </th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Contact
                        </th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Company
                        </th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Role
                        </th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Joined
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
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#3260B4]">
                                <UserRound size={17} />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-[#33415A]">
                                  {user.name}
                                </p>
                                <p className="mt-1 text-[8px] text-[#8995A5]">
                                  ID: USR-{String(user.id).padStart(4, "0")}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Mail size={11} className="text-[#8995A5]" />
                                <span className="text-[9px] text-[#52627A]">
                                  {user.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Phone size={11} className="text-[#8995A5]" />
                                <span className="text-[9px] text-[#8995A5]">
                                  {user.phone || "N/A"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 size={13} className="text-[#1769F5]" />
                              <span className="max-w-[150px] truncate text-[9px] font-semibold text-[#52627A]">
                                {user.company || "Individual"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <RoleBadge role={user.role} />
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-[9px] text-[#66748B]">
                              {user.joined}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => toggleStatus(user.id)}
                            >
                              <StatusBadge status={user.status} />
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openView(user)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E5EC] text-[#52627A] hover:bg-[#F4F6F9]"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(user)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E5EC] text-[#1769F5] hover:bg-[#EDF3FF]"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteId(user.id)}
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

                {/* Mobile View */}
                <div className="divide-y divide-[#EDF0F4] md:hidden">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#3260B4]">
                          <UserRound size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-bold text-[#33415A]">
                                {user.name}
                              </p>
                              <p className="mt-1 truncate text-[8px] text-[#8995A5]">
                                {user.email}
                              </p>
                            </div>
                            <StatusBadge status={user.status} />
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Info label="Phone" value={user.phone || "N/A"} />
                            <Info label="Company" value={user.company || "Individual"} />
                            <Info label="Role" value={user.role} />
                            <Info label="Joined" value={user.joined} />
                          </div>

                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openView(user)}
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[9px] font-semibold text-[#52627A]"
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(user)}
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[9px] font-semibold text-[#1769F5]"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(user.id)}
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#F0D4D4] px-3 text-[9px] font-semibold text-[#D85A5A]"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Inactive Info */}
          {inactiveUsers > 0 && (
            <div className="mt-4 flex items-center rounded-xl border border-[#F0DADA] bg-[#FFF7F7] px-4 py-3">
              <UserX size={16} className="mr-2 text-[#D85A5A]" />
              <p className="text-[9px] text-[#7C6262]">
                {inactiveUsers} user{inactiveUsers > 1 ? "s" : ""} currently inactive.
              </p>
            </div>
          )}
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

            <div className="relative max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">
                <div>
                  <h2 className="text-[14px] font-bold text-[#263650]">
                    {editingId !== null ? "Edit User" : "Add User"}
                  </h2>
                  <p className="mt-1 text-[9px] text-[#8995A5]">
                    Enter user account information
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

              {/* Form */}
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
                    label="Full Name"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={(value) => {
                      setForm({ ...form, name: value });
                      clearError("name");
                    }}
                    maxLength={100}
                    error={errors.name}
                  />

                  <FormInput
                    label="Email Address"
                    placeholder="Enter email address"
                    type="email"
                    value={form.email}
                    onChange={(value) => {
                      setForm({ ...form, email: value });
                      clearError("email");
                    }}
                    maxLength={254}
                    error={errors.email}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormInput
                    label="Phone Number"
                    placeholder="Enter phone number"
                    type="tel"
                    value={form.phone}
                    onChange={(value) => {
                      setForm({ ...form, phone: value });
                      clearError("phone");
                    }}
                    maxLength={20}
                    error={errors.phone}
                  />

                  <FormInput
                    label="Company"
                    placeholder="Enter company name"
                    value={form.company}
                    onChange={(value) => {
                      setForm({ ...form, company: value });
                      clearError("company");
                    }}
                    maxLength={120}
                    error={errors.company}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[9px] font-semibold text-[#52627A]">
                      User Role
                    </label>
                    <select
                      value={form.role}
                      onChange={(event) => {
                        setForm({
                          ...form,
                          role: event.target.value as UserRole,
                        });
                        clearError("role");
                      }}
                      aria-invalid={Boolean(errors.role)}
                      className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                        errors.role ? "border-[#EF4444]" : "border-[#DCE2EA]"
                      }`}
                    >
                      <option value="admin">Admin</option>
                      <option value="agent">Agent</option>
                      <option value="customer">Customer</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                        {errors.role}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] font-semibold text-[#52627A]">
                      Account Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(event) => {
                        setForm({
                          ...form,
                          status: event.target.value as UserStatus,
                        });
                        clearError("status");
                      }}
                      aria-invalid={Boolean(errors.status)}
                      className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                        errors.status ? "border-[#EF4444]" : "border-[#DCE2EA]"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                        {errors.status}
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-xl border border-[#D7E5FF] bg-[#F2F7FF] p-4">
                  <p className="text-[8px] font-semibold uppercase tracking-wide text-[#8995A5]">
                    User Preview
                  </p>
                  <div className="mt-3 flex items-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1769F5] shadow-sm">
                      <UserRound size={19} />
                    </div>
                    <div className="ml-3 min-w-0">
                      <p className="truncate text-[11px] font-bold text-[#33415A]">
                        {form.name || "User Name"}
                      </p>
                      <p className="mt-1 truncate text-[8px] text-[#8995A5]">
                        {form.email || "user@example.com"}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <RoleBadge role={form.role} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
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
                  onClick={saveUser}
                  disabled={formLoading}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] disabled:opacity-60"
                >
                  {formLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  {editingId !== null ? "Update User" : "Save User"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            VIEW MODAL
        ================================================== */}

        {viewUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
            <div className="absolute inset-0" onClick={() => setViewUser(null)} />

            <div className="relative w-full max-w-[480px] rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                    <UserRound size={18} />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-bold text-[#263650]">
                      {viewUser.name}
                    </h2>
                    <p className="mt-1 text-[8px] text-[#8995A5]">
                      User ID: USR-{String(viewUser.id).padStart(4, "0")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewUser(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="space-y-3 p-5">
                <ViewRow icon={Mail} label="Email" value={viewUser.email} />
                <ViewRow icon={Phone} label="Phone" value={viewUser.phone || "N/A"} />
                <ViewRow
                  icon={Building2}
                  label="Company"
                  value={viewUser.company || "Individual"}
                />
                <ViewRow icon={ShieldCheck} label="Role" value={viewUser.role} />
                <ViewRow icon={UserCheck} label="Joined" value={viewUser.joined} />

                <div className="flex items-center justify-between rounded-xl bg-[#F7F9FC] px-4 py-3">
                  <span className="text-[9px] font-semibold text-[#8995A5]">
                    Account Status
                  </span>
                  <StatusBadge status={viewUser.status} />
                </div>
              </div>

              <div className="border-t border-[#E5E9EF] px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewUser(null);
                    openEdit(viewUser);
                  }}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
                >
                  <Pencil size={13} /> Edit User
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
            <div className="absolute inset-0" onClick={() => setDeleteId(null)} />

            <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D85A5A]">
                <Trash2 size={20} />
              </div>

              <h2 className="mt-4 text-[14px] font-bold text-[#263650]">
                Delete User?
              </h2>
              <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
                This user will be permanently removed from the admin user list.
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deleteUser}
                  disabled={formLoading}
                  className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D] disabled:opacity-60"
                >
                  {formLoading ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {saved && (
          <div className="fixed bottom-5 right-5 z-[150] flex items-center rounded-xl bg-[#173B7A] px-5 py-3 text-white shadow-xl">
            <CheckCircle2 size={17} className="mr-2 text-[#69D393]" />
            <div>
              <p className="text-[10px] font-bold">Done</p>
              <p className="mt-0.5 text-[8px] text-[#C8D4E7]">
                User information updated successfully.
              </p>
            </div>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}

// =============================================================
// COMPONENTS (Unchanged from original)
// =============================================================

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
          <p className="text-[9px] font-medium text-[#8995A5]">{title}</p>
          <p className="mt-2 text-[20px] font-bold text-[#293953]">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${iconColor}`}>
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const classes =
    status === "active"
      ? "bg-[#EAF8F0] text-[#249357]"
      : status === "pending"
      ? "bg-[#FFF5DF] text-[#C17B19]"
      : "bg-[#FFF0F0] text-[#D85A5A]";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold ${classes}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const classes =
    role === "admin"
      ? "bg-[#F3F0FF] text-[#7053A8]"
      : role === "agent"
      ? "bg-[#EDF3FF] text-[#3260B4]"
      : "bg-[#F1F8F4] text-[#35845A]";

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-[8px] font-semibold ${classes}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="text-[9px] font-semibold text-[#52627A]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10 ${
          error ? "border-[#EF4444]" : "border-[#DCE2EA]"
        }`}
      />
      {error && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{error}</p>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#F7F9FC] px-2.5 py-2">
      <p className="text-[7px] uppercase tracking-wide text-[#9AA5B4]">{label}</p>
      <p className="mt-1 truncate text-[9px] font-semibold text-[#52627A]">{value}</p>
    </div>
  );
}

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
        <p className="text-[8px] uppercase tracking-wide text-[#9AA5B4]">{label}</p>
        <p className="mt-1 break-words text-[10px] font-semibold text-[#52627A]">{value}</p>
      </div>
    </div>
  );
}
