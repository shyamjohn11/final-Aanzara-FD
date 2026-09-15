"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { wishlistInsightsApi } from "@/app/api/services";
import {
  ArrowLeft,
  Search,
  Heart,
  Users,
  Package,
  TrendingUp,
  Eye,
  X,
  Trash2,
  ChevronDown,
  BarChart3,
  ShoppingCart,
} from "lucide-react";

type WishlistItem = {
  id: number;
  product: string;
  sku: string;
  category: string;
  brand: string;
  price: string;
  users: number;
  added: string;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
};

export default function WishlistInsightsPage() {
  const router = useRouter();

  const [items, setItems] =
    useState<WishlistItem[]>([]);

  /* =====================================================
     LOAD (#147 GET /api/admin/wishlist-insights)
     Read-only page: no mutations needed.
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await wishlistInsightsApi.get();
        const payload = (response as any)?.data ?? response;
        const data = (payload as any)?.data ?? payload;
        const raw: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.insights)
              ? data.insights
              : Array.isArray(data?.products)
                ? data.products
                : [];
        if (cancelled) return;
        if (raw.length === 0) {
          setItems([]);
          return;
        }
        const mapped: WishlistItem[] = raw.map((item: any, index: number) => {
          const stock = Number(item?.stock ?? item?.stockQty ?? item?.quantity ?? 0);
          return {
            id: index + 1,
            product: String(item?.product ?? item?.productName ?? "Product"),
            sku: String(item?.sku ?? item?.skuCode ?? ""),
            category: String(item?.category ?? item?.categoryName ?? ""),
            brand: String(item?.brand ?? item?.brandName ?? ""),
            price: String(
              item?.price ??
                (item?.priceValue != null ? `₹${item.priceValue}` : "₹0"),
            ),
            users: Number(
              item?.users ?? item?.wishlistCount ?? item?.wishlistUsers ?? 0,
            ),
            added: String(item?.added ?? item?.addedOn ?? item?.createdAt ?? ""),
            stock,
            status: ((): WishlistItem["status"] =>
              item?.status === "Low Stock" || item?.status === "Out of Stock"
                ? item.status
                : stock <= 0
                  ? "Out of Stock"
                  : "In Stock")(),
          };
        });
        setItems(mapped);
      } catch {
        if (!cancelled) setItems([]);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [category, setCategory] =
    useState("All Categories");

  const [stockFilter, setStockFilter] =
    useState("All Stock");

  const [selectedItem, setSelectedItem] =
    useState<WishlistItem | null>(null);

  const [showAnalytics, setShowAnalytics] =
    useState(false);

  const categories = useMemo(() => {
    return [
      "All Categories",
      ...Array.from(
        new Set(
          items.map((item) => item.category)
        )
      ),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.product
          .toLowerCase()
          .includes(query) ||
        item.sku
          .toLowerCase()
          .includes(query) ||
        item.brand
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "All Categories" ||
        item.category === category;

      const matchesStock =
        stockFilter === "All Stock" ||
        item.status === stockFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock
      );
    });
  }, [
    items,
    search,
    category,
    stockFilter,
  ]);

  /* =====================================================
     ANALYTICS
  ====================================================== */

  const totalWishlistUsers = items.reduce(
    (sum, item) => sum + item.users,
    0
  );

  const totalProducts = items.length;

  const lowStockProducts = items.filter(
    (item) => item.status === "Low Stock"
  ).length;

  const outOfStockProducts = items.filter(
    (item) => item.status === "Out of Stock"
  ).length;

  const averageWishlistUsers =
    totalProducts > 0
      ? Math.round(
          totalWishlistUsers /
            totalProducts
        )
      : 0;

  const topProduct =
    items.length > 0
      ? [...items].sort(
          (a, b) => b.users - a.users
        )[0]
      : null;

  const inStockProducts = items.filter(
    (item) => item.status === "In Stock"
  ).length;

  const removeItem = (id: number) => {
    setItems((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );

    setSelectedItem(null);
  };

  return (
    <AdminLayout>
      <main className="min-h-screen bg-[#F5F7FA] text-[#1F2F49]">

      {/* =================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-[#E4E8EF] bg-white px-4 sm:px-6 lg:px-8">

        <button
          type="button"
          onClick={() =>
            router.push("/admin")
          }
          aria-label="Back to admin"
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] hover:bg-[#F1F4F8]"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
            Wishlist Insights
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Analyze customer wishlist activity and product demand
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowAnalytics(
              !showAnalytics
            )
          }
          className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] font-semibold text-[#52627A] hover:bg-[#F5F7FA] sm:px-4"
        >
          <BarChart3 size={15} />

          <span className="hidden sm:inline">
            {showAnalytics
              ? "Hide Analytics"
              : "View Analytics"}
          </span>

          <span className="sm:hidden">
            Analytics
          </span>
        </button>

      </header>

      {/* =================================================
          CONTENT
      ================================================== */}

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* BREADCRUMB */}

        <div className="mb-5 flex items-center gap-2 text-[9px] text-[#8995A5]">

          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="hover:text-[#1769F5]"
          >
            Dashboard
          </button>

          <span>/</span>

          <span className="font-medium text-[#566579]">
            Wishlist Insights
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

          <InsightCard
            title="Wishlist Products"
            value={totalProducts}
            subtitle="Products being watched"
            icon={Heart}
            bg="bg-[#FFF0F4]"
            iconColor="text-[#E65378]"
          />

          <InsightCard
            title="Wishlist Users"
            value={totalWishlistUsers}
            subtitle="Total wishlist additions"
            icon={Users}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#1769F5]"
          />

          <InsightCard
            title="Avg. per Product"
            value={averageWishlistUsers}
            subtitle="Average users"
            icon={TrendingUp}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <InsightCard
            title="Low Stock"
            value={lowStockProducts}
            subtitle="Needs attention"
            icon={Package}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

          <InsightCard
            title="Out of Stock"
            value={outOfStockProducts}
            subtitle="Potential lost sales"
            icon={ShoppingCart}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

        </section>

        {/* =================================================
            TOP PRODUCT
        ================================================== */}

        {topProduct && (
          <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F4] text-[#E65378]">
                <Heart
                  size={22}
                  fill="currentColor"
                />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-[8px] font-semibold uppercase tracking-wider text-[#9AA5B4]">
                  Most Wishlisted Product
                </p>

                <h2 className="mt-1 truncate text-[13px] font-bold text-[#293953]">
                  {topProduct.product}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  {topProduct.brand} ·{" "}
                  {topProduct.sku}
                </p>

              </div>

              <div className="sm:text-right">

                <p className="text-[22px] font-bold text-[#E65378]">
                  {topProduct.users}
                </p>

                <p className="text-[8px] text-[#8995A5]">
                  wishlist users
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedItem(
                    topProduct
                  )
                }
                className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#173B7A] px-4 text-[9px] font-semibold text-white hover:bg-[#102E63]"
              >
                <Eye size={13} />
                View Product
              </button>

            </div>

          </section>
        )}

        {/* =================================================
            ANALYTICS
        ================================================== */}

        {showAnalytics && (
          <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* DEMAND CHART */}

            <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-[13px] font-bold text-[#293953]">
                    Wishlist Demand
                  </h2>

                  <p className="mt-1 text-[9px] text-[#8995A5]">
                    Products ranked by wishlist users
                  </p>
                </div>

                <TrendingUp
                  size={18}
                  className="text-[#1769F5]"
                />

              </div>

              <div className="mt-5 space-y-4">

                {[...items]
                  .sort(
                    (a, b) =>
                      b.users - a.users
                  )
                  .slice(0, 6)
                  .map((item) => {

                    const maxUsers =
                      topProduct?.users ||
                      1;

                    const percentage =
                      Math.max(
                        5,
                        Math.round(
                          (item.users /
                            maxUsers) *
                            100
                        )
                      );

                    return (
                      <div
                        key={item.id}
                      >

                        <div className="mb-1.5 flex items-center justify-between">

                          <p className="max-w-[70%] truncate text-[9px] font-semibold text-[#52627A]">
                            {item.product}
                          </p>

                          <span className="text-[9px] font-bold text-[#1769F5]">
                            {item.users}
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-[#EDF1F5]">

                          <div
                            className="h-full rounded-full bg-[#1769F5] transition-all"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />

                        </div>

                      </div>
                    );
                  })}

              </div>

            </div>

            {/* STOCK ANALYSIS */}

            <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-[13px] font-bold text-[#293953]">
                    Stock vs Wishlist
                  </h2>

                  <p className="mt-1 text-[9px] text-[#8995A5]">
                    Products with stock risk
                  </p>
                </div>

                <Package
                  size={18}
                  className="text-[#C17B19]"
                />

              </div>

              <div className="mt-5 space-y-3">

                {items
                  .filter(
                    (item) =>
                      item.status !==
                      "In Stock"
                  )
                  .sort(
                    (a, b) =>
                      b.users - a.users
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center rounded-xl bg-[#FAFBFD] p-3"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF5DF] text-[#C17B19]">
                        <Package
                          size={15}
                        />
                      </div>

                      <div className="ml-3 min-w-0 flex-1">

                        <p className="truncate text-[9px] font-semibold text-[#52627A]">
                          {item.product}
                        </p>

                        <p className="mt-1 text-[8px] text-[#8995A5]">
                          {item.users} wishlist users
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-[9px] font-bold text-[#D85A5A]">
                          {item.stock}
                        </p>

                        <p className="text-[7px] text-[#8995A5]">
                          stock
                        </p>

                      </div>

                    </div>
                  ))}

                {items.filter(
                  (item) =>
                    item.status !==
                    "In Stock"
                ).length === 0 && (
                  <div className="py-8 text-center">

                    <CheckCircleIcon />

                    <p className="mt-2 text-[10px] font-semibold text-[#249357]">
                      All wishlist products are in stock
                    </p>

                  </div>
                )}

              </div>

            </div>

          </section>
        )}

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
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product, SKU or brand..."
                className="w-full bg-transparent px-2.5 text-[10px] outline-none placeholder:text-[#A0AAB8]"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="text-[#8995A5]"
                >
                  <X size={14} />
                </button>
              )}

            </div>

            {/* CATEGORY */}

            <div className="relative">

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="h-10 w-full appearance-none rounded-lg border border-[#DFE5ED] bg-white px-3 pr-9 text-[10px] text-[#52627A] outline-none focus:border-[#1769F5] lg:w-[190px]"
              >
                {categories.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-3 text-[#8995A5]"
              />

            </div>

            {/* STOCK */}

            <div className="relative">

              <select
                value={stockFilter}
                onChange={(event) =>
                  setStockFilter(
                    event.target.value
                  )
                }
                className="h-10 w-full appearance-none rounded-lg border border-[#DFE5ED] bg-white px-3 pr-9 text-[10px] text-[#52627A] outline-none focus:border-[#1769F5] lg:w-[160px]"
              >

                <option value="All Stock">
                  All Stock
                </option>

                <option value="In Stock">
                  In Stock
                </option>

                <option value="Low Stock">
                  Low Stock
                </option>

                <option value="Out of Stock">
                  Out of Stock
                </option>

              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-3 text-[#8995A5]"
              />

            </div>

            {/* CLEAR */}

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory(
                  "All Categories"
                );
                setStockFilter(
                  "All Stock"
                );
              }}
              className="h-10 rounded-lg border border-[#DCE2EA] px-4 text-[9px] font-semibold text-[#647287] hover:bg-[#F5F7FA]"
            >
              Clear Filters
            </button>

          </div>

        </section>

        {/* =================================================
            TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#293953]">
                Wishlist Product Insights
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredItems.length} products found
              </p>

            </div>

            <div className="hidden items-center gap-1.5 text-[8px] text-[#8995A5] sm:flex">

              <Heart
                size={12}
                className="text-[#E65378]"
                fill="currentColor"
              />

              Higher wishlist count = higher demand

            </div>

          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0F4] text-[#E65378]">
                <Heart size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No wishlist products found
              </h3>

              <p className="mt-1 text-[10px] text-[#8995A5]">
                Try changing your search or filters.
              </p>

            </div>
          ) : (
            <>
              {/* DESKTOP */}

              <div className="hidden overflow-x-auto md:block">

                <table className="min-w-full">

                  <thead>

                    <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Product
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Category
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Price
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Wishlist Users
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Stock
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Added
                      </th>

                      <th className="px-5 py-3 text-right text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredItems.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F4] text-[#E65378]">
                                <Heart
                                  size={17}
                                  fill="currentColor"
                                />
                              </div>

                              <div className="min-w-0">

                                <p className="max-w-[250px] truncate text-[10px] font-bold text-[#33415A]">
                                  {item.product}
                                </p>

                                <p className="mt-1 text-[8px] text-[#8995A5]">
                                  {item.brand} ·{" "}
                                  {item.sku}
                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-5 py-4">

                            <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[8px] font-medium text-[#66748B]">
                              {item.category}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-bold text-[#33415A]">
                              {item.price}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Heart
                                size={13}
                                className="text-[#E65378]"
                                fill="currentColor"
                              />

                              <span className="text-[10px] font-bold text-[#E65378]">
                                {item.users}
                              </span>

                            </div>

                          </td>

                          <td className="px-5 py-4">

                            <div>

                              <p className="text-[9px] font-semibold text-[#52627A]">
                                {item.stock}
                              </p>

                              <div className="mt-1">
                                <StockBadge
                                  status={
                                    item.status
                                  }
                                />
                              </div>

                            </div>

                          </td>

                          <td className="px-5 py-4">

                            <span className="text-[9px] text-[#66748B]">
                              {item.added}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedItem(
                                    item
                                  )
                                }
                                className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[8px] font-semibold text-[#1769F5] hover:bg-[#EDF3FF]"
                              >
                                <Eye size={12} />
                                View
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* MOBILE */}

              <div className="divide-y divide-[#EDF0F4] md:hidden">

                {filteredItems.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="p-4"
                    >

                      <div className="flex gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F4] text-[#E65378]">
                          <Heart
                            size={17}
                            fill="currentColor"
                          />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-[10px] font-bold text-[#33415A]">
                                {item.product}
                              </p>

                              <p className="mt-1 text-[8px] text-[#8995A5]">
                                {item.brand} ·{" "}
                                {item.sku}
                              </p>

                            </div>

                            <span className="shrink-0 text-[10px] font-bold text-[#E65378]">
                              {item.users}
                            </span>

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <InfoBox
                              label="Category"
                              value={
                                item.category
                              }
                            />

                            <InfoBox
                              label="Price"
                              value={
                                item.price
                              }
                            />

                            <InfoBox
                              label="Stock"
                              value={`${item.stock} · ${item.status}`}
                            />

                            <InfoBox
                              label="Added"
                              value={
                                item.added
                              }
                            />

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedItem(
                                item
                              )
                            }
                            className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-[#DCE2EA] text-[9px] font-semibold text-[#1769F5]"
                          >
                            <Eye size={12} />
                            View Insights
                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            </>
          )}

        </section>

        {/* FOOTER INFO */}

        <div className="mt-5 flex items-center justify-center gap-2 text-center text-[8px] text-[#9AA5B4]">

          <Heart
            size={11}
            className="text-[#E65378]"
          />

          Wishlist insights help identify high-demand products and stock opportunities.

        </div>

      </div>

      {/* =================================================
          VIEW MODAL
      ================================================== */}

      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <button
            type="button"
            aria-label="Close"
            onClick={() =>
              setSelectedItem(null)
            }
            className="absolute inset-0 cursor-default"
          />

          <div className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF0F4] text-[#E65378]">
                  <Heart
                    size={18}
                    fill="currentColor"
                  />
                </div>

                <div>

                  <h2 className="max-w-[350px] truncate text-[13px] font-bold text-[#263650]">
                    {selectedItem.product}
                  </h2>

                  <p className="mt-1 text-[8px] text-[#8995A5]">
                    {selectedItem.sku}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedItem(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="space-y-4 p-5">

              {/* WISHLIST SCORE */}

              <div className="rounded-xl bg-[#FFF4F7] p-5 text-center">

                <Heart
                  size={28}
                  className="mx-auto text-[#E65378]"
                  fill="currentColor"
                />

                <p className="mt-2 text-[28px] font-bold text-[#E65378]">
                  {selectedItem.users}
                </p>

                <p className="text-[9px] text-[#8995A5]">
                  customers added this product to wishlist
                </p>

              </div>

              {/* DETAILS */}

              <div className="grid grid-cols-2 gap-3">

                <DetailBox
                  label="Brand"
                  value={
                    selectedItem.brand
                  }
                />

                <DetailBox
                  label="Category"
                  value={
                    selectedItem.category
                  }
                />

                <DetailBox
                  label="Price"
                  value={
                    selectedItem.price
                  }
                />

                <DetailBox
                  label="Wishlist Rank"
                  value={`#${[
                    ...items,
                  ]
                    .sort(
                      (a, b) =>
                        b.users - a.users
                    )
                    .findIndex(
                      (item) =>
                        item.id ===
                        selectedItem.id
                    ) + 1}`}
                />

                <DetailBox
                  label="Current Stock"
                  value={`${selectedItem.stock}`}
                />

                <DetailBox
                  label="Added"
                  value={
                    selectedItem.added
                  }
                />

              </div>

              {/* STOCK */}

              <div className="rounded-xl border border-[#E5E9EF] p-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[8px] uppercase tracking-wide text-[#98A3B2]">
                      Stock Status
                    </p>

                    <div className="mt-2">
                      <StockBadge
                        status={
                          selectedItem.status
                        }
                      />
                    </div>

                  </div>

                  <Package
                    size={21}
                    className={
                      selectedItem.status ===
                      "In Stock"
                        ? "text-[#249357]"
                        : "text-[#D85A5A]"
                    }
                  />

                </div>

              </div>

              {/* ACTIONS */}

              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/admin/products/${selectedItem.id}`
                    )
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[9px] font-semibold text-white hover:bg-[#0F5BDE]"
                >
                  <Eye size={13} />
                  Product Page
                </button>

                <button
                  type="button"
                  onClick={() =>
                    removeItem(
                      selectedItem.id
                    )
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#F0D4D4] text-[9px] font-semibold text-[#D85A5A] hover:bg-[#FFF0F0]"
                >
                  <Trash2 size={13} />
                  Remove Insight
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      </main>
    </AdminLayout>
  );
}

/* ============================================================
   INSIGHT CARD
============================================================ */

function InsightCard({
  title,
  value,
  subtitle,
  icon: Icon,
  bg,
  iconColor,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  bg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

      <div className="flex items-start justify-between">

        <div className="min-w-0">

          <p className="truncate text-[8px] font-medium text-[#8995A5]">
            {title}
          </p>

          <p className="mt-2 text-[20px] font-bold text-[#293953]">
            {value}
          </p>

          <p className="mt-1 truncate text-[7px] text-[#A0AAB8]">
            {subtitle}
          </p>

        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${iconColor}`}
        >
          <Icon size={17} />
        </div>

      </div>

    </div>
  );
}

/* ============================================================
   STOCK BADGE
============================================================ */

function StockBadge({
  status,
}: {
  status: WishlistItem["status"];
}) {
  const classes =
    status === "In Stock"
      ? "bg-[#EAF8F0] text-[#249357]"
      : status === "Low Stock"
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

      <p className="mt-1 text-[10px] font-semibold text-[#52627A]">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   SUCCESS / EMPTY ICON
============================================================ */

function CheckCircleIcon() {
  return (
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF8F0] text-[#249357]">
      <TrendingUp size={18} />
    </div>
  );
}