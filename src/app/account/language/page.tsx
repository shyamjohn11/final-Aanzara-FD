"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  X,
  Globe,
  Check,
  Languages,
} from "lucide-react";

const LANGUAGES = [
  "English",
  "Tamil",
  "Hindi",
  "Telugu",
  "Malayalam",
  "Kannada",
];

export default function LanguagePage() {
  const router = useRouter();

  const [selected, setSelected] = useState("English");

  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
     VALIDATE LANGUAGE
  ====================================================== */

  const validateLanguage = (): boolean => {
    if (!selected || selected.trim() === "") {
      setError("Please select a language.");
      return false;
    }

    if (!LANGUAGES.includes(selected)) {
      setError("Please select a valid language.");
      return false;
    }

    setError("");
    return true;
  };

  /* =====================================================
     SELECT LANGUAGE
  ====================================================== */

  const handleLanguageSelect = (language: string) => {
    if (!LANGUAGES.includes(language)) {
      setError("Invalid language selected.");
      return;
    }

    setSelected(language);
    setSaved(false);
    setError("");
  };

  /* =====================================================
     SAVE LANGUAGE
  ====================================================== */

  const handleSave = () => {
    const isValid = validateLanguage();

    if (!isValid) {
      return;
    }

    setSaved(true);
    setError("");

    setTimeout(() => {
      router.push("/account");
    }, 1200);
  };

  /* =====================================================
     CANCEL
  ====================================================== */

  const handleCancel = () => {
    setError("");
    setSaved(false);
    router.push("/account");
  };

  /* =====================================================
     BACK TO ACCOUNT
  ====================================================== */

  const handleBackToAccount = () => {
    setError("");
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
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#F5F8FC]"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.8}
          />
        </button>

        <h1 className="flex-1 px-2 text-[16px] font-bold text-[#10265B]">
          Language
        </h1>

        <button
          type="button"
          onClick={() => router.push("/account")}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#F5F8FC]"
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

            <Globe
              size={21}
              strokeWidth={1.8}
              className="text-[#1769F5]"
            />

          </div>

          <div className="ml-3">

            <p className="text-[12px] font-bold text-[#10265B]">
              App Language
            </p>

            <p className="mt-1 text-[10px] leading-4 text-[#66748B]">
              Select your preferred language.
            </p>

          </div>

        </section>

        {/* ===================================================
            CURRENT LANGUAGE
        ==================================================== */}

        <div className="mb-4 flex items-center justify-between rounded-lg bg-[#F8FAFD] px-4 py-3">

          <div className="flex items-center">

            <Languages
              size={17}
              className="mr-2 text-[#1769F5]"
            />

            <span className="text-[10px] text-[#718096]">
              Current selection
            </span>

          </div>

          <span className="text-[11px] font-bold text-[#1769F5]">
            {selected || "Not selected"}
          </span>

        </div>

        {/* ===================================================
            LANGUAGE LIST
        ==================================================== */}

        <div
          className={`overflow-hidden rounded-xl border bg-white ${
            error
              ? "border-[#FCA5A5]"
              : "border-[#E5EAF1]"
          }`}
        >

          {LANGUAGES.map((language, index) => {

            const active = selected === language;

            return (
              <button
                key={language}
                type="button"
                onClick={() =>
                  handleLanguageSelect(language)
                }
                aria-pressed={active}
                className={`
                  flex
                  min-h-[54px]
                  w-full
                  items-center
                  px-4
                  text-left
                  transition
                  ${
                    index !== LANGUAGES.length - 1
                      ? "border-b border-[#EEF1F5]"
                      : ""
                  }
                  ${
                    active
                      ? "bg-[#F2F7FF]"
                      : "hover:bg-[#FAFCFF]"
                  }
                `}
              >

                {/* LANGUAGE NAME */}

                <span
                  className={`
                    flex-1
                    text-[12px]
                    ${
                      active
                        ? "font-bold text-[#1769F5]"
                        : "font-medium text-[#10265B]"
                    }
                  `}
                >
                  {language}
                </span>

                {/* SELECTED */}

                {active && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1769F5]">

                    <Check
                      size={14}
                      strokeWidth={2.5}
                      className="text-white"
                    />

                  </div>
                )}

              </button>
            );
          })}

        </div>

        {/* ===================================================
            VALIDATION ERROR
        ==================================================== */}

        {error && (
          <div className="mt-3 rounded-lg border border-[#FECACA] bg-[#FFF2F2] px-3 py-2">

            <p className="text-[10px] font-medium text-[#D92D20]">
              {error}
            </p>

          </div>
        )}

        {/* ===================================================
            SAVE / CANCEL
        ==================================================== */}

        <div className="mt-5 grid grid-cols-2 gap-2">

          <button
            type="button"
            onClick={handleCancel}
            disabled={saved}
            className="h-11 rounded-lg border border-[#DCE1E8] text-[12px] font-semibold text-[#52627A] transition hover:bg-[#F8FAFD] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className="h-11 rounded-lg bg-[#1769F5] text-[12px] font-semibold text-white transition hover:bg-[#0F5BDE] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saved ? "Saved" : "Save Language"}
          </button>

        </div>

        {/* ===================================================
            SUCCESS
        ==================================================== */}

        {saved && (
          <div className="mt-3 rounded-lg border border-[#B7E4C7] bg-[#EAF7EF] px-4 py-3 text-center">

            <p className="text-[10px] font-semibold text-[#159447]">
              Language preference saved successfully.
            </p>

          </div>
        )}

        {/* ===================================================
            BACK TO ACCOUNT
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