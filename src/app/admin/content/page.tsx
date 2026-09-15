"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  EyeOff,
  ArrowLeft,
  FileText,
  Mail,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import {
  adminContentApi,
  adminNewsletterApi,
} from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type Tab = "content" | "newsletter";

type ContentRow = {
  id: number;
  serverId: string;
  section: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

type NewsletterRow = {
  id: number;
  serverId: string;
  email: string;
  source: string;
  createdAt: string;
};

type ContentFormErrors = {
  section?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  sortOrder?: string;
};

type DeleteTarget =
  | { kind: "content"; id: number }
  | { kind: "newsletter"; id: number };

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10;

const KNOWN_SECTIONS = [
  "testimonials",
  "hero_features",
  "industry_solutions",
  "why_choose",
  "why_shop",
  "why_buy",
  "faqs",
  "enterprise_info",
  "enterprise_docs",
  "trust_guarantees",
  "cart_trust",
  "checkout_trust",
  "how_it_works",
  "customer_steps",
  "owner_steps",
];

/* =========================================================
   HELPERS
========================================================= */

function str(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: unknown, fallback = true): boolean {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return Boolean(value);
}

function extractPaged(payload: unknown): {
  items: Record<string, unknown>[];
  totalCount: number;
  totalPages: number;
} {
  const root = payload as Record<string, unknown>;
  const candidate =
    (root?.items as unknown) ??
    (root?.data as unknown) ??
    payload;
  const items: Record<string, unknown>[] = Array.isArray(candidate)
    ? (candidate as Record<string, unknown>[])
    : Array.isArray((candidate as Record<string, unknown>)?.items)
      ? ((candidate as Record<string, unknown>).items as Record<
          string,
          unknown
        >[])
      : Array.isArray((candidate as Record<string, unknown>)?.data)
        ? ((candidate as Record<string, unknown>).data as Record<
            string,
            unknown
          >[])
        : [];
  const totalCount = num(
    root?.totalCount ?? (candidate as Record<string, unknown>)?.totalCount,
    items.length
  );
  const totalPages = num(
    root?.totalPages ??
      (candidate as Record<string, unknown>)?.totalPages,
    1
  );
  return { items, totalCount, totalPages: Math.max(totalPages, 1) };
}

function mapContentRow(
  raw: Record<string, unknown>,
  index: number
): ContentRow {
  const serverId = str(
    raw.id ?? raw.Id ?? raw.contentId ?? raw.ContentId ?? ""
  );
  return {
    id: index + 1,
    serverId,
    section: str(raw.section ?? raw.Section ?? ""),
    title: str(
      raw.title ?? raw.Title ?? "Untitled content"
    ),
    description: str(
      raw.description ?? raw.Description ?? ""
    ),
    imageUrl: str(raw.imageUrl ?? raw.ImageUrl ?? ""),
    linkUrl: str(raw.linkUrl ?? raw.LinkUrl ?? ""),
    sortOrder: num(
      raw.sortOrder ?? raw.SortOrder ?? 0,
      0
    ),
    isActive: bool(
      raw.isActive ?? raw.IsActive ?? raw.is_active,
      true
    ),
    updatedAt: str(
      raw.updatedAt ??
        raw.UpdatedAt ??
        raw.updated_at ??
        raw.createdAt ??
        raw.CreatedAt ??
        ""
    ).slice(0, 10),
  };
}

function mapNewsletterRow(
  raw: Record<string, unknown>,
  index: number
): NewsletterRow {
  return {
    id: index + 1,
    serverId: str(raw.id ?? raw.Id ?? ""),
    email: str(raw.email ?? raw.Email ?? ""),
    source: str(raw.source ?? raw.Source ?? "") || "—",
    createdAt: str(
      raw.createdAt ?? raw.CreatedAt ?? raw.created_at ?? ""
    ).slice(0, 10),
  };
}

const isValidOptionalUrl = (value: string): boolean => {
  if (!value) return true;
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" || url.protocol === "https:"
    );
  } catch {
    return false;
  }
};

const formatDate = (value: string): string => {
  if (!value) return "—";
  return value;
};

/* =========================================================
   PAGE
========================================================= */

export default function AdminContentPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("content");

  /* ---------------- Content state ---------------- */

  const [contentRows, setContentRows] = useState<ContentRow[]>([]);
  const [contentSearch, setContentSearch] = useState("");
  const [debouncedContentSearch, setDebouncedContentSearch] =
    useState("");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [contentPage, setContentPage] = useState(1);
  const [contentTotalPages, setContentTotalPages] = useState(1);
  const [contentTotalCount, setContentTotalCount] =
    useState(0);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState("");

  /* ---------------- Newsletter state ---------------- */

  const [newsletterRows, setNewsletterRows] = useState<
    NewsletterRow[]
  >([]);
  const [nlSearch, setNlSearch] = useState("");
  const [debouncedNlSearch, setDebouncedNlSearch] =
    useState("");
  const [nlPage, setNlPage] = useState(1);
  const [nlTotalPages, setNlTotalPages] = useState(1);
  const [nlTotalCount, setNlTotalCount] = useState(0);
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState("");

  /* ---------------- Modals / toast ---------------- */

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(
    null
  );
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<ContentFormErrors>({});
  const [form, setForm] = useState({
    section: "",
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    sortOrder: "0",
    isActive: true,
  });

  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 1800);
  };

  /* =======================================================
     DEBOUNCE SEARCH
  ======================================================== */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContentSearch(contentSearch.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [contentSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNlSearch(nlSearch.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [nlSearch]);

  useEffect(() => {
    setContentPage(1);
  }, [debouncedContentSearch, sectionFilter]);

  useEffect(() => {
    setNlPage(1);
  }, [debouncedNlSearch]);

  /* =======================================================
     LOAD CONTENT (#151 GET /api/admin/content)
  ======================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      setContentLoading(true);
      setContentError("");
      try {
        const extra: Record<string, string> = {};
        if (sectionFilter !== "All") {
          extra.Section = sectionFilter;
        }
        if (debouncedContentSearch) {
          extra.Search = debouncedContentSearch;
        }
        const response = await adminContentApi.list(
          contentPage,
          PAGE_SIZE,
          extra
        );
        const payload =
          (response as unknown as { data?: unknown })?.data ??
          response;
        const { items, totalCount, totalPages } =
          extractPaged(payload);
        if (cancelled) return;
        const mapped = items.map((raw, index) =>
          mapContentRow(
            raw,
            (contentPage - 1) * PAGE_SIZE + index
          )
        );
        setContentRows(mapped);
        setContentTotalCount(totalCount);
        setContentTotalPages(totalPages);
      } catch (error) {
        console.error("Unable to load content:", error);
        if (!cancelled) {
          setContentError(
            "Unable to load site content. Please try again."
          );
        }
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    };

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [contentPage, sectionFilter, debouncedContentSearch]);

  /* =======================================================
     LOAD NEWSLETTER (#157 GET /api/admin/newsletter)
  ======================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadNewsletter = async () => {
      setNlLoading(true);
      setNlError("");
      try {
        const response = await adminNewsletterApi.list(
          nlPage,
          PAGE_SIZE,
          debouncedNlSearch || undefined
        );
        const payload =
          (response as unknown as { data?: unknown })?.data ??
          response;
        const { items, totalCount, totalPages } =
          extractPaged(payload);
        if (cancelled) return;
        const mapped = items.map((raw, index) =>
          mapNewsletterRow(
            raw,
            (nlPage - 1) * PAGE_SIZE + index
          )
        );
        setNewsletterRows(mapped);
        setNlTotalCount(totalCount);
        setNlTotalPages(totalPages);
      } catch (error) {
        console.error("Unable to load newsletter:", error);
        if (!cancelled) {
          setNlError(
            "Unable to load newsletter subscriptions. Please try again."
          );
        }
      } finally {
        if (!cancelled) setNlLoading(false);
      }
    };

    loadNewsletter();

    return () => {
      cancelled = true;
    };
  }, [nlPage, debouncedNlSearch]);

  /* =======================================================
     DERIVED
  ======================================================== */

  const sectionOptions = useMemo(() => {
    const fromRows = Array.from(
      new Set(
        contentRows
          .map((row) => row.section)
          .filter((section) => section.length > 0)
      )
    );
    const merged = Array.from(
      new Set([...KNOWN_SECTIONS, ...fromRows])
    ).sort();
    return ["All", ...merged];
  }, [contentRows]);

  const activeCount = useMemo(
    () => contentRows.filter((row) => row.isActive).length,
    [contentRows]
  );

  const inactiveCount = useMemo(
    () => contentRows.filter((row) => !row.isActive).length,
    [contentRows]
  );

  /* =======================================================
     FORM
  ======================================================== */

  const resetForm = () => {
    setForm({
      section: "",
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      sortOrder: "0",
      isActive: true,
    });
    setErrors({});
    setFormError("");
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: ContentRow) => {
    setEditingId(row.id);
    setForm({
      section: row.section,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      linkUrl: row.linkUrl,
      sortOrder: String(row.sortOrder),
      isActive: row.isActive,
    });
    setErrors({});
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const updateField = (
    field: keyof typeof form,
    value: string | boolean
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    setFormError("");
  };

  const validateForm = (): boolean => {
    const next: ContentFormErrors = {};
    const section = form.section.trim();
    const title = form.title.trim();
    const description = form.description.trim();
    const imageUrl = form.imageUrl.trim();
    const linkUrl = form.linkUrl.trim();
    const sortOrder = form.sortOrder.trim();

    if (!section) {
      next.section = "Section is required.";
    } else if (section.length > 100) {
      next.section = "Section cannot exceed 100 characters.";
    }

    if (!title) {
      next.title = "Title is required.";
    } else if (title.length < 2) {
      next.title = "Title must be at least 2 characters.";
    } else if (title.length > 200) {
      next.title = "Title cannot exceed 200 characters.";
    }

    if (description.length > 2000) {
      next.description =
        "Description cannot exceed 2000 characters.";
    }

    if (!isValidOptionalUrl(imageUrl)) {
      next.imageUrl =
        "Enter a valid URL (http(s)://…) or relative path (/…).";
    }

    if (!isValidOptionalUrl(linkUrl)) {
      next.linkUrl =
        "Enter a valid URL (http(s)://…) or relative path (/…).";
    }

    if (sortOrder && !/^-?\d+$/.test(sortOrder)) {
      next.sortOrder = "Sort order must be a whole number.";
    } else if (sortOrder) {
      const parsed = Number(sortOrder);
      if (parsed < 0 || parsed > 100000) {
        next.sortOrder = "Sort order must be 0 – 100000.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const refreshContent = async () => {
    try {
      const extra: Record<string, string> = {};
      if (sectionFilter !== "All") {
        extra.Section = sectionFilter;
      }
      if (debouncedContentSearch) {
        extra.Search = debouncedContentSearch;
      }
      const response = await adminContentApi.list(
        contentPage,
        PAGE_SIZE,
        extra
      );
      const payload =
        (response as unknown as { data?: unknown })?.data ??
        response;
      const { items, totalCount, totalPages } =
        extractPaged(payload);
      setContentRows(
        items.map((raw, index) =>
          mapContentRow(
            raw,
            (contentPage - 1) * PAGE_SIZE + index
          )
        )
      );
      setContentTotalCount(totalCount);
      setContentTotalPages(totalPages);
    } catch (error) {
      console.error("Unable to refresh content:", error);
    }
  };

  const refreshNewsletter = async () => {
    try {
      const response = await adminNewsletterApi.list(
        nlPage,
        PAGE_SIZE,
        debouncedNlSearch || undefined
      );
      const payload =
        (response as unknown as { data?: unknown })?.data ??
        response;
      const { items, totalCount, totalPages } =
        extractPaged(payload);
      setNewsletterRows(
        items.map((raw, index) =>
          mapNewsletterRow(
            raw,
            (nlPage - 1) * PAGE_SIZE + index
          )
        )
      );
      setNlTotalCount(totalCount);
      setNlTotalPages(totalPages);
    } catch (error) {
      console.error("Unable to refresh newsletter:", error);
    }
  };

  const saveContent = async () => {
    if (!validateForm()) return;
    setFormSaving(true);
    setFormError("");
    const payload: Record<string, unknown> = {
      section: form.section.trim(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
      sortOrder: Number(form.sortOrder.trim() || "0"),
      isActive: form.isActive,
    };
    try {
      if (editingId !== null) {
        const row = contentRows.find(
          (entry) => entry.id === editingId
        );
        if (!row?.serverId) {
          setFormError("Content item id is missing.");
          return;
        }
        await adminContentApi.update(row.serverId, payload);
        showToast("Content updated successfully.");
      } else {
        await adminContentApi.create(payload);
        showToast("Content created successfully.");
      }
      setShowForm(false);
      resetForm();
      await refreshContent();
    } catch (error) {
      console.error("Content save failed:", error);
      setFormError(
        "Save failed. Please check the fields and try again."
      );
    } finally {
      setFormSaving(false);
    }
  };

  /* =======================================================
     STATUS TOGGLE (#155 PATCH /api/admin/content/{id}/status)
  ======================================================== */

  const toggleStatus = async (row: ContentRow) => {
    if (!row.serverId) return;
    try {
      await adminContentApi.setStatus(
        row.serverId,
        !row.isActive
      );
      setContentRows((current) =>
        current.map((entry) =>
          entry.id === row.id
            ? { ...entry, isActive: !entry.isActive }
            : entry
        )
      );
      showToast(
        row.isActive
          ? "Content deactivated."
          : "Content activated."
      );
    } catch (error) {
      console.error("Content status update failed:", error);
      setContentError("Status update failed. Try again.");
    }
  };

  /* =======================================================
     DELETE
  ======================================================== */

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === "content") {
        const row = contentRows.find(
          (entry) => entry.id === deleteTarget.id
        );
        if (row?.serverId) {
          await adminContentApi.remove(row.serverId);
        }
        await refreshContent();
        showToast("Content deleted.");
      } else {
        const row = newsletterRows.find(
          (entry) => entry.id === deleteTarget.id
        );
        if (row?.serverId) {
          await adminNewsletterApi.remove(row.serverId);
        }
        await refreshNewsletter();
        showToast("Subscription deleted.");
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete failed:", error);
      if (deleteTarget.kind === "content") {
        setContentError("Delete failed. Try again.");
      } else {
        setNlError("Delete failed. Try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  /* =======================================================
     STYLES
  ======================================================== */

  const inputClass = (error?: string) =>
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
          {/* ============================================
              PAGE HEADER
          ============================================= */}

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
                    Content
                  </h1>
                  <p className="mt-1 text-[10px] text-[#8995A5]">
                    Manage site content sections and newsletter
                    subscriptions
                  </p>
                </div>
              </div>
              {tab === "content" && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1769F5] px-4 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#0F5BDE]"
                >
                  <Plus size={15} />
                  <span>Add Content</span>
                </button>
              )}
            </div>
          </header>

          {/* ============================================
              BREADCRUMB
          ============================================= */}

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
              Content
            </span>
          </div>

          {/* ============================================
              STATS
          ============================================= */}

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              title="Total Content"
              value={contentTotalCount}
              icon={FileText}
              bg="bg-[#EDF3FF]"
              iconColor="text-[#1769F5]"
            />
            <StatCard
              title="Active"
              value={activeCount}
              icon={CheckCircle2}
              bg="bg-[#EAF8F0]"
              iconColor="text-[#249357]"
            />
            <StatCard
              title="Inactive"
              value={inactiveCount}
              icon={EyeOff}
              bg="bg-[#FFF0F0]"
              iconColor="text-[#D85A5A]"
            />
            <StatCard
              title="Sections"
              value={Math.max(sectionOptions.length - 1, 0)}
              icon={Layers}
              bg="bg-[#F0ECFF]"
              iconColor="text-[#7053C6]"
            />
            <StatCard
              title="Subscribers"
              value={nlTotalCount}
              icon={Mail}
              bg="bg-[#FFF5DF]"
              iconColor="text-[#C17B19]"
            />
          </section>

          {/* ============================================
              TABS
          ============================================= */}

          <section className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("content")}
              className={`flex h-10 items-center gap-2 rounded-lg px-4 text-[10px] font-semibold transition ${
                tab === "content"
                  ? "bg-[#1769F5] text-white shadow-sm"
                  : "border border-[#DCE2EA] bg-white text-[#647287] hover:bg-[#F5F7FA]"
              }`}
            >
              <FileText size={14} />
              Site Content
            </button>
            <button
              type="button"
              onClick={() => setTab("newsletter")}
              className={`flex h-10 items-center gap-2 rounded-lg px-4 text-[10px] font-semibold transition ${
                tab === "newsletter"
                  ? "bg-[#1769F5] text-white shadow-sm"
                  : "border border-[#DCE2EA] bg-white text-[#647287] hover:bg-[#F5F7FA]"
              }`}
            >
              <Mail size={14} />
              Newsletter ({nlTotalCount})
            </button>
          </section>

          {tab === "content" ? (
            <>
              {/* ============================================
                  CONTENT FILTERS
              ============================================= */}

              <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <div className="flex h-10 flex-1 items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3">
                    <Search
                      size={16}
                      className="shrink-0 text-[#8995A5]"
                    />
                    <input
                      type="search"
                      value={contentSearch}
                      maxLength={100}
                      onChange={(event) =>
                        setContentSearch(event.target.value)
                      }
                      placeholder="Search title or description..."
                      className="w-full bg-transparent px-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8]"
                    />
                    {contentSearch && (
                      <button
                        type="button"
                        onClick={() => setContentSearch("")}
                        className="text-[#8995A5]"
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <select
                    value={sectionFilter}
                    onChange={(event) =>
                      setSectionFilter(event.target.value)
                    }
                    className="h-10 rounded-lg border border-[#DFE5ED] bg-white px-3 text-[10px] text-[#52627A] outline-none focus:border-[#1769F5] lg:w-[200px]"
                  >
                    {sectionOptions.map((section) => (
                      <option key={section} value={section}>
                        {section === "All"
                          ? "All Sections"
                          : section}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setContentSearch("");
                      setSectionFilter("All");
                    }}
                    className="h-10 rounded-lg border border-[#DCE2EA] px-4 text-[9px] font-semibold text-[#647287] hover:bg-[#F5F7FA]"
                  >
                    Clear Filters
                  </button>
                </div>
                {contentError && (
                  <p className="mt-3 rounded-lg border border-[#FECACA] bg-[#FFF2F2] px-3 py-2 text-[9px] font-medium text-[#DC2626]">
                    {contentError}
                  </p>
                )}
              </section>

              {/* ============================================
                  CONTENT LIST
              ============================================= */}

              <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">
                  <div>
                    <h2 className="text-[13px] font-bold text-[#293953]">
                      Site Content
                    </h2>
                    <p className="mt-1 text-[9px] text-[#8995A5]">
                      {contentTotalCount} items found
                      {contentLoading ? " — loading…" : ""}
                    </p>
                  </div>
                </div>

                {contentRows.length === 0 && !contentLoading ? (
                  <div className="flex flex-col items-center px-5 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                      <FileText size={25} />
                    </div>
                    <h3 className="mt-4 text-[13px] font-bold">
                      No content found
                    </h3>
                    <p className="mt-1 text-[10px] text-[#8995A5]">
                      Try changing your search or filters, or
                      add a new item.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">
                            <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                              Title
                            </th>
                            <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                              Section
                            </th>
                            <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                              Description
                            </th>
                            <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                              Status
                            </th>
                            <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                              Updated
                            </th>
                            <th className="px-5 py-3 text-right text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {contentRows.map((row) => (
                            <tr
                              key={row.id}
                              className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                            >
                              <td className="px-5 py-4">
                                <p className="max-w-[220px] truncate text-[10px] font-bold text-[#33415A]">
                                  {row.title}
                                </p>
                                <p className="mt-1 text-[8px] text-[#8995A5]">
                                  Sort: {row.sortOrder}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[8px] font-medium text-[#66748B]">
                                  {row.section || "—"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <p className="max-w-[280px] truncate text-[9px] text-[#52627A]">
                                  {row.description || "—"}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleStatus(row)
                                  }
                                  title={
                                    row.isActive
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                  className={`inline-flex rounded-full px-2.5 py-1 text-[7px] font-semibold ${
                                    row.isActive
                                      ? "bg-[#EAF8F0] text-[#249357]"
                                      : "bg-[#FFF0F0] text-[#D85A5A]"
                                  }`}
                                >
                                  {row.isActive
                                    ? "Active"
                                    : "Inactive"}
                                </button>
                              </td>
                              <td className="px-5 py-4">
                                <span className="text-[9px] text-[#52627A]">
                                  {formatDate(row.updatedAt)}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-1.5">
                                  <ActionButton
                                    label="Edit"
                                    blue
                                    onClick={() =>
                                      openEdit(row)
                                    }
                                  >
                                    <Pencil size={13} />
                                  </ActionButton>
                                  <ActionButton
                                    label="Delete"
                                    danger
                                    onClick={() =>
                                      setDeleteTarget({
                                        kind: "content",
                                        id: row.id,
                                      })
                                    }
                                  >
                                    <Trash2 size={13} />
                                  </ActionButton>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="divide-y divide-[#EDF0F4] md:hidden">
                      {contentRows.map((row) => (
                        <div key={row.id} className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[10px] font-bold text-[#33415A]">
                                {row.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-[8px] text-[#8995A5]">
                                {row.description || "No description"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleStatus(row)}
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[7px] font-semibold ${
                                row.isActive
                                  ? "bg-[#EAF8F0] text-[#249357]"
                                  : "bg-[#FFF0F0] text-[#D85A5A]"
                              }`}
                            >
                              {row.isActive
                                ? "Active"
                                : "Inactive"}
                            </button>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#F2F4F7] px-2 py-1 text-[7px] text-[#66748B]">
                              {row.section || "—"}
                            </span>
                            <span className="text-[8px] text-[#8995A5]">
                              Updated {formatDate(row.updatedAt)}
                            </span>
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <MobileAction
                              label="Edit"
                              blue
                              onClick={() => openEdit(row)}
                            >
                              <Pencil size={12} />
                            </MobileAction>
                            <MobileAction
                              label="Delete"
                              danger
                              onClick={() =>
                                setDeleteTarget({
                                  kind: "content",
                                  id: row.id,
                                })
                              }
                            >
                              <Trash2 size={12} />
                            </MobileAction>
                          </div>
                        </div>
                      ))}
                    </div>

                    <PaginationBar
                      page={contentPage}
                      totalPages={contentTotalPages}
                      totalCount={contentTotalCount}
                      shown={contentRows.length}
                      onPrev={() =>
                        setContentPage((p) => Math.max(p - 1, 1))
                      }
                      onNext={() =>
                        setContentPage((p) =>
                          Math.min(p + 1, contentTotalPages)
                        )
                      }
                    />
                  </>
                )}
              </section>
            </>
          ) : (
            <>
              {/* ============================================
                  NEWSLETTER FILTERS
              ============================================= */}

              <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <div className="flex h-10 flex-1 items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3">
                    <Search
                      size={16}
                      className="shrink-0 text-[#8995A5]"
                    />
                    <input
                      type="search"
                      value={nlSearch}
                      maxLength={100}
                      onChange={(event) =>
                        setNlSearch(event.target.value)
                      }
                      placeholder="Search email or source..."
                      className="w-full bg-transparent px-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8]"
                    />
                    {nlSearch && (
                      <button
                        type="button"
                        onClick={() => setNlSearch("")}
                        className="text-[#8995A5]"
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNlSearch("")}
                    className="h-10 rounded-lg border border-[#DCE2EA] px-4 text-[9px] font-semibold text-[#647287] hover:bg-[#F5F7FA]"
                  >
                    Clear Search
                  </button>
                </div>
                {nlError && (
                  <p className="mt-3 rounded-lg border border-[#FECACA] bg-[#FFF2F2] px-3 py-2 text-[9px] font-medium text-[#DC2626]">
                    {nlError}
                  </p>
                )}
              </section>

              {/* ============================================
                  NEWSLETTER LIST
              ============================================= */}

              <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">
                  <div>
                    <h2 className="text-[13px] font-bold text-[#293953]">
                      Newsletter Subscriptions
                    </h2>
                    <p className="mt-1 text-[9px] text-[#8995A5]">
                      {nlTotalCount} subscribers found
                      {nlLoading ? " — loading…" : ""}
                    </p>
                  </div>
                </div>

                {newsletterRows.length === 0 && !nlLoading ? (
                  <div className="flex flex-col items-center px-5 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                      <Mail size={25} />
                    </div>
                    <h3 className="mt-4 text-[13px] font-bold">
                      No subscribers found
                    </h3>
                    <p className="mt-1 text-[10px] text-[#8995A5]">
                      Try changing your search.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">
                            <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                              Email
                            </th>
                            <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                              Source
                            </th>
                            <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                              Created
                            </th>
                            <th className="px-5 py-3 text-right text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {newsletterRows.map((row) => (
                            <tr
                              key={row.id}
                              className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                            >
                              <td className="px-5 py-4">
                                <p className="text-[10px] font-bold text-[#33415A]">
                                  {row.email}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[8px] font-medium text-[#66748B]">
                                  {row.source}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="text-[9px] text-[#52627A]">
                                  {formatDate(row.createdAt)}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-1.5">
                                  <ActionButton
                                    label="Delete"
                                    danger
                                    onClick={() =>
                                      setDeleteTarget({
                                        kind: "newsletter",
                                        id: row.id,
                                      })
                                    }
                                  >
                                    <Trash2 size={13} />
                                  </ActionButton>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="divide-y divide-[#EDF0F4] md:hidden">
                      {newsletterRows.map((row) => (
                        <div key={row.id} className="p-4">
                          <p className="truncate text-[10px] font-bold text-[#33415A]">
                            {row.email}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#F2F4F7] px-2 py-1 text-[7px] text-[#66748B]">
                              {row.source}
                            </span>
                            <span className="text-[8px] text-[#8995A5]">
                              {formatDate(row.createdAt)}
                            </span>
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <MobileAction
                              label="Delete"
                              danger
                              onClick={() =>
                                setDeleteTarget({
                                  kind: "newsletter",
                                  id: row.id,
                                })
                              }
                            >
                              <Trash2 size={12} />
                            </MobileAction>
                          </div>
                        </div>
                      ))}
                    </div>

                    <PaginationBar
                      page={nlPage}
                      totalPages={nlTotalPages}
                      totalCount={nlTotalCount}
                      shown={newsletterRows.length}
                      onPrev={() =>
                        setNlPage((p) => Math.max(p - 1, 1))
                      }
                      onNext={() =>
                        setNlPage((p) =>
                          Math.min(p + 1, nlTotalPages)
                        )
                      }
                    />
                  </>
                )}
              </section>
            </>
          )}

          {/* ============================================
              CREATE / EDIT MODAL
          ============================================= */}

          {showForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
              <button
                type="button"
                aria-label="Close modal"
                onClick={closeForm}
                className="absolute inset-0 cursor-default"
              />
              <div className="relative max-h-[92vh] w-full max-w-[700px] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">
                  <div>
                    <h2 className="text-[14px] font-bold text-[#263650]">
                      {editingId !== null
                        ? "Edit Content"
                        : "Add Content"}
                    </h2>
                    <p className="mt-1 text-[9px] text-[#8995A5]">
                      Manage a site content block (section,
                      copy, links)
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

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[9px] font-semibold text-[#52627A]">
                        Section
                        <span className="ml-1 text-[#EF4444]">
                          *
                        </span>
                      </label>
                      <input
                        type="text"
                        value={form.section}
                        list="content-section-options"
                        maxLength={100}
                        onChange={(event) =>
                          updateField(
                            "section",
                            event.target.value
                          )
                        }
                        placeholder="e.g. faqs"
                        aria-invalid={!!errors.section}
                        className={inputClass(errors.section)}
                      />
                      <datalist id="content-section-options">
                        {KNOWN_SECTIONS.map((section) => (
                          <option
                            key={section}
                            value={section}
                          />
                        ))}
                      </datalist>
                      {errors.section && (
                        <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                          {errors.section}
                        </p>
                      )}
                    </div>
                    <FormInput
                      label="Title"
                      value={form.title}
                      placeholder="Enter content title"
                      required
                      maxLength={200}
                      error={errors.title}
                      onChange={(value) =>
                        updateField("title", value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-semibold text-[#52627A]">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      maxLength={2000}
                      rows={4}
                      onChange={(event) =>
                        updateField(
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Enter description or body copy"
                      aria-invalid={!!errors.description}
                      className={`mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] ${
                        errors.description
                          ? "border-[#EF4444] bg-[#FFF8F8] focus:border-[#EF4444]"
                          : "border-[#DCE2EA] focus:border-[#1769F5]"
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
                        {errors.description}
                      </p>
                    )}
                    <p className="mt-1 text-right text-[7px] text-[#A0AAB8]">
                      {form.description.length}/2000
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput
                      label="Image URL"
                      value={form.imageUrl}
                      placeholder="https://… or /uploads/…"
                      error={errors.imageUrl}
                      onChange={(value) =>
                        updateField("imageUrl", value)
                      }
                    />
                    <FormInput
                      label="Link URL"
                      value={form.linkUrl}
                      placeholder="https://… or /contact"
                      error={errors.linkUrl}
                      onChange={(value) =>
                        updateField("linkUrl", value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput
                      label="Sort Order"
                      value={form.sortOrder}
                      placeholder="0"
                      type="number"
                      error={errors.sortOrder}
                      onChange={(value) =>
                        updateField("sortOrder", value)
                      }
                    />
                    <div>
                      <label className="text-[9px] font-semibold text-[#52627A]">
                        Status
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            "isActive",
                            !form.isActive
                          )
                        }
                        className={`mt-1.5 flex h-10 w-full items-center justify-between rounded-lg border px-3 text-[10px] font-semibold outline-none ${
                          form.isActive
                            ? "border-[#BFE6CF] bg-[#F2FBF6] text-[#249357]"
                            : "border-[#F0D4D4] bg-[#FFF5F5] text-[#D85A5A]"
                        }`}
                      >
                        {form.isActive
                          ? "Active"
                          : "Inactive"}
                        <span
                          className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${
                            form.isActive
                              ? "justify-end bg-[#249357]"
                              : "justify-start bg-[#D85A5A]"
                          }`}
                        >
                          <span className="h-4 w-4 rounded-full bg-white" />
                        </span>
                      </button>
                    </div>
                  </div>

                  {formError && (
                    <div className="rounded-lg border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">
                      <p className="text-[9px] font-semibold text-[#DC2626]">
                        {formError}
                      </p>
                    </div>
                  )}

                  {Object.keys(errors).length > 0 && (
                    <div className="rounded-lg border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">
                      <p className="text-[9px] font-semibold text-[#DC2626]">
                        Please correct the highlighted fields
                        before saving.
                      </p>
                    </div>
                  )}
                </div>

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
                    onClick={saveContent}
                    disabled={formSaving}
                    className="h-9 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] disabled:opacity-60"
                  >
                    {formSaving
                      ? "Saving…"
                      : editingId !== null
                        ? "Update Content"
                        : "Save Content"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================
              DELETE MODAL
          ============================================= */}

          {deleteTarget !== null && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDeleteTarget(null)}
                className="absolute inset-0 cursor-default"
              />
              <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D85A5A]">
                  <Trash2 size={20} />
                </div>
                <h2 className="mt-4 text-[14px] font-bold text-[#263650]">
                  {deleteTarget.kind === "content"
                    ? "Delete Content?"
                    : "Delete Subscription?"}
                </h2>
                <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
                  {deleteTarget.kind === "content"
                    ? "This content block will be permanently removed."
                    : "This subscriber will be permanently removed from the newsletter list."}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D] disabled:opacity-60"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================
              SUCCESS TOAST
          ============================================= */}

          {toast && (
            <div className="fixed bottom-5 right-5 z-[150] flex items-center rounded-xl bg-[#173B7A] px-5 py-3 text-white shadow-xl">
              <CheckCircle2
                size={17}
                className="mr-2 text-[#69D393]"
              />
              <div>
                <p className="text-[10px] font-bold">Done</p>
                <p className="mt-0.5 text-[8px] text-[#C8D4E7]">
                  {toast}
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
            {typeof value === "number"
              ? value.toLocaleString()
              : value}
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
          <span className="ml-1 text-[#EF4444]">*</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
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
   PAGINATION BAR
============================================================ */

function PaginationBar({
  page,
  totalPages,
  totalCount,
  shown,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  shown: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-[#EDF0F4] px-5 py-4">
      <p className="text-[9px] text-[#8995A5]">
        Showing{" "}
        <span className="font-semibold text-[#4D5C72]">
          {shown}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-[#4D5C72]">
          {totalCount}
        </span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E1E6ED] text-[#52627A] disabled:text-[#B3BBC6]"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-[#173B7A] px-2 text-[9px] font-semibold text-white">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E1E6ED] text-[#52627A] disabled:text-[#B3BBC6]"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
