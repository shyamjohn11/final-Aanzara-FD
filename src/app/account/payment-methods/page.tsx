"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  X,
  CreditCard,
  Plus,
  Trash2,
  Pencil,
  Check,
  ShieldCheck,
} from "lucide-react";

type CardType = {
  id: number;
  number: string;
  name: string;
  type: "Visa" | "Mastercard" | "Card";
  isDefault: boolean;
};

type FormErrors = {
  number?: string;
  name?: string;
};

const EMPTY_FORM = {
  number: "",
  name: "",
};

const CARD_NAME_REGEX = /^[A-Za-z\s]+$/;

/* =========================================================
   CARD TYPE
========================================================= */

const getCardType = (
  cardNumber: string
): "Visa" | "Mastercard" | "Card" => {
  const clean = cardNumber.replace(/\s/g, "");

  if (clean.startsWith("4")) {
    return "Visa";
  }

  if (
    clean.startsWith("5") ||
    (Number(clean.slice(0, 2)) >= 51 &&
      Number(clean.slice(0, 2)) <= 55)
  ) {
    return "Mastercard";
  }

  return "Card";
};

/* =========================================================
   LUHN VALIDATION
========================================================= */

const isValidLuhn = (
  cardNumber: string
): boolean => {
  const clean = cardNumber.replace(/\D/g, "");

  if (!clean) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (
    let i = clean.length - 1;
    i >= 0;
    i--
  ) {
    let digit = Number(clean[i]);

    if (shouldDouble) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

/* =========================================================
   MASK CARD NUMBER
========================================================= */

const maskCardNumber = (
  cardNumber: string
) => {
  const clean = cardNumber.replace(/\s/g, "");

  if (clean.length < 4) {
    return clean;
  }

  return `•••• •••• •••• ${clean.slice(-4)}`;
};

/* =========================================================
   FORMAT CARD NUMBER
========================================================= */

const formatCardNumber = (
  value: string
) => {
  const clean = value
    .replace(/\D/g, "")
    .slice(0, 16);

  return clean
    .replace(/(.{4})/g, "$1 ")
    .trim();
};

/* =========================================================
   VALIDATE CARD NUMBER
========================================================= */

const validateCardNumber = (
  value: string
): string => {
  const clean = value.replace(/\s/g, "");

  if (!clean) {
    return "Card number is required.";
  }

  if (!/^\d+$/.test(clean)) {
    return "Card number can contain only numbers.";
  }

  if (clean.length !== 16) {
    return "Card number must be exactly 16 digits.";
  }

  if (!isValidLuhn(clean)) {
    return "Please enter a valid card number.";
  }

  return "";
};

/* =========================================================
   VALIDATE CARD HOLDER NAME
========================================================= */

const validateCardHolderName = (
  value: string
): string => {
  const clean = value.trim();

  if (!clean) {
    return "Card holder name is required.";
  }

  if (clean.length < 2) {
    return "Card holder name must be at least 2 characters.";
  }

  if (clean.length > 50) {
    return "Card holder name cannot exceed 50 characters.";
  }

  if (!CARD_NAME_REGEX.test(clean)) {
    return "Card holder name can contain only letters and spaces.";
  }

  return "";
};

/* =========================================================
   PAGE CONTENT
   (renders inside src/app/account/layout.tsx —
    no TopBar/Header/MainNav/Footer/sidebar here anymore)
========================================================= */

export default function PaymentMethodsPage() {
  const router = useRouter();

  const [cards, setCards] = useState<CardType[]>(
    []
  );

  const [showForm, setShowForm] =
    useState(false);

  const [number, setNumber] =
    useState("");

  const [name, setName] =
    useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [saved, setSaved] =
    useState(false);

  /* =====================================================
     VALIDATE FORM
  ====================================================== */

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const numberError =
      validateCardNumber(number);

    const nameError =
      validateCardHolderName(name);

    if (numberError) {
      newErrors.number = numberError;
    }

    if (nameError) {
      newErrors.name = nameError;
    }

    /* ===================================================
       DUPLICATE CARD CHECK
    ==================================================== */

    const cleanNumber =
      number.replace(/\s/g, "");

    if (
      !numberError &&
      cleanNumber.length === 16
    ) {
      const duplicate = cards.some(
        (card) =>
          card.number === cleanNumber &&
          card.id !== editingId
      );

      if (duplicate) {
        newErrors.number =
          "This card is already saved.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* =====================================================
     OPEN ADD FORM
  ====================================================== */

  const openAddForm = () => {
    setNumber("");
    setName("");
    setEditingId(null);
    setErrors({});
    setSaved(false);
    setShowForm(true);
  };

  /* =====================================================
     CLOSE FORM
  ====================================================== */

  const closeForm = () => {
    setNumber("");
    setName("");
    setEditingId(null);
    setErrors({});
    setShowForm(false);
  };

  /* =====================================================
     CARD NUMBER CHANGE
  ====================================================== */

  const handleNumberChange = (
    value: string
  ) => {
    const formatted =
      formatCardNumber(value);

    setNumber(formatted);

    setErrors((current) => ({
      ...current,
      number: undefined,
    }));

    setSaved(false);
  };

  /* =====================================================
     CARD NUMBER BLUR
  ====================================================== */

  const handleNumberBlur = () => {
    const error =
      validateCardNumber(number);

    setErrors((current) => ({
      ...current,
      number: error || undefined,
    }));
  };

  /* =====================================================
     NAME CHANGE
  ====================================================== */

  const handleNameChange = (
    value: string
  ) => {
    const formatted = value
      .replace(/[^A-Za-z\s]/g, "")
      .slice(0, 50);

    setName(formatted);

    setErrors((current) => ({
      ...current,
      name: undefined,
    }));

    setSaved(false);
  };

  /* =====================================================
     NAME BLUR
  ====================================================== */

  const handleNameBlur = () => {
    const error =
      validateCardHolderName(name);

    setErrors((current) => ({
      ...current,
      name: error || undefined,
    }));
  };

  /* =====================================================
     SAVE CARD
  ====================================================== */

  const saveCard = () => {
    if (saved) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const cleanNumber =
      number.replace(/\s/g, "");

    const cleanName =
      name.trim();

    /* ===================================================
       EDIT
    ==================================================== */

    if (editingId !== null) {
      setCards((current) =>
        current.map((card) =>
          card.id === editingId
            ? {
                ...card,
                number: cleanNumber,
                name: cleanName,
                type: getCardType(
                  cleanNumber
                ),
              }
            : card
        )
      );

      closeForm();
      showSavedMessage();

      return;
    }

    /* ===================================================
       ADD
    ==================================================== */

    const newCard: CardType = {
      id: Date.now(),
      number: cleanNumber,
      name: cleanName,
      type: getCardType(cleanNumber),
      isDefault: cards.length === 0,
    };

    setCards((current) => [
      ...current,
      newCard,
    ]);

    closeForm();
    showSavedMessage();
  };

  /* =====================================================
     SUCCESS MESSAGE
  ====================================================== */

  const showSavedMessage = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2200);
  };

  /* =====================================================
     EDIT CARD
  ====================================================== */

  const editCard = (
    card: CardType
  ) => {
    setNumber(
      card.number
        .replace(/\D/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim()
    );

    setName(card.name);

    setEditingId(card.id);

    setErrors({});

    setSaved(false);

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =====================================================
     DELETE CARD
  ====================================================== */

  const removeCard = (
    id: number
  ) => {
    if (!Number.isFinite(id)) {
      return;
    }

    const removedCard =
      cards.find(
        (card) => card.id === id
      );

    if (!removedCard) {
      return;
    }

    let remaining =
      cards.filter(
        (card) => card.id !== id
      );

    if (
      removedCard.isDefault &&
      remaining.length > 0
    ) {
      remaining = remaining.map(
        (card, index) => ({
          ...card,
          isDefault: index === 0,
        })
      );
    }

    setCards(remaining);
  };

  /* =====================================================
     SET DEFAULT
  ====================================================== */

  const setDefaultCard = (
    id: number
  ) => {
    if (!Number.isFinite(id)) {
      return;
    }

    const exists = cards.some(
      (card) => card.id === id
    );

    if (!exists) {
      return;
    }

    setCards((current) =>
      current.map((card) => ({
        ...card,
        isDefault:
          card.id === id,
      }))
    );
  };

  /* =====================================================
     INPUT CLASS
  ====================================================== */

  const inputClass = (
    field: keyof FormErrors
  ) => {
    return `mt-2 h-11 w-full rounded-lg border px-3 text-[13px] outline-none transition ${
      errors[field]
        ? "border-[#EF4444] bg-[#FFF8F8] focus:border-[#EF4444]"
        : "border-[#DCE1E8] focus:border-[#1769F5]"
    }`;
  };

  /* =====================================================
     RENDER
  ====================================================== */

  return (
    <div className="mx-auto w-full max-w-[560px]">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-5 flex items-center gap-3">

        <button
          type="button"
          onClick={() => router.push("/account")}
          aria-label="Back to account"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-[#E5E7EB] transition hover:bg-[#F5F8FC]"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.8}
          />
        </button>

        <div>
          <h1 className="text-[20px] font-bold text-[#10265B]">
            Payment Methods
          </h1>

          <p className="mt-0.5 text-[12px] text-[#718096]">
            Manage your saved cards for faster checkout.
          </p>
        </div>

      </div>

      {/* ===================================================
          SECURITY INFO
      ==================================================== */}

      <section className="mb-4 flex items-center rounded-xl border border-[#D7E5FF] bg-[#F2F7FF] p-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E1EDFF]">

          <ShieldCheck
            size={22}
            className="text-[#1769F5]"
          />

        </div>

        <div className="ml-3">

          <p className="text-[12px] font-bold">
            Secure Payments
          </p>

          <p className="mt-1 text-[9px] leading-4 text-[#66748B]">
            Your payment information is protected.
          </p>

        </div>

      </section>

      {/* ===================================================
          ADD BUTTON
      ==================================================== */}

      {!showForm && (
        <button
          type="button"
          onClick={openAddForm}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-[#1769F5] text-[13px] font-semibold text-white transition hover:bg-[#0F5BDE]"
        >
          <Plus
            size={18}
            className="mr-2"
          />

          Add Payment Method
        </button>
      )}

      {/* ===================================================
          FORM
      ==================================================== */}

      {showForm && (
        <section className="rounded-xl border border-[#E5EAF1] p-4">

          {/* FORM HEADER */}

          <div className="flex items-center">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FF]">

              <CreditCard
                size={19}
                className="text-[#1769F5]"
              />

            </div>

            <div className="ml-3 flex-1">

              <p className="text-[13px] font-bold">
                {editingId !== null
                  ? "Edit Payment Method"
                  : "Add Payment Method"}
              </p>

              <p className="mt-1 text-[9px] text-[#718096]">
                Enter your card details.
              </p>

            </div>

            <button
              type="button"
              onClick={closeForm}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F5F8FC]"
              aria-label="Close form"
            >
              <X size={17} />
            </button>

          </div>

          {/* =================================================
              CARD NUMBER
          ================================================== */}

          <div className="mt-5">

            <label
              htmlFor="card-number"
              className="text-[10px] font-semibold text-[#52627A]"
            >
              Card Number
            </label>

            <input
              id="card-number"
              type="text"
              value={number}
              onChange={(e) =>
                handleNumberChange(
                  e.target.value
                )
              }
              onBlur={handleNumberBlur}
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={19}
              required
              aria-invalid={
                !!errors.number
              }
              placeholder="1234 5678 9012 3456"
              className={inputClass(
                "number"
              )}
            />

            {errors.number && (
              <p className="mt-1 text-[9px] font-medium text-[#EF4444]">
                {errors.number}
              </p>
            )}

            <p className="mt-1 text-[8px] text-[#8A96A8]">
              {number.replace(/\s/g, "").length}
              /16 digits
            </p>

          </div>

          {/* =================================================
              CARD HOLDER
          ================================================== */}

          <div className="mt-4">

            <label
              htmlFor="card-holder-name"
              className="text-[10px] font-semibold text-[#52627A]"
            >
              Card Holder Name
            </label>

            <input
              id="card-holder-name"
              type="text"
              value={name}
              onChange={(e) =>
                handleNameChange(
                  e.target.value
                )
              }
              onBlur={handleNameBlur}
              autoComplete="cc-name"
              maxLength={50}
              required
              aria-invalid={
                !!errors.name
              }
              placeholder="Enter card holder name"
              className={inputClass(
                "name"
              )}
            />

            {errors.name && (
              <p className="mt-1 text-[9px] font-medium text-[#EF4444]">
                {errors.name}
              </p>
            )}

            <p className="mt-1 text-right text-[8px] text-[#8A96A8]">
              {name.length}/50
            </p>

          </div>

          {/* =================================================
              FORM ERROR SUMMARY
          ================================================== */}

          {Object.keys(errors).length > 0 && (
            <div className="mt-4 rounded-lg border border-[#FECACA] bg-[#FFF2F2] px-3 py-2">

              <p className="text-[10px] font-semibold text-[#D92D20]">
                Please correct the highlighted
                fields before saving.
              </p>

            </div>
          )}

          {/* =================================================
              ACTIONS
          ================================================== */}

          <div className="mt-5 grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={closeForm}
              className="h-10 rounded-lg border border-[#DCE1E8] text-[11px] font-semibold text-[#52627A] transition hover:bg-[#F8FAFD]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveCard}
              disabled={saved}
              className="h-10 rounded-lg bg-[#1769F5] text-[11px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingId !== null
                ? "Update Card"
                : "Save Card"}
            </button>

          </div>

        </section>
      )}

      {/* ===================================================
          SUCCESS
      ==================================================== */}

      {saved && (
        <div className="mt-3 flex items-center justify-center rounded-lg border border-[#B7E4C7] bg-[#EAF7EF] px-4 py-3">

          <Check
            size={15}
            className="mr-2 text-[#159447]"
          />

          <p className="text-[10px] font-semibold text-[#159447]">
            Payment method saved successfully.
          </p>

        </div>
      )}

      {/* ===================================================
          CARD LIST
      ==================================================== */}

      <div className="mt-5 space-y-3">

        {cards.length === 0 ? (
          <div className="rounded-xl border border-[#E5EAF1] p-8 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F2F7FF]">

              <CreditCard
                size={29}
                className="text-[#1769F5]"
              />

            </div>

            <p className="mt-3 text-[13px] font-semibold">
              No payment methods
            </p>

            <p className="mt-1 text-[11px] leading-5 text-[#718096]">
              Add a payment method for faster
              checkout.
            </p>

            {!showForm && (
              <button
                type="button"
                onClick={openAddForm}
                className="mt-4 text-[11px] font-semibold text-[#1769F5]"
              >
                + Add your first card
              </button>
            )}

          </div>
        ) : (
          cards.map((card) => (
            <div
              key={card.id}
              className="rounded-xl border border-[#E5EAF1] bg-white p-4"
            >

              {/* CARD HEADER */}

              <div className="flex items-center">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF]">

                  <CreditCard
                    size={21}
                    className="text-[#1769F5]"
                  />

                </div>

                <div className="ml-3 min-w-0 flex-1">

                  <div className="flex items-center">

                    <p className="text-[12px] font-bold">
                      {card.type}
                    </p>

                    {card.isDefault && (
                      <span className="ml-2 flex items-center rounded-full bg-[#EAF7EF] px-2 py-0.5 text-[8px] font-semibold text-[#159447]">

                        <Check
                          size={10}
                          className="mr-0.5"
                        />

                        Default

                      </span>
                    )}

                  </div>

                  <p className="mt-1 text-[11px] tracking-wide text-[#52627A]">
                    {maskCardNumber(
                      card.number
                    )}
                  </p>

                  <p className="mt-1 text-[9px] uppercase text-[#718096]">
                    {card.name}
                  </p>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="mt-4 flex items-center border-t border-[#EEF1F5] pt-3">

                {!card.isDefault && (
                  <button
                    type="button"
                    onClick={() =>
                      setDefaultCard(
                        card.id
                      )
                    }
                    className="text-[10px] font-semibold text-[#1769F5]"
                  >
                    Set as Default
                  </button>
                )}

                <div className="ml-auto flex items-center gap-4">

                  <button
                    type="button"
                    onClick={() =>
                      editCard(card)
                    }
                    className="flex items-center text-[10px] font-semibold text-[#52627A]"
                  >
                    <Pencil
                      size={14}
                      className="mr-1"
                    />

                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeCard(card.id)
                    }
                    className="flex items-center text-[10px] font-semibold text-[#EF4444]"
                  >
                    <Trash2
                      size={14}
                      className="mr-1"
                    />

                    Delete
                  </button>

                </div>

              </div>

            </div>
          ))
        )}

      </div>

      {/* ===================================================
          BACK
      ==================================================== */}

      <button
        type="button"
        onClick={() =>
          router.push("/account")
        }
        className="mt-5 mb-6 w-full text-center text-[11px] font-semibold text-[#1769F5] hover:underline"
      >
        Back to Account
      </button>

    </div>
  );
}
