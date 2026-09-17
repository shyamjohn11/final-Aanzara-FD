"use client";

import { useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";

import OffersHero from "@/app/components/Offers/OffersHero";
import TodaysDeals from "@/app/components/Offers/TodaysDeals";
import OfferFilterPills from "@/app/components/Offers/OfferFilterPills";
import PromoTilesRow from "@/app/components/Offers/PromoTilesRow";
import BestDealsSection from "@/app/components/Offers/BestDealsSection";
import ComboDealsSection from "@/app/components/Offers/ComboDealsSection";
import BulkPricingTiers from "@/app/components/Offers/BulkPricingTiers";
import AvailableCoupons from "@/app/components/Offers/AvailableCoupons";
import SeasonalOffers from "@/app/components/Offers/SeasonalOffers";
import TopBrandsOnSale from "@/app/components/Offers/TopBrandsOnSale";
import WhyBuyFromAanzara from "@/app/components/Offers/WhyBuyFromAanzara";
import OffersNewsletter from "@/app/components/Offers/OffersNewsletter";

export default function OffersPage() {
  const [navOpen, setNavOpen] = useState(false);

  const handleOpenMenu = () => {
    setNavOpen(true);
  };

  const handleCloseMenu = () => {
    setNavOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      {/* =====================================================
          STICKY TOP: TOPBAR + HEADER + MAIN NAV
      ====================================================== */}
      <div className="sticky top-0 z-50">
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
      </div>

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
            gap-10
            px-4
            py-6
            sm:px-6
          "
        >
          {/* HERO */}
          <OffersHero />

          {/* TODAY'S DEALS */}
          <TodaysDeals />

          {/* FILTERS + PROMOTIONS */}
          <div className="flex flex-col gap-6">
            <OfferFilterPills />
            <PromoTilesRow />
          </div>

          {/* BEST DEALS */}
          <BestDealsSection />

          {/* COMBO DEALS */}
          <ComboDealsSection />

          {/* BULK PRICING */}
          <BulkPricingTiers />

          {/* COUPONS */}
          <AvailableCoupons />

          {/* SEASONAL OFFERS */}
          <SeasonalOffers />

          {/* TOP BRANDS */}
          <TopBrandsOnSale />

          {/* WHY BUY FROM AANZARA */}
          <WhyBuyFromAanzara />

          {/* NEWSLETTER */}
          <OffersNewsletter />
        </div>
      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <Footer />
    </div>
  );
}
