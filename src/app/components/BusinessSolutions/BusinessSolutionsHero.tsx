"use client";

import Link from "next/link";
import {
  Users,
  Package,
  Award,
  FileCheck,
  Truck,
  ArrowRight,
  FileText,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  contentApi,
  type ContentItem,
} from "@/app/api/services";

const STAT_ICONS = [
  Users,
  Package,
  Award,
  FileCheck,
  Truck,
] as const;

const PERK_ICONS = [
  Package,
  Award,
  Truck,
  Users,
] as const;

export default function BusinessSolutionsHero() {
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [rawStats, setRawStats] = useState<
    { value: string; label: string }[]
  >([]);
  const [rawPerks, setRawPerks] = useState<
    { title: string; desc: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setLoadError("");
      try {
        const [statsRes, perksRes] =
          await Promise.all([
            contentApi.list("bs_hero_stats"),
            contentApi.list("bs_hero_perks"),
          ]);
        const statsData = statsRes.data;
        const perksData = perksRes.data;
        const statRows: ContentItem[] = Array.isArray(statsData) ? statsData : Array.isArray((statsData as any)?.items) ? (statsData as any).items : [];
        const perkRows: ContentItem[] = Array.isArray(perksData) ? perksData : Array.isArray((perksData as any)?.items) ? (perksData as any).items : [];
        const mappedStats = statRows.map((row) => ({
          value: row.title ?? "",
          label: row.description ?? "",
        }));
        const mappedPerks = perkRows.map((row) => ({
          title: row.title ?? "",
          desc: row.description ?? "",
        }));
        if (mounted) {
          setRawStats(mappedStats);
          setRawPerks(mappedPerks);
        }
      } catch {
        if (mounted) {
          setLoadError(
            "Failed to load business highlights.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------------------------
  // VALIDATE HERO STATS
  // ---------------------------------------------
  const validStats = useMemo(() => {
    if (!Array.isArray(rawStats)) {
      return [];
    }

    return rawStats.filter((stat) => {
      return (
        stat &&
        typeof stat === "object" &&
        typeof stat.label === "string" &&
        stat.label.trim().length > 0 &&
        typeof stat.value === "string" &&
        stat.value.trim().length > 0
      );
    });
  }, [rawStats]);

  // ---------------------------------------------
  // VALIDATE QUICK PERKS
  // ---------------------------------------------
  const validQuickPerks = useMemo(() => {
    if (!Array.isArray(rawPerks)) {
      return [];
    }

    return rawPerks.filter((perk) => {
      return (
        perk &&
        typeof perk === "object" &&
        typeof perk.title === "string" &&
        perk.title.trim().length > 0 &&
        typeof perk.desc === "string" &&
        perk.desc.trim().length > 0
      );
    });
  }, [rawPerks]);

  // ---------------------------------------------
  // REQUEST CUSTOM QUOTE
  // ---------------------------------------------
  const handleQuoteRequest = useCallback(() => {
    if (isQuoteLoading) {
      return;
    }

    setQuoteError("");

    try {
      setIsQuoteLoading(true);

      // Change this path if your actual quote page is different.
      window.location.href = "/contact?subject=Custom%20Quote";
    } catch (error) {
      console.error(
        "Failed to open custom quote page:",
        error
      );

      setQuoteError(
        "Unable to open the quote request. Please try again."
      );

      setIsQuoteLoading(false);
    }
  }, [isQuoteLoading]);

  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-[1fr_260px] rounded-card overflow-hidden"
      aria-label="Business Solutions"
    >
      {/* =====================================================
          MAIN HERO
      ====================================================== */}
      <div className="relative bg-paper">
        <div className="relative flex flex-col lg:flex-row items-stretch">
          {/* ---------------------------------------------
              HERO CONTENT
          --------------------------------------------- */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
            <h1 className="font-sora font-extrabold text-[26px] sm:text-[32px] leading-[1.15]">
              <span className="text-navy">
                Business Solutions{" "}
              </span>

              <br />

              <span className="text-green-deep">
                Built for Your Growth
              </span>
            </h1>

            <p className="text-[13px] text-ink-soft mt-3 leading-relaxed max-w-[420px]">
              End-to-end wholesale solutions to help your business save
              more, grow faster and operate smarter.
            </p>

            {/* ---------------------------------------------
                QUICK PERKS
            --------------------------------------------- */}
            {isLoading ? (
              <div
                className="text-[11px] text-ink-faint mt-6"
                role="status"
                aria-live="polite"
              >
                Loading benefits…
              </div>
            ) : loadError ? (
              <div
                className="text-[11px] text-red-500 mt-6"
                role="alert"
              >
                {loadError}
              </div>
            ) : (
              validQuickPerks.length > 0 && (
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 max-w-[440px]"
                  aria-label="Business solution benefits"
                >
                  {validQuickPerks.map((perk, i) => {
                    const Icon = PERK_ICONS[i];

                    // Prevent undefined icon rendering
                    if (!Icon) {
                      return null;
                    }

                    return (
                      <div
                        key={`${perk.title}-${i}`}
                      >
                        <span
                          className="
                            w-8 h-8
                            rounded-lg
                            bg-green/10
                            text-green-deep
                            flex
                            items-center
                            justify-center
                            mb-2
                          "
                          aria-hidden="true"
                        >
                          <Icon size={15} />
                        </span>

                        <div className="text-[11.5px] font-bold text-ink leading-tight">
                          {perk.title}
                        </div>

                        <div className="text-[10px] text-ink-soft leading-tight mt-0.5">
                          {perk.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ---------------------------------------------
                CTA BUTTONS
            --------------------------------------------- */}
            <div className="flex flex-wrap items-center gap-2.5 mt-7">
              {/* Explore Solutions */}
              <Link
                href="#solutions"
                aria-label="Explore business solutions"
                className="
                  flex items-center gap-2
                  bg-green
                  hover:bg-green-deep
                  transition-colors
                  text-white
                  text-[12.5px]
                  font-bold
                  px-5 py-3
                  rounded-lg
                "
              >
                Explore Solutions

                <ArrowRight
                  size={14}
                  aria-hidden="true"
                />
              </Link>

              {/* Custom Quote */}
              <button
                type="button"
                onClick={handleQuoteRequest}
                disabled={isQuoteLoading}
                aria-label="Request a custom quote"
                aria-busy={isQuoteLoading}
                className="
                  flex items-center gap-2
                  border border-line
                  text-ink
                  text-[12.5px]
                  font-bold
                  px-5 py-3
                  rounded-lg
                  hover:border-navy
                  hover:text-navy
                  transition-colors
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                <FileText
                  size={14}
                  aria-hidden="true"
                />

                {isQuoteLoading
                  ? "Opening..."
                  : "Request Custom Quote"}
              </button>
            </div>

            {/* ---------------------------------------------
                QUOTE ERROR
            --------------------------------------------- */}
            {quoteError && (
              <p
                role="alert"
                className="text-[10px] text-red-500 mt-2"
              >
                {quoteError}
              </p>
            )}
          </div>

          {/* ---------------------------------------------
              HERO IMAGE
          --------------------------------------------- */}
          <div
            className="flex-1 min-h-[220px] bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80)",
            }}
            role="img"
            aria-label="Business team collaborating"
          />
        </div>
      </div>

      {/* =====================================================
          STATS SIDEBAR
      ====================================================== */}
      <div
        className="bg-navy p-6 flex flex-col justify-center gap-5"
        aria-label="Business statistics"
      >
        {isLoading ? (
          <div
            className="text-[11px] text-white/50 text-center"
            role="status"
            aria-live="polite"
          >
            Loading statistics…
          </div>
        ) : loadError ? (
          <div
            className="text-[11px] text-red-300 text-center"
            role="alert"
          >
            {loadError}
          </div>
        ) : validStats.length > 0 ? (
          validStats.map((stat, i) => {
            const Icon = STAT_ICONS[i];

            // Prevent undefined icon rendering
            if (!Icon) {
              return null;
            }

            return (
              <div
                key={`${stat.label}-${i}`}
                className="flex items-center gap-3"
              >
                <span
                  className="
                    w-9 h-9
                    rounded-lg
                    bg-white/10
                    text-green
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </span>

                <div>
                  <div className="text-[15px] font-extrabold text-white leading-tight">
                    {stat.value}
                  </div>

                  <div className="text-[10.5px] text-white/60 leading-tight">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-[11px] text-white/50 text-center">
            Business statistics unavailable.
          </div>
        )}
      </div>
    </section>
  );
}
