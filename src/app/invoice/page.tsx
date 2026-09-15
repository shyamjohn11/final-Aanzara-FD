"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
} from "lucide-react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import { ordersApi } from "@/app/api/services";
import { hasSession } from "@/app/api/api";

type InvoiceItem = {
  id?: string | number;
  name?: string;
  qty?: number;
  price?: number;
};

type OrderSummary = {
  subtotal?: number;
  gstAmount?: number;
  shipping?: number;
  handlingFee?: number;
  grandTotal?: number;
};

type OrderData = {
  orderNumber?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  createdAt?: string;
  paidAt?: string;
  items?: InvoiceItem[];
  summary?: OrderSummary;
};

function formatCurrency(value?: number): string {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPaymentName(value?: string): string {
  if (!value) {
    return "Online Payment";
  }

  switch (value.toLowerCase()) {
    case "upi":
      return "UPI";

    case "card":
      return "Credit / Debit Card";

    case "netbanking":
      return "Net Banking";

    case "cod":
      return "Cash on Delivery";

    case "wallet":
      return "Wallet";

    default:
      return value;
  }
}

function InvoicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [navOpen, setNavOpen] = useState(false);

  const [order, setOrder] =
    useState<OrderData | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError("");

      const orderId =
        searchParams.get("orderId") ??
        searchParams.get("order") ??
        "";

      // Live order detail when logged in with an order id.
      if (orderId && hasSession()) {
        try {
          const { data } = await ordersApi.details(orderId);

          if (cancelled) {
            return;
          }

          const items =
            (data.items ?? []).map((item) => ({
              id: item.productId,
              name: item.productName,
              qty: item.quantity,
              price: item.unitPrice,
            }));

          setOrder({
            orderNumber: data.orderNo,
            invoiceNumber: `INV-${data.orderNo}`,
            paymentMethod: data.payment?.method ?? "",
            paymentStatus: data.payment?.status ?? "",
            orderStatus: data.status,
            createdAt: data.createdAt,
            paidAt: data.payment?.paidAt ?? undefined,
            items,
            summary: {
              subtotal: data.itemsTotal,
              gstAmount: data.gstAmount,
              shipping: data.deliveryCharge,
              handlingFee: data.handlingFee,
              grandTotal: data.grandTotal,
            },
          });
          return;
        } catch (error) {
          console.error(
            "Failed to load invoice:",
            error
          );
          // Fall through to the saved-order fallback.
        }
      }

      try {
        const savedOrder =
          window.localStorage.getItem("lastOrder");

        if (savedOrder) {
          const parsedOrder =
            JSON.parse(savedOrder) as OrderData;

          if (
            parsedOrder &&
            typeof parsedOrder === "object"
          ) {
            if (!cancelled) {
              setOrder(parsedOrder);
            }
            return;
          }
        }

        if (!cancelled) {
          setLoadError(
            orderId
              ? "Invoice could not be loaded. Please sign in and try again."
              : "No invoice to display yet. Place an order first."
          );
          setOrder(null);
        }
      } catch (error) {
        console.error(
          "Failed to load invoice:",
          error,
        );

        if (!cancelled) {
          setLoadError(
            "Invoice could not be loaded."
          );
          setOrder(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (loading) {
    return (
      <>
        <TopBar />

        <Header
          onMenuClick={() => {
            setNavOpen(true);
          }}
        />

        <MainNav
          open={navOpen}
          onClose={() => {
            setNavOpen(false);
          }}
        />

        <main className="flex min-h-[500px] items-center justify-center bg-[#F6F8FB]">
          <p className="text-sm text-gray-500">
            Loading invoice...
          </p>
        </main>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <TopBar />

        <Header
          onMenuClick={() => {
            setNavOpen(true);
          }}
        />

        <MainNav
          open={navOpen}
          onClose={() => {
            setNavOpen(false);
          }}
        />

        <main className="flex min-h-[500px] items-center justify-center bg-[#F6F8FB]">
          <p className="text-sm text-gray-500">
            {loadError ||
              "No invoice to display yet."}
          </p>
        </main>
      </>
    );
  }

  const summary = order.summary || {};

  const subtotal =
    Number(summary.subtotal ?? 0);

  const gstAmount =
    Number(summary.gstAmount ?? 0);

  const shipping =
    Number(summary.shipping ?? 0);

  const handlingFee =
    Number(summary.handlingFee ?? 0);

  const grandTotal =
    Number(summary.grandTotal ?? 0) ||
    subtotal +
      gstAmount +
      shipping +
      handlingFee;

  const items =
    order.items && order.items.length > 0
      ? order.items
      : [];

  return (
    <>
      {/* TOP BAR */}

      <TopBar />

      {/* HEADER */}

      <Header
        onMenuClick={() => {
          setNavOpen(true);
        }}
      />

      {/* MAIN NAV */}

      <MainNav
        open={navOpen}
        onClose={() => {
          setNavOpen(false);
        }}
      />

      {/* INVOICE PAGE */}

      <main className="min-h-screen bg-[#F6F8FB]">
        <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">

          {/* ACTIONS */}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">

            <button
              type="button"
              onClick={() => {
                router.push("/alerts");
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />

              Back to Alerts
            </button>

            <div className="flex gap-2">

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Printer size={16} />

                Print
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0B2A66] px-4 text-[13px] font-semibold text-white hover:bg-[#071D49]"
              >
                <Download size={16} />

                Download
              </button>

            </div>
          </div>

          {/* INVOICE */}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* INVOICE HEADER */}

            <div className="border-b border-gray-200 px-6 py-7 sm:px-8">

              <div className="flex flex-col justify-between gap-6 sm:flex-row">

                <div>

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B2A66] text-white">
                      <FileText size={22} />
                    </div>

                    <div>

                      <h1 className="text-[20px] font-bold text-gray-900">
                        Aanzara Wholesale
                      </h1>

                      <p className="text-xs text-gray-500">
                        Wholesale & E-commerce
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 text-xs leading-5 text-gray-500">
                    <p>Chennai</p>
                    <p>Tamil Nadu, India</p>
                    <p>
                      GSTIN:
                      33XXXXXXXXXXXXXX
                    </p>
                  </div>

                </div>

                <div className="sm:text-right">

                  <h2 className="text-[24px] font-bold text-gray-900">
                    TAX INVOICE
                  </h2>

                  <p className="mt-2 text-[13px] font-bold text-[#0B2A66]">
                    {order.invoiceNumber ||
                      "INV-AZ10221"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Date:{" "}
                    {formatDate(
                      order.paidAt ||
                        order.createdAt,
                    )}
                  </p>

                </div>

              </div>

            </div>

            {/* ORDER INFO */}

            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>

                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Order Number
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {order.orderNumber ||
                      "#AZ10221"}
                  </p>

                </div>

                <div className="flex gap-2">

                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-bold text-green-700">
                    {order.paymentStatus ||
                      "Paid"}
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700">
                    {order.orderStatus ||
                      "Order Confirmed"}
                  </span>

                </div>

              </div>

            </div>

            {/* BILLING */}

            <div className="grid grid-cols-1 gap-6 border-b border-gray-200 px-6 py-7 sm:px-8 md:grid-cols-2">

              <div>

                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Bill From
                </h3>

                <div className="mt-3">

                  <p className="text-sm font-bold text-gray-900">
                    Aanzara Wholesale
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Chennai
                    <br />
                    Tamil Nadu, India
                  </p>

                  <p className="mt-3 text-xs text-gray-500">
                    Phone: +91 90000 00000
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Email: support@aanzara.com
                  </p>

                </div>

              </div>

              <div>

                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Bill To
                </h3>

                <div className="mt-3">

                  <p className="text-sm font-bold text-gray-900">
                    Wholesale Customer
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Customer Address
                    <br />
                    Tamil Nadu, India
                  </p>

                </div>

              </div>

            </div>

            {/* ITEMS */}

            <div className="px-6 py-7 sm:px-8">

              <h3 className="mb-4 text-sm font-bold text-gray-900">
                Invoice Items
              </h3>

              <div className="overflow-hidden rounded-xl border border-gray-200">

                <div className="grid grid-cols-[1fr_60px_100px_110px] gap-3 bg-gray-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-500">

                  <span>Item</span>

                  <span className="text-center">
                    Qty
                  </span>

                  <span className="text-right">
                    Price
                  </span>

                  <span className="text-right">
                    Amount
                  </span>

                </div>

                {items.map(
                  (item, index) => {
                    const quantity =
                      Number(
                        item.qty ?? 1,
                      ) || 1;

                    const price =
                      Number(
                        item.price ?? 0,
                      );

                    const amount =
                      quantity * price;

                    return (
                      <div
                        key={
                          String(
                            item.id ||
                              `item-${index}`,
                          )
                        }
                        className="grid grid-cols-[1fr_60px_100px_110px] gap-3 border-t border-gray-100 px-4 py-4 text-xs"
                      >

                        <span className="font-semibold text-gray-800">
                          {item.name ||
                            "Wholesale Product"}
                        </span>

                        <span className="text-center text-gray-500">
                          {quantity}
                        </span>

                        <span className="text-right text-gray-600">
                          {formatCurrency(
                            price,
                          )}
                        </span>

                        <span className="text-right font-bold text-gray-900">
                          {formatCurrency(
                            amount,
                          )}
                        </span>

                      </div>
                    );
                  },
                )}

              </div>

              {/* TOTAL */}

              <div className="mt-6 flex justify-end">

                <div className="w-full max-w-[380px]">

                  <div className="flex justify-between py-2 text-xs">
                    <span className="text-gray-500">
                      Subtotal
                    </span>

                    <span className="font-semibold text-gray-800">
                      {formatCurrency(
                        subtotal,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-xs">
                    <span className="text-gray-500">
                      GST
                    </span>

                    <span className="font-semibold text-gray-800">
                      {formatCurrency(
                        gstAmount,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-xs">
                    <span className="text-gray-500">
                      Shipping
                    </span>

                    <span className="font-semibold text-gray-800">
                      {formatCurrency(
                        shipping,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-xs">
                    <span className="text-gray-500">
                      Handling Fee
                    </span>

                    <span className="font-semibold text-gray-800">
                      {formatCurrency(
                        handlingFee,
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between border-t border-gray-200 pt-4">

                    <span className="text-base font-bold text-gray-900">
                      Grand Total
                    </span>

                    <span className="text-xl font-bold text-[#0B2A66]">
                      {formatCurrency(
                        grandTotal,
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* PAYMENT INFORMATION */}

            <div className="border-t border-gray-200 px-6 py-7 sm:px-8">

              <h3 className="text-sm font-bold text-gray-900">
                Payment Information
              </h3>

              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">

                <div className="flex justify-between border-b border-gray-100 px-4 py-3 text-xs">
                  <span className="text-gray-500">
                    Order Number
                  </span>

                  <span className="font-bold text-gray-900">
                    {order.orderNumber ||
                      "#AZ10221"}
                  </span>
                </div>

                <div className="flex justify-between border-b border-gray-100 px-4 py-3 text-xs">
                  <span className="text-gray-500">
                    Invoice Number
                  </span>

                  <span className="font-bold text-gray-900">
                    {order.invoiceNumber ||
                      "INV-AZ10221"}
                  </span>
                </div>

                <div className="flex justify-between border-b border-gray-100 px-4 py-3 text-xs">
                  <span className="text-gray-500">
                    Payment Method
                  </span>

                  <span className="font-bold text-gray-900">
                    {getPaymentName(
                      order.paymentMethod,
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-b border-gray-100 px-4 py-3 text-xs">
                  <span className="text-gray-500">
                    Payment Status
                  </span>

                  <span className="font-bold text-green-600">
                    {order.paymentStatus ||
                      "Paid"}
                  </span>
                </div>

                <div className="flex justify-between px-4 py-3 text-xs">
                  <span className="text-gray-500">
                    Payment Date
                  </span>

                  <span className="font-bold text-gray-900">
                    {formatDate(
                      order.paidAt ||
                        order.createdAt,
                    )}
                  </span>
                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-6 text-center sm:px-8">

              <p className="text-xs font-semibold text-gray-700">
                Thank you for your business.
              </p>

              <p className="mt-1 text-[11px] text-gray-500">
                This is a computer-generated
                invoice and does not require a
                physical signature.
              </p>

            </div>

          </section>

        </div>
      </main>

      {/* PRINT CSS */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          main {
            min-height: auto !important;
            padding: 0 !important;
            background: white !important;
          }

          section {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}

// useSearchParams needs a Suspense boundary for static prerendering.
export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[500px] items-center justify-center bg-[#F6F8FB]">
          <p className="text-sm text-gray-500">
            Loading invoice...
          </p>
        </main>
      }
    >
      <InvoicePageContent />
    </Suspense>
  );
}

