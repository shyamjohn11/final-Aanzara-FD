"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  ArrowLeft,
  Package,
  X,
  ImagePlus,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import StatusBadge from "@/app/components/Admin/StatusBadge";
import ConfirmModal from "@/app/components/Admin/ConfirmModal";
import {
  dealersApi,
  categoriesApi,
  subcategoriesApi,
  brandsApi,
  productImagesApi,
} from "@/app/api/services";
import { extractErrorMessage } from "@/app/api/api";
import { toast } from "react-toastify";

/* ============================================================
   TYPES — same product shape as /admin/products, scoped to a dealer
============================================================ */

type DealerProduct = {
  productId: string;
  sku: string;
  productName: string;
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  dealerId?: string | null;
  price: number;
  mrp: number;
  discount: number;
  moq: number;
  status: string;
};

type Option = { value: string; label: string };

type ServerImage = {
  imageId: string;
  imageUrl?: string | null;
  isPrimary?: boolean;
};

const EMPTY_PRODUCT = {
  productName: "",
  sku: "",
  categoryId: "",
  subCategoryId: "",
  brandId: "",
  price: "",
  mrp: "",
  discount: "0",
  moq: "1",
  description: "",
  isOrganic: false,
  isGstFree: false,
  status: "Active",
};

type ProductForm = typeof EMPTY_PRODUCT;

function toProduct(raw: Record<string, unknown>): DealerProduct | null {
  const id = String(raw.productId ?? "").trim();
  if (!id) return null;
  return {
    productId: id,
    sku: String(raw.sku ?? ""),
    productName: String(raw.productName ?? ""),
    categoryId: (raw.categoryId as string | null) ?? null,
    subCategoryId: (raw.subCategoryId as string | null) ?? null,
    brandId: (raw.brandId as string | null) ?? null,
    dealerId: (raw.dealerId as string | null) ?? null,
    price: Number(raw.price ?? 0),
    mrp: Number(raw.mrp ?? 0),
    discount: Number(raw.discount ?? 0),
    moq: Number(raw.moq ?? 1) || 1,
    status: String(raw.status ?? "Unknown"),
  };
}

function unwrapList(payload: unknown): {
  rows: DealerProduct[];
  total: number;
} {
  const root =
    (payload as Record<string, unknown> | null) ?? {};
  const data = Array.isArray(root)
    ? root
    : Array.isArray(root.items)
      ? (root.items as unknown[])
      : [];
  const rows = (data as Record<string, unknown>[])
    .map(toProduct)
    .filter((r): r is DealerProduct => r !== null);
  return {
    rows,
    total:
      typeof root.totalCount === "number"
        ? root.totalCount
        : rows.length,
  };
}

function unwrapOptions(
  payload: unknown,
  idKey: string,
  nameKey: string
): Option[] {
  const root =
    (payload as Record<string, unknown> | null) ?? {};
  const data = Array.isArray(root)
    ? root
    : Array.isArray(root.items)
      ? (root.items as unknown[])
      : Array.isArray(root.data)
        ? (root.data as unknown[])
        : [];
  return (data as Record<string, unknown>[])
    .map((r) => ({
      value: String(r[idKey] ?? ""),
      label: String(r[nameKey] ?? ""),
    }))
    .filter((o) => o.value && o.label);
}

/* ============================================================
   FORM CONTROLS (same look as /admin/products)
============================================================ */

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-semibold text-ink">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-10 rounded-lg border bg-white px-3 text-[13px] outline-none focus:border-navy ${
          error ? "border-red-400" : "border-line"
        }`}
      />
      {error && (
        <span className="text-[11px] text-red-500">{error}</span>
      )}
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  required,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  required?: boolean;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-semibold text-ink">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 rounded-lg border bg-white px-3 text-[13px] outline-none focus:border-navy ${
          error ? "border-red-400" : "border-line"
        }`}
      >
        <option value="">{placeholder ?? "Select"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-[11px] text-red-500">{error}</span>
      )}
    </label>
  );
}

/* ============================================================
   PAGE — Admin → Agents → Dealers → Products
============================================================ */

export default function DealerProductsPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = String(params?.agentId ?? "");
  const dealerId = String(params?.dealerId ?? "");

  const [dealerName, setDealerName] = useState("");
  const [rows, setRows] = useState<DealerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [categories, setCategories] = useState<Option[]>([]);
  const [subCategories, setSubCategories] = useState<
    { value: string; label: string; categoryId: string }[]
  >([]);
  const [brands, setBrands] = useState<Option[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DealerProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT);
  const [formErrors, setFormErrors] = useState<Partial<ProductForm>>({});
  const [saving, setSaving] = useState(false);

  const [images, setImages] = useState<ServerImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryName = useCallback(
    (id?: string | null) =>
      categories.find((c) => c.value === id)?.label ?? "—",
    [categories]
  );
  const brandName = useCallback(
    (id?: string | null) =>
      brands.find((b) => b.value === id)?.label ?? "—",
    [brands]
  );

  const filteredSubCategories = useMemo(
    () =>
      form.categoryId
        ? subCategories.filter(
            (s) => s.categoryId === form.categoryId
          )
        : subCategories,
    [subCategories, form.categoryId]
  );

  /* ---------------- loads ---------------- */

  const loadProducts = useCallback(async () => {
    if (!dealerId) return;
    setLoading(true);
    try {
      const res = await dealersApi.products(dealerId, {
        page,
        pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter === "All" ? undefined : statusFilter,
      });
      const { rows: mapped, total } = unwrapList(
        (res as { data?: unknown })?.data ?? res
      );
      setRows(mapped);
      setTotalCount(total);
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Unable to load products.")
      );
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [dealerId, page, debouncedSearch, statusFilter]);

  const loadCatalogs = useCallback(async () => {
    try {
      const [cats, subs, brs, dealerRes] = await Promise.all([
        categoriesApi.list().catch(() => null),
        subcategoriesApi.list().catch(() => null),
        brandsApi.list().catch(() => null),
        dealerId
          ? dealersApi.details(dealerId).catch(() => null)
          : null,
      ]);
      if (cats) {
        setCategories(
          unwrapOptions(
            (cats as { data?: unknown })?.data ?? cats,
            "categoryId",
            "categoryName"
          )
        );
      }
      if (subs) {
        const root =
          ((subs as { data?: unknown })?.data ??
            subs) as Record<string, unknown>;
        const data = (
          Array.isArray(root)
            ? root
            : Array.isArray(root.items)
              ? root.items
              : []
        ) as Record<string, unknown>[];
        setSubCategories(
          data
            .map((r) => ({
              value: String(r.subCategoryId ?? ""),
              label: String(r.subCategoryName ?? ""),
              categoryId: String(r.categoryId ?? ""),
            }))
            .filter((o) => o.value && o.label)
        );
      }
      if (brs) {
        setBrands(
          unwrapOptions(
            (brs as { data?: unknown })?.data ?? brs,
            "brandId",
            "brandName"
          )
        );
      }
      if (dealerRes) {
        const d = ((dealerRes as { data?: unknown })?.data ??
          dealerRes) as Record<string, unknown>;
        setDealerName(String(d.shopName ?? ""));
      }
    } catch {
      // Catalog dropdowns are best-effort; the grid still loads.
    }
  }, [dealerId]);

  const loadImages = useCallback(async (productId: string) => {
    setImagesLoading(true);
    try {
      const res = await productImagesApi.list(productId);
      const payload: unknown =
        (res as { data?: unknown })?.data ?? res;
      const root = payload as Record<string, unknown>;
      const data = (
        Array.isArray(payload)
          ? payload
          : Array.isArray(root.items)
            ? root.items
            : Array.isArray(root.data)
              ? root.data
              : []
      ) as Record<string, unknown>[];
      setImages(
        data
          .map((r) => ({
            imageId: String(r.imageId ?? r.id ?? ""),
            imageUrl: (r.imageUrl as string | null) ?? null,
            isPrimary: r.isPrimary === true,
          }))
          .filter((i) => i.imageId)
      );
    } catch {
      setImages([]);
    } finally {
      setImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  /* ---------------- validation (same rules as /admin/products) ---------------- */

  const validate = (f: ProductForm): Partial<ProductForm> => {
    const errors: Partial<ProductForm> = {};
    if (f.productName.trim().length < 2 || f.productName.trim().length > 120) {
      errors.productName = "Name must be 2–120 characters.";
    }
    if (f.sku.trim().length < 3 || f.sku.trim().length > 40) {
      errors.sku = "SKU must be 3–40 characters.";
    }
    if (!f.categoryId) errors.categoryId = "Category is required.";
    if (!f.brandId) errors.brandId = "Brand is required.";
    if (!(Number(f.price) > 0)) errors.price = "Price must be > 0.";
    if (!(Number(f.mrp) > 0)) errors.mrp = "MRP must be > 0.";
    const discount = Number(f.discount);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      errors.discount = "Discount must be 0–100.";
    }
    if (!Number.isInteger(Number(f.moq)) || Number(f.moq) < 1) {
      errors.moq = "MOQ must be ≥ 1.";
    }
    return errors;
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setFormErrors({});
    setImages([]);
    setModalOpen(true);
  };

  const openEdit = (row: DealerProduct) => {
    setEditing(row);
    setForm({
      productName: row.productName,
      sku: row.sku,
      categoryId: row.categoryId ?? "",
      subCategoryId: row.subCategoryId ?? "",
      brandId: row.brandId ?? "",
      price: String(row.price),
      mrp: String(row.mrp),
      discount: String(row.discount),
      moq: String(row.moq),
      description: "",
      isOrganic: false,
      isGstFree: false,
      status:
        row.status.toLowerCase() === "inactive"
          ? "Inactive"
          : "Active",
    });
    setFormErrors({});
    setModalOpen(true);
    void loadImages(row.productId);
  };

  const handleSave = async () => {
    const errors = validate(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      // DealerId comes from the route and is attached server-side —
      // the same payload shape as /admin/products otherwise.
      const payload: Record<string, unknown> = {
        categoryId: form.categoryId || null,
        subCategoryId: form.subCategoryId || null,
        brandId: form.brandId || null,
        productName: form.productName.trim(),
        sku: form.sku.trim().toUpperCase(),
        description: form.description.trim(),
        price: Number(form.price),
        mrp: Number(form.mrp),
        discount: Number(form.discount) || 0,
        moq: Number(form.moq) || 1,
        isOrganic: form.isOrganic,
        isGstFree: form.isGstFree,
        status: form.status.toLowerCase(),
      };

      if (editing) {
        await dealersApi.updateProduct(
          dealerId,
          editing.productId,
          payload
        );
        toast.success("Product updated successfully.");
      } else {
        const res = await dealersApi.createProduct(dealerId, payload);
        const created = ((res as { data?: unknown })?.data ??
          res) as Record<string, unknown>;
        const newId = String(created.productId ?? "");
        toast.success("Product added to dealer successfully.");
        if (newId) {
          // Stay in edit mode so images can be attached immediately.
          const createdRow: DealerProduct = {
            productId: newId,
            sku: String(payload.sku),
            productName: String(payload.productName),
            categoryId: (payload.categoryId as string | null) ?? null,
            subCategoryId:
              (payload.subCategoryId as string | null) ?? null,
            brandId: (payload.brandId as string | null) ?? null,
            price: Number(payload.price),
            mrp: Number(payload.mrp),
            discount: Number(payload.discount),
            moq: Number(payload.moq),
            status: String(payload.status),
          };
          setEditing(createdRow);
          void loadImages(newId);
          void loadProducts();
          return;
        }
      }
      setModalOpen(false);
      void loadProducts();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Unable to save product.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await dealersApi.removeProduct(dealerId, deleteId);
      toast.success("Product deleted successfully.");
      setDeleteId(null);
      void loadProducts();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Unable to delete product.")
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!editing) return;
    const okTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!okTypes.includes(file.type)) {
      toast.error("Only PNG, JPEG or WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be ≤ 5MB.");
      return;
    }
    setUploading(true);
    try {
      await productImagesApi.upload(
        editing.productId,
        file,
        images.length === 0
      );
      toast.success("Image uploaded.");
      void loadImages(editing.productId);
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Unable to upload image.")
      );
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const set = (key: keyof ProductForm) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/agents/${agentId}/dealers/${dealerId}`
              )
            }
            className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft hover:text-navy"
          >
            <ArrowLeft size={13} />
            Back to Dealer
          </button>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-sora text-[20px] font-bold text-navy">
                Dealer Products{dealerName ? ` — ${dealerName}` : ""}
              </h1>
              <p className="mt-1 text-[12.5px] text-ink-soft">
                Only this dealer&apos;s products are listed
                here. New products are automatically assigned
                to this dealer.
              </p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
            >
              <Plus size={15} />
              Add Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or SKU…"
              className="h-10 w-full rounded-lg border border-line bg-white pl-10 pr-4 text-[13px] outline-none focus:border-navy"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] outline-none"
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="min-w-[900px] min-w-full text-left">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Brand</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">MOQ</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-[13px] text-ink-soft"
                  >
                    Loading products…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <Package
                      size={22}
                      className="mx-auto text-ink-faint"
                    />
                    <p className="mt-2 text-[13px] text-ink-soft">
                      No products found for this dealer.
                    </p>
                    <button
                      type="button"
                      onClick={openAdd}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-[12px] font-bold text-white"
                    >
                      <Plus size={14} />
                      Add Product
                    </button>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.productId}
                    className="border-b border-line last:border-0 hover:bg-paper"
                  >
                    <td className="max-w-[220px] truncate px-4 py-3 text-[13px] font-bold text-ink">
                      {row.productName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-[#F3F5F8] px-2 py-1 font-mono text-[11.5px] text-ink">
                        {row.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-ink-soft">
                      {categoryName(row.categoryId)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-ink-soft">
                      {brandName(row.brandId)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-ink">
                      ₹{row.price.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-ink-soft">
                      {row.moq}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(row)}
                          className="rounded-lg border border-line p-2 text-ink-soft hover:border-navy hover:text-navy"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteId(row.productId)}
                          className="rounded-lg border border-line p-2 text-ink-soft hover:border-red-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-ink-soft">
            Showing {rows.length} of {totalCount} products
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-line bg-white p-2 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 text-[12px] font-semibold text-ink">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
              className="rounded-lg border border-line bg-white p-2 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit modal — same fields as /admin/products */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-xl bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-5 py-4">
              <h2 className="font-sora text-[15px] font-bold text-navy">
                {editing ? "Edit Product" : "Add Product"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-line p-1.5 text-ink-soft hover:text-ink"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormInput
                  label="Product Name"
                  value={form.productName}
                  onChange={set("productName")}
                  required
                  error={formErrors.productName}
                />
              </div>
              <FormInput
                label="SKU"
                value={form.sku}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    sku: v.toUpperCase().replace(/\s+/g, "-"),
                  }))
                }
                required
                error={formErrors.sku}
              />
              <FormSelect
                label="Status"
                value={form.status}
                onChange={set("status")}
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ]}
              />
              <FormSelect
                label="Category"
                value={form.categoryId}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    categoryId: v,
                    subCategoryId: "",
                  }))
                }
                options={categories}
                required
                error={formErrors.categoryId}
                placeholder="Select Category"
              />
              <FormSelect
                label="Sub Category"
                value={form.subCategoryId}
                onChange={set("subCategoryId")}
                options={filteredSubCategories}
                placeholder="Optional"
              />
              <FormSelect
                label="Brand"
                value={form.brandId}
                onChange={set("brandId")}
                options={brands}
                required
                error={formErrors.brandId}
                placeholder="Select Brand"
              />
              <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <FormInput
                  label="Price (₹)"
                  value={form.price}
                  onChange={set("price")}
                  type="number"
                  required
                  error={formErrors.price}
                />
                <FormInput
                  label="MRP (₹)"
                  value={form.mrp}
                  onChange={set("mrp")}
                  type="number"
                  required
                  error={formErrors.mrp}
                />
                <FormInput
                  label="Discount %"
                  value={form.discount}
                  onChange={set("discount")}
                  type="number"
                  error={formErrors.discount}
                />
                <FormInput
                  label="MOQ"
                  value={form.moq}
                  onChange={set("moq")}
                  type="number"
                  error={formErrors.moq}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[11.5px] font-semibold text-ink">
                    Description
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      set("description")(e.target.value)
                    }
                    rows={3}
                    maxLength={500}
                    className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-navy"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-[12.5px] text-ink">
                <input
                  type="checkbox"
                  checked={form.isOrganic}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      isOrganic: e.target.checked,
                    }))
                  }
                />
                Organic
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-ink">
                <input
                  type="checkbox"
                  checked={form.isGstFree}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      isGstFree: e.target.checked,
                    }))
                  }
                />
                GST Free
              </label>

              {/* Images — available once the product exists */}
              {editing && (
                <div className="sm:col-span-2 rounded-lg border border-line p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11.5px] font-semibold text-ink">
                      Product Images (click to set primary)
                    </span>
                    <label
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-navy hover:border-navy ${
                        uploading ? "opacity-50" : ""
                      }`}
                    >
                      <ImagePlus size={13} />
                      {uploading ? "Uploading…" : "Upload"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) void handleImageUpload(file);
                        }}
                      />
                    </label>
                  </div>
                  {imagesLoading ? (
                    <p className="text-[12px] text-ink-soft">
                      Loading images…
                    </p>
                  ) : images.length === 0 ? (
                    <p className="text-[12px] text-ink-faint">
                      No images yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {images.map((img) => (
                        <div
                          key={img.imageId}
                          className="relative h-16 w-16 overflow-hidden rounded-lg border border-line"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.imageUrl ?? ""}
                            alt=""
                            className="h-full w-full cursor-pointer object-cover"
                            onClick={async () => {
                              if (!editing || img.isPrimary) return;
                              try {
                                await productImagesApi.setPrimary(
                                  editing.productId,
                                  img.imageId
                                );
                                void loadImages(editing.productId);
                              } catch (error) {
                                toast.error(
                                  extractErrorMessage(
                                    error,
                                    "Unable to set primary image."
                                  )
                                );
                              }
                            }}
                          />
                          {img.isPrimary && (
                            <span className="absolute left-0 top-0 bg-green px-1 text-[9px] font-bold text-white">
                              PRIMARY
                            </span>
                          )}
                          <button
                            type="button"
                            aria-label="Remove image"
                            className="absolute right-0 top-0 bg-black/60 px-1 text-[10px] font-bold text-white"
                            onClick={async () => {
                              if (!editing) return;
                              try {
                                await productImagesApi.remove(
                                  editing.productId,
                                  img.imageId
                                );
                                void loadImages(editing.productId);
                              } catch (error) {
                                toast.error(
                                  extractErrorMessage(
                                    error,
                                    "Unable to remove image."
                                  )
                                );
                              }
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-line bg-white px-5 py-3.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-line px-4 py-2.5 text-[12.5px] font-semibold text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-navy px-5 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : editing
                    ? "Save Changes"
                    : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="Delete product?"
        description="The product will be permanently removed from this dealer."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
        danger
      />
    </AdminLayout>
  );
}
