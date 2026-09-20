// File: app/components/Dashboard/Hero.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PhoneCall, Grid2x2 } from "lucide-react";

/* ============================================================
   SLIDES — fallback static, live banners override when available
============================================================ */

const FALLBACK_SLIDES: { image: string; link: string; title?: string }[] = [
  {
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=80",
    link: "/offers",
  },
  {
    image: "https://images.unsplash.com/photo-1749244768351-2726dc23d26c?auto=format&fit=crop&w=1600&q=80",
    link: "/categories",
  },
  { image: "/Images/Hero.jpeg", link: "/categories" },
  {
    image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1600&q=80",
    link: "/offers",
  },
];

const SLIDE_INTERVAL = 5000;

type LiveSlide = { image: string; link: string; title: string; subtitle: string };

/* ============================================================
   VALIDATION
============================================================ */

function normalizeBannerSrc(src: string): string {
  const t = src.trim();
  if (!t) return "";
  // Old banner rows store http://192.168.31.9:5000/uploads/Banners/... — extract the
  // /uploads/... pathname so it goes through the Next.js /uploads proxy and the
  // API static files. Absolute external images (unsplash, etc.) keep their host.
  const low = t.toLowerCase();
  const idx = low.indexOf("/uploads/");
  if (idx >= 0 && /^(https?:)/i.test(t)) return t.slice(idx);
  return t;
}

function isValidImageSource(
  value: unknown
): value is string {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return false;
  }

  const source = normalizeBannerSrc(value.trim());

  return (
    source.startsWith("/") ||
    source.startsWith("https://") ||
    source.startsWith("http://")
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Hero() {
  const [liveSlides, setLiveSlides] = useState<LiveSlide[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { dealsApi } = await import("@/app/api/services");
        const res: any = await dealsApi.banners(5);
        const payload: any = res?.data ?? res;
        const items: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        const mapped: LiveSlide[] = items
          .map((r: any) => ({
            image: normalizeBannerSrc(String(r.imageUrl ?? r.image ?? "")),
            link: String(r.link ?? r.url ?? "").trim() || (r.productId ? `/product/${r.productId}` : "/offers"),
            title: String(r.title ?? "").trim(),
            subtitle: String(r.subtitle ?? r.description ?? "").trim(),
          }))
          .filter((s: LiveSlide) => s.image && isValidImageSource(s.image) && s.link);
        if (!cancelled && mapped.length > 0) setLiveSlides(mapped);
      } catch {}
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     SAFE SLIDES — live banners override fallback
  ========================================================== */

  const baseSlides = liveSlides ?? FALLBACK_SLIDES;
  const validSlides = baseSlides
    .map((s) => (typeof s === "string" ? { image: s, link: "/offers", title: "", subtitle: "" } : s) as LiveSlide)
    .map((s) => ({ ...s, image: normalizeBannerSrc(s.image) }))
    .filter((s) => isValidImageSource(s.image));

  /* ==========================================================
     SLIDE STATE
  ========================================================== */

  const [slide, setSlide] = useState(0);

  /* ==========================================================
     AUTO SLIDE
  ========================================================== */

  useEffect(() => {
    if (validSlides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setSlide((current) => {
        const next =
          current + 1;

        return next >= validSlides.length
          ? 0
          : next;
      });
    }, SLIDE_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [validSlides.length]);

  /* ==========================================================
     SAFETY CHECK
  ========================================================== */

  const safeSlide =
    slide >= 0 &&
    slide < validSlides.length
      ? slide
      : 0;

  /* ==========================================================
     EMPTY IMAGE FALLBACK
  ========================================================== */

  if (validSlides.length === 0) {
    return (
      <section
        aria-label="Aanzara wholesale marketplace"
        className="
          relative
          h-[340px]
          overflow-hidden
          rounded-card
          bg-navy
          sm:h-[420px]
        "
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #2B57FF 0%, transparent 70%)" }}
        />

        <div
          className="
            relative
            flex
            h-full
            max-w-[600px]
            flex-col
            justify-center
            px-6
            py-8
            sm:px-10
          "
        >
          <span
            className="
              mb-4
              inline-flex
              w-fit
              items-center
              gap-1.5
              rounded-pill
              bg-white/10
              px-3
              py-1.5
              text-[10.5px]
              font-bold
              tracking-wide
              text-white
              backdrop-blur-sm
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            B2B & D2C Wholesale Marketplace
          </span>

          <h1
            className="
              font-sora
              text-[28px]
              font-extrabold
              leading-[1.12]
              text-white
              sm:text-[38px]
            "
          >
            Your Complete FMCG Supply Partner
          </h1>

          <p
            className="
              mt-3
              max-w-[460px]
              text-[13.5px]
              leading-relaxed
              text-white/75
              sm:text-[14.5px]
            "
          >
            Direct manufacturer sourcing, unified B2B
            bulk ordering, and reliable door-step
            logistics. Empowering retail stores,
            restaurants, and corporate environments.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="
                flex
                items-center
                gap-2
                rounded-pill
                bg-blue
                px-6
                py-3.5
                text-[13px]
                font-bold
                text-white
                shadow-pop
                transition-all
                hover:bg-blue-deep
                hover:-translate-y-0.5
                focus:outline-none
                focus:ring-2
                focus:ring-blue/40
                focus:ring-offset-2
                focus:ring-offset-navy
              "
            >
              <PhoneCall
                size={14}
                aria-hidden="true"
              />
              Bulk Enquiry
            </Link>

            <Link
              href="/categories"
              className="
                glass-navy
                flex
                items-center
                gap-2
                rounded-pill
                px-6
                py-3.5
                text-[13px]
                font-bold
                text-white
                transition-all
                hover:bg-white/10
                focus:outline-none
                focus:ring-2
                focus:ring-white/50
                focus:ring-offset-2
                focus:ring-offset-navy
              "
            >
              <Grid2x2
                size={14}
                aria-hidden="true"
              />
              Explore Categories
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ==========================================================
     MAIN RENDER
  ========================================================== */

  return (
    <section
      aria-label="Aanzara wholesale marketplace hero"
      className="
        relative
        h-[340px]
        overflow-hidden
        rounded-card
        sm:h-[420px]
      "
    >
      {/* ======================================================
           SLIDES — each live banner is a clickable Link to its offer/product
      ====================================================== */}

      {validSlides.map((slide, index) => {
        const isActive =
          safeSlide === index;

        return (
          <Link
            key={`${slide.image}-${index}`}
            href={slide.link}
            aria-hidden={!isActive}
            tabIndex={isActive ? 0 : -1}
            aria-label={slide.title ? `View ${slide.title}` : `View offer ${index + 1}`}
            className={`
              absolute
              inset-0
              overflow-hidden
              transition-opacity
              duration-[1200ms]
              ease-out
              ${isActive ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
          >
            <div
              className={`
                absolute
                inset-0
                bg-cover
                bg-center
                ${isActive ? "animate-[azHeroZoom_7s_ease-out_forwards]" : ""}
              `}
              style={{
                backgroundImage: `url("${slide.image}")`,
              }}
            />
          </Link>
        );
      })}

      {/* ======================================================
           OVERLAY — pointer-events-none so banner Link stays clickable
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, #0A1F44E6 0%, #0A1F44B3 38%, #0A1F4433 75%, transparent 100%)",
        }}
      />

      {/* ======================================================
           HERO CONTENT — title/subtitle from live banner when available
      ====================================================== */}

      {(() => {
        const active = validSlides[safeSlide] as LiveSlide | undefined;
        const hasLiveTitle = Boolean(active?.title?.trim());
        const hasLiveSubtitle = Boolean(active?.subtitle?.trim());
        const ctaHref = active?.link ?? "/categories";
        const ctaLabel = liveSlides ? "Shop Now" : "Explore Categories";
        return (
          <div
            className="
              relative
              flex
              h-full
              max-w-[600px]
              flex-col
              justify-center
              px-6
              py-8
              sm:px-10
              az-fade-up
            "
          >
            {/* BADGE */}

            <span
              className="
                mb-4
                inline-flex
                w-fit
                items-center
                gap-1.5
                rounded-pill
                bg-white/10
                px-3
                py-1.5
                text-[10.5px]
                font-bold
                tracking-wide
                text-white
                backdrop-blur-sm
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              {hasLiveTitle ? "Special Offer" : "B2B & D2C Wholesale Marketplace"}
            </span>

            {/* TITLE */}

            <h1
              className="
                font-sora
                text-[28px]
                font-extrabold
                leading-[1.12]
                text-white
                sm:text-[38px]
              "
            >
              {hasLiveTitle ? active!.title : "Your Complete FMCG Supply Partner"}
            </h1>

            {/* DESCRIPTION */}

            <p
              className="
                mt-3
                max-w-[460px]
                text-[13.5px]
                leading-relaxed
                text-white/75
                sm:text-[14.5px]
              "
            >
              {hasLiveSubtitle
                ? active!.subtitle
                : "Direct manufacturer sourcing, unified B2B bulk ordering, and reliable door-step logistics. Empowering retail stores, restaurants, and corporate environments."}
            </p>

            {/* ====================================================
                ACTIONS — first CTA follows banner link (offer/product buy)
            ==================================================== */}

            <div
              className="
                mt-6
                flex
                flex-wrap
                items-center
                gap-3
              "
            >
              {/* BANNER CTA — dynamic: offer page or product buy */}
              <Link
                href={ctaHref}
                aria-label={hasLiveTitle ? `Shop ${active!.title}` : "Explore product categories"}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-pill
                  bg-blue
                  px-6
                  py-3.5
                  text-[13px]
                  font-bold
                  text-white
                  shadow-pop
                  transition-all
                  hover:bg-blue-deep
                  hover:-translate-y-0.5
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue/40
                  focus:ring-offset-2
                  focus:ring-offset-navy
                "
              >
                <Grid2x2 size={14} aria-hidden="true" />
                {ctaLabel}
              </Link>

              <Link
                href="/contact"
                aria-label="Go to contact page for bulk enquiry"
                className="
                  glass-navy
                  flex
                  items-center
                  gap-2
                  rounded-pill
                  px-6
                  py-3.5
                  text-[13px]
                  font-bold
                  text-white
                  transition-all
                  hover:bg-white/10
                  focus:outline-none
                  focus:ring-2
                  focus:ring-white/50
                  focus:ring-offset-2
                  focus:ring-offset-navy
                "
              >
                <PhoneCall size={14} aria-hidden="true" />
                Bulk Enquiry
              </Link>
            </div>
          </div>
        );
      })()}

      {/* ======================================================
          SLIDE CONTROLS
      ====================================================== */}

      {validSlides.length > 1 && (
        <div
          className="
            glass-navy
            absolute
            bottom-4
            right-4
            flex
            items-center
            gap-1.5
            rounded-pill
            px-2.5
            py-2
          "
          role="tablist"
          aria-label="Hero slides"
        >
          {validSlides.map((_, index) => {
            const isActive =
              safeSlide === index;

            return (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show slide ${
                  index + 1
                }`}
                onClick={() =>
                  setSlide(index)
                }
                className={`
                  h-1.5
                  rounded-pill
                  transition-all
                  focus:outline-none
                  focus:ring-2
                  focus:ring-white/60
                  focus:ring-offset-1
                  focus:ring-offset-transparent
                  ${
                    isActive
                      ? "w-5 bg-green"
                      : "w-1.5 bg-white/50 hover:bg-white/80"
                  }
                `}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}