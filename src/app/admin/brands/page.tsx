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
  Eye,
  Tag,
  Package,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  ArrowLeft,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import StatCard from "@/app/components/Admin/StatCard";
import { api, extractErrorMessage } from "@/app/api/api";
import { brandsApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type Brand = {
  brandId: string;
  brandName: string;
  description: string;
  isOnSale: boolean;
  status: number; // 0 = Active, 1 = Inactive
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
};

type BrandApiResponse = {
  items: Brand[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

type CreateBrandPayload = {
  brandName: string;
  description: string;
  isOnSale: boolean;
  status: number;
};

type UpdateBrandPayload = {
  brandName: string;
  description: string;
  isOnSale: boolean;
  status: number;
};

type BrandErrors = {
  brandName?: string;
  description?: string;
  logo?: string;
};

/* =========================================================
   VALIDATION CONSTANTS
========================================================= */

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MIN_LOGO_WIDTH = 100;
const MIN_LOGO_HEIGHT = 100;
const MAX_LOGO_WIDTH = 2000;
const MAX_LOGO_HEIGHT = 2000;

const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

/* =========================================================
   MAIN PAGE
========================================================= */

export default function BrandsAdminPage() {
  const router = useRouter();

  /* =======================================================
     DATA
  ======================================================== */

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     FILTERS
  ======================================================== */

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  /* =======================================================
     MODAL
  ======================================================== */

  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  /* =======================================================
     DELETE
  ======================================================== */

  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* =======================================================
     SHELF (#49 brand products, paginated)
  ======================================================== */

  type ShelfProduct = {
    productId: string;
    sku: string;
    productName: string;
    price: number;
    mrp: number;
    status: string;
  };

  const SHELF_PAGE_SIZE = 10;

  const [shelfBrand, setShelfBrand] = useState<Brand | null>(null);
  const [shelfItems, setShelfItems] = useState<ShelfProduct[]>([]);
  const [shelfPage, setShelfPage] = useState(1);
  const [shelfTotalPages, setShelfTotalPages] = useState(1);
  const [shelfTotal, setShelfTotal] = useState(0);
  const [shelfLoading, setShelfLoading] = useState(false);
  const [shelfError, setShelfError] = useState("");

  const fetchShelf = async (brand: Brand, page: number) => {
    setShelfLoading(true);
    setShelfError("");
    try {
      const response = await brandsApi.products(
        brand.brandId,
        page,
        SHELF_PAGE_SIZE
      );
      const payload: any = (response as any)?.data ?? response;
      const rawItems: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      setShelfItems(
        rawItems.map((raw: any) => ({
          productId: String(raw.productId ?? raw.id ?? ""),
          sku: String(raw.sku ?? raw.skuCode ?? ""),
          productName: String(raw.productName ?? raw.name ?? "Product"),
          price: Number(raw.unitPrice ?? raw.price ?? 0),
          mrp: Number(raw.mrp ?? 0),
          status: String(raw.status ?? ""),
        }))
      );
      setShelfTotal(Number(payload?.totalCount ?? rawItems.length));
      setShelfTotalPages(
        Number(payload?.totalPages ?? (rawItems.length > 0 ? 1 : 0)) || 1
      );
      setShelfPage(Number(payload?.page ?? page));
    } catch (error) {
      console.error("Unable to load brand products:", error);
      setShelfItems([]);
      setShelfError(
        extractErrorMessage(error, "Failed to load brand products.")
      );
    } finally {
      setShelfLoading(false);
    }
  };

  const openShelf = (brand: Brand) => {
    setShelfBrand(brand);
    setShelfItems([]);
    setShelfPage(1);
    setShelfTotalPages(1);
    setShelfTotal(0);
    setShelfError("");
    fetchShelf(brand, 1);
  };

  /* =======================================================
     FORM
  ======================================================== */

  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [isOnSale, setIsOnSale] = useState(false);
  const [status, setStatus] = useState<number>(0); // 0 = Active, 1 = Inactive
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");

  /* =======================================================
     VALIDATION
  ======================================================== */

  const [errors, setErrors] = useState<BrandErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* =======================================================
     FETCH BRANDS
  ======================================================== */

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<BrandApiResponse>("/api/admin/brands");
      setBrands(response.data.items || []);
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to load brands.");
      setError(message);
      console.error("Error fetching brands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  /* =======================================================
     FILTER
  ======================================================== */

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();

    return brands.filter((brand) => {
      const matchesSearch =
        !query ||
        brand.brandName.toLowerCase().includes(query) ||
        brand.description?.toLowerCase().includes(query) ||
        brand.brandId.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && brand.status === 0) ||
        (statusFilter === "Inactive" && brand.status === 1);

      return matchesSearch && matchesStatus;
    });
  }, [brands, search, statusFilter]);

  /* =======================================================
     STATS
  ======================================================== */

  const activeCount = brands.filter((brand) => brand.status === 0).length;
  const inactiveCount = brands.filter((brand) => brand.status === 1).length;
  const onSaleCount = brands.filter((brand) => brand.isOnSale).length;

  /* =======================================================
     OPEN ADD MODAL
  ======================================================== */

  const openAddModal = () => {
    setEditingBrand(null);
    setBrandName("");
    setDescription("");
    setIsOnSale(false);
    setStatus(0);
    setLogo("");
    setLogoFile(null);
    setExistingImageUrl("");
    setErrors({});
    setFormError("");
    setShowModal(true);
  };

  /* =======================================================
     OPEN EDIT MODAL
  ======================================================== */

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandName(brand.brandName);
    setDescription(brand.description || "");
    setIsOnSale(brand.isOnSale);
    setStatus(brand.status);
    setLogo("");
    setLogoFile(null);
    setExistingImageUrl(brand.imageUrl || "");
    setErrors({});
    setFormError("");
    setShowModal(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================== */

  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);
    setBrandName("");
    setDescription("");
    setIsOnSale(false);
    setStatus(0);
    setLogo("");
    setLogoFile(null);
    setExistingImageUrl("");
    setErrors({});
    setFormError("");
    setSubmitting(false);
  };

  /* =======================================================
     DESCRIPTION CHANGE
  ======================================================== */

  const handleDescriptionChange = (value: string) => {
    setDescription(value.slice(0, MAX_DESCRIPTION_LENGTH));
    setErrors((current) => ({
      ...current,
      description: undefined,
    }));
    setFormError("");
  };

  /* =======================================================
     LOGO CHANGE
  ======================================================== */

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // FILE TYPE
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogo("");
      setLogoFile(null);
      setErrors((current) => ({
        ...current,
        logo: "Only PNG, JPG and WEBP images are allowed.",
      }));
      event.target.value = "";
      return;
    }

    // FILE SIZE
    if (file.size > MAX_LOGO_SIZE) {
      setLogo("");
      setLogoFile(null);
      setErrors((current) => ({
        ...current,
        logo: "Logo size must be less than 2 MB.",
      }));
      event.target.value = "";
      return;
    }

    // IMAGE VALIDATION
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      if (image.width < MIN_LOGO_WIDTH || image.height < MIN_LOGO_HEIGHT) {
        URL.revokeObjectURL(objectUrl);
        setLogo("");
        setLogoFile(null);
        setErrors((current) => ({
          ...current,
          logo: "Logo must be at least 100 × 100 pixels.",
        }));
        event.target.value = "";
        return;
      }

      if (image.width > MAX_LOGO_WIDTH || image.height > MAX_LOGO_HEIGHT) {
        URL.revokeObjectURL(objectUrl);
        setLogo("");
        setLogoFile(null);
        setErrors((current) => ({
          ...current,
          logo: "Logo cannot exceed 2000 × 2000 pixels.",
        }));
        event.target.value = "";
        return;
      }

      setLogo(objectUrl);
      setLogoFile(file);
      setErrors((current) => ({
        ...current,
        logo: undefined,
      }));
      setFormError("");
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setLogo("");
      setLogoFile(null);
      setErrors((current) => ({
        ...current,
        logo: "Unable to read this image.",
      }));
      event.target.value = "";
    };

    image.src = objectUrl;
  };

  /* =======================================================
     REMOVE LOGO
  ======================================================== */

  const removeLogo = () => {
    if (logo) {
      URL.revokeObjectURL(logo);
    }
    setLogo("");
    setLogoFile(null);
    setExistingImageUrl("");
    setErrors((current) => ({
      ...current,
      logo: undefined,
    }));
    setFormError("");
  };

  /* =======================================================
     VALIDATE BRAND
  ======================================================== */

  const validateBrand = (): boolean => {
    const newErrors: BrandErrors = {};
    const cleanName = brandName.trim();
    const cleanDescription = description.trim();

    // BRAND NAME
    if (!cleanName) {
      newErrors.brandName = "Brand name is required.";
    } else if (cleanName.length < 2) {
      newErrors.brandName = "Brand name must be at least 2 characters.";
    } else if (cleanName.length > MAX_NAME_LENGTH) {
      newErrors.brandName = `Brand name cannot exceed ${MAX_NAME_LENGTH} characters.`;
    }

    // DESCRIPTION
    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;
    }

    // LOGO (required for new brands)
    if (!editingBrand && !logoFile) {
      newErrors.logo = "Brand logo is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setFormError("Please correct the highlighted fields before saving.");
      return false;
    }

    setFormError("");
    return true;
  };

  /* =======================================================
     SAVE BRAND
  ======================================================== */

  const saveBrand = async () => {
    if (!validateBrand()) {
      return;
    }

    setSubmitting(true);

    try {
      if (editingBrand) {
        // UPDATE — single multipart PUT (logo replace); JSON when no file.
        if (logoFile) {
          const formData = new FormData();
          formData.append("BrandName", brandName.trim());
          formData.append("Description", description.trim());
          formData.append("IsOnSale", String(isOnSale));
          formData.append("Status", String(status));
          formData.append("Image", logoFile);
          await brandsApi.update(editingBrand.brandId, formData);
        } else {
          // UPDATE - PUT request
          const payload: UpdateBrandPayload = {
            brandName: brandName.trim(),
            description: description.trim(),
            isOnSale: isOnSale,
            status: status,
          };

          await api.put(`/api/admin/brands/${editingBrand.brandId}`, payload);
        }
      } else {
        // CREATE - POST with FormData
        const formData = new FormData();
        formData.append("BrandName", brandName.trim());
        formData.append("Description", description.trim());
        formData.append("IsOnSale", String(isOnSale));
        formData.append("Status", String(status));

        if (logoFile) {
          formData.append("Image", logoFile);
        }

        await api.post("/api/admin/brands", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      closeModal();
      fetchBrands();
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to save brand.");
      setFormError(message);
      console.error("Error saving brand:", err);
      setSubmitting(false);
    }
  };

  /* =======================================================
     TOGGLE STATUS
  ======================================================== */

  const toggleStatus = async (id: string, currentStatus: number) => {
    try {
      const brand = brands.find((b) => b.brandId === id);
      if (!brand) return;

      const payload: UpdateBrandPayload = {
        brandName: brand.brandName,
        description: brand.description || "",
        isOnSale: brand.isOnSale,
        status: currentStatus === 0 ? 1 : 0,
      };

      await api.put(`/api/admin/brands/${id}`, payload);
      fetchBrands();
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to update brand status.");
      console.error("Error toggling status:", err);
    }
  };

  /* =======================================================
     TOGGLE SALE
  ======================================================== */

  const toggleSale = async (id: string, currentSaleStatus: boolean) => {
    try {
      const brand = brands.find((b) => b.brandId === id);
      if (!brand) return;

      const payload: UpdateBrandPayload = {
        brandName: brand.brandName,
        description: brand.description || "",
        isOnSale: !currentSaleStatus,
        status: brand.status,
      };

      await api.put(`/api/admin/brands/${id}`, payload);
      fetchBrands();
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to update brand sale status.");
      console.error("Error toggling sale:", err);
    }
  };

  /* =======================================================
     DELETE
  ======================================================== */

  const confirmDelete = async () => {
    if (deleteId === null) {
      return;
    }

    try {
      await api.delete(`/api/admin/brands/${deleteId}`);
      setDeleteId(null);
      fetchBrands();
    } catch (err) {
      const message = extractErrorMessage(err, "Failed to delete brand.");
      console.error("Error deleting brand:", err);
      setDeleteId(null);
    }
  };

  /* =======================================================
     RETURN
  ======================================================== */

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
                  Brands
                </h1>

                <p className="mt-1 text-[10px] text-[#8995A5]">
                  Manage product brands
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1769F5] px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#0F5BDE]"
            >
              <Plus size={16} />
              <span>Add Brand</span>
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

            <span className="font-medium text-[#566579]">
              Brands
            </span>

          </div>

          {/* =================================================
              ERROR STATE
          ================================================== */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[11px] text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchBrands}
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

            <StatCard
              title="Total Brands"
              value={brands.length}
              icon={<Tag size={17} />}
            />

            <StatCard
              title="Active"
              value={activeCount}
              icon={<Check size={17} />}
              iconClassName="text-[#249357]"
              iconBgClassName="bg-[#EAF8F0]"
            />

            <StatCard
              title="Inactive"
              value={inactiveCount}
              icon={<X size={17} />}
              iconClassName="text-[#D85A5A]"
              iconBgClassName="bg-[#FFF0F0]"
            />

            <StatCard
              title="On Sale"
              value={onSaleCount}
              icon={<Tag size={17} />}
              iconClassName="text-[#1769F5]"
              iconBgClassName="bg-[#EDF3FF]"
            />

          </section>

          {/* =================================================
              SEARCH + FILTER
          ================================================== */}

          <section className="mt-6 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm sm:p-5">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 sm:max-w-[420px]">

                <Search size={16} className="text-[#8995A5]" />

                <input
                  type="search"
                  value={search}
                  maxLength={100}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search brands..."
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
                        ${statusFilter === status
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

          {/* =================================================
              TABLE
          ================================================== */}

          <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

              <div>

                <h2 className="text-[13px] font-bold text-[#263650]">
                  All Brands
                </h2>

                <p className="mt-1 text-[9px] text-[#8A96A7]">
                  {loading ? "Loading..." : `${filteredBrands.length} brands found`}
                </p>

              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="hidden items-center gap-1.5 text-[9px] font-semibold text-[#1769F5] hover:underline sm:flex"
              >
                <Plus size={13} />
                New Brand
              </button>

            </div>

            {/* LOADING */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E4E8EF] border-t-[#1769F5]" />
              </div>
            ) : filteredBrands.length === 0 ? (
              <EmptyState
                onClear={() => {
                  setSearch("");
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
                          Brand
                        </th>

                        <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                          Sale
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

                      {filteredBrands.map((brand) => (
                        <tr
                          key={brand.brandId}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                                {brand.imageUrl ? (
                                  <img
                                    src={brand.imageUrl}
                                    alt={brand.brandName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Tag size={18} />
                                )}
                              </div>

                              <div>

                                <p className="text-[11px] font-bold text-[#33415A]">
                                  {brand.brandName}
                                </p>

                                <p className="mt-1 max-w-[260px] truncate text-[9px] text-[#8B96A5]">
                                  {brand.description || "No description"}
                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-5 py-4">

                            <button
                              type="button"
                              onClick={() => toggleSale(brand.brandId, brand.isOnSale)}
                              className={`
                                rounded-full
                                px-2.5
                                py-1
                                text-[8px]
                                font-semibold
                                ${brand.isOnSale
                                  ? "bg-[#EDF3FF] text-[#1769F5]"
                                  : "bg-[#F3F5F8] text-[#69778B]"
                                }
                              `}
                            >
                              {brand.isOnSale ? "On Sale" : "Not on Sale"}
                            </button>

                          </td>

                          <td className="px-5 py-4">

                            <button
                              type="button"
                              onClick={() => toggleStatus(brand.brandId, brand.status)}
                              className={`
                                rounded-full
                                px-2.5
                                py-1
                                text-[8px]
                                font-semibold
                                ${brand.status === 0
                                  ? "bg-[#EAF8F0] text-[#249357]"
                                  : "bg-[#FFF0F0] text-[#D85A5A]"
                                }
                              `}
                            >
                              {brand.status === 0 ? "Active" : "Inactive"}
                            </button>

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1">

                              <ActionButton
                                label="Products"
                                onClick={() => openShelf(brand)}
                              >
                                <Package size={14} />
                              </ActionButton>

                              <ActionButton
                                label="Edit"
                                onClick={() => openEditModal(brand)}
                              >
                                <Pencil size={14} />
                              </ActionButton>

                              <ActionButton
                                label="Delete"
                                danger
                                onClick={() => setDeleteId(brand.brandId)}
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

                  {filteredBrands.map((brand) => (
                    <div key={brand.brandId} className="p-4">

                      <div className="flex gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                          {brand.imageUrl ? (
                            <img
                              src={brand.imageUrl}
                              alt={brand.brandName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Tag size={18} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div>

                              <p className="text-[11px] font-bold text-[#33415A]">
                                {brand.brandName}
                              </p>

                              <p className="mt-1 text-[8px] text-[#8A96A7]">
                                {brand.isOnSale ? "On Sale" : "Not on Sale"}
                              </p>

                            </div>

                            <button
                              type="button"
                              onClick={() => toggleStatus(brand.brandId, brand.status)}
                              className={`
                                rounded-full
                                px-2
                                py-1
                                text-[7px]
                                font-semibold
                                ${brand.status === 0
                                  ? "bg-[#EAF8F0] text-[#249357]"
                                  : "bg-[#FFF0F0] text-[#D85A5A]"
                                }
                              `}
                            >
                              {brand.status === 0 ? "Active" : "Inactive"}
                            </button>

                          </div>

                          <p className="mt-2 text-[9px] leading-4 text-[#7C899B]">
                            {brand.description || "No description"}
                          </p>

                          <div className="mt-3 flex items-center justify-end gap-1">

                            <button
                              type="button"
                              onClick={() => openShelf(brand)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5B6A80] hover:bg-[#EEF3FA] hover:text-[#1769F5]"
                              aria-label="View brand products"
                            >
                              <Package size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(brand)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5B6A80] hover:bg-[#EEF3FA] hover:text-[#1769F5]"
                              aria-label="Edit brand"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteId(brand.brandId)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#D85A5A] hover:bg-[#FFF0F0]"
                              aria-label="Delete brand"
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
                    <span className="font-semibold text-[#4D5C72]">
                      {filteredBrands.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-[#4D5C72]">
                      {brands.length}
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

        {/* =================================================
            ADD / EDIT MODAL
        ================================================== */}

        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

            <button
              type="button"
              aria-label="Close modal"
              className="absolute inset-0 cursor-default"
              onClick={closeModal}
            />

            <div className="relative max-h-[92vh] w-full max-w-[500px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

                <div>

                  <h2 className="text-[15px] font-bold text-[#263650]">
                    {editingBrand ? "Edit Brand" : "Add Brand"}
                  </h2>

                  <p className="mt-1 text-[9px] text-[#8A96A7]">
                    {editingBrand ? "Update brand information" : "Create a new product brand"}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

              </div>

              {/* BODY */}
              <div className="space-y-4 p-5">

                {/* NAME */}
                <div>

                  <label
                    htmlFor="brand-name"
                    className="mb-1.5 block text-[10px] font-semibold text-[#52627A]"
                  >
                    Brand Name
                    <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <input
                    id="brand-name"
                    type="text"
                    value={brandName}
                    maxLength={MAX_NAME_LENGTH}
                    onChange={(event) => {
                      setBrandName(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        brandName: undefined,
                      }));
                      setFormError("");
                    }}
                    placeholder="Example: Aashirvaad"
                    aria-invalid={!!errors.brandName}
                    className={`h-10 w-full rounded-lg border px-3 text-[11px] outline-none placeholder:text-[#9AA5B4] ${
                      errors.brandName
                        ? "border-[#EF4444] bg-[#FFF8F8]"
                        : "border-[#DCE2EA] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10"
                    }`}
                  />

                  <div className="mt-1 flex items-start justify-between gap-2">

                    {errors.brandName ? (
                      <p className="text-[8px] font-medium text-[#EF4444]">
                        {errors.brandName}
                      </p>
                    ) : (
                      <p className="text-[7px] text-[#A0AAB8]">
                        2–100 characters
                      </p>
                    )}

                    <span className="shrink-0 text-[7px] text-[#A0AAB8]">
                      {brandName.length}/{MAX_NAME_LENGTH}
                    </span>

                  </div>

                </div>

                {/* DESCRIPTION */}
                <div>

                  <label
                    htmlFor="brand-description"
                    className="mb-1.5 block text-[10px] font-semibold text-[#52627A]"
                  >
                    Description
                  </label>

                  <textarea
                    id="brand-description"
                    value={description}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    onChange={(event) => handleDescriptionChange(event.target.value)}
                    placeholder="Enter brand description"
                    rows={4}
                    aria-invalid={!!errors.description}
                    className={`w-full resize-none rounded-lg border p-3 text-[11px] leading-5 outline-none placeholder:text-[#9AA5B4] ${
                      errors.description
                        ? "border-[#EF4444] bg-[#FFF8F8]"
                        : "border-[#DCE2EA] focus:border-[#1769F5] focus:ring-2 focus:ring-[#1769F5]/10"
                    }`}
                  />

                  <div className="mt-1 flex items-start justify-between gap-2">

                    {errors.description ? (
                      <p className="text-[8px] font-medium text-[#EF4444]">
                        {errors.description}
                      </p>
                    ) : (
                      <p className="text-[7px] text-[#A0AAB8]">
                        Optional
                      </p>
                    )}

                    <span className="shrink-0 text-[7px] text-[#A0AAB8]">
                      {description.length}/{MAX_DESCRIPTION_LENGTH}
                    </span>

                  </div>

                </div>

                {/* LOGO */}
                <div>

                  <label
                    htmlFor="brand-logo"
                    className="mb-1.5 block text-[10px] font-semibold text-[#52627A]"
                  >
                    Brand Logo {!editingBrand && <span className="ml-1 text-[#EF4444]">*</span>}
                  </label>

                  <label
                    htmlFor="brand-logo"
                    className={`flex h-[130px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-[#FAFBFD] transition ${
                      errors.logo
                        ? "border-[#EF4444] bg-[#FFF8F8]"
                        : "border-[#DCE2EA] hover:border-[#8AA9DE]"
                    }`}
                  >

                    {(logo || existingImageUrl) ? (
                      <img
                        src={logo || existingImageUrl}
                        alt="Brand logo preview"
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <div className="text-center">

                        <ImagePlus size={24} className="mx-auto text-[#8090A6]" />

                        <p className="mt-2 text-[9px] font-semibold text-[#66748B]">
                          Upload Brand Logo
                        </p>

                        <p className="mt-1 text-[8px] text-[#9AA5B4]">
                          PNG, JPG or WEBP
                        </p>

                      </div>
                    )}

                    <input
                      id="brand-logo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                    />

                  </label>

                  {errors.logo && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.logo}
                    </p>
                  )}

                  <p className="mt-1 text-[7px] text-[#A0AAB8]">
                    Maximum 2 MB · PNG, JPG or WEBP · 100×100 to 2000×2000 pixels
                  </p>

                  {(logo || existingImageUrl) && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="mt-2 text-[9px] font-semibold text-[#DC4B4B] hover:underline"
                    >
                      Remove Logo
                    </button>
                  )}

                </div>

                {/* IS ON SALE */}
                <div>

                  <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Sale Status
                  </label>

                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                      <input
                        type="radio"
                        checked={isOnSale === true}
                        onChange={() => setIsOnSale(true)}
                        className="h-4 w-4 accent-[#1769F5]"
                      />
                      On Sale
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                      <input
                        type="radio"
                        checked={isOnSale === false}
                        onChange={() => setIsOnSale(false)}
                        className="h-4 w-4 accent-[#1769F5]"
                      />
                      Not on Sale
                    </label>
                  </div>

                </div>

                {/* STATUS */}
                <div>

                  <label className="mb-1.5 block text-[10px] font-semibold text-[#52627A]">
                    Status
                  </label>

                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                      <input
                        type="radio"
                        checked={status === 0}
                        onChange={() => setStatus(0)}
                        className="h-4 w-4 accent-[#1769F5]"
                      />
                      Active
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#263650]">
                      <input
                        type="radio"
                        checked={status === 1}
                        onChange={() => setStatus(1)}
                        className="h-4 w-4 accent-[#1769F5]"
                      />
                      Inactive
                    </label>
                  </div>

                </div>

                {/* VALIDATION SUMMARY */}
                {formError && (
                  <div className="rounded-lg border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">
                    <p className="text-[9px] font-semibold text-[#DC2626]">{formError}</p>
                  </div>
                )}

              </div>

              {/* FOOTER */}
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
                  onClick={saveBrand}
                  disabled={submitting}
                  className="h-9 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingBrand
                    ? "Save Changes"
                    : "Create Brand"}
                </button>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            DELETE MODAL
        ================================================== */}

        {deleteId !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

            <button
              type="button"
              aria-label="Close delete dialog"
              className="absolute inset-0 cursor-default"
              onClick={() => setDeleteId(null)}
            />

            <div className="relative w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-2xl">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D85A5A]">

                  <Trash2 size={18} />

                </div>

                <div>

                  <h2 className="text-[14px] font-bold text-[#263650]">
                    Delete Brand?
                  </h2>

                  <p className="mt-1 text-[10px] leading-5 text-[#7B8798]">
                    This action cannot be undone. The brand will be removed from the admin list.
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

        {/* =================================================
            SHELF DRAWER (#49)
        ================================================== */}

        {shelfBrand !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

            <button
              type="button"
              aria-label="Close shelf"
              className="absolute inset-0 cursor-default"
              onClick={() => setShelfBrand(null)}
            />

            <div className="relative w-full max-w-[560px] rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                    <Package size={18} />
                  </div>

                  <div>

                    <h2 className="text-[14px] font-bold text-[#263650]">
                      {shelfBrand.brandName}
                    </h2>

                    <p className="mt-1 text-[9px] text-[#8A96A7]">
                      {shelfLoading
                        ? "Loading products..."
                        : `${shelfTotal} product${shelfTotal === 1 ? "" : "s"}`}
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => setShelfBrand(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

              </div>

              <div className="max-h-[50vh] overflow-y-auto p-5">

                {shelfLoading && (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E4E8EF] border-t-[#1769F5]" />
                  </div>
                )}

                {!shelfLoading && shelfError && (
                  <p role="alert" className="rounded-lg bg-[#FFF2F2] px-3 py-2.5 text-[9px] font-medium text-[#C43E3E]">
                    {shelfError}
                  </p>
                )}

                {!shelfLoading && !shelfError && shelfItems.length === 0 && (
                  <p className="py-10 text-center text-[11px] text-[#8995A5]">
                    No products under this brand.
                  </p>
                )}

                {!shelfLoading && !shelfError && shelfItems.length > 0 && (
                  <div className="divide-y divide-[#EDF0F4]">
                    {shelfItems.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3 py-3">

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-[11px] font-bold text-[#33415A]">
                            {item.productName}
                          </p>

                          <p className="mt-1 font-mono text-[8px] text-[#8A96A7]">
                            {item.sku || item.productId.slice(0, 8)}
                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-[11px] font-bold text-[#33415A]">
                            ₹{item.price.toLocaleString("en-IN")}
                          </p>

                          {item.status && (
                            <p className="mt-1 text-[8px] text-[#8A96A7]">
                              {item.status}
                            </p>
                          )}

                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>

              <div className="flex items-center justify-between border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

                <p className="text-[9px] text-[#8995A5]">
                  Page {shelfPage} of {shelfTotalPages}
                </p>

                <div className="flex items-center gap-1">

                  <button
                    type="button"
                    disabled={shelfPage <= 1 || shelfLoading}
                    onClick={() =>
                      shelfBrand && fetchShelf(shelfBrand, shelfPage - 1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E1E6ED] text-[#5B6A80] disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <button
                    type="button"
                    disabled={shelfPage >= shelfTotalPages || shelfLoading}
                    onClick={() =>
                      shelfBrand && fetchShelf(shelfBrand, shelfPage + 1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E1E6ED] text-[#5B6A80] disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </AdminLayout>
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
        ${danger
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
        <Tag size={25} />
      </div>

      <h3 className="mt-4 text-[13px] font-bold text-[#33415A]">
        No brands found
      </h3>

      <p className="mt-1 max-w-[300px] text-[10px] leading-5 text-[#8995A5]">
        Try changing your search or filters, or create a new brand.
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
          Add Brand
        </button>

      </div>

    </div>
  );
}