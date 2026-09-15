"use client";

import { useState } from "react";

// =====================================================
// TYPES
// =====================================================

export type OrderNotesForm = {
  notes: string;
  isGift: boolean;
  giftMessage: string;
};

type OrderNotesErrors = {
  notes?: string;
  giftMessage?: string;
};

type OrderNotesSectionProps = {
  onChange?: (data: OrderNotesForm) => void;
};

// =====================================================
// CONSTANTS
// =====================================================

const MAX_NOTES_LENGTH = 500;
const MAX_GIFT_MESSAGE_LENGTH = 300;

// =====================================================
// COMPONENT
// =====================================================

export default function OrderNotesSection({
  onChange,
}: OrderNotesSectionProps) {
  // ===================================================
  // STATE
  // ===================================================

  const [form, setForm] =
    useState<OrderNotesForm>({
      notes: "",
      isGift: true,
      giftMessage: "",
    });

  const [errors, setErrors] =
    useState<OrderNotesErrors>({});

  // ===================================================
  // FIELD UPDATE
  // ===================================================

  const updateField = <
    K extends keyof OrderNotesForm
  >(
    field: K,
    value: OrderNotesForm[K]
  ) => {
    const nextForm: OrderNotesForm = {
      ...form,
      [field]: value,
    };

    setForm(nextForm);

    // Send updated values to parent
    onChange?.(nextForm);

    // Only notes and giftMessage
    // can have validation errors.
    if (
      field === "notes" ||
      field === "giftMessage"
    ) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  };

  // ===================================================
  // VALIDATE ORDER NOTES
  // ===================================================

  const validateNotes = (
    value: string
  ): string => {
    const notes = value.trim();

    if (
      notes.length >
      MAX_NOTES_LENGTH
    ) {
      return `Order notes must be ${MAX_NOTES_LENGTH} characters or less.`;
    }

    return "";
  };

  // ===================================================
  // VALIDATE GIFT MESSAGE
  // ===================================================

  const validateGiftMessage = (
    value: string
  ): string => {
    // Gift message is optional.
    if (!value.trim()) {
      return "";
    }

    if (
      value.trim().length >
      MAX_GIFT_MESSAGE_LENGTH
    ) {
      return `Gift message must be ${MAX_GIFT_MESSAGE_LENGTH} characters or less.`;
    }

    return "";
  };

  // ===================================================
  // FULL VALIDATION
  // ===================================================

  const validateForm =
    (): OrderNotesErrors => {
      const nextErrors: OrderNotesErrors =
        {};

      const notesError =
        validateNotes(form.notes);

      const giftMessageError =
        form.isGift
          ? validateGiftMessage(
              form.giftMessage
            )
          : "";

      if (notesError) {
        nextErrors.notes =
          notesError;
      }

      if (giftMessageError) {
        nextErrors.giftMessage =
          giftMessageError;
      }

      return nextErrors;
    };

  // ===================================================
  // TOGGLE GIFT
  // ===================================================

  const handleGiftToggle = () => {
    const nextGiftState =
      !form.isGift;

    const nextForm: OrderNotesForm = {
      ...form,
      isGift: nextGiftState,
    };

    setForm(nextForm);

    // Send updated gift state to parent
    onChange?.(nextForm);

    // Remove gift-message error
    // when gift mode is disabled.
    if (!nextGiftState) {
      setErrors((current) => {
        const next = {
          ...current,
        };

        delete next.giftMessage;

        return next;
      });
    }
  };

  // ===================================================
  // NOTES BLUR VALIDATION
  // ===================================================

  const handleNotesBlur = () => {
    const error =
      validateNotes(
        form.notes
      );

    setErrors((current) => ({
      ...current,
      ...(error
        ? {
            notes: error,
          }
        : {
            notes: undefined,
          }),
    }));
  };

  // ===================================================
  // GIFT MESSAGE BLUR VALIDATION
  // ===================================================

  const handleGiftMessageBlur =
    () => {
      if (!form.isGift) {
        return;
      }

      const error =
        validateGiftMessage(
          form.giftMessage
        );

      setErrors((current) => ({
        ...current,
        ...(error
          ? {
              giftMessage:
                error,
            }
          : {
              giftMessage:
                undefined,
            }),
      }));
    };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section
      aria-labelledby="order-notes-title"
      className="bg-white border border-line rounded-card p-5"
    >
      {/* =================================================
          HEADER
      ================================================== */}

      <div className="flex items-center gap-2.5 mb-4">
        <span
          className="w-6 h-6 rounded-full bg-navy text-white text-[12px] font-bold flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          4
        </span>

        <h2
          id="order-notes-title"
          className="text-[14.5px] font-bold text-ink"
        >
          Order Notes
        </h2>
      </div>

      {/* =================================================
          ORDER NOTES
      ================================================== */}

      <label
        htmlFor="order-notes"
        className="text-[11.5px] font-semibold text-ink-soft block mb-1.5"
      >
        Special instructions or delivery notes
      </label>

      <input
        id="order-notes"
        type="text"
        value={form.notes}
        onChange={(event) =>
          updateField(
            "notes",
            event.target.value.slice(
              0,
              MAX_NOTES_LENGTH
            )
          )
        }
        onBlur={
          handleNotesBlur
        }
        placeholder="Type here..."
        maxLength={
          MAX_NOTES_LENGTH
        }
        aria-invalid={
          errors.notes
            ? "true"
            : "false"
        }
        aria-describedby={
          errors.notes
            ? "order-notes-error"
            : undefined
        }
        className={`w-full bg-white border rounded-lg px-3 py-2.5 text-[12.5px] text-ink placeholder:text-ink-faint outline-none transition-colors ${
          errors.notes
            ? "border-red-500 focus:border-red-500"
            : "border-line focus:border-navy"
        }`}
      />

      {/* =================================================
          NOTES ERROR
      ================================================== */}

      {errors.notes && (
        <p
          id="order-notes-error"
          role="alert"
          className="text-[10.5px] text-red-600 mt-1"
        >
          {errors.notes}
        </p>
      )}

      {/* =================================================
          NOTES CHARACTER COUNT
      ================================================== */}

      <div className="flex justify-end mt-1">
        <span className="text-[9.5px] text-ink-faint">
          {form.notes.length}/
          {MAX_NOTES_LENGTH}
        </span>
      </div>

      {/* =================================================
          GIFT CHECKBOX
      ================================================== */}

      <label className="flex items-center gap-2 mt-3 text-[12.5px] font-semibold text-ink cursor-pointer">
        <input
          type="checkbox"
          checked={form.isGift}
          onChange={
            handleGiftToggle
          }
          className="accent-navy"
        />

        <span>
          This is a gift order
        </span>
      </label>

      {/* =================================================
          GIFT MESSAGE
      ================================================== */}

      {form.isGift && (
        <div className="mt-3">
          <label
            htmlFor="gift-message"
            className="text-[11px] text-ink-soft block mb-1.5"
          >
            Add a personalized message below
          </label>

          <input
            id="gift-message"
            type="text"
            value={
              form.giftMessage
            }
            onChange={(event) =>
              updateField(
                "giftMessage",
                event.target.value.slice(
                  0,
                  MAX_GIFT_MESSAGE_LENGTH
                )
              )
            }
            onBlur={
              handleGiftMessageBlur
            }
            placeholder="Type your gift message (e.g. Best wishes on your grand retail launch!)"
            maxLength={
              MAX_GIFT_MESSAGE_LENGTH
            }
            aria-invalid={
              errors.giftMessage
                ? "true"
                : "false"
            }
            aria-describedby={
              errors.giftMessage
                ? "gift-message-error"
                : undefined
            }
            className={`w-full bg-white border rounded-lg px-3 py-2.5 text-[12.5px] text-ink placeholder:text-ink-faint outline-none transition-colors ${
              errors.giftMessage
                ? "border-red-500 focus:border-red-500"
                : "border-line focus:border-navy"
            }`}
          />

          {/* =================================================
              GIFT ERROR
          ================================================== */}

          {errors.giftMessage && (
            <p
              id="gift-message-error"
              role="alert"
              className="text-[10.5px] text-red-600 mt-1"
            >
              {
                errors.giftMessage
              }
            </p>
          )}

          {/* =================================================
              GIFT CHARACTER COUNT
          ================================================== */}

          <div className="flex justify-end mt-1">
            <span className="text-[9.5px] text-ink-faint">
              {
                form.giftMessage
                  .length
              }
              /
              {
                MAX_GIFT_MESSAGE_LENGTH
              }
            </span>
          </div>
        </div>
      )}

      {/* =================================================
          VALIDATION STATUS
      ================================================== */}

      {Object.keys(errors)
        .length === 0 &&
        (form.notes.trim() ||
          form.giftMessage.trim()) && (
          <div
            role="status"
            className="text-[10.5px] text-green font-semibold mt-2"
          >
            Order notes are valid.
          </div>
        )}

      {/* =================================================
          OPTIONAL DEBUG / VALIDATION
      ================================================== */}

      {false && (
        <button
          type="button"
          onClick={() => {
            const validationErrors =
              validateForm();

            setErrors(
              validationErrors
            );
          }}
        >
          Validate
        </button>
      )}
    </section>
  );
}