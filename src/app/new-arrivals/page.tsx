"use client";

import { useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";

import NewArrivalsHero from "@/app/components/NewArrivals/NewArrivalsHero";
import NewArrivalsFeatureStrip from "@/app/components/NewArrivals/NewArrivalsFeatureStrip";
import NewArrivalsPageHeader from "@/app/components/NewArrivals/NewArrivalsPageHeader";
import NewArrivalsResults from "@/app/components/NewArrivals/NewArrivalsResults";
import NewArrivalsPerksStrip from "@/app/components/NewArrivals/NewArrivalsPerksStrip";
import NewArrivalsNewsletter from "@/app/components/NewArrivals/NewArrivalsNewsletter";
import NewArrivalsTrustStrip from "@/app/components/NewArrivals/NewArrivalsTrustStrip";

export default function NewArrivalsPage() {
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
            py-6
            sm:px-6
          "
        >
          {/* HERO */}
          <NewArrivalsHero />

          {/* FEATURE STRIP */}
          <NewArrivalsFeatureStrip />

          {/* PAGE HEADER / FILTERS */}
          <NewArrivalsPageHeader />

          {/* PRODUCTS */}
          <NewArrivalsResults />

          {/* PERKS */}
          <NewArrivalsPerksStrip />

          {/* NEWSLETTER */}
          <NewArrivalsNewsletter />
        </div>
      </main>

      {/* =====================================================
          TRUST STRIP
      ====================================================== */}
      <NewArrivalsTrustStrip />

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <Footer />
    </div>
  );
}