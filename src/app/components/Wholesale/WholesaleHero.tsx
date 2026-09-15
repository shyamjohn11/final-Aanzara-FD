"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ShoppingCart,
  FileText,
  IndianRupee,
  Package,
  Truck,
  Headset,
  Percent,
  ShieldCheck,
  Receipt,
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

function isValidText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function mapPerkRow(row: ContentItem): WholesalePerk {
  const title =
    typeof row.title === "string"
      ? row.title.trim()
      : "";
  const extraDesc = (row.extra as any)?.desc;
  const desc =
    typeof row.description === "string" &&
    row.description.trim().length > 0
      ? row.description.trim()
      : typeof extraDesc === "string"
        ? extraDesc.trim()
        : "";
  return { title, desc };
}

function mapBarRow(row: ContentItem): WholesaleHeroBar {
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
  return { title, value };
}

function unwrapRows(data: unknown): ContentItem[] {
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
              .filter((p) => isValidText(p.title)),
          );
          setBar(
            barRows
              .map(mapBarRow)
              .filter((b) => isValidText(b.title)),
          );
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load wholesale highlights.");
          setPerks([]);
          setBar([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="relative rounded-card overflow-hidden"
      aria-labelledby="wholesale-hero-title"
    >
      {/* =====================================================
          HERO MAIN CONTENT
      ===================================================== */}

      <div className="relative flex flex-col lg:flex-row items-stretch">
        {/* ===================================================
            LEFT CONTENT
        =================================================== */}

        <div className="flex-1 bg-navy p-6 sm:p-9 flex flex-col justify-center">
          {/* TITLE */}

          <h1
            id="wholesale-hero-title"
            className="
              font-sora
              font-extrabold
              !text-white
              text-[26px]
              sm:text-[32px]
              leading-[1.15]
            "
          >
            Wholesale Shopping Made Simple
          </h1>

          {/* DESCRIPTION */}

          <p
            className="
              !text-white
              text-[13px]
              mt-3
              leading-relaxed
              max-w-[380px]
            "
          >
            Buy FMCG products in bulk at competitive wholesale prices.
            Direct sourcing, bulk discounts and reliable delivery for
            businesses.
          </p>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="flex flex-wrap items-center gap-2.5 mt-6">
            {/* SHOP WHOLESALE */}

            <Link
              href="#wholesale-deals"
              className="
                flex
                items-center
                gap-2
                bg-green
                hover:bg-green-deep
                transition-colors
                !text-white
                text-[12.5px]
                font-bold
                px-5
                py-3
                rounded-lg
              "
            >
              <ShoppingCart
                size={14}
                aria-hidden="true"
              />

              Shop Wholesale
            </Link>

            {/* BULK QUOTE */}

            <button
              type="button"
              className="
                flex
                items-center
                gap-2
                border
                border-white/30
                hover:bg-white/10
                transition-colors
                !text-white
                text-[12.5px]
                font-bold
                px-5
                py-3
                rounded-lg
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
              className="!text-white/60 text-[11px] mt-7"
            >
              Loading highlights…
            </div>
          ) : error && perks.length === 0 ? (
            <div
              role="alert"
              className="!text-white/60 text-[11px] mt-7"
            >
              {error}
            </div>
          ) : perks.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="!text-white/60 text-[11px] mt-7"
            >
              Highlights are currently unavailable.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-7">
              {perks.map((perk, index) => {
                const Icon = PERK_ICONS[index];

                if (!Icon) {
                  return null;
                }

                return (
                  <div key={`${perk.title}-${index}`}>
                    {/* ICON */}

                    <span
                      className="
                        w-8
                        h-8
                        rounded-full
                        bg-white/10
                        text-green
                        flex
                        items-center
                        justify-center
                        mb-2
                      "
                    >
                      <Icon
                        size={20}
                        aria-hidden="true"
                      />
                    </span>

                    {/* TITLE */}

                    <div
                      className="
                        !text-white
                        text-[11px]
                        font-bold
                        leading-tight
                      "
                    >
                      {perk.title}
                    </div>

                    {/* DESCRIPTION */}

                    <div
                      className="
                        !text-white/80
                        text-[10px]
                        leading-tight
                        mt-0.5
                      "
                    >
                      {perk.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===================================================
            HERO IMAGE
        =================================================== */}

        <div
          className="
            w-full
            min-h-[240px]
            lg:min-h-[396px]
            lg:w-[48%]
            bg-cover
            bg-center
            bg-no-repeat
          "
          role="img"
          aria-label="Wholesale FMCG products and business supplies"
          style={{
            backgroundImage:
              "url('/images/Wholesale/wholesale.png')",
          }}
        />
      </div>

      {/* =====================================================
          HERO INFORMATION BAR
      ===================================================== */}

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="bg-navy-deep border-t border-black/10 px-4 py-3.5 text-[11px] text-white/60"
        >
          Loading…
        </div>
      ) : error && bar.length === 0 ? (
        <div
          role="alert"
          className="bg-navy-deep border-t border-black/10 px-4 py-3.5 text-[11px] text-white/60"
        >
          {error}
        </div>
      ) : bar.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="bg-navy-deep border-t border-black/10 px-4 py-3.5 text-[11px] text-white/60"
        >
          Details are currently unavailable.
        </div>
      ) : (
        <div
          className="
            bg-navy-deep
            border-t
            border-black/10
            grid
            grid-cols-2
            lg:grid-cols-4
            divide-x
            divide-white/10
          "
        >
          {bar.map((item, index) => {
            const Icon = BAR_ICONS[index];

            if (!Icon) {
              return null;
            }

            return (
              <div
                key={`${item.title}-${index}`}
                className="
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3.5
                  min-w-0
                "
              >
                {/* ICON */}

                <span
                  className="
                    w-8
                    h-8
                    rounded-lg
                    bg-black/20
                    text-red
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  <Icon
                    size={14}
                    aria-hidden="true"
                  />
                </span>

                {/* TEXT */}

                <div className="min-w-0">
                  <div
                    className="
                      !text-black
                      text-[11px]
                      font-bold
                      leading-tight
                    "
                  >
                    {item.title}
                  </div>

                  <div
                    className="
                      !text-black
                      text-[10px]
                      leading-tight
                      mt-0.5
                      truncate
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
