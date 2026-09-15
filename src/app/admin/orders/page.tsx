"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/Admin/AdminLayout";
import { ordersAdminApi } from "@/app/api/services";
import { extractErrorMessage } from "@/app/api/api";
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  Package,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock3,
  Truck,
  XCircle,
  UserRound,
  Mail,
  Phone,
  MapPin,
  IndianRupee,
  ShoppingBag,
} from "lucide-react";

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

type PaymentStatus =
  | "Paid"
  | "Pending"
  | "Failed";

type Order = {
  id: number;
  serverId?: string;
  orderNo: string;
  customer: string;
  email: string;
  phone: string;
  company: string;
  items: number;
  amount: string;
  payment: PaymentStatus;
  status: OrderStatus;
  date: string;
  address: string;
};

/* API-first: orders load from backend; empty until fetch resolves. */

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | OrderStatus>("All");

  const [paymentFilter, setPaymentFilter] =
    useState<"All" | PaymentStatus>("All");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [viewOrder, setViewOrder] =
    useState<Order | null>(null);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [saved, setSaved] = useState(false);

  /* =====================================================
     LOAD ORDERS (#71; API-first, leave empty on failure)
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      try {
        const res: any = await ordersAdminApi.list({
          page: 1,
          pageSize: 100,
        });
        const payload: any = res?.data ?? res;
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
        if (cancelled || rawItems.length === 0) return;

        const validStatuses: OrderStatus[] = [
          "Pending",
          "Confirmed",
          "Processing",
          "Shipped",
          "Delivered",
          "Cancelled",
        ];
        const validPayments: PaymentStatus[] = [
          "Paid",
          "Pending",
          "Failed",
        ];

        const mapped: Order[] = rawItems.map(
          (raw: any, index: number) => {
            const orderNo = String(
              raw?.orderNo ??
                raw?.orderNumber ??
                raw?.order_no ??
                raw?.id ??
                raw?.orderId ??
                `AZ${10000 + index + 1}`
            );
            const statusRaw: string = String(
              raw?.status ?? raw?.orderStatus ?? "Pending"
            );
            const paymentRaw: string = String(
              raw?.payment ??
                raw?.paymentStatus ??
                raw?.payment_status ??
                "Pending"
            );
            const amountRaw: any =
              raw?.amount ??
              raw?.total ??
              raw?.grandTotal ??
              raw?.totalAmount ??
              raw?.total_amount ??
              "";
            return {
              id: Date.now() + index,
              serverId: String(
                raw?.orderId ?? raw?.id ?? raw?.orderNo ?? ""
              ),
              orderNo,
              customer: String(
                raw?.customer ??
                  raw?.customerName ??
                  raw?.customer_name ??
                  "Unknown customer"
              ),
              email: String(raw?.email ?? ""),
              phone: String(
                raw?.phone ?? raw?.phoneNumber ?? ""
              ),
              company: String(
                raw?.company ?? raw?.companyName ?? ""
              ),
              items: Number(
                raw?.items ??
                  raw?.itemCount ??
                  raw?.items_count ??
                  0
              ),
              amount:
                typeof amountRaw === "number"
                  ? `₹${amountRaw.toLocaleString("en-IN")}`
                  : String(amountRaw),
              payment: (
                validPayments.includes(paymentRaw as PaymentStatus)
                  ? paymentRaw
                  : "Pending"
              ) as PaymentStatus,
              status: (
                validStatuses.includes(statusRaw as OrderStatus)
                  ? statusRaw
                  : "Pending"
              ) as OrderStatus,
              date: String(
                raw?.date ??
                  raw?.orderDate ??
                  raw?.order_date ??
                  raw?.createdAt ??
                  ""
              ),
              address: String(
                raw?.address ??
                  raw?.deliveryAddress ??
                  raw?.shippingAddress ??
                  ""
              ),
            };
          }
        );

        setOrders(mapped);
      } catch (error) {
        void extractErrorMessage(
          error,
          "Unable to load orders."
        );
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const [form, setForm] = useState({
    customer: "",
    email: "",
    phone: "",
    company: "",
    items: "",
    amount: "",
    payment: "Paid" as PaymentStatus,
    status: "Pending" as OrderStatus,
    date: "",
    address: "",
  });

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderNo
          .toLowerCase()
          .includes(query) ||
        order.customer
          .toLowerCase()
          .includes(query) ||
        order.email
          .toLowerCase()
          .includes(query) ||
        order.company
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "All" ||
        order.payment === paymentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
  ]);

  /* =====================================================
     STATS
  ====================================================== */

  const totalOrders = orders.length;

  const pendingCount = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const processingCount = orders.filter(
    (order) =>
      order.status === "Processing" ||
      order.status === "Confirmed"
  ).length;

  const shippedCount = orders.filter(
    (order) => order.status === "Shipped"
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const cancelledCount = orders.filter(
    (order) => order.status === "Cancelled"
  ).length;

  /* =====================================================
     RESET FORM
  ====================================================== */

  const resetForm = () => {
    setForm({
      customer: "",
      email: "",
      phone: "",
      company: "",
      items: "",
      amount: "",
      payment: "Paid",
      status: "Pending",
      date: new Date()
        .toISOString()
        .split("T")[0],
      address: "",
    });

    setEditingId(null);
  };

  /* =====================================================
     CREATE
  ====================================================== */

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  /* =====================================================
     EDIT
  ====================================================== */

  const openEdit = (order: Order) => {
    setEditingId(order.id);

    setForm({
      customer: order.customer,
      email: order.email,
      phone: order.phone,
      company: order.company,
      items: String(order.items),
      amount: order.amount.replace("₹", ""),
      payment: order.payment,
      status: order.status,
      date: order.date,
      address: order.address,
    });

    setShowForm(true);
  };

  /* =====================================================
     SAVE
  ====================================================== */

  const saveOrder = () => {
    if (
      !form.customer.trim() ||
      !form.email.trim() ||
      !form.items.trim() ||
      !form.amount.trim() ||
      !form.date
    ) {
      return;
    }

    if (editingId !== null) {
      setOrders((current) =>
        current.map((order) =>
          order.id === editingId
            ? {
                ...order,
                customer:
                  form.customer.trim(),
                email:
                  form.email.trim(),
                phone:
                  form.phone.trim(),
                company:
                  form.company.trim(),
                items:
                  Number(form.items) || 0,
                amount:
                  `₹${form.amount.trim()}`,
                payment:
                  form.payment,
                status:
                  form.status,
                date:
                  form.date,
                address:
                  form.address.trim(),
              }
            : order
        )
      );
    } else {
      const nextNumber =
        10000 + orders.length + 1;

      setOrders((current) => [
        ...current,
        {
          id: Date.now(),
          orderNo: `AZ${nextNumber}`,
          customer:
            form.customer.trim(),
          email:
            form.email.trim(),
          phone:
            form.phone.trim(),
          company:
            form.company.trim(),
          items:
            Number(form.items) || 0,
          amount:
            `₹${form.amount.trim()}`,
          payment:
            form.payment,
          status:
            form.status,
          date:
            form.date,
          address:
            form.address.trim(),
        },
      ]);
    }

    setShowForm(false);
    resetForm();
    showSuccess();
  };

  /* =====================================================
     DELETE
  ====================================================== */

  const deleteOrder = async () => {
    if (deleteId === null) return;

    const target = orders.find(
      (order) => order.id === deleteId
    );

    // Best-effort server delete (#74); always run local logic.
    if (target?.serverId) {
      try {
        await ordersAdminApi.remove(target.serverId);
      } catch (error) {
        void extractErrorMessage(
          error,
          "Unable to delete order on server."
        );
      }
    }

    setOrders((current) =>
      current.filter(
        (order) => order.id !== deleteId
      )
    );

    setDeleteId(null);
    showSuccess();
  };

  /* =====================================================
     UPDATE STATUS
  ====================================================== */

  const updateStatus = async (
    id: number,
    status: OrderStatus
  ) => {
    const target = orders.find(
      (order) => order.id === id
    );

    // Best-effort server status update (#73); always run local logic.
    if (target?.serverId) {
      try {
        await ordersAdminApi.setStatus(
          target.serverId ?? target.orderNo,
          status
        );
      } catch (error) {
        void extractErrorMessage(
          error,
          "Unable to update order status on server."
        );
      }
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? {
              ...order,
              status,
            }
          : order
      )
    );

    if (viewOrder?.id === id) {
      setViewOrder({
        ...viewOrder,
        status,
      });
    }

    showSuccess();
  };

  /* =====================================================
     VIEW DETAILS (best-effort refresh #72, then merge)
  ====================================================== */

  const handleView = async (order: Order) => {
    setViewOrder(order);

    if (!order.serverId) return;

    try {
      const res: any = await ordersAdminApi.details(
        order.serverId
      );
      const raw: any = res?.data ?? res;
      const d: any = raw?.data ?? raw;
      if (!d || typeof d !== "object") return;

      const statusRaw =
        d.status ?? d.orderStatus ?? order.status;
      const paymentRaw =
        d.payment ?? d.paymentStatus ?? order.payment;
      const amountRaw =
        d.amount ?? d.total ?? d.grandTotal ?? order.amount;

      setViewOrder((current) =>
        current && current.id === order.id
          ? {
              ...current,
              customer: String(
                d.customer ?? d.customerName ?? current.customer
              ),
              email: String(d.email ?? current.email),
              phone: String(
                d.phone ?? d.phoneNumber ?? current.phone
              ),
              company: String(
                d.company ?? d.companyName ?? current.company
              ),
              items: Number(d.items ?? d.itemCount ?? current.items),
              amount:
                typeof amountRaw === "number"
                  ? `₹${amountRaw.toLocaleString("en-IN")}`
                  : String(amountRaw),
              payment: paymentRaw as PaymentStatus,
              status: statusRaw as OrderStatus,
              date: String(
                d.date ?? d.orderDate ?? d.createdAt ?? current.date
              ),
              address: String(
                d.address ??
                  d.deliveryAddress ??
                  d.shippingAddress ??
                  current.address
              ),
            }
          : current
      );
    } catch (error) {
      void extractErrorMessage(
        error,
        "Unable to refresh order details."
      );
      // Keep row-fed modal content.
    }
  };

  /* =====================================================
     SUCCESS
  ====================================================== */

  const showSuccess = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
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
            Orders
          </h1>

          <p className="hidden text-[9px] text-[#8995A5] sm:block">
            Manage customer orders, payments and delivery status
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#1769F5] px-3 text-[10px] font-semibold text-white hover:bg-[#0F5BDE] sm:px-4"
        >
          <Plus size={15} />

          <span className="hidden sm:inline">
            Create Order
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
            Orders
          </span>

        </div>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={ShoppingBag}
            bg="bg-[#EDF3FF]"
            iconColor="text-[#3260B4]"
          />

          <StatCard
            title="Pending"
            value={pendingCount}
            icon={Clock3}
            bg="bg-[#FFF5DF]"
            iconColor="text-[#C17B19]"
          />

          <StatCard
            title="Processing"
            value={processingCount}
            icon={Package}
            bg="bg-[#EEF5FF]"
            iconColor="text-[#1769F5]"
          />

          <StatCard
            title="Shipped"
            value={shippedCount}
            icon={Truck}
            bg="bg-[#F0ECFF]"
            iconColor="text-[#7053C6]"
          />

          <StatCard
            title="Delivered"
            value={deliveredCount}
            icon={CheckCircle2}
            bg="bg-[#EAF8F0]"
            iconColor="text-[#249357]"
          />

          <StatCard
            title="Cancelled"
            value={cancelledCount}
            icon={XCircle}
            bg="bg-[#FFF0F0]"
            iconColor="text-[#D85A5A]"
          />

        </section>

        {/* =================================================
            SEARCH / FILTER
        ================================================== */}

        <section className="mt-5 rounded-2xl border border-[#E4E8EF] bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3">

            <div className="flex h-10 w-full items-center rounded-lg border border-[#DFE5ED] bg-[#FAFBFD] px-3">

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
                placeholder="Search order, customer, email or company..."
                className="w-full bg-transparent px-2.5 text-[11px] outline-none placeholder:text-[#A0AAB8]"
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

            <div className="flex flex-col gap-2 lg:flex-row">

              {/* ORDER STATUS */}

              <div className="flex gap-1.5 overflow-x-auto">

                {(
                  [
                    "All",
                    "Pending",
                    "Confirmed",
                    "Processing",
                    "Shipped",
                    "Delivered",
                    "Cancelled",
                  ] as const
                ).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        status
                      )
                    }
                    className={`
                      shrink-0
                      rounded-lg
                      px-3
                      py-2
                      text-[9px]
                      font-semibold
                      ${
                        statusFilter ===
                        status
                          ? "bg-[#173B7A] text-white"
                          : "bg-[#F5F7FA] text-[#68778B] hover:bg-[#EDEFF3]"
                      }
                    `}
                  >
                    {status}
                  </button>
                ))}

              </div>

              {/* PAYMENT */}

              <div className="flex gap-1.5">

                {(
                  [
                    "All",
                    "Paid",
                    "Pending",
                    "Failed",
                  ] as const
                ).map((payment) => (
                  <button
                    key={payment}
                    type="button"
                    onClick={() =>
                      setPaymentFilter(
                        payment
                      )
                    }
                    className={`
                      shrink-0
                      rounded-lg
                      px-3
                      py-2
                      text-[9px]
                      font-semibold
                      ${
                        paymentFilter ===
                        payment
                          ? "bg-[#1769F5] text-white"
                          : "bg-[#F5F7FA] text-[#68778B] hover:bg-[#EDEFF3]"
                      }
                    `}
                  >
                    {payment}
                  </button>
                ))}

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            ORDER TABLE
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E8EF] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#EDF0F4] px-5 py-4">

            <div>
              <h2 className="text-[13px] font-bold text-[#263650]">
                Order List
              </h2>

              <p className="mt-1 text-[9px] text-[#8995A5]">
                {filteredOrders.length} orders found
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setPaymentFilter(
                  "All"
                );
              }}
              className="text-[9px] font-semibold text-[#1769F5] hover:underline"
            >
              Clear Filters
            </button>

          </div>

          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF3FF] text-[#4773C5]">
                <Package size={25} />
              </div>

              <h3 className="mt-4 text-[13px] font-bold">
                No orders found
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

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Order
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Items
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Payment
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Date
                      </th>

                      <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-wide text-[#98A3B2]">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {filteredOrders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#FCFDFE]"
                        >

                          {/* ORDER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                                <Package size={17} />
                              </div>

                              <div>

                                <p className="text-[10px] font-bold text-[#33415A]">
                                  {order.orderNo}
                                </p>

                                <p className="mt-1 text-[8px] text-[#8995A5]">
                                  {order.date}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">

                            <p className="text-[10px] font-semibold text-[#52627A]">
                              {order.customer}
                            </p>

                            <p className="mt-1 text-[8px] text-[#8995A5]">
                              {order.company ||
                                "Individual"}
                            </p>

                          </td>

                          {/* ITEMS */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-semibold text-[#52627A]">
                              {order.items} Items
                            </span>

                          </td>

                          {/* AMOUNT */}

                          <td className="px-5 py-4">

                            <span className="text-[10px] font-bold text-[#263650]">
                              {order.amount}
                            </span>

                          </td>

                          {/* PAYMENT */}

                          <td className="px-5 py-4">

                            <PaymentBadge
                              status={
                                order.payment
                              }
                            />

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                order.status
                              }
                            />

                          </td>

                          {/* DATE */}

                          <td className="px-5 py-4">

                            <span className="text-[9px] text-[#66748B]">
                              {order.date}
                            </span>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1.5">

                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    order
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E5EC] text-[#52627A] hover:bg-[#F4F6F9]"
                              >
                                <Eye size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    order
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E5EC] text-[#1769F5] hover:bg-[#EDF3FF]"
                              >
                                <Pencil size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteId(
                                    order.id
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
                  MOBILE LIST
              ================================================== */}

              <div className="divide-y divide-[#EDF0F4] md:hidden">

                {filteredOrders.map(
                  (order) => (
                    <div
                      key={order.id}
                      className="p-4"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                          <Package size={17} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div>

                              <p className="text-[11px] font-bold text-[#33415A]">
                                {order.orderNo}
                              </p>

                              <p className="mt-1 text-[9px] font-semibold text-[#52627A]">
                                {order.customer}
                              </p>

                            </div>

                            <StatusBadge
                              status={
                                order.status
                              }
                            />

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">

                            <InfoSmall
                              label="Items"
                              value={`${order.items} Items`}
                            />

                            <InfoSmall
                              label="Amount"
                              value={
                                order.amount
                              }
                            />

                            <InfoSmall
                              label="Payment"
                              value={
                                order.payment
                              }
                            />

                            <InfoSmall
                              label="Date"
                              value={
                                order.date
                              }
                            />

                          </div>

                          <div className="mt-3 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleView(
                                  order
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[9px] font-semibold text-[#52627A]"
                            >
                              <Eye size={12} />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  order
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#DCE2EA] px-3 text-[9px] font-semibold text-[#1769F5]"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteId(
                                  order.id
                                )
                              }
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#F0D4D4] px-3 text-[9px] font-semibold text-[#D85A5A]"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>

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
          CREATE / EDIT MODAL
      ================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() =>
              setShowForm(false)
            }
          />

          <div className="relative max-h-[92vh] w-full max-w-[700px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E9EF] bg-white px-5 py-4">

              <div>

                <h2 className="text-[14px] font-bold text-[#263650]">
                  {editingId !== null
                    ? "Edit Order"
                    : "Create Order"}
                </h2>

                <p className="mt-1 text-[9px] text-[#8995A5]">
                  Enter customer and order details
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="space-y-4 p-5">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Customer Name"
                  placeholder="Enter customer name"
                  value={form.customer}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      customer: value,
                    })
                  }
                />

                <FormInput
                  label="Email Address"
                  placeholder="Enter email"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      email: value,
                    })
                  }
                />

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <FormInput
                  label="Phone Number"
                  placeholder="Enter phone"
                  type="tel"
                  value={form.phone}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      phone: value,
                    })
                  }
                />

                <FormInput
                  label="Company"
                  placeholder="Enter company"
                  value={form.company}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      company: value,
                    })
                  }
                />

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <FormInput
                  label="Items"
                  placeholder="Number of items"
                  type="number"
                  value={form.items}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      items: value,
                    })
                  }
                />

                <FormInput
                  label="Order Amount"
                  placeholder="Example: 2499"
                  type="number"
                  value={form.amount}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      amount: value,
                    })
                  }
                />

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Order Date
                  </label>

                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        date:
                          event.target.value,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                  />

                </div>

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Payment Status
                  </label>

                  <select
                    value={form.payment}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        payment:
                          event.target
                            .value as PaymentStatus,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                  >
                    <option value="Paid">
                      Paid
                    </option>

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Failed">
                      Failed
                    </option>
                  </select>

                </div>

                <div>

                  <label className="text-[9px] font-semibold text-[#52627A]">
                    Order Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status:
                          event.target
                            .value as OrderStatus,
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] outline-none focus:border-[#1769F5]"
                  >
                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Confirmed">
                      Confirmed
                    </option>

                    <option value="Processing">
                      Processing
                    </option>

                    <option value="Shipped">
                      Shipped
                    </option>

                    <option value="Delivered">
                      Delivered
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>
                  </select>

                </div>

              </div>

              <div>

                <label className="text-[9px] font-semibold text-[#52627A]">
                  Delivery Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      address:
                        event.target.value,
                    })
                  }
                  placeholder="Enter delivery address"
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-lg border border-[#DCE2EA] px-3 py-2.5 text-[10px] outline-none focus:border-[#1769F5]"
                />

              </div>

            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#E5E9EF] bg-[#FAFBFD] px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="h-9 rounded-lg border border-[#DCE2EA] px-4 text-[10px] font-semibold text-[#647287]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveOrder}
                className="h-9 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                {editingId !== null
                  ? "Update Order"
                  : "Save Order"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW MODAL
      ================================================== */}

      {viewOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">

          <div
            className="absolute inset-0"
            onClick={() =>
              setViewOrder(null)
            }
          />

          <div className="relative max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#E5E9EF] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF3FF] text-[#1769F5]">
                  <Package size={18} />
                </div>

                <div>

                  <h2 className="text-[13px] font-bold text-[#263650]">
                    {viewOrder.orderNo}
                  </h2>

                  <p className="mt-1 text-[8px] text-[#8995A5]">
                    {viewOrder.date}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewOrder(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B8798] hover:bg-[#F2F5F8]"
              >
                <X size={17} />
              </button>

            </div>

            <div className="space-y-4 p-5">

              <div className="flex items-center justify-between">

                <StatusBadge
                  status={
                    viewOrder.status
                  }
                />

                <PaymentBadge
                  status={
                    viewOrder.payment
                  }
                />

              </div>

              {/* CUSTOMER */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <DetailRow
                  icon={UserRound}
                  label="Customer"
                  value={
                    viewOrder.customer
                  }
                />

                <DetailRow
                  icon={ShoppingBag}
                  label="Company"
                  value={
                    viewOrder.company ||
                    "Individual"
                  }
                />

                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={
                    viewOrder.email
                  }
                />

                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={
                    viewOrder.phone
                  }
                />

              </div>

              {/* ORDER SUMMARY */}

              <div className="rounded-xl bg-[#F7F9FC] p-4">

                <div className="grid grid-cols-3 gap-3">

                  <DetailBox
                    label="Items"
                    value={`${viewOrder.items}`}
                  />

                  <DetailBox
                    label="Amount"
                    value={
                      viewOrder.amount
                    }
                  />

                  <DetailBox
                    label="Payment"
                    value={
                      viewOrder.payment
                    }
                  />

                </div>

              </div>

              {/* ADDRESS */}

              <div className="rounded-xl border border-[#E5E9EF] p-4">

                <div className="flex items-start">

                  <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
                    <MapPin size={15} />
                  </div>

                  <div>

                    <p className="text-[8px] uppercase tracking-wide text-[#98A3B2]">
                      Delivery Address
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-[#52627A]">
                      {viewOrder.address ||
                        "No delivery address added."}
                    </p>

                  </div>

                </div>

              </div>

              {/* STATUS */}

              <div>

                <p className="mb-2 text-[9px] font-semibold text-[#52627A]">
                  Update Order Status
                </p>

                <div className="flex flex-wrap gap-2">

                  {(
                    [
                      "Pending",
                      "Confirmed",
                      "Processing",
                      "Shipped",
                      "Delivered",
                      "Cancelled",
                    ] as OrderStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        updateStatus(
                          viewOrder.id,
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
                          viewOrder.status ===
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

            <div className="border-t border-[#E5E9EF] px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  const selected =
                    viewOrder;

                  setViewOrder(null);
                  openEdit(selected);
                }}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#1769F5] text-[10px] font-semibold text-white hover:bg-[#0F5BDE]"
              >
                <Pencil size={13} />
                Edit Order
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

          <div
            className="absolute inset-0"
            onClick={() =>
              setDeleteId(null)
            }
          />

          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D85A5A]">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-4 text-[14px] font-bold text-[#263650]">
              Delete Order?
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-[#8995A5]">
              This order will be permanently
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
                onClick={deleteOrder}
                className="h-9 rounded-lg bg-[#D85A5A] px-4 text-[10px] font-semibold text-white hover:bg-[#C94D4D]"
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          SUCCESS TOAST
      ================================================== */}

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
              Order updated successfully.
            </p>

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

          <p className="text-[9px] font-medium text-[#8995A5]">
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
   ORDER STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const classes =
    status === "Pending"
      ? "bg-[#FFF5DF] text-[#C17B19]"
      : status === "Confirmed"
        ? "bg-[#EDF3FF] text-[#3260B4]"
        : status === "Processing"
          ? "bg-[#EEF5FF] text-[#1769F5]"
          : status === "Shipped"
            ? "bg-[#F0ECFF] text-[#7053C6]"
            : status === "Delivered"
              ? "bg-[#EAF8F0] text-[#249357]"
              : "bg-[#FFF0F0] text-[#D85A5A]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}

/* ============================================================
   PAYMENT BADGE
============================================================ */

function PaymentBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  const classes =
    status === "Paid"
      ? "bg-[#EAF8F0] text-[#249357]"
      : status === "Pending"
        ? "bg-[#FFF5DF] text-[#C17B19]"
        : "bg-[#FFF0F0] text-[#D85A5A]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold ${classes}`}
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
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
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
        className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE2EA] bg-white px-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/10"
      />

    </div>
  );
}

/* ============================================================
   INFO SMALL
============================================================ */

function InfoSmall({
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
    <div className="rounded-xl bg-white px-3 py-3">

      <p className="text-[7px] uppercase tracking-wide text-[#9AA5B4]">
        {label}
      </p>

      <p className="mt-1 text-[9px] font-semibold text-[#52627A]">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start rounded-xl bg-[#F7F9FC] px-3 py-3">

      <div className="mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1769F5]">
        <Icon size={13} />
      </div>

      <div className="min-w-0">

        <p className="text-[7px] uppercase tracking-wide text-[#9AA5B4]">
          {label}
        </p>

        <p className="mt-1 break-words text-[9px] font-semibold text-[#52627A]">
          {value}
        </p>

      </div>

    </div>
  );
}