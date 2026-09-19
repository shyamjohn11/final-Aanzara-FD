// File: src/app/admin/products/page.tsx
"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { extractErrorMessage } from "@/app/api/api";
import {
  brandsApi,
  categoriesApi,
  productImagesApi,
  productsApi,
  subcategoriesApi,
} from "@/app/api/services";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Eye,
  Package,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Upload,
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
  categoryName?: string;
  subCategoryName?: string;
  brandName?: string;
  imageUrl?: string;
};

type ProductApiResponse = {
  items: Product[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
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

type ServerProductImage = {
  imageId: string;
  imageUrl: string;
  isPrimary: boolean;
};

type ProductErrors = Partial<Record<
  "productName" | "sku" | "categoryId" | "subCategoryId" | "brandId" | "price" | "mrp" | "discount" | "moq" | "image",
  string
>>;

type SortBy = "productName" | "price" | "newest" | "oldest" | "";

const SEARCH_DEBOUNCE_MS = 400;

/* ============================================================
   IMAGE ENRICHMENT HELPER
   Parses a productImagesApi.list() response into a flat array,
   used both to fill in a missing product.imageUrl on the list
   page and to populate the edit-modal image manager.
============================================================ */

function parseImageListPayload(payload: unknown): ServerProductImage[] {
  const rawItems: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as Record<string, unknown>)?.items)
      ? ((payload as Record<string, unknown>).items as unknown[])
      : Array.isArray((payload as Record<string, unknown>)?.data)
        ? ((payload as Record<string, unknown>).data as unknown[])
        : [];

  const mapped: ServerProductImage[] = [];
  rawItems.forEach((entry) => {
    if (typeof entry !== "object" || entry === null) return;
    const raw = entry as Record<string, unknown>;
    const imageId = String(raw.imageId ?? raw.id ?? "");
    const imageUrl = String(raw.imageUrl ?? raw.url ?? raw.filePath ?? "");
    if (!imageId || !imageUrl) return;
    mapped.push({
      imageId,
      imageUrl,
      isPrimary: Boolean(raw.isPrimary ?? raw.is_primary ?? false),
    });
  });
  return mapped;
}

/* ============================================================
   THUMBNAIL — used in both the desktop table and mobile cards.
   Falls back to the generic package icon on missing/broken URLs.
============================================================ */

function ProductThumb({ src, onClick }: { src?: string; onClick?: () => void }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
        <Package size={18} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="View image"
      className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#EDF0F4] transition hover:opacity-80"
    >
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </button>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ProductsAdminPage() {
  const router = useRouter();

  /* ==========================================================
     STATE
  ========================================================== */

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "active" | "inactive">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  /* ==========================================================
     MODAL STATE
  ========================================================== */

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ==========================================================
     IMAGE PREVIEW LIGHTBOX
  ========================================================== */

  const [previewImage, setPreviewImage] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);

  // Two-step open/close so the fade/scale transition can play before
  // the lightbox unmounts (matches the 200ms duration in its classes).
  const openPreview = (src?: string) => {
    if (!src) return;
    setPreviewImage(src);
    requestAnimationFrame(() => setPreviewVisible(true));
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setTimeout(() => setPreviewImage(""), 200);
  };

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
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState<ServerProductImage[]>(
    []
  );

  // Shown in the main preview box while editing, before any new file is
  // picked — the primary uploaded image if one exists, else the first.
  const currentPrimaryImageUrl =
    existingImages.find((img) => img.isPrimary)?.imageUrl ??
    existingImages[0]?.imageUrl ??
    "";

  const [errors, setErrors] = useState<ProductErrors>({});
  const [formError, setFormError] = useState("");

/* ==========================================================
      FETCH DATA
   ========================================================== */

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortDescending, setSortDescending] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>("");
  // Background refresh indicator (table keeps old rows; no full spinner).
  const [isFetching, setIsFetching] = useState(false);
  // Debounced search text actually sent to the API.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Monotonic id: only the latest request may write state (kills races).
  const requestIdRef = useRef(0);
  // True after the first successful load; distinguishes initial
  // full-page spinner from silent background refreshes.
  const hasLoadedRef = useRef(false);

  // Debounce keystrokes so typing does not fire a request per character.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Stable across renders: depending on it cannot cause a fetch loop.
  const fetchProducts = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isInitial = !hasLoadedRef.current;
    if (isInitial) {
      setLoading(true);
    } else {
      setIsFetching(true);
    }
    setError("");
    try {
      // GET /api/v1/products?page=&pageSize=&search=&categoryId=&status=&sortBy=&sortDescending=
      const response = await productsApi.list({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        categoryId: categoryFilter !== "All" ? categoryFilter : undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        sortBy: sortBy || undefined,
        sortDescending,
      });
      // A newer request has started; drop this stale response.
      if (requestIdRef.current !== requestId) return;
      const data = response.data as ProductApiResponse;
      setProducts(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
      hasLoadedRef.current = true;
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      const message = extractErrorMessage(err, "Failed to load products.");
      setError(message);
      console.error("Error fetching products:", err);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [page, pageSize, debouncedSearch, categoryFilter, statusFilter, sortBy, sortDescending]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.list();
      setCategories(
        (response.data as { items: Category[] })?.items || []
      );
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  const fetchSubCategories = useCallback(async () => {
    try {
      const response = await subcategoriesApi.list();
      setSubCategories(
        (response.data as { items: SubCategory[] })?.items || []
      );
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await brandsApi.list();
      setBrands((response.data as { items: Brand[] })?.items || []);
    } catch (err) {
      console.error("Error fetching brands:", err);
    }
  }, []);

  // Reference data loads once on mount.
  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
    fetchBrands();
  }, [fetchCategories, fetchSubCategories, fetchBrands]);

  // Product list reloads only when a real input changes.
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ==========================================================
     FILTER PRODUCTS
  ========================================================== */

  const filteredProducts = useMemo(() => {
    // Backend already applies filters via query params (search, categoryId, status, sort)
    // So products from API are already filtered; return as-is
    return products;
  }, [products]);

  /* ==========================================================
     STATS
  ========================================================== */

  const activeProducts = products.filter((p) => p.status === "active").length;
  const inactiveProducts = products.filter((p) => p.status === "inactive").length;
  const lowStockProducts = products.filter((p) => p.moq > 0 && p.moq <= 10).length;
  const totalStock = products.reduce((total, p) => total + (p.moq || 0), 0);

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
     RESET FORM
  ========================================================== */

  const resetForm = () => {
    setProductName("");
    setSku("");
    setCategoryId("");
    setSubCategoryId("");
    setBrandId("");
    setPrice("");
    setMrp("");
    setDiscount("");
    setMoq("");
    setIsOrganic(false);
    setIsGstFree(false);
    if (image) URL.revokeObjectURL(image);
    setImage("");
    setImageFile(null);
    setExistingImages([]);
    setEditingProduct(null);
    setErrors({});
    setFormError("");
  };

  /* ==========================================================
     OPEN ADD MODAL
  ========================================================== */

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  /* ==========================================================
     OPEN EDIT MODAL
  ========================================================== */

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
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
    if (image) URL.revokeObjectURL(image);
    setImage("");
    setImageFile(null);
    setExistingImages([]);
    setErrors({});
    setFormError("");
    setShowModal(true);
    // B1 existing images for the manager strip (best-effort).
    loadExistingImages(product.productId);
  };

  /* ==========================================================
     PRODUCT IMAGES (B1)
  ========================================================== */

  const loadExistingImages = async (productId: string) => {
    if (!productId) return;
    try {
      const response = await productImagesApi.list(productId);
      setExistingImages(parseImageListPayload(response.data));
    } catch (error) {
      console.error("Unable to load product images:", error);
    }
  };

  const setPrimaryImage = async (imageId: string) => {
    if (!editingProduct || !imageId) return;
    try {
      await productImagesApi.setPrimary(
        editingProduct.productId,
        imageId
      );
      await loadExistingImages(editingProduct.productId);
    } catch (error) {
      console.error("Set primary image failed:", error);
      setFormError(
        extractErrorMessage(error, "Failed to set primary image.")
      );
    }
  };

  const deleteExistingImage = async (imageId: string) => {
    if (!editingProduct || !imageId) return;
    try {
      await productImagesApi.remove(
        editingProduct.productId,
        imageId
      );
      await loadExistingImages(editingProduct.productId);
    } catch (error) {
      console.error("Delete image failed:", error);
      setFormError(
        extractErrorMessage(error, "Failed to delete image.")
      );
    }
  };

  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setSubmitting(false);
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

    if (
      subCategoryId &&
      categoryId &&
      filteredSubCategories.length > 0 &&
      !filteredSubCategories.some((s) => s.subCategoryId === subCategoryId)
    ) {
      next.subCategoryId = "Sub category does not belong to the selected category.";
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

    if (moq && (isNaN(Number(moq)) || Number(moq) < 0)) {
      next.moq = "MOQ must be a positive number.";
    }

    setErrors(next);

    if (Object.keys(next).length > 0) {
      const summary = "Please correct the highlighted fields before saving.";
      setFormError(summary);
      toast.error(summary);
      return false;
    }

    setFormError("");
    return true;
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
    setSubCategoryId("");
    clearError("categoryId");
    clearError("subCategoryId");
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

  /* ==========================================================
     SAVE PRODUCT
  ========================================================== */

  const saveProduct = async () => {
    if (!validateProduct()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        categoryId,
        subCategoryId: subCategoryId || null,
        brandId,
        productName: productName.trim(),
        sku: sku.trim().toUpperCase(),
        description: "",
        price: Number(price),
        mrp: Number(mrp),
        discount: discount ? Number(discount) : 0,
        moq: moq ? Number(moq) : 1,
        isOrganic,
        isGstFree,
        status: "active",
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.productId, payload);

        // B1 upload pending image (first image auto-primary server-side).
        if (imageFile) {
          try {
            await productImagesApi.upload(
              editingProduct.productId,
              imageFile,
              existingImages.length === 0
            );
          } catch (uploadError) {
            console.error("Product image upload failed:", uploadError);
            setFormError(
              "Product saved, but image upload failed. " +
                extractErrorMessage(
                  uploadError,
                  "Please try uploading the image again."
                )
            );
            setSubmitting(false);
            return;
          }
        }
      } else {
        const createResponse = await productsApi.create(payload);
        const created = (createResponse.data ?? {}) as Record<
          string,
          unknown
        >;
        const newProductId = String(
          created.productId ?? created.id ?? ""
        );

        // B1 upload pending image as primary for the new product.
        if (imageFile && newProductId) {
          try {
            await productImagesApi.upload(newProductId, imageFile, true);
          } catch (uploadError) {
            console.error("Product image upload failed:", uploadError);
            // Keep the modal open on the now-existing product so the
            // user can retry the upload with Save.
            setEditingProduct({
              productId: newProductId,
              sku: sku.trim().toUpperCase(),
              productName: productName.trim(),
              categoryId,
              subCategoryId,
              brandId,
              price: Number(price),
              mrp: Number(mrp),
              discount: discount ? Number(discount) : 0,
              moq: moq ? Number(moq) : 1,
              isOrganic,
              isGstFree,
              status: "active",
            });
            setFormError(
              "Product created, but image upload failed. " +
                extractErrorMessage(
                  uploadError,
                  "Press Save to retry the upload."
                )
            );
            setSubmitting(false);
            fetchProducts();
            return;
          }
        }
      }

      const wasEditing = Boolean(editingProduct);
      closeModal();
      toast.success(
        wasEditing ? "Product updated successfully." : "Product created successfully."
      );
      fetchProducts();
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to save product.");
      setFormError(message);
      toast.error(message);
      console.error("Error saving product:", err);
      setSubmitting(false);
    }
  };

  /* ==========================================================
     TOGGLE STATUS
  ========================================================== */

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const product = products.find((p) => p.productId === id);
      if (!product) return;

      const payload = {
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId || null,
        brandId: product.brandId,
        productName: product.productName,
        sku: product.sku,
        description: "",
        price: product.price,
        mrp: product.mrp,
        discount: product.discount || 0,
        moq: product.moq || 1,
        isOrganic: product.isOrganic || false,
        isGstFree: product.isGstFree || false,
        status: currentStatus === "active" ? "inactive" : "active",
      };

      await productsApi.update(id, payload);
      toast.success("Product status updated.");
      fetchProducts();
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to update product status.");
      toast.error(message);
      console.error("Error toggling status:", err);
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const confirmDelete = async () => {
    if (deleteId === null) {
      return;
    }

    try {
      await productsApi.remove(deleteId);
      setDeleteId(null);
      toast.success("Product deleted successfully.");
      fetchProducts();
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to delete product.");
      toast.error(message);
      console.error("Error deleting product:", err);
      setDeleteId(null);
    }
  };

  /* ==========================================================
     IMAGE HANDLER
  ========================================================== */

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
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setImageFile(file);
    clearError("image");
  };

  const removeImage = () => {
    if (image) URL.revokeObjectURL(image);
    setImage("");
    setImageFile(null);
  };

  const getCategoryName = (id: string) => {
    const cat = categories.find((c) => c.categoryId === id);
    return cat?.categoryName || "Unknown";
  };

  const getBrandName = (id: string) => {
    const b = brands.find((b) => b.brandId === id);
    return b?.brandName || "Unknown";
  };

  const getSubCategoryName = (id: string) => {
    if (!id) return "None";
    const sub = subCategories.find((s) => s.subCategoryId === id);
    return sub?.subCategoryName || "Unknown";
  };

  // Sub categories belonging to the selected category.
  const filteredSubCategories = useMemo(() => {
    if (!categoryId) return [];
    return subCategories.filter((s) => s.categoryId === categoryId);
  }, [subCategories, categoryId]);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

        {/* HEADER */}
        <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-[#E4E8EF] bg-white px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            aria-label="Back to admin"
            className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] transition hover:bg-[#F1F4F8] hover:text-[#173B7A]"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">Products</h1>
            <p className="hidden text-[9px] text-[#8995A5] sm:block">Manage products and inventory</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/products/bulk-import")}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#DFE5ED] bg-white px-3 text-[11px] font-semibold text-[#33415A] transition hover:border-[#8AA9DE] hover:text-[#173B7A] sm:px-4"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Import / Export</span>
              <span className="sm:hidden">Excel</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[11px] font-semibold text-white transition hover:bg-[#0F5BDE] sm:px-4"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* MAIN */}
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {/* BREADCRUMB */}
          <div className="mb-5 flex items-center gap-2 text-[9px] text-[#8A96A7]">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="hover:text-[#1769F5]"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="font-medium text-[#566579]">Products</span>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[11px] text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchProducts}
                className="mt-2 text-[10px] font-semibold text-red-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* STATS */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatBox label="Total Products" value={products.length} icon={Package} />
            <StatBox
              label="Active"
              value={activeProducts}
              icon={Check}
              iconClass="text-[#249357]"
              bgClass="bg-[#EAF8F0]"
            />
            <StatBox
              label="Inactive"
              value={inactiveProducts}
              icon={AlertCircle}
              iconClass="text-[#D85A5A]"
              bgClass="bg-[#FFF0F0]"
            />
            <StatBox
              label="Low MOQ"
              value={lowStockProducts}
              icon={AlertCircle}
              iconClass="text-[#D58A20]"
              bgClass="bg-[#FFF5DF]"
            />
          </section>

          {/* FILTER BAR */}
          <section className="mt-6 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* SEARCH */}
              <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 lg:max-w-[420px]">
                <Search size={16} className="shrink-0 text-[#8995A5]" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search products, SKU, brand..."
                  className="h-full w-full bg-transparent px-2.5 text-[11px] text-[#263A59] outline-none placeholder:text-[#A0AAB8]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="text-[#8995A5]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* CATEGORY */}
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 text-[10px] text-[#5D6C80] outline-none focus:border-[#1769F5]"
              >
                <option value="All">All Categories</option>
                {categories.map((item) => (
                  <option key={item.categoryId} value={item.categoryId}>
                    {item.categoryName}
                  </option>
                ))}
              </select>

              {/* STATUS */}
              <div className="flex items-center gap-2 lg:ml-auto">
                <span className="text-[10px] text-[#8995A5]">Status:</span>
                <div className="flex rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] p-1">
                  {(["All", "active", "inactive"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setPage(1);
                      }}
                      className={`rounded-md px-3 py-1.5 text-[9px] font-semibold transition ${
                        statusFilter === status
                          ? "bg-[#173B7A] text-white"
                          : "text-[#65748A] hover:bg-white"
                      }`}
                    >
                      {status === "All" ? "All" : status === "active" ? "Active" : "Inactive"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 lg:ml-auto">
                <span className="text-[10px] text-[#8995A5]">Sort:</span>
                <div className="flex rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] p-1">
                  {(["name-asc", "name-desc", "price-asc", "price-desc", "newest", "oldest"] as const).map(
                    (sort) => {
                      const [field, direction] = sort.split("-");
                      const mappedField: SortBy =
                        field === "name" ? "productName" : field as SortBy;
                      const isSortBy = sortBy === mappedField;
                      const isDesc = sortDescending ? "desc" : "asc";
                      const isActive = isSortBy && isDesc === direction;
                      return (
                        <button
                          key={sort}
                          type="button"
                          onClick={() => {
                            const newDesc = mappedField === sortBy ? !sortDescending : direction === "desc";
                            setSortBy(mappedField);
                            setSortDescending(newDesc);
                            setPage(1);
                          }}
                          className={`rounded-md px-3 py-1.5 text-[9px] font-semibold transition ${isActive ? "bg-[#173B7A] text-white" : "text-[#65748A] hover:bg-white"}`}>
                          {sort}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* TABLE */}
          <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">
              <div>
                <h2 className="text-[13px] font-bold text-[#263650]">All Products</h2>
                <p className="mt-1 text-[9px] text-[#8A96A7]">
                  {loading
                    ? "Loading..."
                    : isFetching
                      ? "Updating..."
                      : `${filteredProducts.length} products found`}
                </p>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="hidden items-center gap-1.5 text-[9px] font-semibold text-[#1769F5] hover:underline sm:flex"
              >
                <Plus size={13} />
                New Product
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E4E8EF] border-t-[#1769F5]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                onClear={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setCategoryFilter("All");
                }}
                onAdd={openAddModal}
              />
            ) : (
              <>
                {/* DESKTOP */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">Product</th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">SKU</th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">Category</th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">Brand</th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">Price</th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">MOQ</th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">Status</th>
                        <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.productId} className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <ProductThumb src={product.imageUrl} onClick={() => openPreview(product.imageUrl)} />
                              <div className="min-w-0">
                                <p className="max-w-[220px] truncate text-[11px] font-bold text-[#33415A]">
                                  {product.productName}
                                </p>
                                <p className="mt-1 text-[9px] text-[#8B96A5]">
                                  ID: #{product.productId.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-md bg-[#F3F5F8] px-2 py-1 font-mono text-[9px] text-[#69778B]">
                              {product.sku}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="min-w-0">
                              <p className="text-[10px] text-[#5F6E82]">{getCategoryName(product.categoryId)}</p>
                              {product.subCategoryId ? (
                                <p className="mt-0.5 truncate text-[9px] text-[#8B96A5]">
                                  {product.subCategoryName || getSubCategoryName(product.subCategoryId)}
                                </p>
                              ) : null}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-[10px] font-semibold text-[#4B5A70]">{getBrandName(product.brandId)}</span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-[11px] font-bold text-[#33415A]">
                              ₹{product.price.toLocaleString("en-IN")}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-[10px] font-semibold text-[#3E526D]">{product.moq || 1}</span>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => toggleStatus(product.productId, product.status)}
                              className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${
                                product.status === "active"
                                  ? "bg-[#EAF8F0] text-[#249357]"
                                  : "bg-[#FFF0F0] text-[#D85A5A]"
                              }`}
                            >
                              {product.status === "active" ? "Active" : "Inactive"}
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <ActionButton
                                label="View"
                                onClick={() => router.push(`/admin/products/${product.productId}`)}
                              >
                                <Eye size={14} />
                              </ActionButton>

                              <ActionButton
                                label="Edit"
                                onClick={() => openEditModal(product)}
                              >
                                <Pencil size={14} />
                              </ActionButton>

                              <ActionButton
                                label="Delete"
                                danger
                                onClick={() => setDeleteId(product.productId)}
                              >
                                <Trash2 size={14} />
                              </ActionButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE */}
                <div className="divide-y divide-[#EDF0F4] md:hidden">
                  {filteredProducts.map((product) => (
                    <div key={product.productId} className="p-4">
                      <div className="flex items-start gap-3">
                        <ProductThumb src={product.imageUrl} onClick={() => openPreview(product.imageUrl)} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-bold text-[#33415A]">
                                {product.productName}
                              </p>
                              <p className="mt-1 font-mono text-[8px] text-[#8A96A7]">{product.sku}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleStatus(product.productId, product.status)}
                              className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-semibold ${
                                product.status === "active"
                                  ? "bg-[#EAF8F0] text-[#249357]"
                                  : "bg-[#FFF0F0] text-[#D85A5A]"
                              }`}
                            >
                              {product.status === "active" ? "Active" : "Inactive"}
                            </button>
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <InfoItem label="Category" value={getCategoryName(product.categoryId)} />
                            <InfoItem
                              label="Sub Category"
                              value={
                                product.subCategoryId
                                  ? product.subCategoryName || getSubCategoryName(product.subCategoryId)
                                  : "None"
                              }
                            />
                            <InfoItem label="Brand" value={getBrandName(product.brandId)} />
                            <InfoItem label="Price" value={`₹${product.price.toLocaleString("en-IN")}`} />
                            <InfoItem label="MOQ" value={String(product.moq || 1)} />
                          </div>

                          <div className="mt-3 flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/products/${product.productId}`)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748A] hover:bg-[#EEF3FA] hover:text-[#1769F5]"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748A] hover:bg-[#EEF3FA] hover:text-[#1769F5]"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteId(product.productId)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#D85A5A] hover:bg-[#FFF0F0]"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

{/* PAGINATION */}
                <div className="flex items-center justify-between border-t border-[#EDF0F4] px-5 py-4">
                  <p className="text-[9px] text-[#8995A5]">
                    Showing{" "}
                    <span className="font-semibold text-[#4D5C72]">{filteredProducts.length}</span>{" "}
                    of <span className="font-semibold text-[#4D5C72]">{totalCount}</span>
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      className={`flex h-7 w-7 items-center justify-center rounded-md border border-${
                        page <= 1 ? "#E1E6ED" : "#1769F5"
                      } text-${
                        page <= 1 ? "#B3BBC6" : "#173B7A"
                      } ${page <= 1 ? "disabled" : ""}`}>
                      <ChevronLeft size={14} />
                    </button>

                    {[...Array(totalPages).keys()].map((i) => (
                      <span
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`flex h-7 min-w-7 items-center justify-center rounded-md ${
                          page === i + 1
                            ? "bg-[#173B7A] px-2 text-[9px] font-semibold text-white"
                            : "bg-transparent px-2 text-[9px] text-[#65748A] hover:bg-[#EEF3FA] hover:text-[#1769F5]"
                        }`}
                      >
                        {i + 1}
                      </span>
                    ))}

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      className={`flex h-7 w-7 items-center justify-center rounded-md border border-${
                        page >= totalPages ? "#E1E6ED" : "#1769F5"
                      } text-${
                        page >= totalPages ? "#B3BBC6" : "#173B7A"
                      } ${page >= totalPages ? "disabled" : ""}`}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>

        {/* ADD / EDIT MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="absolute inset-0" onClick={closeModal} />

            <div className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-2xl">
              {/* MODAL HEADER */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">
                <div>
                  <h2 className="text-[15px] font-bold text-[#263650]">
                    {editingProduct ? "Edit Product" : "Add Product"}
                  </h2>
                  <p className="mt-1 text-[9px] text-[#8A96A7]">
                    {editingProduct ? "Update product information" : "Create a new product"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="space-y-4 p-5">
                {Object.keys(errors).length > 0 && (
                  <div role="alert" className="rounded-xl border border-[#F0D4D4] bg-[#FFF7F7] px-4 py-3">
                    <p className="text-[9px] font-bold text-[#B84A4A]">
                      Please fix the highlighted fields before saving.
                    </p>
                  </div>
                )}

                {formError && (
                  <div className="rounded-lg bg-[#FFF2F2] px-3 py-2.5">
                    <p className="text-[9px] font-medium text-[#C43E3E]">{formError}</p>
                  </div>
                )}

                {/* IMAGE */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">Product Image</label>
                  <label
                    htmlFor="product-image-modal"
                    className="flex h-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#DCE2EA] bg-[#FAFBFD] hover:border-[#8AA9DE]"
                  >
                    {image ? (
                      <img src={image} alt="Product preview" className="h-full w-full object-contain p-3" />
                    ) : currentPrimaryImageUrl ? (
                      <img
                        src={currentPrimaryImageUrl}
                        alt="Current product image"
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <div className="text-center">
                        <ImagePlus size={23} className="mx-auto text-[#8090A6]" />
                        <p className="mt-2 text-[9px] font-semibold text-[#66748B]">Upload Product Image</p>
                        <p className="mt-1 text-[8px] text-[#9AA5B4]">PNG, JPG or WEBP</p>
                      </div>
                    )}
                    <input
                      id="product-image-modal"
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
                  {editingProduct && existingImages.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[10px] font-semibold text-[#52627A]">
                        Uploaded Images (click to set primary)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {existingImages.map((existing) => (
                          <div
                            key={existing.imageId}
                            className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 ${
                              existing.isPrimary
                                ? "border-[#249357]"
                                : "border-[#DCE2EA]"
                            }`}
                          >
                            <button
                              type="button"
                              title={
                                existing.isPrimary
                                  ? "Primary image"
                                  : "Set as primary"
                              }
                              onClick={() =>
                                !existing.isPrimary &&
                                setPrimaryImage(existing.imageId)
                              }
                              className="h-full w-full"
                            >
                              <img
                                src={existing.imageUrl}
                                alt="Product"
                                className="h-full w-full object-cover"
                              />
                            </button>
                            {existing.isPrimary && (
                              <span className="absolute left-1 top-1 rounded bg-[#249357] px-1 py-0.5 text-[7px] font-bold text-white">
                                PRIMARY
                              </span>
                            )}
                            <button
                              type="button"
                              title="Delete image"
                              aria-label="Delete image"
                              onClick={() =>
                                deleteExistingImage(existing.imageId)
                              }
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] font-bold text-[#DC4B4B] shadow hover:bg-[#DC4B4B] hover:text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* PRODUCT NAME */}
                <FormInput
                  label="Product Name"
                  required
                  value={productName}
                  onChange={updateProductName}
                  error={errors.productName}
                  placeholder="Example: Aashirvaad Atta 5kg"
                />

                {/* SKU */}
                <FormInput
                  label="SKU"
                  required
                  value={sku}
                  onChange={updateSku}
                  error={errors.sku}
                  placeholder="Example: AAS-ATT-005"
                />

                {/* CATEGORY + SUB CATEGORY */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormSelect
                    label="Category"
                    required
                    value={categoryId}
                    onChange={updateCategory}
                    error={errors.categoryId}
                    options={categories.map((c) => ({ value: c.categoryId, label: c.categoryName }))}
                  />

                  <FormSelect
                    label="Sub Category"
                    required
                    value={subCategoryId}
                    onChange={updateSubCategory}
                    error={errors.subCategoryId}
                    disabled={!categoryId}
                    placeholder={
                      !categoryId
                        ? "Select Category first"
                        : filteredSubCategories.length === 0
                          ? "No sub-categories"
                          : "Select Sub Category"
                    }
                    options={filteredSubCategories.map((s) => ({ value: s.subCategoryId, label: s.subCategoryName }))}
                  />
                </div>

                {/* BRAND + PRICE */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormSelect
                    label="Brand"
                    required
                    value={brandId}
                    onChange={updateBrand}
                    error={errors.brandId}
                    options={brands.map((b) => ({ value: b.brandId, label: b.brandName }))}
                  />

                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      Price <span className="ml-1 text-[#EF4444]">*</span>
                    </label>
                    <div className={`flex h-10 items-center rounded-lg border px-3 focus-within:border-[#1769F5] ${
                      errors.price ? "border-[#EF4444]" : "border-[#DCE2EA]"
                    }`}>
                      <span className="mr-2 text-[11px] text-[#7A8799]">₹</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={price}
                        onChange={(event) => updatePrice(event.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-[11px] outline-none"
                      />
                    </div>
                    {errors.price && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{errors.price}</p>}
                  </div>
                </div>

                {/* MRP + DISCOUNT */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      MRP <span className="ml-1 text-[#EF4444]">*</span>
                    </label>
                    <div className={`flex h-10 items-center rounded-lg border px-3 focus-within:border-[#1769F5] ${
                      errors.mrp ? "border-[#EF4444]" : "border-[#DCE2EA]"
                    }`}>
                      <span className="mr-2 text-[11px] text-[#7A8799]">₹</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={mrp}
                        onChange={(event) => updateMrp(event.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-[11px] outline-none"
                      />
                    </div>
                    {errors.mrp && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{errors.mrp}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">Discount (%)</label>
                    <input
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
                </div>

                {/* MOQ */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">MOQ</label>
                  <input
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

              {/* MODAL FOOTER */}
              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287] hover:bg-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveProduct}
                  disabled={submitting || !productName.trim() || !sku.trim() || !categoryId || !brandId || !price || !mrp}
                  className="h-9 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingProduct
                    ? "Save Changes"
                    : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {deleteId !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
            <div className="absolute inset-0" onClick={() => setDeleteId(null)} />

            <div className="relative w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D85A5A]">
                  <Trash2 size={18} />
                </div>

                <div>
                  <h2 className="text-[14px] font-bold text-[#263650]">Delete Product?</h2>
                  <p className="mt-1 text-[10px] leading-5 text-[#7B8798]">
                    This action cannot be undone. The product will be removed from the admin list.
                  </p>
                </div>
              </div>

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
                  onClick={confirmDelete}
                  className="h-9 rounded-lg bg-[#DC4B4B] px-4 text-[10px] font-semibold text-white hover:bg-[#C83E3E]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IMAGE PREVIEW LIGHTBOX */}
        {previewImage && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Product image preview"
            onClick={closePreview}
            className={`fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200 ease-out ${
              previewVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className={`relative w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ease-out ${
                previewVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close preview"
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#647287] shadow-sm transition hover:bg-white hover:text-[#1F2F49]"
              >
                <X size={16} />
              </button>

              <img
                src={previewImage}
                alt="Product"
                className="max-h-[60vh] w-full bg-[#FAFBFD] object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ============================================================
   STAT BOX
============================================================ */

function StatBox({
  label,
  value,
  icon: Icon,
  iconClass = "text-[#3260B4]",
  bgClass = "bg-[#EDF3FF]",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconClass?: string;
  bgClass?: string;
}) {
  return (
    <div className="rounded-xl border border-[#E4E8EF] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-medium text-[#8995A5]">{label}</p>
          <p className="mt-2 text-[20px] font-bold text-[#293953]">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgClass} ${iconClass}`}>
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FORM INPUT
============================================================ */

function FormInput({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
        {label} {required && <span className="ml-1 text-[#EF4444]">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`h-10 w-full rounded-lg border px-3 text-[11px] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
          error ? "border-[#EF4444]" : "border-[#DCE2EA]"
        }`}
      />
      {error && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{error}</p>}
    </div>
  );
}

/* ============================================================
   FORM SELECT
============================================================ */

function FormSelect({
  label,
  required = false,
  value,
  onChange,
  options,
  error,
  disabled = false,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
        {label} {required && <span className="ml-1 text-[#EF4444]">*</span>}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-[11px] text-[#52627A] outline-none focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 disabled:cursor-not-allowed disabled:bg-[#F3F5F8] disabled:text-[#9AA5B4] ${
          error ? "border-[#EF4444]" : "border-[#DCE2EA]"
        }`}
      >
        <option value="">{placeholder ?? `Select ${label}`}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{error}</p>}
    </div>
  );
}

/* ============================================================
   ACTION BUTTON
============================================================ */

function ActionButton({
  children,
  label,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        danger ? "text-[#D85A5A] hover:bg-[#FFF0F0]" : "text-[#64748A] hover:bg-[#EEF3FA] hover:text-[#1769F5]"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#F7F9FC] px-2.5 py-2">
      <p className="text-[7px] uppercase tracking-wide text-[#9AA5B4]">{label}</p>
      <p className="mt-1 truncate text-[9px] font-semibold text-[#52627A]">{value}</p>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  onClear,
  onAdd,
}: {
  onClear: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
        <Package size={25} />
      </div>

      <h3 className="mt-4 text-[13px] font-bold text-[#33415A]">No products found</h3>
      <p className="mt-1 max-w-[300px] text-[10px] leading-5 text-[#8995A5]">
        Try changing your search or filters, or create a new product.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClear}
          className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
        >
          Clear Filters
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-4 text-[10px] font-semibold text-white"
        >
          <Plus size={14} />
          Add Product
        </button>
      </div>
    </div>
  );
}
