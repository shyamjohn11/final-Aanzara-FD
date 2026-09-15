"use client";

import { useState } from "react";

import {
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Trash2,
} from "lucide-react";

import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Breadcrumb from "@/app/components/Dashboard/Breadcrumb";
import Footer from "@/app/components/Footer";

import CartFrequentlyBoughtTogether from "../components/Cart/Cartfrequentlyboughttogether";
import CartItemCard from "../components/Cart/cartitemcard";
import CartTrustBadges from "../components/Cart/Carttrustbadges";
import OrderSummary from "../components/Cart/ordersummary";

import { useCart } from "../context/cartcontext";
import { useSaveForLater } from "../context/saveforlatercontext";

/* =========================================================
   CONSTANTS
========================================================= */

const MIN_QTY = 1;
const MAX_QTY = 999;
const MAX_EMAIL_LENGTH = 120;

/* =========================================================
   VALIDATION HELPERS
========================================================= */

function normalizeText(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
    value
  );
}

function safeNumber(
  value: unknown,
  fallback = 0
): number {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(
      numberValue
    ) ||
    numberValue < 0
  ) {
    return fallback;
  }

  return numberValue;
}

function safeQuantity(
  value: unknown
): number {
  const quantity =
    Number(value);

  if (
    !Number.isFinite(
      quantity
    ) ||
    quantity < MIN_QTY
  ) {
    return MIN_QTY;
  }

  return Math.min(
    Math.floor(quantity),
    MAX_QTY
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CartPage() {
  const [navOpen, setNavOpen] =
    useState(false);

  const [
    newsletterEmail,
    setNewsletterEmail,
  ] = useState("");

  const [
    newsletterError,
    setNewsletterError,
  ] = useState("");

  const [
    newsletterSuccess,
    setNewsletterSuccess,
  ] = useState(false);

  const {
    items,
    updateQty,
    removeFromCart,
    addToCart,
  } = useCart();

  const {
    items: saveForLaterItems,
    moveToCart,
    removeFromSaveForLater,
  } = useSaveForLater();

  /* =======================================================
     SAFE CART ITEMS
  ======================================================= */

  const safeItems =
    Array.isArray(items)
      ? items.filter(
          (item) =>
            item &&
            item.product &&
            item.product.id !==
              undefined &&
            item.product.id !==
              null
        )
      : [];

  /* =======================================================
     QUANTITY CHANGE
  ======================================================= */

  const handleQtyChange = (
    id: string,
    qty: number
  ) => {
    if (!id) {
      return;
    }

    const validatedQty =
      safeQuantity(qty);

    updateQty(
      id,
      validatedQty
    );
  };

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  const handleRemove = (
    id: string
  ) => {
    if (!id) {
      return;
    }

    removeFromCart(id);
  };

  /* =======================================================
     MOVE SAVED ITEM TO CART
  ======================================================= */

  const handleMoveSavedItemToCart = (
    id: string
  ) => {
    if (!id) {
      return;
    }

    try {
      const savedItem =
        moveToCart(id);

      if (!savedItem) {
        return;
      }

      addToCart(
        savedItem.product,
        savedItem.qty
      );
    } catch (error) {
      console.error(
        "Failed to move Save for Later item to cart:",
        error
      );
    }
  };

  /* =======================================================
     REMOVE SAVED ITEM
  ======================================================= */

  const handleRemoveSavedItem = (
    id: string
  ) => {
    if (!id) {
      return;
    }

    try {
      removeFromSaveForLater(
        id
      );
    } catch (error) {
      console.error(
        "Failed to remove Save for Later item:",
        error
      );
    }
  };

  /* =======================================================
     WHOLESALE SAVINGS
  ======================================================= */

  const savingsOnOrder =
    safeItems.reduce(
      (sum, item) => {
        const product =
          item.product as {
            retail?: unknown;
            wholesale?: unknown;
          };

        const retail =
          safeNumber(
            product.retail
          );

        const wholesale =
          safeNumber(
            product.wholesale
          );

        const qty =
          safeQuantity(
            item.qty
          );

        const savingPerItem =
          Math.max(
            0,
            retail - wholesale
          );

        return (
          sum +
          savingPerItem * qty
        );
      },
      0
    );

  /* =======================================================
     NEWSLETTER INPUT
  ======================================================= */

  const handleNewsletterEmailChange = (
    value: string
  ) => {
    setNewsletterError("");
    setNewsletterSuccess(false);

    setNewsletterEmail(
      value.slice(
        0,
        MAX_EMAIL_LENGTH
      )
    );
  };

  /* =======================================================
     NEWSLETTER SUBMIT
  ======================================================= */

  const handleNewsletterSubmit = () => {
    setNewsletterError("");
    setNewsletterSuccess(false);

    const email =
      normalizeText(
        newsletterEmail
      ).toLowerCase();

    if (!email) {
      setNewsletterError(
        "Please enter your business email address."
      );
      return;
    }

    if (
      email.length >
      MAX_EMAIL_LENGTH
    ) {
      setNewsletterError(
        "Email address is too long."
      );
      return;
    }

    if (!isValidEmail(email)) {
      setNewsletterError(
        "Please enter a valid business email address."
      );
      return;
    }

    setNewsletterEmail(email);
    setNewsletterSuccess(true);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <Header
        onMenuClick={() =>
          setNavOpen(true)
        }
      />

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <MainNav
        open={navOpen}
        onClose={() =>
          setNavOpen(false)
        }
      />

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <Breadcrumb
          trail={[
            "Home",
            "Cart",
          ]}
        />

        {/* =================================================
            PAGE TITLE + SAVE FOR LATER NAVIGATION
        ================================================= */}

        <div className="flex flex-wrap items-center justify-between gap-3">

          <h1 className="font-sora text-[28px] font-extrabold text-ink">
            Shopping Cart
          </h1>

          <div className="flex items-center gap-3">

            <span className="text-[13.5px] text-ink-faint">
              {safeItems.length}{" "}
              {safeItems.length === 1
                ? "Item"
                : "Items"}{" "}
              in your cart
            </span>

            {/* SAVE FOR LATER NAVIGATION */}

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById(
                    "save-for-later"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              }}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-navy
                px-3.5
                py-2
                text-[12px]
                font-bold
                text-navy
                transition-colors
                hover:bg-navy
                hover:text-white
                focus:outline-none
                focus:ring-2
                focus:ring-navy/20
              "
            >
              <ShoppingBag
                size={14}
              />

              Save for Later

              {saveForLaterItems.length >
                0 && (
                <span
                  className="
                    min-w-[20px]
                    rounded-full
                    bg-navy
                    px-1.5
                    py-0.5
                    text-center
                    text-[9px]
                    font-bold
                    text-white
                  "
                >
                  {
                    saveForLaterItems.length
                  }
                </span>
              )}
            </button>
          </div>
        </div>

        {/* =================================================
            CONTENT GRID
        ================================================= */}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">

          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="flex min-w-0 flex-col gap-5">

            {/* =================================================
                CART ITEMS
            ================================================= */}

            {safeItems.map(
              (item) => (
                <CartItemCard
                  key={String(
                    item.product.id
                  )}
                  line={item}
                  onQtyChange={
                    handleQtyChange
                  }
                  onRemove={
                    handleRemove
                  }
                />
              )
            )}

            {/* =================================================
                EMPTY CART
            ================================================= */}

            {safeItems.length === 0 && (
              <div className="rounded-card border border-line bg-white p-10 text-center">

                <div className="text-[16px] font-bold text-ink">
                  Your cart is empty.
                </div>

                <p className="mt-2 text-[13px] text-ink-soft">
                  Add some products to
                  your cart to continue
                  shopping.
                </p>

              </div>
            )}

            {/* =================================================
                WHOLESALE SAVINGS
            ================================================= */}

            {safeItems.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-green/25 bg-green/10 p-5">

                <div className="flex items-center gap-3">

                  <CheckCircle2
                    size={26}
                    className="shrink-0 text-green"
                    aria-hidden="true"
                  />

                  <div>

                    <div className="text-[14.5px] font-bold text-ink">
                      Congratulations!
                      You qualify for
                      wholesale pricing.
                    </div>

                    <div className="text-[12.5px] text-ink-soft">
                      You are saving ₹
                      {savingsOnOrder.toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits: 2,
                        }
                      )}{" "}
                      on this order as an
                      enterprise partner.
                    </div>

                  </div>
                </div>

                <button
                  type="button"
                  className="whitespace-nowrap rounded-lg border border-navy px-4 py-2.5 text-[13px] font-bold text-navy transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  View Business Pricing
                </button>

              </div>
            )}

            {/* =================================================
                FREQUENTLY BOUGHT TOGETHER
            ================================================= */}

            <CartFrequentlyBoughtTogether />

            {/* =================================================
                SAVE FOR LATER
            ================================================= */}

            <section
              id="save-for-later"
              aria-labelledby="save-for-later-title"
              className="scroll-mt-6"
            >

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">

                <div>
                  <h2
                    id="save-for-later-title"
                    className="font-sora text-[20px] font-extrabold text-ink"
                  >
                    Save for Later
                  </h2>

                  <p className="mt-1 text-[12px] text-ink-soft">
                    Products you saved from
                    your cart.
                  </p>
                </div>

                {saveForLaterItems.length >
                  0 && (
                  <span className="text-[11px] font-semibold text-ink-faint">
                    {
                      saveForLaterItems.length
                    }{" "}
                    {saveForLaterItems.length ===
                    1
                      ? "product"
                      : "products"}
                  </span>
                )}

              </div>

              {/* =================================================
                  NO SAVED PRODUCTS
              ================================================= */}

              {saveForLaterItems.length ===
              0 ? (
                <div className="rounded-card border border-dashed border-line bg-white px-6 py-10 text-center">

                  <ShoppingBag
                    size={28}
                    className="mx-auto text-ink-faint"
                  />

                  <h3 className="mt-3 text-[14px] font-bold text-ink">
                    No products saved for
                    later
                  </h3>

                  <p className="mt-1 text-[12px] text-ink-soft">
                    Products moved from your
                    cart using “Save for
                    Later” will appear here.
                  </p>

                </div>
              ) : (
                <div className="flex flex-col gap-3">

                  {saveForLaterItems.map(
                    (item) => {
                      const product =
                        item.product;

                      return (
                        <article
                          key={
                            product.id
                          }
                          className="
                            rounded-card
                            border
                            border-line
                            bg-white
                            p-4
                            transition-shadow
                            hover:shadow-pop
                          "
                        >

                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                            {/* PRODUCT IMAGE */}

                            <div
                              className="
                                flex
                                h-[90px]
                                w-full
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                sm:w-[110px]
                              "
                              style={{
                                background:
                                  `linear-gradient(
                                    160deg,
                                    ${product.swatch}22,
                                    ${product.swatch}0D
                                  )`,
                              }}
                              role="img"
                              aria-label={`${product.name} product preview`}
                            >

                              <div
                                className="h-14 w-10 rounded-md shadow-sm"
                                style={{
                                  background:
                                    `linear-gradient(
                                      160deg,
                                      ${product.swatch},
                                      ${product.accent}
                                    )`,
                                }}
                              />

                            </div>

                            {/* PRODUCT DETAILS */}

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2">

                                {product.brand && (
                                  <span className="text-[10.5px] font-bold tracking-wide text-navy">
                                    {
                                      product.brand
                                    }
                                  </span>
                                )}

                                {product.sku && (
                                  <>
                                    <span
                                      className="text-ink-faint"
                                      aria-hidden="true"
                                    >
                                      |
                                    </span>

                                    <span className="text-[10.5px] text-ink-faint">
                                      SKU:{" "}
                                      {
                                        product.sku
                                      }
                                    </span>
                                  </>
                                )}

                              </div>

                              <h3 className="mt-1 text-[14px] font-bold leading-snug text-ink">
                                {
                                  product.name
                                }
                              </h3>

                              {product.pack && (
                                <p className="mt-1 text-[11.5px] text-ink-soft">
                                  {
                                    product.pack
                                  }
                                </p>
                              )}

                              <div className="mt-2 flex flex-wrap items-center gap-3">

                                <span className="text-[13px] font-bold text-navy">
                                  ₹
                                  {safeNumber(
                                    product.price
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </span>

                                <span className="text-[10.5px] text-ink-faint">
                                  Qty:{" "}
                                  {
                                    item.qty
                                  }
                                </span>

                                {product.dispatch && (
                                  <span className="text-[10.5px] font-semibold text-green">
                                    Dispatch:{" "}
                                    {
                                      product.dispatch
                                    }
                                  </span>
                                )}

                              </div>

                            </div>

                            {/* ACTIONS */}

                            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">

                              <button
                                type="button"
                                onClick={() =>
                                  handleMoveSavedItemToCart(
                                    product.id
                                  )
                                }
                                className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  gap-1.5
                                  rounded-lg
                                  bg-green
                                  px-4
                                  py-2.5
                                  text-[11px]
                                  font-bold
                                  text-white
                                  transition-colors
                                  hover:bg-green-deep
                                  focus:outline-none
                                  focus:ring-2
                                  focus:ring-green/20
                                "
                              >
                                <ArrowRight
                                  size={13}
                                />

                                Move to Cart
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveSavedItem(
                                    product.id
                                  )
                                }
                                className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  gap-1.5
                                  rounded-lg
                                  border
                                  border-line
                                  px-4
                                  py-2.5
                                  text-[11px]
                                  font-semibold
                                  text-ink-soft
                                  transition-colors
                                  hover:border-red-200
                                  hover:bg-red-50
                                  hover:text-red-600
                                "
                              >
                                <Trash2
                                  size={13}
                                />

                                Remove
                              </button>

                            </div>

                          </div>
                        </article>
                      );
                    }
                  )}

                </div>
              )}

            </section>
          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <div className="flex flex-col gap-5">

            <OrderSummary
              items={safeItems}
            />

            <CartTrustBadges />

          </div>
        </div>

        {/* =================================================
            NEWSLETTER
        ================================================= */}

        <section
          aria-labelledby="newsletter-title"
          className="rounded-card bg-navy px-6 py-10 text-center text-white"
        >

          <h2
            id="newsletter-title"
            className="font-sora text-[24px] font-extrabold sm:text-[28px]"
          >
            Stay Updated with
            Wholesale Price Drops
          </h2>

          <p className="mx-auto mt-2 max-w-[520px] text-[13.5px] text-white/70">
            Subscribe to our weekly price
            index list and directly save on
            incoming grocery stock.
          </p>

          <form
            className="mx-auto mt-6 flex max-w-[560px] flex-col items-center justify-center gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              handleNewsletterSubmit();
            }}
            noValidate
          >

            <div className="w-full flex-1">

              <label
                htmlFor="newsletter-email"
                className="sr-only"
              >
                Business email address
              </label>

              <input
                id="newsletter-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={
                  newsletterEmail
                }
                onChange={(event) =>
                  handleNewsletterEmailChange(
                    event.target.value
                  )
                }
                maxLength={
                  MAX_EMAIL_LENGTH
                }
                placeholder="Enter your business email address..."
                aria-invalid={
                  newsletterError
                    ? "true"
                    : "false"
                }
                aria-describedby={
                  newsletterError
                    ? "newsletter-error"
                    : newsletterSuccess
                      ? "newsletter-success"
                      : undefined
                }
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-[13.5px] text-white outline-none transition placeholder:text-white/50 focus:border-white/50 focus:ring-2 focus:ring-white/20"
              />

              {newsletterError && (
                <div
                  id="newsletter-error"
                  role="alert"
                  className="mt-2 flex items-center gap-2 text-left text-[11px] text-red-200"
                >
                  <AlertCircle
                    size={14}
                    className="shrink-0"
                  />

                  <span>
                    {
                      newsletterError
                    }
                  </span>
                </div>
              )}

              {newsletterSuccess && (
                <div
                  id="newsletter-success"
                  role="status"
                  className="mt-2 flex items-center gap-2 text-left text-[11px] text-green-200"
                >
                  <CheckCircle2
                    size={14}
                    className="shrink-0"
                  />

                  <span>
                    Successfully
                    subscribed.
                  </span>
                </div>
              )}

            </div>

            <button
              type="submit"
              className="whitespace-nowrap rounded-lg bg-green px-6 py-3 text-[13.5px] font-bold text-white transition-colors hover:bg-green-deep focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              Subscribe
            </button>

          </form>
        </section>
      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />
    </div>
  );
}