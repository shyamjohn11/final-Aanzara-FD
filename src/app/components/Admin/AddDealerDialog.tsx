"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { createPortal } from "react-dom";

import {
  CheckCircle2,
  Store,
  X,
} from "lucide-react";

import { toast } from "react-toastify";

import {
  extractErrorMessage,
} from "@/app/api/api";
import { dealersApi } from "@/app/api/services";

/* =========================================================
   ADD DEALER DIALOG — creates a dealer already assigned to
   the given agent (POST /api/admin/dealers). The backend
   validates the agent and auto-generates the dealer code
   when left blank. Rendered through a portal so the
   backdrop always covers the full viewport.
========================================================= */

type AddDealerDialogProps = {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentName?: string;
  onCreated?: () => void;
  /** Edit mode: prefill from these values and PUT instead of POST. */
  editing?: {
    id: string;
    shopName: string;
    ownerName: string;
    phone?: string | null;
    alternatePhone?: string | null;
    email?: string | null;
    city?: string | null;
    address?: string | null;
    gstNumber?: string | null;
    panNumber?: string | null;
    dealerCode?: string | null;
  } | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13.5px] text-ink outline-none transition placeholder:text-[#8A99AD] focus:border-navy focus:ring-2 focus:ring-navy/10";

const labelClass =
  "mb-1.5 block text-[12px] font-semibold text-ink";

export default function AddDealerDialog({
  open,
  onClose,
  agentId,
  agentName = "",
  onCreated,
  editing = null,
}: AddDealerDialogProps) {
  const [mounted, setMounted] = useState(false);
  const isEdit = !!editing;

  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [dealerCode, setDealerCode] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset (add mode) or prefill (edit mode) every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setShopName(editing?.shopName ?? "");
    setOwnerName(editing?.ownerName ?? "");
    setPhone(editing?.phone ?? "");
    setAlternatePhone(editing?.alternatePhone ?? "");
    setEmail(editing?.email ?? "");
    setCity(editing?.city ?? "");
    setAddress(editing?.address ?? "");
    setGstNumber(editing?.gstNumber ?? "");
    setPanNumber(editing?.panNumber ?? "");
    setDealerCode(editing?.dealerCode ?? "");
    setError("");
    setSubmitting(false);
    setSubmitted(false);
  }, [open, editing]);

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

    const cleanShop = shopName.trim();
    const cleanOwner = ownerName.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanAltPhone = alternatePhone.replace(/\D/g, "");
    const cleanEmail = email.trim();
    const cleanCity = city.trim();
    const cleanAddress = address.trim();
    const cleanGst = gstNumber.trim().toUpperCase();
    const cleanPan = panNumber.trim().toUpperCase();
    const cleanCode = dealerCode.trim();

    if (cleanShop.length < 2) {
      setError("Please enter the shop name.");
      return;
    }
    if (cleanOwner.length < 2) {
      setError("Please enter the owner name.");
      return;
    }
    if (!PHONE_RE.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (cleanAltPhone && !PHONE_RE.test(cleanAltPhone)) {
      setError("Please enter a valid 10-digit alternate number.");
      return;
    }
    if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && editing) {
        await dealersApi.update(editing.id, {
          shopName: cleanShop,
          ownerName: cleanOwner,
          phone: cleanPhone,
          alternatePhone: cleanAltPhone || null,
          email: cleanEmail || null,
          city: cleanCity || null,
          address: cleanAddress || null,
          gstNumber: cleanGst || null,
          panNumber: cleanPan || null,
          dealerCode: cleanCode || undefined,
        });
        setSubmitted(true);
        toast.success(`Dealer "${cleanShop}" updated successfully.`);
      } else {
        await dealersApi.create({
          agentId,
          shopName: cleanShop,
          ownerName: cleanOwner,
          phone: cleanPhone,
          ...(cleanAltPhone ? { alternatePhone: cleanAltPhone } : {}),
          ...(cleanEmail ? { email: cleanEmail } : {}),
          ...(cleanCity ? { city: cleanCity } : {}),
          ...(cleanAddress ? { address: cleanAddress } : {}),
          ...(cleanGst ? { gstNumber: cleanGst } : {}),
          ...(cleanPan ? { panNumber: cleanPan } : {}),
          ...(cleanCode ? { dealerCode: cleanCode } : {}),
        });
        setSubmitted(true);
        toast.success(
          `Dealer "${cleanShop}" added${agentName ? ` to ${agentName}` : ""}.`
        );
      }
      onCreated?.();
    } catch (err) {
      const message = extractErrorMessage(
        err,
        isEdit
          ? "Could not update the dealer. Please try again."
          : "Could not add the dealer. Please try again."
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
      aria-label={isEdit ? "Edit dealer" : "Add dealer"}
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
              text-white
            "
          >
            <Store size={19} />
          </span>

          <span>
            <span className="block font-sora text-[16px] font-bold leading-tight text-white">
              {isEdit ? "Edit Dealer" : "Add Dealer"}
            </span>

            <span className="mt-0.5 block truncate text-[11.5px] leading-snug text-white/80">
              {isEdit
                ? "Update the shop details below."
                : agentName
                  ? `Assigning to ${agentName}`
                  : "Assigning to this agent"}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={isEdit ? "Close edit dealer dialog" : "Close add dealer dialog"}
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
                {isEdit ? "Dealer updated!" : "Dealer added!"}
              </h2>

              <p className="mx-auto mt-2 max-w-[300px] text-[12.5px] leading-relaxed text-ink-soft">
                {isEdit
                  ? "The new details are live in the dealer list."
                  : "The shop now appears in this agent's dealer list."}
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
                    htmlFor="add-dealer-shop"
                    className={labelClass}
                  >
                    Shop name *
                  </label>

                  <input
                    id="add-dealer-shop"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. MarginFree Super Market"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="add-dealer-owner"
                    className={labelClass}
                  >
                    Owner name *
                  </label>

                  <input
                    id="add-dealer-owner"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Kevin"
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="add-dealer-phone"
                      className={labelClass}
                    >
                      Mobile *
                    </label>

                    <input
                      id="add-dealer-phone"
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
                      htmlFor="add-dealer-email"
                      className={labelClass}
                    >
                      Email
                    </label>

                    <input
                      id="add-dealer-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="add-dealer-altphone"
                      className={labelClass}
                    >
                      Alternate Phone
                    </label>

                    <input
                      id="add-dealer-altphone"
                      value={alternatePhone}
                      onChange={(e) =>
                        setAlternatePhone(e.target.value)
                      }
                      placeholder="10-digit number"
                      inputMode="numeric"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="add-dealer-city"
                      className={labelClass}
                    >
                      City
                    </label>

                    <input
                      id="add-dealer-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Coimbatore"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="add-dealer-address"
                    className={labelClass}
                  >
                    Address
                  </label>

                  <textarea
                    id="add-dealer-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 12 Bazaar Street, Nagercoil"
                    rows={2}
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="add-dealer-gst"
                      className={labelClass}
                    >
                      GST Number
                    </label>

                    <input
                      id="add-dealer-gst"
                      value={gstNumber}
                      onChange={(e) =>
                        setGstNumber(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. 33ABCDE1234F1Z5"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="add-dealer-pan"
                      className={labelClass}
                    >
                      PAN Number
                    </label>

                    <input
                      id="add-dealer-pan"
                      value={panNumber}
                      onChange={(e) =>
                        setPanNumber(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. ABCDE1234F"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="add-dealer-code"
                    className={labelClass}
                  >
                    Dealer code
                  </label>

                  <input
                    id="add-dealer-code"
                    value={dealerCode}
                    onChange={(e) => setDealerCode(e.target.value)}
                    placeholder="Auto if empty"
                    autoComplete="off"
                    className={inputClass}
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
                    bg-navy
                    text-[14.5px]
                    font-bold
                    text-white
                    transition-colors
                    hover:bg-navy-deep
                    disabled:opacity-60
                  "
                >
                  {submitting
                    ? isEdit
                      ? "Saving…"
                      : "Adding…"
                    : isEdit
                      ? "Save Changes"
                      : "Add Dealer"}
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
