"use client";

import Image from "next/image";
import {
  Users,
  Package,
  Award,
  FileCheck,
  Truck,
  ArrowRight,
  FileText,
  TrendingUp,
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

  // API data from the new Aanzara IT repository
  const [rawStats, setRawStats] = useState<
    { value: string; label: string }[]
  >([]);

  const [rawPerks, setRawPerks] = useState<
    { title: string; desc: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ---------------------------------------------
  // LOAD HERO DATA FROM API
  // ---------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [statsRes, perksRes] = await Promise.all([
          contentApi.list("bs_hero_stats"),
          contentApi.list("bs_hero_perks"),
        ]);

        const statsData = statsRes.data;
        const perksData = perksRes.data;

        const statRows: ContentItem[] = Array.isArray(statsData)
          ? statsData
          : Array.isArray((statsData as any)?.items)
            ? (statsData as any).items
            : [];

        const perkRows: ContentItem[] = Array.isArray(perksData)
          ? perksData
          : Array.isArray((perksData as any)?.items)
            ? (perksData as any).items
            : [];

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
            "Failed to load business highlights."
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

    return rawStats
      .filter((stat) => {
        return (
          stat &&
          typeof stat === "object" &&
          typeof stat.label === "string" &&
          stat.label.trim().length > 0 &&
          typeof stat.value === "string" &&
          stat.value.trim().length > 0
        );
      })
      .slice(0, 4);
  }, [rawStats]);

  // ---------------------------------------------
  // VALIDATE QUICK PERKS
  // ---------------------------------------------
  const validQuickPerks = useMemo(() => {
    if (!Array.isArray(rawPerks)) {
      return [];
    }

    return rawPerks
      .filter((perk) => {
        return (
          perk &&
          typeof perk === "object" &&
          typeof perk.title === "string" &&
          perk.title.trim().length > 0 &&
          typeof perk.desc === "string" &&
          perk.desc.trim().length > 0
        );
      })
      .slice(0, 4);
  }, [rawPerks]);

  // ---------------------------------------------
  // RESET QUOTE BUTTON
  // ---------------------------------------------
  useEffect(() => {
    const resetQuoteButton = () => {
      setIsQuoteLoading(false);
      setQuoteError("");
    };

    window.addEventListener("pageshow", resetQuoteButton);
    window.addEventListener("popstate", resetQuoteButton);

    return () => {
      window.removeEventListener("pageshow", resetQuoteButton);
      window.removeEventListener("popstate", resetQuoteButton);
    };
  }, []);

  // ---------------------------------------------
  // REQUEST CUSTOM QUOTE
  // ---------------------------------------------
  const handleQuoteRequest = useCallback(() => {
    if (isQuoteLoading) {
      return;
    }

    setQuoteError("");
    setIsQuoteLoading(true);

    try {
      window.location.href =
        "/contact?topic=Business%20Solutions%20Enquiry";
    } catch (error) {
      console.error(
        "Failed to open quote page:",
        error
      );

      setQuoteError(
        "Unable to open the quote request. Please try again."
      );

      setIsQuoteLoading(false);
    }
  }, [isQuoteLoading]);

  // ---------------------------------------------
  // EXPLORE SOLUTIONS
  // ---------------------------------------------
  const handleExploreSolutions = useCallback(() => {
    const solutionsSection =
      document.getElementById("solutions");

    if (!solutionsSection) {
      return;
    }

    solutionsSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.history.replaceState(
      null,
      "",
      "#solutions"
    );
  }, []);

  return (
    <section
      className="relative overflow-hidden rounded-card border border-line"
      aria-label="Business Solutions"
    >
      {/* ================= BACKGROUND ================= */}
      <div className="absolute inset-0">
        <Image
          src="/images/Business%20Solutions/Businesssolutions.png"
          alt=""
          fill
          priority
          className="object-cover"
          style={{
            objectPosition: "70% 65%",
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(9,24,46,0.92) 0%, rgba(9,24,46,0.78) 28%, rgba(9,24,46,0.42) 48%, rgba(9,24,46,0.14) 66%, rgba(9,24,46,0.14) 100%)",
          }}
          aria-hidden="true"
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(9,24,46,0.3) 0%, rgba(9,24,46,0) 18%, rgba(9,24,46,0) 78%, rgba(9,24,46,0.3) 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* ================= HERO CONTENT ================= */}
      <div
        className="
          relative
          px-6
          sm:px-10
          py-8
          sm:py-10
          flex
          flex-col
          lg:flex-row
          items-center
          gap-7
        "
      >
        {/* ================= LEFT CONTENT ================= */}
        <div className="flex-1 max-w-[440px]">
          {/* Badge */}
          <span className="inline-flex w-fit items-center gap-1.5 bg-white/15 text-white text-[10.5px] font-bold tracking-wide px-2.5 py-1 rounded-md mb-3 backdrop-blur-sm">
            FOR BUSINESSES
          </span>

          {/* Heading */}
          <h1 className="font-sora font-extrabold text-white text-[27px] sm:text-[34px] leading-[1.15]">
            Business Solutions Built for Your Growth
          </h1>

          {/* Description */}
          <p className="text-[13px] text-white/80 mt-2.5 leading-relaxed">
            End-to-end wholesale solutions to help your business save more,
            grow faster and operate smarter.
          </p>

          {/* ================= BUTTONS ================= */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            {/* Explore Solutions */}
            <button
              type="button"
              onClick={handleExploreSolutions}
              aria-label="Explore business solutions"
              className="flex items-center gap-2 bg-green hover:bg-green-deep transition-colors text-white text-[12.5px] font-bold px-5 py-3 rounded-lg"
            >
              Explore Solutions

              <ArrowRight
                size={14}
                aria-hidden="true"
              />
            </button>

            {/* Request Custom Quote */}
            <button
              type="button"
              onClick={handleQuoteRequest}
              disabled={isQuoteLoading}
              aria-label="Request a custom quote"
              aria-busy={isQuoteLoading}
              className="flex items-center gap-2 border border-white/30 text-white text-[12.5px] font-bold px-5 py-3 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

          {/* Quote error */}
          {quoteError && (
            <p
              role="alert"
              className="text-[10px] text-red-300 mt-2"
            >
              {quoteError}
            </p>
          )}

          {/* ================= QUICK PERKS ================= */}
          {isLoading ? (
            <div
              className="text-[10px] text-white/60 mt-5"
              role="status"
              aria-live="polite"
            >
              Loading benefits…
            </div>
          ) : loadError ? (
            <div
              className="text-[10px] text-red-300 mt-5"
              role="alert"
            >
              {loadError}
            </div>
          ) : (
            validQuickPerks.length > 0 && (
              <div
                className="
                  grid
                  grid-cols-2
                  gap-x-6
                  gap-y-2.5
                  mt-5
                "
                aria-label="Business solution benefits"
              >
                {validQuickPerks.map((perk, i) => {
                  const Icon = PERK_ICONS[i];

                  if (!Icon) {
                    return null;
                  }

                  return (
                    <div
                      key={`${perk.title}-${i}`}
                      className="flex items-start gap-2"
                    >
                      <Icon
                        size={15}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-green-300"
                        aria-hidden="true"
                      />

                      <div className="min-w-0">
                        <p className="text-[10.5px] font-bold text-white leading-tight">
                          {perk.title}
                        </p>

                        <p className="text-[8px] text-white/60 leading-tight mt-0.5">
                          {perk.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* ================= RIGHT DASHBOARD CARD ================= */}
        <div className="flex-1 w-full max-w-[440px]">
          <div className="rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40 overflow-hidden">
            {/* Browser Header */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-line bg-white">
              <span className="w-2 h-2 rounded-full bg-red-300" />
              <span className="w-2 h-2 rounded-full bg-amber-300" />
              <span className="w-2 h-2 rounded-full bg-green/60" />

              <span className="ml-3 text-[9.5px] text-ink-soft">
                partners.aanzara.com
              </span>
            </div>

            {/* Dashboard Content */}
            <div className="p-4 bg-white">
              {/* Dashboard Heading */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-navy">
                  Business Growth
                </p>

                <span className="flex items-center gap-1 text-[10px] font-bold text-green-deep">
                  <TrendingUp
                    size={12}
                    aria-hidden="true"
                  />

                  +18.4%
                </span>
              </div>

              {/* Growth Chart */}
              <div className="flex items-end gap-1.5 h-14 mb-4">
                {[40, 65, 50, 80, 60, 95, 75].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md"
                      style={{
                        height: `${h}%`,
                        background:
                          i === 5
                            ? "linear-gradient(180deg, #2E8B57, #1F5FBF)"
                            : "#DCE2EE",
                      }}
                      aria-hidden="true"
                    />
                  )
                )}
              </div>

              {/* Statistics */}
              {isLoading ? (
                <div
                  className="text-[10px] text-ink-soft text-center"
                  role="status"
                  aria-live="polite"
                >
                  Loading statistics…
                </div>
              ) : loadError ? (
                <div
                  className="text-[10px] text-red-500 text-center"
                  role="alert"
                >
                  {loadError}
                </div>
              ) : validStats.length > 0 ? (
                <div
                  className="grid grid-cols-2 gap-2"
                  aria-label="Business statistics"
                >
                  {validStats.map((stat, i) => {
                    const Icon = STAT_ICONS[i];

                    if (!Icon) {
                      return null;
                    }

                    return (
                      <div
                        key={`${stat.label}-${i}`}
                        className="bg-white border border-line rounded-lg p-2 flex items-center gap-2"
                      >
                        <span className="w-7 h-7 rounded-md bg-green/10 text-green-deep flex items-center justify-center shrink-0">
                          <Icon
                            size={13}
                            aria-hidden="true"
                          />
                        </span>

                        <div className="leading-tight">
                          <div className="text-[12px] font-extrabold text-navy">
                            {stat.value}
                          </div>

                          <div className="text-[8.5px] text-ink-soft">
                            {stat.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[10px] text-ink-soft text-center">
                  Business statistics unavailable.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}