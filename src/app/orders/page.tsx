"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";

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
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | string;

type OrderItem = {
  id?: string | number;
  productId?: string | number;
  name?: string;
  productName?: string;
  image?: string;
  price?: number;
  quantity?: number;
  qty?: number;
  total?: number;
};

type Order = {
  id?: string | number;
  orderNumber?: string;
  orderNo?: string;
  number?: string;

  status?: OrderStatus;
  orderStatus?: OrderStatus;

  date?: string;
  createdAt?: string;

  items?: OrderItem[];

  subtotal?: number;
  shipping?: number;
  gst?: number;
  gstAmount?: number;
  discount?: number;
  total?: number;
  grandTotal?: number;

  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  paymentMethod?: string;
  paymentStatus?: string;

  deliveryAddress?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
};

/* =========================================================
   DEFAULT ORDERS
========================================================= */

const DEFAULT_ORDERS: Order[] = [
  {
    id: "AZ10245",
    orderNumber: "#AZ10245",
    status: "Confirmed",
    date: "2026-09-02T10:30:00",
    items: [
      {
        id: "item-1",
        name: "Wholesale FMCG Products",
        image: "/images/products/product-1.jpg",
        price: 5000,
        quantity: 1,
        total: 5000,
      },
    ],
    subtotal: 5000,
    shipping: 0,
    gstAmount: 900,
    total: 5900,
    grandTotal: 5900,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
  },

  {
    id: "AZ10238",
    orderNumber: "#AZ10238",
    status: "Out for Delivery",
    date: "2026-09-02T09:15:00",
    items: [
      {
        id: "item-2",
        name: "Wholesale Grocery Products",
        image: "/images/products/product-2.jpg",
        price: 3500,
        quantity: 1,
        total: 3500,
      },
    ],
    subtotal: 3500,
    shipping: 0,
    gstAmount: 630,
    total: 4130,
    grandTotal: 4130,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
  },

  {
    id: "AZ10210",
    orderNumber: "#AZ10210",
    status: "Delivered",
    date: "2026-08-31T12:20:00",
    items: [
      {
        id: "item-3",
        name: "Wholesale FMCG Products",
        image: "/images/products/product-3.jpg",
        price: 4500,
        quantity: 1,
        total: 4500,
      },
    ],
    subtotal: 4500,
    shipping: 0,
    gstAmount: 810,
    total: 5310,
    grandTotal: 5310,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
  },

  {
    id: "AZ10221",
    orderNumber: "#AZ10221",
    status: "Delivered",
    date: "2026-09-01T15:45:00",
    items: [
      {
        id: "item-4",
        name: "Business Wholesale Order",
        image: "/images/products/product-4.jpg",
        price: 3000,
        quantity: 1,
        total: 3000,
      },
    ],
    subtotal: 3000,
    shipping: 0,
    gstAmount: 540,
    total: 3540,
    grandTotal: 3540,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function cleanOrderNumber(value?: string | number): string {
  return String(value ?? "")
    .replace(/^#/, "")
    .trim()
    .toUpperCase();
}

function getOrderNumber(order: Order): string {
  return (
    order.orderNumber ||
    order.orderNo ||
    order.number ||
    (order.id ? `#${order.id}` : "")
  );
}

function getOrderStatus(order: Order): string {
  return order.orderStatus || order.status || "Pending";
}

function getOrderDate(order: Order): string {
  return order.createdAt || order.date || "";
}

function getOrderTotal(order: Order): number {
  return Number(
    order.grandTotal ??
      order.total ??
      order.subtotal ??
      0,
  );
}

function formatCurrency(value: number): string {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value?: string): string {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* =========================================================
   BACKEND MAPPERS
========================================================= */

function summaryToOrder(summary: OrderSummaryResponse): Order {
  return {
    id: summary.orderId,
    orderNumber: `#${summary.orderNo}`,
    status: summary.status,
    createdAt: summary.createdAt,
    items: [],
    subtotal: summary.grandTotal,
    total: summary.grandTotal,
    grandTotal: summary.grandTotal,
    paymentMethod: summary.paymentMethod ?? undefined,
    paymentStatus: summary.paymentStatus ?? undefined,
  };
}

function detailToOrder(detail: OrderDetailResponse): Order {
  return {
    id: detail.orderId,
    orderNumber: `#${detail.orderNo}`,
    status: detail.status,
    createdAt: detail.createdAt,
    items: (detail.items ?? []).map((item) => ({
      id: item.productId,
      productId: item.productId,
      name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity,
      total: item.lineTotal,
    })),
    subtotal: detail.itemsTotal,
    shipping: detail.deliveryCharge,
    gstAmount: detail.gstAmount,
    discount: detail.discount,
    total: detail.grandTotal,
    grandTotal: detail.grandTotal,
    paymentMethod: detail.payment?.method ?? undefined,
    paymentStatus: detail.payment?.status ?? undefined,
  };
}

/* =========================================================
   STATUS HELPERS
========================================================= */

function getStatusIcon(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("deliver")) {
    return CheckCircle2;
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("failed")
  ) {
    return XCircle;
  }

  if (
    normalized.includes("ship") ||
    normalized.includes("out for")
  ) {
    return Truck;
  }

  if (
    normalized.includes("process") ||
    normalized.includes("confirm")
  ) {
    return Package;
  }

  return Clock3;
}

function getStatusClass(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized.includes("deliver")) {
    return "bg-green-50 text-green-700";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("failed")
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    normalized.includes("ship") ||
    normalized.includes("out for")
  ) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-amber-50 text-amber-700";
}

/* =========================================================
   PAGE
========================================================= */

// useSearchParams() must sit inside a Suspense boundary for
// the static prerender pass, so the shell wraps the content.
export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedOrder = searchParams.get("order");

  const [navOpen, setNavOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>(() =>
    hasSession() ? [] : DEFAULT_ORDERS,
  );

  const [loading, setLoading] = useState(hasSession());

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  useEffect(() => {
    if (!hasSession()) {
      try {
        const savedOrders = localStorage.getItem("orders");

        if (!savedOrders) {
          setOrders(DEFAULT_ORDERS);
          return;
        }

        const parsedOrders = JSON.parse(savedOrders);

        if (Array.isArray(parsedOrders)) {
          setOrders([
            ...DEFAULT_ORDERS,
            ...parsedOrders,
          ]);
        } else {
          setOrders(DEFAULT_ORDERS);
        }
      } catch {
        setOrders(DEFAULT_ORDERS);
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

        const summaries = Array.isArray(data) ? data : [];

        setOrders(summaries.map(summaryToOrder));
      })
      .catch(() => {
        if (!cancelled) {
          setOrders(DEFAULT_ORDERS);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     SELECT ORDER FROM QUERY PARAM
     
     /orders?order=AZ10210
     
     This will select AZ10210 instead of AZ10245.
  ======================================================= */

  const selectedOrder = useMemo(() => {
    if (!requestedOrder) {
      return orders[0] ?? null;
    }

    const requested = cleanOrderNumber(requestedOrder);

    const found = orders.find((order) => {
      const orderNumber = cleanOrderNumber(
        getOrderNumber(order),
      );

      const id = cleanOrderNumber(order.id);

      return (
        orderNumber === requested ||
        id === requested
      );
    });

    return found ?? null;
  }, [orders, requestedOrder]);

  /* =======================================================
     FETCH FULL DETAILS FOR THE SELECTED ORDER

     Summary rows carry no items; hydrate the selected row
     from GET /api/v1/orders/{orderId}.
  ======================================================= */

  const selectedOrderId = selectedOrder?.id;

  useEffect(() => {
    const orderId = String(selectedOrderId ?? "");

    if (!hasSession() || !isGuid(orderId)) {
      return;
    }

    const alreadyHydrated = orders.some(
      (order) =>
        String(order.id ?? "") === orderId &&
        (order.items?.length ?? 0) > 0,
    );

    if (alreadyHydrated) {
      return;
    }

    let cancelled = false;

    ordersApi
      .details(orderId)
      .then(({ data }) => {
        if (cancelled) {
          return;
        }

        setOrders((current) =>
          current.map((order) =>
            String(order.id ?? "") === orderId
              ? detailToOrder(data)
              : order,
          ),
        );
      })
      .catch((err) => {
        console.warn("Live order details unavailable:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedOrderId, orders]);

  /* =======================================================
     BACK
  ======================================================= */

  const handleBack = () => {
    router.back();
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <TopBar />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <Header
        onMenuClick={() => {
          setNavOpen(true);
        }}
      />

      {/* =====================================================
          MAIN NAV
      ===================================================== */}

      <MainNav
        open={navOpen}
        onClose={() => {
          setNavOpen(false);
        }}
      />

      {/* =====================================================
          PAGE
      ===================================================== */}

      <main className="w-full">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-[#E1E5EB]
                bg-white
                text-[#10265B]
                transition
                hover:bg-[#F1F5F9]
              "
              aria-label="Go back"
            >
              <ArrowLeft
                size={20}
                strokeWidth={1.8}
              />
            </button>

            <div>
              <h1
                className="
                  !m-0
                  !text-[#10265B]
                  text-[24px]
                  font-bold
                  leading-8
                "
              >
                My Orders
              </h1>

              <p
                className="
                  !m-0
                  mt-1
                  !text-[#64748B]
                  text-[13px]
                "
              >
                View and track your wholesale orders
              </p>
            </div>
          </div>

          {/* =================================================
              NO ORDER
          ================================================= */}

          {!selectedOrder && loading && (
            <div
              className="
                flex
                min-h-[320px]
                w-full
                items-center
                justify-center
                rounded-2xl
                border
                border-[#E1E5EB]
                bg-white
              "
            >
              <p className="text-[13px] text-[#64748B]">Loading your orders…</p>
            </div>
          )}

          {!selectedOrder && !loading && (
            <div
              className="
                flex
                min-h-[320px]
                w-full
                flex-col
                items-center
                justify-center
                rounded-2xl
                border
                border-[#E1E5EB]
                bg-white
                px-6
                text-center
              "
            >
              <div
                className="
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F1F5F9]
                "
              >
                <ShoppingBag
                  size={30}
                  className="text-[#64748B]"
                />
              </div>

              <h2
                className="
                  !m-0
                  mt-4
                  !text-[#111827]
                  text-[18px]
                  font-bold
                "
              >
                No orders found
              </h2>

              <p
                className="
                  !m-0
                  mt-2
                  !text-[#64748B]
                  text-[13px]
                "
              >
                We couldn't find the requested order.
              </p>

              <button
                type="button"
                onClick={() => router.push("/orders")}
                className="
                  mt-5
                  rounded-lg
                  bg-[#0B2A66]
                  px-5
                  py-2.5
                  !text-white
                  text-[13px]
                  font-bold
                  hover:bg-[#071D49]
                "
              >
                View All Orders
              </button>
            </div>
          )}

          {/* =================================================
              ORDER DETAILS
          ================================================= */}

          {selectedOrder && (
            <div className="space-y-5">

              {/* =================================================
                  ORDER HEADER
              ================================================= */}

              <section
                className="
                  rounded-2xl
                  border
                  border-[#E1E5EB]
                  bg-white
                  p-5
                  shadow-[0_1px_3px_rgba(15,23,42,0.05)]
                  sm:p-6
                "
              >
                <div
                  className="
                    flex
                    flex-col
                    gap-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div>
                    <p
                      className="
                        !m-0
                        !text-[#64748B]
                        text-[12px]
                        font-medium
                      "
                    >
                      Order Number
                    </p>

                    <h2
                      className="
                        !m-0
                        mt-1
                        !text-[#10265B]
                        text-[22px]
                        font-bold
                      "
                    >
                      {getOrderNumber(selectedOrder)}
                    </h2>

                    <p
                      className="
                        !m-0
                        mt-1
                        !text-[#64748B]
                        text-[12px]
                      "
                    >
                      {formatDate(
                        getOrderDate(selectedOrder),
                      )}
                    </p>
                  </div>

                  <div
                    className={`
                      inline-flex
                      w-fit
                      items-center
                      gap-2
                      rounded-full
                      px-4
                      py-2
                      text-[12px]
                      font-bold
                      ${getStatusClass(
                        getOrderStatus(selectedOrder),
                      )}
                    `}
                  >
                    {(() => {
                      const StatusIcon =
                        getStatusIcon(
                          getOrderStatus(selectedOrder),
                        );

                      return (
                        <StatusIcon
                          size={15}
                          strokeWidth={2}
                        />
                      );
                    })()}

                    {getOrderStatus(selectedOrder)}
                  </div>
                </div>
              </section>

              {/* =================================================
                  STATUS TRACKER
              ================================================= */}

              <section
                className="
                  rounded-2xl
                  border
                  border-[#E1E5EB]
                  bg-white
                  p-5
                  sm:p-6
                "
              >
                <h3
                  className="
                    !m-0
                    !text-[#10265B]
                    text-[16px]
                    font-bold
                  "
                >
                  Order Status
                </h3>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">

                  {/* Confirmed */}

                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-green-50
                      "
                    >
                      <CheckCircle2
                        size={19}
                        className="text-green-600"
                      />
                    </div>

                    <div>
                      <p
                        className="
                          !m-0
                          !text-[#111827]
                          text-[12px]
                          font-bold
                        "
                      >
                        Confirmed
                      </p>

                      <p
                        className="
                          !m-0
                          !text-[#94A3B8]
                          text-[11px]
                        "
                      >
                        Order received
                      </p>
                    </div>
                  </div>

                  {/* Processing */}

                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-50
                      "
                    >
                      <Package
                        size={19}
                        className="text-blue-600"
                      />
                    </div>

                    <div>
                      <p
                        className="
                          !m-0
                          !text-[#111827]
                          text-[12px]
                          font-bold
                        "
                      >
                        Processing
                      </p>

                      <p
                        className="
                          !m-0
                          !text-[#94A3B8]
                          text-[11px]
                        "
                      >
                        Being prepared
                      </p>
                    </div>
                  </div>

                  {/* Shipped */}

                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-indigo-50
                      "
                    >
                      <Truck
                        size={19}
                        className="text-indigo-600"
                      />
                    </div>

                    <div>
                      <p
                        className="
                          !m-0
                          !text-[#111827]
                          text-[12px]
                          font-bold
                        "
                      >
                        Shipped
                      </p>

                      <p
                        className="
                          !m-0
                          !text-[#94A3B8]
                          text-[11px]
                        "
                      >
                        On the way
                      </p>
                    </div>
                  </div>

                  {/* Delivered */}

                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-green-50
                      "
                    >
                      <CheckCircle2
                        size={19}
                        className="text-green-600"
                      />
                    </div>

                    <div>
                      <p
                        className="
                          !m-0
                          !text-[#111827]
                          text-[12px]
                          font-bold
                        "
                      >
                        Delivered
                      </p>

                      <p
                        className="
                          !m-0
                          !text-[#94A3B8]
                          text-[11px]
                        "
                      >
                        Successfully delivered
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  PRODUCTS
              ================================================= */}

              <section
                className="
                  rounded-2xl
                  border
                  border-[#E1E5EB]
                  bg-white
                  p-5
                  sm:p-6
                "
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="
                      !m-0
                      !text-[#10265B]
                      text-[16px]
                      font-bold
                    "
                  >
                    Products
                  </h3>

                  <span
                    className="
                      !text-[#64748B]
                      text-[12px]
                    "
                  >
                    {selectedOrder.items?.length ?? 0} item(s)
                  </span>
                </div>

                <div className="mt-5 space-y-3">

                  {(selectedOrder.items ?? []).length === 0 && (
                    <div
                      className="
                        rounded-xl
                        border
                        border-dashed
                        border-[#CBD5E1]
                        bg-[#F8FAFC]
                        px-5
                        py-8
                        text-center
                      "
                    >
                      <Package
                        size={28}
                        className="mx-auto text-[#94A3B8]"
                      />

                      <p
                        className="
                          !m-0
                          mt-2
                          !text-[#64748B]
                          text-[13px]
                        "
                      >
                        No product details available.
                      </p>
                    </div>
                  )}

                  {(selectedOrder.items ?? []).map(
                    (item, index) => {
                      const quantity =
                        Number(
                          item.quantity ??
                            item.qty ??
                            1,
                        );

                      const itemTotal =
                        Number(
                          item.total ??
                            (item.price ?? 0) *
                              quantity,
                        );

                      const itemName =
                        item.name ||
                        item.productName ||
                        "Wholesale Product";

                      return (
                        <div
                          key={
                            item.id ??
                            item.productId ??
                            index
                          }
                          className="
                            flex
                            items-center
                            gap-4
                            rounded-xl
                            border
                            border-[#E5E7EB]
                            p-3
                          "
                        >
                          {/* IMAGE */}

                          <div
                            className="
                              flex
                              h-16
                              w-16
                              shrink-0
                              items-center
                              justify-center
                              overflow-hidden
                              rounded-lg
                              bg-[#F8FAFC]
                            "
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={itemName}
                                className="
                                  h-full
                                  w-full
                                  object-contain
                                "
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <Package
                                size={24}
                                className="text-[#94A3B8]"
                              />
                            )}
                          </div>

                          {/* DETAILS */}

                          <div className="min-w-0 flex-1">
                            <h4
                              className="
                                !m-0
                                truncate
                                !text-[#111827]
                                text-[14px]
                                font-bold
                              "
                            >
                              {itemName}
                            </h4>

                            <p
                              className="
                                !m-0
                                mt-1
                                !text-[#64748B]
                                text-[12px]
                              "
                            >
                              Qty: {quantity}
                            </p>
                          </div>

                          {/* PRICE */}

                          <div className="shrink-0 text-right">
                            <p
                              className="
                                !m-0
                                !text-[#10265B]
                                text-[14px]
                                font-bold
                              "
                            >
                              {formatCurrency(
                                itemTotal,
                              )}
                            </p>

                            {item.price !==
                              undefined && (
                              <p
                                className="
                                  !m-0
                                  mt-1
                                  !text-[#94A3B8]
                                  text-[11px]
                                "
                              >
                                {formatCurrency(
                                  Number(
                                    item.price,
                                  ),
                                )}{" "}
                                each
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </section>

              {/* =================================================
                  ORDER SUMMARY
              ================================================= */}

              <section
                className="
                  rounded-2xl
                  border
                  border-[#E1E5EB]
                  bg-white
                  p-5
                  sm:p-6
                "
              >
                <h3
                  className="
                    !m-0
                    !text-[#10265B]
                    text-[16px]
                    font-bold
                  "
                >
                  Order Summary
                </h3>

                <div className="mt-5 space-y-3">

                  <div className="flex justify-between">
                    <span
                      className="
                        !text-[#64748B]
                        text-[13px]
                      "
                    >
                      Subtotal
                    </span>

                    <span
                      className="
                        !text-[#334155]
                        text-[13px]
                        font-semibold
                      "
                    >
                      {formatCurrency(
                        Number(
                          selectedOrder.subtotal ??
                            0,
                        ),
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span
                      className="
                        !text-[#64748B]
                        text-[13px]
                      "
                    >
                      Shipping
                    </span>

                    <span
                      className="
                        !text-[#334155]
                        text-[13px]
                        font-semibold
                      "
                    >
                      {formatCurrency(
                        Number(
                          selectedOrder.shipping ??
                            0,
                        ),
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span
                      className="
                        !text-[#64748B]
                        text-[13px]
                      "
                    >
                      GST
                    </span>

                    <span
                      className="
                        !text-[#334155]
                        text-[13px]
                        font-semibold
                      "
                    >
                      {formatCurrency(
                        Number(
                          selectedOrder.gstAmount ??
                            selectedOrder.gst ??
                            0,
                        ),
                      )}
                    </span>
                  </div>

                  <div className="my-3 border-t border-[#E5E7EB]" />

                  <div className="flex justify-between">
                    <span
                      className="
                        !text-[#10265B]
                        text-[15px]
                        font-bold
                      "
                    >
                      Total
                    </span>

                    <span
                      className="
                        !text-[#10265B]
                        text-[18px]
                        font-bold
                      "
                    >
                      {formatCurrency(
                        getOrderTotal(
                          selectedOrder,
                        ),
                      )}
                    </span>
                  </div>
                </div>
              </section>

              {/* =================================================
                  PAYMENT
              ================================================= */}

              <section
                className="
                  rounded-2xl
                  border
                  border-[#E1E5EB]
                  bg-white
                  p-5
                  sm:p-6
                "
              >
                <h3
                  className="
                    !m-0
                    !text-[#10265B]
                    text-[16px]
                    font-bold
                  "
                >
                  Payment Information
                </h3>

                <div
                  className="
                    mt-5
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                  "
                >
                  <div>
                    <p
                      className="
                        !m-0
                        !text-[#94A3B8]
                        text-[11px]
                      "
                    >
                      Payment Method
                    </p>

                    <p
                      className="
                        !m-0
                        mt-1
                        !text-[#334155]
                        text-[13px]
                        font-semibold
                      "
                    >
                      {selectedOrder.paymentMethod ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p
                      className="
                        !m-0
                        !text-[#94A3B8]
                        text-[11px]
                      "
                    >
                      Payment Status
                    </p>

                    <p
                      className="
                        !m-0
                        mt-1
                        !text-green-600
                        text-[13px]
                        font-bold
                      "
                    >
                      {selectedOrder.paymentStatus ||
                        "—"}
                    </p>
                  </div>
                </div>
              </section>

              {/* =================================================
                  BACK TO ORDERS
              ================================================= */}

              <div className="flex justify-center pb-4">
                <button
                  type="button"
                  onClick={() => {
                    router.push("/orders");
                  }}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-[#0B2A66]
                    px-5
                    py-3
                    !text-white
                    text-[13px]
                    font-bold
                    transition
                    hover:bg-[#071D49]
                  "
                >
                  View All Orders

                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />
    </div>
  );
}