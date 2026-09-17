// File: src/app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";

import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

import { CartProvider } from "./context/cartcontext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/wishlistcontext";
import { BrandProvider } from "./context/brandcontext";
import {
  ShoppingListProvider,
} from "./context/shoppinglistcontext";
import {
  SaveForLaterProvider,
} from "./context/saveforlatercontext";

import SessionSync from "./components/SessionSync";
import ToastProvider from "./components/ToastProvider";


/* ============================================================
   FONTS
============================================================ */

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

/* ============================================================
   METADATA
============================================================ */

export const metadata: Metadata = {
  title: "Aanzara | Wholesale FMCG Marketplace",

  description:
    "Verified enterprise rates, direct mill dispatch, bulk discounts and custom payment options on top-tier national brands.",

  applicationName: "Aanzara",

  keywords: [
    "Aanzara",
    "Wholesale",
    "FMCG",
    "Marketplace",
    "Retail",
    "Business",
    "Products",
  ],

  robots: {
    index: true,
    follow: true,
  },
};

/* ============================================================
   VIEWPORT
============================================================ */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

/* ============================================================
   ROOT LAYOUT
============================================================ */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={[
          sora.variable,
          inter.variable,
          "font-inter",
          "bg-paper",
          "text-ink",
          "antialiased",
        ].join(" ")}
      >
        {/* ==================================================
            SESSION SYNC — heals stale middleware guard cookies
            so /login renders instead of bouncing into the app
        ================================================== */}

        <SessionSync />

        {/* ==================================================
            AUTH PROVIDER
        ================================================== */}

        <AuthProvider>
          {/* ==================================================
              CART PROVIDER
          ================================================== */}
          <CartProvider>
            {/* ================================================
                WISHLIST PROVIDER
            ================================================= */}

            <WishlistProvider>
              {/* ==============================================
                  SHOPPING LIST PROVIDER
              =============================================== */}

              <ShoppingListProvider>
                {/* ============================================
                    SAVE FOR LATER PROVIDER
                ============================================= */}

                <SaveForLaterProvider>
                  {/* ==========================================
                      BRAND PROVIDER
                  =========================================== */}

                  <BrandProvider>
                    {children}
                    <ToastProvider />
                  </BrandProvider>
                </SaveForLaterProvider>
              </ShoppingListProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}