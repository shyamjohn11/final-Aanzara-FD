// File: app/components/Dashboard/BrandProductGrid.tsx
"use client";

import { useEffect, useMemo } from "react";
import ProductCard from "./ProductCard";

/* ============================================================
   DUMMY PRODUCT DATA
   Replace this with a real productsApi.list({ brandId, categoryId })
   call later. Shape matches what ProductCard already expects.
============================================================ */

type DummyProduct = {
  id: string;
  name: string;
  description: string;
  brand: string;
  categoryId: string;
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
};

const DUMMY_PRODUCTS: DummyProduct[] = [
  {
    id: "dummy-1",
    name: "Classic Cola 500ml (Pack of 24)",
    description: "Refreshing carbonated cola, wholesale case pack.",
    brand: "Sample Brand",
    categoryId: "cat-1",
    sku: "SB-COLA-500",
    price: 480,
    mrp: 560,
    moq: 5,
    pack: "1 Case (24 units)",
    dispatch: "2-3 days",
    swatch: "#FF4136",
    accent: "#CC3333",
    discount: 14,
    rating: 4.4,
    reviews: 128,
    bulkRate: 432,
    bulkMoq: 20,
    inStock: true,
  },
  {
    id: "dummy-2",
    name: "Herbal Shampoo 200ml (Pack of 12)",
    description: "Gentle daily-use herbal shampoo, retail-ready case.",
    brand: "Sample Brand",
    categoryId: "cat-2",
    sku: "SB-SHMP-200",
    price: 960,
    mrp: 1100,
    moq: 3,
    pack: "1 Case (12 units)",
    dispatch: "2-3 days",
    swatch: "#2ECC40",
    accent: "#22B833",
    discount: 13,
    rating: 4.6,
    reviews: 89,
    bulkRate: 864,
    bulkMoq: 15,
    inStock: true,
  },
  {
    id: "dummy-3",
    name: "Multi-Surface Cleaner 1L (Pack of 6)",
    description: "Concentrated multi-surface cleaner for home and office.",
    brand: "Sample Brand",
    categoryId: "cat-3",
    sku: "SB-CLN-1000",
    price: 720,
    mrp: 810,
    moq: 4,
    pack: "1 Case (6 units)",
    dispatch: "2-3 days",
    swatch: "#0074D9",
    accent: "#005BB0",
    discount: 11,
    rating: 4.2,
    reviews: 54,
    bulkRate: 648,
    bulkMoq: 12,
    inStock: true,
  },
  {
    id: "dummy-4",
    name: "Immunity Health Drink 400g (Pack of 8)",
    description: "Fortified health drink mix, family pack case.",
    brand: "Sample Brand",
    categoryId: "cat-4",
    sku: "SB-HLTH-400",
    price: 1360,
    mrp: 1600,
    moq: 2,
    pack: "1 Case (8 units)",
    dispatch: "3-4 days",
    swatch: "#FF851B",
    accent: "#E67A15",
    discount: 15,
    rating: 4.7,
    reviews: 41,
    bulkRate: 1224,
    bulkMoq: 10,
    inStock: true,
  },
  {
    id: "dummy-5",
    name: "Baby Wipes 80ct (Pack of 10)",
    description: "Fragrance-free gentle baby wipes, bulk retail case.",
    brand: "Sample Brand",
    categoryId: "cat-5",
    sku: "SB-BW-80",
    price: 640,
    mrp: 720,
    moq: 5,
    pack: "1 Case (10 units)",
    dispatch: "2-3 days",
    swatch: "#B10DC9",
    accent: "#8C0BAA",
    discount: 11,
    rating: 4.5,
    reviews: 63,
    bulkRate: 576,
    bulkMoq: 20,
    inStock: false,
  },
  {
    id: "dummy-6",
    name: "Digestive Biscuits 200g (Pack of 20)",
    description: "Classic wheat digestive biscuits, wholesale carton.",
    brand: "Sample Brand",
    categoryId: "cat-6",
    sku: "SB-BSCT-200",
    price: 900,
    mrp: 1000,
    moq: 3,
    pack: "1 Case (20 units)",
    dispatch: "2-3 days",
    swatch: "#FFDC00",
    accent: "#D4B800",
    discount: 10,
    rating: 4.3,
    reviews: 97,
    bulkRate: 810,
    bulkMoq: 15,
    inStock: true,
  },
  {
    id: "dummy-7",
    name: "UHT Milk 1L (Pack of 12)",
    description: "Long-life UHT toned milk, cold-chain-free case pack.",
    brand: "Sample Brand",
    categoryId: "cat-7",
    sku: "SB-MILK-1000",
    price: 720,
    mrp: 780,
    moq: 4,
    pack: "1 Case (12 units)",
    dispatch: "1-2 days",
    swatch: "#AAAAAA",
    accent: "#888888",
    discount: 8,
    rating: 4.1,
    reviews: 35,
    bulkRate: 648,
    bulkMoq: 12,
    inStock: true,
  },
];

/* ============================================================
   PROPS
============================================================ */

interface BrandProductGridProps {
  brandId?: string;
  categoryId?: string;
  onTotalCountChange?: (count: number) => void;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function BrandProductGrid({
  categoryId,
  onTotalCountChange,
}: BrandProductGridProps) {
  /* ==========================================================
     CLIENT-SIDE CATEGORY FILTER (dummy data only)
  ========================================================== */

  const filteredProducts = useMemo(() => {
    if (!categoryId) return DUMMY_PRODUCTS;
    return DUMMY_PRODUCTS.filter(
      (product) => product.categoryId === categoryId
    );
  }, [categoryId]);

  useEffect(() => {
    if (onTotalCountChange) {
      onTotalCountChange(filteredProducts.length);
    }
  }, [filteredProducts.length, onTotalCountChange]);

  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  if (filteredProducts.length === 0) {
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
        <h2 className="text-[13px] font-bold text-ink">
          No products in this category
        </h2>
        <p className="text-[11px] text-ink-soft mt-1">
          Try a different category filter.
        </p>
      </div>
    );
  }

  /* ==========================================================
     GRID
  ========================================================== */

  return (
    <div
      className="
        grid
        grid-cols-1
        min-[480px]:grid-cols-2
        xl:grid-cols-4
        gap-4
      "
    >
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
