// File: app/components/Account/GeneralSettingsModal.tsx
"use client";

import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";

import {
  X,
  Save,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type GeneralSettings = {
  siteName: string;
  siteDescription: string;
  email: string;
  phone: string;
  address: string;
};

type Props = {
  open: boolean;
  settings: GeneralSettings;
  onClose: () => void;
  onSave: (values: GeneralSettings) => void;
};

type Errors = Partial<
  Record<
    keyof GeneralSettings,
    string
  >
>;

/* =========================================================
   REGEX
========================================================= */

const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const PHONE_REGEX =
  /^[0-9+\-\s()]{7,20}$/;

/* =========================================================
   LIMITS
========================================================= */

const LIMITS = {
  siteName: 100,
  siteDescription: 200,
  email: 254,
  phone: 20,
  address: 300,
} as const;

/* =========================================================
   HELPERS
========================================================= */

function normalizeText(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function isGeneralSettings(
  value: unknown
): value is GeneralSettings {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const data =
    value as Partial<GeneralSettings>;

  return (
    typeof data.siteName ===
      "string" &&
    typeof data.siteDescription ===
      "string" &&
    typeof data.email ===
      "string" &&
    typeof data.phone ===
      "string" &&
    typeof data.address ===
      "string"
  );
}

function getSafeSettings(
  settings: unknown
): GeneralSettings {
  if (
    !isGeneralSettings(settings)
  ) {
    return {
      siteName: "",
      siteDescription: "",
      email: "",
      phone: "",
      address: "",
    };
  }

  return {
    siteName: settings.siteName,
    siteDescription:
      settings.siteDescription,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function GeneralSettingsModal({
  open,
  settings,
  onClose,
  onSave,
}: Props) {
  /* =======================================================
     IDS
  ======================================================= */

  const idPrefix = useId();

  const siteNameId =
    `${idPrefix}-site-name`;

  const emailId =
    `${idPrefix}-email`;

  const phoneId =
    `${idPrefix}-phone`;

  const addressId =
    `${idPrefix}-address`;

  const descriptionId =
    `${idPrefix}-description`;

  /* =======================================================
     STATE
  ======================================================= */

  const [form, setForm] =
    useState<GeneralSettings>(
      getSafeSettings(settings)
    );

  const [errors, setErrors] =
    useState<Errors>({});

  const [saving, setSaving] =
    useState(false);

  /* =======================================================
     SYNC FORM
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      getSafeSettings(settings)
    );

    setErrors({});
    setSaving(false);
  }, [open, settings]);

  /* =======================================================
     ESCAPE + BODY SCROLL
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, onClose]);

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  const update = (
    key: keyof GeneralSettings,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[key];

      return next;
    });
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validate = (): boolean => {
    const nextErrors: Errors = {};

    /* -----------------------------------------------
       SITE NAME
    ----------------------------------------------- */

    const siteName =
      normalizeText(form.siteName);

    if (!siteName) {
      nextErrors.siteName =
        "Site name is required.";
    } else if (
      siteName.length < 2
    ) {
      nextErrors.siteName =
        "Site name must be at least 2 characters.";
    } else if (
      siteName.length >
      LIMITS.siteName
    ) {
      nextErrors.siteName =
        `Site name cannot exceed ${LIMITS.siteName} characters.`;
    }

    /* -----------------------------------------------
       EMAIL
    ----------------------------------------------- */

    const email =
      normalizeText(form.email);

    if (!email) {
      nextErrors.email =
        "Support email is required.";
    } else if (
      email.length >
      LIMITS.email
    ) {
      nextErrors.email =
        "Email address is too long.";
    } else if (
      !EMAIL_REGEX.test(email)
    ) {
      nextErrors.email =
        "Enter a valid email address.";
    }

    /* -----------------------------------------------
       PHONE
    ----------------------------------------------- */

    const phone =
      normalizeText(form.phone);

    if (!phone) {
      nextErrors.phone =
        "Phone number is required.";
    } else if (
      phone.length >
      LIMITS.phone
    ) {
      nextErrors.phone =
        "Phone number is too long.";
    } else if (
      !PHONE_REGEX.test(phone)
    ) {
      nextErrors.phone =
        "Enter a valid phone number.";
    } else {
      const digitCount =
        phone.replace(
          /\D/g,
          ""
        ).length;

      if (
        digitCount < 7 ||
        digitCount > 15
      ) {
        nextErrors.phone =
          "Enter a valid phone number.";
      }
    }

    /* -----------------------------------------------
       ADDRESS
    ----------------------------------------------- */

    const address =
      normalizeText(form.address);

    if (!address) {
      nextErrors.address =
        "Business address is required.";
    } else if (
      address.length >
      LIMITS.address
    ) {
      nextErrors.address =
        `Address cannot exceed ${LIMITS.address} characters.`;
    }

    /* -----------------------------------------------
       DESCRIPTION
    ----------------------------------------------- */

    const description =
      normalizeText(
        form.siteDescription
      );

    if (!description) {
      nextErrors.siteDescription =
        "Site description is required.";
    } else if (
      description.length >
      LIMITS.siteDescription
    ) {
      nextErrors.siteDescription =
        `Description cannot exceed ${LIMITS.siteDescription} characters.`;
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = () => {
    if (saving) {
      return;
    }

    if (!validate()) {
      return;
    }

    const values: GeneralSettings = {
      siteName:
        normalizeText(
          form.siteName
        ),

      siteDescription:
        normalizeText(
          form.siteDescription
        ),

      email:
        normalizeText(
          form.email
        ).toLowerCase(),

      phone:
        normalizeText(
          form.phone
        ),

      address:
        normalizeText(
          form.address
        ),
    };

    setSaving(true);

    try {
      onSave(values);
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     CLOSED
  ======================================================= */

  if (!open) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      {/* ===================================================
          DIALOG
      =================================================== */}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="general-settings-title"
        className="w-full max-w-[610px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b border-[#E8ECF1] px-6 py-5">
          <div>
            <h2
              id="general-settings-title"
              className="font-sora text-[16px] font-bold text-[#22324D] sm:text-[18px]"
            >
              Edit General Settings
            </h2>

            <p className="mt-1 text-[9px] text-[#8995A5]">
              Update your store
              information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7D899A] transition hover:bg-[#F2F5F8] hover:text-[#22324D] focus:outline-none focus:ring-2 focus:ring-[#1769F5]/30"
          >
            <X
              size={19}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* =============================================
                SITE NAME
            ============================================= */}

            <ModalInput
              id={siteNameId}
              label="Site Name"
              required
              value={form.siteName}
              placeholder="Aanzara"
              error={errors.siteName}
              maxLength={
                LIMITS.siteName
              }
              onChange={(value) =>
                update(
                  "siteName",
                  value
                )
              }
            />

            {/* =============================================
                EMAIL
            ============================================= */}

            <ModalInput
              id={emailId}
              label="Support Email"
              required
              type="email"
              icon={
                <Mail
                  size={14}
                  aria-hidden="true"
                />
              }
              value={form.email}
              placeholder="support@aanzara.com"
              error={errors.email}
              maxLength={
                LIMITS.email
              }
              autoComplete="email"
              onChange={(value) =>
                update(
                  "email",
                  value
                )
              }
            />

            {/* =============================================
                PHONE
            ============================================= */}

            <ModalInput
              id={phoneId}
              label="Phone Number"
              required
              type="tel"
              icon={
                <Phone
                  size={14}
                  aria-hidden="true"
                />
              }
              value={form.phone}
              placeholder="+91 98765 43210"
              error={errors.phone}
              maxLength={
                LIMITS.phone
              }
              autoComplete="tel"
              onChange={(value) =>
                update(
                  "phone",
                  value
                )
              }
            />

            {/* =============================================
                ADDRESS
            ============================================= */}

            <ModalInput
              id={addressId}
              label="Business Address"
              required
              icon={
                <MapPin
                  size={14}
                  aria-hidden="true"
                />
              }
              value={form.address}
              placeholder="Chennai, Tamil Nadu, India"
              error={errors.address}
              maxLength={
                LIMITS.address
              }
              autoComplete="street-address"
              onChange={(value) =>
                update(
                  "address",
                  value
                )
              }
            />

            {/* =============================================
                DESCRIPTION
            ============================================= */}

            <div className="sm:col-span-2">
              <label
                htmlFor={
                  descriptionId
                }
                className="text-[9px] font-semibold text-[#52627A]"
              >
                Site Description

                <span
                  className="ml-1 text-[#EF4444]"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              <textarea
                id={descriptionId}
                value={
                  form.siteDescription
                }
                onChange={(event) =>
                  update(
                    "siteDescription",
                    event.target.value
                  )
                }
                maxLength={
                  LIMITS.siteDescription
                }
                rows={4}
                required
                aria-required="true"
                aria-invalid={
                  Boolean(
                    errors.siteDescription
                  )
                }
                aria-describedby={
                  errors.siteDescription
                    ? `${descriptionId}-error`
                    : undefined
                }
                placeholder="Wholesale marketplace and business shopping platform"
                className={`mt-1.5 w-full resize-none rounded-lg border bg-white px-3 py-3 text-[10px] leading-5 text-[#33415A] outline-none placeholder:text-[#A0AAB8] transition focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/20 ${
                  errors.siteDescription
                    ? "border-[#EF4444] bg-[#FFF8F8]"
                    : "border-[#DCE2EA]"
                }`}
              />

              <div className="flex items-center justify-between">
                <div>
                  {errors.siteDescription ? (
                    <p
                      id={`${descriptionId}-error`}
                      role="alert"
                      className="mt-1 text-[8px] font-medium text-[#EF4444]"
                    >
                      {
                        errors.siteDescription
                      }
                    </p>
                  ) : (
                    <span />
                  )}
                </div>

                <span
                  className={`mt-1 text-[8px] ${
                    form.siteDescription
                      .length >=
                    LIMITS.siteDescription
                      ? "font-semibold text-[#EF4444]"
                      : "text-[#A0AAB8]"
                  }`}
                >
                  {
                    form.siteDescription
                      .length
                  }
                  /
                  {
                    LIMITS.siteDescription
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="flex items-center justify-end gap-3 border-t border-[#E8ECF1] bg-[#FCFDFE] px-6 py-4">
          {/* CANCEL */}

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-lg border border-[#DCE2EA] bg-white px-5 text-[10px] font-semibold text-[#5E6C80] transition hover:bg-[#F6F8FA] focus:outline-none focus:ring-2 focus:ring-[#1769F5]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          {/* SAVE */}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#1769F5] px-5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#0F5BDE] focus:outline-none focus:ring-2 focus:ring-[#1769F5]/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save
              size={14}
              aria-hidden="true"
            />

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL INPUT
========================================================= */

function ModalInput({
  id,
  label,
  value,
  placeholder,
  onChange,
  error,
  required = false,
  type = "text",
  icon,
  maxLength,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (
    value: string
  ) => void;
  error?: string;
  required?: boolean;
  type?: "text" | "email" | "tel";
  icon?: ReactNode;
  maxLength?: number;
  autoComplete?: string;
}) {
  const errorId =
    `${id}-error`;

  return (
    <div className="min-w-0">
      {/* =================================================
          LABEL
      ================================================= */}

      <label
        htmlFor={id}
        className="text-[9px] font-semibold text-[#52627A]"
      >
        {label}

        {required && (
          <span
            className="ml-1 text-[#EF4444]"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>

      {/* =================================================
          INPUT
      ================================================= */}

      <div className="relative">
        {icon && (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A0B0]"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          autoComplete={
            autoComplete
          }
          aria-invalid={Boolean(
            error
          )}
          aria-describedby={
            error
              ? errorId
              : undefined
          }
          className={`mt-1.5 h-10 w-full rounded-lg border bg-white ${
            icon
              ? "pl-9"
              : "px-3"
          } pr-3 text-[10px] text-[#33415A] outline-none placeholder:text-[#A0AAB8] transition focus:border-[#1769F5] focus:ring-1 focus:ring-[#1769F5]/20 ${
            error
              ? "border-[#EF4444] bg-[#FFF8F8]"
              : "border-[#DCE2EA]"
          }`}
        />
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-[8px] font-medium text-[#EF4444]"
        >
          {error}
        </p>
      )}
    </div>
  );
}