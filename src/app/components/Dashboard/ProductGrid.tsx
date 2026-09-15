// File: app/components/Dashboard/ProductGrid.tsx
"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { AlertCircle } from "lucide-react";
import { extractErrorMessage } from "@/app/api/api";
import { productsApi } from "@/app/api/services";

// Define the Product type based on API response
interface ApiProduct {
  productId: string;
  productName: string;
  description: string;
  categoryType: string;
  categoryId: string;
  price: number;
  mrp: number;
  brand: string;
  sku: string;
  moq: number;
  inStock?: boolean;
}

// Define the Product type expected by ProductCard
interface MappedProduct {
  id: string;
  name: string;
  description: string;
  brand: string;
  sku: string;
  price: number;
  mrp: number;
  moq: number;
  pack: string;
  dispatch: string;
  swatch: string;
  accent: string;
  discount: number;
  rating: number;
  reviews: number;
  bulkRate: number;
  bulkMoq: number;
  inStock: boolean;
}

interface ProductGridProps {
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export default function ProductGrid({
  categoryId,
  page = 1,
  pageSize = 20
}: ProductGridProps) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: page,
    pageSize: pageSize,
    totalCount: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  });

  console.log("ProductGrid - Received props:", { categoryId, page, pageSize });

  /* ============================================================
     FETCH PRODUCTS FROM API (#41)
  ============================================================ */

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("ProductGrid - Fetching products with params:", {
        categoryId,
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
      });

      // #41 GET /api/v1/products/category/{categoryId}?page=&pageSize=
      //     (falls back to #35 GET /api/v1/products when no category is set)
      const response = categoryId
        ? await productsApi.byCategory(
            categoryId,
            pagination.currentPage,
            pagination.pageSize
          )
        : await productsApi.list({
            page: pagination.currentPage,
            pageSize: pagination.pageSize,
          });

      console.log("ProductGrid - API Response:", response.data);

      // Handle the response structure
      let items: ApiProduct[] = [];
      let paginationData = {};

      if (response.data?.items && Array.isArray(response.data.items)) {
        items = response.data.items;
        // Extract pagination info from the response
        if (response.data.page !== undefined) {
          paginationData = {
            currentPage: response.data.page,
            pageSize: response.data.pageSize,
            totalCount: response.data.totalCount,
            totalPages: response.data.totalPages,
            hasPrevious: response.data.hasPrevious,
            hasNext: response.data.hasNext,
          };
        }
      } else if (Array.isArray(response.data)) {
        items = response.data;
      } else {
        console.error("ProductGrid - Unexpected response format:", response.data);
        throw new Error("Invalid response format");
      }

      console.log("ProductGrid - Products fetched:", items.length);
      setProducts(items);
      setPagination(prev => ({ ...prev, ...paginationData }));
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to load products"
      );
      console.error("ProductGrid - Error fetching products:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     FETCH ON MOUNT OR WHEN PARAMS CHANGE
  ============================================================ */

  useEffect(() => {
    console.log("ProductGrid - useEffect triggered with:", { categoryId });
    fetchProducts();
  }, [categoryId, pagination.currentPage, pagination.pageSize]);

  /* ============================================================
     MAP API PRODUCTS TO PRODUCT CARD FORMAT
  ============================================================ */

  const mapApiProductToMappedProduct = (entry: ApiProduct): MappedProduct => {
    // Tolerate catalogue shape variants (productName/name, brandName/brand…).
    const raw = entry as unknown as Record<string, unknown>;
    const str = (v: unknown, fallback = "") =>
      typeof v === "string" && v ? v : fallback;
    const num = (v: unknown, fallback = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const productId = str(raw.productId ?? raw.id);
    const productName = str(raw.productName ?? raw.name, "Product");
    const brand = str(raw.brandName ?? raw.brand, "Generic");
    const price = num(raw.unitPrice ?? raw.price);
    const mrp = num(raw.mrp, price);
    const moq = num(raw.moq ?? raw.minOrderQuantity, 1) || 1;
    const discount = calculateDiscount(mrp, price);

    return {
      id: productId,
      name: productName,
      description: str(raw.description),
      brand,
      sku: str(raw.sku ?? raw.skuCode, "N/A"),
      price,
      mrp,
      moq,
      pack: str(raw.packSize ?? raw.pack, "1 Case"),
      dispatch: "2-3 days",
      swatch: getColorFromBrand(brand),
      accent: getAccentColorFromBrand(brand),
      discount,
      rating: num(raw.rating, 4.5),
      reviews: num(raw.reviewCount ?? raw.reviews, 100),
      bulkRate: price * 0.9,
      bulkMoq: moq * 5 || 5,
      inStock: Boolean(raw.inStock ?? raw.isAvailable ?? true),
    };
  };

  // Helper function to calculate discount
  function calculateDiscount(mrp: number, price: number): number {
    if (!mrp || mrp <= 0) return 0;
    const discount = ((mrp - price) / mrp) * 100;
    return Math.round(discount);
  }

  // Helper function to get color based on brand
  function getColorFromBrand(brand: string): string {
    const brandColors: Record<string, string> = {
      "Fortune": "#FF6B35",
      "Saffola": "#FF4136",
      "Dhara": "#2ECC40",
      "Ghee": "#FF851B",
      "Sunflower": "#FFDC00",
      "Olive": "#2ECC40",
      "Mustard": "#FF851B",
      "Coconut": "#B10DC9",
      "Palm": "#FF4136",
      "Soybean": "#0074D9",
    };
    return brandColors[brand] || "#6B7280";
  }

  function getAccentColorFromBrand(brand: string): string {
    const brandAccents: Record<string, string> = {
      "Fortune": "#E55D2B",
      "Saffola": "#CC3333",
      "Dhara": "#22B833",
      "Ghee": "#E67A15",
      "Sunflower": "#D4B800",
      "Olive": "#22B833",
      "Mustard": "#E67A15",
      "Coconut": "#8C0BAA",
      "Palm": "#CC3333",
      "Soybean": "#005BB0",
    };
    return brandAccents[brand] || "#4B5563";
  }

  /* ============================================================
     LOADING STATE
  ============================================================ */

  if (loading) {
    return (
      <div
        role="status"
        className="
          bg-white
          border
          border-line
          rounded-card
          min-h-[250px]
          flex
          items-center
          justify-center
          text-center
          px-5
        "
      >
        <div className="text-[12px] text-ink-soft">
          Loading products...
        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR STATE
  ============================================================ */

  if (error) {
    return (
      <div
        role="alert"
        className="
          bg-white
          border
          border-red-300
          rounded-card
          min-h-[250px]
          flex
          flex-col
          items-center
          justify-center
          text-center
          px-5
        "
      >
        <AlertCircle size={24} className="text-red-500 mb-2" />
        <h2 className="text-[13px] font-bold text-ink">
          Unable to load products
        </h2>
        <p className="text-[11px] text-ink-soft mt-1">{error}</p>
        <button
          onClick={fetchProducts}
          className="mt-4 text-blue hover:text-blue-deep text-[12px] font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  /* ============================================================
     EMPTY STATE
  ============================================================ */

  if (products.length === 0) {
    return (
      <div
        role="status"
        className="
          bg-white
          border
          border-line
          rounded-card
          min-h-[250px]
          flex
          flex-col
          items-center
          justify-center
          text-center
          px-5
        "
      >
        <AlertCircle size={24} className="text-ink-faint mb-2" />
        <h2 className="text-[13px] font-bold text-ink">
          No products available
        </h2>
        <p className="text-[11px] text-ink-soft mt-1">
          No products found in this category.
        </p>
      </div>
    );
  }

  /* ============================================================
     PRODUCT GRID
  ============================================================ */

  const mappedProducts = products.map(mapApiProductToMappedProduct);

  return (
    <>
      <div
        className="
          grid
          grid-cols-1
          min-[480px]:grid-cols-2
          xl:grid-cols-4
          gap-4
        "
      >
        {mappedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>

      {/* Optional: Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            onClick={() => {
              if (pagination.hasPrevious) {
                setPagination(prev => ({
                  ...prev,
                  currentPage: Math.max(1, prev.currentPage - 1)
                }));
              }
            }}
            disabled={!pagination.hasPrevious}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-ink-soft">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => {
              if (pagination.hasNext) {
                setPagination(prev => ({
                  ...prev,
                  currentPage: Math.min(prev.totalPages, prev.currentPage + 1)
                }));
              }
            }}
            disabled={!pagination.hasNext}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}