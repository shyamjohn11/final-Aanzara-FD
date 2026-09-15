"use client";

import { useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";

import AlertsPageContent from "@/app/components/Alerts/AlertsPage";

export default function AlertsRoute() {
  const [navOpen, setNavOpen] = useState(false);

  const handleOpenMenu = () => {
    setNavOpen(true);
  };

  const handleCloseMenu = () => {
    setNavOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB]">

      {/* TOP BAR */}
      <TopBar />

      {/* HEADER */}
      <Header
        onMenuClick={handleOpenMenu}
      />

      {/* MAIN NAVIGATION */}
      <MainNav
        open={navOpen}
        onClose={handleCloseMenu}
      />

      {/* ALERTS CONTENT */}
      <main
        className="flex-1 w-full bg-[#F6F8FB]"
        aria-label="Alerts page"
      >
        <AlertsPageContent />
      </main>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}