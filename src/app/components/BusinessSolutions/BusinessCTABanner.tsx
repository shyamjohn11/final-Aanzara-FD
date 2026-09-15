"use client";

import {
  ArrowRight,
  Clock,
  Truck,
  FileText,
  Phone,
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

const ICONS = [Clock, Truck, FileText] as const;

export default function BusinessCTABanner() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ctaPerks, setCtaPerks] = useState<string[]>(
    [],
  );
  const [ctaPhone, setCtaPhone] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setLoadError("");
      try {
        const [perksRes, contactRes] =
          await Promise.all([
            contentApi.list("bs_cta_perks"),
            contentApi.list("bs_cta_contact"),
          ]);
        const perksData = perksRes.data;
        const contactData = contactRes.data;
        const perkRows: ContentItem[] = Array.isArray(perksData) ? perksData : Array.isArray((perksData as any)?.items) ? (perksData as any).items : [];
        const contactRows: ContentItem[] = Array.isArray(contactData) ? contactData : Array.isArray((contactData as any)?.items) ? (contactData as any).items : [];
        const CTA_PERKS: string[] = perkRows.map(
          (row) => row.title ?? "",
        );
        const CTA_PHONE: string =
          contactRows[0]?.title ?? "";
        if (mounted) {
          setCtaPerks(CTA_PERKS);
          setCtaPhone(CTA_PHONE);
        }
      } catch {
        if (mounted) {
          setLoadError(
            "Failed to load contact information.",
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

  // -----------------------------
  // VALIDATION
  // -----------------------------
  const validatedPerks: string[] = useMemo(() => {
    if (!Array.isArray(ctaPerks)) {
      return [];
    }

    return ctaPerks.filter(
      (perk): perk is string =>
        typeof perk === "string" && perk.trim().length > 0
    );
  }, [ctaPerks]);

  const validatedPhone: string = useMemo(() => {
    if (typeof ctaPhone !== "string") {
      return "";
    }

    return ctaPhone.trim();
  }, [ctaPhone]);

  // Remove everything except numbers and +
  const phoneHref = useMemo(() => {
    if (!validatedPhone) {
      return "";
    }

    const cleaned = validatedPhone.replace(/[^\d+]/g, "");

    if (!cleaned || cleaned.replace(/\D/g, "").length < 7) {
      return "";
    }

    return `tel:${cleaned}`;
  }, [validatedPhone]);

  // -----------------------------
  // REQUEST QUOTE HANDLER
  // -----------------------------
  const handleQuoteRequest = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setError("");

    try {
      setIsSubmitting(true);

      // Change this URL to your actual quote/contact page.
      window.location.href = "/contact?subject=Custom%20Quote";
    } catch (err) {
      console.error("Quote request navigation failed:", err);
      setError("Unable to open the quote request. Please try again.");
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  return (
    <section
      className="relative rounded-card overflow-hidden"
      aria-label="Business solutions call to action"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80)",
        }}
        aria-hidden="true"
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-navy/92"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6 px-6 sm:px-9 py-8">
        {/* --------------------------------
            LEFT CONTENT
        -------------------------------- */}
        <div className="max-w-[380px] text-center lg:text-left">
          <h2 className="font-sora font-bold text-[19px] sm:text-[21px] leading-snug">
            <span className="text-white">
              Ready to Take Your Business{" "}
            </span>

            <span className="text-green">
              to the Next Level?
            </span>
          </h2>

          <p className="text-[12px] text-white/65 mt-2 leading-relaxed">
            Partner with Aanzara and unlock the best wholesale prices,
            quality products and reliable service.
          </p>

          {isLoading ? (
            <p
              className="text-[10px] text-white/50 mt-2"
              role="status"
              aria-live="polite"
            >
              Loading contact information…
            </p>
          ) : (
            loadError && (
              <p
                role="alert"
                className="text-[10px] text-red-300 mt-2"
              >
                {loadError}
              </p>
            )
          )}
        </div>

        {/* --------------------------------
            PERKS
        -------------------------------- */}
        {validatedPerks.length > 0 && (
          <div
            className="flex items-center gap-6 shrink-0"
            aria-label="Business benefits"
          >
            {validatedPerks.map((perk, i) => {
              const Icon = ICONS[i];

              // If more perks exist than available icons,
              // skip them instead of rendering an invalid icon.
              if (!Icon) {
                return null;
              }

              return (
                <div
                  key={`${perk}-${i}`}
                  className="text-center hidden sm:block"
                >
                  <Icon
                    size={20}
                    className="text-green mx-auto mb-1.5"
                    aria-hidden="true"
                  />

                  <div className="text-[10.5px] font-semibold text-white/80 leading-tight max-w-[80px]">
                    {perk}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --------------------------------
            CTA
        -------------------------------- */}
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleQuoteRequest}
            disabled={isSubmitting}
            aria-label="Request a custom business quote"
            aria-busy={isSubmitting}
            className="
              flex items-center gap-2
              bg-white hover:bg-paper
              disabled:opacity-60
              disabled:cursor-not-allowed
              transition-colors
              text-ink text-[12.5px]
              font-bold px-5 py-3
              rounded-lg
            "
          >
            {isSubmitting ? "Opening..." : "Request Custom Quote"}

            {!isSubmitting && (
              <ArrowRight
                size={14}
                aria-hidden="true"
              />
            )}
          </button>

          {/* Error Message */}
          {error && (
            <p
              role="alert"
              className="text-[10px] text-red-300 text-center max-w-[220px]"
            >
              {error}
            </p>
          )}

          {/* Call Text */}
          <div className="flex items-center gap-1.5 text-[12px] text-white/70">
            <span>or Call Us Now</span>
          </div>

          {/* Valid Phone */}
          {phoneHref ? (
            <a
              href={phoneHref}
              aria-label={`Call us at ${validatedPhone}`}
              className="
                flex items-center gap-1.5
                text-[14px]
                font-bold
                text-green
                hover:opacity-80
                transition-opacity
              "
            >
              <Phone
                size={14}
                aria-hidden="true"
              />

              <span>{validatedPhone}</span>
            </a>
          ) : (
            <div
              className="flex items-center gap-1.5 text-[12px] text-white/50"
              role="status"
            >
              <Phone
                size={14}
                aria-hidden="true"
              />
              <span>Contact number unavailable</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
