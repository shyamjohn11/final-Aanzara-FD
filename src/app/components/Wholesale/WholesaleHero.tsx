"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowRight,
  ShoppingCart,
  FileText,
  IndianRupee,
  Package,
  Truck,
  Headset,
  ShieldCheck,
  Receipt,
  Percent,
} from "lucide-react";

import {
  contentApi,
  type ContentItem,
} from "@/app/api/services";

/* =========================================================
   TYPES
========================================================= */

type WholesalePerk = {
  title: string;
  desc: string;
};

type WholesaleHeroBar = {
  title: string;
  value: string;
};

/* =========================================================
   ICONS
========================================================= */

const PERK_ICONS = [
  IndianRupee,
  Package,
  Truck,
  Headset,
];

const BAR_ICONS = [
  IndianRupee,
  Percent,
  ShieldCheck,
  Receipt,
];

/* =========================================================
   HELPERS
========================================================= */

function isValidText(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function mapPerkRow(
  row: ContentItem,
): WholesalePerk {
  const title =
    typeof row.title === "string"
      ? row.title.trim()
      : "";

  const extraDesc =
    (row.extra as any)?.desc;

  const desc =
    typeof row.description === "string" &&
    row.description.trim().length > 0
      ? row.description.trim()
      : typeof extraDesc === "string"
        ? extraDesc.trim()
        : "";

  return {
    title,
    desc,
  };
}

function mapBarRow(
  row: ContentItem,
): WholesaleHeroBar {
  const title =
    typeof row.title === "string"
      ? row.title.trim()
      : "";

  const extraValue =
    (row.extra as any)?.value ??
    (row.extra as any)?.desc;

  const value =
    typeof row.description === "string" &&
    row.description.trim().length > 0
      ? row.description.trim()
      : typeof extraValue === "string"
        ? extraValue.trim()
        : "";

  return {
    title,
    value,
  };
}

function unwrapRows(
  data: unknown,
): ContentItem[] {
  return Array.isArray(data)
    ? (data as ContentItem[])
    : Array.isArray((data as any)?.items)
      ? ((data as any).items as ContentItem[])
      : [];
}

/* =========================================================
   COMPONENT
========================================================= */

export default function WholesaleHero() {
  const [perks, setPerks] = useState<
    WholesalePerk[]
  >([]);

  const [bar, setBar] = useState<
    WholesaleHeroBar[]
  >([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string>("");

  /* =======================================================
     LOAD WHOLESALE HERO DATA
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [perksRes, barRes] =
          await Promise.all([
            contentApi.list("ws_hero_perks"),
            contentApi.list("ws_hero_bar"),
          ]);

        const perkRows = unwrapRows(
          perksRes.data as unknown,
        );

        const barRows = unwrapRows(
          barRes.data as unknown,
        );

        if (!cancelled) {
          setPerks(
            perkRows
              .map(mapPerkRow)
              .filter((p) =>
                isValidText(p.title),
              ),
          );

          setBar(
            barRows
              .map(mapBarRow)
              .filter((b) =>
                isValidText(b.title),
              ),
          );
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to load wholesale highlights.",
          );

          setPerks([]);
          setBar([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     SHOP WHOLESALE
  ======================================================= */

  const handleShopWholesale = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    e.preventDefault();

    document
      .getElementById("wholesale-deals")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    window.history.replaceState(
      null,
      "",
      "#wholesale-deals",
    );
  };

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[20px]
        border
        border-slate-200
        shadow-[0_12px_40px_rgba(15,23,42,0.08)]
      "
      aria-labelledby="wholesale-hero-title"
    >
      {/* =====================================================
          HERO MAIN AREA
      ===================================================== */}

      <div
        className="
          relative
          isolate
          flex
          min-h-[420px]
          flex-col
          overflow-hidden
          bg-[#F6F4EE]
          lg:h-[300px]
          lg:flex-row
        "
      >
        {/* Dot-grid texture — reads as a warehouse pegboard, not graph paper */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(15,23,42,0.09) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
          aria-hidden="true"
        />

        {/* Soft ambient glows for depth — anchored to the two focal points */}
        <div
          className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-green/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#0B4DA2]/15 blur-3xl"
          aria-hidden="true"
        />

        {/* Vignette so the dot-grid fades rather than cutting off hard */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#F6F4EE_92%)]"
          aria-hidden="true"
        />

        {/* ===================================================
            LEFT — COPY
        =================================================== */}

        <div
          className="
            relative
            z-10
            flex
            w-full
            flex-col
            justify-center
            gap-4
            px-6
            py-8
            sm:px-9
            lg:w-[54%]
            lg:px-11
            lg:py-0
          "
        >
          {/* Badge */}

          <div
            className="
              w-fit
              rounded-full
              border
              border-[#B4711C]/25
              bg-white
              px-3
              py-1.5
              shadow-[0_2px_8px_rgba(180,113,28,0.12)]
            "
          >
            <span
              className="
                text-[10px]
                font-bold
                text-[#B4711C]
              "
            >
              AANZARA Wholesale
            </span>
          </div>

          {/* Heading */}

          <h1
            id="wholesale-hero-title"
            className="
              font-sora
              text-[31px]
              font-extrabold
              leading-[1.03]
              tracking-[-0.03em]
              text-navy
              sm:text-[36px]
              lg:text-[39px]
            "
          >
            Stock smarter.{" "}

            <span className="text-green">
              Save more.
            </span>{" "}

            Grow faster.
          </h1>

          {/* Description */}

          <p
            className="
              max-w-[420px]
              text-[12.5px]
              leading-[1.55]
              text-slate-600
              sm:text-[13px]
            "
          >
            Source FMCG products in bulk with
            competitive wholesale pricing,
            dependable delivery and
            business-ready services.
          </p>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2.5
            "
          >
            {/* SHOP WHOLESALE */}

            <Link
              href="#wholesale-deals"
              onClick={handleShopWholesale}
              className="
                group
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-green
                px-4
                py-2.5
                text-[11.5px]
                font-extrabold
                !text-white
                shadow-[0_7px_18px_rgba(22,163,74,0.22)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-green-deep
              "
            >
              <ShoppingCart
                size={14}
                aria-hidden="true"
              />

              <span>
                Shop Wholesale
              </span>

              <ArrowRight
                size={13}
                className="
                  transition-transform
                  duration-200
                  group-hover:translate-x-1
                "
                aria-hidden="true"
              />
            </Link>

            {/* BULK QUOTE */}

            <button
              type="button"
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-2.5
                text-[11.5px]
                font-extrabold
                text-navy
                shadow-[0_3px_12px_rgba(15,23,42,0.05)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:border-green/30
                hover:bg-green/5
              "
            >
              <FileText
                size={14}
                aria-hidden="true"
              />

              Request Bulk Quote
            </button>
          </div>

          {/* =================================================
              HERO PERKS
          ================================================= */}

          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="
                text-[11px]
                text-slate-500
              "
            >
              Loading highlights…
            </div>
          ) : error && perks.length === 0 ? (
            <div
              role="alert"
              className="
                text-[11px]
                text-slate-500
              "
            >
              {error}
            </div>
          ) : perks.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="
                text-[11px]
                text-slate-500
              "
            >
              Highlights are currently unavailable.
            </div>
          ) : (
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              {perks
                .slice(0, 4)
                .map((perk, index) => {
                  const Icon =
                    PERK_ICONS[index];

                  if (!Icon) {
                    return null;
                  }

                  const isAlt = index % 2 === 1;

                  return (
                    <div
                      key={`${perk.title}-${index}`}
                      className="
                        flex
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        border-slate-200/80
                        bg-white/80
                        py-1
                        pl-1
                        pr-3
                        shadow-[0_2px_8px_rgba(15,23,42,0.06)]
                        backdrop-blur-sm
                      "
                    >
                      <span
                        className={`
                          flex
                          h-[19px]
                          w-[19px]
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          ${isAlt ? "bg-[#0B4DA2]/10 text-[#0B4DA2]" : "bg-green/10 text-green"}
                        `}
                      >
                        <Icon
                          size={11}
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      </span>

                      <span
                        className="
                          text-[9.5px]
                          font-bold
                          text-slate-600
                        "
                      >
                        {perk.title}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ===================================================
            RIGHT — IMAGE FRAME
        =================================================== */}

        <div
          className="
            relative
            z-10
            flex
            w-full
            items-center
            justify-center
            px-5
            pb-6
            pt-2
            lg:w-[46%]
            lg:px-6
            lg:py-5
          "
        >
          {/* Glow behind the frame — light spilling off the crate art */}
          <div
            className="
              pointer-events-none
              absolute
              inset-x-8
              inset-y-4
              rounded-[28px]
              bg-gradient-to-br
              from-green/25
              via-[#0B4DA2]/20
              to-transparent
              blur-2xl
              lg:inset-x-10
            "
            aria-hidden="true"
          />

          <div
            className="
              relative
              h-full
              w-full
              overflow-hidden
              rounded-2xl
              border-[5px]
              border-navy
              bg-[#0B4DA2]
              shadow-[0_20px_45px_rgba(11,25,45,0.28)]
              ring-1
              ring-white/10
            "
          >
            {/* Corner rivets */}

            {[
              "top-2 left-2",
              "top-2 right-2",
              "bottom-2 left-2",
              "bottom-2 right-2",
            ].map((pos) => (
              <span
                key={pos}
                className={`
                  absolute
                  ${pos}
                  z-10
                  h-2.5
                  w-2.5
                  rounded-full
                  bg-white/70
                  shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]
                `}
              />
            ))}

            {/* WHOLE IMAGE — no crop / no zoom */}

            <img
              src="/images/Wholesale/wholesale.png"
              alt=""
              aria-hidden="true"
              className="
                absolute
                inset-0
                h-full
                w-full
                object-contain
              "
            />
          </div>

          {/* =================================================
              STATS
          ================================================= */}

          <div
            className="
              absolute
              -bottom-1
              left-1/2
              flex
              w-[85%]
              -translate-x-1/2
              items-center
              justify-around
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2
              shadow-[0_10px_22px_rgba(15,23,42,0.16)]
              lg:w-[78%]
            "
          >
            <div className="text-center">
              <div
                className="
                  font-sora
                  text-[15px]
                  font-extrabold
                  text-navy
                "
              >
                10K+
              </div>

              <div
                className="
                  text-[7px]
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Products
              </div>
            </div>

            <div
              className="
                h-6
                w-px
                bg-slate-200
              "
            />

            <div className="text-center">
              <div
                className="
                  font-sora
                  text-[15px]
                  font-extrabold
                  text-green
                "
              >
                ₹2K
              </div>

              <div
                className="
                  text-[7px]
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Min. order
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          BOTTOM INFORMATION BAR
      ===================================================== */}

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="
            bg-white
            border-t
            border-slate-200
            px-4
            py-3.5
            text-[11px]
            text-slate-500
          "
        >
          Loading…
        </div>
      ) : error && bar.length === 0 ? (
        <div
          role="alert"
          className="
            bg-white
            border-t
            border-slate-200
            px-4
            py-3.5
            text-[11px]
            text-slate-500
          "
        >
          {error}
        </div>
      ) : bar.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="
            bg-white
            border-t
            border-slate-200
            px-4
            py-3.5
            text-[11px]
            text-slate-500
          "
        >
          Details are currently unavailable.
        </div>
      ) : (
        <div
          className="
            relative
            grid
            grid-cols-2
            border-t
            border-slate-200
            bg-gradient-to-b
            from-white
            to-slate-50/60
            lg:grid-cols-4
          "
        >
          {bar
            .slice(0, 4)
            .map((item, index) => {
              const Icon =
                BAR_ICONS[index];

              if (!Icon) {
                return null;
              }

              return (
                <div
                  key={`${item.title}-${index}`}
                  className="
                    group
                    flex
                    items-center
                    gap-2.5
                    border-b
                    border-slate-100
                    px-4
                    py-3
                    transition-colors
                    duration-200
                    hover:bg-green/[0.04]
                    lg:border-b-0
                    lg:border-r
                    lg:px-5
                    lg:last:border-r-0
                  "
                >
                  <span
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-green/10
                      text-green
                      shadow-[0_2px_6px_rgba(22,163,74,0.12)]
                      transition-transform
                      duration-200
                      group-hover:scale-105
                    "
                  >
                    <Icon
                      size={14}
                      aria-hidden="true"
                    />
                  </span>

                  <div className="min-w-0">
                    <div
                      className="
                        truncate
                        text-[9.5px]
                        font-extrabold
                        text-navy
                      "
                    >
                      {item.title}
                    </div>

                    <div
                      className="
                        mt-0.5
                        truncate
                        text-[8.5px]
                        text-slate-500
                      "
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
