"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { combosApi, productsApi } from "@/app/api/services";
import { extractErrorMessage } from "@/app/api/api";
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Package,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ShoppingBag,
  Save,
  Eye,
  Tag,
  CalendarDays,
} from "lucide-react";

type ComboStatus = "Active" | "Inactive";

type Combo = {
  id: number;
  serverId?: string;
  name: string;
  description: string;
  image: string;
  items: number;
  originalPrice: number;
  comboPrice: number;
  category: string;
  status: ComboStatus;
  startDate: string;
  endDate: string;
  sold: number;
  productIds?: string[];
};

/* API-first: combos load from backend; empty until fetch resolves. */

const CATEGORIES = [
  "Grocery",
  "Kitchen",
  "Home Care",
  "Personal Care",
  "Beverages",
  "Staples",
  "Other",
];

export default function CombosPage() {
  const router = useRouter();

  const [combos, setCombos] =
    useState<Combo[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | ComboStatus>("All");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [viewCombo, setViewCombo] =
    useState<Combo | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    items: "2",
    originalPrice: "",
    comboPrice: "",
    category: "Grocery",
    status: "Active" as ComboStatus,
    startDate: "",
    endDate: "",
  });

  const [products, setProducts] = useState<{ productId: string; productName: string; price: number; mrp: number; imageUrl?: string }[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");

  type FormErrors = {
    name?: string;
    description?: string;
    image?: string;
    items?: string;
    originalPrice?: string;
    comboPrice?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  };

  const [formErrors, setFormErrors] =
    useState<FormErrors>({});

  const [formError, setFormError] =
    useState("");

  /* =====================================================
     LOAD COMBOS (#90 GET /api/admin/combos; API-first)
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadCombos = async () => {
      try {
        const response = await combosApi.list(1, 100);
        const payload: any = (response as any)?.data ?? response;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (cancelled || rawItems.length === 0) return;

        const mapped: Combo[] = rawItems.map((raw: any, index: number) => ({
          id: index + 1,
          serverId: String(raw.comboId ?? raw.id ?? raw._id ?? ""),
          name: String(raw.name ?? raw.title ?? "Untitled combo"),
          description: String(raw.description ?? raw.subtitle ?? ""),
          image: String(raw.image ?? raw.imageUrl ?? ""),
          items: Number(raw.productIds?.length ?? raw.items ?? raw.itemCount ?? raw.productCount ?? 0),
          originalPrice: Number(raw.originalPrice ?? raw.mrp ?? raw.totalPrice ?? 0),
          comboPrice: Number(raw.comboPrice ?? raw.price ?? raw.offerPrice ?? 0),
          category: String(raw.category ?? raw.categoryName ?? "Grocery"),
          status: raw.status === "Inactive" ? "Inactive" : "Active",
          startDate: String(raw.startDate ?? raw.start ?? raw.validFrom ?? "").slice(0, 10),
          endDate: String(raw.endDate ?? raw.end ?? raw.validTo ?? "").slice(0, 10),
          sold: Number(raw.sold ?? raw.soldCount ?? raw.sales ?? 0),
          productIds: Array.isArray(raw.productIds) ? raw.productIds.map((id: any) => String(id)) : [],
        }));

        if (mapped.length > 0) setCombos(mapped);
      } catch (error: any) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED" || error?.message === "canceled") return;
        console.error("Unable to load combos:", error);
      }
    };

    loadCombos();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showForm) return;
    let cancelled = false;
    const loadProducts = async () => {
      try {
        const res: any = await productsApi.list({ page: 1, pageSize: 100, search: productSearch || undefined });
        const payload: any = res?.data ?? res;
        const items: any[] = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
        const mapped = items.map((p: any) => ({
          productId: String(p.productId ?? p.id ?? ""),
          productName: String(p.productName ?? p.name ?? "Product"),
          price: Number(p.price ?? 0),
          mrp: Number(p.mrp ?? p.price ?? 0),
        })).filter((p) => p.productId);
        if (!cancelled) setProducts(mapped);
      } catch {}
    };
    loadProducts();
    return () => { cancelled = true; };
  }, [showForm, productSearch]);

  /* =====================================================
     FILTERED COMBOS
  ====================================================== */

  const filteredCombos = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return combos.filter((combo) => {
      const matchesSearch =
        !query ||
        combo.name
          .toLowerCase()
          .includes(query) ||
        combo.description
          .toLowerCase()
          .includes(query) ||
        combo.category
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        combo.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        combo.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    combos,
    search,
    statusFilter,
    categoryFilter,
  ]);

  /* =====================================================
     STATS
  ====================================================== */

  const activeCombos = combos.filter(
    (combo) => combo.status === "Active"
  ).length;

  const inactiveCombos = combos.filter(
    (combo) => combo.status === "Inactive"
  ).length;

  const totalSold = combos.reduce(
    (sum, combo) =>
      sum + combo.sold,
    0
  );

  const totalSavings = combos.reduce(
    (sum, combo) =>
      sum +
      (combo.originalPrice -
        combo.comboPrice),
    0
  );

  /* =====================================================
     RESET FORM
  ====================================================== */

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      image: "",
      items: "2",
      originalPrice: "",
      comboPrice: "",
      category: "Grocery",
      status: "Active",
      startDate: "",
      endDate: "",
    });
    setSelectedProductIds([]);
    setProductSearch("");
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

  useEffect(() => {
    if (selectedProductIds.length === 0) return;
    const sum = selectedProductIds.reduce((acc, id) => {
      const p = products.find((x) => x.productId === id);
      return acc + (p ? Number(p.price) : 0);
    }, 0);
    if (sum > 0) {
      setForm((prev) => ({ ...prev, originalPrice: String(sum), items: String(selectedProductIds.length) }));
    }
  }, [selectedProductIds, products]);

  /* =====================================================
     EDIT
  ====================================================== */

  const openEdit = (combo: Combo) => {
    setEditingId(combo.id);
    setSelectedProductIds(combo.productIds ?? []);
    setForm({
      name: combo.name,
      description: combo.description,
      image: combo.image,
      items: String(combo.productIds?.length ?? combo.items),
      originalPrice: String(combo.originalPrice),
      comboPrice: String(combo.comboPrice),
      category: combo.category,
      status: combo.status,
      startDate: combo.startDate,
      endDate: combo.endDate,
    });
    setShowForm(true);
  };

  /* =====================================================
     VALIDATION
  ====================================================== */

  const validateForm = () => {
    const errors: FormErrors = {};

    const cleanName = form.name.trim();
    const cleanDescription = form.description.trim();
    const cleanImage = form.image.trim();
    const items = Number(form.items);
    const originalPrice = Number(form.originalPrice);
    const comboPrice = Number(form.comboPrice);

    /* NAME */
    if (!cleanName) {
      errors.name = "Combo name is required.";
    } else if (cleanName.length < 2) {
      errors.name = "Combo name must be at least 2 characters.";
    } else if (cleanName.length > 100) {
      errors.name = "Combo name cannot exceed 100 characters.";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9 &.'()\-]*$/.test(cleanName)) {
      errors.name =
        "Use only letters, numbers, spaces and basic punctuation.";
    } else {
      const duplicate = combos.some(
        (combo) =>
          combo.name.trim().toLowerCase() ===
            cleanName.toLowerCase() &&
          combo.id !== editingId
      );

      if (duplicate) {
        errors.name = "A combo with this name already exists.";
      }
    }

    /* DESCRIPTION */
    if (!cleanDescription) {
      errors.description = "Description is required.";
    } else if (cleanDescription.length < 10) {
      errors.description =
        "Description must be at least 10 characters.";
    } else if (cleanDescription.length > 500) {
      errors.description =
        "Description cannot exceed 500 characters.";
    }

    /* PRODUCTS — at least 2 for new combos; edits may keep existing productIds or add */
    if (selectedProductIds.length === 0 && !editingId) {
      errors.items = "Select at least 2 products to create a combo.";
    } else if (selectedProductIds.length > 0 && selectedProductIds.length < 2) {
      errors.items = "Select at least 2 products to create a combo.";
    } else if (selectedProductIds.length > 20) {
      errors.items = "A combo cannot exceed 20 products.";
    }

    /* ORIGINAL PRICE */
    if (!form.originalPrice.trim()) {
      errors.originalPrice = "Original price is required.";
    } else if (!Number.isFinite(originalPrice)) {
      errors.originalPrice = "Enter a valid original price.";
    } else if (originalPrice <= 0) {
      errors.originalPrice =
        "Original price must be greater than ₹0.";
    } else if (originalPrice > 10000000) {
      errors.originalPrice =
        "Original price cannot exceed ₹1,00,00,000.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.originalPrice.trim())) {
      errors.originalPrice =
        "Price can contain a maximum of 2 decimal places.";
    }

    /* COMBO PRICE */
    if (!form.comboPrice.trim()) {
      errors.comboPrice = "Combo price is required.";
    } else if (!Number.isFinite(comboPrice)) {
      errors.comboPrice = "Enter a valid combo price.";
    } else if (comboPrice <= 0) {
      errors.comboPrice =
        "Combo price must be greater than ₹0.";
    } else if (comboPrice > 10000000) {
      errors.comboPrice =
        "Combo price cannot exceed ₹1,00,00,000.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.comboPrice.trim())) {
      errors.comboPrice =
        "Price can contain a maximum of 2 decimal places.";
    }

    if (
      Number.isFinite(originalPrice) &&
      Number.isFinite(comboPrice) &&
      originalPrice > 0 &&
      comboPrice > 0 &&
      comboPrice >= originalPrice
    ) {
      errors.comboPrice =
        "Combo price must be lower than original price.";
    }

    /* CATEGORY */
    if (!CATEGORIES.includes(form.category)) {
      errors.category = "Please select a valid category.";
    }

    /* START DATE */
    if (!form.startDate) {
      errors.startDate = "Start date is required.";
    }

    /* END DATE */
    if (!form.endDate) {
      errors.endDate = "End date is required.";
    }

    if (form.startDate && form.endDate) {
      const start = new Date(`${form.startDate}T00:00:00`);
      const end = new Date(`${form.endDate}T00:00:00`);

      if (Number.isNaN(start.getTime())) {
        errors.startDate = "Enter a valid start date.";
      }

      if (Number.isNaN(end.getTime())) {
        errors.endDate = "Enter a valid end date.";
      }

      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end < start
      ) {
        errors.endDate =
          "End date cannot be before the start date.";
      }
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

  const saveCombo = async () => {
    if (!validateForm()) {
      return;
    }

    const cleanName = form.name.trim();
    const cleanDescription = form.description.trim();
    // Image now auto-derived from first selected product's image — no manual URL required
    const firstProductImage = selectedProductIds.length > 0 ? (products.find((p) => p.productId === selectedProductIds[0])?.imageUrl || "") : "";
    const cleanImage = form.image.trim() || firstProductImage;
    const originalPrice = Number(form.originalPrice);
    const comboPrice = Number(form.comboPrice);
    const items = Number(form.items);

    const payload: Record<string, unknown> = {
      name: cleanName,
      title: cleanName,
      description: cleanDescription,
      productIds: selectedProductIds,
      price: comboPrice,
      originalPrice,
      image: cleanImage,
      imageUrl: cleanImage,
      items: selectedProductIds.length,
      comboPrice,
      category: form.category,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    let savedServerId: string | undefined;

    if (editingId !== null) {
      const editingRow = combos.find(
        (combo) => combo.id === editingId
      );

      if (editingRow?.serverId) {
        try {
          await combosApi.update(editingRow.serverId, payload);
          savedServerId = editingRow.serverId;
        } catch (error) {
          console.error("Combo update failed:", error);
          setFormError(
            extractErrorMessage(error, "Failed to update combo. Please try again.")
          );
          return;
        }
      }
    } else {
      try {
        const response = await combosApi.create(payload);
        const data = (response as any)?.data ?? {};
        const rawId = data.comboId ?? data.id;
        if (rawId !== undefined && rawId !== null && String(rawId)) {
          savedServerId = String(rawId);
        }
      } catch (error) {
        console.error("Combo create failed:", error);
        setFormError(
          extractErrorMessage(error, "Failed to create combo. Please try again.")
        );
        return;
      }
    }

    if (editingId !== null) {
      setCombos((current) =>
        current.map((combo) =>
          combo.id === editingId
            ? {
                ...combo,
                name: cleanName,
                description: cleanDescription,
                image: cleanImage,
                items,
                originalPrice,
                comboPrice,
                category: form.category,
                status: form.status,
                startDate: form.startDate,
                endDate: form.endDate,
              }
            : combo
        )
      );
    } else {
      setCombos((current) => [
        ...current,
        {
          id: Date.now(),
          serverId: savedServerId,
          name: cleanName,
          description: cleanDescription,
          image: cleanImage,
          items,
          originalPrice,
          comboPrice,
          category: form.category,
          status: form.status,
          startDate: form.startDate,
          endDate: form.endDate,
          sold: 0,
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

  const deleteCombo = async () => {
    if (deleteId === null) {
      return;
    }

    const deletingRow = combos.find(
      (combo) => combo.id === deleteId
    );

    if (deletingRow?.serverId) {
      try {
        await combosApi.remove(deletingRow.serverId);
      } catch (error) {
        console.error("Combo delete failed:", error);
      }
    }

    setCombos((current) =>
      current.filter(
        (combo) =>
          combo.id !== deleteId
      )
    );

    setDeleteId(null);
    setViewCombo(null);

    showSuccess();
  };

  /* =====================================================
     TOGGLE
  ====================================================== */

  const toggleStatus = async (id: number) => {
    const targetRow = combos.find(
      (combo) => combo.id === id
    );

    if (targetRow) {
      const newStatus =
        targetRow.status === "Active" ? "Inactive" : "Active";

      if (targetRow.serverId) {
        try {
          await combosApi.setStatus(targetRow.serverId, newStatus);
        } catch (error) {
          console.error("Combo status update failed:", error);
        }
      }
    }

    setCombos((current) =>
      current.map((combo) =>
        combo.id === id
          ? {
              ...combo,
              status:
                combo.status ===
                "Active"
                  ? "Inactive"
                  : "Active",
            }
          : combo
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
          onClick={() =>
            router.push("/admin")
          }
          aria-label="Back to admin"
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] hover:bg-[#F1F4F8]"
        >
          <ArrowLeft size={19} />
        </button>

        <div>

          <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
            Combos
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Create and manage bundled product offers
          </p>

        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Create Combo
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
            Combos
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            title="Total Combos"
            value={combos.length}
            icon={Package}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#1769F5]"
          />

          <StatCard
            title="Active Combos"
            value={activeCombos}
            icon={CheckCircle2}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Inactive Combos"
            value={inactiveCombos}
            icon={XCircle}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

          <StatCard
            title="Total Sold"
            value={totalSold.toLocaleString(
              "en-IN"
            )}
            icon={ShoppingBag}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

        </section>

        {/* =================================================
            SAVINGS INFO
        ================================================== */}

        <section className="mt-5 flex items-center rounded-xl border border-[#DCE8FA] bg-[#F2F7FF] p-4">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E1EDFF] text-[#1769F5]">
            <Tag size={17} />
          </div>

          <div className="ml-3">

            <p className="text-[10px] font-bold text-[#29426A]">
              Combo Savings
            </p>

            <p className="mt-1 text-[9px] text-[#667A97]">
              Current configured customer savings:
              ₹
              {totalSavings.toLocaleString(
                "en-IN"
              )}
            </p>

          </div>

        </section>

        {/* =================================================
            FILTERS
        ================================================== */}

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
                placeholder="Search combos..."
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
                    | ComboStatus
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

            {/* CATEGORY */}

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="h-10 rounded-lg border border-[#DFE5ED] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] lg:w-[170px]"
            >

              <option value="All">
                All Categories
              </option>

              {CATEGORIES.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}

            </select>

            {/* CLEAR */}

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter(
                  "All"
                );
                setCategoryFilter(
                  "All"
                );
              }}
              className="h-10 rounded-lg border border-[#DCE2EA] px-4 text-[9px] font-semibold text-[#647287] hover:bg-[#F5F7FA]"
            >
              Clear
            </button>

          </div>

        </section>

        {/* =================================================
            COMBO LIST
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#293953]">
                Combo List
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredCombos.length} combos found
              </p>

            </div>

          </div>

          {filteredCombos.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* =================================================
                  DESKTOP
              ================================================== */}

              <div className="hidden overflow-x-auto md:block">

                <table className="min-w-full">

                  <thead>

                    <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Combo
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Category
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Items
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Price
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Period
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Sold
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

                    {filteredCombos.map(
                      (combo) => {
                        const savings =
                          combo.originalPrice -
                          combo.comboPrice;

                        return (
                          <tr
                            key={combo.id}
                            className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                          >

                            {/* COMBO */}

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-3">

                                <div className="h-[54px] w-[82px] shrink-0 overflow-hidden rounded-lg bg-[#EEF2F6]">

                                  {(() => {
                                    const prodImg = combo.image || (combo.productIds?.[0] ? products.find((p) => p.productId === combo.productIds![0])?.imageUrl : "");
                                    return prodImg ? (
                                      <img src={prodImg} alt={combo.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[#A0AAB8]">
                                        <Package size={20} />
                                      </div>
                                    );
                                  })()}

                                </div>

                                <div className="min-w-0">

                                  <p className="max-w-[230px] truncate text-[10px] font-bold text-[#33415A]">
                                    {combo.name}
                                  </p>

                                  <p className="mt-1 max-w-[250px] truncate text-[8px] text-[#8995A5]">
                                    {
                                      combo.description
                                    }
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* CATEGORY */}

                            <td className="px-5 py-4">

                              <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[8px] font-medium text-[#66748B]">
                                {
                                  combo.category
                                }
                              </span>

                            </td>

                            {/* ITEMS */}

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#52627A]">

                                <Package
                                  size={13}
                                  className="text-[#8995A5]"
                                />

                                {
                                  combo.items
                                }{" "}
                                items

                              </div>

                            </td>

                            {/* PRICE */}

                            <td className="px-5 py-4">

                              <p className="text-[10px] font-bold text-[#293953]">
                                ₹
                                {combo.comboPrice.toLocaleString(
                                  "en-IN"
                                )}
                              </p>

                              <p className="mt-1 text-[8px] text-[#A0AAB8] line-through">
                                ₹
                                {combo.originalPrice.toLocaleString(
                                  "en-IN"
                                )}
                              </p>

                              <p className="mt-1 text-[7px] font-semibold text-[#249357]">
                                Save ₹
                                {savings.toLocaleString(
                                  "en-IN"
                                )}
                              </p>

                            </td>

                            {/* PERIOD */}

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-2">

                                <CalendarDays
                                  size={13}
                                  className="text-[#8995A5]"
                                />

                                <div>

                                  <p className="text-[8px] font-semibold text-[#52627A]">
                                    {
                                      combo.startDate
                                    }
                                  </p>

                                  <p className="mt-1 text-[8px] text-[#8995A5]">
                                    to{" "}
                                    {
                                      combo.endDate
                                    }
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* SOLD */}

                            <td className="px-5 py-4">

                              <span className="text-[10px] font-bold text-[#52627A]">
                                {combo.sold.toLocaleString(
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
                                    combo.id
                                  )
                                }
                              >
                                <StatusBadge
                                  status={
                                    combo.status
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
                                    setViewCombo(
                                      combo
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE2EA] text-[#52627A] hover:bg-[#F3F5F8]"
                                  aria-label="View combo"
                                >
                                  <Eye
                                    size={13}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      combo
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE2EA] text-[#1769F5] hover:bg-[#EDF3FF]"
                                  aria-label="Edit combo"
                                >
                                  <Pencil
                                    size={13}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteId(
                                      combo.id
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0D4D4] text-[#D85A5A] hover:bg-[#FFF0F0]"
                                  aria-label="Delete combo"
                                >
                                  <Trash2
                                    size={13}
                                  />
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  MOBILE
              ================================================== */}

              <div className="divide-y divide-[#EDF0F4] md:hidden">

                {filteredCombos.map(
                  (combo) => {
                    const savings =
                      combo.originalPrice -
                      combo.comboPrice;

                    return (
                      <div
                        key={combo.id}
                        className="p-4"
                      >

                        <div className="flex gap-3">

                          <div className="h-[70px] w-[96px] shrink-0 overflow-hidden rounded-lg bg-[#EEF2F6]">
                            {(() => {
                              const prodImg = combo.image || (combo.productIds?.[0] ? products.find((p) => p.productId === combo.productIds![0])?.imageUrl : "");
                              return prodImg ? (
                                <img src={prodImg} alt={combo.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#A0AAB8]">
                                  <Package size={22} />
                                </div>
                              );
                            })()}

                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-2">

                              <div className="min-w-0">

                                <p className="truncate text-[10px] font-bold text-[#33415A]">
                                  {
                                    combo.name
                                  }
                                </p>

                                <p className="mt-1 line-clamp-2 text-[8px] text-[#8995A5]">
                                  {
                                    combo.description
                                  }
                                </p>

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleStatus(
                                    combo.id
                                  )
                                }
                              >
                                <StatusBadge
                                  status={
                                    combo.status
                                  }
                                />
                              </button>

                            </div>

                            <div className="mt-2 flex items-center gap-2">

                              <span className="rounded-full bg-[#F2F4F7] px-2 py-1 text-[7px] text-[#66748B]">
                                {
                                  combo.category
                                }
                              </span>

                              <span className="text-[8px] font-semibold text-[#52627A]">
                                {
                                  combo.items
                                }{" "}
                                items
                              </span>

                            </div>

                          </div>

                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">

                          <InfoBox
                            label="Combo Price"
                            value={`₹${combo.comboPrice.toLocaleString(
                              "en-IN"
                            )}`}
                          />

                          <InfoBox
                            label="Savings"
                            value={`₹${savings.toLocaleString(
                              "en-IN"
                            )}`}
                          />

                          <InfoBox
                            label="Sold"
                            value={combo.sold.toLocaleString(
                              "en-IN"
                            )}
                          />

                          <InfoBox
                            label="Period"
                            value={`${combo.startDate} → ${combo.endDate}`}
                          />

                        </div>

                        <div className="mt-3 flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              setViewCombo(
                                combo
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
                              openEdit(
                                combo
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
                                combo.id
                              )
                            }
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-[#F0D4D4] px-3 text-[8px] font-semibold text-[#D85A5A]"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>

                        </div>

                      </div>
                    );
                  }
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
            aria-label="Close modal"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative max-h-[92vh] w-full max-w-[700px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Combo"
                    : "Create Combo"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Configure bundled products and special pricing
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Combo Name"
                  value={form.name}
                  placeholder="Example: Family Grocery Combo"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      name: value,
                    })
                  }
                />

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Category
                  </label>

                  <select
                    value={
                      form.category
                    }
                    aria-invalid={!!formErrors.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category:
                          event.target
                            .value,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                  >

                    {CATEGORIES.map(
                      (category) => (
                        <option
                          key={category}
                          value={
                            category
                          }
                        >
                          {category}
                        </option>
                      )
                    )}

                  </select>

                  {formErrors.category && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {formErrors.category}
                    </p>
                  )}

                </div>

              </div>

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
                  placeholder="Describe the combo..."
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-lg border border-[#DCE2EA] px-3 py-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10"
                />

              </div>

              {/* PRODUCTS — select existing products to merge into a combo */}
              <div>
                <label className="text-[9px] font-semibold text-[#52627A]">
                  Select Products <span className="ml-1 text-[#EF4444]">*</span>
                  <span className="ml-2 text-[8px] font-normal text-[#8995A5]">({selectedProductIds.length} selected)</span>
                </label>
                <div className="mt-1.5">
                  <div className="relative">
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search products by name or SKU..."
                      className="h-10 w-full rounded-lg border border-[#DCE2EA] bg-white pl-3 pr-3 text-[10px] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5]"
                    />
                  </div>
                  <div className="mt-2 max-h-[220px] overflow-y-auto rounded-lg border border-[#E5E9EF] bg-[#FAFBFD] p-2">
                    {products.length === 0 ? (
                      <p className="py-6 text-center text-[10px] text-[#8995A5]">No products found. Add products first.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {products.map((p) => {
                          const isSelected = selectedProductIds.includes(p.productId);
                          return (
                            <label
                              key={p.productId}
                              className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[10px] transition ${isSelected ? "border-[#1769F5] bg-[#EAF0FF]" : "border-[#E5E9EF] bg-white hover:border-[#B8CCEC]"}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedProductIds((prev) => [...prev, p.productId]);
                                  else setSelectedProductIds((prev) => prev.filter((id) => id !== p.productId));
                                }}
                                className="h-4 w-4 shrink-0 accent-[#1769F5]"
                              />
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#EEF2F6] border border-[#E5E9EF]">
                                {p.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={p.imageUrl} alt={p.productName} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[#A0AAB8]">
                                    <Package size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-[#33415A]">{p.productName}</p>
                                <p className="text-[8px] text-[#8995A5]">SKU: {p.productId.slice(0, 8)} • ₹{p.price} • MRP ₹{p.mrp}</p>
                              </div>
                              {isSelected && <CheckCircle2 size={14} className="shrink-0 text-[#1769F5]" />}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {selectedProductIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedProductIds.map((id) => {
                        const prod = products.find((x) => x.productId === id);
                        return (
                          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-[#1769F5] px-2.5 py-1 text-[9px] font-semibold text-white">
                            {prod?.productName ?? id.slice(0, 8)}
                            <button type="button" onClick={() => setSelectedProductIds((prev) => prev.filter((x) => x !== id))} className="ml-1 rounded-full bg-white/20 p-0.5 hover:bg-white/30">
                              <X size={10} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {formErrors.items && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{formErrors.items}</p>}
                </div>
              </div>

              {/* IMAGE */}

              {formErrors.image && (
                <p className="-mt-2 text-[8px] font-medium text-[#EF4444]">
                  {formErrors.image}
                </p>
              )}

              {(() => {
                const previewSrc = form.image.trim() || (selectedProductIds[0] ? products.find((p) => p.productId === selectedProductIds[0])?.imageUrl : "");
                return previewSrc ? (
                  <div className="overflow-hidden rounded-xl border border-[#E5E9EF] bg-[#F7F9FC]">
                    <div className="aspect-[3/1]">
                      <img src={previewSrc} alt="Combo preview" className="h-full w-full object-cover" />
                    </div>
                  </div>
                ) : null;
              })()}

              {/* ITEMS + PRICES */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <NumberInput
                  label="Number of Items"
                  value={form.items}
                  min={2}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      items: value,
                    })
                  }
                />

                <NumberInput
                  label="Original Price"
                  value={
                    form.originalPrice
                  }
                  min={1}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      originalPrice:
                        value,
                    })
                  }
                />

                <NumberInput
                  label="Combo Price"
                  value={
                    form.comboPrice
                  }
                  min={1}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      comboPrice:
                        value,
                    })
                  }
                />

              </div>

              {/* PRICE PREVIEW */}

              {Number(
                form.originalPrice
              ) > 0 &&
                Number(
                  form.comboPrice
                ) > 0 && (
                  <div className="rounded-xl bg-[#EAF8F0] p-3">

                    <div className="flex items-center justify-between">

                      <span className="text-[9px] font-medium text-[#47725A]">
                        Customer Savings
                      </span>

                      <span className="text-[11px] font-bold text-[#249357]">
                        ₹
                        {Math.max(
                          0,
                          Number(
                            form.originalPrice
                          ) -
                            Number(
                              form.comboPrice
                            )
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>

                    </div>

                  </div>
                )}

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
                    value={
                      form.startDate
                    }
                    onChange={(event) => {
                      setForm({
                        ...form,
                        startDate: event.target.value,
                      });
                      setFormErrors((current) => ({
                        ...current,
                        startDate: undefined,
                        endDate: undefined,
                      }));
                      setFormError("");
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    aria-invalid={!!formErrors.startDate}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                      formErrors.startDate
                        ? "border-[#EF4444] bg-[#FFF8F8]"
                        : "border-[#DCE2EA]"
                    }`}
                  />

                  {formErrors.startDate && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {formErrors.startDate}
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
                    value={
                      form.endDate
                    }
                    onChange={(event) => {
                      setForm({
                        ...form,
                        endDate: event.target.value,
                      });
                      setFormErrors((current) => ({
                        ...current,
                        endDate: undefined,
                      }));
                      setFormError("");
                    }}
                    min={
                      form.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    aria-invalid={!!formErrors.endDate}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                      formErrors.endDate
                        ? "border-[#EF4444] bg-[#FFF8F8]"
                        : "border-[#DCE2EA]"
                    }`}
                  />

                  {formErrors.endDate && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {formErrors.endDate}
                    </p>
                  )}

                </div>

              </div>

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

            {/* FOOTER */}

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
                onClick={saveCombo}
                className="flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Save size={13} />

                {editingId !== null
                  ? "Update Combo"
                  : "Save Combo"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          VIEW MODAL
      ====================================================== */}

      {viewCombo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <button
            type="button"
            aria-label="Close"
            onClick={() =>
              setViewCombo(null)
            }
            className="absolute inset-0 cursor-default"
          />

          <div className="relative max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  Combo Details
                </h2>

                <p className="mt-1 text-[8px] text-[#8995A5]">
                  {viewCombo.category}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewCombo(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="p-5">

              {/* IMAGE */}

              <div className="overflow-hidden rounded-xl bg-[#EEF2F6]">

                <div className="aspect-[3/1]">

                  {(() => {
                    const prodImg = viewCombo.image || (viewCombo.productIds?.[0] ? products.find((p) => p.productId === viewCombo.productIds![0])?.imageUrl : "");
                    return prodImg ? (
                      <img src={prodImg} alt={viewCombo.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#A0AAB8]">
                        <Package size={28} />
                      </div>
                    );
                  })()}

                </div>

              </div>

              {/* TITLE */}

              <div className="mt-5 flex items-start justify-between gap-3">

                <div>

                  <h3 className="text-[15px] font-bold text-[#33415A]">
                    {viewCombo.name}
                  </h3>

                  <p className="mt-1.5 text-[10px] leading-5 text-[#8995A5]">
                    {
                      viewCombo.description
                    }
                  </p>

                </div>

                <StatusBadge
                  status={
                    viewCombo.status
                  }
                />

              </div>

              {/* PRODUCTS IN COMBO — merged from existing catalog */}
              {viewCombo.productIds && viewCombo.productIds.length > 0 && (
                <div className="mt-4 rounded-xl border border-[#E5E9EF] bg-[#FAFBFD] p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8995A5]">
                    Products in this combo ({viewCombo.productIds.length})
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {viewCombo.productIds.map((pid: string) => {
                      const prod = products.find((p) => p.productId === pid);
                      return (
                        <div key={pid} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[10px] border border-[#E5E9EF]">
                          <span className="font-medium text-[#33415A] truncate">{prod ? prod.productName : pid.slice(0, 8)}</span>
                          <span className="text-[#1769F5] font-semibold">{prod ? `₹${prod.price}` : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PRICE */}

              <div className="mt-5 grid grid-cols-2 gap-3">

                <DetailBox
                  label="Original Price"
                  value={`₹${viewCombo.originalPrice.toLocaleString(
                    "en-IN"
                  )}`}
                />

                <DetailBox
                  label="Combo Price"
                  value={`₹${viewCombo.comboPrice.toLocaleString(
                    "en-IN"
                  )}`}
                />

                <DetailBox
                  label="Items"
                  value={`${viewCombo.items} products`}
                />

                <DetailBox
                  label="Sold"
                  value={viewCombo.sold.toLocaleString(
                    "en-IN"
                  )}
                />

                <DetailBox
                  label="Start Date"
                  value={
                    viewCombo.startDate
                  }
                />

                <DetailBox
                  label="End Date"
                  value={
                    viewCombo.endDate
                  }
                />

              </div>

              {/* SAVINGS */}

              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#EAF8F0] px-4 py-3">

                <span className="text-[9px] font-medium text-[#47725A]">
                  Customer Savings
                </span>

                <span className="text-[12px] font-bold text-[#249357]">
                  ₹
                  {(
                    viewCombo.originalPrice -
                    viewCombo.comboPrice
                  ).toLocaleString(
                    "en-IN"
                  )}
                </span>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  const combo =
                    viewCombo;

                  setViewCombo(null);
                  openEdit(combo);
                }}
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[9px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Combo
              </button>

              <button
                type="button"
                onClick={() =>
                  setDeleteId(
                    viewCombo.id
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
              Delete Combo?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This combo will be permanently
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
                onClick={deleteCombo}
                className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D]"
              >
                Delete Combo
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
              Combo saved successfully.
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
  status: ComboStatus;
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
   FORM INPUT
============================================================ */

function FormInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <label className="text-[9px] font-semibold text-[#52627A]">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10"
      />

    </div>
  );
}

/* ============================================================
   NUMBER INPUT
============================================================ */

function NumberInput({
  label,
  value,
  min,
  error,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <label className="text-[9px] font-semibold text-[#52627A]">
        {label}
      </label>

      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        aria-invalid={!!error}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10 ${
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

      <p className="mt-1 break-words text-[10px] font-semibold text-[#52627A]">
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
        <Package size={25} />
      </div>

      <h3 className="mt-4 text-[13px] font-bold text-[#293953]">
        No combos found
      </h3>

      <p className="mt-1 text-[10px] text-[#8995A5]">
        Try changing your search or filters.
      </p>

    </div>
  );
}