// File: app/components/Business/BusinessCTA.tsx
"use client";

import Link from "next/link";
import {
  FileText,
  UserPlus,
} from "lucide-react";

export default function BusinessCTA() {
  // =====================================================
  // CTA CONFIGURATION
  // =====================================================

  const QUOTE_URL = "/contact?type=business-quote";
  const REGISTER_URL = "/register?type=business";

  // =====================================================
  // URL VALIDATION
  // =====================================================

  const isValidUrl = (url: string) => {
    return (
      typeof url === "string" &&
      url.trim().length > 0 &&
      url.startsWith("/")
    );
  };

  const validQuoteUrl = isValidUrl(
    QUOTE_URL
  )
    ? QUOTE_URL
    : "/contact";

  const validRegisterUrl = isValidUrl(
    REGISTER_URL
  )
    ? REGISTER_URL
    : "/register";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section
      aria-labelledby="business-cta-title"
      className="
        bg-navy
        rounded-card
        flex
        flex-col
        sm:flex-row
        sm:items-center
        justify-between
        gap-5
        px-6
        sm:px-9
        py-7
      "
    >
      {/* =================================================
          CONTENT
      ================================================== */}

      <div>
        <h2
          id="business-cta-title"
          className="
            font-sora
            font-bold
            text-[19px]
            sm:text-[21px]
            text-white
          "
        >
          Buying for your business?
        </h2>

        <p className="text-[12.5px] text-white/70 mt-1.5 max-w-[440px] leading-relaxed">
          Get special pricing slabs, dedicated delivery slots, flexible
          credit facilities, and instant GST invoices for retailers,
          hotels, restaurants, corporate offices, and distributors.
        </p>
      </div>

      {/* =================================================
          CTA BUTTONS
      ================================================== */}

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">

        {/* -----------------------------------------------
            BUSINESS QUOTE
        ------------------------------------------------ */}

        {validQuoteUrl ? (
          <Link
            href={validQuoteUrl}
            aria-label="Request a business quote"
            className="
              flex
              items-center
              gap-2
              bg-white
              hover:bg-paper
              transition-colors
              text-navy
              text-[12.5px]
              font-bold
              px-5
              py-3
              rounded-lg
            "
          >
            <FileText
              size={14}
              aria-hidden="true"
            />

            Request Business Quote
          </Link>
        ) : null}

        {/* -----------------------------------------------
            REGISTER BUSINESS ACCOUNT
        ------------------------------------------------ */}

        {validRegisterUrl ? (
          <Link
            href={validRegisterUrl}
            aria-label="Register a business account"
            className="
              flex
              items-center
              gap-2
              border
              border-white/30
              hover:bg-white/10
              transition-colors
              text-white
              text-[12.5px]
              font-bold
              px-5
              py-3
              rounded-lg
            "
          >
            <UserPlus
              size={14}
              aria-hidden="true"
            />

            Register Business Account
          </Link>
        ) : null}

      </div>
    </section>
  );
}