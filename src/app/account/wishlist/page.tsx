"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { useCart } from "@/app/context/cartcontext";

import { useWishlist } from "@/app/context/wishlistcontext";

import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  Bell,
  LockKeyhole,
  LogOut,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  HeartOff,
  PackageOpen,
  Star,
  User,
  MapPin,
  ChevronRight,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type WishlistProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  category?: string;
  inStock: boolean;
};

/* =========================================================
   CONSTANTS
========================================================= */

/* =========================================================
   ACCOUNT MENU
========================================================= */

const ACCOUNT_MENU = [
  {
    label: "My Profile",
    icon: User,
    href: "/account/profile",
  },
  {
    label: "My Orders",
    icon: ShoppingBag,
    href: "/account/orders",
  },
  {
    label: "Addresses",
    icon: MapPin,
    href: "/account/addresses",
  },
  {
    label: "Wishlist",
    icon: Heart,
    href: "/account/wishlist",
    active: true,
  },
  {
    label: "Alerts",
    icon: Bell,
    href: "/alerts",
  },
  {
    label: "Change Password",
    icon: LockKeyhole,
    href: "/account/change-password",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

/* =========================================================
   PAGE
========================================================= */

export default function WishlistPage() {
  const router = useRouter();

  /* =======================================================
     WISHLIST (API-BACKED CONTEXT)
  ======================================================= */

  const {
    items: wishlistItems,
    removeFromWishlist: removeWishlistItem,
    clearWishlist: clearWishlistRemote,
  } = useWishlist();

  const { addToCart: addProductToCart } = useCart();

  const wishlist: WishlistProduct[] = useMemo(
    () =>
      wishlistItems.map((product) => ({
        id: product.id,
        name: product.name,
        image: product.image || "/images/products/product-placeholder.jpg",
        price: product.price,
        originalPrice: product.mrp > product.price ? product.mrp : undefined,
        rating: product.rating > 0 ? product.rating : undefined,
        reviews: product.reviews > 0 ? product.reviews : undefined,
        category: product.brand || "",
        inStock: product.inStock,
      })),
    [wishlistItems]
  );

  const [isLoading, setIsLoading] = useState(true);

  /*
    The context hydrates asynchronously (guest copy or backend
    load); give it a short grace period before showing content.
  */

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);

    return () => clearTimeout(timer);
  }, []);

  /* =======================================================
     UI
  ======================================================= */

  const [success, setSuccess] = useState("");

  const [error, setError] = useState("");

  const [movingProductId, setMovingProductId] = useState<string | null>(
    null
  );

  /* =======================================================
     TOTAL SAVINGS
  ======================================================= */

  const totalSavings = useMemo(() => {
    return wishlist.reduce((total, product) => {
      if (
        typeof product.originalPrice !== "number" ||
        product.originalPrice <= product.price
      ) {
        return total;
      }

      return total + (product.originalPrice - product.price);
    }, 0);
  }, [wishlist]);

  /* =======================================================
     TOTAL VALUE
  ======================================================= */

  const totalValue = useMemo(() => {
    return wishlist.reduce((total, product) => total + product.price, 0);
  }, [wishlist]);

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  const removeFromWishlist = (productId: string) => {
    setError("");
    setSuccess("");

    removeWishlistItem(productId);

    setSuccess("Product removed from wishlist.");

    setTimeout(() => {
      setSuccess("");
    }, 2500);
  };

  /* =======================================================
     CLEAR WISHLIST
  ======================================================= */

  const clearWishlist = () => {
    setError("");
    setSuccess("");

    if (wishlist.length === 0) {
      setError("Your wishlist is already empty.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove all wishlist items?"
    );

    if (!confirmed) {
      return;
    }

    clearWishlistRemote();

    setSuccess("Wishlist cleared successfully.");

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const addToCart = (product: WishlistProduct) => {
    setError("");
    setSuccess("");
    setMovingProductId(product.id);

    if (!product.inStock) {
      setError(`${product.name} is currently out of stock.`);

      setMovingProductId(null);

      return;
    }

    const source = wishlistItems.find((item) => item.id === product.id);

    if (source) {
      addProductToCart(source);
    }

    /*
      Remove from wishlist
      after adding to cart.
    */

    removeWishlistItem(product.id);

    setSuccess(`${product.name} added to cart.`);

    setTimeout(() => {
      setSuccess("");
    }, 3000);

    setMovingProductId(null);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#DCE8FA] border-t-[#1769F5]" />

          <p className="mt-4 text-[13px] font-medium text-[#718096]">
            Loading wishlist...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* BREADCRUMB */}

      <div className="mb-5 flex items-center gap-2 text-[13px]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[#1769F5] hover:underline"
        >
          Home
        </button>

        <span className="text-[#A7B3C5]">›</span>

        <button
          type="button"
          onClick={() => router.push("/account")}
          className="text-[#718096] hover:text-[#1769F5]"
        >
          My Account
        </button>

        <span className="text-[#A7B3C5]">›</span>

        <span className="font-semibold text-[#102D62]">Wishlist</span>
      </div>

      {/* PAGE HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#102D62] shadow-sm transition hover:bg-[#EAF2FF]"
            aria-label="Back to account"
          >
            <ArrowLeft size={21} />
          </button>

          <div>
            <h1 className="text-[30px] font-bold tracking-tight text-[#102D62] sm:text-[34px]">
              My Wishlist
            </h1>

            <p className="mt-1 text-[14px] text-[#718096]">
              Save your favourite products and shop them whenever you want.
            </p>
          </div>
        </div>

        {wishlist.length > 0 && (
          <button
            type="button"
            onClick={clearWishlist}
            className="flex h-[43px] items-center justify-center gap-2 rounded-[9px] border border-[#FECACA] bg-white px-4 text-[12px] font-semibold text-[#EF4444] transition hover:bg-[#FFF5F5] sm:ml-auto"
          >
            <Trash2 size={15} />
            Clear Wishlist
          </button>
        )}
      </div>

      {/* ALERTS */}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">
          <XCircle size={17} className="text-[#D92D20]" />

          <p className="text-[12px] font-medium text-[#D92D20]">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-[#B7E4C7] bg-[#EAF7EF] px-4 py-3">
          <CheckCircle2 size={17} className="text-[#159447]" />

          <p className="text-[12px] font-semibold text-[#159447]">
            {success}
          </p>
        </div>
      )}

      {/* SUMMARY */}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* ITEMS */}

        <div className="rounded-[16px] border border-[#E2EAF4] bg-white p-5 shadow-[0_8px_25px_rgba(30,72,130,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0F4] text-[#E83E68]">
              <Heart size={21} fill="currentColor" />
            </div>

            <div>
              <p className="text-[12px] text-[#718096]">Wishlist Items</p>

              <p className="mt-1 text-[23px] font-bold text-[#102D62]">
                {wishlist.length}
              </p>
            </div>
          </div>
        </div>

        {/* VALUE */}

        <div className="rounded-[16px] border border-[#E2EAF4] bg-white p-5 shadow-[0_8px_25px_rgba(30,72,130,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF2FF] text-[#1769F5]">
              <ShoppingBag size={21} />
            </div>

            <div>
              <p className="text-[12px] text-[#718096]">Total Value</p>

              <p className="mt-1 text-[20px] font-bold text-[#102D62]">
                {formatPrice(totalValue)}
              </p>
            </div>
          </div>
        </div>

        {/* SAVINGS */}

        <div className="rounded-[16px] border border-[#E2EAF4] bg-white p-5 shadow-[0_8px_25px_rgba(30,72,130,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF9F0] text-[#159447]">
              <Star size={21} fill="currentColor" />
            </div>

            <div>
              <p className="text-[12px] text-[#718096]">You Save</p>

              <p className="mt-1 text-[20px] font-bold text-[#159447]">
                {formatPrice(totalSavings)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT HEADER */}

      {wishlist.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-[#102D62]">
              Saved Products
            </h2>

            <p className="mt-1 text-[12px] text-[#718096]">
              Your favourite products are saved here.
            </p>
          </div>

          <span className="hidden rounded-full bg-[#EAF2FF] px-3 py-1.5 text-[11px] font-bold text-[#1769F5] sm:block">
            {wishlist.length} {wishlist.length === 1 ? "Item" : "Items"}
          </span>
        </div>
      )}

      {/* EMPTY STATE */}

      {wishlist.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#CBD8E8] bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF0F4] text-[#E83E68]">
            <HeartOff size={34} />
          </div>

          <h2 className="mt-5 text-[22px] font-bold text-[#102D62]">
            Your wishlist is empty
          </h2>

          <p className="mx-auto mt-2 max-w-[460px] text-[13px] leading-6 text-[#718096]">
            You haven't saved any products yet. Browse our collection and
            add products you love to your wishlist.
          </p>

          <button
            type="button"
            onClick={() => router.push("/retail")}
            className="mt-6 inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-[#1769F5] px-6 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(23,105,245,0.20)] transition hover:bg-[#0F5DDD]"
          >
            <ShoppingBag size={17} />
            Continue Shopping
          </button>
        </div>
      ) : (
        /* =================================================
           PRODUCT GRID
        ================================================= */

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wishlist.map((product) => {
            const discount =
              product.originalPrice && product.originalPrice > product.price
                ? Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )
                : 0;

            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[17px] border border-[#E2EAF4] bg-white shadow-[0_8px_25px_rgba(30,72,130,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(30,72,130,0.08)]"
              >
                {/* IMAGE */}

                <div className="relative aspect-square overflow-hidden bg-[#F5F8FC]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    onError={(event) => {
                      event.currentTarget.src =
                        "/images/products/product-placeholder.jpg";
                    }}
                  />

                  {/* DISCOUNT */}

                  {discount > 0 && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#EF4444] px-2.5 py-1 text-[10px] font-bold text-white">
                      {discount}% OFF
                    </span>
                  )}

                  {/* REMOVE */}

                  <button
                    type="button"
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#EF4444] shadow-[0_5px_15px_rgba(0,0,0,0.10)] transition hover:bg-[#FFF3F3]"
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <Heart size={17} fill="currentColor" />
                  </button>

                  {/* OUT OF STOCK */}

                  {!product.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#102D62]/45">
                      <span className="rounded-full bg-white px-4 py-2 text-[11px] font-bold text-[#102D62]">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* DETAILS */}

                <div className="p-4">
                  {/* CATEGORY */}

                  {product.category && (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A9AAF]">
                      {product.category}
                    </p>
                  )}

                  {/* NAME */}

                  <button
                    type="button"
                    onClick={() => router.push(`/product/${product.id}`)}
                    className="mt-1 block w-full text-left"
                  >
                    <h3 className="line-clamp-2 min-h-[42px] text-[15px] font-bold leading-5 text-[#102D62] transition hover:text-[#1769F5]">
                      {product.name}
                    </h3>
                  </button>

                  {/* RATING */}

                  {typeof product.rating === "number" && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5 rounded-[5px] bg-[#EAF9F0] px-1.5 py-1 text-[10px] font-bold text-[#159447]">
                        <Star size={11} fill="currentColor" />
                        {product.rating}
                      </div>

                      {typeof product.reviews === "number" && (
                        <span className="text-[10px] text-[#8A9AAF]">
                          ({product.reviews} reviews)
                        </span>
                      )}
                    </div>
                  )}

                  {/* PRICE */}

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[18px] font-bold text-[#102D62]">
                      {formatPrice(product.price)}
                    </span>

                    {product.originalPrice &&
                      product.originalPrice > product.price && (
                        <span className="text-[12px] text-[#9AA9BF] line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                  </div>

                  {/* ACTIONS */}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={
                        !product.inStock || movingProductId === product.id
                      }
                      onClick={() => addToCart(product)}
                      className="flex h-[43px] flex-1 items-center justify-center gap-2 rounded-[9px] bg-[#1769F5] px-3 text-[12px] font-semibold text-white transition hover:bg-[#0F5DDD] disabled:cursor-not-allowed disabled:bg-[#B8C4D5]"
                    >
                      {movingProductId === product.id ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={15} />
                          Add to Cart
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFromWishlist(product.id)}
                      className="flex h-[43px] w-[43px] shrink-0 items-center justify-center rounded-[9px] border border-[#FECACA] text-[#EF4444] transition hover:bg-[#FFF5F5]"
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* BOTTOM INFO */}

      {wishlist.length > 0 && (
        <div className="mt-5 rounded-[15px] bg-[#F0F6FF] p-4">
          <div className="flex items-start gap-3">
            <PackageOpen
              size={19}
              className="mt-0.5 shrink-0 text-[#1769F5]"
            />

            <div>
              <p className="text-[12px] font-bold text-[#102D62]">
                Your wishlist is saved
              </p>

              <p className="mt-1 text-[11px] leading-5 text-[#718096]">
                Products you save here will remain in your wishlist until
                you remove them or move them to your cart.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
