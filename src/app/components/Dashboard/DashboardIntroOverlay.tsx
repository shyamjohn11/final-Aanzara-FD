"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Ember = {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
};

/*
 * IMPORTANT:
 * Do NOT use Math.random() here.
 *
 * These values must be identical during:
 *   Server Render
 *   Client Hydration
 *
 * Otherwise Next.js will show a hydration mismatch.
 */
const EMBERS: Ember[] = [
  { id: 0, left: 4, size: 3, duration: 5.8, delay: 1.2, drift: -16, opacity: 0.42 },
  { id: 1, left: 10, size: 4, duration: 6.4, delay: 0.8, drift: 24, opacity: 0.58 },
  { id: 2, left: 17, size: 2, duration: 4.8, delay: 2.1, drift: -12, opacity: 0.48 },
  { id: 3, left: 23, size: 5, duration: 7.2, delay: 0.4, drift: 28, opacity: 0.65 },
  { id: 4, left: 29, size: 3, duration: 5.1, delay: 2.8, drift: -22, opacity: 0.52 },
  { id: 5, left: 36, size: 4, duration: 6.0, delay: 1.5, drift: 14, opacity: 0.40 },
  { id: 6, left: 42, size: 3, duration: 4.6, delay: 0.3, drift: -18, opacity: 0.70 },
  { id: 7, left: 49, size: 5, duration: 7.4, delay: 2.4, drift: 20, opacity: 0.46 },
  { id: 8, left: 55, size: 2, duration: 5.5, delay: 1.0, drift: -26, opacity: 0.62 },
  { id: 9, left: 61, size: 4, duration: 6.7, delay: 3.1, drift: 12, opacity: 0.50 },
  { id: 10, left: 67, size: 3, duration: 4.4, delay: 0.6, drift: -14, opacity: 0.72 },
  { id: 11, left: 73, size: 5, duration: 7.8, delay: 2.0, drift: 32, opacity: 0.44 },
  { id: 12, left: 79, size: 3, duration: 5.9, delay: 1.7, drift: -20, opacity: 0.60 },
  { id: 13, left: 85, size: 4, duration: 6.3, delay: 0.2, drift: 18, opacity: 0.55 },
  { id: 14, left: 92, size: 3, duration: 4.9, delay: 2.7, drift: -30, opacity: 0.47 },
  { id: 15, left: 97, size: 5, duration: 7.1, delay: 1.1, drift: 22, opacity: 0.68 },
  { id: 16, left: 7, size: 2, duration: 5.3, delay: 3.0, drift: 16, opacity: 0.39 },
  { id: 17, left: 14, size: 4, duration: 6.8, delay: 0.7, drift: -24, opacity: 0.57 },
  { id: 18, left: 27, size: 3, duration: 4.7, delay: 2.3, drift: 30, opacity: 0.64 },
  { id: 19, left: 34, size: 5, duration: 7.6, delay: 1.8, drift: -17, opacity: 0.45 },
  { id: 20, left: 46, size: 3, duration: 5.7, delay: 0.5, drift: 25, opacity: 0.61 },
  { id: 21, left: 58, size: 4, duration: 6.5, delay: 2.9, drift: -21, opacity: 0.51 },
  { id: 22, left: 64, size: 2, duration: 4.5, delay: 1.4, drift: 15, opacity: 0.67 },
  { id: 23, left: 76, size: 4, duration: 7.3, delay: 0.9, drift: -27, opacity: 0.43 },
  { id: 24, left: 88, size: 3, duration: 5.6, delay: 2.5, drift: 19, opacity: 0.59 },
  { id: 25, left: 94, size: 5, duration: 6.9, delay: 1.6, drift: -13, opacity: 0.53 },
];

export default function DashboardIntroOverlay() {
  const [stage, setStage] = useState<
    "enter" | "hold" | "exiting" | "gone"
  >("enter");

  useEffect(() => {
    const toHold = window.setTimeout(() => {
      setStage("hold");
    }, 400);

    const toExit = window.setTimeout(() => {
      setStage("exiting");
    }, 3400);

    const toGone = window.setTimeout(() => {
      setStage("gone");
    }, 4200);

    return () => {
      window.clearTimeout(toHold);
      window.clearTimeout(toExit);
      window.clearTimeout(toGone);
    };
  }, []);

  if (stage === "gone") {
    return null;
  }

  const isExiting = stage === "exiting";

  return (
    <div
      aria-hidden="true"
      className={[
        "fixed inset-0 z-[999] flex items-center justify-center overflow-hidden",
        "bg-[radial-gradient(circle_at_50%_40%,#7a1f1f_0%,#4a1010_55%,#2b0a0a_100%)]",
        "transition-all duration-[800ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
        isExiting
          ? "opacity-0 -translate-y-10 blur-md pointer-events-none"
          : "opacity-100 translate-y-0 blur-0",
      ].join(" ")}
    >
      {/* =========================================================
          ROTATING MANDALA
          ========================================================= */}

      <svg
        viewBox="0 0 400 400"
        className="
          absolute
          w-[clamp(320px,80vw,640px)]
          h-[clamp(320px,80vw,640px)]
          opacity-[0.20]
          gc-mandala
        "
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="200"
          cy="200"
          r="190"
          stroke="#F5C452"
          strokeWidth="1"
        />

        <circle
          cx="200"
          cy="200"
          r="150"
          stroke="#F5C452"
          strokeWidth="1"
        />

        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;

          return (
            <line
              key={`line-${i}`}
              x1="200"
              y1="10"
              x2="200"
              y2="50"
              stroke="#F5C452"
              strokeWidth="1.5"
              transform={`rotate(${angle} 200 200)`}
            />
          );
        })}

        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;

          return (
            <circle
              key={`circle-${i}`}
              cx="200"
              cy="35"
              r="7"
              stroke="#F5C452"
              strokeWidth="1"
              transform={`rotate(${angle} 200 200)`}
            />
          );
        })}
      </svg>

      {/* =========================================================
          VIGNETTE
          ========================================================= */}

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(0,0,0,0.45)_100%)]
        "
      />

      {/* =========================================================
          FLOATING EMBERS
          ========================================================= */}

      {EMBERS.map((e) => (
        <span
          key={e.id}
          className="
            absolute
            bottom-[-4%]
            rounded-full
            bg-amber-300
            gc-ember
          "
          style={
            {
              left: `${e.left}%`,
              width: `${e.size}px`,
              height: `${e.size}px`,
              opacity: e.opacity,
              animationDuration: `${e.duration}s`,
              animationDelay: `${e.delay}s`,
              "--gc-drift": `${e.drift}px`,
              "--gc-ember-opacity": e.opacity,
              boxShadow: "0 0 6px 1px rgba(255,200,100,0.7)",
            } as React.CSSProperties
          }
        />
      ))}

      {/* =========================================================
          CENTER CONTENT
          ========================================================= */}

      <div
        className="
          relative
          flex
          flex-col
          items-center
          gap-4
          sm:gap-6
          px-6
          text-center
          max-w-[92vw]
        "
      >
        {/* LOGO */}

        <Image
          src="/images/Aanzara-logoo.png"
          alt="Aanzara"
          width={220}
          height={80}
          priority
          className="
            w-[clamp(120px,32vw,220px)]
            h-auto
            gc-logo-in
            select-none
          "
          draggable={false}
        />

        {/* =======================================================
            DIYA
            ======================================================= */}

        <div className="relative gc-diya-wrap">
          <div
            className="
              absolute
              inset-0
              -z-20
              rounded-full
              bg-amber-300/30
              blur-[40px]
              gc-glow-slow
              scale-[2.4]
            "
          />

          <div
            className="
              absolute
              inset-0
              -z-10
              rounded-full
              bg-yellow-200/60
              blur-xl
              gc-glow
            "
          />

          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="
              w-[clamp(44px,11vw,80px)]
              h-[clamp(44px,11vw,80px)]
              drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]
            "
            aria-hidden="true"
          >
            {/* Flame */}

            <ellipse
              cx="32"
              cy="15"
              rx="5"
              ry="9.5"
              fill="#FFDD70"
              className="gc-flame"
            />

            <ellipse
              cx="32"
              cy="17"
              rx="2.5"
              ry="5.5"
              fill="#FF8A1E"
            />

            {/* Diya */}

            <path
              d="
                M8 34
                C8 34 15 47 32 47
                C49 47 56 34 56 34
                C49 38.5 40 41 32 41
                C24 41 15 38.5 8 34Z
              "
              fill="#7A2E0A"
            />

            <ellipse
              cx="32"
              cy="34"
              rx="24"
              ry="6.5"
              fill="#B5490A"
            />

            <ellipse
              cx="32"
              cy="33"
              rx="24"
              ry="4"
              fill="#D9631C"
              opacity="0.7"
            />
          </svg>
        </div>

        {/* =======================================================
            SMALL TAMIL TEXT
            ======================================================= */}

        <p
          className="
            text-amber-200/90
            font-medium
            tracking-[3px]
            uppercase
            gc-fade-up
            text-[clamp(0.65rem,2vw,0.8rem)]
          "
          style={{
            animationDelay: "1s",
          }}
        >
          விநாயகா
        </p>

        {/* =======================================================
            MAIN TAMIL GREETING
            ======================================================= */}

        <p
          className="
            font-bold
            gc-fade-up
            gc-shimmer-text
            text-[clamp(1.35rem,5.2vw,2.25rem)]
          "
          style={{
            animationDelay: "1.3s",
          }}
        >
          விநாயகர் சதுர்த்தி வாழ்த்துக்கள்
        </p>

        {/* =======================================================
            DIVIDER
            ======================================================= */}

        <span
          className="
            h-px
            w-0
            bg-gradient-to-r
            from-transparent
            via-amber-300/80
            to-transparent
            gc-divider
          "
          style={{
            animationDelay: "1.75s",
          }}
        />

        {/* =======================================================
            ENGLISH
            ======================================================= */}

        <p
          className="
            text-amber-100/80
            font-medium
            tracking-[2px]
            uppercase
            gc-fade-up
            text-[clamp(0.65rem,2.2vw,0.85rem)]
          "
          style={{
            animationDelay: "1.9s",
          }}
        >
          Happy Ganesh Chaturthi
        </p>
      </div>

      {/* =========================================================
          CSS ANIMATIONS
          ========================================================= */}

      <style>{`
        /* EMBERS */

        @keyframes gc-ember-rise {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }

          10% {
            opacity: var(--gc-ember-opacity, 0.6);
          }

          90% {
            opacity: var(--gc-ember-opacity, 0.6);
          }

          100% {
            transform:
              translate(
                var(--gc-drift, 20px),
                -105vh
              );
            opacity: 0;
          }
        }

        .gc-ember {
          animation-name: gc-ember-rise;
          animation-timing-function: ease-in;
          animation-iteration-count: infinite;
        }

        /* MANDALA */

        @keyframes gc-mandala-spin {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }

        .gc-mandala {
          animation:
            gc-mandala-spin
            60s
            linear
            infinite;
        }

        /* GLOW */

        @keyframes gc-glow-pulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }

          50% {
            opacity: 0.9;
            transform: scale(1.2);
          }
        }

        .gc-glow {
          animation:
            gc-glow-pulse
            1.8s
            ease-in-out
            infinite;
        }

        /* SLOW GLOW */

        @keyframes gc-glow-pulse-slow {
          0%,
          100% {
            opacity: 0.4;
          }

          50% {
            opacity: 0.75;
          }
        }

        .gc-glow-slow {
          animation:
            gc-glow-pulse-slow
            3.2s
            ease-in-out
            infinite;
        }

        /* FLAME */

        @keyframes gc-flame-flicker {
          0%,
          100% {
            transform:
              scaleY(1)
              scaleX(1)
              translateX(0);
          }

          30% {
            transform:
              scaleY(1.1)
              scaleX(0.92)
              translateX(-0.5px);
          }

          60% {
            transform:
              scaleY(0.95)
              scaleX(1.05)
              translateX(0.5px);
          }
        }

        .gc-flame {
          transform-origin: center bottom;

          animation:
            gc-flame-flicker
            0.5s
            ease-in-out
            infinite;
        }

        /* LOGO */

        @keyframes gc-logo-in {
          0% {
            opacity: 0;
            transform:
              translateY(-14px)
              scale(0.85);
            filter: blur(5px);
          }

          100% {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
            filter: blur(0);
          }
        }

        .gc-logo-in {
          opacity: 0;

          animation:
            gc-logo-in
            0.7s
            cubic-bezier(0.22, 1, 0.36, 1)
            both;

          animation-delay: 0.15s;
        }

        /* DIYA */

        @keyframes gc-diya-in {
          0% {
            opacity: 0;
            transform:
              translateY(24px)
              scale(0.8);
            filter: blur(4px);
          }

          100% {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
            filter: blur(0);
          }
        }

        .gc-diya-wrap {
          animation:
            gc-diya-in
            0.75s
            cubic-bezier(0.22, 1, 0.36, 1)
            both;

          animation-delay: 0.55s;
        }

        /* TEXT */

        @keyframes gc-fade-up {
          0% {
            opacity: 0;
            transform: translateY(16px);
            filter: blur(3px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        .gc-fade-up {
          opacity: 0;

          animation:
            gc-fade-up
            0.7s
            cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
        }

        /* DIVIDER */

        @keyframes gc-divider-grow {
          0% {
            width: 0;
            opacity: 0;
          }

          100% {
            width: clamp(60px, 18vw, 140px);
            opacity: 1;
          }
        }

        .gc-divider {
          animation:
            gc-divider-grow
            0.6s
            ease-out
            forwards;
        }

        /* SHIMMER */

        .gc-shimmer-text {
          background: linear-gradient(
            100deg,
            #f5d98a 20%,
            #fff6d8 40%,
            #f5d98a 60%,
            #e8b95c 80%
          );

          background-size: 220% 100%;

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;

          animation:
            gc-fade-up
              0.7s
              cubic-bezier(0.22, 1, 0.36, 1)
              forwards,
            gc-shimmer-sweep
              2.8s
              ease-in-out
              1.8s
              infinite;
        }

        @keyframes gc-shimmer-sweep {
          0% {
            background-position: 0% 0%;
          }

          100% {
            background-position: -220% 0%;
          }
        }

        /* MOBILE */

        @media (max-width: 640px) {
          .gc-mandala {
            opacity: 0.14;
          }
        }

        /* ACCESSIBILITY */

        @media (prefers-reduced-motion: reduce) {
          .gc-mandala,
          .gc-ember,
          .gc-glow,
          .gc-glow-slow,
          .gc-flame,
          .gc-logo-in,
          .gc-diya-wrap,
          .gc-fade-up,
          .gc-divider,
          .gc-shimmer-text {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}