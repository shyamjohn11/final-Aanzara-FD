// File: src/app/admin/product-tree/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Search,
  Layers3,
  FolderTree,
  Package,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";

import AdminLayout from "@/app/components/Admin/AdminLayout";
import { extractErrorMessage } from "@/app/api/api";
import { productTreeApi } from "@/app/api/services";

/* ============================================================
   TYPES (#42 tree: counts only, no product rows)
============================================================ */

type TreeSubCategory = {
  subCategoryId: string;
  subCategoryCode: string;
  subCategoryName: string;
  isActive: boolean;
  productCount: number;
};

type TreeCategory = {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  isActive: boolean;
  primaryImageUrl: string;
  productCount: number;
  subCategories: TreeSubCategory[];
};

/* ============================================================
   PAGE
============================================================ */

export default function ProductTreePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<TreeCategory[]>([]);
  const [totals, setTotals] = useState({
    totalCategories: 0,
    totalSubCategories: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /* ==========================================================
     LOAD (#42 activeOnly=false admin view)
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await productTreeApi.full(false);
        const payload: any = (response as any)?.data ?? response;
        const data = payload?.data ?? payload;

        const rawCats: any[] = Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
              ? data
              : [];
        if (cancelled) return;

        const mapped: TreeCategory[] = rawCats.map((raw: any) => {
          const subs: any[] = Array.isArray(raw.subCategories)
            ? raw.subCategories
            : Array.isArray(raw.subcategories)
              ? raw.subcategories
              : [];
          return {
            categoryId: String(raw.categoryId ?? raw.id ?? ""),
            categoryCode: String(raw.categoryCode ?? raw.code ?? ""),
            categoryName: String(
              raw.categoryName ?? raw.name ?? "Untitled category"
            ),
            isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
            primaryImageUrl: String(
              raw.primaryImageUrl ?? raw.imageUrl ?? raw.image ?? ""
            ),
            productCount: Number(
              raw.productCount ?? raw.productsCount ?? raw.totalProducts ?? 0
            ),
            subCategories: subs.map((sub: any) => ({
              subCategoryId: String(sub.subCategoryId ?? sub.id ?? ""),
              subCategoryCode: String(sub.subCategoryCode ?? sub.code ?? ""),
              subCategoryName: String(
                sub.subCategoryName ?? sub.name ?? "Untitled"
              ),
              isActive: Boolean(sub.isActive ?? sub.is_active ?? true),
              productCount: Number(
                sub.productCount ?? sub.productsCount ?? 0
              ),
            })),
          };
        });

        setCategories(mapped.filter((cat) => cat.categoryId));
        setTotals({
          totalCategories: Number(
            data?.totalCategories ?? mapped.length
          ),
          totalSubCategories: Number(
            data?.totalSubCategories ??
              mapped.reduce((sum, cat) => sum + cat.subCategories.length, 0)
          ),
          totalProducts: Number(
            data?.totalProducts ??
              mapped.reduce((sum, cat) => sum + cat.productCount, 0)
          ),
        });
      } catch (err) {
        console.error("Unable to load product tree:", err);
        if (!cancelled) {
          setCategories([]);
          setError(
            extractErrorMessage(err, "Failed to load the product tree.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     FILTER + EXPAND
  ========================================================== */

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        subCategories: cat.subCategories.filter(
          (sub) =>
            sub.subCategoryName.toLowerCase().includes(query) ||
            sub.subCategoryCode.toLowerCase().includes(query)
        ),
      }))
      .filter(
        (cat) =>
          cat.categoryName.toLowerCase().includes(query) ||
          cat.categoryCode.toLowerCase().includes(query) ||
          cat.subCategories.length > 0
      );
  }, [categories, search]);

  const toggleExpand = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () =>
    setExpanded(new Set(filtered.map((cat) => cat.categoryId)));
  const collapseAll = () => setExpanded(new Set());

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">
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
            <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
              Product Tree
            </h1>
            <p className="hidden text-[9px] text-[#8995A5] sm:block">
              Category → subcategory catalogue (admin view, incl. inactive)
            </p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <div className="mb-5 flex items-center gap-2 text-[9px] text-[#8A96A7]">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="hover:text-[#1769F5]"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="font-medium text-[#566579]">Product Tree</span>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[11px] text-red-600">{error}</p>
            </div>
          )}

          {/* STATS */}
          <section className="grid grid-cols-3 gap-3">
            <StatBox
              label="Categories"
              value={loading ? "…" : totals.totalCategories}
              icon={<Layers3 size={17} />}
            />
            <StatBox
              label="Subcategories"
              value={loading ? "…" : totals.totalSubCategories}
              icon={<FolderTree size={17} />}
            />
            <StatBox
              label="Products"
              value={loading ? "…" : totals.totalProducts}
              icon={<Package size={17} />}
            />
          </section>

          {/* TOOLBAR */}
          <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3 sm:max-w-[420px]">
              <Search size={16} className="shrink-0 text-[#8995A5]" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories or subcategories..."
                className="h-full w-full bg-transparent px-2.5 text-[11px] text-[#263A59] outline-none placeholder:text-[#A0AAB8]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-[#8995A5]"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={expandAll}
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287] hover:bg-[#F7F9FC]"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287] hover:bg-[#F7F9FC]"
              >
                Collapse
              </button>
            </div>
          </section>

          {/* TREE */}
          <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E4E8EF] border-t-[#1769F5]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <FolderTree size={25} className="mx-auto text-[#4773C5]" />
                <h3 className="mt-4 text-[13px] font-bold text-[#33415A]">
                  No categories found
                </h3>
                <p className="mt-1 text-[10px] text-[#8995A5]">
                  {search
                    ? "Try a different search."
                    : "No catalogue data returned."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EDF0F4]">
                {filtered.map((cat) => {
                  const isOpen = expanded.has(cat.categoryId);
                  return (
                    <div key={cat.categoryId}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(cat.categoryId)}
                        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-[#FCFDFE]"
                      >
                        <span className="text-[#98A3B2]">
                          {isOpen ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </span>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#EDF3FF] text-[#3260B4]">
                          {cat.primaryImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cat.primaryImageUrl}
                              alt={cat.categoryName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Layers3 size={18} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-bold text-[#33415A]">
                            {cat.categoryName}
                          </span>
                          <span className="mt-0.5 block font-mono text-[8px] text-[#8A96A7]">
                            {cat.categoryCode} ·{" "}
                            {cat.subCategories.length} subcategories ·{" "}
                            {cat.productCount} products
                          </span>
                        </span>
                        {cat.isActive ? (
                          <CheckCircle2 size={15} className="shrink-0 text-[#249357]" />
                        ) : (
                          <XCircle size={15} className="shrink-0 text-[#D85A5A]" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="border-t border-[#F0F2F5] bg-[#FAFBFD] px-5 py-2 pl-[68px]">
                          {cat.subCategories.length === 0 ? (
                            <p className="py-3 text-[10px] text-[#8995A5]">
                              No subcategories.
                            </p>
                          ) : (
                            cat.subCategories.map((sub) => (
                              <div
                                key={sub.subCategoryId}
                                className="flex items-center gap-3 border-b border-[#EDF0F4] py-2.5 last:border-0"
                              >
                                <FolderTree
                                  size={14}
                                  className="shrink-0 text-[#8090A6]"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[11px] font-semibold text-[#33415A]">
                                    {sub.subCategoryName}
                                  </p>
                                  <p className="font-mono text-[8px] text-[#8A96A7]">
                                    {sub.subCategoryCode} ·{" "}
                                    {sub.productCount} products
                                  </p>
                                </div>
                                {sub.isActive ? (
                                  <CheckCircle2
                                    size={14}
                                    className="shrink-0 text-[#249357]"
                                  />
                                ) : (
                                  <XCircle
                                    size={14}
                                    className="shrink-0 text-[#D85A5A]"
                                  />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
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
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#E4E8EF] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-medium text-[#8995A5]">{label}</p>
          <p className="mt-2 text-[20px] font-bold text-[#293953]">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#3260B4]">
          {icon}
        </div>
      </div>
    </div>
  );
}
