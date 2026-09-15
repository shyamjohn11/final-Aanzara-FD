"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  X,
  Eye,
  Pencil,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Clock3,
  EyeOff,
  CalendarDays,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import { bannersApi } from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type BannerStatus =
  | "Active"
  | "Scheduled"
  | "Inactive";

type Banner = {
  id: number;
  serverId?: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: string;
  status: BannerStatus;
  startDate: string;
  endDate: string;
  clicks: number;
};

type FormErrors = {
  title?: string;
  subtitle?: string;
  image?: string;
  link?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
};

/* =========================================================
   API-first: banners load from backend; empty until fetch resolves.
========================================================= */

/* =========================================================
   CONSTANTS
========================================================= */

const VALID_POSITIONS = [
  "Home Hero",
  "Home Secondary",
  "Offers Banner",
  "Business Page",
  "Category Banner",
];

const VALID_STATUSES: BannerStatus[] = [
  "Active",
  "Scheduled",
  "Inactive",
];

const TITLE_REGEX =
  /^[A-Za-z0-9][A-Za-z0-9\s&,'!?.:()\-_/]*$/;

const SUBTITLE_REGEX =
  /^[A-Za-z0-9][A-Za-z0-9\s&,'!?.:()\-_/]*$/;

/* =========================================================
   DATE VALIDATION
========================================================= */

const isValidDate = (
  value: string
): boolean => {
  if (!value) {
    return false;
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return false;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }

  if (
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const date = new Date(
    year,
    month - 1,
    day
  );

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/* =========================================================
   URL VALIDATION
========================================================= */

const isValidImageUrl = (
  value: string
): boolean => {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
};

const isValidLink = (
  value: string
): boolean => {
  if (!value) {
    return true;
  }

  /* Internal application link */

  if (value.startsWith("/")) {
    return true;
  }

  /* External link */

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
};

/* =========================================================
   IMAGE URL RESOLUTION (server key variants + relative paths)
========================================================= */

const resolveBannerImage = (raw: any): string => {
  if (!raw || typeof raw !== "object") return "";

  const direct =
    raw.imageUrl ??
    raw.image ??
    raw.imagePath ??
    raw.bannerImage ??
    raw.banner_image ??
    raw.image_url ??
    raw.imgUrl ??
    raw.photo ??
    raw.picture ??
    raw.fileUrl ??
    raw.filePath ??
    "";

  // Nested gallery shape: images: [...] (string or {imageUrl/url}).
  let nested = "";
  const gallery = raw.images ?? raw.gallery ?? raw.files;
  if (Array.isArray(gallery) && gallery.length > 0) {
    const first = gallery[0];
    nested =
      typeof first === "string"
        ? first
        : String(
            first?.imageUrl ??
              first?.url ??
              first?.filePath ??
              ""
          );
  }

  const candidate = String(direct || nested).trim();
  if (!candidate) return "";

  // Absolute, data:, and blob: URLs pass through untouched.
  if (/^(https?:|data:|blob:)/i.test(candidate)) return candidate;

  // Relative path (e.g. /uploads/banners/x.jpg): prefix the backend
  // origin when configured so dev (Next :3000 vs API :5222) resolves.
  const base = (
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? ""
  ).replace(/\/+$/, "");
  if (candidate.startsWith("/") && base) return `${base}${candidate}`;

  return candidate;
};

/* =========================================================
   RESILIENT BANNER IMAGE
   src -> GET /api/admin/banners/{id}/image/file fallback
   (stored bytes stream) -> placeholder
========================================================= */

function BannerImg({
  src,
  alt,
  iconSize = 20,
  bannerId,
}: {
  src: string;
  alt: string;
  iconSize?: number;
  bannerId?: string;
}) {
  // Ordered sources: stored URL first, then the
  // GET /api/admin/banners/{id}/image/file byte stream
  // (deduped; 404s fall through to the placeholder).
  const sources = useMemo(() => {
    const list = [
      src,
      bannerId && bannerId !== "0"
        ? bannersApi.imageFileUrl(bannerId)
        : "",
    ].filter(Boolean);
    return list.filter(
      (entry, index) => list.indexOf(entry) === index
    );
  }, [src, bannerId]);

  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [src, bannerId]);

  if (sourceIndex >= sources.length) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[#A0AAB8]">
        <ImageIcon size={iconSize} />
      </div>
    );
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setSourceIndex((prev) => prev + 1)}
    />
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminBannersPage() {
  const router = useRouter();

  const [banners, setBanners] =
    useState<Banner[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | BannerStatus>("All");

  const [positionFilter, setPositionFilter] =
    useState("All");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [selectedBanner, setSelectedBanner] =
    useState<Banner | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] =
    useState(false);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    position: "Home Hero",
    status: "Active" as BannerStatus,
    startDate: "",
    endDate: "",
  });

  /* =======================================================
     LOAD BANNERS (#75 GET /api/admin/banners; API-first)
  ======================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadBanners = async () => {
      try {
        const response = await bannersApi.list(1, 100);
        const payload: any = (response as any)?.data ?? response;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (cancelled || rawItems.length === 0) return;

        const mapped: Banner[] = rawItems.map((raw: any, index: number) => ({
          id: index + 1,
          serverId: String(raw.bannerId ?? raw.id ?? raw._id ?? ""),
          title: String(raw.title ?? raw.name ?? "Untitled banner"),
          subtitle: String(raw.subtitle ?? raw.description ?? ""),
          image: resolveBannerImage(raw),
          link: String(raw.link ?? raw.url ?? raw.targetUrl ?? ""),
          position: String(raw.position ?? raw.placement ?? raw.location ?? "Home Hero"),
          status: (["Active", "Scheduled", "Inactive"] as BannerStatus[]).includes(raw.status as BannerStatus)
            ? (raw.status as BannerStatus)
            : "Active",
          startDate: String(raw.startDate ?? raw.start ?? raw.validFrom ?? "").slice(0, 10),
          endDate: String(raw.endDate ?? raw.end ?? raw.validTo ?? "").slice(0, 10),
          clicks: Number(raw.clicks ?? raw.clickCount ?? raw.views ?? 0),
        }));

        if (mapped.length > 0) setBanners(mapped);

        // One-time diagnostic: if rows arrive but no image resolved,
        // log the raw keys so the backend field name can be aligned.
        if (
          rawItems.length > 0 &&
          mapped.length > 0 &&
          mapped.every((row) => !row.image) &&
          typeof rawItems[0] === "object" &&
          rawItems[0] !== null
        ) {
          console.warn(
            "[banners] rows loaded but image field not found. First row keys:",
            Object.keys(rawItems[0] as Record<string, unknown>),
            rawItems[0]
          );
        }
      } catch (error) {
        console.error("Unable to load banners:", error);
      }
    };

    loadBanners();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     POSITIONS
  ======================================================== */

  const positions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          banners.map(
            (banner) => banner.position
          )
        )
      ),
    ],
    [banners]
  );

  /* =======================================================
     FILTER
  ======================================================== */

  const filteredBanners = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return banners.filter((banner) => {
      const matchesSearch =
        !query ||
        banner.title
          .toLowerCase()
          .includes(query) ||
        banner.subtitle
          .toLowerCase()
          .includes(query) ||
        banner.position
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        banner.status === statusFilter;

      const matchesPosition =
        positionFilter === "All" ||
        banner.position === positionFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPosition
      );
    });
  }, [
    banners,
    search,
    statusFilter,
    positionFilter,
  ]);

  /* =======================================================
     STATS
  ======================================================== */

  const totalBanners = banners.length;

  const activeBanners = banners.filter(
    (banner) =>
      banner.status === "Active"
  ).length;

  const scheduledBanners =
    banners.filter(
      (banner) =>
        banner.status === "Scheduled"
    ).length;

  const inactiveBanners = banners.filter(
    (banner) =>
      banner.status === "Inactive"
  ).length;

  const totalClicks = banners.reduce(
    (sum, banner) =>
      sum + banner.clicks,
    0
  );

  /* =======================================================
     RESET FORM
  ======================================================== */

  const resetForm = () => {
    setForm({
      title: "",
      subtitle: "",
      image: "",
      link: "",
      position: "Home Hero",
      status: "Active",
      startDate: "",
      endDate: "",
    });

    setErrors({});
    setEditingId(null);
  };

  /* =======================================================
     CREATE
  ======================================================== */

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  /* =======================================================
     EDIT
  ======================================================== */

  const openEdit = (banner: Banner) => {
    setEditingId(banner.id);

    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      link: banner.link,
      position: banner.position,
      status: banner.status,
      startDate: banner.startDate,
      endDate: banner.endDate,
    });

    setErrors({});
    setShowForm(true);
  };

  /* =======================================================
     VALIDATE FORM
  ======================================================== */

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const title =
      form.title.trim();

    const subtitle =
      form.subtitle.trim();

    const image =
      form.image.trim();

    const link =
      form.link.trim();

    /* =====================================================
       TITLE
    ====================================================== */

    if (!title) {
      newErrors.title =
        "Banner title is required.";
    } else if (title.length < 3) {
      newErrors.title =
        "Banner title must be at least 3 characters.";
    } else if (title.length > 80) {
      newErrors.title =
        "Banner title cannot exceed 80 characters.";
    } else if (!TITLE_REGEX.test(title)) {
      newErrors.title =
        "Banner title contains invalid characters.";
    }

    /* =====================================================
       SUBTITLE
    ====================================================== */

    if (subtitle.length > 150) {
      newErrors.subtitle =
        "Subtitle cannot exceed 150 characters.";
    } else if (
      subtitle &&
      !SUBTITLE_REGEX.test(subtitle)
    ) {
      newErrors.subtitle =
        "Subtitle contains invalid characters.";
    }

    /* =====================================================
       IMAGE (link type: direct image URL)
    ====================================================== */

    if (!image) {
      newErrors.image =
        "Image link is required.";
    } else if (!isValidImageUrl(image)) {
      newErrors.image =
        "Please enter a valid image link (http:// or https://).";
    }

    /* =====================================================
       LINK
    ====================================================== */

    if (!isValidLink(link)) {
      newErrors.link =
        "Please enter a valid internal or external URL.";
    }

    /* =====================================================
       POSITION
    ====================================================== */

    if (!form.position) {
      newErrors.position =
        "Please select a position.";
    } else if (
      !VALID_POSITIONS.includes(
        form.position
      )
    ) {
      newErrors.position =
        "Please select a valid position.";
    }

    /* =====================================================
       START DATE
    ====================================================== */

    if (!form.startDate) {
      newErrors.startDate =
        "Start date is required.";
    } else if (
      !isValidDate(form.startDate)
    ) {
      newErrors.startDate =
        "Please enter a valid start date.";
    }

    /* =====================================================
       END DATE
    ====================================================== */

    if (!form.endDate) {
      newErrors.endDate =
        "End date is required.";
    } else if (
      !isValidDate(form.endDate)
    ) {
      newErrors.endDate =
        "Please enter a valid end date.";
    }

    /* =====================================================
       DATE RANGE
    ====================================================== */

    if (
      form.startDate &&
      form.endDate &&
      isValidDate(form.startDate) &&
      isValidDate(form.endDate)
    ) {
      const start = new Date(
        `${form.startDate}T00:00:00`
      );

      const end = new Date(
        `${form.endDate}T00:00:00`
      );

      if (end < start) {
        newErrors.endDate =
          "End date cannot be before start date.";
      }
    }

    /* =====================================================
       STATUS
    ====================================================== */

    if (
      !VALID_STATUSES.includes(
        form.status
      )
    ) {
      newErrors.status =
        "Please select a valid status.";
    }

    /* =====================================================
       SET ERRORS
    ====================================================== */

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  /* =======================================================
     UPDATE FIELD
  ======================================================== */

  const updateField = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  /* =======================================================
     SAVE
  ======================================================== */

  const saveBanner = async () => {
    const isValid =
      validateForm();

    if (!isValid) {
      return;
    }

    const cleanedForm = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      image: form.image.trim(),
      link: form.link.trim(),
      position: form.position,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    // Link type: JSON with the image URL (backend keeps/serves the link).
    const payload: Record<string, unknown> = { ...cleanedForm };

    if (editingId !== null) {
      const editingRow = banners.find(
        (banner) => banner.id === editingId
      );

      if (editingRow?.serverId) {
        try {
          await bannersApi.update(editingRow.serverId, payload);
        } catch (error) {
          console.error("Banner update failed:", error);
        }
      }
    } else {
      try {
        await bannersApi.create(payload);
      } catch (error) {
        console.error("Banner create failed:", error);
      }
    }

    /* ===================================================
       UPDATE
    ==================================================== */

    if (editingId !== null) {
      setBanners((current) =>
        current.map((banner) =>
          banner.id === editingId
            ? {
                ...banner,
                title:
                  cleanedForm.title,
                subtitle:
                  cleanedForm.subtitle,
                image:
                  cleanedForm.image,
                link:
                  cleanedForm.link,
                position:
                  cleanedForm.position,
                status:
                  cleanedForm.status,
                startDate:
                  cleanedForm.startDate,
                endDate:
                  cleanedForm.endDate,
              }
            : banner
        )
      );
    }

    /* ===================================================
       CREATE
    ==================================================== */

    else {
      const newBanner: Banner = {
        id: Date.now(),
        title: cleanedForm.title,
        subtitle:
          cleanedForm.subtitle,
        image: cleanedForm.image,
        link: cleanedForm.link,
        position:
          cleanedForm.position,
        status:
          cleanedForm.status,
        startDate:
          cleanedForm.startDate,
        endDate:
          cleanedForm.endDate,
        clicks: 0,
      };

      setBanners((current) => [
        ...current,
        newBanner,
      ]);
    }

    setShowForm(false);
    resetForm();
    showSaved();
  };

  /* =======================================================
     DELETE
  ======================================================== */

  const deleteBanner = async () => {
    if (deleteId === null) {
      return;
    }

    const deletingRow = banners.find(
      (banner) => banner.id === deleteId
    );

    if (deletingRow?.serverId) {
      try {
        await bannersApi.remove(deletingRow.serverId);
      } catch (error) {
        console.error("Banner delete failed:", error);
      }
    }

    setBanners((current) =>
      current.filter(
        (banner) =>
          banner.id !== deleteId
      )
    );

    setDeleteId(null);
    setSelectedBanner(null);

    showSaved();
  };

  /* =======================================================
     STATUS
  ======================================================== */

  const updateStatus = async (
    id: number,
    status: BannerStatus
  ) => {
    if (
      !VALID_STATUSES.includes(status)
    ) {
      return;
    }

    const targetRow = banners.find(
      (banner) => banner.id === id
    );

    if (targetRow?.serverId) {
      try {
        await bannersApi.setStatus(targetRow.serverId, status);
      } catch (error) {
        console.error("Banner status update failed:", error);
      }
    }

    setBanners((current) =>
      current.map((banner) =>
        banner.id === id
          ? {
              ...banner,
              status,
            }
          : banner
      )
    );

    if (
      selectedBanner &&
      selectedBanner.id === id
    ) {
      setSelectedBanner({
        ...selectedBanner,
        status,
      });
    }

    showSaved();
  };

  /* =======================================================
     VIEW (row instantly, then #76 detail refresh merges
     full fields incl. imageUrl)
  ====================================================== */

  const openView = (banner: Banner) => {
    setSelectedBanner(banner);

    if (!banner.serverId) return;

    bannersApi
      .details(banner.serverId)
      .then((response) => {
        const raw = ((response as any)?.data ?? {}) as Record<
          string,
          unknown
        >;
        const detail = raw.data ?? raw;
        const record =
          typeof detail === "object" && detail !== null
            ? (detail as Record<string, unknown>)
            : {};
        const image = resolveBannerImage(record);

        setSelectedBanner((current) => {
          if (!current || current.id !== banner.id) return current;
          return {
            ...current,
            title: String(
              record.title ?? record.name ?? current.title
            ),
            subtitle: String(
              record.subtitle ?? record.description ?? current.subtitle
            ),
            image: image || current.image,
            link: String(
              record.link ?? record.url ?? record.targetUrl ?? current.link
            ),
          };
        });

        if (image) {
          setBanners((current) =>
            current.map((entry) =>
              entry.id === banner.id && !entry.image
                ? { ...entry, image }
                : entry
            )
          );
        }
      })
      .catch((error) => {
        console.error("Unable to load banner details:", error);
      });
  };

  /* =======================================================
     SUCCESS
  ======================================================= */

  const showSaved = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  /* =======================================================
     CLOSE FORM
  ======================================================== */

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  /* =======================================================
     INPUT CLASS
  ======================================================== */

  const inputClass = (
    error?: string
  ) =>
    `mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] ${
      error
        ? "border-[#EF4444] bg-[#FFF8F8] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]/10"
        : "border-[#DCE2EA] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10"
    }`;

  /* =======================================================
     RETURN
  ======================================================== */

  return (

    <AdminLayout>

      <div className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">

        {/* ==================================================
            PAGE HEADER — SUBCATEGORIES / BRANDS STYLE
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
                  Banners
                </h1>

                <p className="mt-1 text-[10px] text-[#8995A5]">
                  Manage homepage banners and promotional campaigns
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={openCreate}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1769F5] px-4 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#0F5BDE]"
            >
              <Plus size={15} />
              <span>Create Banner</span>
            </button>

          </div>
        </header>

        {/* =================================================
            BREADCRUMB
        ================================================== */}

        <div className="mb-5 flex items-center gap-2 text-[9px] text-[#8995A5]">

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="hover:text-[#1769F5]"
          >
            Dashboard
          </button>

          <span>/</span>

          <span className="font-medium text-[#566579]">
            Banners
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

          <StatCard
            title="Total Banners"
            value={totalBanners}
            icon={ImageIcon}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#1769F5]"
          />

          <StatCard
            title="Active"
            value={activeBanners}
            icon={CheckCircle2}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Scheduled"
            value={scheduledBanners}
            icon={Clock3}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

          <StatCard
            title="Inactive"
            value={inactiveBanners}
            icon={EyeOff}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

          <StatCard
            title="Total Clicks"
            value={totalClicks.toLocaleString()}
            icon={Eye}
            bg="bg-[#F0ECFF]"
            iconColor="text-[#7053C6]"
          />

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
                maxLength={100}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search banner title, subtitle or position..."
                className="w-full bg-transparent px-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8]"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="text-[#8995A5]"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}

            </div>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "All"
                    | BannerStatus
                )
              }
              className="h-10 rounded-lg border border-[#DFE5ED] bg-white px-3 text-[10px] text-[#52627A] outline-none focus:border-[#1769F5] lg:w-[150px]"
            >
              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Scheduled">
                Scheduled
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>

            {/* POSITION */}

            <select
              value={positionFilter}
              onChange={(event) =>
                setPositionFilter(
                  event.target.value
                )
              }
              className="h-10 rounded-lg border border-[#DFE5ED] bg-white px-3 text-[10px] text-[#52627A] outline-none focus:border-[#1769F5] lg:w-[180px]"
            >
              {positions.map(
                (position) => (
                  <option
                    key={position}
                    value={position}
                  >
                    {position === "All"
                      ? "All Positions"
                      : position}
                  </option>
                )
              )}
            </select>

            {/* CLEAR */}

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setPositionFilter("All");
              }}
              className="h-10 rounded-lg border border-[#DCE2EA] px-4 text-[9px] font-semibold text-[#647287] hover:bg-[#F5F7FA]"
            >
              Clear Filters
            </button>

          </div>

        </section>

        {/* =================================================
            BANNER LIST
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#293953]">
                Banner List
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredBanners.length} banners
                found
              </p>

            </div>

          </div>

          {filteredBanners.length ===
          0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                <ImageIcon size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No banners found
              </h3>

              <p className="mt-1 text-[10px] text-[#8995A5]">
                Try changing your search or
                filters.
              </p>

            </div>
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
                        Banner
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Position
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Schedule
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Clicks
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

                    {filteredBanners.map(
                      (banner) => (
                        <tr
                          key={banner.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* BANNER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="h-[52px] w-[92px] shrink-0 overflow-hidden rounded-lg bg-[#EEF2F6]">

                                <BannerImg
                                  src={banner.image}
                                  alt={banner.title}
                                  iconSize={20}
                                  bannerId={
                                    banner.serverId || String(banner.id)
                                  }
                                />

                              </div>

                              <div className="min-w-0">

                                <p className="max-w-[230px] truncate text-[10px] font-bold text-[#33415A]">
                                  {banner.title}
                                </p>

                                <p className="mt-1 max-w-[250px] truncate text-[8px] text-[#8995A5]">
                                  {banner.subtitle ||
                                    "No subtitle"}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* POSITION */}

                          <td className="px-5 py-4">

                            <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[8px] font-medium text-[#66748B]">
                              {banner.position}
                            </span>

                          </td>

                          {/* SCHEDULE */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <CalendarDays
                                size={13}
                                className="text-[#8995A5]"
                              />

                              <div>

                                <p className="text-[8px] font-semibold text-[#52627A]">
                                  {banner.startDate}
                                </p>

                                <p className="mt-1 text-[8px] text-[#8995A5]">
                                  to{" "}
                                  {banner.endDate}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CLICKS */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-bold text-[#52627A]">
                              {banner.clicks.toLocaleString()}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                banner.status
                              }
                            />

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1.5">

                              <ActionButton
                                label="View"
                                onClick={() =>
                                  openView(
                                    banner
                                  )
                                }
                              >
                                <Eye size={13} />
                              </ActionButton>

                              <ActionButton
                                label="Edit"
                                blue
                                onClick={() =>
                                  openEdit(
                                    banner
                                  )
                                }
                              >
                                <Pencil
                                  size={13}
                                />
                              </ActionButton>

                              <ActionButton
                                label="Delete"
                                danger
                                onClick={() =>
                                  setDeleteId(
                                    banner.id
                                  )
                                }
                              >
                                <Trash2
                                  size={13}
                                />
                              </ActionButton>

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

                {filteredBanners.map(
                  (banner) => (
                    <div
                      key={banner.id}
                      className="p-4"
                    >

                      <div className="flex gap-3">

                        <div className="h-[62px] w-[92px] shrink-0 overflow-hidden rounded-lg bg-[#EEF2F6]">

                          <BannerImg
                            src={banner.image}
                            alt={banner.title}
                            iconSize={22}
                            bannerId={
                              banner.serverId || String(banner.id)
                            }
                          />

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-[10px] font-bold text-[#33415A]">
                                {banner.title}
                              </p>

                              <p className="mt-1 truncate text-[8px] text-[#8995A5]">
                                {banner.subtitle ||
                                  "No subtitle"}
                              </p>

                            </div>

                            <StatusBadge
                              status={
                                banner.status
                              }
                            />

                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">

                            <span className="rounded-full bg-[#F2F4F7] px-2 py-1 text-[7px] text-[#66748B]">
                              {banner.position}
                            </span>

                            <span className="text-[8px] text-[#8995A5]">
                              {banner.clicks}{" "}
                              clicks
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <InfoBox
                          label="Start Date"
                          value={
                            banner.startDate
                          }
                        />

                        <InfoBox
                          label="End Date"
                          value={
                            banner.endDate
                          }
                        />

                      </div>

                      <div className="mt-3 flex justify-end gap-2">

                        <MobileAction
                          label="View"
                          onClick={() =>
                            openView(
                              banner
                            )
                          }
                        >
                          <Eye size={12} />
                        </MobileAction>

                        <MobileAction
                          label="Edit"
                          blue
                          onClick={() =>
                            openEdit(
                              banner
                            )
                          }
                        >
                          <Pencil size={12} />
                        </MobileAction>

                        <MobileAction
                          label="Delete"
                          danger
                          onClick={() =>
                            setDeleteId(
                              banner.id
                            )
                          }
                        >
                          <Trash2 size={12} />
                        </MobileAction>

                      </div>

                    </div>
                  )
                )}

              </div>

            </>
          )}

        </section>


      {/* =====================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <button
            type="button"
            aria-label="Close modal"
            onClick={closeForm}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative max-h-[92vh] w-full max-w-[700px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Banner"
                    : "Create Banner"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Add banner image, placement
                  and schedule
                </p>

              </div>

              <button
                type="button"
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
                aria-label="Close"
              >
                <X size={17} />
              </button>

            </div>

            {/* FORM */}

            <div className="space-y-4 p-5">

              {/* TITLE + SUBTITLE */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Banner Title"
                  value={form.title}
                  placeholder="Enter banner title"
                  required
                  maxLength={80}
                  error={errors.title}
                  onChange={(value) =>
                    updateField(
                      "title",
                      value
                    )
                  }
                />

                <FormInput
                  label="Subtitle"
                  value={form.subtitle}
                  placeholder="Enter subtitle"
                  maxLength={150}
                  error={errors.subtitle}
                  onChange={(value) =>
                    updateField(
                      "subtitle",
                      value
                    )
                  }
                />

              </div>

              {/* IMAGE (link type) */}

              <FormInput
                label="Image Link"
                value={form.image}
                placeholder="https://example.com/banner.jpg"
                required
                error={errors.image}
                onChange={(value) =>
                  updateField(
                    "image",
                    value
                  )
                }
              />

              {/* IMAGE PREVIEW */}

              {form.image.trim() && (
                <div className="overflow-hidden rounded-xl border border-[#E5E9EF] bg-[#F7F9FC]">

                  <div className="aspect-[3/1] w-full">

                    <BannerImg
                      src={form.image}
                      alt="Banner preview"
                      iconSize={28}
                      bannerId={
                        editingId !== null
                          ? (banners.find(
                              (entry) => entry.id === editingId
                            )?.serverId || String(editingId))
                          : undefined
                      }
                    />

                  </div>

                </div>
              )}

              {/* LINK + POSITION */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Link"
                  value={form.link}
                  placeholder="/offers or https://example.com"
                  error={errors.link}
                  onChange={(value) =>
                    updateField(
                      "link",
                      value
                    )
                  }
                />

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Position
                    <span className="ml-1 text-[#EF4444]">
                      *
                    </span>
                  </label>

                  <select
                    value={form.position}
                    onChange={(event) =>
                      updateField(
                        "position",
                        event.target.value
                      )
                    }
                    className={inputClass(
                      errors.position
                    )}
                  >

                    {VALID_POSITIONS.map(
                      (position) => (
                        <option
                          key={position}
                          value={position}
                        >
                          {position}
                        </option>
                      )
                    )}

                  </select>

                  {errors.position && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.position}
                    </p>
                  )}

                </div>

              </div>

              {/* DATES + STATUS */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                {/* START DATE */}

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Start Date
                    <span className="ml-1 text-[#EF4444]">
                      *
                    </span>
                  </label>

                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      updateField(
                        "startDate",
                        event.target.value
                      )
                    }
                    aria-invalid={
                      !!errors.startDate
                    }
                    className={inputClass(
                      errors.startDate
                    )}
                  />

                  {errors.startDate && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.startDate}
                    </p>
                  )}

                </div>

                {/* END DATE */}

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    End Date
                    <span className="ml-1 text-[#EF4444]">
                      *
                    </span>
                  </label>

                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      updateField(
                        "endDate",
                        event.target.value
                      )
                    }
                    aria-invalid={
                      !!errors.endDate
                    }
                    className={inputClass(
                      errors.endDate
                    )}
                  />

                  {errors.endDate && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.endDate}
                    </p>
                  )}

                </div>

                {/* STATUS */}

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Status
                    <span className="ml-1 text-[#EF4444]">
                      *
                    </span>
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value
                      )
                    }
                    className={inputClass(
                      errors.status
                    )}
                  >

                    {VALID_STATUSES.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}

                  </select>

                  {errors.status && (
                    <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                      {errors.status}
                    </p>
                  )}

                </div>

              </div>

              {/* ERROR SUMMARY */}

              {Object.keys(errors).length >
                0 && (
                <div className="rounded-lg border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">

                  <p className="text-[9px] font-semibold text-[#DC2626]">
                    Please correct the
                    highlighted fields before
                    saving.
                  </p>

                </div>
              )}

            </div>

            {/* MODAL FOOTER */}

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={closeForm}
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287] hover:bg-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveBanner}
                className="h-9 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                {editingId !== null
                  ? "Update Banner"
                  : "Save Banner"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          VIEW MODAL
      ====================================================== */}

      {selectedBanner && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <button
            type="button"
            aria-label="Close"
            onClick={() =>
              setSelectedBanner(null)
            }
            className="absolute inset-0 cursor-default"
          />

          <div className="relative max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                  <ImageIcon size={18} />
                </div>

                <div>

                  <h2 className="text-[13px] font-bold text-[#263650]">
                    Banner Details
                  </h2>

                  <p className="mt-1 text-[8px] text-[#8995A5]">
                    {selectedBanner.position}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBanner(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="space-y-4 p-5">

              {/* IMAGE */}

              <div className="overflow-hidden rounded-xl bg-[#EEF2F6]">

                <div className="aspect-[3/1]">

                  <BannerImg
                    src={selectedBanner.image}
                    alt={selectedBanner.title}
                    iconSize={28}
                    bannerId={
                      selectedBanner.serverId ||
                      String(selectedBanner.id)
                    }
                  />

                </div>

              </div>

              {/* TITLE */}

              <div>

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <h3 className="text-[14px] font-bold text-[#33415A]">
                      {selectedBanner.title}
                    </h3>

                    <p className="mt-1 text-[10px] text-[#8995A5]">
                      {selectedBanner.subtitle ||
                        "No subtitle"}
                    </p>

                  </div>

                  <StatusBadge
                    status={
                      selectedBanner.status
                    }
                  />

                </div>

              </div>

              {/* DETAILS */}

              <div className="grid grid-cols-2 gap-3">

                <DetailBox
                  label="Position"
                  value={
                    selectedBanner.position
                  }
                />

                <DetailBox
                  label="Clicks"
                  value={selectedBanner.clicks.toLocaleString()}
                />

                <DetailBox
                  label="Start Date"
                  value={
                    selectedBanner.startDate
                  }
                />

                <DetailBox
                  label="End Date"
                  value={
                    selectedBanner.endDate
                  }
                />

              </div>

              {/* LINK */}

              <div className="rounded-xl border border-[#E5E9EF] p-4">

                <p className="text-[8px] uppercase tracking-wide text-[#98A3B2]">
                  Target Link
                </p>

                <div className="mt-2 flex items-center gap-2">

                  <ExternalLink
                    size={14}
                    className="text-[#1769F5]"
                  />

                  <p className="break-all text-[10px] font-semibold text-[#52627A]">
                    {selectedBanner.link ||
                      "No link configured"}
                  </p>

                </div>

              </div>

              {/* STATUS */}

              <div>

                <p className="mb-2 text-[9px] font-semibold text-[#52627A]">
                  Update Status
                </p>

                <div className="flex flex-wrap gap-2">

                  {VALID_STATUSES.map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          updateStatus(
                            selectedBanner.id,
                            status
                          )
                        }
                        className={`rounded-lg px-3 py-2 text-[8px] font-semibold ${
                          selectedBanner.status ===
                          status
                            ? "bg-[#1769F5] text-white"
                            : "bg-[#F3F5F8] text-[#66748B]"
                        }`}
                      >
                        {status}
                      </button>
                    )
                  )}

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  const banner =
                    selectedBanner;

                  setSelectedBanner(null);

                  openEdit(banner);
                }}
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[9px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Banner
              </button>

              <button
                type="button"
                onClick={() =>
                  setDeleteId(
                    selectedBanner.id
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
              Delete Banner?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This banner will be permanently
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
                onClick={deleteBanner}
                className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D]"
              >
                Delete
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
              Banner updated successfully.
            </p>

          </div>

        </div>
      )}

        </main>

      </div>

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
  status: BannerStatus;
}) {
  const classes =
    status === "Active"
      ? "bg-[#EAF8F0] text-[#249357]"
      : status === "Scheduled"
        ? "bg-[#FFF5DF] text-[#C17B19]"
        : "bg-[#FFF0F0] text-[#D85A5A]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[7px] font-semibold ${classes}`}
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
  type = "text",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  maxLength?: number;
  type?: string;
}) {
  return (
    <div>

      <label className="text-[9px] font-semibold text-[#52627A]">

        {label}

        {required && (
          <span className="ml-1 text-[#EF4444]">
            *
          </span>
        )}

      </label>

      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        aria-invalid={!!error}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] ${
          error
            ? "border-[#EF4444] bg-[#FFF8F8] focus:border-[#EF4444]"
            : "border-[#DCE2EA] focus:border-[#1769F5]"
        }`}
      />

      {error && (
        <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
          {error}
        </p>
      )}

      {maxLength && (
        <p className="mt-1 text-right text-[7px] text-[#A0AAB8]">
          {value.length}/{maxLength}
        </p>
      )}

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
  blue = false,
  danger = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  blue?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
        danger
          ? "border-[#F0D4D4] text-[#D85A5A] hover:bg-[#FFF0F0]"
          : blue
            ? "border-[#DCE2EA] text-[#1769F5] hover:bg-[#EDF3FF]"
            : "border-[#DCE2EA] text-[#52627A] hover:bg-[#F4F6F9]"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   MOBILE ACTION
============================================================ */

function MobileAction({
  children,
  label,
  onClick,
  blue = false,
  danger = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  blue?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[8px] font-semibold ${
        danger
          ? "border-[#F0D4D4] text-[#D85A5A]"
          : blue
            ? "border-[#DCE2EA] text-[#1769F5]"
            : "border-[#DCE2EA] text-[#52627A]"
      }`}
    >
      {children}
      {label}
    </button>
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
