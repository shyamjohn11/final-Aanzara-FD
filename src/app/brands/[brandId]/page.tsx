"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ShoppingCart, Heart, Package, Search } from "lucide-react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";
import { productsApi, storefrontBrandsApi } from "@/app/api/services";
import { mapProductSummaries } from "@/app/api/productmap";
import { extractErrorMessage } from "@/app/api/api";
import type { Product } from "@/app/data/products";
import ProductCard from "@/app/components/Dashboard/ProductCard";
import { toast } from "react-toastify";

type BrandInfo = {
  brandId: string;
  brandName: string;
  imageUrl?: string;
};

function isGuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export default function BrandProductsPage() {
  const params = useParams();
  const rawId = String((params as Record<string, string | string[]>)?.brandId ?? "");
  const brandId = decodeURIComponent(rawId || "");
  const router = useRouter();

  const [navOpen, setNavOpen] = useState(false);
  const [brand, setBrand] = useState<BrandInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Load brand info + products
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // 1) Resolve brandId -> brandName/imageUrl via storefront list
        let resolvedId = brandId;
        let brandName = brandId;
        let imageUrl: string | undefined;

        if (!isGuid(brandId)) {
          // Search by name to get real GUID for product filter
          try {
            const res: any = await storefrontBrandsApi.list({ search: brandId, count: 5 });
            const payload: any = res?.data ?? res;
            const items: any[] = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.items)
                ? payload.items
                : [];
            const match = items.find(
              (r: any) =>
                String(r.brandName ?? r.name ?? "").toLowerCase() === brandId.toLowerCase()
            );
            if (match) {
              resolvedId = String(match.brandId ?? match.id ?? brandId);
              brandName = String(match.brandName ?? match.name ?? brandId);
              imageUrl = String(match.imageUrl ?? "") || undefined;
            }
          } catch {}
        } else {
          // GUID: fetch brand name for header
          try {
            const res: any = await storefrontBrandsApi.list({ count: 100 });
            const payload: any = res?.data ?? res;
            const items: any[] = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.items)
                ? payload.items
                : [];
            const match = items.find((r: any) => String(r.brandId ?? r.id ?? "") === brandId);
            if (match) {
              brandName = String(match.brandName ?? match.name ?? brandId);
              imageUrl = String(match.imageUrl ?? "") || undefined;
            }
          } catch {}
        }

        if (!cancelled) {
          setBrand({ brandId: resolvedId, brandName, imageUrl });
        }

        // 2) Products for brand (public, works for guests) — filtered by brandId if GUID
        const filterId = isGuid(resolvedId) ? resolvedId : brandId;
        // Try brandId filter first, fallback to search if not GUID
        let prodPayload: unknown;
        if (isGuid(filterId)) {
          const res: any = await productsApi.list({ brandId: filterId, page: 1, pageSize: 50 });
          prodPayload = res?.data ?? res;
        } else {
          const res: any = await productsApi.list({ search: filterId, page: 1, pageSize: 50 });
          prodPayload = res?.data ?? res;
        }

        const mapped = mapProductSummaries(prodPayload);
        // Client search by product name
        const filtered = search.trim()
          ? mapped.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
          : mapped;

        if (!cancelled) {
          setProducts(filtered);
        }
      } catch (err) {
        if (!cancelled) {
          setError(extractErrorMessage(err, "Unable to load brand products."));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [brandId, search]);

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <div className="sticky top-0 z-50">
        <TopBar />
        <Header onMenuClick={() => setNavOpen(true)} />
        <MainNav open={navOpen} onClose={() => setNavOpen(false)} />
      </div>

      <main className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.push("/brands")}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft hover:text-navy"
        >
          <ArrowLeft size={14} /> Back to Brands
        </button>

        {/* Brand Header */}
        <section className="flex items-center gap-4 rounded-xl border border-line bg-white p-5">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
            {brand?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.imageUrl} alt={brand.brandName} className="h-full w-full object-contain" />
            ) : (
              <Package size={24} className="text-ink-faint" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[18px] font-bold text-ink">{brand?.brandName || "Brand"}</h1>
            <p className="text-[11px] text-ink-soft">
              {loading ? "Loading products…" : `${products.length} product${products.length === 1 ? "" : "s"} · Add to cart, wishlist or order directly`}
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full bg-[#EAF8F0] px-3 py-1 text-[11px] font-bold text-[#249357]">Verified Brand</span>
          </div>
        </section>

        {/* Search */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in this brand…"
              className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-navy"
            />
          </div>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="hidden items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2.5 text-[12px] font-semibold text-ink hover:border-navy sm:inline-flex"
          >
            <ShoppingCart size={14} /> Cart
          </button>
          <button
            type="button"
            onClick={() => router.push("/wishlist")}
            className="hidden items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2.5 text-[12px] font-semibold text-ink hover:border-navy sm:inline-flex"
          >
            <Heart size={14} /> Wishlist
          </button>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
            {error}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[280px] animate-pulse rounded-card border border-line bg-white" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line bg-white p-10 text-center">
            <Package size={28} className="mx-auto text-ink-faint" />
            <p className="mt-2 text-[13px] font-semibold text-ink">No products found for this brand</p>
            <p className="mt-1 text-[11px] text-ink-soft">Try another brand or add products in Admin → Products linked to this brand.</p>
            <button
              type="button"
              onClick={() => router.push("/brands")}
              className="mt-4 rounded-lg bg-navy px-4 py-2 text-[12px] font-bold text-white"
            >
              Browse Brands
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <p className="mt-4 text-center text-[10px] text-ink-faint">
          Click any product card to view details · Use <Heart size={10} className="inline" /> to wishlist, cart icon to add to cart, then checkout to place order.
        </p>
      </main>

      <Footer />
    </div>
  );
}
