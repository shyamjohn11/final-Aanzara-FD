// File: src/app/components/Checkout/BusinessPurchaseSection.tsx

"use client";

import { useState } from "react";
import { Briefcase } from "lucide-react";

// =====================================================
// TYPES
// =====================================================

export type BusinessForm = {
  companyName: string;
  gstNumber: string;
  poNumber: string;
  department: string;
  businessEmail: string;
  businessPhone: string;
};

type FormErrors = Partial<
  Record<keyof BusinessForm, string>
>;

type BusinessPurchaseSectionProps = {
  onChange?: (data: BusinessForm) => void;
};

// =====================================================
// INITIAL FORM
// =====================================================

const INITIAL_FORM: BusinessForm = {
  companyName: "",
  gstNumber: "",
  poNumber: "",
  department: "",
  businessEmail: "",
  businessPhone: "",
};

// =====================================================
// VALIDATION HELPERS
// =====================================================

function validateCompanyName(
  value: string
): string {
  const name = value.trim();

  if (!name) {
    return "Company name is required.";
  }

  if (name.length < 2) {
    return "Company name must be at least 2 characters.";
  }

  if (name.length > 100) {
    return "Company name must be 100 characters or less.";
  }

  return "";
}

// =====================================================
// GST VALIDATION
// =====================================================

function validateGSTIN(
  value: string
): string {
  const gstin = value
    .trim()
    .toUpperCase();

  if (!gstin) {
    return "GST number is required.";
  }

  if (gstin.length !== 15) {
    return "GST number must be exactly 15 characters.";
  }

  const gstinRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  if (!gstinRegex.test(gstin)) {
    return "Enter a valid 15-character GST number.";
  }

  return "";
}

// =====================================================
// PO NUMBER VALIDATION
// =====================================================

function validatePONumber(
  value: string
): string {
  const po = value.trim();

  if (!po) {
    return "Purchase Order number is required.";
  }

  if (po.length < 2) {
    return "PO number is too short.";
  }

  if (po.length > 50) {
    return "PO number must be 50 characters or less.";
  }

  return "";
}

// =====================================================
// DEPARTMENT VALIDATION
// =====================================================

function validateDepartment(
  value: string
): string {
  const department = value.trim();

  if (!department) {
    return "Department is required.";
  }

  if (department.length < 2) {
    return "Department must be at least 2 characters.";
  }

  if (department.length > 80) {
    return "Department must be 80 characters or less.";
  }

  return "";
}

// =====================================================
// EMAIL VALIDATION
// =====================================================

function validateEmail(
  value: string
): string {
  const email = value.trim();

  if (!email) {
    return "Business email is required.";
  }

  if (email.length > 254) {
    return "Email address is too long.";
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailRegex.test(email)) {
    return "Enter a valid business email.";
  }

  return "";
}

// =====================================================
// PHONE VALIDATION
// =====================================================

function validatePhone(
  value: string
): string {
  const phone = value.trim();

  if (!phone) {
    return "Business phone is required.";
  }

  const digits =
    phone.replace(/\D/g, "");

  if (
    digits.length < 10 ||
    digits.length > 15
  ) {
    return "Enter a valid business phone number.";
  }

  return "";
}

// =====================================================
// FULL FORM VALIDATION
// =====================================================

function validateForm(
  form: BusinessForm
): FormErrors {
  const errors: FormErrors = {};

  const companyError =
    validateCompanyName(
      form.companyName
    );

  const gstError =
    validateGSTIN(
      form.gstNumber
    );

  const poError =
    validatePONumber(
      form.poNumber
    );

  const departmentError =
    validateDepartment(
      form.department
    );

  const emailError =
    validateEmail(
      form.businessEmail
    );

  const phoneError =
    validatePhone(
      form.businessPhone
    );

  if (companyError) {
    errors.companyName =
      companyError;
  }

  if (gstError) {
    errors.gstNumber =
      gstError;
  }

  if (poError) {
    errors.poNumber =
      poError;
  }

  if (departmentError) {
    errors.department =
      departmentError;
  }

  if (emailError) {
    errors.businessEmail =
      emailError;
  }

  if (phoneError) {
    errors.businessPhone =
      phoneError;
  }

  return errors;
}

// =====================================================
// CLEAN FORM
// =====================================================

function cleanBusinessForm(
  form: BusinessForm
): BusinessForm {
  return {
    companyName:
      form.companyName.trim(),

    gstNumber:
      form.gstNumber
        .trim()
        .toUpperCase(),

    poNumber:
      form.poNumber.trim(),

    department:
      form.department.trim(),

    businessEmail:
      form.businessEmail
        .trim()
        .toLowerCase(),

    businessPhone:
      form.businessPhone.trim(),
  };
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function BusinessPurchaseSection({
  onChange,
}: BusinessPurchaseSectionProps) {
  const [enabled, setEnabled] =
    useState(true);

  const [form, setForm] =
    useState<BusinessForm>(
      INITIAL_FORM
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [saved, setSaved] =
    useState(false);

  // ===================================================
  // TOGGLE
  // ===================================================

  const handleToggle = () => {
    const nextEnabled = !enabled;

    setEnabled(nextEnabled);
    setSaved(false);
    setErrors({});

    if (!nextEnabled) {
      const emptyForm = {
        ...INITIAL_FORM,
      };

      setForm(emptyForm);

      onChange?.(emptyForm);

      try {
        localStorage.removeItem(
          "businessPurchaseDetails"
        );
      } catch (error) {
        console.error(
          "Unable to remove business details:",
          error
        );
      }

      return;
    }

    onChange?.(form);
  };

  // ===================================================
  // FIELD CHANGE
  // ===================================================

  const handleChange = (
    field: keyof BusinessForm,
    value: string
  ) => {
    const nextForm: BusinessForm = {
      ...form,
      [field]: value,
    };

    setForm(nextForm);
    setSaved(false);

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[field];

      return next;
    });

    onChange?.(nextForm);
  };

  // ===================================================
  // SAVE BUSINESS DETAILS
  // ===================================================

  const handleSave = () => {
    if (!enabled) {
      return;
    }

    const validationErrors =
      validateForm(form);

    setErrors(
      validationErrors
    );

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setSaved(false);
      return;
    }

    const cleanedForm =
      cleanBusinessForm(form);

    try {
      // Update local state
      setForm(cleanedForm);

      // Send to checkout parent
      onChange?.(
        cleanedForm
      );

      // Save locally
      localStorage.setItem(
        "businessPurchaseDetails",
        JSON.stringify(
          cleanedForm
        )
      );

      setSaved(true);
    } catch (error) {
      console.error(
        "Failed to save business details:",
        error
      );

      setSaved(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section
      aria-labelledby="business-purchase-title"
      className="
        bg-blue/5
        border border-blue/20
        rounded-card
        p-5
      "
    >

      {/* =================================================
          HEADER
      ================================================== */}

      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-2.5">

          <span
            className="
              w-8
              h-8
              rounded-lg
              bg-blue/10
              text-blue
              flex
              items-center
              justify-center
              shrink-0
            "
            aria-hidden="true"
          >
            <Briefcase size={15} />
          </span>

          <div>

            <h2
              id="business-purchase-title"
              className="
                text-[14px]
                font-bold
                text-ink
              "
            >
              Business Purchase
            </h2>

            <p className="
              text-[11px]
              text-ink-soft
            ">
              Fill in business details for GST invoice and corporate billing
            </p>

          </div>

        </div>

        {/* =================================================
            TOGGLE
        ================================================== */}

        <button
          type="button"
          onClick={
            handleToggle
          }
          role="switch"
          aria-checked={
            enabled
          }
          aria-label="Enable business purchase"
          className={`
            relative
            w-10
            h-[22px]
            rounded-full
            shrink-0
            transition-colors
            ${
              enabled
                ? "bg-navy"
                : "bg-line"
            }
          `}
        >

          <span
            className={`
              absolute
              top-0.5
              w-[18px]
              h-[18px]
              rounded-full
              bg-white
              transition-all
              ${
                enabled
                  ? "left-[19px]"
                  : "left-0.5"
              }
            `}
            aria-hidden="true"
          />

        </button>

      </div>

      {/* =================================================
          BUSINESS FORM
      ================================================== */}

      {enabled && (
        <>
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
              mb-4
            "
          >

            {/* COMPANY NAME */}

            <Field
              label="Company Name"
              placeholder="Aanzara Distributors Pvt Ltd"
              value={
                form.companyName
              }
              error={
                errors.companyName
              }
              onChange={(value) =>
                handleChange(
                  "companyName",
                  value
                )
              }
              autoComplete="organization"
              maxLength={100}
            />

            {/* GST */}

            <Field
              label="GST Number"
              placeholder="27GSTIXXXXXXX1Z2"
              value={
                form.gstNumber
              }
              error={
                errors.gstNumber
              }
              onChange={(value) =>
                handleChange(
                  "gstNumber",
                  value
                    .toUpperCase()
                    .replace(
                      /[^0-9A-Z]/g,
                      ""
                    )
                    .slice(
                      0,
                      15
                    )
                )
              }
              autoComplete="off"
              maxLength={15}
            />

            {/* PO NUMBER */}

            <Field
              label="Purchase Order (PO) Number"
              placeholder="PO-2025-08492"
              value={
                form.poNumber
              }
              error={
                errors.poNumber
              }
              onChange={(value) =>
                handleChange(
                  "poNumber",
                  value.slice(
                    0,
                    50
                  )
                )
              }
              autoComplete="off"
              maxLength={50}
            />

            {/* DEPARTMENT */}

            <Field
              label="Department"
              placeholder="Wholesale Sourcing"
              value={
                form.department
              }
              error={
                errors.department
              }
              onChange={(value) =>
                handleChange(
                  "department",
                  value.slice(
                    0,
                    80
                  )
                )
              }
              autoComplete="organization-title"
              maxLength={80}
            />

            {/* BUSINESS EMAIL */}

            <Field
              label="Business Email"
              placeholder="finance@aanzaradistributors.com"
              value={
                form.businessEmail
              }
              error={
                errors.businessEmail
              }
              onChange={(value) =>
                handleChange(
                  "businessEmail",
                  value.slice(
                    0,
                    254
                  )
                )
              }
              type="email"
              autoComplete="email"
              maxLength={254}
            />

            {/* BUSINESS PHONE */}

            <Field
              label="Business Phone"
              placeholder="022 5590 1200"
              value={
                form.businessPhone
              }
              error={
                errors.businessPhone
              }
              onChange={(value) =>
                handleChange(
                  "businessPhone",
                  value.slice(
                    0,
                    20
                  )
                )
              }
              type="tel"
              autoComplete="tel"
              maxLength={20}
            />

          </div>

          {/* =================================================
              SAVE
          ================================================== */}

          <div className="
            flex
            items-center
            gap-3
            flex-wrap
          ">

            <button
              type="button"
              onClick={
                handleSave
              }
              className="
                bg-navy
                hover:bg-navy-deep
                transition-colors
                text-white
                text-[12.5px]
                font-bold
                px-5
                py-2.5
                rounded-lg
              "
            >
              Save Business Details
            </button>

            {/* SUCCESS */}

            {saved && (
              <span
                role="status"
                className="
                  text-[11.5px]
                  font-semibold
                  text-green
                "
              >
                Business details saved successfully.
              </span>
            )}

          </div>
        </>
      )}

    </section>
  );
}

// =====================================================
// FIELD COMPONENT
// =====================================================

function Field({
  label,
  placeholder,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  const inputId =
    label
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      );

  return (
    <div>

      {/* LABEL */}

      <label
        htmlFor={inputId}
        className="
          text-[11.5px]
          font-semibold
          text-ink-soft
          block
          mb-1.5
        "
      >
        {label}
      </label>

      {/* INPUT */}

      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        autoComplete={
          autoComplete
        }
        maxLength={
          maxLength
        }
        aria-invalid={
          error
            ? "true"
            : "false"
        }
        aria-describedby={
          error
            ? `${inputId}-error`
            : undefined
        }
        className={`
          w-full
          bg-white
          border
          rounded-lg
          px-3
          py-2.5
          text-[12.5px]
          text-ink
          placeholder:text-ink-faint
          outline-none
          transition-colors
          ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-line focus:border-navy"
          }
        `}
      />

      {/* ERROR */}

      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="
            text-[10.5px]
            text-red-600
            mt-1
          "
        >
          {error}
        </p>
      )}

    </div>
  );
}