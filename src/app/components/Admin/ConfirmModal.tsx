// File: app/components/Admin/ConfirmModal.tsx
"use client";

import {
  useEffect,
  useId,
  type ReactNode,
} from "react";

import {
  AlertTriangle,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type ConfirmModalProps = {
  open: boolean;

  title?: string;
  description?: string;

  confirmText?: string;
  cancelText?: string;

  onConfirm: () => void;
  onCancel: () => void;

  loading?: boolean;
  danger?: boolean;

  icon?: ReactNode;

  className?: string;
};

/* ============================================================
   VALIDATION HELPERS
============================================================ */

function safeText(
  value: string | undefined,
  fallback: string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return fallback;
  }

  return value.trim();
}

/* ============================================================
   COMPONENT
============================================================ */

export default function ConfirmModal({
  open,

  title = "Are you sure?",
  description = "This action cannot be undone.",

  confirmText = "Confirm",
  cancelText = "Cancel",

  onConfirm,
  onCancel,

  loading = false,
  danger = true,

  icon,

  className = "",
}: ConfirmModalProps) {
  /* ==========================================================
     UNIQUE IDS
  ========================================================== */

  const titleId = useId();
  const descriptionId = useId();

  /* ==========================================================
     SAFE TEXT
  ========================================================== */

  const safeTitle = safeText(
    title,
    "Are you sure?"
  );

  const safeDescription =
    safeText(
      description,
      "This action cannot be undone."
    );

  const safeConfirmText =
    safeText(
      confirmText,
      "Confirm"
    );

  const safeCancelText =
    safeText(
      cancelText,
      "Cancel"
    );

  /* ==========================================================
     ESC KEY
  ========================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape" &&
        !loading
      ) {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    loading,
    onCancel,
  ]);

  /* ==========================================================
     BODY SCROLL LOCK
  ========================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  /* ==========================================================
     CLOSED
  ========================================================== */

  if (!open) {
    return null;
  }

  /* ==========================================================
     HANDLERS
  ========================================================== */

  const handleCancel = () => {
    if (loading) {
      return;
    }

    onCancel();
  };

  const handleConfirm = () => {
    if (loading) {
      return;
    }

    onConfirm();
  };

  /* ==========================================================
     MODAL
  ========================================================== */

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]
        flex
        items-center
        justify-center
        p-4
      "
      role="presentation"
    >
      {/* ====================================================
          BACKDROP
      ===================================================== */}

      <button
        type="button"
        aria-label="Close confirmation dialog"
        tabIndex={loading ? -1 : 0}
        disabled={loading}
        onClick={handleCancel}
        className="
          absolute
          inset-0
          cursor-default
          bg-black/40
          disabled:cursor-not-allowed
        "
      />

      {/* ====================================================
          CONTENT
      ===================================================== */}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`
          relative
          z-10
          w-full
          max-w-[420px]
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
          ${className}
        `}
      >
        {/* ==================================================
            CLOSE BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          aria-label="Close confirmation dialog"
          className="
            absolute
            right-4
            top-4
            z-10
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            text-[#7B8798]
            transition
            hover:bg-[#F2F5F8]
            hover:text-[#263650]
            focus:outline-none
            focus:ring-2
            focus:ring-[#1769F5]/30
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <X
            size={17}
            aria-hidden="true"
          />
        </button>

        {/* ==================================================
            BODY
        ================================================== */}

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            {/* =================================================
                ICON
            ================================================= */}

            <div
              aria-hidden="true"
              className={`
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-full
                ${
                  danger
                    ? "bg-[#FFF0F0] text-[#D85A5A]"
                    : "bg-[#EEF5FF] text-[#1769F5]"
                }
              `}
            >
              {icon ?? (
                <AlertTriangle
                  size={20}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* =================================================
                TEXT
            ================================================= */}

            <div className="min-w-0 flex-1 pr-5">
              <h2
                id={titleId}
                className="
                  text-[15px]
                  font-bold
                  leading-5
                  text-[#263650]
                "
              >
                {safeTitle}
              </h2>

              <p
                id={descriptionId}
                className="
                  mt-2
                  text-[10px]
                  leading-5
                  text-[#7B8798]
                "
              >
                {safeDescription}
              </p>
            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================== */}

          <div
            className="
              mt-6
              flex
              flex-col-reverse
              gap-2
              sm:flex-row
              sm:justify-end
            "
          >
            {/* =================================================
                CANCEL
            ================================================== */}

            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="
                h-10
                rounded-lg
                border
                border-[#DCE2EA]
                px-5
                text-[10px]
                font-semibold
                text-[#647287]
                transition
                hover:bg-[#F5F7FA]
                focus:outline-none
                focus:ring-2
                focus:ring-[#1769F5]/30
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:min-w-[90px]
              "
            >
              {safeCancelText}
            </button>

            {/* =================================================
                CONFIRM
            ================================================== */}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              aria-busy={loading}
              className={`
                flex
                h-10
                items-center
                justify-center
                rounded-lg
                px-5
                text-[10px]
                font-semibold
                text-white
                transition
                focus:outline-none
                focus:ring-2
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:min-w-[100px]
                ${
                  danger
                    ? `
                      bg-[#DC4B4B]
                      hover:bg-[#C83E3E]
                      focus:ring-[#DC4B4B]/30
                    `
                    : `
                      bg-[#1769F5]
                      hover:bg-[#0F5BDE]
                      focus:ring-[#1769F5]/30
                    `
                }
              `}
            >
              {loading ? (
                <>
                  <span
                    aria-hidden="true"
                    className="
                      mr-2
                      h-3.5
                      w-3.5
                      animate-spin
                      rounded-full
                      border-2
                      border-white/40
                      border-t-white
                    "
                  />

                  <span>
                    Processing...
                  </span>
                </>
              ) : (
                safeConfirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}