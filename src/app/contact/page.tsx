// File: src/app/contact/page.tsx

"use client";

import { Suspense, useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";

import ContactHero from "@/app/components/Contact/ContactHero";
import ContactQuickInfoGrid from "@/app/components/Contact/ContactQuickInfoGrid";
import ContactForm from "@/app/components/Contact/ContactForm";
import HelpTopicsList from "@/app/components/Contact/HelpTopicsList";
import ContactMapSection from "@/app/components/Contact/ContactMapSection";

export default function ContactPage() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* STICKY TOP: TOPBAR + HEADER + MAIN NAV */}
      <div className="sticky top-0 z-50 bg-white">
        {/* TOP BAR */}
        <TopBar />

        {/* HEADER */}
        <Header onMenuClick={() => setNavOpen(true)} />

        {/* MOBILE / MAIN NAV */}
        <MainNav open={navOpen} onClose={() => setNavOpen(false)} />
      </div>

      {/* HERO */}
      <ContactHero />

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* QUICK CONTACT INFORMATION */}
        <ContactQuickInfoGrid />

        {/* CONTACT FORM + HELP TOPICS */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* ✅ Suspense is required for useSearchParams() in ContactForm */}
          <Suspense
            fallback={
              <div className="bg-white border border-line rounded-card p-5 sm:p-6">
                <div className="text-[13px] text-ink-soft">
                  Loading form…
                </div>
              </div>
            }
          >
            <ContactForm />
          </Suspense>

          <HelpTopicsList />
        </div>

        {/* MAP */}
        <ContactMapSection />
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
