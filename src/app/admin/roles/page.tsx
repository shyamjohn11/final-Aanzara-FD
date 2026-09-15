"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { api, extractErrorMessage } from "@/app/api/api";
import { rolesApi, permissionsApi } from "@/app/api/services";
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Save,
  Eye,
  KeyRound,
} from "lucide-react";

type RoleStatus = "Active" | "Inactive";

type Permission = {
  key: string;
  label: string;
  description: string;
};

type Role = {
  id: number;
  serverId?: string | number;
  name: string;
  description: string;
  users: number;
  status: RoleStatus;
  permissions: string[];
  createdAt: string;
};

const PERMISSIONS: Permission[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "View admin dashboard and statistics",
  },
  {
    key: "products",
    label: "Products",
    description: "Create, edit and manage products",
  },
  {
    key: "inventory",
    label: "Inventory",
    description: "Manage stock and inventory",
  },
  {
    key: "orders",
    label: "Orders",
    description: "View and manage customer orders",
  },
  {
    key: "users",
    label: "Users",
    description: "Manage customer and admin users",
  },
  {
    key: "businessAccounts",
    label: "Business Accounts",
    description: "Manage wholesale business accounts",
  },
  {
    key: "pricing",
    label: "Pricing",
    description: "Manage pricing and wholesale rates",
  },
  {
    key: "offers",
    label: "Offers",
    description: "Manage offers, coupons and promotions",
  },
  {
    key: "brands",
    label: "Brands",
    description: "Manage product brands",
  },
  {
    key: "categories",
    label: "Categories",
    description: "Manage categories and subcategories",
  },
  {
    key: "quotes",
    label: "Quotes",
    description: "Manage quotations and enquiries",
  },
  {
    key: "reports",
    label: "Reports",
    description: "View reports and analytics",
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "Manage product reviews",
  },
  {
    key: "settings",
    label: "Settings",
    description: "Manage system settings",
  },
];

export default function RolesPage() {
  const router = useRouter();

  const [roles, setRoles] =
    useState<Role[]>([]);

  // A4 permission catalog ({permissionId, permissionName, module}).
  // Keys are server permissionIds; falls back to the static list
  // when the endpoint is unreachable.
  const [permissionCatalog, setPermissionCatalog] = useState<Permission[]>(
    []
  );

  const effectivePermissions =
    permissionCatalog.length > 0 ? permissionCatalog : PERMISSIONS;

  const normalizePerms = (
    perms: unknown,
    catalog: Permission[]
  ): string[] => {
    if (!Array.isArray(perms)) return [];
    return perms
      .map((entry) => {
        const raw = String(entry);
        if (catalog.some((item) => item.key === raw)) return raw;
        const byLabel = catalog.find(
          (item) => item.label.toLowerCase() === raw.toLowerCase()
        );
        return byLabel ? byLabel.key : raw;
      })
      .filter((key, index, array) => key && array.indexOf(key) === index);
  };

  // ==========================================
  // LOAD PERMISSIONS + ROLES (A4 + #19)
  // ==========================================

  const fetchRoles = async (signal?: { cancelled: boolean }) => {
    const response = await rolesApi.list();
    const payload = response.data;
    const rawRoles: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    if (signal?.cancelled) return;

    if (rawRoles.length === 0) {
      setRoles([]);
      return;
    }

    const mapped: Role[] = rawRoles.map((item, index) => {
      const name = String(item.name ?? item.roleName ?? `Role ${index + 1}`);
      return {
        id: index + 1,
        serverId: item.roleId ?? item.id ?? undefined,
        name,
        description: String(
          item.description ?? item.desc ?? ""
        ),
        users: Number(item.users ?? item.userCount ?? 0),
        status:
          String(item.status ?? "Active").toLowerCase() === "inactive"
            ? "Inactive"
            : "Active",
        permissions: normalizePerms(
          item.permissions ?? item.permissionIds,
          permissionCatalogRef.current
        ),
        createdAt: String(item.createdAt ?? item.created_on ?? new Date().toISOString().split("T")[0]),
      };
    });

    setRoles(mapped);
  };

  // Latest catalog for mappers running outside render.
  const permissionCatalogRef = useRef<Permission[]>([]);
  permissionCatalogRef.current = permissionCatalog;

  useEffect(() => {
    const signal = { cancelled: false };

    const load = async () => {
      // Catalog first so role permission values resolve to IDs.
      try {
        const response = await permissionsApi.list();
        const payload = response.data;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
        if (!signal.cancelled && raw.length > 0) {
          const mapped: Permission[] = [];
          raw.forEach((entry: any) => {
            const key = String(
              entry?.permissionId ?? entry?.id ?? ""
            );
            if (!key) return;
            mapped.push({
              key,
              label: String(
                entry?.permissionName ?? entry?.name ?? key
              ),
              description: String(entry?.module ?? entry?.description ?? ""),
            });
          });
          if (mapped.length > 0) {
            permissionCatalogRef.current = mapped;
            setPermissionCatalog(mapped);
          }
        }
      } catch (error) {
        console.error("Unable to load permissions:", error);
      }

      try {
        await fetchRoles(signal);
      } catch (error) {
        console.error("Unable to load roles:", error);
        if (!signal.cancelled) {
          setRoles([]);
          console.warn(
            extractErrorMessage(error, "Unable to reach the roles service.")
          );
        }
      }
    };

    load();

    return () => {
      signal.cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | RoleStatus>("All");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [viewRole, setViewRole] =
    useState<Role | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Active" as RoleStatus,
    permissions: [] as string[],
  });

  type RoleFormErrors = {
    name?: string;
    description?: string;
    status?: string;
    permissions?: string;
  };

  const [errors, setErrors] = useState<RoleFormErrors>({});
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const clearError = (field: keyof RoleFormErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateRole = () => {
    const next: RoleFormErrors = {};
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      next.name = "Role name is required.";
    } else if (name.length < 2 || name.length > 80) {
      next.name = "Role name must be 2–80 characters.";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9 &'().,_-]*$/.test(name)) {
      next.name = "Role name contains invalid characters.";
    }

    if (description.length > 500) {
      next.description = "Description must be 500 characters or less.";
    }

    if (form.status !== "Active" && form.status !== "Inactive") {
      next.status = "Please select a valid status.";
    }

    if (form.permissions.length === 0) {
      next.permissions = "Select at least one permission.";
    } else {
      const validPermissionKeys = new Set(
        effectivePermissions.map((permission) => permission.key)
      );
      const hasInvalidPermission = form.permissions.some(
        (permission) => !validPermissionKeys.has(permission)
      );

      if (hasInvalidPermission) {
        next.permissions = "One or more selected permissions are invalid.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredRoles = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return roles.filter((role) => {
      const matchesSearch =
        !query ||
        role.name
          .toLowerCase()
          .includes(query) ||
        role.description
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        role.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [roles, search, statusFilter]);

  /* =====================================================
     STATS
  ====================================================== */

  const activeRoles = roles.filter(
    (role) => role.status === "Active"
  ).length;

  const inactiveRoles = roles.filter(
    (role) => role.status === "Inactive"
  ).length;

  const totalUsers = roles.reduce(
    (total, role) => total + role.users,
    0
  );

  /* =====================================================
     RESET
  ====================================================== */

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      status: "Active",
      permissions: [],
    });

    setEditingId(null);
    setErrors({});
    setSaveError("");
  };

  /* =====================================================
     CREATE
  ====================================================== */

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  /* =====================================================
     EDIT (A4 detail refresh)
  ====================================================== */

  const openEdit = (role: Role) => {
    setEditingId(role.id);
    setSaveError("");

    setForm({
      name: role.name,
      description: role.description,
      status: role.status,
      permissions: [...role.permissions],
    });

    setShowForm(true);

    // Refresh permission set + user count from the server.
    if (role.serverId !== undefined) {
      rolesApi
        .details(role.serverId)
        .then((response) => {
          const raw = (response.data ?? {}) as Record<string, unknown>;
          const perms = normalizePerms(
            raw.permissions ?? raw.permissionIds,
            permissionCatalogRef.current
          );
          const users = Number(raw.users ?? raw.userCount ?? role.users);
          setForm((current) => ({
            ...current,
            permissions: perms.length > 0 ? perms : current.permissions,
          }));
          setRoles((current) =>
            current.map((entry) =>
              entry.id === role.id
                ? {
                    ...entry,
                    users: Number.isFinite(users) ? users : entry.users,
                    permissions:
                      perms.length > 0 ? perms : entry.permissions,
                  }
                : entry
            )
          );
        })
        .catch((error) => {
          console.error("Unable to load role details:", error);
        });
    }
  };

  /* =====================================================
     VIEW (A4 detail refresh)
  ====================================================== */

  const openView = (role: Role) => {
    setViewRole(role);

    if (role.serverId !== undefined) {
      rolesApi
        .details(role.serverId)
        .then((response) => {
          const raw = (response.data ?? {}) as Record<string, unknown>;
          const perms = normalizePerms(
            raw.permissions ?? raw.permissionIds,
            permissionCatalogRef.current
          );
          const users = Number(raw.users ?? raw.userCount ?? role.users);
          setViewRole((current) =>
            current && current.id === role.id
              ? {
                  ...current,
                  users: Number.isFinite(users) ? users : current.users,
                  permissions:
                    perms.length > 0 ? perms : current.permissions,
                }
              : current
          );
        })
        .catch((error) => {
          console.error("Unable to load role details:", error);
        });
    }
  };

  /* =====================================================
     PERMISSION TOGGLE
  ====================================================== */

  const togglePermission = (
    permission: string
  ) => {
    setForm((current) => ({
      ...current,
      permissions:
        current.permissions.includes(permission)
          ? current.permissions.filter(
              (item) => item !== permission
            )
          : [
              ...current.permissions,
              permission,
            ],
    }));
    clearError("permissions");
  };

  /* =====================================================
     SELECT ALL
  ====================================================== */

  const selectAllPermissions = () => {
    setForm((current) => ({
      ...current,
      permissions: effectivePermissions.map(
        (permission) => permission.key
      ),
    }));
    clearError("permissions");
  };

  /* =====================================================
     CLEAR ALL
  ====================================================== */

  const clearAllPermissions = () => {
    setForm((current) => ({
      ...current,
      permissions: [],
    }));
  };

  /* =====================================================
     SAVE (A4 create / update)
  ====================================================== */

  const saveRole = async () => {
    if (!validateRole()) return;
    setSaveError("");

    // Permission keys are server IDs only when the catalog loaded.
    // Saving static fallback keys as IDs would corrupt the role.
    if (permissionCatalogRef.current.length === 0) {
      setSaveError(
        "Permission catalog is unavailable. Cannot save the role right now."
      );
      return;
    }

    const permissionIds = [...form.permissions];
    const roleName = form.name.trim();

    try {
      if (editingId !== null) {
        const target = roles.find((role) => role.id === editingId);
        if (target?.serverId !== undefined) {
          // A4 PUT /api/admin/roles/{roleId} (+ description/status as
          // extra props; backend binds roleName + permissionIds).
          await rolesApi.update(target.serverId, {
            roleName,
            permissionIds,
            description: form.description.trim(),
            status: form.status,
          });
        }
      } else {
        // A4 POST /api/admin/roles — 409 on duplicate name.
        await rolesApi.create({
          roleName,
          permissionIds,
          description: form.description.trim(),
          status: form.status,
        });
      }

      await fetchRoles();
      setShowForm(false);
      resetForm();
      showSuccess();
    } catch (error) {
      console.error("Unable to save role:", error);
      setSaveError(
        extractErrorMessage(error, "Unable to save the role. Please try again.")
      );
    }
  };

  /* =====================================================
     DELETE (A4 — 409 when Admin or users assigned)
  ====================================================== */

  const deleteRole = async () => {
    if (deleteId === null) {
      return;
    }

    const target = roles.find((role) => role.id === deleteId);

    try {
      if (target?.serverId !== undefined) {
        await rolesApi.remove(target.serverId);
        await fetchRoles();
      } else {
        setRoles((current) =>
          current.filter((role) => role.id !== deleteId)
        );
      }

      setDeleteId(null);
      setDeleteError("");
      setViewRole(null);
      showSuccess();
    } catch (error) {
      console.error("Unable to delete role:", error);
      setDeleteError(
        extractErrorMessage(
          error,
          "Unable to delete the role. The Admin role is protected and roles with assigned users cannot be deleted."
        )
      );
    }
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
            Roles & Permissions
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage administrator roles and access permissions
          </p>

        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Create Role
          </span>

          <span className="sm:hidden">
            Add
          </span>
        </button>

      </header>

      {/* =================================================
          CONTENT
      ================================================== */}

      <div className="mx-auto w-full max-w-[1450px] px-4 py-6 sm:px-6 lg:px-8">

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
            Roles
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            title="Total Roles"
            value={roles.length}
            icon={ShieldCheck}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#1769F5]"
          />

          <StatCard
            title="Active Roles"
            value={activeRoles}
            icon={CheckCircle2}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Inactive Roles"
            value={inactiveRoles}
            icon={XCircle}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

          <StatCard
            title="Assigned Users"
            value={totalUsers}
            icon={Users}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

        </section>

        {/* =================================================
            FILTER
        ================================================== */}

        <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="flex h-10 flex-1 items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3">

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
                placeholder="Search roles..."
                className="w-full bg-transparent px-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8]"
              />

            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "All"
                    | RoleStatus
                )
              }
              className="h-10 rounded-lg border border-[#DFE5ED] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] sm:w-[150px]"
            >

              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              className="h-10 rounded-lg border border-[#DCE2EA] px-4 text-[9px] font-semibold text-[#647287] hover:bg-[#F5F7FA]"
            >
              Clear
            </button>

          </div>

        </section>

        {/* =================================================
            ROLE TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="border-b border-[#EDF0F4] px-5 py-4">

            <h2 className="text-[13px] font-bold text-[#293953]">
              Admin Roles
            </h2>

            <p className="mt-1 text-[9px] text-[#8995A5]">
              {filteredRoles.length} roles found
            </p>

          </div>

          {filteredRoles.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* =================================================
                  DESKTOP TABLE
              ================================================== */}

              <div className="hidden overflow-x-auto md:block">

                <table className="min-w-full">

                  <thead>

                    <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Role
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Permissions
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Users
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Created
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredRoles.map(
                      (role) => (
                        <tr
                          key={role.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* ROLE */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                                <KeyRound
                                  size={17}
                                />
                              </div>

                              <div className="min-w-0">

                                <p className="text-[10px] font-bold text-[#33415A]">
                                  {role.name}
                                </p>

                                <p className="mt-1 max-w-[280px] truncate text-[8px] text-[#8995A5]">
                                  {
                                    role.description
                                  }
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* PERMISSIONS */}

                          <td className="px-5 py-4">

                            <div className="flex max-w-[300px] flex-wrap gap-1">

                              {role.permissions
                                .slice(0, 4)
                                .map(
                                  (
                                    permission
                                  ) => (
                                    <span
                                      key={
                                        permission
                                      }
                                      className="rounded-full bg-[#F2F4F7] px-2 py-1 text-[7px] font-medium text-[#66748B]"
                                    >
                                      {
                                        getPermissionLabel(
                                          permission
                                        )
                                      }
                                    </span>
                                  )
                                )}

                              {role
                                .permissions
                                .length >
                                4 && (
                                <span className="rounded-full bg-[#EDF3FF] px-2 py-1 text-[7px] font-semibold text-[#1769F5]">
                                  +
                                  {role
                                    .permissions
                                    .length -
                                    4}
                                </span>
                              )}

                            </div>

                          </td>

                          {/* USERS */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Users
                                size={14}
                                className="text-[#8995A5]"
                              />

                              <span className="text-[10px] font-bold text-[#52627A]">
                                {
                                  role.users
                                }
                              </span>

                            </div>

                          </td>

                          {/* CREATED */}

                          <td className="px-5 py-4">

                            <span className="text-[9px] text-[#66748B]">
                              {
                                role.createdAt
                              }
                            </span>

                          </td>

                          {/* STATUS (read-only: no status column on backend) */}

                          <td className="px-5 py-4">

                            <span title="Status is managed by the backend">
                              <StatusBadge
                                status={
                                  role.status
                                }
                              />
                            </span>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1.5">

                              <button
                                type="button"
                                onClick={() =>
                                  openView(
                                    role
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE2EA] text-[#52627A] hover:bg-[#F3F5F8]"
                                aria-label="View role"
                              >
                                <Eye
                                  size={13}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    role
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE2EA] text-[#1769F5] hover:bg-[#EDF3FF]"
                                aria-label="Edit role"
                              >
                                <Pencil
                                  size={13}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteId(
                                    role.id
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0D4D4] text-[#D85A5A] hover:bg-[#FFF0F0]"
                                aria-label="Delete role"
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

              {/* =================================================
                  MOBILE
              ================================================== */}

              <div className="divide-y divide-[#EDF0F4] md:hidden">

                {filteredRoles.map(
                  (role) => (
                    <div
                      key={role.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                          <KeyRound
                            size={17}
                          />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-[11px] font-bold text-[#33415A]">
                                {
                                  role.name
                                }
                              </p>

                              <p className="mt-1 line-clamp-2 text-[8px] leading-4 text-[#8995A5]">
                                {
                                  role.description
                                }
                              </p>

                            </div>

                            <span title="Status is managed by the backend">
                              <StatusBadge
                                status={
                                  role.status
                                }
                              />
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <InfoBox
                          label="Users"
                          value={String(
                            role.users
                          )}
                        />

                        <InfoBox
                          label="Permissions"
                          value={`${role.permissions.length} modules`}
                        />

                        <InfoBox
                          label="Created"
                          value={
                            role.createdAt
                          }
                        />

                        <InfoBox
                          label="Access"
                          value={
                            role.permissions
                              .length ===
                            PERMISSIONS.length
                              ? "Full Access"
                              : "Limited"
                          }
                        />

                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">

                        {role.permissions
                          .slice(0, 5)
                          .map(
                            (
                              permission
                            ) => (
                              <span
                                key={
                                  permission
                                }
                                className="rounded-full bg-[#F2F4F7] px-2 py-1 text-[7px] text-[#66748B]"
                              >
                                {
                                  getPermissionLabel(
                                    permission
                                  )
                                }
                              </span>
                            )
                          )}

                        {role.permissions
                          .length >
                          5 && (
                          <span className="rounded-full bg-[#EDF3FF] px-2 py-1 text-[7px] font-semibold text-[#1769F5]">
                            +
                            {role
                              .permissions
                              .length -
                              5}
                          </span>
                        )}

                      </div>

                      <div className="mt-3 flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openView(
                              role
                            )
                          }
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[8px] font-semibold text-[#52627A]"
                        >
                          <Eye size={12} />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(role)
                          }
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[8px] font-semibold text-[#1769F5]"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteId(
                              role.id
                            )
                          }
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-[#F0D4D4] px-3 text-[8px] font-semibold text-[#D85A5A]"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>

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

          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              setShowForm(false);
              setErrors({});
              setSaveError("");
            }}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Role"
                    : "Create Role"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Configure role access and permissions
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                  setSaveError("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            {/* FORM CONTENT */}

            <div className="overflow-y-auto p-5">

              {(Object.keys(errors).length > 0 || saveError) && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-[#F0D4D4] bg-[#FFF7F7] px-4 py-3"
                >
                  <p className="text-[9px] font-bold text-[#B84A4A]">
                    {saveError ||
                      "Please fix the highlighted fields before saving."}
                  </p>
                </div>
              )}

              {/* BASIC DETAILS */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Role Name
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) => {
                      setForm({
                        ...form,
                        name: event.target.value,
                      });
                      clearError("name");
                    }}
                    maxLength={80}
                    aria-invalid={Boolean(errors.name)}
                    placeholder="Example: Product Manager"
                    className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-[10px] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10 ${
                      errors.name
                        ? "border-[#EF4444]"
                        : "border-[#DCE2EA]"
                    }`}
                  />

                  {errors.name && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.name}
                    </p>
                  )}

                </div>

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Status
                  </label>

                  <select
                    value={form.status}
                    disabled
                    title="No status column on the backend — managed server-side"
                    onChange={(event) => {
                      setForm({
                        ...form,
                        status: event.target.value as RoleStatus,
                      });
                      clearError("status");
                    }}
                    aria-invalid={Boolean(errors.status)}
                    className={`mt-1.5 h-10 w-full cursor-not-allowed rounded-lg border bg-[#F5F7FA] px-3 text-[10px] text-[#8A96A7] outline-none ${
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

                </div>

              </div>

              {/* DESCRIPTION */}

              <div className="mt-4">

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
                        event.target
                          .value,
                    })
                  }
                  placeholder="Describe what this role is responsible for..."
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-lg border border-[#DCE2EA] px-3 py-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10"
                />

              </div>

              {/* PERMISSIONS HEADER */}

              <div className="mt-5 flex items-center justify-between">

                <div>

                  <h3 className="text-[11px] font-bold text-[#33415A]">
                    Permissions
                  </h3>

                  <p className="mt-1 text-[8px] text-[#8995A5]">
                    Select the admin modules this role can access.
                  </p>

                </div>

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={
                      selectAllPermissions
                    }
                    className="text-[8px] font-semibold text-[#1769F5] hover:underline"
                  >
                    Select All
                  </button>

                  <span className="text-[#D3D9E2]">
                    |
                  </span>

                  <button
                    type="button"
                    onClick={
                      clearAllPermissions
                    }
                    className="text-[8px] font-semibold text-[#D85A5A] hover:underline"
                  >
                    Clear All
                  </button>

                </div>

              </div>

              {/* PERMISSION LIST */}

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">

                {effectivePermissions.map(
                  (permission) => {
                    const checked =
                      form.permissions.includes(
                        permission.key
                      );

                    return (
                      <button
                        key={
                          permission.key
                        }
                        type="button"
                        onClick={() =>
                          togglePermission(
                            permission.key
                          )
                        }
                        className={`flex items-center rounded-xl border p-3 text-left transition ${
                          checked
                            ? "border-[#B9D0F9] bg-[#F2F7FF]"
                            : "border-[#E1E6ED] bg-white hover:bg-[#FAFBFD]"
                        }`}
                      >

                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            checked
                              ? "bg-[#1769F5] text-white"
                              : "bg-[#F1F3F6] text-[#8B97A7]"
                          }`}
                        >

                          {checked ? (
                            <CheckCircle2
                              size={14}
                            />
                          ) : (
                            <ShieldCheck
                              size={14}
                            />
                          )}

                        </span>

                        <span className="ml-2.5 min-w-0 flex-1">

                          <span
                            className={`block text-[9px] font-semibold ${
                              checked
                                ? "text-[#1769F5]"
                                : "text-[#52627A]"
                            }`}
                          >
                            {
                              permission.label
                            }
                          </span>

                          <span className="mt-0.5 block text-[7px] leading-3.5 text-[#9AA5B4]">
                            {
                              permission.description
                            }
                          </span>

                        </span>

                        <span
                          className={`ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            checked
                              ? "border-[#1769F5] bg-[#1769F5]"
                              : "border-[#C9D1DC]"
                          }`}
                        >

                          {checked && (
                            <svg
                              viewBox="0 0 12 12"
                              className="h-3 w-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M2 6l2.5 2.5L10 3" />
                            </svg>
                          )}

                        </span>

                      </button>
                    );
                  }
                )}

              </div>

              {/* SELECTED COUNT */}

              <div className="mt-4 rounded-xl bg-[#F7F9FC] px-4 py-3">

                <div className="flex items-center justify-between">

                  <span className="text-[9px] font-medium text-[#66748B]">
                    Selected Permissions
                  </span>

                  <span className="text-[10px] font-bold text-[#1769F5]">
                    {
                      form.permissions
                        .length
                    }{" "}
                    /{" "}
                    {PERMISSIONS.length}
                  </span>

                </div>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="flex shrink-0 justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                }}
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287] hover:bg-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveRole}
                className="flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >

                <Save size={13} />

                {editingId !== null
                  ? "Update Role"
                  : "Save Role"}

              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          VIEW MODAL
      ====================================================== */}

      {viewRole && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <button
            type="button"
            aria-label="Close"
            onClick={() =>
              setViewRole(null)
            }
            className="absolute inset-0 cursor-default"
          />

          <div className="relative max-h-[90vh] w-full max-w-[650px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                  <ShieldCheck
                    size={19}
                  />
                </div>

                <div>

                  <h2 className="text-[14px] font-bold text-[#263650]">
                    {viewRole.name}
                  </h2>

                  <p className="mt-1 text-[8px] text-[#8995A5]">
                    Created{" "}
                    {viewRole.createdAt}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewRole(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="p-5">

              {/* DESCRIPTION */}

              <div className="rounded-xl bg-[#F7F9FC] p-4">

                <div className="flex items-center justify-between">

                  <span className="text-[8px] font-semibold uppercase tracking-wide text-[#9AA5B4]">
                    Status
                  </span>

                  <StatusBadge
                    status={
                      viewRole.status
                    }
                  />

                </div>

                <p className="mt-3 text-[10px] leading-5 text-[#66748B]">
                  {
                    viewRole.description
                  }
                </p>

              </div>

              {/* STATS */}

              <div className="mt-4 grid grid-cols-2 gap-3">

                <DetailBox
                  label="Assigned Users"
                  value={String(
                    viewRole.users
                  )}
                />

                <DetailBox
                  label="Permissions"
                  value={`${viewRole.permissions.length} modules`}
                />

              </div>

              {/* PERMISSIONS */}

              <div className="mt-5">

                <h3 className="text-[11px] font-bold text-[#33415A]">
                  Access Permissions
                </h3>

                <div
                className={`mt-3 grid grid-cols-1 gap-2 rounded-xl ${
                  errors.permissions
                    ? "ring-1 ring-[#EF4444]/30"
                    : ""
                } sm:grid-cols-2`}
              >

                  {effectivePermissions.map(
                    (permission) => {
                      const hasPermission =
                        viewRole.permissions.includes(
                          permission.key
                        );

                      return (
                        <div
                          key={
                            permission.key
                          }
                          className={`flex items-center rounded-lg border p-3 ${
                            hasPermission
                              ? "border-[#D4E2FA] bg-[#F7FAFF]"
                              : "border-[#EDF0F4] bg-[#FAFBFD] opacity-50"
                          }`}
                        >

                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                              hasPermission
                                ? "bg-[#E4EEFF] text-[#1769F5]"
                                : "bg-[#EEF0F3] text-[#A1AAB6]"
                            }`}
                          >

                            {hasPermission ? (
                              <CheckCircle2
                                size={14}
                              />
                            ) : (
                              <XCircle
                                size={14}
                              />
                            )}

                          </div>

                          <div className="ml-2.5">

                            <p className="text-[9px] font-semibold text-[#52627A]">
                              {
                                permission.label
                              }
                            </p>

                            <p className="mt-0.5 text-[7px] text-[#9AA5B4]">
                              {
                                permission.description
                              }
                            </p>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  const role =
                    viewRole;

                  setViewRole(null);
                  openEdit(role);
                }}
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[9px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Role
              </button>

              <button
                type="button"
                onClick={() =>
                  setDeleteId(
                    viewRole.id
                  )
                }
                className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#F0D4D4] px-4 text-[9px] font-semibold text-[#D85A5A] hover:bg-[#FFF0F0]"
              >
                <Trash2 size={13} />
                Delete
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

          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              setDeleteId(null);
              setDeleteError("");
            }}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D85A5A]">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-4 text-[14px] font-bold text-[#263650]">
              Delete Role?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This role will be deactivated and
              removed from the admin role list.
              The Admin role and roles with
              assigned users cannot be deleted.
            </p>

            {deleteError && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-[#FFF2F2] px-3 py-2 text-[9px] font-medium text-[#C43E3E]"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">

              <button
                type="button"
                onClick={() => {
                  setDeleteId(null);
                  setDeleteError("");
                }}
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteRole}
                className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D]"
              >
                Delete Role
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          SUCCESS TOAST
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
              Role updated successfully.
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

          <p className="text-[8px] font-medium text-[#8995A5]">
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
  status: RoleStatus;
}) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[7px] font-semibold ${
        status === "Active"
          ? "bg-[#EAF8F0] text-[#249357]"
          : "bg-[#FFF0F0] text-[#D85A5A]"
      }`}
    >
      {status}
    </span>
  );
}

/* ============================================================
   INFO BOX
============================================================ */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#F7F9FC] px-3 py-2.5">

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
   DETAIL BOX
============================================================ */

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#F7F9FC] px-3 py-3">

      <p className="text-[7px] uppercase tracking-wide text-[#9AA5B4]">
        {label}
      </p>

      <p className="mt-1 text-[10px] font-semibold text-[#52627A]">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   PERMISSION LABEL
============================================================ */

function getPermissionLabel(
  key: string
) {
  return (
    PERMISSIONS.find(
      (permission) =>
        permission.key === key
    )?.label ?? key
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
        <ShieldCheck size={25} />
      </div>

      <h3 className="mt-4 text-[13px] font-bold text-[#293953]">
        No roles found
      </h3>

      <p className="mt-1 text-[10px] text-[#8995A5]">
        Try changing your search or status filter.
      </p>

    </div>
  );
}