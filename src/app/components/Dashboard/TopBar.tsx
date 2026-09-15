// File: app/components/Dashboard/TopBar.tsx
"use client";

import { Phone, FileText } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-navy text-white">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-9 flex items-center justify-between text-[12px]">
        <div className="hidden sm:flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <Phone size={13} />
            Toll Free: 1800-309-8080
          </span>

          <span className="flex items-center gap-1.5">
            <FileText size={13} />
            GST Compliant Invoicing
          </span>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <button className="hover:text-white/80 transition-colors whitespace-nowrap">
            Track Wholesale Order
          </button>

          <span className="w-px h-3 bg-white/25 hidden sm:block" />

          <button className="hover:text-white/80 transition-colors whitespace-nowrap">
            Enterprise Support
          </button>
        </div>
      </div>
    </div>
  );
}