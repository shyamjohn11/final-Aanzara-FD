
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ordersApi } from "@/app/api/services";
import { useCart } from "@/app/context/cartcontext";
import {
  CheckCircle2,
  Lock,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  Loader2,
  AlertCircle,
} from "lucide-react";

type PaymentMethod =
  | "upi"
  | "card"
  | "netbanking"
  | "cod"
  | "credit"
  | "wallet";

type OrderItem = {
  qty?: number;
  product?: {
    id?: string | number;
    name?: string;
    price?: number;
  };
};

type OrderSummary = {
  totalUnits?: number;
  mrpTotal?: number;
  itemsTotal?: number;
  wholesaleDiscount?: number;
  couponDiscount?: number;
  couponCode?: string;
  subtotal?: number;
  gstRate?: number;
  gstAmount?: number;
  shipping?: number;
  handlingFee?: number;
  grandTotal?: number;
  totalSavings?: number;
};

type OrderData = {
  orderId?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  items?: OrderItem[];
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  summary?: OrderSummary;
  createdAt?: string;
  paidAt?: string;
};

const VALID_PAYMENT_METHODS: PaymentMethod[] = [
  "upi",
  "card",
  "netbanking",
  "cod",
  "credit",
  "wallet",
];

const VALID_PAYMENT_STATUSES = [
  "pending",
  "unpaid",
  "failed",
  "processing",
  "paid",
];

const BLOCKED_ORDER_STATUSES = [
  "cancelled",
  "canceled",
  "completed",
  "delivered",
];

export default function PaymentPage() {
  const router = useRouter();

  const { clearCart } = useCart();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [validationError, setValidationError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOAD ORDER
  // ==========================================

  useEffect(() => {
    let mounted = true;

    const loadOrder = () => {
      try {
        const savedOrder = localStorage.getItem("lastOrder");

        if (!savedOrder) {
          router.replace("/checkout");
          return;
        }

        let parsedOrder: OrderData;

        try {
          parsedOrder = JSON.parse(savedOrder);
        } catch (error) {
          console.error("Invalid order JSON:", error);

          localStorage.removeItem("lastOrder");
          router.replace("/checkout");
          return;
        }

        if (!parsedOrder || typeof parsedOrder !== "object") {
          localStorage.removeItem("lastOrder");
          router.replace("/checkout");
          return;
        }

        // Method comparisons on this page are
        // lowercase; normalize whatever the
        // checkout step stored ("COD" vs "cod").
        parsedOrder.paymentMethod =
          parsedOrder.paymentMethod
            ?.trim()
            .toLowerCase();

        if (mounted) {
          setOrder(parsedOrder);
          setLoading(false);
        }
      } catch (error) {
        console.error("Unable to load order:", error);

        if (mounted) {
          setValidationError(
            "Unable to load your order. Please return to checkout."
          );
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ==========================================
  // NORMALIZE PAYMENT METHOD
  // ==========================================

  const getNormalizedPaymentMethod = (): PaymentMethod | null => {
    const method = order?.paymentMethod
      ?.trim()
      .toLowerCase();

    if (!method) {
      return null;
    }

    if (
      VALID_PAYMENT_METHODS.includes(
        method as PaymentMethod
      )
    ) {
      return method as PaymentMethod;
    }

    return null;
  };

  // ==========================================
  // VALIDATE ORDER
  // ==========================================

  const validateOrder = (
    currentOrder: OrderData | null
  ): string | null => {
    if (!currentOrder) {
      return "Order information is missing.";
    }

    // Order number
    if (
      !currentOrder.orderNumber ||
      typeof currentOrder.orderNumber !== "string" ||
      !currentOrder.orderNumber.trim()
    ) {
      return "Order number is missing.";
    }

    // Invoice number
    if (
      !currentOrder.invoiceNumber ||
      typeof currentOrder.invoiceNumber !== "string" ||
      !currentOrder.invoiceNumber.trim()
    ) {
      return "Invoice number is missing.";
    }

    // Payment method
    const method =
      currentOrder.paymentMethod
        ?.trim()
        .toLowerCase();

    if (!method) {
      return "Please select a payment method.";
    }

    if (
      !VALID_PAYMENT_METHODS.includes(
        method as PaymentMethod
      )
    ) {
      return "The selected payment method is not supported.";
    }

    // Payment status
    const paymentStatus =
      currentOrder.paymentStatus
        ?.trim()
        .toLowerCase();

    if (
      paymentStatus &&
      !VALID_PAYMENT_STATUSES.includes(paymentStatus)
    ) {
      return "Invalid payment status.";
    }

    // Already paid
    if (
      paymentStatus === "paid" ||
      currentOrder.paidAt
    ) {
      return "This order has already been paid.";
    }

    // Order status
    const orderStatus =
      currentOrder.orderStatus
        ?.trim()
        .toLowerCase();

    if (
      orderStatus &&
      BLOCKED_ORDER_STATUSES.includes(orderStatus)
    ) {
      return `This order cannot be paid because it is ${currentOrder.orderStatus}.`;
    }

    // Items
    if (
      !Array.isArray(currentOrder.items) ||
      currentOrder.items.length === 0
    ) {
      return "Your order does not contain any items.";
    }

    // Validate every item
    for (
      let index = 0;
      index < currentOrder.items.length;
      index++
    ) {
      const item = currentOrder.items[index];

      if (!item || typeof item !== "object") {
        return `Order item ${index + 1} is invalid.`;
      }

      const qty = Number(item.qty);

      if (
        !Number.isFinite(qty) ||
        qty <= 0 ||
        !Number.isInteger(qty)
      ) {
        return `Invalid quantity for order item ${index + 1}.`;
      }

      const product = item.product;

      if (!product || typeof product !== "object") {
        return `Product information is missing for item ${index + 1}.`;
      }

      if (
        !product.id &&
        product.id !== 0
      ) {
        return `Product ID is missing for item ${index + 1}.`;
      }

      if (
        !product.name ||
        typeof product.name !== "string" ||
        !product.name.trim()
      ) {
        return `Product name is missing for item ${index + 1}.`;
      }

      const price = Number(product.price);

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        return `Invalid product price for item ${index + 1}.`;
      }
    }

    // Summary
    if (
      !currentOrder.summary ||
      typeof currentOrder.summary !== "object"
    ) {
      return "Order summary is missing.";
    }

    const grandTotal = Number(
      currentOrder.summary.grandTotal
    );

    if (
      !Number.isFinite(grandTotal) ||
      grandTotal <= 0
    ) {
      return "Invalid payment amount.";
    }

    // Validate subtotal if supplied
    if (
      currentOrder.summary.subtotal !== undefined
    ) {
      const subtotal = Number(
        currentOrder.summary.subtotal
      );

      if (
        !Number.isFinite(subtotal) ||
        subtotal < 0
      ) {
        return "Invalid subtotal.";
      }
    }

    // Validate GST if supplied
    if (
      currentOrder.summary.gstAmount !== undefined
    ) {
      const gst = Number(
        currentOrder.summary.gstAmount
      );

      if (
        !Number.isFinite(gst) ||
        gst < 0
      ) {
        return "Invalid GST amount.";
      }
    }

    // Validate shipping if supplied
    if (
      currentOrder.summary.shipping !== undefined
    ) {
      const shipping = Number(
        currentOrder.summary.shipping
      );

      if (
        !Number.isFinite(shipping) ||
        shipping < 0
      ) {
        return "Invalid delivery charge.";
      }
    }

    // Validate handling fee if supplied
    if (
      currentOrder.summary.handlingFee !== undefined
    ) {
      const handlingFee = Number(
        currentOrder.summary.handlingFee
      );

      if (
        !Number.isFinite(handlingFee) ||
        handlingFee < 0
      ) {
        return "Invalid handling fee.";
      }
    }

    return null;
  };

  // ==========================================
  // VALIDATE WHEN ORDER LOADS
  // ==========================================

  useEffect(() => {
    if (!order) {
      return;
    }

    const error = validateOrder(order);

    if (error) {
      setValidationError(error);
    } else {
      setValidationError("");
    }
  }, [order]);

  // ==========================================
  // PAYMENT METHOD ICON
  // ==========================================

  const getPaymentIcon = () => {
    const method =
      getNormalizedPaymentMethod();

    if (method === "upi") {
      return (
        <Smartphone
          size={22}
          className="text-navy"
        />
      );
    }

    if (method === "card") {
      return (
        <CreditCard
          size={22}
          className="text-navy"
        />
      );
    }

    if (method === "netbanking") {
      return (
        <Landmark
          size={22}
          className="text-navy"
        />
      );
    }

    if (
      method === "cod" ||
      method === "credit" ||
      method === "wallet"
    ) {
      return (
        <Wallet
          size={22}
          className="text-navy"
        />
      );
    }

    return (
      <Wallet
        size={22}
        className="text-navy"
      />
    );
  };

  // ==========================================
  // PAYMENT METHOD NAME
  // ==========================================

  const getPaymentName = () => {
    const method =
      getNormalizedPaymentMethod();

    switch (method) {
      case "upi":
        return "UPI";

      case "card":
        return "Credit / Debit Card";

      case "netbanking":
        return "Net Banking";

      case "cod":
        return "Cash on Delivery";

      case "credit":
        return "Business Credit";

      case "wallet":
        return "Corporate Wallet";

      default:
        return "Payment";
    }
  };

  // ==========================================
  // PROCESS PAYMENT
  // ==========================================

  const processPayment = () => {
    // Clear previous errors
    setPaymentError("");
    setValidationError("");

    // Prevent duplicate payment
    if (processing) {
      return;
    }

    // Validate order again immediately before payment
    const error = validateOrder(order);

    if (error) {
      setValidationError(error);
      return;
    }

    if (!order) {
      setValidationError(
        "Order information is unavailable."
      );
      return;
    }

    // Normalize payment method
    const method =
      getNormalizedPaymentMethod();

    if (!method) {
      setValidationError(
        "Please select a valid payment method."
      );
      return;
    }

    // Validate amount one more time
    const grandTotal = Number(
      order.summary?.grandTotal
    );

    if (
      !Number.isFinite(grandTotal) ||
      grandTotal <= 0
    ) {
      setPaymentError(
        "Unable to process payment because the payment amount is invalid."
      );
      return;
    }

    // COD does not require online payment processing
    if (method === "cod") {
      setProcessing(true);

      try {
        const updatedOrder: OrderData = {
          ...order,
          paymentStatus: "Pending",
          orderStatus: "Order Confirmed",
        };

        localStorage.setItem(
          "lastOrder",
          JSON.stringify(updatedOrder)
        );

        setOrder(updatedOrder);
        setProcessing(false);
        setSuccess(true);

        // The order is placed; the cart it
        // came from can now be emptied.
        Promise.resolve(clearCart()).catch(
          (cartError) => {
            console.warn(
              "Cart cleanup failed:",
              cartError
            );
          }
        );

        setTimeout(() => {
          router.push("/order-confirmation");
        }, 1200);
      } catch (error) {
        console.error(
          "COD order update failed:",
          error
        );

        setProcessing(false);
        setPaymentError(
          "Unable to confirm your order. Please try again."
        );
      }

      return;
    }

    // Start payment processing
    setProcessing(true);

    // Demo payment processing
    // Replace this section with Razorpay / payment API
    const paymentTimer = setTimeout(async () => {
      try {
        // Validate again before marking paid
        const finalValidation =
          validateOrder(order);

        if (finalValidation) {
          setProcessing(false);
          setValidationError(
            finalValidation
          );
          return;
        }

        const updatedOrder: OrderData = {
          ...order,

          paymentStatus: "Paid",

          orderStatus: "Order Confirmed",

          paidAt:
            new Date().toISOString(),
        };

        localStorage.setItem(
          "lastOrder",
          JSON.stringify(updatedOrder)
        );

        // The demo gateway succeeded; record
        // the payment on the backend order so
        // its status matches this screen.
        if (order.orderId) {
          try {
            await ordersApi.confirmPayment(
              order.orderId
            );
          } catch (confirmError) {
            console.warn(
              "Backend payment confirmation failed:",
              confirmError
            );
          }
        }

        setOrder(updatedOrder);

        setProcessing(false);

        setSuccess(true);

        // The order is placed; the cart it
        // came from can now be emptied.
        Promise.resolve(clearCart()).catch(
          (cartError) => {
            console.warn(
              "Cart cleanup failed:",
              cartError
            );
          }
        );

        setTimeout(() => {
          router.push(
            "/order-confirmation"
          );
        }, 1200);
      } catch (error) {
        console.error(
          "Payment processing failed:",
          error
        );

        setProcessing(false);

        setPaymentError(
          "Payment could not be completed. Please try again."
        );
      }
    }, 1800);

    return () => clearTimeout(paymentTimer);
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="text-center">
          <Loader2
            size={30}
            className="animate-spin text-navy mx-auto"
          />

          <p className="text-[13px] text-ink-soft mt-3">
            Loading payment details...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // GRAND TOTAL
  // ==========================================

  const grandTotal = Number(
    order.summary?.grandTotal || 0
  );

  // ==========================================
  // SUCCESS SCREEN
  // ==========================================

  if (success) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="w-full max-w-[480px] bg-white border border-line rounded-2xl p-8 text-center shadow-sm">

          <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center mx-auto">
            <CheckCircle2
              size={36}
              className="text-green"
            />
          </div>

          <h1 className="font-sora text-[22px] font-bold text-ink mt-5">
            {order.paymentMethod === "cod"
              ? "Order Confirmed"
              : "Payment Successful"}
          </h1>

          <p className="text-[13px] text-ink-soft mt-2">
            {order.paymentMethod === "cod"
              ? "Your order has been confirmed successfully."
              : "Your payment has been processed successfully."}
          </p>

          <div className="bg-paper rounded-lg p-4 mt-5 text-left">

            <div className="flex justify-between text-[12px] mb-2">
              <span className="text-ink-soft">
                Order Number
              </span>

              <span className="font-bold text-ink">
                {order.orderNumber}
              </span>
            </div>

            <div className="flex justify-between text-[12px] mb-2">
              <span className="text-ink-soft">
                Invoice Number
              </span>

              <span className="font-bold text-ink">
                {order.invoiceNumber}
              </span>
            </div>

            <div className="flex justify-between text-[12px]">
              <span className="text-ink-soft">
                {order.paymentMethod === "cod"
                  ? "Amount Due"
                  : "Amount Paid"}
              </span>

              <span className="font-bold text-green-deep">
                ₹
                {grandTotal.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>

          </div>

          <p className="text-[11px] text-ink-faint mt-4">
            Redirecting to your order confirmation...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================
  // PAYMENT PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-paper">

      {/* ======================================
          HEADER
      ======================================= */}

      <header className="bg-white border-b border-line">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4">

          <div className="flex items-center justify-between">

            <div>
              <h1 className="font-sora text-[20px] font-bold text-ink">
                Complete Payment
              </h1>

              <p className="text-[11.5px] text-ink-soft mt-1">
                Securely complete your order payment
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-green-deep text-[11px] font-semibold">
              <ShieldCheck size={16} />
              Secure Payment
            </div>

          </div>

        </div>
      </header>

      {/* ======================================
          CONTENT
      ======================================= */}

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ==================================
              LEFT
          =================================== */}

          <div className="bg-white border border-line rounded-card p-6">

            {/* VALIDATION ERROR */}

            {validationError && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                <AlertCircle
                  size={18}
                  className="text-red-600 shrink-0 mt-0.5"
                />

                <div>
                  <p className="text-[12px] font-bold text-red-700">
                    Payment Validation Error
                  </p>

                  <p className="text-[11px] text-red-600 mt-1">
                    {validationError}
                  </p>
                </div>

              </div>
            )}

            {/* PAYMENT ERROR */}

            {paymentError && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                <AlertCircle
                  size={18}
                  className="text-red-600 shrink-0 mt-0.5"
                />

                <div>
                  <p className="text-[12px] font-bold text-red-700">
                    Payment Failed
                  </p>

                  <p className="text-[11px] text-red-600 mt-1">
                    {paymentError}
                  </p>
                </div>

              </div>
            )}

            {/* PAYMENT METHOD */}

            <div className="flex items-center gap-3 mb-6">

              <div className="w-11 h-11 rounded-full bg-blue/10 flex items-center justify-center">
                {getPaymentIcon()}
              </div>

              <div>
                <h2 className="font-sora text-[16px] font-bold text-ink">
                  {getPaymentName()}
                </h2>

                <p className="text-[11px] text-ink-soft">
                  Payment method verified
                </p>
              </div>

              <CheckCircle2
                size={20}
                className="text-green ml-auto"
              />

            </div>

            {/* PAYMENT DETAILS */}

            <div className="bg-paper border border-line rounded-xl p-5">

              <h3 className="text-[13px] font-bold text-ink">
                Payment Details
              </h3>

              {order.paymentMethod === "upi" && (
                <div className="mt-4">

                  <p className="text-[11px] text-ink-soft">
                    Your UPI payment method has been verified.
                  </p>

                  <div className="mt-3 bg-white border border-line rounded-lg px-4 py-3">

                    <div className="text-[10px] text-ink-faint">
                      PAYMENT METHOD
                    </div>

                    <div className="text-[13px] font-bold text-ink mt-1">
                      UPI
                    </div>

                  </div>

                </div>
              )}

              {order.paymentMethod === "card" && (
                <div className="mt-4">
                  <p className="text-[11px] text-ink-soft">
                    Your card details have been verified securely.
                  </p>
                </div>
              )}

              {order.paymentMethod === "netbanking" && (
                <div className="mt-4">
                  <p className="text-[11px] text-ink-soft">
                    Your bank details have been verified.
                  </p>
                </div>
              )}

              {order.paymentMethod === "cod" && (
                <div className="mt-4">
                  <p className="text-[11px] text-ink-soft">
                    You selected Cash on Delivery.
                  </p>
                </div>
              )}

              {order.paymentMethod === "credit" && (
                <div className="mt-4">
                  <p className="text-[11px] text-ink-soft">
                    Your business credit account has been verified.
                  </p>
                </div>
              )}

              {order.paymentMethod === "wallet" && (
                <div className="mt-4">
                  <p className="text-[11px] text-ink-soft">
                    Your corporate wallet has been verified.
                  </p>
                </div>
              )}

            </div>

            {/* SECURITY */}

            <div className="flex items-start gap-3 mt-5">

              <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center shrink-0">

                <Lock
                  size={15}
                  className="text-green-deep"
                />

              </div>

              <div>

                <p className="text-[12px] font-bold text-ink">
                  Secure Payment
                </p>

                <p className="text-[10.5px] text-ink-soft mt-0.5">
                  Your payment information is encrypted and protected.
                </p>

              </div>

            </div>

            {/* PAY BUTTON */}

            <button
              type="button"
              disabled={
                processing ||
                Boolean(validationError) ||
                grandTotal <= 0
              }
              onClick={processPayment}
              className={`w-full mt-6 flex items-center justify-center gap-2 font-bold text-[14px] py-3.5 rounded-lg transition-colors ${
                processing ||
                Boolean(validationError) ||
                grandTotal <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green hover:bg-green-deep text-white"
              }`}
            >

              {processing ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  {order.paymentMethod === "cod"
                    ? "Confirming Order..."
                    : "Processing Payment..."}
                </>
              ) : (
                <>
                  <Lock size={15} />

                  {order.paymentMethod === "cod"
                    ? "Confirm Order"
                    : `Pay ₹${grandTotal.toLocaleString(
                        "en-IN"
                      )}`}
                </>
              )}

            </button>

            {/* BACK */}

            <button
              type="button"
              disabled={processing}
              onClick={() =>
                router.push("/checkout")
              }
              className="w-full text-[12px] font-semibold text-blue hover:underline mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to Checkout
            </button>

          </div>

          {/* ==================================
              RIGHT ORDER SUMMARY
          =================================== */}

          <div className="bg-white border border-line rounded-card p-5 sticky top-5">

            <h2 className="font-sora text-[16px] font-bold text-ink mb-4">
              Order Summary
            </h2>

            {/* ORDER NUMBER */}

            <div className="bg-paper rounded-lg p-3 mb-4">

              <div className="flex justify-between text-[11px]">

                <span className="text-ink-soft">
                  Order
                </span>

                <span className="font-bold text-ink">
                  {order.orderNumber}
                </span>

              </div>

              <div className="flex justify-between text-[11px] mt-2">

                <span className="text-ink-soft">
                  Invoice
                </span>

                <span className="font-bold text-ink">
                  {order.invoiceNumber}
                </span>

              </div>

            </div>

            {/* ITEMS */}

            <div className="flex flex-col gap-3">

              {order.items?.map(
                (item, index) => {

                  const qty = Number(
                    item.qty || 1
                  );

                  const price = Number(
                    item.product?.price || 0
                  );

                  return (
                    <div
                      key={
                        item.product?.id ??
                        `item-${index}`
                      }
                      className="flex items-center justify-between gap-3"
                    >

                      <div className="min-w-0">

                        <p className="text-[11.5px] font-semibold text-ink truncate">
                          {item.product?.name ||
                            "Product"}
                        </p>

                        <p className="text-[10px] text-ink-faint">
                          Qty: {qty}
                        </p>

                      </div>

                      <span className="text-[12px] font-bold text-ink">
                        ₹
                        {(
                          price * qty
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

            {/* TOTALS */}

            <div className="border-t border-line mt-4 pt-4 space-y-2">

              <SummaryRow
                label="Subtotal"
                value={
                  order.summary?.subtotal || 0
                }
              />

              <SummaryRow
                label="GST"
                value={
                  order.summary?.gstAmount || 0
                }
              />

              <SummaryRow
                label="Delivery"
                value={
                  order.summary?.shipping || 0
                }
              />

              <SummaryRow
                label="Handling Fee"
                value={
                  order.summary?.handlingFee || 0
                }
              />

            </div>

            {/* GRAND TOTAL */}

            <div className="border-t border-line mt-4 pt-4 flex items-center justify-between">

              <span className="font-bold text-[14px] text-ink">
                Grand Total
              </span>

              <span className="font-sora font-bold text-[20px] text-navy">
                ₹
                {grandTotal.toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

            {/* VALIDATION STATUS */}

            <div className="mt-4">

              {validationError ? (
                <div className="flex items-center gap-2 text-[10px] text-red-600">
                  <AlertCircle size={12} />
                  Order requires attention
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[10px] text-green-deep">
                  <CheckCircle2 size={12} />
                  Order details verified
                </div>
              )}

            </div>

            {/* SECURE */}

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-ink-faint mt-5">

              <ShieldCheck size={12} />

              Secure & encrypted payment

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

// ==========================================
// SUMMARY ROW
// ==========================================

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const numericValue = Number(value);

  return (
    <div className="flex items-center justify-between text-[11.5px]">

      <span className="text-ink-soft">
        {label}
      </span>

      <span className="font-semibold text-ink">
        ₹
        {(
          Number.isFinite(numericValue)
            ? numericValue
            : 0
        ).toLocaleString("en-IN")}
      </span>

    </div>
  );
}

