"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  X,
  Home,
  Package,
  ChevronRight,
  CheckCircle2,
  Truck,
  Clock3,
  XCircle,
  ShoppingBag,
  RefreshCcw,
  MapPin,
  CreditCard,
  CalendarDays,
  IndianRupee,
  User,
  Heart,
  LockKeyhole,
  LogOut,
  Camera,
  Gift,
  Zap,
  Crown,
  Headphones,
  Eye,
} from "lucide-react";

import { hasSession } from "@/app/api/api";
import { isGuid } from "@/app/api/productcache";
import {
  ordersApi,
  type OrderDetailResponse,
  type OrderSummaryResponse,
} from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

type Order = {
  id: string;
  date: string;
  items: string;
  amount: string;
  status: OrderStatus;
  backendId?: string;
};

type OrderValidationErrors = {
  id?: string;
  date?: string;
  items?: string;
  amount?: string;
  status?: string;
};

/* =========================================================
   INITIAL ORDERS
========================================================= */

const INITIAL_ORDERS: Order[] = [
  {
    id: "AZ10001",
    date: "Today",
    items: "3 Items",
    amount: "₹2,499",
    status: "Confirmed",
  },
  {
    id: "AZ10002",
    date: "Yesterday",
    items: "2 Items",
    amount: "₹1,799",
    status: "Delivered",
  },
  {
    id: "AZ10003",
    date: "22 Aug 2026",
    items: "5 Items",
    amount: "₹4,250",
    status: "Shipped",
  },
];

/* =========================================================
   VALID STATUS
========================================================= */

const VALID_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

/* =========================================================
   VALIDATE ORDER
========================================================= */

const validateOrder = (order: Order): OrderValidationErrors => {
  const errors: OrderValidationErrors = {};

  if (!order.id || !order.id.trim()) {
    errors.id = "Order ID is required.";
  }

  if (!order.date || !order.date.trim()) {
    errors.date = "Order date is required.";
  }

  if (!order.items || !order.items.trim()) {
    errors.items = "Item information is required.";
  } else if (!/^\d+\s+Items?$/i.test(order.items.trim())) {
    errors.items = "Invalid item information.";
  }

  if (!order.amount || !order.amount.trim()) {
    errors.amount = "Order amount is required.";
  } else if (!/^₹[\d,]+(?:\.\d{1,2})?$/.test(order.amount.trim())) {
    errors.amount = "Invalid order amount.";
  }

  if (!VALID_STATUSES.includes(order.status)) {
    errors.status = "Invalid order status.";
  }

  return errors;
};

/* =========================================================
   VALIDATE ALL ORDERS
========================================================= */

const validateOrders = (orders: Order[]): boolean => {
  if (!Array.isArray(orders)) {
    return false;
  }

  return orders.every((order) => {
    const errors = validateOrder(order);

    return Object.keys(errors).length === 0;
  });
};

/* =========================================================
   STATUS / SUMMARY HELPERS
========================================================= */

const getStatusCount = (orders: Order[], statuses: OrderStatus[]) => {
  return orders.filter((order) => statuses.includes(order.status)).length;
};

const getOrderIconBackground = (status: OrderStatus) => {
  switch (status) {
    case "Pending":
      return "bg-[#FFF7E8]";
    case "Confirmed":
      return "bg-[#EEF5FF]";
    case "Processing":
      return "bg-[#FFF7E8]";
    case "Shipped":
      return "bg-[#F3EFFF]";
    case "Delivered":
      return "bg-[#EAF7EF]";
    case "Cancelled":
      return "bg-[#FFF1F1]";
    default:
      return "bg-[#F2F6FA]";
  }
};

/* =========================================================
   LIVE ORDER MAPPING (backend)
========================================================= */

function formatOrderDate(value?: string | null): string {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function summaryToOrder(summary: OrderSummaryResponse): Order {
  const itemCount = Number(summary.itemCount || 0);

  return {
    id: summary.orderNo || summary.orderId,
    backendId: isGuid(summary.orderId) ? summary.orderId : undefined,
    date: formatOrderDate(summary.createdAt),
    items: `${itemCount} ${itemCount === 1 ? "Item" : "Items"}`,
    amount: `₹${Number(summary.grandTotal || 0).toLocaleString("en-IN")}`,
    status: (summary.status || "Pending") as OrderStatus,
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [selectedDetail, setSelectedDetail] =
    useState<OrderDetailResponse | null>(null);

  const [backendMode, setBackendMode] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  /* =====================================================
     LOAD ORDERS
  ====================================================== */

  useEffect(() => {
    if (!hasSession()) {
      try {
        const savedOrders = localStorage.getItem("aanzara-orders");

        if (!savedOrders) {
          return;
        }

        const parsedOrders = JSON.parse(savedOrders);

        if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
          const validOrders = parsedOrders.filter(
            (order: Order) =>
              order &&
              typeof order.id === "string" &&
              typeof order.date === "string" &&
              typeof order.items === "string" &&
              typeof order.amount === "string" &&
              VALID_STATUSES.includes(order.status)
          );

          if (validOrders.length > 0) {
            setOrders(validOrders);
          }
        }
      } catch (err) {
        console.error("Unable to load orders:", err);
      }

      return;
    }

    let cancelled = false;

    ordersApi
      .list()
      .then(({ data }) => {
        if (cancelled) {
          return;
        }

        const raw: any = data as any;
        const summaries: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
            ? raw.items
            : Array.isArray(raw?.data)
              ? raw.data
              : [];

        setBackendMode(true);
        setOrders(summaries.map(summaryToOrder));
      })
      .catch((err) => {
        console.warn("Live orders unavailable:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     SAVE ORDERS
  ====================================================== */

  useEffect(() => {
    if (backendMode) {
      return;
    }

    try {
      localStorage.setItem("aanzara-orders", JSON.stringify(orders));
    } catch (err) {
      console.error("Unable to save orders:", err);
    }
  }, [orders, backendMode]);

  /* =====================================================
     STATUS ICON
  ====================================================== */

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return <Clock3 size={18} className="text-[#D97706]" />;

      case "Confirmed":
        return <CheckCircle2 size={18} className="text-[#1769F5]" />;

      case "Processing":
        return <Clock3 size={18} className="text-[#D97706]" />;

      case "Shipped":
        return <Truck size={18} className="text-[#7C3AED]" />;

      case "Delivered":
        return <CheckCircle2 size={18} className="text-[#159447]" />;

      case "Cancelled":
        return <XCircle size={18} className="text-[#EF4444]" />;

      default:
        return <Package size={18} />;
    }
  };

  /* =====================================================
     STATUS STYLE
  ====================================================== */

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return "bg-[#FFF7E8] text-[#D97706]";

      case "Confirmed":
        return "bg-[#EEF5FF] text-[#1769F5]";

      case "Processing":
        return "bg-[#FFF7E8] text-[#D97706]";

      case "Shipped":
        return "bg-[#F3EFFF] text-[#7C3AED]";

      case "Delivered":
        return "bg-[#EAF7EF] text-[#159447]";

      case "Cancelled":
        return "bg-[#FFF1F1] text-[#EF4444]";

      default:
        return "bg-[#F5F5F5] text-[#52627A]";
    }
  };

  /* =====================================================
     SELECT ORDER
  ====================================================== */

  const handleSelectOrder = (order: Order) => {
    setError("");
    setSuccess("");

    const validationErrors = validateOrder(order);

    if (Object.keys(validationErrors).length > 0) {
      setError("This order contains invalid information.");

      return;
    }

    setSelectedOrder(order);
    setSelectedDetail(null);

    if (order.backendId) {
      ordersApi
        .details(order.backendId)
        .then(({ data }) => {
          setSelectedDetail(data);
        })
        .catch(() => {
          setSelectedDetail(null);
        });
    }
  };

  /* =====================================================
     CANCEL ORDER
  ====================================================== */

  const cancelOrder = (id: string) => {
    if (actionLoading) {
      return;
    }

    setError("");
    setSuccess("");

    if (!id || !id.trim()) {
      setError("Invalid order ID.");
      return;
    }

    const existingOrder = orders.find((order) => order.id === id);

    if (!existingOrder) {
      setError("Order not found.");
      return;
    }

    const validationErrors = validateOrder(existingOrder);

    if (Object.keys(validationErrors).length > 0) {
      setError(
        "Unable to cancel this order because the order information is invalid."
      );

      return;
    }

    if (!["Pending", "Confirmed"].includes(existingOrder.status)) {
      setError("Only pending or confirmed orders can be cancelled.");

      return;
    }

    setActionLoading(true);

    if (existingOrder.backendId) {
      ordersApi
        .cancel(existingOrder.backendId)
        .then(() => {
          setOrders((current) =>
            current.map((order) =>
              order.id === id ? { ...order, status: "Cancelled" } : order
            )
          );

          setSelectedOrder((current) =>
            current && current.id === id
              ? { ...current, status: "Cancelled" }
              : current
          );

          setSelectedDetail(null);

          setSuccess("Order cancelled successfully.");
        })
        .catch(() => {
          setError("Unable to cancel this order. Please try again.");
        })
        .finally(() => {
          setActionLoading(false);
        });

      return;
    }

    const updatedOrder: Order = {
      ...existingOrder,
      status: "Cancelled",
    };

    setOrders((current) =>
      current.map((order) => (order.id === id ? updatedOrder : order))
    );

    setSelectedOrder(updatedOrder);

    setSuccess("Order cancelled successfully.");

    setActionLoading(false);
  };

  /* =====================================================
     REORDER
  ====================================================== */

  const reorder = (order: Order) => {
    if (actionLoading) {
      return;
    }

    setError("");
    setSuccess("");

    const validationErrors = validateOrder(order);

    if (Object.keys(validationErrors).length > 0) {
      setError("Unable to reorder because the order information is invalid.");

      return;
    }

    if (order.status !== "Delivered") {
      setError("Only delivered orders can be reordered.");

      return;
    }

    setActionLoading(true);

    /*
      Backend/cart API can be connected here.
    */

    setTimeout(() => {
      setSuccess("Items have been added for reorder.");

      setActionLoading(false);
    }, 500);
  };

  /* =====================================================
     TRACK ORDER
  ====================================================== */

  const trackOrder = (order: Order) => {
    if (actionLoading) {
      return;
    }

    setError("");
    setSuccess("");

    const validationErrors = validateOrder(order);

    if (Object.keys(validationErrors).length > 0) {
      setError(
        "Unable to track this order because the order information is invalid."
      );

      return;
    }

    if (order.status === "Cancelled") {
      setError("Cancelled orders cannot be tracked.");

      return;
    }

    if (!order.backendId || !isGuid(order.backendId)) {
      setError(
        "Unable to track this order because the order information is invalid."
      );

      return;
    }

    router.push(`/orders/${order.backendId}/tracking`);
  };

  /* =====================================================
     GO TO ACCOUNT
  ====================================================== */

  const goToAccount = () => {
    if (actionLoading) {
      return;
    }

    router.push("/account");
  };

  /* =====================================================
     ORDER DETAILS
  ====================================================== */

  if (selectedOrder) {
    const detailAddress = selectedDetail?.shippingAddress;

    const deliveryText = detailAddress
      ? [
          detailAddress.addressLine1,
          detailAddress.addressLine2 || "",
          detailAddress.city,
          detailAddress.state,
        ]
          .filter((part) => part && part.trim().length > 0)
          .join(", ") + ` - ${detailAddress.pincode}`
      : "";

    const contactText = detailAddress
      ? `${detailAddress.recipientName || ""}${
          detailAddress.recipientPhone
            ? (detailAddress.recipientName ? " • " : "") +
              detailAddress.recipientPhone
            : ""
        }`
      : "";

    return (
      <>
        {/* HEADER */}

        <header className="flex h-[62px] items-center rounded-[16px] border border-[#E5EAF1] bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => {
              setSelectedOrder(null);
              setSelectedDetail(null);
              setError("");
              setSuccess("");
            }}
            disabled={actionLoading}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#F5F8FC] disabled:opacity-50"
            aria-label="Back to orders"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="flex-1 px-2 text-[16px] font-bold sm:text-[18px]">
            Order Details
          </h1>

          <button
            type="button"
            onClick={goToAccount}
            disabled={actionLoading}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#F5F8FC] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        {/* DETAILS */}

        <div className="mx-auto max-w-[700px] px-4 py-5 sm:px-6">
          {/* ORDER HEADER */}

          <section className="rounded-[16px] border border-[#E5EAF1] bg-white p-5 shadow-[0_10px_30px_rgba(30,72,130,0.05)]">
            <div className="flex items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF]">
                <Package size={23} className="text-[#1769F5]" />
              </div>

              <div className="ml-3 min-w-0 flex-1">
                <p className="text-[14px] font-bold">{selectedOrder.id}</p>

                <p className="mt-1 text-[10px] text-[#718096]">
                  Placed {selectedOrder.date}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-[9px] font-semibold ${getStatusStyle(
                  selectedOrder.status
                )}`}
              >
                {selectedOrder.status}
              </span>
            </div>
          </section>

          {/* ERROR */}

          {error && (
            <div className="mt-3 rounded-[10px] border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">
              <p className="text-[10px] font-medium text-[#D92D20]">
                {error}
              </p>
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mt-3 flex items-center rounded-[10px] border border-[#B7E4C7] bg-[#EAF7EF] px-4 py-3">
              <CheckCircle2 size={16} className="mr-2 text-[#159447]" />

              <p className="text-[10px] font-semibold text-[#159447]">
                {success}
              </p>
            </div>
          )}

          {/* STATUS */}

          <section className="mt-4 rounded-[16px] border border-[#E5EAF1] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-bold">Order Status</h2>

              {getStatusIcon(selectedOrder.status)}
            </div>

            <div className="mt-5">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FF]">
                  {getStatusIcon(selectedOrder.status)}
                </div>

                <div className="ml-3">
                  <p className="text-[12px] font-semibold">
                    {selectedOrder.status}
                  </p>

                  <p className="mt-1 text-[9px] text-[#718096]">
                    Your order is currently{" "}
                    {selectedOrder.status.toLowerCase()}.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ORDER SUMMARY */}

          <section className="mt-4 rounded-[16px] border border-[#E5EAF1] bg-white p-5">
            <h2 className="text-[13px] font-bold">Order Summary</h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-[#718096]">
                  <Package size={15} className="mr-2" />

                  <span className="text-[10px]">Order Number</span>
                </div>

                <span className="text-[10px] font-semibold">
                  {selectedOrder.id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-[#718096]">
                  <CalendarDays size={15} className="mr-2" />

                  <span className="text-[10px]">Order Date</span>
                </div>

                <span className="text-[10px] font-semibold">
                  {selectedOrder.date}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-[#718096]">
                  <ShoppingBag size={15} className="mr-2" />

                  <span className="text-[10px]">Items</span>
                </div>

                <span className="text-[10px] font-semibold">
                  {selectedDetail
                    ? `${selectedDetail.items.length} Items`
                    : selectedOrder.items}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-[#EEF1F5] pt-4">
                <div className="flex items-center text-[#718096]">
                  <IndianRupee size={15} className="mr-2" />

                  <span className="text-[10px]">Total Amount</span>
                </div>

                <span className="text-[13px] font-bold">
                  {selectedOrder.amount}
                </span>
              </div>
            </div>
          </section>

          {/* PAYMENT */}

          <section className="mt-4 rounded-[16px] border border-[#E5EAF1] bg-white p-5">
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F6FF]">
                <CreditCard size={18} className="text-[#1769F5]" />
              </div>

              <div className="ml-3">
                <p className="text-[11px] font-bold">Payment</p>

                <p className="mt-1 text-[9px] text-[#718096]">
                  {selectedDetail?.payment
                    ? `${selectedDetail.payment.method} • ${selectedDetail.payment.status}`
                    : "Payment details are available in your order invoice."}
                </p>
              </div>
            </div>
          </section>

          {/* DELIVERY */}

          {selectedOrder.status !== "Cancelled" && (
            <section className="mt-4 rounded-[16px] border border-[#E5EAF1] bg-white p-5">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F8F5]">
                  <MapPin size={18} className="text-[#159447]" />
                </div>

                <div className="ml-3">
                  <p className="text-[11px] font-bold">Delivery</p>

                  <p className="mt-1 text-[9px] text-[#718096]">
                    {deliveryText
                      ? `${deliveryText}${contactText ? ` • ${contactText}` : ""}`
                      : "Your delivery information will appear here."}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ACTIONS */}

          <div className="mt-5 space-y-3">
            {/* CANCEL */}

            {(selectedOrder.status === "Confirmed" ||
              selectedOrder.status === "Pending") && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => cancelOrder(selectedOrder.id)}
                className="flex h-12 w-full items-center justify-center rounded-[10px] border border-[#F0B7B7] bg-white text-[11px] font-semibold text-[#EF4444] transition hover:bg-[#FFF7F7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle size={17} className="mr-2" />

                {actionLoading ? "Cancelling..." : "Cancel Order"}
              </button>
            )}

            {/* REORDER */}

            {selectedOrder.status === "Delivered" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => reorder(selectedOrder)}
                className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#1769F5] text-[11px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw size={17} className="mr-2" />

                {actionLoading ? "Processing..." : "Reorder"}
              </button>
            )}

            {/* TRACK */}

            {selectedOrder.status !== "Cancelled" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => trackOrder(selectedOrder)}
                className="flex h-12 w-full items-center justify-center rounded-[10px] border border-[#DCE1E8] bg-white text-[11px] font-semibold text-[#52627A] transition hover:bg-[#F8FAFD] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Truck size={17} className="mr-2" />

                Track Order
              </button>
            )}

            {/* BACK */}

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                setSelectedOrder(null);
                setSelectedDetail(null);
                setError("");
                setSuccess("");
              }}
              className="flex h-11 w-full items-center justify-center text-[10px] font-semibold text-[#1769F5] hover:underline disabled:opacity-50"
            >
              <ArrowLeft size={14} className="mr-1" />

              Back to My Orders
            </button>
          </div>
        </div>
      </>
    );
  }

  /* =====================================================
     ORDER LIST
  ====================================================== */

  const hasInvalidOrders = !validateOrders(orders);

  const activeOrders = getStatusCount(orders, [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
  ]);

  const deliveredOrders = getStatusCount(orders, ["Delivered"]);

  return (
    <>
      {/* BREADCRUMB */}

      <section
        className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-[14px] text-[#5E7396]"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex shrink-0 items-center gap-2 text-[#1769F5] transition hover:text-[#0F5BDE]"
        >
          <Home size={16} />
          Home
        </button>

        <b className="shrink-0 text-[#9AA9BF]">›</b>

        <button
          type="button"
          onClick={goToAccount}
          className="shrink-0 text-[#5E7396] transition hover:text-[#1769F5]"
        >
          My Account
        </button>

        <b className="shrink-0 text-[#9AA9BF]">›</b>

        <strong className="shrink-0 font-semibold text-[#102D62]">
          My Orders
        </strong>
      </section>

      {/* PAGE HEADER */}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#102D62] transition hover:bg-[#F3F7FC]"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>

          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#102D62] sm:text-[32px]">
              Your Orders
            </h1>

            <p className="mt-1 text-[13px] text-[#718096]">
              View and track all your orders.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={goToAccount}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#102D62] transition hover:bg-[#F3F7FC]"
          aria-label="Close"
        >
          <X size={21} />
        </button>
      </div>

      {/* CONTENT */}

      <div className="mt-6 w-full">
        {/* SUMMARY */}

        <section className="mb-5 overflow-hidden rounded-[18px] border border-[#E1E8F1] bg-white shadow-[0_10px_30px_rgba(30,72,130,0.05)]">
          <div className="grid grid-cols-1 divide-y divide-[#E8EDF4] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {/* TOTAL */}

            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF]">
                <ShoppingBag size={26} className="text-[#1769F5]" />
              </div>

              <div>
                <p className="text-[13px] font-medium text-[#52627A]">
                  Total Orders
                </p>
                <p className="mt-0.5 text-[24px] font-bold text-[#102D62]">
                  {orders.length}
                </p>
              </div>
            </div>

            {/* ACTIVE */}

            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FFF7E8]">
                <Clock3 size={26} className="text-[#D97706]" />
              </div>

              <div>
                <p className="text-[13px] font-medium text-[#52627A]">
                  Active Orders
                </p>
                <p className="mt-0.5 text-[24px] font-bold text-[#102D62]">
                  {activeOrders}
                </p>
              </div>
            </div>

            {/* DELIVERED */}

            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF]">
                <CheckCircle2 size={26} className="text-[#159447]" />
              </div>

              <div>
                <p className="text-[13px] font-medium text-[#52627A]">
                  Delivered
                </p>
                <p className="mt-0.5 text-[24px] font-bold text-[#102D62]">
                  {deliveredOrders}
                </p>
              </div>
            </div>

            {/* BRAND MESSAGE */}

            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F1F5FB]">
                <Package size={25} className="text-[#718096]" />
              </div>

              <div>
                <p className="text-[15px] font-semibold text-[#52627A]">
                  Shop More.
                </p>
                <p className="text-[15px] font-semibold text-[#52627A]">
                  Live Better.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-4 flex items-center rounded-[12px] border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">
            <XCircle size={18} className="mr-2 shrink-0 text-[#EF4444]" />

            <p className="text-[11px] font-medium text-[#D92D20]">{error}</p>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-4 flex items-center rounded-[12px] border border-[#B7E4C7] bg-[#EAF7EF] px-4 py-3">
            <CheckCircle2 size={18} className="mr-2 shrink-0 text-[#159447]" />

            <p className="text-[11px] font-semibold text-[#159447]">
              {success}
            </p>
          </div>
        )}

        {/* INVALID ORDER WARNING */}

        {hasInvalidOrders && (
          <div className="mb-4 rounded-[12px] border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">
            <p className="text-[11px] font-semibold text-[#D92D20]">
              Some order information is invalid. Please try again later.
            </p>
          </div>
        )}

        {/* ORDERS */}

        {orders.length === 0 ? (
          <div className="rounded-[18px] border border-[#E5EAF1] bg-white p-12 text-center shadow-[0_10px_30px_rgba(30,72,130,0.05)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF5FF]">
              <ShoppingBag size={34} className="text-[#1769F5]" />
            </div>

            <p className="mt-5 text-[18px] font-bold text-[#102D62]">
              No orders yet
            </p>

            <p className="mt-1 text-[12px] text-[#718096]">
              Your orders will appear here.
            </p>

            <button
              type="button"
              onClick={() => router.push("/retail")}
              className="mt-6 rounded-[10px] bg-[#1769F5] px-7 py-3 text-[12px] font-semibold text-white transition hover:bg-[#0F5BDE]"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderErrors = validateOrder(order);

              const orderIsValid = Object.keys(orderErrors).length === 0;

              return (
                <article
                  key={order.id}
                  className={`rounded-[18px] border bg-white p-4 shadow-[0_8px_25px_rgba(30,72,130,0.04)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_35px_rgba(30,72,130,0.08)] sm:p-5 ${
                    orderIsValid ? "border-[#E1E8F1]" : "border-[#FCA5A5]"
                  }`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    {/* STATUS ICON */}

                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${getOrderIconBackground(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                    </div>

                    {/* ORDER INFO */}

                    <button
                      type="button"
                      onClick={() => handleSelectOrder(order)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[16px] font-bold text-[#102D62] sm:text-[18px]">
                          {order.id || "Invalid Order"}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-[9px] font-semibold ${getStatusStyle(
                            order.status
                          )}`}
                        >
                          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />
                          {order.status || "Invalid"}
                        </span>
                      </div>

                      <p className="mt-1 text-[12px] text-[#718096]">
                        Placed {order.date || "Unknown date"}{" "}
                        <span className="mx-1">•</span>
                        {order.items || "Unknown items"}
                      </p>

                      {/* PRODUCT PREVIEW */}

                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F3F5F8]">
                          <ShoppingBag size={18} className="text-[#7A8CA5]" />
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F3F5F8]">
                          <Package size={18} className="text-[#7A8CA5]" />
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F3F5F8]">
                          <CreditCard size={17} className="text-[#7A8CA5]" />
                        </div>

                        <span className="flex h-11 min-w-[58px] items-center justify-center rounded-[9px] bg-[#F0F4F9] px-3 text-[10px] font-semibold text-[#718096]">
                          {order.items === "5 Items" ? "+2 more" : "+0 more"}
                        </span>
                      </div>

                      {!orderIsValid && (
                        <p className="mt-2 text-[9px] font-medium text-[#EF4444]">
                          Order information needs attention
                        </p>
                      )}
                    </button>

                    {/* AMOUNT */}

                    <div className="shrink-0 lg:min-w-[130px]">
                      <p className="text-[22px] font-bold tracking-[-0.02em] text-[#102D62]">
                        {order.amount || "₹0"}
                      </p>
                    </div>

                    {/* ACTIONS */}

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:w-[235px] lg:flex-col">
                      <button
                        type="button"
                        onClick={() => handleSelectOrder(order)}
                        className="flex h-11 items-center justify-center rounded-[10px] bg-[#1769F5] px-5 text-[12px] font-semibold text-white transition hover:bg-[#0F5BDE]"
                      >
                        View Details
                      </button>

                      {order.status === "Delivered" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => reorder(order)}
                          className="flex h-11 items-center justify-center rounded-[10px] border border-[#1769F5] bg-white px-5 text-[12px] font-semibold text-[#1769F5] transition hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RefreshCcw size={16} className="mr-2" />
                          {actionLoading ? "Processing..." : "Reorder"}
                        </button>
                      ) : order.status !== "Cancelled" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => trackOrder(order)}
                          className="flex h-11 items-center justify-center rounded-[10px] border border-[#1769F5] bg-white px-5 text-[12px] font-semibold text-[#1769F5] transition hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Truck size={16} className="mr-2" />
                          Track Order
                        </button>
                      ) : null}
                    </div>

                    {/* CHEVRON */}

                    <button
                      type="button"
                      onClick={() => handleSelectOrder(order)}
                      className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#7A8CA5] transition hover:bg-[#F3F7FC] hover:text-[#1769F5] lg:flex"
                      aria-label={`View ${order.id} details`}
                    >
                      <ChevronRight size={22} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
