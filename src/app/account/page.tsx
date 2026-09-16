"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Bell,
  ShoppingCart,
  ChevronRight,
  Home,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type UserData = {
  name: string;
  email: string;
};

/* =========================================================
   PAGE
   NOTE: this is /account (the account root/dashboard route).
   AccountLayout (src/app/account/layout.tsx) already renders
   TopBar, Header, MainNav, AccountSidebar and Footer around
   this file — this page should only render the content that
   goes inside that shell, same as every other page under
   /account/*. It previously duplicated the entire shell
   (its own TopBar/Header/nav/sidebar/footer) inside itself,
   which is why the page rendered doubled. That duplicate
   markup has been removed; nothing about the route or file
   path has changed.
========================================================= */

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserData>({
    name: "Sam",
    email: "sam@example.com",
  });

  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {
    try {
      const profileData = localStorage.getItem("aanzara-profile");
      const userData = localStorage.getItem("user");

      let data: any = null;

      if (profileData) {
        data = JSON.parse(profileData);
      } else if (userData) {
        data = JSON.parse(userData);
      }

      if (data) {
        setUser({
          name: data.name || data.fullName || "Sam",
          email: data.email || "sam@example.com",
        });
      }
    } catch (error) {
      console.error("Unable to load user:", error);
    }
  }, []);

  const goTo = (path: string) => {
    router.push(path);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* BREADCRUMB */}

      <div className="flex flex-wrap items-center gap-2 text-[14px]">
        <button
          type="button"
          onClick={() => goTo("/")}
          className="flex items-center gap-2 text-[#1769F5] hover:underline"
        >
          <Home size={17} />
          Home
        </button>

        <ChevronRight size={15} className="text-[#8391A5]" />

        <strong className="text-[#10265B]">My Account</strong>
      </div>

      {/* TITLE */}

      <div className="mt-3">
        <h1 className="text-[32px] font-bold tracking-[-0.8px] text-[#10265B]">
          Welcome back, {user.name}
        </h1>

        <p className="mt-1 text-[16px] text-[#718096]">
          {user.email}
        </p>
      </div>

      {/* QUICK LINKS */}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => goTo("/account/wishlist")}
          className="flex items-center gap-4 rounded-[16px] border border-[#DDE6F0] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#FFF0F4] text-[#EF476F]">
            <Heart size={24} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#10265B]">Wishlist</p>
            <p className="mt-0.5 text-[13px] text-[#718096]">
              View saved products
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => goTo("/account/orders")}
          className="flex items-center gap-4 rounded-[16px] border border-[#DDE6F0] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#E5F8ED] text-[#16A34A]">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#10265B]">My Orders</p>
            <p className="mt-0.5 text-[13px] text-[#718096]">
              Track and view orders
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => goTo("/account/alerts")}
          className="flex items-center gap-4 rounded-[16px] border border-[#DDE6F0] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#F3E9FF] text-[#8B3DFF]">
            <Bell size={24} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#10265B]">Alerts</p>
            <p className="mt-0.5 text-[13px] text-[#718096]">
              Manage notifications
            </p>
          </div>
        </button>
      </div>
    </>
  );
}