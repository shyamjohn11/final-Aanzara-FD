"use client";

import { useEffect, useState } from "react";
import {
  Home,
  Building2,
  Warehouse,
  Plus,
} from "lucide-react";
import {
  addressesApi,
  AddressResponse,
} from "@/app/api/services";
import {
  hasSession,
  SESSION_CHANGED_EVENT,
} from "@/app/api/api";

// =====================================================
// ICONS
// =====================================================

const ICONS = {
  home: Home,
  office: Building2,
  warehouse: Warehouse,
} as const;

// =====================================================
// TYPES
// =====================================================

export type AddressForm = {
  fullName: string;
  mobile: string;
  companyName: string;
  gstNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  instructions: string;
  primary: boolean;
};

type AddressErrors = Partial<
  Record<keyof AddressForm, string>
>;

type DeliveryAddressSectionProps = {
  onChange?: (address: AddressForm) => void;
  onAddressSelected?: (addressId: string | null) => void;
};

type SavedAddressCard = {
  id: string;
  label: string;
  name: string;
  lines: string;
  icon: keyof typeof ICONS;
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  isDefault?: boolean;
};

// =====================================================
// INITIAL FORM
// =====================================================

const INITIAL_FORM: AddressForm = {
  fullName: "",
  mobile: "",
  companyName: "",
  gstNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "Maharashtra",
  pinCode: "",
  country: "India",
  instructions: "",
  primary: true,
};

// =====================================================
// VALIDATION HELPERS
// =====================================================

function validateFullName(value: string) {
  const name = value.trim();

  if (!name) {
    return "Full name is required.";
  }

  if (name.length < 2) {
    return "Full name must be at least 2 characters.";
  }

  if (name.length > 100) {
    return "Full name must be less than 100 characters.";
  }

  if (!/^[A-Za-z\s.'-]+$/.test(name)) {
    return "Enter a valid full name.";
  }

  return "";
}

function validateMobile(value: string) {
  const mobile = value.replace(/\D/g, "");

  if (!mobile) {
    return "Mobile number is required.";
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return "Enter a valid 10-digit mobile number.";
  }

  return "";
}

function validateCompany(value: string) {
  const company = value.trim();

  if (!company) {
    return "";
  }

  if (company.length < 2) {
    return "Company name is too short.";
  }

  if (company.length > 100) {
    return "Company name must be less than 100 characters.";
  }

  return "";
}

function validateGST(value: string) {
  const gst = value.trim().toUpperCase();

  if (!gst) {
    return "";
  }

  if (gst.length !== 15) {
    return "GST number must contain 15 characters.";
  }

  const gstRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  if (!gstRegex.test(gst)) {
    return "Enter a valid GST number.";
  }

  return "";
}

function validateAddress(
  value: string,
  required = false
) {
  const address = value.trim();

  if (required && !address) {
    return "Address is required.";
  }

  if (!address) {
    return "";
  }

  if (address.length < 3) {
    return "Address must be at least 3 characters.";
  }

  if (address.length > 250) {
    return "Address must be less than 250 characters.";
  }

  return "";
}

function validateCity(value: string) {
  const city = value.trim();

  if (!city) {
    return "City is required.";
  }

  if (city.length < 2) {
    return "City must be at least 2 characters.";
  }

  if (city.length > 80) {
    return "City must be less than 80 characters.";
  }

  if (!/^[A-Za-z\s.'-]+$/.test(city)) {
    return "Enter a valid city.";
  }

  return "";
}

function validateState(value: string) {
  if (!value.trim()) {
    return "State is required.";
  }

  return "";
}

function validatePin(value: string) {
  const pin = value.trim();

  if (!pin) {
    return "PIN code is required.";
  }

  if (!/^[1-9][0-9]{5}$/.test(pin)) {
    return "Enter a valid 6-digit PIN code.";
  }

  return "";
}

function validateCountry(value: string) {
  if (!value.trim()) {
    return "Country is required.";
  }

  if (value.trim() !== "India") {
    return "Currently delivery is available only in India.";
  }

  return "";
}

function validateInstructions(value: string) {
  if (value.trim().length > 500) {
    return "Delivery instructions must be less than 500 characters.";
  }

  return "";
}

// =====================================================
// FULL FORM VALIDATION
// =====================================================

function validateForm(
  form: AddressForm
): AddressErrors {
  const errors: AddressErrors = {};

  const fullNameError =
    validateFullName(form.fullName);

  const mobileError =
    validateMobile(form.mobile);

  const companyError =
    validateCompany(form.companyName);

  const gstError =
    validateGST(form.gstNumber);

  const address1Error =
    validateAddress(
      form.addressLine1,
      true
    );

  const address2Error =
    validateAddress(
      form.addressLine2
    );

  const cityError =
    validateCity(form.city);

  const stateError =
    validateState(form.state);

  const pinError =
    validatePin(form.pinCode);

  const countryError =
    validateCountry(form.country);

  const instructionError =
    validateInstructions(
      form.instructions
    );

  if (fullNameError) {
    errors.fullName = fullNameError;
  }

  if (mobileError) {
    errors.mobile = mobileError;
  }

  if (companyError) {
    errors.companyName = companyError;
  }

  if (gstError) {
    errors.gstNumber = gstError;
  }

  if (address1Error) {
    errors.addressLine1 = address1Error;
  }

  if (address2Error) {
    errors.addressLine2 = address2Error;
  }

  if (cityError) {
    errors.city = cityError;
  }

  if (stateError) {
    errors.state = stateError;
  }

  if (pinError) {
    errors.pinCode = pinError;
  }

  if (countryError) {
    errors.country = countryError;
  }

  if (instructionError) {
    errors.instructions =
      instructionError;
  }

  return errors;
}

// =====================================================
// SAVED ADDRESS CARDS
// =====================================================

// Saved addresses come live from addressesApi.list();
// no static fallback — guests start with an empty list.
const MOCK_SAVED_CARDS: SavedAddressCard[] = [];

function mapBackendAddress(
  address: AddressResponse
): SavedAddressCard {
  const label =
    address.label?.trim() ||
    (address.isDefault
      ? "Primary"
      : "Address");

  const lowerLabel = label.toLowerCase();

  const icon: SavedAddressCard["icon"] =
    /office|work|company/.test(lowerLabel)
      ? "office"
      : /ware|godown|factory/.test(lowerLabel)
        ? "warehouse"
        : "home";

  const lines = [
    address.addressLine1,
    address.addressLine2,
    `${address.city} ${address.state} ${address.pincode}`.trim(),
  ]
    .filter(
      (part) =>
        part && part.trim().length > 0
    )
    .join(", ");

  return {
    id: String(address.addressId),
    label,
    name: address.city,
    lines,
    icon,
    addressLine1: address.addressLine1,
    addressLine2:
      address.addressLine2 ?? "",
    city: address.city,
    state: address.state,
    pinCode: address.pincode,
    country: "India",
    isDefault: address.isDefault,
  };
}

// =====================================================
// COMPONENT
// =====================================================

export default function DeliveryAddressSection({
  onChange,
  onAddressSelected,
}: DeliveryAddressSectionProps) {
  // ===================================================
  // STATE
  // ===================================================

  const [selected, setSelected] =
    useState<string | null>(
      MOCK_SAVED_CARDS.length > 0
        ? MOCK_SAVED_CARDS[0].id
        : null
    );

  const [savedCards, setSavedCards] =
    useState<SavedAddressCard[]>(
      MOCK_SAVED_CARDS
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [sessionKey, setSessionKey] =
    useState(0);

  const [form, setForm] =
    useState<AddressForm>(
      INITIAL_FORM
    );

  const [errors, setErrors] =
    useState<AddressErrors>({});

  const [saved, setSaved] =
    useState(false);

  // ===================================================
  // SESSION CHANGES (SIGN IN / OUT)
  // ===================================================

  useEffect(() => {
    const handleSessionChanged =
      () => setSessionKey((key) => key + 1);

    window.addEventListener(
      SESSION_CHANGED_EVENT,
      handleSessionChanged
    );

    window.addEventListener(
      "storage",
      handleSessionChanged
    );

    return () => {
      window.removeEventListener(
        SESSION_CHANGED_EVENT,
        handleSessionChanged
      );
      window.removeEventListener(
        "storage",
        handleSessionChanged
      );
    };
  }, []);

  // ===================================================
  // LOAD ADDRESSES (BACKEND WHEN SIGNED IN)
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    const loadAddresses = async () => {
      if (hasSession()) {
        try {
          const list =
            (await addressesApi.list()).data;

          if (cancelled) {
            return;
          }

          const cards = list
            .map(mapBackendAddress)
            .filter(
              (card) =>
                Boolean(card.id) &&
                Boolean(card.lines)
            );

          setSavedCards(cards);

          const preferred =
            cards.find(
              (card) => card.isDefault
            ) ?? cards[0];

          if (preferred) {
            setSelected(preferred.id);
            onAddressSelected?.(
              preferred.id
            );
          } else {
            setSelected(null);
            onAddressSelected?.(null);
          }
        } catch (error) {
          console.error(
            "Failed to load saved addresses:",
            error
          );

          if (!cancelled) {
            setSavedCards(
              MOCK_SAVED_CARDS
            );
          }
        }
      } else {
        setSavedCards(MOCK_SAVED_CARDS);

        setSelected(
          MOCK_SAVED_CARDS.length > 0
            ? MOCK_SAVED_CARDS[0].id
            : null
        );

        onAddressSelected?.(null);
      }
    };

    loadAddresses();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  // ===================================================
  // CHANGE FIELD
  // ===================================================

  const updateField = <
    K extends keyof AddressForm
  >(
    field: K,
    value: AddressForm[K]
  ) => {
    const nextForm: AddressForm = {
      ...form,
      [field]: value,
    };

    setForm(nextForm);
    setSaved(false);

    // Send updated address to parent
    onChange?.(nextForm);

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
  };

  // ===================================================
  // SELECT SAVED ADDRESS
  // ===================================================

  const handleSelect = (
    id: string
  ) => {
    const address =
      savedCards.find(
        (item) => item.id === id
      );

    if (!address) {
      console.error(
        "Invalid saved address:",
        id
      );
      return;
    }

    setSelected(id);
    setSaved(false);
    setErrors({});

    onAddressSelected?.(id);

    /*
      Convert saved address into the same
      AddressForm structure used by the form.
    */

    const nextForm: AddressForm = {
      fullName:
        String(
          address.fullName ?? ""
        ),

      mobile:
        String(
          (address as any).mobile ?? ""
        ),

      companyName:
        String(
          (address as any).companyName ?? ""
        ),

      gstNumber:
        String(
          (address as any).gstNumber ?? ""
        ),

      addressLine1:
        String(
          address.addressLine1 ??
            address.lines ??
            ""
        ),

      addressLine2:
        String(
          address.addressLine2 ??
            ""
        ),

      city:
        String(
          address.city ?? ""
        ),

      state:
        String(
          address.state ??
            "Maharashtra"
        ),

      pinCode:
        String(
          address.pinCode ?? ""
        ),

      country:
        String(
          address.country ??
            "India"
        ),

      instructions:
        String(
          (address as any).instructions ??
            ""
        ),

      primary: true,
    };

    setForm(nextForm);

    onChange?.(nextForm);
  };

  // ===================================================
  // ADD NEW ADDRESS
  // ===================================================

  const handleAddNewAddress =
    () => {
      setSelected(null);
      onAddressSelected?.(null);

      const nextForm: AddressForm = {
        ...INITIAL_FORM,
      };

      setForm(nextForm);
      setErrors({});
      setSaved(false);

      onChange?.(nextForm);
    };

  // ===================================================
  // SAVE ADDRESS
  // ===================================================

  const handleSave = () => {
    if (isSaving) {
      return;
    }

    const validationErrors =
      validateForm(form);

    setErrors(validationErrors);

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setSaved(false);
      return;
    }

    const addressData: AddressForm = {
      fullName:
        form.fullName.trim(),

      mobile:
        form.mobile.replace(
          /\D/g,
          ""
        ),

      companyName:
        form.companyName.trim(),

      gstNumber:
        form.gstNumber
          .trim()
          .toUpperCase(),

      addressLine1:
        form.addressLine1.trim(),

      addressLine2:
        form.addressLine2.trim(),

      city:
        form.city.trim(),

      state:
        form.state.trim(),

      pinCode:
        form.pinCode.trim(),

      country:
        form.country.trim(),

      instructions:
        form.instructions.trim(),

      primary:
        Boolean(form.primary),
    };

    // Signed-in users persist the address
    // against their account via the backend.

    if (hasSession()) {
      setIsSaving(true);

      const payload = {
        label:
          addressData.companyName.length >
          0
            ? "Office"
            : "Home",
        addressLine1:
          addressData.addressLine1,
        addressLine2:
          addressData.addressLine2 ||
          null,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pinCode,
        latitude: 0,
        longitude: 0,
        isDefault:
          addressData.primary,
      };

      const saveAddress =
        async () => {
          try {
            const created =
              (await addressesApi.create(
                payload
              )).data;

            const list =
              (await addressesApi.list()).data;

            const cards = list
              .map(mapBackendAddress)
              .filter(
                (card) =>
                  Boolean(card.id) &&
                  Boolean(card.lines)
              );

            if (cards.length > 0) {
              setSavedCards(cards);
            }

            const newId = String(
              created.addressId
            );

            setSelected(newId);
            setForm(addressData);
            setSaved(true);
            setErrors({});

            onAddressSelected?.(newId);
            onChange?.(addressData);
          } catch (error) {
            console.error(
              "Failed to save address:",
              error
            );

            setSaved(false);
            alert(
              "Could not save your address. Please try again."
            );
          } finally {
            setIsSaving(false);
          }
        };

      saveAddress();
      return;
    }

    // Guests keep the address locally.

    setForm(addressData);
    setSaved(true);

    onChange?.(addressData);

    console.log(
      "Validated delivery address:",
      addressData
    );
  };

  // ===================================================
  // CANCEL
  // ===================================================

  const handleCancel = () => {
    const nextForm: AddressForm = {
      ...INITIAL_FORM,
    };

    setForm(nextForm);
    setErrors({});
    setSaved(false);

    if (
      savedCards.length > 0
    ) {
      setSelected(
        savedCards[0].id
      );

      onAddressSelected?.(
        savedCards[0].id
      );
    } else {
      setSelected(null);
      onAddressSelected?.(null);
    }

    onChange?.(nextForm);
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section
      aria-labelledby="delivery-address-title"
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
          1
        </span>

        <h2
          id="delivery-address-title"
          className="text-[14.5px] font-bold text-ink"
        >
          Delivery Address
        </h2>
      </div>

      {/* =================================================
          SAVED ADDRESSES
      ================================================== */}

      {savedCards.length > 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4"
          role="radiogroup"
          aria-label="Saved delivery addresses"
        >
          {savedCards.map(
            (addr) => {
              const Icon =
                ICONS[
                  addr.icon as keyof typeof ICONS
                ] ?? Home;

              const isSelected =
                selected ===
                String(addr.id);

              return (
                <button
                  key={String(addr.id)}
                  type="button"
                  role="radio"
                  aria-checked={
                    isSelected
                  }
                  onClick={() =>
                    handleSelect(
                      String(addr.id)
                    )
                  }
                  className={`text-left border rounded-lg p-3.5 transition-colors ${
                    isSelected
                      ? "border-navy bg-blue/5"
                      : "border-line hover:border-navy/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
                      <Icon
                        size={13}
                        className="text-navy"
                        aria-hidden="true"
                      />

                      {String(
                        addr.label
                      )}
                    </span>

                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-navy"
                          : "border-line"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-navy" />
                      )}
                    </span>
                  </div>

                  <div className="text-[12px] font-semibold text-ink mb-0.5">
                    {String(addr.name)}
                  </div>

                  <p className="text-[11px] text-ink-soft leading-relaxed">
                    {String(
                      addr.lines
                    )}
                  </p>
                </button>
              );
            }
          )}
        </div>
      ) : (
        <div
          role="status"
          className="border border-line rounded-lg p-4 mb-4 text-center text-[11.5px] text-ink-soft"
        >
          No saved addresses available.
        </div>
      )}

      {/* =================================================
          ADD NEW ADDRESS
      ================================================== */}

      <button
        type="button"
        onClick={
          handleAddNewAddress
        }
        className="flex items-center gap-1.5 text-[12px] font-bold text-blue hover:underline mb-5"
      >
        <Plus
          size={13}
          aria-hidden="true"
        />

        Add New Address
      </button>

      {/* =================================================
          FORM
      ================================================== */}

      <div className="border-t border-line pt-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          <Field
            label="Full Name *"
            placeholder="Rohan Sharma"
            value={
              form.fullName
            }
            error={
              errors.fullName
            }
            onChange={(value) =>
              updateField(
                "fullName",
                value.slice(
                  0,
                  100
                )
              )
            }
            maxLength={100}
            autoComplete="name"
          />

          <Field
            label="Mobile Number *"
            placeholder="9123456789"
            value={
              form.mobile
            }
            error={
              errors.mobile
            }
            onChange={(value) =>
              updateField(
                "mobile",
                value
                  .replace(
                    /\D/g,
                    ""
                  )
                  .slice(
                    0,
                    10
                  )
              )
            }
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
          />

          <Field
            label="Company Name (Optional)"
            placeholder="Aanzara Enterprise Ltd"
            value={
              form.companyName
            }
            error={
              errors.companyName
            }
            onChange={(value) =>
              updateField(
                "companyName",
                value.slice(
                  0,
                  100
                )
              )
            }
            maxLength={100}
            autoComplete="organization"
          />

          <Field
            label="GST Number (Optional)"
            placeholder="27AAAAA1111A1Z1"
            value={
              form.gstNumber
            }
            error={
              errors.gstNumber
            }
            onChange={(value) =>
              updateField(
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
            maxLength={15}
            autoComplete="off"
          />

        </div>

        {/* ADDRESS 1 */}

        <Field
          label="Address Line 1 *"
          placeholder="Flat, House no., Building, Company, Apartment"
          value={
            form.addressLine1
          }
          error={
            errors.addressLine1
          }
          onChange={(value) =>
            updateField(
              "addressLine1",
              value.slice(
                0,
                250
              )
            )
          }
          maxLength={250}
          autoComplete="address-line1"
          full
        />

        {/* ADDRESS 2 */}

        <div className="mt-4">
          <Field
            label="Address Line 2 / Landmark"
            placeholder="Area, Street, Sector, Village"
            value={
              form.addressLine2
            }
            error={
              errors.addressLine2
            }
            onChange={(value) =>
              updateField(
                "addressLine2",
                value.slice(
                  0,
                  250
                )
              )
            }
            maxLength={250}
            autoComplete="address-line2"
            full
          />
        </div>

        {/* CITY / STATE / PIN */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">

          <Field
            label="City *"
            placeholder="Mumbai"
            value={
              form.city
            }
            error={
              errors.city
            }
            onChange={(value) =>
              updateField(
                "city",
                value.slice(
                  0,
                  80
                )
              )
            }
            maxLength={80}
            autoComplete="address-level2"
          />

          <SelectField
            label="State *"
            value={
              form.state
            }
            error={
              errors.state
            }
            onChange={(value) =>
              updateField(
                "state",
                value
              )
            }
            options={[
              "Maharashtra",
              "Tamil Nadu",
              "Karnataka",
              "Delhi",
              "Gujarat",
              "Kerala",
              "Telangana",
              "Andhra Pradesh",
              "West Bengal",
              "Uttar Pradesh",
              "Rajasthan",
              "Madhya Pradesh",
            ]}
            autoComplete="address-level1"
          />

          <Field
            label="PIN Code *"
            placeholder="400050"
            value={
              form.pinCode
            }
            error={
              errors.pinCode
            }
            onChange={(value) =>
              updateField(
                "pinCode",
                value
                  .replace(
                    /\D/g,
                    ""
                  )
                  .slice(
                    0,
                    6
                  )
              )
            }
            maxLength={6}
            inputMode="numeric"
            autoComplete="postal-code"
          />

        </div>

        {/* COUNTRY */}

        <div className="mt-4">
          <SelectField
            label="Country"
            value={
              form.country
            }
            error={
              errors.country
            }
            onChange={(value) =>
              updateField(
                "country",
                value
              )
            }
            options={[
              "India",
            ]}
            autoComplete="country-name"
          />
        </div>

        {/* DELIVERY INSTRUCTIONS */}

        <div className="mt-4">

          <label
            htmlFor="delivery-instructions"
            className="text-[11.5px] font-semibold text-ink-soft block mb-1.5"
          >
            Delivery Instructions
          </label>

          <textarea
            id="delivery-instructions"
            value={
              form.instructions
            }
            onChange={(event) =>
              updateField(
                "instructions",
                event.target.value.slice(
                  0,
                  500
                )
              )
            }
            placeholder="Special instructions or delivery notes (e.g. Leave with gatekeeper or security desk)"
            rows={2}
            maxLength={500}
            aria-invalid={
              errors.instructions
                ? "true"
                : "false"
            }
            className={`w-full bg-white border rounded-lg px-3 py-2.5 text-[12.5px] text-ink placeholder:text-ink-faint outline-none resize-none ${
              errors.instructions
                ? "border-red-500"
                : "border-line focus:border-navy"
            }`}
          />

          {errors.instructions && (
            <p
              role="alert"
              className="text-[10.5px] text-red-600 mt-1"
            >
              {
                errors.instructions
              }
            </p>
          )}

        </div>

        {/* PRIMARY */}

        <label className="flex items-center gap-2 mt-4 text-[12px] text-ink-soft cursor-pointer">

          <input
            type="checkbox"
            checked={
              form.primary
            }
            onChange={(event) =>
              updateField(
                "primary",
                event.target.checked
              )
            }
            className="accent-navy"
          />

          Save this address as my primary delivery preference

        </label>

        {/* ACTIONS */}

        <div className="flex items-center gap-2.5 mt-5 flex-wrap">

          <button
            type="button"
            onClick={
              handleSave
            }
            disabled={isSaving}
            className="bg-navy hover:bg-navy-deep transition-colors text-white text-[12.5px] font-bold px-5 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving
              ? "Saving..."
              : "Save Address"}
          </button>

          <button
            type="button"
            onClick={
              handleCancel
            }
            className="border border-line text-ink-soft text-[12.5px] font-bold px-5 py-2.5 rounded-lg hover:border-navy hover:text-navy transition-colors"
          >
            Cancel
          </button>

          {saved && (
            <span
              role="status"
              className="text-[11px] font-semibold text-green"
            >
              Address saved successfully.
            </span>
          )}

        </div>

      </div>
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
  full,
  type = "text",
  inputMode,
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
  full?: boolean;
  type?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "tel"
    | "email"
    | "url"
    | "search";
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
    <div
      className={
        full
          ? "w-full"
          : undefined
      }
    >
      <label
        htmlFor={inputId}
        className="text-[11.5px] font-semibold text-ink-soft block mb-1.5"
      >
        {label}
      </label>

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
        inputMode={
          inputMode
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
        className={`w-full bg-white border rounded-lg px-3 py-2.5 text-[12.5px] text-ink placeholder:text-ink-faint outline-none transition-colors ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-line focus:border-navy"
        }`}
      />

      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-[10.5px] text-red-600 mt-1"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// =====================================================
// SELECT COMPONENT
// =====================================================

function SelectField({
  label,
  value,
  error,
  onChange,
  options,
  autoComplete,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (
    value: string
  ) => void;
  options: string[];
  autoComplete?: string;
}) {
  const selectId =
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

  const safeOptions =
    Array.isArray(options)
      ? options.filter(
          (option) =>
            typeof option ===
              "string" &&
            option.trim()
              .length > 0
        )
      : [];

  return (
    <div>
      <label
        htmlFor={selectId}
        className="text-[11.5px] font-semibold text-ink-soft block mb-1.5"
      >
        {label}
      </label>

      <select
        id={selectId}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        autoComplete={
          autoComplete
        }
        aria-invalid={
          error
            ? "true"
            : "false"
        }
        className={`w-full bg-white border rounded-lg px-3 py-2.5 text-[12.5px] text-ink outline-none ${
          error
            ? "border-red-500"
            : "border-line focus:border-navy"
        }`}
      >
        {safeOptions.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>

      {error && (
        <p
          role="alert"
          className="text-[10.5px] text-red-600 mt-1"
        >
          {error}
        </p>
      )}
    </div>
  );
}