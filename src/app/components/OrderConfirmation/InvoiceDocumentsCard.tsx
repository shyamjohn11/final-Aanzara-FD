"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Printer,
  Mail,
  FileText,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "react-toastify";

// ==========================================
// PRODUCT TYPE
// ==========================================

type Product = {
  id?: string | number;
  name?: string;
  price?: number;
  mrp?: number;
  image?: string;
  bulkMoq?: number;
  bulkRate?: number;
};

// ==========================================
// ORDER ITEM
// ==========================================

type OrderItem = {
  product?: Product;
  qty?: number;
};

// ==========================================
// ORDER SUMMARY
// ==========================================

type OrderSummary = {
  totalUnits?: number;
  mrpTotal?: number;
  itemsTotal?: number;
  wholesaleDiscount?: number;
  couponDiscount?: number;
  couponCode?: string;
  subtotal?: number;
  gstRate?: number;
  gstAmount?: number;
  shipping?: number;
  handlingFee?: number;
  grandTotal?: number;
  totalSavings?: number;
};

// ==========================================
// PAYMENT DETAILS
// ==========================================

type PaymentDetails = {
  upiId?: string;
  cardLast4?: string;
  bankName?: string;
  accountHolder?: string;
  companyName?: string;
  creditAccount?: string;
  walletProvider?: string;
  walletNumber?: string;
};

// ==========================================
// LAST ORDER
// ==========================================

type LastOrder = {
  orderNumber?: string;
  invoiceNumber?: string;

  paymentMethod?: string;
  paymentMethodName?: string;
  paymentStatus?: string;
  paymentTime?: string;

  paymentDetails?: PaymentDetails;

  invoiceStatus?: string;
  orderStatus?: string;

  items?: OrderItem[];
  summary?: OrderSummary;

  createdAt?: string;
};

// ==========================================
// COMPONENT
// ==========================================

export default function InvoiceDocumentsCard() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // ==========================================
  // LOAD LAST ORDER
  // ==========================================

  useEffect(() => {
    try {
      const storedOrder = localStorage.getItem("lastOrder");

      if (storedOrder) {
        const parsedOrder: unknown = JSON.parse(storedOrder);

        if (
          parsedOrder &&
          typeof parsedOrder === "object" &&
          !Array.isArray(parsedOrder)
        ) {
          setOrder(parsedOrder as LastOrder);
        }
      }
    } catch (error) {
      console.error("Unable to load order:", error);
      setOrder(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (!loaded) {
    return (
      <div className="bg-white border-2 border-green/40 rounded-card p-5">
        <h2 className="text-[14px] font-bold text-ink">
          Invoice &amp; Documents
        </h2>

        <p className="text-[12px] text-ink-soft mt-3">
          Loading invoice...
        </p>
      </div>
    );
  }

  // ==========================================
  // NO ORDER
  // ==========================================

  if (!order) {
    return (
      <div className="bg-white border-2 border-green/40 rounded-card p-5">
        <h2 className="text-[14px] font-bold text-ink mb-3">
          Invoice &amp; Documents
        </h2>

        <p className="text-[12px] text-ink-soft">
          No confirmed order found.
        </p>
      </div>
    );
  }

  // ==========================================
  // SAFE ORDER DATA
  // ==========================================

  const items: OrderItem[] = Array.isArray(order.items)
    ? order.items
    : [];

  const summary: OrderSummary = order.summary || {};

  const orderNumber =
    typeof order.orderNumber === "string" && order.orderNumber.trim()
      ? order.orderNumber
      : `AZ${Date.now()}`;

  const invoiceNumber =
    typeof order.invoiceNumber === "string" &&
    order.invoiceNumber.trim()
      ? order.invoiceNumber
      : `INV-${orderNumber}`;

  // ==========================================
  // ORDER DATE
  // ==========================================

  const formatDate = (value?: string) => {
    if (!value) {
      return new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const orderDate = formatDate(order.createdAt);

  // ==========================================
  // PAYMENT METHOD NAMES
  // ==========================================

  const paymentMethodNames: Record<string, string> = {
    upi: "UPI (Google Pay, PhonePe)",
    card: "Credit / Debit Card",
    netbanking: "Net Banking",
    cod: "Cash on Delivery",
    credit: "Business Credit",
    wallet: "Corporate Wallet",
  };

  // ==========================================
  // PAYMENT METHOD
  // ==========================================

  const paymentMethod =
    order.paymentMethodName ||
    paymentMethodNames[order.paymentMethod || ""] ||
    order.paymentMethod ||
    "Not selected";

  // ==========================================
  // PAYMENT STATUS
  // ==========================================

  const paymentStatus =
    order.paymentStatus || "Pending";

  // ==========================================
  // INVOICE STATUS
  // ==========================================

  const invoiceStatus =
    order.invoiceStatus || "Generated";

  // ==========================================
  // PAYMENT DETAILS
  // ==========================================

  const upiId =
    order.paymentDetails?.upiId || "";

  const cardLast4 =
    order.paymentDetails?.cardLast4 || "";

  const bankName =
    order.paymentDetails?.bankName || "";

  const accountHolder =
    order.paymentDetails?.accountHolder || "";

  const companyName =
    order.paymentDetails?.companyName || "";

  const creditAccount =
    order.paymentDetails?.creditAccount || "";

  const walletProvider =
    order.paymentDetails?.walletProvider || "";

  const walletNumber =
    order.paymentDetails?.walletNumber || "";

  // ==========================================
  // PAYMENT TIME
  // ==========================================

  const paymentTime = (() => {
    const source = order.paymentTime || order.createdAt;

    if (!source) {
      return "Not available";
    }

    const date = new Date(source);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  })();

  // ==========================================
  // CURRENCY
  // ==========================================

  const formatCurrency = (value?: number) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return "Rs. 0";
    }

    return `Rs. ${amount.toLocaleString("en-IN")}`;
  };

  // ==========================================
  // DELIVERY INFORMATION
  // ==========================================

  const deliveryWindow =
    "August 10-12, 2026";

  const originWarehouse =
    "Chennai Distribution Center - HUB 4";

  // ==========================================
  // DOWNLOAD PDF
  // ==========================================

  const handleDownloadInvoice = () => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const left = 20;
      const right = pageWidth - 20;

      let y = 20;

      // ======================================
      // HELPER: PAGE CHECK
      // ======================================

      const ensureSpace = (requiredHeight: number) => {
        if (y + requiredHeight > pageHeight - 35) {
          pdf.addPage();
          y = 20;
          return true;
        }

        return false;
      };

      // ======================================
      // HEADER
      // ======================================

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(11, 30, 75);

      pdf.text("AANZARA", left, y);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);

      pdf.text(
        "Wholesale FMCG Marketplace",
        left,
        y + 6
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      pdf.setTextColor(11, 30, 75);

      pdf.text(
        "TAX INVOICE",
        right,
        y,
        {
          align: "right",
        }
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);

      pdf.text(
        `Invoice: ${invoiceNumber}`,
        right,
        y + 7,
        {
          align: "right",
        }
      );

      pdf.text(
        `Order: #${orderNumber}`,
        right,
        y + 13,
        {
          align: "right",
        }
      );

      pdf.text(
        `Date: ${orderDate}`,
        right,
        y + 19,
        {
          align: "right",
        }
      );

      y += 32;

      // ======================================
      // LINE
      // ======================================

      pdf.setDrawColor(210, 210, 210);
      pdf.line(left, y, right, y);

      y += 12;

      // ======================================
      // CUSTOMER INFORMATION
      // ======================================

      ensureSpace(45);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(20, 20, 20);

      pdf.text(
        "Customer Information",
        left,
        y
      );

      y += 9;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(90, 90, 90);

      pdf.text(
        "Customer Representative",
        left,
        y
      );

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 30, 30);

      pdf.text(
        "Anthony Thomas",
        left,
        y + 5
      );

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(90, 90, 90);

      pdf.text(
        "Contact Number",
        110,
        y
      );

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 30, 30);

      pdf.text(
        "+91 96765 43210",
        110,
        y + 5
      );

      y += 17;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(90, 90, 90);

      pdf.text(
        "Registered Shipping Address",
        left,
        y
      );

      pdf.setTextColor(30, 30, 30);

      pdf.text(
        "42 Business Park, Palayamkottai,",
        left,
        y + 5
      );

      pdf.text(
        "Tirunelveli, Tamil Nadu - 627002",
        left,
        y + 10
      );

      pdf.setTextColor(90, 90, 90);

      pdf.text(
        "Logistics Partner",
        110,
        y
      );

      pdf.setTextColor(30, 30, 30);

      pdf.text(
        "BlueDart Express (Air Freight)",
        110,
        y + 5
      );

      y += 25;

      // ======================================
      // ORDER SUMMARY
      // ======================================

      ensureSpace(55);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);

      pdf.text(
        "Order Summary",
        left,
        y
      );

      y += 9;

      // ======================================
      // TABLE HEADER
      // ======================================

      pdf.setFillColor(240, 243, 248);

      pdf.rect(
        left,
        y - 5,
        pageWidth - 40,
        10,
        "F"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(30, 30, 30);

      pdf.text("Product", 23, y + 1);
      pdf.text("SKU", 115, y + 1);
      pdf.text("Qty", 145, y + 1);

      pdf.text(
        "Amount",
        right - 3,
        y + 1,
        {
          align: "right",
        }
      );

      y += 12;

      // ======================================
      // PRODUCTS
      // ======================================

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);

      if (items.length === 0) {
        pdf.text(
          "No order items found",
          23,
          y
        );

        y += 8;
      }

      items.forEach((item) => {
        const product =
          item?.product || {};

        const qty = Math.max(
          1,
          Number(item?.qty || 1)
        );

        const price = Number(
          product?.price || 0
        );

        const bulkMoq = Number(
          product?.bulkMoq
        );

        const hasBulkPricing =
          Number.isFinite(bulkMoq) &&
          bulkMoq > 0 &&
          Number.isFinite(
            Number(product?.bulkRate)
          );

        const bulkRate = hasBulkPricing
          ? Number(product?.bulkRate)
          : price;

        const effectivePrice =
          hasBulkPricing && qty >= bulkMoq
            ? bulkRate
            : price;

        const amount =
          effectivePrice * qty;

        const productName =
          product?.name?.trim() ||
          "Product";

        const sku =
          product?.id !== undefined &&
          product?.id !== null
            ? String(product.id)
            : "-";

        const productLines =
          pdf.splitTextToSize(
            productName,
            82
          );

        ensureSpace(
          Math.max(
            8,
            productLines.length * 5
          ) + 4
        );

        pdf.setTextColor(30, 30, 30);

        pdf.text(
          productLines,
          23,
          y
        );

        pdf.text(
          sku,
          115,
          y
        );

        pdf.text(
          String(qty),
          145,
          y
        );

        pdf.text(
          formatCurrency(amount),
          right - 3,
          y,
          {
            align: "right",
          }
        );

        y += Math.max(
          8,
          productLines.length * 5
        );
      });

      // ======================================
      // DIVIDER
      // ======================================

      ensureSpace(20);

      pdf.setDrawColor(225, 225, 225);

      pdf.line(
        left,
        y,
        right,
        y
      );

      y += 12;

      // ======================================
      // PRICE BREAKDOWN
      // ======================================

      ensureSpace(65);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(40, 40, 40);

      // Items total

      pdf.text(
        "Subtotal (Items Total)",
        105,
        y
      );

      pdf.text(
        formatCurrency(summary.itemsTotal),
        right - 3,
        y,
        {
          align: "right",
        }
      );

      y += 7;

      // Wholesale discount

      pdf.text(
        "Enterprise Wholesale Discount",
        105,
        y
      );

      pdf.text(
        `-${formatCurrency(
          summary.wholesaleDiscount
        )}`,
        right - 3,
        y,
        {
          align: "right",
        }
      );

      y += 7;

      // Coupon

      const couponText =
        summary.couponCode
          ? `Promo Code Discount (${summary.couponCode})`
          : "Promo Code Discount";

      pdf.text(
        couponText,
        105,
        y
      );

      pdf.text(
        `-${formatCurrency(
          summary.couponDiscount
        )}`,
        right - 3,
        y,
        {
          align: "right",
        }
      );

      y += 7;

      // Subtotal

      pdf.text(
        "Subtotal",
        105,
        y
      );

      pdf.text(
        formatCurrency(summary.subtotal),
        right - 3,
        y,
        {
          align: "right",
        }
      );

      y += 7;

      // GST

      const gstRateValue =
        Number(summary.gstRate || 0);

      const gstRate = Number.isFinite(
        gstRateValue
      )
        ? gstRateValue * 100
        : 0;

      pdf.text(
        `GST (${gstRate}%)`,
        105,
        y
      );

      pdf.text(
        formatCurrency(summary.gstAmount),
        right - 3,
        y,
        {
          align: "right",
        }
      );

      y += 7;

      // Shipping

      pdf.text(
        "Bulk Cargo Shipping",
        105,
        y
      );

      const shipping =
        Number(summary.shipping || 0);

      pdf.text(
        shipping === 0
          ? "FREE"
          : formatCurrency(shipping),
        right - 3,
        y,
        {
          align: "right",
        }
      );

      y += 7;

      // Handling

      pdf.text(
        "FMCG Safe Handling Fee",
        105,
        y
      );

      pdf.text(
        formatCurrency(
          summary.handlingFee
        ),
        right - 3,
        y,
        {
          align: "right",
        }
      );

      y += 11;

      // ======================================
      // GRAND TOTAL
      // ======================================

      const grandTotal = Number(
        summary.grandTotal || 0
      );

      pdf.setFillColor(17, 40, 92);

      pdf.rect(
        100,
        y - 5,
        pageWidth - 120,
        13,
        "F"
      );

      pdf.setTextColor(
        255,
        255,
        255
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(11);

      pdf.text(
        "Grand Invoice Total",
        105,
        y + 3
      );

      pdf.text(
        formatCurrency(grandTotal),
        right - 3,
        y + 3,
        {
          align: "right",
        }
      );

      pdf.setTextColor(
        30,
        30,
        30
      );

      y += 22;

      // ======================================
      // PAYMENT INFORMATION
      // ======================================

      ensureSpace(75);

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(12);

      pdf.text(
        "Payment Information",
        left,
        y
      );

      y += 9;

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(10);

      // Payment method

      pdf.text(
        "Payment Method:",
        left,
        y
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        paymentMethod,
        55,
        y
      );

      y += 7;

      // Payment status

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.text(
        "Payment Status:",
        left,
        y
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        paymentStatus,
        55,
        y
      );

      // Invoice status

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.text(
        "Invoice Status:",
        110,
        y
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        invoiceStatus,
        145,
        y
      );

      // UPI

      if (
        order.paymentMethod === "upi" &&
        upiId
      ) {
        y += 7;

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.text(
          "UPI ID:",
          left,
          y
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          upiId,
          55,
          y
        );
      }

      // Payment time

      y += 7;

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.text(
        "Payment Time:",
        left,
        y
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      const paymentTimeLines =
        pdf.splitTextToSize(
          paymentTime,
          125
        );

      pdf.text(
        paymentTimeLines,
        55,
        y
      );

      y += Math.max(
        7,
        paymentTimeLines.length * 5
      );

      // Card

      if (
        order.paymentMethod === "card" &&
        cardLast4
      ) {
        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.text(
          "Card:",
          left,
          y
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          `**** **** **** ${cardLast4}`,
          55,
          y
        );

        y += 7;
      }

      // Net banking

      if (
        order.paymentMethod ===
          "netbanking" &&
        bankName
      ) {
        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.text(
          "Bank:",
          left,
          y
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          bankName,
          55,
          y
        );

        y += 7;

        if (accountHolder) {
          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.text(
            "Account Holder:",
            left,
            y
          );

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.text(
            accountHolder,
            55,
            y
          );

          y += 7;
        }
      }

      // Business credit

      if (
        order.paymentMethod === "credit" &&
        companyName
      ) {
        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.text(
          "Company:",
          left,
          y
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          companyName,
          55,
          y
        );

        y += 7;

        if (creditAccount) {
          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.text(
            "Credit Account:",
            left,
            y
          );

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.text(
            creditAccount,
            55,
            y
          );

          y += 7;
        }
      }

      // Corporate wallet

      if (
        order.paymentMethod === "wallet" &&
        walletProvider
      ) {
        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.text(
          "Wallet:",
          left,
          y
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          walletProvider,
          55,
          y
        );

        y += 7;

        if (walletNumber) {
          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.text(
            "Wallet ID:",
            left,
            y
          );

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.text(
            walletNumber,
            55,
            y
          );

          y += 7;
        }
      }

      y += 11;

      // ======================================
      // DELIVERY INFORMATION
      // ======================================

      ensureSpace(45);

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(12);

      pdf.text(
        "Delivery Information",
        left,
        y
      );

      y += 9;

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(10);

      pdf.text(
        `Estimated Delivery: ${deliveryWindow}`,
        left,
        y
      );

      pdf.text(
        `Origin Warehouse: ${originWarehouse}`,
        left,
        y + 7
      );

      y += 25;

      // ======================================
      // FOOTER
      // ======================================

      pdf.setDrawColor(
        210,
        210,
        210
      );

      pdf.line(
        left,
        pageHeight - 27,
        right,
        pageHeight - 27
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(8);

      pdf.setTextColor(
        100,
        100,
        100
      );

      pdf.text(
        "Thank you for shopping with Aanzara.",
        left,
        pageHeight - 19
      );

      pdf.text(
        "This is a computer-generated invoice.",
        left,
        pageHeight - 13
      );

      pdf.text(
        "Aanzara Wholesale FMCG Marketplace",
        right,
        pageHeight - 19,
        {
          align: "right",
        }
      );

      // ======================================
      // SAVE PDF
      // ======================================

      pdf.save(
        `Aanzara-Invoice-${orderNumber}.pdf`
      );
    } catch (error) {
      console.error(
        "Invoice PDF Error:",
        error
      );

      toast.error("Unable to download invoice PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  // ==========================================
  // PRINT
  // ==========================================

  const handlePrintInvoice = () => {
    window.print();
  };

  // ==========================================
  // EMAIL
  // ==========================================

  const handleEmailInvoice = () => {
    const subject =
      encodeURIComponent(
        `Aanzara Invoice ${invoiceNumber}`
      );

    const body =
      encodeURIComponent(
        [
          "Hello,",
          "",
          "Please find my Aanzara invoice details.",
          "",
          `Invoice Number: ${invoiceNumber}`,
          `Order Number: #${orderNumber}`,
          `Order Date: ${orderDate}`,
          "",
          `Payment Method: ${paymentMethod}`,
          `Payment Status: ${paymentStatus}`,
          `Invoice Status: ${invoiceStatus}`,
          upiId &&
          order.paymentMethod === "upi"
            ? `UPI ID: ${upiId}`
            : "",
          `Payment Time: ${paymentTime}`,
          "",
          `Grand Total: ${formatCurrency(
            summary.grandTotal
          )}`,
          "",
          "Regards,",
          "Aanzara Customer",
        ]
          .filter(Boolean)
          .join("\n")
      );

    window.location.href =
      `mailto:?subject=${subject}&body=${body}`;
  };

  // ==========================================
  // WEB INVOICE
  // ==========================================

  const handleWebInvoice = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="bg-white border-2 border-green/40 rounded-card p-5">
      {/* =====================================
          TITLE
      ====================================== */}

      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-green/10 text-green-deep flex items-center justify-center">
          <FileText size={14} />
        </span>

        <h2 className="text-[14px] font-bold text-ink">
          Invoice &amp; Documents
        </h2>
      </div>

      {/* =====================================
          INVOICE NUMBER
      ====================================== */}

      <div className="flex items-center justify-between mb-4 gap-3">
        <span className="text-[12.5px] font-semibold text-ink truncate">
          Invoice #{invoiceNumber}
        </span>

        <span className="text-[10.5px] font-bold text-green-deep bg-green/10 px-2 py-0.5 rounded-md shrink-0">
          {invoiceStatus}
        </span>
      </div>

      {/* =====================================
          PAYMENT INFORMATION
      ====================================== */}

      <div className="bg-paper border border-line rounded-lg p-3 mb-4">
        <div className="text-[11px] font-bold text-ink mb-3">
          Payment Information
        </div>

        {/* PAYMENT METHOD */}

        <div className="flex items-start justify-between gap-3 text-[11px] mb-2">
          <span className="text-ink-soft">
            Payment Method
          </span>

          <span className="font-semibold text-ink text-right max-w-[190px]">
            {paymentMethod}
          </span>
        </div>

        {/* PAYMENT STATUS */}

        <div className="flex items-center justify-between gap-3 text-[11px] mb-2">
          <span className="text-ink-soft">
            Payment Status
          </span>

          <span className="font-semibold text-green-deep">
            {paymentStatus}
          </span>
        </div>

        {/* INVOICE STATUS */}

        <div className="flex items-center justify-between gap-3 text-[11px] mb-2">
          <span className="text-ink-soft">
            Invoice Status
          </span>

          <span className="font-semibold text-green-deep">
            {invoiceStatus}
          </span>
        </div>

        {/* UPI ID */}

        {upiId &&
          order.paymentMethod === "upi" && (
            <div className="flex items-start justify-between gap-3 text-[11px] mb-2">
              <span className="text-ink-soft">
                UPI ID
              </span>

              <span className="font-semibold text-ink text-right break-all">
                {upiId}
              </span>
            </div>
          )}

        {/* CARD */}

        {cardLast4 &&
          order.paymentMethod === "card" && (
            <div className="flex items-center justify-between gap-3 text-[11px] mb-2">
              <span className="text-ink-soft">
                Card
              </span>

              <span className="font-semibold text-ink">
                **** **** **** {cardLast4}
              </span>
            </div>
          )}

        {/* BANK */}

        {bankName &&
          order.paymentMethod ===
            "netbanking" && (
            <div className="flex items-center justify-between gap-3 text-[11px] mb-2">
              <span className="text-ink-soft">
                Bank
              </span>

              <span className="font-semibold text-ink text-right">
                {bankName}
              </span>
            </div>
          )}

        {/* BUSINESS CREDIT */}

        {companyName &&
          order.paymentMethod === "credit" && (
            <div className="flex items-center justify-between gap-3 text-[11px] mb-2">
              <span className="text-ink-soft">
                Company
              </span>

              <span className="font-semibold text-ink text-right">
                {companyName}
              </span>
            </div>
          )}

        {/* WALLET */}

        {walletProvider &&
          order.paymentMethod === "wallet" && (
            <div className="flex items-center justify-between gap-3 text-[11px] mb-2">
              <span className="text-ink-soft">
                Wallet
              </span>

              <span className="font-semibold text-ink text-right">
                {walletProvider}
              </span>
            </div>
          )}

        {/* PAYMENT TIME */}

        <div className="flex items-start justify-between gap-3 text-[11px]">
          <span className="text-ink-soft">
            Payment Time
          </span>

          <span className="font-semibold text-ink text-right max-w-[190px]">
            {paymentTime}
          </span>
        </div>
      </div>

      {/* =====================================
          BUTTONS
      ====================================== */}

      <div className="flex flex-col gap-2.5">
        {/* DOWNLOAD PDF */}

        <button
          type="button"
          onClick={handleDownloadInvoice}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 bg-navy hover:bg-navy-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white text-[12.5px] font-bold py-2.5 rounded-lg"
        >
          {isDownloading ? (
            <Loader2
              size={14}
              className="animate-spin"
            />
          ) : (
            <Download size={14} />
          )}

          {isDownloading
            ? "Generating Invoice..."
            : "Download PDF Invoice"}
        </button>

        {/* PRINT */}

        <button
          type="button"
          onClick={handlePrintInvoice}
          className="flex items-center justify-center gap-2 border border-line text-ink text-[12.5px] font-bold py-2.5 rounded-lg hover:border-navy hover:text-navy transition-colors"
        >
          <Printer size={14} />
          Print Invoice Document
        </button>

        {/* EMAIL */}

        <button
          type="button"
          onClick={handleEmailInvoice}
          className="flex items-center justify-center gap-2 border border-line text-ink text-[12.5px] font-bold py-2.5 rounded-lg hover:border-navy hover:text-navy transition-colors"
        >
          <Mail size={14} />
          Email Invoice Copy
        </button>
      </div>

      {/* =====================================
          WEB INVOICE
      ====================================== */}

      <button
        type="button"
        onClick={handleWebInvoice}
        className="block text-center w-full text-[11.5px] font-semibold text-blue hover:underline mt-3"
      >
        View Web Invoice Copy
      </button>
    </div>
  );
}