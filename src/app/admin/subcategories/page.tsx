"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { extractErrorMessage } from "@/app/api/api";
import { categoriesApi, subcategoriesApi } from "@/app/api/services";
import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Layers3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderTree,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

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
  createdAt: string;
  updatedAt: string;
};

type CategoryWithSubCategories = Category & {
  subCategories: SubCategory[];
};

type SubCategory = {
  subCategoryId: string;
  subCategoryCode: string;
  subCategoryName: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type SubCategoryApiResponse = {
  items: SubCategory[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

type CreateSubCategoryPayload = {
  categoryId: string;
  subCategoryCode: string;
  subCategoryName: string;
  description: string;
  isActive: boolean;
  image?: File | string;
};

type UpdateSubCategoryPayload = {
  subCategoryCode: string;
  subCategoryName: string;
  description: string;
  isActive: boolean;
  image?: File | string;
};

/* ============================================================
   PAGE
============================================================ */

export default function SubCategoriesAdminPage() {
  const router = useRouter();

  /* ==========================================================
     STATE
  ========================================================== */

  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    code?: string;
    categoryId?: string;
    description?: string;
    image?: string;
  }>({});

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ==========================================================
     FETCH DATA
  ========================================================== */

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.withSubcategories();
      setCategories(
        (response.data as CategoryWithSubCategories[]) ?? []
      );
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await subcategoriesApi.list();
      setSubcategories(
        (response.data as SubCategoryApiResponse)?.items || []
      );
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to load subcategories.");
      setError(message);
      console.error("Error fetching subcategories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredSubCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subcategories.filter((item) => {
      const categoryName = categories.find((c) => c.categoryId === item.categoryId)?.categoryName || "";

      const matchesSearch =
        !query ||
        item.subCategoryName.toLowerCase().includes(query) ||
        item.subCategoryCode.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        categoryName === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && item.isActive) ||
        (statusFilter === "Inactive" && !item.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [subcategories, categories, search, categoryFilter, statusFilter]);

  /* ==========================================================
     STATS
  ========================================================== */

  const activeCount = subcategories.filter((item) => item.isActive).length;
  const inactiveCount = subcategories.filter((item) => !item.isActive).length;

  /* ==========================================================
     MODAL
  ========================================================== */

  const openAddModal = () => {
    setEditingSubCategory(null);
    setName("");
    setCode("");
    setCategoryId(categories.length > 0 ? categories[0].categoryId : "");
    setDescription("");
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setRemoveImage(false);
    setFieldErrors({});
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (item: SubCategory) => {
    setEditingSubCategory(item);
    setName(item.subCategoryName);
    setCode(item.subCategoryCode);
    setCategoryId(item.categoryId);
    setDescription(item.description || "");
    setIsActive(item.isActive);
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(item.imageUrl || null);
    setRemoveImage(false);
    setFieldErrors({});
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSubCategory(null);
    setName("");
    setCode("");
    setCategoryId("");
    setDescription("");
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setRemoveImage(false);
    setFieldErrors({});
    setFormError("");
    setSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ==========================================================
     IMAGE HANDLING
  ========================================================== */

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setFieldErrors((current) => ({
        ...current,
        image: "Please upload a valid image (JPEG, PNG, WebP, or GIF)",
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((current) => ({
        ...current,
        image: "Image size must be less than 5MB",
      }));
      return;
    }

    setImageFile(file);
    setFieldErrors((current) => ({ ...current, image: undefined }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (editingSubCategory && existingImage) {
      setRemoveImage(true);
      setExistingImage(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const validateSubCategory = () => {
    const errors: {
      name?: string;
      code?: string;
      categoryId?: string;
      description?: string;
      image?: string;
    } = {};

    const cleanName = name.trim();
    const cleanCode = code.trim().toLowerCase();
    const cleanDescription = description.trim();

    if (!cleanName) {
      errors.name = "Subcategory name is required.";
    } else if (cleanName.length < 2 || cleanName.length > 100) {
      errors.name = "Subcategory name must be 2–100 characters.";
    }

    if (!cleanCode) {
      errors.code = "Subcategory code is required.";
    } else if (cleanCode.length < 2 || cleanCode.length > 50) {
      errors.code = "Subcategory code must be 2–50 characters.";
    } else if (!/^[a-z0-9]+$/.test(cleanCode)) {
      errors.code = "Subcategory code can contain only lowercase letters and numbers.";
    } else {
      const duplicateCode = subcategories.some(
        (item) =>
          item.subCategoryCode.toLowerCase() === cleanCode &&
          item.subCategoryId !== editingSubCategory?.subCategoryId
      );

      if (duplicateCode) {
        errors.code = "A subcategory with this code already exists.";
      }
    }

    if (!categoryId) {
      errors.categoryId = "Please select a parent category.";
    }

    if (cleanDescription.length > 500) {
      errors.description = "Description must be 500 characters or less.";
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
     SAVE
  ========================================================== */

  const saveSubCategory = async () => {
    if (!validateSubCategory()) return;

    setSubmitting(true);

    const cleanName = name.trim();
    const cleanCode = code.trim().toLowerCase();
    const cleanDescription = description.trim();

    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append("CategoryId", categoryId);
      formData.append("SubCategoryCode", cleanCode);
      formData.append("SubCategoryName", cleanName);
      formData.append("Description", cleanDescription);
      formData.append("IsActive", String(isActive));

      // Handle image
      if (imageFile) {
        formData.append("Image", imageFile);
      } else if (removeImage) {
        // Send empty string or null to remove image
        formData.append("Image", "");
      }

      if (editingSubCategory) {
        // UPDATE
        await subcategoriesApi.update(
          editingSubCategory.subCategoryId,
          formData
        );
      } else {
        // CREATE
        await subcategoriesApi.create(formData);
      }

      closeModal();
      fetchSubCategories(); // Refresh the list
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to save subcategory.");
      setFormError(message);
      console.error("Error saving subcategory:", err);
      setSubmitting(false);
    }
  };

  /* ==========================================================
     TOGGLE STATUS
  ========================================================== */

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const subcategory = subcategories.find((s) => s.subCategoryId === id);
      if (!subcategory) return;

      const formData = new FormData();
      formData.append("SubCategoryCode", subcategory.subCategoryCode);
      formData.append("SubCategoryName", subcategory.subCategoryName);
      formData.append("Description", subcategory.description || "");
      formData.append("IsActive", String(!currentStatus));

      await subcategoriesApi.update(id, formData);
      fetchSubCategories();
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to update subcategory status.");
      console.error("Error toggling status:", err);
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const confirmDelete = async () => {
    if (deleteId === null) return;

    try {
      await subcategoriesApi.remove(deleteId);
      setDeleteId(null);
      fetchSubCategories();
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to delete subcategory.");
      console.error("Error deleting subcategory:", err);
      setDeleteId(null);
    }
  };

  /* ==========================================================
     CODE GENERATOR
  ========================================================== */

  const handleNameChange = (value: string) => {
    setName(value);
    setFieldErrors((current) => ({ ...current, name: undefined }));

    if (!editingSubCategory) {
      setCode(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "")
          .slice(0, 50)
      );
    }
  };

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
            className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] transition hover:bg-[#F1F4F8] hover:text-[#173B7A]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
              Subcategories
            </h1>
            <p className="hidden text-[9px] text-[#8995A5] sm:block">
              Manage product subcategories
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#0F5BDE] sm:px-4"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Subcategory</span>
            <span className="sm:hidden">Add</span>
          </button>
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
            <span className="font-medium text-[#566579]">Subcategories</span>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[11px] text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchSubCategories}
                className="mt-2 text-[10px] font-semibold text-red-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* STATS */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatBox
              label="Total Subcategories"
              value={subcategories.length}
              icon={FolderTree}
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
              label="Categories"
              value={categories.length}
              icon={Layers3}
            />
          </section>

          {/* FILTER BAR */}
          <section className="mt-6 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              {/* SEARCH */}
              <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 xl:max-w-[360px]">
                <Search size={16} className="shrink-0 text-[#8995A5]" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search subcategories..."
                  className="h-full w-full bg-transparent px-2.5 text-[11px] outline-none placeholder:text-[#A0AAB8]"
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

              {/* FILTERS */}
              <div className="flex flex-col gap-2 sm:flex-row">
                {/* CATEGORY */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 pr-9 text-[10px] font-medium text-[#59687D] outline-none focus:border-[#1769F5] sm:w-[190px]"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((item) => (
                      <option key={item.categoryId} value={item.categoryName}>
                        {item.categoryName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 text-[#8995A5]" />
                </div>

                {/* STATUS */}
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
                            : "text-[#65748A] hover:bg-white"
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

          {/* TABLE CARD */}
          <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">
              <div>
                <h2 className="text-[13px] font-bold text-[#263650]">
                  All Subcategories
                </h2>
                <p className="mt-1 text-[9px] text-[#8A96A7]">
                  {loading ? "Loading..." : `${filteredSubCategories.length} subcategories found`}
                </p>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="hidden items-center gap-1.5 text-[9px] font-semibold text-[#1769F5] hover:underline sm:flex"
              >
                <Plus size={13} />
                New Subcategory
              </button>
            </div>

            {/* LOADING */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E4E8EF] border-t-[#1769F5]" />
              </div>
            ) : filteredSubCategories.length === 0 ? (
              <EmptyState
                onClear={() => {
                  setSearch("");
                  setCategoryFilter("All");
                  setStatusFilter("All");
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
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Subcategory
                        </th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Parent Category
                        </th>
                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Code
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
                      {filteredSubCategories.map((item) => {
                        const categoryName = categories.find((c) => c.categoryId === item.categoryId)?.categoryName || "Unknown";
                        return (
                          <tr
                            key={item.subCategoryId}
                            className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.subCategoryName}
                                      className="h-10 w-10 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <FolderTree size={18} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-[#33415A]">
                                    {item.subCategoryName}
                                  </p>
                                  <p className="mt-1 max-w-[240px] truncate text-[9px] text-[#8B96A5]">
                                    {item.description || "No description"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-md bg-[#F0F5FF] px-2.5 py-1 text-[9px] font-semibold text-[#46669B]">
                                {categoryName}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-md bg-[#F3F5F8] px-2 py-1 font-mono text-[9px] text-[#69778B]">
                                {item.subCategoryCode}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => toggleStatus(item.subCategoryId, item.isActive)}
                                className={`
                                  rounded-full
                                  px-2.5
                                  py-1
                                  text-[8px]
                                  font-semibold
                                  ${
                                    item.isActive
                                      ? "bg-[#EAF8F0] text-[#249357]"
                                      : "bg-[#FFF0F0] text-[#D85A5A]"
                                  }
                                `}
                              >
                                {item.isActive ? "Active" : "Inactive"}
                              </button>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-1">
                                <ActionButton
                                  label="Edit"
                                  onClick={() => openEditModal(item)}
                                >
                                  <Pencil size={14} />
                                </ActionButton>

                                <ActionButton
                                  label="Delete"
                                  danger
                                  onClick={() => setDeleteId(item.subCategoryId)}
                                >
                                  <Trash2 size={14} />
                                </ActionButton>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE */}
                <div className="divide-y divide-[#EDF0F4] md:hidden">
                  {filteredSubCategories.map((item) => {
                    const categoryName = categories.find((c) => c.categoryId === item.categoryId)?.categoryName || "Unknown";
                    return (
                      <div key={item.subCategoryId} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.subCategoryName}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <FolderTree size={18} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-bold text-[#33415A]">
                                  {item.subCategoryName}
                                </p>
                                <p className="mt-1 truncate font-mono text-[8px] text-[#8A96A7]">
                                  {item.subCategoryCode}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleStatus(item.subCategoryId, item.isActive)}
                                className={`
                                  shrink-0
                                  rounded-full
                                  px-2
                                  py-1
                                  text-[7px]
                                  font-semibold
                                  ${
                                    item.isActive
                                      ? "bg-[#EAF8F0] text-[#249357]"
                                      : "bg-[#FFF0F0] text-[#D85A5A]"
                                  }
                                `}
                              >
                                {item.isActive ? "Active" : "Inactive"}
                              </button>
                            </div>

                            <p className="mt-2 text-[8px] font-semibold text-[#526B96]">
                              {categoryName}
                            </p>

                            <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#7C899B]">
                              {item.description || "No description"}
                            </p>

                            <div className="mt-3 flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5B6A80] hover:bg-[#EEF3FA] hover:text-[#1769F5]"
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteId(item.subCategoryId)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#D85A5A] hover:bg-[#FFF0F0]"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION */}
                <div className="flex items-center justify-between border-t border-[#EDF0F4] px-5 py-4">
                  <p className="text-[9px] text-[#8995A5]">
                    Showing{" "}
                    <span className="font-semibold text-[#4D5C72]">
                      {filteredSubCategories.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-[#4D5C72]">
                      {subcategories.length}
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

        {/* ADD / EDIT MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4">
            <div className="absolute inset-0" onClick={closeModal} />

           <div className="relative flex max-h-[80vh] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">
                <div>
                  <h2 className="text-[15px] font-bold text-[#263650]">
                    {editingSubCategory ? "Edit Subcategory" : "Add Subcategory"}
                  </h2>
                  <p className="mt-1 text-[9px] text-[#8A96A7]">
                    {editingSubCategory ? "Update subcategory information" : "Create a new product subcategory"}
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
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                {Object.keys(fieldErrors).length > 0 && (
                  <div role="alert" className="rounded-xl border border-[#F0D4D4] bg-[#FFF7F7] px-4 py-3">
                    <p className="text-[9px] font-bold text-[#B84A4A]">
                      Please fix the highlighted fields before saving.
                    </p>
                  </div>
                )}

                {/* NAME */}
                <div>
                  <label htmlFor="subcategory-name" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Subcategory Name <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <input
                    id="subcategory-name"
                    type="text"
                    value={name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    placeholder="Example: Rice & Grains"
                    maxLength={100}
                    aria-invalid={Boolean(fieldErrors.name)}
                    className={`h-10 w-full rounded-lg border px-3 text-[11px] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                      fieldErrors.name ? "border-[#EF4444]" : "border-[#DCE2EA]"
                    }`}
                  />

                  {fieldErrors.name && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{fieldErrors.name}</p>
                  )}
                </div>

                {/* CODE */}
                <div>
                  <label htmlFor="subcategory-code" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Subcategory Code <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <input
                    id="subcategory-code"
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
                    }}
                    placeholder="rice-grains"
                    maxLength={50}
                    aria-invalid={Boolean(fieldErrors.code)}
                    className={`h-10 w-full rounded-lg border px-3 font-mono text-[10px] outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                      fieldErrors.code ? "border-[#EF4444]" : "border-[#DCE2EA]"
                    }`}
                  />

                  {fieldErrors.code && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{fieldErrors.code}</p>
                  )}
                </div>

                {/* CATEGORY */}
                <div>
                  <label htmlFor="parent-category" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Parent Category <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <div className="relative">
                    <select
                      id="parent-category"
                      value={categoryId}
                      onChange={(event) => {
                        setCategoryId(event.target.value);
                        setFieldErrors((current) => ({ ...current, categoryId: undefined }));
                      }}
                      aria-invalid={Boolean(fieldErrors.categoryId)}
                      className={`h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-[11px] outline-none focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                        fieldErrors.categoryId ? "border-[#EF4444]" : "border-[#DCE2EA]"
                      }`}
                    >
                      {categories.map((item) => (
                        <option key={item.categoryId} value={item.categoryId}>
                          {item.categoryName}
                        </option>
                      ))}
                    </select>

                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 text-[#8995A5]" />
                  </div>

                  {fieldErrors.categoryId && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{fieldErrors.categoryId}</p>
                  )}
                </div>

                {/* IMAGE UPLOAD */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Image
                  </label>

                  {(imagePreview || existingImage) && (
                    <div className="mb-3 relative inline-block">
                      <img
                        src={imagePreview || existingImage || ""}
                        alt="Subcategory preview"
                        className="h-24 w-24 rounded-lg object-cover border border-[#DCE2EA]"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      id="subcategory-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="subcategory-image"
                      className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#52627A] transition hover:bg-[#F5F7FA]"
                    >
                      <Upload size={14} />
                      Choose Image
                    </label>
                    <span className="text-[9px] text-[#8995A5]">
                      Max 5MB • JPEG, PNG, WebP, GIF
                    </span>
                  </div>

                  {fieldErrors.image && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">{fieldErrors.image}</p>
                  )}
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label htmlFor="subcategory-description" className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Description
                  </label>

                  <textarea
                    id="subcategory-description"
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value.slice(0, 500));
                      setFieldErrors((current) => ({ ...current, description: undefined }));
                    }}
                    placeholder="Enter subcategory description"
                    maxLength={500}
                    rows={4}
                    aria-invalid={Boolean(fieldErrors.description)}
                    className={`w-full resize-none rounded-lg border p-3 text-[11px] leading-5 outline-none placeholder:text-[#9AA5B4] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                      fieldErrors.description ? "border-[#EF4444]" : "border-[#DCE2EA]"
                    }`}
                  />

                  <div className="mt-1 flex items-center justify-between">
                    {fieldErrors.description ? (
                      <p className="text-[8px] font-medium text-[#EF4444]">{fieldErrors.description}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[7px] text-[#9AA5B4]">{description.length}/500</span>
                  </div>
                </div>

                {/* STATUS (Edit only) */}
                {editingSubCategory && (
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
                  onClick={saveSubCategory}
                  disabled={submitting}
                  className="h-9 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingSubCategory
                    ? "Save Changes"
                    : "Create Subcategory"}
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
                  <h2 className="text-[14px] font-bold text-[#263650]">Delete Subcategory?</h2>
                  <p className="mt-1 text-[10px] leading-5 text-[#7B8798]">
                    This action cannot be undone. The subcategory will be removed from the admin list.
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
  onClear,
  onAdd,
}: {
  onClear: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
        <FolderTree size={25} />
      </div>

      <h3 className="mt-4 text-[13px] font-bold text-[#33415A]">No subcategories found</h3>

      <p className="mt-1 max-w-[300px] text-[10px] leading-5 text-[#8995A5]">
        Try changing your search or filters, or create a new subcategory.
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
          Add Subcategory
        </button>
      </div>
    </div>
  );
}