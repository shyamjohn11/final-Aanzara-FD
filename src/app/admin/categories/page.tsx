"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Layers3,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  ArrowLeft,
  ImagePlus,
  X as XIcon,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import { api, extractErrorMessage } from "@/app/api/api";
import { categoriesApi, categoryImagesApi } from "@/app/api/services";

/* ============================================================
   TYPES
============================================================ */

type Category = {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  description: string;
  hasSubCategory: boolean;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  items: Category[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

type CreateCategoryPayload = {
  categoryCode: string;
  categoryName: string;
  description: string;
  hasSubCategory: boolean;
  isActive: boolean;
  image?: File | null;
};

type UpdateCategoryPayload = {
  categoryCode: string;
  categoryName: string;
  description: string;
  isActive: boolean;
  image?: File | null;
};

/* ============================================================
   PAGE
============================================================ */

export default function CategoriesAdminPage() {
  const router = useRouter();

  /* ==========================================================
     STATE
  ========================================================== */

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [hasSubCategory, setHasSubCategory] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<
    { imageId: string; imageUrl: string; isPrimary: boolean }[]
  >([]);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    code?: string;
    description?: string;
    image?: string;
  }>({});

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [imagePopup, setImagePopup] = useState<{
    isOpen: boolean;
    imageUrl: string;
    alt: string;
  }>({ isOpen: false, imageUrl: "", alt: "" });

  /* ==========================================================
     FETCH CATEGORIES
  ========================================================== */

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<ApiResponse>("/api/v1/categories");
      setCategories(response.data.items || []);
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to load categories.");
      setError(message);
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !query ||
        category.categoryName.toLowerCase().includes(query) ||
        category.categoryCode.toLowerCase().includes(query) ||
        category.description?.toLowerCase().includes(query) ||
        category.categoryId.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && category.isActive) ||
        (statusFilter === "Inactive" && !category.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  /* ==========================================================
     STATS
  ========================================================== */

  const activeCount = categories.filter((category) => category.isActive).length;
  const inactiveCount = categories.filter((category) => !category.isActive).length;

  /* ==========================================================
     ADD / EDIT MODAL
  ========================================================== */

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setCode("");
    setDescription("");
    setHasSubCategory(false);
    setIsActive(true);
    setImageFile(null);
    setImagePreview("");
    setGalleryImages([]);
    setFieldErrors({});
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.categoryName);
    setCode(category.categoryCode);
    setDescription(category.description || "");
    setHasSubCategory(category.hasSubCategory);
    setIsActive(category.isActive);
    setImageFile(null);
    setImagePreview(categoriesApi.primaryImageUrl(category.categoryId));
    setGalleryImages([]);
    setFieldErrors({});
    setFormError("");
    setShowModal(true);
    // #26 gallery for the manager strip (best-effort).
    loadGalleryImages(category.categoryId);
  };

  /* ==========================================================
     GALLERY (#26 list · #29 primary · #30 delete)
  ========================================================== */

  const loadGalleryImages = async (categoryId: string) => {
    if (!categoryId) return;
    try {
      const response = await categoriesApi.images(categoryId);
      const payload: unknown = response.data;
      const rawItems: unknown[] = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as Record<string, unknown>)?.items)
          ? ((payload as Record<string, unknown>).items as unknown[])
          : [];
      const mapped = rawItems.flatMap((entry) => {
        if (typeof entry !== "object" || entry === null) return [];
        const raw = entry as Record<string, unknown>;
        const imageId = String(
          raw.categoryImageId ?? raw.imageId ?? raw.id ?? ""
        );
        const imageUrl = String(
          raw.imageUrl ?? raw.url ?? raw.filePath ?? ""
        );
        if (!imageId || !imageUrl) return [];
        return [
          {
            imageId,
            imageUrl,
            isPrimary: Boolean(raw.isPrimary ?? false),
          },
        ];
      });
      setGalleryImages(mapped);
    } catch (error) {
      console.error("Unable to load category images:", error);
    }
  };

  const setGalleryPrimary = async (imageId: string) => {
    try {
      await categoryImagesApi.setPrimary(imageId);
      if (editingCategory) {
        await loadGalleryImages(editingCategory.categoryId);
      }
    } catch (error) {
      console.error("Set primary image failed:", error);
      setFormError(
        extractErrorMessage(error, "Failed to set primary image.")
      );
    }
  };

  const deleteGalleryImage = async (imageId: string) => {
    try {
      await categoryImagesApi.remove(imageId);
      if (editingCategory) {
        await loadGalleryImages(editingCategory.categoryId);
      }
    } catch (error) {
      console.error("Delete image failed:", error);
      setFormError(
        extractErrorMessage(error, "Failed to delete image.")
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setName("");
    setCode("");
    setDescription("");
    setHasSubCategory(false);
    setIsActive(true);
    setImageFile(null);
    setImagePreview("");
    setGalleryImages([]);
    setFieldErrors({});
    setFormError("");
    setSubmitting(false);
  };

  /* ==========================================================
     IMAGE HANDLING
  ========================================================== */

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setFieldErrors((current) => ({
        ...current,
        image: "Only PNG, JPG and WEBP images are allowed.",
      }));
      event.target.value = "";
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((current) => ({
        ...current,
        image: "Image size must be less than 2 MB.",
      }));
      event.target.value = "";
      return;
    }

    // Validate dimensions
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      if (img.width < 100 || img.height < 100) {
        URL.revokeObjectURL(imageUrl);
        setFieldErrors((current) => ({
          ...current,
          image: "Image must be at least 100 × 100 pixels.",
        }));
        event.target.value = "";
        return;
      }

      if (img.width > 2000 || img.height > 2000) {
        URL.revokeObjectURL(imageUrl);
        setFieldErrors((current) => ({
          ...current,
          image: "Image cannot exceed 2000 × 2000 pixels.",
        }));
        event.target.value = "";
        return;
      }

      setImageFile(file);
      setImagePreview(imageUrl);
      setFieldErrors((current) => ({ ...current, image: undefined }));
      setFormError("");
    };

    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      setFieldErrors((current) => ({
        ...current,
        image: "Unable to read this image. Please choose another file.",
      }));
      event.target.value = "";
    };

    img.src = imageUrl;
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview("");
    setFieldErrors((current) => ({ ...current, image: undefined }));
  };

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const validateCategory = () => {
    const errors: {
      name?: string;
      code?: string;
      description?: string;
      image?: string;
    } = {};

    const cleanName = name.trim();
    const cleanCode = code.trim().toLowerCase();
    const cleanDescription = description.trim();

    /* CATEGORY NAME */
    if (!cleanName) {
      errors.name = "Category name is required.";
    } else if (cleanName.length < 2) {
      errors.name = "Category name must be at least 2 characters.";
    } else if (cleanName.length > 100) {
      errors.name = "Category name cannot exceed 100 characters.";
    }

    /* CATEGORY CODE */
    if (!cleanCode) {
      errors.code = "Category code is required.";
    } else if (cleanCode.length < 2) {
      errors.code = "Category code must be at least 2 characters.";
    } else if (cleanCode.length > 50) {
      errors.code = "Category code cannot exceed 50 characters.";
    } else if (!/^[a-z0-9]+$/.test(cleanCode)) {
      errors.code = "Category code can contain only lowercase letters and numbers.";
    } else {
      // Check for duplicate code
      const duplicateCode = categories.some(
        (category) =>
          category.categoryCode.toLowerCase() === cleanCode &&
          category.categoryId !== editingCategory?.categoryId
      );

      if (duplicateCode) {
        errors.code = "A category with this code already exists.";
      }
    }

    /* DESCRIPTION */
    if (cleanDescription.length > 500) {
      errors.description = "Description cannot exceed 500 characters.";
    }

    /* IMAGE - Only required for new categories */
    if (!editingCategory && !imageFile) {
      errors.image = "Category image is required.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError("Please correct the highlighted fields before saving.");
      return false;
    }

    setFormError("");
    return true;
  };

  /* ==========================================================
     SAVE CATEGORY
  ========================================================== */

  const saveCategory = async () => {
    if (!validateCategory()) {
      return;
    }

    setSubmitting(true);

    const cleanName = name.trim();
    const cleanCode = code.trim().toLowerCase();
    const cleanDescription = description.trim();

    try {
      let formData: FormData;

      if (editingCategory) {
        // UPDATE - Use FormData for multipart (using categoriesApi which handles Content-Type automatically)
        formData = new FormData();
        formData.append("categoryCode", cleanCode);
        formData.append("categoryName", cleanName);
        formData.append("description", cleanDescription);
        formData.append("isActive", String(isActive));

        // Only append image if a new one is selected
        if (imageFile) {
          formData.append("image", imageFile);
        }
      } else {
        // CREATE - Use FormData for multipart (using categoriesApi which handles Content-Type automatically)
        formData = new FormData();
        formData.append("categoryCode", cleanCode);
        formData.append("categoryName", cleanName);
        formData.append("description", cleanDescription);
        formData.append("hasSubCategory", String(hasSubCategory));
        formData.append("isActive", "true");
        formData.append("image", imageFile as File);
      }

      if (editingCategory) {
        await categoriesApi.update(editingCategory.categoryId, formData!);
      } else {
        await categoriesApi.create(formData!);
      }

      closeModal();
      fetchCategories(); // Refresh the list
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to save category.");
      setFormError(message);
      console.error("Error saving category:", err);
      setSubmitting(false);
    }
  };

  /* ==========================================================
     TOGGLE STATUS
  ========================================================== */

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const category = categories.find((c) => c.categoryId === id);
      if (!category) return;

      const payload: UpdateCategoryPayload = {
        categoryCode: category.categoryCode,
        categoryName: category.categoryName,
        description: category.description || "",
        isActive: !currentStatus,
      };

      await api.put(`/api/v1/categories/${id}`, payload);
      fetchCategories(); // Refresh the list
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to update category status.");
      console.error("Error toggling status:", err);
      // Optionally show a toast notification
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
      await api.delete(`/api/v1/categories/${deleteId}`);
      setDeleteId(null);
      fetchCategories(); // Refresh the list
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to delete category.");
      console.error("Error deleting category:", err);
      // Optionally show a toast notification
      setDeleteId(null);
    }
  };

  /* ==========================================================
     CODE GENERATOR
  ========================================================== */

  const generateCode = (value: string) => {
    const nextName = value.slice(0, 50);
    setName(nextName);
    setFieldErrors((current) => ({
      ...current,
      name: undefined,
      code: undefined,
    }));
    setFormError("");

    if (!editingCategory) {
      setCode(
        nextName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "")
          .slice(0, 50)
      );
    }
  };

  /* ==========================================================
     RETURN
  ========================================================== */

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">
        {/* ==================================================
            PAGE HEADER
        =================================================== */}

        <header className="border-b border-[#E4E8EF] bg-white">
          <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748A] transition hover:bg-[#EEF3FA] hover:text-[#1769F5]"
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="min-w-0">
                <h1 className="font-sora text-[21px] font-bold leading-tight text-[#22324D] sm:text-[24px]">
                  Categories
                </h1>
                <p className="mt-1 text-[10px] text-[#8995A5]">
                  Manage product categories
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1769F5] px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#0F5BDE]"
            >
              <Plus size={16} />
              <span>Add Category</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {/* =================================================
              BREADCRUMB
          ================================================== */}

          <div className="mb-5 flex items-center gap-2 text-[9px] text-[#8A96A7]">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="hover:text-[#1769F5]"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="font-medium text-[#566579]">Categories</span>
          </div>

          {/* =================================================
              ERROR STATE
          ================================================== */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[11px] text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchCategories}
                className="mt-2 text-[10px] font-semibold text-red-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* =================================================
              STATS
          ================================================== */}

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatBox
              label="Total Categories"
              value={categories.length}
              icon={Layers3}
            />

            <StatBox
              label="Active"
              value={activeCount}
              icon={Check}
              iconClass="text-[#249357]"
              bgClass="bg-[#EAF8F0]"
            />

            <StatBox
              label="Inactive"
              value={inactiveCount}
              icon={X}
              iconClass="text-[#D85A5A]"
              bgClass="bg-[#FFF0F0]"
            />

            <StatBox
              label="Sub Categories"
              value={categories.filter((c) => c.hasSubCategory).length}
              icon={Package}
            />
          </section>

          {/* =================================================
              TOOLBAR
          ================================================== */}

          <section className="mt-6 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* SEARCH */}
              <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 lg:max-w-[395px]">
                <Search size={16} className="shrink-0 text-[#8995A5]" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search categories..."
                  className="h-full w-full bg-transparent px-2.5 text-[11px] text-[#263A59] outline-none placeholder:text-[#A0AAB8]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-[#8995A5] hover:text-[#263A59]"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* FILTER */}
              <div className="flex items-center">
                <div className="flex rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] p-1">
                  {(["All", "Active", "Inactive"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`
                        rounded-md
                        px-3
                        py-1.5
                        text-[9px]
                        font-semibold
                        transition
                        ${
                          statusFilter === status
                            ? "bg-[#173B7A] text-white"
                            : "text-[#65748A] hover:bg-white hover:text-[#173B7A]"
                        }
                      `}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              TABLE
          ================================================== */}

          <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
            {/* TABLE HEADER */}
            <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">
              <div>
                <h2 className="text-[13px] font-bold text-[#263650]">
                  All Categories
                </h2>
                <p className="mt-1 text-[9px] text-[#8A96A7]">
                  {loading ? "Loading..." : `${filteredCategories.length} categories found`}
                </p>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="hidden items-center gap-1.5 text-[9px] font-semibold text-[#1769F5] hover:underline sm:flex"
              >
                <Plus size={13} />
                New Category
              </button>
            </div>

            {/* LOADING */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E4E8EF] border-t-[#1769F5]" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <EmptyState
                search={search}
                onClear={() => {
                  setSearch("");
                  setStatusFilter("All");
                }}
                onAdd={openAddModal}
              />
            ) : (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Category
                        </th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Code
                        </th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Sub Categories
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
                      {filteredCategories.map((category) => (
                        <tr
                          key={category.categoryId}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >
                          {/* CATEGORY */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                                <CategoryThumb
                                  category={category}
                                  onClick={() =>
                                    setImagePopup({
                                      isOpen: true,
                                      imageUrl: categoriesApi.primaryImageUrl(category.categoryId),
                                      alt: category.categoryName,
                                    })
                                  }
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-[#33415A]">
                                  {category.categoryName}
                                </p>
                                <p className="mt-1 max-w-[280px] truncate text-[9px] text-[#8B96A5]">
                                  {category.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* CODE */}
                          <td className="px-5 py-4">
                            <span className="rounded-md bg-[#F3F5F8] px-2 py-1 font-mono text-[9px] text-[#69778B]">
                              {category.categoryCode}
                            </span>
                          </td>

                          {/* SUB CATEGORIES */}
                          <td className="px-5 py-4">
                            <span className="text-[11px] font-semibold text-[#3C4B63]">
                              {category.hasSubCategory ? "Yes" : "No"}
                            </span>
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => toggleStatus(category.categoryId, category.isActive)}
                              className={`
                                rounded-full
                                px-2.5
                                py-1
                                text-[8px]
                                font-semibold
                                ${
                                  category.isActive
                                    ? "bg-[#EAF8F0] text-[#249357]"
                                    : "bg-[#FFF0F0] text-[#D85A5A]"
                                }
                              `}
                            >
                              {category.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <ActionButton
                                label="Edit"
                                onClick={() => openEditModal(category)}
                              >
                                <Pencil size={14} />
                              </ActionButton>

                              <ActionButton
                                label="Delete"
                                danger
                                onClick={() => setDeleteId(category.categoryId)}
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

                {/* MOBILE CARDS */}
                <div className="divide-y divide-[#EDF0F4] md:hidden">
                  {filteredCategories.map((category) => (
                    <div key={category.categoryId} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                          <CategoryThumb
                            category={category}
                            onClick={() =>
                              setImagePopup({
                                isOpen: true,
                                imageUrl: categoriesApi.primaryImageUrl(category.categoryId),
                                alt: category.categoryName,
                              })
                            }
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-bold text-[#33415A]">
                                {category.categoryName}
                              </p>
                              <p className="mt-1 truncate font-mono text-[8px] text-[#8A96A7]">
                                {category.categoryCode}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleStatus(category.categoryId, category.isActive)}
                              className={`
                                shrink-0
                                rounded-full
                                px-2
                                py-1
                                text-[7px]
                                font-semibold
                                ${
                                  category.isActive
                                    ? "bg-[#EAF8F0] text-[#249357]"
                                    : "bg-[#FFF0F0] text-[#D85A5A]"
                                }
                              `}
                            >
                              {category.isActive ? "Active" : "Inactive"}
                            </button>
                          </div>

                          <p className="mt-2 line-clamp-2 text-[9px] leading-4 text-[#7C899B]">
                            {category.description || "No description"}
                          </p>

                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-[9px] text-[#8995A5]">
                              Sub Categories:{" "}
                              <span className="font-bold text-[#42516A]">
                                {category.hasSubCategory ? "Yes" : "No"}
                              </span>
                            </p>

                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(category)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5B6A80] hover:bg-[#EEF3FA] hover:text-[#1769F5]"
                                aria-label="Edit category"
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteId(category.categoryId)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#D85A5A] hover:bg-[#FFF0F0]"
                                aria-label="Delete category"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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
                    <span className="font-semibold text-[#4D5C72]">
                      {filteredCategories.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-[#4D5C72]">
                      {categories.length}
                    </span>
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E1E6ED] text-[#B3BBC6]"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-[#173B7A] px-2 text-[9px] font-semibold text-white">
                      1
                    </span>

                    <button
                      type="button"
                      disabled
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E1E6ED] text-[#B3BBC6]"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>

        {/* ====================================================
            ADD / EDIT MODAL
        ===================================================== */}

        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="absolute inset-0" onClick={closeModal} />

            <div className="relative w-full max-w-[550px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">
                <div>
                  <h2 className="text-[15px] font-bold text-[#263650]">
                    {editingCategory ? "Edit Category" : "Add Category"}
                  </h2>
                  <p className="mt-1 text-[9px] text-[#8A96A7]">
                    {editingCategory ? "Update category information" : "Create a new product category"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="space-y-4 p-5">
                {/* NAME */}
                <div>
                  <label htmlFor="category-name" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Category Name <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <input
                    id="category-name"
                    type="text"
                    value={name}
                    onChange={(event) => generateCode(event.target.value)}
                    placeholder="Enter category name"
                    maxLength={100}
                    aria-invalid={!!fieldErrors.name}
                    className={`h-10 w-full rounded-lg border px-3 text-[11px] text-[#263650] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                      fieldErrors.name ? "border-[#EF4444] bg-[#FFF8F8]" : "border-[#DCE2EA]"
                    }`}
                  />

                  {fieldErrors.name && (
                    <p className="mt-1.5 text-[8px] font-medium text-[#EF4444]">{fieldErrors.name}</p>
                  )}
                </div>

                {/* CODE */}
                <div>
                  <label htmlFor="category-code" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Category Code <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <input
                    id="category-code"
                    type="text"
                    value={code}
                    onChange={(event) => {
                      setCode(
                        event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "")
                          .slice(0, 50)
                      );
                      setFieldErrors((current) => ({ ...current, code: undefined }));
                      setFormError("");
                    }}
                    placeholder="category-code"
                    maxLength={50}
                    aria-invalid={!!fieldErrors.code}
                    className={`h-10 w-full rounded-lg border px-3 font-mono text-[10px] text-[#263650] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                      fieldErrors.code ? "border-[#EF4444] bg-[#FFF8F8]" : "border-[#DCE2EA]"
                    }`}
                  />

                  {fieldErrors.code && (
                    <p className="mt-1.5 text-[8px] font-medium text-[#EF4444]">{fieldErrors.code}</p>
                  )}
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label htmlFor="category-description" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Description
                  </label>

                  <textarea
                    id="category-description"
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value.slice(0, 500));
                      setFieldErrors((current) => ({ ...current, description: undefined }));
                      setFormError("");
                    }}
                    placeholder="Enter category description"
                    rows={3}
                    maxLength={500}
                    aria-invalid={!!fieldErrors.description}
                    className={`w-full resize-none rounded-lg border p-3 text-[11px] text-[#263650] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                      fieldErrors.description ? "border-[#EF4444] bg-[#FFF8F8]" : "border-[#DCE2EA]"
                    }`}
                  />

                  <div className="mt-1 flex items-start justify-between gap-2">
                    {fieldErrors.description ? (
                      <p className="text-[8px] font-medium text-[#EF4444]">{fieldErrors.description}</p>
                    ) : (
                      <span className="text-[8px] text-transparent">.</span>
                    )}
                    <p className="text-[8px] text-[#A0AAB8]">{description.length}/500</p>
                  </div>
                </div>

                {/* IMAGE UPLOAD */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Category Image {!editingCategory && <span className="ml-1 text-[#EF4444]">*</span>}
                  </label>

                  <div className="flex items-center gap-4">
                    {/* Image Preview */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#DCE2EA] bg-[#FAFBFD]">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={() => setImagePreview("")}
                        />
                      ) : (
                        <Layers3 size={24} className="text-[#A0AAB8]" />
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1">
                      <label
                        htmlFor="category-image-upload"
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-[10px] font-semibold text-[#52627A] transition hover:bg-[#FAFBFD]"
                      >
                        <ImagePlus size={14} />
                        {imagePreview ? "Change Image" : "Upload Image"}
                      </label>
                      <input
                        id="category-image-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />

                      {imagePreview && (
                        <button
                          type="button"
                          onClick={removeImage}
                          className="mt-1.5 text-[8px] font-semibold text-[#DC4B4B] hover:underline"
                        >
                          Remove
                        </button>
                      )}

                      <p className="mt-1.5 text-[7px] text-[#9AA4B2]">
                        PNG, JPG, WEBP · Max 2MB · 100×100 to 2000×2000
                      </p>
                    </div>
                  </div>

                  {fieldErrors.image && (
                    <p className="mt-1.5 text-[8px] font-medium text-[#EF4444]">{fieldErrors.image}</p>
                  )}

                  {/* GALLERY (#26 list · #29 primary · #30 delete) */}
                  {editingCategory && galleryImages.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[10px] font-semibold text-[#52627A]">
                        Uploaded Images (click to set primary)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {galleryImages.map((galleryImage) => (
                          <div
                            key={galleryImage.imageId}
                            className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 ${
                              galleryImage.isPrimary
                                ? "border-[#249357]"
                                : "border-[#DCE2EA]"
                            }`}
                          >
                            <button
                              type="button"
                              title={
                                galleryImage.isPrimary
                                  ? "Primary image"
                                  : "Set as primary"
                              }
                              onClick={() =>
                                !galleryImage.isPrimary &&
                                setGalleryPrimary(galleryImage.imageId)
                              }
                              className="h-full w-full"
                            >
                              <img
                                src={galleryImage.imageUrl}
                                alt="Category"
                                className="h-full w-full object-cover"
                                onClick={() =>
                                  setImagePopup({
                                    isOpen: true,
                                    imageUrl: galleryImage.imageUrl,
                                    alt: galleryImage.imageUrl,
                                  })
                                }
                              />
                            </button>
                            {galleryImage.isPrimary && (
                              <span className="absolute left-1 top-1 rounded bg-[#249357] px-1 py-0.5 text-[7px] font-bold text-white">
                                PRIMARY
                              </span>
                            )}
                            <button
                              type="button"
                              title="Delete image"
                              aria-label="Delete image"
                              onClick={() =>
                                deleteGalleryImage(galleryImage.imageId)
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

                {/* HAS SUB CATEGORY - Only for Create */}
                {!editingCategory && (
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      Has Sub Categories
                    </label>

                    <div className="flex gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                        <input
                          type="radio"
                          checked={hasSubCategory === true}
                          onChange={() => setHasSubCategory(true)}
                          className="h-4 w-4 accent-[#1769F5]"
                        />
                        Yes
                      </label>

                      <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                        <input
                          type="radio"
                          checked={hasSubCategory === false}
                          onChange={() => setHasSubCategory(false)}
                          className="h-4 w-4 accent-[#1769F5]"
                        />
                        No
                      </label>
                    </div>
                  </div>
                )}

                {/* STATUS - Only for Edit */}
                {editingCategory && (
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                      Status
                    </label>

                    <div className="flex gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                        <input
                          type="radio"
                          checked={isActive === true}
                          onChange={() => setIsActive(true)}
                          className="h-4 w-4 accent-[#1769F5]"
                        />
                        Active
                      </label>

                      <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                        <input
                          type="radio"
                          checked={isActive === false}
                          onChange={() => setIsActive(false)}
                          className="h-4 w-4 accent-[#1769F5]"
                        />
                        Inactive
                      </label>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="rounded-lg bg-[#FFF2F2] px-3 py-2.5">
                    <p className="text-[9px] font-medium text-[#C43E3E]">{formError}</p>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287] hover:bg-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveCategory}
                  disabled={submitting}
                  className="h-9 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingCategory
                    ? "Save Changes"
                    : "Create Category"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            DELETE MODAL
        ===================================================== */}

        {deleteId !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
            <div className="absolute inset-0" onClick={() => setDeleteId(null)} />

            <div className="relative w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D85A5A]">
                  <Trash2 size={18} />
                </div>

                <div>
                  <h2 className="text-[14px] font-bold text-[#263650]">Delete Category?</h2>
                  <p className="mt-1 text-[10px] leading-5 text-[#7B8798]">
                    This action cannot be undone. The category will be removed from the admin list.
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

        {/* ====================================================
            IMAGE LIGHTBOX (table thumbnails + gallery)

            Inlined here rather than a separate component. Fixed
            box size (500×400) so every image sits in the same
            frame regardless of its own aspect ratio, and the
            close button is anchored to the card's own corner —
            not the full viewport — so it's always found right
            next to the image, not floating off near the header.
        ===================================================== */}

        {imagePopup.isOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-6"
            onClick={() => setImagePopup({ isOpen: false, imageUrl: "", alt: "" })}
          >
            <div
              className="relative flex h-[400px] w-[500px] max-h-[85vh] max-w-[90vw] items-center justify-center overflow-hidden rounded-xl bg-white p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setImagePopup({ isOpen: false, imageUrl: "", alt: "" })}
                aria-label="Close image preview"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1F2F49] text-white shadow-md transition hover:bg-[#0F1B30] focus:outline-none focus:ring-2 focus:ring-[#1769F5]"
              >
                <X size={16} />
              </button>

              <img
                src={imagePopup.imageUrl}
                alt={imagePopup.alt}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ============================================================
   CATEGORY THUMB
============================================================ */

function CategoryThumb({
  category,
  onClick,
}: {
  category: Category;
  onClick?: () => void;
}) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return <Layers3 size={18} />;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="h-full w-full"
      aria-label={`View ${category.categoryName} image`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={categoriesApi.primaryImageUrl(category.categoryId)}
        alt={category.categoryName}
        className="h-full w-full object-cover"
        onError={() => setBroken(true)}
      />
    </button>
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
      className={`
        flex
        h-8
        w-8
        items-center
        justify-center
        rounded-lg
        transition
        ${
          danger
            ? "text-[#D85A5A] hover:bg-[#FFF0F0]"
            : "text-[#64748A] hover:bg-[#EEF3FA] hover:text-[#1769F5]"
        }
      `}
    >
      {children}
    </button>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  search,
  onClear,
  onAdd,
}: {
  search: string;
  onClear: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
        <Layers3 size={25} />
      </div>

      <h3 className="mt-4 text-[13px] font-bold text-[#33415A]">No categories found</h3>

      <p className="mt-1 max-w-[300px] text-[10px] leading-5 text-[#8995A5]">
        {search ? "Try changing your search or filter." : "Create your first product category to get started."}
      </p>

      <div className="mt-5 flex gap-2">
        {search && (
          <button
            type="button"
            onClick={onClear}
            className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
          >
            Clear Filters
          </button>
        )}

        <button
          type="button"
          onClick={onAdd}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1769F5] px-4 text-[10px] font-semibold text-white"
        >
          <Plus size={14} />
          Add Category
        </button>
      </div>
    </div>
  );
}
