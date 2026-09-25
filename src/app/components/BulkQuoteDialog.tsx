"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { createPortal } from "react-dom";

import {
  CheckCircle2,
  FileText,
  Send,
  X,
} from "lucide-react";

import { toast } from "react-toastify";

import {
  extractErrorMessage,
  hasSession,
} from "@/app/api/api";
import { quoteRequestsApi } from "@/app/api/services";

/* =========================================================
   BULK QUOTE DIALOG — shared request form behind every
   "Bulk Quote" / "Request Bulk Quote" entry point (header,
   wholesale hero/CTA, cart). No login required. Submits to
   POST /api/v1/quote-requests; the request lands in the
   PricingRequests table (status Pending) and shows up in
   /admin/pricing-requests plus the admin notification bell.

   Rendered through a portal straight into document.body so
   position:fixed (backdrop + centering) can never be broken
   by a transformed ancestor, and the backdrop always covers
   the full viewport.
========================================================= */

type BulkQuoteDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
  defaultProduct?: string;
  defaultMessage?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13.5px] text-ink outline-none transition placeholder:text-[#8A99AD] focus:border-green focus:ring-2 focus:ring-green/15";

const labelClass =
  "mb-1.5 block text-[12px] font-semibold text-ink";

export default function BulkQuoteDialog({
  open,
  onClose,
  defaultName = "",
  defaultPhone = "",
  defaultEmail = "",
  defaultProduct = "",
  defaultMessage = "",
}: BulkQuoteDialogProps) {
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [product, setProduct] = useState(defaultProduct);
  const [quantity, setQuantity] = useState("10");
  const [requestedPrice, setRequestedPrice] = useState("");
  const [message, setMessage] = useState(defaultMessage);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset (and prefill) every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setName(defaultName);
    setPhone(defaultPhone);
    setEmail(defaultEmail);
    setProduct(defaultProduct);
    setQuantity("10");
    setRequestedPrice("");
    setMessage(defaultMessage);
    setError("");
    setSubmitting(false);
    setSubmitted(false);
  }, [
    open,
    defaultName,
    defaultPhone,
    defaultEmail,
    defaultProduct,
    defaultMessage,
  ]);

  // Escape closes; lock body scroll while open.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError("");

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanEmail = email.trim();
    const cleanProduct = product.trim();
    const cleanMessage = message.trim();
    const cleanQuantity = Math.floor(Number(quantity));
    const cleanPrice = requestedPrice.trim() === ""
      ? undefined
      : Number(requestedPrice);

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }
    if (!PHONE_RE.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!cleanProduct) {
      setError("Please tell us which product you need a quote for.");
      return;
    }
    if (!Number.isFinite(cleanQuantity) || cleanQuantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    if (
      cleanPrice !== undefined &&
      (!Number.isFinite(cleanPrice) || cleanPrice < 0)
    ) {
      setError("Target price cannot be negative.");
      return;
    }

    setSubmitting(true);
    try {
      await quoteRequestsApi.submit({
        customerName: cleanName,
        phone: cleanPhone,
        ...(cleanEmail ? { email: cleanEmail } : {}),
        product: cleanProduct,
        quantity: cleanQuantity,
        ...(cleanPrice !== undefined
          ? { requestedPrice: cleanPrice }
          : {}),
        ...(cleanMessage ? { message: cleanMessage } : {}),
      });
      setSubmitted(true);
      toast.success(
        "Quote request sent! Our wholesale team will contact you."
      );
    } catch (err) {
      const message = extractErrorMessage(
        err,
        "Could not send your request. Please try again."
      );
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Request bulk quote"
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        overflow-y-auto
        p-4
        sm:p-6
      "
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="
          fixed
          inset-0
          bg-navy/60
          backdrop-blur-[2px]
        "
      />

      <div
        className="
          relative
          my-auto
          w-full
          max-w-md
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >
        {/* HEADER BAND */}

        <div
          className="
            flex
            items-center
            gap-3
            bg-gradient-to-r
            from-green-deep
            to-green
            px-5
            py-4
            pr-12
          "
        >
          <span
            aria-hidden="true"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-white/20
              text-white
            "
          >
            <FileText size={19} />
          </span>

          <span>
            <span className="block font-sora text-[16px] font-bold leading-tight text-white">
              Request Bulk Quote
            </span>

            <span className="mt-0.5 block text-[11.5px] leading-snug text-white/85">
              Wholesale pricing within 24 hours — no login needed.
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close quote dialog"
          title="Close"
          className="
            absolute
            right-3.5
            top-3.5
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-white
            text-navy
            shadow-md
            transition-colors
            hover:bg-slate-100
          "
        >
          <X
            size={18}
            strokeWidth={2.5}
          />
        </button>

        {/* BODY */}

        <div className="max-h-[62vh] overflow-y-auto px-5 py-5 sm:px-6">
          {submitted ? (
            <div className="py-4 text-center">
              <CheckCircle2
                size={46}
                className="mx-auto text-green-deep"
              />

              <h2 className="mt-3 font-sora text-[17px] font-bold text-navy">
                Quote request sent!
              </h2>

              <p className="mx-auto mt-2 max-w-[300px] text-[12.5px] leading-relaxed text-ink-soft">
                {hasSession()
                  ? "Our wholesale team will contact you shortly with pricing. You can also track it under Account → Bulk Quotes."
                  : "Our wholesale team will contact you shortly with pricing."}
              </p>

              <button
                type="button"
                onClick={onClose}
                className="
                  mt-5
                  h-[44px]
                  w-full
                  rounded-xl
                  bg-navy
                  text-[13.5px]
                  font-semibold
                  text-white
                  transition-colors
                  hover:bg-navy-deep
                "
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {error && (
                <p
                  role="alert"
                  className="
                    mb-3
                    rounded-xl
                    bg-red-50
                    px-3.5
                    py-2.5
                    text-[12px]
                    font-medium
                    text-red-600
                  "
                >
                  {error}
                </p>
              )}

              <form
                onSubmit={submit}
                noValidate
                className="flex flex-col gap-3.5"
              >
                <div>
                  <label
                    htmlFor="bulk-quote-name"
                    className={labelClass}
                  >
                    Your name *
                  </label>

                  <input
                    id="bulk-quote-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shyam Kumar"
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="bulk-quote-phone"
                      className={labelClass}
                    >
                      Mobile *
                    </label>

                    <input
                      id="bulk-quote-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit number"
                      inputMode="numeric"
                      autoComplete="tel"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bulk-quote-email"
                      className={labelClass}
                    >
                      Email
                    </label>

                    <input
                      id="bulk-quote-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bulk-quote-product"
                    className={labelClass}
                  >
                    Product *
                  </label>

                  <input
                    id="bulk-quote-product"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="e.g. Fortune Sunflower Oil 5L"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="bulk-quote-qty"
                      className={labelClass}
                    >
                      Quantity *
                    </label>

                    <input
                      id="bulk-quote-qty"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="10"
                      inputMode="numeric"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bulk-quote-price"
                      className={labelClass}
                    >
                      Target price (₹)
                    </label>

                    <input
                      id="bulk-quote-price"
                      value={requestedPrice}
                      onChange={(e) =>
                        setRequestedPrice(e.target.value)
                      }
                      placeholder="Optional"
                      inputMode="decimal"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bulk-quote-message"
                    className={labelClass}
                  >
                    Message
                  </label>

                  <textarea
                    id="bulk-quote-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Delivery city, timeline, packaging…"
                    rows={3}
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3.5
                      py-2.5
                      text-[13.5px]
                      text-ink
                      outline-none
                      transition
                      placeholder:text-[#8A99AD]
                      focus:border-green
                      focus:ring-2
                      focus:ring-green/15
                    "
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="
                    mt-1
                    flex
                    h-[48px]
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-green
                    text-[14.5px]
                    font-bold
                    text-white
                    shadow-[0_7px_18px_rgba(22,163,74,0.25)]
                    transition-all
                    hover:bg-green-deep
                    disabled:opacity-60
                  "
                >
                  <Send size={16} />

                  {submitting ? "Sending…" : "Send Quote Request"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
