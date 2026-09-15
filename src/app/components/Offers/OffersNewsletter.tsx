"use client";

import {
  FormEvent,
  useState,
} from "react";
import { newsletterApi } from "@/app/api/services";
import { extractErrorMessage } from "@/app/api/api";

/* --------------------------------
 * Constants
 * -------------------------------- */

const INITIAL_EMAIL = "";

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* --------------------------------
 * Validation Helpers
 * -------------------------------- */

function isValidEmail(
  value: string,
): boolean {
  return EMAIL_PATTERN.test(
    value.trim(),
  );
}

/* --------------------------------
 * Component
 * -------------------------------- */

export default function OffersNewsletter() {
  const [email, setEmail] =
    useState<string>(INITIAL_EMAIL);

  const [error, setError] =
    useState<string>("");

  const [success, setSuccess] =
    useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  /* --------------------------------
   * Submit
   * -------------------------------- */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const trimmedEmail =
      email.trim();

    setError("");
    setSuccess(false);

    if (!trimmedEmail) {
      setError(
        "Please enter your email address.",
      );
      return;
    }

    if (
      !isValidEmail(trimmedEmail) ||
      !/.+@.+\..+/.test(trimmedEmail)
    ) {
      setError(
        "Please enter a valid email address.",
      );
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await newsletterApi.subscribe(
        trimmedEmail,
        "offers",
      );
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          "Subscription failed. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="offers-newsletter-title"
      className="
        bg-navy
        rounded-card
        p-6
        sm:p-9
        text-center
      "
    >
      {/* --------------------------------
       * Heading
       * -------------------------------- */}

      <h2
        id="offers-newsletter-title"
        className="
          font-sora
          font-bold
          text-[19px]
          sm:text-[22px]
          text-white
        "
      >
        Subscribe for Offer Alerts &amp;
        Business Deals
      </h2>

      <p
        className="
          text-[12.5px]
          text-white/60
          mt-1.5
          max-w-[480px]
          mx-auto
        "
      >
        Stay informed on discount codes,
        upcoming pricing, and volume
        discounts fit for you.
      </p>

      {/* --------------------------------
       * Newsletter Form
       * -------------------------------- */}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="
          flex
          flex-col
          sm:flex-row
          gap-2.5
          mt-5
          max-w-[440px]
          mx-auto
        "
      >
        <div className="flex-1">
          <label
            htmlFor="offers-newsletter-email"
            className="sr-only"
          >
            Email address
          </label>

          <input
            id="offers-newsletter-email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);

              if (error) {
                setError("");
              }

              if (success) {
                setSuccess(false);
              }
            }}
            placeholder="Enter your email address..."
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? "offers-newsletter-error"
                : success
                  ? "offers-newsletter-success"
                  : undefined
            }
            disabled={isSubmitting}
            className="
              w-full
              bg-white
              rounded-lg
              px-4
              py-3
              text-[13px]
              text-ink
              placeholder:text-ink-faint
              outline-none
              border
              border-transparent
              focus:border-green
              focus:ring-2
              focus:ring-green/30
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          />
        </div>

        {/* --------------------------------
         * Subscribe Button
         * -------------------------------- */}

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
            cursor-pointer
            disabled:opacity-60
            disabled:cursor-not-allowed
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-green
            focus-visible:ring-offset-2
            focus-visible:ring-offset-navy
          "
        >
          {isSubmitting
            ? "Subscribing..."
            : "Subscribe"}
        </button>
      </form>

      {/* --------------------------------
       * Error Message
       * -------------------------------- */}

      {error && (
        <p
          id="offers-newsletter-error"
          role="alert"
          className="
            text-[11.5px]
            text-red-300
            mt-2.5
          "
        >
          {error}
        </p>
      )}

      {/* --------------------------------
       * Success Message
       * -------------------------------- */}

      {success && (
        <p
          id="offers-newsletter-success"
          role="status"
          aria-live="polite"
          className="
            text-[11.5px]
            text-green-300
            mt-2.5
          "
        >
          Successfully subscribed to offer
          alerts!
        </p>
      )}
    </section>
  );
}
