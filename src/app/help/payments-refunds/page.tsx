"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  X,
  CreditCard,
  CheckCircle2,
  RefreshCcw,
  AlertCircle,
  Search,
  Clock,
  IndianRupee,
  ChevronRight,
  Headphones,
} from "lucide-react";

type PaymentStatus = {
  orderNumber: string;
  amount: string;
  method: string;
  status: "Successful" | "Failed" | "Refunded" | "Processing";
  date: string;
};

/* =========================================================
   DEMO PAYMENT DATA
========================================================= */

const PAYMENT_DATA: Record<string, PaymentStatus> = {
  AZ10001: {
    orderNumber: "AZ10001",
    amount: "₹2,499",
    method: "Online Payment",
    status: "Successful",
    date: "Today",
  },

  AZ10002: {
    orderNumber: "AZ10002",
    amount: "₹1,799",
    method: "Online Payment",
    status: "Processing",
    date: "Today",
  },

  AZ10003: {
    orderNumber: "AZ10003",
    amount: "₹999",
    method: "Online Payment",
    status: "Refunded",
    date: "Yesterday",
  },

  AZ10004: {
    orderNumber: "AZ10004",
    amount: "₹3,499",
    method: "Online Payment",
    status: "Failed",
    date: "Yesterday",
  },
};

/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
  status: PaymentStatus["status"]
): string {
  switch (status) {
    case "Successful":
      return "bg-[#EAF7EF] text-[#15803D]";

    case "Refunded":
      return "bg-[#EEF5FF] text-[#1769F5]";

    case "Processing":
      return "bg-[#FFF7E6] text-[#B7791F]";

    case "Failed":
      return "bg-[#FFF0F0] text-[#DC2626]";

    default:
      return "bg-[#F3F4F6] text-[#475569]";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function PaymentsRefundsPage() {
  const router = useRouter();

  const [orderNumber, setOrderNumber] = useState("");
  const [payment, setPayment] =
    useState<PaymentStatus | null>(null);
  const [error, setError] = useState("");

  /* =======================================================
     PAYMENT LOOKUP
  ======================================================= */

  const handleCheckPayment = () => {
    const value = orderNumber.trim().toUpperCase();

    if (!value) {
      setError("Please enter your order number.");
      setPayment(null);
      return;
    }

    const result = PAYMENT_DATA[value];

    if (!result) {
      setError(
        "Payment details not found. Try AZ10001, AZ10002, AZ10003 or AZ10004."
      );
      setPayment(null);
      return;
    }

    setError("");
    setPayment(result);
  };

  /* =======================================================
     QUICK PAYMENT SELECT
  ======================================================= */

  const selectPayment = (order: string) => {
    const result = PAYMENT_DATA[order];

    if (!result) return;

    setOrderNumber(order);
    setError("");
    setPayment(result);
  };

  return (
    <main className="min-h-[100dvh] bg-white text-[#122858]">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header
        className="
          flex
          h-[76px]
          items-center
          border-b
          border-[#E5E7EB]
          px-5
          sm:px-8
        "
      >
        {/* BACK */}

        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-full
            transition
            hover:bg-[#F5F8FC]
          "
        >
          <ArrowLeft
            size={27}
            strokeWidth={1.8}
          />
        </button>

        {/* TITLE */}

        <h1
          className="
            flex-1
            px-3
            text-[22px]
            font-bold
            text-[#10265B]
            sm:text-[25px]
          "
        >
          Payments & Refunds
        </h1>

        {/* CLOSE */}

        <button
          type="button"
          onClick={() => router.push("/help")}
          aria-label="Close"
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-full
            transition
            hover:bg-[#F5F8FC]
          "
        >
          <X
            size={25}
            strokeWidth={1.8}
          />
        </button>
      </header>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-[900px]
          px-5
          py-6
          sm:px-8
        "
      >

        {/* =================================================
            INTRO
        ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-[#D7E5FF]
            bg-[#F2F7FF]
            p-6
          "
        >
          <div className="flex items-center">

            <div
              className="
                mr-4
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#E1EDFF]
              "
            >
              <CreditCard
                size={31}
                strokeWidth={1.8}
                className="text-[#1769F5]"
              />
            </div>

            <div>
              <h2
                className="
                  text-[20px]
                  font-bold
                  text-[#10265B]
                "
              >
                Payment Help
              </h2>

              <p
                className="
                  mt-1
                  text-[14px]
                  text-[#66748B]
                "
              >
                Get help with payments and refunds.
              </p>
            </div>

          </div>
        </section>

        {/* =================================================
            CHECK PAYMENT
        ================================================= */}

        <section
          className="
            mt-6
            rounded-2xl
            border
            border-[#DCE1E8]
            bg-white
            p-5
          "
        >
          <h2
            className="
              text-[16px]
              font-bold
              text-[#10265B]
            "
          >
            Check Payment Status
          </h2>

          <p
            className="
              mt-1
              text-[13px]
              text-[#66748B]
            "
          >
            Enter your order number to check payment or refund
            status.
          </p>

          <div
            className="
              mt-4
              flex
              min-h-[52px]
              items-center
              rounded-xl
              border
              border-[#D9E0E9]
              bg-[#F8FAFC]
              px-4
            "
          >
            <Search
              size={20}
              strokeWidth={1.8}
              className="mr-3 shrink-0 text-[#71839D]"
            />

            <input
              type="text"
              value={orderNumber}
              onChange={(event) => {
                setOrderNumber(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleCheckPayment();
                }
              }}
              placeholder="Enter order number"
              aria-label="Enter order number"
              autoComplete="off"
              className="
                min-w-0
                flex-1
                bg-transparent
                text-[14px]
                text-[#10265B]
                outline-none
                placeholder:text-[#8A99AD]
              "
            />

            <button
              type="button"
              onClick={handleCheckPayment}
              className="
                ml-3
                shrink-0
                rounded-lg
                bg-[#1769F5]
                px-4
                py-2
                text-[13px]
                font-semibold
                text-white
                transition
                hover:bg-[#0F5BDE]
              "
            >
              Check
            </button>
          </div>

          {/* ERROR */}

          {error && (
            <p
              role="alert"
              className="
                mt-3
                text-[13px]
                font-medium
                text-[#DC2626]
              "
            >
              {error}
            </p>
          )}

          {/* DEMO */}

          {!payment && !error && (
            <p
              className="
                mt-3
                text-[12px]
                text-[#8090A6]
              "
            >
              Demo orders: AZ10001, AZ10002, AZ10003, AZ10004
            </p>
          )}
        </section>

        {/* =================================================
            PAYMENT RESULT
        ================================================= */}

        {payment && (
          <section
            className="
              mt-6
              rounded-2xl
              border
              border-[#DCE1E8]
              bg-white
              p-5
              shadow-sm
            "
          >
            {/* RESULT HEADER */}

            <div className="flex items-center">

              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#EEF5FF]
                "
              >
                <IndianRupee
                  size={25}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-4 flex-1">

                <p
                  className="
                    text-[12px]
                    text-[#7A899D]
                  "
                >
                  Order Number
                </p>

                <h3
                  className="
                    mt-1
                    text-[17px]
                    font-bold
                    text-[#10265B]
                  "
                >
                  {payment.orderNumber}
                </h3>

              </div>

              <span
                className={`
                  rounded-full
                  px-3
                  py-1.5
                  text-[11px]
                  font-semibold
                  ${getStatusClass(payment.status)}
                `}
              >
                {payment.status}
              </span>

            </div>

            {/* PAYMENT DETAILS */}

            <div
              className="
                mt-5
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-3
              "
            >

              {/* AMOUNT */}

              <div
                className="
                  rounded-xl
                  bg-[#F8FAFC]
                  p-4
                "
              >
                <p
                  className="
                    text-[11px]
                    uppercase
                    tracking-wide
                    text-[#7A899D]
                  "
                >
                  Amount
                </p>

                <p
                  className="
                    mt-1
                    text-[15px]
                    font-bold
                    text-[#10265B]
                  "
                >
                  {payment.amount}
                </p>
              </div>

              {/* METHOD */}

              <div
                className="
                  rounded-xl
                  bg-[#F8FAFC]
                  p-4
                "
              >
                <p
                  className="
                    text-[11px]
                    uppercase
                    tracking-wide
                    text-[#7A899D]
                  "
                >
                  Method
                </p>

                <p
                  className="
                    mt-1
                    text-[14px]
                    font-semibold
                    text-[#10265B]
                  "
                >
                  {payment.method}
                </p>
              </div>

              {/* DATE */}

              <div
                className="
                  rounded-xl
                  bg-[#F8FAFC]
                  p-4
                "
              >
                <p
                  className="
                    text-[11px]
                    uppercase
                    tracking-wide
                    text-[#7A899D]
                  "
                >
                  Date
                </p>

                <p
                  className="
                    mt-1
                    text-[14px]
                    font-semibold
                    text-[#10265B]
                  "
                >
                  {payment.date}
                </p>
              </div>

            </div>
          </section>
        )}

        {/* =================================================
            PAYMENT HELP OPTIONS
        ================================================= */}

        <section className="mt-8">

          <h2
            className="
              text-[15px]
              font-medium
              uppercase
              tracking-wide
              text-[#66748B]
            "
          >
            Payment Help
          </h2>

          <div className="mt-4 space-y-3">

            {/* SUCCESSFUL */}

            <button
              type="button"
              onClick={() => selectPayment("AZ10001")}
              className="
                flex
                w-full
                items-center
                rounded-2xl
                border
                border-[#DCE1E8]
                p-5
                text-left
                transition
                hover:border-[#BFD4F8]
                hover:bg-[#FAFCFF]
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EEF5FF]
                "
              >
                <CheckCircle2
                  size={25}
                  strokeWidth={1.8}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-4 flex-1">

                <h3
                  className="
                    font-bold
                    text-[#10265B]
                  "
                >
                  Payment Successful
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    leading-5
                    text-[#66748B]
                  "
                >
                  Get help if your payment was completed
                  successfully.
                </p>

              </div>

              <ChevronRight
                size={20}
                className="text-[#8A99AD]"
              />
            </button>

            {/* PROCESSING */}

            <button
              type="button"
              onClick={() => selectPayment("AZ10002")}
              className="
                flex
                w-full
                items-center
                rounded-2xl
                border
                border-[#DCE1E8]
                p-5
                text-left
                transition
                hover:border-[#BFD4F8]
                hover:bg-[#FAFCFF]
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#FFF7E6]
                "
              >
                <Clock
                  size={25}
                  strokeWidth={1.8}
                  className="text-[#B7791F]"
                />
              </div>

              <div className="ml-4 flex-1">

                <h3
                  className="
                    font-bold
                    text-[#10265B]
                  "
                >
                  Payment Processing
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    leading-5
                    text-[#66748B]
                  "
                >
                  Check a payment that is still being processed.
                </p>

              </div>

              <ChevronRight
                size={20}
                className="text-[#8A99AD]"
              />
            </button>

            {/* FAILED */}

            <button
              type="button"
              onClick={() => selectPayment("AZ10004")}
              className="
                flex
                w-full
                items-center
                rounded-2xl
                border
                border-[#DCE1E8]
                p-5
                text-left
                transition
                hover:border-[#BFD4F8]
                hover:bg-[#FAFCFF]
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#FFF1F1]
                "
              >
                <AlertCircle
                  size={25}
                  strokeWidth={1.8}
                  className="text-[#DC2626]"
                />
              </div>

              <div className="ml-4 flex-1">

                <h3
                  className="
                    font-bold
                    text-[#10265B]
                  "
                >
                  Payment Failed
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    leading-5
                    text-[#66748B]
                  "
                >
                  Find solutions for failed or declined
                  payments.
                </p>

              </div>

              <ChevronRight
                size={20}
                className="text-[#8A99AD]"
              />
            </button>

            {/* REFUND */}

            <button
              type="button"
              onClick={() => selectPayment("AZ10003")}
              className="
                flex
                w-full
                items-center
                rounded-2xl
                border
                border-[#DCE1E8]
                p-5
                text-left
                transition
                hover:border-[#BFD4F8]
                hover:bg-[#FAFCFF]
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EEF5FF]
                "
              >
                <RefreshCcw
                  size={25}
                  strokeWidth={1.8}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-4 flex-1">

                <h3
                  className="
                    font-bold
                    text-[#10265B]
                  "
                >
                  Refund Status
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    leading-5
                    text-[#66748B]
                  "
                >
                  Get information about your refund.
                </p>

              </div>

              <ChevronRight
                size={20}
                className="text-[#8A99AD]"
              />
            </button>

          </div>
        </section>

        {/* =================================================
            PROCESSING INFORMATION
        ================================================= */}

        {payment?.status === "Processing" && (
          <section
            className="
              mt-5
              rounded-2xl
              border
              border-[#F0DFB5]
              bg-[#FFFBF2]
              p-5
            "
          >
            <div className="flex items-start">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#FFF0C9]
                "
              >
                <Clock
                  size={23}
                  className="text-[#B7791F]"
                />
              </div>

              <div className="ml-4">

                <h3
                  className="
                    font-bold
                    text-[#10265B]
                  "
                >
                  Payment is being processed
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    leading-5
                    text-[#66748B]
                  "
                >
                  Your payment is currently being processed.
                  Please allow some time for the payment status
                  to be updated.
                </p>

              </div>

            </div>
          </section>
        )}

        {/* =================================================
            REFUND INFORMATION
        ================================================= */}

        {payment?.status === "Refunded" && (
          <section
            className="
              mt-5
              rounded-2xl
              border
              border-[#D7E5FF]
              bg-[#F2F7FF]
              p-5
            "
          >
            <div className="flex items-center">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#E1EDFF]
                "
              >
                <RefreshCcw
                  size={23}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-4">

                <h3
                  className="
                    font-bold
                    text-[#10265B]
                  "
                >
                  Refund Completed
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    leading-5
                    text-[#66748B]
                  "
                >
                  Your refund has been processed successfully.
                </p>

              </div>

            </div>

            <div
              className="
                mt-4
                flex
                items-center
                rounded-xl
                bg-white
                p-4
              "
            >
              <Clock
                size={21}
                className="mr-3 text-[#1769F5]"
              />

              <p
                className="
                  text-[13px]
                  leading-5
                  text-[#52627A]
                "
              >
                Depending on your payment provider, the refund
                may take some time to appear in your account.
              </p>
            </div>
          </section>
        )}

        {/* =================================================
            FAILED PAYMENT INFORMATION
        ================================================= */}

        {payment?.status === "Failed" && (
          <section
            className="
              mt-5
              rounded-2xl
              border
              border-[#F4D4D4]
              bg-[#FFF7F7]
              p-5
            "
          >
            <div className="flex items-center">

              <AlertCircle
                size={25}
                className="mr-3 shrink-0 text-[#DC2626]"
              />

              <div>

                <h3
                  className="
                    font-bold
                    text-[#10265B]
                  "
                >
                  Payment was not completed
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    leading-5
                    text-[#66748B]
                  "
                >
                  Please try again or use another payment method.
                </p>

              </div>

            </div>
          </section>
        )}

        {/* =================================================
            SUCCESS INFORMATION
        ================================================= */}

        {payment?.status === "Successful" && (
          <section
            className="
              mt-5
              rounded-2xl
              border
              border-[#D7E5FF]
              bg-[#F2F7FF]
              p-5
            "
          >
            <div className="flex items-center">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#E1EDFF]
                "
              >
                <CheckCircle2
                  size={23}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-4">

                <h3
                  className="
                    font-bold
                    text-[#10265B]
                  "
                >
                  Payment completed successfully
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    leading-5
                    text-[#66748B]
                  "
                >
                  Your payment was received successfully.
                </p>

              </div>

            </div>
          </section>
        )}

        {/* =================================================
            SUPPORT
        ================================================= */}

        <section
          className="
            mt-6
            rounded-2xl
            border
            border-[#D7E5FF]
            bg-[#F2F7FF]
            p-5
          "
        >
          <div className="flex items-center">

            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#E1EDFF]
              "
            >
              <Headphones
                size={25}
                className="text-[#1769F5]"
              />
            </div>

            <div className="ml-4 flex-1">

              <h3
                className="
                  text-[16px]
                  font-bold
                  text-[#10265B]
                "
              >
                Still need help?
              </h3>

              <p
                className="
                  mt-1
                  text-[13px]
                  leading-5
                  text-[#66748B]
                "
              >
                Our support team can help with payments and
                refunds.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/help/contact-support")
            }
            className="
              mt-5
              flex
              h-[46px]
              w-full
              items-center
              justify-center
              rounded-xl
              bg-[#1769F5]
              text-[14px]
              font-semibold
              text-white
              transition
              hover:bg-[#0F5BDE]
            "
          >
            Contact Support
          </button>
        </section>

      </div>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer
        className="
          mt-6
          border-t
          border-[#E5E7EB]
          px-5
          py-5
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-[900px]
            items-center
          "
        >
          <div
            className="
              mr-4
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#122858]
              text-white
            "
          >
            A
          </div>

          <p
            className="
              text-[14px]
              leading-6
              text-[#263B61]
            "
          >
            Aanzara — Shop More.
            <br />
            Live Better.
          </p>
        </div>
      </footer>

    </main>
  );
}