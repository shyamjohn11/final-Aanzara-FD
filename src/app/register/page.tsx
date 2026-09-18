"use client";

import {
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  MapPin,
  FileText,
  ShieldCheck,
} from "lucide-react";

// Import your pre-configured axios instance and helpers
import { toast } from "react-toastify";

import { extractErrorMessage } from "@/app/api/api";
import { authApi } from "@/app/api/services";

export default function RegisterPage() {
  const router = useRouter();

  // =========================================================
  // SIGN IN TRANSITION
  // =========================================================

  const [leavingToLogin, setLeavingToLogin] = useState(false);

  const handleSignInClick = () => {
    setLeavingToLogin(true);
    setTimeout(() => {
      router.push("/login");
    }, 650);
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirm: "",
    terms: false,
  });

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const change = (
    key: string,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
    setError("");
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // --- validation ---
    if (
      !form.name.trim() ||
      !form.mobile.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirm
    ) {
      setError("Please fill in all fields.");
      toast.error("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!/^\d{10}$/.test(form.mobile.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (form.password.length < 8 || form.password.length > 12) {
      setError("Password must be between 8 and 12 characters.");
      toast.error("Password must be between 8 and 12 characters.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    if (!form.terms) {
      setError("Please accept the Terms & Conditions.");
      toast.error("Please accept the Terms & Conditions.");
      return;
    }

    try {
      setLoading(true);

      // --- call API --- POST /api/v1/auth/register
      await authApi.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.mobile.trim(),
        passphrase: form.password,
        confirmPassphrase: form.confirm,
      });

      // --- success ---
      setLoading(false);
      toast.success("Registration successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      const msg = extractErrorMessage(err, "Registration failed. Please try again.");
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  /* =========================================================
     INPUT STYLES
  ========================================================= */

  const input =
    "h-[38px] w-full rounded-lg border border-slate-200 bg-white px-3 pl-9 text-[11px] outline-none placeholder:text-slate-400 focus:border-[#24439A] focus:ring-2 focus:ring-[#24439A]/10";

  return (
    <main
      className="
        flex
        h-screen
        w-full
        overflow-hidden
        bg-[#F7F9FC]
      "
    >
      {/* =====================================================
          LEFT HERO
      ===================================================== */}

      <section
        className="
          relative
          hidden
          h-screen
          w-[55%]
          shrink-0
          overflow-hidden
          transition-opacity
          duration-700
          ease-out
          lg:flex
        "
        style={{
          opacity: leavingToLogin ? 0 : 1,
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="
            pointer-events-none
            absolute
            inset-0
            z-0
            h-full
            w-full
            object-cover
          "
        >
          <source
            src="/videos/create-account-hero.mp4"
            type="video/mp4"
          />
        </video>

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-0
            bg-[#0757B8]/12
          "
        />
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-0
            bg-gradient-to-r
            from-[#003F91]/45
            via-[#0757B8]/22
            to-transparent
          "
        />
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-0
            bg-gradient-to-b
            from-[#06499F]/18
            via-transparent
            to-transparent
          "
        />
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-0
            bg-gradient-to-t
            from-[#06499F]/22
            via-transparent
            to-transparent
          "
        />

        <div
          className="
            relative
            z-10
            flex
            h-full
            w-full
            flex-col
            px-[48px]
            py-[42px]
          "
        >
          <div
            className="
              mt-auto
              mb-6
              w-full
              max-w-[720px]
              text-center
            "
          >
            <p
              className="
                mx-auto
                max-w-[680px]
                text-center
                text-[16px]
                leading-7
                text-white
                drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]
              "
            >
              Shop smarter, discover better offers and
              <br />
              manage all your purchases in one place.
            </p>
          </div>

          <div
            className="
              grid
              w-full
              max-w-[720px]
              grid-cols-3
              gap-0
              pb-[2px]
            "
          >
            <div
              className="
                flex
                min-h-[72px]
                flex-col
                items-center
                justify-center
                border-r
                border-white/25
                px-4
                text-center
              "
            >
              <div
                className="
                  mb-2
                  flex
                  h-[42px]
                  w-[42px]
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/20
                  bg-[#0753C7]/80
                  text-[#FFD21C]
                  shadow-[0_6px_15px_rgba(0,0,0,0.15)]
                "
              >
                <Check size={20} strokeWidth={2.5} />
              </div>
              <strong
                className="
                  max-w-[150px]
                  text-[13px]
                  font-bold
                  leading-5
                  text-white
                  drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]
                "
              >
                Shop 1000+
                <br />
                FMCG Products
              </strong>
              <span className="mt-1 text-[9px] text-white/90">
                Genuine direct sourcing
              </span>
            </div>

            <div
              className="
                flex
                min-h-[72px]
                flex-col
                items-center
                justify-center
                border-r
                border-white/25
                px-4
                text-center
              "
            >
              <div
                className="
                  mb-2
                  flex
                  h-[42px]
                  w-[42px]
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/20
                  bg-[#0753C7]/80
                  text-[#FFD21C]
                  shadow-[0_6px_15px_rgba(0,0,0,0.15)]
                "
              >
                <MapPin size={20} strokeWidth={2.3} />
              </div>
              <strong
                className="
                  max-w-[160px]
                  text-[13px]
                  font-bold
                  leading-5
                  text-white
                  drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]
                "
              >
                Discover Nearby
                <br />
                Store Offers
              </strong>
              <span className="mt-1 text-[9px] text-white/90">
                Best deals in your vicinity
              </span>
            </div>

            <div
              className="
                flex
                min-h-[72px]
                flex-col
                items-center
                justify-center
                px-4
                text-center
              "
            >
              <div
                className="
                  mb-2
                  flex
                  h-[42px]
                  w-[42px]
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/20
                  bg-[#0753C7]/80
                  text-[#FFD21C]
                  shadow-[0_6px_15px_rgba(0,0,0,0.15)]
                "
              >
                <FileText size={20} strokeWidth={2.3} />
              </div>
              <strong
                className="
                  max-w-[160px]
                  text-[13px]
                  font-bold
                  leading-5
                  text-white
                  drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]
                "
              >
                Get Secure
                <br />
                GST Invoices
              </strong>
              <span className="mt-1 text-[9px] text-white/90">
                Easy commercial
                <br />
                tax filing
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <section
        className="
          relative
          flex
          h-screen
          min-w-0
          flex-1
          items-start
          justify-center
          overflow-y-auto
          overflow-x-hidden
          bg-gradient-to-br
          from-[#F8FAFD]
          via-[#F2F6FB]
          to-[#EAF0F9]
          px-5
          py-6
          lg:px-6
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            -top-24
            -right-20
            h-[320px]
            w-[320px]
            rounded-full
            bg-[#2848A0]/10
            blur-[90px]
          "
          aria-hidden="true"
        />
        <div
          className="
            pointer-events-none
            absolute
            -bottom-28
            -left-16
            h-[300px]
            w-[300px]
            rounded-full
            bg-[#1E8F5F]/8
            blur-[100px]
          "
          aria-hidden="true"
        />

        <div
          className="
            relative
            w-full
            max-w-[500px]
            rounded-[16px]
            border
            border-[#E4EAF2]
            bg-gradient-to-b
            from-white
            to-[#FBFCFE]
            px-5
            py-4
            shadow-[0_1px_2px_rgba(16,38,77,0.04),0_10px_24px_rgba(20,50,90,0.07),0_32px_70px_rgba(20,50,90,0.14)]
            sm:px-7
            sm:py-5
          "
        >
          <div className="mb-2 flex justify-center">
            <img
              src="/images/Logo/Aanzara-logo7.png"
              alt="Aanzara"
              className="
                h-[68px]
                w-auto
                max-w-[250px]
                object-contain
                object-center
              "
            />
          </div>

          <h2
            className="
              text-[24px]
              font-extrabold
              tracking-[-0.8px]
              text-[#10264D]
            "
          >
            Create an Account
          </h2>

          <p className="mt-1 text-[12px] text-[#66748A]">
            Join Aanzara and start shopping today.
          </p>

          {/* =================================================
              REGISTRATION FORM
          ================================================= */}

          <form onSubmit={submit} className="mt-4 space-y-2.5">
            <Field label="Full Name" icon={<User size={15} />}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => change("name", e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                className={input}
              />
            </Field>

            <Field label="Mobile Number">
              <div className="flex h-[38px] w-full">
                <div
                  className="
                    flex
                    h-full
                    w-[64px]
                    shrink-0
                    items-center
                    justify-center
                    gap-1
                    rounded-l-lg
                    border
                    border-r-0
                    border-slate-200
                    bg-white
                    text-[11px]
                    font-semibold
                    text-slate-600
                  "
                >
                  <Phone size={14} className="text-slate-500" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) =>
                    change("mobile", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter your mobile number"
                  maxLength={10}
                  autoComplete="tel"
                  className="
                    h-full
                    min-w-0
                    flex-1
                    rounded-r-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    text-[11px]
                    text-slate-700
                    outline-none
                    placeholder:text-slate-400
                    focus:border-[#24439A]
                    focus:ring-2
                    focus:ring-[#24439A]/10
                  "
                />
              </div>
            </Field>

            <Field label="Email Address" icon={<Mail size={15} />}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => change("email", e.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                className={input}
              />
            </Field>

            <Field label="Password" icon={<Lock size={15} />}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => change("password", e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  maxLength={12}
                  className={`${input} pr-10`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    hover:text-[#24439A]
                  "
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <div className="-mt-1">
              <div className="flex gap-1">
                {[3, 6, 9, 12].map((n) => (
                  <span
                    key={n}
                    className={`
                      h-[3px]
                      flex-1
                      rounded
                      ${
                        form.password.length >= n
                          ? "bg-[#08B77A]"
                          : "bg-slate-200"
                      }
                    `}
                  />
                ))}
              </div>
              <p className="mt-1 text-[8px] text-slate-400">
                Requirements:
                <span className="font-semibold text-[#08A979]">
                  {" "}8-12 chars
                </span>
              </p>
            </div>

            <Field label="Confirm Password" icon={<Lock size={15} />}>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => change("confirm", e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  maxLength={12}
                  className={`${input} pr-10`}
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    hover:text-[#24439A]
                  "
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <label className="flex items-start gap-2 pt-1 text-[9px] leading-4 text-slate-500">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => change("terms", e.target.checked)}
                className="mt-[1px] h-3.5 w-3.5 accent-[#24439A]"
              />
              <span>
                I agree to the Aanzara{" "}
                <b className="text-[#24439A]">Terms &amp; Conditions</b>{" "}
                and{" "}
                <b className="text-[#24439A]">Privacy Policy</b>.
              </span>
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-[9px] text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                flex
                h-[43px]
                w-full
                items-center
                justify-center
                rounded-[8px]
                bg-[#24439A]
                text-[12px]
                font-bold
                text-white
                shadow-[0_6px_16px_rgba(36,67,154,0.20)]
                transition
                hover:bg-[#1D3780]
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading ? (
                <>
                  <span
                    className="
                      mr-2
                      h-4
                      w-4
                      animate-spin
                      rounded-full
                      border-2
                      border-white/30
                      border-t-white
                    "
                  />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* =================================================
              OR
          ================================================= */}

          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[9px] text-slate-400">OR</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <p className="text-center text-[10px] text-slate-500">
            Already have an Aanzara account?{" "}
            <button
              type="button"
              onClick={handleSignInClick}
              className="font-bold text-[#24439A] hover:underline"
            >
              Sign In
            </button>
          </p>

          <p className="mt-2 flex items-center justify-center gap-1.5 text-[8px] text-slate-400">
            <ShieldCheck size={12} className="text-[#08A979]" />
            Your connection is secure and your information is protected.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   FIELD COMPONENT
============================================================ */

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold text-[#17233D]">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}