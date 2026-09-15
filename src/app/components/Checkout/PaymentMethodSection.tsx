"use client";

// VERIFIED: no customer-facing backend endpoint publishes the payment
// method catalogue (checkoutApi only places orders; settingsApi
// #143-144 is admin-only). This section keeps its validated static
// payment methods with an enabled empty-state.

import { useState } from "react";
import {
  Smartphone,
  CreditCard,
  Landmark,
  Wallet,
  Briefcase,
  Gift,
  CheckCircle2,
} from "lucide-react";

import { PAYMENT_METHODS } from "@/app/data/checkout";

// No customer-facing backend endpoint publishes the payment method
// catalogue (checkoutApi only places orders with a method string).
// These match CheckoutPaymentMethod in services.ts and render when
// the backend-fed list is empty.

// =====================================================
// ICONS
// =====================================================

const ICONS = {
  upi: Smartphone,
  card: CreditCard,
  netbanking: Landmark,
  cod: Wallet,
  credit: Briefcase,
  wallet: Gift,
} as const;

// =====================================================
// TYPES
// =====================================================

type PaymentMethodSectionProps = {
  onPaymentReady?: (
    ready: boolean,
    paymentMethod: string
  ) => void;
};

type PaymentMethod = {
  id: string;
  name: string;
  detail: string;
  icon: string;
};

type Errors = {
  upiId?: string;

  cardNumber?: string;
  cardName?: string;
  expiry?: string;
  cvv?: string;

  bank?: string;
  accountHolder?: string;
  accountNumber?: string;

  companyName?: string;
  creditAccount?: string;

  walletProvider?: string;
  walletNumber?: string;
};

const FALLBACK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "upi",
    name: "UPI",
    detail: "Pay instantly with any UPI app",
    icon: "upi",
  },
  {
    id: "card",
    name: "Credit / Debit Card",
    detail: "Visa, Mastercard, RuPay accepted",
    icon: "card",
  },
  {
    id: "netbanking",
    name: "Net Banking",
    detail: "All major banks supported",
    icon: "netbanking",
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    detail: "Pay when your order arrives",
    icon: "cod",
  },
  {
    id: "credit",
    name: "Business Credit",
    detail: "For approved business accounts",
    icon: "credit",
  },
  {
    id: "wallet",
    name: "Wallet",
    detail: "Pay with your preferred wallet",
    icon: "wallet",
  },
];

// =====================================================
// VALIDATION HELPERS
// =====================================================

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidPaymentMethod(
  value: unknown
): value is PaymentMethod {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const method =
    value as Partial<PaymentMethod>;

  return (
    isNonEmptyString(method.id) &&
    isNonEmptyString(method.name) &&
    isNonEmptyString(method.detail) &&
    isNonEmptyString(method.icon)
  );
}

// =====================================================
// UPI VALIDATION
// =====================================================

function validateUpiId(
  value: string
): string {
  const upi = value.trim();

  if (!upi) {
    return "Please enter your UPI ID.";
  }

  if (upi.length > 100) {
    return "UPI ID is too long.";
  }

  const upiRegex =
    /^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9._-]{2,}$/;

  if (!upiRegex.test(upi)) {
    return (
      "Please enter a valid UPI ID. " +
      "Example: business@okaxis"
    );
  }

  return "";
}

// =====================================================
// CARD VALIDATION
// =====================================================

function cleanCardNumber(
  value: string
): string {
  return value.replace(/\D/g, "");
}

function validateCardNumber(
  value: string
): string {
  const card =
    cleanCardNumber(value);

  if (!card) {
    return "Please enter your card number.";
  }

  if (
    card.length < 12 ||
    card.length > 19
  ) {
    return "Please enter a valid card number.";
  }

  // Luhn validation
  let sum = 0;
  let shouldDouble = false;

  for (
    let i = card.length - 1;
    i >= 0;
    i--
  ) {
    let digit = Number(card[i]);

    if (shouldDouble) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  if (sum % 10 !== 0) {
    return "Please enter a valid card number.";
  }

  return "";
}

function validateCardName(
  value: string
): string {
  const name = value.trim();

  if (!name) {
    return "Please enter the cardholder name.";
  }

  if (name.length < 2) {
    return "Cardholder name is too short.";
  }

  if (name.length > 100) {
    return "Cardholder name is too long.";
  }

  if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
    return "Please enter a valid cardholder name.";
  }

  return "";
}

function validateExpiry(
  value: string
): string {
  const expiry = value.trim();

  if (!expiry) {
    return "Please enter card expiry.";
  }

  if (
    !/^(0[1-9]|1[0-2])\/\d{2}$/.test(
      expiry
    )
  ) {
    return "Expiry must be in MM/YY format.";
  }

  const [
    monthString,
    yearString,
  ] = expiry.split("/");

  const month =
    Number(monthString);

  const year =
    Number(`20${yearString}`);

  const now = new Date();

  const currentMonth =
    now.getMonth() + 1;

  const currentYear =
    now.getFullYear();

  if (
    year < currentYear ||
    (year === currentYear &&
      month < currentMonth)
  ) {
    return "Card expiry date has passed.";
  }

  return "";
}

function validateCvv(
  value: string
): string {
  const cvv = value.trim();

  if (!cvv) {
    return "Please enter CVV.";
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    return "CVV must contain 3 or 4 digits.";
  }

  return "";
}

// =====================================================
// BANK VALIDATION
// =====================================================

function validateAccountHolder(
  value: string
): string {
  const name = value.trim();

  if (!name) {
    return "Please enter account holder name.";
  }

  if (name.length < 2) {
    return "Account holder name is too short.";
  }

  if (name.length > 100) {
    return "Account holder name is too long.";
  }

  if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
    return "Please enter a valid account holder name.";
  }

  return "";
}

function validateAccountNumber(
  value: string
): string {
  const account =
    value.trim();

  if (!account) {
    return "Please enter account number.";
  }

  if (!/^\d{8,20}$/.test(account)) {
    return (
      "Account number must contain 8 to 20 digits."
    );
  }

  return "";
}

// =====================================================
// BUSINESS CREDIT VALIDATION
// =====================================================

function validateCompanyName(
  value: string
): string {
  const company =
    value.trim();

  if (!company) {
    return "Please enter company name.";
  }

  if (company.length < 2) {
    return "Company name is too short.";
  }

  if (company.length > 150) {
    return "Company name is too long.";
  }

  return "";
}

function validateCreditAccount(
  value: string
): string {
  const account =
    value.trim();

  if (!account) {
    return (
      "Please enter business credit account number."
    );
  }

  if (account.length < 4) {
    return (
      "Business credit account number is too short."
    );
  }

  if (account.length > 50) {
    return (
      "Business credit account number is too long."
    );
  }

  return "";
}

// =====================================================
// WALLET VALIDATION
// =====================================================

function validateWalletNumber(
  value: string
): string {
  const wallet =
    value.trim();

  if (!wallet) {
    return (
      "Please enter wallet number / corporate ID."
    );
  }

  if (wallet.length < 4) {
    return (
      "Wallet number / corporate ID is too short."
    );
  }

  if (wallet.length > 100) {
    return (
      "Wallet number / corporate ID is too long."
    );
  }

  return "";
}

// =====================================================
// COMPONENT
// =====================================================

export default function PaymentMethodSection({
  onPaymentReady,
}: PaymentMethodSectionProps) {

  // ===================================================
  // VALID PAYMENT METHODS
  // ===================================================

  const validPaymentMethods: PaymentMethod[] =
    Array.isArray(PAYMENT_METHODS)
      ? PAYMENT_METHODS.filter(
          isValidPaymentMethod
        )
      : [];

  const paymentMethods =
    validPaymentMethods.length > 0
      ? validPaymentMethods
      : FALLBACK_PAYMENT_METHODS;

  // ===================================================
  // STATE
  // ===================================================

  const [selected, setSelected] =
    useState<string>(
      paymentMethods[0]?.id ||
        "upi"
    );

  const [verified, setVerified] =
    useState(false);

  const [errors, setErrors] =
    useState<Errors>({});

  // ===================================================
  // UPI
  // ===================================================

  const [upiId, setUpiId] =
    useState("");

  // ===================================================
  // CARD
  // ===================================================

  const [cardNumber, setCardNumber] =
    useState("");

  const [cardName, setCardName] =
    useState("");

  const [expiry, setExpiry] =
    useState("");

  const [cvv, setCvv] =
    useState("");

  // ===================================================
  // NET BANKING
  // ===================================================

  const [bank, setBank] =
    useState("");

  const [accountHolder, setAccountHolder] =
    useState("");

  const [accountNumber, setAccountNumber] =
    useState("");

  // ===================================================
  // BUSINESS CREDIT
  // ===================================================

  const [companyName, setCompanyName] =
    useState("");

  const [creditAccount, setCreditAccount] =
    useState("");

  // ===================================================
  // CORPORATE WALLET
  // ===================================================

  const [walletProvider, setWalletProvider] =
    useState("");

  const [walletNumber, setWalletNumber] =
    useState("");

  // ===================================================
  // CLEAR ERRORS
  // ===================================================

  const clearError = (
    field: keyof Errors
  ) => {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  // ===================================================
  // RESET VERIFICATION
  // ===================================================

  const resetVerification = (
    methodId: string
  ) => {
    setVerified(false);

    onPaymentReady?.(
      false,
      methodId
    );
  };

  // ===================================================
  // SELECT PAYMENT METHOD
  // ===================================================

  const handleSelectMethod = (
    methodId: string
  ) => {
    const methodExists =
      paymentMethods.some(
        (method) =>
          method.id === methodId
      );

    if (!methodExists) {
      console.error(
        "Invalid payment method:",
        methodId
      );
      return;
    }

    setSelected(methodId);
    setVerified(false);
    setErrors({});

    onPaymentReady?.(
      false,
      methodId
    );
  };

  // ===================================================
  // VERIFY PAYMENT METHOD
  // ===================================================

  const handleVerify = () => {
    const nextErrors: Errors = {};

    // =================================================
    // UPI
    // =================================================

    if (selected === "upi") {
      const error =
        validateUpiId(upiId);

      if (error) {
        nextErrors.upiId =
          error;
      }
    }

    // =================================================
    // CARD
    // =================================================

    else if (
      selected === "card"
    ) {
      const cardNumberError =
        validateCardNumber(
          cardNumber
        );

      const cardNameError =
        validateCardName(
          cardName
        );

      const expiryError =
        validateExpiry(
          expiry
        );

      const cvvError =
        validateCvv(cvv);

      if (cardNumberError) {
        nextErrors.cardNumber =
          cardNumberError;
      }

      if (cardNameError) {
        nextErrors.cardName =
          cardNameError;
      }

      if (expiryError) {
        nextErrors.expiry =
          expiryError;
      }

      if (cvvError) {
        nextErrors.cvv =
          cvvError;
      }
    }

    // =================================================
    // NET BANKING
    // =================================================

    else if (
      selected === "netbanking"
    ) {
      if (!bank) {
        nextErrors.bank =
          "Please select your bank.";
      }

      const accountHolderError =
        validateAccountHolder(
          accountHolder
        );

      const accountNumberError =
        validateAccountNumber(
          accountNumber
        );

      if (accountHolderError) {
        nextErrors.accountHolder =
          accountHolderError;
      }

      if (accountNumberError) {
        nextErrors.accountNumber =
          accountNumberError;
      }
    }

    // =================================================
    // CASH ON DELIVERY
    // =================================================

    else if (
      selected === "cod"
    ) {
      // No additional fields required.
    }

    // =================================================
    // BUSINESS CREDIT
    // =================================================

    else if (
      selected === "credit"
    ) {
      const companyError =
        validateCompanyName(
          companyName
        );

      const creditError =
        validateCreditAccount(
          creditAccount
        );

      if (companyError) {
        nextErrors.companyName =
          companyError;
      }

      if (creditError) {
        nextErrors.creditAccount =
          creditError;
      }
    }

    // =================================================
    // CORPORATE WALLET
    // =================================================

    else if (
      selected === "wallet"
    ) {
      if (!walletProvider) {
        nextErrors.walletProvider =
          "Please select wallet provider.";
      }

      const walletError =
        validateWalletNumber(
          walletNumber
        );

      if (walletError) {
        nextErrors.walletNumber =
          walletError;
      }
    }

    // =================================================
    // UNKNOWN METHOD
    // =================================================

    else {
      console.error(
        "Unsupported payment method:",
        selected
      );

      nextErrors.upiId =
        "Unsupported payment method.";
    }

    // =================================================
    // VALIDATION FAILED
    // =================================================

    if (
      Object.keys(nextErrors)
        .length > 0
    ) {
      setErrors(nextErrors);
      setVerified(false);

      onPaymentReady?.(
        false,
        selected
      );

      return;
    }

    // =================================================
    // VALID
    // =================================================

    setErrors({});
    setVerified(true);

    onPaymentReady?.(
      true,
      selected
    );
  };

  // ===================================================
  // CARD NUMBER CHANGE
  // ===================================================

  const handleCardNumberChange = (
    value: string
  ) => {
    const digits =
      value
        .replace(/\D/g, "")
        .slice(0, 19);

    const formatted =
      digits
        .replace(
          /(.{4})/g,
          "$1 "
        )
        .trim();

    setCardNumber(
      formatted
    );

    clearError(
      "cardNumber"
    );

    resetVerification(
      "card"
    );
  };

  // ===================================================
  // CARD NAME CHANGE
  // ===================================================

  const handleCardNameChange = (
    value: string
  ) => {
    setCardName(
      value.slice(0, 100)
    );

    clearError(
      "cardName"
    );

    resetVerification(
      "card"
    );
  };

  // ===================================================
  // EXPIRY CHANGE
  // ===================================================

  const handleExpiryChange = (
    value: string
  ) => {
    const digits =
      value
        .replace(/\D/g, "")
        .slice(0, 4);

    let formatted =
      digits;

    if (
      digits.length > 2
    ) {
      formatted =
        `${digits.slice(
          0,
          2
        )}/${digits.slice(2)}`;
    }

    setExpiry(
      formatted
    );

    clearError(
      "expiry"
    );

    resetVerification(
      "card"
    );
  };

  // ===================================================
  // CVV CHANGE
  // ===================================================

  const handleCvvChange = (
    value: string
  ) => {
    const digits =
      value
        .replace(/\D/g, "")
        .slice(0, 4);

    setCvv(digits);

    clearError("cvv");

    resetVerification(
      "card"
    );
  };

  // ===================================================
  // SELECTED METHOD
  // ===================================================

  const selectedMethod =
    paymentMethods.find(
      (method) =>
        method.id === selected
    );

  // ===================================================
  // EMPTY PAYMENT METHODS
  // ===================================================

  if (
    paymentMethods.length ===
    0
  ) {
    return (
      <section
        className="bg-white border border-line rounded-card p-5"
        aria-labelledby="payment-method-title"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-6 h-6 rounded-full bg-navy text-white text-[12px] font-bold flex items-center justify-center shrink-0">
            3
          </span>

          <h2
            id="payment-method-title"
            className="text-[14.5px] font-bold text-ink"
          >
            Payment Method
          </h2>
        </div>

        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] text-red-600"
        >
          No payment methods are currently
          available.
        </div>
      </section>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section
      className="bg-white border border-line rounded-card p-5"
      aria-labelledby="payment-method-title"
    >

      {/* HEADER */}

      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-6 h-6 rounded-full bg-navy text-white text-[12px] font-bold flex items-center justify-center shrink-0">
          3
        </span>

        <h2
          id="payment-method-title"
          className="text-[14.5px] font-bold text-ink"
        >
          Payment Method
        </h2>
      </div>

      {/* PAYMENT METHODS */}

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        role="radiogroup"
        aria-label="Payment methods"
      >
        {paymentMethods.map(
          (method) => {
            const Icon =
              ICONS[
                method.icon as keyof typeof ICONS
              ] ?? Wallet;

            const isSelected =
              selected === method.id;

            return (
              <button
                key={method.id}
                type="button"
                role="radio"
                aria-checked={
                  isSelected
                }
                onClick={() =>
                  handleSelectMethod(
                    method.id
                  )
                }
                className={`flex items-center gap-3 border rounded-lg px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-navy bg-blue/5"
                    : "border-line hover:border-navy/40"
                }`}
              >
                {/* RADIO */}

                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "border-navy"
                      : "border-line"
                  }`}
                >
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-navy" />
                  )}
                </span>

                {/* ICON */}

                <Icon
                  size={18}
                  className="text-navy shrink-0"
                />

                {/* TEXT */}

                <div className="min-w-0">
                  <div className="text-[12.5px] font-bold text-ink truncate">
                    {method.name}
                  </div>

                  <p className="text-[10.5px] text-ink-soft truncate">
                    {method.detail}
                  </p>
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* =================================================
          UPI
      ================================================== */}

      {selected === "upi" && (
        <div className="mt-4">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <input
                value={upiId}
                onChange={(e) => {
                  setUpiId(
                    e.target.value.slice(
                      0,
                      100
                    )
                  );

                  clearError(
                    "upiId"
                  );

                  resetVerification(
                    "upi"
                  );
                }}
                onBlur={() => {
                  if (upiId.trim()) {
                    const error =
                      validateUpiId(
                        upiId
                      );

                    setErrors(
                      (current) => ({
                        ...current,
                        upiId:
                          error ||
                          undefined,
                      })
                    );
                  }
                }}
                placeholder="Enter your UPI ID (e.g. business@okaxis)"
                maxLength={100}
                aria-invalid={
                  errors.upiId
                    ? "true"
                    : "false"
                }
                className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] text-ink placeholder:text-ink-faint outline-none focus:border-navy ${
                  errors.upiId
                    ? "border-red-500"
                    : "border-line"
                }`}
              />

              {errors.upiId && (
                <ErrorMessage
                  text={
                    errors.upiId
                  }
                />
              )}
            </div>

            <button
              type="button"
              onClick={
                handleVerify
              }
              className="bg-navy hover:bg-navy-deep transition-colors text-white text-[12px] font-bold px-4 py-2.5 rounded-lg shrink-0"
            >
              Verify UPI
            </button>
          </div>

          {verified && (
            <SuccessMessage
              text="UPI ID verified successfully."
            />
          )}
        </div>
      )}

      {/* =================================================
          CARD
      ================================================== */}

      {selected === "card" && (
        <div className="mt-4 space-y-3">

          {/* CARD NUMBER */}

          <div>
            <input
              value={cardNumber}
              onChange={(e) =>
                handleCardNumberChange(
                  e.target.value
                )
              }
              placeholder="Card Number"
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={23}
              aria-invalid={
                errors.cardNumber
                  ? "true"
                  : "false"
              }
              className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                errors.cardNumber
                  ? "border-red-500"
                  : "border-line"
              }`}
            />

            {errors.cardNumber && (
              <ErrorMessage
                text={
                  errors.cardNumber
                }
              />
            )}
          </div>

          {/* CARD NAME */}

          <div>
            <input
              value={cardName}
              onChange={(e) =>
                handleCardNameChange(
                  e.target.value
                )
              }
              placeholder="Cardholder Name"
              autoComplete="cc-name"
              maxLength={100}
              aria-invalid={
                errors.cardName
                  ? "true"
                  : "false"
              }
              className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                errors.cardName
                  ? "border-red-500"
                  : "border-line"
              }`}
            />

            {errors.cardName && (
              <ErrorMessage
                text={
                  errors.cardName
                }
              />
            )}
          </div>

          {/* EXPIRY + CVV */}

          <div className="grid grid-cols-2 gap-3">

            <div>
              <input
                value={expiry}
                onChange={(e) =>
                  handleExpiryChange(
                    e.target.value
                  )
                }
                placeholder="MM/YY"
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
                aria-invalid={
                  errors.expiry
                    ? "true"
                    : "false"
                }
                className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                  errors.expiry
                    ? "border-red-500"
                    : "border-line"
                }`}
              />

              {errors.expiry && (
                <ErrorMessage
                  text={
                    errors.expiry
                  }
                />
              )}
            </div>

            <div>
              <input
                value={cvv}
                onChange={(e) =>
                  handleCvvChange(
                    e.target.value
                  )
                }
                placeholder="CVV"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                type="password"
                aria-invalid={
                  errors.cvv
                    ? "true"
                    : "false"
                }
                className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                  errors.cvv
                    ? "border-red-500"
                    : "border-line"
                }`}
              />

              {errors.cvv && (
                <ErrorMessage
                  text={
                    errors.cvv
                  }
                />
              )}
            </div>

          </div>

          <button
            type="button"
            onClick={
              handleVerify
            }
            className="w-full bg-navy hover:bg-navy-deep text-white font-bold text-[12px] py-2.5 rounded-lg"
          >
            Verify Card
          </button>

          {verified && (
            <SuccessMessage
              text="Card details verified successfully."
            />
          )}
        </div>
      )}

      {/* =================================================
          NET BANKING
      ================================================== */}

      {selected ===
        "netbanking" && (
        <div className="mt-4 space-y-3">

          {/* BANK */}

          <div>
            <select
              value={bank}
              onChange={(e) => {
                setBank(
                  e.target.value
                );

                clearError(
                  "bank"
                );

                resetVerification(
                  "netbanking"
                );
              }}
              aria-invalid={
                errors.bank
                  ? "true"
                  : "false"
              }
              className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                errors.bank
                  ? "border-red-500"
                  : "border-line"
              }`}
            >
              <option value="">
                Select your bank
              </option>

              <option value="sbi">
                State Bank of India
              </option>

              <option value="hdfc">
                HDFC Bank
              </option>

              <option value="icici">
                ICICI Bank
              </option>

              <option value="axis">
                Axis Bank
              </option>

              <option value="kotak">
                Kotak Mahindra Bank
              </option>

              <option value="other">
                Other Bank
              </option>
            </select>

            {errors.bank && (
              <ErrorMessage
                text={
                  errors.bank
                }
              />
            )}
          </div>

          {/* ACCOUNT HOLDER */}

          <div>
            <input
              value={accountHolder}
              onChange={(e) => {
                setAccountHolder(
                  e.target.value.slice(
                    0,
                    100
                  )
                );

                clearError(
                  "accountHolder"
                );

                resetVerification(
                  "netbanking"
                );
              }}
              placeholder="Account Holder Name"
              autoComplete="name"
              maxLength={100}
              aria-invalid={
                errors.accountHolder
                  ? "true"
                  : "false"
              }
              className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                errors.accountHolder
                  ? "border-red-500"
                  : "border-line"
              }`}
            />

            {errors.accountHolder && (
              <ErrorMessage
                text={
                  errors.accountHolder
                }
              />
            )}
          </div>

          {/* ACCOUNT NUMBER */}

          <div>
            <input
              value={accountNumber}
              onChange={(e) => {
                const digits =
                  e.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                    .slice(
                      0,
                      20
                    );

                setAccountNumber(
                  digits
                );

                clearError(
                  "accountNumber"
                );

                resetVerification(
                  "netbanking"
                );
              }}
              placeholder="Account Number"
              inputMode="numeric"
              maxLength={20}
              aria-invalid={
                errors.accountNumber
                  ? "true"
                  : "false"
              }
              className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                errors.accountNumber
                  ? "border-red-500"
                  : "border-line"
              }`}
            />

            {errors.accountNumber && (
              <ErrorMessage
                text={
                  errors.accountNumber
                }
              />
            )}
          </div>

          <button
            type="button"
            onClick={
              handleVerify
            }
            className="w-full bg-navy hover:bg-navy-deep text-white font-bold text-[12px] py-2.5 rounded-lg"
          >
            Verify Bank Details
          </button>

          {verified && (
            <SuccessMessage
              text="Bank details verified successfully."
            />
          )}
        </div>
      )}

      {/* =================================================
          CASH ON DELIVERY
      ================================================== */}

      {selected === "cod" && (
        <div className="mt-4 bg-blue/5 border border-blue/20 rounded-lg p-4">

          <div className="flex items-start gap-3">

            <Wallet
              size={20}
              className="text-navy mt-0.5"
            />

            <div>
              <p className="text-[12.5px] font-bold text-ink">
                Cash on Delivery
              </p>

              <p className="text-[11px] text-ink-soft mt-1">
                Pay the order amount when
                your order is delivered.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={
              handleVerify
            }
            className="w-full mt-3 bg-navy hover:bg-navy-deep text-white font-bold text-[12px] py-2.5 rounded-lg"
          >
            Confirm Cash on Delivery
          </button>

          {verified && (
            <div className="mt-3">
              <SuccessMessage
                text="Cash on Delivery selected successfully."
              />
            </div>
          )}

        </div>
      )}

      {/* =================================================
          BUSINESS CREDIT
      ================================================== */}

      {selected ===
        "credit" && (
        <div className="mt-4 space-y-3">

          {/* COMPANY */}

          <div>
            <input
              value={companyName}
              onChange={(e) => {
                setCompanyName(
                  e.target.value.slice(
                    0,
                    150
                  )
                );

                clearError(
                  "companyName"
                );

                resetVerification(
                  "credit"
                );
              }}
              placeholder="Company Name"
              maxLength={150}
              aria-invalid={
                errors.companyName
                  ? "true"
                  : "false"
              }
              className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                errors.companyName
                  ? "border-red-500"
                  : "border-line"
              }`}
            />

            {errors.companyName && (
              <ErrorMessage
                text={
                  errors.companyName
                }
              />
            )}
          </div>

          {/* CREDIT ACCOUNT */}

          <div>
            <input
              value={creditAccount}
              onChange={(e) => {
                setCreditAccount(
                  e.target.value.slice(
                    0,
                    50
                  )
                );

                clearError(
                  "creditAccount"
                );

                resetVerification(
                  "credit"
                );
              }}
              placeholder="Business Credit Account Number"
              maxLength={50}
              aria-invalid={
                errors.creditAccount
                  ? "true"
                  : "false"
              }
              className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                errors.creditAccount
                  ? "border-red-500"
                  : "border-line"
              }`}
            />

            {errors.creditAccount && (
              <ErrorMessage
                text={
                  errors.creditAccount
                }
              />
            )}
          </div>

          <button
            type="button"
            onClick={
              handleVerify
            }
            className="w-full bg-navy hover:bg-navy-deep text-white font-bold text-[12px] py-2.5 rounded-lg"
          >
            Verify Business Credit
          </button>

          {verified && (
            <SuccessMessage
              text="Business credit verified successfully."
            />
          )}
        </div>
      )}

      {/* =================================================
          CORPORATE WALLET
      ================================================== */}

      {selected ===
        "wallet" && (
        <div className="mt-4 space-y-3">

          {/* PROVIDER */}

          <div>
            <select
              value={walletProvider}
              onChange={(e) => {
                setWalletProvider(
                  e.target.value
                );

                clearError(
                  "walletProvider"
                );

                resetVerification(
                  "wallet"
                );
              }}
              aria-invalid={
                errors.walletProvider
                  ? "true"
                  : "false"
              }
              className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                errors.walletProvider
                  ? "border-red-500"
                  : "border-line"
              }`}
            >
              <option value="">
                Select wallet
              </option>

              <option value="aanzara">
                Aanzara Corporate Wallet
              </option>

              <option value="sodexo">
                Sodexo
              </option>
            </select>

            {errors.walletProvider && (
              <ErrorMessage
                text={
                  errors.walletProvider
                }
              />
            )}
          </div>

          {/* WALLET NUMBER */}

          <div>
            <input
              value={walletNumber}
              onChange={(e) => {
                setWalletNumber(
                  e.target.value.slice(
                    0,
                    100
                  )
                );

                clearError(
                  "walletNumber"
                );

                resetVerification(
                  "wallet"
                );
              }}
              placeholder="Wallet Number / Corporate ID"
              maxLength={100}
              aria-invalid={
                errors.walletNumber
                  ? "true"
                  : "false"
              }
              className={`w-full bg-paper border rounded-lg px-3 py-2.5 text-[12.5px] outline-none focus:border-navy ${
                errors.walletNumber
                  ? "border-red-500"
                  : "border-line"
              }`}
            />

            {errors.walletNumber && (
              <ErrorMessage
                text={
                  errors.walletNumber
                }
              />
            )}
          </div>

          <button
            type="button"
            onClick={
              handleVerify
            }
            className="w-full bg-navy hover:bg-navy-deep text-white font-bold text-[12px] py-2.5 rounded-lg"
          >
            Verify Corporate Wallet
          </button>

          {verified && (
            <SuccessMessage
              text="Corporate wallet verified successfully."
            />
          )}
        </div>
      )}

      {/* =================================================
          READY MESSAGE
      ================================================== */}

      {verified && (
        <div className="mt-4 flex items-center gap-2 text-green-deep text-[11.5px] font-semibold">

          <CheckCircle2
            size={16}
          />

          {selectedMethod?.name ||
            "Payment method"}{" "}
          is ready for payment.

        </div>
      )}

    </section>
  );
}

// =====================================================
// ERROR MESSAGE
// =====================================================

function ErrorMessage({
  text,
}: {
  text: string;
}) {
  return (
    <p
      role="alert"
      className="text-[10.5px] text-red-600 mt-1"
    >
      {text}
    </p>
  );
}

// =====================================================
// SUCCESS MESSAGE
// =====================================================

function SuccessMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-green/10 border border-green/20 rounded-lg px-3 py-2.5 text-green-deep text-[11.5px] font-semibold mt-3">

      <CheckCircle2
        size={15}
      />

      {text}

    </div>
  );
}
