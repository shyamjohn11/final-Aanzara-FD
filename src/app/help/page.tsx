"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import MainNav from "@/app/MainNav";
import Footer from "@/app/components/Footer";

import {
  ArrowLeft,
  X,
  Search,
  Headphones,
  CircleHelp,
  Package,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

/* =========================================================
   HELP TOPICS
========================================================= */

const HELP_TOPICS = [
  {
    title: "FAQs",
    description: "Find answers to common questions",
    icon: CircleHelp,
    route: "/help/faq",
  },
  {
    title: "Orders & Delivery",
    description: "Track orders and delivery",
    icon: Package,
    route: "/help/orders-delivery",
  },
  {
    title: "Payments & Refunds",
    description: "Payment issues and refund help",
    icon: CreditCard,
    route: "/help/payments-refunds",
  },
  {
    title: "Contact Support",
    description: "Chat with our support team",
    icon: Headphones,
    route: "/contact",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function HelpPage() {
  const router = useRouter();

  const [navOpen, setNavOpen] = useState(false);
  const [search, setSearch] = useState("");

  /*
    IMPORTANT:
    Login page stores this value in sessionStorage.
  */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  /* =======================================================
     CHECK LOGIN STATUS
  ======================================================= */

  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn =
        sessionStorage.getItem("aanzara_logged_in") === "true";

      setIsLoggedIn(loggedIn);
      setAuthChecked(true);
    };

    checkLoginStatus();

    const handleStorage = () => {
      checkLoginStatus();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  /* =======================================================
     FILTER TOPICS
  ======================================================= */

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return HELP_TOPICS;
    }

    return HELP_TOPICS.filter((topic) => {
      return (
        topic.title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query)
      );
    });
  }, [search]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigateTo = (route: string) => {
    setNavOpen(false);
    router.push(route);
  };

  /* =======================================================
     BACK
  ======================================================= */

  const handleBack = () => {
    router.back();
  };

  /* =======================================================
     CLOSE HELP
  ======================================================= */

  const handleClose = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  /* =======================================================
     AUTH CHECK LOADING
  ======================================================= */

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white" />
    );
  }

  /* =========================================================
     HELP CONTENT
  ========================================================= */

  const helpContent = (
    <main className="flex-1 bg-white text-[#10265B]">

      {/* =====================================================
          HELP HEADER
      ====================================================== */}

      <header
        className="
          flex
          h-[58px]
          items-center
          border-b
          border-[#E5E7EB]
          bg-white
          px-5
          sm:px-7
        "
      >
        {/* BACK */}

        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            transition
            hover:bg-[#F5F8FC]
          "
        >
          <ArrowLeft
            size={21}
            strokeWidth={1.8}
          />
        </button>

        {/* TITLE */}

        <h1
          className="
            ml-2
            flex-1
            text-[18px]
            font-bold
            text-[#10265B]
            sm:text-[20px]
          "
        >
          Help &amp; Support
        </h1>

        {/* CLOSE */}

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close help"
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            transition
            hover:bg-[#F5F8FC]
          "
        >
          <X
            size={20}
            strokeWidth={1.8}
          />
        </button>
      </header>

      {/* =====================================================
          HELP BODY
      ====================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-[760px]
          px-5
          py-6
          sm:px-8
        "
      >

        {/* ===================================================
            SEARCH
        ==================================================== */}

        <div
          className="
            flex
            h-[48px]
            items-center
            rounded-xl
            border
            border-[#DCE3ED]
            bg-[#F8FAFD]
            px-4
          "
        >
          <Search
            size={20}
            strokeWidth={1.8}
            className="
              mr-3
              shrink-0
              text-[#607594]
            "
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search help topics..."
            aria-label="Search help topics"
            autoComplete="off"
            className="
              w-full
              bg-transparent
              text-[13px]
              text-[#10265B]
              outline-none
              placeholder:text-[#8495AE]
            "
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="
                ml-2
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                text-[#71839D]
                hover:bg-[#EAF0F8]
              "
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* ===================================================
            SUPPORT BANNER
        ==================================================== */}

        <section
          className="
            mt-5
            rounded-xl
            border
            border-[#CFE0FF]
            bg-[#F1F6FF]
            px-5
            py-5
          "
        >
          <div className="flex items-center">

            <div
              className="
                flex
                h-[54px]
                w-[54px]
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#E2EDFF]
              "
            >
              <Headphones
                size={29}
                strokeWidth={1.8}
                className="text-[#1769F5]"
              />
            </div>

            <div className="ml-4">
              <h2
                className="
                  text-[18px]
                  font-bold
                  leading-6
                  text-[#10265B]
                "
              >
                We&apos;re here to help!
              </h2>

              <p
                className="
                  mt-1
                  text-[12px]
                  leading-5
                  text-[#526B91]
                "
              >
                Get quick solutions to your questions and concerns.
              </p>
            </div>

          </div>
        </section>

        {/* ===================================================
            HELP TOPICS
        ==================================================== */}

        <h2
          className="
            mt-7
            text-[13px]
            font-medium
            uppercase
            tracking-wide
            text-[#526B91]
          "
        >
          Help Topics
        </h2>

        <div className="mt-4 space-y-3">

          {filteredTopics.length > 0 ? (

            filteredTopics.map((topic) => {
              const Icon = topic.icon;

              return (
                <button
                  key={topic.title}
                  type="button"
                  onClick={() =>
                    navigateTo(topic.route)
                  }
                  className="
                    group
                    flex
                    min-h-[132px]
                    w-full
                    items-center
                    rounded-2xl
                    border
                    border-[#D9E1EB]
                    bg-white
                    px-5
                    text-left
                    transition
                    hover:border-[#BFD4FA]
                    hover:bg-[#FAFCFF]
                    sm:px-6
                  "
                >

                  {/* ICON */}

                  <div
                    className="
                      flex
                      h-[62px]
                      w-[62px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#EEF5FF]
                      sm:h-[72px]
                      sm:w-[72px]
                    "
                  >
                    <Icon
                      size={29}
                      strokeWidth={1.8}
                      className="text-[#1769F5]"
                    />
                  </div>

                  {/* TEXT */}

                  <div
                    className="
                      ml-4
                      min-w-0
                      flex-1
                      sm:ml-5
                    "
                  >
                    <h3
                      className="
                        text-[16px]
                        font-bold
                        text-[#10265B]
                      "
                    >
                      {topic.title}
                    </h3>

                    <p
                      className="
                        mt-1
                        text-[12px]
                        leading-5
                        text-[#526B91]
                      "
                    >
                      {topic.description}
                    </p>
                  </div>

                  {/* ARROW */}

                  <ChevronRight
                    size={21}
                    strokeWidth={1.8}
                    className="
                      ml-3
                      shrink-0
                      text-[#10265B]
                      transition-transform
                      group-hover:translate-x-1
                    "
                  />

                </button>
              );
            })

          ) : (

            /* NO RESULTS */

            <div
              className="
                rounded-2xl
                border
                border-[#D9E1EB]
                bg-[#F8FAFD]
                px-5
                py-10
                text-center
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EEF5FF]
                "
              >
                <Search
                  size={22}
                  className="text-[#1769F5]"
                />
              </div>

              <h3
                className="
                  mt-3
                  text-[15px]
                  font-bold
                  text-[#10265B]
                "
              >
                No help topics found
              </h3>

              <p
                className="
                  mt-1
                  text-[12px]
                  text-[#66748B]
                "
              >
                Try searching with a different keyword.
              </p>

              <button
                type="button"
                onClick={() => setSearch("")}
                className="
                  mt-4
                  rounded-lg
                  bg-[#1769F5]
                  px-4
                  py-2
                  text-[12px]
                  font-semibold
                  text-white
                  hover:bg-[#0F5BDE]
                "
              >
                View All Topics
              </button>
            </div>
          )}

        </div>

        {/* ===================================================
            STILL NEED HELP
        ==================================================== */}

        <section
          className="
            mt-7
            rounded-2xl
            border
            border-[#CFE0FF]
            bg-[#F1F6FF]
            px-5
            py-5
            sm:px-6
          "
        >
          <div className="flex items-start">

            <div
              className="
                flex
                h-[54px]
                w-[54px]
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#E2EDFF]
              "
            >
              <ShieldCheck
                size={27}
                strokeWidth={1.8}
                className="text-[#1769F5]"
              />
            </div>

            <div className="ml-4 flex-1">

              <h2
                className="
                  text-[17px]
                  font-bold
                  text-[#10265B]
                "
              >
                Still need help?
              </h2>

              <p
                className="
                  mt-1
                  text-[12px]
                  leading-5
                  text-[#526B91]
                "
              >
                Our support team is available to assist you.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigateTo("/contact")
                }
                className="
                  mt-4
                  flex
                  h-[40px]
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#1769F5]
                  px-5
                  text-[12px]
                  font-semibold
                  text-white
                  hover:bg-[#0F5BDE]
                "
              >
                <MessageCircle
                  size={18}
                  className="mr-2"
                />

                Contact Support
              </button>

            </div>
          </div>
        </section>

      </div>
    </main>
  );

  /* =========================================================
     BEFORE LOGIN

     Header
     Search
     Help

     NO TopBar
     NO MainNav
     NO Footer
  ========================================================== */

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white">

        <Header
          onMenuClick={() => setNavOpen(true)}
        />

        {helpContent}

      </div>
    );
  }

  /* =========================================================
     AFTER LOGIN

     TopBar
     Header
     MainNav
     Help
     Footer
  ========================================================== */

  return (
    <div
      className="
        flex
        min-h-screen
        flex-col
        bg-[#F6F8FB]
      "
    >

      {/* TOP BAR */}

      <TopBar />

      {/* HEADER */}

      <Header
        onMenuClick={() => setNavOpen(true)}
      />

      {/* MAIN NAVIGATION */}

      <MainNav
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {/* HELP */}

      {helpContent}

      {/* FOOTER */}

      <Footer />

    </div>
  );
}