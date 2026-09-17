"use client";

import { useEffect, useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";

import NearbyHero from "@/app/components/NearbyDiscounts/NearbyHero";
import DiscountCategoryTabs from "@/app/components/NearbyDiscounts/DiscountCategoryTabs";
import DiscountFilterBar from "@/app/components/NearbyDiscounts/DiscountFilterBar";
import StoreDiscountsResults from "@/app/components/NearbyDiscounts/StoreDiscountsResults";
import DealsSection from "@/app/components/NearbyDiscounts/DealsSection";
import HowAanzaraWorks from "@/app/components/NearbyDiscounts/HowAanzaraWorks";
import StoreOwnerCTA from "@/app/components/NearbyDiscounts/StoreOwnerCTA";
import TrustGuarantees from "@/app/components/NearbyDiscounts/TrustGuarantees";
import LocalFlashNewsletter from "@/app/components/NearbyDiscounts/LocalFlashNewsletter";

import type { DealCardData } from "@/app/data/nearbyDiscounts";
import { storeOffersApi } from "@/app/api/services";

const DEAL_IMAGES = [
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80",
];

function mapOfferToDeal(
  raw: Record<string, unknown>,
  index: number,
  tag: string,
  tagColor: string,
): DealCardData {
  const id = String(
    raw.offerId ?? raw.id ?? `deal-${index}`
  ).trim();
  const store = String(
    raw.storeName ?? raw.store ?? "Partner Store"
  ).trim();
  const title = String(
    raw.title ?? raw.name ?? "Store Offer"
  ).trim();
  return {
    id,
    store,
    title,
    tag,
    tagColor,
    meta: String(
      raw.validTo ?? raw.validity ?? "Limited period"
    ).trim(),
    image:
      typeof raw.imageUrl === "string" &&
      raw.imageUrl.trim().length > 0
        ? raw.imageUrl.trim()
        : DEAL_IMAGES[index % DEAL_IMAGES.length],
  };
}

function unwrapItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (payload && typeof payload === "object") {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.items)) {
      return rec.items as Record<string, unknown>[];
    }
    if (Array.isArray(rec.data)) {
      return rec.data as Record<string, unknown>[];
    }
  }
  return [];
}

export default function NearbyDiscountsPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [endingSoon, setEndingSoon] = useState<DealCardData[]>([]);
  const [highestDiscount, setHighestDiscount] = useState<DealCardData[]>([]);
  const [freshlyAdded, setFreshlyAdded] = useState<DealCardData[]>([]);

  useEffect(() => {
    let cancelled = false;

    storeOffersApi
      .list(1, 12)
      .then((response) => {
        if (cancelled) {
          return;
        }

        const payload: unknown =
          (response as { data?: unknown })?.data ??
          response;
        const rows = unwrapItems(payload);

        setEndingSoon(
          rows
            .slice(0, 4)
            .map((row, i) =>
              mapOfferToDeal(row, i, "ENDING SOON", "#D63A6B")
            )
        );
        setHighestDiscount(
          rows
            .slice(4, 8)
            .map((row, i) =>
              mapOfferToDeal(row, i + 4, "HIGH DISCOUNT", "#1E7A3C")
            )
        );
        setFreshlyAdded(
          rows
            .slice(8, 12)
            .map((row, i) =>
              mapOfferToDeal(row, i + 8, "JUST ADDED", "#2448C4")
            )
        );
      })
      .catch(() => {
        // Sections render their empty states on failure.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9FC]">
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
        <Header
          onMenuClick={() => setNavOpen(true)}
        />

        {/* =====================================================
            MAIN NAVIGATION
        ====================================================== */}
        <MainNav
          open={navOpen}
          onClose={() => setNavOpen(false)}
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
          <NearbyHero />

          {/* FILTER AREA */}
          <section
            aria-label="Discount filters"
            className="flex flex-col gap-4"
          >
            <DiscountCategoryTabs />
            <DiscountFilterBar />
          </section>

          {/* STORE RESULTS */}
          <StoreDiscountsResults />

          {/* =================================================
              DEAL SECTIONS
          ================================================== */}

          <DealsSection
            title="Ending Soon"
            deals={endingSoon}
          />

          <DealsSection
            title="Highest Discount Rates"
            deals={highestDiscount}
          />

          <DealsSection
            title="Freshly Added Deals"
            deals={freshlyAdded}
          />

          {/* =================================================
              HOW AANZARA WORKS
          ================================================== */}

          <HowAanzaraWorks />

          {/* =================================================
              STORE OWNER CTA
          ================================================== */}

          <StoreOwnerCTA />

          {/* =================================================
              TRUST
          ================================================== */}

          <TrustGuarantees />

          {/* =================================================
              NEWSLETTER
          ================================================== */}

          <LocalFlashNewsletter />
        </div>
      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <Footer />
    </div>
  );
}
