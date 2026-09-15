"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  X,
  Bell,
  ShoppingBag,
  Tag,
  Mail,
  Check,
} from "lucide-react";

type ToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon: React.ReactNode;
  last?: boolean;
};

type NotificationPreferences = {
  orderUpdates: boolean;
  offers: boolean;
  email: boolean;
};

type ValidationErrors = {
  orderUpdates?: string;
  offers?: string;
  email?: string;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [orderUpdates, setOrderUpdates] = useState(true);
  const [offers, setOffers] = useState(true);
  const [email, setEmail] = useState(false);

  const [saved, setSaved] = useState(false);

  // No backend publishes notification preferences — persist locally.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(
        "aanzara-notification-prefs"
      );
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<
          NotificationPreferences
        >;
        if (typeof parsed.orderUpdates === "boolean") {
          setOrderUpdates(parsed.orderUpdates);
        }
        if (typeof parsed.offers === "boolean") {
          setOffers(parsed.offers);
        }
        if (typeof parsed.email === "boolean") {
          setEmail(parsed.email);
        }
      }
    } catch {
      // Keep defaults on failure.
    }
  }, []);

  const [errors, setErrors] =
    useState<ValidationErrors>({});

  /* =====================================================
     VALIDATE PREFERENCE
  ====================================================== */

  const validatePreference = (
    value: boolean
  ): string => {
    if (typeof value !== "boolean") {
      return "Invalid notification preference.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE ALL PREFERENCES
  ====================================================== */

  const validatePreferences = (): boolean => {
    const newErrors: ValidationErrors = {};

    const orderUpdatesError =
      validatePreference(orderUpdates);

    const offersError =
      validatePreference(offers);

    const emailError =
      validatePreference(email);

    if (orderUpdatesError) {
      newErrors.orderUpdates =
        orderUpdatesError;
    }

    if (offersError) {
      newErrors.offers = offersError;
    }

    if (emailError) {
      newErrors.email = emailError;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* =====================================================
     HANDLE ORDER UPDATES
  ====================================================== */

  const handleOrderUpdatesChange = (
    value: boolean
  ) => {
    if (typeof value !== "boolean") {
      setErrors((current) => ({
        ...current,
        orderUpdates:
          "Invalid notification preference.",
      }));

      return;
    }

    setOrderUpdates(value);

    setErrors((current) => ({
      ...current,
      orderUpdates: undefined,
    }));

    setSaved(false);
  };

  /* =====================================================
     HANDLE OFFERS
  ====================================================== */

  const handleOffersChange = (
    value: boolean
  ) => {
    if (typeof value !== "boolean") {
      setErrors((current) => ({
        ...current,
        offers:
          "Invalid notification preference.",
      }));

      return;
    }

    setOffers(value);

    setErrors((current) => ({
      ...current,
      offers: undefined,
    }));

    setSaved(false);
  };

  /* =====================================================
     HANDLE EMAIL
  ====================================================== */

  const handleEmailChange = (
    value: boolean
  ) => {
    if (typeof value !== "boolean") {
      setErrors((current) => ({
        ...current,
        email:
          "Invalid notification preference.",
      }));

      return;
    }

    setEmail(value);

    setErrors((current) => ({
      ...current,
      email: undefined,
    }));

    setSaved(false);
  };

  /* =====================================================
     SAVE PREFERENCES
  ====================================================== */

  const handleSave = () => {
    if (saved) {
      return;
    }

    const isValid = validatePreferences();

    if (!isValid) {
      return;
    }

    const preferences: NotificationPreferences = {
      orderUpdates,
      offers,
      email,
    };

    try {
      localStorage.setItem(
        "aanzara-notification-prefs",
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error(
        "Unable to save notification preferences:",
        error
      );
    }

    setSaved(true);
    setErrors({});

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  /* =====================================================
     CANCEL
  ====================================================== */

  const handleCancel = () => {
    setErrors({});
    setSaved(false);
    router.push("/account");
  };

  /* =====================================================
     BACK TO ACCOUNT
  ====================================================== */

  const handleBackToAccount = () => {
    setErrors({});
    setSaved(false);
    router.push("/account");
  };

  return (
    <main className="min-h-[100dvh] bg-white text-[#10265B]">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="flex h-[58px] items-center border-b border-[#E5E7EB] px-4">

        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          disabled={saved}
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#F5F8FC] disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.8}
          />
        </button>

        <h1 className="flex-1 px-2 text-[16px] font-bold text-[#10265B]">
          Notifications
        </h1>

        <button
          type="button"
          onClick={() => router.push("/account")}
          aria-label="Close"
          disabled={saved}
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#F5F8FC] disabled:pointer-events-none disabled:opacity-50"
        >
          <X
            size={20}
            strokeWidth={1.8}
          />
        </button>

      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="mx-auto w-full max-w-[560px] px-4 py-5">

        {/* ===================================================
            INTRO
        ==================================================== */}

        <section className="mb-5 flex items-center rounded-xl border border-[#D7E5FF] bg-[#F2F7FF] p-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E1EDFF]">

            <Bell
              size={21}
              strokeWidth={1.8}
              className="text-[#1769F5]"
            />

          </div>

          <div className="ml-3">

            <p className="text-[12px] font-bold text-[#10265B]">
              Notification Settings
            </p>

            <p className="mt-1 text-[10px] leading-4 text-[#66748B]">
              Choose what notifications you receive.
            </p>

          </div>

        </section>

        {/* ===================================================
            NOTIFICATION OPTIONS
        ==================================================== */}

        <section
          className={`overflow-hidden rounded-xl border bg-white ${
            Object.keys(errors).length > 0
              ? "border-[#FCA5A5]"
              : "border-[#E5EAF1]"
          }`}
        >

          {/* ORDER UPDATES */}

          <ToggleRow
            title="Order Updates"
            description="Receive updates about your orders"
            value={orderUpdates}
            onChange={handleOrderUpdatesChange}
            icon={
              <ShoppingBag
                size={17}
                strokeWidth={1.7}
              />
            }
          />

          {errors.orderUpdates && (
            <ValidationMessage
              message={errors.orderUpdates}
            />
          )}

          {/* OFFERS */}

          <ToggleRow
            title="Offers & Promotions"
            description="Get special offers and deals"
            value={offers}
            onChange={handleOffersChange}
            icon={
              <Tag
                size={17}
                strokeWidth={1.7}
              />
            }
          />

          {errors.offers && (
            <ValidationMessage
              message={errors.offers}
            />
          )}

          {/* EMAIL */}

          <ToggleRow
            title="Email Notifications"
            description="Receive notifications by email"
            value={email}
            onChange={handleEmailChange}
            icon={
              <Mail
                size={17}
                strokeWidth={1.7}
              />
            }
            last
          />

          {errors.email && (
            <ValidationMessage
              message={errors.email}
            />
          )}

        </section>

        {/* ===================================================
            GENERAL ERROR
        ==================================================== */}

        {Object.keys(errors).length > 0 && (
          <div className="mt-3 rounded-lg border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">

            <p className="text-[10px] font-semibold text-[#D92D20]">
              Please correct the notification
              preferences before saving.
            </p>

          </div>
        )}

        {/* ===================================================
            SAVE BUTTON
        ==================================================== */}

        <button
          type="button"
          onClick={handleSave}
          disabled={saved}
          className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-[#1769F5] text-[12px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-70"
        >

          <Check
            size={16}
            className="mr-2"
          />

          {saved
            ? "Preferences Saved"
            : "Save Preferences"}

        </button>

        {/* ===================================================
            SUCCESS MESSAGE
        ==================================================== */}

        {saved && (
          <div className="mt-3 rounded-lg border border-[#B7E4C7] bg-[#EAF7EF] px-4 py-3 text-center">

            <p className="text-[10px] font-semibold text-[#159447]">
              Notification preferences saved successfully.
            </p>

          </div>
        )}

        {/* ===================================================
            BACK
        ==================================================== */}

        <button
          type="button"
          onClick={handleBackToAccount}
          disabled={saved}
          className="mt-5 w-full text-center text-[11px] font-semibold text-[#1769F5] hover:underline disabled:pointer-events-none disabled:opacity-50"
        >
          Back to Account
        </button>

      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="mt-5 border-t border-[#E5E7EB] px-4 py-4">

        <div className="mx-auto flex max-w-[560px] items-center">

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10265B] text-[14px] text-white">
            A
          </div>

          <p className="ml-3 text-[10px] leading-4 text-[#52627A]">
            Aanzara — Shop More.
            <br />
            Live Better.
          </p>

        </div>

      </footer>

    </main>
  );
}

/* =========================================================
   VALIDATION MESSAGE
========================================================= */

function ValidationMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="border-b border-[#FECACA] bg-[#FFF8F8] px-4 py-2">

      <p className="text-[9px] font-medium text-[#D92D20]">
        {message}
      </p>

    </div>
  );
}

/* =========================================================
   TOGGLE ROW
========================================================= */

function ToggleRow({
  title,
  description,
  value,
  onChange,
  icon,
  last = false,
}: ToggleRowProps) {
  return (
    <div
      className={`flex min-h-[68px] items-center px-4 ${
        !last
          ? "border-b border-[#EEF1F5]"
          : ""
      }`}
    >

      {/* ICON */}

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F7FF] text-[#1769F5]">
        {icon}
      </div>

      {/* TEXT */}

      <div className="ml-3 min-w-0 flex-1">

        <p className="text-[11px] font-semibold text-[#10265B]">
          {title}
        </p>

        <p className="mt-1 text-[9px] leading-4 text-[#718096]">
          {description}
        </p>

      </div>

      {/* SWITCH */}

      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={title}
        onClick={() => onChange(!value)}
        className={`relative ml-3 h-6 w-11 shrink-0 rounded-full transition-colors ${
          value
            ? "bg-[#1769F5]"
            : "bg-[#CBD5E1]"
        }`}
      >

        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
            value
              ? "left-6"
              : "left-1"
          }`}
        />

      </button>

    </div>
  );
}