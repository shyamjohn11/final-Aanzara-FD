// File: app/components/Checkout/CheckoutOrderSummary.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  ShieldCheck,
  FileText,
  Lock,
  RotateCcw,
  Headset,
  X,
  MapPin,
} from "lucide-react";

import { CartLine } from "@/app/context/cartcontext";
import type { BusinessForm } from "@/app/components/Checkout/BusinessPurchaseSection";

import {
  checkoutApi,
  cartApi,
  contentApi,
  type CheckoutPaymentMethod,
  type ContentItem,
} from "@/app/api/services";
import {
  extractErrorMessage,
  hasSession,
} from "@/app/api/api";

import {
  CART_CONFIG,
  PAYMENT_METHODS,
} from "@/app/data/cartdata";
import {
  clearPendingCouponCode,
  computeCouponDiscount,
  loadStorefrontCoupons,
  readPendingCouponCode,
  validateCouponForSubtotal,
  writePendingCouponCode,
  type StorefrontCoupon,
} from "@/app/data/storefrontcoupons";
import { toast } from "react-toastify";

// =====================================================
// TYPES
// =====================================================

type Props = {
  items: CartLine[];
  paymentReady: boolean;
  selectedPaymentMethod: string;
  selectedAddressId?: string | null;
  businessDetails?: BusinessForm;
  orderNotes?: {
    notes: string;
    isGift: boolean;
    giftMessage: string;
  };
};

export const CHECKOUT_DRAFT_KEY =
  "aanzara_checkout_draft_v1";

export type CheckoutDraft = {
  selectedAddressId: string | null;
  selectedPaymentMethod: string;
  businessDetails?: BusinessForm;
  orderNotes?: {
    notes: string;
    isGift: boolean;
    giftMessage: string;
  };
  savedAt: string;
};

export function readCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(
      CHECKOUT_DRAFT_KEY
    );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      parsed === null
    ) {
      return null;
    }

    return parsed as CheckoutDraft;
  } catch {
    return null;
  }
}

// =====================================================
// PAYMENT METHODS
// =====================================================

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  upi: "UPI (Google Pay, PhonePe)",
  card: "Credit/Debit Card",
  netbanking: "Net Banking",
  cod: "Cash on Delivery",
  credit: "Business Credit",
  wallet: "Corporate Wallet",
};

// =====================================================
// NUMBER VALIDATION
// =====================================================

function safeNumber(
  value: unknown,
  fallback = 0
): number {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;

  return Number.isFinite(number)
    ? number
    : fallback;
}

// =====================================================
// NON-NEGATIVE NUMBER
// =====================================================

function safePositiveNumber(
  value: unknown,
  fallback = 0
): number {
  const number = safeNumber(value, fallback);

  return number >= 0
    ? number
    : fallback;
}

// =====================================================
// STRING VALIDATION
// =====================================================

function safeString(
  value: unknown,
  fallback = ""
): string {
  return typeof value === "string"
    ? value.trim()
    : fallback;
}

// =====================================================
// CART LINE VALIDATION
// =====================================================

function isValidCartLine(
  item: unknown
): item is CartLine {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return false;
  }

  const line =
    item as Partial<CartLine>;

  if (
    !line.product ||
    typeof line.product !== "object"
  ) {
    return false;
  }

  const product =
    line.product;

  const productId =
    safeString(product.id);

  const qty =
    safeNumber(line.qty, 0);

  const name =
    safeString(product.name);

  if (!productId) {
    return false;
  }

  if (!name) {
    return false;
  }

  if (
    !Number.isFinite(qty) ||
    qty <= 0
  ) {
    return false;
  }

  return true;
}

// =====================================================
// COMPONENT
// =====================================================

export default function CheckoutOrderSummary({
  items,
  paymentReady,
  selectedPaymentMethod,
  selectedAddressId,
  businessDetails,
  orderNotes,
}: Props) {
  const router = useRouter();

  const [
    couponApplied,
    setCouponApplied,
  ] = useState(false);

  const [
    couponInput,
    setCouponInput,
  ] = useState("");

  const [
    couponError,
    setCouponError,
  ] = useState("");

  const [
    appliedCouponDiscount,
    setAppliedCouponDiscount,
  ] = useState(0);

  const [
    appliedCouponCode,
    setAppliedCouponCode,
  ] = useState("");

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [trustItems, setTrustItems] = useState<
    { title: string; description: string }[]
  >([]);
  const [trustLoading, setTrustLoading] =
    useState<boolean>(true);
  const [trustError, setTrustError] =
    useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function loadTrust() {
      try {
        setTrustLoading(true);
        setTrustError("");

        const res = await contentApi.list(
          "checkout_trust",
        );

        const data = res.data as
          | ContentItem[]
          | { items: ContentItem[] };

        const rows: ContentItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];

        if (!mounted) {
          return;
        }

        const mapped = rows
          .map((row) => ({
            title:
              typeof row.title === "string"
                ? row.title.trim()
                : "",
            description:
              typeof row.description === "string"
                ? row.description.trim()
                : "",
          }))
          .filter(
            (item) =>
              item.title.length > 0 &&
              item.description.length > 0,
          );

        setTrustItems(mapped);
      } catch {
        if (!mounted) {
          return;
        }
        setTrustError(
          "Trust information could not be loaded.",
        );
      } finally {
        if (mounted) {
          setTrustLoading(false);
        }
      }
    }

    void loadTrust();

    return () => {
      mounted = false;
    };
  }, []);

  // ===================================================
  // SAFE CART
  // ===================================================

  const safeItems =
    Array.isArray(items)
      ? items.filter(isValidCartLine)
      : [];

  // ===================================================
  // TOTAL UNITS
  // ===================================================

  const totalUnits =
    safeItems.reduce(
      (sum, item) => {
        const qty =
          safeNumber(item.qty, 0);

        return (
          sum +
          Math.max(0, qty)
        );
      },
      0
    );

  // ===================================================
  // MRP TOTAL
  // ===================================================

  const mrpTotal =
    safeItems.reduce(
      (sum, item) => {
        const mrp =
          safePositiveNumber(
            item.product.mrp,
            0
          );

        const qty =
          Math.max(
            0,
            safeNumber(item.qty, 0)
          );

        return (
          sum +
          mrp * qty
        );
      },
      0
    );

  // ===================================================
  // ITEMS TOTAL
  // ===================================================

  const itemsTotal =
    safeItems.reduce(
      (sum, item) => {
        const qty =
          Math.max(
            0,
            safeNumber(item.qty, 0)
          );

        const normalPrice =
          safePositiveNumber(
            item.product.price,
            0
          );

        const bulkMoqRaw =
          safePositiveNumber(
            item.product.bulkMoq,
            999999
          );

        const bulkMoq =
          bulkMoqRaw > 0
            ? bulkMoqRaw
            : 999999;

        const bulkRate =
          safePositiveNumber(
            item.product.bulkRate,
            normalPrice
          );

        const unitPrice =
          qty >= bulkMoq
            ? bulkRate
            : normalPrice;

        return (
          sum +
          unitPrice * qty
        );
      },
      0
    );

  // ===================================================
  // WHOLESALE DISCOUNT
  // ===================================================

  const wholesaleDiscount =
    Math.max(
      0,
      mrpTotal - itemsTotal
    );

  // ===================================================
  // COUPON
  // Live public coupons (deals API) with local fallback math.
  // ===================================================

  const [liveCoupons, setLiveCoupons] = useState<
    StorefrontCoupon[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    loadStorefrontCoupons(50)
      .then((coupons) => {
        if (!cancelled) {
          setLiveCoupons(coupons);
        }
      })
      .catch(() => {
        // Static/fallback messaging in applyCoupon.
      });

    const pending = readPendingCouponCode();
    if (pending) {
      setCouponInput(pending);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      liveCoupons.length === 0 ||
      couponApplied ||
      !couponInput
    ) {
      return;
    }

    const pending = readPendingCouponCode();
    const target =
      pending || couponInput.trim().toUpperCase();
    if (!target) return;

    const match = liveCoupons.find(
      (coupon) => coupon.code === target
    );
    if (!match) return;

    void applyCouponCode(match.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCoupons, couponInput, couponApplied]);

  const couponDiscount = couponApplied
    ? Math.min(appliedCouponDiscount, itemsTotal)
    : 0;

  // ===================================================
  // SUBTOTAL
  // ===================================================

  const subtotal =
    Math.max(
      0,
      itemsTotal -
        wholesaleDiscount -
        couponDiscount
    );

  // ===================================================
  // GST
  // ===================================================

  const configuredGstRate =
    safeNumber(
      CART_CONFIG?.gstRate,
      0.18
    );

  const gstRate =
    configuredGstRate >= 0 &&
    configuredGstRate <= 1
      ? configuredGstRate
      : 0.18;

  const gstAmount =
    Math.round(
      subtotal * gstRate
    );

  // ===================================================
  // SHIPPING
  // ===================================================

  const shipping = 0;

  // ===================================================
  // HANDLING FEE
  // ===================================================

  const handlingFee =
    safePositiveNumber(
      CART_CONFIG?.handlingFee,
      0
    );

  // ===================================================
  // GRAND TOTAL
  // ===================================================

  const grandTotal =
    Math.max(
      0,
      subtotal +
        gstAmount +
        shipping +
        handlingFee
    );

  // ===================================================
  // TOTAL SAVINGS
  // ===================================================

  const totalSavings =
    Math.max(
      0,
      wholesaleDiscount +
        couponDiscount
    );

  // ===================================================
  // DELIVERY DATA
  // ===================================================

  const deliverTo =
    CART_CONFIG?.deliverTo;

  const deliveryCity =
    safeString(
      deliverTo?.city,
      "Delivery Address"
    );

  const deliveryRegion =
    safeString(
      deliverTo?.region
    );

  const deliveryEta =
    safeString(
      deliverTo?.eta,
      "To be confirmed"
    );

  // ===================================================
  // PAYMENT METHODS
  // ===================================================

  const staticPaymentMethods =
    Array.isArray(PAYMENT_METHODS)
      ? PAYMENT_METHODS.filter(
          (method): method is string =>
            typeof method === "string" &&
            method.trim().length > 0
        )
      : [];

  const availablePaymentMethods =
    staticPaymentMethods.length > 0
      ? staticPaymentMethods
      : Object.values(PAYMENT_METHOD_NAMES);

  // ===================================================
  // APPLY COUPON
  // ===================================================

  const applyCouponCode = async (rawCode: string) => {
    const enteredCode =
      safeString(rawCode).toUpperCase();

    setCouponError("");

    if (!enteredCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    const match = liveCoupons.find(
      (coupon) => coupon.code === enteredCode
    );

    if (!match) {
      setCouponApplied(false);
      setAppliedCouponDiscount(0);
      setAppliedCouponCode("");
      setCouponError(
        liveCoupons.length === 0
          ? "Coupons are currently unavailable."
          : "Invalid coupon code."
      );
      return;
    }

    const localError = validateCouponForSubtotal(
      match,
      itemsTotal
    );
    if (localError) {
      setCouponError(localError);
      return;
    }

    if (hasSession()) {
      try {
        const { data } = await cartApi.applyCoupon(
          enteredCode
        );
        const discount = Number(data?.discountTotal);
        setCouponApplied(true);
        setAppliedCouponCode(
          (data?.appliedCouponCode || enteredCode)
            .trim()
            .toUpperCase()
        );
        setAppliedCouponDiscount(
          Number.isFinite(discount) && discount > 0
            ? discount
            : computeCouponDiscount(match, itemsTotal)
        );
        setCouponInput("");
        setCouponError("");
        clearPendingCouponCode();
        return;
      } catch (error) {
        setCouponError(
          extractErrorMessage(
            error,
            "Unable to apply coupon. Please try again."
          )
        );
        return;
      }
    }

    setCouponApplied(true);
    setAppliedCouponCode(match.code);
    setAppliedCouponDiscount(
      computeCouponDiscount(match, itemsTotal)
    );
    setCouponInput("");
    setCouponError("");
    writePendingCouponCode(match.code);
  };

  const applyCoupon = () => {
    void applyCouponCode(couponInput);
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setAppliedCouponDiscount(0);
    setAppliedCouponCode("");
    setCouponInput("");
    setCouponError("");
    clearPendingCouponCode();

    if (hasSession()) {
      cartApi.removeCoupon().catch(() => {
        // Best-effort — UI already cleared.
      });
    }
  };

  // ===================================================
  // CONTINUE TO PAYMENT
  // ===================================================

  const handleContinueToPayment = async () => {
    // Prevent double click
    if (isProcessing) {
      return;
    }

    // -------------------------------------------------
    // CART VALIDATION
    // -------------------------------------------------

    if (safeItems.length === 0) {
      toast.error("Your cart is empty or contains invalid products.");

      router.push("/cart");
      return;
    }

    // -------------------------------------------------
    // PAYMENT READY
    // -------------------------------------------------

    if (!paymentReady) {
      toast.error("Please verify your payment method first.");
      return;
    }

    // -------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------

    if (!hasSession()) {
      toast.error("Please sign in to place your order.");

      router.push("/login");
      return;
    }

    // -------------------------------------------------
    // DELIVERY ADDRESS
    // -------------------------------------------------

    if (!selectedAddressId) {
      toast.error("Please select or save a delivery address first.");
      return;
    }

    // -------------------------------------------------
    // PAYMENT METHOD
    // -------------------------------------------------

    const selectedMethod =
      safeString(
        selectedPaymentMethod
      ).toLowerCase();

    if (!selectedMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    // -------------------------------------------------
    // BACKEND PAYMENT METHOD
    // -------------------------------------------------

    const METHOD_MAP: Record<string, CheckoutPaymentMethod> = {
      upi: "UPI",
      card: "Card",
      netbanking: "NetBanking",
      cod: "COD",
      wallet: "Wallet",
    };

    const backendMethod =
      METHOD_MAP[selectedMethod];

    if (!backendMethod) {
      toast.error(
        "Business Credit is not supported online yet. Please choose another payment method."
      );
      return;
    }

    // -------------------------------------------------
    // AVAILABLE PAYMENT METHOD
    // -------------------------------------------------

    const hasPaymentMethod =
      availablePaymentMethods.some(
        (method) =>
          method.trim().toLowerCase() ===
          selectedMethod
      );

    if (
      availablePaymentMethods.length > 0 &&
      !hasPaymentMethod &&
      !PAYMENT_METHOD_NAMES[selectedMethod]
    ) {
      toast.error("Selected payment method is not available.");
      return;
    }

    // -------------------------------------------------
    // PERSIST COUPON ON SERVER (authoritative place-order pricing)
    // -------------------------------------------------

    if (couponApplied && appliedCouponCode && hasSession()) {
      try {
        await cartApi.applyCoupon(appliedCouponCode);
      } catch {
        // Server will price without the coupon; UI already showed intent.
      }
    }

    // -------------------------------------------------
    // ORDER NUMBER
    // -------------------------------------------------

    const timestamp = Date.now();

    const orderNumber =
      `AZ${timestamp}`;

    // -------------------------------------------------
    // INVOICE NUMBER
    // -------------------------------------------------

    const invoiceNumber =
      `INV-${new Date().getFullYear()}-${String(
        timestamp
      ).slice(-6)}`;

    // -------------------------------------------------
    // PAYMENT METHOD NAME
    // -------------------------------------------------

    const paymentMethodName =
      PAYMENT_METHOD_NAMES[
        selectedMethod
      ] ||
      selectedMethod;

    // -------------------------------------------------
    // VERIFIED UPI
    // -------------------------------------------------

    let verifiedUpiId = "";

    if (selectedMethod === "upi") {
      try {
        verifiedUpiId =
          safeString(
            localStorage.getItem(
              "verifiedUpiId"
            )
          );
      } catch (error) {
        console.error(
          "Unable to read verified UPI ID:",
          error
        );
      }

      if (!verifiedUpiId) {
        toast.error("Please verify your UPI ID first.");
        return;
      }
    }

    // -------------------------------------------------
    // PAYMENT INITIATED TIME
    // -------------------------------------------------

    const paymentInitiatedAt =
      new Date().toISOString();

    // -------------------------------------------------
    // ORDER DATA
    // -------------------------------------------------

    const orderData = {
      // Order identification
      orderNumber,
      invoiceNumber,

      // Products
      items: safeItems,

      // Payment method
      paymentMethod:
        selectedMethod,

      paymentMethodName,

      // Payment details
      paymentDetails: {
        upiId:
          verifiedUpiId,
      },

      // Payment status
      paymentStatus:
        "Pending",

      paymentTime: "",

      paymentInitiatedAt,

      // Invoice
      invoiceStatus:
        "Generated",

      // Order status
      orderStatus:
        "Order Confirmed",

      // Order summary
      summary: {
        totalUnits,
        mrpTotal,
        itemsTotal,
        wholesaleDiscount,
        couponDiscount,

        couponCode:
          couponApplied
            ? appliedCouponCode
            : "",

        subtotal,
        gstRate,
        gstAmount,
        shipping,
        handlingFee,
        grandTotal,
        totalSavings,
      },

      // Delivery
      delivery: {
        city:
          deliveryCity,

        region:
          deliveryRegion,

        eta:
          deliveryEta,
      },

      // Business purchase
      businessPurchase: businessDetails
        ? {
            companyName: safeString(
              businessDetails.companyName
            ),
            gstNumber: safeString(
              businessDetails.gstNumber
            ).toUpperCase(),
            poNumber: safeString(
              businessDetails.poNumber
            ),
            department: safeString(
              businessDetails.department
            ),
            businessEmail: safeString(
              businessDetails.businessEmail
            ).toLowerCase(),
            businessPhone: safeString(
              businessDetails.businessPhone
            ),
          }
        : null,

      // Created time
      createdAt:
        new Date().toISOString(),
    };

    // -------------------------------------------------
    // SAVE ORDER
    // -------------------------------------------------

    try {
      setIsProcessing(true);

      // Totals are recomputed server-side from the
      // signed-in user's cart; the response is
      // authoritative for order number and grand total.
      const { data: placed } =
        await checkoutApi.placeOrder(
          selectedAddressId,
          backendMethod
        );

      const placedOrder = {
        ...orderData,

        orderId: placed.orderId,

        orderNumber:
          placed.orderNo || orderNumber,

        paymentId: placed.paymentId,

        paymentStatus:
          placed.paymentStatus || "Pending",

        paymentMethod:
          placed.paymentMethod ||
          backendMethod,

        summary: {
          ...orderData.summary,

          grandTotal:
            placed.grandTotal > 0
              ? placed.grandTotal
              : grandTotal,
        },
      };

      localStorage.setItem(
        "lastOrder",
        JSON.stringify(placedOrder)
      );
    } catch (error) {
      console.error(
        "Failed to place order:",
        error
      );

      setIsProcessing(false);

      toast.error("We couldn't place your order. Please try again.");

      return;
    }

    // -------------------------------------------------
    // GO TO PAYMENT
    // -------------------------------------------------

    router.push("/payment");
  };

  // ===================================================
  // SAVE & CONTINUE LATER
  // ===================================================

  const handleSaveAndContinueLater = () => {
    try {
      const draft: CheckoutDraft = {
        selectedAddressId:
          typeof selectedAddressId === "string" &&
          selectedAddressId.trim().length > 0
            ? selectedAddressId.trim()
            : null,
        selectedPaymentMethod:
          typeof selectedPaymentMethod === "string"
            ? selectedPaymentMethod.trim()
            : "",
        businessDetails,
        orderNotes,
        savedAt: new Date().toISOString(),
      };

      window.localStorage.setItem(
        CHECKOUT_DRAFT_KEY,
        JSON.stringify(draft)
      );

      toast.success(
        "Checkout progress saved. Continue anytime."
      );

      router.push("/cart");
    } catch (error) {
      console.error(
        "Failed to save checkout progress:",
        error
      );

      toast.error(
        "Could not save your progress. Please try again."
      );
    }
  };

  // ===================================================
  // EMPTY CART
  // ===================================================

  if (safeItems.length === 0) {
    return (
      <div className="bg-white border border-line rounded-card p-5 sticky top-4">
        <h2 className="font-sora font-bold text-[17px] text-ink">
          Order Summary
        </h2>

        <p className="text-[13px] text-ink-soft mt-3">
          Your cart is empty.
        </p>

        <button
          type="button"
          onClick={() =>
            router.push("/cart")
          }
          className="w-full bg-navy text-white font-bold py-3 rounded-lg mt-4"
        >
          Back to Cart
        </button>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="bg-white border border-line rounded-card p-5 sticky top-4">

      {/* =================================================
          TITLE
      ================================================== */}

      <h2 className="font-sora font-bold text-[17px] text-ink mb-4">
        Order Summary
      </h2>

      {/* =================================================
          PRODUCTS
      ================================================== */}

      <div className="flex flex-col gap-3 mb-4">
        {safeItems.map(
          (item, index) => {
            const product =
              item.product;

            const qty =
              Math.max(
                1,
                safeNumber(
                  item.qty,
                  1
                )
              );

            const normalPrice =
              safePositiveNumber(
                product.price,
                0
              );

            const bulkMoq =
              Math.max(
                1,
                safePositiveNumber(
                  product.bulkMoq,
                  999999
                )
              );

            const bulkRate =
              safePositiveNumber(
                product.bulkRate,
                normalPrice
              );

            const unitPrice =
              qty >= bulkMoq
                ? bulkRate
                : normalPrice;

            const lineTotal =
              unitPrice * qty;

            const productName =
              safeString(
                product.name,
                "Product"
              );

            const productImage =
              safeString(
                product.image
              );

            const productSwatch =
              safeString(
                product.swatch,
                "#f3e5bd"
              );

            return (
              <div
                key={`${safeString(
                  product.id,
                  `product-${index}`
                )}-${index}`}
                className="flex items-center gap-3"
              >

                {/* PRODUCT IMAGE */}

                <div
                  className="w-11 h-11 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      productSwatch,
                  }}
                >
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={productName}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <div
                      className="w-6 h-8 rounded-md"
                      style={{
                        background:
                          productSwatch,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* PRODUCT DETAILS */}

                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-ink leading-snug line-clamp-2">
                    {productName}
                  </div>

                  <div className="text-[10.5px] text-ink-faint">
                    Qty: {qty}
                  </div>
                </div>

                {/* AMOUNT */}

                <span className="text-[13px] font-bold text-ink shrink-0">
                  ₹
                  {lineTotal.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>
            );
          }
        )}
      </div>

      {/* =================================================
          PRICE DETAILS
      ================================================== */}

      <div className="border-t border-line pt-3 flex flex-col gap-2.5">

        <Row
          label={`Items Total (${totalUnits} items)`}
          value={`₹${itemsTotal.toLocaleString(
            "en-IN"
          )}`}
        />

        <Row
          label="Wholesale / Bulk Discount"
          value={`-₹${wholesaleDiscount.toLocaleString(
            "en-IN"
          )}`}
          positive
        />

        {couponApplied &&
          couponDiscount > 0 && (
            <Row
              label="Coupon Discount"
              value={`-₹${couponDiscount.toLocaleString(
                "en-IN"
              )}`}
              positive
            />
          )}

        <div className="border-t border-line my-1" />

        <Row
          label="Subtotal"
          value={`₹${subtotal.toLocaleString(
            "en-IN"
          )}`}
        />

        <Row
          label={`GST (${(
            gstRate * 100
          ).toFixed(0)}%)`}
          value={`₹${gstAmount.toLocaleString(
            "en-IN"
          )}`}
        />

        <Row
          label="Bulk Cargo Shipping"
          value="FREE"
          positive
        />

        <Row
          label="FMCG Safe Handling Fee"
          value={`₹${handlingFee.toLocaleString(
            "en-IN"
          )}`}
        />
      </div>

      {/* =================================================
          GRAND TOTAL
      ================================================== */}

      <div className="border-t border-line my-4" />

      <div className="flex items-center justify-between">
        <span className="font-sora font-bold text-[17px] text-ink">
          Grand Total
        </span>

        <span className="font-sora font-bold text-[22px] text-navy">
          ₹
          {grandTotal.toLocaleString(
            "en-IN"
          )}
        </span>
      </div>

      {/* =================================================
          SAVINGS
      ================================================== */}

      <div className="flex items-center gap-2 bg-green/10 text-green-deep font-semibold text-[12px] px-3 py-2 rounded-lg mt-3">
        <span aria-hidden="true">
          🎁
        </span>

        You save ₹
        {totalSavings.toLocaleString(
          "en-IN"
        )}{" "}
        on this order!
      </div>

      {/* =================================================
          COUPON
      ================================================== */}

      <div className="border-t border-line my-4" />

      <div>
        <span className="text-[12.5px] font-semibold text-ink">
          Apply Corporate Promo / Coupon
        </span>

        <div className="flex items-center gap-2 mt-2">

          <input
            value={couponInput}
            onChange={(event) => {
              setCouponInput(
                event.target.value
              );

              setCouponError("");
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                applyCoupon();
              }
            }}
            placeholder="Enter coupon code"
            maxLength={50}
            aria-label="Coupon code"
            aria-invalid={
              couponError
                ? "true"
                : "false"
            }
            className={`flex-1 border rounded-lg px-3 py-2.5 text-[12.5px] outline-none ${
              couponError
                ? "border-red-500"
                : "border-line focus:border-navy"
            }`}
          />

          <button
            type="button"
            onClick={applyCoupon}
            className="bg-navy hover:bg-navy-deep text-white text-[12px] font-bold px-4 py-2.5 rounded-lg"
          >
            Apply
          </button>
        </div>

        {couponError && (
          <p
            role="alert"
            className="text-[10.5px] text-red-600 mt-1.5"
          >
            {couponError}
          </p>
        )}

        <Link
          href="/offers"
          className="inline-block text-blue text-[12px] font-semibold hover:underline mt-2"
        >
          View Available Coupons
        </Link>

        {couponApplied &&
          appliedCouponCode && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 bg-paper border border-line text-[11px] font-semibold px-3 py-1.5 rounded-full">
                {appliedCouponCode}{" "}
                applied

                <button
                  type="button"
                  onClick={removeCoupon}
                  aria-label="Remove coupon"
                >
                  <X
                    size={12}
                    className="text-ink-faint hover:text-red-600"
                  />
                </button>
              </span>
            </div>
          )}
      </div>

      {/* =================================================
          DELIVERY
      ================================================== */}

      <div className="border-t border-line my-4" />

      <div className="flex items-start gap-2.5">

        <MapPin
          size={17}
          className="text-navy shrink-0 mt-0.5"
          aria-hidden="true"
        />

        <div className="text-[12px] text-ink-soft flex-1">

          <div className="flex items-center justify-between gap-3">

            <span className="font-semibold text-ink">
              Delivering to:{" "}
              {deliveryCity}
            </span>

            <button
              type="button"
              className="text-blue font-semibold text-[11px] shrink-0"
            >
              Change
            </button>
          </div>

          {deliveryRegion && (
            <div>
              {deliveryRegion}
            </div>
          )}

          <div className="text-green font-medium">
            Est. Delivery:{" "}
            {deliveryEta}
          </div>
        </div>
      </div>

      {/* =================================================
          ACCEPTED PAYMENT METHODS
      ================================================== */}

      <div className="border-t border-line my-4" />

      <div>
        <span className="text-[10px] font-semibold text-ink-faint tracking-wide">
          ACCEPTED PAYMENT METHODS
        </span>

        <div className="flex flex-wrap gap-2 mt-2">

          {availablePaymentMethods.length >
          0 ? (
            availablePaymentMethods.map(
              (method, index) => (
                <span
                  key={`${method}-${index}`}
                  className="border border-line text-[11px] text-ink-soft px-2.5 py-1 rounded-md"
                >
                  {method}
                </span>
              )
            )
          ) : (
            <span className="text-[11px] text-ink-faint">
              Payment methods unavailable.
            </span>
          )}

        </div>
      </div>

      {/* =================================================
          TRUST
      ================================================== */}

      <div className="border-t border-line my-4" />

      {trustLoading ? (
        <div
          className="text-[11px] text-ink-faint py-2"
          role="status"
          aria-live="polite"
        >
          Loading trust information...
        </div>
      ) : trustItems.length > 0 ? (
        <div className="flex flex-col gap-3">
          {trustItems.map((item, index) => {
            const Icon =
              [ShieldCheck, FileText, Lock, RotateCcw, Headset][
                index %
                  [ShieldCheck, FileText, Lock, RotateCcw, Headset]
                    .length
              ] ?? ShieldCheck;
            return (
              <TrustPoint
                key={`${item.title}-${index}`}
                icon={<Icon size={14} />}
                title={item.title}
                description={item.description}
              />
            );
          })}
          {trustError ? (
            <span className="sr-only" role="alert">
              {trustError}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3">

          <TrustPoint
            icon={
              <ShieldCheck size={14} />
            }
            title="Secure Payments"
            description="Your payment information is encrypted and protected."
          />

          <TrustPoint
            icon={
              <FileText size={14} />
            }
            title="GST Invoice"
            description="Get a GST invoice with every eligible order."
          />

          <TrustPoint
            icon={
              <Lock size={14} />
            }
            title="Safe & Secure"
            description="Your business and personal data remains protected."
          />

          <TrustPoint
            icon={
              <RotateCcw size={14} />
            }
            title="Easy Returns"
            description="Simple return and replacement process."
          />

          <TrustPoint
            icon={
              <Headset size={14} />
            }
            title="Customer Support"
            description="Our team is available to help with your order."
          />

        </div>
      )}

      {/* =================================================
          CONTINUE TO PAYMENT
      ================================================== */}

      <button
        type="button"
        disabled={
          !paymentReady ||
          isProcessing ||
          safeItems.length === 0
        }
        onClick={handleContinueToPayment}
        className={`w-full flex items-center justify-center gap-2 font-bold text-[14px] py-3 rounded-lg mt-5 transition-colors ${
          paymentReady &&
          !isProcessing &&
          safeItems.length > 0
            ? "bg-green hover:bg-green-deep text-white cursor-pointer"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Lock
          size={14}
          aria-hidden="true"
        />

        {isProcessing
          ? "Processing..."
          : paymentReady
            ? "Continue to Payment"
            : "Verify Payment Method First"}
      </button>

      {/* =================================================
          SAVE & CONTINUE
      ================================================== */}

      <button
        type="button"
        onClick={handleSaveAndContinueLater}
        className="w-full border border-line text-ink font-bold text-[13px] py-3 rounded-lg mt-3 hover:border-navy hover:text-navy"
      >
        Save & Continue Later
      </button>

      {/* =================================================
          BACK TO CART
      ================================================== */}

      <button
        type="button"
        onClick={() =>
          router.push("/cart")
        }
        className="w-full text-[12px] font-semibold text-blue hover:underline text-center mt-3"
      >
        Back to Cart
      </button>

      {/* =================================================
          SECURITY
      ================================================== */}

      <p className="flex items-center justify-center gap-1.5 text-[10.5px] text-ink-faint mt-4">
        <ShieldCheck
          size={11}
          aria-hidden="true"
        />

        Your data is fully encrypted and secure
      </p>

    </div>
  );
}

// =====================================================
// ROW
// =====================================================

function Row({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-[12.5px]">

      <span className="text-ink-soft">
        {label}
      </span>

      <span
        className={
          positive
            ? "font-semibold text-green-deep shrink-0"
            : "font-semibold text-ink shrink-0"
        }
      >
        {value}
      </span>

    </div>
  );
}

// =====================================================
// TRUST POINT
// =====================================================

function TrustPoint({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5">

      <span
        className="w-7 h-7 rounded-md bg-blue/10 text-blue flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        {icon}
      </span>

      <div>
        <div className="text-[11.5px] font-bold text-ink">
          {title}
        </div>

        <p className="text-[10px] text-ink-soft">
          {description}
        </p>
      </div>

    </div>
  );
}
