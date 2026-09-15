// File: app/components/Dashboard/BusinessBulkOrders.tsx
"use client";

import { FileText, Download } from "lucide-react";

/* ============================================================
   CONSTANTS
============================================================ */

const BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1749244768351-2726dc23d26c?auto=format&fit=crop&w=1600&q=80";

const TITLE = "Business Bulk Orders";

const DESCRIPTION =
  "Special pricing for retailers, commercial distributors, and institutional buyers. Get customs packing, flexible credit systems, and dedicated transport logic.";

/* ============================================================
   COMPONENT
============================================================ */

export default function BusinessBulkOrders() {
  const handleQuotation = () => {
    // Add quotation flow here.
    // Example:
    // router.push("/contact?type=quotation");
  };

  const handleDownloadPriceList = () => {
    // Add price-list download logic here.
    // Example:
    // window.open("/documents/price-list.pdf", "_blank");
  };

  return (
    <section
      aria-labelledby="business-bulk-orders-title"
      className="
        relative
        overflow-hidden
        rounded-card
      "
    >
      {/* ======================================================
          BACKGROUND IMAGE
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          bg-cover
          bg-center
        "
        style={{
          backgroundImage: `url(${BACKGROUND_IMAGE})`,
        }}
      />

      {/* ======================================================
          OVERLAY
      ====================================================== */}

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, #0B1E4Bd9 0%, #0B1E4Bc2 45%, #0B1E4Ba3 100%)",
        }}
      />

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          relative
          flex
          flex-col
          gap-5
          px-6
          py-8
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-9
        "
      >
        {/* ====================================================
            TEXT CONTENT
        ==================================================== */}

        <div className="min-w-0">
          <h2
            id="business-bulk-orders-title"
            className="
              font-sora
              text-[20px]
              font-bold
              leading-tight
              text-white
              sm:text-[22px]
            "
          >
            {TITLE}
          </h2>

          <p
            className="
              mt-2
              max-w-[420px]
              text-[13px]
              leading-relaxed
              text-white/75
            "
          >
            {DESCRIPTION}
          </p>
        </div>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div
          className="
            flex
            w-full
            shrink-0
            flex-col
            gap-2.5
            sm:w-auto
            sm:flex-row
            sm:items-center
          "
        >
          {/* REQUEST QUOTATION */}

          <button
            type="button"
            onClick={handleQuotation}
            aria-label="Request business bulk order quotation"
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-green
              px-5
              py-3
              text-[12.5px]
              font-bold
              text-white
              transition-colors
              hover:bg-green-deep
              focus:outline-none
              focus:ring-2
              focus:ring-green/40
              focus:ring-offset-2
              focus:ring-offset-navy
              sm:w-auto
            "
          >
            <FileText
              size={14}
              aria-hidden="true"
            />

            <span>
              Request Quotation
            </span>
          </button>

          {/* DOWNLOAD PRICE LIST */}

          <button
            type="button"
            onClick={handleDownloadPriceList}
            aria-label="Download business bulk order price list"
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-white
              px-5
              py-3
              text-[12.5px]
              font-bold
              text-ink
              transition-colors
              hover:bg-paper
              focus:outline-none
              focus:ring-2
              focus:ring-white/50
              focus:ring-offset-2
              focus:ring-offset-navy
              sm:w-auto
            "
          >
            <Download
              size={14}
              aria-hidden="true"
            />

            <span>
              Download Price List
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}