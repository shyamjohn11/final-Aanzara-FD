"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  CircleHelp,
  ChevronDown,
  Search,
} from "lucide-react";

const FAQS = [
  {
    question: "How can I place an order?",
    answer:
      "Browse the products you need, open the product details, select the required quantity and continue to checkout.",
  },
  {
    question: "How can I track my order?",
    answer:
      "You can track your order from your account and order details after your order has been confirmed.",
  },
  {
    question: "What payment methods are available?",
    answer:
      "Available payment methods are shown during checkout before you confirm your order.",
  },
  {
    question: "How can I cancel my order?",
    answer:
      "Open your order details and check whether cancellation is available for that order.",
  },
  {
    question: "Can I change my delivery address?",
    answer:
      "If your order has not been shipped, you may be able to update the delivery address from your order details.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery time depends on your location, product availability and the delivery option selected during checkout.",
  },
  {
    question: "How do I request a refund?",
    answer:
      "Open the relevant order and follow the available refund or return option. If you need further assistance, contact support.",
  },
  {
    question: "How can I contact support?",
    answer:
      "Use the Contact Support section to reach the Aanzara support team.",
  },
];

export default function FAQPage() {
  const router = useRouter();

  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  /* =====================================================
     SEARCH FAQS
  ====================================================== */

  const filteredFAQs = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return FAQS;
    }

    return FAQS.filter((faq) => {
      return (
        faq.question.toLowerCase().includes(value) ||
        faq.answer.toLowerCase().includes(value)
      );
    });
  }, [search]);

  /* =====================================================
     TOGGLE FAQ
  ====================================================== */

  const toggleFAQ = (question: string) => {
    setOpenQuestion((current) =>
      current === question ? null : question
    );
  };

  /* =====================================================
     CLEAR SEARCH
  ====================================================== */

  const clearSearch = () => {
    setSearch("");
    setOpenQuestion(null);
  };

  return (
    <main className="min-h-[100dvh] bg-white text-[#122858]">
      {/* =================================================
          HEADER
      ================================================== */}

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
          FAQs
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

      {/* =================================================
          CONTENT
      ================================================== */}

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
              <CircleHelp
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
                Frequently Asked Questions
              </h2>

              <p
                className="
                  mt-1
                  text-[14px]
                  text-[#66748B]
                "
              >
                Find quick answers to common questions.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            SEARCH
        ================================================== */}

        <div
          className="
            mt-6
            flex
            h-[54px]
            items-center
            rounded-xl
            border
            border-[#DCE1E8]
            bg-white
            px-4
            shadow-sm
          "
        >
          <Search
            size={21}
            strokeWidth={1.8}
            className="mr-3 shrink-0 text-[#71839D]"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpenQuestion(null);
            }}
            placeholder="Search questions..."
            aria-label="Search frequently asked questions"
            className="
              w-full
              bg-transparent
              text-[14px]
              text-[#10265B]
              outline-none
              placeholder:text-[#8A99AD]
            "
          />

          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="
                ml-2
                shrink-0
                text-[13px]
                font-medium
                text-[#1769F5]
                hover:underline
              "
            >
              Clear
            </button>
          )}
        </div>

        {/* =================================================
            QUESTIONS
        ================================================== */}

        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              className="
                text-[15px]
                font-medium
                uppercase
                tracking-wide
                text-[#66748B]
              "
            >
              Common Questions
            </h2>

            <span
              className="
                shrink-0
                rounded-full
                bg-[#EEF5FF]
                px-3
                py-1
                text-[11px]
                font-semibold
                text-[#1769F5]
              "
            >
              {filteredFAQs.length}{" "}
              {filteredFAQs.length === 1
                ? "Question"
                : "Questions"}
            </span>
          </div>

          <div className="space-y-3">
            {filteredFAQs.map((faq, index) => {
              const isOpen =
                openQuestion === faq.question;

              const answerId = `faq-answer-${index}`;

              return (
                <div
                  key={faq.question}
                  className={`
                    overflow-hidden
                    rounded-xl
                    border
                    transition-all
                    duration-200
                    ${
                      isOpen
                        ? "border-[#BFD4F8] bg-[#FAFCFF]"
                        : "border-[#DCE1E8] bg-white"
                    }
                  `}
                >
                  {/* QUESTION */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleFAQ(faq.question)
                    }
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    className="
                      flex
                      min-h-[64px]
                      w-full
                      items-center
                      px-5
                      text-left
                    "
                  >
                    <span
                      className="
                        flex-1
                        pr-4
                        text-[15px]
                        font-semibold
                        text-[#10265B]
                        sm:text-[16px]
                      "
                    >
                      {faq.question}
                    </span>

                    <span
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[#EEF5FF]
                      "
                    >
                      <ChevronDown
                        size={19}
                        strokeWidth={1.8}
                        className={`
                          text-[#1769F5]
                          transition-transform
                          duration-200
                          ${
                            isOpen
                              ? "rotate-180"
                              : ""
                          }
                        `}
                      />
                    </span>
                  </button>

                  {/* ANSWER */}

                  {isOpen && (
                    <div
                      id={answerId}
                      role="region"
                      aria-labelledby={`faq-question-${index}`}
                      className="
                        border-t
                        border-[#E5E7EB]
                        px-5
                        py-4
                      "
                    >
                      <p
                        className="
                          text-[14px]
                          leading-6
                          text-[#66748B]
                        "
                      >
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* =================================================
              NO RESULTS
          ================================================== */}

          {filteredFAQs.length === 0 && (
            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-[#DCE1E8]
                px-6
                py-10
                text-center
              "
            >
              <CircleHelp
                size={36}
                className="mx-auto text-[#A1AEC0]"
              />

              <h3
                className="
                  mt-3
                  text-[16px]
                  font-bold
                  text-[#10265B]
                "
              >
                No questions found
              </h3>

              <p
                className="
                  mt-1
                  text-[13px]
                  text-[#66748B]
                "
              >
                Try searching with a different keyword.
              </p>

              <button
                type="button"
                onClick={clearSearch}
                className="
                  mt-4
                  rounded-lg
                  bg-[#1769F5]
                  px-5
                  py-2.5
                  text-[13px]
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#0F5BDE]
                "
              >
                Clear Search
              </button>
            </div>
          )}
        </section>

        {/* =================================================
            CONTACT SUPPORT
        ================================================== */}

        <section
          className="
            mt-7
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
                mr-4
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
              <CircleHelp
                size={25}
                className="text-[#1769F5]"
              />
            </div>

            <div className="flex-1">
              <h3
                className="
                  text-[16px]
                  font-bold
                  text-[#10265B]
                "
              >
                Still have a question?
              </h3>

              <p
                className="
                  mt-1
                  text-[13px]
                  leading-5
                  text-[#66748B]
                "
              >
                Our support team can help you.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/help/contact-support"
              )
            }
            className="
              mt-5
              h-[46px]
              w-full
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

      {/* =================================================
          FOOTER
      ================================================== */}

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