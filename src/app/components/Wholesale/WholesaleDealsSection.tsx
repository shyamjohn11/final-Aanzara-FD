"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { productsApi } from "@/app/api/services";
import {
  mapProductSummary,
  extractProductArray,
} from "@/app/api/productmap";
import type { NewArrivalProduct } from "@/app/data/newArrivals";
import WholesaleProductCard from "./WholesaleProductCard";

export default function WholesaleDealsSection() {
  /* ============================================================
     DEALS — freshest catalog items from the API
  ============================================================ */

  const [deals, setDeals] = useState<NewArrivalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDeals = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await productsApi.freshArrivals(5);
        const mapped = extractProductArray(response.data)
          .map(mapProductSummary)
          .filter(
            (product): product is NonNullable<typeof product> =>
              product !== null
          )
          .map(
            (product): NewArrivalProduct => ({
              ...product,
              moqUnit: "Units",
              tabCategory: "All Products",
              filterCategory: "All Categories",
            })
          );

        if (!cancelled) {
          setDeals(mapped);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load wholesale deals.");
          setDeals([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDeals();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="wholesale-deals" aria-labelledby="wholesale-deals-title">
      {/* =========================
          HEADER
      ========================= */}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <h2
            id="wholesale-deals-title"
            className="font-sora font-bold text-[19px] text-navy"
          >
            Wholesale Deals
          </h2>

          <span className="text-[10px] font-bold text-green-deep bg-green/10 px-2 py-1 rounded-md">
            Best bulk prices
          </span>
        </div>

        <Link
          href="/new-arrivals"
          className="flex items-center gap-1 text-[12px] font-semibold text-blue hover:underline"
        >
          View All Deals
          <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>

      {/* =========================
          DEAL PRODUCTS
      ========================= */}

      {loading ? (
        <div
          role="status"
          className="bg-white border border-line rounded-card py-10 text-center"
        >
          <p className="text-[12.5px] text-ink-soft">
            Loading wholesale deals…
          </p>
        </div>
      ) : error && deals.length === 0 ? (
        <div
          role="alert"
          className="bg-white border border-line rounded-card py-10 text-center"
        >
          <p className="text-[12.5px] text-ink-soft">
            {error}
          </p>
        </div>
      ) : deals.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {deals.map((product) => (
            <WholesaleProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-line rounded-card py-10 text-center">
          <p className="text-[12.5px] text-ink-soft">
            No wholesale deals available right now.
          </p>
        </div>
      )}
    </section>
  );
}
