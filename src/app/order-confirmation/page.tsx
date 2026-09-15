"use client";

import { useEffect, useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";

import OrderConfirmedBanner from "@/app/components/OrderConfirmation/OrderConfirmedBanner";
import OrderProgressTracker from "@/app/components/OrderConfirmation/OrderProgressTracker";
import DeliveryInformationCard from "@/app/components/OrderConfirmation/DeliveryInformationCard";
import OrderSummaryConfirmation from "@/app/components/OrderConfirmation/OrderSummaryConfirmation";
import InvoiceDocumentsCard from "@/app/components/OrderConfirmation/InvoiceDocumentsCard";
import BusinessDocumentsCard from "@/app/components/OrderConfirmation/BusinessDocumentsCard";
import WhatNextCard from "@/app/components/OrderConfirmation/WhatNextCard";
import RecommendedProducts from "@/app/components/OrderConfirmation/RecommendedProducts";
import GrowBusinessSection from "@/app/components/OrderConfirmation/GrowBusinessSection";
import NeedHelpSection from "@/app/components/OrderConfirmation/NeedHelpSection";

import { hasSession } from "@/app/api/api";
import { isGuid } from "@/app/api/productcache";
import { ordersApi } from "@/app/api/services";

// Banner/tracker/delivery values derived from the
// confirmed order (live backend detail, falling
// back to the checkout-saved order) instead of
// the static demo dataset.
type BannerInfo = {
  orderNumber: string;
  orderDate: string;
  payment: string;
  invoice: string;
  status: string;
};

type DeliveryInfo = {
  repName: string;
  shippingAddress: string;
  contact: string;
  deliveryWindow: string;
};

type SavedOrder = {
  orderId?: string;
  orderNumber?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  orderStatus?: string;
  createdAt?: string;
};

const PAYMENT_NAMES: Record<string, string> = {
  cod: "Cash on Delivery",
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
  wallet: "Wallet",
  banktransfer: "Bank Transfer",
};

// Backend order status → progress step index
// (steps: Order Confirmed, Processing, Packed,
// Shipped, Out for Delivery, Delivered).
const PROGRESS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 0,
  processing: 1,
  packed: 2,
  shipped: 3,
  "out for delivery": 4,
  outfordelivery: 4,
  delivered: 5,
  cancelled: -1,
  canceled: -1,
};

function orderStatusLabel(status?: string | null): string {
  const key = status?.trim().toLowerCase();

  if (!key || key === "pending") {
    return "Order Placed";
  }

  if (key === "confirmed") {
    return "Order Confirmed";
  }

  if (key === "cancelled" || key === "canceled") {
    return "Cancelled";
  }

  return status!.trim();
}

function progressIndexFor(status?: string | null): number | undefined {
  const key = status?.trim().toLowerCase();

  return key && key in PROGRESS_INDEX ? PROGRESS_INDEX[key] : undefined;
}

function formatDate(value?: string | null): string {
  const date = value ? new Date(value) : new Date();

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
}

function deliveryWindowFor(placedAt?: string | null): string {
  const start = placedAt ? new Date(placedAt) : new Date();

  if (Number.isNaN(start.getTime())) {
    return "";
  }

  const end = new Date(start);
  start.setDate(start.getDate() + 3);
  end.setDate(end.getDate() + 5);

  const dayMonth = { day: "numeric", month: "long" } as const;

  return `${start.toLocaleDateString("en-IN", dayMonth)}-${end.toLocaleDateString(
    "en-IN",
    dayMonth
  )}, ${end.getFullYear()}`;
}

export default function OrderConfirmationPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [bannerInfo, setBannerInfo] = useState<BannerInfo | null>(null);
  const [progressIndex, setProgressIndex] = useState<number | undefined>(
    undefined
  );
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);

  const handleOpenMenu = () => {
    setNavOpen(true);
  };

  const handleCloseMenu = () => {
    setNavOpen(false);
  };

  useEffect(() => {
    let cancelled = false;

    // The checkout step saved the placed order here;
    // seed the banner with it, then refine with the
    // live backend order when a session exists.
    let saved: SavedOrder | null = null;

    try {
      const raw = localStorage.getItem("lastOrder");

      if (raw) {
        const parsed: unknown = JSON.parse(raw);

        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          saved = parsed as SavedOrder;
        }
      }
    } catch (error) {
      console.warn("Unable to read the saved order:", error);
    }

    if (saved) {
      const methodKey = (saved.paymentMethod || "").trim().toLowerCase();

      setBannerInfo({
        orderNumber: `#${(saved.orderNumber || "").trim() || "N/A"}`,
        orderDate: formatDate(saved.createdAt),
        payment:
          (saved.paymentStatus || "").trim() ||
          PAYMENT_NAMES[methodKey] ||
          "Pending",
        invoice: "Generated",
        status: orderStatusLabel(saved.orderStatus),
      });

      setProgressIndex(progressIndexFor(saved.orderStatus));
    }

    const orderId = (saved?.orderId || "").trim();

    if (!hasSession() || !isGuid(orderId)) {
      return () => {
        cancelled = true;
      };
    }

    ordersApi
      .details(orderId)
      .then(({ data: detail }) => {
        if (cancelled || !detail) {
          return;
        }

        setBannerInfo({
          orderNumber: `#${detail.orderNo}`,
          orderDate: formatDate(detail.createdAt),
          payment: (detail.payment?.status || "").trim() || "Pending",
          invoice: "Generated",
          status: orderStatusLabel(detail.status),
        });

        setProgressIndex(progressIndexFor(detail.status));

        const address = detail.shippingAddress;

        if (address) {
          const addressLines = [
            address.addressLine1,
            address.addressLine2,
          ]
            .filter(
              (line) => typeof line === "string" && line.trim().length > 0
            )
            .join(", ");

          setDeliveryInfo({
            repName: address.recipientName?.trim() || "Not available",
            shippingAddress:
              [addressLines, address.city, address.state]
                .filter((part) => part.trim().length > 0)
                .join(", ") + ` - ${address.pincode}`,
            contact: address.recipientPhone?.trim() || "Not available",
            deliveryWindow: deliveryWindowFor(detail.createdAt),
          });
        }
      })
      .catch((error) => {
        console.warn("Live order details unavailable:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      {/* =====================================================
          TOP BAR
      ====================================================== */}
      <TopBar />

      {/* =====================================================
          HEADER
      ====================================================== */}
      <Header onMenuClick={handleOpenMenu} />

      {/* =====================================================
          MAIN NAVIGATION
      ====================================================== */}
      <MainNav
        open={navOpen}
        onClose={handleCloseMenu}
      />

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <main className="flex-1">
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-[1360px]
            flex-col
            gap-8
            px-4
            py-8
            sm:px-6
          "
        >
          {/* ORDER CONFIRMED */}
          <OrderConfirmedBanner orderInfo={bannerInfo ?? undefined} />

          {/* ORDER PROGRESS */}
          <OrderProgressTracker currentIndex={progressIndex} />

          {/* =================================================
              ORDER DETAILS
          ================================================= */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">

            {/* LEFT COLUMN */}
            <div className="flex min-w-0 flex-col gap-5">
              <DeliveryInformationCard
                repName={deliveryInfo?.repName}
                shippingAddress={deliveryInfo?.shippingAddress}
                contact={deliveryInfo?.contact}
                deliveryWindow={deliveryInfo?.deliveryWindow}
              />
              <OrderSummaryConfirmation />
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex min-w-0 flex-col gap-5">
              <InvoiceDocumentsCard />
              <BusinessDocumentsCard />
              <WhatNextCard />
            </div>

          </div>

          {/* =================================================
              RECOMMENDATIONS
          ================================================= */}
          <RecommendedProducts />

          {/* =================================================
              BUSINESS SERVICES
          ================================================= */}
          <GrowBusinessSection />

          {/* =================================================
              HELP
          ================================================= */}
          <NeedHelpSection />
        </div>
      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <Footer />
    </div>
  );
}