"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  Package,
  Search,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Headphones,
  ChevronRight,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type OrderStatus =
  | "Order Placed"
  | "Processing"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered";

type TrackingInfo = {
  orderNumber: string;
  status: OrderStatus;
  product: string;
  address: string;
  estimatedDelivery: string;
};

/* =========================================================
   ORDER DATA
========================================================= */

const ORDER_DATA: Record<string, TrackingInfo> = {
  AZ10001: {
    orderNumber: "AZ10001",
    status: "Out for Delivery",
    product: "Your Aanzara order",
    address: "Delivery address confirmed",
    estimatedDelivery: "Today",
  },

  AZ10002: {
    orderNumber: "AZ10002",
    status: "Shipped",
    product: "Your Aanzara order",
    address: "Delivery address confirmed",
    estimatedDelivery: "Tomorrow",
  },

  AZ10003: {
    orderNumber: "AZ10003",
    status: "Delivered",
    product: "Your Aanzara order",
    address: "Delivered to your address",
    estimatedDelivery: "Delivered",
  },
};

/* =========================================================
   ORDER STEPS
========================================================= */

const ORDER_STEPS: OrderStatus[] = [
  "Order Placed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

/* =========================================================
   PAGE
========================================================= */

export default function OrdersDeliveryPage() {
  const router = useRouter();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [orderNumber, setOrderNumber] = useState("");
  const [tracking, setTracking] =
    useState<TrackingInfo | null>(null);
  const [error, setError] = useState("");

  /* =======================================================
     TRACK ORDER
  ======================================================= */

  const handleTrackOrder = () => {
    const value = orderNumber.trim().toUpperCase();

    if (!value) {
      setError("Please enter your order number.");
      setTracking(null);
      return;
    }

    const result = ORDER_DATA[value];

    if (!result) {
      setError(
        "Order not found. Try AZ10001, AZ10002 or AZ10003."
      );
      setTracking(null);
      return;
    }

    setError("");
    setTracking(result);
  };

  /* =======================================================
     GET STATUS STEP
  ======================================================= */

  const getStepState = (
    step: OrderStatus,
    status: OrderStatus
  ): "completed" | "pending" => {
    const currentIndex = ORDER_STEPS.indexOf(status);
    const stepIndex = ORDER_STEPS.indexOf(step);

    if (
      currentIndex >= 0 &&
      stepIndex >= 0 &&
      stepIndex <= currentIndex
    ) {
      return "completed";
    }

    return "pending";
  };

  /* =======================================================
     FOCUS SEARCH
  ======================================================= */

  const focusSearch = () => {
    searchInputRef.current?.focus();
  };

  /* =======================================================
     RENDER
  ======================================================= */

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
          Orders & Delivery
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
            TRACK ORDER
        ================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-[#D7E5FF]
            bg-[#F2F7FF]
            p-6
          "
        >
          {/* HEADING */}

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
              <Package
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
                Track Your Order
              </h2>

              <p
                className="
                  mt-1
                  text-[14px]
                  text-[#66748B]
                "
              >
                Check your order and delivery status.
              </p>
            </div>
          </div>

          {/* SEARCH */}

          <div
            className="
              mt-5
              flex
              min-h-[52px]
              items-center
              rounded-xl
              border
              border-[#D9E0E9]
              bg-white
              px-4
            "
          >
            <Search
              size={20}
              strokeWidth={1.8}
              className="
                mr-3
                shrink-0
                text-[#71839D]
              "
            />

            <input
              ref={searchInputRef}
              type="text"
              value={orderNumber}
              onChange={(event) => {
                setOrderNumber(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleTrackOrder();
                }
              }}
              placeholder="Enter order number"
              aria-label="Order number"
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
              onClick={handleTrackOrder}
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
              Track
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

          {/* DEMO HINT */}

          {!tracking && !error && (
            <p
              className="
                mt-3
                text-[12px]
                text-[#8090A6]
              "
            >
              Demo orders: AZ10001, AZ10002, AZ10003
            </p>
          )}
        </section>

        {/* =================================================
            TRACKING RESULT
        ================================================== */}

        {tracking && (
          <section className="mt-6">

            {/* ORDER SUMMARY */}

            <div
              className="
                rounded-2xl
                border
                border-[#DCE1E8]
                bg-white
                p-5
                shadow-sm
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
                    rounded-xl
                    bg-[#EEF5FF]
                  "
                >
                  <Package
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
                    {tracking.orderNumber}
                  </h3>
                </div>

                <span
                  className="
                    rounded-full
                    bg-[#EAF7EF]
                    px-3
                    py-1.5
                    text-[11px]
                    font-semibold
                    text-[#15803D]
                  "
                >
                  {tracking.status}
                </span>
              </div>

              {/* ORDER DETAILS */}

              <div
                className="
                  mt-5
                  grid
                  grid-cols-1
                  gap-3
                  sm:grid-cols-2
                "
              >
                {/* PRODUCT */}

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
                    Product
                  </p>

                  <p
                    className="
                      mt-1
                      text-[14px]
                      font-semibold
                      text-[#10265B]
                    "
                  >
                    {tracking.product}
                  </p>
                </div>

                {/* DELIVERY */}

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
                    Estimated Delivery
                  </p>

                  <p
                    className="
                      mt-1
                      text-[14px]
                      font-semibold
                      text-[#10265B]
                    "
                  >
                    {tracking.estimatedDelivery}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                TRACKING TIMELINE
            ================================================== */}

            <div
              className="
                mt-5
                rounded-2xl
                border
                border-[#DCE1E8]
                bg-white
                p-5
              "
            >
              <h2
                className="
                  text-[17px]
                  font-bold
                  text-[#10265B]
                "
              >
                Delivery Progress
              </h2>

              <div className="mt-6">

                {ORDER_STEPS.map(
                  (step, index) => {
                    const completed =
                      getStepState(
                        step,
                        tracking.status
                      ) === "completed";

                    const isLast =
                      index ===
                      ORDER_STEPS.length - 1;

                    return (
                      <div
                        key={step}
                        className="flex"
                      >
                        {/* TIMELINE ICON */}

                        <div
                          className="
                            flex
                            w-10
                            shrink-0
                            flex-col
                            items-center
                          "
                        >
                          {completed ? (
                            <CheckCircle2
                              size={23}
                              strokeWidth={2}
                              className="text-[#1769F5]"
                            />
                          ) : (
                            <Circle
                              size={23}
                              strokeWidth={1.8}
                              className="text-[#B8C3D1]"
                            />
                          )}

                          {!isLast && (
                            <div
                              className={`
                                my-1
                                h-10
                                w-[2px]
                                ${
                                  completed
                                    ? "bg-[#1769F5]"
                                    : "bg-[#E1E6ED]"
                                }
                              `}
                            />
                          )}
                        </div>

                        {/* TIMELINE TEXT */}

                        <div
                          className={`
                            pb-6
                            pl-3
                            ${
                              completed
                                ? "text-[#10265B]"
                                : "text-[#8997A9]"
                            }
                          `}
                        >
                          <p
                            className="
                              text-[14px]
                              font-semibold
                            "
                          >
                            {step}
                          </p>

                          {completed &&
                            isLast && (
                              <p
                                className="
                                  mt-1
                                  text-[12px]
                                  text-[#66748B]
                                "
                              >
                                Your order has been
                                delivered.
                              </p>
                            )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            DELIVERY HELP
        ================================================== */}

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
            Delivery Help
          </h2>

          <div className="mt-4 space-y-3">

            {/* DELIVERY STATUS */}

            <button
              type="button"
              onClick={focusSearch}
              className="
                flex
                w-full
                items-center
                rounded-xl
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
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EEF5FF]
                "
              >
                <Truck
                  size={24}
                  strokeWidth={1.8}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-4 flex-1">
                <h3
                  className="
                    font-semibold
                    text-[#10265B]
                  "
                >
                  Delivery Status
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    text-[#66748B]
                  "
                >
                  Check the latest delivery updates.
                </p>
              </div>

              <ChevronRight
                size={20}
                className="text-[#8A99AD]"
              />
            </button>

            {/* DELIVERY ADDRESS */}

            <button
              type="button"
              onClick={() => {
                alert(
                  "Your delivery address can be managed from your account."
                );
              }}
              className="
                flex
                w-full
                items-center
                rounded-xl
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
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EEF5FF]
                "
              >
                <MapPin
                  size={24}
                  strokeWidth={1.8}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-4 flex-1">
                <h3
                  className="
                    font-semibold
                    text-[#10265B]
                  "
                >
                  Delivery Address
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    text-[#66748B]
                  "
                >
                  Manage your delivery address.
                </p>
              </div>

              <ChevronRight
                size={20}
                className="text-[#8A99AD]"
              />
            </button>

            {/* DELIVERY TIME */}

            <button
              type="button"
              onClick={() => {
                alert(
                  "Delivery time depends on your location and order."
                );
              }}
              className="
                flex
                w-full
                items-center
                rounded-xl
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
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EEF5FF]
                "
              >
                <Clock
                  size={24}
                  strokeWidth={1.8}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-4 flex-1">
                <h3
                  className="
                    font-semibold
                    text-[#10265B]
                  "
                >
                  Delivery Time
                </h3>

                <p
                  className="
                    mt-1
                    text-[13px]
                    text-[#66748B]
                  "
                >
                  View available delivery information.
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
            ADDRESS INFORMATION
        ================================================== */}

        {tracking && (
          <section
            className="
              mt-5
              rounded-2xl
              border
              border-[#DCE1E8]
              bg-white
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
                  bg-[#EEF5FF]
                "
              >
                <MapPin
                  size={23}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-4">
                <p
                  className="
                    text-[12px]
                    text-[#7A899D]
                  "
                >
                  Delivery Address
                </p>

                <p
                  className="
                    mt-1
                    text-[14px]
                    font-semibold
                    text-[#10265B]
                  "
                >
                  {tracking.address}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            SUPPORT
        ================================================== */}

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
                Need help with your order?
              </h3>

              <p
                className="
                  mt-1
                  text-[13px]
                  leading-5
                  text-[#66748B]
                "
              >
                Our support team can help you with
                delivery questions.
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