"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  MapPin,
  Heart,
  LockKeyhole,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Home,
  Building2,
  MapPinned,
  Phone,
  UserRound,
  Star,
  Save,
  User,
  ShoppingBag,
  Headphones
} from "lucide-react";

import { hasSession } from "@/app/api/api";

import {
  addressesApi,
  type AddressResponse,
} from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type AddressType = "Home" | "Office" | "Other";

type Address = {
  id: string;
  type: AddressType;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  isDefault: boolean;
};

type AddressForm = {
  type: AddressType;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
};

type FormErrors = Partial<Record<keyof AddressForm, string>>;

/* =========================================================
   CONSTANTS
========================================================= */

const STORAGE_KEY = "aanzara-addresses";

const INITIAL_FORM: AddressForm = {
  type: "Home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
};

const ADDRESS_TYPES: AddressType[] = ["Home", "Office", "Other"];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

/* =========================================================
   REGEX
========================================================= */

const NAME_REGEX = /^[A-Za-zÀ-ÿ\s.'-]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/* =========================================================
   VALIDATION
========================================================= */

const validateAddress = (values: AddressForm): FormErrors => {
  const errors: FormErrors = {};

  if (!ADDRESS_TYPES.includes(values.type)) {
    errors.type = "Please select a valid address type.";
  }

  const fullName = values.fullName.trim();

  if (!fullName) {
    errors.fullName = "Full name is required.";
  } else if (fullName.length < 2) {
    errors.fullName = "Full name must contain at least 2 characters.";
  } else if (fullName.length > 50) {
    errors.fullName = "Full name cannot exceed 50 characters.";
  } else if (!NAME_REGEX.test(fullName)) {
    errors.fullName =
      "Full name can contain letters, spaces, dots, apostrophes and hyphens only.";
  }

  const phone = values.phone.replace(/\s+/g, "").replace(/^(\+91|91)/, "");

  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phone =
      "Enter a valid 10-digit Indian mobile number starting with 6-9.";
  }

  const addressLine1 = values.addressLine1.trim();

  if (!addressLine1) {
    errors.addressLine1 = "Address is required.";
  } else if (addressLine1.length < 5) {
    errors.addressLine1 = "Address must contain at least 5 characters.";
  } else if (addressLine1.length > 100) {
    errors.addressLine1 = "Address cannot exceed 100 characters.";
  }

  const addressLine2 = values.addressLine2.trim();

  if (addressLine2.length > 100) {
    errors.addressLine2 = "Address line 2 cannot exceed 100 characters.";
  }

  const city = values.city.trim();

  if (!city) {
    errors.city = "City is required.";
  } else if (city.length < 2) {
    errors.city = "City must contain at least 2 characters.";
  } else if (city.length > 50) {
    errors.city = "City cannot exceed 50 characters.";
  } else if (!NAME_REGEX.test(city)) {
    errors.city = "Please enter a valid city name.";
  }

  const state = values.state.trim();

  if (!state) {
    errors.state = "State is required.";
  } else if (!INDIAN_STATES.includes(state)) {
    errors.state = "Please select a valid Indian state.";
  }

  const pincode = values.pincode.replace(/\D/g, "");

  if (!pincode) {
    errors.pincode = "Pincode is required.";
  } else if (!PINCODE_REGEX.test(pincode)) {
    errors.pincode = "Enter a valid 6-digit Indian pincode.";
  }

  const landmark = values.landmark.trim();

  if (landmark.length > 80) {
    errors.landmark = "Landmark cannot exceed 80 characters.";
  }

  return errors;
};

/* =========================================================
   NORMALIZE ADDRESS
========================================================= */

const normalizeAddress = (value: unknown): Address | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (
    typeof item.id !== "string" ||
    typeof item.fullName !== "string" ||
    typeof item.phone !== "string" ||
    typeof item.addressLine1 !== "string" ||
    typeof item.city !== "string" ||
    typeof item.state !== "string" ||
    typeof item.pincode !== "string"
  ) {
    return null;
  }

  const type: AddressType = ADDRESS_TYPES.includes(item.type as AddressType)
    ? (item.type as AddressType)
    : "Home";

  return {
    id: item.id,
    type,
    fullName: item.fullName,
    phone: item.phone,
    addressLine1: item.addressLine1,
    addressLine2:
      typeof item.addressLine2 === "string" ? item.addressLine2 : "",
    city: item.city,
    state: item.state,
    pincode: item.pincode,
    landmark: typeof item.landmark === "string" ? item.landmark : "",
    isDefault: item.isDefault === true,
  };
};

/* =========================================================
   DEFAULT SAMPLE ADDRESS
========================================================= */

const DEFAULT_ADDRESS: Address = {
  id: "addr_demo_001",
  type: "Home",
  fullName: "Sam",
  phone: "+91 98765 43210",
  addressLine1: "123, Main Street",
  addressLine2: "Near Central Mall",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600001",
  landmark: "",
  isDefault: true,
};

/* =========================================================
   BACKEND MAPPER
========================================================= */

const toAddressType = (label?: string | null): AddressType =>
  ADDRESS_TYPES.includes(label as AddressType)
    ? (label as AddressType)
    : "Other";

const backendToAddress = (response: AddressResponse): Address => ({
  id: response.addressId,
  type: toAddressType(response.label),
  fullName: "",
  phone: "",
  addressLine1: response.addressLine1,
  addressLine2: response.addressLine2 ?? "",
  city: response.city,
  state: response.state,
  pincode: response.pincode,
  landmark: "",
  isDefault: response.isDefault,
});

/* =========================================================
   PAGE
========================================================= */

export default function AddressesPage() {
  const router = useRouter();

  /* =======================================================
     PROFILE (used to prefill the "Add Address" form)
  ======================================================= */

  const [profileName, setProfileName] = useState("Sam");
  const [profileEmail, setProfileEmail] = useState("");

  /* =======================================================
     ADDRESSES
  ======================================================= */

  const [addresses, setAddresses] = useState<Address[]>([]);

  /* =======================================================
     BACKEND / LOADING
  ======================================================= */

  const [backendMode, setBackendMode] = useState(hasSession());
  const [loading, setLoading] = useState(hasSession());

  /* =======================================================
     MODAL
  ======================================================= */

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(INITIAL_FORM);

  /* =======================================================
     FORM STATES
  ======================================================= */

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof AddressForm, boolean>>
  >({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("aanzara-profile");
      const savedUser = localStorage.getItem("user");

      let profile: Record<string, unknown> | null = null;

      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);

          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            profile = parsed;
          }
        } catch {
          profile = null;
        }
      }

      if (!profile && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);

          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            profile = parsed;
          }
        } catch {
          profile = null;
        }
      }

      if (profile) {
        const name =
          typeof profile.fullName === "string"
            ? profile.fullName
            : typeof profile.name === "string"
              ? profile.name
              : "";

        if (name.trim()) {
          setProfileName(name.trim());
        }

        const email = typeof profile.email === "string" ? profile.email : "";

        if (email.trim()) {
          setProfileEmail(email.trim());
        }
      }
    } catch (err) {
      console.error("Unable to load profile:", err);
    }
  }, []);

  /* =======================================================
     LOAD ADDRESSES
  ======================================================= */

  useEffect(() => {
    if (hasSession()) {
      let cancelled = false;

      addressesApi
        .list()
        .then(({ data }) => {
          if (cancelled) {
            return;
          }

          setBackendMode(true);
          setAddresses(
            (Array.isArray(data) ? data : []).map(backendToAddress)
          );
        })
        .catch((err) => {
          console.error("Unable to load addresses:", err);

          if (!cancelled) {
            setAddresses([DEFAULT_ADDRESS]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setAddresses([DEFAULT_ADDRESS]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        setAddresses([DEFAULT_ADDRESS]);
        return;
      }

      const valid = parsed
        .map(normalizeAddress)
        .filter((item): item is Address => item !== null);

      setAddresses(valid);
    } catch (err) {
      console.error("Unable to load addresses:", err);
      setAddresses([DEFAULT_ADDRESS]);
    }
  }, []);

  /* =======================================================
     SAVE ADDRESSES
  ======================================================= */

  useEffect(() => {
    if (backendMode) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    } catch (err) {
      console.error("Unable to save addresses:", err);
    }
  }, [addresses, backendMode]);

  /* =======================================================
     PROFILE COMPLETION
  ======================================================= */

  const addressCount = addresses.length;

  const defaultAddress = addresses.find((address) => address.isDefault);

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  const updateField = <K extends keyof AddressForm>(
    field: K,
    value: AddressForm[K]
  ) => {
    let nextValue = value;

    if (field === "phone") {
      nextValue = value
        .toString()
        .replace(/[^\d+\s]/g, "")
        .slice(0, 15) as AddressForm[K];
    }

    if (field === "pincode") {
      nextValue = value
        .toString()
        .replace(/\D/g, "")
        .slice(0, 6) as AddressForm[K];
    }

    if (field === "fullName") {
      nextValue = value.toString().slice(0, 50) as AddressForm[K];
    }

    if (field === "city") {
      nextValue = value.toString().slice(0, 50) as AddressForm[K];
    }

    if (field === "addressLine1" || field === "addressLine2") {
      nextValue = value.toString().slice(0, 100) as AddressForm[K];
    }

    if (field === "landmark") {
      nextValue = value.toString().slice(0, 80) as AddressForm[K];
    }

    const nextForm = {
      ...form,
      [field]: nextValue,
    };

    setForm(nextForm);
    setSuccess("");
    setError("");

    if (touched[field]) {
      const validation = validateAddress(nextForm);

      setErrors((current) => ({
        ...current,
        [field]: validation[field],
      }));
    }
  };

  /* =======================================================
     BLUR VALIDATION
  ======================================================= */

  const handleBlur = (field: keyof AddressForm) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    const validation = validateAddress(form);

    setErrors((current) => ({
      ...current,
      [field]: validation[field],
    }));
  };

  /* =======================================================
     OPEN ADD
  ======================================================= */

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...INITIAL_FORM,
      fullName: profileName || "",
    });

    setErrors({});
    setTouched({});
    setError("");
    setSuccess("");

    setShowModal(true);
  };

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  const openEditModal = (address: Address) => {
    setEditingId(address.id);

    setForm({
      type: address.type,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark,
    });

    setErrors({});
    setTouched({});
    setError("");
    setSuccess("");

    setShowModal(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setShowModal(false);
    setEditingId(null);
    setErrors({});
    setTouched({});
    setError("");
  };

  /* =======================================================
     SAVE ADDRESS
  ======================================================= */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    const validationErrors = validateAddress(form);

    // Backend addresses store location only — recipient name and phone are
    // collected on the checkout form, so those fields are not validated here.
    if (backendMode) {
      delete validationErrors.fullName;
      delete validationErrors.phone;
      delete validationErrors.landmark;
    }

    setErrors(validationErrors);

    setTouched({
      type: true,
      fullName: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      pincode: true,
      landmark: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      setError("Please fix the highlighted fields before saving.");
      return;
    }

    setIsSaving(true);

    try {
      if (backendMode) {
        const payload = {
          label: form.type,
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          isDefault: editingId
            ? addresses.find((address) => address.id === editingId)
                ?.isDefault ?? false
            : addresses.length === 0,
        };

        const { data } = editingId
          ? await addressesApi.update(editingId, payload)
          : await addressesApi.create(payload);

        setAddresses((current) =>
          editingId
            ? current.map((address) =>
                address.id === editingId ? backendToAddress(data) : address
              )
            : [...current, backendToAddress(data)]
        );

        setShowModal(false);
        setEditingId(null);
        setForm(INITIAL_FORM);
        setErrors({});
        setTouched({});

        setSuccess(
          editingId
            ? "Address updated successfully."
            : "Address added successfully."
        );

        setTimeout(() => {
          setSuccess("");
        }, 4000);

        return;
      }

      const cleanPhone = form.phone.replace(/\s+/g, "").replace(/^91/, "");

      const cleanAddress: Address = {
        id:
          editingId ||
          `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: form.type,
        fullName: form.fullName.trim(),
        phone: cleanPhone.startsWith("+91") ? cleanPhone : `+91 ${cleanPhone}`,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        landmark: form.landmark.trim(),
        isDefault: addresses.length === 0,
      };

      if (editingId) {
        setAddresses((current) =>
          current.map((address) =>
            address.id === editingId
              ? {
                  ...address,
                  ...cleanAddress,
                  isDefault: address.isDefault,
                }
              : address
          )
        );
      } else {
        setAddresses((current) => {
          const shouldBeDefault = current.length === 0;

          return [
            ...current.map((address) => ({
              ...address,
              isDefault: shouldBeDefault ? false : address.isDefault,
            })),
            {
              ...cleanAddress,
              isDefault: shouldBeDefault,
            },
          ];
        });
      }

      setShowModal(false);
      setEditingId(null);
      setForm(INITIAL_FORM);
      setErrors({});
      setTouched({});

      setSuccess(
        editingId
          ? "Address updated successfully."
          : "Address added successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      console.error("Unable to save address:", err);
      setError("Unable to save the address. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     DELETE ADDRESS
  ======================================================= */

  const handleDelete = async (id: string) => {
    setError("");
    setSuccess("");

    const address = addresses.find((item) => item.id === id);

    if (!address) {
      setError("Address not found.");
      return;
    }

    if (!backendMode && addresses.length === 1) {
      setError("You must keep at least one address.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) {
      return;
    }

    if (backendMode) {
      try {
        await addressesApi.remove(id);
      } catch (err) {
        console.error("Unable to delete address:", err);
        setError("Unable to delete the address. Please try again.");
        return;
      }
    }

    setAddresses((current) => {
      const remaining = current.filter((item) => item.id !== id);

      if (!backendMode && address.isDefault && remaining.length > 0) {
        remaining[0] = {
          ...remaining[0],
          isDefault: true,
        };
      }

      return remaining;
    });

    setSuccess("Address deleted successfully.");

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  /* =======================================================
     SET DEFAULT
  ======================================================= */

  const handleSetDefault = async (id: string) => {
    setError("");
    setSuccess("");

    const target = addresses.find((address) => address.id === id);

    if (!target) {
      setError("Address not found.");
      return;
    }

    if (backendMode) {
      try {
        await addressesApi.update(id, {
          label: target.type,
          addressLine1: target.addressLine1,
          addressLine2: target.addressLine2 || null,
          city: target.city,
          state: target.state,
          pincode: target.pincode,
          isDefault: true,
        });
      } catch (err) {
        console.error("Unable to update address:", err);
        setError("Unable to set the default address. Please try again.");
        return;
      }
    }

    setAddresses((current) =>
      current.map((address) => ({
        ...address,
        isDefault: address.id === id,
      }))
    );

    setSuccess("Default address updated successfully.");

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  /* =======================================================
     SIDEBAR
  ======================================================= */

  const accountMenu = [
    {
      label: "My Profile",
      icon: User,
      href: "/account/profile",
    },
    {
      label: "My Orders",
      icon: ShoppingBag,
      href: "/account/orders",
    },
    {
      label: "Addresses",
      icon: MapPin,
      href: "/account/addresses",
      active: true,
    },
    {
      label: "Wishlist",
      icon: Heart,
      href: "/account/wishlist",
    },
    
    {
      label: "Change Password",
      icon: LockKeyhole,
      href: "/account/change-password",
    },
  ];

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    // Central logout replaces history so Back cannot return here.
    // (Without the cookie clear the edge guard keeps redirecting
    // /login back into the app.)
    const { logoutAndRedirect } = await import("@/app/api/api");
    await logoutAndRedirect("/login");
  };

  /* =======================================================
     SIDEBAR COMPONENT
  ======================================================= */

  const AccountSidebar = () => (
    <aside className="w-full shrink-0 rounded-[20px] border border-[#E2EAF4] bg-white p-4 shadow-[0_12px_35px_rgba(30,72,130,0.06)] lg:w-[280px]">

      {/* PROFILE */}

      <div className="flex flex-col items-center border-b border-[#EEF2F7] px-2 pb-5 pt-2">

        <div className="relative">

          <div className="flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#E8F1FF] to-[#D9E8FF] text-[38px] font-bold text-[#1769F5]">
            {profileName
              .charAt(0)
              .toUpperCase() || "S"}
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/account/profile"
              )
            }
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#1769F5] text-white shadow-md"
            aria-label="Change profile photo"
          >
            <Pencil size={14} />
          </button>

        </div>

        <h2 className="mt-4 text-[21px] font-bold text-[#102D62]">
          {profileName || "Sam"}
        </h2>

        <p className="mt-1 max-w-full truncate px-2 text-center text-[13px] text-[#718096]">
          {profileEmail ||
            "sam@example.com"}
        </p>

        <div className="mt-3 flex items-center gap-1.5 rounded-full bg-[#EAF9F0] px-3 py-1.5 text-[11px] font-semibold text-[#159447]">
          <CheckCircle2
            size={14}
          />
          Verified Account
        </div>

      </div>

      {/* MENU */}

      <nav
        className="mt-4 space-y-1.5"
        aria-label="My Account"
      >
        {accountMenu.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <button
                key={
                  item.label
                }
                type="button"
                onClick={() =>
                  router.push(
                    item.href
                  )
                }
                className={`group flex h-[54px] w-full items-center rounded-[12px] px-4 text-left text-[15px] font-semibold transition ${
                  item.active
                    ? "border-l-[4px] border-[#1769F5] bg-[#EAF2FF] pl-3 text-[#1769F5]"
                    : "text-[#102D62] hover:bg-[#F5F8FC]"
                }`}
              >
                <Icon
                  size={21}
                  strokeWidth={
                    1.9
                  }
                  className="mr-4 shrink-0"
                />

                <span className="flex-1">
                  {
                    item.label
                  }
                </span>

                {item.active && (
                  <span className="text-[18px]">
                    ›
                  </span>
                )}
              </button>
            );
          }
        )}

        <button
          type="button"
          onClick={
            handleLogout
          }
          className="flex h-[54px] w-full items-center rounded-[12px] px-4 text-left text-[15px] font-semibold text-[#EF4444] transition hover:bg-[#FFF5F5]"
        >
          <LogOut
            size={21}
            strokeWidth={
              1.9
            }
            className="mr-4 shrink-0"
          />

          <span>
            Logout
          </span>
        </button>
      </nav>

      {/* HELP */}

      <div className="mt-4 rounded-[15px] bg-[#F0F6FF] p-4">
        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1769F5] shadow-sm">
            <Headphones
              size={19}
            />
          </div>

          <div>
            <p className="text-[12px] font-semibold text-[#102D62]">
              Need Help?
            </p>

            <p className="mt-1 text-[10px] text-[#718096]">
              We're here to
              support you.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/contact"
                )
              }
              className="mt-2 text-[11px] font-semibold text-[#1769F5] hover:underline"
            >
              Contact Support →
            </button>
          </div>

        </div>
      </div>

    </aside>
  );

  /* =======================================================
     FIELD ERROR
  ======================================================= */

  const FieldError = ({ message }: { message?: string }) => {
    if (!message) {
      return null;
    }

    return (
      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#E53935]">
        <XCircle size={12} />
        {message}
      </p>
    );
  };

  /* =======================================================
     INPUT CLASS
  ======================================================= */

  const inputClass = (field: keyof AddressForm) => {
    const hasError = touched[field] && errors[field];

    return `h-[50px] w-full rounded-[11px] border bg-white px-4 text-[14px] text-[#102D62] outline-none transition placeholder:text-[#9AA9BF] ${
      hasError
        ? "border-[#EF4444] bg-[#FFF9F9] focus:border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/10"
        : "border-[#D9E2EE] focus:border-[#1769F5] focus:ring-4 focus:ring-[#1769F5]/10"
    }`;
  };

  /* =======================================================
     ADDRESS ICON
  ======================================================= */

  const getAddressIcon = (type: AddressType) => {
    if (type === "Home") {
      return <Home size={20} />;
    }

    if (type === "Office") {
      return <Building2 size={20} />;
    }

    return <MapPinned size={20} />;
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* BREADCRUMB */}

      <div className="mb-5 flex items-center gap-2 text-[13px]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[#1769F5] hover:underline"
        >
          Home
        </button>

        <span className="text-[#A7B3C5]">›</span>

        <button
          type="button"
          onClick={() => router.push("/account")}
          className="text-[#718096] hover:text-[#1769F5]"
        >
          My Account
        </button>

        <span className="text-[#A7B3C5]">›</span>

        <span className="font-semibold text-[#102D62]">Addresses</span>
      </div>

      {/* PAGE HEADER */}

      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/account")}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#102D62] shadow-sm transition hover:bg-[#EAF2FF]"
          aria-label="Back to account"
        >
          <ArrowLeft size={21} />
        </button>

        <div className="flex-1">
          <h1 className="text-[30px] font-bold tracking-tight text-[#102D62] sm:text-[34px]">
            My Addresses
          </h1>

          <p className="mt-1 text-[14px] text-[#718096]">
            Manage your saved delivery addresses.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex h-[46px] items-center gap-2 rounded-[10px] bg-[#1769F5] px-5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(23,105,245,0.20)] transition hover:bg-[#0F5DDD]"
        >
          <Plus size={18} />
          Add Address
        </button>
      </div>

      {/* ALERTS */}

      {error && !showModal && (
        <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">
          <XCircle size={17} className="text-[#D92D20]" />
          <p className="text-[12px] font-medium text-[#D92D20]">{error}</p>
        </div>
      )}

      {success && !showModal && (
        <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-[#B7E4C7] bg-[#EAF7EF] px-4 py-3">
          <CheckCircle2 size={17} className="text-[#159447]" />
          <p className="text-[12px] font-semibold text-[#159447]">
            {success}
          </p>
        </div>
      )}

      {/* SUMMARY */}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[16px] border border-[#E2EAF4] bg-white p-5 shadow-[0_8px_25px_rgba(30,72,130,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF2FF] text-[#1769F5]">
                <MapPin size={21} />
              </div>

              <div>
                <p className="text-[12px] text-[#718096]">Saved Addresses</p>
                <p className="mt-1 text-[23px] font-bold text-[#102D62]">
                  {addressCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#E2EAF4] bg-white p-5 shadow-[0_8px_25px_rgba(30,72,130,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF9F0] text-[#159447]">
                <Star size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-[12px] text-[#718096]">Default Address</p>
                <p className="mt-1 truncate text-[15px] font-bold text-[#102D62]">
                  {defaultAddress ? defaultAddress.type : "Not set"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ADDRESS HEADER */}

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-[#102D62]">
              Saved Addresses
            </h2>

            <p className="mt-1 text-[12px] text-[#718096]">
              Choose where you want your orders delivered.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="hidden items-center gap-1.5 text-[13px] font-semibold text-[#1769F5] hover:underline sm:flex"
          >
            <Plus size={16} />
            Add New
          </button>
        </div>

        {/* ADDRESS LIST */}

        {loading ? (
          <div className="rounded-[18px] border border-dashed border-[#CBD8E8] bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF2FF] text-[#1769F5]">
              <MapPin size={28} />
            </div>

            <h3 className="mt-4 text-[18px] font-bold text-[#102D62]">
              Loading your addresses…
            </h3>

            <p className="mx-auto mt-2 max-w-[400px] text-[13px] text-[#718096]">
              Fetching your saved delivery addresses.
            </p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#CBD8E8] bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF2FF] text-[#1769F5]">
              <MapPin size={28} />
            </div>

            <h3 className="mt-4 text-[18px] font-bold text-[#102D62]">
              No saved addresses
            </h3>

            <p className="mx-auto mt-2 max-w-[400px] text-[13px] text-[#718096]">
              Add your home or office address to make checkout faster.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1769F5] px-5 text-[13px] font-semibold text-white"
            >
              <Plus size={17} />
              Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <article
                key={address.id}
                className={`rounded-[17px] border bg-white p-5 shadow-[0_8px_25px_rgba(30,72,130,0.04)] transition ${
                  address.isDefault
                    ? "border-[#9FC1FF] ring-1 ring-[#1769F5]/10"
                    : "border-[#E2EAF4]"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#1769F5]">
                      {getAddressIcon(address.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[16px] font-bold text-[#102D62]">
                          {address.type}
                        </h3>

                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF9F0] px-2.5 py-1 text-[10px] font-bold text-[#159447]">
                            <CheckCircle2 size={12} />
                            DEFAULT
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {address.fullName && (
                          <p className="flex items-center gap-2 text-[13px] font-semibold text-[#102D62]">
                            <UserRound size={14} className="text-[#718096]" />
                            {address.fullName}
                          </p>
                        )}

                        {address.phone && (
                          <p className="flex items-center gap-2 text-[13px] text-[#52627A]">
                            <Phone size={14} className="text-[#718096]" />
                            {address.phone}
                          </p>
                        )}

                        <p className="mt-2 text-[13px] leading-6 text-[#52627A]">
                          {address.addressLine1}

                          {address.addressLine2 && (
                            <>
                              <br />
                              {address.addressLine2}
                            </>
                          )}

                          <br />

                          {address.city}, {address.state} -{" "}
                          <span className="font-semibold">
                            {address.pincode}
                          </span>

                          {address.landmark && (
                            <>
                              <br />
                              <span className="text-[12px] text-[#718096]">
                                Landmark: {address.landmark}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => openEditModal(address)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#D9E2EE] px-3 text-[12px] font-semibold text-[#1769F5] transition hover:border-[#1769F5] hover:bg-[#F5F8FF]"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#FECACA] px-3 text-[12px] font-semibold text-[#EF4444] transition hover:bg-[#FFF5F5]"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>

                {!address.isDefault && (
                  <div className="mt-4 border-t border-[#EEF2F7] pt-4">
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address.id)}
                      className="flex items-center gap-2 text-[12px] font-semibold text-[#1769F5] hover:underline"
                    >
                      <Star size={14} />
                      Set as default address
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1F41]/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-[20px] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.20)]">
            <div className="sticky top-0 z-10 flex items-center border-b border-[#E7EDF5] bg-white px-5 py-4 sm:px-6">
              <div className="flex-1">
                <h2 className="text-[19px] font-bold text-[#102D62]">
                  {editingId ? "Edit Address" : "Add New Address"}
                </h2>

                <p className="mt-1 text-[11px] text-[#718096]">
                  Enter your delivery details carefully.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#52627A] hover:bg-[#F4F7FB] disabled:opacity-50"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6">
              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-[10px] border border-[#FECACA] bg-[#FFF2F2] px-4 py-3">
                  <XCircle size={17} className="text-[#D92D20]" />
                  <p className="text-[12px] font-medium text-[#D92D20]">
                    {error}
                  </p>
                </div>
              )}

              <div className="mb-5">
                <label className="mb-2 block text-[12px] font-bold text-[#102D62]">
                  Address Type
                  <span className="ml-1 text-[#EF4444]">*</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {ADDRESS_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField("type", type)}
                      className={`flex h-[48px] items-center justify-center gap-2 rounded-[10px] border text-[13px] font-semibold transition ${
                        form.type === type
                          ? "border-[#1769F5] bg-[#EAF2FF] text-[#1769F5]"
                          : "border-[#D9E2EE] bg-white text-[#52627A] hover:bg-[#F7FAFF]"
                      }`}
                    >
                      {getAddressIcon(type)}
                      {type}
                    </button>
                  ))}
                </div>

                <FieldError message={touched.type ? errors.type : undefined} />
              </div>

              {!backendMode && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] font-bold text-[#102D62]">
                    Full Name
                    <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    onBlur={() => handleBlur("fullName")}
                    placeholder="Enter full name"
                    autoComplete="name"
                    maxLength={50}
                    className={inputClass("fullName")}
                  />

                  <div className="flex justify-between">
                    <FieldError
                      message={touched.fullName ? errors.fullName : undefined}
                    />

                    {!errors.fullName && (
                      <span className="ml-auto mt-1.5 text-[10px] text-[#9AA9BF]">
                        {form.fullName.length}/50
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[12px] font-bold text-[#102D62]">
                    Phone Number
                    <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B9AAF]"
                    />

                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      onBlur={() => handleBlur("phone")}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                      maxLength={15}
                      className={`${inputClass("phone")} pl-10`}
                    />
                  </div>

                  <FieldError
                    message={touched.phone ? errors.phone : undefined}
                  />
                </div>
              </div>
              )}

              <div className="mt-4">
                <label className="mb-2 block text-[12px] font-bold text-[#102D62]">
                  Address
                  <span className="ml-1 text-[#EF4444]">*</span>
                </label>

                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={(event) =>
                    updateField("addressLine1", event.target.value)
                  }
                  onBlur={() => handleBlur("addressLine1")}
                  placeholder="House / Flat / Building / Street"
                  autoComplete="street-address"
                  maxLength={100}
                  className={inputClass("addressLine1")}
                />

                <div className="flex justify-between">
                  <FieldError
                    message={
                      touched.addressLine1 ? errors.addressLine1 : undefined
                    }
                  />

                  {!errors.addressLine1 && (
                    <span className="ml-auto mt-1.5 text-[10px] text-[#9AA9BF]">
                      {form.addressLine1.length}/100
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-[12px] font-bold text-[#102D62]">
                  Address Line 2
                  <span className="ml-1 text-[10px] font-normal text-[#9AA9BF]">
                    (Optional)
                  </span>
                </label>

                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={(event) =>
                    updateField("addressLine2", event.target.value)
                  }
                  onBlur={() => handleBlur("addressLine2")}
                  placeholder="Apartment, area, locality"
                  maxLength={100}
                  className={inputClass("addressLine2")}
                />

                <FieldError
                  message={
                    touched.addressLine2 ? errors.addressLine2 : undefined
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] font-bold text-[#102D62]">
                    City
                    <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    onBlur={() => handleBlur("city")}
                    placeholder="Enter city"
                    autoComplete="address-level2"
                    maxLength={50}
                    className={inputClass("city")}
                  />

                  <FieldError
                    message={touched.city ? errors.city : undefined}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[12px] font-bold text-[#102D62]">
                    State
                    <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <select
                    value={form.state}
                    onChange={(event) =>
                      updateField("state", event.target.value)
                    }
                    onBlur={() => handleBlur("state")}
                    className={`${inputClass("state")} cursor-pointer`}
                  >
                    <option value="">Select state</option>

                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>

                  <FieldError
                    message={touched.state ? errors.state : undefined}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] font-bold text-[#102D62]">
                    Pincode
                    <span className="ml-1 text-[#EF4444]">*</span>
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.pincode}
                    onChange={(event) =>
                      updateField("pincode", event.target.value)
                    }
                    onBlur={() => handleBlur("pincode")}
                    placeholder="600001"
                    maxLength={6}
                    autoComplete="postal-code"
                    className={inputClass("pincode")}
                  />

                  <FieldError
                    message={touched.pincode ? errors.pincode : undefined}
                  />
                </div>

                {!backendMode && (
                <div>
                  <label className="mb-2 block text-[12px] font-bold text-[#102D62]">
                    Landmark
                    <span className="ml-1 text-[10px] font-normal text-[#9AA9BF]">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={form.landmark}
                    onChange={(event) =>
                      updateField("landmark", event.target.value)
                    }
                    onBlur={() => handleBlur("landmark")}
                    placeholder="Near Central Mall"
                    maxLength={80}
                    className={inputClass("landmark")}
                  />

                  <FieldError
                    message={touched.landmark ? errors.landmark : undefined}
                  />
                </div>
                )}
              </div>

              <div className="mt-5 rounded-[11px] bg-[#F5F8FD] p-3.5">
                <div className="flex gap-3">
                  <MapPin
                    size={18}
                    className="mt-0.5 shrink-0 text-[#1769F5]"
                  />

                  <p className="text-[11px] leading-5 text-[#718096]">
                    Make sure your address, city, state and pincode are
                    correct to avoid delivery delays.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="h-[48px] rounded-[10px] border border-[#D9E2EE] px-6 text-[13px] font-semibold text-[#52627A] transition hover:bg-[#F5F8FC] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex h-[48px] items-center justify-center gap-2 rounded-[10px] bg-[#1769F5] px-7 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(23,105,245,0.20)] transition hover:bg-[#0F5DDD] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingId ? "Update Address" : "Save Address"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
