"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ChevronRight,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Star,
  Truck,
  Sparkles,
} from "lucide-react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";

import { useCart } from "@/app/context/cartcontext";
import { useWishlist } from "@/app/context/wishlistcontext";

import ShoppingListSavePopup from "@/app/components/ShoppingListSavePopup";

import { productsApi } from "@/app/api/services";
import { mapProductSummaries } from "@/app/api/productmap";
import { type Product } from "@/app/data/products";

export default function RetailPage() {
  /* =========================================================
     STATE
  ========================================================= */

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  /* =========================================================
     SHOPPING LIST POPUP
  ========================================================= */

  const [showShoppingListPopup, setShowShoppingListPopup] =
    useState(false);

  const [shoppingListProduct, setShoppingListProduct] =
    useState<Product | null>(null);

  /* =========================================================
     PRODUCTS — from the catalog API
  ========================================================= */

  const filterToStatus: Record<string, string> = {
    All: "",
    "In Stock": "in_stock",
    "Low Stock": "low_stock",
    "Out of Stock": "out_of_stock",
  };

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);

      try {
        const response = await productsApi.list({
          page: 1,
          pageSize: 60,
          search: searchQuery,
          status: filterToStatus[activeFilter],
        });

        const mapped = mapProductSummaries(response.data);

        if (!cancelled) {
          setProducts(mapped);
          setLoadFailed(false);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, activeFilter]);

  /* =========================================================
     CART
  ========================================================= */

  const { items, addToCart, updateQty, removeFromCart } = useCart();

  /* =========================================================
     WISHLIST
  ========================================================= */

  const { isInWishlist, toggleWishlist } = useWishlist();

  /* =========================================================
     STOCK FILTERS
  ========================================================= */

  const stockFilters = [
    "All",
    "In Stock",
    "Low Stock",
    "Out of Stock",
  ];

  /* =========================================================
     FILTERED PRODUCTS
  ========================================================= */

  const filteredProducts = useMemo(() => {
    if (activeFilter === "All") {
      return products;
    }

    return products.filter((product: Product) => {
      if (activeFilter === "Out of Stock") {
        return product.inStock === false;
      }

      if (activeFilter === "Low Stock") {
        return product.stockStatus === "low_stock";
      }

      // In Stock: everything purchasable.
      // Low stock is still purchasable.
      return product.inStock !== false;
    });
  }, [products, activeFilter]);

  /* =========================================================
     GET PRODUCT QUANTITY
  ========================================================= */

  const getQty = (id: string) => {
    const line = items.find((item) => item.product.id === id);
    return line?.qty ?? 0;
  };

  /* =========================================================
     WISHLIST
  ========================================================= */

  const handleWishlist = (product: Product) => {
    try {
      const wasSaved = isInWishlist(product.id);

      toggleWishlist(product);

      /*
       * Show Shopping List popup only when the product
       * is newly added to the Wishlist.
       */
      if (!wasSaved) {
        setShoppingListProduct(product);
        setShowShoppingListPopup(true);
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    }
  };

  /* =========================================================
     ADD TO CART
  ========================================================= */

  const handleAddToCart = (product: Product) => {
    if (product.inStock === false) {
      return;
    }

    addToCart(product, 1);
  };

  /* =========================================================
     INCREASE QUANTITY
  ========================================================= */

  const increaseQty = (product: Product, quantity: number) => {
    if (product.inStock === false) {
      return;
    }

    updateQty(product.id, quantity + 1);
  };

  /* =========================================================
     DECREASE QUANTITY
  ========================================================= */

  const decreaseQty = (product: Product, quantity: number) => {
    if (quantity <= 1) {
      removeFromCart(product.id);
      return;
    }

    updateQty(product.id, quantity - 1);
  };

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f8fafc] text-ink">
      {/* =====================================================
          STICKY TOP: TOPBAR + HEADER + MOBILE NAV
      ====================================================== */}

      <div className="sticky top-0 z-50 bg-[#f8fafc]">
        {/* TOP BAR */}
        <TopBar />

        {/* HEADER */}
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* MOBILE NAV */}
        <MainNav
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6">
        {/* ===================================================
            RETAIL HERO
        ==================================================== */}

        <section
          className="
            relative
            min-h-[400px]
            overflow-hidden
            rounded-2xl
            shadow-md
          "
        >
          {/* Background Image */}
          <img
            src="/images/Retail/Retail.png"
            alt="Retail supermarket"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              object-center
            "
          />

          {/* Clean Linear Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(
                  to left,
                  rgba(8, 14, 17, 0.94) 0%,
                  rgba(0, 0, 0, 0.53) 60%,
                  rgba(0, 0, 0, 0.13) 100%
                )
              `,
            }}
          />

          {/* Content - Aligned to the Right */}
          <div
            className="
              relative
              z-10
              flex
              min-h-[400px]
              items-center
              justify-end
              px-6
              py-10
              sm:px-10
              md:px-14
              lg:px-20
            "
          >
            <div className="flex max-w-[680px] flex-col items-end text-right">
              {/* BADGE */}
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-[#4A90D9]
                  px-4
                  py-1.5
                  text-[11px]
                  font-semibold
                  text-white
                "
              >
                <Sparkles size={12} aria-hidden="true" />
                Special Offers
              </div>

              {/* HEADING */}
              <h1
                className="
                  mt-4
                  text-[32px]
                  font-bold
                  leading-[1.15]
                  text-white
                  sm:text-[42px]
                  md:text-[48px]
                  lg:text-[52px]
                "
              >
                Everyday Essentials
                <br />
                <span className="text-[#A8D8FF]">
                  For Every Home
                </span>
              </h1>

              {/* FEATURES */}
              <div
                className="
                  mt-5
                  grid
                  w-full
                  max-w-[620px]
                  grid-cols-2
                  gap-2
                  sm:grid-cols-4
                  sm:gap-3
                "
              >
                {[
                  "Wide Range",
                  "Great Quality",
                  "Best Prices",
                  "For Every Home",
                ].map((label) => (
                  <div
                    key={label}
                    className="
                      rounded-lg
                      border
                      border-white/20
                      bg-white/10
                      px-3
                      py-2
                      text-center
                    "
                  >
                    <p className="text-[11px] font-bold text-white sm:text-[12px]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* DESCRIPTION */}
              <p
                className="
                  mt-4
                  max-w-[560px]
                  text-[12px]
                  leading-5
                  text-white/85
                  sm:text-[14px]
                  sm:leading-6
                "
              >
                Shop groceries, beverages, personal care, household
                essentials and more from trusted brands.
              </p>

              {/* BUTTONS */}
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                {/* SHOP NOW */}
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("products")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="
                    group
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-[#4A90D9]
                    px-7
                    py-3
                    text-[12px]
                    font-bold
                    text-white
                    transition-colors
                    duration-200
                    hover:bg-[#3A7EC4]
                  "
                >
                  Shop Now

                  <ChevronRight
                    size={14}
                    className="
                      transition-transform
                      duration-200
                      group-hover:translate-x-0.5
                    "
                  />
                </button>

                {/* EXPLORE CATEGORIES */}
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("categories")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="
                    group
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-white/40
                    bg-white/10
                    px-6
                    py-3
                    text-[12px]
                    font-semibold
                    text-white
                    transition-colors
                    duration-200
                    hover:bg-white/20
                  "
                >
                  Explore Categories

                  <ChevronRight
                    size={14}
                    className="
                      transition-transform
                      duration-200
                      group-hover:translate-x-0.5
                    "
                  />
                </button>
              </div>

              {/* TRUST INDICATORS */}
              <div className="mt-5 flex flex-wrap items-center justify-end gap-4">
                {[
                  { label: "1000+ Brands" },
                  { label: "Free Delivery" },
                  { label: "Secure Payments" },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#A8D8FF]">
                        ✓
                      </span>

                      <span className="text-[10px] text-white/80 sm:text-[11px]">
                        {item.label}
                      </span>
                    </div>

                    {idx < 2 && (
                      <div className="hidden h-4 w-px bg-white/20 sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            BENEFITS
        ==================================================== */}

        <section
          className="
            mt-6
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          <Benefit
            icon={<Truck size={22} />}
            title="Fast Delivery"
            text="Quick delivery to your doorstep"
            color="bg-[#eff6ff] text-[#2563eb]"
          />

          <Benefit
            icon={<PackageCheck size={22} />}
            title="Genuine Products"
            text="100% authentic & trusted brands"
            color="bg-[#ecfdf5] text-[#16a34a]"
          />

          <Benefit
            icon={<ShoppingBag size={22} />}
            title="Best Prices"
            text="Great deals every single day"
            color="bg-[#fff7ed] text-[#ea580c]"
          />

          <Benefit
            icon={<Heart size={22} />}
            title="Easy Returns"
            text="Hassle-free shopping experience"
            color="bg-[#fdf2f8] text-[#db2777]"
          />
        </section>

        {/* ===================================================
            PRODUCTS
        ==================================================== */}

        <section id="products" className="mt-10">
          {/* SECTION HEADER */}

          <div
            className="
              flex
              flex-col
              gap-5
              border-b
              border-line
              pb-5
              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div>
              <h2 className="text-[26px] font-bold">
                Best Deals Right Now
              </h2>

              <p className="mt-1 text-[13px] text-ink-soft">
                Don&apos;t miss today&apos;s best offers
              </p>
            </div>

            {/* SEARCH */}

            <div className="mb-3">
              <label className="sr-only">
                Search products
              </label>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, SKU, brand…"
                className="
                  w-full
                  rounded-lg
                  border
                  border-line
                  px-3
                  py-2
                  focus-outline
                  focus:border-navy
                  focus:outline-none
                "
              />
            </div>

            {/* FILTER */}

            <div
              id="categories"
              className="flex gap-2 overflow-x-auto pb-1"
            >
              {stockFilters.map((filter) => {
                const isActive = activeFilter === filter;

                return (
                  <button
                    type="button"
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    aria-pressed={isActive}
                    className={`
                      shrink-0
                      rounded-lg
                      border
                      px-4
                      py-2
                      text-[12px]
                      font-medium
                      transition
                      ${
                        isActive
                          ? "border-navy bg-navy text-white"
                          : "border-line bg-white text-ink-soft hover:border-blue hover:text-blue"
                      }
                    `}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================================
              PRODUCT GRID
          ================================================== */}

          {!loading && filteredProducts.length > 0 ? (
            <div
              className="
                mt-6
                grid
                grid-cols-1
                gap-5
                sm:grid-cols-2
                lg:grid-cols-4
              "
            >
              {filteredProducts.map((product) => {
                const quantity = getQty(product.id);
                const isWishlisted = isInWishlist(product.id);
                const isOutOfStock = product.inStock === false;

                return (
                  <div
                    key={product.id}
                    className="
                      overflow-hidden
                      rounded-xl
                      border
                      border-line
                      bg-white
                      transition
                      hover:-translate-y-1
                      hover:shadow-lg
                    "
                  >
                    {/* PRODUCT IMAGE */}

                    <div
                      className="
                        relative
                        flex
                        h-[175px]
                        items-center
                        justify-center
                        bg-gradient-to-b
                        from-[#f8fafc]
                        to-[#eef3f7]
                      "
                    >
                      {/* DISCOUNT */}

                      {product.discount ? (
                        <span
                          className="
                            absolute
                            left-3
                            top-3
                            rounded-md
                            bg-[#dc2626]
                            px-2.5
                            py-1
                            text-[10px]
                            font-bold
                            text-white
                          "
                        >
                          {product.discount}% OFF
                        </span>
                      ) : null}

                      {/* WISHLIST */}

                      <button
                        type="button"
                        aria-label={
                          isWishlisted
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                        }
                        aria-pressed={isWishlisted}
                        onClick={() => handleWishlist(product)}
                        className="
                          absolute
                          right-3
                          top-3
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-full
                          bg-white
                          shadow-sm
                          transition
                          hover:scale-105
                        "
                      >
                        <Heart
                          size={17}
                          className={
                            isWishlisted
                              ? "fill-red-500 text-red-500"
                              : "text-ink-soft"
                          }
                        />
                      </button>

                      {/* PRODUCT IMAGE */}

                      {product.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="
                            h-[130px]
                            max-w-[85%]
                            object-contain
                            drop-shadow-md
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-[100px]
                            w-[100px]
                            items-center
                            justify-center
                            rounded-3xl
                            bg-white
                            text-center
                            text-[13px]
                            font-semibold
                            shadow-md
                          "
                          style={{
                            background:
                              product.swatch || undefined,
                          }}
                        >
                          {product.brand}
                        </div>
                      )}
                    </div>

                    {/* PRODUCT INFO */}

                    <div className="p-4">
                      {/* BRAND */}

                      <p className="text-[11px] font-semibold text-ink-soft">
                        {product.brand}
                      </p>

                      {/* NAME */}

                      <h3
                        className="
                          mt-1
                          min-h-[40px]
                          text-[14px]
                          font-semibold
                          leading-5
                        "
                      >
                        {product.name}
                        {product.pack
                          ? ` (${product.pack})`
                          : ""}
                      </h3>

                      {/* RATING / MOQ */}

                      {product.rating > 0 ? (
                        <div className="mt-2 flex items-center gap-1">
                          <Star
                            size={14}
                            className="fill-[#fbbf24] text-[#fbbf24]"
                          />

                          <span className="text-[11px] font-medium">
                            {product.rating}
                          </span>

                          {product.reviews ? (
                            <span className="text-[10px] text-ink-faint">
                              ({product.reviews})
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-[10px] text-ink-faint">
                            MOQ: {product.moq} unit
                            {product.moq === 1 ? "" : "s"}
                          </span>
                        </div>
                      )}

                      {/* PRICE */}

                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-[21px] font-bold text-navy">
                          ₹{product.price}
                        </span>

                        {product.mrp &&
                        product.mrp > product.price ? (
                          <span
                            className="
                              pb-1
                              text-[12px]
                              text-ink-faint
                              line-through
                            "
                          >
                            ₹{product.mrp}
                          </span>
                        ) : null}
                      </div>

                      {/* STOCK */}

                      {isOutOfStock ? (
                        <p className="mt-1 text-[10px] font-medium text-[#dc2626]">
                          Out of stock
                        </p>
                      ) : (
                        <p className="mt-1 text-[10px] font-medium text-green">
                          {product.dispatch || "Ready to ship"}
                        </p>
                      )}

                      {/* CART */}

                      {quantity === 0 ? (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() =>
                            handleAddToCart(product)
                          }
                          className="
                            mt-4
                            flex
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            bg-navy
                            py-2.5
                            text-[12px]
                            font-semibold
                            text-white
                            transition
                            hover:bg-navy-deep
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          <ShoppingCart size={16} />

                          {isOutOfStock
                            ? "Out of Stock"
                            : "Add to Cart"}
                        </button>
                      ) : (
                        <div
                          className="
                            mt-4
                            flex
                            items-center
                            justify-between
                            rounded-lg
                            border
                            border-line
                          "
                        >
                          {/* DECREASE */}

                          <button
                            type="button"
                            aria-label={`Decrease ${product.name} quantity`}
                            onClick={() =>
                              decreaseQty(product, quantity)
                            }
                            className="
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              transition
                              hover:bg-slate-50
                            "
                          >
                            <Minus size={16} />
                          </button>

                          {/* QUANTITY */}

                          <span
                            className="
                              min-w-[30px]
                              text-center
                              text-[13px]
                              font-bold
                            "
                          >
                            {quantity}
                          </span>

                          {/* INCREASE */}

                          <button
                            type="button"
                            aria-label={`Increase ${product.name} quantity`}
                            disabled={isOutOfStock}
                            onClick={() =>
                              increaseQty(product, quantity)
                            }
                            className="
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              transition
                              hover:bg-slate-50
                              disabled:cursor-not-allowed
                              disabled:opacity-40
                            "
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* =================================================
               LOADING / EMPTY STATE
            ================================================== */

            <div
              className="
                mt-6
                rounded-xl
                border
                border-dashed
                border-line
                bg-white
                py-16
                text-center
              "
              role="status"
              aria-live="polite"
            >
              <ShoppingBag
                size={36}
                className="mx-auto text-ink-faint"
              />

              <h3 className="mt-3 text-lg font-semibold">
                {loading
                  ? "Loading products…"
                  : loadFailed
                    ? "Products could not be loaded"
                    : "No products found"}
              </h3>

              <p className="mt-1 text-sm text-ink-soft">
                {loading
                  ? "Fetching the latest catalog from Aanzara."
                  : loadFailed
                    ? "Please check your connection and try again later."
                    : activeFilter === "All"
                      ? "Products will appear here as soon as they are added to the catalog."
                      : `No products are currently ${activeFilter.toLowerCase()}.`}
              </p>

              {activeFilter !== "All" &&
                !loading &&
                !loadFailed && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("All")}
                    className="
                      mt-4
                      inline-flex
                      items-center
                      gap-1
                      text-[12px]
                      font-semibold
                      text-blue
                      hover:underline
                    "
                  >
                    View all products
                    <ChevronRight size={14} />
                  </button>
                )}
            </div>
          )}
        </section>
      </main>

      {/* =====================================================
          SHOPPING LIST POPUP
      ====================================================== */}

      {showShoppingListPopup && shoppingListProduct && (
        <ShoppingListSavePopup
          productId={shoppingListProduct.id}
          productName={shoppingListProduct.name}
          onClose={() => {
            setShowShoppingListPopup(false);
            setShoppingListProduct(null);
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   BENEFIT COMPONENT
============================================================ */

function Benefit({
  icon,
  title,
  text,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  color: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-4
        rounded-xl
        border
        border-line
        bg-white
        px-5
        py-5
      "
    >
      <div
        className={`
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${color}
        `}
      >
        {icon}
      </div>

      <div>
        <h3 className="text-[14px] font-bold">{title}</h3>

        <p className="mt-1 text-[11px] text-ink-soft">
          {text}
        </p>
      </div>
    </div>
  );
}