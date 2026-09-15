"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";

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
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type OrderStatus =
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
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

/* =========================================================
   VALIDATE ORDER
========================================================= */

const validateOrder = (
  order: Order
): OrderValidationErrors => {
  const errors: OrderValidationErrors = {};

  /* ORDER ID */

  if (!order.id || !order.id.trim()) {
    errors.id = "Order ID is required.";
  } else if (!/^AZ\d{5,}$/.test(order.id.trim())) {
    errors.id = "Invalid order ID.";
  }

  /* DATE */

  if (!order.date || !order.date.trim()) {
    errors.date = "Order date is required.";
  }

  /* ITEMS */

  if (!order.items || !order.items.trim()) {
    errors.items = "Item information is required.";
  } else if (
    !/^\d+\s+Items?$/i.test(order.items.trim())
  ) {
    errors.items = "Invalid item information.";
  }

  /* AMOUNT */

  if (!order.amount || !order.amount.trim()) {
    errors.amount = "Order amount is required.";
  } else if (
    !/^₹[\d,]+(?:\.\d{1,2})?$/.test(
      order.amount.trim()
    )
  ) {
    errors.amount = "Invalid order amount.";
  }

  /* STATUS */

  if (!VALID_STATUSES.includes(order.status)) {
    errors.status = "Invalid order status.";
  }

  return errors;
};

/* =========================================================
   VALIDATE ALL ORDERS
========================================================= */

const validateOrders = (
  orders: Order[]
): boolean => {
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

const getStatusCount = (
  orders: Order[],
  statuses: OrderStatus[]
) => {
  return orders.filter((order) =>
    statuses.includes(order.status)
  ).length;
};

const getOrderIconBackground = (status: OrderStatus) => {
  switch (status) {
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
   PAGE
========================================================= */

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [navOpen, setNavOpen] = useState(false);

  const [profileName, setProfileName] = useState("Sam");
  const [profileEmail, setProfileEmail] = useState("sam@example.com");

  const [orders, setOrders] =
    useState<Order[]>(INITIAL_ORDERS);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] =
    useState(false);

  /* =====================================================
     LOAD PROFILE
  ====================================================== */

  useEffect(() => {
    try {
      const savedProfile =
        localStorage.getItem("aanzara-profile");
      const savedUser =
        localStorage.getItem("user");

      const profile = savedProfile
        ? JSON.parse(savedProfile)
        : savedUser
          ? JSON.parse(savedUser)
          : null;

      if (profile && typeof profile === "object") {
        const name =
          typeof profile.name === "string"
            ? profile.name.trim()
            : typeof profile.fullName === "string"
              ? profile.fullName.trim()
              : "";

        const email =
          typeof profile.email === "string"
            ? profile.email.trim()
            : "";

        if (name) {
          setProfileName(name);
        }

        if (email) {
          setProfileEmail(email);
        }
      }
    } catch (err) {
      console.error(
        "Unable to load profile:",
        err
      );
    }
  }, []);

  /* =====================================================
     LOAD ORDERS
  ====================================================== */

  useEffect(() => {
    try {
      const savedOrders =
        localStorage.getItem("aanzara-orders");

      if (!savedOrders) {
        return;
      }

      const parsedOrders = JSON.parse(savedOrders);

      if (
        Array.isArray(parsedOrders) &&
        parsedOrders.length > 0
      ) {
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
      console.error(
        "Unable to load orders:",
        err
      );
    }
  }, []);

  /* =====================================================
     SAVE ORDERS
  ====================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        "aanzara-orders",
        JSON.stringify(orders)
      );
    } catch (err) {
      console.error(
        "Unable to save orders:",
        err
      );
    }
  }, [orders]);

  /* =====================================================
     STATUS ICON
  ====================================================== */

  const getStatusIcon = (
    status: OrderStatus
  ) => {
    switch (status) {
      case "Confirmed":
        return (
          <CheckCircle2
            size={18}
            className="text-[#1769F5]"
          />
        );

      case "Processing":
        return (
          <Clock3
            size={18}
            className="text-[#D97706]"
          />
        );

      case "Shipped":
        return (
          <Truck
            size={18}
            className="text-[#7C3AED]"
          />
        );

      case "Delivered":
        return (
          <CheckCircle2
            size={18}
            className="text-[#159447]"
          />
        );

      case "Cancelled":
        return (
          <XCircle
            size={18}
            className="text-[#EF4444]"
          />
        );

      default:
        return <Package size={18} />;
    }
  };

  /* =====================================================
     STATUS STYLE
  ====================================================== */

  const getStatusStyle = (
    status: OrderStatus
  ) => {
    switch (status) {
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

    const validationErrors =
      validateOrder(order);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setError(
        "This order contains invalid information."
      );

      return;
    }

    setSelectedOrder(order);
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

    if (!id || !/^AZ\d{5,}$/.test(id)) {
      setError("Invalid order ID.");
      return;
    }

    const existingOrder = orders.find(
      (order) => order.id === id
    );

    if (!existingOrder) {
      setError("Order not found.");
      return;
    }

    const validationErrors =
      validateOrder(existingOrder);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setError(
        "Unable to cancel this order because the order information is invalid."
      );

      return;
    }

    if (existingOrder.status !== "Confirmed") {
      setError(
        "Only confirmed orders can be cancelled."
      );

      return;
    }

    setActionLoading(true);

    const updatedOrder: Order = {
      ...existingOrder,
      status: "Cancelled",
    };

    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? updatedOrder
          : order
      )
    );

    setSelectedOrder(updatedOrder);

    setSuccess(
      "Order cancelled successfully."
    );

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

    const validationErrors =
      validateOrder(order);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setError(
        "Unable to reorder because the order information is invalid."
      );

      return;
    }

    if (order.status !== "Delivered") {
      setError(
        "Only delivered orders can be reordered."
      );

      return;
    }

    setActionLoading(true);

    /*
      Backend/cart API can be connected here.
    */

    setTimeout(() => {
      setSuccess(
        "Items have been added for reorder."
      );

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

    const validationErrors =
      validateOrder(order);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setError(
        "Unable to track this order because the order information is invalid."
      );

      return;
    }

    if (order.status === "Cancelled") {
      setError(
        "Cancelled orders cannot be tracked."
      );

      return;
    }

    setSuccess(
      "Order tracking is available here."
    );
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
     ACCOUNT SIDEBAR
  ====================================================== */

  const accountMenu = [
    {
      label: "My Profile",
      icon: User,
      href: "/account/profile",
    },
    {
      label: "My Orders",
      icon: ShoppingBag,
      href: "/account/orders",
    },
    {
      label: "Addresses",
      icon: MapPin,
      href: "/account/addresses",
    },
    {
      label: "Wishlist",
      icon: Heart,
      href: "/account/wishlist",
    },
    {
      label: "Change Password",
      icon: LockKeyhole,
      href: "/account/change-password",
    },
  ];

  const handleLogout = async () => {
    // Best-effort server logout, then the central session clear
    // (tokens + middleware guard cookies). Without the cookie clear
    // the edge guard keeps redirecting /login back into the app.
    try {
      const { authApi } = await import("@/app/api/services");
      await authApi.logout();
    } catch (error) {
      console.error("Server logout failed:", error);
    }

    try {
      const { clearSession } = await import("@/app/api/api");
      clearSession();
    } catch (error) {
      console.error("Unable to clear authentication:", error);
    }

    localStorage.removeItem("aanzara-profile");

    router.push("/login");
  };

  const AccountSidebar = ({
    currentPath,
  }: {
    currentPath: string;
  }) => (
    <aside className="w-full shrink-0 rounded-[18px] border border-[#E1E8F1] bg-white p-4 shadow-[0_10px_30px_rgba(30,72,130,0.05)] lg:w-[280px]">
      <div className="flex flex-col items-center px-2 pb-4 pt-2">
        <div className="flex h-[116px] w-[116px] items-center justify-center rounded-full bg-[#E7F0FF] text-[38px] font-bold text-[#1769F5]">
          {profileName.charAt(0).toUpperCase() || "S"}
        </div>

        <h2 className="mt-5 text-[22px] font-bold text-[#102D62]">
          {profileName}
        </h2>

        <p className="mt-1 max-w-full truncate px-2 text-center text-[14px] text-[#718096]">
          {profileEmail}
        </p>
      </div>

      <nav className="mt-3 space-y-1.5" aria-label="My Account">
        {accountMenu.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === currentPath;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.href)}
              className={`flex h-[58px] w-full items-center rounded-[12px] px-4 text-left text-[16px] font-semibold transition ${
                isActive
                  ? "border-l-[4px] border-[#1769F5] bg-[#EAF2FF] pl-3 text-[#1769F5]"
                  : "text-[#102D62] hover:bg-[#F5F8FC]"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={1.9}
                className="mr-4 shrink-0"
              />
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-[58px] w-full items-center rounded-[12px] px-4 text-left text-[16px] font-semibold text-[#EF4444] transition hover:bg-[#FFF5F5]"
        >
          <LogOut
            size={22}
            strokeWidth={1.9}
            className="mr-4 shrink-0"
          />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );

  /* =====================================================
     ORDER DETAILS
  ====================================================== */

  if (selectedOrder) {
    return (
      <div className="flex min-h-screen flex-col bg-white">

        {/* =================================================
            TOP BAR
        ================================================= */}

        <TopBar />

        {/* =================================================
            HEADER
        ================================================= */}

        <Header
          onMenuClick={() =>
            setNavOpen(true)
          }
        />

        {/* =================================================
            MAIN NAVIGATION
        ================================================= */}

        <MainNav
          open={navOpen}
          onClose={() =>
            setNavOpen(false)
          }
        />

        {/* =================================================
            ORDER DETAILS MAIN
        ================================================= */}

        <main className="flex flex-1 flex-col bg-[#F7FAFF] text-[#10265B]">

          <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:gap-8">
            <AccountSidebar currentPath={pathname} />

            <section className="min-w-0 flex-1">

          {/* HEADER */}

          <header className="flex h-[62px] items-center rounded-[16px] border border-[#E5EAF1] bg-white px-4 sm:px-6">

          <button
            type="button"
            onClick={() => {
              setSelectedOrder(null);
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
                <Package
                  size={23}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-3 min-w-0 flex-1">

                <p className="text-[14px] font-bold">
                  {selectedOrder.id}
                </p>

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

              <CheckCircle2
                size={16}
                className="mr-2 text-[#159447]"
              />

              <p className="text-[10px] font-semibold text-[#159447]">
                {success}
              </p>

            </div>
          )}

          {/* STATUS */}

          <section className="mt-4 rounded-[16px] border border-[#E5EAF1] bg-white p-5">

            <div className="flex items-center justify-between">

              <h2 className="text-[13px] font-bold">
                Order Status
              </h2>

              {getStatusIcon(
                selectedOrder.status
              )}

            </div>

            <div className="mt-5">

              <div className="flex items-center">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FF]">
                  {getStatusIcon(
                    selectedOrder.status
                  )}
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

            <h2 className="text-[13px] font-bold">
              Order Summary
            </h2>

            <div className="mt-5 space-y-4">

              <div className="flex items-center justify-between">

                <div className="flex items-center text-[#718096]">

                  <Package
                    size={15}
                    className="mr-2"
                  />

                  <span className="text-[10px]">
                    Order Number
                  </span>

                </div>

                <span className="text-[10px] font-semibold">
                  {selectedOrder.id}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <div className="flex items-center text-[#718096]">

                  <CalendarDays
                    size={15}
                    className="mr-2"
                  />

                  <span className="text-[10px]">
                    Order Date
                  </span>

                </div>

                <span className="text-[10px] font-semibold">
                  {selectedOrder.date}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <div className="flex items-center text-[#718096]">

                  <ShoppingBag
                    size={15}
                    className="mr-2"
                  />

                  <span className="text-[10px]">
                    Items
                  </span>

                </div>

                <span className="text-[10px] font-semibold">
                  {selectedOrder.items}
                </span>

              </div>

              <div className="flex items-center justify-between border-t border-[#EEF1F5] pt-4">

                <div className="flex items-center text-[#718096]">

                  <IndianRupee
                    size={15}
                    className="mr-2"
                  />

                  <span className="text-[10px]">
                    Total Amount
                  </span>

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
                <CreditCard
                  size={18}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-3">

                <p className="text-[11px] font-bold">
                  Payment
                </p>

                <p className="mt-1 text-[9px] text-[#718096]">
                  Payment details are available in your order invoice.
                </p>

              </div>

            </div>

          </section>

          {/* DELIVERY */}

          {selectedOrder.status !==
            "Cancelled" && (
            <section className="mt-4 rounded-[16px] border border-[#E5EAF1] bg-white p-5">

              <div className="flex items-center">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F8F5]">

                  <MapPin
                    size={18}
                    className="text-[#159447]"
                  />

                </div>

                <div className="ml-3">

                  <p className="text-[11px] font-bold">
                    Delivery
                  </p>

                  <p className="mt-1 text-[9px] text-[#718096]">
                    Your delivery information will appear here.
                  </p>

                </div>

              </div>

            </section>
          )}

          {/* ACTIONS */}

          <div className="mt-5 space-y-3">

            {/* CANCEL */}

            {selectedOrder.status ===
              "Confirmed" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  cancelOrder(
                    selectedOrder.id
                  )
                }
                className="flex h-12 w-full items-center justify-center rounded-[10px] border border-[#F0B7B7] bg-white text-[11px] font-semibold text-[#EF4444] transition hover:bg-[#FFF7F7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle
                  size={17}
                  className="mr-2"
                />

                {actionLoading
                  ? "Cancelling..."
                  : "Cancel Order"}
              </button>
            )}

            {/* REORDER */}

            {selectedOrder.status ===
              "Delivered" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  reorder(selectedOrder)
                }
                className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#1769F5] text-[11px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw
                  size={17}
                  className="mr-2"
                />

                {actionLoading
                  ? "Processing..."
                  : "Reorder"}
              </button>
            )}

            {/* TRACK */}

            {selectedOrder.status !==
              "Cancelled" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  trackOrder(selectedOrder)
                }
                className="flex h-12 w-full items-center justify-center rounded-[10px] border border-[#DCE1E8] bg-white text-[11px] font-semibold text-[#52627A] transition hover:bg-[#F8FAFD] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Truck
                  size={17}
                  className="mr-2"
                />

                Track Order
              </button>
            )}

            {/* BACK */}

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                setSelectedOrder(null);
                setError("");
                setSuccess("");
              }}
              className="flex h-11 w-full items-center justify-center text-[10px] font-semibold text-[#1769F5] hover:underline disabled:opacity-50"
            >
              <ArrowLeft
                size={14}
                className="mr-1"
              />

              Back to My Orders
            </button>

          </div>

        </div>

            </section>
          </div>

        </main>
      </div>
    );
  }

  /* =====================================================
     ORDER LIST
  ====================================================== */

  const hasInvalidOrders =
    !validateOrders(orders);

  const activeOrders = getStatusCount(orders, [
    "Confirmed",
    "Processing",
    "Shipped",
  ]);

  const deliveredOrders = getStatusCount(orders, [
    "Delivered",
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* =================================================
          TOP BAR
      ================================================= */}

      <TopBar />

      {/* =================================================
          HEADER
      ================================================= */}

      <Header
        onMenuClick={() =>
          setNavOpen(true)
        }
      />

      {/* =================================================
          MAIN NAVIGATION
      ================================================= */}

      <MainNav
        open={navOpen}
        onClose={() =>
          setNavOpen(false)
        }
      />

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-8 px-4 py-6 sm:px-6">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <AccountSidebar currentPath={pathname} />

          <section className="min-w-0 flex-1">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

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

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="flex items-center justify-between">
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

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="w-full">

        

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="mb-5 overflow-hidden rounded-[18px] border border-[#E1E8F1] bg-white shadow-[0_10px_30px_rgba(30,72,130,0.05)]">
          <div className="grid grid-cols-1 divide-y divide-[#E8EDF4] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">

            {/* TOTAL */}

            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF]">
                <ShoppingBag
                  size={26}
                  className="text-[#1769F5]"
                />
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
                <Clock3
                  size={26}
                  className="text-[#D97706]"
                />
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
                <CheckCircle2
                  size={26}
                  className="text-[#159447]"
                />
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
                <Package
                  size={25}
                  className="text-[#718096]"
                />
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
            <XCircle
              size={18}
              className="mr-2 shrink-0 text-[#EF4444]"
            />

            <p className="text-[11px] font-medium text-[#D92D20]">
              {error}
            </p>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-4 flex items-center rounded-[12px] border border-[#B7E4C7] bg-[#EAF7EF] px-4 py-3">
            <CheckCircle2
              size={18}
              className="mr-2 shrink-0 text-[#159447]"
            />

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

        {/* =================================================
            ORDERS
        ================================================= */}

        {orders.length === 0 ? (

          <div className="rounded-[18px] border border-[#E5EAF1] bg-white p-12 text-center shadow-[0_10px_30px_rgba(30,72,130,0.05)]">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF5FF]">
              <ShoppingBag
                size={34}
                className="text-[#1769F5]"
              />
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

              const orderErrors =
                validateOrder(order);

              const orderIsValid =
                Object.keys(orderErrors).length === 0;

              return (
                <article
                  key={order.id}
                  className={`rounded-[18px] border bg-white p-4 shadow-[0_8px_25px_rgba(30,72,130,0.04)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_35px_rgba(30,72,130,0.08)] sm:p-5 ${
                    orderIsValid
                      ? "border-[#E1E8F1]"
                      : "border-[#FCA5A5]"
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
                      onClick={() =>
                        handleSelectOrder(order)
                      }
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
                          <ShoppingBag
                            size={18}
                            className="text-[#7A8CA5]"
                          />
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F3F5F8]">
                          <Package
                            size={18}
                            className="text-[#7A8CA5]"
                          />
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F3F5F8]">
                          <CreditCard
                            size={17}
                            className="text-[#7A8CA5]"
                          />
                        </div>

                        <span className="flex h-11 min-w-[58px] items-center justify-center rounded-[9px] bg-[#F0F4F9] px-3 text-[10px] font-semibold text-[#718096]">
                          {order.items === "5 Items"
                            ? "+2 more"
                            : "+0 more"}
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
                        onClick={() =>
                          handleSelectOrder(order)
                        }
                        className="flex h-11 items-center justify-center rounded-[10px] bg-[#1769F5] px-5 text-[12px] font-semibold text-white transition hover:bg-[#0F5BDE]"
                      >
                        View Details
                      </button>

                      {order.status === "Delivered" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            reorder(order)
                          }
                          className="flex h-11 items-center justify-center rounded-[10px] border border-[#1769F5] bg-white px-5 text-[12px] font-semibold text-[#1769F5] transition hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RefreshCcw
                            size={16}
                            className="mr-2"
                          />
                          {actionLoading
                            ? "Processing..."
                            : "Reorder"}
                        </button>
                      ) : order.status !== "Cancelled" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            trackOrder(order)
                          }
                          className="flex h-11 items-center justify-center rounded-[10px] border border-[#1769F5] bg-white px-5 text-[12px] font-semibold text-[#1769F5] transition hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Truck
                            size={16}
                            className="mr-2"
                          />
                          Track Order
                        </button>
                      ) : null}
                    </div>

                    {/* CHEVRON */}

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectOrder(order)
                      }
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

          </section>
        </div>
      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="mt-8 border-t border-[#E5E7EB] bg-white px-4 py-6">
        <div className="mx-auto flex max-w-[1110px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10265B] text-[17px] font-bold text-white">
              A
            </div>

            <p className="ml-4 text-[11px] leading-5 text-[#52627A]">
              Aanzara — Shop More.
              <br />
              Live Better.
            </p>
          </div>

          <div className="flex items-center gap-5 text-[11px] font-medium text-[#718096]">
            <button
              type="button"
              onClick={() => router.push("/contact")}
              className="transition hover:text-[#1769F5]"
            >
              Help
            </button>

            <span className="h-4 w-px bg-[#DDE3EB]" />

            <button
              type="button"
              onClick={() => router.push("/privacy")}
              className="transition hover:text-[#1769F5]"
            >
              Privacy
            </button>

            <span className="h-4 w-px bg-[#DDE3EB]" />

            <button
              type="button"
              onClick={() => router.push("/terms")}
              className="transition hover:text-[#1769F5]"
            >
              Terms
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
}
