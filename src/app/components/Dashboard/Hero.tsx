// File: app/components/Dashboard/Hero.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneCall, Grid2x2, MapPin } from "lucide-react";


const FALLBACK_SLIDES: { image: string; link: string; title?: string }[] = [
  {
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=80",
    link: "/offers",
  },
  {
    image: "https://images.unsplash.com/photo-1749244768351-2726dc23d26c?auto=format&fit=crop&w=1600&q=80",
    link: "/categories",
  },
  { image: "/Images/Hero.jpeg", link: "/categories" },
  {
    image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1600&q=80",
    link: "/offers",
  },
];

const SLIDE_INTERVAL = 5000;
import DeliveryLocationModal, {
  type DeliveryAddress,
} from "./DeliveryLocationModal";
import RunningStrip from "./RunningStrip";

type LiveSlide = { image: string; link: string; title: string; subtitle: string };

/* ============================================================
   VIDEO SOURCE
   Place the video file in your project's /public folder
   (e.g. public/videos/hero.mp4) and update the path below
   if you name it differently.
============================================================ */

const HERO_VIDEO_SRC = "/videos/aanzara-hero.mp4";
const HERO_POSTER_SRC = "/Images/Hero.jpeg"; // shown while the video loads

/* ============================================================
   COMPONENT
============================================================ */

export default function Hero() {

  /* ==========================================================
     DELIVERY LOCATION
  ========================================================== */

  const [isLocationModalOpen, setIsLocationModalOpen] =
    useState(false);

  const [deliveryAddress, setDeliveryAddress] =
    useState<DeliveryAddress>({
      line1: "Valiyoor",
      city: "Tirunelveli",
      state: "Tamil Nadu",
      pincode: "627117",
    });

  return (
    <>
    <div className="mb-4">
      <RunningStrip />
    </div>

    <section
      aria-label="Aanzara wholesale marketplace hero"
      className="
        relative
        min-h-[480px]
        overflow-hidden
        rounded-card
        sm:h-[420px]
      "
    >
      {/* ======================================================
          BACKGROUND VIDEO
      ====================================================== */}

      <video
        className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
        "
        src={HERO_VIDEO_SRC}
        poster={HERO_POSTER_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* ======================================================
          DARK OVERLAY (keeps the text readable over the video)
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-r
          from-black/55
          via-black/20
          via-35%
          to-transparent
          to-60%
        "
      />

      {/* ======================================================
          HERO CONTENT
      ====================================================== */}

      <div
        className="
          relative
          flex
          h-full
          items-center
          px-6
          py-10
          sm:px-10
          sm:py-8
        "
      >
        <div
          className="
            az-fade-up
            flex
            max-w-[600px]
            flex-col
            rounded-2xl
            border
            border-white/20
            bg-white/10
            px-6
            py-6
            shadow-[0_8px_32px_rgba(0,0,0,0.25)]
            backdrop-blur-md
            sm:px-8
            sm:py-8
          "
        >
          {/* BADGE */}

          <span
            className="
              mb-4
              inline-flex
              w-fit
              items-center
              gap-1.5
              rounded-pill
              bg-black/40
              px-3
              py-1.5
              text-[10.5px]
              font-bold
              tracking-wide
              text-white
              backdrop-blur-sm
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            <span>B2B & D2C Wholesale Marketplace</span>
          </span>

          {/* TITLE */}

          <h1
            className="
              font-sora
              text-[28px]
              font-extrabold
              leading-[1.12]
              text-white
              sm:text-[38px]
            "
          >
            Your Complete FMCG Supply Partner
          </h1>

          {/* DESCRIPTION */}

          <p
            className="
              mt-3
              max-w-[460px]
              text-[13.5px]
              leading-relaxed
              text-white/75
              sm:text-[14.5px]
            "
          >
            Direct manufacturer sourcing, unified B2B
            bulk ordering, and reliable door-step
            logistics. Empowering retail stores,
            restaurants, and corporate environments.
          </p>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div
            className="
              mt-6
              flex
              flex-wrap
              items-center
              gap-3
            "
          >
            {/* BULK ENQUIRY */}

            <Link
              href="/contact"
              aria-label="Go to contact page for bulk enquiry"
              className="
                flex
                items-center
                gap-2
                rounded-pill
                bg-green
                px-6
                py-3.5
                text-[13px]
                font-bold
                text-white
                shadow-pop
                transition-all
                hover:bg-green-deep
                hover:-translate-y-0.5
                focus:outline-none
                focus:ring-2
                focus:ring-green/40
                focus:ring-offset-2
                focus:ring-offset-navy
              "
            >
              <PhoneCall
                size={14}
                aria-hidden="true"
              />
              Bulk Enquiry
            </Link>

            {/* EXPLORE CATEGORIES */}

            <Link
              href="/categories"
              aria-label="Explore product categories"
              className="
                glass-navy
                flex
                items-center
                gap-2
                rounded-pill
                px-6
                py-3.5
                text-[13px]
                font-bold
                text-white
                transition-all
                hover:bg-white/10
                focus:outline-none
                focus:ring-2
                focus:ring-white/50
                focus:ring-offset-2
                focus:ring-offset-navy
              "
            >
              <Grid2x2
                size={14}
                aria-hidden="true"
              />
              Explore Categories
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================
          DELIVERY LOCATION — circular button, bottom-right
      ====================================================== */}

      <button
        type="button"
        onClick={() => setIsLocationModalOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isLocationModalOpen}
        aria-label={`Delivering to ${deliveryAddress.city}, ${deliveryAddress.state}. Change delivery location`}
        title={`Delivering to ${deliveryAddress.line1}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.pincode}`}
        className="
          absolute
          bottom-4
          right-4
          z-10
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          bg-green
          text-white
          shadow-pop
          transition-all
          hover:bg-green-deep
          hover:scale-105
          focus:outline-none
          focus:ring-2
          focus:ring-green/50
          focus:ring-offset-2
          focus:ring-offset-transparent
        "
      >
        <MapPin size={17} aria-hidden="true" />
      </button>

      {/* ======================================================
          DELIVERY LOCATION MODAL
      ====================================================== */}

      <DeliveryLocationModal
        open={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        address={deliveryAddress}
        onSave={setDeliveryAddress}
      />
    </section>
    </>
  );
}
