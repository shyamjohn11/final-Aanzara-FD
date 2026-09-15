"use client";

import { FormEvent, useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";

type NewsletterForm = {
  email: string;
};

type NewsletterErrors = Partial<Record<keyof NewsletterForm, string>>;

const INITIAL_FORM: NewsletterForm = {
  email: "",
};

export default function Newsletter() {
  const [form, setForm] = useState<NewsletterForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<NewsletterErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ============================================================
     VALIDATION
  ============================================================ */

  const validateForm = (): NewsletterErrors => {
    const nextErrors: NewsletterErrors = {};
    const email = form.email.trim();

    if (!email) {
      nextErrors.email = "Business email address is required.";
    } else if (email.length > 254) {
      nextErrors.email = "Email address is too long.";
    } else if (
      !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
        email
      )
    ) {
      nextErrors.email = "Please enter a valid business email address.";
    }

    return nextErrors;
  };

  /* ============================================================
     CHANGE HANDLER
  ============================================================ */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setForm((current) => ({
      ...current,
      email: value,
    }));

    setSubmitted(false);

    setErrors((current) => {
      if (!current.email) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next.email;

      return next;
    });
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setSubmitted(false);

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      /*
       * Backend/API integration can be added here.
       *
       * Example:
       *
       * await fetch("/api/newsletter", {
       *   method: "POST",
       *   headers: {
       *     "Content-Type": "application/json",
       *   },
       *   body: JSON.stringify({
       *     email: form.email.trim(),
       *   }),
       * });
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 800)
      );

      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (error) {
      console.error(
        "Newsletter subscription failed:",
        error
      );

      setErrors({
        email:
          "Unable to subscribe right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ============================================================
     INPUT CLASS
  ============================================================ */

  const inputClass = `
    flex-1
    lg:w-[280px]
    bg-white
    rounded-lg
    px-4
    py-3
    text-[13px]
    text-ink
    placeholder:text-ink-faint
    outline-none
    border
    transition-colors
    ${
      errors.email
        ? "border-red-500 focus:border-red-500"
        : "border-transparent focus:border-blue"
    }
  `;

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <section
      aria-labelledby="newsletter-title"
      className="
        bg-navy
        rounded-card
        p-6
        sm:p-8
        flex
        flex-col
        lg:flex-row
        items-start
        lg:items-center
        justify-between
        gap-5
      "
    >
      {/* ========================================================
          CONTENT
      ======================================================== */}

      <div className="min-w-0">
        <h2
          id="newsletter-title"
          className="
            font-sora
            font-bold
            text-[18px]
            sm:text-[20px]
            text-white
          "
        >
          Subscribe to Aanzara Wholesale Price Alerts
        </h2>

        <p className="text-[13px] text-white/60 mt-1.5 max-w-[480px]">
          Receive live mandi rates, major price drops, and mill
          opening dispatches direct to your business.
        </p>
      </div>

      {/* ========================================================
          FORM
      ======================================================== */}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full lg:w-auto"
      >
        <div className="flex w-full lg:w-auto gap-2.5">
          <div className="flex-1">
            <div className="relative">
              <Mail
                size={14}
                aria-hidden="true"
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-ink-faint
                  pointer-events-none
                "
              />

              <input
                id="newsletter-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your business email address..."
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email
                    ? "newsletter-email-error"
                    : submitted
                    ? "newsletter-success"
                    : undefined
                }
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="
              bg-green
              hover:bg-green-deep
              transition-colors
              text-white
              font-bold
              text-[13px]
              px-5
              py-3
              rounded-lg
              shrink-0
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >
            {isSubmitting ? "Subscribing..." : "Subscribe"}
          </button>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {errors.email && (
          <p
            id="newsletter-email-error"
            role="alert"
            className="mt-1.5 text-[11px] text-red-300"
          >
            {errors.email}
          </p>
        )}

        {/* ======================================================
            SUCCESS
        ====================================================== */}

        {submitted && !errors.email && (
          <div
            id="newsletter-success"
            role="status"
            className="
              flex
              items-center
              gap-1.5
              mt-2
              text-[11.5px]
              font-semibold
              text-green-200
            "
          >
            <CheckCircle2 size={13} />
            Successfully subscribed to price alerts.
          </div>
        )}
      </form>
    </section>
  );
}