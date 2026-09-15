"use client";

import { FormEvent, useState } from "react";
import { Package } from "lucide-react";
import { newsletterApi } from "@/app/api/services";

interface NewsletterFormState {
  email: string;
}

export default function NewArrivalsNewsletter() {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [subscribed, setSubscribed] =
    useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  const validateEmail = (
    value: string,
  ): boolean => {
    const emailValue = value.trim();

    if (!emailValue) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      emailValue,
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(
        "Please enter your business email.",
      );
      setSubscribed(false);
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError(
        "Please enter a valid email address.",
      );
      setSubscribed(false);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await newsletterApi.subscribe(
        trimmedEmail,
        "new-arrivals",
      );
      setEmail(trimmedEmail);
      setSubscribed(true);
    } catch {
      setError(
        "Subscription failed. Please try again.",
      );
      setSubscribed(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (
    value: string,
  ): void => {
    setEmail(value);

    if (error) {
      setError("");
    }

    if (subscribed) {
      setSubscribed(false);
    }
  };

  void ({ email } as NewsletterFormState);

  return (
    <section
      className="
        relative
        bg-navy
        rounded-card
        px-6
        sm:px-10
        py-8
        overflow-hidden
      "
      aria-labelledby="new-arrivals-newsletter-title"
    >
      <div
        className="
          relative
          flex
          flex-col
          sm:flex-row
          items-center
          justify-between
          gap-6
        "
      >
        {/* Content */}
        <div
          className="
            max-w-[480px]
            text-center
            sm:text-left
          "
        >
          <h2
            id="new-arrivals-newsletter-title"
            className="
              font-sora
              font-bold
              text-[18px]
              sm:text-[20px]
              text-white
            "
          >
            Never Miss a New Arrival!
          </h2>

          <p
            className="
              text-[12.5px]
              text-white/65
              mt-2
              leading-relaxed
            "
          >
            Get notified about the latest products,
            exclusive offers and best deals for your
            business.
          </p>

          {/* Newsletter Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="
              flex
              flex-col
              sm:flex-row
              gap-2.5
              mt-4
            "
          >
            <div className="flex-1">
              <label
                htmlFor="business-email"
                className="sr-only"
              >
                Business email
              </label>

              <input
                id="business-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) =>
                  handleEmailChange(
                    event.target.value,
                  )
                }
                placeholder="Enter your business email"
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error
                    ? "newsletter-error"
                    : subscribed
                      ? "newsletter-success"
                      : undefined
                }
                className="
                  w-full
                  bg-white
                  rounded-lg
                  px-4
                  py-2.5
                  text-[12.5px]
                  text-ink
                  placeholder:text-ink-faint
                  outline-none
                  border
                  border-transparent
                  focus:border-green
                  focus:ring-2
                  focus:ring-green/20
                "
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="
                bg-green
                hover:bg-green-deep
                transition-colors
                text-white
                font-bold
                text-[12.5px]
                px-5
                py-2.5
                rounded-lg
                shrink-0
                cursor-pointer
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-white
                focus-visible:ring-offset-2
                focus-visible:ring-offset-navy
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {isSubmitting
                ? "Subscribing…"
                : subscribed
                  ? "Subscribed"
                  : "Subscribe"}
            </button>
          </form>

          {/* Error */}
          {error && (
            <p
              id="newsletter-error"
              role="alert"
              className="
                text-[10.5px]
                text-red-300
                mt-2
              "
            >
              {error}
            </p>
          )}

          {/* Success */}
          {subscribed && !error && (
            <p
              id="newsletter-success"
              role="status"
              aria-live="polite"
              className="
                text-[10.5px]
                text-green-200
                mt-2
              "
            >
              Successfully subscribed!
            </p>
          )}

          {/* Disclaimer */}
          {!error && !subscribed && !isSubmitting && (
            <p
              className="
                text-[10.5px]
                text-white/40
                mt-2
              "
            >
              No spam. Unsubscribe anytime.
            </p>
          )}
        </div>

        {/* Package Icon */}
        <div
          className="
            relative
            shrink-0
          "
          aria-hidden="true"
        >
          <span
            className="
              w-20
              h-20
              rounded-2xl
              bg-white/10
              flex
              items-center
              justify-center
            "
          >
            <Package
              size={34}
              className="text-green"
            />
          </span>

          <span
            className="
              absolute
              -top-2
              -right-2
              bg-green
              text-white
              text-[9px]
              font-bold
              px-2
              py-1
              rounded-full
            "
          >
            New
          </span>
        </div>
      </div>
    </section>
  );
}
