// File: src/app/admin/products/[id]/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { extractErrorMessage } from "@/app/api/api";
import {
  brandsApi,
  categoriesApi,
  productsApi,
  subcategoriesApi,
  warehousesApi,
  inventoryApi,
} from "@/app/api/services";
import {
  ArrowLeft,
  Package,
  Pencil,
  Trash2,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
  ShoppingBag,
  Tag,
  Boxes,
  IndianRupee,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type Product = {
  productId: string;
  sku: string;
  productName: string;
  categoryId: string;
  subCategoryId: string;
  brandId: string;
  price: number;
  mrp: number;
  discount: number;
  moq: number;
  isOrganic: boolean;
  isGstFree: boolean;
  status: "active" | "inactive";
  description?: string;
  specification?: string;
  categoryName?: string;
  subCategoryName?: string;
  brandName?: string;
};

type Category = {
  categoryId: string;
  categoryName: string;
};

type SubCategory = {
  subCategoryId: string;
  subCategoryName: string;
  categoryId: string;
};

type Brand = {
  brandId: string;
  brandName: string;
};

type ProductErrors = Partial<Record<
  "productName" | "sku" | "categoryId" | "subCategoryId" | "brandId" | "warehouseId" | "stockQuantity" | "price" | "mrp" | "discount" | "moq" | "description" | "image",
  string
>>;

/* ============================================================
   PAGE
============================================================ */

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const productId = params?.id as string;

  /* ==========================================================
     STATE
  ========================================================== */

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ==========================================================
     FORM STATE
  ========================================================== */

  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [discount, setDiscount] = useState("");
  const [moq, setMoq] = useState("");
  const [isOrganic, setIsOrganic] = useState(false);
  const [isGstFree, setIsGstFree] = useState(false);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [description, setDescription] = useState("");
  const [specification, setSpecification] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState<{ warehouseId: string; warehouseName: string; city?: string }[]>([]);
  const [stockQuantity, setStockQuantity] = useState("");
  const [image, setImage] = useState("");

  const [errors, setErrors] = useState<ProductErrors>({});

  /* ==========================================================
     FETCH DATA
  ========================================================== */

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await productsApi.details(productId);
      const data = response.data as Product;
      setProduct(data);
      // Populate form
      setProductName(data.productName || "");
      setSku(data.sku || "");
      setCategoryId(data.categoryId || "");
      setSubCategoryId(data.subCategoryId || "");
      setBrandId(data.brandId || "");
      setPrice(String(data.price || ""));
      setMrp(String(data.mrp || ""));
      setDiscount(String(data.discount || ""));
      setMoq(String(data.moq || ""));
      setIsOrganic(data.isOrganic || false);
      setIsGstFree(data.isGstFree || false);
      setStatus(data.status || "active");
      setDescription(data.description || "");
      setSpecification(data.specification || "");
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to load product.");
      setError(message);
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.list();
      setCategories(
        (response.data as { items: Category[] })?.items || []
      );
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await subcategoriesApi.list();
      setSubCategories(
        (response.data as { items: SubCategory[] })?.items || []
      );
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandsApi.list();
      setBrands((response.data as { items: Brand[] })?.items || []);
    } catch (err) {
      console.error("Error fetching brands:", err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response: any = await warehousesApi.list(1, 100);
      const payload: any = response?.data ?? response;
      const items: any[] = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      setWarehouses(
        items.map((w: any) => ({
          warehouseId: String(w.warehouseId ?? w.id ?? ""),
          warehouseName: String(w.warehouseName ?? w.name ?? "Warehouse"),
          city: String(w.city ?? w.address ?? ""),
        }))
      );
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    }
  };

  const fetchWarehouseStock = async (pid: string) => {
    try {
      const res: any = await inventoryApi.byProduct(pid);
      const payload: any = res?.data ?? res;
      const items: any[] = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : [];
      if (items.length === 0) return;
      // Prefer the warehouse that matches the current selection (if user just picked one),
      // otherwise pick the entry with the highest available stock, fallback to first
      const currentWhId = warehouseId;
      let target: any = null;
      if (currentWhId) {
        target = items.find((it: any) => String(it.warehouseId ?? it.warehouse?.warehouseId ?? "") === currentWhId) ?? null;
      }
      if (!target) {
        // Pick the one with highest stockQuantity/availableQuantity
        target = items.reduce((best: any, cur: any) => {
          const bestStock = Number(best?.stockQuantity ?? best?.availableQuantity ?? 0);
          const curStock = Number(cur?.stockQuantity ?? cur?.availableQuantity ?? 0);
          return curStock > bestStock ? cur : best;
        }, items[0]);
      }
      const whId = String(target.warehouseId ?? target.warehouse?.warehouseId ?? "");
      const stock = target.stockQuantity ?? target.availableQuantity ?? target.quantity ?? "";
      // Only set if not already set (preserve user's pending selection during edit)
      if (whId && !warehouseId) setWarehouseId(whId);
      if (stock !== undefined && stock !== "" && !stockQuantity) setStockQuantity(String(stock));
      // If we are in view mode and have no warehouse yet, set it for display
      if (whId && !isEditing) {
        setWarehouseId((prev) => prev || whId);
        setStockQuantity((prev) => prev || String(stock ?? ""));
      }
    } catch {}
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchCategories();
      fetchSubCategories();
      fetchBrands();
      fetchWarehouses();
      fetchWarehouseStock(productId);
    }
  }, [productId]);

  /* ==========================================================
     CLEAR ERROR
  ========================================================== */

  const clearError = (field: keyof ProductErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  /* ==========================================================
     VALIDATE
  ========================================================== */

  const validateProduct = () => {
    const next: ProductErrors = {};
    const cleanName = productName.trim();
    const cleanSku = sku.trim().toUpperCase();

    if (!cleanName) {
      next.productName = "Product name is required.";
    } else if (cleanName.length < 2) {
      next.productName = "Product name must be at least 2 characters.";
    } else if (cleanName.length > 120) {
      next.productName = "Product name must be 120 characters or less.";
    }

    if (!cleanSku) {
      next.sku = "SKU is required.";
    } else if (cleanSku.length < 3) {
      next.sku = "SKU must be at least 3 characters.";
    } else if (cleanSku.length > 40) {
      next.sku = "SKU must be 40 characters or less.";
    }

    if (!categoryId) {
      next.categoryId = "Category is required.";
    }

    if (!brandId) {
      next.brandId = "Brand is required.";
    }

    if (!warehouseId) {
      next.warehouseId = "Warehouse is required.";
    }

    if (!stockQuantity.trim()) {
      next.stockQuantity = "Stock quantity is required.";
    } else if (isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0) {
      next.stockQuantity = "Stock quantity must be 0 or more.";
    }

    if (!price.trim()) {
      next.price = "Price is required.";
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      next.price = "Enter a valid price greater than 0.";
    }

    if (!mrp.trim()) {
      next.mrp = "MRP is required.";
    } else if (isNaN(Number(mrp)) || Number(mrp) <= 0) {
      next.mrp = "Enter a valid MRP greater than 0.";
    }

    if (discount && (isNaN(Number(discount)) || Number(discount) < 0 || Number(discount) > 100)) {
      next.discount = "Discount must be between 0 and 100.";
    }

    if (description && description.length > 500) {
      next.description = "Description must be 500 characters or less.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* ==========================================================
     UPDATE HANDLERS
  ========================================================== */

  const updateProductName = (value: string) => {
    setProductName(value);
    clearError("productName");
  };

  const updateSku = (value: string) => {
    setSku(value.toUpperCase().replace(/\s+/g, "-"));
    clearError("sku");
  };

  const updateCategory = (value: string) => {
    setCategoryId(value);
    clearError("categoryId");
  };

  const updateSubCategory = (value: string) => {
    setSubCategoryId(value);
    clearError("subCategoryId");
  };

  const updateBrand = (value: string) => {
    setBrandId(value);
    clearError("brandId");
  };

  const updatePrice = (value: string) => {
    if (value !== "" && !/^\d*(?:\.\d*)?$/.test(value)) return;
    setPrice(value);
    clearError("price");
  };

  const updateMrp = (value: string) => {
    if (value !== "" && !/^\d*(?:\.\d*)?$/.test(value)) return;
    setMrp(value);
    clearError("mrp");
  };

  const updateDiscount = (value: string) => {
    if (value !== "" && !/^\d*(?:\.\d*)?$/.test(value)) return;
    setDiscount(value);
    clearError("discount");
  };

  const updateMoq = (value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    setMoq(value);
    clearError("moq");
  };

  const updateDescription = (value: string) => {
    setDescription(value);
    clearError("description");
  };

  /* ==========================================================
     SAVE PRODUCT
  ========================================================== */

  const handleSave = async () => {
    if (!validateProduct()) return;

    setSubmitting(true);

    try {
      const payload = {
        categoryId,
        subCategoryId: subCategoryId || null,
        brandId,
        productName: productName.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim(),
        specification: specification.trim(),
        price: Number(price),
        mrp: Number(mrp),
        discount: discount ? Number(discount) : 0,
        moq: moq ? Number(moq) : 1,
        isOrganic,
        isGstFree,
        status,
      };

      await productsApi.update(productId, payload);

      // Warehouse stock — best-effort, does not block product save
      if (warehouseId && stockQuantity) {
        try {
          const qty = Number(stockQuantity);
          if (Number.isFinite(qty) && qty >= 0) {
            await inventoryApi.receiveStock(productId, {
              warehouseId,
              quantity: qty,
              reason: "Stock update via product details",
            });
          }
        } catch (invErr) {
          console.error("Warehouse stock update failed:", invErr);
        }
      }

      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
      // Keep the selected warehouse/stock visible immediately — don't overwrite with stale fetch
      // The inventory was just updated, so the local state is the source of truth for display
      fetchProduct();
      // Delay the warehouse stock refetch so the backend has time to persist
      setTimeout(() => fetchWarehouseStock(productId), 500);
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to save product.");
      setErrors({ ...errors, ...{ description: message } });
      console.error("Error saving product:", err);
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete = async () => {
    try {
      await productsApi.remove(productId);
      setShowDelete(false);
      router.push("/admin/products");
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to delete product.");
      console.error("Error deleting product:", err);
      setShowDelete(false);
    }
  };

  /* ==========================================================
     CANCEL EDIT
  ========================================================== */

  const handleCancelEdit = () => {
    if (product) {
      setProductName(product.productName || "");
      setSku(product.sku || "");
      setCategoryId(product.categoryId || "");
      setSubCategoryId(product.subCategoryId || "");
      setBrandId(product.brandId || "");
      setPrice(String(product.price || ""));
      setMrp(String(product.mrp || ""));
      setDiscount(String(product.discount || ""));
      setMoq(String(product.moq || ""));
      setIsOrganic(product.isOrganic || false);
      setIsGstFree(product.isGstFree || false);
      setStatus(product.status || "active");
      setDescription(product.description || "");
      setSpecification(product.specification || "");
    }
    setErrors({});
    setIsEditing(false);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E4E8EF] border-t-[#1769F5]" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !product) {
    return (
      <AdminLayout>
        <div className="flex h-screen flex-col items-center justify-center">
          <AlertCircle size={48} className="text-[#D85A5A]" />
          <p className="mt-4 text-[14px] text-[#D85A5A]">{error || "Product not found"}</p>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="mt-4 rounded-lg bg-[#1769F5] px-4 py-2 text-white"
          >
            Back to Products
          </button>
        </div>
      </AdminLayout>
    );
  }

  const getCategoryName = (id: string) => {
    const cat = categories.find((c) => c.categoryId === id);
    return cat?.categoryName || "Unknown";
  };

  const getSubCategoryName = (id: string) => {
    const sub = subCategories.find((s) => s.subCategoryId === id);
    return sub?.subCategoryName || "None";
  };

  const getBrandName = (id: string) => {
    const b = brands.find((b) => b.brandId === id);
    return b?.brandName || "Unknown";
  };

  const filteredSubCategories = subCategories.filter((s) => s.categoryId === categoryId);

  return (
    <AdminLayout>
      <main className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

        {/* HEADER */}
        <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-[#E4E8EF] bg-white px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            aria-label="Back to products"
            className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] transition hover:bg-[#F1F4F8] hover:text-[#1769F5]"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
              Product Details
            </h1>
            <p className="hidden text-[9px] text-[#8995A5] sm:block">
              View and manage product information
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] font-semibold text-[#52627A] transition hover:border-[#1769F5] hover:text-[#1769F5]"
                >
                  <Pencil size={14} />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#FFF0F0] px-3 text-[10px] font-semibold text-[#D85A5A] transition hover:bg-[#FFE5E5]"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
          {/* BREADCRUMB */}
          <div className="mb-5 flex flex-wrap items-center gap-2 text-[9px] text-[#8995A5]">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="hover:text-[#1769F5]"
            >
              Dashboard
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="hover:text-[#1769F5]"
            >
              Products
            </button>
            <span>/</span>
            <span className="font-medium text-[#566579]">{product.productName}</span>
          </div>

          {/* TOP CARD */}
          <section className="rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="flex h-[130px] w-[130px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EDF3FF]">
                <Package size={45} className="text-[#4672C1]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${
                      status === "active"
                        ? "bg-[#EAF8F0] text-[#249357]"
                        : "bg-[#FFF0F0] text-[#D85A5A]"
                    }`}
                  >
                    {status === "active" ? "Active" : "Inactive"}
                  </span>
                  <span className="rounded-full bg-[#F1F4F8] px-2.5 py-1 text-[8px] font-semibold text-[#718096]">
                    #{product.productId.slice(0, 8)}
                  </span>
                </div>

                <h2 className="mt-3 text-[20px] font-bold text-[#263650]">{productName}</h2>
                <p className="mt-1 font-mono text-[9px] text-[#8995A5]">SKU: {sku}</p>

                <div className="mt-4 flex flex-wrap gap-5">
                  <SummaryItem icon={Tag} label="Category" value={getCategoryName(categoryId)} />
                  <SummaryItem icon={Tag} label="Sub Category" value={getSubCategoryName(subCategoryId)} />
                  <SummaryItem icon={ShoppingBag} label="Brand" value={getBrandName(brandId)} />
                  <SummaryItem icon={IndianRupee} label="Price" value={`₹${Number(price || 0).toLocaleString("en-IN")}`} />
                  <SummaryItem icon={IndianRupee} label="MRP" value={`₹${Number(mrp || 0).toLocaleString("en-IN")}`} />
                  <SummaryItem icon={Boxes} label="MOQ" value={moq || "1"} />
                  <SummaryItem
                    icon={Package}
                    label="Warehouse"
                    value={
                      warehouses.find((w) => w.warehouseId === warehouseId)?.warehouseName ||
                      (warehouseId ? warehouseId.slice(0, 8) : "Not assigned") + (stockQuantity ? ` • ${stockQuantity} in stock` : "")
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* CONTENT */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_330px]">
            {/* MAIN FORM */}
            <section className="rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
              <div className="border-b border-[#EDF0F4] px-5 py-4">
                <h2 className="text-[13px] font-bold text-[#263650]">Product Information</h2>
                <p className="mt-1 text-[9px] text-[#8995A5]">
                  {isEditing ? "Update the product details below." : "Product details and catalogue information."}
                </p>
              </div>

              <div className="space-y-5 p-5">
                {Object.keys(errors).length > 0 && isEditing && (
                  <div role="alert" className="rounded-xl border border-[#F0D4D4] bg-[#FFF7F7] px-4 py-3">
                    <p className="text-[9px] font-bold text-[#B84A4A]">Please fix the highlighted fields before saving.</p>
                  </div>
                )}

                {/* PRODUCT NAME */}
                <Field
                  label="Product Name"
                  value={productName}
                  editing={isEditing}
                  onChange={updateProductName}
                  error={errors.productName}
                />

                {/* SKU */}
                <Field
                  label="SKU"
                  value={sku}
                  editing={isEditing}
                  onChange={updateSku}
                  error={errors.sku}
                  mono
                />

                {/* CATEGORY / SUB CATEGORY / BRAND */}
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SelectField
                      label="Category"
                      value={categoryId}
                      onChange={updateCategory}
                      error={errors.categoryId}
                      options={categories.map((c) => ({ value: c.categoryId, label: c.categoryName }))}
                    />

                    <SelectField
                      label="Sub Category"
                      value={subCategoryId}
                      onChange={updateSubCategory}
                      error={errors.subCategoryId}
                      options={filteredSubCategories.map((s) => ({ value: s.subCategoryId, label: s.subCategoryName }))}
                      placeholder="Optional"
                    />

                    <SelectField
                      label="Brand"
                      value={brandId}
                      onChange={updateBrand}
                      error={errors.brandId}
                      options={brands.map((b) => ({ value: b.brandId, label: b.brandName }))}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <ReadOnlyField label="Category" value={getCategoryName(categoryId)} />
                    <ReadOnlyField label="Sub Category" value={getSubCategoryName(subCategoryId)} />
                    <ReadOnlyField label="Brand" value={getBrandName(brandId)} />
                  </div>
                )}

                {/* WAREHOUSE */}
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Warehouse"
                      value={warehouseId}
                      onChange={(v) => setWarehouseId(v)}
                      error={undefined}
                      options={warehouses.map((w) => ({
                        value: w.warehouseId,
                        label: `${w.warehouseName}${w.city ? ` • ${w.city}` : ""}`,
                      }))}
                    />
                    <Field
                      label="Stock Quantity"
                      value={stockQuantity}
                      editing
                      onChange={(v) => setStockQuantity(v.replace(/\D/g, ""))}
                      type="number"
                      error={undefined}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ReadOnlyField
                      label="Warehouse"
                      value={warehouses.find((w) => w.warehouseId === warehouseId)?.warehouseName || "Not assigned"}
                    />
                    <ReadOnlyField label="Stock Quantity" value={stockQuantity || "0"} />
                  </div>
                )}

                {/* PRICE / MRP / DISCOUNT / MOQ */}
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <Field
                      label="Price"
                      value={price}
                      editing
                      onChange={updatePrice}
                      type="number"
                      prefix="₹"
                      error={errors.price}
                      min="0.01"
                      step="0.01"
                    />
                    <Field
                      label="MRP"
                      value={mrp}
                      editing
                      onChange={updateMrp}
                      type="number"
                      prefix="₹"
                      error={errors.mrp}
                      min="0.01"
                      step="0.01"
                    />
                    <Field
                      label="Discount (%)"
                      value={discount}
                      editing
                      onChange={updateDiscount}
                      type="number"
                      error={errors.discount}
                      min="0"
                      step="0.01"
                    />
                    <Field
                      label="MOQ"
                      value={moq}
                      editing
                      onChange={updateMoq}
                      type="number"
                      error={errors.moq}
                      min="1"
                      step="1"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <ReadOnlyField label="Price" value={`₹${Number(price).toLocaleString("en-IN")}`} />
                    <ReadOnlyField label="MRP" value={`₹${Number(mrp).toLocaleString("en-IN")}`} />
                    <ReadOnlyField label="Discount" value={discount ? `${discount}%` : "0%"} />
                    <ReadOnlyField label="MOQ" value={moq || "1"} />
                  </div>
                )}

                {/* DESCRIPTION */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">Description</label>
                  {isEditing ? (
                    <>
                      <textarea
                        value={description}
                        onChange={(event) => updateDescription(event.target.value)}
                        rows={6}
                        maxLength={500}
                        aria-invalid={Boolean(errors.description)}
                        placeholder="Enter product description..."
                        className="w-full resize-none rounded-lg border border-[#DCE2EA] px-3 py-3 text-[11px] leading-5 text-[#33415A] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10"
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-[8px] font-medium text-[#D85A5A]">{errors.description || ""}</p>
                        <p className="text-[8px] text-[#9AA5B4]">{description.length}/500</p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg bg-[#F8FAFC] px-3 py-3">
                      <p className="text-[11px] leading-5 text-[#647287]">
                        {description || "No description available."}
                      </p>
                    </div>
                  )}
                </div>

                {/* SPECIFICATION */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">Specification</label>
                  {isEditing ? (
                    <textarea
                      value={specification}
                      onChange={(event) => setSpecification(event.target.value)}
                      rows={4}
                      placeholder="Enter product specifications (e.g. Weight: 5kg, Dimensions: 10x10x10, Shelf Life: 12 months...)"
                      className="w-full resize-none rounded-lg border border-[#DCE2EA] px-3 py-3 text-[11px] leading-5 text-[#33415A] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10"
                    />
                  ) : (
                    <div className="rounded-lg bg-[#F8FAFC] px-3 py-3">
                      <p className="text-[11px] leading-5 whitespace-pre-line text-[#647287]">
                        {specification || "No specification available."}
                      </p>
                    </div>
                  )}
                </div>

                {/* ORGANIC & GST FREE */}
                {isEditing && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">Organic</label>
                      <div className="flex gap-4">
                        <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                          <input
                            type="radio"
                            checked={isOrganic === true}
                            onChange={() => setIsOrganic(true)}
                            className="h-4 w-4 accent-[#1769F5]"
                          />
                          Yes
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                          <input
                            type="radio"
                            checked={isOrganic === false}
                            onChange={() => setIsOrganic(false)}
                            className="h-4 w-4 accent-[#1769F5]"
                          />
                          No
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">GST Free</label>
                      <div className="flex gap-4">
                        <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                          <input
                            type="radio"
                            checked={isGstFree === true}
                            onChange={() => setIsGstFree(true)}
                            className="h-4 w-4 accent-[#1769F5]"
                          />
                          Yes
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                          <input
                            type="radio"
                            checked={isGstFree === false}
                            onChange={() => setIsGstFree(false)}
                            className="h-4 w-4 accent-[#1769F5]"
                          />
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT SIDE */}
            <div className="space-y-5">
              {/* STATUS */}
              <section className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">
                <h2 className="text-[13px] font-bold text-[#263650]">Product Status</h2>
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => setStatus("active")}
                    className={`flex w-full items-center rounded-lg border p-3 text-left ${
                      status === "active"
                        ? "border-[#BCE4CD] bg-[#F0FBF4]"
                        : "border-[#E5E9EF] bg-white"
                    } ${isEditing ? "cursor-pointer hover:bg-[#F7FCF9]" : "cursor-default"}`}
                  >
                    <CheckCircle2 size={17} className={status === "active" ? "text-[#249357]" : "text-[#AAB4C1]"} />
                    <div className="ml-2">
                      <p className="text-[10px] font-semibold text-[#44546B]">Active</p>
                      <p className="mt-0.5 text-[8px] text-[#8995A5]">Product is available.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => setStatus("inactive")}
                    className={`flex w-full items-center rounded-lg border p-3 text-left ${
                      status === "inactive"
                        ? "border-[#F0CACA] bg-[#FFF5F5]"
                        : "border-[#E5E9EF] bg-white"
                    } ${isEditing ? "cursor-pointer hover:bg-[#FFF9F9]" : "cursor-default"}`}
                  >
                    <AlertCircle size={17} className={status === "inactive" ? "text-[#D85A5A]" : "text-[#AAB4C1]"} />
                    <div className="ml-2">
                      <p className="text-[10px] font-semibold text-[#44546B]">Inactive</p>
                      <p className="mt-0.5 text-[8px] text-[#8995A5]">Product is hidden.</p>
                    </div>
                  </button>
                </div>
              </section>

              {/* ORGANIC / GST FREE (Read-only) */}
              {!isEditing && (
                <section className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">
                  <h2 className="text-[13px] font-bold text-[#263650]">Product Tags</h2>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-3 py-2">
                      <span className="text-[9px] text-[#8995A5]">Organic</span>
                      <span className={`text-[10px] font-semibold ${isOrganic ? "text-[#249357]" : "text-[#8995A5]"}`}>
                        {isOrganic ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-3 py-2">
                      <span className="text-[9px] text-[#8995A5]">GST Free</span>
                      <span className={`text-[10px] font-semibold ${isGstFree ? "text-[#249357]" : "text-[#8995A5]"}`}>
                        {isGstFree ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* EDIT ACTIONS */}
          {isEditing && (
            <section className="mt-5 flex flex-col-reverse gap-2 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="h-10 rounded-lg border border-[#DCE2EA] px-5 text-[10px] font-semibold text-[#647287] hover:bg-[#F7F9FC]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={submitting || !productName.trim() || !sku.trim() || !categoryId || !brandId || !warehouseId || stockQuantity.trim() === "" || !price || !mrp}
                className="flex h-10 items-center justify-center rounded-lg bg-[#1769F5] px-6 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={15} className="mr-2" />
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </section>
          )}
        </div>

        {/* SUCCESS TOAST */}
        {saved && (
          <div className="fixed bottom-5 right-5 z-[100] flex items-center rounded-xl bg-[#173B7A] px-5 py-3 text-white shadow-xl">
            <CheckCircle2 size={17} className="mr-2 text-[#69D393]" />
            <div>
              <p className="text-[10px] font-bold">Product updated successfully</p>
              <p className="mt-0.5 text-[8px] text-[#C8D4E7]">Changes have been saved.</p>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {showDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
            <div className="absolute inset-0" onClick={() => setShowDelete(false)} />
            <div className="relative w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D85A5A]">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-[#263650]">Delete Product?</h2>
                  <p className="mt-1 text-[10px] leading-5 text-[#7B8798]">
                    Are you sure you want to delete <span className="font-semibold text-[#52627A]">{product.productName}</span>?
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDelete(false)}
                  className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287] hover:bg-[#F7F9FC]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-9 rounded-lg bg-[#DC4B4B] px-4 text-[10px] font-semibold text-white hover:bg-[#C83E3E]"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </AdminLayout>
  );
}

/* ============================================================
   SUMMARY ITEM
============================================================ */

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center">
      <Icon size={14} className="mr-2 text-[#1769F5]" />
      <div>
        <p className="text-[7px] uppercase tracking-wide text-[#9AA5B4]">{label}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-[#52627A]">{value}</p>
      </div>
    </div>
  );
}

/* ============================================================
   FIELD============================================================ */

function Field({
  label,
  value,
  editing,
  onChange,
  type = "text",
  prefix,
  mono = false,
  error,
  min,
  step,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  type?: string;
  prefix?: string;
  mono?: boolean;
  error?: string;
  min?: string;
  step?: string;
}) {
  if (!editing) {
    return <ReadOnlyField label={label} value={value} mono={mono} />;
  }

  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
        {label} <span className="text-[#D85A5A]">*</span>
      </label>
      <div className="flex h-10 items-center rounded-lg border border-[#DCE2EA] focus-within:border-[#1769F5] focus-within:ring-2 focus-within:ring-[#1769F5]/10">
        {prefix && <span className="pl-3 text-[11px] text-[#7A8799]">{prefix}</span>}
        <input
          type={type}
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className={`h-full w-full bg-transparent px-3 text-[11px] text-[#33415A] outline-none ${mono ? "font-mono" : ""}`}
        />
      </div>
      {error && <p className="mt-1 text-[8px] font-medium text-[#D85A5A]">{error}</p>}
    </div>
  );
}

/* ============================================================
   READ ONLY FIELD
============================================================ */

function ReadOnlyField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold text-[#52627A]">{label}</p>
      <div className={`flex min-h-10 items-center rounded-lg bg-[#F8FAFC] px-3 text-[11px] text-[#52627A] ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   SELECT FIELD
============================================================ */

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
        {label} <span className="text-[#D85A5A]">*</span>
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-[11px] text-[#52627A] outline-none focus:ring-2 focus:ring-[#1769F5]/10 ${
          error ? "border-[#D85A5A] focus:border-[#D85A5A]" : "border-[#DCE2EA] focus:border-[#1769F5]"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-[8px] font-medium text-[#D85A5A]">{error}</p>}
    </div>
  );
}