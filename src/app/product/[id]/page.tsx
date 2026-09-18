"use client";

import { use, useEffect, useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Breadcrumb from "@/app/components/Dashboard/Breadcrumb";

import ProductGallery from "@/app/components/Dashboard/ProductGallery";
import ProductInfoPanel from "@/app/components/Dashboard/ProductInfoPanel";
import ProductTabs from "@/app/components/Dashboard/ProductTabs";
import EnterpriseInfo from "@/app/components/Dashboard/EnterpriseInfo";
import ReviewsSection from "@/app/components/Dashboard/ReviewsSection";
import FrequentlyBoughtTogether from "@/app/components/Dashboard/FrequentlyBoughtTogether";
import RelatedProducts from "@/app/components/Dashboard/RelatedProducts";
import RecentlyViewedProducts from "@/app/components/Dashboard/RecentlyViewedProducts";
import WhyChooseAanzara from "@/app/components/Dashboard/WhyChooseAanzara";
import FAQAccordion from "@/app/components/Dashboard/FAQAccordion";
import NewsletterCentered from "@/app/components/Dashboard/NewsletterCentered";

import Footer from "@/app/components/Footer";

import { productsApi, productImagesApi } from "@/app/api/services";
import { mapProductSummary } from "@/app/api/productmap";
import { extractErrorMessage } from "@/app/api/api";
import type { Product } from "@/app/data/products";

function extractImageUrls(payload: unknown): string[] {
  const arr = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as Record<string, unknown>)?.items)
      ? ((payload as Record<string, unknown>).items as unknown[])
      : [];
  const urls: string[] = [];

  // productImagesApi.list may return image objects or plain URL strings.
  for (const entry of arr) {
    if (typeof entry === "string" && entry.trim().length > 0) {
      urls.push(entry.trim());
      continue;
    }
    if (entry && typeof entry === "object") {
      const raw = entry as Record<string, unknown>;
      const url =
        typeof raw.imageUrl === "string" && raw.imageUrl.trim()
          ? raw.imageUrl.trim()
          : typeof raw.url === "string" && raw.url.trim()
            ? raw.url.trim()
            : typeof raw.filePath === "string" && raw.filePath.trim()
              ? raw.filePath.trim()
              : "";
      if (url) {
        urls.push(url);
      }
    }
  }

  return urls;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: productId } = use(params);

  const [navOpen, setNavOpen] = useState(false);
  const [liveProduct, setLiveProduct] = useState<Product | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const id = String(productId ?? "").trim();
      if (!id) {
        setError("Product not found.");
        setLiveProduct(null);
        setGalleryImages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await productsApi.details(id);
        const mapped = mapProductSummary(
          (response as { data?: unknown })?.data ?? response
        );

        if (!mapped) {
          if (!cancelled) {
            setError("Product not found.");
            setLiveProduct(null);
            setGalleryImages([]);
          }
          return;
        }

        if (!cancelled) {
          setLiveProduct(mapped);
        }

        try {
          const imagesResponse = await productImagesApi.list(
            mapped.id
          );
          const urls = extractImageUrls(
            (imagesResponse as { data?: unknown })?.data ??
              imagesResponse
          );
          if (!cancelled) {
            setGalleryImages(
              urls.length > 0
                ? urls
                : mapped.image
                  ? [mapped.image]
                  : []
            );
          }
        } catch {
          if (!cancelled) {
            setGalleryImages(mapped.image ? [mapped.image] : []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            extractErrorMessage(err, "Unable to load product details.")
          );
          setLiveProduct(null);
          setGalleryImages([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const productName =
    liveProduct?.name?.trim() || "Product Details";

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <TopBar />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <Header
        onMenuClick={() => setNavOpen(true)}
      />

      {/* =====================================================
          MAIN NAVIGATION
      ====================================================== */}

      <MainNav
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 py-6">

        {/* ===================================================
            BREADCRUMB
        ==================================================== */}

        <Breadcrumb
          trail={[
            {
              label: "Home",
              href: "/",
            },
            {
              label: "Products",
              href: "/categories",
            },
            productName,
          ]}
        />

        {loading && (
          <div
            role="status"
            className="mt-4 bg-white border border-line rounded-card p-4 text-[12px] text-ink-soft"
          >
            Loading product details…
          </div>
        )}

        {error && !loading && (
          <div
            role="alert"
            className="mt-4 bg-white border border-line rounded-card p-4 text-[12px] text-ink-soft"
          >
            {error}
          </div>
        )}

        {/* ===================================================
            PRODUCT MAIN SECTION
        ==================================================== */}

        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-8 mt-6">

          {/* PRODUCT GALLERY */}

          <ProductGallery
            images={galleryImages}
            count={galleryImages.length}
          />

          {/* PRODUCT INFORMATION */}

          <ProductInfoPanel product={liveProduct} />

        </section>

        {/* ===================================================
            PRODUCT INFORMATION TABS
        ==================================================== */}

        <section className="mt-6">
          <ProductTabs />
        </section>

        {/* ===================================================
            ENTERPRISE INFORMATION
        ==================================================== */}

        <section className="mt-6">
          <EnterpriseInfo />
        </section>

        {/* ===================================================
            REVIEWS
        ==================================================== */}

        <section className="mt-6">
          <ReviewsSection />
        </section>

        {/* ===================================================
            FREQUENTLY BOUGHT TOGETHER
        ==================================================== */}

        <section className="mt-6">
          <FrequentlyBoughtTogether />
        </section>

        {/* ===================================================
            RELATED PRODUCTS
        ==================================================== */}

        <section className="mt-6">
          <RelatedProducts />
        </section>

        {/* ===================================================
            RECENTLY VIEWED
        ==================================================== */}

        <section className="mt-6">
          <RecentlyViewedProducts />
        </section>

        {/* ===================================================
            WHY CHOOSE AANZARA
        ==================================================== */}

        <section className="mt-6">
          <WhyChooseAanzara />
        </section>

        {/* ===================================================
            FAQ
        ==================================================== */}

        <section className="mt-6">
          <FAQAccordion />
        </section>

        {/* ===================================================
            NEWSLETTER
        ==================================================== */}

        <section className="mt-6">
          <NewsletterCentered />
        </section>

      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <Footer />
    </div>
  );
}
