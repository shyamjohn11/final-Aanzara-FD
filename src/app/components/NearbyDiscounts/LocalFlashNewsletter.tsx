"use client";

import {
  FormEvent,
  useId,
  useState,
} from "react";
import { Send } from "lucide-react";
import { newsletterApi } from "@/app/api/services";

export default function LocalFlashNewsletter() {
  const emailId = useId();
  const errorId = useId();
  const statusId = useId();

  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  /* --------------------------------
   * Validate email
   * -------------------------------- */
  function isValidEmail(value: string): boolean {
    const trimmedEmail = value.trim();

    if (!trimmedEmail) {
      return false;
    }

    // Basic email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      trimmedEmail,
    );
  }

  /* --------------------------------
   * Handle email change
   * -------------------------------- */
  function handleEmailChange(
    value: string,
  ): void {
    setEmail(value);

    // Clear previous messages while typing
    if (error) {
      setError("");
    }

    if (success) {
      setSuccess(false);
    }
  }

  /* --------------------------------
   * Handle submit
   * -------------------------------- */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    // Prevent duplicate submission
    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();

    // Empty validation
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      setSuccess(false);
      return;
    }

    // Email validation
    if (!isValidEmail(trimmedEmail)) {
      setError(
        "Please enter a valid email address.",
      );
      setSuccess(false);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await newsletterApi.subscribe(
        trimmedEmail,
        "nearby-discounts",
      );

      setSuccess(true);
      setEmail("");
    } catch {
      setError(
        "Something went wrong. Please try again.",
      );
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="
        bg-white
        border
        border-line
        rounded-card
        flex
        flex-col
        sm:flex-row
        sm:items-center
        justify-between
        gap-5
        px-6
        sm:px-9
        py-7
      "
      aria-labelledby="newsletter-title"
    >
      {/* --------------------------------
          Content
          -------------------------------- */}
      <div>
        <h2
          id="newsletter-title"
          className="
            font-sora
            font-bold
            text-[17px]
            sm:text-[19px]
            text-navy
          "
        >
          Subscribe for Local Flash Sales Alerts
        </h2>

        <p
          className="
            text-[12px]
            text-ink-soft
            mt-1.5
            max-w-[420px]
          "
        >
          Enter your email and never miss a nearby
          discount from your favourite local stores.
        </p>
      </div>

      {/* --------------------------------
          Newsletter Form
          -------------------------------- */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="
          flex
          flex-col
          sm:flex-row
          gap-2.5
          max-w-[420px]
          w-full
          shrink-0
        "
      >
        <div className="flex-1">
          <label
            htmlFor={emailId}
            className="sr-only"
          >
            Email address
          </label>

          <input
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) =>
              handleEmailChange(
                event.target.value,
              )
            }
            placeholder="Enter your email address..."
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? errorId : undefined
            }
            disabled={isSubmitting}
            className="
              w-full
              bg-paper
              border
              border-line
              rounded-lg
              px-4
              py-3
              text-[13px]
              text-ink
              placeholder:text-ink-faint
              outline-none
              transition-colors
              focus:border-navy
              focus:ring-2
              focus:ring-navy/10
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          />

          {/* Validation Error */}
          {error && (
            <p
              id={errorId}
              className="
                text-[11px]
                text-red-600
                mt-1.5
              "
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Success Message */}
          {success && !error && (
            <p
              id={statusId}
              className="
                text-[11px]
                text-green-deep
                mt-1.5
              "
              role="status"
              aria-live="polite"
            >
              Successfully subscribed!
            </p>
          )}
        </div>

        {/* --------------------------------
            Subscribe Button
            -------------------------------- */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            flex
            items-center
            justify-center
            gap-2
            bg-navy
            hover:bg-navy-deep
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
            focus-visible:ring-navy
            focus-visible:ring-offset-2
          "
        >
          <Send
            size={13}
            aria-hidden="true"
          />

          {isSubmitting
            ? "Subscribing..."
            : "Subscribe"}
        </button>
      </form>
    </section>
  );
}