"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { cartRulesApi } from "@/app/api/services";
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Percent,
  IndianRupee,
  Package,
  Users,
  CalendarDays,
  Save,
} from "lucide-react";

type RuleStatus = "Active" | "Inactive";

type RuleType =
  | "Minimum Cart Value"
  | "Minimum Quantity"
  | "Category Discount"
  | "Free Shipping"
  | "Wholesale Discount";

type CartRule = {
  id: number;
  serverId?: string;
  name: string;
  description: string;
  type: RuleType;
  condition: string;
  discount: string;
  status: RuleStatus;
  startDate: string;
  endDate: string;
  usage: number;
};

type FormErrors = {
  name?: string;
  description?: string;
  conditionValue?: string;
  discount?: string;
  startDate?: string;
  endDate?: string;
};

/* API-first: cart rules load from backend; empty until fetch resolves. */

export default function CartRulesPage() {
  const router = useRouter();

  const [rules, setRules] =
    useState<CartRule[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | RuleStatus>("All");

  const [typeFilter, setTypeFilter] =
    useState<"All" | RuleType>("All");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] =
    useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "Minimum Cart Value" as RuleType,
    conditionValue: "",
    discount: "",
    status: "Active" as RuleStatus,
    startDate: "",
    endDate: "",
  });

  /* =====================================================
     LOAD CART RULES (#95 GET /api/admin/cart-rules; API-first)
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadRules = async () => {
      try {
        const response = await cartRulesApi.list(1, 100);
        const payload: any = (response as any)?.data ?? response;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (cancelled || rawItems.length === 0) return;

        const validTypes: RuleType[] = [
          "Minimum Cart Value",
          "Minimum Quantity",
          "Category Discount",
          "Free Shipping",
          "Wholesale Discount",
        ];

        const mapped: CartRule[] = rawItems.map((raw: any, index: number) => ({
          id: index + 1,
          serverId: String(raw.ruleId ?? raw.cartRuleId ?? raw.id ?? raw._id ?? ""),
          name: String(raw.name ?? raw.title ?? "Untitled rule"),
          description: String(raw.description ?? raw.subtitle ?? ""),
          type: (validTypes as string[]).includes(String(raw.type))
            ? (raw.type as RuleType)
            : "Minimum Cart Value",
          condition: String(raw.condition ?? raw.conditionValue ?? raw.rule ?? ""),
          discount: String(raw.discount ?? raw.benefit ?? raw.value ?? ""),
          status: raw.status === "Inactive" ? "Inactive" : "Active",
          startDate: String(raw.startDate ?? raw.start ?? raw.validFrom ?? "").slice(0, 10),
          endDate: String(raw.endDate ?? raw.end ?? raw.validTo ?? "").slice(0, 10),
          usage: Number(raw.usage ?? raw.usageCount ?? raw.used ?? 0),
        }));

        if (mapped.length > 0) setRules(mapped);
      } catch (error) {
        console.error("Unable to load cart rules:", error);
      }
    };

    loadRules();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredRules = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return rules.filter((rule) => {
      const matchesSearch =
        !query ||
        rule.name
          .toLowerCase()
          .includes(query) ||
        rule.description
          .toLowerCase()
          .includes(query) ||
        rule.condition
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        rule.status === statusFilter;

      const matchesType =
        typeFilter === "All" ||
        rule.type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    rules,
    search,
    statusFilter,
    typeFilter,
  ]);

  /* =====================================================
     STATS
  ====================================================== */

  const activeRules = rules.filter(
    (rule) => rule.status === "Active"
  ).length;

  const inactiveRules = rules.filter(
    (rule) => rule.status === "Inactive"
  ).length;

  const totalUsage = rules.reduce(
    (sum, rule) =>
      sum + rule.usage,
    0
  );

  /* =====================================================
     RESET FORM
  ====================================================== */

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      type: "Minimum Cart Value",
      conditionValue: "",
      discount: "",
      status: "Active",
      startDate: "",
      endDate: "",
    });

    setEditingId(null);
    setErrors({});
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

  const openEdit = (rule: CartRule) => {
    setEditingId(rule.id);
    setErrors({});

    setForm({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      conditionValue:
        rule.condition,
      discount: rule.discount,
      status: rule.status,
      startDate: rule.startDate,
      endDate: rule.endDate,
    });

    setShowForm(true);
  };

  /* =====================================================
     VALIDATION
  ====================================================== */

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    const name = form.name.trim();
    const description = form.description.trim();
    const condition = form.conditionValue.trim();
    const discount = form.discount.trim();
    const startDate = form.startDate;
    const endDate = form.endDate;

    /* RULE NAME */
    if (!name) {
      nextErrors.name = "Rule name is required.";
    } else if (name.length < 3) {
      nextErrors.name = "Rule name must be at least 3 characters.";
    } else if (name.length > 100) {
      nextErrors.name = "Rule name cannot exceed 100 characters.";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9 &.'()\-]*$/.test(name)) {
      nextErrors.name = "Rule name contains invalid characters.";
    } else if (
      rules.some(
        (rule) =>
          rule.name.trim().toLowerCase() === name.toLowerCase() &&
          rule.id !== editingId
      )
    ) {
      nextErrors.name = "A rule with this name already exists.";
    }

    /* DESCRIPTION */
    if (description.length > 250) {
      nextErrors.description =
        "Description cannot exceed 250 characters.";
    }

    /* CONDITION */
    if (!condition) {
      nextErrors.conditionValue = "Condition is required.";
    } else if (condition.length > 100) {
      nextErrors.conditionValue =
        "Condition cannot exceed 100 characters.";
    } else {
      const numericValue = condition.replace(/[^0-9.]/g, "");

      if (
        form.type === "Minimum Cart Value" ||
        form.type === "Free Shipping"
      ) {
        if (!numericValue || Number(numericValue) <= 0) {
          nextErrors.conditionValue =
            "Enter a valid amount greater than ₹0.";
        }
      } else if (form.type === "Minimum Quantity") {
        if (!/^\d+(?:\s+units?)?$/i.test(condition)) {
          nextErrors.conditionValue =
            "Enter a valid quantity, for example 20 or 20 units.";
        } else if (Number.parseInt(numericValue, 10) <= 0) {
          nextErrors.conditionValue =
            "Quantity must be greater than 0.";
        }
      } else if (form.type === "Category Discount") {
        if (!/^[A-Za-z0-9][A-Za-z0-9 &'().\-/]*$/.test(condition)) {
          nextErrors.conditionValue =
            "Enter a valid category name.";
        }
      } else if (form.type === "Wholesale Discount") {
        if (!/^[A-Za-z0-9][A-Za-z0-9 &'().\-/]*$/.test(condition)) {
          nextErrors.conditionValue =
            "Enter a valid wholesale condition.";
        }
      }
    }

    /* DISCOUNT / BENEFIT */
    if (!discount) {
      nextErrors.discount = "Discount / benefit is required.";
    } else if (discount.length > 30) {
      nextErrors.discount =
        "Discount / benefit cannot exceed 30 characters.";
    } else if (form.type === "Free Shipping") {
      if (!/^free$/i.test(discount.trim())) {
        nextErrors.discount =
          'For Free Shipping, enter "FREE".';
      }
    } else if (/^\d+(?:\.\d+)?%$/.test(discount)) {
      const percentage = Number.parseFloat(discount);
      if (percentage <= 0 || percentage > 100) {
        nextErrors.discount =
          "Percentage must be greater than 0 and at most 100%.";
      }
    } else if (/^₹?\s*\d+(?:,\d{3})*(?:\.\d+)?$/.test(discount)) {
      const amount = Number(
        discount.replace(/[₹,\s]/g, "")
      );
      if (amount <= 0) {
        nextErrors.discount =
          "Discount amount must be greater than ₹0.";
      }
    } else if (!/^\d+(?:\.\d+)?\s*(?:%|₹)?$/.test(discount)) {
      nextErrors.discount =
        'Enter a valid discount such as "10%" or "₹500".';
    }

    /* DATES */
    if (!startDate) {
      nextErrors.startDate = "Start date is required.";
    }

    if (!endDate) {
      nextErrors.endDate = "End date is required.";
    }

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      nextErrors.endDate =
        "End date cannot be earlier than the start date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /* =====================================================
     SAVE
  ====================================================== */

  const saveRule = async () => {
    if (!validateForm()) return;

    const name = form.name.trim();
    const description = form.description.trim();
    const condition = form.conditionValue.trim();
    const discount =
      form.type === "Free Shipping"
        ? "FREE"
        : form.discount.trim();
    const startDate = form.startDate;
    const endDate = form.endDate;

    const payload: Record<string, unknown> = {
      name,
      description,
      type: form.type,
      condition,
      discount,
      status: form.status,
      startDate,
      endDate,
    };

    if (editingId !== null) {
      const editingRow = rules.find(
        (rule) => rule.id === editingId
      );

      if (editingRow?.serverId) {
        try {
          await cartRulesApi.update(editingRow.serverId, payload);
        } catch (error) {
          console.error("Cart rule update failed:", error);
        }
      }
    } else {
      try {
        await cartRulesApi.create(payload);
      } catch (error) {
        console.error("Cart rule create failed:", error);
      }
    }

    if (editingId !== null) {
      setRules((current) =>
        current.map((rule) =>
          rule.id === editingId
            ? {
                ...rule,
                name,
                description,
                type: form.type,
                condition,
                discount,
                status: form.status,
                startDate,
                endDate,
              }
            : rule
        )
      );
    } else {
      setRules((current) => [
        ...current,
        {
          id: Date.now(),
          name,
          description,
          type: form.type,
          condition,
          discount,
          status: form.status,
          startDate,
          endDate,
          usage: 0,
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

  const deleteRule = async () => {
    if (deleteId === null) {
      return;
    }

    const deletingRow = rules.find(
      (rule) => rule.id === deleteId
    );

    if (deletingRow?.serverId) {
      try {
        await cartRulesApi.remove(deletingRow.serverId);
      } catch (error) {
        console.error("Cart rule delete failed:", error);
      }
    }

    setRules((current) =>
      current.filter(
        (rule) =>
          rule.id !== deleteId
      )
    );

    setDeleteId(null);
    showSuccess();
  };

  /* =====================================================
     TOGGLE STATUS
  ====================================================== */

  const toggleStatus = async (id: number) => {
    const targetRow = rules.find(
      (rule) => rule.id === id
    );

    if (targetRow) {
      const newStatus =
        targetRow.status === "Active" ? "Inactive" : "Active";

      if (targetRow.serverId) {
        try {
          await cartRulesApi.setStatus(targetRow.serverId, newStatus);
        } catch (error) {
          console.error("Cart rule status update failed:", error);
        }
      }
    }

    setRules((current) =>
      current.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              status:
                rule.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : rule
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

  /* =====================================================
     CONDITION PLACEHOLDER
  ====================================================== */

  const conditionPlaceholder =
    form.type ===
    "Minimum Cart Value"
      ? "Example: ₹10,000"
      : form.type ===
          "Minimum Quantity"
        ? "Example: 20 units"
        : form.type ===
            "Category Discount"
          ? "Example: Grocery"
          : form.type ===
              "Free Shipping"
            ? "Example: ₹2,500"
            : "Example: Business account";

  return (
    <AdminLayout>
      <main className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

      {/* =====================================================
          HEADER
      ====================================================== */}

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
            Cart Rules
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage automatic cart discounts and checkout rules
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Create Cart Rule
          </span>

          <span className="sm:hidden">
            Add Rule
          </span>
        </button>

      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}

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
            Cart Rules
          </span>

        </div>

        {/* =====================================================
            STATS
        ====================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            title="Total Rules"
            value={rules.length}
            icon={ShoppingCart}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#1769F5]"
          />

          <StatCard
            title="Active Rules"
            value={activeRules}
            icon={CheckCircle2}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Inactive Rules"
            value={inactiveRules}
            icon={XCircle}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

          <StatCard
            title="Total Usage"
            value={totalUsage.toLocaleString(
              "en-IN"
            )}
            icon={TrendingIcon}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

        </section>

        {/* =====================================================
            INFO
        ====================================================== */}

        <section className="mt-5 rounded-xl border border-[#DCE8FA] bg-[#F2F7FF] p-4">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E1EDFF] text-[#1769F5]">
              <ShoppingCart size={17} />
            </div>

            <div>

              <p className="text-[10px] font-bold text-[#29426A]">
                Automatic Cart Rules
              </p>

              <p className="mt-1 text-[9px] leading-5 text-[#667A97]">
                Cart rules are automatically
                applied when the customer meets
                the configured conditions during
                checkout.
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            FILTERS
        ====================================================== */}

        <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row">

            {/* SEARCH */}

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
                placeholder="Search cart rules..."
                className="w-full bg-transparent px-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8]"
              />

            </div>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "All"
                    | RuleStatus
                )
              }
              className="h-10 rounded-lg border border-[#DFE5ED] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] lg:w-[145px]"
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

            {/* TYPE */}

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target
                    .value as
                    | "All"
                    | RuleType
                )
              }
              className="h-10 rounded-lg border border-[#DFE5ED] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] lg:w-[190px]"
            >
              <option value="All">
                All Rule Types
              </option>

              <option value="Minimum Cart Value">
                Minimum Cart Value
              </option>

              <option value="Minimum Quantity">
                Minimum Quantity
              </option>

              <option value="Category Discount">
                Category Discount
              </option>

              <option value="Free Shipping">
                Free Shipping
              </option>

              <option value="Wholesale Discount">
                Wholesale Discount
              </option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setTypeFilter("All");
              }}
              className="h-10 rounded-lg border border-[#DCE2EA] px-4 text-[9px] font-semibold text-[#647287] hover:bg-[#F5F7FA]"
            >
              Clear
            </button>

          </div>

        </section>

        {/* =====================================================
            RULE TABLE
        ====================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#293953]">
                Cart Rule List
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredRules.length} rules found
              </p>

            </div>

          </div>

          {filteredRules.length === 0 ? (
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
                        Rule
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Type
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Condition
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Discount
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Usage
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

                    {filteredRules.map(
                      (rule) => (
                        <tr
                          key={rule.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* RULE */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                                <ShoppingCart
                                  size={16}
                                />
                              </div>

                              <div className="min-w-0">

                                <p className="max-w-[210px] truncate text-[10px] font-bold text-[#33415A]">
                                  {rule.name}
                                </p>

                                <p className="mt-1 max-w-[250px] truncate text-[8px] text-[#8995A5]">
                                  {rule.description ||
                                    "No description"}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* TYPE */}

                          <td className="px-5 py-4">

                            <RuleTypeBadge
                              type={
                                rule.type
                              }
                            />

                          </td>

                          {/* CONDITION */}

                          <td className="px-5 py-4">

                            <p className="text-[9px] font-semibold text-[#52627A]">
                              {rule.condition}
                            </p>

                            <p className="mt-1 text-[7px] text-[#9AA5B4]">
                              {rule.startDate}{" "}
                              →{" "}
                              {rule.endDate}
                            </p>

                          </td>

                          {/* DISCOUNT */}

                          <td className="px-5 py-4">

                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#EAF8F0] px-2.5 py-1.5 text-[9px] font-bold text-[#249357]">

                              {rule.discount.includes(
                                "%"
                              ) ? (
                                <Percent
                                  size={11}
                                />
                              ) : (
                                <IndianRupee
                                  size={11}
                                />
                              )}

                              {rule.discount}

                            </span>

                          </td>

                          {/* USAGE */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-bold text-[#52627A]">
                              {rule.usage.toLocaleString(
                                "en-IN"
                              )}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                toggleStatus(
                                  rule.id
                                )
                              }
                            >
                              <StatusBadge
                                status={
                                  rule.status
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
                                  openEdit(
                                    rule
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE2EA] text-[#1769F5] hover:bg-[#EDF3FF]"
                                aria-label="Edit rule"
                              >
                                <Pencil
                                  size={13}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteId(
                                    rule.id
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0D4D4] text-[#D85A5A] hover:bg-[#FFF0F0]"
                                aria-label="Delete rule"
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

                {filteredRules.map(
                  (rule) => (
                    <div
                      key={rule.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                          <ShoppingCart
                            size={16}
                          />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-[10px] font-bold text-[#33415A]">
                                {rule.name}
                              </p>

                              <p className="mt-1 text-[8px] text-[#8995A5]">
                                {rule.description}
                              </p>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                toggleStatus(
                                  rule.id
                                )
                              }
                            >
                              <StatusBadge
                                status={
                                  rule.status
                                }
                              />
                            </button>

                          </div>

                          <div className="mt-3">

                            <RuleTypeBadge
                              type={
                                rule.type
                              }
                            />

                          </div>

                        </div>

                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <InfoBox
                          label="Condition"
                          value={
                            rule.condition
                          }
                        />

                        <InfoBox
                          label="Discount"
                          value={
                            rule.discount
                          }
                        />

                        <InfoBox
                          label="Usage"
                          value={rule.usage.toLocaleString(
                            "en-IN"
                          )}
                        />

                        <InfoBox
                          label="Period"
                          value={`${rule.startDate} → ${rule.endDate}`}
                        />

                      </div>

                      <div className="mt-3 flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              rule
                            )
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
                              rule.id
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
              resetForm();
            }}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Cart Rule"
                    : "Create Cart Rule"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Configure automatic cart conditions and discounts
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

            {/* MODAL BODY */}

            <div className="space-y-4 p-5">

              {/* NAME */}

              <FormInput
                label="Rule Name"
                value={form.name}
                placeholder="Example: Bulk Order Discount"
                required
                maxLength={100}
                error={errors.name}
                onChange={(value) => {
                  setForm({ ...form, name: value });
                  setErrors({
                    ...errors,
                    name: undefined,
                  });
                }}
              />

              {/* DESCRIPTION */}

              <div>

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
                  placeholder="Describe what this rule does..."
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-lg border border-[#DCE2EA] bg-white px-3 py-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10"
                />

              </div>

              {/* TYPE */}

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Rule Type
                </label>

                <select
                  value={form.type}
                  onChange={(event) => {
                    setForm({
                      ...form,
                      type: event.target.value as RuleType,
                    });
                    setErrors({
                      ...errors,
                      conditionValue: undefined,
                      discount: undefined,
                    });
                  }}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                >

                  <option>
                    Minimum Cart Value
                  </option>

                  <option>
                    Minimum Quantity
                  </option>

                  <option>
                    Category Discount
                  </option>

                  <option>
                    Free Shipping
                  </option>

                  <option>
                    Wholesale Discount
                  </option>

                </select>

              </div>

              {/* CONDITION + DISCOUNT */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Condition
                  </label>

                  <input
                    value={form.conditionValue}
                    maxLength={100}
                    onChange={(event) => {
                      setForm({
                        ...form,
                        conditionValue: event.target.value,
                      });
                      setErrors({
                        ...errors,
                        conditionValue: undefined,
                      });
                    }}
                    placeholder={conditionPlaceholder}
                    aria-invalid={!!errors.conditionValue}
                    className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-[10px] outline-none placeholder:text-[#A0AAB8] ${
                      errors.conditionValue
                        ? "border-[#EF4444] bg-[#FFF8F8]"
                        : "border-[#DCE2EA] focus:border-[#1769F5]"
                    }`}
                  />

                  {errors.conditionValue && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.conditionValue}
                    </p>
                  )}

                </div>

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Discount / Benefit
                  </label>

                  <input
                    value={form.discount}
                    maxLength={30}
                    disabled={form.type === "Free Shipping"}
                    onChange={(event) => {
                      setForm({
                        ...form,
                        discount: event.target.value,
                      });
                      setErrors({
                        ...errors,
                        discount: undefined,
                      });
                    }}
                    placeholder={
                      form.type === "Free Shipping"
                        ? "FREE"
                        : "Example: 10% or ₹500"
                    }
                    aria-invalid={!!errors.discount}
                    className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-[10px] outline-none placeholder:text-[#A0AAB8] ${
                      errors.discount
                        ? "border-[#EF4444] bg-[#FFF8F8]"
                        : "border-[#DCE2EA] focus:border-[#1769F5]"
                    } ${
                      form.type === "Free Shipping"
                        ? "cursor-not-allowed bg-[#F5F7FA] text-[#8995A5]"
                        : ""
                    }`}
                  />

                  {errors.discount && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.discount}
                    </p>
                  )}

                </div>

              </div>

              {/* DATES */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div>

                  <label className="flex items-center gap-1 text-[9px] font-semibold text-[#52627A]">

                    <CalendarDays
                      size={12}
                    />

                    Start Date

                  </label>

                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => {
                      setForm({
                        ...form,
                        startDate: event.target.value,
                      });
                      setErrors({
                        ...errors,
                        startDate: undefined,
                        endDate:
                          form.endDate &&
                          event.target.value > form.endDate
                            ? "End date cannot be earlier than the start date."
                            : errors.endDate,
                      });
                    }}
                    aria-invalid={!!errors.startDate}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none ${
                      errors.startDate
                        ? "border-[#EF4444]"
                        : "border-[#DCE2EA] focus:border-[#1769F5]"
                    }`}
                  />

                  {errors.startDate && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.startDate}
                    </p>
                  )}

                </div>

                <div>

                  <label className="flex items-center gap-1 text-[9px] font-semibold text-[#52627A]">

                    <CalendarDays
                      size={12}
                    />

                    End Date

                  </label>

                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => {
                      setForm({
                        ...form,
                        endDate: event.target.value,
                      });
                      setErrors({
                        ...errors,
                        endDate: undefined,
                      });
                    }}
                    aria-invalid={!!errors.endDate}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none ${
                      errors.endDate
                        ? "border-[#EF4444]"
                        : "border-[#DCE2EA] focus:border-[#1769F5]"
                    }`}
                  />

                  {errors.endDate && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.endDate}
                    </p>
                  )}

                </div>

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

              {/* STATUS */}

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Status
                </label>

                <div className="mt-2 flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        status:
                          "Active",
                      })
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[9px] font-semibold ${
                      form.status ===
                      "Active"
                        ? "border-[#249357] bg-[#EAF8F0] text-[#249357]"
                        : "border-[#DCE2EA] text-[#7B8798]"
                    }`}
                  >
                    <CheckCircle2
                      size={14}
                    />
                    Active
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        status:
                          "Inactive",
                      })
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[9px] font-semibold ${
                      form.status ===
                      "Inactive"
                        ? "border-[#D85A5A] bg-[#FFF0F0] text-[#D85A5A]"
                        : "border-[#DCE2EA] text-[#7B8798]"
                    }`}
                  >
                    <XCircle
                      size={14}
                    />
                    Inactive
                  </button>

                </div>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287] hover:bg-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveRule}
                className="flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Save size={13} />

                {editingId !== null
                  ? "Update Rule"
                  : "Save Rule"}
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
            onClick={() =>
              setDeleteId(null)
            }
            className="absolute inset-0 cursor-default"
          />

          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D85A5A]">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-4 text-[14px] font-bold text-[#263650]">
              Delete Cart Rule?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This cart rule will be permanently
              removed. Customers will no longer
              receive this automatic benefit.
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
                onClick={deleteRule}
                className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D]"
              >
                Delete Rule
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
              Cart rule saved successfully.
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
   RULE TYPE BADGE
============================================================ */

function RuleTypeBadge({
  type,
}: {
  type: RuleType;
}) {
  const icon =
    type === "Minimum Cart Value"
      ? IndianRupee
      : type === "Minimum Quantity"
        ? Package
        : type ===
            "Category Discount"
          ? Percent
          : type ===
              "Free Shipping"
            ? ShoppingCart
            : Users;

  const Icon = icon;

  return (
    <span className="inline-flex max-w-[190px] items-center gap-1.5 rounded-full bg-[#F2F4F7] px-2.5 py-1.5 text-[7px] font-semibold text-[#66748B]">

      <Icon
        size={11}
        className="shrink-0"
      />

      <span className="truncate">
        {type}
      </span>

    </span>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: RuleStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[7px] font-semibold ${
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
   FORM INPUT
============================================================ */

function FormInput({
  label,
  value,
  placeholder,
  onChange,
  error,
  required = false,
  maxLength,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
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
   EMPTY STATE
============================================================ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
        <ShoppingCart size={25} />
      </div>

      <h3 className="mt-4 text-[13px] font-bold text-[#293953]">
        No cart rules found
      </h3>

      <p className="mt-1 text-[10px] text-[#8995A5]">
        Try changing your filters or create a new cart rule.
      </p>

    </div>
  );
}

/* ============================================================
   SIMPLE TRENDING ICON
============================================================ */

function TrendingIcon({
  size = 17,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </svg>
  );
}