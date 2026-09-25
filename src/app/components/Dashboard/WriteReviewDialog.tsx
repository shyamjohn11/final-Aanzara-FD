"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { createPortal } from "react-dom";

import {
  CheckCircle2,
  Star,
  X,
} from "lucide-react";

import { toast } from "react-toastify";

import { extractErrorMessage } from "@/app/api/api";
import { storefrontReviewsApi } from "@/app/api/services";

/* =========================================================
   WRITE REVIEW DIALOG — buyers-only product reviews. The
   backend enforces purchase (authenticated + non-cancelled
   order containing the product); accepted reviews stay
   Pending for moderation and are flagged as verified
   purchases, which drives the "Verified Buyer" badge.
   Rendered through a portal so backdrop + centering always
   cover the full viewport.
========================================================= */

type WriteReviewDialogProps = {
  open: boolean;
  onClose: () => void;
  productName: string;
};

const MAX_COMMENT_LENGTH = 1000;

export default function WriteReviewDialog({
  open,
  onClose,
  productName,
}: WriteReviewDialogProps) {
  const [mounted, setMounted] = useState(false);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setRating(5);
    setHoverRating(0);
    setComment("");
    setError("");
    setSubmitting(false);
    setSubmitted(false);
  }, [open]);

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

    const cleanComment = comment.trim();

    if (rating < 1 || rating > 5) {
      setError("Please select a star rating.");
      return;
    }
    if (cleanComment.length === 0) {
      setError("Please write a few words about the product.");
      return;
    }

    setSubmitting(true);
    try {
      await storefrontReviewsApi.create({
        productName: productName.trim(),
        rating,
        comment: cleanComment,
      });
      setSubmitted(true);
      toast.success(
        "Review submitted! It will appear after approval."
      );
    } catch (err) {
      const message = extractErrorMessage(
        err,
        "Could not submit your review. Please try again."
      );
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const shownRating = hoverRating > 0 ? hoverRating : rating;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Write a review"
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
            bg-navy
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
              bg-white/15
              text-amber
            "
          >
            <Star size={19} className="fill-amber" />
          </span>

          <span>
            <span className="block font-sora text-[16px] font-bold leading-tight text-white">
              Write a Review
            </span>

            <span className="mt-0.5 block truncate text-[11.5px] leading-snug text-white/80">
              {productName.trim()
                ? `Reviewing ${productName.trim()}`
                : "Share your experience as a buyer"}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close review dialog"
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
                Thank you!
              </h2>

              <p className="mx-auto mt-2 max-w-[300px] text-[12.5px] leading-relaxed text-ink-soft">
                Your review was submitted as a verified buyer
                and will appear here after approval.
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
                className="flex flex-col gap-4"
              >
                <div>
                  <span className="mb-1.5 block text-[12px] font-semibold text-ink">
                    Your rating *
                  </span>

                  <div
                    role="radiogroup"
                    aria-label="Star rating"
                    className="flex items-center gap-1.5"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={rating === star}
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onFocus={() => setHoverRating(star)}
                        onBlur={() => setHoverRating(0)}
                        className="
                          rounded-md
                          p-1
                          transition-transform
                          hover:scale-110
                          focus:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-amber/50
                        "
                      >
                        <Star
                          size={26}
                          className={
                            star <= shownRating
                              ? "fill-amber text-amber"
                              : "text-line"
                          }
                        />
                      </button>
                    ))}

                    <span className="ml-2 text-[12px] font-semibold text-ink-soft">
                      {shownRating > 0
                        ? `${shownRating}/5`
                        : "Tap a star"}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="write-review-comment"
                    className="mb-1.5 block text-[12px] font-semibold text-ink"
                  >
                    Your review *
                  </label>

                  <textarea
                    id="write-review-comment"
                    value={comment}
                    onChange={(e) =>
                      setComment(
                        e.target.value.slice(0, MAX_COMMENT_LENGTH)
                      )
                    }
                    placeholder="How was the quality, packaging, delivery…?"
                    rows={4}
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
                      focus:border-navy
                      focus:ring-2
                      focus:ring-navy/10
                    "
                  />

                  <p className="mt-1 text-right text-[11px] text-ink-faint">
                    {comment.length}/{MAX_COMMENT_LENGTH}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="
                    flex
                    h-[48px]
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-navy
                    text-[14.5px]
                    font-bold
                    text-white
                    transition-colors
                    hover:bg-navy-deep
                    disabled:opacity-60
                  "
                >
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>

                <p className="text-center text-[11px] leading-relaxed text-ink-faint">
                  Only verified buyers can review. Your review
                  appears after approval.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
