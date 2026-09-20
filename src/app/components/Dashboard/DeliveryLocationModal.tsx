// File: app/components/Dashboard/DeliveryLocationModal.tsx
"use client";

import { useEffect, useState } from "react";
import { MapPin, X, LocateFixed } from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

export type DeliveryAddress = {
  line1: string;
  city: string;
  state: string;
  pincode: string;
};

type DeliveryLocationModalProps = {
  open: boolean;
  onClose: () => void;
  address: DeliveryAddress;
  onSave: (address: DeliveryAddress) => void;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function DeliveryLocationModal({
  open,
  onClose,
  address,
  onSave,
}: DeliveryLocationModalProps) {
  /* ==========================================================
     LOCAL DRAFT STATE
     (only committed to the parent when "Save" is pressed)
  ========================================================== */

  const [draft, setDraft] = useState<DeliveryAddress>(address);

  // Reset the draft to the current saved address every time the
  // modal is (re)opened, so stale edits from a previous open
  // don't linger.
  useEffect(() => {
    if (open) {
      setDraft(address);
    }
  }, [open, address]);

  /* ==========================================================
     CLOSE ON ESCAPE
  ========================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose delivery location"
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/50
        px-4
      "
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="
          w-full
          max-w-[420px]
          rounded-2xl
          bg-white
          p-6
          shadow-2xl
        "
      >
        {/* HEADER */}

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-green/10
                text-green
              "
            >
              <MapPin size={17} aria-hidden="true" />
            </span>

            <h2 className="text-[15px] font-bold text-ink">
              Choose delivery location
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              text-ink-soft
              transition-colors
              hover:bg-slate-100
              hover:text-ink
            "
          >
            <X size={16} />
          </button>
        </div>

        {/* USE CURRENT LOCATION */}

        <button
          type="button"
          className="
            mt-5
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-green/30
            bg-green/5
            py-2.5
            text-[12.5px]
            font-semibold
            text-green-deep
            transition-colors
            hover:bg-green/10
          "
        >
          <LocateFixed size={15} aria-hidden="true" />
          Use my current location
        </button>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] text-ink-faint">
            or enter manually
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {/* FORM */}

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[11.5px] font-semibold text-ink-soft">
              Address
            </label>
            <input
              type="text"
              value={draft.line1}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  line1: event.target.value,
                }))
              }
              placeholder="House no., street, area"
              className="
                w-full
                rounded-lg
                border
                border-line
                px-3
                py-2
                text-[13px]
                outline-none
                focus:border-green
                focus:ring-1
                focus:ring-green/20
              "
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-ink-soft">
                City
              </label>
              <input
                type="text"
                value={draft.city}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    city: event.target.value,
                  }))
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-line
                  px-3
                  py-2
                  text-[13px]
                  outline-none
                  focus:border-green
                  focus:ring-1
                  focus:ring-green/20
                "
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-ink-soft">
                State
              </label>
              <input
                type="text"
                value={draft.state}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    state: event.target.value,
                  }))
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-line
                  px-3
                  py-2
                  text-[13px]
                  outline-none
                  focus:border-green
                  focus:ring-1
                  focus:ring-green/20
                "
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] font-semibold text-ink-soft">
              Pincode
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={draft.pincode}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  pincode: event.target.value,
                }))
              }
              className="
                w-full
                rounded-lg
                border
                border-line
                px-3
                py-2
                text-[13px]
                outline-none
                focus:border-green
                focus:ring-1
                focus:ring-green/20
              "
            />
          </div>
        </div>

        {/* ACTIONS */}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="
              flex-1
              rounded-lg
              border
              border-line
              py-2.5
              text-[12.5px]
              font-semibold
              text-ink-soft
              transition-colors
              hover:bg-slate-50
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="
              flex-1
              rounded-lg
              bg-green
              py-2.5
              text-[12.5px]
              font-bold
              text-white
              transition-colors
              hover:bg-green-deep
            "
          >
            Save location
          </button>
        </div>
      </div>
    </div>
  );
}
