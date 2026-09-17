"use client";

import { useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";

import WholesaleHero from "@/app/components/Wholesale/WholesaleHero";
import WholesaleCategoriesStrip from "@/app/components/Wholesale/WholesaleCategoriesStrip";
import WholesaleDealsSection from "@/app/components/Wholesale/WholesaleDealsSection";
import BulkOrderCTA from "@/app/components/Wholesale/BulkOrderCTA";
import WhyBuyWholesaleGrid from "@/app/components/Wholesale/WhyBuyWholesaleGrid";
import BusinessSegmentsBanner from "@/app/components/Wholesale/BusinessSegmentsBanner";

export default function WholesalePage() {
  const [navOpen, setNavOpen] = useState(false);

  const handleOpenMenu = () => {
    setNavOpen(true);
  };

  const handleCloseMenu = () => {
    setNavOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* =========================
          STICKY TOP: TOPBAR + HEADER + MAIN NAV
      ========================== */}
      <div className="sticky top-0 z-50">
        {/* =========================
            TOP BAR
        ========================== */}
        <TopBar />

        {/* =========================
            HEADER
        ========================== */}
        <Header onMenuClick={handleOpenMenu} />

        {/* =========================
            MAIN NAVIGATION
        ========================== */}
        <MainNav
          open={navOpen}
          onClose={handleCloseMenu}
        />
      </div>

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <main className="flex-1 w-full">
        <div
          className="
            max-w-[1360px]
            w-full
            mx-auto
            px-4
            sm:px-6
            py-6
            flex
            flex-col
            gap-6
          "
        >
          {/* Wholesale Hero */}
          <WholesaleHero />

          {/* Wholesale Categories */}
          <WholesaleCategoriesStrip />

          {/* Wholesale Deals */}
          <WholesaleDealsSection />

          {/* Bulk Order CTA */}
          <BulkOrderCTA />

          {/* Why Wholesale */}
          <WhyBuyWholesaleGrid />

          {/* Business Segments */}
          <BusinessSegmentsBanner />
        </div>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <Footer />
    </div>
  );
}
