"use client";

import { useState } from "react";
import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import UserLocation from "@/app/components/Dashboard/UserLocation";
import Hero from "@/app/components/Dashboard/Hero";
import ShopByCategory from "@/app/components/Dashboard/ShopByCategory";
import PopularBrands from "@/app/components/Dashboard/PopularBrands";
import PopularProducts from "@/app/components/Dashboard/PopularProducts";
import BusinessBulkOrders from "@/app/components/Dashboard/BusinessBulkOrders";
import IndustrySolutions from "@/app/components/Dashboard/IndustrySolutions";
import Testimonials from "@/app/components/Dashboard/Testimonials";
import NewsletterCentered from "@/app/components/Dashboard/NewsletterCentered";
import Footer from "@/app/components/Footer";

export default function DashboardPage() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">

      <div className="sticky top-0 z-50">
        <TopBar />

        <Header onMenuClick={() => setNavOpen(true)} />

        <MainNav
          open={navOpen}
          onClose={() => setNavOpen(false)}
        />
      </div>

      <UserLocation />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-10">
        <Hero />
        <ShopByCategory />
        <PopularBrands />
        <PopularProducts />
        <BusinessBulkOrders />
        <IndustrySolutions />
        <Testimonials />
        <NewsletterCentered />
      </main>

      <Footer />
    </div>
  );
}
