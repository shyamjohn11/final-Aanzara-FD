"use client";

import { useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";
import Breadcrumb from "@/app/components/Dashboard/Breadcrumb";
import NewArrivalsTrustStrip from "@/app/components/NewArrivals/NewArrivalsTrustStrip";

import BusinessSolutionsHero from "@/app/components/BusinessSolutions/BusinessSolutionsHero";
import SolutionsGrid from "@/app/components/BusinessSolutions/SolutionsGrid";
import IndustriesGrid from "@/app/components/BusinessSolutions/IndustriesGrid";
import WhyChooseGrid from "@/app/components/BusinessSolutions/WhyChooseGrid";
import HowItWorksSteps from "@/app/components/BusinessSolutions/HowItWorksSteps";
import BusinessCTABanner from "@/app/components/BusinessSolutions/BusinessCTABanner";

export default function BusinessSolutionsPage() {
  const [navOpen, setNavOpen] = useState(false);

  /* =======================================================
     NAVIGATION HANDLERS
  ======================================================= */

  const handleOpenNav = () => {
    setNavOpen(true);
  };

  const handleCloseNav = () => {
    setNavOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* =================================================
          STICKY TOP: TOPBAR + HEADER + MAIN NAV
      ================================================= */}

      <div className="sticky top-0 z-50 bg-white">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <TopBar />

        {/* =================================================
            HEADER
        ================================================= */}

        <Header onMenuClick={handleOpenNav} />

        {/* =================================================
            MOBILE / MAIN NAV
        ================================================= */}

        <MainNav
          open={navOpen}
          onClose={handleCloseNav}
        />
      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-12 px-4 py-6 sm:px-6"
      >
        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <Breadcrumb
          trail={[
            {
              label: "Home",
              href: "/dashboard",
            },
            "Business Solutions",
          ]}
        />

        {/* =================================================
            HERO
        ================================================= */}

        <BusinessSolutionsHero />

        {/* =================================================
            BUSINESS SOLUTIONS
        ================================================= */}

        <SolutionsGrid />

        {/* =================================================
            INDUSTRIES
        ================================================= */}

        <IndustriesGrid />

        {/* =================================================
            WHY CHOOSE US
        ================================================= */}

        <WhyChooseGrid />

        {/* =================================================
            HOW IT WORKS
        ================================================= */}

        <HowItWorksSteps />

        {/* =================================================
            CTA
        ================================================= */}

        <BusinessCTABanner />
      </main>

      {/* =================================================
          TRUST STRIP
      ================================================= */}

      <NewArrivalsTrustStrip />

      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />
    </div>
  );
}
