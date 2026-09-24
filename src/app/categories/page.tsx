"use client";

import { useState } from "react";

import AllCategoriesGrid from "../components/Categories/AllCategoriesGrid";
import BusinessCTA from "../components/Categories/BusinessCTA";
import CategoriesHero from "../components/Categories/CategoriesHero";
import CategoryBrandsGrid from "../components/Categories/CategoryBrandsGrid";
import CategoryFilterTabs from "../components/Categories/CategoryFilterTabs";
import WhyShopFromAanzara from "../components/Categories/WhyShopFromAanzara";

import FeatureStrip from "../components/Dashboard/FeatureStrip";
import NewsletterCentered from "../components/Dashboard/NewsletterCentered";
import TopBar from "../components/Dashboard/TopBar";

import Footer from "../components/Footer";
import Header from "../components/Header";
import MainNav from "../MainNav";

/* =========================================================
   PAGE CONFIGURATION
========================================================= */

const PAGE_MAX_WIDTH = 1360;

const CONTENT_GAP = 8;

/* =========================================================
   VALIDATION HELPERS
========================================================= */

/**
 * Validate navigation state.
 */
function isValidNavState(
  value: boolean
): boolean {
  return typeof value === "boolean";
}

/**
 * Safely return a valid navigation state.
 */
function getSafeNavState(
  value: boolean
): boolean {
  return isValidNavState(value)
    ? value
    : false;
}

/* =========================================================
   PAGE
========================================================= */

export default function AllCategoriesPage() {
  /* =======================================================
     CATEGORY FILTER STATE — lifted to page so tabs actually filter the grid
  ======================================================= */

  const [activeCategory, setActiveCategory] = useState<string>("All");

  /* =======================================================
     NAVIGATION STATE
  ======================================================= */

  const [navOpen, setNavOpen] =
    useState(false);

  /* =======================================================
     SAFE NAVIGATION STATE
  ======================================================= */

  const safeNavOpen =
    getSafeNavState(navOpen);

  /* =======================================================
     NAVIGATION HANDLERS
  ======================================================= */

  const handleOpenNavigation = () => {
    setNavOpen(true);
  };

  const handleCloseNavigation = () => {
    setNavOpen(false);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* =================================================
          STICKY TOP: TOPBAR + HEADER + MAIN NAV
      ================================================= */}

      <div className="sticky top-0 z-50">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <TopBar />

        {/* =================================================
            HEADER
        ================================================= */}

        <Header
          onMenuClick={
            handleOpenNavigation
          }
        />

        {/* =================================================
            MAIN NAVIGATION
        ================================================= */}

        <MainNav
          open={safeNavOpen}
          onClose={
            handleCloseNavigation
          }
        />
      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main
        id="main-content"
        className="mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-6 sm:px-6"
        style={{
          maxWidth: `${PAGE_MAX_WIDTH}px`,
        }}
      >
        {/* =================================================
            CATEGORIES HERO
        ================================================= */}

        <section
          aria-label="Categories introduction"
        >
          <CategoriesHero />
        </section>

        {/* =================================================
            CATEGORY FILTERS
        ================================================= */}

        <section aria-label="Category filters">
          <CategoryFilterTabs active={activeCategory} onChange={setActiveCategory} />
        </section>

        <section aria-label="All product categories">
          <AllCategoriesGrid activeCategory={activeCategory} />
        </section>

        {/* =================================================
            CATEGORY BRANDS
        ================================================= */}

        <section
          aria-label="Popular category brands"
        >
          <CategoryBrandsGrid />
        </section>

        {/* =================================================
            BUSINESS CTA
        ================================================= */}

        <section
          aria-label="Business shopping"
        >
          <BusinessCTA />
        </section>

        {/* =================================================
            FEATURE STRIP
        ================================================= */}

        <section
          aria-label="Aanzara features"
        >
          <FeatureStrip />
        </section>

        {/* =================================================
            WHY SHOP FROM AANZARA
        ================================================= */}

        <section
          aria-label="Why shop from Aanzara"
        >
          <WhyShopFromAanzara />
        </section>

        {/* =================================================
            NEWSLETTER
        ================================================= */}

        <section
          aria-label="Newsletter subscription"
        >
          <NewsletterCentered />
        </section>
      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />
    </div>
  );
}
