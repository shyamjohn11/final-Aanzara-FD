// File: src/app/admin/products/create/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import { api, extractErrorMessage } from "@/app/api/api";

import {
  ArrowLeft,
  Package,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
} from "lucide-react";

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
  "productName" | "sku" | "categoryId" | "subCategoryId" | "brandId" | "price" | "mrp" | "discount" | "moq" | "description" | "image",
  string
>>;

export default function CreateProductPage() {
  const router = useRouter();

  /* =====================================================
     STATE
  ====================================================== */

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

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
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [errors, setErrors] = useState<ProductErrors>({});
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  /* =====================================================
     FETCH DATA
  ====================================================== */

  const fetchCategories = async () => {
    try {
      const response = await api.get<{ items: Category[] }>("/api/v1/categories");
      setCategories(response.data.items || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await api.get<{ items: SubCategory[] }>("/api/v1/subcategories");
      setSubCategories(response.data.items || []);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.get<{ items: Brand[] }>("/api/admin/brands");
      setBrands(response.data.items || []);
    } catch (err) {
      console.error("Error fetching brands:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
    fetchBrands();
  }, []);

  /* =====================================================
     CLEAR ERROR
  ====================================================== */

  const clearError = (field: keyof ProductErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  /* =====================================================
     VALIDATE
  ====================================================== */

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

  /* =====================================================
     UPDATE HANDLERS
  ====================================================== */

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
    setSubCategoryId(""); // Reset subcategory when category changes
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
    setDescription(value.slice(0, 500));
    clearError("description");
  };

  /* =====================================================
     CREATE PRODUCT
  ====================================================== */

  const handleCreate = async () => {
    if (!validateProduct()) {
      return;
    }

    setSubmitting(true);
    setApiError("");

    try {
      const payload = {
        categoryId,
        subCategoryId: subCategoryId || null,
        brandId,
        productName: productName.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim(),
        price: Number(price),
        mrp: Number(mrp),
        discount: discount ? Number(discount) : 0,
        moq: moq ? Number(moq) : 1,
        isOrganic,
        isGstFree,
        status: "active",
      };

      await api.post("/api/v1/products", payload);

      setSaved(true);

      setTimeout(() => {
        router.push("/admin/products");
      }, 1200);
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to create product.");
      setApiError(message);
      console.error("Error creating product:", err);
      setSubmitting(false);
    }
  };

  /* =====================================================
     IMAGE HANDLER
  ====================================================== */

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        image: "Only PNG, JPG/JPEG or WEBP images are allowed.",
      }));
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        image: "Image size must be 5 MB or less.",
      }));
      event.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    setImage(url);
    clearError("image");
  };

  const removeImage = () => {
    if (image) URL.revokeObjectURL(image);
    setImage(null);
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
            <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">Create Product</h1>
            <p className="hidden text-[9px] text-[#8995A5] sm:block">Add a new product to your catalogue</p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            aria-label="Close"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#718096] transition hover:bg-[#F1F4F8]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 lg:px-8">
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
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="hover:text-[#1769F5]"
            >
              Products
            </button>
            <span>/</span>
            <span className="font-medium text-[#566579]">Create</span>
          </div>

          {/* API ERROR */}
          {apiError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[11px] text-red-600">{apiError}</p>
            </div>
          )}

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
            {/* LEFT FORM */}
            <section className="rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
              <div className="border-b border-[#EDF0F4] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                    <Package size={19} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-[#263650]">Product Information</h2>
                    <p className="mt-1 text-[9px] text-[#8995A5]">Enter the basic details of your product.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5">
                {Object.keys(errors).length > 0 && (
                  <div role="alert" className="rounded-xl border border-[#F0D4D4] bg-[#FFF7F7] px-4 py-3">
                    <p className="text-[9px] font-bold text-[#B84A4A]">Please fix the highlighted fields before creating the product.</p>
                  </div>
                )}

                {/* PRODUCT NAME */}
                <div>
                  <label htmlFor="product-name" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Product Name <span className="ml-1 text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    value={productName}
                    onChange={(event) => updateProductName(event.target.value)}
                    placeholder="Example: Aashirvaad Atta 5kg"
                    aria-invalid={Boolean(errors.productName)}
                    className={`h-10 w-full rounded-lg border px-3 text-[11px] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                      errors.productName ? "border-[#EF4444]" : "border-[#DCE2EA]"
                    }`}
                  />
                  {errors.productName && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{errors.productName}</p>}
                </div>

                {/* SKU */}
                <div>
                  <label htmlFor="product-sku" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    SKU <span className="ml-1 text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="product-sku"
                    type="text"
                    value={sku}
                    onChange={(event) => updateSku(event.target.value)}
                    placeholder="Example: AAS-ATT-005"
                    aria-invalid={Boolean(errors.sku)}
                    className={`h-10 w-full rounded-lg border px-3 font-mono text-[11px] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                      errors.sku ? "border-[#EF4444]" : "border-[#DCE2EA]"
                    }`}
                  />
                  {errors.sku && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{errors.sku}</p>}
                </div>

                {/* CATEGORY / SUB CATEGORY / BRAND */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="category" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      Category <span className="ml-1 text-[#EF4444]">*</span>
                    </label>
                    <select
                      id="category"
                      value={categoryId}
                      onChange={(event) => updateCategory(event.target.value)}
                      aria-invalid={Boolean(errors.categoryId)}
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-[11px] text-[#52627A] outline-none focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                        errors.categoryId ? "border-[#EF4444]" : "border-[#DCE2EA]"
                      }`}
                    >
                      <option value="">Select Category</option>
                      {categories.map((item) => (
                        <option key={item.categoryId} value={item.categoryId}>
                          {item.categoryName}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{errors.categoryId}</p>}
                  </div>

                  <div>
                    <label htmlFor="subCategory" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      Sub Category
                    </label>
                    <select
                      id="subCategory"
                      value={subCategoryId}
                      onChange={(event) => updateSubCategory(event.target.value)}
                      aria-invalid={Boolean(errors.subCategoryId)}
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-[11px] text-[#52627A] outline-none focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                        errors.subCategoryId ? "border-[#EF4444]" : "border-[#DCE2EA]"
                      }`}
                    >
                      <option value="">Optional</option>
                      {filteredSubCategories.map((item) => (
                        <option key={item.subCategoryId} value={item.subCategoryId}>
                          {item.subCategoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="brand" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      Brand <span className="ml-1 text-[#EF4444]">*</span>
                    </label>
                    <select
                      id="brand"
                      value={brandId}
                      onChange={(event) => updateBrand(event.target.value)}
                      aria-invalid={Boolean(errors.brandId)}
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-[11px] text-[#52627A] outline-none focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                        errors.brandId ? "border-[#EF4444]" : "border-[#DCE2EA]"
                      }`}
                    >
                      <option value="">Select Brand</option>
                      {brands.map((item) => (
                        <option key={item.brandId} value={item.brandId}>
                          {item.brandName}
                        </option>
                      ))}
                    </select>
                    {errors.brandId && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{errors.brandId}</p>}
                  </div>
                </div>

                {/* PRICE / MRP / DISCOUNT / MOQ */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <label htmlFor="price" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      Price <span className="ml-1 text-[#EF4444]">*</span>
                    </label>
                    <div className={`flex h-10 items-center rounded-lg border px-3 focus-within:border-[#1769F5] ${
                      errors.price ? "border-[#EF4444]" : "border-[#DCE2EA]"
                    }`}>
                      <span className="mr-2 text-[11px] text-[#7A8799]">₹</span>
                      <input
                        id="price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={price}
                        aria-invalid={Boolean(errors.price)}
                        onChange={(event) => updatePrice(event.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-[11px] outline-none"
                      />
                    </div>
                    {errors.price && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{errors.price}</p>}
                  </div>

                  <div>
                    <label htmlFor="mrp" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      MRP <span className="ml-1 text-[#EF4444]">*</span>
                    </label>
                    <div className={`flex h-10 items-center rounded-lg border px-3 focus-within:border-[#1769F5] ${
                      errors.mrp ? "border-[#EF4444]" : "border-[#DCE2EA]"
                    }`}>
                      <span className="mr-2 text-[11px] text-[#7A8799]">₹</span>
                      <input
                        id="mrp"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={mrp}
                        aria-invalid={Boolean(errors.mrp)}
                        onChange={(event) => updateMrp(event.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-[11px] outline-none"
                      />
                    </div>
                    {errors.mrp && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{errors.mrp}</p>}
                  </div>

                  <div>
                    <label htmlFor="discount" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      Discount (%)
                    </label>
                    <input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discount}
                      onChange={(event) => updateDiscount(event.target.value)}
                      placeholder="0"
                      className={`h-10 w-full rounded-lg border px-3 text-[11px] outline-none focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                        errors.discount ? "border-[#EF4444]" : "border-[#DCE2EA]"
                      }`}
                    />
                    {errors.discount && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{errors.discount}</p>}
                  </div>

                  <div>
                    <label htmlFor="moq" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      MOQ
                    </label>
                    <input
                      id="moq"
                      type="number"
                      min="1"
                      step="1"
                      value={moq}
                      onChange={(event) => updateMoq(event.target.value)}
                      placeholder="1"
                      className={`h-10 w-full rounded-lg border px-3 text-[11px] outline-none focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                        errors.moq ? "border-[#EF4444]" : "border-[#DCE2EA]"
                      }`}
                    />
                    {errors.moq && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{errors.moq}</p>}
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label htmlFor="description" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) => updateDescription(event.target.value)}
                    placeholder="Enter product description..."
                    rows={5}
                    className="w-full resize-none rounded-lg border border-[#DCE2EA] px-3 py-3 text-[11px] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[8px] font-medium text-[#EF4444]">{errors.description || ""}</p>
                    <p className="text-[8px] text-[#9AA5B4]">{description.length}/500</p>
                  </div>
                </div>

                {/* ORGANIC & GST FREE */}
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
              </div>
            </section>

            {/* RIGHT SIDE */}
            <div className="space-y-5">
              {/* PRODUCT IMAGE */}
              <section className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">
                <h2 className="text-[13px] font-bold text-[#263650]">Product Image</h2>
                <p className="mt-1 text-[9px] text-[#8995A5]">PNG, JPG or WEBP. Maximum 5MB.</p>

                <label
                  htmlFor="product-image"
                  className="mt-4 flex h-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#DCE2EA] bg-[#FAFBFD] hover:border-[#8BADEB]"
                >
                  {image ? (
                    <img src={image} alt="Product preview" className="h-full w-full object-contain p-4" />
                  ) : (
                    <div className="text-center">
                      <ImagePlus size={24} className="mx-auto text-[#8090A6]" />
                      <p className="mt-2 text-[9px] font-semibold text-[#66748B]">Upload Product Image</p>
                      <p className="mt-1 text-[8px] text-[#9AA5B4]">PNG, JPG or WEBP</p>
                    </div>
                  )}
                  <input
                    id="product-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {errors.image && <p className="mt-2 text-[8px] font-medium text-[#EF4444]">{errors.image}</p>}

                {image && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="mt-2 text-[9px] font-semibold text-[#DC4B4B] hover:underline"
                  >
                    Remove Image
                  </button>
                )}
              </section>

              {/* STATUS */}
              <section className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">
                <h2 className="text-[13px] font-bold text-[#263650]">Product Status</h2>
                <div className="mt-3 flex items-center rounded-lg bg-[#EAF8F0] px-3 py-3">
                  <CheckCircle2 size={17} className="mr-2 text-[#249357]" />
                  <div>
                    <p className="text-[10px] font-semibold text-[#249357]">Active</p>
                    <p className="mt-0.5 text-[8px] text-[#5D806D]">Product will be visible after creation.</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* ACTION BAR */}
          <section className="mt-5 flex flex-col-reverse gap-2 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="h-10 rounded-lg border border-[#DCE2EA] px-5 text-[10px] font-semibold text-[#647287] transition hover:bg-[#F7F9FC]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting || !productName.trim() || !sku.trim() || !categoryId || !brandId || !price || !mrp}
              className="flex h-10 items-center justify-center rounded-lg bg-[#1769F5] px-6 text-[10px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={15} className="mr-2" />
              {submitting ? "Creating..." : "Create Product"}
            </button>
          </section>

          {/* SUCCESS MESSAGE */}
          {saved && (
            <div className="fixed bottom-5 right-5 z-[100] flex items-center rounded-xl bg-[#173B7A] px-5 py-3 text-white shadow-xl">
              <CheckCircle2 size={17} className="mr-2 text-[#69D393]" />
              <div>
                <p className="text-[10px] font-bold">Product created successfully</p>
                <p className="mt-0.5 text-[8px] text-[#C8D4E7]">Redirecting to products...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </AdminLayout>
  );
}