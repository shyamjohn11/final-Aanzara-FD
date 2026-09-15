"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  ShieldCheck,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
} from "lucide-react";

type Step = "account" | "otp" | "password" | "success";

export default function ForgotPasswordForm({
  onBack,
}: {
  onBack: () => void;
}) {
  const [step, setStep] = useState<Step>("account");

  const [account, setAccount] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [delivery, setDelivery] = useState<"email" | "phone" | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [timer, setTimer] = useState(30);

  /*
   * Demo OTP
   *
   * Replace this with your real API-generated OTP
   * when backend integration is available.
   */
  const DEMO_OTP = "123456";

  /*
   * ==========================================
   * OTP COUNTDOWN
   * ==========================================
   */

  useEffect(() => {
    if (step !== "otp" || timer <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimer((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [step, timer]);

  /*
   * ==========================================
   * VALIDATE ACCOUNT
   * ==========================================
   */

  const handleSendOtp = () => {
    if (loading) return;

    setError("");

    const value = account.trim();

    if (!value) {
      setError("Please enter your email or mobile number.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
    const normalizedPhone = value.replace(/[\s-]/g, "");

    const isEmail = emailRegex.test(value);
    const isPhone = phoneRegex.test(normalizedPhone);

    if (!isEmail && !isPhone) {
      setError("Please enter a valid email address or mobile number.");
      return;
    }

    setDelivery(isEmail ? "email" : "phone");

    /*
     * Demo only.
     * Replace with API call.
     */
    console.log("Forgot password OTP:", DEMO_OTP);

    setOtp("");
    setTimer(30);
    setStep("otp");
  };

  /*
   * ==========================================
   * VERIFY OTP
   * ==========================================
   */

  const handleVerifyOtp = () => {
    if (loading) return;

    setError("");

    const cleanOtp = otp.replace(/\D/g, "");

    if (!cleanOtp) {
      setError("Please enter the OTP.");
      return;
    }

    if (cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (cleanOtp !== DEMO_OTP) {
      setError("Invalid OTP. Please try again.");
      return;
    }

    setStep("password");
    setError("");
  };

  /*
   * ==========================================
   * PASSWORD VALIDATION
   * ==========================================
   */

  const handleResetPassword = () => {
    if (loading) return;

    setError("");

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword.length > 128) {
      setError("Password must not exceed 128 characters.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    /*
     * Demo only.
     * Replace this timeout with your password reset API.
     */

    window.setTimeout(() => {
      setLoading(false);
      setStep("success");
      setError("");
    }, 700);
  };

  /*
   * ==========================================
   * RESEND OTP
   * ==========================================
   */

  const handleResendOtp = () => {
    if (timer > 0 || loading) return;

    setError("");
    setOtp("");
    setTimer(30);

    /*
     * Demo only.
     * Replace with API call.
     */
    console.log("OTP resent:", DEMO_OTP);
  };

  /*
   * ==========================================
   * BACK BUTTON
   * ==========================================
   */

  const handleBack = () => {
    setError("");

    if (step === "otp") {
      setOtp("");
      setTimer(30);
      setStep("account");
      return;
    }

    if (step === "password") {
      setNewPassword("");
      setConfirmPassword("");
      setStep("otp");
      return;
    }

    onBack();
  };

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <div>
      {/* =========================
          HEADER
      ========================= */}

      <div className="text-center">
        <div
          className="
            mx-auto
            flex
            h-[52px]
            w-[52px]
            items-center
            justify-center
            rounded-full
            bg-[#EAF1FF]
          "
        >
          {step === "success" ? (
            <CheckCircle2 size={26} className="text-[#2848A0]" />
          ) : (
            <ShieldCheck size={26} className="text-[#2848A0]" />
          )}
        </div>

        <h1
          className="
            mt-3
            text-[27px]
            font-extrabold
            tracking-[-1px]
            text-[#10264D]
          "
        >
          {step === "account" && "Forgot Password?"}
          {step === "otp" && "Verify OTP"}
          {step === "password" && "Create New Password"}
          {step === "success" && "Password Reset Successful"}
        </h1>

        <p className="mt-1 text-[13px] leading-5 text-[#53647D]">
          {step === "account" &&
            "Enter your registered email or mobile number."}

          {step === "otp" &&
            "Enter the 6-digit OTP sent to your account."}

          {step === "password" &&
            "Create a new secure password for your account."}

          {step === "success" &&
            "Your Aanzara password has been successfully changed."}
        </p>
      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div
          className="
            mt-4
            rounded-[9px]
            border
            border-red-200
            bg-red-50
            px-3
            py-2.5
          "
        >
          <p className="text-[11px] text-red-600">{error}</p>
        </div>
      )}

      {/* =========================
          STEP 1
          ACCOUNT
      ========================= */}

      {step === "account" && (
        <div className="mt-6">
          <label
            htmlFor="fp-account"
            className="
              mb-1.5
              block
              text-[12px]
              font-bold
              text-[#17233D]
            "
          >
            Email or Mobile Number
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-[#8293AA]
              "
            />

            <input
              id="fp-account"
              type="text"
              value={account}
              autoComplete="username"
              onChange={(e) => {
                setAccount(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendOtp();
                }
              }}
              placeholder="Enter your email or mobile"
              className="
                h-[48px]
                w-full
                rounded-[10px]
                border
                border-[#CBD7E5]
                bg-[#F9FBFD]
                pl-11
                pr-4
                text-[13px]
                text-[#17233D]
                outline-none
                transition
                placeholder:text-[#9AA6B7]
                focus:border-[#2848A0]
                focus:ring-4
                focus:ring-[#2848A0]/10
              "
            />
          </div>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading}
            className="
              mt-5
              flex
              h-[48px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[10px]
              bg-[#2848A0]
              text-[14px]
              font-bold
              text-white
              shadow-[0_8px_18px_rgba(40,72,160,0.22)]
              transition-all
              hover:bg-[#1E3988]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <ShieldCheck size={18} />
            Send OTP
          </button>

          <button
            type="button"
            onClick={onBack}
            className="
              mt-4
              flex
              w-full
              items-center
              justify-center
              gap-2
              text-[11px]
              font-bold
              text-[#637188]
              hover:text-[#2848A0]
            "
          >
            <ArrowLeft size={14} />
            Back to Login
          </button>
        </div>
      )}

      {/* =========================
          STEP 2
          OTP
      ========================= */}

      {step === "otp" && (
        <div className="mt-6">
          <div className="text-center">
            <p className="text-[11px] text-[#697890]">
              OTP sent via{" "}
              <strong className="text-[#2848A0]">
                {delivery === "email" ? "Email" : "Mobile"}
              </strong>
            </p>

            <p className="mt-1 break-all text-[12px] font-bold text-[#2848A0]">
              {account}
            </p>
          </div>

          <label
            htmlFor="fp-otp"
            className="
              mb-2
              mt-5
              block
              text-center
              text-[12px]
              font-bold
              text-[#17233D]
            "
          >
            Enter 6-Digit OTP
          </label>

          <input
            id="fp-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setOtp(value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && otp.length === 6) {
                handleVerifyOtp();
              }
            }}
            autoFocus
            placeholder="------"
            className="
              h-[54px]
              w-full
              rounded-[10px]
              border
              border-[#CBD7E5]
              bg-[#F9FBFD]
              text-center
              text-[22px]
              font-bold
              tracking-[10px]
              text-[#17233D]
              outline-none
              placeholder:text-[#B5BFCD]
              focus:border-[#2848A0]
              focus:ring-4
              focus:ring-[#2848A0]/10
            "
          />

          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6 || loading}
            className="
              mt-4
              flex
              h-[48px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[10px]
              bg-[#2848A0]
              text-[14px]
              font-bold
              text-white
              shadow-[0_8px_18px_rgba(40,72,160,0.22)]
              transition
              hover:bg-[#1E3988]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <ShieldCheck size={18} />
            Verify OTP
          </button>

          <div className="mt-4 text-center">
            {timer > 0 ? (
              <p className="text-[11px] text-[#7C899B]">
                Resend OTP in{" "}
                <strong className="text-[#2848A0]">
                  00:{String(timer).padStart(2, "0")}
                </strong>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="
                  text-[11px]
                  font-bold
                  text-[#2848A0]
                  hover:underline
                "
              >
                Resend OTP
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="
              mt-4
              flex
              w-full
              items-center
              justify-center
              gap-2
              text-[11px]
              font-bold
              text-[#637188]
              hover:text-[#2848A0]
            "
          >
            <ArrowLeft size={14} />
            Change Email / Mobile
          </button>
        </div>
      )}

      {/* =========================
          STEP 3
          PASSWORD
      ========================= */}

      {step === "password" && (
        <div className="mt-6">
          <label
            htmlFor="fp-newPassword"
            className="
              mb-1.5
              block
              text-[12px]
              font-bold
              text-[#17233D]
            "
          >
            New Password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-[#8293AA]
              "
            />

            <input
              id="fp-newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              autoComplete="new-password"
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter new password"
              className="
                h-[48px]
                w-full
                rounded-[10px]
                border
                border-[#CBD7E5]
                bg-[#F9FBFD]
                pl-11
                pr-11
                text-[13px]
                text-[#17233D]
                outline-none
                focus:border-[#2848A0]
                focus:ring-4
                focus:ring-[#2848A0]/10
              "
            />

            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              className="
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-[#8293AA]
              "
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label
            htmlFor="fp-confirmPassword"
            className="
              mb-1.5
              mt-4
              block
              text-[12px]
              font-bold
              text-[#17233D]
            "
          >
            Confirm New Password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-[#8293AA]
              "
            />

            <input
              id="fp-confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              placeholder="Confirm new password"
              className="
                h-[48px]
                w-full
                rounded-[10px]
                border
                border-[#CBD7E5]
                bg-[#F9FBFD]
                pl-11
                pr-11
                text-[13px]
                text-[#17233D]
                outline-none
                focus:border-[#2848A0]
                focus:ring-4
                focus:ring-[#2848A0]/10
              "
            />

            <button
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-[#8293AA]
              "
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          <p className="mt-2 text-[10px] text-[#7C899B]">
            Password must contain at least 8 characters.
          </p>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
            className="
              mt-5
              flex
              h-[48px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[10px]
              bg-[#2848A0]
              text-[14px]
              font-bold
              text-white
              shadow-[0_8px_18px_rgba(40,72,160,0.22)]
              transition
              hover:bg-[#1E3988]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <Lock size={18} />
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="
              mt-4
              flex
              w-full
              items-center
              justify-center
              gap-2
              text-[11px]
              font-bold
              text-[#637188]
              hover:text-[#2848A0]
              disabled:opacity-50
            "
          >
            <ArrowLeft size={14} />
            Back to OTP
          </button>
        </div>
      )}

      {/* =========================
          STEP 4
          SUCCESS
      ========================= */}

      {step === "success" && (
        <div className="mt-6 text-center">
          <div
            className="
              rounded-[12px]
              border
              border-green-200
              bg-green-50
              px-4
              py-4
            "
          >
            <p className="text-[13px] font-bold text-green-700">
              Password changed successfully!
            </p>

            <p className="mt-1 text-[11px] leading-5 text-green-600">
              You can now sign in using your new password.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="
              mt-5
              flex
              h-[48px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[10px]
              bg-[#2848A0]
              text-[14px]
              font-bold
              text-white
              shadow-[0_8px_18px_rgba(40,72,160,0.22)]
              hover:bg-[#1E3988]
            "
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
}
