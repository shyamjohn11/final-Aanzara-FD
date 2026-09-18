"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Breadcrumb from "@/app/components/Dashboard/Breadcrumb";
import ProductCard from "@/app/components/Dashboard/ProductCard";
import Footer from "@/app/components/Footer";

import { productsApi } from "@/app/api/services";
import { mapProductSummaries } from "@/app/api/productmap";
import { extractErrorMessage } from "@/app/api/api";
import type { Product } from "@/app/data/products";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("query") ?? "").trim();

  const [navOpen, setNavOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!query) {
        setResults([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await productsApi.list({
          search: query,
          page: 1,
          pageSize: 24,
        });
        if (!cancelled) {
          setResults(
            mapProductSummaries(
              (response as { data?: unknown })?.data ?? response
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            extractErrorMessage(err, "Unable to search products.")
          );
          setResults([]);
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
  }, [query]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50">
        <TopBar />
        <Header onMenuClick={() => setNavOpen(true)} />
        <MainNav
          open={navOpen}
          onClose={() => setNavOpen(false)}
        />
      </div>

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 py-6">
        <Breadcrumb
          trail={[{ label: "Home", href: "/" }, "Search"]}
        />

        <h1 className="mt-4 font-sora font-bold text-[19px] text-navy">
          {query
            ? `Results for “${query}”`
            : "Search products"}
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          {loading
            ? "Searching…"
            : error
              ? error
              : `${results.length} product${results.length === 1 ? "" : "s"} found`}
        </p>

        {!loading && !error && results.length === 0 && (
          <div className="mt-6 rounded-card border border-line bg-white p-8 text-center text-[12px] text-ink-soft">
            {query
              ? "No products matched your search. Try a different keyword."
              : "Type a keyword in the search box above to find products."}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-5 grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-4">
            {results.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[13px] text-ink-soft">
          Loading search…
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
