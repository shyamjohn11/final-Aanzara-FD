"use client";

import { useEffect, useState } from "react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";
import NewsletterCentered from "@/app/components/Dashboard/NewsletterCentered";

import CheckoutSteps from "@/app/components/Checkout/CheckoutSteps";

import DeliveryAddressSection from "@/app/components/Checkout/DeliveryAddressSection";

import DeliveryOptionsSection from "@/app/components/Checkout/DeliveryOptionsSection";

import BusinessPurchaseSection, {
  BusinessForm,
} from "@/app/components/Checkout/BusinessPurchaseSection";

import PaymentMethodSection from "@/app/components/Checkout/PaymentMethodSection";

import OrderNotesSection, {
  OrderNotesForm,
} from "@/app/components/Checkout/OrderNotesSection";

import CheckoutOrderSummary, {
  readCheckoutDraft,
} from "@/app/components/Checkout/CheckoutOrderSummary";

import { useCart } from "@/app/context/cartcontext";

/* =========================================================
   CONSTANTS
========================================================= */

const MIN_QTY = 1;
const MAX_QTY = 999;

/* =========================================================
   SAFE NUMBER
========================================================= */

function safeNumber(
  value: unknown,
  fallback = 0
): number {
  const numberValue = Number(value);

  if (
    !Number.isFinite(numberValue) ||
    numberValue < 0
  ) {
    return fallback;
  }

  return numberValue;
}

/* =========================================================
   SAFE QUANTITY
========================================================= */

function safeQuantity(
  value: unknown
): number {
  const quantity = Number(value);

  if (
    !Number.isFinite(quantity) ||
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
   CHECKOUT PAGE
========================================================= */

export default function CheckoutPage() {
  /* =======================================================
     NAVIGATION
  ======================================================= */

  const [navOpen, setNavOpen] =
    useState(false);

  /* =======================================================
     PAYMENT STATE
  ======================================================= */

  const [paymentReady, setPaymentReady] =
    useState(false);

  const [
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  ] = useState("");

  /* =======================================================
     PAYMENT ERROR
  ======================================================= */

  const [paymentError, setPaymentError] =
    useState("");

  /* =======================================================
     DELIVERY ADDRESS STATE
  ======================================================= */

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState<string | null>(null);

  /* =======================================================
     ORDER NOTES STATE
  ======================================================= */

  const [orderNotes, setOrderNotes] =
    useState<OrderNotesForm>({
      notes: "",
      isGift: true,
      giftMessage: "",
    });

  /* =======================================================
     BUSINESS PURCHASE STATE
  ======================================================= */

  const [businessDetails, setBusinessDetails] =
    useState<BusinessForm>({
      companyName: "",
      gstNumber: "",
      poNumber: "",
      department: "",
      businessEmail: "",
      businessPhone: "",
    });

  /* =======================================================
     CART
  ======================================================= */

  const { items } = useCart();

  /* =======================================================
     RESTORE SAVED CHECKOUT DRAFT
  ======================================================= */

  useEffect(() => {
    const draft = readCheckoutDraft();

    if (!draft) {
      return;
    }

    if (
      typeof draft.selectedAddressId === "string" &&
      draft.selectedAddressId.trim().length > 0
    ) {
      setSelectedAddressId(draft.selectedAddressId);
    }

    if (
      typeof draft.selectedPaymentMethod ===
        "string" &&
      draft.selectedPaymentMethod.trim().length > 0
    ) {
      setSelectedPaymentMethod(
        draft.selectedPaymentMethod
      );

      if (draft.selectedPaymentMethod.trim()) {
        setPaymentReady(true);
      }
    }

    if (draft.businessDetails) {
      setBusinessDetails(draft.businessDetails);
    }

    if (draft.orderNotes) {
      setOrderNotes(draft.orderNotes);
    }
  }, []);

  /* =======================================================
     SAFE CART ITEMS

     IMPORTANT:
     Do not create a new CartLine type here.
     Keep the type returned by useCart().
  ======================================================= */

  const safeItems = Array.isArray(items)
    ? items.filter(
        (item) =>
          item &&
          item.product &&
          item.product.id !== undefined &&
          item.product.id !== null &&
          safeQuantity(item.qty) >= MIN_QTY
      )
    : [];

  /* =======================================================
     CART VALIDATION
  ======================================================= */

  const hasCartItems =
    safeItems.length > 0;

  /* =======================================================
     PAYMENT CALLBACK
  ======================================================= */

  const handlePaymentReady = (
    ready: boolean,
    method: string
  ) => {
    console.log(
      "Payment status:",
      ready,
      "Method:",
      method
    );

    /* -----------------------------------------------
       Reset previous payment error
    ----------------------------------------------- */

    setPaymentError("");

    /* -----------------------------------------------
       Validate ready value
    ----------------------------------------------- */

    const validReady =
      typeof ready === "boolean";

    /* -----------------------------------------------
       Validate payment method
    ----------------------------------------------- */

    const validMethod =
      typeof method === "string" &&
      method.trim().length > 0;

    /* -----------------------------------------------
       If payment is not ready
    ----------------------------------------------- */

    if (!validReady || !ready) {
      setPaymentReady(false);

      setSelectedPaymentMethod(
        validMethod
          ? method.trim()
          : ""
      );

      return;
    }

    /* -----------------------------------------------
       Payment is marked ready but method missing
    ----------------------------------------------- */

    if (!validMethod) {
      setPaymentReady(false);

      setSelectedPaymentMethod("");

      setPaymentError(
        "Please select a payment method before continuing."
      );

      return;
    }

    /* -----------------------------------------------
       Payment valid
    ----------------------------------------------- */

    setPaymentReady(true);

    setSelectedPaymentMethod(
      method.trim()
    );
  };

  /* =======================================================
     DELIVERY ADDRESS CALLBACK
  ======================================================= */

  const handleAddressSelected = (
    addressId: string | null
  ) => {
    setSelectedAddressId(
      typeof addressId === "string" &&
        addressId.trim().length > 0
        ? addressId.trim()
        : null
    );
  };

  /* =======================================================
     ORDER NOTES CALLBACK
  ======================================================= */

  const handleOrderNotesChange = (
    data: OrderNotesForm
  ) => {
    setOrderNotes(data);

    console.log(
      "Order notes updated:",
      data
    );
  };

  /* =======================================================
     BUSINESS PURCHASE CALLBACK
  ======================================================= */

  const handleBusinessDetailsChange = (
    data: BusinessForm
  ) => {
    setBusinessDetails(data);

    console.log(
      "Business details updated:",
      data
    );
  };

  /* =======================================================
     CHECKOUT VALIDATION STATUS
  ======================================================= */

  const checkoutPaymentValid =
    paymentReady &&
    typeof selectedPaymentMethod ===
      "string" &&
    selectedPaymentMethod.trim()
      .length > 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* =================================================
          TOP BAR
      ================================================= */}

      <TopBar />

      {/* =================================================
          HEADER
      ================================================= */}

      <Header
        onMenuClick={() =>
          setNavOpen(true)
        }
      />

      {/* =================================================
          MAIN NAVIGATION
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

      <main
        className="
          mx-auto
          flex
          w-full
          max-w-[1360px]
          flex-1
          flex-col
          gap-8
          px-4
          py-6
          sm:px-6
        "
      >

        {/* =================================================
            CHECKOUT STEPS
        ================================================= */}

        <CheckoutSteps />

        {/* =================================================
            EMPTY CART VALIDATION
        ================================================= */}

        {!hasCartItems && (
          <div
            role="alert"
            className="
              rounded-card
              border
              border-red-200
              bg-red-50
              px-5
              py-4
            "
          >
            <div
              className="
                text-[14px]
                font-bold
                text-red-700
              "
            >
              Your cart is empty.
            </div>

            <p
              className="
                mt-1
                text-[12px]
                text-red-600
              "
            >
              Please add at least one
              product to your cart before
              proceeding to checkout.
            </p>
          </div>
        )}

        {/* =================================================
            CHECKOUT GRID
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            items-start
            gap-6
            lg:grid-cols-[1fr_360px]
          "
        >

          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div
            className="
              flex
              min-w-0
              flex-col
              gap-5
            "
          >

            {/* =================================================
                DELIVERY ADDRESS
            ================================================= */}

            <section
              aria-label="Delivery address"
            >
              <DeliveryAddressSection
                onAddressSelected={
                  handleAddressSelected
                }
              />
            </section>

            {/* =================================================
                DELIVERY OPTIONS
            ================================================= */}

            <section
              aria-label="Delivery options"
            >
              <DeliveryOptionsSection />
            </section>

            {/* =================================================
                BUSINESS PURCHASE
            ================================================= */}

            <section
              aria-label="Business purchase information"
            >
              <BusinessPurchaseSection
                onChange={
                  handleBusinessDetailsChange
                }
              />
            </section>

            {/* =================================================
                PAYMENT METHOD
            ================================================= */}

            <section
              aria-label="Payment method"
            >
              <PaymentMethodSection
                onPaymentReady={
                  handlePaymentReady
                }
              />

              {/* PAYMENT ERROR */}

              {paymentError && (
                <div
                  role="alert"
                  className="
                    mt-3
                    rounded-lg
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-[12px]
                    text-red-600
                  "
                >
                  {paymentError}
                </div>
              )}
            </section>

            {/* =================================================
                ORDER NOTES
            ================================================= */}

            <section
              aria-label="Order notes"
            >
              <OrderNotesSection
                onChange={
                  handleOrderNotesChange
                }
              />
            </section>

          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <aside
            aria-label="Checkout order summary"
            className="
              flex
              min-w-0
              flex-col
              gap-5
            "
          >
            <CheckoutOrderSummary
              items={safeItems}

              paymentReady={
                checkoutPaymentValid
              }

              selectedPaymentMethod={
                selectedPaymentMethod
              }

              selectedAddressId={
                selectedAddressId
              }

              businessDetails={businessDetails}

              orderNotes={orderNotes}
            />
          </aside>

        </div>

        {/* =================================================
            NEWSLETTER
        ================================================= */}

        <section
          aria-label="Newsletter subscription"
        >
          <NewsletterCentered />
        </section>

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />

    </div>
  );
}