"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { reviewsApi } from "@/app/api/services";
import {
  ArrowLeft,
  Search,
  Star,
  Eye,
  Pencil,
  Trash2,
  X,
  Check,
  XCircle,
  MessageSquare,
  UserRound,
  Package,
  CalendarDays,
  Filter,
} from "lucide-react";

type ReviewStatus = "Published" | "Pending" | "Hidden";

type Review = {
  id: number;
  serverId?: string;
  customer: string;
  email: string;
  product: string;
  sku: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  status: ReviewStatus;
};

export default function AdminReviewsPage() {
  const router = useRouter();

  const [reviews, setReviews] =
    useState<Review[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await reviewsApi.list(1, 100);
        const payload = res?.data ?? res;
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        if (cancelled) return;
        if (raw.length === 0) {
          setReviews([]);
          return;
        }
        const allowed = ["Published", "Pending", "Hidden"];
        const mapped: Review[] = raw.map((item: any, index: number) => {
          const dateRaw = String(
            item.date ?? item.createdAt ?? item.createdDate ?? item.reviewDate ?? ""
          );
          return {
            id: index + 1,
            serverId: String(item.id ?? item.reviewId ?? item._id ?? ""),
            customer: String(item.customer ?? item.customerName ?? item.name ?? ""),
            email: String(item.email ?? item.customerEmail ?? ""),
            product: String(item.product ?? item.productName ?? ""),
            sku: String(item.sku ?? item.skuCode ?? item.productSku ?? ""),
            rating: Number(item.rating ?? item.stars ?? 5) || 5,
            title: String(item.title ?? item.heading ?? ""),
            comment: String(item.comment ?? item.review ?? item.message ?? item.text ?? ""),
            date: dateRaw.includes("T") ? dateRaw.split("T")[0] : dateRaw || new Date().toISOString().split("T")[0],
            status: (allowed.includes(item.status) ? item.status : "Pending") as Review["status"],
          };
        });
        setReviews(mapped);
      } catch {
        if (!cancelled) setReviews([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | ReviewStatus>("All");

  const [ratingFilter, setRatingFilter] =
    useState<"All" | number>("All");

  const [selectedReview, setSelectedReview] =
    useState<Review | null>(null);

  const [editingReview, setEditingReview] =
    useState<Review | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [showCreate, setShowCreate] =
    useState(false);

  const [form, setForm] = useState({
    customer: "",
    email: "",
    product: "",
    sku: "",
    rating: "5",
    title: "",
    comment: "",
    date: new Date()
      .toISOString()
      .split("T")[0],
    status: "Pending" as ReviewStatus,
  });

  type ReviewErrors = Partial<Record<
    "customer" | "email" | "product" | "sku" | "rating" | "title" | "comment" | "date" | "status",
    string
  >>;

  const [errors, setErrors] = useState<ReviewErrors>({});

  const clearError = (field: keyof ReviewErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const resetErrors = () => setErrors({});

  const updateFormField = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    clearError(field as keyof ReviewErrors);
  };

  const validateReview = () => {
    const next: ReviewErrors = {};
    const customer = form.customer.trim();
    const email = form.email.trim();
    const product = form.product.trim();
    const sku = form.sku.trim();
    const title = form.title.trim();
    const comment = form.comment.trim();

    if (!customer) {
      next.customer = "Customer name is required.";
    } else if (customer.length < 2 || customer.length > 100) {
      next.customer = "Customer name must be 2–100 characters.";
    } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'&()\-]+$/.test(customer)) {
      next.customer = "Customer name contains invalid characters.";
    }

    if (!email) {
      next.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      next.email = "Enter a valid email address.";
    } else if (email.length > 254) {
      next.email = "Email address is too long.";
    }

    if (!product) {
      next.product = "Product name is required.";
    } else if (product.length < 2 || product.length > 150) {
      next.product = "Product name must be 2–150 characters.";
    }

    if (sku) {
      if (sku.length < 2 || sku.length > 40) {
        next.sku = "SKU must be 2–40 characters.";
      } else if (!/^[A-Za-z0-9._-]+$/.test(sku)) {
        next.sku = "SKU may contain only letters, numbers, dots, underscores and hyphens.";
      }
    }

    const numericRating = Number(form.rating);
    if (!/^[1-5]$/.test(form.rating) || numericRating < 1 || numericRating > 5) {
      next.rating = "Rating must be between 1 and 5.";
    }

    if (!title) {
      next.title = "Review title is required.";
    } else if (title.length < 3 || title.length > 120) {
      next.title = "Review title must be 3–120 characters.";
    }

    if (!comment) {
      next.comment = "Review comment is required.";
    } else if (comment.length < 10 || comment.length > 2000) {
      next.comment = "Review comment must be 10–2000 characters.";
    }

    if (!form.date) {
      next.date = "Review date is required.";
    } else {
      const selectedDate = new Date(`${form.date}T00:00:00`);
      if (Number.isNaN(selectedDate.getTime())) {
        next.date = "Enter a valid date.";
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate > today) {
          next.date = "Review date cannot be in the future.";
        }
      }
    }

    const allowedStatuses: ReviewStatus[] = [
      "Published",
      "Pending",
      "Hidden",
    ];
    if (!allowedStatuses.includes(form.status)) {
      next.status = "Select a valid review status.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* =====================================================
     FILTERED REVIEWS
  ====================================================== */

  const filteredReviews = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return reviews.filter((review) => {
      const matchesSearch =
        !query ||
        review.customer
          .toLowerCase()
          .includes(query) ||
        review.email
          .toLowerCase()
          .includes(query) ||
        review.product
          .toLowerCase()
          .includes(query) ||
        review.sku
          .toLowerCase()
          .includes(query) ||
        review.title
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        review.status === statusFilter;

      const matchesRating =
        ratingFilter === "All" ||
        review.rating === ratingFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRating
      );
    });
  }, [
    reviews,
    search,
    statusFilter,
    ratingFilter,
  ]);

  /* =====================================================
     STATS
  ====================================================== */

  const totalReviews = reviews.length;

  const publishedReviews = reviews.filter(
    (review) =>
      review.status === "Published"
  ).length;

  const pendingReviews = reviews.filter(
    (review) =>
      review.status === "Pending"
  ).length;

  const hiddenReviews = reviews.filter(
    (review) =>
      review.status === "Hidden"
  ).length;

  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce(
            (sum, review) =>
              sum + review.rating,
            0
          ) / totalReviews
        ).toFixed(1)
      : "0.0";

  const fiveStarReviews = reviews.filter(
    (review) => review.rating === 5
  ).length;

  /* =====================================================
     FORM RESET
  ====================================================== */

  const resetForm = () => {
    setForm({
      customer: "",
      email: "",
      product: "",
      sku: "",
      rating: "5",
      title: "",
      comment: "",
      date: new Date()
        .toISOString()
        .split("T")[0],
      status: "Pending",
    });
  };

  /* =====================================================
     CREATE
  ====================================================== */

  const openCreate = () => {
    resetForm();
    resetErrors();
    setEditingReview(null);
    setShowCreate(true);
  };

  /* =====================================================
     EDIT
  ====================================================== */

  const openEdit = (review: Review) => {
    setEditingReview(review);

    setForm({
      customer: review.customer,
      email: review.email,
      product: review.product,
      sku: review.sku,
      rating: String(review.rating),
      title: review.title,
      comment: review.comment,
      date: review.date,
      status: review.status,
    });

    resetErrors();
    setShowCreate(true);
  };

  /* =====================================================
     SAVE
  ====================================================== */

  const saveReview = async () => {
    if (!validateReview()) return;

    const rating = Number(form.rating);

    const payload = {
      customerName: form.customer.trim(),
      email: form.email.trim(),
      productName: form.product.trim(),
      sku: form.sku.trim(),
      rating,
      title: form.title.trim(),
      comment: form.comment.trim(),
      date: form.date,
      status: form.status,
    };

    if (editingReview) {
      // PUT /api/admin/reviews/{id} best-effort, then local update.
      try {
        if (editingReview.serverId) {
          await reviewsApi.update(editingReview.serverId, payload);
        }
      } catch (error) {
        console.error("Review update failed:", error);
      }

      setReviews((current) =>
        current.map((review) =>
          review.id ===
          editingReview.id
            ? {
                ...review,
                ...payload,
                customer: payload.customerName,
                product: payload.productName,
              }
            : review
        )
      );
    } else {
      // POST /api/admin/reviews best-effort, then local add.
      let serverId: string | undefined;
      try {
        const response = await reviewsApi.create(payload);
        const data = (response.data ?? {}) as Record<string, unknown>;
        const rawId = data.reviewId ?? data.id;
        if (rawId !== undefined && rawId !== null && String(rawId)) {
          serverId = String(rawId);
        }
      } catch (error) {
        console.error("Review create failed:", error);
      }

      setReviews((current) => [
        ...current,
        {
          id: Date.now(),
          serverId,
          ...payload,
          customer: payload.customerName,
          product: payload.productName,
        },
      ]);
    }

    setShowCreate(false);
    setEditingReview(null);
    resetForm();
  };

  /* =====================================================
     DELETE
  ====================================================== */

  const deleteReview = async () => {
    if (deleteId === null) return;

    try {
      const target = reviews.find((review) => review.id === deleteId);
      if (target?.serverId) await reviewsApi.remove(target.serverId);
    } catch {
      // Best-effort: fall through to local removal.
    }

    setReviews((current) =>
      current.filter(
        (review) =>
          review.id !== deleteId
      )
    );

    setDeleteId(null);
    setSelectedReview(null);
  };

  /* =====================================================
     STATUS
  ====================================================== */

  const updateStatus = async (
    id: number,
    status: ReviewStatus
  ) => {
    try {
      const target = reviews.find((review) => review.id === id);
      if (target?.serverId) await reviewsApi.setStatus(target.serverId, status);
    } catch {
      // Best-effort: fall through to local toggle.
    }
    setReviews((current) =>
      current.map((review) =>
        review.id === id
          ? {
              ...review,
              status,
            }
          : review
      )
    );

    if (
      selectedReview &&
      selectedReview.id === id
    ) {
      setSelectedReview({
        ...selectedReview,
        status,
      });
    }
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
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6C80] hover:bg-[#F1F4F8]"
        >
          <ArrowLeft size={19} />
        </button>

        <div>

          <h1 className="font-sora text-[18px] font-bold text-[#22324D] sm:text-[20px]">
            Reviews
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage customer product reviews and ratings
          </p>

        </div>

        {/* No create/update review endpoint — disabled */}
        <button
          type="button"
          onClick={openCreate}
         
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <MessageSquare size={14} />

          <span className="hidden sm:inline">
            Add Review
          </span>

          <span className="sm:hidden">
            Add
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
            Reviews
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

          <StatCard
            title="Total Reviews"
            value={totalReviews}
            icon={MessageSquare}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#1769F5]"
          />

          <StatCard
            title="Published"
            value={publishedReviews}
            icon={Check}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Pending"
            value={pendingReviews}
            icon={Filter}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

          <StatCard
            title="Hidden"
            value={hiddenReviews}
            icon={XCircle}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

          <StatCard
            title="Average Rating"
            value={averageRating}
            icon={Star}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#E09A22]"
          />

          <StatCard
            title="5 Star Reviews"
            value={fiveStarReviews}
            icon={Star}
            bg="bg-[#FFF8E8]"
            iconColor="text-[#E0A326]"
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
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search customer, product, SKU or review..."
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

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "All"
                    | ReviewStatus
                )
              }
              className="h-10 rounded-lg border border-[#DFE5ED] bg-white px-3 text-[10px] text-[#52627A] outline-none focus:border-[#1769F5] lg:w-[150px]"
            >
              <option value="All">
                All Status
              </option>

              <option value="Published">
                Published
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Hidden">
                Hidden
              </option>
            </select>

            {/* RATING */}

            <select
              value={String(
                ratingFilter
              )}
              onChange={(event) =>
                setRatingFilter(
                  event.target.value ===
                    "All"
                    ? "All"
                    : Number(
                        event.target.value
                      )
                )
              }
              className="h-10 rounded-lg border border-[#DFE5ED] bg-white px-3 text-[10px] text-[#52627A] outline-none focus:border-[#1769F5] lg:w-[140px]"
            >
              <option value="All">
                All Ratings
              </option>

              <option value="5">
                5 Stars
              </option>

              <option value="4">
                4 Stars
              </option>

              <option value="3">
                3 Stars
              </option>

              <option value="2">
                2 Stars
              </option>

              <option value="1">
                1 Star
              </option>
            </select>

            {/* CLEAR */}

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setRatingFilter("All");
              }}
              className="h-10 rounded-lg border border-[#DCE2EA] px-4 text-[9px] font-semibold text-[#647287] hover:bg-[#F5F7FA]"
            >
              Clear Filters
            </button>

          </div>

        </section>

        {/* =================================================
            REVIEW TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>

              <h2 className="text-[13px] font-bold text-[#293953]">
                Customer Reviews
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredReviews.length} reviews found
              </p>

            </div>

            <div className="hidden items-center gap-1.5 sm:flex">

              <Star
                size={12}
                className="text-[#E0A326]"
                fill="currentColor"
              />

              <span className="text-[8px] text-[#8995A5]">
                Customer feedback
              </span>

            </div>

          </div>

          {filteredReviews.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                <MessageSquare size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No reviews found
              </h3>

              <p className="mt-1 text-[10px] text-[#8995A5]">
                Try changing your search or filters.
              </p>

            </div>
          ) : (
            <>
              {/* =================================================
                  DESKTOP TABLE
              ================================================== */}

              <div className="hidden overflow-x-auto md:block">

                <table className="min-w-full">

                  <thead>

                    <tr className="border-b border-[#EDF0F4] bg-[#FAFBFD] text-left">

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Product
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Rating
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Review
                      </th>

                      <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Date
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

                    {filteredReviews.map(
                      (review) => (
                        <tr
                          key={review.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                                <UserRound
                                  size={15}
                                />
                              </div>

                              <div className="min-w-0">

                                <p className="text-[10px] font-bold text-[#33415A]">
                                  {review.customer}
                                </p>

                                <p className="mt-1 max-w-[160px] truncate text-[8px] text-[#8995A5]">
                                  {review.email}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <p className="max-w-[210px] truncate text-[10px] font-semibold text-[#52627A]">
                              {review.product}
                            </p>

                            <p className="mt-1 text-[8px] text-[#8995A5]">
                              {review.sku}
                            </p>

                          </td>

                          {/* RATING */}

                          <td className="px-5 py-4">

                            <RatingStars
                              rating={
                                review.rating
                              }
                            />

                          </td>

                          {/* REVIEW */}

                          <td className="px-5 py-4">

                            <p className="max-w-[240px] truncate text-[10px] font-semibold text-[#52627A]">
                              {review.title}
                            </p>

                            <p className="mt-1 max-w-[250px] truncate text-[8px] text-[#8995A5]">
                              {review.comment}
                            </p>

                          </td>

                          {/* DATE */}

                          <td className="px-5 py-4">

                            <span className="text-[9px] text-[#66748B]">
                              {review.date}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <ReviewStatusBadge
                              status={
                                review.status
                              }
                            />

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1.5">

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReview(
                                    review
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE2EA] text-[#52627A] hover:bg-[#F4F6F9]"
                              >
                                <Eye size={13} />
                              </button>

                              {/* No create/update review endpoint — disabled */}
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    review
                                  )
                                }
                               
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE2EA] text-[#1769F5] hover:bg-[#EDF3FF]"
                              >
                                <Pencil size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteId(
                                    review.id
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0D4D4] text-[#D85A5A] hover:bg-[#FFF0F0]"
                              >
                                <Trash2 size={13} />
                              </button>

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

                {filteredReviews.map(
                  (review) => (
                    <div
                      key={review.id}
                      className="p-4"
                    >

                      <div className="flex gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                          <UserRound size={17} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-[10px] font-bold text-[#33415A]">
                                {review.customer}
                              </p>

                              <p className="mt-1 truncate text-[8px] text-[#8995A5]">
                                {review.product}
                              </p>

                            </div>

                            <ReviewStatusBadge
                              status={
                                review.status
                              }
                            />

                          </div>

                          <div className="mt-2">

                            <RatingStars
                              rating={
                                review.rating
                              }
                            />

                          </div>

                          <p className="mt-2 text-[10px] font-semibold text-[#52627A]">
                            {review.title}
                          </p>

                          <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#8995A5]">
                            {review.comment}
                          </p>

                          <div className="mt-3 flex items-center justify-between">

                            <span className="text-[8px] text-[#9AA5B4]">
                              {review.date}
                            </span>

                            <div className="flex gap-1.5">

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReview(
                                    review
                                  )
                                }
                                className="flex h-8 items-center gap-1 rounded-lg border border-[#DCE2EA] px-2.5 text-[8px] font-semibold text-[#52627A]"
                              >
                                <Eye size={12} />
                                View
                              </button>

                              {/* No create/update review endpoint — disabled */}
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    review
                                  )
                                }
                               
                                className="flex h-8 items-center gap-1 rounded-lg border border-[#DCE2EA] px-2.5 text-[8px] font-semibold text-[#1769F5]"
                              >
                                <Pencil size={12} />
                                Edit
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            </>
          )}

        </section>

      </div>

      {/* =================================================
          VIEW REVIEW MODAL
      ================================================== */}

      {selectedReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <button
            type="button"
            aria-label="Close"
            onClick={() =>
              setSelectedReview(null)
            }
            className="absolute inset-0 cursor-default"
          />

          <div className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                  <MessageSquare
                    size={18}
                  />
                </div>

                <div>

                  <h2 className="text-[13px] font-bold text-[#263650]">
                    Review Details
                  </h2>

                  <p className="mt-1 text-[8px] text-[#8995A5]">
                    {selectedReview.date}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedReview(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="space-y-4 p-5">

              {/* CUSTOMER */}

              <div className="flex items-center rounded-xl bg-[#F7F9FC] p-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                  <UserRound size={19} />
                </div>

                <div className="ml-3 min-w-0">

                  <p className="text-[11px] font-bold text-[#33415A]">
                    {selectedReview.customer}
                  </p>

                  <p className="mt-1 truncate text-[8px] text-[#8995A5]">
                    {selectedReview.email}
                  </p>

                </div>

              </div>

              {/* PRODUCT */}

              <div className="rounded-xl border border-[#E5E9EF] p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                    <Package size={15} />
                  </div>

                  <div className="min-w-0">

                    <p className="text-[8px] uppercase tracking-wide text-[#98A3B2]">
                      Product
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-[#52627A]">
                      {selectedReview.product}
                    </p>

                    <p className="mt-1 text-[8px] text-[#8995A5]">
                      SKU: {selectedReview.sku}
                    </p>

                  </div>

                </div>

              </div>

              {/* RATING */}

              <div className="rounded-xl bg-[#FFF9EA] p-4">

                <p className="text-[8px] uppercase tracking-wide text-[#9A875C]">
                  Customer Rating
                </p>

                <div className="mt-2 flex items-center gap-3">

                  <RatingStars
                    rating={
                      selectedReview.rating
                    }
                    size={18}
                  />

                  <span className="text-[12px] font-bold text-[#C88C18]">
                    {selectedReview.rating}/5
                  </span>

                </div>

              </div>

              {/* REVIEW */}

              <div className="rounded-xl border border-[#E5E9EF] p-4">

                <p className="text-[8px] uppercase tracking-wide text-[#98A3B2]">
                  Review
                </p>

                <h3 className="mt-2 text-[12px] font-bold text-[#33415A]">
                  {selectedReview.title}
                </h3>

                <p className="mt-2 text-[10px] leading-5 text-[#66748B]">
                  {selectedReview.comment}
                </p>

              </div>

              {/* STATUS */}

              <div>

                <p className="mb-2 text-[9px] font-semibold text-[#52627A]">
                  Review Status
                </p>

                <div className="flex flex-wrap gap-2">

                  {(
                    [
                      "Published",
                      "Pending",
                      "Hidden",
                    ] as ReviewStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        updateStatus(
                          selectedReview.id,
                          status
                        )
                      }
                      className={`
                        rounded-lg
                        px-3
                        py-2
                        text-[8px]
                        font-semibold
                        ${
                          selectedReview.status ===
                          status
                            ? "bg-[#1769F5] text-white"
                            : "bg-[#F3F5F8] text-[#66748B]"
                        }
                      `}
                    >
                      {status}
                    </button>
                  ))}

                </div>

              </div>

            </div>

            <div className="flex gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              {/* No create/update review endpoint — disabled */}
              <button
                type="button"
                onClick={() => {
                  const review =
                    selectedReview;

                  setSelectedReview(null);
                  openEdit(review);
                }}
               
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[9px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Review
              </button>

              <button
                type="button"
                onClick={() =>
                  setDeleteId(
                    selectedReview.id
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

      {/* =================================================
          CREATE / EDIT MODAL
      ================================================== */}

      {showCreate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              setShowCreate(false);
              resetErrors();
            }}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingReview
                    ? "Edit Review"
                    : "Add Review"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Add or update customer review information
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="space-y-4 p-5">

              {Object.keys(errors).length > 0 && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#F0D4D4] bg-[#FFF7F7] px-4 py-3"
                >
                  <p className="text-[9px] font-bold text-[#B84A4A]">
                    Please fix the highlighted fields before saving.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Customer Name"
                  value={
                    form.customer
                  }
                  placeholder="Enter customer name"
                  onChange={(value) =>
                    updateFormField("customer", value)
                  }
                  error={errors.customer}
                />

                <FormInput
                  label="Email Address"
                  value={
                    form.email
                  }
                  placeholder="Enter email"
                  type="email"
                  onChange={(value) =>
                    updateFormField("email", value)
                  }
                  error={errors.email}
                />

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Product Name"
                  value={
                    form.product
                  }
                  placeholder="Enter product"
                  onChange={(value) =>
                    updateFormField("product", value)
                  }
                  error={errors.product}
                />

                <FormInput
                  label="SKU"
                  value={form.sku}
                  placeholder="Enter SKU"
                  onChange={(value) =>
                    updateFormField("sku", value.toUpperCase())
                  }
                  error={errors.sku}
                />

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Rating
                  </label>

                  <select
                    value={form.rating}
                    onChange={(event) =>
                      updateFormField(
                        "rating",
                        event.target.value
                      )
                    }
                    aria-invalid={Boolean(errors.rating)}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                      errors.rating
                        ? "border-[#EF4444]"
                        : "border-[#DCE2EA]"
                    }`}
                  >

                    <option value="5">
                      5 Stars
                    </option>

                    <option value="4">
                      4 Stars
                    </option>

                    <option value="3">
                      3 Stars
                    </option>

                    <option value="2">
                      2 Stars
                    </option>

                    <option value="1">
                      1 Star
                    </option>

                  </select>

                </div>

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Date
                  </label>

                  <input
                    type="date"
                    value={form.date}
                    min="1900-01-01"
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(event) =>
                      updateFormField(
                        "date",
                        event.target.value
                      )
                    }
                    aria-invalid={Boolean(errors.date)}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                      errors.date
                        ? "border-[#EF4444]"
                        : "border-[#DCE2EA]"
                    }`}
                  />

                </div>

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateFormField(
                        "status",
                        event.target.value
                      )
                    }
                    aria-invalid={Boolean(errors.status)}
                    className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] outline-none focus:border-[#1769F5] ${
                      errors.status
                        ? "border-[#EF4444]"
                        : "border-[#DCE2EA]"
                    }`}
                  >

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Published">
                      Published
                    </option>

                    <option value="Hidden">
                      Hidden
                    </option>

                  </select>

                </div>

              </div>

              <FormInput
                label="Review Title"
                value={form.title}
                placeholder="Enter review title"
                onChange={(value) =>
                  updateFormField("title", value)
                }
                error={errors.title}
              />

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Review Comment
                </label>

                <textarea
                  value={form.comment}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      comment:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Enter customer review"
                  rows={5}
                  className="mt-1.5 w-full resize-none rounded-lg border border-[#DCE2EA] px-3 py-2.5 text-[10px] outline-none focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10"
                />

              </div>

            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  resetErrors();
                }}
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveReview}
                className="h-9 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                {editingReview
                  ? "Update Review"
                  : "Save Review"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          DELETE MODAL
      ================================================== */}

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
              Delete Review?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This review will be permanently
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
                onClick={deleteReview}
                className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D]"
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

      </main>
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
   RATING STARS
============================================================ */

function RatingStars({
  rating,
  size = 13,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">

      {[1, 2, 3, 4, 5].map(
        (star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= rating
                ? "text-[#E0A326]"
                : "text-[#D8DEE7]"
            }
            fill={
              star <= rating
                ? "currentColor"
                : "none"
            }
          />
        )
      )}

    </div>
  );
}

/* ============================================================
   REVIEW STATUS
============================================================ */

function ReviewStatusBadge({
  status,
}: {
  status: ReviewStatus;
}) {
  const classes =
    status === "Published"
      ? "bg-[#EAF8F0] text-[#249357]"
      : status === "Pending"
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
  type = "text",
  error,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div>

      <label className="text-[9px] font-semibold text-[#52627A]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10 ${
          error ? "border-[#EF4444]" : "border-[#DCE2EA]"
        }`}
      />

      {error && (
        <p className="mt-1 text-[8px] font-medium text-[#EF4444]">
          {error}
        </p>
      )}

    </div>
  );
}