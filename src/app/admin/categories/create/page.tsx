"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  Layers3,
  ImagePlus,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { categoriesApi } from "@/app/api/services";
import { api, extractErrorMessage } from "@/app/api/api";

export default function CreateCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    slug?: string;
    description?: string;
    image?: string;
  }>({});

  /* ============================================================
     GENERATE SLUG
  ============================================================ */

  const handleNameChange = (value: string) => {
    const nextName = value.slice(0, 80);

    setName(nextName);
    setError("");
    setFieldErrors((current) => ({
      ...current,
      name: undefined,
      slug: undefined,
    }));

    setSlug(
      nextName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
    );
  };

  /* ============================================================
     IMAGE HANDLING
  ============================================================ */

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setFieldErrors((current) => ({
      ...current,
      image: undefined,
    }));

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setImageFile(null);
      setImagePreview("");
      setFieldErrors((current) => ({
        ...current,
        image: "Only PNG, JPG and WEBP images are allowed.",
      }));
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageFile(null);
      setImagePreview("");
      setFieldErrors((current) => ({
        ...current,
        image: "Image size must be less than 2 MB.",
      }));
      event.target.value = "";
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      if (img.width < 100 || img.height < 100) {
        URL.revokeObjectURL(imageUrl);
        setImageFile(null);
        setImagePreview("");
        setFieldErrors((current) => ({
          ...current,
          image: "Image must be at least 100 × 100 pixels.",
        }));
        event.target.value = "";
        return;
      }

      if (img.width > 2000 || img.height > 2000) {
        URL.revokeObjectURL(imageUrl);
        setImageFile(null);
        setImagePreview("");
        setFieldErrors((current) => ({
          ...current,
          image: "Image cannot exceed 2000 × 2000 pixels.",
        }));
        event.target.value = "";
        return;
      }

      setImageFile(file);
      setImagePreview(imageUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      setImageFile(null);
      setImagePreview("");
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

  /* ============================================================
     VALIDATE FORM
  ============================================================ */

  const validateForm = () => {
    const nextErrors: {
      name?: string;
      slug?: string;
      description?: string;
      image?: string;
    } = {};

    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase();
    const cleanDescription = description.trim();

    if (!cleanName) {
      nextErrors.name = "Category name is required.";
    } else if (cleanName.length < 2) {
      nextErrors.name = "Category name must be at least 2 characters.";
    } else if (cleanName.length > 80) {
      nextErrors.name = "Category name cannot exceed 80 characters.";
    } else if (!/^[A-Za-z0-9][A-Za-z0-9 &.'()\-]*$/.test(cleanName)) {
      nextErrors.name = "Category name contains invalid characters.";
    }

    if (!cleanSlug) {
      nextErrors.slug = "Category slug is required.";
    } else if (cleanSlug.length < 2) {
      nextErrors.slug = "Category slug must be at least 2 characters.";
    } else if (cleanSlug.length > 80) {
      nextErrors.slug = "Category slug cannot exceed 80 characters.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      nextErrors.slug = "Slug can contain only lowercase letters, numbers and hyphens.";
    }

    if (cleanDescription.length > 300) {
      nextErrors.description = "Description cannot exceed 300 characters.";
    } else if (cleanDescription && cleanDescription.length < 5) {
      nextErrors.description = "Description must be at least 5 characters.";
    }

    // Image is required for new category
    if (!imageFile) {
      nextErrors.image = "Category image is required.";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please correct the highlighted fields before creating the category.");
      return false;
    }

    setError("");
    return true;
  };

  /* ============================================================
     CREATE CATEGORY
  ============================================================ */

  const handleCreate = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase();
    const cleanDescription = description.trim();

    try {
      // Create FormData for multipart upload (using categoriesApi which handles Content-Type automatically)
      const formData = new FormData();
      formData.append("categoryCode", cleanSlug);
      formData.append("categoryName", cleanName);
      formData.append("description", cleanDescription);
      formData.append("hasSubCategory", "false");
      formData.append("isActive", status === "Active" ? "true" : "false");
      formData.append("image", imageFile as File);

      await categoriesApi.create(formData);

      setSaved(true);

      setTimeout(() => {
        router.push("/admin/categories");
      }, 1000);
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to create category.");
      setError(message);
      console.error("Error creating category:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-[#E4E8EF] bg-white px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/admin/categories")}
          aria-label="Back to categories"
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] transition hover:bg-[#F1F4F8] hover:text-[#173B7A]"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
            Create Category
          </h1>
          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Add a new product category
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/categories")}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F1F4F8]"
          aria-label="Close"
        >
          <X size={19} />
        </button>
      </header>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <main className="mx-auto w-full max-w-[1050px] p-4 sm:p-6 lg:p-8">
        {/* BREADCRUMB */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-[9px] text-[#8A96A7]">
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
            onClick={() => router.push("/admin/categories")}
            className="hover:text-[#1769F5]"
          >
            Categories
          </button>
          <span>/</span>
          <span className="font-medium text-[#566579]">Create</span>
        </div>

        {/* ====================================================
            FORM
        ===================================================== */}

        <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
          {/* ==================================================
              LEFT FORM
          =================================================== */}

          <section className="rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
            {/* FORM HEADER */}
            <div className="border-b border-[#EDF0F4] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#3260B4]">
                  <Layers3 size={19} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-[#263650]">
                    Category Information
                  </h2>
                  <p className="mt-1 text-[9px] text-[#8995A5]">
                    Enter the basic details for this category.
                  </p>
                </div>
              </div>
            </div>

            {/* FORM */}
            <div className="space-y-5 p-5 sm:p-6">
              {/* CATEGORY NAME */}
              <div>
                <label
                  htmlFor="category-name"
                  className="mb-1.5 block text-[10px] font-semibold text-[#52627A]"
                >
                  Category Name
                  <span className="ml-1 text-[#EF4444]">*</span>
                </label>

                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="Example: Grocery & Staples"
                  aria-invalid={!!fieldErrors.name}
                  maxLength={80}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-[11px] text-[#263650] outline-none placeholder:text-[#A0AAB8] transition focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                    fieldErrors.name
                      ? "border-[#EF4444] bg-[#FFF8F8]"
                      : "border-[#DCE2EA]"
                  }`}
                />

                {fieldErrors.name && (
                  <p className="mt-1.5 text-[8px] font-medium text-[#EF4444]">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* SLUG */}
              <div>
                <label
                  htmlFor="category-slug"
                  className="mb-1.5 block text-[10px] font-semibold text-[#52627A]"
                >
                  Category Slug
                  <span className="ml-1 text-[#EF4444]">*</span>
                </label>

                <input
                  id="category-slug"
                  type="text"
                  value={slug}
                  onChange={(event) => {
                    setSlug(
                      event.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                        .replace(/-+/g, "-")
                        .slice(0, 80)
                    );
                    setError("");
                    setFieldErrors((current) => ({
                      ...current,
                      slug: undefined,
                    }));
                  }}
                  placeholder="grocery-staples"
                  aria-invalid={!!fieldErrors.slug}
                  maxLength={80}
                  className={`h-11 w-full rounded-lg border bg-white px-3 font-mono text-[10px] text-[#263650] outline-none placeholder:text-[#A0AAB8] transition focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                    fieldErrors.slug
                      ? "border-[#EF4444] bg-[#FFF8F8]"
                      : "border-[#DCE2EA]"
                  }`}
                />

                {fieldErrors.slug ? (
                  <p className="mt-1.5 text-[8px] font-medium text-[#EF4444]">
                    {fieldErrors.slug}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[8px] text-[#9AA4B2]">
                    Used in the category URL.
                  </p>
                )}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label
                  htmlFor="category-description"
                  className="mb-1.5 block text-[10px] font-semibold text-[#52627A]"
                >
                  Description
                </label>

                <textarea
                  id="category-description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value.slice(0, 300));
                    setError("");
                    setFieldErrors((current) => ({
                      ...current,
                      description: undefined,
                    }));
                  }}
                  placeholder="Enter a short description for this category..."
                  rows={5}
                  maxLength={300}
                  aria-invalid={!!fieldErrors.description}
                  className={`w-full resize-none rounded-lg border bg-white p-3 text-[11px] leading-5 text-[#263650] outline-none placeholder:text-[#A0AAB8] transition focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10 ${
                    fieldErrors.description
                      ? "border-[#EF4444] bg-[#FFF8F8]"
                      : "border-[#DCE2EA]"
                  }`}
                />

                <div className="mt-1 flex items-start justify-between gap-2">
                  {fieldErrors.description ? (
                    <p className="text-[8px] font-medium text-[#EF4444]">
                      {fieldErrors.description}
                    </p>
                  ) : (
                    <span className="text-[8px] text-transparent">.</span>
                  )}
                  <p className="text-[8px] text-[#A0AAB8]">
                    {description.length}/300
                  </p>
                </div>
              </div>

              {/* STATUS */}
              <div>
                <p className="mb-2 text-[10px] font-semibold text-[#52627A]">
                  Status
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus("Active")}
                    className={`
                      rounded-lg
                      border
                      px-4
                      py-3
                      text-left
                      transition
                      ${
                        status === "Active"
                          ? "border-[#8ACDA8] bg-[#F0FBF4]"
                          : "border-[#E1E6ED] bg-white hover:bg-[#FAFBFD]"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          status === "Active"
                            ? "bg-[#249357]"
                            : "bg-[#B7C0CC]"
                        }`}
                      />
                      <span className="text-[10px] font-semibold text-[#33415A]">
                        Active
                      </span>
                    </div>
                    <p className="mt-1.5 text-[8px] text-[#8995A5]">
                      Category visible to customers.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus("Inactive")}
                    className={`
                      rounded-lg
                      border
                      px-4
                      py-3
                      text-left
                      transition
                      ${
                        status === "Inactive"
                          ? "border-[#E3A2A2] bg-[#FFF6F6]"
                          : "border-[#E1E6ED] bg-white hover:bg-[#FAFBFD]"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          status === "Inactive"
                            ? "bg-[#D85A5A]"
                            : "bg-[#B7C0CC]"
                        }`}
                      />
                      <span className="text-[10px] font-semibold text-[#33415A]">
                        Inactive
                      </span>
                    </div>
                    <p className="mt-1.5 text-[8px] text-[#8995A5]">
                      Category hidden from customers.
                    </p>
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-[#FFF2F2] px-3 py-2.5">
                  <AlertCircle
                    size={15}
                    className="shrink-0 text-[#DC4B4B]"
                  />
                  <p className="text-[9px] font-medium text-[#C43E3E]">
                    {error}
                  </p>
                </div>
              )}

              {/* SUCCESS */}
              {saved && (
                <div className="flex items-center gap-2 rounded-lg bg-[#EAF8F0] px-3 py-2.5">
                  <CheckCircle2
                    size={15}
                    className="shrink-0 text-[#249357]"
                  />
                  <p className="text-[9px] font-semibold text-[#249357]">
                    Category created successfully.
                  </p>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col-reverse gap-2 border-t border-[#EDF0F4] bg-[#FAFBFD] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => router.push("/admin/categories")}
                className="h-10 rounded-lg border border-[#DCE2EA] bg-white px-5 text-[10px] font-semibold text-[#647287] transition hover:bg-[#F5F7FA]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={saved || submitting}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={14} />
                {submitting ? "Creating..." : "Create Category"}
              </button>
            </div>
          </section>

          {/* ==================================================
              RIGHT SIDE
          =================================================== */}

          <aside className="space-y-5">
            {/* IMAGE */}
            <section className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">
              <h2 className="text-[12px] font-bold text-[#263650]">
                Category Image <span className="text-[#EF4444]">*</span>
              </h2>
              <p className="mt-1 text-[9px] text-[#8995A5]">
                Upload an image for the category.
              </p>

              <label
                htmlFor="category-image"
                className={`mt-4 flex aspect-[1.7] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
                  fieldErrors.image
                    ? "border-[#EF4444] bg-[#FFF8F8]"
                    : "border-[#DCE3EC] bg-[#FAFBFD] hover:border-[#7FA4E4] hover:bg-[#F5F8FF]"
                }`}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Category preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#4773C5]">
                      <ImagePlus size={20} />
                    </div>
                    <p className="mt-3 text-[9px] font-semibold text-[#52627A]">
                      Upload Image
                    </p>
                    <p className="mt-1 text-[8px] text-[#9AA4B2]">
                      PNG, JPG or WEBP
                    </p>
                  </div>
                )}

                <input
                  id="category-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {fieldErrors.image && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#FFF2F2] px-3 py-2.5">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-[#DC4B4B]"
                  />
                  <p className="text-[8px] font-medium leading-4 text-[#C43E3E]">
                    {fieldErrors.image}
                  </p>
                </div>
              )}

              {imagePreview && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="mt-3 text-[9px] font-semibold text-[#DC4B4B] hover:underline"
                >
                  Remove Image
                </button>
              )}

              <p className="mt-2 text-[8px] text-[#9AA4B2]">
                Maximum 2 MB · PNG, JPG or WEBP · 100×100 to 2000×2000 pixels
              </p>
            </section>

            {/* PREVIEW */}
            <section className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">
              <h2 className="text-[12px] font-bold text-[#263650]">
                Preview
              </h2>

              <div className="mt-4 rounded-xl border border-[#E5EAF1] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#EDF3FF] text-[#4773C5]">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Layers3 size={18} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold text-[#33415A]">
                      {name || "Category Name"}
                    </p>
                    <p className="mt-1 truncate font-mono text-[8px] text-[#8995A5]">
                      /{slug || "category-slug"}
                    </p>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-[8px] leading-4 text-[#7D899A]">
                  {description || "Category description will appear here."}
                </p>

                <div className="mt-3">
                  <span
                    className={`
                      rounded-full
                      px-2
                      py-1
                      text-[7px]
                      font-semibold
                      ${
                        status === "Active"
                          ? "bg-[#EAF8F0] text-[#249357]"
                          : "bg-[#FFF0F0] text-[#D85A5A]"
                      }
                    `}
                  >
                    {status}
                  </span>
                </div>
              </div>
            </section>

            {/* TIP */}
            <section className="rounded-xl border border-[#D7E5FF] bg-[#F2F7FF] p-4">
              <p className="text-[9px] font-semibold text-[#365B9F]">
                Category tip
              </p>
              <p className="mt-1.5 text-[8px] leading-4 text-[#71809A]">
                Use a clear category name, a short description, and an eye-catching
                image so customers can easily understand the products included in
                this category.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}