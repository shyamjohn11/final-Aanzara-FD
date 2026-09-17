"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";
import AccountSidebar from "@/app/components/AccountSidebar";

/* =========================================================
   ACCOUNT LAYOUT
   Wraps every page under /account/*.
   Next.js keeps this tree mounted across navigations within
   the segment — only {children} swaps when a sidebar tab
   is clicked. TopBar, Header, MainNav, AccountSidebar, and
   Footer never unmount, so there's no full-page reload feel.
========================================================= */

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [navOpen, setNavOpen] = useState(false);

  const [profileName, setProfileName] = useState("Sam");
  const [profileEmail, setProfileEmail] = useState(
    "sam@example.com"
  );

  /* =====================================================
     LOAD PROFILE (once, shared by every account page)

     "aanzara_user" is the canonical key the login flow and
     Header.tsx both read/write. "aanzara-profile" / "user"
     were an older, separate key pair that never got updated
     on login, which is why this sidebar used to show a stale
     "Sam" placeholder instead of the signed-in user's name —
     they're kept below only as a fallback for any account
     that still has data saved under the old keys.
  ====================================================== */

  useEffect(() => {
    try {
      const canonicalUser =
        localStorage.getItem("aanzara_user");
      const savedProfile =
        localStorage.getItem("aanzara-profile");
      const savedUser = localStorage.getItem("user");

      const profile = canonicalUser
        ? JSON.parse(canonicalUser)
        : savedProfile
          ? JSON.parse(savedProfile)
          : savedUser
            ? JSON.parse(savedUser)
            : null;

      if (profile && typeof profile === "object") {
        const name =
          typeof profile.name === "string"
            ? profile.name.trim()
            : typeof profile.fullName === "string"
              ? profile.fullName.trim()
              : "";

        const email =
          typeof profile.email === "string"
            ? profile.email.trim()
            : "";

        if (name) setProfileName(name);
        if (email) setProfileEmail(email);
      }
    } catch (err) {
      console.error("Unable to load profile:", err);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="sticky top-0 z-50">
        <TopBar />

        <Header onMenuClick={() => setNavOpen(true)} />

        <MainNav open={navOpen} onClose={() => setNavOpen(false)} />
      </div>

      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <AccountSidebar
            currentPath={pathname}
            profileName={profileName}
            profileEmail={profileEmail}
          />

          {/* Only this part changes when a tab is clicked */}
          <section className="min-w-0 flex-1">{children}</section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
