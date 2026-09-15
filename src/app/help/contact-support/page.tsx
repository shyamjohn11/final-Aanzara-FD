"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  Headphones,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
} from "lucide-react";

type ChatMessage = {
  id: number;
  text: string;
  sender: "support" | "user";
};

const SUPPORT_PHONE = "+910000000000";
const SUPPORT_EMAIL = "support@aanzara.com";

export default function ContactSupportPage() {
  const router = useRouter();

  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * =====================================================
   * OPEN CHAT
   * =====================================================
   */

  const openChat = () => {
    setShowChat(true);
  };

  /*
   * =====================================================
   * CLOSE CHAT
   * =====================================================
   */

  const closeChat = () => {
    setShowChat(false);
  };

  /*
   * =====================================================
   * SEND CHAT MESSAGE
   * =====================================================
   */

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now(),
      text: trimmedMessage,
      sender: "user",
    };

    setMessages((current) => [...current, newMessage]);
    setMessage("");

    /*
     * Demo support response.
     *
     * Replace this with your API/chat service
     * when backend integration is available.
     */
    window.setTimeout(() => {
      const supportMessage: ChatMessage = {
        id: Date.now() + 1,
        text: "Thanks for contacting Aanzara Support. Our team will assist you shortly.",
        sender: "support",
      };

      setMessages((current) => [...current, supportMessage]);
    }, 800);
  };

  /*
   * =====================================================
   * ENTER KEY
   * =====================================================
   */

  const handleInputKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  };

  /*
   * =====================================================
   * ESCAPE KEY
   * =====================================================
   */

  useEffect(() => {
    if (!showChat) {
      return;
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeChat();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showChat]);

  /*
   * =====================================================
   * FOCUS CHAT INPUT
   * =====================================================
   */

  useEffect(() => {
    if (!showChat) {
      return;
    }

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [showChat]);

  /*
   * =====================================================
   * PHONE
   * =====================================================
   */

  const handleCallSupport = () => {
    window.location.href = `tel:${SUPPORT_PHONE}`;
  };

  /*
   * =====================================================
   * EMAIL
   * =====================================================
   */

  const handleEmailSupport = () => {
    const subject = encodeURIComponent(
      "Aanzara Support Request"
    );

    window.location.href =
      `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
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
            focus:outline-none
            focus:ring-2
            focus:ring-[#1769F5]/30
          "
        >
          <ArrowLeft
            size={27}
            strokeWidth={1.8}
          />
        </button>

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
          Contact Support
        </h1>

        <button
          type="button"
          onClick={() => router.push("/help")}
          aria-label="Close contact support"
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
            focus:outline-none
            focus:ring-2
            focus:ring-[#1769F5]/30
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
            SUPPORT BANNER
        ================================================== */}

        <section
          aria-labelledby="support-heading"
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
                mr-5
                flex
                h-16
                w-16
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#E1EDFF]
              "
            >
              <Headphones
                size={34}
                strokeWidth={1.8}
                className="text-[#1769F5]"
              />
            </div>

            <div>
              <h2
                id="support-heading"
                className="
                  text-[21px]
                  font-bold
                  text-[#10265B]
                "
              >
                We&apos;re here for you
              </h2>

              <p
                className="
                  mt-1
                  text-[14px]
                  leading-6
                  text-[#66748B]
                "
              >
                Our support team is ready to help.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            CONTACT OPTIONS
        ================================================== */}

        <h2
          className="
            mt-8
            text-[15px]
            font-medium
            uppercase
            tracking-wide
            text-[#66748B]
          "
        >
          Contact Options
        </h2>

        <div className="mt-4 space-y-4">
          {/* =================================================
              LIVE CHAT
          ================================================== */}

          <button
            type="button"
            onClick={openChat}
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
              focus:outline-none
              focus:ring-2
              focus:ring-[#1769F5]/20
            "
          >
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
                bg-[#EEF5FF]
              "
            >
              <MessageCircle
                size={28}
                strokeWidth={1.8}
                className="text-[#1769F5]"
              />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-[#10265B]">
                Live Chat
              </h3>

              <p className="mt-1 text-[13px] text-[#66748B]">
                Chat with our support team
              </p>
            </div>

            <span
              className="
                rounded-full
                bg-[#E4F8EC]
                px-3
                py-1
                text-[11px]
                font-semibold
                text-[#159447]
              "
            >
              Online
            </span>
          </button>

          {/* =================================================
              PHONE
          ================================================== */}

          <button
            type="button"
            onClick={handleCallSupport}
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
              focus:outline-none
              focus:ring-2
              focus:ring-[#1769F5]/20
            "
          >
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
                bg-[#EEF5FF]
              "
            >
              <Phone
                size={27}
                strokeWidth={1.8}
                className="text-[#1769F5]"
              />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-[#10265B]">
                Call Support
              </h3>

              <p className="mt-1 text-[13px] text-[#66748B]">
                Speak with our support team
              </p>
            </div>

            <span className="text-[12px] font-medium text-[#1769F5]">
              Call
            </span>
          </button>

          {/* =================================================
              EMAIL
          ================================================== */}

          <button
            type="button"
            onClick={handleEmailSupport}
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
              focus:outline-none
              focus:ring-2
              focus:ring-[#1769F5]/20
            "
          >
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
                bg-[#EEF5FF]
              "
            >
              <Mail
                size={27}
                strokeWidth={1.8}
                className="text-[#1769F5]"
              />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-[#10265B]">
                Email Support
              </h3>

              <p className="mt-1 text-[13px] text-[#66748B]">
                Send your question to our team
              </p>
            </div>

            <span className="text-[12px] font-medium text-[#1769F5]">
              Email
            </span>
          </button>
        </div>

        {/* =================================================
            SUPPORT AVAILABILITY
        ================================================== */}

        <section
          aria-labelledby="availability-heading"
          className="
            mt-6
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
              <Clock
                size={25}
                strokeWidth={1.8}
                className="text-[#1769F5]"
              />
            </div>

            <div className="ml-3">
              <h3
                id="availability-heading"
                className="font-bold text-[#10265B]"
              >
                Support Availability
              </h3>

              <p
                className="
                  mt-1
                  text-[13px]
                  leading-5
                  text-[#66748B]
                "
              >
                Our support team is available 24/7.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openChat}
            className="
              mt-5
              flex
              h-[48px]
              w-full
              items-center
              justify-center
              rounded-xl
              bg-[#1769F5]
              text-[15px]
              font-semibold
              text-white
              transition
              hover:bg-[#0F5BDE]
              focus:outline-none
              focus:ring-2
              focus:ring-[#1769F5]/30
              focus:ring-offset-2
            "
          >
            <MessageCircle
              size={20}
              className="mr-2"
            />

            Start Live Chat
          </button>
        </section>
      </div>

      {/* =================================================
          LIVE CHAT MODAL
      ================================================== */}

      {showChat && (
        <div
          role="presentation"
          className="
            fixed
            inset-0
            z-50
            flex
            items-end
            justify-center
            bg-black/40
            p-0
            sm:items-center
            sm:p-5
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeChat();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-title"
            className="
              flex
              max-h-[90dvh]
              w-full
              max-w-[520px]
              flex-col
              overflow-hidden
              rounded-t-3xl
              bg-white
              shadow-2xl
              sm:rounded-2xl
            "
          >
            {/* =================================================
                CHAT HEADER
            ================================================== */}

            <div
              className="
                flex
                h-[70px]
                shrink-0
                items-center
                border-b
                border-[#E5E7EB]
                px-5
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EEF5FF]
                "
              >
                <Headphones
                  size={21}
                  className="text-[#1769F5]"
                />
              </div>

              <div className="ml-3 flex-1">
                <h3
                  id="chat-title"
                  className="
                    text-[16px]
                    font-bold
                    text-[#10265B]
                  "
                >
                  Aanzara Support
                </h3>

                <div className="flex items-center">
                  <span
                    className="
                      mr-1.5
                      h-2
                      w-2
                      rounded-full
                      bg-[#16A34A]
                    "
                  />

                  <p className="text-[11px] text-[#66748B]">
                    Online now
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeChat}
                aria-label="Close chat"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  transition
                  hover:bg-[#F5F8FC]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#1769F5]/20
                "
              >
                <X size={21} />
              </button>
            </div>

            {/* =================================================
                CHAT BODY
            ================================================== */}

            <div
              className="
                min-h-[250px]
                flex-1
                overflow-y-auto
                bg-[#F8FAFC]
                px-5
                py-5
              "
              aria-live="polite"
            >
              {/* Default support greeting */}

              <div
                className="
                  max-w-[80%]
                  rounded-2xl
                  rounded-tl-sm
                  bg-white
                  px-4
                  py-3
                  shadow-sm
                "
              >
                <p
                  className="
                    text-[13px]
                    leading-5
                    text-[#52627A]
                  "
                >
                  Hi! 👋 Welcome to Aanzara Support.
                  How can we help you today?
                </p>
              </div>

              {/* Messages */}

              {messages.map((chatMessage) => {
                const isUser =
                  chatMessage.sender === "user";

                return (
                  <div
                    key={chatMessage.id}
                    className={`mt-4 max-w-[80%] rounded-2xl px-4 py-3 ${
                      isUser
                        ? "ml-auto rounded-tr-sm bg-[#1769F5]"
                        : "rounded-tl-sm bg-white shadow-sm"
                    }`}
                  >
                    <div className="flex items-start">
                      {isUser && (
                        <CheckCircle2
                          size={16}
                          className="mr-2 mt-0.5 shrink-0 text-white"
                        />
                      )}

                      <p
                        className={`text-[13px] leading-5 ${
                          isUser
                            ? "text-white"
                            : "text-[#52627A]"
                        }`}
                      >
                        {chatMessage.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                CHAT INPUT
            ================================================== */}

            <div
              className="
                flex
                shrink-0
                items-center
                border-t
                border-[#E5E7EB]
                bg-white
                p-4
              "
            >
              <label
                htmlFor="support-message"
                className="sr-only"
              >
                Type your support message
              </label>

              <input
                ref={inputRef}
                id="support-message"
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleInputKeyDown}
                placeholder="Type your message..."
                autoComplete="off"
                className="
                  h-[46px]
                  min-w-0
                  flex-1
                  rounded-xl
                  bg-[#F5F7FB]
                  px-4
                  text-[13px]
                  text-[#10265B]
                  outline-none
                  placeholder:text-[#8A99AD]
                  focus:ring-2
                  focus:ring-[#1769F5]/20
                "
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="
                  ml-3
                  flex
                  h-[46px]
                  w-[46px]
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#1769F5]
                  text-white
                  transition
                  hover:bg-[#0F5BDE]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#1769F5]/30
                  focus:ring-offset-2
                "
                aria-label="Send message"
              >
                <Send
                  size={19}
                  strokeWidth={1.8}
                />
              </button>
            </div>
          </div>
        </div>
      )}

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