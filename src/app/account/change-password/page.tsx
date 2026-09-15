"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api, extractErrorMessage } from "@/app/api/api";

import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  Bell,
  LockKeyhole,
  LogOut,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  HeartOff,
  PackageOpen,
  Star,
  User,
  Package,
  MapPin,
  ChevronRight,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  X,
  Info,
  ShieldCheck,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type PasswordField =
  | "currentPassword"
  | "newPassword"
  | "confirmPassword";

type PasswordErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 64;

// ============================================================
// PASSWORD VALIDATION
// ============================================================

function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(
      `At least ${MIN_PASSWORD_LENGTH} characters`
    );
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(
      `Maximum ${MAX_PASSWORD_LENGTH} characters`
    );
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("At least one number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("At least one special character");
  }

  return errors;
}

// ============================================================
// PASSWORD STRENGTH
// ============================================================

function getPasswordStrength(password: string) {
  if (!password) {
    return {
      label: "",
      percentage: 0,
      level: 0,
    };
  }

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return {
      label: "Weak",
      percentage: 33,
      level: 1,
    };
  }

  if (score <= 4) {
    return {
      label: "Medium",
      percentage: 66,
      level: 2,
    };
  }

  return {
    label: "Strong",
    percentage: 100,
    level: 3,
  };
}

// ============================================================
// PAGE CONTENT
// ============================================================

export default function ChangePasswordPage() {
  const router = useRouter();

  // ==========================================================
  // STATE
  // ==========================================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] =
    useState<PasswordErrors>({});

  const [touched, setTouched] = useState<
    Record<PasswordField, boolean>
  >({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================================
  // PASSWORD STRENGTH
  // ==========================================================

  const passwordStrength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword]
  );

  // ==========================================================
  // VALIDATE FORM
  // ==========================================================

  const validateForm = (): boolean => {
    const nextErrors: PasswordErrors = {};

    // Current password
    if (!currentPassword.trim()) {
      nextErrors.currentPassword =
        "Current password is required.";
    }

    // New password
    if (!newPassword) {
      nextErrors.newPassword =
        "New password is required.";
    } else {
      const passwordErrors =
        validatePassword(newPassword);

      if (passwordErrors.length > 0) {
        nextErrors.newPassword =
          "Password must contain: " +
          passwordErrors.join(", ") +
          ".";
      }
    }

    // Confirm password
    if (!confirmPassword) {
      nextErrors.confirmPassword =
        "Please confirm your new password.";
    } else if (
      newPassword !== confirmPassword
    ) {
      nextErrors.confirmPassword =
        "Passwords do not match.";
    }

    // Same password
    if (
      currentPassword &&
      newPassword &&
      currentPassword === newPassword
    ) {
      nextErrors.newPassword =
        "New password must be different from your current password.";
    }

    setErrors(nextErrors);

    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    return Object.keys(nextErrors).length === 0;
  };

  // ==========================================================
  // FIELD BLUR
  // ==========================================================

  const handleBlur = (
    field: PasswordField
  ) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    const nextErrors: PasswordErrors = {
      ...errors,
    };

    // Current password
    if (
      field === "currentPassword" &&
      !currentPassword.trim()
    ) {
      nextErrors.currentPassword =
        "Current password is required.";
    }

    // New password
    if (field === "newPassword") {
      if (!newPassword) {
        nextErrors.newPassword =
          "New password is required.";
      } else {
        const passwordErrors =
          validatePassword(newPassword);

        nextErrors.newPassword =
          passwordErrors.length > 0
            ? "Password must contain: " +
              passwordErrors.join(", ") +
              "."
            : undefined;
      }

      if (
        currentPassword &&
        newPassword === currentPassword
      ) {
        nextErrors.newPassword =
          "New password must be different from your current password.";
      }
    }

    // Confirm password
    if (field === "confirmPassword") {
      if (!confirmPassword) {
        nextErrors.confirmPassword =
          "Please confirm your new password.";
      } else if (
        confirmPassword !== newPassword
      ) {
        nextErrors.confirmPassword =
          "Passwords do not match.";
      } else {
        nextErrors.confirmPassword =
          undefined;
      }
    }

    setErrors(nextErrors);
  };

  // ==========================================================
  // CURRENT PASSWORD CHANGE
  // ==========================================================

  const handleCurrentPasswordChange = (
    value: string
  ) => {
    setCurrentPassword(value);

    setErrorMessage("");
    setSuccessMessage("");

    if (touched.currentPassword) {
      setErrors((current) => ({
        ...current,
        currentPassword:
          value.trim().length > 0
            ? undefined
            : "Current password is required.",
      }));
    }
  };

  // ==========================================================
  // NEW PASSWORD CHANGE
  // ==========================================================

  const handleNewPasswordChange = (
    value: string
  ) => {
    setNewPassword(value);

    setErrorMessage("");
    setSuccessMessage("");

    if (touched.newPassword) {
      let message: string | undefined;

      if (!value) {
        message = "New password is required.";
      } else {
        const passwordErrors =
          validatePassword(value);

        if (passwordErrors.length > 0) {
          message =
            "Password must contain: " +
            passwordErrors.join(", ") +
            ".";
        }

        if (
          currentPassword &&
          value === currentPassword
        ) {
          message =
            "New password must be different from your current password.";
        }
      }

      setErrors((current) => ({
        ...current,
        newPassword: message,
      }));
    }

    // Keep confirm-password validation in sync
    if (touched.confirmPassword) {
      setErrors((current) => ({
        ...current,
        confirmPassword:
          confirmPassword &&
          confirmPassword !== value
            ? "Passwords do not match."
            : undefined,
      }));
    }
  };

  // ==========================================================
  // CONFIRM PASSWORD CHANGE
  // ==========================================================

  const handleConfirmPasswordChange = (
    value: string
  ) => {
    setConfirmPassword(value);

    setErrorMessage("");
    setSuccessMessage("");

    if (touched.confirmPassword) {
      setErrors((current) => ({
        ...current,
        confirmPassword: !value
          ? "Please confirm your new password."
          : value !== newPassword
          ? "Passwords do not match."
          : undefined,
      }));
    }
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      // POST /api/v1/auth/change-passphrase (Bearer attached by the api client)
      await api.post("/api/v1/auth/change-passphrase", {
        currentPassphrase: currentPassword,
        newPassphrase: newPassword,
        confirmPassphrase: confirmPassword,
      });

      setSuccessMessage(
        "Your password has been changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setErrors({});

      setTouched({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setErrorMessage(
        extractErrorMessage(
          error,
          "Unable to change your password. Please try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {
    // #6 POST /api/v1/auth/logout best-effort, then central session
    // clear (tokens, cookies) so route guards engage.
    try {
      const { authApi } = await import("@/app/api/services");
      await authApi.logout();
    } catch (error) {
      console.error(
        "Server logout failed:",
        error
      );
    }

    try {
      const { clearSession } = await import(
        "@/app/api/api"
      );
      clearSession();
    } catch (error) {
      console.error(
        "Unable to clear authentication:",
        error
      );
    }

    router.push("/login");
  };

  // ==========================================================
  // SIDEBAR
  // ==========================================================

  const sidebarItems = [
    {
      label: "My Profile",
      icon: User,
      href: "/account/profile",
    },
    {
      label: "My Orders",
      icon: Package,
      href: "/account/orders",
    },
    {
      label: "Addresses",
      icon: MapPin,
      href: "/account/addresses",
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

  // Prevent unused-variable lint issues if sidebar is
  // controlled by the parent account layout.
  void sidebarItems;
  void handleLogout;
  void ShoppingBag;
  void Bell;
  void LogOut;
  void Trash2;
  void ShoppingCart;
  void XCircle;
  void HeartOff;
  void PackageOpen;
  void Star;

  // ==========================================================
  // PASSWORD REQUIREMENTS
  // ==========================================================

  const requirements = [
    {
      label: "At least 8 characters",
      valid: newPassword.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(newPassword),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(newPassword),
    },
    {
      label: "One number",
      valid: /[0-9]/.test(newPassword),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9]/.test(newPassword),
    },
  ];

  // ==========================================================
  // INPUT COMPONENT
  // ==========================================================

  const renderPasswordInput = ({
    label,
    value,
    onChange,
    onBlur,
    placeholder,
    showPassword,
    setShowPassword,
    error,
    field,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    placeholder: string;
    showPassword: boolean;
    setShowPassword: (
      value: boolean
    ) => void;
    error?: string;
    field: PasswordField;
  }) => {
    const hasError =
      touched[field] && Boolean(error);

    return (
      <div>
        <label
          htmlFor={field}
          className="block text-sm font-semibold text-[#123665] mb-2"
        >
          {label}
          <span className="text-red-500 ml-1">
            *
          </span>
        </label>

        <div className="relative">
          <LockKeyhole
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />

          <input
            id={field}
            name={field}
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            onBlur={onBlur}
            placeholder={placeholder}
            autoComplete={
              field === "currentPassword"
                ? "current-password"
                : "new-password"
            }
            maxLength={MAX_PASSWORD_LENGTH}
            className={`w-full h-12 rounded-xl border bg-white pl-11 pr-12 text-sm text-[#123665] placeholder:text-slate-400 outline-none transition ${
              hasError
                ? "border-red-400 focus:ring-4 focus:ring-red-50"
                : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            }`}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-[#123665] transition"
            aria-label={
              showPassword
                ? `Hide ${label}`
                : `Show ${label}`
            }
          >
            {showPassword ? (
              <EyeOff size={19} />
            ) : (
              <Eye size={19} />
            )}
          </button>
        </div>

        {hasError && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-500">
            <X
              size={14}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}
      </div>
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* =====================================================
          BREADCRUMB
      ====================================================== */}

      <div className="flex items-center gap-2 text-sm mb-7">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-blue-600 hover:underline"
        >
          Home
        </button>

        <ChevronRight
          size={14}
          className="text-slate-400"
        />

        <button
          type="button"
          onClick={() =>
            router.push("/account/profile")
          }
          className="text-slate-500 hover:text-blue-600 transition"
        >
          My Account
        </button>

        <ChevronRight
          size={14}
          className="text-slate-400"
        />

        <span className="font-semibold text-[#0d2d62]">
          Change Password
        </span>
      </div>

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() =>
            router.push("/account/profile")
          }
          className="w-12 h-12 shrink-0 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#0d2d62] hover:bg-blue-50 hover:text-blue-600 transition"
          aria-label="Back to account"
        >
          <ArrowLeft size={22} />
        </button>

        <div>
          <h1 className="text-[30px] md:text-[36px] font-bold text-[#0d2d62]">
            Change Password
          </h1>

          <p className="mt-1 text-sm md:text-base text-slate-500">
            Update your password to keep your
            account secure.
          </p>
        </div>
      </div>

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {successMessage && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Check size={19} />
          </div>

          <div>
            <p className="font-semibold text-emerald-700 text-sm">
              Password updated
            </p>

            <p className="mt-0.5 text-sm text-emerald-600">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {errorMessage && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-4 flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <X size={19} />
          </div>

          <div>
            <p className="font-semibold text-red-700 text-sm">
              Something went wrong
            </p>

            <p className="mt-0.5 text-sm text-red-600">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          FORM CARD
      ====================================================== */}

      <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden">

        {/* CARD HEADER */}

        <div className="px-5 sm:px-7 py-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <KeyRound size={24} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#0d2d62]">
                Password Security
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Enter your current password and
                choose a new secure password.
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="p-5 sm:p-7"
        >
          <div className="max-w-[680px] space-y-6">

            {/* =================================================
                CURRENT PASSWORD
            ================================================== */}

            {renderPasswordInput({
              label: "Current Password",
              value: currentPassword,
              onChange:
                handleCurrentPasswordChange,
              onBlur: () =>
                handleBlur("currentPassword"),
              placeholder:
                "Enter your current password",
              showPassword:
                showCurrentPassword,
              setShowPassword:
                setShowCurrentPassword,
              error:
                errors.currentPassword,
              field: "currentPassword",
            })}

            {/* =================================================
                NEW PASSWORD
            ================================================== */}

            <div>
              {renderPasswordInput({
                label: "New Password",
                value: newPassword,
                onChange:
                  handleNewPasswordChange,
                onBlur: () =>
                  handleBlur("newPassword"),
                placeholder:
                  "Enter your new password",
                showPassword:
                  showNewPassword,
                setShowPassword:
                  setShowNewPassword,
                error:
                  errors.newPassword,
                field: "newPassword",
              })}

              {/* PASSWORD STRENGTH */}

              {newPassword && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">
                      Password strength
                    </span>

                    <span
                      className={`text-xs font-semibold ${
                        passwordStrength.level === 3
                          ? "text-emerald-600"
                          : passwordStrength.level === 2
                          ? "text-amber-600"
                          : "text-red-500"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>

                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        passwordStrength.level === 3
                          ? "bg-emerald-500"
                          : passwordStrength.level === 2
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${passwordStrength.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* PASSWORD REQUIREMENTS */}

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-semibold text-[#123665] mb-3">
                  Password requirements
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {requirements.map(
                    (requirement) => (
                      <div
                        key={
                          requirement.label
                        }
                        className={`flex items-center gap-2 text-xs ${
                          requirement.valid
                            ? "text-emerald-600"
                            : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            requirement.valid
                              ? "bg-emerald-100"
                              : "bg-white border border-slate-200"
                          }`}
                        >
                          {requirement.valid && (
                            <Check size={12} />
                          )}
                        </span>

                        {requirement.label}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* =================================================
                CONFIRM PASSWORD
            ================================================== */}

            {renderPasswordInput({
              label: "Confirm New Password",
              value: confirmPassword,
              onChange:
                handleConfirmPasswordChange,
              onBlur: () =>
                handleBlur(
                  "confirmPassword"
                ),
              placeholder:
                "Re-enter your new password",
              showPassword:
                showConfirmPassword,
              setShowPassword:
                setShowConfirmPassword,
              error:
                errors.confirmPassword,
              field: "confirmPassword",
            })}

            {/* PASSWORD MATCH */}

            {confirmPassword &&
              newPassword ===
                confirmPassword && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 size={17} />

                  <span>
                    Passwords match.
                  </span>
                </div>
              )}

            {/* =================================================
                ACTION BUTTONS
            ================================================== */}

            <div className="border-t border-slate-100 pt-6">
              <div className="flex flex-wrap items-center justify-end gap-3">

                {/* OK */}

<button
  type="button"
  onClick={() => setSuccessMessage("")}
  disabled={isSubmitting}
  className="h-12 w-full sm:w-auto px-6 rounded-xl border border-slate-200 bg-white text-[#0d2d62] text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition"
>
  OK
</button>

                {/* UPDATE */}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full sm:w-auto px-7 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />

                      Updating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />

                      Update Password
                    </>
                  )}
                </button>

              </div>
            </div>

          </div>
        </form>
      </div>

      {/* =====================================================
          SECURITY INFO
      ====================================================== */}

      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-4">

          <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <ShieldCheck size={23} />
          </div>

          <div>
            <h3 className="font-bold text-[#123d7a]">
              Keep your account secure
            </h3>

            <p className="mt-1 text-sm leading-6 text-[#476184]">
              Use a unique password that you do
              not use on other websites. Never
              share your password with anyone.
            </p>
          </div>

        </div>
      </div>

      {/* =====================================================
          HELP
      ====================================================== */}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Info size={17} />

        <span>
          Forgot your current password?
        </span>

        <button
          type="button"
          onClick={() =>
            router.push("/forgot-password")
          }
          className="font-semibold text-blue-600 hover:underline"
        >
          Reset it here
        </button>
      </div>
    </>
  );
}