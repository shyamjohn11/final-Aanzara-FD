"use client";

import {
  useState,
  useEffect,
  useRef,
  Suspense,
  type ReactNode,
} from "react";

import Image from "next/image";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserRound,
  BriefcaseBusiness,
  LogIn,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Percent,
  Truck,
} from "lucide-react";

import ForgotPasswordForm from "../forgot-password/ForgotPasswordForm";
import { saveSession, resolveUserRole, extractErrorMessage, type LoginPayload, AuthResponse } from '@/app/api/api';
import { authApi } from "@/app/api/services";

// =============================================================
// HERO BACKGROUND (LOGIN STATE)
// =============================================================

const HERO_VIDEO_SRC = "/videos/hero.mp4";

// =============================================================
// SIGNUP MEDIA SOURCE
// =============================================================

const SIGNUP_MEDIA_SRC = "/videos/create-account-hero.mp4";
const SIGNUP_MEDIA_IS_VIDEO = /\.(mp4|webm|ogg)$/i.test(SIGNUP_MEDIA_SRC);

// =============================================================
// HEADLINE KEYFRAMES
// =============================================================

const HEADLINE_KEYFRAMES = `
  @keyframes letterPop {
    0% {
      opacity: 0;
      transform: translateY(30px) scale(0.5);
    }
    60% {
      opacity: 1;
      transform: translateY(-6px) scale(1.08);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes letterWave {
    0% {
      opacity: 0;
      transform: translateY(0) rotate(0deg);
    }
    40% {
      opacity: 1;
      transform: translateY(-14px) rotate(-6deg);
    }
    70% {
      transform: translateY(4px) rotate(3deg);
    }
    100% {
      opacity: 1;
      transform: translateY(0) rotate(0deg);
    }
  }

  @keyframes letterSlideGlow {
    0% {
      opacity: 0;
      transform: translateX(-18px);
      text-shadow: 0 0 0px rgba(255,255,255,0);
    }
    55% {
      opacity: 1;
      text-shadow: 0 0 12px rgba(255,255,255,0.85);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
      text-shadow: 0 0 0px rgba(255,255,255,0);
    }
  }

  @keyframes iconFloat {
    0%, 100% {
      transform: translateY(0) rotateX(0deg) rotateY(0deg);
    }
    50% {
      transform: translateY(-5px) rotateX(2deg) rotateY(-2deg);
    }
  }
`;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // FORGOT PASSWORD (INLINE)
  // =========================================================

  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // =========================================================
  // LEFT PANEL MEDIA (Login vs Create Account)
  // =========================================================

  const [showSignupMedia, setShowSignupMedia] = useState(false);
  const signupVideoRef = useRef<HTMLVideoElement>(null);
  const signupVideoPreloadStarted = useRef(false);

  // =========================================================
  // HEADLINE ANIMATION
  // =========================================================

  const [headlineCycle, setHeadlineCycle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        setHeadlineCycle((current) => current + 1);
      }
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // SIGNUP VIDEO — PRELOAD ON INTENT, PLAY ON REVEAL
  // =========================================================

  const startSignupVideoPreload = () => {
    if (!SIGNUP_MEDIA_IS_VIDEO) return;
    if (signupVideoPreloadStarted.current) return;
    const video = signupVideoRef.current;
    if (!video) return;
    signupVideoPreloadStarted.current = true;
    video.preload = "auto";
    video.load();
  };

  useEffect(() => {
    if (!SIGNUP_MEDIA_IS_VIDEO) return;
    const video = signupVideoRef.current;
    if (!video) return;
    if (showSignupMedia) {
      startSignupVideoPreload();
      video.play().catch((err) => {
        console.warn("Signup hero video failed to play:", err);
      });
    }
  }, [showSignupMedia]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      setLoading(false);
      return;
    }

    const loginEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const loginPhoneRegex = /^[6-9]\d{9}$/;
    const cleanedPhone = cleanEmail.replace(/\D/g, "");

    const isValidEmail = loginEmailRegex.test(cleanEmail);
    const isValidPhone = loginPhoneRegex.test(cleanedPhone);

    if (!isValidEmail && !isValidPhone) {
      setError("Please enter a valid email address or 10-digit mobile number.");
      setLoading(false);
      return;
    }

    try {
      const payload: LoginPayload = {
        email: cleanEmail,
        passphrase: password,
      };

      const response = await authApi.login(payload);
      const authData = response.data;

      console.log("Login response:", authData);

      // Save authentication session
      saveSession(authData);

      // Remember me
      if (rememberMe) {
        localStorage.setItem("aanzara_remember_me", "true");
      } else {
        localStorage.removeItem("aanzara_remember_me");
      }

      // =====================================================
      // RESOLVE ROLE — same resolver saveSession() used for the
      // aanzara_role cookie, so the middleware guard and the
      // pushed route can never disagree.
      // =====================================================

      const userRole = resolveUserRole(authData);

      console.log("Resolved user role:", userRole);

      // =====================================================
      // REDIRECT (honor ?redirect= when safe for the role)
      // =====================================================

      const requestedRedirect =
        searchParams.get("redirect");
      const safeRedirect =
        requestedRedirect &&
        requestedRedirect.startsWith("/") &&
        !requestedRedirect.startsWith("//") &&
        !requestedRedirect.startsWith("/login") &&
        !requestedRedirect.startsWith("/register")
          ? requestedRedirect
          : null;

      const mayUseRedirect =
        safeRedirect && (userRole !== "admin" || safeRedirect.startsWith("/admin"))
          ? safeRedirect
          : null;

      const destination =
        userRole === "admin"
          ? mayUseRedirect ?? "/admin"
          : mayUseRedirect ?? "/dashboard";

      setLoading(false);

      // Hard navigation so the middleware guard cookies and the context
      // providers bootstrap from a clean page load. A soft router.push can
      // leave the parallel auth storages (api.ts keys vs AuthContext keys)
      // out of step on the very next render.
      window.location.assign(destination);
    } catch (loginError: unknown) {
      console.error("Login error:", loginError);

      const errorMessage = extractErrorMessage(
        loginError,
        "Unable to connect to login service. Please try again."
      );

      setError(errorMessage);
      setLoading(false);
    }
  };

  // =========================================================
  // CREATE ACCOUNT CLICK
  // =========================================================

  const handleCreateAccountClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowSignupMedia(true);
    const redirect = searchParams.get("redirect");
    const target =
      redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//")
        ? `/register?redirect=${encodeURIComponent(redirect)}`
        : "/register";
    setTimeout(() => {
      router.push(target);
    }, 1200);
  };

  return (
    <main className="h-screen w-full overflow-hidden bg-[#F5F8FC]">
      <style>{HEADLINE_KEYFRAMES}</style>

      <div className="grid h-screen w-full lg:grid-cols-[55%_45%] overflow-hidden">
        {/* =====================================================
            LEFT HERO SECTION
        ===================================================== */}

        <section className="relative hidden h-screen overflow-hidden lg:flex">
          <div
            className="absolute inset-0 transition-all duration-700 ease-out"
            style={{
              opacity: showSignupMedia ? 0 : 1,
              transform: showSignupMedia ? "translateX(-24px) scale(1.02)" : "translateX(0) scale(1)",
            }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src={HERO_VIDEO_SRC} type="video/mp4" />
            </video>
          </div>

          {SIGNUP_MEDIA_IS_VIDEO ? (
            <video
              ref={signupVideoRef}
              key={SIGNUP_MEDIA_SRC}
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out"
              style={{
                opacity: showSignupMedia ? 1 : 0,
                transform: showSignupMedia ? "translateX(0) scale(1)" : "translateX(24px) scale(1.02)",
              }}
            >
              <source src={SIGNUP_MEDIA_SRC} />
            </video>
          ) : (
            showSignupMedia && (
              <img
                key={SIGNUP_MEDIA_SRC}
                src={SIGNUP_MEDIA_SRC}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out"
                style={{
                  opacity: 1,
                  transform: "translateX(0) scale(1)",
                }}
              />
            )
          )}

          <div className="absolute inset-0 bg-gradient-to-br from-[#073A91]/80 via-[#1455A8]/55 to-[#0B4A9E]/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#062E78]/35 via-[#0B438F]/15 to-transparent" />

          <div className="relative z-10 flex h-screen w-full flex-col px-8 py-5 xl:px-10 xl:py-6">
            <div className="flex items-center">
              <Image
                src="/images/Logo/Aanzara-logo1.png"
                alt="Aanzara - Shop More. Live Better."
                width={600}
                height={240}
                className="h-auto w-[180px] object-contain object-left drop-shadow-[0_6px_18px_rgba(0,0,0,0.18)] xl:w-[220px]"
              />
            </div>

            <div className="my-auto max-w-[720px] pb-4 pt-8">
              <h1 className="text-[25px] font-extrabold leading-[1.08] tracking-[-1.5px] text-white xl:text-[30px]">
                <AnimatedHeadline
                  key={headlineCycle}
                  lines={["Everything You Need,", "All in One Place"]}
                  variant={HEADLINE_VARIANTS[headlineCycle % HEADLINE_VARIANTS.length]}
                />
              </h1>

              <p className="mt-4 max-w-[650px] text-[15px] leading-6 text-white/90 xl:text-[17px] xl:leading-7">
                Shop everyday essentials, discover local B2B offers, and manage your commercial business purchases with ease on Aanzara&apos;s unified commerce ecosystem.
              </p>
            </div>

            <div className="mt-auto flex justify-center pb-6 xl:pb-8">
              <div className="grid w-fit grid-cols-3 gap-4 xl:gap-6">
                <HeroFeature icon={<Tag size={22} />} title="1000+ FMCG Brands" text="Genuine direct sourcing" delay={0} />
                <HeroFeature icon={<Percent size={22} />} title="Exclusive Pricing" text="Bulk wholesale discounts" delay={0.4} />
                <HeroFeature icon={<Truck size={22} />} title="Secure Logistics" text="Reliable doorstep delivery" delay={0.8} />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT SECTION — Login Form
        ===================================================== */}

        <section className="relative flex h-screen min-h-0 items-center justify-center overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#F8FAFD] via-[#F2F6FB] to-[#EAF0F9] px-3 py-4 sm:px-5 lg:h-screen lg:px-6 lg:py-6 xl:px-8">
          <div className="pointer-events-none absolute -top-24 -right-20 h-[320px] w-[320px] rounded-full bg-[#2848A0]/10 blur-[90px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-[300px] w-[300px] rounded-full bg-[#1E8F5F]/8 blur-[100px]" aria-hidden="true" />

          <div className="relative w-full max-w-[500px]">
            <div className="w-full rounded-[22px] border border-[#E4EAF2] bg-gradient-to-b from-white to-[#FBFCFE] px-5 py-4 shadow-[0_1px_2px_rgba(16,38,77,0.04),0_10px_24px_rgba(20,50,90,0.07),0_32px_70px_rgba(20,50,90,0.14)] sm:px-7 sm:py-5">
              <div className="flex justify-center">
                <Image
                  src="/images/Logo/Aanzara-logo7.png"
                  alt="Aanzara - Shop More. Live Better."
                  width={400}
                  height={170}
                  className="h-auto w-[165px] object-contain sm:w-[185px]"
                />
              </div>

              {/* =================================================
                  WELCOME / FORGOT PASSWORD SWAP
              ================================================= */}

              {!showForgotPassword ? (
                <>
                  <div className="mt-1 text-center">
                    <h2 className="text-[27px] font-extrabold leading-tight tracking-[-1px] text-[#10264D] sm:text-[30px]">
                      Welcome Back
                    </h2>
                    <p className="mt-1 text-[13px] text-[#53647D]">
                      Sign in to continue shopping with Aanzara.
                    </p>
                  </div>
                </>
              ) : (
                <div className="mt-1">
                  <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
                </div>
              )}

              {!showForgotPassword && error && (
                <div className="mt-3 rounded-[9px] border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-[11px] text-red-600">{error}</p>
                </div>
              )}

              {!showForgotPassword && (
                <form onSubmit={handleSubmit} className="mt-4">
                  <label htmlFor="email" className="mb-1.5 block text-[12px] font-bold text-[#17233D]">
                    Email or Mobile Number
                  </label>

                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8293AA]" />
                    <input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your email or mobile"
                      autoComplete="email"
                      className="h-[46px] w-full rounded-[10px] border border-[#CBD7E5] bg-[#F9FBFD] pl-11 pr-4 text-[13px] text-[#17233D] outline-none transition placeholder:text-[#9AA6B7] focus:border-[#2848A0] focus:ring-4 focus:ring-[#2848A0]/10"
                    />
                  </div>

                  <label htmlFor="password" className="mb-1.5 mt-3 block text-[12px] font-bold text-[#17233D]">
                    Enter Password
                  </label>

                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8293AA]" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-[46px] w-full rounded-[10px] border border-[#CBD7E5] bg-[#F9FBFD] pl-11 pr-11 text-[13px] text-[#17233D] outline-none transition placeholder:text-[#9AA6B7] focus:border-[#2848A0] focus:ring-4 focus:ring-[#2848A0]/10"
                    />

                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8293AA] transition hover:text-[#2848A0]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#637188]">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-[16px] w-[16px] cursor-pointer accent-[#2848A0]"
                      />
                      Remember me
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[11px] font-bold text-[#2848A0] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 flex h-[47px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#2848A0] text-[14px] font-bold text-white shadow-[0_8px_18px_rgba(40,72,160,0.22)] transition-all hover:bg-[#1E3988] hover:shadow-[0_10px_22px_rgba(40,72,160,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn size={18} />
                        Sign In
                      </>
                    )}
                  </button>
                </form>
              )}

              {!showForgotPassword && (
                <div className="mt-3 overflow-hidden rounded-[11px] border border-[#DCE4ED] bg-white">
                  <Link
                    href="/register"
                    onClick={handleCreateAccountClick}
                    onMouseEnter={startSignupVideoPreload}
                    onFocus={startSignupVideoPreload}
                    className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-[#F8FAFD]"
                  >
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#E9F2FF]">
                      <UserPlus size={17} className="text-[#2451B5]" />
                    </div>
                    <p className="flex-1 text-[10px] text-[#34435A] sm:text-[11px]">
                      Don&apos;t have an Aanzara account?
                    </p>
                    <span className="whitespace-nowrap text-[10px] font-bold text-[#24439A] sm:text-[11px]">
                      Create an account
                    </span>
                    <ArrowRight size={15} className="text-[#24439A] transition group-hover:translate-x-1" />
                  </Link>
                </div>
              )}

              <div className="mt-2.5 border-t border-[#E3E8EF] pt-2">
                <p className="flex items-center justify-center gap-2 text-center text-[9px] text-[#7C899B]">
                  <ShieldCheck size={14} className="text-[#607DB7]" />
                  <span>
                    Your connection is <strong className="text-[#2848A0]">secure</strong> and your information is protected.
                  </span>
                </p>
              </div>
            </div>

            <footer className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2 text-center text-[10px] leading-4 text-[#8995A7]">
              <Link href="/privacy" className="transition hover:text-[#2848A0] hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition hover:text-[#2848A0] hover:underline">
                Terms &amp; Conditions
              </Link>
              <Link href="/help" className="transition hover:text-[#2848A0] hover:underline">
                Help Center
              </Link>
              <Link href="/contact" className="transition hover:text-[#2848A0] hover:underline">
                Contact Support
              </Link>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

// =============================================================
// HERO FEATURE COMPONENT
// =============================================================

function HeroFeature({
  icon,
  title,
  text,
  delay = 0,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  delay?: number;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -22, y: px * 22 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <div className="text-white">
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        className="mb-2 h-[48px] w-[48px]"
        style={{ perspective: "400px" }}
      >
        <div
          className="flex h-full w-full items-center justify-center rounded-full border border-white/25 transition-transform duration-200 ease-out"
          style={{
            background: "linear-gradient(155deg, rgba(255,255,255,0.22) 0%, rgba(36,72,164,0.65) 55%, rgba(11,30,75,0.85) 100%)",
            boxShadow: "0 10px 20px rgba(4,15,45,0.45), 0 2px 4px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -6px 10px rgba(0,0,0,0.25)",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            animation: `iconFloat 3.4s ease-in-out ${delay}s infinite`,
          }}
        >
          <span className="text-[#FFD21F]" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))" }}>
            {icon}
          </span>
        </div>
      </div>

      <strong
        className="block text-[13px] font-bold xl:text-[15px]"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
      >
        {title}
      </strong>

      <span className="mt-1 block text-[10px] leading-4 text-white/75 xl:text-[11px]">
        {text}
      </span>
    </div>
  );
}

// =============================================================
// ANIMATED HEADLINE
// =============================================================

const HEADLINE_VARIANTS = ["pop", "wave", "slideGlow"] as const;
type HeadlineVariant = (typeof HEADLINE_VARIANTS)[number];

function AnimatedHeadline({
  lines,
  variant,
}: {
  lines: string[];
  variant: HeadlineVariant;
}) {
  let globalIndex = 0;

  const animConfig: Record<
    HeadlineVariant,
    {
      name: string;
      duration: string;
      easing: string;
      perLetterDelay: number;
    }
  > = {
    pop: {
      name: "letterPop",
      duration: "0.5s",
      easing: "cubic-bezier(0.34,1.56,0.64,1)",
      perLetterDelay: 0.035,
    },
    wave: {
      name: "letterWave",
      duration: "0.6s",
      easing: "ease-out",
      perLetterDelay: 0.045,
    },
    slideGlow: {
      name: "letterSlideGlow",
      duration: "0.55s",
      easing: "cubic-bezier(0.22,1,0.36,1)",
      perLetterDelay: 0.03,
    },
  };

  const config = animConfig[variant];

  return (
    <>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} className="block">
          {line.split("").map((char, i) => {
            const delay = globalIndex * config.perLetterDelay;
            globalIndex++;

            return char === " " ? (
              <span key={i} className="inline-block w-[0.28em]" />
            ) : (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: 0,
                  animationName: config.name,
                  animationDuration: config.duration,
                  animationTimingFunction: config.easing,
                  animationFillMode: "forwards",
                  animationDelay: `${delay}s`,
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}
// Force dynamic rendering since we use useSearchParams
export const dynamic = "force-dynamic";

// useSearchParams requires a Suspense boundary for static prerendering.
export default function LoginPage() {
  return (
    <Suspense fallback={<main className="h-screen w-full bg-[#F5F8FC]" />}>
      <LoginPageContent />
    </Suspense>
  );
}

