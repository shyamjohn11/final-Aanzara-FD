"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";
import OrderLiveTracking from "@/app/components/Orders/OrderLiveTracking";
import { useState } from "react";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const orderId = String((params as Record<string, string | string[]>)?.orderId ?? "");

  if (!orderId) {
    return (
      <div className="min-h-screen bg-paper p-6 text-center text-[13px] text-ink-soft">
        Missing order id. <button type="button" onClick={() => router.push("/orders")} className="text-navy underline">Back to orders</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <div className="sticky top-0 z-50">
        <TopBar />
        <Header onMenuClick={() => setNavOpen(true)} />
        <MainNav open={navOpen} onClose={() => setNavOpen(false)} />
      </div>
      <main className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft hover:text-navy"
        >
          <ArrowLeft size={13} /> Back to Orders
        </button>
        <OrderLiveTracking orderId={orderId} />
      </main>
      <Footer />
    </div>
  );
}
