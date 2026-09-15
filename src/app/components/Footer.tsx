import Link from "next/link";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

const COLUMNS = [
  {
    title: "About Us",
    links: [
      { label: "Who we are", href: "/about" },
      { label: "Corporate Profile", href: "/corporate-profile" },
      { label: "Career Opportunities", href: "/careers" },
      { label: "Press Newsroom", href: "/press" },
      { label: "Contact Corporate", href: "/contact" },
    ],
  },
  {
    title: "Support Desk",
    links: [
      { label: "Help Support Center", href: "/help" },
      { label: "Delivery Areas covered", href: "/delivery-areas" },
      { label: "Returns Policy terms", href: "/returns-policy" },
      { label: "Become a Distributor", href: "/distributor" },
      { label: "API Integration", href: "/api-integration" },
    ],
  },
  {
    title: "Legal Center",
    links: [
      { label: "Terms and Conditions", href: "/terms" },
      { label: "Privacy Policies guard", href: "/privacy" },
      { label: "Tax and Billing rules", href: "/tax-billing" },
      { label: "Logistics agreements", href: "/logistics" },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "#",
    Icon: FaFacebookF,
  },
  {
    label: "Twitter",
    href: "#",
    Icon: FaTwitter,
  },
  {
    label: "LinkedIn",
    href: "#",
    Icon: FaLinkedinIn,
  },
  {
    label: "YouTube",
    href: "#",
    Icon: FaYoutube,
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#111827] text-white">
      {/* =========================
          MAIN FOOTER
      ========================= */}

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* =========================
              BRAND
          ========================= */}

          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-block text-2xl font-bold mb-3 hover:opacity-90 transition-opacity"
            >
              Aanzara
            </Link>

            <p className="text-[13px] leading-6 text-white/60 max-w-[420px]">
              The premium e-commerce marketplace for physical store
              retailers, commercial restaurant chains, hotels, and
              corporate cafeterias. Reliable high-quality FMCG direct
              manufacturer supply pipelines.
            </p>

            {/* SOCIAL LINKS */}

            <div className="flex items-center gap-3 mt-6">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={`Aanzara on ${label}`}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Icon size={15} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* =========================
              FOOTER COLUMNS
          ========================= */}

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="text-[13.5px] font-bold text-white mb-3">
                {column.title}
              </h2>

              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[12.5px] text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* =========================
              CONNECT DIRECTLY
          ========================= */}

          <div>
            <h2 className="text-[13.5px] font-bold text-white mb-3">
              Connect Directly
            </h2>

            <ul className="flex flex-col gap-2.5 text-[12.5px] text-white/60">
              <li>
                <a
                  href="mailto:gst@aanzara.com"
                  className="hover:text-white transition-colors"
                >
                  GST Desk: gst@aanzara.com
                </a>
              </li>

              <li>
                <a
                  href="mailto:partner@aanzara.com"
                  className="hover:text-white transition-colors"
                >
                  Seller Desk: partner@aanzara.com
                </a>
              </li>

              <li>
                <a
                  href="tel:1800AANZARA"
                  className="text-green-400 font-semibold hover:text-green-300 transition-colors"
                >
                  B2B Call Support: 1-800-AANZARA
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* =========================
          BOTTOM FOOTER
      ========================= */}

      <div className="border-t border-white/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11.5px] text-white/50">
          <span>
            © {new Date().getFullYear()} Aanzara Wholesale Ltd. All rights
            reserved.
          </span>

          <div className="flex items-center gap-5 flex-wrap justify-center">
            <Link
              href="/security"
              className="hover:text-white transition-colors"
            >
              Security Architecture
            </Link>

            <Link
              href="/cookie-settings"
              className="hover:text-white transition-colors"
            >
              Cookie Settings
            </Link>

            <Link
              href="/trust"
              className="hover:text-white transition-colors"
            >
              Trust Operations
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}