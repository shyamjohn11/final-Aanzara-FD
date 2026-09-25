"use client";

import { useState } from "react";
import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";

export default function DashboardChrome() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50">
      <TopBar />

      <Header onMenuClick={() => setNavOpen(true)} />

      <MainNav open={navOpen} onClose={() => setNavOpen(false)} />
    </div>
  );
}
